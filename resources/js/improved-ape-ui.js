/**
 * 개선된 APE UI 관련 JavaScript
 * Claude 스타일의 UX 및 상호작용 개선
 */

// VS Code API 가져오기
const vscode = acquireVsCodeApi();

class ApeUI {
  constructor() {
    // DOM 요소
    this.messagesContainer = document.getElementById('messages');
    this.chatInput = document.getElementById('chatInput');
    this.sendButton = document.getElementById('sendButton');
    this.clearButton = document.getElementById('clearButton');
    this.embedDevButton = document.getElementById('embedDevButton');
    this.commandsButton = document.getElementById('commandsButton');
    this.commandsPanelContainer = document.getElementById('commandsPanelContainer');
    this.commandsPanel = document.getElementById('commandsPanel');
    this.emptyState = document.getElementById('emptyState');
    this.autoCompleteContainer = document.getElementById('autoCompleteContainer');
    this.helpButton = document.getElementById('helpButton');
    this.themeButton = document.getElementById('themeButton');
    
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
    
    // 명령어 패널 상태
    this.commandPanelVisible = false;
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
    // 초기화
    this.initialize();
  }
  
  /**
   * 모든 이벤트 리스너 등록
   */
  registerEventListeners() {
    // 입력 필드 이벤트
    this.chatInput.addEventListener('input', () => this.handleInputChange());
    this.chatInput.addEventListener('keydown', (e) => this.handleInputKeyDown(e));
    
    // 버튼 이벤트
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.clearButton.addEventListener('click', () => this.clearChat());
    this.embedDevButton.addEventListener('click', () => this.toggleEmbedDevMode());
    this.commandsButton.addEventListener('click', () => this.toggleCommandPanel());
    
    // 도움말 버튼 (옵션)
    if (this.helpButton) {
      this.helpButton.addEventListener('click', () => this.showHelp());
    }
    
    // 테마 전환 버튼 (옵션)
    if (this.themeButton) {
      this.themeButton.addEventListener('click', () => this.toggleTheme());
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
    
    // 자동 크기 조절 초기화
    this.autoResizeTextarea();
    
    console.log('APE UI 초기화 완료');
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
    
    // codicon 아이콘 사용
    const icon = document.createElement('i');
    icon.className = 'codicon codicon-arrow-down';
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
   * DOM에 메시지 추가
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
      // 어시스턴트 메시지는 코드 블록 처리
      messageElement.innerHTML = codeBlockProcessor.processContent(message.content);
      // 코드 블록 기능 초기화
      codeBlockProcessor.initializeCopyButtons(messageElement);
      codeBlockProcessor.applySyntaxHighlighting(messageElement);
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
   * TreeView에서 선택된 명령어 강조 표시
   * @param {string} commandId 명령어 ID
   */
  highlightCommand(commandId) {
    if (!commandId || !this.commandsPanelContainer) return;
    
    // 명령어 패널이 닫혀있으면 자동으로 열기
    if (!this.commandPanelVisible) {
      this.toggleCommandPanel();
    }
    
    // 해당 명령어 요소 찾기
    const commandElement = this.commandsPanelContainer.querySelector(`[data-command-id="${commandId}"]`);
    if (!commandElement) {
      console.log(`명령어 요소를 찾을 수 없음: ${commandId}`);
      return;
    }
    
    // 명령어 숨겨져 있는 경우 해당 섹션 열기
    const section = commandElement.closest('.command-section');
    if (section && section.classList.contains('collapsed')) {
      section.classList.remove('collapsed');
    }
    
    // 기존 강조 효과 제거
    const highlightedItems = this.commandsPanelContainer.querySelectorAll('.highlighted-command');
    highlightedItems.forEach(item => item.classList.remove('highlighted-command'));
    
    // 새로운 강조 효과 적용
    commandElement.classList.add('highlighted-command');
    
    // 화면에 보이도록 스크롤
    commandElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // 일시적인 시각 효과
    commandElement.style.animation = 'highlight-pulse 2s ease-in-out';
    setTimeout(() => {
      commandElement.style.animation = '';
    }, 2000);
  }
  
  /**
   * 명령어 세부 정보 표시
   * @param {Object} commandItem 명령어 항목 데이터
   */
  showCommandDetail(commandItem) {
    if (!commandItem || !this.commandsPanelContainer) return;
    
    // 명령어 패널이 닫혀있으면 자동으로 열기
    if (!this.commandPanelVisible) {
      this.toggleCommandPanel();
    }
    
    // 세부 정보 모달 요소 가져오기
    const detailModal = this.commandsPanelContainer.querySelector('.command-detail-modal');
    if (!detailModal) {
      console.log('명령어 세부 정보 모달을 찾을 수 없음');
      return;
    }
    
    // 모달 내부 요소 업데이트
    const modalTitle = detailModal.querySelector('.modal-title');
    if (modalTitle) modalTitle.textContent = commandItem.label || commandItem.id;
    
    const modalDesc = detailModal.querySelector('.modal-description');
    if (modalDesc) modalDesc.textContent = commandItem.description || '';
    
    const modalSyntax = detailModal.querySelector('.syntax-content');
    if (modalSyntax) modalSyntax.textContent = commandItem.syntax || commandItem.id;
    
    const modalExamples = detailModal.querySelector('.examples-content');
    if (modalExamples) {
      modalExamples.innerHTML = '';
      if (commandItem.examples && commandItem.examples.length > 0) {
        const examplesList = document.createElement('ul');
        commandItem.examples.forEach(example => {
          const li = document.createElement('li');
          li.textContent = example;
          examplesList.appendChild(li);
        });
        modalExamples.appendChild(examplesList);
      } else {
        modalExamples.textContent = '예제가 없습니다.';
      }
    }
    
    // 명령어 복사 버튼 이벤트 설정
    const copyButton = detailModal.querySelector('.copy-command-btn');
    if (copyButton) {
      copyButton.onclick = () => {
        // 명령어 텍스트를 클립보드에 복사
        const commandText = commandItem.syntax || commandItem.id;
        navigator.clipboard.writeText(commandText).then(() => {
          // 복사 성공 시 피드백 표시
          copyButton.textContent = '복사됨!';
          setTimeout(() => {
            copyButton.textContent = '복사';
          }, 2000);
        });
      };
    }
    
    // 명령어 실행 버튼 이벤트 설정
    const executeButton = detailModal.querySelector('.execute-command-btn');
    if (executeButton) {
      executeButton.onclick = () => {
        // VS Code에 명령어 실행 요청
        vscode.postMessage({
          command: 'executeCommand',
          commandId: commandItem.syntax || commandItem.id
        });
        
        // 모달 닫기
        detailModal.classList.remove('visible');
      };
    }
    
    // 모달 닫기 버튼 이벤트 설정
    const closeButton = detailModal.querySelector('.close-modal-btn');
    if (closeButton) {
      closeButton.onclick = () => {
        detailModal.classList.remove('visible');
      };
    }
    
    // 모달 표시
    detailModal.classList.add('visible');
  }
  
  /**
   * 명령어 실행 결과 피드백 표시
   * @param {string} commandId 명령어 ID
   * @param {boolean} success 성공 여부
   */
  handleCommandExecuted(commandId, success) {
    if (!commandId || !this.commandsPanelContainer) return;
    
    // 해당 명령어 요소 찾기
    const commandElement = this.commandsPanelContainer.querySelector(`[data-command-id="${commandId}"]`);
    if (!commandElement) {
      console.log(`명령어 요소를 찾을 수 없음: ${commandId}`);
      return;
    }
    
    // 실행 결과에 따른 효과 적용
    if (success) {
      // 성공 효과
      commandElement.classList.add('command-executed-success');
      setTimeout(() => {
        commandElement.classList.remove('command-executed-success');
      }, 2000);
    } else {
      // 실패 효과
      commandElement.classList.add('command-executed-error');
      setTimeout(() => {
        commandElement.classList.remove('command-executed-error');
      }, 2000);
    }
  }
  
  /**
   * 도움말 표시
   */
  showHelp() {
    // 명령어 '/help'를 직접 전송하는 방식으로 구현
    vscode.postMessage({
      command: 'sendMessage',
      text: '/help',
      embedDevMode: false
    });
  }
  
  /**
   * 테마 전환
   */
  toggleTheme() {
    this.darkMode = !this.darkMode;
    
    const theme = this.darkMode ? 'dark' : 'light';
    
    // 클래스 변경
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${theme}`);
    
    // 버튼 UI 변경
    if (this.themeButton) {
      this.themeButton.innerHTML = this.darkMode ? '☀️' : '🌙';
      this.themeButton.title = this.darkMode ? '라이트 모드로 전환' : '다크 모드로 전환';
    }
    
    // VS Code에 테마 변경 알림
    vscode.postMessage({
      command: 'changeTheme',
      theme: theme
    });
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
  
  /**
   * VS Code 메시지 처리
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
        
      // TreeView 통합 기능
      case 'highlightCommand':
        // TreeView에서 명령어 선택 시 명령어 패널에서 해당 명령어 강조
        this.highlightCommand(message.commandId);
        break;
        
      case 'showCommandDetail':
        // TreeView에서 명령어 세부 정보 표시 요청 시 명령어 패널에 세부 정보 표시
        this.showCommandDetail(message.commandItem);
        break;
        
      case 'commandExecuted':
        // 명령어 실행 결과 피드백 표시
        this.handleCommandExecuted(message.commandId, message.success);
        break;
        
      default:
        console.log('처리되지 않은 메시지:', message.command);
    }
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
    
    // 자동완성 인스턴스가 없으면 생성
    if (!this.commandAutocomplete) {
      this.commandAutocomplete = new CommandAutocomplete(this.chatInput, {
        onSelect: (commandId) => {
          console.log('명령어 선택됨:', commandId);
        }
      });
    }
    
    // 명령어 및 동적 데이터 업데이트
    this.commandAutocomplete.setCommands(commands, dynamicData);
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
   * 스트리밍 청크 추가 처리 - 개선된 버전
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
    
    // 코드 블록 여부 감지
    const hasCodeBlock = stream.content.includes('```');
    
    // 스트리밍 중에는 코드 블록 처리 없이 단순 텍스트로 표시하되,
    // 인라인 코드(`code`) 부분은 기본적인 스타일링 적용
    if (hasCodeBlock) {
      // 코드 블록이 있는 경우, 기본 텍스트 표시만
      stream.element.textContent = stream.content;
    } else {
      // 코드 블록이 없는 경우, 인라인 코드 기본 처리
      let processedContent = stream.content;
      
      // 인라인 코드 처리
      processedContent = processedContent.replace(/`([^`]+)`/g, (match, code) => {
        return `<code class="inline-code">${code}</code>`;
      });
      
      // URL 링크 처리
      processedContent = processedContent.replace(/(https?:\/\/[^\s]+)/g, (match) => {
        return `<a href="${match}" target="_blank" rel="noopener noreferrer">${match}</a>`;
      });
      
      stream.element.innerHTML = processedContent;
    }
    
    // 스트리밍 클래스 추가 (애니메이션 효과용)
    stream.element.classList.add('streaming');
    
    // 자동 스크롤
    this.scrollToBottom();
    
    // 스트리밍 효과를 더 자연스럽게 하기 위한 타이핑 소리 효과 (브라우저가 지원하는 경우)
    try {
      if (window.AudioContext && Math.random() > 0.92) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 640 + Math.random() * 60;
        gainNode.gain.value = 0.03;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.03);
      }
    } catch (e) {
      // 사운드 효과 실패 시 무시
    }
  }
  
  /**
   * 스트리밍 종료 처리
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
    
    // 코드 블록 처리
    if (type === 'assistant') {
      element.innerHTML = codeBlockProcessor.processContent(stream.content);
      codeBlockProcessor.initializeCopyButtons(element);
      codeBlockProcessor.applySyntaxHighlighting(element);
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
}

// 코드 블록 처리기
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

// 모델 선택기 클래스
class ModelSelector {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      models: options.models || [],
      onChange: options.onChange || (() => {})
    };
    
    this.currentModel = null;
    this.isOpen = false;
    
    this.render();
    this.registerEvents();
  }
  
  /**
   * 모델 선택기 렌더링
   */
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="model-selector-header">
        <span class="model-selector-title">모델 선택</span>
        <span class="model-selector-icon">▼</span>
      </div>
      <div class="model-selector-dropdown"></div>
    `;
    
    this.header = this.container.querySelector('.model-selector-header');
    this.titleElement = this.container.querySelector('.model-selector-title');
    this.dropdown = this.container.querySelector('.model-selector-dropdown');
    
    this.renderDropdown();
  }
  
  /**
   * 드롭다운 옵션 렌더링
   */
  renderDropdown() {
    if (!this.dropdown) return;
    
    this.dropdown.innerHTML = '';
    
    // 모델을 제공업체별로 그룹화
    const providerGroups = this.groupByProvider(this.options.models);
    
    // 각 제공업체 그룹 렌더링
    for (const [provider, models] of Object.entries(providerGroups)) {
      // 제공업체 헤더 추가
      const groupHeader = document.createElement('div');
      groupHeader.className = 'model-category-header';
      groupHeader.textContent = provider;
      this.dropdown.appendChild(groupHeader);
      
      // 모델 옵션 추가
      models.forEach(model => {
        const option = document.createElement('div');
        option.className = 'model-option';
        option.dataset.id = model.id;
        option.textContent = model.name;
        
        // 현재 선택된 모델 표시
        if (this.currentModel && this.currentModel.id === model.id) {
          option.classList.add('selected');
        }
        
        // 클릭 이벤트
        option.addEventListener('click', () => {
          this.selectModel(model);
          this.toggleDropdown(false);
        });
        
        this.dropdown.appendChild(option);
      });
    }
  }
  
  /**
   * 모델을 제공업체별로 그룹화
   * @param {Array} models 
   * @returns {Object}
   */
  groupByProvider(models) {
    const groups = {};
    
    models.forEach(model => {
      const provider = model.provider || '기타';
      
      if (!groups[provider]) {
        groups[provider] = [];
      }
      
      groups[provider].push(model);
    });
    
    return groups;
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEvents() {
    if (!this.header) return;
    
    // 드롭다운 토글
    this.header.addEventListener('click', () => {
      this.toggleDropdown();
    });
    
    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.toggleDropdown(false);
      }
    });
  }
  
