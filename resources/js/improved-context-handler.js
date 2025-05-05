/**
 * 개선된 컨텍스트 핸들러 모듈
 * 
 * 컨텍스트 인식 명령어 및 제안을 위한 고급 컨텍스트 처리 로직
 * ApeHybridUI 및 CommandAutocomplete와 함께 작동
 * 
 * 주요 기능:
 * - 작업 환경, Git 상태, 파일 타입 등 다양한 컨텍스트 추적
 * - 사용 패턴 및 히스토리 기반 명령어 추천
 * - 파일 타입 및 도메인 관련성 분석
 * - 워크플로우 기반 명령어 시퀀스 추천
 * - 실시간 컨텍스트 변화 감지 및 적응형 추천
 */

class ImprovedContextHandler {
  /**
   * 생성자
   * @param {Object} options 옵션
   */
  constructor(options = {}) {
    this.options = Object.assign({
      contextUpdateInterval: 30000, // 자동 컨텍스트 업데이트 간격 (밀리초)
      maxHistory: 20,              // 이전 명령어 히스토리 최대 크기
      baseWeight: 10,              // 기본 가중치
      recentBonus: 5,              // 최근 사용 보너스
      contextBonus: 8,             // 컨텍스트 관련성 보너스
      gitWeight: 10,               // Git 관련성 가중치
      fileTypeWeight: 8,           // 파일 타입 관련성 가중치
      workflowWeight: 6            // 워크플로우 관련성 가중치
    }, options);
    
    // 컨텍스트 데이터
    this.context = {
      workspaceRoot: null,
      activeFile: null,
      activeFileType: null,
      gitBranch: null,
      gitStatus: null,
      gitChangedFiles: 0,
      selectedText: null,
      recentCommands: [],
      activeDomains: {}
    };
    
    // 무시할 파일 유형 패턴
    this.ignoreFilesPattern = /\.(jpg|jpeg|png|gif|bmp|ico|svg|ttf|woff|woff2|eot)$/i;
    
    // 워크플로우 패턴 (자주 함께 사용되는 명령어 그룹)
    this.workflowPatterns = [
      // Git 워크플로우
      ['@git:status', '@git:diff', '@git:add', '@git:commit', '@git:push'],
      
      // Jira 워크플로우
      ['@jira:issue', '@jira:comment', '@jira:update'],
      
      // 문서 작성 워크플로우
      ['@doc:search', '@doc:create', '@doc:update'],
      
      // 코드 리뷰 워크플로우
      ['@git:diff', '@git:blame', '@git:log', '@git:show']
    ];
    
    // 도메인별 파일 유형 관련성
    this.domainFileTypeMap = {
      'git': ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.go', '.rb', '.php', '.html', '.css', '.json', '.yml', '.yaml'],
      'jira': ['.md', '.txt', '.json', '.js', '.ts', '.java'],
      'doc': ['.md', '.txt', '.pdf'],
      'pocket': ['.md', '.txt', '.html', '.pdf'],
      'swdp': ['.js', '.ts', '.jsx', '.tsx', '.py', '.java']
    };
    
    // 자동 업데이트 타이머
    this.updateTimer = null;
    
    // 컨텍스트 업데이트 콜백
    this.onContextUpdated = null;
    
    // 초기화
    this.init();
  }
  
  /**
   * 초기화
   */
  init() {
    // 자동 업데이트 타이머 시작
    this.startAutoUpdate();
    
    console.log('ImprovedContextHandler 초기화됨');
  }
  
  /**
   * 자동 업데이트 시작
   */
  startAutoUpdate() {
    // 기존 타이머가 있으면 정리
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    // 주기적으로 컨텍스트 업데이트 요청
    this.updateTimer = setInterval(() => {
      if (window.vscode) {
        window.vscode.postMessage({
          command: 'getContext'
        });
      }
    }, this.options.contextUpdateInterval);
  }
  
