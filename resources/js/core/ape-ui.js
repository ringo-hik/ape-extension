/**
 * APE UI 핵심 컴포넌트
 * 
 * 채팅 인터페이스의 메인 UI 컨트롤러
 * 모든 UI 이벤트와 컴포넌트 간 상호작용을 관리합니다.
 */

import logger from '../utils/logger.js';
import eventBus from '../utils/event-bus.js';
import { 
  getElement, 
  addEventListeners, 
  toggleClass, 
  createElement, 
  appendElement, 
  removeAllChildren 
} from '../utils/dom-utils.js';

// 명시적 의존성
import '../components/model-selector.js';
import '../components/code-blocks.js';
import '../components/ui/resize-handle.js';

class ApeUI {
  constructor() {
    logger.debug('APE UI 생성자 호출 시작');
    logger.log('APE UI 초기화 시작');
    
    // VS Code API
    try {
      this.vscode = acquireVsCodeApi();
      logger.debug('VS Code API 획득 성공');
    } catch (error) {
      logger.error('VS Code API 초기화 실패:', error);
      this.vscode = null;
    }
    
    logger.debug('DOM 요소 참조 검색 시작');
    
    // DOM 요소
    this.messagesContainer = getElement('messages');
    this.chatInput = getElement('chatInput');
    this.sendButton = getElement('sendButton');
    this.clearButton = getElement('clearButton');
    this.embedDevButton = getElement('embedDevButton');
    this.commandsButton = getElement('commandsButton');
    this.apeToggleButton = getElement('apeToggleButton');
    this.commandsPanelContainer = getElement('commandsPanelContainer');
    this.commandsPanel = getElement('commandsPanel');
    this.emptyState = getElement('emptyState');
    
    // DOM 요소 존재 확인
    logger.debug('주요 DOM 요소 존재 확인:');
    logger.debug(`- messagesContainer: ${!!this.messagesContainer}`);
    logger.debug(`- chatInput: ${!!this.chatInput}`);
    logger.debug(`- sendButton: ${!!this.sendButton}`);
    logger.debug(`- clearButton: ${!!this.clearButton}`);
    logger.debug(`- commandsPanel: ${!!this.commandsPanel}`);
    
    // 상태
    this.messageState = this.vscode ? (this.vscode.getState() || { messages: [] }) : { messages: [] };
    this.streamingState = {
      activeStreams: {},
      isStreaming: false
    };
    this.embedDevMode = false;
    this.apeMode = false;
    this.commandPanelVisible = false;
    
    logger.debug('ApeUI 상태 초기화 완료, 메시지 수: ' + (this.messageState.messages ? this.messageState.messages.length : 0));
    
    // 초기화 및 이벤트 리스너 등록
    this.initialize();
  }
  
  /**
   * UI 초기화
   */
  initialize() {
    logger.log('UI 초기화');
    logger.debug('initialize() 메서드 시작');
    
    try {
      // 메시지 렌더링
      logger.debug('메시지 렌더링 시작');
      this.renderMessages();
      logger.debug('메시지 렌더링 완료');
      
      // 입력창 높이 자동 조절
      logger.debug('입력창 높이 자동 조절 설정 시작');
      this.setupAutoResizeTextarea();
      logger.debug('입력창 높이 자동 조절 설정 완료');
      
      // 이벤트 리스너 설정
      logger.debug('이벤트 리스너 설정 시작');
      this.setupEventListeners();
      logger.debug('이벤트 리스너 설정 완료');
      
      // 모델 선택기 이벤트 구독
      logger.debug('모델 선택기 이벤트 구독 설정');
      eventBus.subscribe('modelSelected', this.handleModelSelected.bind(this));
      
      // VS Code 메시지 이벤트 리스너
      logger.debug('VS Code 메시지 이벤트 리스너 등록');
      window.addEventListener('message', this.handleVsCodeMessage.bind(this));
      
      // iframe 메시지 리스너 설정
      logger.debug('iframe 메시지 리스너 설정 시작');
      this.setupIframeListeners();
      logger.debug('iframe 메시지 리스너 설정 완료');
      
      // 새 채팅 및 저장 버튼 모듈 로드
      logger.debug('새 채팅 및 저장 버튼 모듈 동적 로드 시작');
      import('../components/new-chat-button.js')
        .then(() => logger.debug('new-chat-button.js 모듈 로드 완료'))
        .catch(err => logger.error('new-chat-button.js 모듈 로드 실패:', err));
        
      import('../components/save-button.js')
        .then(() => logger.debug('save-button.js 모듈 로드 완료'))
        .catch(err => logger.error('save-button.js 모듈 로드 실패:', err));
      
      // 오류 핸들러
      logger.debug('전역 오류 핸들러 등록');
      window.addEventListener('error', this.handleError.bind(this));
      
      // 명령어 패널 iframe이 있으면 ping 시도
      if (this.commandsPanel) {
        logger.debug('commandsPanel iframe 감지됨, ping 예약');
        setTimeout(() => {
          try {
            this.pingCommandsIframe();
            logger.debug('iframe ping 전송 완료');
          } catch (error) {
            logger.warn('초기화 중 iframe ping 실패:', error);
          }
        }, 1500);
      } else {
        logger.warn('commandsPanel iframe을 찾을 수 없음');
      }
      
      // 새 채팅 및 저장 버튼 이벤트 구독
      const newChatButton = getElement('newChatButton');
      if (newChatButton) {
        logger.debug('newChatButton 발견, 이벤트 리스너 등록');
        newChatButton.addEventListener('click', () => {
          if (this.vscode) {
            logger.log('새 채팅 버튼 클릭됨, newChat 명령 전송');
            this.vscode.postMessage({
              command: 'newChat'
            });
          }
        });
      } else {
        logger.warn('newChatButton 요소를 찾을 수 없음');
      }
      
      const saveButton = getElement('saveButton');
      if (saveButton) {
        logger.debug('saveButton 발견, 이벤트 리스너 등록');
        saveButton.addEventListener('click', () => {
          if (this.vscode) {
            logger.log('저장 버튼 클릭됨, saveChatSession 명령 전송');
            this.vscode.postMessage({
              command: 'saveChatSession'
            });
          }
        });
      } else {
        logger.warn('saveButton 요소를 찾을 수 없음');
      }
      
      logger.debug('UI 초기화 모든 단계 완료');
      logger.log('UI 초기화 완료');
      
      // VSCode에 초기화 완료 알림
      if (this.vscode) {
        try {
          logger.debug('VSCode에 초기화 완료 메시지 전송 시도');
          this.vscode.postMessage({
            command: 'ui_initialized',
            timestamp: Date.now()
          });
          logger.debug('VSCode에 초기화 완료 메시지 전송 성공');
        } catch (error) {
          logger.error('VSCode에 초기화 완료 메시지 전송 실패:', error);
        }
      }
    } catch (error) {
      logger.error('UI 초기화 중 심각한 오류 발생:', error);
      this._displayErrorState('UI 초기화 중 오류가 발생했습니다', error);
    }
  }
  
