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
  // 유사 명령어 추천 시 최소 유사도 (0-1 사이)
  private readonly SIMILARITY_THRESHOLD = 0.6;
  
  // 도메인 매핑 (문자열 -> CommandDomain)
  private readonly domainMap: Map<string, CommandDomain> = new Map([
    ['git', CommandDomain.GIT],
    ['doc', CommandDomain.DOC],
    ['jira', CommandDomain.JIRA],
    ['pocket', CommandDomain.POCKET],
    ['vault', CommandDomain.VAULT],
    ['rules', CommandDomain.RULES]
  ]);
  
  // 기본 도메인 명령어 목록 (추천용)
  private readonly commonCommands: Map<CommandDomain, string[]> = new Map([
    [CommandDomain.GIT, ['commit-message', 'summarize', 'explain-diff', 'review-pr', 'conflict-resolve']],
    [CommandDomain.DOC, ['add', 'search', 'list', 'delete', 'use']],
    [CommandDomain.JIRA, ['create', 'update', 'search', 'summarize']],
    [CommandDomain.POCKET, ['save', 'list', 'search', 'analyze']],
    [CommandDomain.VAULT, ['save', 'search', 'link', 'summarize']],
    [CommandDomain.RULES, ['enable', 'disable', 'create', 'list']]
  ]);
  
  // 기본 시스템 명령어 목록 (추천용)
  private readonly commonSystemCommands: string[] = [
    'help', 'clear', 'settings', 'model', 'debug'
  ];
  
  /**
   * 명령어 파싱
   * @param input 명령어 입력 문자열
   * @returns 파싱된 명령어 또는 null (명령어가 아닌 경우)
   */
  parse(input: string): Command | null {
    if (!input || !input.trim()) {
      return null;
    }
    
    const trimmed = input.trim();
    
    // 명령어 접두사 확인
    let prefix = CommandPrefix.NONE;
    let content = trimmed;
    let commandType = CommandType.NONE;
    let domain = CommandDomain.NONE;
    
    if (trimmed.startsWith('@')) {
      // '@' 명령어는 반드시 ':' 형식을 가져야 함 (도메인:명령)
      // ':' 없이 '@알려줘'와 같은 형식은 명령어가 아닌 일반 텍스트로 처리
      if (!trimmed.includes(':')) {
        // '@'로 시작하지만 ':' 없음 - 일반 텍스트로 처리
        return null;
      }
      
      prefix = CommandPrefix.AT;
      commandType = CommandType.AT;
      content = trimmed.substring(1);
      
      // 도메인 추출
      domain = this.extractDomain(trimmed);
    } else if (trimmed.startsWith('/')) {
      prefix = CommandPrefix.SLASH;
      commandType = CommandType.SLASH;
      content = trimmed.substring(1);
    } else {
      // 일반 텍스트는 명령어로 처리하지 않음
      return null;
    }
    
    // 토큰화
    const tokens = this.tokenize(content);
    
    if (tokens.length === 0) {
      return null;
    }
    
    // 에이전트 및 명령어 추출
    const [agentId, commandName, subCommand] = this.extractAgentAndCommand(tokens[0], commandType);
    
    // agentId가 없는 경우 명령어로 처리하지 않음
    if (!agentId || !commandName) {
      return null;
    }
    
    // 인자 및 플래그 추출
    const { args, flags, options } = this.extractArgsAndFlags(tokens.slice(1));
    
    return {
      prefix,
      type: commandType,
      domain,
      agentId,
      command: commandName,
      subCommand,
      args,
      flags,
      options,
      rawInput: trimmed
    };
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
    
    // 시스템 명령어 (/로 시작하는 경우)
    if (trimmed.startsWith('/')) {
      return true;
    }
    
    // 에이전트 명령어 (@로 시작하고 :을 포함하는 경우)
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
      args: [],
      flags: new Map<string, string | boolean>(),
      options: new Map<string, any>(),
      raw: input
    };
    
    if (!command) {
      // 명령어 형식이 아닌 경우 확인
      if (this.looksLikeCommand(input)) {
        // 명령어처럼 보이지만 파싱 실패
        result.hasError = true;
        result.errorMessage = '유효하지 않은 명령어 형식입니다.';
        result.suggestions = this.suggestSimilarCommands(input);
        return result;
      }
      
      // 일반 텍스트로 처리
      return result;
    }
    
    // Command를 ParsedCommand로 변환
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
      subCommand: command.subCommand,
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
    
    // 슬래시나 @ 기호로 시작하는 경우
    if (trimmed.startsWith('/') || trimmed.startsWith('@')) {
      return true;
    }
    
    // 콜론(:)이 포함된 경우
    if (trimmed.includes(':')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 입력 문자열에서 도메인 추출
   * @param input 입력 문자열
   * @returns 도메인 또는 null
   */
  public extractDomain(input: string): CommandDomain {
    if (!input || !input.includes(':')) {
      return CommandDomain.NONE;
    }
    
    // 입력에서 첫 번째 파트 추출 (접두사 제외)
    const cleanInput = input.startsWith('@') ? input.substring(1) : input;
    const domainPart = cleanInput.split(':')[0].toLowerCase().trim();
    
    // 도메인 맵에서 찾기
    return this.domainMap.get(domainPart) || CommandDomain.NONE;
  }
  
  /**
   * 에이전트/도메인 ID와 명령어 이름 추출
   * @param token 첫 번째 토큰
   * @param commandType 명령어 타입
   * @returns [에이전트 ID, 명령어 이름, 하위 명령어] 또는 잘못된 형식이면 [null, null, null]
   */
  private extractAgentAndCommand(token: string, commandType: CommandType): [string | null, string | null, string | null] {
    const parts = token.split(':');
    
    if (parts.length > 1) {
      // 도메인 기반 명령어 ('domain:command[:subcommand]' 형식)
      const agentId = parts[0].trim();
      
      // 명령어와 하위 명령어 처리
      let commandName = parts[1].trim();
      let subCommand = null;
      
      // 하위 명령어가 있는 경우 (domain:command:subcommand)
      if (parts.length > 2) {
        subCommand = parts.slice(2).join(':').trim();
      }
      
      // 빈 에이전트 ID 또는 명령어 체크
      if (!agentId || !commandName) {
        return [null, null, null];
      }
      
      return [agentId, commandName, subCommand];
    }
    
    // @ 명령어는 항상 ':' 형식이어야 함 (이미 상위 메서드에서 처리)
    // / 명령어는 기본 'core' 에이전트에 할당
    if (commandType === CommandType.SLASH) {
      return ['core', token, null];
    }
    
    return [null, null, null];
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
      
      // 이스케이프 처리
      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }
      
      // 이스케이프 문자
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if ((char === '"' || char === "'") && (!inQuote || quoteChar === char)) {
        if (inQuote) {
          // 따옴표 종료
          inQuote = false;
          quoteChar = '';
        } else {
          // 따옴표 시작
          inQuote = true;
          quoteChar = char;
        }
        continue;
      }
      
      if (char === ' ' && !inQuote) {
        // 공백 처리 (따옴표 밖에 있는 경우만)
        if (current) {
          tokens.push(current);
          current = '';
        }
        continue;
      }
      
      // 일반 문자
      current += char;
    }
    
    // 마지막 토큰 추가
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
      
      if (token.startsWith('--')) {
        // 플래그 (--key=value 또는 --flag)
        const flagParts = token.substring(2).split('=');
        const key = flagParts[0];
        
        if (flagParts.length > 1) {
          // --key=value 형식
          flags[key] = this.parseValue(flagParts.slice(1).join('='));
        } else {
          // --flag 형식 (불리언 플래그)
          flags[key] = true;
        }
      } else if (token.startsWith('-') && token.length === 2) {
        // 짧은 플래그 처리 (-f 또는 -f value)
        const flagName = token.substring(1);
        
        // 다음 요소가 있고 플래그나 명령어가 아닌 경우 값으로 처리
        if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
          flags[flagName] = this.parseValue(tokens[i + 1]);
          i++; // 다음 요소 건너뛰기
        } else {
          flags[flagName] = true;
        }
      } else if (token.includes('=') && !token.startsWith('-')) {
        // key=value 형식의 옵션
        const optionParts = token.split('=');
        const key = optionParts[0].trim();
        
        if (key && optionParts.length > 1) {
          options[key] = this.parseValue(optionParts.slice(1).join('='));
        }
      } else {
        // 일반 인자
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
    // 불리언 값 처리
    if (value.toLowerCase() === 'true') {
      return true;
    }
    
    if (value.toLowerCase() === 'false') {
      return false;
    }
    
    // 숫자 처리
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return Number(value);
    }
    
    // JSON 객체 처리 시도
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      try {
        return JSON.parse(value);
      } catch {
        // 파싱 실패 시 문자열로 처리
        return value;
      }
    }
    
    // 기본적으로 문자열 반환
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
    
    // 접두사 확인
    if (trimmedCommand.startsWith('@')) {
      // 에이전트 명령어 (@) 관련 추천
      const parts = trimmedCommand.substring(1).split(':');
      
      if (parts.length > 0) {
        const domainPart = parts[0].toLowerCase().trim();
        const commandPart = parts.length > 1 ? parts[1].toLowerCase().trim() : '';
        
        // 도메인 유사성 확인
        const domain = this.getSimilarDomain(domainPart);
        
        if (domain !== CommandDomain.NONE) {
          // 도메인 발견, 해당 도메인의 명령어 추천
          const commonDomainCommands = this.commonCommands.get(domain) || [];
          
          if (commandPart) {
            // 명령어도 입력된 경우 유사한 명령어 찾기
            const similarCommands = this.findSimilarCommands(commandPart, commonDomainCommands);
            
            for (const cmd of similarCommands) {
              suggestions.push(`@${this.getDomainString(domain)}:${cmd}`);
            }
          } else {
            // 명령어가 없는 경우 도메인의 모든 명령어 추천
            for (const cmd of commonDomainCommands) {
              suggestions.push(`@${this.getDomainString(domain)}:${cmd}`);
            }
          }
        } else {
          // 유사한 도메인 없음, 모든 도메인 추천
          for (const [domain, cmds] of this.commonCommands.entries()) {
            if (suggestions.length < 3) {
              // 대표 명령어 하나만 추천
              const cmd = cmds[0] || '';
              suggestions.push(`@${this.getDomainString(domain)}:${cmd}`);
            }
          }
        }
      }
    } else if (trimmedCommand.startsWith('/')) {
      // 시스템 명령어 (/) 관련 추천
      const commandPart = trimmedCommand.substring(1).toLowerCase().trim();
      
      if (commandPart) {
        // 유사한 시스템 명령어 찾기
        const similarCommands = this.findSimilarCommands(commandPart, this.commonSystemCommands);
        
        for (const cmd of similarCommands) {
          suggestions.push(`/${cmd}`);
        }
      } else {
        // 명령어가 없는 경우 모든 시스템 명령어 추천
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
    
    // 정확히 일치하는 경우 바로 반환
    if (this.domainMap.has(input)) {
      return this.domainMap.get(input)!;
    }
    
    // 유사도 검사
    let bestMatch: [string, number] = ['', 0];
    
    for (const [domainStr, _] of this.domainMap.entries()) {
      const similarity = this.calculateSimilarity(input, domainStr);
      
      if (similarity > this.SIMILARITY_THRESHOLD && similarity > bestMatch[1]) {
        bestMatch = [domainStr, similarity];
      }
    }
    
    return bestMatch[0] ? this.domainMap.get(bestMatch[0])! : CommandDomain.NONE;
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
    
    // 유사도 기준으로 정렬
    result.sort((a, b) => b[1] - a[1]);
    
    // 최대 3개만 반환
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
    
    // 두 문자열이 완전히 일치하면 1.0 반환
    if (longer === shorter) {
      return 1.0;
    }
    
    // 레벤슈타인 거리 계산
    const distance = this.levenshteinDistance(longer, shorter);
    
    // 유사도 계산 및 반환
    return (longer.length - distance) / longer.length;
  }
  
  /**
   * 레벤슈타인 거리 계산
   * @param str1 첫 번째 문자열
   * @param str2 두 번째 문자열
   * @returns 레벤슈타인 거리
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    const dp: number[][] = [];
    
    // 초기화
    for (let i = 0; i <= len1; i++) {
      dp[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
      dp[0][j] = j;
    }
    
    // 동적 프로그래밍 계산
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // 삭제
          dp[i][j - 1] + 1,      // 삽입
          dp[i - 1][j - 1] + cost // 교체
        );
      }
    }
    
    return dp[len1][len2];
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
        // 도메인이 있는 경우 포함
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
    
    // 인자 추가
    args.forEach(arg => {
      // 공백이 포함된 인자는 따옴표로 묶기
      if (arg.includes(' ')) {
        parts.push(`"${arg.replace(/"/g, '\\"')}"`);
      } else {
        parts.push(arg);
      }
    });
    
    // 플래그 추가
    Object.entries(flags).forEach(([key, value]) => {
      if (value === true) {
        parts.push(`--${key}`);
      } else {
        parts.push(`--${key}=${value}`);
      }
    });
    
    // 옵션 추가
    Object.entries(options).forEach(([key, value]) => {
      parts.push(`${key}=${value}`);
    });
    
    return parts.join(' ');
  }
}