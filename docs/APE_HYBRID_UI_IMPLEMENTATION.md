# APE 하이브리드 UI 구현 가이드

이 문서는 APE(Agentic Pipeline Engine)의 하이브리드 UI 시스템 구현에 대한 상세 가이드를 제공합니다. 하이브리드 UI는 자연어 인터페이스와 명령어 기반 도구를 효과적으로 결합하는 접근 방식입니다.

## 1. 하이브리드 UI 개요

### 철학 및 디자인 원칙
하이브리드 UI는 다음 핵심 원칙을 따릅니다:

1. **점진적 학습**: 사용자가 처음에는 버튼과 UI 요소로 시작하여 점점 명령어를 학습할 수 있는 경로 제공
2. **자연스러운 발견**: 컨텍스트 기반 도구 제안을 통해 명령어와 기능을 자연스럽게 발견
3. **유연한 상호작용**: 자연어 쿼리와 구조화된 명령어 두 가지 방식 모두 지원
4. **일관된 경험**: 채팅 인터페이스를 중심으로 모든 기능이 통합된 경험 제공

### 핵심 구성 요소
하이브리드 UI는 다음 주요 구성 요소로 이루어집니다:

1. **채팅 인터페이스**: 중앙 상호작용 지점
2. **컨텍스트 인식 제안**: 현재 작업 및 대화 컨텍스트에 기반한 도구 제안
3. **명령어 시스템**: `/` 및 `@` 기반 명령어
4. **도메인 버튼**: 주요 도메인별 빠른 액세스 버튼
5. **명령어 팔레트**: 전체 명령어 탐색 및 검색 기능

## 2. 구현 로드맵

### 단계 1: 채팅 인터페이스 개선
- [x] 기존 채팅 인터페이스 분석
- [ ] UI 레이아웃 업데이트 (컨텍스트 영역 추가)
- [ ] 마크다운 및 코드 블록 렌더링 개선
- [ ] 채팅 메시지에 액션 버튼 통합

### 단계 2: 컨텍스트 인식 시스템
- [ ] 컨텍스트 분석 서비스 구현
- [ ] 제안 생성 알고리즘 구현
- [ ] 제안 UI 컴포넌트 개발
- [ ] 컨텍스트-명령어 맵핑 시스템 구현

### 단계 3: 통합 도구 영역
- [ ] 도메인별 도구 버튼 구현
- [ ] 명령어 팔레트 개선
- [ ] 도메인별 컨텍스트 메뉴 구현
- [ ] 인라인 명령어 제안 시스템 개선

### 단계 4: 자연어 처리 통합
- [ ] 자연어-명령어 변환 서비스 개선
- [ ] 명령어 자동 완성 시스템 개선
- [ ] 매개변수 추출 및 확인 개선
- [ ] LLM 기반 명령어 생성 통합

### 단계 5: 테스트 및 최적화
- [ ] 사용성 테스트 및 피드백 수집
- [ ] 성능 최적화
- [ ] 접근성 개선
- [ ] 문서화 및 사용자 가이드 작성

## 3. 구현 세부 사항

### 3.1 컨텍스트 인식 제안 시스템

컨텍스트 인식 제안 시스템은 다음 요소로 구성됩니다:

#### 컨텍스트 분석기
```typescript
export interface IContextAnalyzer {
  analyzeWorkspaceContext(): WorkspaceContext;
  analyzeChatContext(messages: ChatMessage[]): ChatContext;
  analyzeActiveEditorContext(): EditorContext;
  mergeContexts(...contexts: BaseContext[]): MergedContext;
}
```

#### 제안 생성기
```typescript
export interface ISuggestionGenerator {
  generateSuggestions(context: MergedContext): CommandSuggestion[];
  rankSuggestions(suggestions: CommandSuggestion[], userPreferences: UserPreference[]): CommandSuggestion[];
  filterSuggestions(suggestions: CommandSuggestion[], filters: SuggestionFilter[]): CommandSuggestion[];
}
```

