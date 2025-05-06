/**
 * 새 채팅 버튼 컴포넌트
 * 
 * 새로운 대화 세션을 시작하는 버튼 기능을 제공합니다.
 */

import logger from '../utils/logger.js';
import eventBus from '../utils/event-bus.js';
import { getElement, createElement, appendElement } from '../utils/dom-utils.js';

class NewChatButton {
  constructor() {
    logger.log('새 채팅 버튼 초기화 시작');
    
    // DOM 요소
    this.container = getElement('toolbar-left');
    this.button = null;
    
    // VS Code API
    try {
      this.vscode = acquireVsCodeApi();
    } catch (error) {
      logger.error('VS Code API 초기화 실패:', error);
      this.vscode = null;
    }
    
    // 버튼 생성 및 이벤트 등록
    this.initialize();
    
    // 이벤트 구독
    this.subscribeToEvents();
    
    logger.log('새 채팅 버튼 초기화 완료');
  }
  
  /**
   * 버튼 초기화
   */
  initialize() {
    // 컨테이너가 없으면 생성
    if (!this.container) {
      logger.warn('툴바 컨테이너를 찾을 수 없습니다. 새로 생성합니다.');
      
      // 툴바 컨테이너 추가
      const footerElement = document.querySelector('.ape-footer');
      if (footerElement) {
        this.container = createElement('div', {
          id: 'toolbar-left',
          className: 'ape-flex ape-gap-sm ape-mb-md'
        });
        
        footerElement.insertBefore(this.container, footerElement.firstChild);
      } else {
        logger.error('채팅 UI 푸터를 찾을 수 없습니다.');
        return;
      }
    }
    
    // 이미 버튼이 있으면 제거
    const existingButton = document.getElementById('newChatButton');
    if (existingButton) {
      existingButton.remove();
    }
    
    // 새 버튼 생성
    this.button = createElement('button', {
      id: 'newChatButton',
      className: 'ape-btn-toolbar',
      title: '새 대화 시작'
    });
    
    // 아이콘 추가
    const icon = createElement('i', { className: 'ph ph-plus-circle ape-icon' });
    appendElement(this.button, icon);
    
    // 텍스트 추가
    const text = document.createTextNode(' 새 채팅');
    appendElement(this.button, text);
    
    // 버튼을 컨테이너 맨 앞에 추가
    if (this.container.firstChild) {
      this.container.insertBefore(this.button, this.container.firstChild);
    } else {
      appendElement(this.container, this.button);
    }
    
    // 클릭 이벤트 등록
    this.button.addEventListener('click', this.handleNewChat.bind(this));
  }
  
  /**
   * 새 채팅 이벤트 처리
   */
  handleNewChat() {
    logger.log('새 채팅 버튼 클릭됨');
    
    // 저장 확인 대화상자 표시
    const hasPreviousMessages = window.apeUI && 
                               window.apeUI.messageState && 
                               window.apeUI.messageState.messages && 
                               window.apeUI.messageState.messages.length > 0;
    
    if (hasPreviousMessages) {
      const confirmed = window.confirm(
        '현재 대화를 저장하고 새 대화를 시작하시겠습니까?\n\n' +
        '저장하지 않으면 현재 대화는 히스토리에 기록되지 않습니다.'
      );
      
      if (confirmed) {
        // VS Code에 저장 후 새 채팅 시작 명령 전송
        if (this.vscode) {
          this.vscode.postMessage({
            command: 'saveAndNewChat'
          });
          
          // 이벤트 발행
          eventBus.publish('newChatRequested', { saveFirst: true });
        }
      } else {
        // 저장 없이 새 채팅 시작
        if (this.vscode) {
          this.vscode.postMessage({
            command: 'newChat',
            skipSave: true
          });
          
          // 이벤트 발행
          eventBus.publish('newChatRequested', { saveFirst: false });
        }
        
        // UI 메시지 초기화 (VS Code 응답 기다리지 않고 즉시 UI 갱신)
        if (window.apeUI) {
          window.apeUI.messageState.messages = [];
          window.apeUI.renderMessages();
          
          // 전송 버튼 상태 업데이트
          if (window.apeUI.sendButton) {
            window.apeUI.sendButton.disabled = !window.apeUI.chatInput || 
                                          !window.apeUI.chatInput.value.trim();
          }
          
          // 임시 메시지 표시
          window.apeUI.showTemporaryMessage('새 대화가 시작되었습니다.');
        }
      }
    } else {
      // 기존 대화가 없으면 바로 새 채팅 시작
      if (this.vscode) {
        this.vscode.postMessage({
          command: 'newChat',
          skipSave: true
        });
      }
      
      // 이벤트 발행
      eventBus.publish('newChatRequested', { saveFirst: false });
      
      // 임시 메시지 표시 (현재 비어있어도)
      if (window.apeUI) {
        window.apeUI.showTemporaryMessage('새 대화가 시작되었습니다.');
      }
    }
  }
  
  /**
   * 이벤트 구독
   */
  subscribeToEvents() {
    // VS Code 응답 처리는 ape-ui.js에서 이미 하고 있기 때문에 여기서는 필요 없음
    // 다른 컴포넌트에서 발행하는 이벤트 구독 시 여기에 추가
  }
}

// 인스턴스 생성 및 전역 객체로 내보내기
window.newChatButton = new NewChatButton();

export default window.newChatButton;