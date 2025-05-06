/**
 * 명령어 레지스트리 모듈
 * 
 * 명령어 등록 및 관리 기능 제공
 * 내부 플러그인 및 외부 플러그인 명령어 통합 관리
 * 이중 접두사 및 도메인 기반 명령어 시스템 지원
 */

import { EventEmitter } from 'events';
import {
  ICommand, ICommandRegistry, CommandType, CommandPrefix, CommandHandler,
  CommandUsage, CommandDomain, CommandResult
} from '../../types/CommandTypes';
import { PluginRegistryService } from '../plugin-system/PluginRegistryService';

/**
 * 명령어 레지스트리 클래스
 * 명령어 핸들러 등록 및 조회 담당
 * 도메인 기반 명령어 시스템 지원
 */
export class CommandRegistryService extends EventEmitter implements ICommandRegistry {
  /**
   * 명령어 핸들러 맵
   * 에이전트 ID => {명령어 이름 => 핸들러}
   */
  private _handlers: Map<string, Map<string, CommandHandler>> = new Map();
  
  /**
   * 도메인 기반 명령어 핸들러 맵
   * 도메인 => {명령어 이름 => 핸들러}
   */
  private _domainHandlers: Map<CommandDomain, Map<string, CommandHandler>> = new Map();
  
  /**
   * 명령어 사용법 맵
   * 에이전트 ID => {명령어 이름 => 사용법}
   */
  private _usages: Map<string, Map<string, CommandUsage>> = new Map();
  
  /**
   * 도메인 기반 명령어 사용법 맵
   * 도메인 => {명령어 이름 => 사용법}
   */
  private _domainUsages: Map<CommandDomain, Map<string, CommandUsage>> = new Map();
  
  /**
   * 레거시 명령어 맵
   */
  private _commands: Map<string, ICommand> = new Map();
  
  /**
   * 컨텍스트 캐시
   * 명령어 추천 및 생성에 사용되는 컨텍스트 정보
   */
  private _contextCache: Record<string, any> = {};
  
  /**
   * 플러그인 레지스트리
   */
  private _pluginRegistry: PluginRegistryService | null = null;
  
  /**
   * 명령어 레지스트리 생성자
   * @param pluginRegistry 플러그인 레지스트리 (선택적)
   */
  constructor(pluginRegistry?: PluginRegistryService) {
    super();
    this._pluginRegistry = pluginRegistry ?? null;
    
    
    if (this._pluginRegistry && typeof this._pluginRegistry.on === 'function') {
      this._pluginRegistry.on('plugin-registered', () => this.refreshCommands());
      this._pluginRegistry.on('plugin-unregistered', () => this.refreshCommands());
      this._pluginRegistry.on('plugins-initialized', () => this.refreshCommands());
    } else {
      console.warn('플러그인 레지스트리의 이벤트 리스너 등록 기능을 찾을 수 없습니다.');
      
      setTimeout(() => this.refreshCommands(), 1000);
    }
    
    
    this.registerCoreCommands();
  }
  
  /**
   * 초기화 - 플러그인 레지스트리 초기화 및 명령어 새로고침
   */
  public async initialize(): Promise<void> {
    if (this._pluginRegistry) {
      await this._pluginRegistry.initialize();
    }
    this.refreshCommands();
    this.emit('initialized');
  }
  
