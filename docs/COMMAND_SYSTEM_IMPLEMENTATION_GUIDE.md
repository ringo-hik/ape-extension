# 명령어 시스템 구현 가이드

## 1. 개요

이 문서는 APE 확장 프로그램의 명령어 시스템 구현에 대한 상세한 가이드를 제공합니다. 개발자가 명령어 시스템을 이해하고 확장할 수 있도록 아키텍처, 핵심 컴포넌트, 확장 방법을 설명합니다.

## 2. 명령어 시스템 아키텍처

APE 명령어 시스템은 다음과 같은 핵심 컴포넌트로 구성됩니다:

```
[사용자 입력]
      ↓
[CommandParserService] --- 명령어 파싱 및 분석
      ↓
[CommandRegistryService] --- 명령어 등록 및 관리
      ↓
[CommandExecutorService] --- 명령어 실행 및 결과 처리
      ↓
[결과 표시]
```

### 2.1 주요 서비스 개요

- **CommandParserService**: 텍스트 입력을 구조화된 명령어 객체로 파싱
- **CommandRegistryService**: 명령어 핸들러 및 사용법 등록/관리
- **CommandExecutorService**: 명령어 실행 및 결과 처리

### 2.2 데이터 흐름

1. 사용자가 명령어 입력 (`/help` 또는 `@git:status` 등)
2. CommandParserService가 입력을 파싱하여 Command 객체 생성
3. CommandExecutorService가 CommandRegistryService에서 적절한 핸들러 조회
4. 명령어 실행 및 결과 처리 (표준화된 CommandResult 반환)
5. UI에 결과 표시

## 3. 핵심 타입 정의 (CommandTypes.ts)

### 3.1 주요 열거형

```typescript
// 명령어 접두사 열거형
export enum CommandPrefix {
  NONE = '',
  AT = '@',
  SLASH = '/'
}

// 명령어 유형 열거형
export enum CommandType {
  NONE = 'none',
  AT = 'at',
  SLASH = 'slash'
}

// 명령어 도메인 열거형
export enum CommandDomain {
  NONE = 'none',
  GIT = 'git',
  DOC = 'doc',
  JIRA = 'jira',
  POCKET = 'pocket',
  VAULT = 'vault',
  RULES = 'rules'
}
```

### 3.2 주요 인터페이스

```typescript
// 명령어 객체 인터페이스
export interface Command {
  prefix: CommandPrefix;
  type: CommandType;
  domain: CommandDomain;
  agentId: string;
  command: string;
  subCommand?: string;
  args: any[];
  flags: Record<string, any>;
  options: Record<string, any>;
  rawInput: string;
}

// 명령어 결과 인터페이스
export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: Error | string;
  displayMode?: 'text' | 'markdown' | 'json' | 'html' | 'none';
  suggestedNextCommands?: string[];
}

// 명령어 핸들러 타입
export type CommandHandler = (
  args: any[], 
  flags: Record<string, any>, 
  options?: Record<string, any>
) => Promise<CommandResult>;
```

## 4. 명령어 파서 (CommandParserService)

### 4.1 책임과 기능

- 텍스트 입력을 Command 객체로 파싱
- 명령어 유효성 검사
- 접두사, 도메인, 명령어, 인자, 플래그 추출
- 유사 명령어 제안 (오타 교정)

### 4.2 주요 메서드

```typescript
// 명령어 파싱
parse(input: string): Command | null

// 상세 파싱 (오타 감지, 제안 포함)
parseWithSuggestions(input: string): ParsedCommand

// 명령어 여부 확인
isCommand(input: string): boolean

// 도메인 추출
extractDomain(input: string): CommandDomain | null

// 유사 명령어 제안
suggestSimilarCommands(command: string): string[]
```

### 4.3 구현 예시

