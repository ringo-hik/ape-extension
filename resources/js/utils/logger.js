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
    const timestamp = new Date().toISOString();
    const caller = this._getCallerInfo();
    console.log(`[${timestamp}][${this.prefix}][${caller}]:`, message, ...args);
  }

  error(message, ...args) {
    if (!this.isEnabled) return;
    const timestamp = new Date().toISOString();
    const caller = this._getCallerInfo();
    console.error(`[${timestamp}][${this.prefix} 오류][${caller}]:`, message, ...args);
  }

  warn(message, ...args) {
    if (!this.isEnabled) return;
    const timestamp = new Date().toISOString();
    const caller = this._getCallerInfo();
    console.warn(`[${timestamp}][${this.prefix} 경고][${caller}]:`, message, ...args);
  }

  info(message, ...args) {
    if (!this.isEnabled) return;
    const timestamp = new Date().toISOString();
    const caller = this._getCallerInfo();
    console.info(`[${timestamp}][${this.prefix} 정보][${caller}]:`, message, ...args);
  }
  
  debug(message, ...args) {
    if (!this.isEnabled) return;
    const timestamp = new Date().toISOString();
    const caller = this._getCallerInfo();
    console.debug(`[${timestamp}][${this.prefix} 디버그][${caller}]:`, message, ...args);
  }
  
  _getCallerInfo() {
    try {
      const err = new Error();
      const stack = err.stack || '';
      const stackLines = stack.split('\n');
      // 0: Error, 1: _getCallerInfo, 2: log/error/warn/info 메서드, 3: 실제 호출한 곳
      const callerLine = stackLines[3] || '';
      const match = callerLine.match(/at\s+(.*)\s+\(/);
      return match ? match[1] : 'unknown';
    } catch (e) {
      return 'unknown';
    }
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