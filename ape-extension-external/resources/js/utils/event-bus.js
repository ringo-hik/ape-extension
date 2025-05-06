/**
 * 이벤트 버스
 * 
 * 컴포넌트 간 통신을 위한 이벤트 버스 구현
 * 컴포넌트 결합도를 낮추기 위해 발행-구독 패턴 적용
 */

import logger from './logger.js';

class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * 이벤트 구독
   */
  subscribe(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    
    // 중복 구독 방지
    if (!this.events[eventName].includes(callback)) {
      this.events[eventName].push(callback);
      logger.log(`이벤트 구독: ${eventName}`);
    }
    
    // 구독 취소 함수 반환
    return () => {
      this.unsubscribe(eventName, callback);
    };
  }

  /**
   * 이벤트 구독 취소
   */
  unsubscribe(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
      logger.log(`이벤트 구독 취소: ${eventName}`);
      
      // 구독자가 없는 이벤트는 정리
      if (this.events[eventName].length === 0) {
        delete this.events[eventName];
      }
    }
  }

  /**
   * 이벤트 발행
   */
  publish(eventName, data) {
    if (this.events[eventName]) {
      logger.log(`이벤트 발행: ${eventName}`, data);
      this.events[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`이벤트 처리 중 오류 (${eventName}):`, error);
        }
      });
      return true;
    }
    return false;
  }

  /**
   * 모든 이벤트 구독 취소
   */
  clear() {
    this.events = {};
    logger.log('모든 이벤트 구독 취소됨');
  }
}

// 전역 인스턴스 생성
const eventBus = new EventBus();
window.eventBus = eventBus;

export default eventBus;