```typescript
public parseWithSuggestions(input: string): ParsedCommand {
  try {
    // 입력 전처리
    const trimmedInput = input.trim();
    
    // 접두사 확인
    let prefix = CommandPrefix.NONE;
    let type = CommandType.NONE;
    let domain = CommandDomain.NONE;
    
    if (trimmedInput.startsWith('@')) {
      prefix = CommandPrefix.AT;
      type = CommandType.AT;
      
      // 도메인 추출
      domain = this.extractDomain(trimmedInput) || CommandDomain.NONE;
    } else if (trimmedInput.startsWith('/')) {
      prefix = CommandPrefix.SLASH;
      type = CommandType.SLASH;
    } else {
      // 명령어가 아님
      return {
        prefix: CommandPrefix.NONE,
        type: CommandType.NONE,
        domain: CommandDomain.NONE,
        command: '',
        args: [],
        flags: new Map(),
        options: new Map(),
        raw: trimmedInput,
        hasError: true,
        errorMessage: '명령어는 @ 또는 / 접두사로 시작해야 합니다.'
      };
    }
    
    // 명령어 파싱 로직...
    
  } catch (error) {
    // 오류 처리...
  }
}
```

## 5. 명령어 레지스트리 (CommandRegistryService)

### 5.1 책임과 기능

- 명령어 핸들러 등록 및 관리
- 도메인별 명령어 관리
- 명령어 사용법 저장 및 조회
- 컨텍스트 기반 명령어 생성

### 5.2 주요 메서드

```typescript
// 에이전트 명령어 등록 (도메인 기반)
registerAgentCommand(
  domain: CommandDomain,
  command: string,
  handler: CommandHandler,
  usage?: Partial<CommandUsage>
): boolean

// 시스템 명령어 등록
registerSystemCommand(
  command: string,
  handler: CommandHandler,
  usage?: Partial<CommandUsage>
): boolean

// 도메인 핸들러 조회
getDomainHandler(domain: CommandDomain, command: string): CommandHandler | undefined

// 도메인 명령어 사용법 조회
getDomainUsage(domain: CommandDomain, command: string): CommandUsage | undefined

// 도메인의 모든 명령어 조회
getDomainCommands(domain: CommandDomain): CommandUsage[]

// 컨텍스트 기반 명령어 생성
generateContextualCommand(domain: CommandDomain, context: Record<string, any>): string | null
```

### 5.3 데이터 구조

```typescript
// 명령어 핸들러 맵 (에이전트 ID => 명령어 => 핸들러)
private _handlers: Map<string, Map<string, CommandHandler>>

// 도메인 기반 명령어 핸들러 맵 (도메인 => 명령어 => 핸들러)
private _domainHandlers: Map<CommandDomain, Map<string, CommandHandler>>

// 명령어 사용법 맵 (에이전트 ID => 명령어 => 사용법)
private _usages: Map<string, Map<string, CommandUsage>>

// 도메인 기반 명령어 사용법 맵 (도메인 => 명령어 => 사용법)
private _domainUsages: Map<CommandDomain, Map<string, CommandUsage>>

// 컨텍스트 캐시
private _contextCache: Record<string, any>
```

### 5.4 구현 예시

```typescript
public registerAgentCommand(
  domain: CommandDomain,
  command: string,
  handler: CommandHandler,
  usage?: Partial<CommandUsage>
): boolean {
  try {
    // 도메인 맵 생성 (없는 경우)
    if (!this._domainHandlers.has(domain)) {
      this._domainHandlers.set(domain, new Map());
    }
    
    const domainCommands = this._domainHandlers.get(domain)!;
    
    // 명령어 핸들러 등록
    domainCommands.set(command, handler);
    
    // 사용법 정보 등록
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
```

## 6. 명령어 실행기 (CommandExecutorService)

### 6.1 책임과 기능

- 명령어 실행 및 결과 처리
- 도메인 기반 명령어 라우팅
- 비동기 취소 기능
- 실행 이력 관리

### 6.2 주요 메서드

```typescript
// 명령어 실행
execute(command: Command): Promise<CommandResult>

// 문자열 명령어 실행
executeFromString(
  commandString: string, 
  args?: any[], 
  flags?: Record<string, any>
): Promise<CommandResult>

// 실행 이력 조회
getExecutionHistory(limit?: number): Array<{
  command: Command, 
  result: CommandResult, 
  timestamp: number
}>

// 명령어 취소
cancel(commandId: string): boolean
```

