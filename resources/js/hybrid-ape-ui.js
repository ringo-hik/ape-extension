/**
 * APE 하이브리드 UI 구현
 * 자연어 인터페이스와 명령어 기반 도구를 통합하는 개선된 UI
 */

// VS Code API 가져오기
const vscode = acquireVsCodeApi();

class ApeHybridUI {
  constructor() {
    // DOM 요소
    this.messagesContainer = document.getElementById('messages');
    this.chatInput = document.getElementById('chatInput');
    this.sendButton = document.getElementById('sendButton');
    this.clearButton = document.getElementById('clearButton');
    this.embedDevButton = document.getElementById('embedDevButton');
    this.commandsButton = document.getElementById('commandsButton');
    this.apeToggleButton = document.getElementById('apeToggleButton');
    this.commandsPanelContainer = document.getElementById('commandsPanelContainer');
    this.commandsPanel = document.getElementById('commandsPanel');
    this.emptyState = document.getElementById('emptyState');
    this.autoCompleteContainer = document.getElementById('autoCompleteContainer');
    
    // 하이브리드 UI 전용 DOM 요소
    this.contextPanel = document.getElementById('contextPanel');
    this.suggestionBar = document.getElementById('suggestionBar');
    this.domainToolbar = document.getElementById('domainToolbar');
    
    // 상태
    this.messageState = vscode.getState() || { messages: [] };
    this.streamingState = {
      activeStreams: {},
      isStreaming: false
    };
    this.embedDevMode = false;
    this.darkMode = true; // 기본값: 다크 모드
    this.clearingFromServer = false;
    this.modelSelector = window.modelSelector || null;
    this.commandAutocomplete = null;
    this.autoResizeObserver = null;
    this.apeMode = false; // APE 모드 상태
    
    // 컨텍스트 분석 상태
    this.currentContext = null;
    this.suggestions = [];
    this.domainState = {
      git: { active: false, count: 0 },
      jira: { active: false, count: 0 },
      pocket: { active: false, count: 0 },
      swdp: { active: false, count: 0 }
    };
    
    // 명령어 패널 상태
    this.commandPanelVisible = false;
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
    // 컨텍스트 핸들러 초기화 (Context Handler)
    this.contextHandler = window.ImprovedContextHandler ? 
      new ImprovedContextHandler({
        onContextUpdated: (ctx) => this.handleContextUpdate(ctx)
      }) : null;
    
    // 워크플로우 분석기 초기화
    this.workflowAnalyzer = window.WorkflowAnalyzer ?
      new WorkflowAnalyzer({
        maxHistorySize: 50,
        sequenceLength: 3,
        minOccurrence: 2,
      }) : null;

    // 초기화
    this.initialize();
  }
  
  /**
   * 컨텍스트 업데이트 처리
   * @param {Object} context 업데이트된 컨텍스트
   */
  handleContextUpdate(context) {
    if (!context) return;
    
    console.log('컨텍스트 업데이트 감지:', Object.keys(context));
    
    // 워크플로우 분석기에 컨텍스트 전달
    if (this.workflowAnalyzer) {
      this.workflowAnalyzer.lastContext = context;
    }
    
    // 통합 추천 명령어 생성 및 표시
    if (this.commands && this.commands.length > 0) {
      const suggestions = [];
      
      // 1. 컨텍스트 기반 추천
      if (this.contextHandler) {
        const contextSuggestions = this.contextHandler.suggestCommands(this.commands, 3);
        if (contextSuggestions && contextSuggestions.length > 0) {
          suggestions.push(...contextSuggestions);
        }
      }
      
      // 2. 워크플로우 기반 추천
      if (this.workflowAnalyzer) {
        const workflowSuggestions = this.workflowAnalyzer.suggestNextCommands(2);
        if (workflowSuggestions && workflowSuggestions.length > 0) {
          suggestions.push(...workflowSuggestions);
        }
      }
      
      // 중복 제거 및 정렬
      if (suggestions.length > 0) {
        // 중복 제거 (ID 기반)
        const uniqueSuggestions = [];
        const ids = new Set();
        
        for (const suggestion of suggestions) {
          if (!ids.has(suggestion.id)) {
            ids.add(suggestion.id);
            uniqueSuggestions.push(suggestion);
          }
        }
        
        // 정렬 (점수 기반)
        uniqueSuggestions.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        // 최대 5개까지만 표시
        const limitedSuggestions = uniqueSuggestions.slice(0, 5);
        
        // 추천 명령어 표시
        this.updateSuggestions(limitedSuggestions);
      }
    }
    
    // 현재 컨텍스트 업데이트
    this.currentContext = context;
    
    // 도메인 상태 업데이트
    this.updateDomainState(context);
  }
  
  /**
   * 도메인 상태 업데이트
   * @param {Object} context 현재 컨텍스트
   */
  updateDomainState(context) {
    if (!context) return;
    
    // Git 상태 확인
    if (context.git) {
      this.domainState.git.active = true;
      this.domainState.git.count = (this.domainState.git.count || 0) + 1;
      
      // Git 상태 정보 표시 (예: 현재 브랜치, 변경 파일 수)
      if (context.git.branch || context.git.changedFiles) {
        // Git 도메인 버튼 강조
        const gitButton = this.domainToolbar ? 
          this.domainToolbar.querySelector('[data-domain="git"]') : null;
        
        if (gitButton) {
          gitButton.classList.add('active');
          
          // 툴팁 업데이트
          const branchInfo = context.git.branch ? `브랜치: ${context.git.branch}` : '';
          const filesInfo = context.git.changedFiles ? 
            `변경: ${context.git.changedFiles.length}개 파일` : '';
          
          gitButton.title = `Git ${branchInfo}\n${filesInfo}`.trim();
        }
      }
    }
    
    // Jira 상태 확인
    if (context.jira) {
      this.domainState.jira.active = true;
      this.domainState.jira.count = (this.domainState.jira.count || 0) + 1;
      
      // Jira 버튼 강조
      const jiraButton = this.domainToolbar ? 
        this.domainToolbar.querySelector('[data-domain="jira"]') : null;
      
      if (jiraButton) {
        jiraButton.classList.add('active');
      }
    }
    
    // Pocket 상태 확인
    if (context.pocket) {
      this.domainState.pocket.active = true;
      this.domainState.pocket.count = (this.domainState.pocket.count || 0) + 1;
      
      // Pocket 버튼 강조
      const pocketButton = this.domainToolbar ? 
        this.domainToolbar.querySelector('[data-domain="pocket"]') : null;
      
      if (pocketButton) {
        pocketButton.classList.add('active');
      }
    }
    
    // SWDP 상태 확인
    if (context.swdp) {
      this.domainState.swdp.active = true;
      this.domainState.swdp.count = (this.domainState.swdp.count || 0) + 1;
      
      // SWDP 버튼 강조
      const swdpButton = this.domainToolbar ? 
        this.domainToolbar.querySelector('[data-domain="swdp"]') : null;
      
      if (swdpButton) {
        swdpButton.classList.add('active');
      }
    }
  }
  
