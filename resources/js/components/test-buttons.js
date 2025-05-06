/**
 * 테스트 버튼 컴포넌트
 * 
 * APE 익스텐션의 기능 테스트를 위한 간단한 버튼 인터페이스
 */

import logger from '../utils/logger.js';
import { createElement, appendElement } from '../utils/dom-utils.js';

class TestButtons {
  constructor() {
    this.vscode = null;
    this.container = document.querySelector('.buttons-grid');
    
    try {
      // VS Code API 초기화 시도
      this.vscode = acquireVsCodeApi();
      logger.log('VS Code API 초기화 성공');
    } catch (error) {
      logger.error('VS Code API 초기화 실패:', error);
    }
    
    this.setupEventListeners();
  }
  
  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 버튼 클릭 이벤트 위임
    if (this.container) {
      this.container.addEventListener('click', (event) => {
        const commandButton = event.target.closest('.command-button');
        if (commandButton) {
          const commandId = commandButton.dataset.commandId;
          if (commandId) {
            this.executeCommand(commandId, commandButton);
          }
        }
      });
      
      logger.log('버튼 이벤트 리스너 설정됨');
    } else {
      logger.error('버튼 컨테이너를 찾을 수 없음');
    }
  }
  
  /**
   * 명령어 실행
   */
  executeCommand(commandId, buttonElement) {
    logger.log(`명령어 실행: ${commandId}`);
    
    // 버튼에 실행 중 표시
    buttonElement.classList.add('executing');
    
    // VS Code API로 명령어 전송
    if (this.vscode) {
      try {
        this.vscode.postMessage({
          command: 'executeCommand',
          commandId: commandId
        });
        
        logger.log(`VS Code API를 통해 명령어 전송됨: ${commandId}`);
        
        // 성공 시뮬레이션 (VS Code가 응답하지 않으므로 임시 처리)
        setTimeout(() => {
          buttonElement.classList.remove('executing');
          buttonElement.classList.add('success');
          
          // 성공 표시 제거 (2초 후)
          setTimeout(() => {
            buttonElement.classList.remove('success');
          }, 2000);
        }, 1000);
      } catch (error) {
        logger.error('VS Code 실행 메시지 전송 실패:', error);
        this.showExecutionError(buttonElement, error.message);
      }
    } else {
      // 오프라인 모드에서 실행 시뮬레이션
      setTimeout(() => {
        buttonElement.classList.remove('executing');
        this.simulateExecution(commandId, buttonElement);
      }, 800);
    }
  }
  
  /**
   * 오프라인 모드에서 명령어 실행 시뮬레이션
   */
  simulateExecution(commandId, buttonElement) {
    switch (commandId) {
      case 'api.test':
        this.showSuccessToast('API 연결 테스트 성공');
        this.showSuccess(buttonElement);
        break;
        
      case 'api.models':
        this.showSuccessToast('사용 가능한 모델: claude-3-haiku, claude-3-sonnet, claude-3-opus');
        this.showSuccess(buttonElement);
        break;
        
      case 'api.stream':
        this.showSuccessToast('스트리밍 응답 테스트 성공');
        this.showSuccess(buttonElement);
        break;
        
      case 'mode.toggle':
        this.showSuccessToast('APE 모드 변경됨');
        this.showSuccess(buttonElement);
        break;
        
      case 'mode.dev':
        this.showSuccessToast('심층 분석 모드 변경됨');
        this.showSuccess(buttonElement);
        break;
        
      case 'chat.clear':
        this.showSuccessToast('채팅 내용이 지워졌습니다');
        this.showSuccess(buttonElement);
        break;
        
      case 'chat.save':
        this.showSuccessToast('채팅 내용이 저장되었습니다');
        this.showSuccess(buttonElement);
        break;
        
      case 'chat.history':
        this.showSuccessToast('채팅 히스토리 로드됨');
        this.showSuccess(buttonElement);
        break;
        
      default:
        // Git, Jira, SWDP, Pocket 명령어는 VS Code API 필요
        this.showExecutionError(buttonElement, 'VS Code API 연결이 필요합니다');
        break;
    }
  }
  
  /**
   * 성공 상태 표시
   */
  showSuccess(buttonElement) {
    buttonElement.classList.add('success');
    
    // 성공 표시 제거 (2초 후)
    setTimeout(() => {
      buttonElement.classList.remove('success');
    }, 2000);
  }
  
  /**
   * 실행 오류 표시
   */
  showExecutionError(buttonElement, errorMessage) {
    buttonElement.classList.remove('executing');
    buttonElement.classList.add('error');
    
    // 오류 툴팁 표시
    const errorTooltip = createElement('div', {
      className: 'error-tooltip'
    }, errorMessage || '명령어 실행 실패');
    
    appendElement(buttonElement, errorTooltip);
    
    // 툴팁 및 오류 표시 제거 (3초 후)
    setTimeout(() => {
      errorTooltip.remove();
      buttonElement.classList.remove('error');
    }, 3000);
  }
  
  /**
   * 토스트 메시지 표시
   */
  showSuccessToast(message) {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.command-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // 새 토스트 생성
    const toast = createElement('div', {
      className: 'command-toast success'
    });
    
    const iconElement = createElement('div', {
      className: 'command-toast-icon'
    }, '<i class="ph ph-check-circle"></i>');
    
    const messageElement = createElement('div', {
      className: 'command-toast-message'
    }, message);
    
    appendElement(toast, iconElement);
    appendElement(toast, messageElement);
    appendElement(document.body, toast);
    
    // 토스트 표시
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // 토스트 제거 (3초 후)
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
}

// 모듈이 로드될 때 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
  window.testButtons = new TestButtons();
  console.log('테스트 버튼 컴포넌트 초기화됨');
});

export default TestButtons;