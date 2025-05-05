# APE 명령어 시스템 통합 가이드

이 문서는 APE 명령어 시스템의 통합 및 확장 방법에 대한 가이드를 제공합니다. 각 역할자들이 자신의 개발 영역에서 명령어 시스템과 통합하는 방법을 설명합니다.

## 1. 역할자 1 (명령어 시스템) → 역할자 2 & 3 통합 가이드

### 핵심 인터페이스 및 타입

명령어 시스템은 다음 핵심 인터페이스 및 타입을 제공합니다:

```typescript
// 명령어 도메인 (에이전트 명령어 도메인)
enum CommandDomain {
  NONE = 'none',
  GIT = 'git',
  DOC = 'doc',
  JIRA = 'jira',
  POCKET = 'pocket',
  VAULT = 'vault',
  RULES = 'rules'
}

// 명령어 접두사
enum CommandPrefix {
  NONE = '',
  AT = '@',
  SLASH = '/'
}

// 명령어 유형
enum CommandType {
  NONE = 'none',
  AT = 'at',
  SLASH = 'slash'
}

// 명령어 결과 인터페이스
interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: Error | string;
  displayMode?: 'text' | 'markdown' | 'json' | 'html' | 'none';
  suggestedNextCommands?: string[];
}
```

### 역할자 2 (도메인 서비스) 통합 방법

도메인 서비스 개발자는 다음 단계로 명령어 시스템과 통합할 수 있습니다:

1. **명령어 등록**:

```typescript
// Git 도메인 명령어 예시
commandRegistry.registerAgentCommand(
  CommandDomain.GIT,
  'commit-message',
  async (args, flags, options) => {
    // 명령어 처리 로직...
    return {
      success: true,
      message: '커밋 메시지가 생성되었습니다.',
      data: { commitMessage: '...' },
      displayMode: 'markdown'
    } as CommandResult;
  },
  {
    description: '변경사항 분석 후 커밋 메시지 생성',
    examples: ['@git:commit-message', '@git:commit-message --scope=feat']
  }
);
```

2. **명령어 실행 결과 형식**:

모든 명령어는 `CommandResult` 형식의 결과를 반환해야 합니다. 이를 통해 UI 계층이 결과를 일관되게 표시할 수 있습니다.

3. **도메인별 명령어 컨벤션**:

각 도메인은 일관된 명령어 이름 패턴을 따르는 것이 좋습니다:

```
도메인:동작[:하위동작]
```

예시:
- `git:commit-message` - 커밋 메시지 생성
- `git:diff:explain` - diff 설명
- `jira:issue:create` - JIRA 이슈 생성

### 역할자 3 (UX/프론트엔드) 통합 방법

UX 개발자는 다음 방법으로 명령어 시스템과 통합할 수 있습니다:

1. **명령어 자동완성**:

```typescript
// 입력값에 따른 명령어 추천
const parseResult = commandParserService.parseWithSuggestions(userInput);
if (parseResult.hasError && parseResult.suggestions?.length > 0) {
  // 추천 명령어 표시
  showSuggestions(parseResult.suggestions);
}
```

2. **도메인별 명령어 구성**:

```typescript
// 도메인별 명령어 가져오기
const gitCommands = commandRegistry.getDomainCommands(CommandDomain.GIT);
const jiraCommands = commandRegistry.getDomainCommands(CommandDomain.JIRA);

// UI에 도메인별로 그룹화하여 표시
```

3. **명령어 실행 결과 처리**:

```typescript
// 명령어 실행 결과에 따른 표시 방식 결정
async function executeCommand(commandStr) {
  const result = await commandExecutor.executeFromString(commandStr);
  
  switch(result.displayMode) {
    case 'markdown':
      renderMarkdown(result.message);
      break;
    case 'json':
      renderJSON(result.data);
      break;
    // 기타 표시 방식 처리
    default:
      renderText(result.message);
  }
  
  // 제안된 다음 명령어가 있으면 표시
  if (result.suggestedNextCommands?.length > 0) {
    showNextCommandSuggestions(result.suggestedNextCommands);
  }
}
```

## 2. 명령어 시스템 확장 가이드

### 새 도메인 추가하기

새로운 도메인을 추가하려면 다음 단계를 따르세요:

1. `CommandDomain` 열거형에 새 도메인 추가
2. `CommandRegistryService._getDomainString()` 메서드에 새 도메인 문자열 변환 추가
3. 도메인별 명령어 핸들러 및 사용법 등록

### 명령어 플래그와 옵션 활용

명령어 플래그와 옵션을 효과적으로 사용하여 명령어 기능을 확장할 수 있습니다:

```
@git:commit-message --scope=feat --skip-tests file=README.md
```

이 경우:
- `--scope=feat`: 플래그로 처리 (flags 객체에 저장)
- `--skip-tests`: 불리언 플래그로 처리 (flags 객체에 true로 저장)
- `file=README.md`: 옵션으로 처리 (options 객체에 저장)

## 3. 테스트 및 디버깅

명령어 시스템 테스트를 위해 다음 기능을 활용할 수 있습니다:

1. `/help` 명령어로 등록된 모든 명령어 확인
2. `/debug` 명령어로 시스템 상태 확인
3. `commandParserService.parseWithSuggestions()` 메서드로 파싱 결과 디버깅

## 4. 마일스톤별 개발 계획

각 역할자는 다음 마일스톤에 따라 개발을 진행하고 있습니다:

### 역할자 1: 명령어 시스템 개발
- ✅ 명령어 시스템 개발 (2-3주)
- ⬜ 구현 테스트 (1주)
- ⬜ 통합 테스트 (1주)

### 역할자 2: 도메인 서비스 구현
- ⬜ 기본 플러그인 시스템 구현 (2주)
- ⬜ 도메인별 기능 추가 (2주)
- ⬜ 통합 테스트 (1주)

### 역할자 3: UX 개선 및 프론트엔드 고도화
- ⬜ UI 모듈 개발 (2주)
- ⬜ 자동완성 및 테마 구현 (2주)
- ⬜ UX 테스트 (1주)

다음 단계에서는 각 역할자가 협력하여 명령어 시스템과 도메인 서비스, UI를 통합하는 작업을 진행해야 합니다.