#### 제안 UI 컴포넌트
* 인라인 제안 바: 메시지 입력 필드 위에 표시
* 컨텍스트 패널: 채팅 메시지 옆에 표시
* 도메인 바로가기: 주요 도메인별 빠른 액세스 버튼

### 3.2 명령어 시스템 개선

현재 명령어 시스템을 다음과 같이 개선합니다:

#### 명령어 자동 완성 개선
* 명령어 구조에 대한 실시간 입력 가이드
* 인라인 매개변수 힌트 및 유효성 검사
* 명령어 사용 예제 제안
* 자연어 쿼리로부터 명령어 추천

#### 명령어 실행 파이프라인
```typescript
export interface ICommandExecutionPipeline {
  parseInput(input: string): CommandRequest;
  validateRequest(request: CommandRequest): ValidationResult;
  executeCommand(request: CommandRequest): Promise<CommandResult>;
  formatResult(result: CommandResult): FormattedResult;
  renderResult(formattedResult: FormattedResult, outputTarget: OutputTarget): void;
}
```

### 3.3 도메인 도구 통합

각 도메인별 도구를 다음과 같이 통합합니다:

#### 도메인 도구 컴포넌트
* 도메인별 아이콘 및 색상 체계
* 도메인별 컨텍스트 메뉴
* 도메인별 결과 렌더러
* 도메인별 명령어 그룹

#### 도메인 카드 UI
* 확장 가능한 도메인 카드
* 최근 사용한 명령어 표시
* 도메인별 상태 요약
* 빠른 액션 버튼

### 3.4 자연어 처리 통합

자연어 처리를 다음과 같이 통합합니다:

#### 자연어 인식기
```typescript
export interface INaturalLanguageRecognizer {
  detectIntent(input: string): Intent;
  extractEntities(input: string): Entity[];
  mapToCommand(intent: Intent, entities: Entity[]): CommandMapping[];
  suggestParameters(command: string, entities: Entity[]): ParameterSuggestion[];
}
```

#### 명령어 매핑 서비스
```typescript
export interface ICommandMappingService {
  registerNaturalLanguagePattern(pattern: string, command: string): void;
  findMatchingCommands(input: string): CommandMatch[];
  rankCommandMatches(matches: CommandMatch[]): CommandMatch[];
  explainMapping(match: CommandMatch): string;
}
```

## 4. UI 컴포넌트 상세 명세

### 4.1 채팅 인터페이스 개선

#### 레이아웃 업데이트
* 채팅 메시지 영역
* 컨텍스트 패널 영역 (오른쪽)
* 도구 바 (하단)
* 입력 영역 (확장 가능)

#### 메시지 렌더링 개선
* 마크다운 고급 렌더링
* 코드 블록 구문 강조 개선
* 인라인 이미지 및 차트 지원
* 인터랙티브 요소 (버튼, 폼 등)

#### 메시지 액션
* 코드 블록 복사 및 실행
* 메시지 저장 및 공유
* 메시지 편집 및 재실행
* 메시지별 컨텍스트 메뉴

### 4.2 컨텍스트 패널

#### 구성 요소
* 현재 컨텍스트 요약
* 제안된 명령어 목록
* 관련 문서 링크
* 학습 및 팁 섹션

#### 기능
* 컨텍스트별 명령어 필터링
* 사용 빈도에 따른 정렬
* 즐겨찾기 설정
* 커스텀 명령어 추가

### 4.3 명령어 팔레트 개선

#### 구성 요소
* 검색 바
* 카테고리별 구분
* 명령어 세부 정보 뷰
* 빠른 액션 버튼

#### 기능
* 퍼지 검색
* 사용 기록 기반 추천
* 키보드 내비게이션
* 명령어 단축키 설정

### 4.4 도구 바

#### 구성 요소
* 주요 도메인 버튼 (Git, Jira, Pocket 등)
* 설정 및 도움말 버튼
* 상태 표시기
* 모달 액션 버튼

#### 기능
* 도메인별 빠른 액세스
* 도메인별 상태 표시
* 도메인별 컨텍스트 메뉴
* 설정 및 사용자 기본 설정

## 5. 사용자 시나리오

