/**
 * resize-handle.js - 리사이즈 핸들 컴포넌트
 * 
 * 채팅뷰와 트리뷰 사이의 크기 조절을 위한 리사이즈 핸들 컴포넌트
 * - 마우스 및 터치 이벤트 지원
 * - 로컬 스토리지를 통한 사용자 설정 유지
 * - 높이 제한 및 시각적 피드백 제공
 */

import logger from '../../utils/logger.js';
import eventBus from '../../utils/event-bus.js';
import { getElement, toggleClass } from '../../utils/dom-utils.js';

class ResizeHandle {
  constructor(options = {}) {
    // 기본 옵션과 사용자 옵션 병합
    this.options = {
      containerId: 'messages',        // 크기를 조절할 컨테이너 ID
      handleId: 'resizeHandle',       // 리사이즈 핸들 ID
      storageKey: 'ape-messages-height', // 로컬 스토리지 키
      minHeight: 100,                 // 최소 높이 (px)
      maxHeightRatio: 0.9,            // 최대 높이 (윈도우 높이 대비 비율)
      activeClass: 'ape-resizing',    // 크기 조절 중 추가할 클래스
      onResizeStart: null,            // 크기 조절 시작 콜백
      onResizeEnd: null,              // 크기 조절 종료 콜백
      ...options
    };

    // 요소 참조
    this.container = getElement(this.options.containerId);
    this.handle = getElement(this.options.handleId);
    
    // 상태 변수
    this.isDragging = false;
    this.startY = 0;
    this.startHeight = 0;
    
    // 초기화
    if (this.container && this.handle) {
      this.init();
      logger.log('리사이즈 핸들 컴포넌트 초기화 완료');
    } else {
      logger.error('리사이즈 핸들 컴포넌트 초기화 실패: 필요한 요소를 찾을 수 없음');
    }
  }
  
  /**
   * 초기화 및 이벤트 리스너 설정
   */
  init() {
    // 저장된 높이 복원
    this.restoreHeight();
    
    // 마우스 이벤트
    this.handle.addEventListener('mousedown', this.onDragStart.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    
    // 터치 이벤트 (모바일 지원)
    this.handle.addEventListener('touchstart', this.onTouchStart.bind(this));
    document.addEventListener('touchmove', this.onTouchMove.bind(this));
    document.addEventListener('touchend', this.onTouchEnd.bind(this));
    
    // 윈도우 크기 변경 감지
    window.addEventListener('resize', this.handleWindowResize.bind(this));
    
    // 시각적 피드백을 위한 스타일 추가
    this.addResizingStyles();
    
    // 이벤트 버스에 resize 이벤트 발행
    eventBus.subscribe('resize:complete', this.updateLayoutAfterResize.bind(this));
  }
  
  /**
   * 저장된 높이 복원
   */
  restoreHeight() {
    try {
      const savedHeight = localStorage.getItem(this.options.storageKey);
      if (savedHeight) {
        const parsedHeight = parseInt(savedHeight, 10);
        if (!isNaN(parsedHeight) && parsedHeight >= this.options.minHeight) {
          // 최대 높이 이내인 경우만 적용
          const maxHeight = window.innerHeight * this.options.maxHeightRatio;
          const heightToApply = Math.min(parsedHeight, maxHeight);
          
          this.container.style.height = `${heightToApply}px`;
          logger.log(`저장된 높이 복원: ${heightToApply}px`);
          
          // 레이아웃 업데이트 이벤트 발행
          eventBus.publish('resize:complete', { height: heightToApply });
        }
      }
    } catch (error) {
      logger.warn('저장된 높이 복원 실패:', error);
    }
  }
  
  /**
   * 마우스 드래그 시작 처리
   */
  onDragStart(event) {
    event.preventDefault();
    this.isDragging = true;
    this.startY = event.clientY;
    this.startHeight = this.container.offsetHeight;
    
    // 커서 스타일 변경
    document.body.style.cursor = 'row-resize';
    // 트랜지션 효과 제거 (부드러운 조절감 위해)
    this.container.style.transition = 'none';
    
    // 텍스트 선택 방지
    document.body.classList.add(this.options.activeClass);
    
    // VS Code에 리사이즈 시작 알림
    this.notifyResizeStart();
    
    logger.log(`리사이즈 시작: Y=${this.startY}, 시작 높이=${this.startHeight}px`);
  }
  
  /**
   * 터치 드래그 시작 처리
   */
  onTouchStart(event) {
    if (event.touches.length === 1) {
      event.preventDefault();
      this.isDragging = true;
      this.startY = event.touches[0].clientY;
      this.startHeight = this.container.offsetHeight;
      
      // 트랜지션 효과 제거
      this.container.style.transition = 'none';
      
      // 텍스트 선택 방지
      document.body.classList.add(this.options.activeClass);
      
      // VS Code에 리사이즈 시작 알림
      this.notifyResizeStart();
      
      logger.log(`터치 리사이즈 시작: Y=${this.startY}, 시작 높이=${this.startHeight}px`);
    }
  }
  
  /**
   * 마우스 이동 처리
   */
  onMouseMove(event) {
    if (this.isDragging) {
      this.drag(event.clientY);
    }
  }
  
  /**
   * 터치 이동 처리
   */
  onTouchMove(event) {
    if (this.isDragging && event.touches.length === 1) {
      event.preventDefault();
      this.drag(event.touches[0].clientY);
    }
  }
  
  /**
   * 드래그 처리 (마우스/터치 공통)
   */
  drag(clientY) {
    if (!this.isDragging) return;
    
    const delta = this.startY - clientY;
    let newHeight = this.startHeight + delta;
    
    // 최소 높이 제한
    if (newHeight < this.options.minHeight) {
      newHeight = this.options.minHeight;
    }
    
    // 최대 높이 제한 (창 높이의 일정 비율)
    const maxHeight = window.innerHeight * this.options.maxHeightRatio;
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
    }
    
    // 새 높이 적용
    this.container.style.height = `${newHeight}px`;
    
    // 실시간 크기 조절 이벤트 발행
    eventBus.publish('resize:dragging', { height: newHeight });
  }
  