  /**
   * 기본 내장 명령어 등록
   */
  private registerCoreCommands(): void {
    
    this.register('core', 'help', async (args, flags) => {
      const commands = this.getAllCommandUsages();
      const atCommands = commands.filter(cmd => cmd.syntax.startsWith('@'));
      
      let helpText = '사용 가능한 @ 명령어:\n\n';
      
      
      const pluginGroups = new Map<string, CommandUsage[]>();
      atCommands.forEach(cmd => {
        const groupName = cmd.agentId;
        if (!pluginGroups.has(groupName)) {
          pluginGroups.set(groupName, []);
        }
        const cmdGroup = pluginGroups.get(groupName);
        if (cmdGroup) {
          cmdGroup.push(cmd);
        }
      });
      
      
      pluginGroups.forEach((cmds, plugin) => {
        helpText += `[${plugin}]\n`;
        cmds.forEach(cmd => {
          helpText += `  ${cmd.syntax} - ${cmd.description}\n`;
        });
        helpText += '\n';
      });
      
      return {
        success: true,
        message: helpText,
        displayMode: 'text'
      };
    });
    
    
    this.register('core', '/help', async (args, flags) => {
      const commands = this.getAllCommandUsages();
      const slashCommands = commands.filter(cmd => cmd.syntax.startsWith('/'));
      
      let helpText = '# 사용 가능한 명령어\n\n';
      
      
      helpText += '## / 명령어 (내부 기능)\n\n';
      slashCommands.forEach(cmd => {
        helpText += `- \`${cmd.syntax}\` - ${cmd.description}\n`;
      });
      
      
      helpText += '\n### 기본 명령어\n\n';
      helpText += '- `/clear` - 대화 기록 지우기\n';
      helpText += '- `/model <모델ID>` - 사용할 모델 변경\n';
      helpText += '- `/debug` - 디버그 정보 표시\n';
      
      
      helpText += '\n## @ 명령어 (외부 시스템 연동)\n\n';
      helpText += '@ 명령어 목록을 보려면 `/help:at` 명령어를 사용하세요.\n';
      
      return {
        success: true,
        message: helpText,
        displayMode: 'markdown'
      };
    });
    
    
    this.register('core', '/help:at', async (args, flags) => {
      const commands = this.getAllCommandUsages();
      const atCommands = commands.filter(cmd => cmd.syntax.startsWith('@'));
      
      let helpText = '# @ 명령어 목록\n\n';
      
      
      const pluginGroups = new Map<string, CommandUsage[]>();
      atCommands.forEach(cmd => {
        const groupName = cmd.agentId;
        if (!pluginGroups.has(groupName)) {
          pluginGroups.set(groupName, []);
        }
        pluginGroups.get(groupName)!.push(cmd);
      });
      
      
      if (pluginGroups.size === 0) {
        helpText += '등록된 @ 명령어가 없습니다.\n\n';
        helpText += '각 플러그인은 자체 명령어를 제공합니다. 설정에 플러그인을 추가하면 더 많은 명령어를 사용할 수 있습니다.';
      } else {
        pluginGroups.forEach((cmds, plugin) => {
          helpText += `## ${plugin} 플러그인\n\n`;
          cmds.forEach(cmd => {
            helpText += `- \`${cmd.syntax}\` - ${cmd.description}\n`;
          });
          helpText += '\n';
        });
      }
      
      return {
        success: true,
        message: helpText,
        displayMode: 'markdown'
      };
    });
    
    
    this.register('core', '/model', async (args, flags) => {
      try {
        
        if (args.length < 1) {
          return {
            success: false,
            message: '사용법: /model <모델ID> - 예: /model gpt-3.5-turbo',
            displayMode: 'text'
          };
        }
        
        const modelId = args[0].toString();
        
        
        const vscode = require('vscode');
        const config = vscode.workspace.getConfiguration('ape.llm');
        await config.update('defaultModel', modelId, vscode.ConfigurationTarget.Global);
        
        return {
          success: true,
          message: `모델이 '${modelId}'(으)로 변경되었습니다.`,
          displayMode: 'text'
        };
      } catch (error) {
        console.error('모델 변경 중 오류 발생:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
          message: `모델 변경 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          displayMode: 'text'
        };
      }
    });
    
    
    this.register('core', 'models', async (args, flags) => {
      try {
        
        const models = [
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
          { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
          { id: 'claude-2', name: 'Claude 2', provider: 'Anthropic' },
          { id: 'claude-instant', name: 'Claude Instant', provider: 'Anthropic' }
        ];
        
        let response = '# 사용 가능한 LLM 모델\n\n';
        
        
        for (const model of models) {
          response += `## ${model.name} (${model.provider})\n`;
          response += `- ID: \`${model.id}\`\n\n`;
        }
        
        response += '모델을 변경하려면 `/model <모델ID>` 명령어를 사용하세요.';
        
        return {
          success: true,
          message: response,
          displayMode: 'markdown'
        };
      } catch (error) {
        console.error('모델 목록 조회 중 오류 발생:', error);
        return {
          success: false,
          message: '모델 목록을 가져오는 중 오류가 발생했습니다.',
          displayMode: 'text'
        };
      }
    });
    
    
    this.register('core', '/debug', async (args, flags) => {
      try {
        const debugInfo = {
          timestamp: new Date().toISOString(),
          commands: this.getAllCommandUsages().length,
          handlers: Array.from(this._handlers.keys()).map(agent => ({
            agent,
            commands: Array.from(this._handlers.get(agent)?.keys() || [])
          }))
        };
        
        return {
          success: true,
          message: '# 디버그 정보\n\n' +
                  `**시간**: ${new Date().toLocaleString()}\n\n` +
                  `**등록된 명령어**: ${debugInfo.commands}개\n\n` +
                  '**핸들러**:\n```json\n' + JSON.stringify(debugInfo.handlers, null, 2) + '\n```\n\n' +
                  '시스템이 정상적으로 작동 중입니다.',
          displayMode: 'markdown',
          data: debugInfo
        };
      } catch (error) {
        console.error('디버그 정보 생성 중 오류 발생:', error);
        return {
          success: false,
          message: '디버그 정보를 생성하는 중 오류가 발생했습니다.',
          error: error instanceof Error ? error.message : '알 수 없는 오류',
          displayMode: 'text'
        };
      }
    });
  }
  
  /**
   * 명령어 핸들러 등록
   * @param agentId 에이전트 ID
   * @param command 명령어 이름
   * @param handler 명령어 핸들러
   * @returns 등록 성공 여부
   */
  register(agentId: string, command: string, handler: CommandHandler): boolean {
    try {
      if (!agentId || !command || !handler) {
        console.error('유효하지 않은 명령어 등록 정보:', { agentId, command });
        return false;
      }
      
      
      if (!this._handlers.has(agentId)) {
        this._handlers.set(agentId, new Map());
      }
      
      const agentCommands = this._handlers.get(agentId)!;
      
      
      if (agentCommands.has(command)) {
        console.warn(`이미 등록된 명령어: ${agentId}:${command}`);
        return false;
      }
      
      
      agentCommands.set(command, handler);
      
      
      this.emit('command-registered', { agentId, command });
      this.emit('commands-changed');
      
      return true;
    } catch (error) {
      console.error(`명령어 등록 오류 (${agentId}:${command}):`, error);
      return false;
    }
  }
  