  /**
   * 오류 상태 표시
   */
  _displayErrorState(message, error) {
    try {
      if (this.messagesContainer) {
        // 기존 내용 비우기
        this.messagesContainer.innerHTML = '';
        
        // 오류 메시지 컨테이너 생성
        const errorContainer = document.createElement('div');
        errorContainer.className = 'ape-error-container';
        errorContainer.style.padding = '20px';
        errorContainer.style.color = 'var(--ape-error, #f44336)';
        errorContainer.style.textAlign = 'center';
        
        // 오류 아이콘
        const errorIcon = document.createElement('div');
        errorIcon.innerHTML = '<i class="ph ph-warning-circle" style="font-size: 48px; margin-bottom: 10px;"></i>';
        errorContainer.appendChild(errorIcon);
        
        // 오류 메시지
        const errorMessage = document.createElement('div');
        errorMessage.style.marginBottom = '15px';
        errorMessage.style.fontWeight = 'bold';
        errorMessage.textContent = message;
        errorContainer.appendChild(errorMessage);
        
        // 오류 상세 정보
        if (error) {
          const errorDetails = document.createElement('pre');
          errorDetails.style.textAlign = 'left';
          errorDetails.style.padding = '10px';
          errorDetails.style.background = 'var(--ape-code-bg, rgba(0,0,0,0.1))';
          errorDetails.style.borderRadius = '4px';
          errorDetails.style.overflow = 'auto';
          errorDetails.style.maxHeight = '200px';
          errorDetails.textContent = error.toString();
          
          if (error.stack) {
            errorDetails.textContent += '\n\n' + error.stack;
          }
          
          errorContainer.appendChild(errorDetails);
        }
        
        // 재시도 버튼
        const retryButton = document.createElement('button');
        retryButton.className = 'ape-btn ape-btn-primary';
        retryButton.style.marginTop = '15px';
        retryButton.textContent = '새로고침';
        retryButton.onclick = () => {
          window.location.reload();
        };
        errorContainer.appendChild(retryButton);
        
        // 오류 상태를 메시지 컨테이너에 추가
        this.messagesContainer.appendChild(errorContainer);
      }
    } catch (displayError) {
      logger.error('오류 상태 표시 실패:', displayError);
      // 최후의 수단: alert
      alert(`UI 오류: ${message}\n\n${error}`);
    }
  }
  