  /**
   * 드래그 종료 처리 (마우스)
   */
  onDragEnd() {
    if (!this.isDragging) return;
    
    this.finalizeDrag();
  }
  
  /**
   * 드래그 종료 처리 (터치)
   */
  onTouchEnd() {
    if (!this.isDragging) return;
    
    this.finalizeDrag();
  }
  
  /**
   * 드래그 종료 공통 처리
   */
  finalizeDrag() {
    this.isDragging = false;
    
    // 상태 복원
    document.body.style.cursor = '';
    this.container.style.transition = '';
    document.body.classList.remove(this.options.activeClass);
    
    // 현재 높이 저장
    this.saveHeight();
    
    // VS Code에 리사이즈 종료 알림
    this.notifyResizeEnd();
    
    // 리사이즈 완료 이벤트 발행
    const currentHeight = this.container.offsetHeight;
    eventBus.publish('resize:complete', { height: currentHeight });
    
    logger.log(`리사이즈 종료: 새 높이=${currentHeight}px`);
  }
  
  /**
   * 높이 저장
   */
  saveHeight() {
    try {
      const currentHeight = this.container.offsetHeight;
      localStorage.setItem(this.options.storageKey, String(currentHeight));
      logger.log(`높이 저장됨: ${currentHeight}px`);
    } catch (error) {
      logger.warn('높이 저장 실패:', error);
    }
  }
  
  /**
   * 윈도우 크기 변경 처리
   */
  handleWindowResize() {
    // 윈도우 크기가 변경되면 컨테이너 최대 높이 확인
    const currentHeight = this.container.offsetHeight;
    const maxHeight = window.innerHeight * this.options.maxHeightRatio;
    
    // 현재 높이가 최대 높이를 초과하면 조정
    if (currentHeight > maxHeight) {
      this.container.style.height = `${maxHeight}px`;
      logger.log(`윈도우 크기 변경으로 높이 조정: ${maxHeight}px`);
      
      // 높이 저장
      this.saveHeight();
      
      // 리사이즈 완료 이벤트 발행
      eventBus.publish('resize:complete', { height: maxHeight });
    }
  }
  
  /**
   * VS Code에 리사이즈 시작 알림
   */
  notifyResizeStart() {
    try {
      const vscode = acquireVsCodeApi();
      vscode.postMessage({
        command: 'resizeStart'
      });
      logger.log('VS Code에 리사이즈 시작 알림 전송');
    } catch (error) {
      logger.warn('VS Code에 리사이즈 시작 알림 실패:', error);
    }
  }
  
  /**
   * VS Code에 리사이즈 종료 알림
   */
  notifyResizeEnd() {
    try {
      const vscode = acquireVsCodeApi();
      vscode.postMessage({
        command: 'resizeEnd',
        height: this.container.offsetHeight
      });
      logger.log('VS Code에 리사이즈 종료 알림 전송');
    } catch (error) {
      logger.warn('VS Code에 리사이즈 종료 알림 실패:', error);
    }
  }
  
  /**
   * 레이아웃 업데이트 처리
   */
  updateLayoutAfterResize(data) {
    // 레이아웃 업데이트 처리 (필요시 구현)
    // 예: 스크롤 위치 조정, 컨텐츠 재배치 등
    
    // 높이 변경 후 스크롤 위치 조정
    if (window.apeUI && typeof window.apeUI.scrollToBottom === 'function') {
      window.apeUI.scrollToBottom();
    }
  }
  
  /**
   * 리사이징 스타일 추가
   */
  addResizingStyles() {
    // 이미 추가된 스타일이 있는지 확인
    if (document.getElementById('ape-resize-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'ape-resize-styles';
    style.textContent = `
      .${this.options.activeClass} {
        user-select: none;
        -webkit-user-select: none;
        cursor: row-resize !important;
      }
      
      .${this.options.activeClass} .ape-resize-handle {
        background-color: var(--ape-active-background, #0078d4);
      }
      
      .${this.options.activeClass} .ape-resize-handle-line {
        opacity: 0.8;
      }
      
      /* 향상된 리사이즈 핸들 시각적 피드백 */
      .ape-resize-handle {
        position: relative;
        height: 10px;
        margin: 0;
        z-index: 100;
      }
      
      .ape-resize-handle:hover::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 4px;
        background-color: var(--ape-foreground, #ffffff);
        border-radius: 2px;
        opacity: 0.3;
        transition: opacity 0.2s, width 0.2s;
      }
      
      .ape-resize-handle:hover::before {
        opacity: 0.5;
        width: 50px;
      }
      
      .ape-resize-handle:active::before {
        opacity: 0.7;
        width: 60px;
      }
    `;
    
    document.head.appendChild(style);
    logger.log('리사이즈 스타일 추가됨');
  }
}

// 컴포넌트 초기화
document.addEventListener('DOMContentLoaded', () => {
  // DOM 로드 후 초기화
  window.resizeHandle = new ResizeHandle();
  logger.log('리사이즈 핸들 컴포넌트 DOM 로드 후 초기화');
});

export default ResizeHandle;