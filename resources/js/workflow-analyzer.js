/**
 * 워크플로우 분석기 모듈
 * 
 * 사용자 작업 패턴을 분석하고 워크플로우 기반 명령어 추천을 수행
 * ImprovedContextHandler와 통합되어 컨텍스트 인식 명령어 시스템 강화
 */

class WorkflowAnalyzer {
  /**
   * 생성자
   * @param {Object} options 옵션
   */
  constructor(options = {}) {
    this.options = Object.assign({
      maxHistorySize: 50,         // 최대 명령어 히스토리 크기
      sequenceLength: 3,          // 패턴 인식을 위한 시퀀스 길이
      minOccurrence: 2,           // 패턴으로 인식할 최소 발생 횟수
      recencyWeight: 0.8,         // 최근 명령어 가중치 (0-1)
      patternMatchThreshold: 0.7  // 패턴 매칭 임계값 (0-1)
    }, options);
    
    // 명령어 히스토리
    this.commandHistory = [];
    
    // 감지된 패턴
    this.patterns = {};
    
    // 도메인별 워크플로우 템플릿
    this.workflowTemplates = this._initWorkflowTemplates();
    
    // 현재 워크플로우 상태
    this.currentWorkflow = null;
    
    // 마지막 컨텍스트
    this.lastContext = null;
    
    console.log('WorkflowAnalyzer 초기화됨');
  }
  
  /**
   * 워크플로우 템플릿 초기화
   * @returns {Object} 워크플로우 템플릿
   */
  _initWorkflowTemplates() {
    return {
      // Git 워크플로우 템플릿
      git: {
        // 기본 Git 워크플로우 (코드 변경 - 상태 확인 - 스테이징 - 커밋 - 푸시)
        basic: {
          name: '기본 Git 워크플로우',
          commands: ['@git:status', '@git:add', '@git:commit', '@git:push'],
          nextStepMap: {
            '@git:status': '@git:add',
            '@git:add': '@git:commit',
            '@git:commit': '@git:push'
          }
        },
        
        // 브랜치 관리 워크플로우 (브랜치 확인 - 브랜치 생성 - 체크아웃 - 작업 - 머지)
        branch: {
          name: 'Git 브랜치 관리',
          commands: ['@git:branch', '@git:checkout', '@git:status', '@git:commit', '@git:push', '@git:merge'],
          nextStepMap: {
            '@git:branch': '@git:checkout',
            '@git:checkout': '@git:status',
            '@git:status': '@git:commit',
            '@git:commit': '@git:push',
            '@git:push': '@git:merge'
          }
        }
      },
      
      // Jira 워크플로우 템플릿
      jira: {
        // 이슈 관리 워크플로우 (이슈 검색 - 이슈 조회 - 이슈 업데이트)
        issueManagement: {
          name: 'Jira 이슈 관리',
          commands: ['@jira:search', '@jira:issue', '@jira:update'],
          nextStepMap: {
            '@jira:search': '@jira:issue',
            '@jira:issue': '@jira:update'
          }
        },
        
        // 이슈 생성 워크플로우 (이슈 생성 - 댓글 추가 - 첨부 파일 추가)
        issueCreation: {
          name: 'Jira 이슈 생성',
          commands: ['@jira:create', '@jira:comment', '@jira:attach'],
          nextStepMap: {
            '@jira:create': '@jira:comment',
            '@jira:comment': '@jira:attach'
          }
        }
      }
    };
  }
  
  /**
   * 명령어 실행 기록
   * @param {string} command 실행된 명령어
   * @param {Object} context 실행 컨텍스트
   */
  recordCommand(command, context) {
    if (!command) return;
    
    // 명령어 및 실행 시간 기록
    const commandRecord = {
      command: command,
      timestamp: Date.now(),
      context: this._extractRelevantContext(context)
    };
    
    // 히스토리에 추가
    this.commandHistory.unshift(commandRecord);
    
    // 최대 크기 유지
    if (this.commandHistory.length > this.options.maxHistorySize) {
      this.commandHistory = this.commandHistory.slice(0, this.options.maxHistorySize);
    }
    
    // 패턴 업데이트
    this._updatePatterns();
    
    // 현재 워크플로우 업데이트
    this._updateCurrentWorkflow(command, context);
    
    // 마지막 컨텍스트 저장
    this.lastContext = context;
    
    return commandRecord;
  }
  
  /**
   * 관련 컨텍스트 추출
   * @param {Object} context 원본 컨텍스트
   * @returns {Object} 관련 컨텍스트 정보
   */
  _extractRelevantContext(context) {
    if (!context) return {};
    
    // 워크플로우 분석에 필요한 주요 컨텍스트 요소만 추출
    return {
      activeFile: context.activeFile,
      fileExtension: context.fileExtension,
      gitBranch: context.gitBranch,
      gitChangedFiles: context.gitChangedFiles,
      activeDomains: context.activeDomains
    };
  }
  
