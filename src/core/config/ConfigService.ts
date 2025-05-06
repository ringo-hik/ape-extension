/**
 * 통합 설정 관리 모듈
 * 
 * settings.json 설정 파일을 로드, 검증, 관리하는 통합 클래스
 * 내부 플러그인 및 외부 플러그인을 위한 설정 제공
 */

import * as fs from 'fs';
import * as path from 'path';
import { IConfigLoader, ConfigSection, CoreConfig, AgentConfig, PluginConfig } from '../../types/ConfigTypes';


type VSCodeExtensionContext = {
  extensionPath: string;
  globalStorageUri?: { fsPath: string };
};

/**
 * 통합 설정 서비스 클래스
 * settings.json 파일을 로드하고 검증하며 설정 값을 관리
 * VS Code 확장 및 CLI 환경 모두 지원
 */
export class ConfigService implements IConfigLoader {
  
  /**
   * 설정 객체
   */
  protected config: any = {};
  
  /**
   * 설정 파일 경로
   */
  protected configPath: string;
  
  /**
   * JSON 스키마 맵
   */
  private schemas: Map<string, any> = new Map();
  
  /**
   * 싱글톤 인스턴스 (레거시 호환성 유지)
   */
  private static instance: ConfigService;
  
  /**
   * 싱글톤 인스턴스 가져오기
   * @deprecated 싱글톤 패턴 대신 의존성 주입 사용 권장
   * @returns ConfigService 인스턴스
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
  
  /**
   * 팩토리 메서드: 인스턴스 생성
   * @param context VSCode 확장 컨텍스트 (CLI 환경에서는 null)
   * @returns ConfigService 인스턴스
   */
  public static createInstance(context?: VSCodeExtensionContext | null): ConfigService {
    return new ConfigService(context);
  }

  /**
   * ConfigService 생성자
   * @param context VSCode 확장 컨텍스트 (CLI 환경에서는 null)
   */
  constructor(private context?: VSCodeExtensionContext | null) {
    
    if (context) {
      
      try {
        
        if (typeof require('vscode') !== 'undefined' && require('vscode').workspace) {
          const vscode = require('vscode');
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (workspaceFolders && workspaceFolders.length > 0) {
            this.configPath = path.join(workspaceFolders[0].uri.fsPath, 'settings.json');
            return;
          }
        }
      } catch (e) {
        
      }
      
      
      if (this.context && this.context.extensionPath) {
        this.configPath = path.join(this.context.extensionPath, 'settings.json');
      } else {
        
        this.configPath = path.join(process.cwd(), 'settings.json');
      }
    } else {
      
      this.configPath = path.join(process.cwd(), 'settings.json');
    }

    
    this.loadDefaultSchemas();
  }

  
  
