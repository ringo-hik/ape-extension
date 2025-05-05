# APE 개발 계획: 플러그인 자동완성 UX 개선 방안

## 핵심 철학: "사용자에게 귀찮은 작업은 시키지 않는다"

모든 플러그인 명령어 시스템은 다음 핵심 원칙을 기반으로 설계됩니다:

1. **완전한 명령어 생성**: 사용자가 명령어 인자를 직접 입력하는 대신, 시스템이 실제 값으로 완성된 명령어를 제공합니다.
2. **컨텍스트 기반 자동화**: 시스템은 사용자의 현재 작업 컨텍스트를 인식하고 이에 맞는 명령어를 제안합니다.
3. **시나리오 중심 설계**: 공통 워크플로우 시나리오에 맞는 완성된 명령어를 제공합니다.
4. **설정 및 환경 활용**: 사용자의 settings.json 및 각 플러그인별 환경 데이터를 활용하여 명령어를 자동으로 구성합니다.

## 플러그인별 자동완성 UX 개선 계획

### 1. Git 플러그인

**현재 상태**: 기본적인 브랜치 목록 제공 및 자동완성 구현됨

**개선 방향**:
- 명령어 사용 패턴 분석 및 캐싱 (자주 사용하는 브랜치, 커밋 메시지 패턴 등)
- 현재 작업 상태에 따른 컨텍스트 인식 명령어 제안 
  - 예: 변경사항이 있을 때 commit 명령어 우선 제안
  - 예: 커밋 후 push 명령어 우선 제안
- PR 생성 시 베이스 브랜치와 타이틀 자동 완성
- 상황별 최적 Git 워크플로우 명령어 체인 제안

### 2. Jira 플러그인

**현재 상태**: LLM 기반 지능형 이슈 키 추출 구현 완료 및 최적화

