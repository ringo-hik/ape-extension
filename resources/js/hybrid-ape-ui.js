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
    this.modelSelector = null;
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
        const workflowSuggestions = this.workflowAnalyzer.suggestCommands(context, 3);
        if (workflowSuggestions && workflowSuggestions.length > 0) {
          suggestions.push(...workflowSuggestions.map(cmdId => {
            // 명령어 ID를 포함하는 완전한 명령어 객체 찾기
            const cmd = this.commands.find(c => c.id === cmdId);
            return cmd || { id: cmdId, label: cmdId };
          }));
        }
      }
      
      // 중복 제거
      const uniqueSuggestions = this.getUniqueSuggestions(suggestions);
      
      // 추천 목록 표시
      this.updateSuggestionBar(uniqueSuggestions.slice(0, 5)); // 최대 5개 표시
    }
  }
  
  /**
   * 중복 제거된 제안 목록 반환
   * @param {Array} suggestions 제안 목록
   * @returns {Array} 중복 제거된 제안 목록
   */
  getUniqueSuggestions(suggestions) {
    const uniqueMap = new Map();
    
    // ID 기준으로 중복 제거
    suggestions.forEach(suggestion => {
      if (suggestion && suggestion.id) {
        uniqueMap.set(suggestion.id, suggestion);
      }
    });
    
    return Array.from(uniqueMap.values());
  }
  
  /**
   * 모든 이벤트 리스너 등록
   */
  registerEventListeners() {
    // 입력 필드 이벤트
    this.chatInput.addEventListener('input', () => this.handleInputChange());
    this.chatInput.addEventListener('keydown', (e) => this.handleInputKeyDown(e));
    
    // 버튼 이벤트
    if (this.sendButton) {
      this.sendButton.addEventListener('click', () => this.sendMessage());
    } else {
      console.error('sendButton을 찾을 수 없습니다.');
    }
    
    if (this.clearButton) {
      this.clearButton.addEventListener('click', () => this.clearChat());
    } else {
      console.error('clearButton을 찾을 수 없습니다.');
    }
    
    if (this.embedDevButton) {
      this.embedDevButton.addEventListener('click', () => this.toggleEmbedDevMode());
    } else {
      console.error('embedDevButton을 찾을 수 없습니다.');
    }
    
    if (this.commandsButton) {
      this.commandsButton.addEventListener('click', () => this.toggleCommandPanel());
    } else {
      console.error('commandsButton을 찾을 수 없습니다.');
    }
    
    if (this.apeToggleButton) {
      console.log('APE 토글 버튼에 이벤트 리스너 등록 중...');
      this.apeToggleButton.addEventListener('click', () => {
        console.log('APE 토글 버튼 클릭됨!');
        this.toggleApeMode();
      });
    } else {
      console.error('apeToggleButton을 찾을 수 없습니다. DOM 요소 ID를 확인하세요.');
      // DOM이 준비되지 않았을 수 있으므로 setTimeout으로 다시 시도
      setTimeout(() => {
        this.apeToggleButton = document.getElementById('apeToggleButton');
        if (this.apeToggleButton) {
          console.log('지연 후 APE 토글 버튼을 찾았습니다. 이벤트 리스너 등록 중...');
          this.apeToggleButton.addEventListener('click', () => {
            console.log('APE 토글 버튼 클릭됨! (지연 등록)');
            this.toggleApeMode();
          });
        } else {
          console.error('지연 후에도 APE 토글 버튼을 찾을 수 없습니다.');
        }
      }, 1000);
    }
    
    // 컨텍스트 패널 접기/펼치기 이벤트
    if (this.contextPanel) {
      const toggleButton = this.contextPanel.querySelector('.context-panel-toggle');
      if (toggleButton) {
        toggleButton.addEventListener('click', () => this.toggleContextPanel());
      }
    }
    
    // 도메인 도구바 버튼 이벤트
    if (this.domainToolbar) {
      const domainButtons = this.domainToolbar.querySelectorAll('.domain-button');
      domainButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const domain = button.dataset.domain;
          this.handleDomainButtonClick(domain);
        });
      });
    }
    
    // 탭 전환 이벤트 - 모바일 환경에서 창을 벗어났다가 돌아왔을 때 scrollIntoView 수정
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.messagesContainer) {
        this.scrollToBottom();
      }
    });
    
    // 메시지 컨테이너에 ResizeObserver 설정
    if (this.messagesContainer && window.ResizeObserver) {
      this.autoResizeObserver = new ResizeObserver(entries => {
        this.scrollToBottom();
      });
      this.autoResizeObserver.observe(this.messagesContainer);
    }
    
    // VS Code로부터 메시지 수신
    window.addEventListener('message', event => this.handleVSCodeMessage(event));
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
    
    // 제안 바가 없는 경우 동적으로 생성
    if (!this.suggestionBar) {
      this.createSuggestionBar();
    }
    
    // 도메인 도구바가 없는 경우 동적으로 생성
    if (!this.domainToolbar) {
      this.createDomainToolbar();
    }
    
    console.log('APE 하이브리드 UI 초기화 완료');
  }
  
  /**
   * 동적으로 컨텍스트 패널 생성
   */
  createContextPanel() {
    // 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'context-panel';
    container.id = 'contextPanel';
    
    // 헤더 생성
    const header = document.createElement('div');
    header.className = 'context-panel-header';
    header.innerHTML = `
      <h3><i class="codicon codicon-light-bulb"></i> 컨텍스트 도우미</h3>
      <button class="context-panel-toggle" title="접기/펼치기">
        <i class="codicon codicon-chevron-right"></i>
      </button>
    `;
    container.appendChild(header);
    
    // 컨텐츠 영역 생성
    const content = document.createElement('div');
    content.className = 'context-panel-content';
    content.innerHTML = `
      <div class="context-section">
        <h4>현재 컨텍스트</h4>
        <div class="context-info" id="contextInfo">컨텍스트 정보를 불러오는 중...</div>
      </div>
      
      <div class="context-section">
        <h4>추천 명령어</h4>
        <div class="context-suggestions" id="contextSuggestions">
          <div class="suggestion-loading">컨텍스트 기반 명령어를 불러오는 중...</div>
        </div>
      </div>
      
      <div class="context-section">
        <h4>관련 도움말</h4>
        <div class="context-help" id="contextHelp">
          <div class="help-item">
            <i class="codicon codicon-question"></i>
            <a href="#" class="help-link" data-command="/help">도움말 보기</a>
          </div>
          <div class="help-item">
            <i class="codicon codicon-book"></i>
            <a href="#" class="help-link" data-command="/docs">문서 보기</a>
          </div>
        </div>
      </div>
    `;
    container.appendChild(content);
    
    // 채팅 컨테이너에 추가
    const chatContainer = document.querySelector('.chat-container');
    chatContainer.appendChild(container);
    
    // 레퍼런스 저장
    this.contextPanel = container;
    
    // 이벤트 리스너 추가
    const toggleButton = container.querySelector('.context-panel-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => this.toggleContextPanel());
    }
    
    // 도움말 링크 클릭 이벤트
    const helpLinks = container.querySelectorAll('.help-link');
    helpLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const command = link.dataset.command;
        if (command) {
          this.chatInput.value = command;
          this.sendMessage();
        }
      });
    });
  }
  
  /**
   * 컨텍스트 패널 접기/펼치기
   */
  toggleContextPanel() {
    if (!this.contextPanel) return;
    
    const isCollapsed = this.contextPanel.classList.contains('collapsed');
    
    if (isCollapsed) {
      // 펼치기
      this.contextPanel.classList.remove('collapsed');
      this.contextPanel.querySelector('.context-panel-toggle i').classList.remove('flipped');
      
      // 채팅 컨테이너 레이아웃 조정
      document.querySelector('.chat-container').classList.remove('context-collapsed');
    } else {
      // 접기
      this.contextPanel.classList.add('collapsed');
      this.contextPanel.querySelector('.context-panel-toggle i').classList.add('flipped');
      
      // 채팅 컨테이너 레이아웃 조정
      document.querySelector('.chat-container').classList.add('context-collapsed');
    }
  }
  
  /**
   * 제안 바 생성
   */
  createSuggestionBar() {
    const inputWrapper = this.chatInput.closest('.input-wrapper');
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
          <div class="commands-loading">
            <div class="spinner"></div>
            <span>명령어 목록을 불러오는 중...</span>
          </div>
          <div class="domain-commands-list" id="domainCommandsList"></div>
        </div>
      </div>
    `;
    
    // 문서에 추가
    document.body.appendChild(modalContainer);
    
    // 닫기 버튼에 이벤트 리스너 추가
    const closeButton = modalContainer.querySelector('.close-modal-btn');
    closeButton.addEventListener('click', () => {
      modalContainer.remove();
    });
    
    // 배경 클릭 시 닫기
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        modalContainer.remove();
      }
    });
    
    // 모달 표시 애니메이션
    setTimeout(() => {
      modalContainer.classList.add('visible');
    }, 10);
    
    // 도메인 명령어 요청
    vscode.postMessage({
      command: 'getDomainCommands',
      domain: domain
    });
  }
  
  /**
   * 도메인 아이콘 가져오기
   * @param {string} domain 도메인 이름
   * @returns {Object} 아이콘 정보 객체 {name: string, source: string}
   */
  getDomainIcon(domain) {
    const icons = {
      'git': { name: 'git-branch', source: 'phosphor' },
      'jira': { name: 'kanban', source: 'phosphor' },
      'pocket': { name: 'archive-box', source: 'phosphor' },
      'swdp': { name: 'infinity', source: 'phosphor' }
    };
    
    return icons[domain] || { name: 'wrench', source: 'phosphor' };
  }
  
  /**
   * 도메인 명령어 목록 업데이트
   * @param {string} domain 도메인 이름
   * @param {Array} commands 명령어 목록
   */
  updateDomainCommands(domain, commands) {
    const modal = document.getElementById('domainCommandsModal');
    if (!modal) return;
    
    const commandsList = modal.querySelector('#domainCommandsList');
    if (!commandsList) return;
    
    // 로딩 요소 제거
    const loadingElement = modal.querySelector('.commands-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    // 명령어가 없는 경우
    if (!commands || commands.length === 0) {
      commandsList.innerHTML = `<div class="empty-commands">사용 가능한 명령어가 없습니다.</div>`;
      return;
    }
    
    // 명령어 그룹화
    const groups = this.groupCommandsByCategory(commands);
    
    // 명령어 목록 렌더링
    let html = '';
    
    for (const [category, categoryCommands] of Object.entries(groups)) {
      html += `
        <div class="command-category">
          <h4 class="category-title">${category}</h4>
          <div class="category-commands">
      `;
      
      categoryCommands.forEach(cmd => {
        const commandIcon = this.getCommandIcon(cmd.id);
        html += `
          <div class="command-item" data-command="${cmd.id}">
            <div class="command-icon"><i class="ph ph-${commandIcon.name}"></i></div>
            <div class="command-info">
              <div class="command-label">${cmd.label || cmd.id}</div>
              <div class="command-description">${cmd.description || ''}</div>
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    }
    
    commandsList.innerHTML = html;
    
    // 명령어 클릭 이벤트 리스너 추가
    const commandItems = commandsList.querySelectorAll('.command-item');
    commandItems.forEach(item => {
      item.addEventListener('click', () => {
        const commandId = item.dataset.command;
        this.chatInput.value = commandId;
        modal.remove();
        
        // 포커스 설정 및 명령어 실행
        this.chatInput.focus();
        this.sendMessage();
      });
    });
  }
  
  /**
   * 명령어를 카테고리별로 그룹화
   * @param {Array} commands 명령어 목록
   * @returns {Object} 카테고리별 명령어 그룹
   */
  groupCommandsByCategory(commands) {
    const groups = {};
    
    commands.forEach(cmd => {
      // 명령어 ID에서 카테고리 추출
      let category = '기타';
      
      if (cmd.id.includes(':')) {
        const parts = cmd.id.split(':');
        if (parts.length > 1) {
          category = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
        }
      }
      
      // 카테고리가 없으면 생성
      if (!groups[category]) {
        groups[category] = [];
      }
      
      // 명령어 추가
      groups[category].push(cmd);
    });
    
    return groups;
  }
  
  /**
   * 명령어 아이콘 가져오기
   * @param {string} commandId 명령어 ID
   * @returns {Object} 아이콘 정보 객체 {name: string, source: string}
   */
  getCommandIcon(commandId) {
    // 기본 아이콘
    let icon = { name: 'terminal', source: 'phosphor' };
    
    // 명령어 유형에 기반하여 아이콘 결정
    if (commandId.includes('commit')) {
      icon = { name: 'git-commit', source: 'phosphor' };
    } else if (commandId.includes('branch')) {
      icon = { name: 'git-branch', source: 'phosphor' };
    } else if (commandId.includes('issue')) {
      icon = { name: 'note-pencil', source: 'phosphor' };
    } else if (commandId.includes('comment')) {
      icon = { name: 'chat-text', source: 'phosphor' };
    } else if (commandId.includes('upload')) {
      icon = { name: 'cloud-arrow-up', source: 'phosphor' };
    } else if (commandId.includes('download')) {
      icon = { name: 'cloud-arrow-down', source: 'phosphor' };
    } else if (commandId.includes('list')) {
      icon = { name: 'list', source: 'phosphor' };
    } else if (commandId.includes('search')) {
      icon = { name: 'magnifying-glass', source: 'phosphor' };
    } else if (commandId.includes('help')) {
      icon = { name: 'question', source: 'phosphor' };
    } else if (commandId.includes('config')) {
      icon = { name: 'gear-six', source: 'phosphor' };
    } else if (commandId.includes('sync')) {
      icon = { name: 'arrows-clockwise', source: 'phosphor' };
    }
    
    return icon;
  }
  
  /**
   * 제안 바 업데이트
   * @param {Array} suggestions 제안 목록
   */
  updateSuggestionBar(suggestions) {
    if (!this.suggestionBar) return;
    
    // 제안이 없는 경우
    if (!suggestions || suggestions.length === 0) {
      this.suggestionBar.innerHTML = `<div class="suggestion-placeholder">채팅 중 컨텍스트 기반 명령어가 여기에 표시됩니다</div>`;
      return;
    }
    
    // 제안 목록 렌더링
    let html = '';
    
    suggestions.forEach(suggestion => {
      const icon = this.getCommandIcon(suggestion.id);
      html += `
        <div class="suggestion-chip" data-command="${suggestion.id}" title="${suggestion.description || ''}">
          <i class="ph ph-${icon.name}"></i>
          <span>${suggestion.label || suggestion.id}</span>
        </div>
      `;
    });
    
    this.suggestionBar.innerHTML = html;
    
    // 제안 클릭 이벤트 리스너 추가
    const suggestionChips = this.suggestionBar.querySelectorAll('.suggestion-chip');
    suggestionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const commandId = chip.dataset.command;
        this.chatInput.value = commandId;
        
        // 포커스 설정 및 명령어 실행
        this.chatInput.focus();
        this.sendMessage();
      });
    });
    
    // 제안 바 표시
    this.suggestionBar.style.display = 'flex';
  }
  
  /**
   * 컨텍스트 패널 정보 업데이트
   * @param {Object} context 컨텍스트 정보
   */
  updateContextPanel(context) {
    if (!this.contextPanel) return;
    
    // 컨텍스트 정보 업데이트
    const contextInfo = this.contextPanel.querySelector('#contextInfo');
    if (contextInfo) {
      let infoHtml = '';
      
      if (context.workspaceRoot) {
        infoHtml += `<div class="context-item"><i class="codicon codicon-folder"></i> ${context.workspaceRoot}</div>`;
      }
      
      if (context.activeFile) {
        infoHtml += `<div class="context-item"><i class="codicon codicon-file"></i> ${context.activeFile}</div>`;
      }
      
      if (context.gitBranch) {
        infoHtml += `<div class="context-item"><i class="codicon codicon-git-branch"></i> ${context.gitBranch}</div>`;
      }
      
      if (context.selectedText) {
        infoHtml += `<div class="context-item"><i class="codicon codicon-selection"></i> 선택된 텍스트: ${context.selectedText.substring(0, 50)}${context.selectedText.length > 50 ? '...' : ''}</div>`;
      }
      
      contextInfo.innerHTML = infoHtml || '컨텍스트 정보가 없습니다.';
    }
    
    // 제안 명령어 업데이트
    const contextSuggestions = this.contextPanel.querySelector('#contextSuggestions');
    if (contextSuggestions && context.suggestions && context.suggestions.length > 0) {
      let suggestionsHtml = '';
      
      context.suggestions.forEach(suggestion => {
        const icon = this.getCommandIcon(suggestion.id);
        suggestionsHtml += `
          <div class="context-suggestion" data-command="${suggestion.id}">
            <i class="codicon codicon-${icon}"></i>
            <span>${suggestion.label || suggestion.id}</span>
          </div>
        `;
      });
      
      contextSuggestions.innerHTML = suggestionsHtml;
      
      // 제안 클릭 이벤트 리스너 추가
      const suggestionElements = contextSuggestions.querySelectorAll('.context-suggestion');
      suggestionElements.forEach(element => {
        element.addEventListener('click', () => {
          const commandId = element.dataset.command;
          this.chatInput.value = commandId;
          
          // 포커스 설정 및 명령어 실행
          this.chatInput.focus();
          this.sendMessage();
        });
      });
    } else if (contextSuggestions) {
      contextSuggestions.innerHTML = '현재 컨텍스트에 맞는 제안이 없습니다.';
    }
    
    // 현재 컨텍스트 저장
    this.currentContext = context;
    
    // 제안 바 업데이트
    if (context.suggestions) {
      this.updateSuggestionBar(context.suggestions.slice(0, 5)); // 상위 5개만 표시
    }
  }
  
  /**
   * 텍스트 영역 자동 크기 조절
   */
  autoResizeTextarea() {
    if (!this.chatInput) return;
    
    this.chatInput.style.height = 'auto';
    this.chatInput.style.height = `${Math.min(this.chatInput.scrollHeight, 200)}px`;
  }
  
  /**
   * 스크롤을 최하단으로 이동 - 개선된 버전
   */
  scrollToBottom() {
    if (!this.messagesContainer) return;
    
    // 스크롤 위치 확인
    const isScrolledToBottom = this.messagesContainer.scrollHeight - this.messagesContainer.clientHeight <= 
                             this.messagesContainer.scrollTop + 100;
    
    // 스크롤이 이미 아래에 있거나 스트리밍 중인 경우만 자동 스크롤
    if (isScrolledToBottom || this.streamingState.isStreaming) {
      // 약간의 지연을 두어 렌더링이 완료된 후 스크롤
      setTimeout(() => {
        // 애니메이션 효과 적용
        const scrollOptions = { behavior: 'smooth', block: 'end' };
        
        // 마지막 메시지가 있으면 포커스
        const lastMessage = this.messagesContainer.lastElementChild;
        if (lastMessage && lastMessage.classList && !lastMessage.classList.contains('empty-state')) {
          lastMessage.scrollIntoView(scrollOptions);
        } else {
          // 마지막 메시지가 없으면 컨테이너 끝으로 스크롤
          this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
        
        // 스트리밍 중이 아닌 경우 스크롤 완료 후 작은 바운스 효과 추가
        if (!this.streamingState.isStreaming) {
          setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight - 5;
            setTimeout(() => {
              this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }, 100);
          }, 300);
        }
      }, 10);
    }
    
    // 새 메시지 표시기 (사용자가 스크롤을 위로 올린 상태에서 새 메시지가 도착한 경우)
    if (!isScrolledToBottom && !this.streamingState.isStreaming && !this.newMessageIndicator) {
      this.createNewMessageIndicator();
    }
  }
  
  /**
   * 새 메시지 표시기 생성
   */
  createNewMessageIndicator() {
    // 이미 존재하면 생성하지 않음
    if (this.newMessageIndicator) return;
    
    // 새 메시지 표시기 생성
    this.newMessageIndicator = document.createElement('div');
    this.newMessageIndicator.className = 'new-message-indicator';
    
    // phosphor 아이콘 사용
    const icon = document.createElement('i');
    icon.className = 'ph ph-arrow-down';
    icon.style.marginRight = '6px';
    
    const text = document.createTextNode('새 메시지');
    
    this.newMessageIndicator.appendChild(icon);
    this.newMessageIndicator.appendChild(text);
    
    this.newMessageIndicator.style.position = 'absolute';
    this.newMessageIndicator.style.bottom = '80px';
    this.newMessageIndicator.style.right = '20px';
    this.newMessageIndicator.style.backgroundColor = 'var(--claude-primary)';
    this.newMessageIndicator.style.color = 'white';
    this.newMessageIndicator.style.padding = '6px 12px';
    this.newMessageIndicator.style.borderRadius = '20px';
    this.newMessageIndicator.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    this.newMessageIndicator.style.cursor = 'pointer';
    this.newMessageIndicator.style.zIndex = '100';
    this.newMessageIndicator.style.opacity = '0';
    this.newMessageIndicator.style.transform = 'translateY(20px)';
    this.newMessageIndicator.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    this.newMessageIndicator.style.display = 'flex';
    this.newMessageIndicator.style.alignItems = 'center';
    
    // 클릭 시 하단으로 스크롤
    this.newMessageIndicator.addEventListener('click', () => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      this.hideNewMessageIndicator();
    });
    
    // 문서에 추가
    document.body.appendChild(this.newMessageIndicator);
    
    // 애니메이션으로 표시
    setTimeout(() => {
      this.newMessageIndicator.style.opacity = '1';
      this.newMessageIndicator.style.transform = 'translateY(0)';
    }, 10);
    
    // 스크롤 이벤트 리스너 추가
    this.messagesContainer.addEventListener('scroll', this.handleScroll.bind(this));
  }
  
  /**
   * 새 메시지 표시기 숨기기
   */
  hideNewMessageIndicator() {
    if (!this.newMessageIndicator) return;
    
    this.newMessageIndicator.style.opacity = '0';
    this.newMessageIndicator.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      if (this.newMessageIndicator && this.newMessageIndicator.parentNode) {
        this.newMessageIndicator.parentNode.removeChild(this.newMessageIndicator);
      }
      this.newMessageIndicator = null;
    }, 300);
  }
  
  /**
   * 스크롤 이벤트 핸들러
   */
  handleScroll() {
    if (!this.messagesContainer) return;
    
    // 스크롤이 하단에 있는지 확인
    const isScrolledToBottom = this.messagesContainer.scrollHeight - this.messagesContainer.clientHeight <= 
                             this.messagesContainer.scrollTop + 20;
    
    // 하단에 있으면 새 메시지 표시기 숨기기
    if (isScrolledToBottom && this.newMessageIndicator) {
      this.hideNewMessageIndicator();
    }
  }
  
  /**
   * 빈 상태 메시지 표시/숨김
   */
  updateMessageDisplay() {
    if (!this.emptyState) return;
    
    if (this.messageState.messages.length > 0) {
      this.emptyState.style.display = 'none';
    } else {
      this.emptyState.style.display = 'flex';
    }
  }
  
  /**
   * 메시지 렌더링
   */
  renderMessages() {
    if (!this.messagesContainer || !this.messageState.messages) return;
    
    if (this.messageState.messages.length > 0) {
      this.emptyState.style.display = 'none';
      
      this.messageState.messages.forEach(msg => {
        this.addMessageToDOM(msg);
      });
      
      this.scrollToBottom();
    }
  }
  
  /**
   * DOM에 메시지 추가 (하이브리드 UI 버전)
   * @param {Object} message 
   */
  addMessageToDOM(message) {
    if (!this.messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    if (message.type === 'user') {
      messageElement.classList.add('message-user');
      // 사용자 메시지는 코드 블록 처리 없음
      messageElement.textContent = message.content;
    } else if (message.type === 'assistant') {
      messageElement.classList.add('message-assistant');
      
      // 어시스턴트 메시지에 컨텍스트 기반 액션 추가
      let processedContent = this.processAssistantMessage(message.content);
      
      // 코드 블록 처리
      messageElement.innerHTML = codeBlockProcessor.processContent(processedContent);
      
      // 코드 블록 기능 초기화
      codeBlockProcessor.initializeCopyButtons(messageElement);
      codeBlockProcessor.applySyntaxHighlighting(messageElement);
      
      // 액션 버튼 초기화
      this.initializeActionButtons(messageElement);
    } else if (message.type === 'system') {
      messageElement.classList.add('message-system');
      // 시스템 메시지는 코드 블록 처리 없음
      messageElement.textContent = message.content;
    }
    
    // ID 설정 (스트리밍용)
    if (message.id) {
      messageElement.setAttribute('id', message.id);
    }
    
    this.messagesContainer.appendChild(messageElement);
    return messageElement;
  }
  
  /**
   * 어시스턴트 메시지 처리 - 명령어 및 액션 추가
   * @param {string} content 메시지 내용
   * @returns {string} 처리된 내용
   */
  processAssistantMessage(content) {
    // @command 형태의 명령어를 클릭 가능한 버튼으로 변환
    let processedContent = content.replace(
      /(@[a-zA-Z0-9:.-]+)(\s|$)/g, 
      '<button class="action-button command-action" data-command="$1">$1</button>$2'
    );
    
    // /command 형태의 명령어를 클릭 가능한 버튼으로 변환
    processedContent = processedContent.replace(
      /(\/[a-zA-Z0-9-]+)(\s|$)/g,
      '<button class="action-button command-action" data-command="$1">$1</button>$2'
    );
    
    // [action:xxx] 형태의 액션 태그를 버튼으로 변환
    processedContent = processedContent.replace(
      /\[action:([a-zA-Z0-9_]+)(?:\:([^\]]+))?\]/g,
      '<button class="action-button custom-action" data-action="$1" data-params="$2">$1</button>'
    );
    
    return processedContent;
  }
  
  /**
   * 액션 버튼 초기화
   * @param {HTMLElement} messageElement 메시지 요소
   */
  initializeActionButtons(messageElement) {
    // 명령어 액션 버튼
    const commandButtons = messageElement.querySelectorAll('.command-action');
    commandButtons.forEach(button => {
      button.addEventListener('click', () => {
        const command = button.dataset.command;
        this.chatInput.value = command;
        this.chatInput.focus();
        this.sendMessage();
      });
    });
    
    // 커스텀 액션 버튼
    const customButtons = messageElement.querySelectorAll('.custom-action');
    customButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        const params = button.dataset.params;
        
        // VS Code에 액션 전송
        vscode.postMessage({
          command: 'executeAction',
          action: action,
          params: params
        });
      });
    });
  }
  
  /**
   * 스트리밍 메시지 요소 생성
   * @param {string} responseId 
   * @param {string} type 
   */
  createStreamingMessageElement(responseId, type) {
    // 이미 존재하는 스트리밍 요소가 있는지 확인
    const existingElement = document.getElementById(responseId);
    if (existingElement) {
      return existingElement;
    }
    
    // 새 요소 생성
    const message = { 
      type: type, 
      content: '', 
      id: responseId,
      timestamp: Date.now() 
    };
    
    // 상태에 메시지 추가하지 않음 (스트리밍 완료 후 추가)
    const element = this.addMessageToDOM(message);
    
    // 스트리밍 상태 업데이트
    this.streamingState.activeStreams[responseId] = {
      element: element,
      content: ''
    };
    
    this.streamingState.isStreaming = true;
    
    return element;
  }
  
  /**
   * 메시지 추가
   * @param {string} type 
   * @param {string} content 
   */
  addMessage(type, content) {
    const message = { type, content, timestamp: Date.now() };
    
    // 상태에 추가
    this.messageState.messages.push(message);
    vscode.setState(this.messageState);
    
    // DOM에 추가
    this.addMessageToDOM(message);
    this.updateMessageDisplay();
    this.scrollToBottom();
    
    // 사용자 메시지인 경우 컨텍스트 정보 업데이트 요청
    if (type === 'user') {
      vscode.postMessage({
        command: 'updateContext',
        message: content
      });
    }
  }
  
  /**
   * 입력 필드 변경 핸들러
   */
  handleInputChange() {
    this.sendButton.disabled = this.chatInput.value.trim() === '';
    this.autoResizeTextarea();
    
    // 명령어 자동완성 처리
    if (this.commandAutocomplete) {
      this.commandAutocomplete.onInputChange(this.chatInput.value);
    }
  }
  
  /**
   * 키 입력 핸들러
   * @param {KeyboardEvent} e 
   */
  handleInputKeyDown(e) {
    // Enter 키로 전송 (Shift+Enter는 줄바꿈)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!this.sendButton.disabled) {
        this.sendMessage();
      }
    }
    
    // 명령어 자동완성에서 Tab 처리
    if (e.key === 'Tab' && this.commandAutocomplete) {
      if (this.commandAutocomplete.isShowing()) {
        e.preventDefault();
        this.commandAutocomplete.selectNextSuggestion();
      }
    }
    
    // ESC 키로 명령어 패널 닫기
    if (e.key === 'Escape' && this.commandPanelVisible) {
      this.toggleCommandPanel();
    }
  }
  
  /**
   * 메시지 전송
   */
  sendMessage() {
    const text = this.chatInput.value.trim();
    if (!text) return;
    
    // 사용자 메시지 추가
    this.addMessage('user', text);
    
    // 선택된 모델 가져오기
    const selectedModel = this.modelSelector ? this.modelSelector.getCurrentModelId() : null;
    
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
    
    // VS Code에 메시지 전송
    vscode.postMessage({
      command: 'sendMessage',
      text: text,
      model: selectedModel,
      embedDevMode: this.embedDevMode
    });
    
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
      this.addMessage('system', '심층 분석 모드 비활성화됨');
    }
    
    // VS Code에 모드 변경 알림
    vscode.postMessage({
      command: 'toggleEmbedDevMode',
      enabled: this.embedDevMode
    });
  }
  
  /**
   * APE 모드 설정
   * @param {boolean} enabled APE 모드 활성화 여부
   */
  setApeMode(enabled) {
    console.log('setApeMode 호출됨, 파라미터:', enabled);
    
    this.apeMode = !!enabled;
    
    // 채팅 UI 요소 설정
    const chatContainer = document.querySelector('.chat-container');
    if (!chatContainer) {
      console.error('채팅 컨테이너를 찾을 수 없습니다.');
      return;
    }
    
    // 버튼 체크
    if (!this.apeToggleButton) {
      console.error('apeToggleButton이 null입니다. 다시 시도합니다.');
      this.apeToggleButton = document.getElementById('apeToggleButton');
      if (!this.apeToggleButton) {
        console.error('apeToggleButton을 찾을 수 없습니다. DOM 준비 여부를 확인하세요.');
        // DOM이 준비되지 않았을 수 있으므로 지연 후 재시도
        setTimeout(() => {
          this.apeToggleButton = document.getElementById('apeToggleButton');
          if (this.apeToggleButton) {
            this.setApeMode(this.apeMode); // 재시도
          }
        }, 500);
        return;
      }
    }
    
    if (this.apeMode) {
      // APE 모드 활성화
      console.log('APE 모드 활성화 중...');
      this.apeToggleButton.classList.add('active');
      chatContainer.classList.add('ape-mode');
      
      // 컨텍스트 패널이 없는 경우 동적으로 생성
      if (!this.contextPanel) {
        console.log('컨텍스트 패널 생성 중...');
        this.createContextPanel();
      }
      
      // 제안 바가 없는 경우 동적으로 생성
      if (!this.suggestionBar) {
        console.log('제안 바 생성 중...');
        this.createSuggestionBar();
      }
      
      // 도메인 도구바가 없는 경우 동적으로 생성
      if (!this.domainToolbar) {
        console.log('도메인 도구바 생성 중...');
        this.createDomainToolbar();
      }
      
    } else {
      // APE 모드 비활성화
      console.log('APE 모드 비활성화 중...');
      this.apeToggleButton.classList.remove('active');
      chatContainer.classList.remove('ape-mode');
      
      // UI 요소들은 CSS에 의해 자동으로 숨겨짐
    }
    
    console.log('setApeMode 완료, 최종 상태:', this.apeMode);
  }
  
  /**
   * APE 모드 토글
   */
  toggleApeMode() {
    console.log('APE 모드 토글 호출됨, 현재 상태:', this.apeMode);
    
    // 버튼 체크
    if (!this.apeToggleButton) {
      console.error('apeToggleButton이 null입니다. DOM 요소를 찾을 수 없습니다.');
      this.apeToggleButton = document.getElementById('apeToggleButton');
      if (!this.apeToggleButton) {
        console.error('여전히 apeToggleButton을 찾을 수 없습니다. DOM 구조를 확인하세요.');
        return;
      }
    }
    
    const newState = !this.apeMode;
    console.log('APE 모드 새 상태:', newState);
    
    // APE 모드 상태 변경
    this.setApeMode(newState);
    
    // 시스템 메시지 추가
    if (newState) {
      this.addMessage('system', 'APE 모드가 활성화되었습니다. 컨텍스트 인식 및 명령어 제안 기능이 활성화됩니다.');
      
      // 컨텍스트 정보 갱신 요청
      vscode.postMessage({
        command: 'getContext'
      });
    } else {
      this.addMessage('system', 'APE 모드가 비활성화되었습니다. 기본 채팅 모드로 전환합니다.');
    }
    
    // VS Code에 모드 변경 알림
    vscode.postMessage({
      command: 'toggleApeMode',
      enabled: newState
    });
    
    console.log('APE 모드 토글 완료, 새 상태:', this.apeMode);
  }
  
  /**
   * 명령어 패널 토글
   */
  toggleCommandPanel() {
    this.commandPanelVisible = !this.commandPanelVisible;
    
    if (this.commandPanelVisible) {
      this.commandsPanelContainer.style.display = 'block';
      this.commandsButton.classList.add('active');
      
      // 명령어 목록 요청 - 최신 정보 가져오기
      vscode.postMessage({
        command: 'getCommands'
      });
      
      // 애니메이션 효과 추가
      setTimeout(() => {
        this.commandsPanelContainer.style.opacity = '1';
        this.commandsPanelContainer.style.transform = 'translateY(0)';
      }, 10);
    } else {
      this.commandsButton.classList.remove('active');
      
      // 애니메이션 효과와 함께 숨기기
      this.commandsPanelContainer.style.opacity = '0';
      this.commandsPanelContainer.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        this.commandsPanelContainer.style.display = 'none';
      }, 300);
    }
  }
  
  /**
   * VS Code 메시지 처리 (하이브리드 UI 버전)
   * @param {MessageEvent} event 
   */
  handleVSCodeMessage(event) {
    const message = event.data;
    
    console.log('VS Code 메시지 수신:', message.command);
    
    switch (message.command) {
      case 'initialized':
        console.log('VS Code 확장에서 초기화 완료');
        this.addMessage('system', '채팅 인터페이스가 초기화되었습니다');
        break;
        
      case 'addMessage':
        this.addMessage(message.type, message.content);
        break;
        
      case 'clearChat':
        this.clearingFromServer = true;
        this.clearChat();
        this.clearingFromServer = false;
        break;
        
      case 'updateModels':
        console.log('모델 목록 업데이트:', message.models);
        this.updateModelList(message.models);
        break;
        
      case 'updateCommands':
        console.log('명령어 목록 업데이트:', message.commands?.length || 0);
        // 명령어 자동완성 업데이트
        this.updateCommandAutocomplete(message.commands, message.dynamicData);
        break;
        
      case 'setCurrentModel':
        this.setCurrentModel(message.modelId);
        break;
        
      case 'setApeMode':
        // APE 모드 설정 (초기화 시 또는 설정 변경 시)
        console.log(`APE 모드 설정: ${message.enabled ? '활성화' : '비활성화'}`);
        this.setApeMode(message.enabled);
        break;
        
      case 'removeSystemMessage':
        // 특정 내용의 시스템 메시지 제거
        this.removeSystemMessageByContent(message.content);
        break;
        
      // 스트리밍 관련 명령어
      case 'startStreaming':
        this.handleStartStreaming(message);
        break;
        
      case 'appendStreamChunk':
        this.handleAppendStreamChunk(message);
        break;
        
      case 'endStreaming':
        this.handleEndStreaming(message);
        break;
        
      // 컨텍스트 관련 명령어
      case 'updateContext':
        console.log('컨텍스트 업데이트:', message.context ? Object.keys(message.context) : 'empty context');
        // 컨텍스트 패널 업데이트
        this.updateContextPanel(message.context);
        
        // 개선된 컨텍스트 핸들러에 컨텍스트 전달
        if (this.contextHandler && message.context) {
          const hasChanges = this.contextHandler.updateContext(message.context);
          if (hasChanges) {
            console.log('컨텍스트 핸들러가 중요한 변경 감지');
          }
        }
        break;
        
      case 'updateSuggestions':
        console.log('제안 업데이트:', message.suggestions?.length || 0);
        this.updateSuggestionBar(message.suggestions);
        break;
      
      // 도메인 명령어 관련
      case 'updateDomainCommands':
        console.log('도메인 명령어 업데이트:', message.domain, message.commands?.length || 0);
        this.updateDomainCommands(message.domain, message.commands);
        break;
        
      // 도메인 상태 업데이트
      case 'updateDomainState':
        console.log('도메인 상태 업데이트:', message.domain, message.state);
        this.updateDomainState(message.domain, message.state);
        break;
        
      // 하이브리드 UI 관련 명령어
      case 'showActionFeedback':
        this.showActionFeedback(message.action, message.success, message.message);
        break;
        
      default:
        console.log('처리되지 않은 메시지:', message.command);
    }
  }
  
  /**
   * 도메인 상태 업데이트
   * @param {string} domain 도메인 이름
   * @param {Object} state 상태 객체 (active, count)
   */
  updateDomainState(domain, state) {
    if (!this.domainState[domain]) return;
    
    // 상태 업데이트
    this.domainState[domain] = state;
    
    // 도메인 버튼 업데이트
    if (this.domainToolbar) {
      const button = this.domainToolbar.querySelector(`.domain-button[data-domain="${domain}"]`);
      if (button) {
        // 활성 상태 적용
        if (state.active) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
        
        // 카운터 적용
        let counter = button.querySelector('.domain-counter');
        if (state.count > 0) {
          if (!counter) {
            counter = document.createElement('span');
            counter.className = 'domain-counter';
            button.appendChild(counter);
          }
          counter.textContent = state.count;
        } else if (counter) {
          counter.remove();
        }
      }
    }
  }
  
  /**
   * 액션 피드백 표시
   * @param {string} action 액션 이름
   * @param {boolean} success 성공 여부
   * @param {string} message 피드백 메시지
   */
  showActionFeedback(action, success, message) {
    // 피드백 요소 생성
    const feedback = document.createElement('div');
    feedback.className = success ? 'action-feedback success' : 'action-feedback error';
    
    // 피드백 내용 생성
    feedback.innerHTML = `
      <i class="ph ph-${success ? 'check' : 'warning'}"></i>
      <span>${message || (success ? '액션이 성공적으로 실행되었습니다.' : '액션 실행 중 오류가 발생했습니다.')}</span>
    `;
    
    // 문서에 추가
    document.body.appendChild(feedback);
    
    // 애니메이션으로 표시
    setTimeout(() => {
      feedback.classList.add('visible');
    }, 10);
    
    // 일정 시간 후 제거
    setTimeout(() => {
      feedback.classList.remove('visible');
      setTimeout(() => {
        document.body.removeChild(feedback);
      }, 300);
    }, 3000);
  }
  
  /**
   * 명령어 자동완성 업데이트
   * @param {Array} commands 
   * @param {Object} dynamicData 
   */
  updateCommandAutocomplete(commands, dynamicData) {
    if (!commands || !Array.isArray(commands)) {
      return;
    }
    
    // 모든 명령어 저장
    this.commands = commands;
    
    // 자동완성 인스턴스가 없으면 생성
    if (!this.commandAutocomplete) {
      this.commandAutocomplete = new CommandAutocomplete(this.chatInput, {
        onSelect: (commandId) => {
          console.log('명령어 선택됨:', commandId);
        },
        // 개선된 컨텍스트 핸들러와 연결
        contextHandler: this.contextHandler
      });
    }
    
    // 명령어 및 동적 데이터 업데이트
    this.commandAutocomplete.setCommands(commands, dynamicData);
    
    // 컨텍스트 핸들러에도 명령어 목록 전달 (추천 명령어 생성용)
    if (this.contextHandler) {
      // 추천 명령어 생성 및 표시 (현재 컨텍스트 기반)
      const suggestions = this.contextHandler.suggestCommands(commands, 5);
      if (suggestions && suggestions.length > 0) {
        // 이미 받은 제안 명령어와 함께 표시
        this.updateSuggestionBar(suggestions);
      }
    }
  }
  
  /**
   * 시스템 메시지 제거 (특정 내용으로)
   * @param {string} content 
   */
  removeSystemMessageByContent(content) {
    if (!this.messagesContainer) return;
    
    // 시스템 메시지 요소 가져오기
    const systemMessages = this.messagesContainer.querySelectorAll('.message-system');
    
    // 내용이 일치하는 메시지 찾아 제거
    for (const msg of systemMessages) {
      if (msg.textContent.trim() === content.trim()) {
        msg.remove();
        
        // 상태에서도 제거
        this.messageState.messages = this.messageState.messages.filter(
          m => m.type !== 'system' || m.content.trim() !== content.trim()
        );
        vscode.setState(this.messageState);
        
        break;
      }
    }
  }
  
  /**
   * 스트리밍 시작 처리
   * @param {Object} message 
   */
  handleStartStreaming(message) {
    console.log('스트리밍 시작:', message.responseId);
    this.createStreamingMessageElement(message.responseId, message.type);
    this.updateMessageDisplay();
    this.scrollToBottom();
  }
  
  /**
   * 스트리밍 청크 추가 처리 - 하이브리드 UI 버전
   * @param {Object} message 
   */
  handleAppendStreamChunk(message) {
    // 스트리밍 상태 확인
    if (!this.streamingState.activeStreams[message.responseId]) {
      console.warn('존재하지 않는 스트림에 청크 추가 시도:', message.responseId);
      return;
    }
    
    const stream = this.streamingState.activeStreams[message.responseId];
    
    // 청크 내용 추가
    stream.content += message.content;
    
    // 컨텍스트 인식 명령어 추출 및 강조 표시
    let processedContent = stream.content;
    
    // 어시스턴트 메시지 전용 처리
    if (stream.element.classList.contains('message-assistant')) {
      // 코드 블록이 있는 경우, 기본 텍스트 표시만
      if (stream.content.includes('```')) {
        processedContent = stream.content;
      } else {
        // 코드 블록이 없는 경우, 인라인 코드와 명령어 버튼 처리
        
        // 인라인 코드 처리
        processedContent = processedContent.replace(/`([^`]+)`/g, (match, code) => {
          return `<code class="inline-code">${code}</code>`;
        });
        
        // URL 링크 처리
        processedContent = processedContent.replace(/(https?:\/\/[^\s]+)/g, (match) => {
          return `<a href="${match}" target="_blank" rel="noopener noreferrer">${match}</a>`;
        });
        
        // @command 형태의 명령어를 클릭 가능한 버튼으로 변환 (스트리밍 중에는 적용하지 않음)
        // 완료 후 handleEndStreaming에서 처리
      }
    }
    
    // 스트리밍 중 HTML 처리
    stream.element.innerHTML = processedContent;
    
    // 스트리밍 클래스 추가 (애니메이션 효과용)
    stream.element.classList.add('streaming');
    
    // 자동 스크롤
    this.scrollToBottom();
  }
  
  /**
   * 스트리밍 종료 처리 - 하이브리드 UI 버전
   * @param {Object} message 
   */
  handleEndStreaming(message) {
    console.log('스트리밍 종료:', message.responseId);
    
    // 스트리밍 상태 확인
    if (!this.streamingState.activeStreams[message.responseId]) {
      console.warn('존재하지 않는 스트림 종료 시도:', message.responseId);
      return;
    }
    
    const stream = this.streamingState.activeStreams[message.responseId];
    const element = stream.element;
    
    // 요소 타입 확인
    const type = element.classList.contains('message-assistant') ? 'assistant' : 
                element.classList.contains('message-system') ? 'system' : 'assistant';
    
    // 스트리밍 애니메이션 제거
    element.classList.remove('streaming');
    
    // 메시지 상태에 추가
    this.messageState.messages.push({
      type: type,
      content: stream.content,
      timestamp: Date.now()
    });
    vscode.setState(this.messageState);
    
    // 어시스턴트 메시지인 경우 명령어 처리
    if (type === 'assistant') {
      // 어시스턴트 메시지에 컨텍스트 기반 액션 추가
      let processedContent = this.processAssistantMessage(stream.content);
      
      // 코드 블록 처리
      element.innerHTML = codeBlockProcessor.processContent(processedContent);
      codeBlockProcessor.initializeCopyButtons(element, true); // Phosphor Icons 사용 옵션 추가
      codeBlockProcessor.applySyntaxHighlighting(element);
      
      // 액션 버튼 초기화
      this.initializeActionButtons(element);
      
      // 컨텍스트 패널 업데이트 요청 - 메시지를 기반으로 추천 명령어 업데이트
      vscode.postMessage({
        command: 'analyzeResponse',
        content: stream.content
      });
    }
    
    // 스트리밍 상태에서 제거
    delete this.streamingState.activeStreams[message.responseId];
    
    // 모든 스트림이 종료되었는지 확인
    if (Object.keys(this.streamingState.activeStreams).length === 0) {
      this.streamingState.isStreaming = false;
    }
    
    // 최종 스크롤
    this.scrollToBottom();
  }
  
  /**
   * 모델 목록 업데이트
   * @param {Array} models 
   */
  updateModelList(models) {
    if (!models || !Array.isArray(models)) {
      console.warn('유효하지 않은 모델 목록:', models);
      return;
    }
    
    // 모델 선택기 초기화
    if (!this.modelSelector) {
      this.modelSelector = new ModelSelector('modelSelector', {
        models: models,
        onChange: (modelId) => {
          // 모델 변경 이벤트 처리
          vscode.postMessage({
            command: 'changeModel',
            model: modelId
          });
          
          // 모델 변경 시 시스템 메시지 표시
          const selectedModel = models.find(model => model.id === modelId);
          if (selectedModel) {
            this.addMessage('system', `모델이 ${selectedModel.name}(으)로 변경되었습니다.`);
          }
        }
      });
    } else {
      // 기존 선택기 업데이트
      this.modelSelector.updateModels(models);
    }
  }
  
  /**
   * 현재 모델 설정
   * @param {string} modelId 
   */
  setCurrentModel(modelId) {
    if (this.modelSelector && modelId) {
      this.modelSelector.setModelById(modelId);
    }
  }
}

// 코드 블록 처리기 (기존 코드와 동일)
const codeBlockProcessor = {
  /**
   * 마크다운 형식의 코드 블록을 HTML로 변환
   * @param {string} content 
   * @returns {string}
   */
  processContent(content) {
    if (!content) return '';
    
    // 코드 블록 패턴 (```language ... ```)
    const codeBlockRegex = /```(\w*)([\s\S]*?)```/g;
    
    // 인라인 코드 패턴 (`code`)
    const inlineCodeRegex = /`([^`]+)`/g;
    
    // HTML 이스케이프
    let escapedContent = this.escapeHtml(content);
    
    // 헤더 변환 (# header -> <h1>header</h1>)
    escapedContent = escapedContent.replace(/^#{1,6}\s+(.+)$/gm, match => {
      const level = match.indexOf(' ');
      const text = match.substring(level + 1);
      return `<h${level}>${text}</h${level}>`;
    });
    
    // 코드 블록 변환
    escapedContent = escapedContent.replace(codeBlockRegex, (match, language, code) => {
      language = language.trim() || 'plaintext';
      code = code.trim();
      
      return `
        <pre class="code-block" data-language="${language}">
          <div class="code-block-header">
            <span class="code-block-language">${language}</span>
            <button class="code-block-copy" title="Copy code"><i class="codicon codicon-copy"></i> Copy</button>
          </div>
          <code class="language-${language}">${code}</code>
        </pre>
      `;
    });
    
    // 인라인 코드 변환
    escapedContent = escapedContent.replace(inlineCodeRegex, (match, code) => {
      return `<code class="inline-code">${code}</code>`;
    });
    
    // 링크 변환
    escapedContent = escapedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });
    
    // 목록 변환
    escapedContent = escapedContent.replace(/^(\s*)-\s+(.+)$/gm, (match, indent, text) => {
      return `${indent}<li>${text}</li>`;
    });
    
    // 단락 변환 (빈 줄로 구분된 텍스트를 <p> 태그로 변환)
    escapedContent = escapedContent.replace(/\n\n+/g, '\n\n').replace(/^(?!<h|<pre|<li)(.+)$/gm, '<p>$1</p>');
    
    return escapedContent;
  },
  
  /**
   * HTML 이스케이프
   * @param {string} html 
   * @returns {string}
   */
  escapeHtml(html) {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return html.replace(/[&<>"']/g, match => escapeMap[match]);
  },
  
  /**
   * 코드 복사 버튼 기능 초기화
   * @param {HTMLElement} container 
   */
  initializeCopyButtons(container) {
    const copyButtons = container.querySelectorAll('.code-block-copy');
    
    copyButtons.forEach(button => {
      button.addEventListener('click', () => {
        const codeBlock = button.closest('.code-block');
        const code = codeBlock.querySelector('code').textContent;
        
        // 클립보드에 복사
        navigator.clipboard.writeText(code).then(() => {
          const originalText = button.textContent;
          button.innerHTML = '<i class="codicon codicon-check"></i> Copied!';
          button.classList.add('copied');
          
          // 3초 후 원래 텍스트로 되돌림
          setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
          }, 3000);
        });
      });
    });
  },
  
  /**
   * 코드 블록 구문 강조
   * @param {HTMLElement} container 
   */
  applySyntaxHighlighting(container) {
    // 외부 라이브러리 Prism.js 또는 highlight.js가 있다면 사용
    if (window.Prism) {
      Prism.highlightAllUnder(container);
    } else if (window.hljs) {
      container.querySelectorAll('pre code').forEach(block => {
        hljs.highlightBlock(block);
      });
    }
    
    // 라이브러리가 없으면 간단한 강조만 적용
    container.querySelectorAll('code').forEach(block => {
      // 키워드 강조
      block.innerHTML = block.innerHTML
        .replace(/\b(function|return|if|for|while|var|let|const|import|export|class|new|this)\b/g, '<span class="keyword">$1</span>')
        .replace(/\b(true|false|null|undefined)\b/g, '<span class="literal">$1</span>')
        .replace(/("[^"]*")|('[^']*')/g, '<span class="string">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    });
  }
};

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.apeUI = new ApeHybridUI();
});

// 정리 이벤트 처리
window.addEventListener('beforeunload', () => {
  // 컨텍스트 핸들러 정리
  if (window.apeUI && window.apeUI.contextHandler) {
    window.apeUI.contextHandler.dispose();
  }
  
  // 워크플로우 분석기 정리
  if (window.apeUI && window.apeUI.workflowAnalyzer) {
    window.apeUI.workflowAnalyzer.dispose();
  }
  
  // 명령어 자동완성 정리
  if (window.apeUI && window.apeUI.commandAutocomplete) {
    window.apeUI.commandAutocomplete.destroy();
  }
});