### 6.3 데이터 구조

```typescript
// 실행 이력 저장소
private executionHistory: Array<{
  command: Command;
  result: CommandResult;
  timestamp: number;
  id: string;
}>

// 실행 중인 명령어 맵
private pendingCommands: Map<string, { 
  command: Command, 
  cancel: () => void,
  timestamp: number
}>
```

### 6.4 구현 예시

```typescript
public async execute(command: Command): Promise<CommandResult> {
  // 명령어 ID 생성
  const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    // 취소 가능한 작업으로 등록
    const cancelController = new AbortController();
    const signal = cancelController.signal;
    
    this.pendingCommands.set(commandId, {
      command,
      cancel: () => cancelController.abort(),
      timestamp: Date.now()
    });
    
    // 명령어 실행 (도메인별 또는 기존 방식)
    let result: CommandResult;
    
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
          return { success: false, error: `지원하지 않는 명령어 접두사` };
      }
    }
    
    // 결과 처리 및 반환
    return this.normalizeResult(result);
    
  } catch (error) {
    // 오류 처리...
  }
}
```

## 7. 명령어 시스템 확장 방법

### 7.1 새 도메인 추가

새로운 도메인을 추가하려면 다음 단계를 따릅니다:

1. `CommandDomain` 열거형에 새 도메인 추가
   ```typescript
   export enum CommandDomain {
     // 기존 도메인...
     NEW_DOMAIN = 'new-domain'
   }
   ```

2. 도메인 명령어 등록
   ```typescript
   commandRegistry.registerAgentCommand(
     CommandDomain.NEW_DOMAIN,
     'command-name',
     async (args, flags) => {
       // 명령어 구현
       return {
         success: true,
         message: '명령어 실행 완료',
         displayMode: 'text'
       };
     },
     {
       description: '명령어 설명',
       examples: ['@new-domain:command-name arg1 --flag1']
     }
   );
   ```

### 7.2 명령어 파서 확장

명령어 파서를 확장하여 새로운 구문을 지원할 수 있습니다:

```typescript
// 파서 서비스 확장
class ExtendedCommandParserService extends CommandParserService {
  // 새로운 구문 분석 메서드 추가
  public parseSpecialSyntax(input: string): ParsedCommand {
    // 구현...
  }
  
  // 기존 메서드 오버라이드
  @override
  public parseWithSuggestions(input: string): ParsedCommand {
    // 특수 구문 확인
    if (this.isSpecialSyntax(input)) {
      return this.parseSpecialSyntax(input);
    }
    
    // 기본 구문 분석
    return super.parseWithSuggestions(input);
  }
}
```

### 7.3 컨텍스트 인식 명령어 추가

컨텍스트 기반으로 명령어를 생성하려면:

```typescript
// 컨텍스트 정보 업데이트
commandRegistry.addContext('gitRepo', { branch: 'main', repoPath: '/path/to/repo' });

// 컨텍스트 기반 명령어 생성 메서드 확장
commandRegistry.generateContextualCommand = (domain, context) => {
  switch (domain) {
    case CommandDomain.GIT:
      if (context.gitRepo) {
        return `@git:checkout ${context.gitRepo.branch}`;
      }
      break;
    // 다른 도메인 처리...
  }
  return null;
};
```

## 8. 명령어 시스템 이벤트

CommandRegistryService와 CommandExecutorService는 다음과 같은 이벤트를 발생시킵니다:

```typescript
// 명령어 등록 이벤트
commandRegistry.on('command-registered', ({ agentId, command }) => {
  console.log(`명령어 등록됨: ${agentId}:${command}`);
});

// 에이전트 명령어 등록 이벤트
commandRegistry.on('agent-command-registered', ({ domain, command }) => {
  console.log(`에이전트 명령어 등록됨: ${domain}:${command}`);
});

// 명령어 변경 이벤트
commandRegistry.on('commands-changed', () => {
  console.log('명령어 목록이 변경됨');
});

// 명령어 실행 이벤트
commandExecutor.on('command-executed', ({ command, result, executionTime }) => {
  console.log(`명령어 실행됨: ${command.rawInput} (${executionTime}ms)`);
});
```