**구현된 기능**:
- Git 브랜치에서 Jira 이슈 키 자동 추출
- LLM 기반 커밋 로그 분석으로 다양한 팀 포맷의 이슈 키 추출 (고급화)
  - 다양한 팀 커밋 규칙 지원: [KEY-123], KEY-123:, #KEY-123, fix(KEY-123), feat(KEY-123), chore(KEY-123) 등
  - 17개 이상의 패턴 인식 및 지원 (예: [KEY-123], KEY-123:, #KEY-123, fix(KEY-123), "Implement feature (KEY-123)")
- 고도화된 프롬프트 엔지니어링으로 LLM 이슈 키 추출 정확도 향상
- 가벼운 모델(Claude Haiku)로 빠른 추론 구현 (50ms 이내 응답)
- 휴리스틱 방식과 LLM 방식의 하이브리드 접근법 적용
- 성능 최적화를 위한 이슈 키 캐싱 시스템 구현 (5분간 유효)
- 이슈 키 출처 추적 (브랜치, LLM, 정규식) 및 상세 로깅
- 향상된 오류 처리 및 복구 메커니즘

**추가 개선 방향**:
- 실시간 이슈 목록 컨텍스트 로드 및 자동완성 제안
- Jira API 연동을 통한 이슈 상태 및 정보 자동 검색
- 사용자 할당 이슈 우선 표시
- 이슈 유형/상태 기반 자동 필터링
- 이슈 생성 시 필수 필드 자동 완성

### 3. SWDP 플러그인

**현재 상태**: 기본 명령어 구조만 제공, 파라미터는 수동 입력 필요

**개선 방향**:
- 최근 빌드 ID 자동 캐싱 및 제안
- 현재 작업 환경(브랜치, 변경사항)에 최적화된 빌드 옵션 제안
- 빌드 성공/실패 패턴 학습 및 최적 빌드 파라미터 제안
- 테스트 요청 자동화 (TR 필수 정보 자동 완성)
- 배포 환경 자동 감지 및 적절한 배포 파라미터 제안

### 4. Pocket 플러그인

**현재 상태**: 기본 명령어 구조만 제공, 파일 경로는 수동 입력 필요

**개선 방향**:
- 실시간 파일 목록 및 경로 자동완성
- 파일 유형 인식 및 최적화된 명령어 제안
- 최근 접근 파일 기반 히스토리 제안
- 관련 파일 그룹화 및 컨텍스트 인식 검색
- 파일 내용 분석 기반 자동 요약 옵션 제안

## 통합 자동완성 아키텍처

모든 플러그인에 적용할 공통 자동완성 아키텍처를 구축합니다:

1. **컨텍스트 수집기**: 각 플러그인별 실시간 컨텍스트 정보 수집
   - Git: 브랜치, 변경 파일, 커밋 상태 등
   - Jira: 최근 이슈, 할당된 이슈, 워크플로우 상태 등
   - SWDP: 빌드 상태, 테스트 결과, 배포 환경 등
   - Pocket: 파일 구조, 최근 접근 패턴, 콘텐츠 유형 등

2. **명령어 생성기**: 수집된 컨텍스트를 기반으로 완성된 명령어 생성
   - 사용자 행동 패턴 분석 및 학습
   - 워크플로우 시나리오 인식 및 최적 명령어 체인 구성
   - 설정 기반 최적화 (settings.json 활용)

3. **UI 개선**: 자동완성 UX/UI 최적화
   - 카테고리 기반 계층적 명령어 탐색
   - 컨텍스트 기반 선택 추천
   - 키보드 네비게이션 개선 (Tab 완성, 커서 최적화)
   - 인라인 명령어 프리뷰 및 설명

## 구현 우선순위

1. ✅ 컨텍스트 수집 기반 구축 (모든 플러그인)
2. ✅ Git 명령어 자동완성 고도화 (이미 기본 구조 존재) 
3. ✅ Jira 플러그인 실시간 이슈 연동
   - ✅ 지능형 LLM 기반 이슈 키 추출 구현
   - ✅ 다양한 팀 커밋 컨벤션 지원
4. ✅ SWDP 빌드 파라미터 자동화
5. ✅ Pocket 파일 경로 자동완성
6. 통합 학습 시스템 구현 (사용자 패턴 인식) - 진행 중

이 계획은 "사용자는 인자값을 직접 입력하지 않는다"는 핵심 원칙을 실현하기 위한 로드맵입니다.

## 컨텍스트 기반 명령어 시스템 구현 현황

### 1. 구현된 기능

1. **통합 컨텍스트 수집 시스템**
   - 모든 플러그인의 실시간 상태 정보 수집 (Git 브랜치, Jira 이슈, SWDP 빌드 상태, Pocket 파일)
   - 주기적 컨텍스트 자동 갱신 (30초 간격)
   - 플러그인별 전용 컨텍스트 캐시 관리

2. **실시간 컨텍스트 기반 명령어 생성**
   - 플러그인별 특화된 지능형 명령어 생성 로직 구현
   - Git: 브랜치, 변경 파일, 커밋 상태 기반 최적 명령어 생성
   - Jira: Git 브랜치에서 이슈 ID 추출 및 이슈 연동 명령어 생성
   - SWDP: 브랜치 타입에 따른 최적의 빌드 옵션 제안
   - Pocket: 워크스페이스 정보 기반 파일 경로 및 검색어 추천

3. **통합 UI 및 자동완성 시스템**
   - 명령어 자동완성 UI 개선
   - 컨텍스트 기반 명령어 표시 및 구분
   - 명령어 제안 가중치 시스템 (컨텍스트 기반 우선순위)

### 2. 기술적 구현 세부사항

```typescript
// 핵심 컴포넌트 구조
CommandService               // 컨텍스트 기반 명령어 서비스
├── refreshAllContexts()     // 모든 플러그인 컨텍스트 수집
├── generateContextualCommand() // 컨텍스트 기반 명령어 생성
├── generateGitCommand()     // Git 특화 명령어 생성 
├── generateJiraCommand()    // Jira 특화 명령어 생성
│   ├── Git 브랜치 기반 이슈 키 추출
│   ├── LLM 기반 커밋 로그 분석
│   └── 다양한 팀 포맷 지원 (정규식 + LLM)
├── generateSwdpCommand()    // SWDP 특화 명령어 생성
├── generatePocketCommand()  // Pocket 특화 명령어 생성
└── updatePreference()       // 사용자 선호도 학습 및 업데이트
```

**LLM 기반 Jira 이슈 키 추출 핵심 로직 (개선 버전):**

```typescript
// Jira 이슈 키 추출 프로세스 구현
// 1. 브랜치 이름에서 이슈 키 추출 시도 (가장 직접적이고 빠른 방법)
const branchIssueKeyMatch = currentBranch.match(/[A-Z]+-\d+/);
if (branchIssueKeyMatch) {
  const issueKey = branchIssueKeyMatch[0];
  this.logger.info(`브랜치 이름에서 이슈 키 발견: ${issueKey}`);
  
  // 캐시에 이슈 키 저장 (향후 성능 최적화용)
  if (!this.contextCache.has('jira')) {
    this.contextCache.set('jira', {});
  }
  const jiraContext = this.contextCache.get('jira');
  jiraContext.lastIssueKey = issueKey;
  jiraContext.lastIssueKeySource = 'branch';
  jiraContext.lastUpdated = new Date();
  
  return `@jira:issue ${issueKey}`;
}

// 2. 캐시된 이슈 키 확인 (성능 최적화를 위해)
const jiraContext = this.contextCache.get('jira');
if (jiraContext?.lastIssueKey && 
    jiraContext.lastUpdated && 
    (new Date().getTime() - jiraContext.lastUpdated.getTime() < 5 * 60 * 1000)) { // 5분 이내 캐시
  this.logger.info(`캐시된 이슈 키 사용: ${jiraContext.lastIssueKey} (출처: ${jiraContext.lastIssueKeySource})`);
  return `@jira:issue ${jiraContext.lastIssueKey}`;
}

// 3. 최근 커밋 로그 가져오기 (10개 로그 분석)
const logResult = await gitClient.executeGitCommand(['log', '-n', '10', '--pretty=format:%s']);
if (logResult.success && logResult.stdout) {
  const recentCommits = logResult.stdout.split('\n');
  this.logger.info(`최근 커밋 로그 ${recentCommits.length}개 조회됨`);
  
  // 4. LLM 기반 이슈 키 추출 (고급화된 프롬프트)
  const issueKeyPrompt = {
    messages: [
      {
        role: "system",
        content: "당신은 Git 커밋 메시지에서 Jira 이슈 키를 추출하는 전문가입니다. Jira 이슈 키는 일반적으로 PROJ-123, ABC-456 같은 형식(대문자 프로젝트 코드, 하이픈, 숫자)입니다.\n\n" + 
                 "팀마다 다양한 포맷을 사용합니다:\n" +
                 "- [KEY-123] 메시지\n" +
                 "- KEY-123: 메시지\n" +
                 "- #KEY-123 메시지\n" +
                 "- (KEY-123) 메시지\n" +
                 "- fix(KEY-123): 메시지\n" +
                 "- 'feat: 기능 구현 (KEY-123)'\n" +
                 "- 'Implement feature KEY-123'\n\n" +
                 "가장 최근의 관련 이슈 키 하나만 추출해 주세요. 전체 커밋 메시지를 읽고 가장 관련성이 높은 이슈 키를 선택하세요."
      },
      {
        role: "user", 
        content: `다음 Git 커밋 메시지 목록에서 가장 최근의 Jira 이슈 키만 하나 추출해주세요. 없으면 '없음'이라고 응답하세요. 응답은 이슈 키만 간결하게 작성해주세요.\n\n${recentCommits.join('\n')}`
      }
    ]
  };
  
  // 5. 성능 측정 및 LLM 호출
  const llmStartTime = Date.now();
  const response = await llmService.sendRequest({
    model: "claude-3-haiku-20240307", // 가벼운 모델 사용
    messages: issueKeyPrompt.messages,
    temperature: 0,
    max_tokens: 50
  });
  const llmDuration = Date.now() - llmStartTime;
  
  this.logger.info(`LLM 응답 수신 완료 (소요시간: ${llmDuration}ms)`);
  
  // 6. 응답에서 이슈 키 추출 (개선된 로직)
  if (response && response.content) {
    const content = response.content.trim();
    
    if (content.toLowerCase() !== '없음') {
      const llmExtractedKey = content.match(/[A-Z]+-\d+/);
      
      if (llmExtractedKey) {
        const issueKey = llmExtractedKey[0];
        this.logger.info(`LLM이 추출한 이슈 키: ${issueKey}`);
        
        // 캐시에 이슈 키 저장
        if (!this.contextCache.has('jira')) {
          this.contextCache.set('jira', {});
        }
        const jiraContext = this.contextCache.get('jira');
        jiraContext.lastIssueKey = issueKey;
        jiraContext.lastIssueKeySource = 'llm';
        jiraContext.lastUpdated = new Date();
        
        return `@jira:issue ${issueKey}`;
      }
    }
  }
  
  // 7. 휴리스틱 방식 폴백 (LLM 실패 시 or 병렬 실행)
  this.logger.info('휴리스틱 방식으로 이슈 키 검색 시작');
  
  // 향상된 패턴 목록 (17개 이상의 다양한 팀 커밋 규칙 지원)
  const patterns = [
    /\[([A-Z]+-\d+)\]/,      // [KEY-123]
    /([A-Z]+-\d+):/,         // KEY-123:
    /#([A-Z]+-\d+)/,         // #KEY-123
    /\(([A-Z]+-\d+)\)/,      // (KEY-123)
    /fix\(([A-Z]+-\d+)\)/,   // fix(KEY-123)
    /feat\(([A-Z]+-\d+)\)/,  // feat(KEY-123)
    /feat\s*:\s*\(([A-Z]+-\d+)\)/, // feat: (KEY-123)
    /chore\(([A-Z]+-\d+)\)/, // chore(KEY-123)
    /docs\(([A-Z]+-\d+)\)/,  // docs(KEY-123)
    /test\(([A-Z]+-\d+)\)/,  // test(KEY-123)
    /refactor\(([A-Z]+-\d+)\)/, // refactor(KEY-123)
    /style\(([A-Z]+-\d+)\)/, // style(KEY-123)
    /perf\(([A-Z]+-\d+)\)/,  // perf(KEY-123)
    /build\(([A-Z]+-\d+)\)/, // build(KEY-123)
    /ci\(([A-Z]+-\d+)\)/,    // ci(KEY-123)
    /^([A-Z]+-\d+)$/,        // KEY-123 (단독 이슈 키)
    /([A-Z]+-\d+)/           // 기타 모든 형태 (가장 마지막에 체크)
  ];
  
  for (const commit of recentCommits) {
    for (const pattern of patterns) {
      const match = commit.match(pattern);
      if (match && match[1]) {
        const issueKey = match[1];
        this.logger.info(`휴리스틱 방식으로 이슈 키 발견: ${issueKey} (패턴: ${pattern})`);
        
        // 캐시에 이슈 키 저장
        if (!this.contextCache.has('jira')) {
          this.contextCache.set('jira', {});
        }
        const jiraContext = this.contextCache.get('jira');
        jiraContext.lastIssueKey = issueKey;
        jiraContext.lastIssueKeySource = 'regex';
        jiraContext.lastUpdated = new Date();
        
        return `@jira:issue ${issueKey}`;
      }
    }
  }
}
```

### 3. 향후 개선 계획

1. **사용자 선호도 학습 시스템 고도화**
   - 명령어 사용 패턴 분석 및 개인화된 추천
   - 자주 사용하는 워크플로우 자동 학습

2. **명령어 체인 및 시퀀스 자동화**
   - 연관된 명령어 시퀀스 자동 제안
   - 워크플로우 컨텍스트 인식 및 다음 단계 추천

3. **UI/UX 추가 개선**
   - 컨텍스트 인식 명령어 시각적 구분
   - 인라인 파라미터 편집 및 제안
   - 명령어 히스토리 개인화 및 분석

4. **통합 로깅 및 성능 최적화**
   - 플러그인 컨텍스트 수집 병렬화
   - 캐시 최적화 및 메모리 사용량 개선