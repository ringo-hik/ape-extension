import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PluginRegistryService } from '../../core/plugin-system/PluginRegistryService';
import { ConfigService } from '../../core/config/ConfigService';
import { PluginType } from '../../types/PluginTypes';
import { DynamicPluginService } from './DynamicPluginService';
import { HttpClientService } from '../../core/http/HttpClientService';

/**
 * 외부 플러그인 로더
 * 설정에서 플러그인 로드 및 관리를 담당하는 클래스
 */
export class ExternalPluginLoader {
  /**
   * 플러그인 레지스트리
   */
  private _pluginRegistry: PluginRegistryService;
  
  /**
   * 설정 서비스
   */
  private _configService: ConfigService;
  
  /**
   * HTTP 클라이언트
   */
  private _httpClient: HttpClientService;
  
  /**
   * 플러그인 디렉토리 경로
   */
  private _pluginsDir?: string;
  
  /**
   * ExternalPluginLoader 생성자
   * @param pluginRegistry 플러그인 레지스트리
   * @param configService 설정 서비스
   * @param httpClient HTTP 클라이언트
   */
  constructor(
    pluginRegistry: PluginRegistryService,
    configService: ConfigService,
    httpClient: HttpClientService
  ) {
    this._pluginRegistry = pluginRegistry;
    this._configService = configService;
    this._httpClient = httpClient;
    
    // 플러그인 디렉토리 경로 설정
    this._setupPluginsDirectory();
  }
  
