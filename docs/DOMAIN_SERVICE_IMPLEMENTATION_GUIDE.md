# 도메인 서비스 구현 가이드

## 개요

APE 확장의 도메인 서비스는 명령 시스템을 통해 특정 도메인에 대한 기능을 제공합니다. 본 가이드는 Git, Jira, Pocket과 같은 도메인 서비스를 구현하는 방법을 설명합니다.

## 도메인 서비스 아키텍처

도메인 서비스는 다음과 같은 계층 구조로 구성됩니다:

1. **플러그인 서비스 (PluginService)**
   - 도메인 서비스의 주요 진입점 역할
   - 명령어 등록 및 실행 관리
   - 다른 하위 서비스 인스턴스화 및 조정

2. **클라이언트 서비스 (ClientService)**
   - 외부 API 또는 시스템과의 통신 담당
   - 원시 데이터 처리 및 기본 작업 수행
   - 오류 처리 및 재시도 로직 포함

3. **LLM 서비스 (LlmService)**
   - LLM을 활용한 고급 기능 제공
   - 명령어 결과를 분석하고 의미 있는 정보 추출
   - 자연어 명령어를 구조화된 명령어로 변환

4. **자연어 처리 서비스 (NaturalLanguageService)**
   - 자연어 입력을 도메인 특화 명령어로 변환
   - 명령어 추천 및 의도 파악
   - 복잡한 요청 해석 및 단순화

## 도메인 서비스 구현 절차

### 1. 기본 구조 설정

새로운 도메인 서비스를 위한 디렉토리 구조를 만듭니다:

```
src/plugins/internal/your-domain/
  ├── YourDomainPluginService.ts      # 메인 플러그인 서비스
  ├── YourDomainClientService.ts      # API 클라이언트 서비스
  ├── YourDomainLlmService.ts         # LLM 통합 서비스
  └── YourDomainNaturalLanguageService.ts  # 자연어 처리 서비스
```

### 2. 플러그인 서비스 구현

`YourDomainPluginService.ts`는 `PluginBaseService`를 확장하여 구현합니다:

```typescript
import { PluginBaseService } from '../../../core/plugin-system/PluginBaseService';
import { PluginCommand } from '../../../types/PluginTypes';
import { IConfigLoader } from '../../../types/ConfigTypes';
import { CommandType, CommandPrefix } from '../../../types/CommandTypes';
import { YourDomainClientService } from './YourDomainClientService';
import { YourDomainLlmService } from './YourDomainLlmService';

export class YourDomainPluginService extends PluginBaseService {
  // 필수 속성
  id = 'your-domain';
  name = '도메인 이름';
  
  // 서비스 인스턴스
  private client: YourDomainClientService;
  private llmService: YourDomainLlmService | null = null;
  
  constructor(configLoader: IConfigLoader) {
    super(configLoader);
    
    // 설정 로드
    const pluginConfig = this.loadConfig();
    this.config = pluginConfig;
    
    // 서비스 인스턴스 생성
    this.client = new YourDomainClientService();
    
    // 명령어 등록
    this.registerCommands();
    
    // LLM 서비스 초기화
    this.initLlmService();
  }
  
  // 설정 로드 메서드
  private loadConfig(): any {
    // 기본 설정
    const defaultConfig = {
      enabled: true,
      // 도메인별 설정...
    };
    
    try {
      // 설정 로더에서 설정 로드
      const config = this.configLoader.getConfig<any>() || {};
      const domainConfig = config.internalPlugins?.['your-domain'] || {};
      
      // 설정 병합
      return {
        ...defaultConfig,
        ...domainConfig
      };
    } catch (error) {
      console.error('설정 로드 중 오류 발생:', error);
      return defaultConfig;
    }
  }
  
  // LLM 서비스 초기화
  private async initLlmService(): Promise<void> {
    // LLM 서비스 초기화 로직
  }
  
  // 플러그인 초기화
  async initialize(): Promise<void> {
    // 초기화 로직
  }
  
  // 명령어 등록
  protected registerCommands(customCommands?: PluginCommand[]): boolean {
    this.commands = [
      // 명령어 정의
      {
        id: 'command1',
        name: 'command1',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '명령어 설명',
        syntax: '@your-domain:command1',
        examples: ['@your-domain:command1'],
        execute: async (args) => this.executeCommand1(args)
      },
      // 추가 명령어...
    ];
    return true;
  }
  
  // 명령어 실행 메서드
  private async executeCommand1(args: string[]): Promise<any> {
    // 명령어 구현
    try {
      // 클라이언트 서비스 호출
      const result = await this.client.someOperation();
      
      // 응답 포맷팅
      return {
        content: `# 결과 제목\n\n결과 내용...`,
        data: result,
        type: 'your-domain-command1'
      };
    } catch (error) {
      console.error('명령어 실행 중 오류 발생:', error);
      throw error;
    }
  }
}
```

### 3. 클라이언트 서비스 구현

`YourDomainClientService.ts`는 외부 API와의 통신을 담당합니다:

```typescript
export class YourDomainClientService {
  private apiUrl: string;
  private apiToken: string | undefined;
  
