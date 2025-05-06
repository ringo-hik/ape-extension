/**
 * 명령어 파서 모듈
 * 
 * 사용자 입력에서 명령어 구문을 파싱하는 기능 제공
 * @ 및 / 접두사 모두 지원하는 하이브리드 명령 시스템 구현
 * 도메인 기반 명령어 구조를 지원하는 이중 접두사 시스템
 */

import { Command, CommandPrefix, CommandType, CommandDomain, ICommandParser, ParsedCommand } from '../../types/CommandTypes';

/**
 * 명령어 파서 클래스
 * 사용자 입력에서 명령어, 인자, 플래그 추출
 * 이중 접두사 및 도메인 기반 명령어 구조 지원
 */
export class CommandParserService implements ICommandParser {
  
  private readonly SIMILARITY_THRESHOLD = 0.6;
  
  
  private readonly domainMap: Map<string, CommandDomain> = new Map([
    ['git', CommandDomain.GIT],
    ['doc', CommandDomain.DOC],
    ['jira', CommandDomain.JIRA],
    ['pocket', CommandDomain.POCKET],
    ['vault', CommandDomain.VAULT],
    ['rules', CommandDomain.RULES]
  ]);
  
  
  private readonly commonCommands: Map<CommandDomain, string[]> = new Map([
    [CommandDomain.GIT, ['commit-message', 'summarize', 'explain-diff', 'review-pr', 'conflict-resolve']],
    [CommandDomain.DOC, ['add', 'search', 'list', 'delete', 'use']],
    [CommandDomain.JIRA, ['create', 'update', 'search', 'summarize']],
    [CommandDomain.POCKET, ['save', 'list', 'search', 'analyze']],
    [CommandDomain.VAULT, ['save', 'search', 'link', 'summarize']],
    [CommandDomain.RULES, ['enable', 'disable', 'create', 'list']]
  ]);
  
  
  private readonly commonSystemCommands: string[] = [
    'help', 'clear', 'settings', 'model', 'debug'
  ];
  
  /**
   * 명령어 파싱
   * @param input 명령어 입력 문자열
   * @returns 파싱된 명령어 또는 null (명령어가 아닌 경우)
   */
  parse(input: string | undefined): Command | null {
    if (!input || !input.trim()) {
      return null;
    }
    
    const trimmed = input.trim();
    
    
    let prefix = CommandPrefix.NONE;
    let content = trimmed;
    let commandType = CommandType.NONE;
    let domain = CommandDomain.NONE;
    
    if (trimmed.startsWith('@')) {
      
      
      if (!trimmed.includes(':')) {
        
        return null;
      }
      
      prefix = CommandPrefix.AT;
      commandType = CommandType.AT;
      content = trimmed.substring(1);
      
      
      domain = this.extractDomain(trimmed);
    } else if (trimmed.startsWith('/')) {
      prefix = CommandPrefix.SLASH;
      commandType = CommandType.SLASH;
      content = trimmed.substring(1);
    } else {
      
      return null;
    }
    
    
    const tokens = this.tokenize(content);
    
    if (tokens.length === 0) {
      return null;
    }
    
    
    const [agentId, commandName, subCommand] = this.extractAgentAndCommand(tokens[0] || '', commandType);
    
    
    if (!agentId || !commandName) {
      return null;
    }
    
    
    const { args, flags, options } = this.extractArgsAndFlags(tokens.slice(1));
    
    const command: Command = {
      prefix,
      type: commandType,
      domain,
      agentId,
      command: commandName,
      args,
      flags,
      options,
      rawInput: trimmed
    };
    
    
    if (subCommand !== undefined) {
      command.subCommand = subCommand;
    }
    
    return command;
  }
  
