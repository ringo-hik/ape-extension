# 플러그인 자연어 처리 시스템

이 문서는 APE 확장의 플러그인 자연어 처리 시스템에 대한 설명입니다.

## 개요

플러그인 자연어 처리 시스템은 사용자가 자연어로 입력한 명령을 해석하여 적합한 구조화된 명령으로 변환하는 기능을 제공합니다. 이 시스템은 크게 두 가지 방식으로 동작합니다:

1. **휴리스틱 기반 매칭**: 간단한 패턴 매칭을 통해 빠르게 명령어를 인식합니다.
2. **LLM 기반 해석**: 복잡한 자연어는 LLM을 활용하여 의도를 해석하고 적절한 명령어로 변환합니다.

## 아키텍처

### 1. CommandParserService

`CommandParserService`는 사용자 입력을 파싱하고 자연어 명령을 감지합니다. 자연어 명령은 다음과 같은 형식으로 입력됩니다:

```
@[플러그인_id] [자연어_명령]
```

예: `@git 변경사항 보여줘`

### 2. PluginNaturalLanguageService

공통 자연어 처리 서비스로, 모든 플러그인에서 사용할 수 있습니다. 주요 기능:

- 휴리스틱 기반 명령어 매칭
- LLM 기반 명령어 해석
- 플러그인별 맞춤형 프롬프트 생성

### 3. 플러그인별 구현

각 플러그인은 `processNaturalLanguage` 메서드를 구현하여 자연어 명령을 처리합니다:

- **Git**: `GitNaturalLanguageService` 또는 `PluginNaturalLanguageService` 사용
- **Jira**: `PluginNaturalLanguageService` 사용
- **SWDP**: `PluginNaturalLanguageService` 사용
- **Pocket**: `PluginNaturalLanguageService` 사용

## 동작 흐름

1. 사용자가 `@git 변경사항 보여줘`와 같은 자연어 명령을 입력합니다.
2. `CommandParserService`가 이를 자연어 명령으로 인식하고, 플러그인 ID(git)와 자연어 명령(변경사항 보여줘)을 추출합니다.
3. 해당 플러그인의 `processNaturalLanguage` 메서드가 호출됩니다.
4. `PluginNaturalLanguageService`가 자연어 명령을 분석합니다:
   - 먼저 휴리스틱 매칭을 시도합니다.
   - 휴리스틱 매칭의 신뢰도가 충분하지 않으면 LLM 기반 해석을 수행합니다.
5. 최종적으로 구조화된 명령(예: `@git:status`)으로 변환되어 실행됩니다.

## 커스터마이징

각 플러그인은 자체 명령어 패턴을 정의하여 휴리스틱 매칭 성능을 향상시킬 수 있습니다:

```typescript
const commandPatterns: CommandPattern[] = [
  {
    command: 'status',
    patterns: ['상태', '상황', '변경사항'],
    extractArgs: (input: string) => [] // 인자 추출 함수
  },
  // 추가 명령어 패턴...
];
```

또한 각 플러그인은 LLM 프롬프트에 도메인별 지침을 추가하여 명령어 해석 정확도를 높일 수 있습니다.

## 내부망 설정

내부망에서 사용할 경우 다음 사항을 확인하세요:

1. LLM 서비스 URL이 내부망 환경에 맞게 설정되어 있어야 합니다.
2. 자체 서명된 인증서를 사용하는 경우 `SSLBypassService`를 통해 SSL 검증을 우회하도록 설정해야 합니다.
3. 네트워크 연결 오류 발생 시 적절한 오류 처리 및 폴백 메커니즘이 구현되어 있습니다.

## 사용 예시

### 구현 예시:

```typescript
// 플러그인에 자연어 처리 기능 추가
private initNlpService(): void {
  try {
    if (!this.llmService) {
      console.warn('LLM 서비스가 초기화되지 않아 자연어 처리 서비스를 초기화할 수 없습니다');
      return;
    }
    
    // 명령어 패턴 정의
    const commandPatterns: CommandPattern[] = [
      {
        command: 'status',
        patterns: ['상태', '변경사항', '뭐가 바뀌었어'],
        extractArgs: (input: string) => []
      },
      // 추가 패턴...
    ];
    
    // 자연어 처리 서비스 초기화
    this.nlpService = new PluginNaturalLanguageService(
      this.llmService,
      this.logger,
      this.id,
      commandPatterns,
      this.commands
    );
    
    console.log('자연어 처리 서비스 초기화 완료');
  } catch (error) {
    console.error('자연어 처리 서비스 초기화 중 오류 발생:', error);
    this.nlpService = null;
  }
}
```

### 명령어 등록:

```typescript
// 자연어 명령어 등록
{
  id: '',  // 빈 ID는 자연어 명령을 의미
  name: 'natural-language',
  type: CommandType.AT,
  prefix: CommandPrefix.AT,
  description: '자연어로 Git 명령 실행',
  syntax: '@git <자연어 명령>',
  examples: ['@git 변경사항 보여줘', '@git 커밋 메시지 만들어줘'],
  execute: async (args) => this.processNaturalLanguage(args.join(' '))
}
```

## 테스트 방법

자연어 처리 기능을 테스트하려면:

1. `tests/pluginNLPTest.js` - 명령어 파싱 및 실행 시뮬레이션
2. `tests/manualNLPTest.js` - 대화형 수동 테스트