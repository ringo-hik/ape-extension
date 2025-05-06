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
    
    // 플러그인 레지스트리가 제공된 경우 이벤트 구독
    if (this._pluginRegistry && typeof this._pluginRegistry.on === 'function') {
      this._pluginRegistry.on('plugin-registered', () => this.refreshCommands());
      this._pluginRegistry.on('plugin-unregistered', () => this.refreshCommands());
      this._pluginRegistry.on('plugins-initialized', () => this.refreshCommands());
    } else {
      console.warn('플러그인 레지스트리의 이벤트 리스너 등록 기능을 찾을 수 없습니다.');
      // 초기 명령어 목록 한 번 로드 (이벤트 방식 대신)
      setTimeout(() => this.refreshCommands(), 1000);
    }
    
    // 기본 내장 명령어 등록
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
    // 도움말 명령어 (@ 버전)
    this.register('core', 'help', async (args, flags) => {
      const commands = this.getAllCommandUsages();
      const atCommands = commands.filter(cmd => cmd.syntax.startsWith('@'));
      
      let helpText = '사용 가능한 @ 명령어:\n\n';
      
      // 플러그인별로 그룹화
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
      
      // 각 그룹 출력
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
    
    // 도움말 명령어 (/ 버전)
    this.register('core', '/help', async (args, flags) => {
      const commands = this.getAllCommandUsages();
      const slashCommands = commands.filter(cmd => cmd.syntax.startsWith('/'));
      
      let helpText = '# 사용 가능한 명령어\n\n';
      
      // 슬래시 명령어 목록
      helpText += '## / 명령어 (내부 기능)\n\n';
      slashCommands.forEach(cmd => {
        helpText += `- \`${cmd.syntax}\` - ${cmd.description}\n`;
      });
      
      // 추가 내장 명령어
      helpText += '\n### 기본 명령어\n\n';
      helpText += '- `/clear` - 대화 기록 지우기\n';
      helpText += '- `/model <모델ID>` - 사용할 모델 변경\n';
      helpText += '- `/debug` - 디버그 정보 표시\n';
      
      // @ 명령어 안내
      helpText += '\n## @ 명령어 (외부 시스템 연동)\n\n';
      helpText += '@ 명령어 목록을 보려면 `/help:at` 명령어를 사용하세요.\n';
      
      return {
        success: true,
        message: helpText,
        displayMode: 'markdown'
      };
    });
    
    // @ 명령어 도움말
    this.register('core', '/help:at', async (args, flags) => {
      const commands = this.getAllCommandUsages();
      const atCommands = commands.filter(cmd => cmd.syntax.startsWith('@'));
      
      let helpText = '# @ 명령어 목록\n\n';
      
      // 플러그인별로 그룹화
      const pluginGroups = new Map<string, CommandUsage[]>();
      atCommands.forEach(cmd => {
        const groupName = cmd.agentId;
        if (!pluginGroups.has(groupName)) {
          pluginGroups.set(groupName, []);
        }
        pluginGroups.get(groupName)!.push(cmd);
      });
      
      // 각 그룹 출력
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
    
    // 모델 변경 명령어
    this.register('core', '/model', async (args, flags) => {
      try {
        // 모델 ID가 제공되지 않은 경우
        if (args.length < 1) {
          return {
            success: false,
            message: '사용법: /model <모델ID> - 예: /model gpt-3.5-turbo',
            displayMode: 'text'
          };
        }
        
        const modelId = args[0].toString();
        
        // VS Code 설정 업데이트
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
    
    // 모델 목록 명령어
    this.register('core', 'models', async (args, flags) => {
      try {
        // LLM 서비스 가져오기 (여기서는 임시로 하드코딩된 정보 사용)
        const models = [
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
          { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
          { id: 'claude-2', name: 'Claude 2', provider: 'Anthropic' },
          { id: 'claude-instant', name: 'Claude Instant', provider: 'Anthropic' }
        ];
        
        let response = '# 사용 가능한 LLM 모델\n\n';
        
        // 모델 정보 포맷팅
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
    
    // 디버그 명령어
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
      
      // 에이전트 맵 생성 (없는 경우)
      if (!this._handlers.has(agentId)) {
        this._handlers.set(agentId, new Map());
      }
      
      const agentCommands = this._handlers.get(agentId)!;
      
      // 이미 등록된 명령어 확인
      if (agentCommands.has(command)) {
        console.warn(`이미 등록된 명령어: ${agentId}:${command}`);
        return false;
      }
      
      // 명령어 핸들러 등록
      agentCommands.set(command, handler);
      
      // 이벤트 발행
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
      
      // 에이전트 맵 생성 (없는 경우)
      if (!this._usages.has(usage.agentId)) {
        this._usages.set(usage.agentId, new Map());
      }
      
      const agentUsages = this._usages.get(usage.agentId)!;
      
      // 명령어 사용법 등록
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
    
    // 에이전트 기반 명령어 사용법 추가
    this._usages.forEach(agentUsages => {
      const usageValues = Array.from(agentUsages.values());
      allUsages.push(...usageValues);
    })
    
    // 도메인 기반 명령어 사용법 추가
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
    
    // /로 시작하는 명령어만 필터링
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
    
    // @로 시작하는 명령어만 필터링
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
    
    // 에이전트 기반 명령어 그룹화
    this._usages.forEach((usages, agentId) => {
      const usagesList = Array.from(usages.values());
      if (usagesList.length > 0) {
        groupedCommands.set(agentId, usagesList);
      }
    });
    
    // 도메인 기반 명령어 그룹화
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
    // 명령어 분석
    const parts = fullCommand.split(':');
    let agentId: string = 'core'; // 기본 에이전트 ID를 'core'로 설정
    let command: string;
    let domain: CommandDomain = CommandDomain.NONE;
    
    if (parts.length === 1) {
      // 내부 명령어 (core 플러그인)
      command = parts[0] || '';
    } else {
      // 첫 부분 분석 (에이전트 ID 또는 도메인)
      const firstPart = parts[0] || '';
      
      // 도메인 명령어인지 확인 (@ 접두사 제거 후)
      const domainValue = firstPart && firstPart.startsWith('@') ? firstPart.substring(1) : firstPart;
      
      // 도메인 열거형에 있는지 확인
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
        // 도메인 기반 명령어
        command = parts.slice(1).join(':') || '';
      } else {
        // 에이전트 기반 명령어
        agentId = firstPart;
        command = parts.slice(1).join(':') || '';
      }
    }
    
    // 명령어 핸들러 조회 (도메인 기반 또는 에이전트 기반)
    let handler: CommandHandler | undefined;
    
    if (domain !== CommandDomain.NONE) {
      handler = this.getDomainHandler(domain, command);
    } else {
      handler = this.getHandler(agentId, command);
    }
    
    if (!handler) {
      // 명령어 제안 로직
      let suggestions: string[] = [];
      const commandsList = domain !== CommandDomain.NONE
        ? this.getDomainCommands(domain).map(u => u.command)
        : this.getAgentCommands(agentId).map(u => u.command);
      
      // 레벤슈타인 거리 기준으로 유사 명령어 제안
      const MAX_LEVENSHTEIN_DISTANCE = 3;
      
      for (const cmd of commandsList) {
        const distance = this.calculateLevenshteinDistance(command, cmd);
        if (distance <= MAX_LEVENSHTEIN_DISTANCE) {
          suggestions.push(cmd);
        }
      }
      
      // 제안 없는 경우 일반적인 명령어 제안
      if (suggestions.length === 0) {
        if (domain !== CommandDomain.NONE) {
          suggestions = this.getDomainCommands(domain)
            .slice(0, 3)
            .map(u => `@${domain}:${u.command}`);
        } else {
          // 기본 명령어 제안
          suggestions = ['/help', '@help'];
        }
      } else {
        // 제안 명령어에 접두사 추가
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
      // 명령어 실행
      const result = await handler(args, flags);
      
      // 결과 정규화 (문자열인 경우 CommandResult 객체로 변환)
      if (typeof result === 'string') {
        const stringResult: string = result;
        return {
          success: true,
          message: stringResult,
          displayMode: stringResult.includes('#') || stringResult.includes('**') ? 'markdown' : 'text'
        };
      } else if (result && typeof result === 'object') {
        // 이미 CommandResult 객체이거나 유사한 형태인 경우
        if ('success' in result) {
          return result as CommandResult;
        } else if ('content' in result) {
          // Type assertion to access the content property
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
        // 기타 타입 처리
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
    
    // 간단한 두 행 방식으로 구현 (메모리 최적화)
    let prev = Array(b.length + 1).fill(0);
    let curr = Array(b.length + 1).fill(0);
    
    // 첫 번째 행 초기화
    for (let j = 0; j <= b.length; j++) {
      prev[j] = j;
    }
    
    // 계산
    for (let i = 1; i <= a.length; i++) {
      // 첫 번째 열 초기화
      curr[0] = i;
      
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,        // 삭제
          curr[j - 1] + 1,     // 삽입
          prev[j - 1] + cost   // 대체
        );
      }
      
      // 행 교체
      [prev, curr] = [curr, prev];
    }
    
    // 주의: 최종 결과는 prev에 있음 (마지막 swap 때문)
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
      
      // 도메인 맵 생성 (없는 경우)
      if (!this._domainHandlers.has(domain)) {
        this._domainHandlers.set(domain, new Map());
      }
      
      const domainCommands = this._domainHandlers.get(domain)!;
      
      // 이미 등록된 명령어 확인
      if (domainCommands.has(command)) {
        console.warn(`이미 등록된 도메인 명령어: ${domain}:${command}`);
        return false;
      }
      
      // 명령어 핸들러 등록
      domainCommands.set(command, handler);
      
      // 사용법 정보가 제공된 경우 등록
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
      
      // 이벤트 발행
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
    // 슬래시가 없는 경우 자동 추가
    const fullCommand = command.startsWith('/') ? command : `/${command}`;
    
    // 코어 도메인으로 등록 (내부 시스템 명령어)
    const registrationResult = this.register('core', fullCommand, handler);
    
    // 사용법 정보가 제공된 경우 등록
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
      
      // 도메인 맵 생성 (없는 경우)
      if (!this._domainUsages.has(usage.domain)) {
        this._domainUsages.set(usage.domain, new Map());
      }
      
      const domainUsages = this._domainUsages.get(usage.domain)!;
      
      // 명령어 사용법 등록
      domainUsages.set(usage.command, {
        agentId: usage.domain.toString(), // 호환성을 위해 도메인을 에이전트 ID로 사용
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
    // 컨텍스트 캐시 업데이트
    if (additionalContext) {
      this._contextCache = { ...this._contextCache, ...additionalContext };
    }
    
    // 컨텍스트 병합
    const context = { ...this._contextCache };
    
    // 명령어 패턴에서 도메인 추출
    let domain: CommandDomain = CommandDomain.NONE;
    
    // '@git:' 형식 검사 - 명령어 패턴에서 도메인 추출
    if (commandPattern && commandPattern.startsWith('@')) {
      const parts = commandPattern.substring(1).split(':');
      const domainPart = parts.length > 0 ? parts[0] : '';
      
      // 도메인 문자열을 CommandDomain으로 변환
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
    
    // 도메인별 컨텍스트 기반 명령어 생성 로직
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
        // 일반 명령어는 그대로 반환
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
    // Git 명령어 분석 - '@git:xxx' 형식
    const parts = baseCommand.split(':');
    if (parts.length < 2) return baseCommand;
    
    const command = parts[1];
    
    // 명령어별 컨텍스트 활용
    switch (command) {
      case 'checkout':
        // 브랜치 정보가 있는 경우 브랜치 추가
        if ('currentBranch' in context && context['currentBranch']) {
          return `@git:checkout ${context['currentBranch']}`;
        }
        
        // 브랜치 목록이 있는 경우 여러 옵션 제시
        if ('branches' in context && Array.isArray(context['branches'])) {
          return context['branches'].slice(0, 5).map((branch: string) => `@git:checkout ${branch}`);
        }
        break;
        
      case 'commit':
        // 작업 파일 정보가 있는 경우 커밋 메시지에 활용
        if ('changedFiles' in context && Array.isArray(context['changedFiles']) && context['changedFiles'].length > 0) {
          // 변경 파일 중 첫 번째 파일로 커밋 메시지 추정
          const firstFile = context['changedFiles'][0];
          return `@git:commit -m "Update ${firstFile}"`;
        }
        
        // 현재 작업 중인 파일이 있는 경우
        if ('activeFile' in context && context['activeFile']) {
          const fileName = context['activeFile'].split('/').pop();
          return `@git:commit -m "Update ${fileName || 'file'}"`;
        }
        break;
        
      case 'push':
        // 현재 브랜치 정보가 있는 경우
        if ('currentBranch' in context && context['currentBranch']) {
          return `@git:push origin ${context['currentBranch']}`;
        }
        break;
        
      case 'pull':
        // 현재 브랜치 정보가 있는 경우
        if ('currentBranch' in context && context['currentBranch']) {
          return `@git:pull origin ${context['currentBranch']}`;
        }
        break;
    }
    
    // 특정 컨텍스트 정보가 없는 경우 기본 명령어 반환
    return baseCommand;
  }
  
  /**
   * Jira 명령어 컨텍스트 기반 생성
   * @param baseCommand 기본 Jira 명령어
   * @param context 컨텍스트 정보
   * @returns 생성된 명령어 또는 명령어 배열
   */
  private _generateJiraContextualCommand(baseCommand: string, context: Record<string, any>): string | string[] {
    // Jira 명령어 분석 - '@jira:xxx' 형식
    const parts = baseCommand.split(':');
    if (parts.length < 2) return baseCommand;
    
    const command = parts[1];
    
    // 명령어별 컨텍스트 활용
    switch (command) {
      case 'view':
      case 'issue':
        // 이슈 키가 있는 경우 이슈 조회
        if ('issueKey' in context && context['issueKey']) {
          return `@jira:view ${context['issueKey']}`;
        }
        
        // 최근 이슈 목록이 있는 경우
        if ('recentIssues' in context && Array.isArray(context['recentIssues'])) {
          return context['recentIssues'].slice(0, 3).map((issue: any) => 
            `@jira:view ${typeof issue === 'string' ? issue : (issue && typeof issue === 'object' && 'key' in issue) ? issue.key : 'unknown'}`
          );
        }
        break;
        
      case 'create':
        // 현재 작업 중인 파일이 있는 경우 제목으로 활용
        if ('activeFile' in context && context['activeFile']) {
          const fileName = context['activeFile'].split('/').pop();
          return `@jira:create --title "Issue with ${fileName || 'file'}"`;
        }
        break;
    }
    
    // 특정 컨텍스트 정보가 없는 경우 기본 명령어 반환
    return baseCommand;
  }
  
  /**
   * Pocket 명령어 컨텍스트 기반 생성
   * @param baseCommand 기본 Pocket 명령어
   * @param context 컨텍스트 정보
   * @returns 생성된 명령어 또는 명령어 배열
   */
  private _generatePocketContextualCommand(baseCommand: string, context: Record<string, any>): string | string[] {
    // Pocket 명령어 분석 - '@pocket:xxx' 형식
    const parts = baseCommand.split(':');
    if (parts.length < 2) return baseCommand;
    
    const command = parts[1];
    
    // 명령어별 컨텍스트 활용
    switch (command) {
      case 'read':
        // 아티클 ID가 있는 경우
        if ('articleId' in context && context['articleId']) {
          return `@pocket:read ${context['articleId']}`;
        }
        
        // 최근 아티클 목록이 있는 경우
        if ('recentArticles' in context && Array.isArray(context['recentArticles'])) {
          return context['recentArticles'].slice(0, 3).map((article: any) => 
            `@pocket:read ${typeof article === 'string' ? article : (article && typeof article === 'object' && 'id' in article) ? article.id : 'unknown'}`
          );
        }
        break;
        
      case 'search':
        // 검색어가 있는 경우
        if ('searchQuery' in context && context['searchQuery']) {
          return `@pocket:search ${context['searchQuery']}`;
        }
        break;
    }
    
    // 특정 컨텍스트 정보가 없는 경우 기본 명령어 반환
    return baseCommand;
  }
  
  /**
   * Doc 명령어 컨텍스트 기반 생성
   * @param baseCommand 기본 Doc 명령어
   * @param context 컨텍스트 정보
   * @returns 생성된 명령어 또는 명령어 배열
   */
  private _generateDocContextualCommand(baseCommand: string, context: Record<string, any>): string | string[] {
    // Doc 명령어 분석 - '@doc:xxx' 형식
    const parts = baseCommand.split(':');
    if (parts.length < 2) return baseCommand;
    
    const command = parts[1];
    
    // 명령어별 컨텍스트 활용
    switch (command) {
      case 'search':
        // 검색어가 있는 경우
        if ('searchQuery' in context && context['searchQuery']) {
          return `@doc:search ${context['searchQuery']}`;
        }
        break;
    }
    
    // 특정 컨텍스트 정보가 없는 경우 기본 명령어 반환
    return baseCommand;
  }
  
  /**
   * 명령어 추천 제안 목록 생성
   * @param context 컨텍스트 정보
   * @param limit 최대 추천 수 (기본값: 5)
   * @returns 추천 명령어 목록
   */
  public async suggestCommands(context: Record<string, any>, limit: number = 5): Promise<string[]> {
    // 컨텍스트 캐시 업데이트
    this._contextCache = { ...this._contextCache, ...context };
    
    const suggestions: string[] = [];
    
    // 작업 중인 파일이 있는 경우 파일 타입 기반 추천
    if ('activeFile' in context && context['activeFile']) {
      const activeFile = context['activeFile'] as string;
      const parts = activeFile ? activeFile.split('.') : [];
      const fileExtension = (parts && parts.length > 1) ? parts[parts.length - 1]?.toLowerCase() || '' : '';
      
      // 파일 타입별 추천
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
    
    // Git 정보가 있는 경우 Git 명령어 추천
    if ('currentBranch' in context && context['currentBranch']) {
      suggestions.push(`@git:push origin ${context['currentBranch']}`);
      suggestions.push(`@git:pull origin ${context['currentBranch']}`);
    }
    
    // 최근 명령어 기록 기반 추천
    if ('recentCommands' in context && Array.isArray(context['recentCommands'])) {
      suggestions.push(...context['recentCommands'].slice(0, 3));
    }
    
    // 중복 제거 및 제한
    const uniqueSuggestions: string[] = [];
    // Filter out duplicates manually
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
    
    // 기존 명령어 모두 제거
    this._handlers.clear();
    this._usages.clear();
    this._domainHandlers.clear();
    this._domainUsages.clear();
    
    // 활성화된 모든 플러그인에서 명령어 가져오기
    const plugins = this._pluginRegistry.getEnabledPlugins() || [];
    let commandCount = 0;
    
    for (const plugin of plugins) {
      if (!plugin) continue;
      
      const pluginCommands = plugin.getCommands?.() || [];
      for (const cmd of pluginCommands) {
        if (!cmd || !cmd.name) continue;
        
        const fullCommandName = cmd.name;
        
        // 명령어 타입 및 도메인 판별
        let domain = CommandDomain.NONE;
        if (cmd.domain) {
          domain = cmd.domain as CommandDomain;
        } else if (plugin.getDomain) {
          // Cast the string result to CommandDomain enum
          const domainStr = plugin.getDomain();
          domain = Object.values(CommandDomain).find(
            d => d.toString().toLowerCase() === domainStr.toLowerCase()
          ) as CommandDomain || CommandDomain.NONE;
        }
        
        // 명령어 핸들러 작성
        const handler: CommandHandler = async (args, flags) => {
          // 플러그인의 executeCommand 메서드는 args만 받지만, 호환성을 위해 flags를 무시
          return await plugin.executeCommand(fullCommandName, args);
        };
        
        // 명령어 등록 (도메인 기반 또는 기존 방식)
        let registered = false;
        
        if (domain !== CommandDomain.NONE) {
          // 도메인 기반 등록
          registered = this.registerAgentCommand(domain, fullCommandName, handler, {
            description: cmd.description || '',
            syntax: cmd.syntax || `@${domain}:${fullCommandName}`,
            examples: cmd.examples || []
          });
        } else {
          // 기존 방식 등록
          registered = this.register(plugin.id, fullCommandName, handler);
          
          if (registered) {
            // 명령어 사용법 등록
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
    
    // 핸들러 조회
    const handler = this.getHandler(agentId, commandName);
    if (!handler) {
      return undefined;
    }
    
    // 사용법 정보 조회
    const usage = this.getUsage(agentId, commandName);
    
    // 기본 명령어 객체 구성
    const cmdObj: Record<string, any> = {
      id: `${agentId}:${commandName}`,
      handler,
      agentId,
      command: commandName,
    };
    
    // 사용법 정보가 있으면 병합
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
      
      // 명령어 ID 파싱
      const parts = command.id.split(':');
      let agentId = 'core';
      let commandName = '';
      
      if (parts.length === 1) {
        // 내부 명령어 (core 플러그인)
        agentId = 'core';
        commandName = parts[0] || '';
      } else if (parts.length > 1) {
        // 플러그인 명령어 (agentId:command)
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
      
      // 레거시 명령어 맵에 저장
      this._commands.set(command.id, command);
      
      // 명령어 핸들러 등록
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
    
    // 모든 에이전트에서 명령어 검색
    this._handlers.forEach((handlers, agentId) => {
      handlers.forEach((handler, commandName) => {
        // 사용법 정보 가져오기
        const usage = this.getUsage(agentId, commandName);
        
        if (usage) {
          // 명령어 접두사 확인
          let commandType = CommandType.NONE;
          let prefix = CommandPrefix.NONE;
          
          if (usage.syntax.startsWith('@')) {
            commandType = CommandType.AT;
            prefix = CommandPrefix.AT;
          } else if (usage.syntax.startsWith('/')) {
            commandType = CommandType.SLASH;
            prefix = CommandPrefix.SLASH;
          }
          
          // 요청된 타입과 일치하는 경우만 추가
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