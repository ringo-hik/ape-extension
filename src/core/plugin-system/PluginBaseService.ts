/**
 * 기본 플러그인 클래스
 * 
 * 모든 내부 및 외부 플러그인의 기본 클래스 및 기능 정의
 * 이 클래스를 상속하여 구체적인 플러그인 구현
 */

import { IPlugin, PluginCommand } from '../../types/PluginTypes';
import { IConfigLoader } from '../../types/ConfigTypes';
import { CommandType, CommandPrefix } from '../../types/CommandTypes';

/**
 * 기본 플러그인 클래스
 * 모든 플러그인이 상속하는 추상 클래스
 */
export abstract class PluginBaseService implements IPlugin {
  /**
   * 플러그인 ID
   */
  abstract id: string;
  
  /**
   * 플러그인 이름
   */
  abstract name: string;
  
  /**
   * 플러그인 설명
   */
  protected description: string = '';
  
  /**
   * 플러그인 설정
   */
  protected config: any;
  
  /**
   * 플러그인 명령어 목록
   */
  protected commands: PluginCommand[] = [];
  
  /**
   * 활성화 여부
   */
  protected enabled: boolean = true;
  
  /**
   * PluginBaseService 생성자
   * @param configLoader 설정 로더 (선택적)
   */
  constructor(protected configLoader?: IConfigLoader) {
    if (configLoader) {
      
      this.config = this.loadConfig();
      
      
      this.enabled = this.config?.enabled !== false;
    }
  }
  
  /**
   * 플러그인 설정 로드
   * @returns 플러그인 설정
   */
  protected loadConfig(): any {
    
    return {};
  }
  
  /**
   * 플러그인 초기화
   * 설정 로드 및 API 클라이언트 초기화
   * @returns 초기화 성공 여부
   */
  async initialize(): Promise<void> {
    
  }
  
  /**
   * 플러그인 초기화 상태 확인
   * 각 플러그인에서 필요에 따라 재정의
   * @returns 초기화 완료 여부
   */
  isInitialized(): boolean {
    return true; 
  }
  
  /**
   * 플러그인 명령어 목록 가져오기
   * @returns 명령어 목록
   */
  getCommands(): PluginCommand[] {
    return this.commands;
  }
  
  /**
   * 명령어 실행
   * @param command 명령어 이름
   * @param args 명령어 인자
   * @returns 실행 결과
   */
  async executeCommand(command: string, args: any[]): Promise<any> {
    
    const cmd = this.commands.find(c => (c.id === command) || (c.name === command));
    
    if (!cmd) {
      throw new Error(`명령어를 찾을 수 없음: ${command}`);
    }
    
    
    try {
      if (cmd.execute) {
        return await cmd.execute(args);
      } else if (cmd.handler) {
        return await cmd.handler(...args);
      } else {
        throw new Error(`명령어 핸들러가 정의되지 않음: ${command}`);
      }
    } catch (error) {
      console.error(`명령어 실행 중 오류 발생 (${this.id}:${command}):`, error);
      throw error;
    }
  }
  
  /**
   * 플러그인 활성화 여부 확인
   * @returns 활성화 여부
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 플러그인의 활성화 상태를 설정합니다.
   * @param enabled 활성화 여부
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 새 명령어를 등록합니다.
   * @param command 명령어 객체
   * @returns 성공 여부
   */
  protected registerCommand(command: PluginCommand): boolean {
    if (!command.id) {
      console.error('유효하지 않은 명령어:', command);
      return false;
    }

    
    const existingIndex = this.commands.findIndex(c => c.id === command.id);
    if (existingIndex >= 0) {
      
      this.commands[existingIndex] = command;
    } else {
      
      this.commands.push(command);
    }

    return true;
  }

  /**
   * 여러 명령어를 한 번에 등록합니다.
   * @param commands 명령어 배열
   * @returns 성공 여부
   */
  protected registerCommands(commands: PluginCommand[]): boolean {
    let success = true;
    
    for (const command of commands) {
      if (!this.registerCommand(command)) {
        success = false;
      }
    }
    
    return success;
  }

  /**
   * @ 명령어를 생성합니다.
   * @param id 명령어 ID
   * @param handler 명령어 핸들러
   * @param description 명령어 설명
   * @returns 명령어 객체
   */
  protected createAtCommand(
    id: string, 
    handler: (...args: any[]) => Promise<any>,
    description?: string
  ): PluginCommand {
    return {
      id,
      name: id, 
      type: CommandType.AT,
      prefix: CommandPrefix.AT,
      description: description || '',
      handler
    };
  }

  /**
   * / 명령어를 생성합니다.
   * @param id 명령어 ID
   * @param handler 명령어 핸들러
   * @param description 명령어 설명
   * @returns 명령어 객체
   */
  protected createSlashCommand(
    id: string, 
    handler: (...args: any[]) => Promise<any>,
    description?: string
  ): PluginCommand {
    return {
      id,
      name: id, 
      type: CommandType.SLASH,
      prefix: CommandPrefix.SLASH,
      description: description || '',
      handler
    };
  }
  
  /**
   * 환경 변수 및 변수 치환
   * @param template 템플릿 문자열
   * @param vars 변수 값 객체
   * @returns 치환된 문자열
   */
  protected resolveTemplate(template: string, vars: Record<string, any>): string {
    if (typeof template !== 'string') {
      return template;
    }
    
    
    let result = template.replace(/\${([^}]+)}/g, (match, varName) => {
      
      if (process.env[varName] !== undefined) {
        return process.env[varName] || '';
      }
      
      
      const varPath = varName.split('.');
      let value: any = vars;
      
      for (const part of varPath) {
        if (value === undefined || value === null) {
          return match; 
        }
        value = value[part];
      }
      
      return value !== undefined ? String(value) : match;
    });
    
    return result;
  }
  
  /**
   * 객체 내의 모든 문자열 변수 치환
   * 재귀적으로 객체 내의 모든 문자열 변수를 치환
   * @param obj 원본 객체
   * @param vars 변수 값
   * @returns 치환된 객체
   */
  protected resolveTemplateObject(obj: any, vars: Record<string, any>): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      return this.resolveTemplate(obj, vars);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveTemplateObject(item, vars));
    }
    
    if (typeof obj === 'object') {
      const result: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.resolveTemplateObject(value, vars);
      }
      
      return result;
    }
    
    return obj;
  }
}