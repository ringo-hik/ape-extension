# APE 플러그인 시스템

## 개요

APE(Agentic Pipeline Engine)의 플러그인 시스템은 확장성과 기능 확장을 위한 핵심 아키텍처입니다. 이 문서는 플러그인 시스템의 설계, 구현, 사용 방법에 대해 설명합니다.

## 플러그인 아키텍처

APE의 플러그인 아키텍처는 두 가지 유형의 플러그인을 지원합니다:

1. **내부 플러그인**: APE 코드베이스 내에 있는 기본 제공 플러그인
2. **외부 플러그인**: 설정을 통해 정의되고 동적으로 로드되는 플러그인

### 핵심 컴포넌트

- **PluginBaseService**: 모든 플러그인이 구현해야 하는 기본 클래스
- **PluginRegistryService**: 플러그인 등록, 검색 및 관리
- **내부 플러그인 구현**: Git, Jira, SWDP 등
- **외부 플러그인 로더**: 동적 플러그인 로딩 메커니즘

## 내부 플러그인

### GitPluginService

Git 버전 관리 시스템과의 통합을 제공합니다.

#### 주요 기능
- 현재 저장소 상태 확인
- 커밋, 푸시, 풀 등의 Git 작업 수행
- 브랜치 관리 및 PR 생성

#### 명령어
- `@git:status`: Git 상태 확인
- `@git:commit`: 변경 사항 커밋
- `@git:push`: 변경 사항 푸시
- `@git:branch`: 브랜치 관리
- `@git:pr`: PR 생성

### JiraPluginService

Atlassian Jira와의 통합을 제공합니다.

#### 주요 기능
- Jira 이슈 생성, 조회, 수정
- 이슈 검색 및 필터링
- 이슈 담당자 및 상태 관리

#### 명령어
- `@jira:issue`: 이슈 생성 및 조회
- `@jira:search`: 이슈 검색
- `@jira:assign`: 이슈 담당자 변경
- `@jira:status`: 이슈 상태 변경

### SwdpPluginService

SWDP 빌드 및 배포 파이프라인과의 통합을 제공합니다.

#### 주요 기능
- 빌드 파이프라인 실행
- 배포 관리
- 빌드 상태 모니터링

#### 명령어
- `@swdp:build`: 빌드 실행
- `@swdp:status`: 빌드 상태 확인
- `@swdp:deploy`: 배포 시작
- `@swdp:logs`: 빌드 로그 확인

## 플러그인 개발 가이드

### 내부 플러그인 개발

새로운 내부 플러그인을 개발하려면 다음 단계를 따르세요:

1. **클래스 생성**: PluginBaseService를 상속하는 새 클래스 생성

```typescript
export class ExamplePluginService extends PluginBaseService {
  public readonly id = 'example';
  public readonly name = 'Example Plugin';
  
  constructor(private configService: ConfigService) {
    super();
  }
  
  public initialize(): Promise<boolean> {
    // 플러그인 초기화 로직
    return Promise.resolve(true);
  }
  
  public getCommands(): Command[] {
    return [
      // 플러그인 명령어 정의
    ];
  }
}
```

2. **명령어 핸들러 구현**

```typescript
private async handleExample(args: string): Promise<any> {
  // 명령어 처리 로직
  return { content: 'Example command executed!' };
}
```

3. **명령어 등록**

```typescript
public getCommands(): Command[] {
  return [
    {
      prefix: '@',
      agentId: this.id,
      command: 'example',
      handler: this.handleExample.bind(this),
      description: '예제 명령어',
      usage: `@${this.id}:example [args]`
    }
  ];
}
```

4. **플러그인 등록**

```typescript
// ApeCoreService.ts 또는 플러그인 로더에서
const examplePlugin = new ExamplePluginService(this._configService);
this._pluginRegistry.registerPlugin(examplePlugin, 'internal');
```

### 외부 플러그인 개발

외부 플러그인은 settings.json을 통해 정의됩니다:

```json
"ape.plugins": {
  "custom-plugin": {
    "name": "Custom Plugin",
    "description": "사용자 정의 플러그인 예제",
    "enabled": true,
    "commands": [
      {
        "name": "hello",
        "description": "인사말 출력",
        "syntax": "@custom-plugin:hello [name]",
        "examples": ["@custom-plugin:hello World"],
        "api": {
          "endpoint": "https://api.example.com/hello",
          "method": "POST",
          "headers": {
            "Content-Type": "application/json"
          }
        }
      }
    ]
  }
}
```

## 플러그인 API 인터페이스

### PluginBaseService 인터페이스

```typescript
export abstract class PluginBaseService {
  abstract readonly id: string;
  abstract readonly name: string;
  
  // 선택적 속성
  description?: string;
  version?: string;
  author?: string;
  
  // 필수 메서드
  abstract initialize(): Promise<boolean>;
  abstract getCommands(): Command[];
  
  // 선택적 메서드
  shutdown?(): Promise<void>;
  getStatus?(): PluginStatus;
  getCapabilities?(): string[];
}
```

### Command 인터페이스

```typescript
export interface Command {
  prefix: string;          // '@' 또는 '/'
  agentId: string;         // 플러그인 ID
  command: string;         // 명령어 이름
  handler: CommandHandler; // 명령어 처리 함수
  description?: string;    // 명령어 설명
  usage?: string;          // 사용법
  examples?: string[];     // 예제
}

export type CommandHandler = (args: string) => Promise<any>;
```

## 플러그인 생명주기

1. **등록**: 플러그인을 레지스트리에 등록
2. **초기화**: 플러그인의 initialize() 메서드 호출
3. **활성화**: 플러그인의 명령어를 명령어 레지스트리에 등록
4. **사용**: 사용자가 명령어를 통해 플러그인 기능 사용
5. **종료**: 필요한 경우 shutdown() 메서드 호출

## 오류 처리

플러그인은 다음과 같은 오류 처리 방식을 따라야 합니다:

1. **초기화 오류**: initialize() 메서드에서 false 반환 또는 예외 throw
2. **명령어 실행 오류**: 오류 객체 또는 오류 메시지 포함한 객체 반환
3. **비동기 오류**: Promise rejection을 통한 오류 전파

```typescript
// 오류 처리 예시
try {
  // 플러그인 로직
} catch (error) {
  return {
    error: true,
    content: `오류가 발생했습니다: ${error.message}`
  };
}
```

## 설정 및 상태 관리

플러그인은 ConfigService를 통해 설정에 접근할 수 있습니다:

```typescript
// 플러그인 내에서 설정 접근
const apiKey = this.configService.get(`plugins.${this.id}.apiKey`, '');
```

상태 관리를 위해 플러그인은 내부 상태를 유지할 수 있습니다:

```typescript
export class ExamplePluginService extends PluginBaseService {
  private _state: {
    isConnected: boolean;
    lastRequestTime: number;
  } = {
    isConnected: false,
    lastRequestTime: 0
  };
  
  // 상태 getter
  public getStatus(): PluginStatus {
    return {
      id: this.id,
      state: this._state.isConnected ? 'connected' : 'disconnected',
      lastActivity: this._state.lastRequestTime
    };
  }
}
```

## 통합 및 인증

외부 서비스와의 통합을 위해 플러그인은 다양한 인증 방법을 지원합니다:

1. **API 키**: 설정에서 API 키를 읽어 요청 헤더에 포함
2. **OAuth**: 필요한 경우 OAuth 인증 흐름 구현
3. **기본 인증**: 사용자 이름/비밀번호 기반 인증

```typescript
// API 키 인증 예시
const apiKey = this.configService.get(`plugins.${this.id}.apiKey`, '');
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});
```

## 보안 고려사항

- **민감한 정보**: API 키, 토큰, 비밀번호는 안전하게 저장하고 로그에 노출하지 않음
- **입력 검증**: 모든 사용자 입력 검증
- **오류 메시지**: 민감한 정보가 포함된 오류 메시지 노출 방지
- **권한 확인**: 작업 수행 전 사용자 권한 확인