## 9. 테스트 및 디버깅

### 9.1 단위 테스트

명령어 시스템의 각 컴포넌트를 테스트하는 방법:

```typescript
describe('CommandParserService', () => {
  let parser: CommandParserService;
  
  beforeEach(() => {
    parser = new CommandParserService();
  });
  
  test('should parse slash command correctly', () => {
    const result = parser.parse('/help');
    expect(result).toEqual({
      prefix: CommandPrefix.SLASH,
      type: CommandType.SLASH,
      domain: CommandDomain.NONE,
      agentId: 'core',
      command: 'help',
      args: [],
      flags: {},
      options: {},
      rawInput: '/help'
    });
  });
  
  // 다른 테스트 케이스...
});
```

### 9.2 통합 테스트

명령어 시스템의 전체 흐름을 테스트하는 방법:

```typescript
describe('Command System Integration', () => {
  let registry: CommandRegistryService;
  let executor: CommandExecutorService;
  
  beforeEach(() => {
    registry = new CommandRegistryService();
    executor = new CommandExecutorService(registry);
    
    // 테스트 명령어 등록
    registry.registerSystemCommand('test', async (args) => {
      return { success: true, message: `Test with args: ${args.join(', ')}` };
    });
  });
  
  test('should execute command from string input', async () => {
    const result = await executor.executeFromString('/test arg1 arg2');
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('Test with args: arg1, arg2');
  });
  
  // 다른 테스트 케이스...
});
```

## 10. 성능 최적화

명령어 시스템의 성능을 최적화하는 방법:

1. 명령어 캐싱
   ```typescript
   // 자주 사용하는 명령어 캐싱
   private _commandCache: Map<string, ParsedCommand> = new Map();
   
   public parse(input: string): ParsedCommand {
     // 캐시 확인
     if (this._commandCache.has(input)) {
       return this._commandCache.get(input)!;
     }
     
     // 파싱 로직
     const result = this._parseInternal(input);
     
     // 캐시 저장 (최대 100개까지)
     if (this._commandCache.size > 100) {
       // LRU 방식으로 가장 오래된 항목 제거
       const oldestKey = this._commandCache.keys().next().value;
       this._commandCache.delete(oldestKey);
     }
     this._commandCache.set(input, result);
     
     return result;
   }
   ```

2. 비동기 처리
   ```typescript
   // 무거운 명령어 비동기 처리
   public async executeHeavyCommand(command: Command): Promise<CommandResult> {
     return new Promise((resolve) => {
       setTimeout(() => {
         // 백그라운드에서 실행
         const result = this._executeHeavyTask(command);
         resolve(result);
       }, 0);
     });
   }
   ```

## 11. 보안 고려사항

명령어 시스템의 보안을 고려할 때 다음 사항을 유의하세요:

1. 입력 검증
   ```typescript
   // 사용자 입력 검증
   private validateInput(input: string): boolean {
     // 위험한 문자 패턴 확인
     const dangerousPatterns = [/rm -rf/, /;\s*rm/, />\s*\/dev\/null/];
     
     for (const pattern of dangerousPatterns) {
       if (pattern.test(input)) {
         return false;
       }
     }
     
     return true;
   }
   ```

2. 권한 확인
   ```typescript
   // 명령어 실행 전 권한 확인
   private checkPermission(command: Command): boolean {
     // 시스템 명령어는 추가 권한 확인
     if (command.domain === CommandDomain.SYSTEM) {
       return this.userHasSystemPermission();
     }
     
     return true;
   }
   ```

## 12. 결론

APE 명령어 시스템은 확장성과 유연성을 염두에 두고 설계되었습니다. 이 가이드가 개발자가 시스템을 이해하고 활용하는 데 도움이 되기를 바랍니다.

추가 참고자료:
- [명령어 시스템 통합 가이드](COMMAND_SYSTEM_INTEGRATION_GUIDE.md)
- [명령어 시스템 사용 예제](COMMAND_SYSTEM_EXAMPLE.md)
- [명령어 시스템 개선 요약](COMMAND_SYSTEM_SUMMARY.md)