  /**
   * 명령어 핸들러 조회
   * @param agentId 에이전트 ID
   * @param command 명령어 이름
   * @returns 명령어 핸들러 또는 undefined
   */
  getHandler(agentId: string, command: string): CommandHandler | undefined {
    const agentCommands = this._handlers.get(agentId);
    if (!agentCommands) {
      return undefined;
    }
    
    return agentCommands.get(command);
  }
  
  /**
   * 모든 명령어 핸들러 조회
   * @returns 명령어 핸들러 맵
   */
  getAllHandlers(): Map<string, Map<string, CommandHandler>> {
    return this._handlers;
  }
  
  /**
   * 명령어 맵 가져오기 (UI 호환성 메서드)
   * @returns 명령어 맵
   */
  getCommandMap(): Map<string, ICommand> {
    return this._commands;
  }
  
  /**
   * 모든 도메인 명령어 핸들러 조회
   * @returns 도메인별 명령어 핸들러 맵
   */
  getAllDomainHandlers(): Map<CommandDomain, Map<string, CommandHandler>> {
    return this._domainHandlers;
  }
  
  /**
   * 명령어 사용법 등록
   * @param usage 명령어 사용법
   * @returns 등록 성공 여부
   */
  registerUsage(usage: CommandUsage): boolean {
    try {
      if (!usage.agentId || !usage.command) {
        console.error('유효하지 않은 명령어 사용법:', usage);
        return false;
      }
      
      
      if (!this._usages.has(usage.agentId)) {
        this._usages.set(usage.agentId, new Map());
      }
      
      const agentUsages = this._usages.get(usage.agentId)!;
      
      
      agentUsages.set(usage.command, usage);
      
      return true;
    } catch (error) {
      console.error(`명령어 사용법 등록 오류 (${usage.agentId}:${usage.command}):`, error);
      return false;
    }
  }
  
  /**
   * 명령어 사용법 조회
   * @param agentId 에이전트 ID
   * @param command 명령어 이름
   * @returns 명령어 사용법 또는 undefined
   */
  getUsage(agentId: string, command: string): CommandUsage | undefined {
    const agentUsages = this._usages.get(agentId);
    if (!agentUsages) {
      return undefined;
    }
    
    return agentUsages.get(command);
  }
  
  /**
   * 에이전트의 모든 명령어 사용법 조회
   * @param agentId 에이전트 ID
   * @returns 명령어 사용법 목록
   */
  getAgentCommands(agentId: string): CommandUsage[] {
    const agentUsages = this._usages.get(agentId);
    if (!agentUsages) {
      return [];
    }
    
    return Array.from(agentUsages.values());
  }
  
  /**
   * 모든 명령어 사용법 조회 (에이전트 기반 및 도메인 기반 모두 포함)
   * @returns 명령어 사용법 목록
   */
  getAllCommandUsages(): CommandUsage[] {
    const allUsages: CommandUsage[] = [];
    
    
    this._usages.forEach(agentUsages => {
      const usageValues = Array.from(agentUsages.values());
      allUsages.push(...usageValues);
    })
    
    
    this._domainUsages.forEach(domainUsages => {
      const usageValues = Array.from(domainUsages.values());
      allUsages.push(...usageValues);
    });
    
    return allUsages;
  }
  
  /**
   * 모든 시스템 명령어 사용법 조회 (/로 시작하는 명령어)
   * @returns 시스템 명령어 사용법 목록
   */
  getAllSystemCommandUsages(): CommandUsage[] {
    const allUsages = this.getAllCommandUsages();
    
    
    return allUsages.filter(usage => 
      usage.syntax.startsWith('/') || 
      (usage.command && usage.command.startsWith('/'))
    );
  }
  
  /**
   * 모든 에이전트 명령어 사용법 조회 (@로 시작하는 명령어)
   * @returns 에이전트 명령어 사용법 목록
   */
  getAllAgentCommandUsages(): CommandUsage[] {
    const allUsages = this.getAllCommandUsages();
    
    
    return allUsages.filter(usage => 
      usage.syntax.startsWith('@') || 
      (usage.command && usage.command.startsWith('@'))
    );
  }
  