### 시나리오 1: 명령어 발견 및 학습
1. 사용자가 채팅에 "변경 사항을 커밋하고 싶어요" 입력
2. 시스템이 "@git:commit" 명령어를 제안하고 클릭 가능한 버튼으로 표시
3. 사용자가 버튼 클릭하면 명령어 실행하고 결과 표시
4. 시스템이 "다음번에는 @git:commit을 직접 입력하셔도 됩니다" 안내

### 시나리오 2: 컨텍스트 기반 제안
1. 사용자가 코드 수정 후 VSCode에서 APE 채팅 열기
2. 시스템이 자동으로 변경된 파일 감지하고 컨텍스트 패널에 관련 Git 명령어 표시
3. 사용자가 제안된 "@git:diff" 클릭하여 변경 사항 확인
4. 변경 사항 확인 후 컨텍스트 패널에서 "@git:commit" 클릭하여 커밋 진행

### 시나리오 3: 자연어와 명령어 혼합 사용
1. 사용자가 "SWDP-1234 이슈의 상태를 확인해줘" 입력
2. 시스템이 자연어를 분석하여 "@jira:issue SWDP-1234" 명령어로 변환
3. 결과를 표시하면서 명령어 형식도 함께 보여줌
4. 사용자가 이후에는 직접 명령어 형식을 사용할 수 있게 됨

### 시나리오 4: 점진적 명령어 구성
1. 사용자가 "@jira:" 입력 시작
2. 시스템이 자동완성 메뉴에 가능한 하위 명령어 표시
3. 사용자가 "issue" 선택
4. 시스템이 필요한 매개변수 힌트 제공
5. 사용자가 이슈 ID 입력으로 명령어 완성

## 6. 구현 세부 계획

### 6.1 핵심 클래스 구조

```typescript
// 컨텍스트 분석 서비스
export class ContextAnalysisService implements IContextAnalyzer {
  private workspaceAnalyzer: WorkspaceAnalyzer;
  private chatAnalyzer: ChatAnalyzer;
  private editorAnalyzer: EditorAnalyzer;
  
  constructor(
    workspaceService: VSCodeService,
    chatService: ChatService,
    llmService: LlmService
  ) {
    this.workspaceAnalyzer = new WorkspaceAnalyzer(workspaceService);
    this.chatAnalyzer = new ChatAnalyzer(chatService, llmService);
    this.editorAnalyzer = new EditorAnalyzer(workspaceService);
  }
  
  // 인터페이스 구현...
}

// 제안 생성 서비스
export class SuggestionService implements ISuggestionGenerator {
  private commandRegistry: CommandRegistryService;
  private userPreferences: UserPreferencesService;
  private contextAnalyzer: IContextAnalyzer;
  
  constructor(
    commandRegistry: CommandRegistryService,
    userPreferences: UserPreferencesService,
    contextAnalyzer: IContextAnalyzer
  ) {
    this.commandRegistry = commandRegistry;
    this.userPreferences = userPreferences;
    this.contextAnalyzer = contextAnalyzer;
  }
  
  // 인터페이스 구현...
}

// 자연어 처리 서비스
export class NaturalLanguageService implements INaturalLanguageRecognizer {
  private llmService: LlmService;
  private commandMappings: CommandMappingService;
  
  constructor(
    llmService: LlmService,
    commandMappings: CommandMappingService
  ) {
    this.llmService = llmService;
    this.commandMappings = commandMappings;
  }
  
  // 인터페이스 구현...
}
```

### 6.2 UI 컴포넌트 구현

#### ChatViewProvider 업데이트
```typescript
export class ApeChatViewProvider implements vscode.WebviewViewProvider {
  private contextPanelEnabled: boolean = true;
  private suggestionService: SuggestionService;
  
  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly chatService: ChatService,
    private readonly commandService: CommandService,
    suggestionService: SuggestionService
  ) {
    this.suggestionService = suggestionService;
  }
  
  // 기존 메서드 업데이트...
  
  // 새 메서드 추가
  private getContextPanelHtml(): string {
    // 컨텍스트 패널 HTML 생성
  }
  
  private getSuggestionBarHtml(suggestions: CommandSuggestion[]): string {
    // 제안 바 HTML 생성
  }
  
  private getDomainToolbarHtml(): string {
    // 도메인 도구 바 HTML 생성
  }
}
```

