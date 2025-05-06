/**
 * 명령어 실행기 모듈
 * 
 * 파싱된 명령어를 실행하고 결과를 반환하는 기능 제공
 * @ 명령어(외부 시스템)와 / 명령어(내부 기능) 구분하여 처리
 */

import { 
  Command, CommandPrefix, CommandType, CommandDomain, 
  CommandResult, ICommandExecutor, ICommandRegistry, ParsedCommand
} from '../../types/CommandTypes';
import { IPluginRegistry } from '../../types/PluginTypes';
import { CommandParserService } from './CommandParserService';

/**
 * 명령어 실행기 클래스
 * 명령어 실행 및 결과 처리 담당
 */
export class CommandExecutorService implements ICommandExecutor {
  /**
   * 명령어 파서 서비스
   */
  private parser: CommandParserService;
  
  /**
   * 실행 이력 저장소
   */
  private executionHistory: Array<{
    command: Command;
    result: CommandResult;
    timestamp: number;
    id: string;
  }> = [];
  
  /**
   * 실행 중인 명령어 맵
   */
  private pendingCommands: Map<string, { 
    command: Command, 
    cancel: () => void,
    timestamp: number
  }> = new Map();
  
  /**
   * CommandExecutorService 생성자
   * @param commandRegistry 명령어 레지스트리
   * @param pluginRegistry 플러그인 레지스트리
   */
  constructor(
    private commandRegistry: ICommandRegistry,
    private pluginRegistry: IPluginRegistry
  ) {
    this.parser = new CommandParserService();
  }
  
  /**
   * 명령어 실행
   * @param command 실행할 명령어
   * @returns 명령어 실행 결과
   */
  async execute(command: Command): Promise<CommandResult> {
    
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      
      const startTime = Date.now();
      
      
      const cancelController = new AbortController();
      const signal = cancelController.signal;
      
      this.pendingCommands.set(commandId, {
        command,
        cancel: () => cancelController.abort(),
        timestamp: startTime
      });
      
      
      let result: CommandResult;
      
      
      if (signal.aborted) {
        return {
          success: false,
          error: '명령어 실행이 취소되었습니다.',
          displayMode: 'text'
        };
      }
      
      try {
        
        if (command.domain && command.domain !== CommandDomain.NONE) {
          result = await this.executeDomainCommand(command, signal);
        } else {
          
          switch (command.prefix) {
            case CommandPrefix.AT:
              
              result = await this.executePluginCommand(command, signal);
              break;
              
            case CommandPrefix.SLASH:
              
              result = await this.executeInternalCommand(command, signal);
              break;
              
            default:
              return {
                success: false,
                error: `지원하지 않는 명령어 접두사: ${command.prefix}`,
                displayMode: 'text'
              };
          }
        }
      } catch (error) {
        if (signal.aborted) {
          return {
            success: false,
            error: '명령어 실행이 취소되었습니다.',
            displayMode: 'text'
          };
        }
        throw error; 
      }
      
      
      const executionTime = Date.now() - startTime;
      
      
      const normalizedResult = this.normalizeResult(result);
      
      
      this.executionHistory.push({
        command,
        result: normalizedResult,
        timestamp: Date.now(),
        id: commandId
      });
      
      
      this.pendingCommands.delete(commandId);
      
      
      console.log(`명령어 실행 완료 (${executionTime}ms): ${command.prefix}${command.domain !== CommandDomain.NONE ? command.domain : command.agentId}:${command.command}`);
      
      
      return normalizedResult;
    } catch (error) {
      
      this.pendingCommands.delete(commandId);
      
      
      const errorResult: CommandResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        displayMode: 'text'
      };
      
      
      this.executionHistory.push({
        command,
        result: errorResult,
        timestamp: Date.now(),
        id: commandId
      });
      
      
      console.error(`명령어 실행 실패 (${command.prefix}${command.domain !== CommandDomain.NONE ? command.domain : command.agentId}:${command.command}):`, error);
      