  /**
   * 설정 로드
   * settings.json 파일을 로드하고 유효성 검증
   * @returns 로드 성공 여부
   */
  async load(): Promise<boolean> {
    try {
      
      if (!fs.existsSync(this.configPath)) {
        console.log('설정 파일이 없습니다. 템플릿 파일로부터 기본 설정을 생성합니다.');
        
        
        let templatePath = '';
        if (this.context) {
          
          templatePath = path.join(this.context.extensionPath, 'settings.json.template');
        } else {
          
          const possiblePaths = [
            path.join(process.cwd(), 'settings.json.template'),
            path.join(__dirname, '..', '..', '..', 'settings.json.template') 
          ];
          
          for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
              templatePath = p;
              break;
            }
          }
        }
        
        
        if (!templatePath || !fs.existsSync(templatePath)) {
          console.error('템플릿 설정 파일을 찾을 수 없음');
          return false;
        }
        
        
        fs.copyFileSync(templatePath, this.configPath);
        console.log(`기본 설정 파일이 생성되었습니다: ${this.configPath}`);
      }
      
      
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configContent);
      
      
      const localConfigPath = path.join(path.dirname(this.configPath), 'settings.local.json');
      if (fs.existsSync(localConfigPath)) {
        try {
          const localConfigContent = fs.readFileSync(localConfigPath, 'utf8');
          const localConfig = JSON.parse(localConfigContent);
          
          
          this.mergeDeep(this.config, localConfig);
          console.log('로컬 설정이 로드되었습니다:', localConfigPath);
        } catch (localError) {
          console.warn('로컬 설정 로드 중 오류 발생:', localError);
          
        }
      }
      
      
      const isValid = await this.validate(this.config);
      if (!isValid) {
        console.error('설정 파일 유효성 검증 실패');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('설정 로드 중 오류 발생:', error);
      return false;
    }
  }
  
  /**
   * 객체 깊은 병합 (두 번째 객체의 속성을 첫 번째 객체에 병합)
   * @param target 대상 객체
   * @param source 소스 객체
   * @returns 병합된 객체
   */
  private mergeDeep(target: any, source: any): any {
    if (!source) return target;
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] instanceof Object && !Array.isArray(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    
    return target;
  }
  
  /**
   * 특정 섹션의 설정 가져오기
   * @param section 설정 섹션 경로
   * @returns 설정 섹션 객체
   */
  getSection<T extends ConfigSection>(section: string): T {
    return this.get<T>(section, {} as T);
  }
  
  /**
   * 코어 설정 가져오기
   * @returns 코어 설정 객체
   */
  getCoreConfig(): CoreConfig {
    return this.getSection<CoreConfig>('core');
  }
  
  /**
   * 에이전트 설정 가져오기
   * @param agentId 에이전트 ID (생략 시 전체 에이전트 설정)
   * @returns 에이전트 설정 객체
   */
  getAgentConfig(agentId?: string): AgentConfig | Record<string, AgentConfig> {
    if (agentId) {
      return this.getSection<AgentConfig>(`agents.${agentId}`);
    }
    return this.getSection<Record<string, AgentConfig>>('agents');
  }
  
  /**
   * 플러그인 설정 가져오기
   * @param pluginId 플러그인 ID (생략 시 전체 플러그인 설정)
   * @returns 플러그인 설정 객체
   */
  getPluginConfig(pluginId?: string): PluginConfig | Record<string, PluginConfig> {
    if (pluginId) {
      return this.getSection<PluginConfig>(`plugins.${pluginId}`);
    }
    return this.getSection<Record<string, PluginConfig>>('plugins');
  }
  
  /**
   * 플러그인 설정 가져오기 (간단한 버전)
   * @param pluginId 플러그인 ID
   * @returns 플러그인 설정 객체 또는 null
   */
  getPlugin(pluginId: string): Record<string, any> | null {
    try {
      const pluginConfig = this.getPluginConfig(pluginId);
      return pluginConfig as Record<string, any>;
    } catch (error) {
      console.error(`플러그인 설정 가져오기 실패 (${pluginId}):`, error);
      return null;
    }
  }
  
  /**
   * 사용자 설정 가져오기
   * @returns 사용자 설정 객체
   */
  getUserConfig(): Record<string, any> {
    return this.getSection<Record<string, any>>('user');
  }
  
  /**
   * 사용자 설정 업데이트
   * @param config 업데이트할 설정 객체
   * @returns 업데이트 성공 여부
   */
  updateUserConfig(config: Record<string, any>): boolean {
    try {
      
      const userConfig = this.getUserConfig();
      
      
      const updatedConfig = { ...userConfig, ...config };
      
      
      this.set('user', updatedConfig);
      return this.save();
    } catch (error) {
      console.error('사용자 설정 업데이트 중 오류 발생:', error);
      return false;
    }
  }
  
  /**
   * 애플리케이션 설정 가져오기
   * @returns 애플리케이션 설정 객체
   */
  getAppConfig(): Record<string, any> {
    return this.getSection<Record<string, any>>('app');
  }
  
  /**
   * 설정 업데이트
   * @param section 설정 섹션
   * @param config 업데이트할 설정 객체
   * @returns 업데이트 성공 여부
   */
  updateConfig(section: string, config: Record<string, any>): boolean {
    try {
      
      const currentConfig = this.getSection(section);
      
      
      const updatedConfig = { ...currentConfig, ...config };
      
      
      this.set(section, updatedConfig);
      return this.save();
    } catch (error) {
      console.error(`설정 업데이트 중 오류 발생 (${section}):`, error);
      return false;
    }
  }
  
  /**
   * 특정 설정 값 가져오기
   * @param key 설정 키 경로 (점으로 구분, 예: 'core.logLevel')
   * @param defaultValue 기본값
   * @returns 설정 값 또는 기본값
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      const parts = key.split('.');
      let current: any = this.config;
      
      for (const part of parts) {
        if (current === undefined || current === null || current[part] === undefined) {
          return defaultValue;
        }
        current = current[part];
      }
      
      return current as T;
    } catch (error) {
      console.error(`설정 값 가져오기 실패 (${key}):`, error);
      return defaultValue;
    }
  }
  
  /**
   * 환경 변수 확인 및 대체
   * @param value 환경 변수를 포함할 수 있는 문자열
   * @returns 환경 변수가 대체된 문자열
   */
  resolveEnvVars(value: string): string {
    if (typeof value !== 'string') {
      return value;
    }
    
    
    return value.replace(/\${([^}]+)}/g, (match, varName) => {
      const envValue = process.env[varName];
      return envValue !== undefined ? envValue : match;
    });
  }
  
  /**
   * 설정 값 설정 (저장하지 않음)
   * @param key 설정 키 경로
   * @param value 설정 값
   */
  set(key: string, value: any): void {
    const parts = key.split('.');
    const lastPart = parts.pop();
    
    if (!lastPart) {
      return;
    }
    
    let current: any = this.config;
    
    for (const part of parts) {
      if (current[part] === undefined) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[lastPart] = value;
  }
  
  /**
   * 설정 저장
   * @returns 저장 성공 여부
   */
  save(): boolean {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
      console.error('설정 저장 중 오류 발생:', error);
      return false;
    }
  }

  

  /**
   * 기본 스키마 로드
   */
  private loadDefaultSchemas(): void {
    
    this.schemas.set('core', {
      type: 'object',
      properties: {
        logLevel: {
          type: 'string',
          enum: ['debug', 'info', 'warn', 'error']
        },
        sslBypass: {
          type: 'boolean'
        },
        storagePath: {
          type: 'string'
        },
        offlineMode: {
          type: 'boolean'
        },
        embedDevMode: {
          type: 'boolean',
          description: '심층 분석 모드 활성화 여부'
        }
      }
    });
    
    
    this.schemas.set('plugins', {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean'
          },
          name: {
            type: 'string'
          },
          description: {
            type: 'string'
          },
          commands: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                description: {
                  type: 'string'
                },
                syntax: {
                  type: 'string'
                },
                examples: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },
                api: {
                  type: 'object',
                  properties: {
                    endpoint: {
                      type: 'string'
                    },
                    method: {
                      type: 'string',
                      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
                    },
                    headers: {
                      type: 'object',
                      additionalProperties: {
                        type: 'string'
                      }
                    },
                    body: {
                      type: 'object'
                    }
                  },
                  required: ['endpoint', 'method']
                }
              },
              required: ['name', 'description', 'syntax']
            }
          }
        },
        required: ['enabled', 'name']
      }
    });
  }
  
  /**
   * 설정 유효성 검증
   * @param config 검증할 설정 객체
   * @returns 유효성 여부
   */
  public async validate(config: any): Promise<boolean> {
    try {
      
      if (!config || typeof config !== 'object') {
        console.error('유효하지 않은 설정 형식: 객체가 아님');
        return false;
      }
      
      
      if (!config.core) {
        console.warn('코어 설정 섹션이 없음');
        
      }
      
      
      if (config.core && !this.validateSection(config.core, this.schemas.get('core'))) {
        console.error('코어 설정 유효성 검증 실패');
        return false;
      }
      
      
      if (config.plugins && !this.validateSection(config.plugins, this.schemas.get('plugins'))) {
        console.error('플러그인 설정 유효성 검증 실패');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('설정 검증 중 오류 발생:', error);
      return false;
    }
  }
  
  /**
   * 설정 유효성 검증 
   * @returns 유효성 여부
   */
  public async validateConfig(): Promise<boolean> {
    try {
      
      if (Object.keys(this.config).length === 0) {
        console.warn('설정이 로드되지 않았습니다. 빈 객체로 검증합니다.');
        return this.validate({});
      }
      
      
      return this.validate(this.config);
    } catch (error) {
      console.error('설정 검증 중 오류 발생:', error);
      return false;
    }
  }
  
  /**
   * 설정 섹션 유효성 검증
   * 간단한 유효성 검사 수행 (실제로는 더 정교한 JSON 스키마 검증 라이브러리 사용 권장)
   * @param section 검증할 설정 섹션
   * @param schema JSON 스키마
   * @returns 유효성 여부
   */
  private validateSection(section: any, schema: any): boolean {
    
    
    
    try {
      
      if (schema.type === 'object' && typeof section !== 'object') {
        return false;
      }
      
      
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries<any>(schema.properties)) {
          if (section[key] !== undefined) {
            if (propSchema.type === 'string' && typeof section[key] !== 'string') {
              return false;
            } else if (propSchema.type === 'boolean' && typeof section[key] !== 'boolean') {
              return false;
            } else if (propSchema.type === 'number' && typeof section[key] !== 'number') {
              return false;
            } else if (propSchema.type === 'array' && !Array.isArray(section[key])) {
              return false;
            } else if (propSchema.type === 'object' && (typeof section[key] !== 'object' || Array.isArray(section[key]))) {
              return false;
            }
            
            
            if (propSchema.enum && !propSchema.enum.includes(section[key])) {
              return false;
            }
          }
        }
      }
      
      
      if (schema.required) {
        for (const requiredProp of schema.required) {
          if (section[requiredProp] === undefined) {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('설정 섹션 검증 중 오류 발생:', error);
      return false;
    }
  }
}