  /**
   * 컨텍스트 업데이트
   * @param {Object} newContext 새 컨텍스트 객체
   */
  updateContext(newContext) {
    // 기존 컨텍스트와 새 컨텍스트 병합
    const oldContext = this.context;
    this.context = { ...this.context, ...newContext };
    
    // 파일 타입 추출
    if (newContext.activeFile) {
      const fileExtMatch = newContext.activeFile.match(/\.([^.]+)$/);
      this.context.activeFileType = fileExtMatch ? `.${fileExtMatch[1].toLowerCase()}` : null;
    }
    
    // 명령어 이력 중복 제거 및 크기 제한
    if (newContext.recentCommands) {
      this.context.recentCommands = [...new Set(newContext.recentCommands)]
        .slice(0, this.options.maxHistory);
    }
    
    // 컨텍스트 변경 여부 확인
    const hasSignificantChanges = this._checkSignificantChanges(oldContext, this.context);
    
    // 콜백 호출
    if (this.onContextUpdated && hasSignificantChanges) {
      this.onContextUpdated(this.context);
    }
    
    return hasSignificantChanges;
  }
  
  /**
   * 주요 컨텍스트 변경 사항 확인
   * @param {Object} oldContext 이전 컨텍스트
   * @param {Object} newContext 새 컨텍스트
   * @returns {boolean} 주요 변경 사항 여부
   */
  _checkSignificantChanges(oldContext, newContext) {
    if (!oldContext) return true;
    
    // 주요 필드 변경 확인
    return oldContext.activeFile !== newContext.activeFile ||
           oldContext.gitBranch !== newContext.gitBranch ||
           oldContext.gitChangedFiles !== newContext.gitChangedFiles ||
           (oldContext.selectedText !== newContext.selectedText && newContext.selectedText) ||
           JSON.stringify(oldContext.activeDomains) !== JSON.stringify(newContext.activeDomains);
  }
  
  /**
   * 컨텍스트 기반 명령어 생성
   * @param {string} baseCommand 기본 명령어
   * @returns {string|string[]} 컨텍스트 인식 명령어 또는 명령어 배열
   */
  generateContextualCommand(baseCommand) {
    if (!baseCommand) return '';
    
    // 도메인 추출
    const domain = this._extractDomain(baseCommand);
    
    // 도메인별 처리 로직
    switch (domain) {
      case 'git':
        return this._generateGitCommand(baseCommand);
      
      case 'jira':
        return this._generateJiraCommand(baseCommand);
      
      case 'doc':
        return this._generateDocCommand(baseCommand);
      
      case 'pocket':
        return this._generatePocketCommand(baseCommand);
      
      case 'swdp':
        return this._generateSwdpCommand(baseCommand);
      
      default:
        return baseCommand;
    }
  }
  
  /**
   * 명령어에서 도메인 추출
   * @param {string} command 명령어
   * @returns {string} 도메인
   */
  _extractDomain(command) {
    // '@git:status' 형식에서 'git' 추출
    const match = command.match(/^@([a-z]+):/);
    return match ? match[1] : '';
  }
  
  /**
   * Git 명령어 생성
   * @param {string} baseCommand 기본 명령어
   * @returns {string|string[]} 컨텍스트 인식 명령어
   */
  _generateGitCommand(baseCommand) {
    // 명령어 유형 추출 (status, commit 등)
    const commandType = baseCommand.split(':')[1];
    
    if (!commandType) return baseCommand;
    
    switch (commandType) {
      case 'commit':
        // 변경된 파일 정보가 있는 경우
        if (this.context.gitChangedFiles > 0) {
          const fileName = this.context.activeFile ? 
                          this.context.activeFile.split('/').pop() : 'changes';
          
          return `@git:commit -m "Update ${fileName}"`;
        }
        break;
        
      case 'push':
        // 브랜치 정보가 있는 경우
        if (this.context.gitBranch) {
          return `@git:push origin ${this.context.gitBranch}`;
        }
        break;
        
      case 'pull':
        // 브랜치 정보가 있는 경우
        if (this.context.gitBranch) {
          return `@git:pull origin ${this.context.gitBranch}`;
        }
        break;
        
      case 'checkout':
        // 브랜치 정보가 있는 경우 여러 옵션 제공
        const currentBranch = this.context.gitBranch;
        
        // 현재 브랜치 외의 브랜치로 체크아웃 옵션 제공
        if (currentBranch) {
          // 기본 브랜치 옵션 (main 또는 master)
          const defaultBranchOptions = ['main', 'master'].filter(b => b !== currentBranch);
          const defaultBranchCommands = defaultBranchOptions.map(b => `@git:checkout ${b}`);
          
          // 새 브랜치 생성 옵션
          const newBranchCommand = `@git:checkout -b new-${currentBranch}-feature`;
          
          return [baseCommand, ...defaultBranchCommands, newBranchCommand];
        }
        break;
        
      case 'diff':
        // 브랜치 정보가 있는 경우
        if (this.context.gitBranch) {
          const mainBranch = this.context.gitBranch === 'main' ? 'HEAD' : 'main';
          return [
            `@git:diff`,
            `@git:diff --staged`,
            `@git:diff ${mainBranch}`
          ];
        }
        break;
    }
    
    return baseCommand;
  }
  