  /**
   * 드롭다운 토글
   * @param {boolean} force 
   */
  toggleDropdown(force) {
    this.isOpen = force !== undefined ? force : !this.isOpen;
    
    if (this.isOpen) {
      this.dropdown.classList.add('open');
      this.container.classList.add('open');
    } else {
      this.dropdown.classList.remove('open');
      this.container.classList.remove('open');
    }
  }
  
  /**
   * 모델 선택
   * @param {Object} model 
   */
  selectModel(model) {
    this.currentModel = model;
    
    if (this.titleElement) {
      this.titleElement.textContent = model.name;
    }
    
    // 콜백 호출
    if (this.options.onChange) {
      this.options.onChange(model.id, model);
    }
    
    // 선택 상태 업데이트
    this.updateSelection();
  }
  
  /**
   * 선택 상태 업데이트
   */
  updateSelection() {
    if (!this.dropdown) return;
    
    // 모든 옵션에서 selected 클래스 제거
    const options = this.dropdown.querySelectorAll('.model-option');
    options.forEach(option => {
      option.classList.remove('selected');
    });
    
    // 현재 선택된 모델에 selected 클래스 추가
    if (this.currentModel) {
      const selectedOption = this.dropdown.querySelector(`.model-option[data-id="${this.currentModel.id}"]`);
      if (selectedOption) {
        selectedOption.classList.add('selected');
      }
    }
  }
  