  /**
   * 메시지 렌더링
   */
  renderMessages() {
    if (!this.messagesContainer) return;
    
    // 이전 메시지 지우기
    removeAllChildren(this.messagesContainer);
    
    const messages = this.messageState.messages || [];
    
    if (messages.length === 0) {
      // 빈 상태 표시
      if (this.emptyState) {
        this.emptyState.style.display = 'flex';
      }
      return;
    }
    
    // 빈 상태 숨기기
    if (this.emptyState) {
      this.emptyState.style.display = 'none';
    }
    
    // 메시지 렌더링
    messages.forEach(message => {
      const messageElement = this.createMessageElement(message);
      appendElement(this.messagesContainer, messageElement);
    });
    
    // 코드 블록 처리
    if (window.codeBlocks) {
      window.codeBlocks.processCodeBlocks(this.messagesContainer);
    }
    
    // 마지막 메시지로 스크롤
    this.scrollToBottom();
  }
  
  /**
   * 메시지 엘리먼트 생성
   */
  createMessageElement(message) {
    const { role, content, id } = message;
    
    const messageElement = createElement('div', {
      className: `message ${role}-message`,
      'data-message-id': id || ''
    });
    
    const headerElement = createElement('div', { className: 'message-header' });
    const avatarElement = createElement('div', { className: 'message-avatar' });
    const roleText = role === 'user' ? '사용자' : 'APE';
    const roleElement = createElement('div', { className: 'message-role' }, roleText);
    
    appendElement(headerElement, avatarElement);
    appendElement(headerElement, roleElement);
    appendElement(messageElement, headerElement);
    
    const contentElement = createElement('div', { className: 'message-content' });
    contentElement.innerHTML = this.formatMessageContent(content);
    
    appendElement(messageElement, contentElement);
    
    return messageElement;
  }
  
  /**
   * 메시지 내용 포맷팅
   */
  formatMessageContent(content) {
    if (!content) return '';
    
    // 임시 구현: 마크다운 변환은 별도 라이브러리나 VS Code API 활용 필요
    // 여기서는 간단한 구현만 제공
    
    // 코드 블록 포맷팅
    const formattedContent = content.replace(
      /```(\w*)([\s\S]*?)```/g,
      (match, language, code) => {
        return `<pre class="language-${language}"><code>${this.escapeHtml(code.trim())}</code></pre>`;
      }
    );
    
    return formattedContent;
  }
  
  /**
   * HTML 이스케이프
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
  
  /**
   * 입력창 자동 리사이즈 설정
   */
  setupAutoResizeTextarea() {
    if (!this.chatInput) return;
    
    const resizeTextarea = () => {
      this.chatInput.style.height = 'auto';
      this.chatInput.style.height = this.chatInput.scrollHeight + 'px';
    };
    
    // 입력 이벤트에서 리사이즈
    this.chatInput.addEventListener('input', resizeTextarea);
    
    // 초기 설정
    setTimeout(resizeTextarea, 0);
  }
  
  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 전송 버튼 클릭
    if (this.sendButton) {
      this.sendButton.addEventListener('click', this.handleSendMessage.bind(this));
      logger.log('전송 버튼 이벤트 리스너 등록됨');
    } else {
      logger.error('전송 버튼 요소를 찾을 수 없습니다');
    }
    
    // 엔터 키 처리
    if (this.chatInput) {
      this.chatInput.addEventListener('keydown', this.handleInputKeyDown.bind(this));
      this.chatInput.addEventListener('input', this.handleInputChange.bind(this));
      logger.log('채팅 입력 이벤트 리스너 등록됨');
    } else {
      logger.error('채팅 입력 요소를 찾을 수 없습니다');
    }
    
    // 지우기 버튼
    if (this.clearButton) {
      logger.log('지우기 버튼 ID: ' + this.clearButton.id);
      logger.log('지우기 버튼 클래스: ' + this.clearButton.className);
      this.clearButton.addEventListener('click', (event) => {
        logger.log('지우기 버튼 클릭됨!');
        this.handleClearMessages();
      });
      logger.log('지우기 버튼 이벤트 리스너 등록됨');
    } else {
      logger.error('지우기 버튼 요소를 찾을 수 없습니다');
    }
    
    // 새 채팅 버튼 (직접 처리)
    const newChatButton = document.getElementById('newChatButton');
    if (newChatButton) {
      newChatButton.addEventListener('click', () => {
        logger.log('새 채팅 버튼 클릭됨');
        if (this.vscode) {
          this.vscode.postMessage({
            command: 'newChat'
          });
        }
      });
      logger.log('새 채팅 버튼 이벤트 리스너 등록됨');
    } else {
      logger.error('새 채팅 버튼 요소를 찾을 수 없습니다');
    }
    