#### 웹뷰 JavaScript 업데이트
```javascript
// context-panel.js
class ContextPanel {
  constructor(container, vscode) {
    this.container = container;
    this.vscode = vscode;
    this.suggestions = [];
    
    this.initialize();
  }
  
  initialize() {
    // 초기화 로직
  }
  
  updateSuggestions(suggestions) {
    // 제안 업데이트 로직
  }
  
  // 기타 메서드...
}

// suggestion-bar.js
class SuggestionBar {
  constructor(container, inputElement, vscode) {
    this.container = container;
    this.inputElement = inputElement;
    this.vscode = vscode;
    this.suggestions = [];
    
    this.initialize();
  }
  
  // 메서드 구현...
}

// domain-toolbar.js
class DomainToolbar {
  constructor(container, vscode) {
    this.container = container;
    this.vscode = vscode;
    this.domains = [];
    
    this.initialize();
  }
  
  // 메서드 구현...
}
```

### 6.3 CSS 스타일 업데이트

```css
/* 레이아웃 업데이트 */
.chat-container {
  display: grid;
  grid-template-columns: 1fr 300px;  /* 메인 + 컨텍스트 패널 */
  grid-template-rows: auto 1fr auto auto;
  gap: 10px;
  height: 100vh;
}

/* 컨텍스트 패널 */
.context-panel {
  grid-column: 2;
  grid-row: 2;
  background-color: var(--vscode-editor-background);
  border-left: 1px solid var(--vscode-panel-border);
  overflow-y: auto;
  padding: 10px;
}

/* 제안 바 */
.suggestion-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  background-color: var(--vscode-input-background);
  border-top: 1px solid var(--vscode-input-border);
}

.suggestion-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 도메인 도구 바 */
.domain-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background-color: var(--vscode-editor-background);
  border-top: 1px solid var(--vscode-panel-border);
  overflow-x: auto;
}

.domain-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
}
```

## 7. 개발 프로세스 및 일정

### 페이즈 1: 준비 및 계획 (1주)
- [x] 현재 UI 분석 및 요구사항 정의
- [x] 아키텍처 설계 및 문서화
- [ ] 개발 환경 설정 및 초기 구조 구현

### 페이즈 2: 핵심 구현 (2주)
- [ ] 채팅 인터페이스 업데이트
- [ ] 컨텍스트 분석 서비스 구현
- [ ] 제안 생성 서비스 구현
- [ ] 기본 UI 컴포넌트 구현

### 페이즈 3: 도메인 통합 (2주)
- [ ] Git 도메인 도구 통합
- [ ] Jira 도메인 도구 통합
- [ ] Pocket 도메인 도구 통합
- [ ] 기타 도메인 도구 통합

### 페이즈 4: 자연어 처리 (1주)
- [ ] 자연어 인식 서비스 개선
- [ ] 명령어 매핑 서비스 구현
- [ ] 자연어-명령어 변환 테스트 및 최적화

### 페이즈 5: 테스트 및 최적화 (1주)
- [ ] 종합 테스트
- [ ] 성능 최적화
- [ ] 피드백 수집 및 반영
- [ ] 최종 문서화

## 8. 결론

하이브리드 UI 접근 방식은 APE의 강력한 명령어 시스템과 직관적인 사용자 경험을 결합하여 사용자가 자연스럽게 기능을 발견하고 학습할 수 있는 환경을 제공합니다. 이를 통해 초보자에서 전문가까지 모든 사용자가 자신의 스타일과 전문성 수준에 맞게 APE를 활용할 수 있습니다.

구현은 단계적으로 진행되며, 각 단계마다 사용자 테스트와 피드백을 통해 개선됩니다. 최종 목표는 도구의 강력한 기능을 유지하면서도 접근성과 사용 편의성을 극대화하는 것입니다.