  /**
   * 입력 문자열이 명령어인지 확인
   * @param input 입력 문자열
   * @returns 명령어 여부
   */
  public isCommand(input: string): boolean {
    if (!input || !input.trim()) {
      return false;
    }
    
    const trimmed = input.trim();
    
    
    if (trimmed.startsWith('/')) {
      return true;
    }
    
    
    if (trimmed.startsWith('@') && trimmed.includes(':')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 상세 명령어 파싱 (오타 감지, 추천 등 기능 포함)
   * @param input 입력 문자열
   * @returns 파싱된 명령어 인터페이스
   */
  public parseWithSuggestions(input: string): ParsedCommand {
    const command = this.parse(input);
    const result: ParsedCommand = {
      prefix: CommandPrefix.NONE,
      type: CommandType.NONE,
      domain: CommandDomain.NONE,
      command: '',
      subCommand: '', 
      args: [],
      flags: new Map<string, string | boolean>(),
      options: new Map<string, any>(),
      raw: input
    };
    
    if (!command) {
      
      if (this.looksLikeCommand(input)) {
        
        result.hasError = true;
        result.errorMessage = '유효하지 않은 명령어 형식입니다.';
        result.suggestions = this.suggestSimilarCommands(input);
        return result;
      }
      
      
      return result;
    }
    
    
    const flagsMap = new Map<string, string | boolean>();
    Object.entries(command.flags).forEach(([key, value]) => {
      flagsMap.set(key, value);
    });
    
    const optionsMap = new Map<string, any>();
    Object.entries(command.options).forEach(([key, value]) => {
      optionsMap.set(key, value);
    });
    
    return {
      prefix: command.prefix,
      type: command.type,
      domain: command.domain,
      command: command.command,
      subCommand: command.subCommand ?? '', 
      args: command.args,
      flags: flagsMap,
      options: optionsMap,
      raw: command.rawInput
    };
  }
  
  /**
   * 명령어와 유사하게 보이는지 확인
   * @param input 입력 문자열
   * @returns 명령어와 유사한지 여부
   */
  private looksLikeCommand(input: string): boolean {
    if (!input || !input.trim()) {
      return false;
    }
    
    const trimmed = input.trim();
    
    
    if (trimmed.startsWith('/') || trimmed.startsWith('@')) {
      return true;
    }
    
    
    if (trimmed.includes(':')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 입력 문자열에서 도메인 추출
   * @param input 입력 문자열
   * @returns 도메인 또는 CommandDomain.NONE
   */
  public extractDomain(input: string): CommandDomain {
    if (!input || !input.includes(':')) {
      return CommandDomain.NONE;
    }
    
    
    const cleanInput = input.startsWith('@') ? input.substring(1) : input;
    const parts = cleanInput.split(':');
    
    if (!parts || parts.length === 0) {
      return CommandDomain.NONE;
    }
    
    const domainPart = parts[0] ? parts[0].toLowerCase().trim() : '';
    
    
    return this.domainMap.get(domainPart) || CommandDomain.NONE;
  }
  
  /**
   * 에이전트/도메인 ID와 명령어 이름 추출
   * @param token 첫 번째 토큰
   * @param commandType 명령어 타입
   * @returns [에이전트 ID, 명령어 이름, 하위 명령어] 또는 잘못된 형식이면 [null, null, null]
   */
  private extractAgentAndCommand(token: string, commandType: CommandType): [string | null, string | null, string | undefined] {
    if (!token) {
      return [null, null, undefined];
    }
    
    const parts = token.split(':');
    
    if (parts && parts.length > 1) {
      
      const agentId = parts[0] ? parts[0].trim() : '';
      
      
      let commandName = (parts.length > 1 && parts[1]) ? parts[1].trim() : '';
      let subCommand: string | undefined = undefined;
      
      
      if (parts.length > 2) {
        
        const subCommandParts = parts.slice(2).filter(part => part !== undefined);
        if (subCommandParts.length > 0) {
          subCommand = subCommandParts.join(':').trim();
        }
      }
      
      
      if (!agentId || !commandName) {
        return [null, null, undefined];
      }
      
      return [agentId, commandName, subCommand];
    }
    
    
    
    if (commandType === CommandType.SLASH) {
      return ['core', token, undefined];
    }
    
    return [null, null, undefined];
  }
  
  /**
   * 입력 문자열 토큰화
   * 따옴표로 묶인 인자 및 공백 처리
   * @param input 입력 문자열
   * @returns 토큰 배열
   */
  private tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';
    let escaped = false;
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      
      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }
      
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if ((char === '"' || char === "'") && (!inQuote || quoteChar === char)) {
        if (inQuote) {
          
          inQuote = false;
          quoteChar = '';
        } else {
          
          inQuote = true;
          quoteChar = char;
        }
        continue;
      }
      
      if (char === ' ' && !inQuote) {
        
        if (current) {
          tokens.push(current);
          current = '';
        }
        continue;
      }
      
      
      current += char;
    }
    
    
    if (current) {
      tokens.push(current);
    }
    
    return tokens;
  }
  
  /**
   * 인자, 플래그 및 옵션 추출
   * @param tokens 토큰 배열 (첫 번째 토큰 제외)
   * @returns 인자, 플래그 및 옵션 객체
   */
  private extractArgsAndFlags(tokens: string[]): { args: any[], flags: Record<string, any>, options: Record<string, any> } {
    const args: any[] = [];
    const flags: Record<string, any> = {};
    const options: Record<string, any> = {};
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (!token) continue; 
      
      if (token.startsWith('--')) {
        
        const flagParts = token.substring(2).split('=');
        if (flagParts && flagParts.length > 0) {
          const key = flagParts[0] || '';
          
          if (key) {
            if (flagParts.length > 1) {
              
              const valueStr = flagParts.slice(1).join('=');
              if (valueStr !== undefined) {
                flags[key] = this.parseValue(valueStr);
              }
            } else {
              
              flags[key] = true;
            }
          }
        }
      } else if (token.startsWith('-') && token.length === 2) {
        
        const flagName = token.substring(1);
        
        if (flagName) {
          
          const hasNextToken = i + 1 < tokens.length;
          const nextToken = hasNextToken ? tokens[i + 1] || '' : ''; 
          const validNextToken = nextToken && nextToken.startsWith && !nextToken.startsWith('-');
          
          if (hasNextToken && validNextToken) {
            flags[flagName] = this.parseValue(nextToken);
            i++; 
          } else {
            flags[flagName] = true;
          }
        }
      } else if (token.includes('=') && !token.startsWith('-')) {
        
        const optionParts = token.split('=');
        if (optionParts && optionParts.length > 0) {
          const key = optionParts[0] ? optionParts[0].trim() : '';
          
          if (key && optionParts.length > 1) {
            const valueStr = optionParts.slice(1).join('=');
            if (valueStr !== undefined) {
              options[key] = this.parseValue(valueStr);
            }
          }
        }
      } else {
        
        args.push(this.parseValue(token));
      }
    }
    
    return { args, flags, options };
  }
  
