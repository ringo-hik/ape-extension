# APE 구현 가이드

## 개요

이 문서는 APE(Agentic Pipeline Engine) 확장의 구현 세부 사항과 개발자 가이드를 제공합니다. 핵심 아키텍처, 코드 구조, 개발 관례 및 구현 패턴에 대한 정보를 담고 있습니다.

## 핵심 컴포넌트

### ApeCoreService

APE의 중앙 서비스로, 모든 주요 기능을 통합하고 관리합니다. 싱글톤 패턴으로 구현되어 있습니다.

```typescript
// 싱글톤 인스턴스 얻기
const coreService = ApeCoreService.getInstance(context);

// 주요 기능 접근
const llmService = coreService.llmService;
const configService = coreService.configService;
const pluginRegistry = coreService.pluginRegistry;
```

#### 주요 책임

- 모든 서비스 초기화 및 관리
- 메시지 처리 및 명령어 실행
- LLM 응답 생성 (스트리밍 및 일반 모드)
- 컨텍스트 정보 수집

### 명령어 시스템

명령어 파싱, 등록 및 실행을 처리하는 서비스들입니다.

- **CommandParserService**: 사용자 입력에서 명령어 구문 분석
- **CommandRegistryService**: 명령어 등록 및 검색
- **CommandExecutorService**: 명령어 실행

```typescript
// 명령어 파싱
const command = commandParser.parse(text);

// 명령어 실행
const result = await commandExecutor.execute(command);
```

### 플러그인 시스템

외부 시스템과의 통합을 위한 플러그인 아키텍처입니다.

- **PluginRegistryService**: 플러그인 등록 및 검색
- **PluginBaseService**: 모든 플러그인의 기본 클래스
- **내부 플러그인**: Git, Jira, SWDP 등

```typescript
// 플러그인 등록
pluginRegistry.registerPlugin(plugin, 'internal');

// 플러그인 검색
const gitPlugin = pluginRegistry.getPlugin('git');
```

### UI 서비스

사용자 인터페이스 관련 컴포넌트입니다.

- **ApeChatViewProvider**: 채팅 웹뷰 UI 관리
- **VSCodeService**: VS Code API와의 상호작용

## 설정 관리

설정은 `ape.core.*` 및 `ape.llm.*` 네임스페이스 아래에 구성됩니다.

```typescript
// 설정 가져오기
const config = vscode.workspace.getConfiguration('ape.core');
const logLevel = config.get('logLevel', 'info');

// 설정 업데이트
config.update('embedDevMode', true, vscode.ConfigurationTarget.Global);
```

### 주요 설정 항목

- `ape.core.logLevel`: 로그 레벨 (debug, info, warn, error)
- `ape.core.sslBypass`: SSL 인증서 검증 우회 여부
- `ape.core.embedDevMode`: 심층 분석 모드 활성화 여부
- `ape.llm.defaultModel`: 기본 LLM 모델
- `ape.llm.models`: LLM 모델 설정

## 웹뷰 UI 구현

웹뷰는 HTML, CSS, JavaScript를 사용하여 구현됩니다.

```typescript
// 웹뷰 제공자 등록
context.subscriptions.push(
  vscode.window.registerWebviewViewProvider(
    'ape.chatView', 
    chatProvider,
    { webviewOptions: { retainContextWhenHidden: true } }
  )
);
```

### 메시지 전송 및 수신

```typescript
// 웹뷰에 메시지 전송
webviewView.webview.postMessage({
  command: 'addMessage',
  type: 'assistant',
  content: text
});

// 웹뷰에서 메시지 수신
webviewView.webview.onDidReceiveMessage(message => {
  switch (message.command) {
    case 'sendMessage':
      // 메시지 처리
      break;
  }
});
```

## LLM 통합

다양한 LLM 모델과 통합하는 방법입니다.

```typescript
// LLM 요청 보내기
const response = await llmService.sendRequest({
  model: modelId,
  messages: messages,
  temperature: 0.7,
  stream: true,
  onUpdate: handleStreamUpdate
});
```

### 지원되는 모델 제공자

- OpenAI
- Anthropic
- Microsoft Azure
- OpenRouter
- Ollama (로컬 모델)
- 커스텀 API 엔드포인트

## 명령어 개발

새로운 명령어를 구현하는 방법입니다.

```typescript
// 명령어 등록
commandRegistry.registerCommand({
  prefix: '@',
  agentId: 'example',
  command: 'hello',
  handler: async (args) => {
    return { content: 'Hello, world!' };
  },
  description: '예제 명령어',
  usage: '@example:hello [name]'
});
```

## 플러그인 개발

새로운 플러그인을 구현하는 방법입니다.

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
      {
        prefix: '@',
        agentId: this.id,
        command: 'hello',
        handler: this.handleHello.bind(this),
        description: '예제 명령어',
        usage: `@${this.id}:hello [name]`
      }
    ];
  }
  
  private async handleHello(args: string): Promise<any> {
    const name = args.trim() || 'World';
    return { content: `Hello, ${name}!` };
  }
}
```

## 심층 분석 모드

고급 프롬프트 엔지니어링 및 내부 데이터 접근을 통한 디버깅 및 리팩토링 지원입니다.

```typescript
// 심층 분석 모드 활성화 여부 확인
const embedDevMode = configService.get('core.embedDevMode', false);

// 심층 분석 모드에서 프롬프트 향상
if (embedDevMode) {
  // 시스템 프롬프트 강화
  const enhancedPrompt = originalPrompt + '\n\n고급 심층 분석 모드 활성화';
}
```

## 스트리밍 응답 처리

LLM의 스트리밍 응답을 처리하는 방법입니다.

```typescript
// 스트리밍 핸들러
const streamHandler = (chunk: string) => {
  // 청크 처리
  webviewView.webview.postMessage({
    command: 'appendStreamChunk',
    responseId: responseId,
    content: chunk
  });
};

// 스트리밍 요청
await llmService.sendRequest({
  model: modelId,
  messages: messages,
  stream: true,
  onUpdate: streamHandler
});
```

## 테스트 및 디버깅

테스트 및 디버깅을 위한 도구와 기법입니다.

```typescript
// 디버그 명령어
vscode.commands.registerCommand('ape.debug', () => {
  // 디버그 정보 출력
  const models = llmService.getAvailableModels();
  console.log(`사용 가능한 모델 수: ${models.length}`);
});
```

## 빌드 프로세스

APE를 빌드하고 패키징하는 방법입니다.

```bash
# 개발 빌드
npm run build

# 프로덕션 빌드
npm run package

# 개발 중 파일 변경 감지
npm run watch
```

## 모범 사례

- **단일 책임 원칙**: 각 클래스와 모듈은 하나의 책임만 가지도록 구현
- **의존성 주입**: 직접 인스턴스화보다는 의존성 주입을 통한 결합도 감소
- **비동기 처리**: Promise 및 async/await를 사용한 명확한 비동기 코드 작성
- **오류 처리**: try-catch 블록을 사용한 철저한 오류 처리
- **설정 검증**: 사용자 설정 값 사용 전 유효성 검증
- **모듈화**: 기능별 명확한 모듈 분리
- **인터페이스 기반 설계**: 구현보다 인터페이스에 의존