      return errorResult;
    }
  }
  
  /**
   * 결과 정규화 - 여러 형식의 결과를 CommandResult로 변환
   * @param result 원본 결과
   * @returns 정규화된 CommandResult
   */
  private normalizeResult(result: any): CommandResult {
    if (!result) {
      return {
        success: true,
        message: '명령이 실행되었습니다.',
        displayMode: 'text'
      };
    }
    
    
    if (typeof result === 'object' && 'success' in result) {
      return result as CommandResult;
    }
    
    
    if (typeof result === 'string') {
      return {
        success: true,
        message: result,
        displayMode: result.includes('#') || result.includes('**') ? 'markdown' : 'text'
      };
    }
    
    
    if (typeof result === 'object' && 'content' in result) {
      const hasError = 'error' in result && result.error === true;
      return {
        success: !hasError,
        message: result.content,
        data: result,
        error: hasError ? '명령 실행 중 오류가 발생했습니다.' : '',
        displayMode: 'markdown'
      };
    }
    
    
    return {
      success: true,
      data: result,
      displayMode: 'json'
    };
  }
  
  /**
   * 플러그인 명령어 실행 (@ 명령어)
   * @param command 실행할 명령어
   * @param signal AbortSignal (명령어 취소용)
   * @returns 실행 결과
   */
  private async executePluginCommand(command: Command, signal?: AbortSignal): Promise<CommandResult> {
    
    if (signal?.aborted) {
      return {
        success: false,
        error: '명령어 실행이 취소되었습니다.',
        displayMode: 'text'
      };
    }
    
    
    const plugin = this.pluginRegistry.getPlugin(command.agentId);
    
    if (!plugin) {
      
      if (command.agentId === 'jira') {
        return {
          success: false,
          message: `# Jira 플러그인이 등록되지 않았습니다\n\n` +
                   `설정 파일에 Jira 인증 정보를 추가하세요:\n` +
                   "```json\n\"internalPlugins\": {\n  \"jira\": {\n    \"credentials\": {\n      \"token\": \"실제_토큰_값\"\n    }\n  }\n}\n```",
          displayMode: 'markdown',
          data: { type: 'plugin-not-found' }
        };
      }
      return {
        success: false,
        error: `플러그인을 찾을 수 없음: ${command.agentId}`,
        displayMode: 'text'
      };
    }
    
    if (!plugin.isEnabled()) {
      return {
        success: false,
        error: `플러그인이 비활성화됨: ${command.agentId}`,
        displayMode: 'text'
      };
    }
    
    
    if (command.agentId === 'jira' && !plugin.isInitialized()) {
      return {
        success: false,
        message: `# Jira 플러그인 인증 정보가 필요합니다\n\n` +
                `설정 파일에 Jira 인증 정보를 추가하세요:\n` +
                "```json\n\"internalPlugins\": {\n  \"jira\": {\n    \"credentials\": {\n      \"token\": \"실제_토큰_값\"\n    }\n  }\n}\n```",
        displayMode: 'markdown',
        data: { type: 'jira-auth-required' }
      };
    }
    
    try {
      
      console.log(`플러그인 명령어 실행: ${command.agentId}:${command.command}`);
      const result = await plugin.executeCommand(command.command, command.args);
      
      
      if (signal?.aborted) {
        return {
          success: false,
          error: '명령어 실행이 취소되었습니다.',
          displayMode: 'text'
        };
      }
      
      
      return this.normalizeResult(result);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        displayMode: 'text'
      };
    }
  }
  
  /**
   * 내부 명령어 실행 (/ 명령어)
   * @param command 실행할 명령어
   * @param signal AbortSignal (명령어 취소용)
   * @returns 실행 결과
   */
  private async executeInternalCommand(command: Command, signal?: AbortSignal): Promise<CommandResult> {
    
    if (signal?.aborted) {
      return {
        success: false,
        error: '명령어 실행이 취소되었습니다.',
        displayMode: 'text'
      };
    }
    
    
    const handler = this.commandRegistry.getHandler(command.agentId, command.command);
    
    if (!handler) {
      return {
        success: false,
        error: `내부 명령어를 찾을 수 없음: ${command.agentId}:${command.command}`,
        displayMode: 'text',
        suggestedNextCommands: ['/help']
      };
    }
    
    try {
      
      console.log(`내부 명령어 실행: ${command.agentId}:${command.command}`);
      const result = await handler(command.args, command.flags);
      
      
      if (signal?.aborted) {
        return {
          success: false,
          error: '명령어 실행이 취소되었습니다.',
          displayMode: 'text'
        };
      }
      
      
      return this.normalizeResult(result);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        displayMode: 'text'
      };
    }
  }
  
  /**
   * 도메인 기반 명령어 실행 (@ 명령어 중 도메인으로 구분된 명령어)
   * @param command 실행할 명령어
   * @param signal AbortSignal (명령어 취소용)
   * @returns 실행 결과
   */
  private async executeDomainCommand(command: Command, signal?: AbortSignal): Promise<CommandResult> {
    
    if (signal?.aborted) {
      return {
        success: false,
        error: '명령어 실행이 취소되었습니다.',
        displayMode: 'text'
      };
    }
    
    
    if (!command.domain || command.domain === CommandDomain.NONE) {
      return {
        success: false,
        error: '도메인이 지정되지 않은 명령어입니다.',
        displayMode: 'text'
      };
    }
    
    
    const handler = this.commandRegistry.getDomainHandler(command.domain, command.command);
    
    if (!handler) {
      
      try {
        const domainPlugin = this.pluginRegistry.getPluginByDomain(command.domain);
        
        if (domainPlugin && domainPlugin.isEnabled()) {
          return this.executePluginCommand({
            ...command,
            agentId: domainPlugin.id
          }, signal);
        }
      } catch (e) {
        
      }
      
      
      const domainCommands = this.commandRegistry.getDomainCommands(command.domain);
      const suggestions = domainCommands.length > 0
        ? domainCommands.slice(0, 3).map(u => `@${command.domain}:${u.command}`)
        : [`@${command.domain}:help`];
      
      return {
        success: false,
        error: `도메인 명령어를 찾을 수 없음: @${command.domain}:${command.command}`,
        displayMode: 'text',
        suggestedNextCommands: suggestions
      };
    }
    
    try {
      
      console.log(`도메인 명령어 실행: @${command.domain}:${command.command}`);
      const result = await handler(command.args, command.flags);
      
      
      if (signal?.aborted) {
        return {
          success: false,
          error: '명령어 실행이 취소되었습니다.',
          displayMode: 'text'
        };
      }
      
      
      return this.normalizeResult(result);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        displayMode: 'text'
      };
    }
  }
  
  /**
   * 명령어 실행 (문자열 입력 방식)
   * @param commandString 명령어 문자열
   * @param args 명령어 인자 (선택적)
   * @param flags 명령어 플래그 (선택적)
   * @returns 실행 결과
   */
  public async executeFromString(
    commandString: string, 
    args: any[] = [], 
    flags: Record<string, any> = {}
  ): Promise<CommandResult> {
    try {
      
      const parsedCommand = this.parser.parseWithSuggestions(commandString);
      
      
      if (parsedCommand.hasError) {
        return {
          success: false,
          error: parsedCommand.errorMessage || '명령어 파싱 오류',
          displayMode: 'text',
          suggestedNextCommands: parsedCommand.suggestions || []
        };
      }
      
      
      const command: Command = {
        prefix: parsedCommand.prefix,
        type: parsedCommand.type,
        domain: parsedCommand.domain,
        agentId: parsedCommand.domain !== CommandDomain.NONE ? parsedCommand.domain : 'core',
        command: parsedCommand.command,
        subCommand: parsedCommand.subCommand || '',
        args: args.length > 0 ? args : parsedCommand.args,
        flags: flags && Object.keys(flags).length > 0 ? flags : Object.fromEntries(parsedCommand.flags),
        options: Object.fromEntries(parsedCommand.options),
        rawInput: parsedCommand.raw
      };
      
      
      return await this.execute(command);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        displayMode: 'text'
      };
    }
  }
  
  /**
   * 명령어 실행 (직접 문자열 명령어 실행) - 레거시 호환성 유지용
   * @param commandString 명령어 문자열
   * @param args 명령어 인자 (선택적)
   * @param flags 명령어 플래그 (선택적)
   * @returns 실행 결과
   */
  public async executeCommandString(
    commandString: string, 
    args: any[] = [], 
    flags: Record<string, any> = {}
  ): Promise<CommandResult> {
    return this.executeFromString(commandString, args, flags);
  }
  
  /**
   * 실행 이력 조회
   * @param limit 조회할 이력 수 (기본값: 10)
   * @returns 최근 실행 이력
   */
  public getExecutionHistory(limit = 10): Array<{command: Command, result: CommandResult, timestamp: number}> {
    return this.executionHistory
      .slice(-limit)
      .map(({ command, result, timestamp }) => ({ command, result, timestamp }));
  }
  
  /**
   * 명령어 실행 취소
   * @param commandId 취소할 명령어 ID
   * @returns 취소 성공 여부
   */
  public cancel(commandId: string): boolean {
    const pendingCommand = this.pendingCommands.get(commandId);
    if (!pendingCommand) {
      return false;
    }
    
    try {
      pendingCommand.cancel();
      this.pendingCommands.delete(commandId);
      return true;
    } catch (error) {
      console.error('명령어 취소 중 오류 발생:', error);
      return false;
    }
  }
  
  /**
   * 모든 명령어 취소
   * @returns 취소된 명령어 수
   */
  public cancelAll(): number {
    let cancelCount = 0;
    
    this.pendingCommands.forEach((pendingCommand, commandId) => {
      try {
        pendingCommand.cancel();
        this.pendingCommands.delete(commandId);
        cancelCount++;
      } catch (error) {
        console.error(`명령어 취소 중 오류 발생 (${commandId}):`, error);
      }
    });
    
    return cancelCount;
  }
}