  /**
   * 모델 목록 업데이트
   * @param {Array} models 
   */
  updateModels(models) {
    this.options.models = models;
    
    // 현재 선택된 모델이 없거나 목록에 없는 경우 기본값 설정
    if (!this.currentModel && models.length > 0) {
      this.selectModel(models[0]);
    }
    
    this.renderDropdown();
  }
  
  /**
   * ID로 모델 설정
   * @param {string} modelId 
   */
  setModelById(modelId) {
    const model = this.options.models.find(m => m.id === modelId);
    
    if (model) {
      this.selectModel(model);
    }
  }
  
  /**
   * 현재 모델 ID 가져오기
   * @returns {string}
   */
  getCurrentModelId() {
    return this.currentModel ? this.currentModel.id : null;
  }
}

// 명령어 자동완성 클래스
class CommandAutocomplete {
  constructor(inputElement, options = {}) {
    this.input = inputElement;
    this.options = {
      onSelect: options.onSelect || (() => {})
    };
    
    this.commands = [];
    this.dynamicData = {};
    this.suggestions = [];
    this.selectedIndex = 0;
    this.isVisible = false;
    
    this.createContainer();
    this.registerEvents();
  }
  
  /**
   * 자동완성 컨테이너 생성
   */
  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'autocomplete-container';
    this.container.style.display = 'none';
    this.container.style.position = 'absolute';
    this.container.style.width = '100%';
    this.container.style.zIndex = '1000';
    this.container.style.backgroundColor = 'var(--claude-input-bg)';
    this.container.style.border = '1px solid var(--claude-border)';
    this.container.style.borderRadius = '4px';
    this.container.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    this.container.style.marginTop = '4px';
    this.container.style.maxHeight = '200px';
    this.container.style.overflowY = 'auto';
    