  /**
   * Jira 명령어 생성
   * @param {string} baseCommand 기본 명령어
   * @returns {string|string[]} 컨텍스트 인식 명령어
   */
  _generateJiraCommand(baseCommand) {
    // 명령어 유형 추출
    const commandType = baseCommand.split(':')[1];
    
    if (!commandType) return baseCommand;
    
    switch (commandType) {
      case 'issue':
        // 이슈 키가 컨텍스트에 있는 경우
        if (this.context.issueKey) {
          return `@jira:issue ${this.context.issueKey}`;
        }
        break;
        
      case 'create':
        // 활성 파일 기반 이슈 생성
        if (this.context.activeFile) {
          const fileName = this.context.activeFile.split('/').pop();
          return `@jira:create --title "Issue with ${fileName}"`;
        }
        break;
        
      case 'search':
        // 선택된 텍스트 기반 검색
        if (this.context.selectedText && this.context.selectedText.length < 50) {
          return `@jira:search "${this.context.selectedText}"`;
        }
        break;
    }
    
    return baseCommand;
  }
  
  /**
   * Doc 명령어 생성
   * @param {string} baseCommand 기본 명령어
   * @returns {string|string[]} 컨텍스트 인식 명령어
   */
  _generateDocCommand(baseCommand) {
    // 명령어 유형 추출
    const commandType = baseCommand.split(':')[1];
    
    if (!commandType) return baseCommand;
    
    switch (commandType) {
      case 'search':
        // 선택된 텍스트 기반 검색
        if (this.context.selectedText && this.context.selectedText.length < 50) {
          return `@doc:search "${this.context.selectedText}"`;
        }
        break;
        
      case 'create':
        // 활성 파일 기반 문서 생성
        if (this.context.activeFile) {
          const fileName = this.context.activeFile.split('/').pop().replace(/\.[^.]+$/, '');
          return `@doc:create ${fileName}`;
        }
        break;
    }
    
    return baseCommand;
  }
  
  /**
   * Pocket 명령어 생성
   * @param {string} baseCommand 기본 명령어
   * @returns {string|string[]} 컨텍스트 인식 명령어
   */
  _generatePocketCommand(baseCommand) {
    // 명령어 유형 추출
    const commandType = baseCommand.split(':')[1];
    
    if (!commandType) return baseCommand;
    
    switch (commandType) {
      case 'search':
        // 선택된 텍스트 기반 검색
        if (this.context.selectedText && this.context.selectedText.length < 50) {
          return `@pocket:search "${this.context.selectedText}"`;
        }
        break;
    }
    
    return baseCommand;
  }
  
  /**
   * SWDP 명령어 생성
   * @param {string} baseCommand 기본 명령어
   * @returns {string|string[]} 컨텍스트 인식 명령어
   */
  _generateSwdpCommand(baseCommand) {
    // 명령어 유형 추출
    const commandType = baseCommand.split(':')[1];
    
    if (!commandType) return baseCommand;
    
    switch (commandType) {
      case 'build':
        // 활성 파일 기반 빌드
        if (this.context.activeFile) {
          const fileDir = this.context.activeFile.split('/').slice(0, -1).join('/');
          return `@swdp:build ${fileDir}`;
        }
        break;
        
      case 'test':
        // 활성 파일 기반 테스트
        if (this.context.activeFile) {
          const fileName = this.context.activeFile.split('/').pop();
          return `@swdp:test ${fileName}`;
        }
        break;
    }
    
    return baseCommand;
  }
  
  /**
   * 선택된 텍스트에서 컨텍스트 키워드 추출
   * @returns {string[]} 키워드 배열
   */
  extractKeywordsFromSelection() {
    if (!this.context.selectedText) return [];
    
    const text = this.context.selectedText;
    
    // 간단한 키워드 추출 로직
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // 기호 제거
      .split(/\s+/)              // 공백으로 분리
      .filter(word => word.length > 2);  // 2글자 이하 필터링
    
    // 중복 제거
    return [...new Set(words)];
  }
  