  /**
   * 플러그인 디렉토리 설정
   */
  private _setupPluginsDirectory(): void {
    try {
      // 워크스페이스 루트 디렉토리 가져오기
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        
        // 플러그인 디렉토리 경로 설정
        this._pluginsDir = path.join(workspaceRoot, '.ape', 'plugins');
        
        // 디렉토리가 존재하는지 확인
        if (!fs.existsSync(this._pluginsDir)) {
          // 디렉토리 생성
          fs.mkdirSync(this._pluginsDir, { recursive: true });
        }
      }
    } catch (error) {
      console.warn('플러그인 디렉토리 설정 중 오류 발생:', error);
    }
  }
  
  /**
   * 외부 플러그인 로드
   * @returns 로드된 플러그인 수
   */
  public async loadExternalPlugins(): Promise<number> {
    try {
      // 기존 플러그인 정리
      const existingPlugins = this._pluginRegistry.getExternalPlugins();
      for (const plugin of existingPlugins) {
        this._pluginRegistry.unregisterPlugin(plugin.id, PluginType.EXTERNAL);
      }
      
      // 설정 로드
      const pluginsConfig = this._configService.getPluginConfig();
      if (!pluginsConfig) {
        console.log('외부 플러그인 설정을 찾을 수 없습니다');
        return 0;
      }
      
      // 타입 단언을 통해 TypeScript 오류 방지
      const typedPluginsConfig = pluginsConfig as Record<string, any>;

      let loadedCount = 0;
      
      // 전역 플러그인 설정 (api_key, base_url 등)
      const globalConfig = typedPluginsConfig.global || {};

      // 설정에서 플러그인 로드
      await this._loadPluginsFromConfig(typedPluginsConfig, globalConfig);
      
      // 플러그인 디렉토리에서 플러그인 로드
      if (this._pluginsDir && fs.existsSync(this._pluginsDir)) {
        await this._loadPluginsFromDirectory();
      }
      
      // 로드된 플러그인 수 계산
      loadedCount = this._pluginRegistry.getExternalPlugins().length;
      
      console.log(`외부 플러그인 로드 완료: ${loadedCount}개 플러그인`);
      return loadedCount;
    } catch (error) {
      console.error('외부 플러그인 로드 중 오류 발생:', error);
      return 0;
    }
  }
  
  /**
   * 설정에서 플러그인 로드
   * @param config 플러그인 설정
   * @param globalConfig 전역 설정
   */
  private async _loadPluginsFromConfig(config: Record<string, any>, globalConfig: Record<string, any>): Promise<void> {
    try {
      // 외부 플러그인 순회
      for (const [pluginId, pluginConfig] of Object.entries(config.plugins || {})) {
        try {
          await this._loadSinglePlugin(pluginId, pluginConfig as Record<string, any>, globalConfig);
        } catch (error) {
          console.error(`설정에서 플러그인 로드 오류 (${pluginId}):`, error);
        }
      }
    } catch (error) {
      console.error('설정에서 플러그인 로드 중 오류 발생:', error);
    }
  }
  
  /**
   * 디렉토리에서 플러그인 로드
   */
  private async _loadPluginsFromDirectory(): Promise<void> {
    try {
      if (!this._pluginsDir) return;
      
      // 플러그인 디렉토리 내 항목 리스트
      const items = fs.readdirSync(this._pluginsDir);
      
      for (const item of items) {
        try {
          const itemPath = path.join(this._pluginsDir, item);
          const stat = fs.statSync(itemPath);
          
          // 디렉토리인 경우 플러그인으로 간주
          if (stat.isDirectory()) {
            // 플러그인 설정 파일 경로
            const configPath = path.join(itemPath, 'plugin.json');
            
            // 설정 파일 존재 여부 확인
            if (fs.existsSync(configPath)) {
              try {
                // 설정 파일 읽기
                const configContent = fs.readFileSync(configPath, 'utf8');
                const pluginConfig = JSON.parse(configContent);
                
                // 플러그인 ID가 없으면 디렉토리 이름 사용
                const pluginId = pluginConfig.id || item;
                
                // 플러그인 로드
                await this._loadSinglePlugin(pluginId, pluginConfig, {});
              } catch (error) {
                console.error(`플러그인 설정 파일 로드 오류 (${item}):`, error);
              }
            }
          }
        } catch (error) {
          console.error(`디렉토리에서 플러그인 로드 오류 (${item}):`, error);
        }
      }
    } catch (error) {
      console.error('디렉토리에서 플러그인 로드 중 오류 발생:', error);
    }
  }
  
  /**
   * 단일 플러그인 로드
   * @param pluginId 플러그인 ID
   * @param pluginConfig 플러그인 설정
   * @param globalConfig 전역 설정
   * @returns 성공 여부
   */
  private async _loadSinglePlugin(pluginId: string, pluginConfig: Record<string, any>, globalConfig: Record<string, any>): Promise<boolean> {
    try {
      // 비활성화된 플러그인 건너뛰기
      if (pluginConfig.enabled === false) {
        console.log(`플러그인 비활성화됨: ${pluginId}`);
        return false;
      }
      
      // 플러그인과 전역 설정을 병합 (플러그인 설정이 우선)
      const mergedConfig = { ...globalConfig, ...pluginConfig };
      
      // 명령어 처리: 각 명령어에 전역 설정 적용 (필요한 경우)
      const commands = (mergedConfig.commands || []).map((cmd: any) => {
        // API 엔드포인트에 base_url 적용 (명시적으로 설정되지 않은 경우)
        if (cmd.api && cmd.api.endpoint && !cmd.api.endpoint.startsWith('http')) {
          cmd.api.endpoint = `${mergedConfig.base_url || ''}${cmd.api.endpoint}`;
        }
        
        // 전역 API 키를 헤더에 추가 (헤더에 명시적으로 설정되지 않은 경우)
        if (cmd.api && mergedConfig.api_key && cmd.api.headers) {
          if (!cmd.api.headers['X-API-Key'] && !cmd.api.headers['x-api-key']) {
            cmd.api.headers['X-API-Key'] = mergedConfig.api_key;
          }
        }
        
        return cmd;
      });
      
      // 동적 플러그인 생성
      const dynamicPlugin = new DynamicPluginService(
        pluginId,
        mergedConfig.name || pluginId,
        mergedConfig.description || '',
        commands,
        this._httpClient
      );
      
      // 레지스트리에 플러그인 등록
      const registered = this._pluginRegistry.registerPlugin(
        dynamicPlugin,
        PluginType.EXTERNAL
      );
      
      if (registered) {
        console.log(`외부 플러그인 로드됨: ${pluginId} (명령어 ${commands.length}개)`);
        
        // 플러그인 초기화
        await dynamicPlugin.initialize();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`플러그인 로드 오류 (${pluginId}):`, error);
      return false;
    }
  }
  
  /**
   * 플러그인 유효성 검사
   * @param pluginConfig 플러그인 설정
   * @returns 유효성 여부 및 오류 메시지
   */
  private _validatePlugin(pluginConfig: Record<string, any>): { valid: boolean, error?: string } {
    // 필수 필드 확인
    if (!pluginConfig.id) {
      return { valid: false, error: '플러그인 ID가 필요합니다' };
    }
    
    // 명령어 존재 여부 확인
    if (!pluginConfig.commands || !Array.isArray(pluginConfig.commands) || pluginConfig.commands.length === 0) {
      return { valid: false, error: '플러그인에 명령어가 없습니다' };
    }
    
    // 최소 하나의 유효한 명령어 확인
    const validCommands = pluginConfig.commands.filter((cmd: any) => 
      cmd && cmd.id && ((cmd.api && cmd.api.endpoint) || cmd.handler)
    );
    
    if (validCommands.length === 0) {
      return { valid: false, error: '유효한 명령어가 없습니다' };
    }
    
    return { valid: true };
  }

  /**
   * 외부 플러그인 다시 로드
   * @returns 로드된 플러그인 수
   */
  public async reloadExternalPlugins(): Promise<number> {
    try {
      console.log('외부 플러그인 다시 로드 중...');
      
      // 설정 서비스 리로드
      await this._configService.reload();
      
      // 외부 플러그인 로드
      return this.loadExternalPlugins();
    } catch (error) {
      console.error('외부 플러그인 다시 로드 중 오류 발생:', error);
      return 0;
    }
  }
  
  /**
   * 단일 플러그인 다시 로드
   * @param pluginId 플러그인 ID
   * @returns 성공 여부
   */
  public async reloadSinglePlugin(pluginId: string): Promise<boolean> {
    try {
      console.log(`플러그인 다시 로드 중: ${pluginId}`);
      
      // 기존 플러그인 제거
      const existingPlugin = this._pluginRegistry.getPlugin(pluginId);
      if (existingPlugin) {
        this._pluginRegistry.unregisterPlugin(pluginId, PluginType.EXTERNAL);
      }
      
      // 설정 로드
      const pluginsConfig = this._configService.getPluginConfig();
      if (!pluginsConfig) {
        console.log('외부 플러그인 설정을 찾을 수 없습니다');
        return false;
      }
      
      // 플러그인 설정 가져오기
      const typedPluginsConfig = pluginsConfig as Record<string, any>;
      const pluginConfig = typedPluginsConfig.plugins?.[pluginId];
      
      if (!pluginConfig) {
        console.log(`플러그인 설정 없음: ${pluginId}`);
        return false;
      }
      
      // 전역 설정 가져오기
      const globalConfig = typedPluginsConfig.global || {};
      
      // 플러그인 로드
      const result = await this._loadSinglePlugin(pluginId, pluginConfig, globalConfig);
      
      if (result) {
        console.log(`플러그인 다시 로드 완료: ${pluginId}`);
      }
      
      return result;
    } catch (error) {
      console.error(`플러그인 다시 로드 중 오류 발생 (${pluginId}):`, error);
      return false;
    }
  }
  
  /**
   * 플러그인 설치
   * @param pluginPath 플러그인 패키지 경로
   * @returns 성공 여부
   */
  public async installPlugin(pluginPath: string): Promise<boolean> {
    try {
      // 플러그인 디렉토리가 없으면 설정
      if (!this._pluginsDir) {
        this._setupPluginsDirectory();
        
        if (!this._pluginsDir) {
          throw new Error('플러그인 디렉토리를 설정할 수 없습니다');
        }
      }
      
      // 플러그인 패키지 경로 확인
      if (!fs.existsSync(pluginPath)) {
        throw new Error(`플러그인 패키지를 찾을 수 없습니다: ${pluginPath}`);
      }
      
      // 플러그인 패키지 설치 로직 구현 필요
      
      // 플러그인 리로드
      await this.reloadExternalPlugins();
      
      return true;
    } catch (error) {
      console.error('플러그인 설치 중 오류 발생:', error);
      return false;
    }
  }
  
  /**
   * 플러그인 삭제
   * @param pluginId 플러그인 ID
   * @returns 성공 여부
   */
  public async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      // 플러그인 디렉토리 확인
      if (!this._pluginsDir) {
        throw new Error('플러그인 디렉토리가 설정되지 않았습니다');
      }
      
      // 플러그인 디렉토리 경로
      const pluginDir = path.join(this._pluginsDir, pluginId);
      
      // 플러그인 디렉토리 존재 여부 확인
      if (fs.existsSync(pluginDir)) {
        // 디렉토리 삭제
        fs.rmdirSync(pluginDir, { recursive: true });
      }
      
      // 플러그인 제거
      const existingPlugin = this._pluginRegistry.getPlugin(pluginId);
      if (existingPlugin) {
        this._pluginRegistry.unregisterPlugin(pluginId, PluginType.EXTERNAL);
      }
      
      // 설정에서 플러그인 제거
      const pluginsConfig = this._configService.getPluginConfig();
      if (pluginsConfig && typeof pluginsConfig === 'object' && 'plugins' in pluginsConfig) {
        const typedConfig = pluginsConfig as Record<string, any>;
        const plugins = typedConfig.plugins || {};
        
        // 플러그인 설정 제거
        if (pluginId in plugins) {
          delete plugins[pluginId];
          
          // 설정 저장
          await this._configService.updatePluginConfig(typedConfig);
        }
      }
      
      return true;
    } catch (error) {
      console.error('플러그인 삭제 중 오류 발생:', error);
      return false;
    }
  }
}