  constructor(config?: any) {
    this.apiUrl = config?.apiUrl || 'https://api.your-domain.com';
    this.apiToken = config?.apiToken;
  }
  
  // API 호출 메서드
  async callApi(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    try {
      // API 호출 구현
    } catch (error) {
      console.error(`API 호출 중 오류 발생 (${endpoint}):`, error);
      throw error;
    }
  }
  
  // 도메인별 작업 메서드
  async someOperation(): Promise<any> {
    // 특정 작업 구현
  }
}
```

### 4. LLM 서비스 구현

`YourDomainLlmService.ts`는 LLM을 활용한 고급 기능을 제공합니다:

```typescript
import { LlmService } from '../../../core/llm/LlmService';
import { YourDomainClientService } from './YourDomainClientService';

export class YourDomainLlmService {
  private llmService: LlmService;
  private client: YourDomainClientService;
  
  constructor(llmService: LlmService, client: YourDomainClientService) {
    this.llmService = llmService;
    this.client = client;
  }
  
  // LLM 기반 기능 메서드
  async analyzeWithLlm(data: any): Promise<string> {
    try {
      // 프롬프트 생성
      const prompt = `
      다음 데이터를 분석해주세요:
      ${JSON.stringify(data, null, 2)}
      
      분석 결과를 마크다운 형식으로 제공해주세요.
      `;
      
      // LLM 요청
      const result = await this.llmService.sendRequest({
        model: this.llmService.getDefaultModelId(),
        messages: [
          {
            role: 'system',
            content: '당신은 데이터 분석 전문가입니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });
      
      return result.content;
    } catch (error) {
      console.error('LLM 분석 중 오류 발생:', error);
      throw error;
    }
  }
}
```

### 5. 자연어 처리 서비스 구현

`YourDomainNaturalLanguageService.ts`는 자연어 입력을 처리합니다:

```typescript
import { LlmService } from '../../../core/llm/LlmService';
import { ILoggerService } from '../../../core/utils/LoggerService';

interface CommandConversion {
  command: string;
  args: string[];
  confidence: number;
  explanation: string;
  alternatives?: Array<{
    command: string;
    args: string[];
    confidence: number;
  }>;
}

export class YourDomainNaturalLanguageService {
  private llmService: LlmService;
  private logger: ILoggerService;
  
  // 명령어 패턴 정의
  private commandPatterns: Record<string, string[]> = {
    'command1': ['명령1', '작업1', '기능1'],
    'command2': ['명령2', '작업2', '기능2'],
    // 추가 패턴...
  };
  
  constructor(llmService: LlmService, logger: ILoggerService) {
    this.llmService = llmService;
    this.logger = logger;
  }
  
  // 자연어 명령 변환
  async convertNaturalCommand(naturalCommand: string): Promise<CommandConversion> {
    try {
      // 명령어 변환 로직 구현
    } catch (error) {
      this.logger.error(`자연어 명령 변환 중 오류 발생: ${error}`);
      
      // 오류 발생 시 기본 명령어로 처리
      return {
        command: 'command1',
        args: [],
        confidence: 0.5,
        explanation: '명령어 처리 중 오류가 발생하여 기본 명령어로 처리합니다.'
      };
    }
  }
}
```

### 6. 플러그인 등록

새로운 도메인 서비스를 확장 프로그램에 등록하려면 `ApeCoreService`의 `registerInternalPlugins` 메서드를 수정해야 합니다:

```typescript
// src/core/ApeCoreService.ts
private async registerInternalPlugins(): Promise<void> {
  try {
    // 기존 플러그인 등록...
    
    // 새로운 도메인 플러그인 등록
    const YourDomainPluginService = (await import('../plugins/internal/your-domain/YourDomainPluginService')).YourDomainPluginService;
    const yourDomainPlugin = new YourDomainPluginService(this._configService);
    if (this._pluginRegistry.registerPlugin(yourDomainPlugin, 'internal')) {
      this._logger.info(`도메인 플러그인 등록 성공: ${yourDomainPlugin.name} (${yourDomainPlugin.id})`);
    }
  } catch (error) {
    this._logger.error('내부 플러그인 등록 중 오류 발생:', error);
  }
}
```

## 명령 시스템 통합

도메인 서비스는 명령 시스템과 자동으로 통합됩니다. 플러그인 등록 시 다음과 같은 프로세스가 진행됩니다:

1. `PluginRegistryService`가 플러그인을 등록하고 `plugin-registered` 이벤트를 발생시킵니다.
2. `CommandRegistryService`는 이 이벤트를 감지하고 `refreshCommands()`를 호출합니다.
3. `refreshCommands()`는 모든 활성화된 플러그인에서 명령어를 수집하고 등록합니다.
4. 각 명령어는 해당 도메인 및 명령 ID와 연결되어 `CommandExecutorService`에서 실행할 수 있게 됩니다.

## 도메인 서비스 구현 모범 사례

1. **단일 책임 원칙 준수**
   - 각 서비스 클래스는 명확한 단일 책임을 가져야 합니다.
   - `ClientService`는 API 통신만, `LlmService`는 LLM 기능만 담당하도록 구성합니다.

2. **구성 가능한 설정**
   - 모든 중요한 값은 하드코딩하지 않고 설정으로 관리합니다.
   - 사용자가 설정을 통해 동작을 조정할 수 있도록 합니다.

3. **견고한 오류 처리**
   - 모든 API 호출과 작업에 대해 적절한 오류 처리를 구현합니다.
   - 오류 발생 시 사용자에게 명확한 피드백을 제공합니다.

4. **일관된 응답 포맷**
   - 모든 명령어 응답은 일관된 형식을 사용합니다.
   - `content` (마크다운 형식의 사용자용 출력), `data` (구조화된 데이터), `type` (응답 유형)을 포함해야 합니다.

5. **성능 최적화**
   - 무거운 작업은 비동기로 처리합니다.
   - 캐싱을 적용하여 반복적인 API 호출을 최소화합니다.

## 테스트 방법

도메인 서비스는 다음과 같은 방법으로 테스트할 수 있습니다:

1. **단위 테스트**
   - 각 서비스 클래스의 메서드에 대한 단위 테스트 작성
   - 외부 의존성은 모킹하여 테스트

2. **통합 테스트**
   - 플러그인 서비스와 명령 시스템의 통합 테스트
   - 실제 명령어 실행을 통한 기능 검증

3. **수동 테스트**
   - VS Code 확장 프로그램으로 빌드하여 실제 환경에서 테스트
   - 명령어 실행 및 결과 확인

## 결론

도메인 서비스는 APE 확장의 핵심 기능을 제공하는 중요한 구성 요소입니다. 이 가이드를 따라 새로운 도메인 서비스를 구현하면 확장의 기능을 쉽게 확장할 수 있습니다. 각 서비스는 단일 책임을 가지며, 플러그인 시스템과 명령 시스템을 통해 확장 프로그램과 통합됩니다.