  /**
   * UI 초기화
   */
  initialize() {
    // 메시지 렌더링
    this.renderMessages();
    
    // 명령어 목록 요청
    vscode.postMessage({
      command: 'getCommands'
    });
    
    // 컨텍스트 정보 요청
    vscode.postMessage({
      command: 'getContext'
    });
    
    // 자동 크기 조절 초기화
    this.autoResizeTextarea();
    
    // 컨텍스트 패널이 없는 경우 동적으로 생성
    if (!this.contextPanel) {
      this.createContextPanel();
    }
    
    // 모델 선택기 참조 초기화
    this.initModelSelector();
    
    // 제안 바가 없는 경우 동적으로 생성
    if (!this.suggestionBar) {
      this.createSuggestionBar();
    }
    
    // 도메인 도구바가 없는 경우 동적으로 생성
    if (!this.domainToolbar) {
      this.createDomainToolbar();
    }
    
    // VS Code에 초기화 완료 메시지 전송
    vscode.postMessage({
      command: 'initialized',
      timestamp: Date.now()
    });
  }
  
  /**
   * 모델 선택기 초기화
   */
  initModelSelector() {
    // 전역 객체에서 modelSelector 참조 가져오기
    if (window.modelSelector) {
      this.modelSelector = window.modelSelector;
      console.log('모델 선택기 참조 가져옴:', this.modelSelector);
      
      // 채팅 입력창에 현재 모델 ID 설정
      if (this.chatInput && this.modelSelector.getCurrentModelId()) {
        this.chatInput.dataset.model = this.modelSelector.getCurrentModelId();
        console.log(`채팅 입력창에 모델 ID 설정: ${this.chatInput.dataset.model}`);
      }
    } else {
      console.warn('모델 선택기 객체를 찾을 수 없음. 지연 초기화 시도...');
      
      // 약간의 지연 후 다시 시도
      setTimeout(() => {
        if (window.modelSelector) {
          this.modelSelector = window.modelSelector;
          console.log('지연된 모델 선택기 참조 가져옴');
          
          // 채팅 입력창에 현재 모델 ID 설정
          if (this.chatInput && this.modelSelector.getCurrentModelId()) {
            this.chatInput.dataset.model = this.modelSelector.getCurrentModelId();
            console.log(`채팅 입력창에 모델 ID 설정: ${this.chatInput.dataset.model}`);
          }
        } else {
          // VS Code에 모델 목록 요청
          console.log('모델 선택기를 찾을 수 없어 모델 목록 요청 전송');
          vscode.postMessage({
            command: 'getModelList'
          });
        }
      }, 1000);
    }
  }
  
  /**
   * 컨텍스트 패널 생성
   */
  createContextPanel() {
    // 채팅 컨테이너 가져오기
    const chatContainer = document.querySelector('.chat-container');
    if (!chatContainer) return;
    
    // 컨텍스트 패널 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'context-panel';
    container.id = 'contextPanel';
    
    // 기본 텍스트 추가
    container.innerHTML = `<div class="context-placeholder">컨텍스트 정보가 여기에 표시됩니다</div>`;
    
    // 채팅 컨테이너에 추가
    chatContainer.appendChild(container);
    
    // 레퍼런스 저장
    this.contextPanel = container;
  }
  
  /**
   * 제안 바 생성
   */
  createSuggestionBar() {
    // 입력 컨테이너 가져오기
    const inputWrapper = document.querySelector('.input-wrapper');
    if (!inputWrapper) return;
    
    // 제안 바 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'suggestion-bar';
    container.id = 'suggestionBar';
    
    // 기본 텍스트 추가
    container.innerHTML = `<div class="suggestion-placeholder">채팅 중 컨텍스트 기반 명령어가 여기에 표시됩니다</div>`;
    
    // 입력 영역 위에 추가
    inputWrapper.parentNode.insertBefore(container, inputWrapper);
    
    // 레퍼런스 저장
    this.suggestionBar = container;
  }
  