    // 저장 버튼 (직접 처리)
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        logger.log('저장 버튼 클릭됨');
        if (this.vscode) {
          this.vscode.postMessage({
            command: 'saveChatSession'
          });
        }
      });
      logger.log('저장 버튼 이벤트 리스너 등록됨');
    } else {
      logger.error('저장 버튼 요소를 찾을 수 없습니다');
    }
    
    // 심층 분석 모드 버튼
    if (this.embedDevButton) {
      this.embedDevButton.addEventListener('click', this.handleEmbedDevMode.bind(this));
      logger.log('심층 분석 모드 버튼 이벤트 리스너 등록됨');
    } else {
      logger.error('심층 분석 모드 버튼 요소를 찾을 수 없습니다');
    }
    
    // 명령어 버튼
    if (this.commandsButton) {
      this.commandsButton.addEventListener('click', this.handleCommandsPanel.bind(this));
      logger.log('명령어 버튼 이벤트 리스너 등록됨');
    } else {
      logger.error('명령어 버튼 요소를 찾을 수 없습니다');
    }
    
    // APE 토글 버튼
    if (this.apeToggleButton) {
      this.apeToggleButton.addEventListener('click', this.handleApeToggle.bind(this));
      logger.log('APE 토글 버튼 이벤트 리스너 등록됨');
    } else {
      logger.error('APE 토글 버튼 요소를 찾을 수 없습니다');
    }
    
    // 크기 조절 핸들
    const resizeHandle = document.getElementById('resizeHandle');
    if (resizeHandle) {
      this.setupResizeHandlers(resizeHandle);
      logger.log('크기 조절 핸들 이벤트 리스너 등록됨');
    } else {
      logger.error('크기 조절 핸들을 찾을 수 없습니다');
    }
    
    // 창 크기 변경 이벤트
    window.addEventListener('resize', () => {
      this.adjustLayout();
    });
  }
  
  /**
   * 크기 조절 핸들러 설정
   */
  setupResizeHandlers(resizeHandle) {
    if (!this.messagesContainer) {
      logger.error('메시지 컨테이너를 찾을 수 없어 크기 조절 핸들러를 설정할 수 없습니다.');
      return;
    }
    
    // ResizeHandle 컴포넌트가 이 기능을 대체합니다.
    // 컴포넌트가 아직 로드되지 않은 경우를 대비해 기본 높이값 복원
    try {
      const savedHeight = localStorage.getItem('ape-messages-height');
      if (savedHeight) {
        const parsedHeight = parseInt(savedHeight, 10);
        if (!isNaN(parsedHeight) && parsedHeight > 100) {
          this.messagesContainer.style.height = `${parsedHeight}px`;
          logger.log(`저장된 메시지 영역 높이 복원: ${parsedHeight}px`);
        }
      }
    } catch (error) {
      logger.warn('저장된 높이값 복원 실패:', error);
    }
    
    // resize 이벤트 구독
    eventBus.subscribe('resize:complete', (data) => {
      // 스크롤 위치 조정 (필요 시)
      if (this.streamingState.isStreaming) {
        this.scrollToBottom();
      }
    });
    
    logger.log('크기 조절 핸들러 설정 완료');
  }
  
  /**
   * 메시지 전송 처리
   */
  handleSendMessage() {
    if (!this.chatInput || !this.vscode) return;
    
    const message = this.chatInput.value.trim();
    if (!message) return;
    
    // 입력창 비우기
    this.chatInput.value = '';
    this.chatInput.style.height = 'auto';
    
    // 전송 버튼 비활성화
    if (this.sendButton) {
      this.sendButton.disabled = true;
    }
    
    // 메시지 추가
    this.addMessage('user', message);
    
    // VS Code에 메시지 전송
    this.vscode.postMessage({
      command: 'sendMessage',
      text: message, // text 속성으로 변경 (원래 message 속성이었음)
      model: this.chatInput.dataset.modelId, // 선택한 모델 ID 추가
      apeMode: this.apeMode,
      embedDevMode: this.embedDevMode
    });
  }
  
  /**
   * 입력창 키 이벤트 처리
   */
  handleInputKeyDown(event) {
    // 엔터 키: 메시지 전송 (Shift+Enter는 줄바꿈)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSendMessage();
    }
  }
  
  /**
   * 입력창 변경 이벤트 처리
   */
  handleInputChange() {
    if (!this.chatInput || !this.sendButton) return;
    
    // 입력 내용이 있으면 전송 버튼 활성화
    this.sendButton.disabled = !this.chatInput.value.trim();
  }
  
  /**
   * 메시지 추가
   */
  addMessage(role, content, id = null) {
    if (!id) {
      id = Date.now().toString();
    }
    
    const message = { role, content, id };
    this.messageState.messages = [...(this.messageState.messages || []), message];
    
    // 상태 저장
    if (this.vscode) {
      this.vscode.setState(this.messageState);
    }
    
    // UI 갱신
    this.renderMessages();
  }
  
  /**
   * 메시지 지우기
   */
  handleClearMessages() {
    logger.log('handleClearMessages 함수 호출됨');
    
    try {
      // 확인 메시지 표시
      const confirmed = confirm('모든 대화 내용을 지우시겠습니까?');
      logger.log('확인 대화상자 결과: ' + confirmed);
      
      if (!confirmed) {
        logger.log('사용자가 취소함');
        return;
      }
      
      logger.log('메시지 지우기 확인됨, 모든 메시지를 지웁니다.');
      
      // 메시지 상태 초기화
      this.messageState.messages = [];
      logger.log('메시지 상태가 초기화됨');
      
      // 상태 저장
      if (this.vscode) {
        this.vscode.setState(this.messageState);
        logger.log('VS Code 상태가 업데이트됨');
        
        // VS Code에 지우기 명령 전송
        logger.log('VS Code에 clearChat 명령 전송 시도...');
        this.vscode.postMessage({
          command: 'clearChat'
        });
        
        logger.log('VS Code에 clearChat 명령 전송됨');
      } else {
        logger.error('VS Code API를 찾을 수 없어 지우기 명령을 전송할 수 없습니다.');
      }
      
      // UI 갱신
      logger.log('메시지 UI 갱신 시도...');
      this.renderMessages();
      logger.log('메시지 UI 갱신됨');
      
      // 사용자에게 피드백
      this.showTemporaryMessage('모든 대화 내용이 지워졌습니다.');
    } catch (error) {
      logger.error('메시지 지우기 중 오류 발생:', error);
    }
  }
  
  /**
   * 심층 분석 모드 처리
   */
  handleEmbedDevMode() {
    this.embedDevMode = !this.embedDevMode;
    
    if (this.embedDevButton) {
      toggleClass(this.embedDevButton, 'active', this.embedDevMode);
    }
    
    // VS Code에 모드 변경 알림
    if (this.vscode) {
      this.vscode.postMessage({
        command: 'setEmbedDevMode',
        enabled: this.embedDevMode
      });
    }
    
    // 사용자에게 피드백 제공
    this.showTemporaryMessage(
      this.embedDevMode ? '심층 분석 모드가 활성화되었습니다.' : '심층 분석 모드가 비활성화되었습니다.'
    );
  }
  
  /**
   * 명령어 패널 토글
   */
  handleCommandsPanel() {
    this.commandPanelVisible = !this.commandPanelVisible;
    
    if (this.commandsPanelContainer) {
      this.commandsPanelContainer.style.display = this.commandPanelVisible ? 'block' : 'none';
    }
    
    if (this.commandsButton) {
      toggleClass(this.commandsButton, 'active', this.commandPanelVisible);
    }
    
    // 명령어 패널이 표시되면 iframe과 통신 설정
    if (this.commandPanelVisible) {
      this.setupIframeListeners();
      this.pingCommandsIframe();
    }
  }
  
  /**
   * iframe 리스너 설정
   */
  setupIframeListeners() {
    // iframe으로부터 메시지 수신 처리
    if (!this._iframeListenerSetup) {
      window.addEventListener('message', (event) => {
        // iframe 메시지인지 확인
        if (event.data && event.data.source === 'command_buttons') {
          this.handleIframeMessage(event.data);
        }
      });
      
      this._iframeListenerSetup = true;
      logger.log('iframe 메시지 리스너 설정 완료');
    }
  }
  
  /**
   * iframe으로 ping 보내기
   */
  pingCommandsIframe() {
    if (window.commandsPanel && window.commandsPanel.contentWindow) {
      try {
        window.commandsPanel.contentWindow.postMessage({
          command: 'iframe_ping',
          source: 'parent',
          timestamp: Date.now()
        }, '*');
        
        logger.log('iframe으로 ping 메시지 전송');
      } catch (error) {
        logger.error('iframe ping 전송 오류:', error);
      }
    }
  }
  
  /**
   * iframe 메시지 처리
   */
  handleIframeMessage(message) {
    logger.log('iframe으로부터 메시지 수신:', message.command);
    
    switch (message.command) {
      case 'iframe_initialized':
        // iframe이 초기화되었을 때 명령어 목록 전송
        this.sendCommandsToIframe();
        break;
        
      case 'iframe_pong':
        // ping 응답 처리
        logger.log('iframe으로부터 pong 응답 수신');
        break;
        
      case 'iframe_getCommands':
        // iframe에서 명령어 요청 시
        this.sendCommandsToIframe();
        break;
        
      case 'iframe_executeCommand':
        // iframe에서 명령어 실행 요청 시
        if (message.commandId && this.vscode) {
          try {
            logger.log(`iframe으로부터 명령어 실행 요청: ${message.commandId}`);
            this.vscode.postMessage({
              command: 'executeCommand',
              commandId: message.commandId
            });
            
            // 명령어 실행 성공 알림
            this.notifyIframeCommandStatus(message.commandId, true);
          } catch (error) {
            logger.error(`iframe 명령어 실행 실패: ${message.commandId}`, error);
            // 실행 실패 알림
            this.notifyIframeCommandStatus(message.commandId, false, String(error));
          }
        } else {
          // 실행 불가능 알림
          this.notifyIframeCommandStatus(
            message.commandId || 'unknown',
            false,
            this.vscode ? '유효하지 않은 명령어' : 'VS Code API 연결 없음'
          );
        }
        break;
    }
  }
  
  /**
   * iframe에 명령어 실행 상태 알림
   */
  notifyIframeCommandStatus(commandId, success, error = null) {
    if (window.commandsPanel && window.commandsPanel.contentWindow) {
      try {
        window.commandsPanel.contentWindow.postMessage({
          command: 'iframe_commandStatus',
          source: 'parent',
          commandId: commandId,
          success: success,
          error: error,
          timestamp: Date.now()
        }, '*');
      } catch (e) {
        logger.error('명령어 상태 알림 실패:', e);
      }
    }
  }
  
  /**
   * iframe에 명령어 목록 전송
   */
  sendCommandsToIframe() {
    if (window.commandsPanel && window.commandsPanel.contentWindow && this.vscode) {
      // VS Code에 명령어 목록 요청
      this.vscode.postMessage({
        command: 'getCommands'
      });
    }
  }
  
  /**
   * APE 모드 토글
   */
  handleApeToggle() {
    this.apeMode = !this.apeMode;
    
    if (this.apeToggleButton) {
      toggleClass(this.apeToggleButton, 'active', this.apeMode);
    }
    
    // VS Code에 모드 변경 알림
    if (this.vscode) {
      this.vscode.postMessage({
        command: 'toggleApeMode',
        enabled: this.apeMode
      });
    }
    
    // 사용자에게 피드백 제공
    this.showTemporaryMessage(
      this.apeMode ? '도구 활용 모드가 활성화되었습니다.' : '도구 활용 모드가 비활성화되었습니다.'
    );
  }
  
  /**
   * 모델 선택 처리
   */
  handleModelSelected(model) {
    logger.log(`모델 선택됨: ${model.name}`);
    
    // 채팅 입력창에 모델 ID 데이터 속성 설정
    if (this.chatInput) {
      this.chatInput.dataset.modelId = model.id;
    }
  }
  
  /**
   * VS Code로부터 메시지 처리
   */
  handleVsCodeMessage(event) {
    const message = event.data;
    
    switch (message.command) {
      case 'viewStateChanged':
        // 뷰 상태 변경 시 레이아웃 조정
        this.handleViewStateChange(message);
        break;
      case 'receiveMessage':
      case 'addMessage':
        this.addMessage('assistant', message.content, message.id);
        
        // 전송 버튼 다시 활성화
        if (this.sendButton) {
          this.sendButton.disabled = false;
        }
        break;
        
      case 'clearChat':
        this.messageState.messages = [];
        if (this.vscode) {
          this.vscode.setState(this.messageState);
        }
        this.renderMessages();
        
        // 전송 버튼 상태 초기화
        if (this.sendButton) {
          this.sendButton.disabled = !this.chatInput || !this.chatInput.value.trim();
        }
        
        // 환영 메시지 표시
        setTimeout(() => {
          const welcomeMsg = '안녕하세요! APE 채팅에 오신 것을 환영합니다.';
          this.addMessage('assistant', welcomeMsg);
        }, 500);
        break;
        
      case 'streamMessage':
        this.handleStreamMessage(message);
        break;
        
      // 스트리밍 관련 명령어 처리 (ApeChatViewProvider가 보내는 명령)
      case 'startStreaming':
        // 스트리밍 상태 초기화
        this.streamingState.activeStreams[message.responseId] = true;
        this.streamingState.isStreaming = true;
        
        // 초기 메시지가 있으면 추가
        if (message.content) {
          const existingIndex = this.messageState.messages.findIndex(m => m.id === message.responseId);
          
          if (existingIndex >= 0) {
            // 기존 메시지 업데이트
            this.messageState.messages[existingIndex].content = message.content;
          } else {
            // 새 메시지 추가
            this.messageState.messages.push({
              id: message.responseId,
              role: message.type || 'assistant',
              content: message.content || ''
            });
          }
          
          // 상태 저장
          if (this.vscode) {
            this.vscode.setState(this.messageState);
          }
          
          // UI 업데이트
          this.updateStreamingMessage(message.responseId, message.content || '', message.type || 'assistant');
        }
        break;
        
      case 'appendStreamChunk':
        // 기존 메시지 찾기
        const existingIndex = this.messageState.messages.findIndex(m => m.id === message.responseId);
        
        if (existingIndex >= 0) {
          // 기존 메시지 업데이트
          this.messageState.messages[existingIndex].content = message.content;
        } else {
          // 새 메시지 추가
          this.messageState.messages.push({
            id: message.responseId,
            role: message.type || 'assistant',
            content: message.content
          });
        }
        
        // 상태 저장
        if (this.vscode) {
          this.vscode.setState(this.messageState);
        }
        
        // UI 갱신
        this.updateStreamingMessage(message.responseId, message.content, message.type || 'assistant');
        break;
        
      case 'endStreaming':
        // 스트리밍 상태 업데이트
        delete this.streamingState.activeStreams[message.responseId];
        this.streamingState.isStreaming = Object.keys(this.streamingState.activeStreams).length > 0;
        
        // 전송 버튼 다시 활성화 (모든 스트림이 완료된 경우)
        if (!this.streamingState.isStreaming && this.sendButton) {
          this.sendButton.disabled = false;
        }
        break;
        
      case 'clearMessages':
      case 'clearChat':
        this.messageState.messages = [];
        if (this.vscode) {
          this.vscode.setState(this.messageState);
        }
        this.renderMessages();
        
        // 전송 버튼 상태 초기화
        if (this.sendButton) {
          this.sendButton.disabled = !this.chatInput || !this.chatInput.value.trim();
        }
        break;
        
      case 'setModels':
      case 'updateModels':
        // 모델 선택기에 모델 목록 전달
        if (window.modelSelector) {
          window.modelSelector.setModels(message.models);
        }
        break;
        
      case 'setCurrentModel':
        // 현재 모델 설정
        if (window.modelSelector) {
          window.modelSelector.selectModel(message.modelId);
        }
        break;
        
      case 'setCommands':
      case 'updateCommands':
        // 명령어 버튼 패널에 명령어 목록 전달
        if (window.commandsPanel && window.commandsPanel.contentWindow) {
          // iframe으로 명령어 전달
          window.commandsPanel.contentWindow.postMessage({
            command: 'setCommands',
            commands: message.commands
          }, '*');
        }
        break;
        
      case 'removeSystemMessage':
        // 시스템 메시지 제거
        const systemMsgIndex = this.messageState.messages.findIndex(
          m => m.role === 'system' && m.content === message.content
        );
        
        if (systemMsgIndex >= 0) {
          this.messageState.messages.splice(systemMsgIndex, 1);
          if (this.vscode) {
            this.vscode.setState(this.messageState);
          }
          this.renderMessages();
        }
        break;
        
      case 'setApeMode':
        // APE 모드 설정
        this.apeMode = message.enabled;
        if (this.apeToggleButton) {
          toggleClass(this.apeToggleButton, 'active', this.apeMode);
        }
        break;
        
      case 'initialized':
        // 초기화 완료 처리
        logger.log('웹뷰 초기화 완료 메시지 수신:', message.timestamp);
        break;
        
      case 'viewDimensions':
        // VSCode에서 전송한 뷰 크기 정보 처리
        this.handleViewDimensions(message);
        break;
        
      default:
        logger.log(`알 수 없는 VS Code 메시지: ${message.command}`);
    }
  }
  
  /**
   * 스트리밍 메시지 처리
   */
  handleStreamMessage(message) {
    const { id, content, done } = message;
    
    // 스트리밍 상태 관리
    if (done) {
      delete this.streamingState.activeStreams[id];
      this.streamingState.isStreaming = Object.keys(this.streamingState.activeStreams).length > 0;
      
      // 전송 버튼 다시 활성화 (모든 스트림이 완료된 경우)
      if (!this.streamingState.isStreaming && this.sendButton) {
        this.sendButton.disabled = false;
      }
    } else {
      this.streamingState.activeStreams[id] = true;
      this.streamingState.isStreaming = true;
    }
    
    // 기존 메시지 찾기
    const existingIndex = this.messageState.messages.findIndex(m => m.id === id);
    
    if (existingIndex >= 0) {
      // 기존 메시지 업데이트
      this.messageState.messages[existingIndex].content = content;
    } else {
      // 새 메시지 추가
      this.messageState.messages.push({
        id,
        role: 'assistant',
        content
      });
    }
    
    // 상태 저장
    if (this.vscode) {
      this.vscode.setState(this.messageState);
    }
    
    // UI 갱신 (최적화: 전체 재렌더링 대신 특정 메시지만 업데이트)
    this.updateStreamingMessage(id, content);
  }
  
  /**
   * 스트리밍 메시지 UI 업데이트
   */
  updateStreamingMessage(id, content) {
    if (!this.messagesContainer) return;
    
    // 메시지 요소 찾기
    let messageElement = this.messagesContainer.querySelector(`[data-message-id="${id}"]`);
    
    if (messageElement) {
      // 기존 메시지 업데이트
      const contentElement = messageElement.querySelector('.message-content');
      if (contentElement) {
        contentElement.innerHTML = this.formatMessageContent(content);
      }
    } else {
      // 새 메시지 생성
      const message = { role: 'assistant', content, id };
      messageElement = this.createMessageElement(message);
      appendElement(this.messagesContainer, messageElement);
      
      // 빈 상태 숨기기
      if (this.emptyState) {
        this.emptyState.style.display = 'none';
      }
    }
    
    // 코드 블록 처리
    if (window.codeBlocks) {
      window.codeBlocks.processCodeBlocks(messageElement);
    }
    
    // 스크롤 조정
    this.scrollToBottom();
  }
  
  /**
   * 하단으로 스크롤
   */
  scrollToBottom() {
    if (!this.messagesContainer) return;
    
    // 부드러운 스크롤
    this.messagesContainer.scrollTo({
      top: this.messagesContainer.scrollHeight,
      behavior: 'smooth'
    });
  }
  
  /**
   * 임시 메시지 표시
   */
  showTemporaryMessage(message, duration = 2000) {
    // 이미 존재하는 알림 제거
    const existingNotification = document.querySelector('.ape-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = createElement('div', { className: 'ape-notification' }, message);
    appendElement(document.body, notification);
    
    // 애니메이션 효과
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // 제거 타이머
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  }
  
  /**
   * 오류 처리
   */
  handleError(event) {
    logger.error(`UI 오류 발생: ${event.message}`);
    
    // 사용자에게 오류 알림
    this.showTemporaryMessage(`오류 발생: ${event.message}`, 3000);
  }

  /**
   * 뷰 상태 변경 처리
   * @param {Object} message - 변경된 뷰 상태 정보
   */
  handleViewStateChange(message) {
    logger.log('뷰 상태 변경 감지:', message);
    
    // 메시지 컨테이너 레이아웃 조정
    if (this.messagesContainer) {
      // 뷰가 보이게 되면 스크롤을 아래로 이동
      if (message.isVisible) {
        this.scrollToBottom();
        
        // UI 레이아웃 재계산
        this.adjustLayout();
      }
    }
  }
  
  /**
   * VSCode에서 제공하는 뷰 크기 정보 처리
   */
  handleViewDimensions(message) {
    logger.log('뷰 크기 정보 수신:', message);
    
    // 레이아웃 조정 트리거
    this.adjustLayout();
    
    // 저장된 높이값이 있다면 복원 시도
    try {
      const savedHeight = localStorage.getItem('ape-messages-height');
      if (savedHeight) {
        const parsedHeight = parseInt(savedHeight, 10);
        if (!isNaN(parsedHeight) && parsedHeight > 100) {
          if (this.messagesContainer) {
            this.messagesContainer.style.height = `${parsedHeight}px`;
            logger.log(`저장된 메시지 영역 높이 적용: ${parsedHeight}px`);
          }
        }
      }
    } catch (error) {
      logger.warn('저장된 높이값 복원 실패:', error);
    }
    
    // 최신 메시지로 스크롤
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }
  
  /**
   * UI 레이아웃 조정
   */
  adjustLayout() {
    logger.log('UI 레이아웃 조정 중...');
    
    // 컨테이너 및 메시지 영역 확인
    if (!this.messagesContainer) {
      logger.error('메시지 컨테이너를 찾을 수 없어 레이아웃을 조정할 수 없습니다.');
      return;
    }
    
    try {
      // 가용 높이 계산
      const containerHeight = window.innerHeight;
      const headerHeight = document.querySelector('.ape-header')?.offsetHeight || 0;
      const footerHeight = document.querySelector('.ape-footer')?.offsetHeight || 0;
      
      // 메시지 영역 최대 높이 계산 (패딩 고려)
      const maxMessageHeight = containerHeight - headerHeight - footerHeight - 40; // 40px는 여유 공간
      
      // 저장된 높이값 가져오기
      let savedHeight = 0;
      try {
        const savedHeightStr = localStorage.getItem('ape-messages-height');
        if (savedHeightStr) {
          savedHeight = parseInt(savedHeightStr, 10);
        }
      } catch (error) {
        logger.warn('저장된 높이값 가져오기 실패:', error);
      }
      
      // 저장된 높이값이 있고 가용 공간보다 작으면 그 값을 사용
      // 그렇지 않으면 최대 높이와 최소 높이(150px) 중 큰 값 사용
      const messageHeight = savedHeight > 0 && savedHeight < maxMessageHeight
        ? savedHeight
        : Math.max(150, maxMessageHeight);
      
      logger.log(`계산된 레이아웃 값: 컨테이너=${containerHeight}px, 헤더=${headerHeight}px, 푸터=${footerHeight}px, 메시지=${messageHeight}px, 저장된 높이=${savedHeight}px`);
      
      // 메시지 영역 높이 설정
      if (!this.messagesContainer.style.height || this.messagesContainer.style.height === 'auto') {
        this.messagesContainer.style.height = `${messageHeight}px`;
      }
      
      // 스크롤을 최하단으로
      this.scrollToBottom();
      
      // 크기 변경 모니터링 설정 (ResizeObserver가 지원되는 경우)
      if (window.ResizeObserver && !this._resizeObserver) {
        this._resizeObserver = new ResizeObserver(entries => {
          for (let entry of entries) {
            if (entry.target === document.body || entry.target === this.messagesContainer) {
              this.adjustLayout();
              break;
            }
          }
        });
        
        // body와 메시지 컨테이너 크기 변경 감시
        this._resizeObserver.observe(document.body);
        this._resizeObserver.observe(this.messagesContainer);
        
        logger.log('크기 변경 모니터링이 설정되었습니다.');
      }
    } catch (error) {
      logger.error('레이아웃 조정 중 오류 발생:', error);
    }
  }
}

// UI 인스턴스 생성 및 전역 객체로 내보내기
window.apeUI = new ApeUI();

export default window.apeUI;