  /**
   * 도메인 또는 에이전트 기반으로 모든 명령어 가져오기
   * @param grouped 그룹화 여부 (default: true - 도메인/에이전트별 그룹화)
   * @returns 그룹화된 명령어 맵 또는 전체 목록
   */
  getAllCommands(grouped: boolean = true): Map<string, CommandUsage[]> | CommandUsage[] {
    if (!grouped) {
      return this.getAllCommandUsages();
    }
    
    const groupedCommands = new Map<string, CommandUsage[]>();
    
    
    this._usages.forEach((usages, agentId) => {
      const usagesList = Array.from(usages.values());
      if (usagesList.length > 0) {
        groupedCommands.set(agentId, usagesList);
      }
    });
    
    
    this._domainUsages.forEach((usages, domain) => {
      const domainKey = `domain:${domain}`;
      const usagesList = Array.from(usages.values());
      if (usagesList.length > 0) {
        groupedCommands.set(domainKey, usagesList);
      }
    });
    
    return groupedCommands;
  }
  
  /**
   * 명령어 실행
   * @param fullCommand 전체 명령어 (agentId:command 또는 domain:command 형식)
   * @param args 명령어 인자
   * @param flags 명령어 플래그
   * @returns 명령어 실행 결과
   */
  public async executeCommand(fullCommand: string, args: any[] = [], flags: Record<string, any> = {}): Promise<CommandResult> {
    
    const parts = fullCommand.split(':');
    let agentId: string = 'core'; 
    let command: string;
    let domain: CommandDomain = CommandDomain.NONE;
    
    if (parts.length === 1) {
      
      command = parts[0] || '';
    } else {
      
      const firstPart = parts[0] || '';
      
      
      const domainValue = firstPart && firstPart.startsWith('@') ? firstPart.substring(1) : firstPart;
      
      
      try {
        if (domainValue) {
          domain = Object.values(CommandDomain).find(
            d => d && d.toString().toLowerCase() === domainValue.toLowerCase()
          ) as CommandDomain || CommandDomain.NONE;
        }
      } catch (e) {
        domain = CommandDomain.NONE;
      }
      
      if (domain !== CommandDomain.NONE) {
        
        command = parts.slice(1).join(':') || '';
      } else {
        
        agentId = firstPart;
        command = parts.slice(1).join(':') || '';
      }
    }
    
    
    let handler: CommandHandler | undefined;
    
    if (domain !== CommandDomain.NONE) {
      handler = this.getDomainHandler(domain, command);
    } else {
      handler = this.getHandler(agentId, command);
    }
    
    if (!handler) {
      
      let suggestions: string[] = [];
      const commandsList = domain !== CommandDomain.NONE
        ? this.getDomainCommands(domain).map(u => u.command)
        : this.getAgentCommands(agentId).map(u => u.command);
      
      
      const MAX_LEVENSHTEIN_DISTANCE = 3;
      
      for (const cmd of commandsList) {
        const distance = this.calculateLevenshteinDistance(command, cmd);
        if (distance <= MAX_LEVENSHTEIN_DISTANCE) {
          suggestions.push(cmd);
        }
      }
      
      
      if (suggestions.length === 0) {
        if (domain !== CommandDomain.NONE) {
          suggestions = this.getDomainCommands(domain)
            .slice(0, 3)
            .map(u => `@${domain}:${u.command}`);
        } else {
          
          suggestions = ['/help', '@help'];
        }
      } else {
        
        if (domain !== CommandDomain.NONE) {
          suggestions = suggestions.map(s => `@${domain}:${s}`);
        } else if (agentId) {
          const prefix = command.startsWith('/') ? '/' : '@';
          suggestions = suggestions.map(s => `${agentId}:${s}`);
        }
      }
      
      return {
        success: false,
        error: `명령어를 찾을 수 없음: ${domain !== CommandDomain.NONE ? `@${domain}:${command}` : `${agentId}:${command}`}`,
        displayMode: 'text',
        suggestedNextCommands: suggestions
      };
    }
    
    try {
      
      const result = await handler(args, flags);
      
      
      if (typeof result === 'string') {
        const stringResult: string = result;
        return {
          success: true,
          message: stringResult,
          displayMode: stringResult.includes('#') || stringResult.includes('**') ? 'markdown' : 'text'
        };
      } else if (result && typeof result === 'object') {
        
        if ('success' in result) {
          return result as CommandResult;
        } else if ('content' in result) {
          
          const contentResult = result as { content: string };
          return {
            success: true,
            message: contentResult.content,
            data: result,
            displayMode: 'markdown'
          };
        } else {
          return {
            success: true,
            data: result,
            displayMode: 'json'
          };
        }
      } else {
        
        return {
          success: true,
          data: result,
          displayMode: 'text'
        };
      }
    } catch (error) {
      console.error(`명령어 실행 오류 (${domain !== CommandDomain.NONE ? `@${domain}:${command}` : `${agentId}:${command}`}):`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        displayMode: 'text'
      };
    }
  }
  