  /**
   * 도메인 도구바 생성
   */
  createDomainToolbar() {
    const inputContainer = document.querySelector('.chat-input-container');
    if (!inputContainer) return;
    
    // 도구바 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'domain-toolbar';
    container.id = 'domainToolbar';
    
    // 도메인 버튼 추가
    container.innerHTML = `
      <button class="domain-button" data-domain="git" title="Git 명령어">
        <i class="ph ph-git-branch"></i>
        <span>Git</span>
      </button>
      <button class="domain-button" data-domain="jira" title="Jira 명령어">
        <i class="ph ph-kanban"></i>
        <span>Jira</span>
      </button>
      <button class="domain-button" data-domain="pocket" title="Pocket 명령어">
        <i class="ph ph-archive-box"></i>
        <span>Pocket</span>
      </button>
      <button class="domain-button" data-domain="swdp" title="SWDP 명령어">
        <i class="ph ph-infinity"></i>
        <span>SWDP</span>
      </button>
      <button class="domain-button" data-domain="more" title="더보기">
        <i class="ph ph-dots-three"></i>
        <span>더보기</span>
      </button>
    `;
    
    // 입력 영역 위에 추가
    inputContainer.insertBefore(container, this.chatInput.closest('.input-wrapper'));
    
    // 레퍼런스 저장
    this.domainToolbar = container;
    
    // 이벤트 리스너 추가
    const domainButtons = container.querySelectorAll('.domain-button');
    domainButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const domain = button.dataset.domain;
        this.handleDomainButtonClick(domain);
      });
    });
  }
  
  /**
   * 도메인 버튼 클릭 처리
   * @param {string} domain 도메인 이름
   */
  handleDomainButtonClick(domain) {
    if (domain === 'more') {
      // 더보기 버튼은 명령어 패널 토글
      this.toggleCommandPanel();
    } else {
      // 도메인 버튼 클릭 시 해당 도메인 명령어 목록 표시
      this.showDomainCommands(domain);
    }
  }
  
  /**
   * 도메인 명령어 목록 표시
   * @param {string} domain 도메인 이름
   */
  showDomainCommands(domain) {
    // 모달로 명령어 목록 표시
    const domainNames = {
      'git': 'Git',
      'jira': 'Jira',
      'pocket': 'Pocket',
      'swdp': 'SWDP'
    };
    
    // 모달 컨테이너 생성
    const modalContainer = document.createElement('div');
    modalContainer.className = 'domain-commands-modal';
    modalContainer.id = 'domainCommandsModal';
    
    // 모달 내용 생성
    modalContainer.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title"><i class="ph ph-${this.getDomainIcon(domain).name}"></i> ${domainNames[domain] || domain} 명령어</h3>
          <button class="close-modal-btn"><i class="ph ph-x"></i></button>
        </div>
        <div class="modal-body">
          <div class="domain-commands-list">
            <div class="loading-indicator">명령어 목록 로드 중...</div>
          </div>
        </div>
      </div>
    `;
    
    // 모달 추가
    document.body.appendChild(modalContainer);
    
    // 닫기 버튼 이벤트 리스너
    const closeButton = modalContainer.querySelector('.close-modal-btn');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        modalContainer.remove();
      });
    }
    
    // 모달 외부 클릭 이벤트 리스너
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        modalContainer.remove();
      }
    });
    
    // ESC 키 이벤트 리스너
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        modalContainer.remove();
        document.removeEventListener('keydown', handleEscKey);
      }
    };
    document.addEventListener('keydown', handleEscKey);
    
    // 해당 도메인의 명령어 목록 필터링
    const domainCommands = this.commands ? this.commands.filter(cmd => {
      return cmd.domain === domain || 
            (cmd.id && cmd.id.startsWith(`@${domain}:`));
    }) : [];
    
    // 명령어 목록 컨테이너
    const commandsList = modalContainer.querySelector('.domain-commands-list');
    
    if (domainCommands.length > 0) {
      // 로딩 인디케이터 제거
      commandsList.innerHTML = '';
      
      // 명령어 목록 표시
      domainCommands.forEach(cmd => {
        const commandItem = document.createElement('div');
        commandItem.className = 'domain-command-item';
        commandItem.dataset.id = cmd.id;
        
        // 명령어 아이콘
        const iconName = cmd.iconName || this.getCommandIcon(cmd).name;
        const iconSource = cmd.iconName ? cmd.iconName.source : 'phosphor';
        
        commandItem.innerHTML = `
          <div class="command-icon">
            <i class="${iconSource === 'phosphor' ? 'ph' : 'codicon'} ${iconSource === 'phosphor' ? 'ph-' : 'codicon-'}${iconName}"></i>
          </div>
          <div class="command-details">
            <div class="command-label">${cmd.label || cmd.id}</div>
            <div class="command-syntax">${cmd.syntax || cmd.id}</div>
            ${cmd.description ? `<div class="command-description">${cmd.description}</div>` : ''}
          </div>
          <div class="command-action">
            <button class="use-command-btn">사용</button>
          </div>
        `;
        
        // 명령어 클릭 이벤트
        commandItem.addEventListener('click', () => {
          this.handleCommandSelected(cmd);
          modalContainer.remove();
        });
        
        // 버튼 클릭 이벤트
        const useButton = commandItem.querySelector('.use-command-btn');
        if (useButton) {
          useButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleCommandSelected(cmd);
            modalContainer.remove();
          });
        }
        
        commandsList.appendChild(commandItem);
      });
    } else {
      // 명령어가 없는 경우
      commandsList.innerHTML = `
        <div class="empty-commands">
          <i class="ph ph-warning"></i>
          <p>이 도메인의 사용 가능한 명령어가 없습니다.</p>
        </div>
      `;
    }
  }
  
  /**
   * 도메인 아이콘 가져오기
   * @param {string} domain 도메인 이름
   * @returns {Object} 아이콘 객체 {name: string, source: string}
   */
  getDomainIcon(domain) {
    const domainIcons = {
      'git': { name: 'git-branch', source: 'phosphor' },
      'jira': { name: 'kanban', source: 'phosphor' },
      'pocket': { name: 'archive-box', source: 'phosphor' },
      'swdp': { name: 'infinity', source: 'phosphor' },
      'more': { name: 'dots-three', source: 'phosphor' }
    };
    
    return domainIcons[domain] || { name: 'terminal', source: 'phosphor' };
  }
  
  /**
   * 명령어 아이콘 가져오기
   * @param {Object} command 명령어 객체
   * @returns {Object} 아이콘 객체 {name: string, source: string}
   */
  getCommandIcon(command) {
    // 이미 아이콘이 설정되어 있는 경우
    if (command.iconName) {
      return command.iconName;
    }
    
    // 도메인별 기본 아이콘
    const domainIcons = {
      'system': { name: 'gear-six', source: 'phosphor' },
      'git': { name: 'git-branch', source: 'phosphor' },
      'doc': { name: 'file-text', source: 'phosphor' },
      'jira': { name: 'kanban', source: 'phosphor' },
      'pocket': { name: 'archive-box', source: 'phosphor' },
      'vault': { name: 'database', source: 'phosphor' },
      'rules': { name: 'scales', source: 'phosphor' },
      'swdp': { name: 'infinity', source: 'phosphor' }
    };
    
    // 명령어별 아이콘
    const commandIcons = {
      // Git 관련
      'commit': { name: 'git-commit', source: 'phosphor' },
      'push': { name: 'arrow-up', source: 'phosphor' },
      'pull': { name: 'git-pull-request', source: 'phosphor' },
      'branch': { name: 'git-branch', source: 'phosphor' },
      'merge': { name: 'git-merge', source: 'phosphor' },
      'clone': { name: 'copy', source: 'phosphor' },
      
      // Jira 관련
      'issue': { name: 'note-pencil', source: 'phosphor' },
      'ticket': { name: 'note-pencil', source: 'phosphor' },
      'bug': { name: 'bug', source: 'phosphor' },
      'task': { name: 'clipboard-text', source: 'phosphor' },
      
      // 일반 명령어
      'help': { name: 'question', source: 'phosphor' },
      'model': { name: 'robot', source: 'phosphor' },
      'debug': { name: 'bug', source: 'phosphor' },
      'clear': { name: 'trash', source: 'phosphor' },
      'settings': { name: 'gear-six', source: 'phosphor' },
      'config': { name: 'sliders', source: 'phosphor' },
      'search': { name: 'magnifying-glass', source: 'phosphor' },
      'list': { name: 'list', source: 'phosphor' },
      'build': { name: 'hammer', source: 'phosphor' },
      'deploy': { name: 'cloud-arrow-up', source: 'phosphor' },
      'test': { name: 'test-tube', source: 'phosphor' },
      'document': { name: 'file-text', source: 'phosphor' },
      'save': { name: 'floppy-disk', source: 'phosphor' },
    };
    
    // 명령어 ID 또는 레이블에서 키워드 추출
    const cmdString = (command.id || command.label || '').toLowerCase();
    
    // 명령어 이름으로 직접 매칭
    for (const [keyword, icon] of Object.entries(commandIcons)) {
      if (cmdString.includes(keyword)) {
        return icon;
      }
    }
    
    // 도메인별 기본 아이콘
    const domain = command.domain || (cmdString.startsWith('@') ? cmdString.split(':')[0].substring(1) : '');
    return domainIcons[domain] || { name: 'terminal', source: 'phosphor' };
  }
  
  /**
   * 추천 명령어 업데이트
   * @param {Array} suggestions 추천 명령어 목록
   */
  updateSuggestions(suggestions) {
    if (!this.suggestionBar) return;
    
    // 기존 추천 항목 제거
    this.suggestionBar.innerHTML = '';
    
    // 추천 항목이 없는 경우 기본 텍스트 표시
    if (!suggestions || suggestions.length === 0) {
      this.suggestionBar.innerHTML = `<div class="suggestion-placeholder">채팅 중 컨텍스트 기반 명령어가 여기에 표시됩니다</div>`;
      return;
    }
    
    // 추천 항목 추가
    suggestions.forEach(suggestion => {
      const item = document.createElement('button');
      item.className = 'suggestion-item';
      item.dataset.id = suggestion.id;
      
      // 아이콘 설정
      const icon = this.getCommandIcon(suggestion);
      
      // 점수 표시 (디버깅용)
      const scoreText = suggestion.score ? `(${Math.round(suggestion.score * 100)}%)` : '';
      
      // HTML 구성
      item.innerHTML = `
        <i class="${icon.source === 'phosphor' ? 'ph' : 'codicon'} ${icon.source === 'phosphor' ? 'ph-' : 'codicon-'}${icon.name}"></i>
        <span>${suggestion.label || suggestion.id}</span>
      `;
      
      // 클릭 이벤트 리스너
      item.addEventListener('click', () => {
        this.handleCommandSelected(suggestion);
      });
      
      this.suggestionBar.appendChild(item);
    });
    
    // 저장
    this.suggestions = suggestions;
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners() {
    // VS Code 메시지 수신
    window.addEventListener('message', event => this.handleVSCodeMessage(event));
    
    // 채팅 입력창 이벤트
    this.chatInput.addEventListener('input', () => this.updateInputState());
    this.chatInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
    
    // 전송 버튼 클릭
    this.sendButton.addEventListener('click', () => this.sendMessage());
    
    // 초기화 버튼 클릭
    this.clearButton.addEventListener('click', () => {
      vscode.postMessage({ command: 'clearChat' });
    });
    
    // 심층 분석 모드 토글 버튼
    if (this.embedDevButton) {
      this.embedDevButton.addEventListener('click', () => this.toggleEmbedDevMode());
    }
    
    // 명령어 패널 토글 버튼
    if (this.commandsButton) {
      this.commandsButton.addEventListener('click', () => this.toggleCommandPanel());
    }
    
    // APE 모드 토글 버튼
    if (this.apeToggleButton) {
      this.apeToggleButton.addEventListener('click', () => this.toggleApeMode());
    }
  }
  
  /**
   * 리사이즈 관찰자 등록
   */
  registerResizeObserver() {
    // 텍스트 영역 자동 크기 조절을 위한 ResizeObserver
    if (this.chatInput && 'ResizeObserver' in window) {
      // 기존 관찰자 해제
      if (this.autoResizeObserver) {
        this.autoResizeObserver.disconnect();
      }
      
      // 새 관찰자 생성
      this.autoResizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          // 입력 영역 높이가 변경된 경우 스크롤
          if (entry.target === this.chatInput && this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
          }
        }
      });
      
      // 관찰 시작
      this.autoResizeObserver.observe(this.chatInput);
    }
  }
  
  /**
   * 텍스트 영역 자동 크기 조절
   */
  autoResizeTextarea() {
    if (!this.chatInput) return;
    
    const resize = () => {
      this.chatInput.style.height = 'auto';
      const newHeight = Math.min(this.chatInput.scrollHeight, 150);
      this.chatInput.style.height = `${newHeight}px`;
    };
    
    // 이벤트 리스너 등록
    this.chatInput.addEventListener('input', resize);
    
    // 초기 크기 설정
    resize();
  }
  
  /**
   * 입력창 상태 업데이트
   */
  updateInputState() {
    if (!this.chatInput || !this.sendButton) return;
    
    // 입력 내용 기반으로 전송 버튼 활성화/비활성화
    const text = this.chatInput.value.trim();
    this.sendButton.disabled = text.length === 0;
    
    // 명령어 하이라이트 (CommandAutocomplete 모듈에서 처리)
    if (this.commandAutocomplete) {
      this.commandAutocomplete.checkForCommands(text);
    }
  }
  
  /**
   * 키보드 입력 처리
   */
  handleInputKeydown(event) {
    // Enter 키 처리 (Shift+Enter는 줄바꿈)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      
      if (!this.sendButton.disabled) {
        this.sendMessage();
      }
    }
    
    // Tab 키 처리 (명령어 자동완성)
    if (event.key === 'Tab' && this.commandAutocomplete) {
      const text = this.chatInput.value;
      const cursorPos = this.chatInput.selectionStart;
      
      // 현재 단어 확인
      const currentWord = this.commandAutocomplete.getCurrentWord(text, cursorPos);
      
      if (currentWord && currentWord.startsWith('@') || currentWord.startsWith('/')) {
        event.preventDefault();
        
        // 자동완성 호출
        this.commandAutocomplete.triggerAutocomplete();
      }
    }
    
    // Escape 키 처리 (명령어 자동완성 닫기)
    if (event.key === 'Escape' && this.commandAutocomplete) {
      // 자동완성 닫기
      this.commandAutocomplete.closeAutocomplete();
    }
    
    // 화살표 키 처리 (명령어 자동완성 내비게이션)
    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && 
        this.commandAutocomplete && 
        this.commandAutocomplete.isDropdownOpen()) {
      event.preventDefault();
      
      // 자동완성 내비게이션
      this.commandAutocomplete.navigateAutocomplete(event.key === 'ArrowUp' ? -1 : 1);
    }
  }
  
  /**
   * VS Code 메시지 처리
   */
  handleVSCodeMessage(event) {
    const message = event.data;
    
    // 로그 메시지
    console.log(`VS Code로부터 메시지 수신: ${message.command}`);
    
    switch(message.command) {
      case 'addMessage':
        // 메시지 추가
        this.addMessage(message.type, message.content);
        break;
        
      case 'clearChat':
        // 채팅 초기화
        this.clearingFromServer = true;
        this.clearChat();
        this.clearingFromServer = false;
        break;
        
      case 'updateCommands':
        // 명령어 목록 업데이트
        this.updateCommands(message.commands, message.dynamicData);
        break;
        
      case 'updateContext':
        // 컨텍스트 정보 업데이트
        if (this.contextHandler && message.context) {
          this.contextHandler.updateContext(message.context);
        }
        break;
        
      case 'startStreaming':
        // 스트리밍 시작
        this.startStreamingResponse(message.responseId, message.type || 'assistant');
        break;
        
      case 'appendStreamChunk':
        // 스트리밍 청크 추가
        this.appendStreamChunk(message.responseId, message.content, message.type || 'assistant');
        break;
        
      case 'endStreaming':
        // 스트리밍 종료
        this.endStreamingResponse(message.responseId);
        break;
        
      case 'removeSystemMessage':
        // 시스템 메시지 제거
        this.removeSystemMessage(message.content);
        break;
        
      case 'updateModels':
        // 모델 목록 업데이트
        if (window.modelSelector) {
          window.modelSelector.options.models = message.models;
          window.modelSelector.updateModels(message.models);
          console.log(`모델 목록 업데이트: ${message.models.length}개 모델`);
        }
        break;
        
      case 'setCurrentModel':
        // 현재 모델 설정
        if (window.modelSelector) {
          window.modelSelector.setModelById(message.modelId);
          console.log(`현재 모델 설정: ${message.modelId}`);
          
          // 채팅 입력창에 모델 ID 설정 (메시지 전송을 위해)
          if (this.chatInput) {
            this.chatInput.dataset.model = message.modelId;
            console.log(`채팅 입력창 모델 ID 설정: ${this.chatInput.dataset.model}`);
          }
        }
        break;
        
      case 'highlightCommand':
        // 명령어 하이라이트
        if (this.commandAutocomplete) {
          this.commandAutocomplete.highlightCommand(message.commandId);
        }
        break;
        
      case 'commandExecuted':
        // 명령어 실행 결과
        this.handleCommandExecuted(message.commandId, message.success);
        break;
        
      case 'setApeMode':
        // APE 모드 설정
        this.updateApeMode(message.enabled);
        break;
        
      case 'showCommandDetail':
        // 명령어 세부 정보 표시
        this.showCommandDetail(message.commandItem);
        break;
        
      case 'modelChanged':
        // 모델 변경 완료
        console.log(`모델 변경 ${message.success ? '성공' : '실패'}: ${message.modelId}`);
        if (message.success && this.chatInput) {
          this.chatInput.dataset.model = message.modelId;
          console.log(`채팅 입력창 모델 ID 업데이트: ${this.chatInput.dataset.model}`);
        }
        break;
    }
  }
  
  /**
   * 메시지 추가
   * @param {string} type 메시지 유형 ('user', 'assistant', 'system')
   * @param {string} content 메시지 내용
   */
  addMessage(type, content) {
    if (!this.messagesContainer || !content) return;
    
    // 비어있는 상태 메시지 숨기기
    if (this.emptyState) {
      this.emptyState.style.display = 'none';
    }
    
    // 메시지 요소 생성
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}-message`;
    
    // 타임스탬프
    const timestamp = new Date().toLocaleTimeString();
    
    // 메시지 HTML 생성
    messageElement.innerHTML = `
      <div class="message-container">
        <div class="message-header">
          <span class="message-sender">${this.getSenderName(type)}</span>
          <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-content">${this.formatContent(content)}</div>
      </div>
    `;
    
    // 코드 블록 처리
    if (window.CodeBlocks) {
      window.CodeBlocks.processCodeBlocks(messageElement);
    }
    
    // 메시지 추가
    this.messagesContainer.appendChild(messageElement);
    
    // 스크롤 아래로 이동
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    
    // 상태 업데이트
    this.messageState.messages.push({ type, content, timestamp });
    vscode.setState(this.messageState);
    
    // 컨텍스트 정보 요청 (사용자 메시지인 경우)
    if (type === 'user') {
      vscode.postMessage({
        command: 'getContext'
      });
    }
  }
  
  /**
   * 메시지 전송
   */
  sendMessage() {
    const text = this.chatInput.value.trim();
    if (!text) return;
    
    console.log(`메시지 전송 시작: "${text}"`);
    
    // 사용자 메시지 추가
    this.addMessage('user', text);
    
    // 선택된 모델 가져오기
    const selectedModel = this.modelSelector ? this.modelSelector.getCurrentModelId() : null;
    console.log(`현재 선택된 모델 ID: ${selectedModel || '없음'}`);
    
    // 메시지가 명령어인 경우 워크플로우 분석기에 기록
    if (this.workflowAnalyzer && (text.startsWith('@') || text.startsWith('/'))) {
      // 현재 컨텍스트 가져오기
      const context = this.currentContext || {};
      
      // 워크플로우 분석기에 명령어 실행 기록
      this.workflowAnalyzer.recordCommand(text, context);
      
      console.log('워크플로우 분석기에 명령어 기록됨:', text);
      
      // 현재 워크플로우 상태 확인
      if (this.workflowAnalyzer.currentWorkflow) {
        console.log('현재 워크플로우:', 
          this.workflowAnalyzer.currentWorkflow.domain,
          this.workflowAnalyzer.currentWorkflow.id,
          '현재 단계:', this.workflowAnalyzer.currentWorkflow.currentStep,
          '다음 단계:', this.workflowAnalyzer.currentWorkflow.nextStep
        );
      }
    }
    
    // 메시지 옵션 로그
    console.log(`메시지 전송 옵션:
    - 텍스트: ${text}
    - 모델: ${selectedModel || '기본값'}
    - 심층 분석 모드: ${this.embedDevMode ? '활성화' : '비활성화'}`);
    
    try {
      // 채팅 입력창에서 모델 정보 직접 가져오기 (data-model 속성)
      const inputModelId = this.chatInput.dataset.model;
      // 최종 선택 모델 (우선순위: 1.채팅 입력창 data-model, 2.모델 선택기, 3.기본값)
      const finalModelId = inputModelId || selectedModel || null;
      
      console.log(`최종 선택 모델: ${finalModelId || '기본값'} (입력창: ${inputModelId || '없음'}, 선택기: ${selectedModel || '없음'})`);
      
      // VS Code에 메시지 전송
      vscode.postMessage({
        command: 'sendMessage',
        text: text,
        model: finalModelId,
        embedDevMode: this.embedDevMode
      });
      
      console.log('VS Code에 메시지 전송 성공');
    } catch (error) {
      console.error('VS Code에 메시지 전송 실패:', error);
    }
    
    // 입력 필드 초기화
    this.chatInput.value = '';
    this.chatInput.style.height = 'auto';
    this.sendButton.disabled = true;
    
    // 입력 필드에 포커스
    this.chatInput.focus();
  }
  
  /**
   * 채팅 초기화
   */
  clearChat() {
    if (!this.messagesContainer || !this.emptyState) return;
    
    // DOM에서 메시지 제거
    this.messagesContainer.innerHTML = '';
    this.messagesContainer.appendChild(this.emptyState);
    this.emptyState.style.display = 'flex';
    
    // 상태 초기화
    this.messageState.messages = [];
    vscode.setState(this.messageState);
    
    // 웹뷰 초기화 시에만 서버에 알림
    if (!this.clearingFromServer) {
      vscode.postMessage({
        command: 'clearChat'
      });
    }
  }
  
  /**
   * 심층 분석 모드 토글
   */
  toggleEmbedDevMode() {
    this.embedDevMode = !this.embedDevMode;
    
    if (this.embedDevMode) {
      // 심층 분석 모드 활성화
      this.embedDevButton.classList.add('active');
      this.addMessage('system', '심층 분석 모드 활성화됨: 고급 프롬프트 엔지니어링 및 데이터 분석 기능이 적용됩니다.');
    } else {
      // 심층 분석 모드 비활성화
      this.embedDevButton.classList.remove('active');
      this.addMessage('system', '심층 분석 모드 비활성화됨: 기본 모드로 전환되었습니다.');
    }
    
    // VS Code에 상태 업데이트 알림
    vscode.postMessage({
      command: 'toggleEmbedDevMode',
      enabled: this.embedDevMode
    });
  }
  
  /**
   * 심층 분석 모드 업데이트
   */
  updateEmbedDevMode(enabled) {
    if (this.embedDevMode === enabled) return;
    
    this.embedDevMode = enabled;
    
    if (this.embedDevButton) {
      if (enabled) {
        this.embedDevButton.classList.add('active');
      } else {
        this.embedDevButton.classList.remove('active');
      }
    }
  }
  
  /**
   * 명령어 패널 토글
   */
  toggleCommandPanel() {
    if (!this.commandsPanelContainer) return;
    
    this.commandPanelVisible = !this.commandPanelVisible;
    
    if (this.commandPanelVisible) {
      // 명령어 패널 표시
      this.commandsPanelContainer.style.display = 'block';
      
      if (this.commandsButton) {
        this.commandsButton.classList.add('active');
      }
      
      // 명령어 목록 요청
      vscode.postMessage({
        command: 'getCommands'
      });
    } else {
      // 명령어 패널 숨기기
      this.commandsPanelContainer.style.display = 'none';
      
      if (this.commandsButton) {
        this.commandsButton.classList.remove('active');
      }
    }
  }
  
  /**
   * APE 모드 토글
   */
  toggleApeMode() {
    this.apeMode = !this.apeMode;
    
    // UI 업데이트
    this.updateApeMode(this.apeMode);
    
    // VS Code에 상태 업데이트 알림
    vscode.postMessage({
      command: 'toggleApeMode',
      enabled: this.apeMode
    });
  }
  
  /**
   * APE 모드 업데이트
   */
  updateApeMode(enabled) {
    this.apeMode = enabled;
    
    // 토글 버튼 상태 업데이트
    if (this.apeToggleButton) {
      if (enabled) {
        this.apeToggleButton.classList.add('active');
        this.apeToggleButton.title = '도구 활용 모드 끄기';
      } else {
        this.apeToggleButton.classList.remove('active');
        this.apeToggleButton.title = '도구 활용 모드 켜기';
      }
    }
    
    // 도메인 도구바 표시/숨김
    if (this.domainToolbar) {
      this.domainToolbar.style.display = enabled ? 'flex' : 'none';
    }
    
    // 제안 바 표시/숨김
    if (this.suggestionBar) {
      this.suggestionBar.style.display = enabled ? 'block' : 'none';
    }
    
    // 본문 클래스 업데이트
    document.body.classList.toggle('ape-mode', enabled);
  }
  
  /**
   * 명령어 목록 업데이트
   * @param {Array} commands 명령어 목록
   * @param {Object} dynamicData 동적 데이터 (예: Git 브랜치 등)
   */
  updateCommands(commands, dynamicData) {
    this.commands = commands || [];
    this.dynamicData = dynamicData || {};
    
    console.log(`${this.commands.length}개의 명령어 업데이트됨`);
    
    // 명령어 자동완성 업데이트
    if (this.commandAutocomplete) {
      this.commandAutocomplete.updateCommands(this.commands);
    }
    
    // 명령어 패널 업데이트 (iframe에 메시지 전송)
    if (this.commandsPanel && this.commandsPanel.contentWindow) {
      this.commandsPanel.contentWindow.postMessage({
        command: 'updateCommands',
        commands: this.commands,
        dynamicData: this.dynamicData
      }, '*');
    }
  }
  
  /**
   * 명령어 선택 처리
   * @param {Object} command 선택된 명령어
   */
  handleCommandSelected(command) {
    if (!command || !command.id) return;
    
    console.log(`명령어 선택됨: ${command.id}`);
    
    // 자동완성 닫기
    if (this.commandAutocomplete) {
      this.commandAutocomplete.closeAutocomplete();
    }
    
    // 입력 필드에 명령어 설정
    this.chatInput.value = command.id;
    this.chatInput.style.height = 'auto'; // 높이 리셋
    this.chatInput.style.height = `${Math.min(this.chatInput.scrollHeight, 150)}px`; // 높이 재계산
    this.sendButton.disabled = false;
    
    // 입력 필드에 포커스
    this.chatInput.focus();
    
    // Enter 키를 눌러 즉시 전송
    if (command.autoExecute) {
      this.sendMessage();
    }
  }
  
  /**
   * 명령어 실행 결과 처리
   * @param {string} commandId 명령어 ID
   * @param {boolean} success 성공 여부
   */
  handleCommandExecuted(commandId, success) {
    // 명령어 목록에서 해당 명령어 찾기
    const command = this.commands.find(cmd => cmd.id === commandId);
    
    if (command) {
      // 명령어 실행 카운트 증가
      command.executeCount = (command.executeCount || 0) + 1;
      
      // 성공한 경우 자주 사용하는 명령어로 표시
      if (success) {
        command.frequent = true;
      }
    }
    
    // 명령어 실행 후 컨텍스트 정보 요청
    vscode.postMessage({
      command: 'getContext'
    });
  }
  
  /**
   * 명령어 세부 정보 표시
   * @param {Object} commandItem 명령어 항목
   */
  showCommandDetail(commandItem) {
    if (!commandItem) return;
    
    // 모달 생성
    const modalContainer = document.createElement('div');
    modalContainer.className = 'command-detail-modal';
    modalContainer.id = 'commandDetailModal';
    
    // 아이콘 결정
    const icon = this.getCommandIcon(commandItem);
    
    // 모달 내용 생성
    modalContainer.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="${icon.source === 'phosphor' ? 'ph' : 'codicon'} ${icon.source === 'phosphor' ? 'ph-' : 'codicon-'}${icon.name}"></i>
            ${commandItem.label || commandItem.id}
          </h3>
          <button class="close-modal-btn"><i class="ph ph-x"></i></button>
        </div>
        <div class="modal-body">
          <div class="command-detail">
            <div class="detail-item">
              <span class="detail-label">명령어:</span>
              <code class="command-syntax">${commandItem.syntax || commandItem.id}</code>
            </div>
            ${commandItem.description ? `
              <div class="detail-item">
                <span class="detail-label">설명:</span>
                <span class="command-description">${commandItem.description}</span>
              </div>
            ` : ''}
            ${commandItem.examples && commandItem.examples.length > 0 ? `
              <div class="detail-item">
                <span class="detail-label">예시:</span>
                <ul class="command-examples">
                  ${commandItem.examples.map(example => `<li><code>${example}</code></li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${commandItem.domain ? `
              <div class="detail-item">
                <span class="detail-label">도메인:</span>
                <span class="command-domain">${commandItem.domain}</span>
              </div>
            ` : ''}
          </div>
          <div class="command-actions">
            <button class="use-command-btn primary-btn">명령어 사용</button>
          </div>
        </div>
      </div>
    `;
    
    // 모달 추가
    document.body.appendChild(modalContainer);
    
    // 닫기 버튼 이벤트 리스너
    const closeButton = modalContainer.querySelector('.close-modal-btn');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        modalContainer.remove();
      });
    }
    
    // 모달 외부 클릭 이벤트 리스너
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        modalContainer.remove();
      }
    });
    
    // 명령어 사용 버튼 이벤트 리스너
    const useButton = modalContainer.querySelector('.use-command-btn');
    if (useButton) {
      useButton.addEventListener('click', () => {
        this.handleCommandSelected(commandItem);
        modalContainer.remove();
      });
    }
    
    // ESC 키 이벤트 리스너
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        modalContainer.remove();
        document.removeEventListener('keydown', handleEscKey);
      }
    };
    document.addEventListener('keydown', handleEscKey);
  }
  
  /**
   * 스트리밍 응답 시작
   * @param {string} responseId 응답 ID
   * @param {string} type 메시지 유형 ('assistant' 또는 'system')
   */
  startStreamingResponse(responseId, type) {
    if (!this.messagesContainer || !this.emptyState) return;
    
    // 비어있는 상태 메시지 숨기기
    this.emptyState.style.display = 'none';
    
    // 이미 스트리밍 중인 응답 확인
    if (this.streamingState.activeStreams[responseId]) {
      console.log(`이미 스트리밍 중인 응답 ID: ${responseId}`);
      return;
    }
    
    // 메시지 요소 생성
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}-message streaming`;
    messageElement.id = `response-${responseId}`;
    
    // 타임스탬프
    const timestamp = new Date().toLocaleTimeString();
    
    // 메시지 HTML 생성
    messageElement.innerHTML = `
      <div class="message-container">
        <div class="message-header">
          <span class="message-sender">${this.getSenderName(type)}</span>
          <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-content">
          <div class="streaming-indicator"></div>
        </div>
      </div>
    `;
    
    // 메시지 추가
    this.messagesContainer.appendChild(messageElement);
    
    // 스크롤 아래로 이동
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    
    // 스트리밍 상태 업데이트
    this.streamingState.activeStreams[responseId] = {
      element: messageElement,
      content: '',
      type: type,
      timestamp: timestamp
    };
    
    this.streamingState.isStreaming = true;
  }
  
  /**
   * 스트리밍 청크 추가
   * @param {string} responseId 응답 ID
   * @param {string} chunk 청크 내용
   * @param {string} type 메시지 유형 ('assistant' 또는 'system')
   */
  appendStreamChunk(responseId, chunk, type) {
    if (!this.streamingState.activeStreams[responseId]) {
      // 새로운 스트리밍 시작
      this.startStreamingResponse(responseId, type);
    }
    
    const streamInfo = this.streamingState.activeStreams[responseId];
    if (!streamInfo || !streamInfo.element) return;
    
    // 청크 내용 추가
    streamInfo.content += chunk;
    
    // 메시지 내용 업데이트
    const contentElement = streamInfo.element.querySelector('.message-content');
    if (contentElement) {
      // 스트리밍 인디케이터 제거
      const indicator = contentElement.querySelector('.streaming-indicator');
      if (indicator) {
        contentElement.removeChild(indicator);
      }
      
      // 내용 설정
      contentElement.innerHTML = this.formatContent(streamInfo.content);
      
      // 스트리밍 인디케이터 추가
      const newIndicator = document.createElement('div');
      newIndicator.className = 'streaming-indicator';
      contentElement.appendChild(newIndicator);
      
      // 코드 블록 처리
      if (window.CodeBlocks) {
        window.CodeBlocks.processCodeBlocks(streamInfo.element);
      }
    }
    
    // 스크롤 아래로 이동
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
  
  /**
   * 스트리밍 응답 종료
   * @param {string} responseId 응답 ID
   */
  endStreamingResponse(responseId) {
    const streamInfo = this.streamingState.activeStreams[responseId];
    if (!streamInfo || !streamInfo.element) return;
    
    // 스트리밍 클래스 제거
    streamInfo.element.classList.remove('streaming');
    
    // 메시지 내용 요소 가져오기
    const contentElement = streamInfo.element.querySelector('.message-content');
    if (contentElement) {
      // 스트리밍 인디케이터 제거
      const indicator = contentElement.querySelector('.streaming-indicator');
      if (indicator) {
        contentElement.removeChild(indicator);
      }
      
      // 내용 설정 (최종)
      contentElement.innerHTML = this.formatContent(streamInfo.content);
      
      // 코드 블록 최종 처리
      if (window.CodeBlocks) {
        window.CodeBlocks.processCodeBlocks(streamInfo.element);
      }
    }
    
    // 상태 업데이트
    this.messageState.messages.push({
      type: streamInfo.type,
      content: streamInfo.content,
      timestamp: streamInfo.timestamp
    });
    vscode.setState(this.messageState);
    
    // 스트리밍 상태에서 제거
    delete this.streamingState.activeStreams[responseId];
    
    // 다른 활성 스트림이 없으면 전체 스트리밍 상태 업데이트
    if (Object.keys(this.streamingState.activeStreams).length === 0) {
      this.streamingState.isStreaming = false;
    }
  }
  
  /**
   * 시스템 메시지 제거
   * @param {string} content 메시지 내용
   */
  removeSystemMessage(content) {
    if (!this.messagesContainer) return;
    
    // 모든 시스템 메시지 요소 가져오기
    const systemMessages = this.messagesContainer.querySelectorAll('.system-message');
    
    // 내용이 일치하는 메시지 제거
    for (const messageElement of systemMessages) {
      const contentElement = messageElement.querySelector('.message-content');
      if (contentElement && contentElement.textContent.trim() === content) {
        this.messagesContainer.removeChild(messageElement);
        
        // 상태에서도 제거
        const index = this.messageState.messages.findIndex(msg => 
          msg.type === 'system' && msg.content === content
        );
        
        if (index !== -1) {
          this.messageState.messages.splice(index, 1);
          vscode.setState(this.messageState);
        }
        
        // 첫 번째 일치하는 메시지만 제거
        break;
      }
    }
  }
  
  /**
   * VS Code에 준비 메시지 전송
   */
  sendReadyMessage() {
    vscode.postMessage({
      command: 'ready',
      timestamp: Date.now()
    });
  }
  
  /**
   * 저장된 메시지 추가
   */
  addMessagesByState() {
    if (!this.messagesContainer || !this.messageState.messages) return;
    
    // 메시지가 있는 경우 빈 상태 숨기기
    if (this.messageState.messages.length > 0 && this.emptyState) {
      this.emptyState.style.display = 'none';
    }
    
    // 모든 저장된 메시지 추가
    this.messageState.messages.forEach(message => {
      this.addMessage(message.type, message.content);
    });
  }
  
  /**
   * 메시지 렌더링
   */
  renderMessages() {
    // 저장된 메시지 렌더링
    this.addMessagesByState();
  }
  
  /**
   * 발신자 이름 가져오기
   * @param {string} type 메시지 유형
   * @returns {string} 발신자 이름
   */
  getSenderName(type) {
    switch(type) {
      case 'user':
        return '사용자';
      case 'assistant':
        return 'APE';
      case 'system':
        return '시스템';
      default:
        return type;
    }
  }
  
  /**
   * 메시지 내용 형식화
   * @param {string} content 메시지 내용
   * @returns {string} 형식화된 내용
   */
  formatContent(content) {
    if (!content) return '';
    
    // 마크다운 줄바꿈 처리
    let formatted = content.replace(/\n/g, '<br>');
    
    // 간단한 마크다운 변환
    // 코드 블록은 CodeBlocks 모듈에서 처리
    
    return formatted;
  }
  
  /**
   * 테마 업데이트
   */
  updateTheme() {
    // VS Code 테마 감지
    const isDarkTheme = document.body.classList.contains('vscode-dark');
    this.darkMode = isDarkTheme;
    
    // 다크모드 클래스 추가/제거
    document.body.classList.toggle('dark-theme', isDarkTheme);
    document.body.classList.toggle('light-theme', !isDarkTheme);
  }
}

// UI 인스턴스 생성
window.apeUI = new ApeHybridUI();