  /**
   * 컨텍스트 인식 명령어 제안
   * @param {Array} allCommands 전체 명령어 목록
   * @param {number} limit 최대 제안 수
   * @returns {Array} 제안 명령어 목록
   */
  suggestCommands(allCommands, limit = 5) {
    if (!allCommands || !Array.isArray(allCommands) || allCommands.length === 0) {
      return [];
    }
    
    // 컨텍스트 관련성에 따라 명령어에 가중치 부여
    const commandsWithScore = allCommands.map(cmd => {
      const score = this._calculateCommandScore(cmd);
      return { ...cmd, score };
    });
    
    // 점수에 따라 정렬 (내림차순)
    const sortedCommands = commandsWithScore.sort((a, b) => b.score - a.score);
    
    // 상위 N개 명령어 선택
    return sortedCommands.slice(0, limit);
  }
  
  /**
   * 명령어 점수 계산
   * @param {Object} command 명령어 객체
   * @returns {number} 점수
   */
  _calculateCommandScore(command) {
    // 기본 점수
    let score = this.options.baseWeight;
    
    // 명령어 ID
    const commandId = command.id || '';
    
    // 도메인
    const domain = this._extractDomain(commandId);
    
    // 최근 사용된 명령어인 경우 가중치 추가
    if (this.context.recentCommands && this.context.recentCommands.includes(commandId)) {
      const index = this.context.recentCommands.indexOf(commandId);
      const recencyBonus = this.options.recentBonus * (1 - index / this.context.recentCommands.length);
      score += recencyBonus;
    }
    
    // 활성 파일 타입에 관련된 명령어인 경우 가중치 추가
    if (this.context.activeFileType && this.domainFileTypeMap[domain]) {
      if (this.domainFileTypeMap[domain].includes(this.context.activeFileType)) {
        score += this.options.fileTypeWeight;
      }
    }
    
    // Git 관련 컨텍스트
    if (domain === 'git' && this.context.gitBranch) {
      // Git 브랜치가 있는 경우 Git 명령어 가중치 추가
      score += this.options.gitWeight;
      
      // 변경된 파일이 있는 경우 특정 Git 명령어에 추가 가중치
      if (this.context.gitChangedFiles > 0) {
        if (commandId.includes('commit') || commandId.includes('add') || commandId.includes('status')) {
          score += this.options.gitWeight * 0.5;
        }
      }
    }
    
    // 워크플로우 관련성 - 연속적으로 사용되는 명령어에 가중치 추가
    if (this.context.recentCommands && this.context.recentCommands.length > 0) {
      const lastCommand = this.context.recentCommands[0];
      
      // 워크플로우 패턴 확인
      for (const pattern of this.workflowPatterns) {
        const lastIndex = pattern.indexOf(lastCommand);
        if (lastIndex >= 0 && lastIndex < pattern.length - 1) {
          // 다음 단계 명령어인 경우
          if (pattern[lastIndex + 1] === commandId) {
            score += this.options.workflowWeight;
            break;
          }
        }
      }
    }
    
    // 활성 도메인 관련 명령어인 경우 가중치 추가
    if (domain && this.context.activeDomains && this.context.activeDomains[domain]) {
      score += this.options.contextBonus;
    }
    
    return score;
  }
  
  /**
   * 컨텍스트 요약 문자열 생성
   * @returns {string} 컨텍스트 요약
   */
  getContextSummary() {
    const summary = [];
    
    if (this.context.workspaceRoot) {
      summary.push(`작업 폴더: ${this.context.workspaceRoot}`);
    }
    
    if (this.context.activeFile) {
      summary.push(`현재 파일: ${this.context.activeFile}`);
    }
    
    if (this.context.gitBranch) {
      summary.push(`Git 브랜치: ${this.context.gitBranch}`);
    }
    
    if (this.context.gitChangedFiles > 0) {
      summary.push(`변경된 파일: ${this.context.gitChangedFiles}개`);
    }
    
    if (this.context.selectedText) {
      const truncatedText = this.context.selectedText.length > 30 ? 
                          this.context.selectedText.substring(0, 30) + '...' : 
                          this.context.selectedText;
      summary.push(`선택된 텍스트: ${truncatedText}`);
    }
    
    return summary.join('\n');
  }
  
  /**
   * 리소스 정리
   */
  dispose() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
}

// 모듈 내보내기 (브라우저 환경에서)
if (typeof window !== 'undefined') {
  window.ImprovedContextHandler = ImprovedContextHandler;
}