  /**
   * 패턴 업데이트
   */
  _updatePatterns() {
    if (this.commandHistory.length < this.options.sequenceLength) {
      return;
    }
    
    // 모든 가능한 시퀀스를 찾아 패턴 업데이트
    for (let i = 0; i <= this.commandHistory.length - this.options.sequenceLength; i++) {
      const sequence = this.commandHistory.slice(i, i + this.options.sequenceLength).map(record => record.command);
      const sequenceKey = sequence.join('|');
      
      // 패턴 카운트 증가
      if (!this.patterns[sequenceKey]) {
        this.patterns[sequenceKey] = {
          sequence: sequence,
          count: 1,
          lastSeen: Date.now()
        };
      } else {
        this.patterns[sequenceKey].count++;
        this.patterns[sequenceKey].lastSeen = Date.now();
      }
    }
    
    // 일정 기간 미사용 패턴 정리 (90일)
    const now = Date.now();
    const INACTIVE_THRESHOLD = 90 * 24 * 60 * 60 * 1000; // 90일
    
    Object.keys(this.patterns).forEach(key => {
      if (now - this.patterns[key].lastSeen > INACTIVE_THRESHOLD) {
        delete this.patterns[key];
      }
    });
  }
  
  /**
   * 현재 워크플로우 업데이트
   * @param {string} command 실행된 명령어
   * @param {Object} context 컨텍스트
   */
  _updateCurrentWorkflow(command, context) {
    if (!command) return;
    
    // 도메인 추출
    const domain = this._extractDomain(command);
    
    // 도메인 워크플로우 템플릿 가져오기
    const domainTemplates = this.workflowTemplates[domain];
    if (!domainTemplates) {
      this.currentWorkflow = null;
      return;
    }
    
    // 명령어가 어떤 워크플로우에 속하는지 확인
    for (const [workflowId, workflow] of Object.entries(domainTemplates)) {
      if (workflow.commands.includes(command)) {
        this.currentWorkflow = {
          domain: domain,
          id: workflowId,
          template: workflow,
          currentStep: command,
          nextStep: workflow.nextStepMap[command] || null,
          contextSnapshot: this._extractRelevantContext(context)
        };
        return;
      }
    }
    
    // 어떤 워크플로우에도 속하지 않는 경우
    this.currentWorkflow = null;
  }
  
  /**
   * 명령어에서 도메인 추출
   * @param {string} command 명령어
   * @returns {string} 도메인
   */
  _extractDomain(command) {
    if (!command) return '';
    
    // '@git:status' 형식에서 'git' 추출
    const match = command.match(/^@([a-z]+):/);
    return match ? match[1] : '';
  }
  
  /**
   * 사용자 패턴 기반 추천
   * @param {Object} context 현재 컨텍스트
   * @param {number} limit 최대 추천 수
   * @returns {string[]} 추천 명령어 목록
   */
  suggestByPatterns(context, limit = 3) {
    if (Object.keys(this.patterns).length === 0 || this.commandHistory.length === 0) {
      return [];
    }
    
    // 최근 명령어 확인
    const recentCommands = this.commandHistory.slice(0, this.options.sequenceLength).map(record => record.command);
    
    // 일치하는 패턴 찾기
    const matchingPatterns = [];
    
    // 모든 패턴에 대해 현재 시퀀스와 일치 여부 확인
    for (const [key, pattern] of Object.entries(this.patterns)) {
      // 최소 발생 횟수 미만인 패턴은 무시
      if (pattern.count < this.options.minOccurrence) {
        continue;
      }
      
      // 패턴 시퀀스와 최근 명령어 비교
      let matchCount = 0;
      for (let i = 0; i < Math.min(recentCommands.length, pattern.sequence.length - 1); i++) {
        if (recentCommands[i] === pattern.sequence[i]) {
          matchCount++;
        }
      }
      
      // 매칭 점수 계산
      const matchScore = matchCount / (pattern.sequence.length - 1);
      
      // 임계값 이상인 경우 매칭 패턴으로 간주
      if (matchScore >= this.options.patternMatchThreshold) {
        matchingPatterns.push({
          nextCommand: pattern.sequence[pattern.sequence.length - 1],
          count: pattern.count,
          score: matchScore
        });
      }
    }
    
    // 매칭 점수 및 발생 횟수로 정렬
    matchingPatterns.sort((a, b) => {
      // 점수가 같으면 발생 횟수로 정렬
      if (Math.abs(a.score - b.score) < 0.1) {
        return b.count - a.count;
      }
      
      // 점수로 정렬
      return b.score - a.score;
    });
    
    // 상위 N개 추천 명령어 반환
    return matchingPatterns.slice(0, limit).map(match => match.nextCommand);
  }
  
