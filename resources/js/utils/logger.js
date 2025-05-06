/**
 * APE 로거 유틸리티
 * 
 * 전역 로깅 시스템을 제공하며 개발 및 디버깅을 위한 일관된 인터페이스를 제공합니다.
 */

class Logger {
  constructor(prefix = 'APE') {
    this.prefix = prefix;
    this.isEnabled = true;
  }

  log(message, ...args) {
    if (!this.isEnabled) return;
    console.log(`[${this.prefix}]:`, message, ...args);
  }

  error(message, ...args) {
    if (!this.isEnabled) return;
    console.error(`[${this.prefix} 오류]:`, message, ...args);
  }

  warn(message, ...args) {
    if (!this.isEnabled) return;
    console.warn(`[${this.prefix} 경고]:`, message, ...args);
  }

  info(message, ...args) {
    if (!this.isEnabled) return;
    console.info(`[${this.prefix} 정보]:`, message, ...args);
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

// 전역 인스턴스 생성
window.logger = new Logger();

// 오류 처리 핸들러
window.addEventListener('error', event => {
  window.logger.error(`전역 오류: ${event.message} (${event.filename}:${event.lineno})`);
});

// 모듈로 내보내기
export default window.logger;