/**
 * 저장 버튼 컴포넌트
 * 
 * 현재 대화를 저장하는 버튼 기능을 제공합니다.
 */

import logger from '../utils/logger.js';
import eventBus from '../utils/event-bus.js';
import { getElement } from '../utils/dom-utils.js';

class SaveButton {
  constructor() {
    logger.log('저장 버튼 초기화 시작');
    
    // DOM 요소
    this.button = getElement('saveButton');
    
    // VS Code API
    try {
      this.vscode = acquireVsCodeApi();
    } catch (error) {
      logger.error('VS Code API 초기화 실패:', error);
      this.vscode = null;
    }
    
    // 이벤트 등록
    this.initialize();
    
    // 이벤트 구독
    this.subscribeToEvents();
    
    logger.log('저장 버튼 초기화 완료');
  }
  
  /**
   * 버튼 초기화
   */
  initialize() {
    if (!this.button) {
      logger.warn('저장 버튼 요소를 찾을 수 없습니다.');
      return;
    }
    
    // 클릭 이벤트 등록
    this.button.addEventListener('click', this.handleSaveChat.bind(this));
    
    // 초기 상태 설정
    this.updateButtonState();
  }
  
  /**
   * 저장 이벤트 처리
   */
  handleSaveChat() {
    logger.log('저장 버튼 클릭됨');
    
    // 현재 메시지가 있는지 확인
    const hasPreviousMessages = window.apeUI && 
                               window.apeUI.messageState && 
                               window.apeUI.messageState.messages && 
                               window.apeUI.messageState.messages.length > 0;
    
    if (!hasPreviousMessages) {
      if (window.apeUI) {
        window.apeUI.showTemporaryMessage('저장할 대화 내용이 없습니다.', 2000);
      }
      return;
    }
    
    // 대화 제목 입력 요청
    const title = window.prompt('대화 제목을 입력하세요:', this.generateDefaultTitle());
    
    // 취소 버튼 클릭 시
    if (title === null) {
      return;
    }
    
    // VS Code에 저장 명령 전송
    if (this.vscode) {
      this.vscode.postMessage({
        command: 'saveChatSession',
        title: title.trim()
      });
      
      // 이벤트 발행
      eventBus.publish('chatSaved', { title: title.trim() });
      
      // 사용자에게 피드백 제공
      if (window.apeUI) {
        window.apeUI.showTemporaryMessage('대화가 저장되었습니다.', 2000);
      }
    }
  }
  
  /**
   * 기본 제목 생성
   */
  generateDefaultTitle() {
    if (!window.apeUI || !window.apeUI.messageState || !window.apeUI.messageState.messages) {
      return '새 대화';
    }
    
    // 첫 번째 사용자 메시지 찾기
    const firstUserMsg = window.apeUI.messageState.messages.find(msg => msg.role === 'user');
    
    if (firstUserMsg) {
      // 첫 메시지를 제목으로 사용 (너무 길면 잘라냄)
      const content = firstUserMsg.content;
      return content.length > 30 ? content.substring(0, 30) + '...' : content;
    }
    
    // 기본 제목
    return '대화 ' + new Date().toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * 버튼 상태 업데이트
   */
  updateButtonState() {
    if (!this.button) return;
    
    // 저장할 메시지가 있는지 확인
    const hasPreviousMessages = window.apeUI && 
                               window.apeUI.messageState && 
                               window.apeUI.messageState.messages && 
                               window.apeUI.messageState.messages.length > 0;
    
    // 버튼 활성/비활성 상태 업데이트
    this.button.disabled = !hasPreviousMessages;
    
    // 시각적 표시 업데이트
    if (hasPreviousMessages) {
      this.button.classList.remove('ape-btn-disabled');
    } else {
      this.button.classList.add('ape-btn-disabled');
    }
  }
  
  /**
   * 이벤트 구독
   */
  subscribeToEvents() {
    // 메시지 상태 변경 감지
    if (window.apeUI) {
      // MessageAdded 이벤트 직접 구독이 어려워 주기적으로 상태 확인
      setInterval(() => {
        this.updateButtonState();
      }, 1000);
    }
  }
}

// 인스턴스 생성 및 전역 객체로 내보내기
window.saveButton = new SaveButton();

export default window.saveButton;