  /**
   * 값 파싱 (문자열, 숫자, 불리언 등)
   * @param value 문자열 값
   * @returns 파싱된 값
   */
  private parseValue(value: string): any {
    
    if (value.toLowerCase() === 'true') {
      return true;
    }
    
    if (value.toLowerCase() === 'false') {
      return false;
    }
    
    
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return Number(value);
    }
    
    
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      try {
        return JSON.parse(value);
      } catch {
        
        return value;
      }
    }
    
    
    return value;
  }
  
  /**
   * 유사한 명령어 제안
   * @param command 입력된 오류 명령어
   * @returns 유사한 명령어 목록
   */
  public suggestSimilarCommands(command: string): string[] {
    if (!command || !command.trim()) {
      return [];
    }
    
    const trimmedCommand = command.trim();
    const suggestions: string[] = [];
    
    
    if (trimmedCommand.startsWith('@')) {
      
      const parts = trimmedCommand.substring(1).split(':');
      
      if (parts && parts.length > 0) {
        const domainPart = parts[0] ? parts[0].toLowerCase().trim() : '';
        const commandPart = (parts.length > 1 && parts[1]) ? parts[1].toLowerCase().trim() : '';
        
        
        const domain = this.getSimilarDomain(domainPart);
        
        if (domain !== CommandDomain.NONE) {
          
          const commonDomainCommands = this.commonCommands.get(domain) || [];
          
          if (commandPart) {
            
            const similarCommands = this.findSimilarCommands(commandPart, commonDomainCommands);
            
            for (const cmd of similarCommands) {
              suggestions.push(`@${this.getDomainString(domain)}:${cmd}`);
            }
          } else {
            
            for (const cmd of commonDomainCommands) {
              suggestions.push(`@${this.getDomainString(domain)}:${cmd}`);
            }
          }
        } else {
          
          this.commonCommands.forEach((cmds, domain) => {
            if (suggestions.length < 3 && cmds.length > 0) {
              
              const domainStr = this.getDomainString(domain);
              if (domainStr) { 
                suggestions.push(`@${domainStr}:${cmds[0]}`);
              }
            }
          });
        }
      }
    } else if (trimmedCommand.startsWith('/')) {
      
      const commandPart = trimmedCommand.substring(1).toLowerCase().trim();
      
      if (commandPart) {
        
        const similarCommands = this.findSimilarCommands(commandPart, this.commonSystemCommands);
        
        for (const cmd of similarCommands) {
          suggestions.push(`/${cmd}`);
        }
      } else {
        
        for (const cmd of this.commonSystemCommands) {
          suggestions.push(`/${cmd}`);
        }
      }
    }
    
    return suggestions;
  }
  
  /**
   * 유사한 도메인 찾기
   * @param input 입력 도메인
   * @returns 유사한 도메인 또는 NONE
   */
  private getSimilarDomain(input: string): CommandDomain {
    if (!input) {
      return CommandDomain.NONE;
    }
    
    
    if (this.domainMap.has(input)) {
      const domain = this.domainMap.get(input);
      return domain !== undefined ? domain : CommandDomain.NONE;
    }
    
    
    let bestMatch: [string, number] = ['', 0];
    
    this.domainMap.forEach((domain, domainStr) => {
      const similarity = this.calculateSimilarity(input, domainStr);
      
      if (similarity > this.SIMILARITY_THRESHOLD && similarity > bestMatch[1]) {
        bestMatch = [domainStr, similarity];
      }
    });
    
    if (bestMatch[0]) {
      const domain = this.domainMap.get(bestMatch[0]);
      return domain !== undefined ? domain : CommandDomain.NONE;
    }
    
    return CommandDomain.NONE;
  }
  
  /**
   * 도메인 열거형을 문자열로 변환
   * @param domain 도메인 열거형
   * @returns 도메인 문자열
   */
  private getDomainString(domain: CommandDomain): string {
    switch (domain) {
      case CommandDomain.GIT:
        return 'git';
      case CommandDomain.DOC:
        return 'doc';
      case CommandDomain.JIRA:
        return 'jira';
      case CommandDomain.POCKET:
        return 'pocket';
      case CommandDomain.VAULT:
        return 'vault';
      case CommandDomain.RULES:
        return 'rules';
      default:
        return '';
    }
  }
  
  /**
   * 유사한 명령어 찾기
   * @param input 입력 명령어
   * @param commands 명령어 목록
   * @returns 유사한 명령어 목록
   */
  private findSimilarCommands(input: string, commands: string[]): string[] {
    const result: [string, number][] = [];
    
    for (const cmd of commands) {
      const similarity = this.calculateSimilarity(input, cmd);
      
      if (similarity > this.SIMILARITY_THRESHOLD) {
        result.push([cmd, similarity]);
      }
    }
    
    
    result.sort((a, b) => b[1] - a[1]);
    
    
    return result.slice(0, 3).map(([cmd, _]) => cmd);
  }
  
  /**
   * 두 문자열 간의 유사도 계산 (Levenshtein 거리 기반)
   * @param str1 첫 번째 문자열
   * @param str2 두 번째 문자열
   * @returns 유사도 (0-1 사이)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    
    if (longer === shorter) {
      return 1.0;
    }
    
    
    const distance = this.levenshteinDistance(longer, shorter);
    
    
    return (longer.length - distance) / longer.length;
  }
  
  /**
   * 레벤슈타인 거리 계산
   * @param str1 첫 번째 문자열
   * @param str2 두 번째 문자열
   * @returns 레벤슈타인 거리
   */
  private levenshteinDistance(str1: string, str2: string): number {
    if (!str1) return str2 ? str2.length : 0;
    if (!str2) return str1.length;
    
    const len1 = str1.length;
    const len2 = str2.length;
    
    
    if (len1 === 0) return len2;
    if (len2 === 0) return len1;
    
    
    
    let previous = Array(len2 + 1).fill(0);
    let current = Array(len2 + 1).fill(0);
    
    
    for (let j = 0; j <= len2; j++) {
      previous[j] = j;
    }
    
    
    for (let i = 1; i <= len1; i++) {
      
      current[0] = i;
      
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        current[j] = Math.min(
          previous[j] + 1,      
          current[j - 1] + 1,   
          previous[j - 1] + cost 
        );
      }
      
      
      [previous, current] = [current, previous];
    }
    
    return previous[len2];
  }
  
  /**
   * 명령어 ID를 기반으로 명령어 문자열을 생성합니다.
   * @param commandId 명령어 ID
   * @param type 명령어 타입
   * @param domain 명령어 도메인 (에이전트 명령어인 경우만)
   * @returns 명령어 문자열
   */
  public formatCommand(commandId: string, type: CommandType, domain?: CommandDomain): string {
    if (!commandId) {
      return '';
    }
    
    let prefix = '';
    
    switch (type) {
      case CommandType.AT:
        prefix = '@';
        
        if (domain && domain !== CommandDomain.NONE) {
          return `${prefix}${this.getDomainString(domain)}:${commandId}`;
        }
        return `${prefix}${commandId}`;
      case CommandType.SLASH:
        prefix = '/';
        return `${prefix}${commandId}`;
      default:
        return commandId;
    }
  }
  
  /**
   * 명령어와 인자를 조합하여 전체 명령어 문자열을 생성합니다.
   * @param commandId 명령어 ID
   * @param type 명령어 타입
   * @param domain 명령어 도메인 (에이전트 명령어인 경우만)
   * @param args 인자 배열
   * @param flags 플래그 객체
   * @param options 옵션 객체
   * @returns 전체 명령어 문자열
   */
  public formatCommandWithArgs(
    commandId: string, 
    type: CommandType, 
    domain?: CommandDomain,
    args: string[] = [], 
    flags: Record<string, string | boolean> = {},
    options: Record<string, any> = {}
  ): string {
    const command = this.formatCommand(commandId, type, domain);
    
    const parts: string[] = [command];
    
    
    args.forEach(arg => {
      
      if (arg.includes(' ')) {
        parts.push(`"${arg.replace(/"/g, '\\"')}"`);
      } else {
        parts.push(arg);
      }
    });
    
    
    Object.entries(flags).forEach(([key, value]) => {
      if (value === true) {
        parts.push(`--${key}`);
      } else {
        parts.push(`--${key}=${value}`);
      }
    });
    
    
    Object.entries(options).forEach(([key, value]) => {
      parts.push(`${key}=${value}`);
    });
    
    return parts.join(' ');
  }
}