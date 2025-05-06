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

class ApeUI {
  constructor() {
    logger.log('APE UI 초기화 시작');
    
    // VS Code API
    try {
      this.vscode = acquireVsCodeApi();
    } catch (error) {
      logger.error('VS Code API 초기화 실패:', error);
      this.vscode = null;
    }
    
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
    
    // 상태
    this.messageState = this.vscode ? (this.vscode.getState() || { messages: [] }) : { messages: [] };
    this.streamingState = {
      activeStreams: {},
      isStreaming: false
    };
    this.embedDevMode = false;
    this.apeMode = false;
    this.commandPanelVisible = false;
    
    // 초기화 및 이벤트 리스너 등록
    this.initialize();
  }
  
  /**
   * UI 초기화
   */
  initialize() {
    logger.log('UI 초기화');
    
    // 메시지 렌더링
    this.renderMessages();
    
    // 입력창 높이 자동 조절
    this.setupAutoResizeTextarea();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 모델 선택기 이벤트 구독
    eventBus.subscribe('modelSelected', this.handleModelSelected.bind(this));
    
    // VS Code 메시지 이벤트 리스너
    window.addEventListener('message', this.handleVsCodeMessage.bind(this));
    
    // iframe 메시지 리스너 설정
    this.setupIframeListeners();
    
    // 오류 핸들러
    window.addEventListener('error', this.handleError.bind(this));
    
    // 명령어 패널 iframe이 있으면 ping 시도
    if (this.commandsPanel) {
      setTimeout(() => {
        try {
          this.pingCommandsIframe();
        } catch (error) {
          logger.warn('초기화 중 iframe ping 실패:', error);
        }
      }, 1500);
    }
    
    logger.log('UI 초기화 완료');
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
    }
    
    // 엔터 키 처리
    if (this.chatInput) {
      this.chatInput.addEventListener('keydown', this.handleInputKeyDown.bind(this));
      this.chatInput.addEventListener('input', this.handleInputChange.bind(this));
    }
    
    // 지우기 버튼
    if (this.clearButton) {
      this.clearButton.addEventListener('click', this.handleClearMessages.bind(this));
    }
    
    // 심층 분석 모드 버튼
    if (this.embedDevButton) {
      this.embedDevButton.addEventListener('click', this.handleEmbedDevMode.bind(this));
    }
    
    // 명령어 버튼
    if (this.commandsButton) {
      this.commandsButton.addEventListener('click', this.handleCommandsPanel.bind(this));
    }
    
    // APE 토글 버튼
    if (this.apeToggleButton) {
      this.apeToggleButton.addEventListener('click', this.handleApeToggle.bind(this));
    }
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
      message: message,
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
    // 확인 메시지 표시
    const confirmed = confirm('모든 대화 내용을 지우시겠습니까?');
    if (!confirmed) return;
    
    // 메시지 상태 초기화
    this.messageState.messages = [];
    
    // 상태 저장
    if (this.vscode) {
      this.vscode.setState(this.messageState);
      
      // VS Code에 지우기 명령 전송
      this.vscode.postMessage({
        command: 'clearMessages'
      });
    }
    
    // UI 갱신
    this.renderMessages();
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
      case 'receiveMessage':
      case 'addMessage':
        this.addMessage('assistant', message.content, message.id);
        
        // 전송 버튼 다시 활성화
        if (this.sendButton) {
          this.sendButton.disabled = false;
        }
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
}

// UI 인스턴스 생성 및 전역 객체로 내보내기
window.apeUI = new ApeUI();

export default window.apeUI;