  /**
   * 워크플로우 기반 추천
   * @param {Object} context 현재 컨텍스트
   * @param {number} limit 최대 추천 수
   * @returns {string[]} 추천 명령어 목록
   */
  suggestByWorkflow(context, limit = 3) {
    const suggestions = [];
    
    // 현재 워크플로우가 있는 경우 다음 단계 제안
    if (this.currentWorkflow && this.currentWorkflow.nextStep) {
      suggestions.push(this.currentWorkflow.nextStep);
    }
    
    // 현재 컨텍스트에 적합한 워크플로우 추천
    const contextDomain = this._getDomainFromContext(context);
    if (contextDomain && this.workflowTemplates[contextDomain]) {
      // 도메인 워크플로우 템플릿 가져오기
      const domainTemplates = this.workflowTemplates[contextDomain];
      
      // 각 워크플로우의 첫 번째 명령어 제안
      for (const workflow of Object.values(domainTemplates)) {
        if (workflow.commands && workflow.commands.length > 0) {
          suggestions.push(workflow.commands[0]);
        }
      }
    }
    
    // 중복 제거 및 제한
    return [...new Set(suggestions)].slice(0, limit);
  }
  
  /**
   * 컨텍스트에서 도메인 추출
   * @param {Object} context 컨텍스트
   * @returns {string} 도메인
   */
  _getDomainFromContext(context) {
    if (!context) return null;
    
    // 활성 도메인 확인
    if (context.activeDomains) {
      // Git 변경이 있는 경우 Git 도메인 우선
      if (context.activeDomains.git && context.gitChangedFiles > 0) {
        return 'git';
      }
      
      // 활성화된 첫 번째 도메인 반환
      for (const [domain, isActive] of Object.entries(context.activeDomains)) {
        if (isActive) {
          return domain;
        }
      }
    }
    
    // 파일 확장자 기반 도메인 추론
    if (context.fileExtension) {
      const ext = context.fileExtension.toLowerCase();
      
      // 코드 파일인 경우 Git 도메인 추천
      if (['js', 'ts', 'java', 'py', 'c', 'cpp', 'cs', 'go', 'php', 'rb'].includes(ext)) {
        return 'git';
      }
      
      // 문서 파일인 경우 Jira 또는 Doc 도메인 추천
      if (['md', 'txt', 'docx', 'pdf'].includes(ext)) {
        return Math.random() > 0.5 ? 'jira' : 'doc';
      }
    }
    
    return null;
  }
  
  /**
   * 통합 명령어 추천
   * @param {Object} context 현재 컨텍스트
   * @param {number} limit 최대 추천 수
   * @returns {string[]} 추천 명령어 목록
   */
  suggestCommands(context, limit = 5) {
    const suggestions = [];
    
    // 1. 워크플로우 기반 추천
    const workflowSuggestions = this.suggestByWorkflow(context, Math.floor(limit / 2));
    suggestions.push(...workflowSuggestions);
    
    // 2. 패턴 기반 추천
    const patternSuggestions = this.suggestByPatterns(context, Math.floor(limit / 2));
    suggestions.push(...patternSuggestions);
    
    // 중복 제거
    const uniqueSuggestions = [...new Set(suggestions)];
    
    // 추천 항목이 충분하지 않은 경우 도메인 기반 일반 추천 추가
    if (uniqueSuggestions.length < limit) {
      const domain = this._getDomainFromContext(context);
      if (domain && this.workflowTemplates[domain]) {
        // 도메인의 모든 워크플로우에서 명령어 수집
        const domainCommands = [];
        for (const workflow of Object.values(this.workflowTemplates[domain])) {
          domainCommands.push(...workflow.commands);
        }
        
        // 중복 제거
        const uniqueDomainCommands = [...new Set(domainCommands)]
          .filter(cmd => !uniqueSuggestions.includes(cmd));
        
        // 부족한 만큼 추가
        uniqueSuggestions.push(...uniqueDomainCommands.slice(0, limit - uniqueSuggestions.length));
      }
    }
    
    // 최대 개수만큼 반환
    return uniqueSuggestions.slice(0, limit);
  }
  
  /**
   * 히스토리 지우기
   */
  clearHistory() {
    this.commandHistory = [];
    this.patterns = {};
    this.currentWorkflow = null;
  }
  
  /**
   * 리소스 정리
   */
  dispose() {
    this.clearHistory();
  }
}

// 모듈 내보내기 (브라우저 환경에서)
if (typeof window !== 'undefined') {
  window.WorkflowAnalyzer = WorkflowAnalyzer;
}