    // 입력 필드 컨테이너에 추가
    const inputContainer = this.input.parentElement;
    inputContainer.style.position = 'relative';
    inputContainer.appendChild(this.container);
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEvents() {
    // 입력 변경 이벤트
    this.input.addEventListener('input', () => {
      this.onInputChange(this.input.value);
    });
    
    // 키보드 이벤트
    this.input.addEventListener('keydown', (e) => {
      if (!this.isVisible) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectNextSuggestion();
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          this.selectPreviousSuggestion();
          break;
          
        case 'Enter':
          e.preventDefault();
          this.applySelectedSuggestion();
          break;
          
        case 'Escape':
          e.preventDefault();
          this.hideSuggestions();
          break;
      }
    });
    
    // 외부 클릭 시 숨기기
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target) && e.target !== this.input) {
        this.hideSuggestions();
      }
    });
  }
  
  /**
   * 입력 변경 처리
   * @param {string} text 
   */
  onInputChange(text) {
    // @ 또는 / 명령어 감지
    const atMatch = text.match(/@(\w*)$/);
    const slashMatch = text.match(/\/(\w*)$/);
    
    if (atMatch || slashMatch) {
      const match = atMatch || slashMatch;
      const prefix = atMatch ? '@' : '/';
      const query = match[1].toLowerCase();
      
      this.showSuggestions(prefix, query);
    } else {
      this.hideSuggestions();
    }
  }
  
  /**
   * 자동완성 제안 표시
   * @param {string} prefix 
   * @param {string} query 
   */
  showSuggestions(prefix, query) {
    // 명령어 필터링
    this.suggestions = this.commands
      .filter(cmd => {
        // 접두사 확인
        const isMatchingPrefix = cmd.syntax.startsWith(prefix);
        
        // 명령어 이름 또는 설명에서 검색어 매치 확인
        const commandText = cmd.syntax.toLowerCase();
        const descriptionText = (cmd.description || '').toLowerCase();
        
        return isMatchingPrefix && (
          commandText.includes(query) || 
          descriptionText.includes(query)
        );
      })
      .slice(0, 10); // 최대 10개 제안
    
    if (this.suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }
    
    // 선택 인덱스 초기화
    this.selectedIndex = 0;
    
    // 제안 렌더링
    this.renderSuggestions();
    
    // 컨테이너 표시
    this.container.style.display = 'block';
    this.isVisible = true;
  }
  
  /**
   * 제안 렌더링
   */
  renderSuggestions() {
    this.container.innerHTML = '';
    
    this.suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.style.padding = '8px 12px';
      item.style.cursor = 'pointer';
      item.style.fontSize = '13px';
      item.style.borderBottom = '1px solid var(--claude-border-light)';
      
      // 선택된 항목 강조
      if (index === this.selectedIndex) {
        item.classList.add('selected');
        item.style.backgroundColor = 'var(--claude-hover-bg)';
      }
      
      // 아이콘과 함께 표시
      let icon = '🔍';
      if (suggestion.syntax.startsWith('@git')) {
        icon = '📦';
      } else if (suggestion.syntax.startsWith('@jira')) {
        icon = '🎫';
      } else if (suggestion.syntax.startsWith('@swdp')) {
        icon = '🏗️';
      } else if (suggestion.syntax.startsWith('@pocket')) {
        icon = '💾';
      } else if (suggestion.syntax.startsWith('/')) {
        icon = '⚙️';
      }
      
      item.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 500;">${icon} ${suggestion.syntax}</span>
          <span style="font-size: 12px; opacity: 0.7;">${suggestion.description || ''}</span>
        </div>
      `;
      
      // 클릭 이벤트
      item.addEventListener('click', () => {
        this.selectedIndex = index;
        this.applySelectedSuggestion();
      });
      
      this.container.appendChild(item);
    });
  }
  
  /**
   * 자동완성 제안 숨기기
   */
  hideSuggestions() {
    this.container.style.display = 'none';
    this.isVisible = false;
  }
  
  /**
   * 다음 제안 선택
   */
  selectNextSuggestion() {
    this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length;
    this.renderSuggestions();
  }
  
  /**
   * 이전 제안 선택
   */
  selectPreviousSuggestion() {
    this.selectedIndex = (this.selectedIndex - 1 + this.suggestions.length) % this.suggestions.length;
    this.renderSuggestions();
  }
  
  /**
   * 선택된 제안 적용
   */
  applySelectedSuggestion() {
    if (this.suggestions.length === 0) return;
    
    const suggestion = this.suggestions[this.selectedIndex];
    
    // 현재 입력 값 가져오기
    const currentText = this.input.value;
    
    // @ 또는 / 명령어 위치 찾기
    const atIndex = currentText.lastIndexOf('@');
    const slashIndex = currentText.lastIndexOf('/');
    const index = Math.max(atIndex, slashIndex);
    
    if (index >= 0) {
      // 명령어 대체
      const newText = currentText.substring(0, index) + suggestion.syntax;
      this.input.value = newText;
      
      // 커서 위치 설정
      this.input.focus();
      this.input.setSelectionRange(newText.length, newText.length);
      
      // 콜백 호출
      if (this.options.onSelect) {
        this.options.onSelect(suggestion.syntax, suggestion);
      }
    }
    
    // 제안 숨기기
    this.hideSuggestions();
  }
  
  /**
   * 명령어 설정
   * @param {Array} commands 
   * @param {Object} dynamicData 
   */
  setCommands(commands, dynamicData = {}) {
    this.commands = commands || [];
    this.dynamicData = dynamicData || {};
    
    // 동적 데이터 기반으로 명령어 보강
    this.enhanceCommandsWithDynamicData();
  }
  
  /**
   * 동적 데이터로 명령어 보강
   */
  enhanceCommandsWithDynamicData() {
    // Git 브랜치 정보가 있는 경우
    if (this.dynamicData.gitBranches && Array.isArray(this.dynamicData.gitBranches)) {
      const branchCommands = this.dynamicData.gitBranches.map(branch => ({
        syntax: `@git:checkout ${branch.name}`,
        description: `브랜치 '${branch.name}'로 전환`,
        contextual: true
      }));
      
      // 명령어 목록에 추가
      this.commands = [...this.commands, ...branchCommands];
    }
    
    // 컨텍스트 기반 명령어가 있는 경우
    if (this.dynamicData.contextCommands && Array.isArray(this.dynamicData.contextCommands)) {
      this.commands = [...this.commands, ...this.dynamicData.contextCommands];
    }
  }
  
  /**
   * 자동완성이 표시 중인지 확인
   * @returns {boolean}
   */
  isShowing() {
    return this.isVisible;
  }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  window.apeUI = new ApeUI();
});