  /**
   * 레벤슈타인 거리 계산 (문자열 유사도)
   * @param a 첫 번째 문자열
   * @param b 두 번째 문자열
   * @returns 레벤슈타인 거리
   */
  private calculateLevenshteinDistance(a: string, b: string): number {
    if (!a) return b ? b.length : 0;
    if (!b) return a.length;
    
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    
    let prev = Array(b.length + 1).fill(0);
    let curr = Array(b.length + 1).fill(0);
    
    
    for (let j = 0; j <= b.length; j++) {
      prev[j] = j;
    }
    
    
    for (let i = 1; i <= a.length; i++) {
      
      curr[0] = i;
      
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,        
          curr[j - 1] + 1,     
          prev[j - 1] + cost   
        );
      }
      
      
      [prev, curr] = [curr, prev];
    }
    
    
    return prev[b.length];
  }
  
  /**
   * 에이전트 명령어 등록 - 도메인 기반 명령어 지원 추가
   * @param domain 명령어 도메인
   * @param command 명령어 이름
   * @param handler 명령어 핸들러
   * @param usage 명령어 사용법 정보 (선택적)
   * @returns 등록 성공 여부
   */
  public registerAgentCommand(
    domain: CommandDomain,
    command: string,
    handler: CommandHandler,
    usage?: Partial<CommandUsage>
  ): boolean {
    try {
      if (!domain || !command || !handler) {
        console.error('유효하지 않은 에이전트 명령어 등록 정보:', { domain, command });
        return false;
      }
      
      
      if (!this._domainHandlers.has(domain)) {
        this._domainHandlers.set(domain, new Map());
      }
      
      const domainCommands = this._domainHandlers.get(domain)!;
      
      
      if (domainCommands.has(command)) {
        console.warn(`이미 등록된 도메인 명령어: ${domain}:${command}`);
        return false;
      }
      
      
      domainCommands.set(command, handler);
      
      
      if (usage) {
        this.registerDomainUsage({
          domain,
          command,
          description: usage.description || '',
          syntax: usage.syntax || `@${domain}:${command}`,
          examples: usage.examples || [],
          flags: usage.flags || []
        });
      }
      
      
      this.emit('agent-command-registered', { domain, command });
      this.emit('commands-changed');
      
      return true;
    } catch (error) {
      console.error(`에이전트 명령어 등록 오류 (${domain}:${command}):`, error);
      return false;
    }
  }
  
  /**
   * 시스템 명령어 등록 - 내부 시스템 기능을 위한 명령어
   * @param command 명령어 이름 (슬래시 포함)
   * @param handler 명령어 핸들러
   * @param usage 명령어 사용법 정보 (선택적)
   * @returns 등록 성공 여부
   */
  public registerSystemCommand(
    command: string,
    handler: CommandHandler,
    usage?: Partial<CommandUsage>
  ): boolean {
    
    const fullCommand = command.startsWith('/') ? command : `/${command}`;
    
    
    const registrationResult = this.register('core', fullCommand, handler);
    
    
    if (registrationResult && usage) {
      this.registerUsage({
        agentId: 'core',
        command: fullCommand,
        description: usage.description || '',
        syntax: usage.syntax || fullCommand,
        examples: usage.examples || [],
        flags: usage.flags || []
      });
    }
    
    return registrationResult;
  }
  
  /**
   * 도메인 기반 명령어 사용법 등록
   * @param usage 도메인 명령어 사용법
   * @returns 등록 성공 여부
   */
  public registerDomainUsage(usage: { domain: CommandDomain, command: string } & Omit<CommandUsage, 'agentId'>): boolean {
    try {
      if (!usage.domain || !usage.command) {
        console.error('유효하지 않은 도메인 명령어 사용법:', usage);
        return false;
      }
      
      
      if (!this._domainUsages.has(usage.domain)) {
        this._domainUsages.set(usage.domain, new Map());
      }
      
      const domainUsages = this._domainUsages.get(usage.domain)!;
      
      
      domainUsages.set(usage.command, {
        agentId: usage.domain.toString(), 
        command: usage.command,
        description: usage.description,
        syntax: usage.syntax,
        examples: usage.examples || [],
        flags: usage.flags || []
      });
      
      return true;
    } catch (error) {
      console.error(`도메인 명령어 사용법 등록 오류 (${usage.domain}:${usage.command}):`, error);
      return false;
    }
  }
  
  /**
   * 도메인 기반 명령어 핸들러 조회
   * @param domain 명령어 도메인
   * @param command 명령어 이름
   * @returns 명령어 핸들러 또는 undefined
   */
  public getDomainHandler(domain: CommandDomain, command: string): CommandHandler | undefined {
    const domainCommands = this._domainHandlers.get(domain);
    if (!domainCommands) {
      return undefined;
    }
    
    return domainCommands.get(command);
  }
  
  /**
   * 도메인 기반 명령어 사용법 조회
   * @param domain 명령어 도메인
   * @param command 명령어 이름
   * @returns 명령어 사용법 또는 undefined
   */
  public getDomainUsage(domain: CommandDomain, command: string): CommandUsage | undefined {
    const domainUsages = this._domainUsages.get(domain);
    if (!domainUsages) {
      return undefined;
    }
    
    return domainUsages.get(command);
  }
  
  /**
   * 도메인의 모든 명령어 사용법 조회
   * @param domain 명령어 도메인
   * @returns 명령어 사용법 목록
   */
  public getDomainCommands(domain: CommandDomain): CommandUsage[] {
    const domainUsages = this._domainUsages.get(domain);
    if (!domainUsages) {
      return [];
    }
    
    return Array.from(domainUsages.values());
  }
  
  /**
   * 컨텍스트 기반 명령어 생성
   * 현재 컨텍스트에 따라 명령어를 자동 생성하거나 추천
   * @param commandPattern 기본 명령어 또는 명령어 패턴
   * @param additionalContext 추가 컨텍스트 객체 (선택적)
   * @returns 컨텍스트 인식 명령어 또는 명령어 배열
   */
  public async generateContextualCommand(
    commandPattern: string, 
    additionalContext?: Record<string, any>
  ): Promise<string | string[]> {
    
    if (additionalContext) {
      this._contextCache = { ...this._contextCache, ...additionalContext };
    }
    
    
    const context = { ...this._contextCache };
    
    
    let domain: CommandDomain = CommandDomain.NONE;
    
    
    if (commandPattern && commandPattern.startsWith('@')) {
      const parts = commandPattern.substring(1).split(':');
      const domainPart = parts.length > 0 ? parts[0] : '';
      
      
      if (domainPart) {
        switch (domainPart.toLowerCase()) {
          case 'git':
            domain = CommandDomain.GIT;
            break;
          case 'jira':
            domain = CommandDomain.JIRA;
            break;
          case 'pocket':
            domain = CommandDomain.POCKET;
            break;
          case 'doc':
            domain = CommandDomain.DOC;
            break;
          case 'vault':
            domain = CommandDomain.VAULT;
            break;
          case 'rules':
            domain = CommandDomain.RULES;
            break;
          default:
            domain = CommandDomain.NONE;
        }
      }
    }
    
    
    switch (domain) {
      case CommandDomain.GIT:
        return this._generateGitContextualCommand(commandPattern, context);
      
      case CommandDomain.JIRA:
        return this._generateJiraContextualCommand(commandPattern, context);
      
      case CommandDomain.POCKET:
        return this._generatePocketContextualCommand(commandPattern, context);
      
      case CommandDomain.DOC:
        return this._generateDocContextualCommand(commandPattern, context);
      
      default:
        
        return commandPattern;
    }
  }
  
  /**
   * Git 명령어 컨텍스트 기반 생성
   * @param baseCommand 기본 Git 명령어
   * @param context 컨텍스트 정보
   * @returns 생성된 명령어 또는 명령어 배열
   */
  private _generateGitContextualCommand(baseCommand: string, context: Record<string, any>): string | string[] {
    
    const parts = baseCommand.split(':');
    if (parts.length < 2) return baseCommand;
    
    const command = parts[1];
    
    
    switch (command) {
      case 'checkout':
        
        if ('currentBranch' in context && context['currentBranch']) {
          return `@git:checkout ${context['currentBranch']}`;
        }
        
        
        if ('branches' in context && Array.isArray(context['branches'])) {
          return context['branches'].slice(0, 5).map((branch: string) => `@git:checkout ${branch}`);
        }
        break;
        
      case 'commit':
        
        if ('changedFiles' in context && Array.isArray(context['changedFiles']) && context['changedFiles'].length > 0) {
          
          const firstFile = context['changedFiles'][0];
          return `@git:commit -m "Update ${firstFile}"`;
        }
        
        
        if ('activeFile' in context && context['activeFile']) {
          const fileName = context['activeFile'].split('/').pop();
          return `@git:commit -m "Update ${fileName || 'file'}"`;
        }
        break;
        
      case 'push':
        
        if ('currentBranch' in context && context['currentBranch']) {
          return `@git:push origin ${context['currentBranch']}`;
        }
        break;
        
      case 'pull':
        
        if ('currentBranch' in context && context['currentBranch']) {
          return `@git:pull origin ${context['currentBranch']}`;
        }
        break;
    }
    
    
    return baseCommand;
  }
  
  /**
   * Jira 명령어 컨텍스트 기반 생성
   * @param baseCommand 기본 Jira 명령어
   * @param context 컨텍스트 정보
   * @returns 생성된 명령어 또는 명령어 배열
   */
  private _generateJiraContextualCommand(baseCommand: string, context: Record<string, any>): string | string[] {
    
    const parts = baseCommand.split(':');
    if (parts.length < 2) return baseCommand;
    
    const command = parts[1];
    
    
    switch (command) {
      case 'view':
      case 'issue':
        
        if ('issueKey' in context && context['issueKey']) {
          return `@jira:view ${context['issueKey']}`;
        }
        
        
        if ('recentIssues' in context && Array.isArray(context['recentIssues'])) {
          return context['recentIssues'].slice(0, 3).map((issue: any) => 
            `@jira:view ${typeof issue === 'string' ? issue : (issue && typeof issue === 'object' && 'key' in issue) ? issue.key : 'unknown'}`
          );
        }
        break;
        
      case 'create':
        
        if ('activeFile' in context && context['activeFile']) {
          const fileName = context['activeFile'].split('/').pop();
          return `@jira:create --title "Issue with ${fileName || 'file'}"`;
        }
        break;
    }
    
    
    return baseCommand;
  }
  
  /**
   * Pocket 명령어 컨텍스트 기반 생성
   * @param baseCommand 기본 Pocket 명령어
   * @param context 컨텍스트 정보
   * @returns 생성된 명령어 또는 명령어 배열
   */
  private _generatePocketContextualCommand(baseCommand: string, context: Record<string, any>): string | string[] {
    
    const parts = baseCommand.split(':');
    if (parts.length < 2) return baseCommand;
    
    const command = parts[1];
    
    
    switch (command) {
      case 'read':
        
        if ('articleId' in context && context['articleId']) {
          return `@pocket:read ${context['articleId']}`;
        }
        
        
        if ('recentArticles' in context && Array.isArray(context['recentArticles'])) {
          return context['recentArticles'].slice(0, 3).map((article: any) => 
            `@pocket:read ${typeof article === 'string' ? article : (article && typeof article === 'object' && 'id' in article) ? article.id : 'unknown'}`
          );
        }
        break;
        
      case 'search':
        
        if ('searchQuery' in context && context['searchQuery']) {
          return `@pocket:search ${context['searchQuery']}`;
        }
        break;
    }
    
    
    return baseCommand;
  }
  
  /**
   * Doc 명령어 컨텍스트 기반 생성
   * @param baseCommand 기본 Doc 명령어
   * @param context 컨텍스트 정보
   * @returns 생성된 명령어 또는 명령어 배열
   */
  private _generateDocContextualCommand(baseCommand: string, context: Record<string, any>): string | string[] {
    
    const parts = baseCommand.split(':');
    if (parts.length < 2) return baseCommand;
    
    const command = parts[1];
    
    
    switch (command) {
      case 'search':
        
        if ('searchQuery' in context && context['searchQuery']) {
          return `@doc:search ${context['searchQuery']}`;
        }
        break;
    }
    
    
    return baseCommand;
  }
  
  /**
   * 명령어 추천 제안 목록 생성
   * @param context 컨텍스트 정보
   * @param limit 최대 추천 수 (기본값: 5)
   * @returns 추천 명령어 목록
   */
  public async suggestCommands(context: Record<string, any>, limit: number = 5): Promise<string[]> {
    
    this._contextCache = { ...this._contextCache, ...context };
    
    const suggestions: string[] = [];
    
    
    if ('activeFile' in context && context['activeFile']) {
      const activeFile = context['activeFile'] as string;
      const parts = activeFile ? activeFile.split('.') : [];
      const fileExtension = (parts && parts.length > 1) ? parts[parts.length - 1]?.toLowerCase() || '' : '';
      
      
      switch (fileExtension) {
        case 'js':
        case 'ts':
        case 'jsx':
        case 'tsx':
          suggestions.push('@git:status');
          suggestions.push('@git:diff');
          suggestions.push('@git:commit');
          break;
          
        case 'md':
        case 'txt':
          suggestions.push('@doc:search');
          suggestions.push('@doc:index');
          break;
      }
    }
    
    
    if ('currentBranch' in context && context['currentBranch']) {
      suggestions.push(`@git:push origin ${context['currentBranch']}`);
      suggestions.push(`@git:pull origin ${context['currentBranch']}`);
    }
    
    
    if ('recentCommands' in context && Array.isArray(context['recentCommands'])) {
      suggestions.push(...context['recentCommands'].slice(0, 3));
    }
    
    
    const uniqueSuggestions: string[] = [];
    
    for (const suggestion of suggestions) {
      if (!uniqueSuggestions.includes(suggestion)) {
        uniqueSuggestions.push(suggestion);
      }
    }
    return uniqueSuggestions.slice(0, limit);
  }
  
  /**
   * 플러그인에서 모든 명령어를 다시 로드합니다.
   * @returns 로드된 명령어 수
   */
  public refreshCommands(): number {
    if (!this._pluginRegistry) {
      return 0;
    }
    
    
    this._handlers.clear();
    this._usages.clear();
    this._domainHandlers.clear();
    this._domainUsages.clear();
    
    
    const plugins = this._pluginRegistry.getEnabledPlugins() || [];
    let commandCount = 0;
    
    for (const plugin of plugins) {
      if (!plugin) continue;
      
      const pluginCommands = plugin.getCommands?.() || [];
      for (const cmd of pluginCommands) {
        if (!cmd || !cmd.name) continue;
        
        const fullCommandName = cmd.name;
        
        
        let domain = CommandDomain.NONE;
        if (cmd.domain) {
          domain = cmd.domain as CommandDomain;
        } else if (plugin.getDomain) {
          
          const domainStr = plugin.getDomain();
          domain = Object.values(CommandDomain).find(
            d => d.toString().toLowerCase() === domainStr.toLowerCase()
          ) as CommandDomain || CommandDomain.NONE;
        }
        
        
        const handler: CommandHandler = async (args, flags) => {
          
          return await plugin.executeCommand(fullCommandName, args);
        };
        
        
        let registered = false;
        
        if (domain !== CommandDomain.NONE) {
          
          registered = this.registerAgentCommand(domain, fullCommandName, handler, {
            description: cmd.description || '',
            syntax: cmd.syntax || `@${domain}:${fullCommandName}`,
            examples: cmd.examples || []
          });
        } else {
          
          registered = this.register(plugin.id, fullCommandName, handler);
          
          if (registered) {
            
            this.registerUsage({
              agentId: plugin.id,
              command: fullCommandName,
              description: cmd.description || '',
              syntax: cmd.syntax || `@${plugin.id}:${fullCommandName}`,
              examples: cmd.examples || []
            });
          }
        }
        
        if (registered) {
          commandCount++;
        }
      }
    }
    
    this.emit('commands-changed');
    return commandCount;
  }
  
  /**
   * 명령어 변경 이벤트 리스너를 등록합니다.
   * @param listener 이벤트 리스너
   * @returns this
   */
  public onCommandsChanged(listener: () => void): this {
    this.on('commands-changed', listener);
    return this;
  }
  
  /**
   * 현재 컨텍스트 캐시 조회
   * @returns 컨텍스트 캐시 객체
   */
  public getContextCache(): any {
    return this._contextCache;
  }
  
  /**
   * 플러그인 조회 - PluginRegistryService 프록시 메서드
   * @param pluginId 플러그인 ID
   * @returns 플러그인 인스턴스 또는 undefined
   */
  public getPlugin(pluginId: string): any {
    if (!this._pluginRegistry) {
      return undefined;
    }
    return this._pluginRegistry.getPlugin(pluginId);
  }
  
  /**
   * 명령어 찾기 (ID 또는 이름으로)
   * @param agentId 에이전트/플러그인 ID
   * @param commandName 명령어 이름
   * @returns 명령어 객체 또는 undefined
   */
  public findCommand(agentId: string, commandName: string): any {
    if (!agentId || !commandName) {
      return undefined;
    }
    
    
    const handler = this.getHandler(agentId, commandName);
    if (!handler) {
      return undefined;
    }
    
    
    const usage = this.getUsage(agentId, commandName);
    
    
    const cmdObj: Record<string, any> = {
      id: `${agentId}:${commandName}`,
      handler,
      agentId,
      command: commandName,
    };
    
    
    if (usage) {
      Object.entries(usage).forEach(([key, value]) => {
        if (value !== undefined) {
          cmdObj[key] = value;
        }
      });
    }
    
    return cmdObj;
  }
  
  /**
   * 명령어를 등록합니다. (레거시 호환성)
   * @param command 명령어 객체
   * @returns 등록 성공 여부
   */
  public registerCommand(command: ICommand): boolean {
    try {
      if (!command || !command.id) {
        console.error('유효하지 않은 명령어:', command);
        return false;
      }
      
      
      const parts = command.id.split(':');
      let agentId = 'core';
      let commandName = '';
      
      if (parts.length === 1) {
        
        agentId = 'core';
        commandName = parts[0] || '';
      } else if (parts.length > 1) {
        
        agentId = parts[0] || '';
        commandName = parts.slice(1).join(':') || '';
      } else {
        console.error('Invalid command ID format:', command.id);
        return false;
      }
      
      if (!commandName) {
        console.error('Command name cannot be empty');
        return false;
      }
      
      
      this._commands.set(command.id, command);
      
      
      return this.register(agentId, commandName, command.handler);
    } catch (error) {
      console.error(`명령어 등록 오류 (${command?.id}):`, error);
      return false;
    }
  }
  
  /**
   * 레거시 UI 호환성 메서드: 명령어 존재 여부 확인
   * @param commandId 명령어 ID
   * @returns 명령어 존재 여부
   */
  public hasCommand(commandId: string): boolean {
    if (!commandId) return false;
    
    const parts = commandId.split(':');
    let agentId = 'core';
    let command = '';
    
    if (parts.length === 1) {
      agentId = 'core';
      command = parts[0] || '';
    } else if (parts.length > 1) {
      agentId = parts[0] || '';
      command = parts.slice(1).join(':') || '';
    } else {
      return false;
    }
    
    return this.getHandler(agentId, command) !== undefined;
  }
  
  /**
   * 레거시 UI 호환성 메서드: 특정 타입의 명령어 목록 가져오기
   * @param type 명령어 타입
   * @returns 명령어 목록
   */
  public getCommandsByType(type: CommandType): ICommand[] {
    const commands: ICommand[] = [];
    
    
    this._handlers.forEach((handlers, agentId) => {
      handlers.forEach((handler, commandName) => {
        
        const usage = this.getUsage(agentId, commandName);
        
        if (usage) {
          
          let commandType = CommandType.NONE;
          let prefix = CommandPrefix.NONE;
          
          if (usage.syntax.startsWith('@')) {
            commandType = CommandType.AT;
            prefix = CommandPrefix.AT;
          } else if (usage.syntax.startsWith('/')) {
            commandType = CommandType.SLASH;
            prefix = CommandPrefix.SLASH;
          }
          
          
          if (commandType === type) {
            commands.push({
              id: `${agentId}:${commandName}`,
              type: commandType,
              prefix: prefix,
              domain: usage.domain || CommandDomain.NONE,
              description: usage.description,
              handler
            });
          }
        }
      });
    });
    
    return commands;
  }
}