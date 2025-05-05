/**
 * VSCode 테마 관리자 (Theme Manager)
 * VS Code의 테마 변경을 감지하고 동적으로 UI 스타일을 적용합니다.
 */

class ThemeManager {
  constructor() {
    // 테마 속성 캐시
    this.themeProperties = {};
    
    // 테마 변경 콜백 목록
    this.themeChangeCallbacks = [];
    
    // VS Code API
    this.vscode = acquireVsCodeApi();
    
    // 초기화
    this.initialize();
  }
  
  /**
   * 테마 관리자 초기화
   */
  initialize() {
    // VSCode 테마 변수 추출
    this.extractVSCodeThemeVariables();
    
    // 테마 변경 감지 이벤트 설정
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'themeChanged') {
        this.handleThemeChange(message.theme);
      }
    });
    
    // 테마 정보 요청
    this.requestThemeInfo();
    
    console.log('테마 관리자가 초기화되었습니다.');
  }
  
  /**
   * VS Code 웹뷰에서 테마 변수 추출
   */
  extractVSCodeThemeVariables() {
    const computedStyle = getComputedStyle(document.documentElement);
    const themeVariables = {};
    
    // VS Code 테마 변수 추출
    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i];
      
      // VS Code 테마 변수만 필터링
      if (property.startsWith('--vscode-')) {
        const value = computedStyle.getPropertyValue(property).trim();
        themeVariables[property] = value;
      }
    }
    
    this.themeProperties = themeVariables;
    return themeVariables;
  }
  
  /**
   * VS Code에 테마 정보 요청
   */
  requestThemeInfo() {
    this.vscode.postMessage({
      command: 'getThemeInfo'
    });
  }
  
  /**
   * 테마 변경 처리
   */
  handleThemeChange(themeInfo) {
    // 테마 정보 업데이트
    if (themeInfo) {
      this.currentTheme = themeInfo;
      
      // 테마 변수 다시 추출
      this.extractVSCodeThemeVariables();
      
      // 등록된 콜백 실행
      this.notifyThemeChangeListeners();
      
      // 테마 변경 로그
      console.log(`테마가 변경되었습니다: ${themeInfo.name} (${themeInfo.type})`);
    }
  }
  
  /**
   * 테마 변수 값 조회
   * @param {string} varName - 변수 이름 (--vscode- 접두사 포함)
   * @param {string} fallback - 폴백 값
   * @returns {string} 변수 값 또는 폴백 값
   */
  getThemeVariable(varName, fallback = '') {
    return this.themeProperties[varName] || fallback;
  }
  
  /**
   * 테마 타입 확인 (dark/light)
   * @returns {string} 'dark' 또는 'light'
   */
  getThemeType() {
    if (this.currentTheme && this.currentTheme.type) {
      return this.currentTheme.type;
    }
    
    // 테마 정보가 없는 경우 배경색으로 유추
    const editorBg = this.getThemeVariable('--vscode-editor-background', '#1e1e1e');
    
    // RGB로 변환하여 밝기 계산
    const hexToRgb = hex => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const formattedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
      
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };
    
    const rgb = hexToRgb(editorBg);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    
    return brightness >= 128 ? 'light' : 'dark';
  }
  
  /**
   * 테마 변경 리스너 등록
   * @param {Function} callback - 테마 변경 시 호출할 콜백 함수
   */
  onThemeChange(callback) {
    if (typeof callback === 'function') {
      this.themeChangeCallbacks.push(callback);
    }
  }
  
  /**
   * 테마 변경 리스너 제거
   * @param {Function} callback - 제거할 콜백 함수
   */
  removeThemeChangeListener(callback) {
    this.themeChangeCallbacks = this.themeChangeCallbacks.filter(cb => cb !== callback);
  }
  
  /**
   * 테마 변경 리스너에게 알림
   */
  notifyThemeChangeListeners() {
    const themeType = this.getThemeType();
    
    // 콜백 실행
    this.themeChangeCallbacks.forEach(callback => {
      try {
        callback(this.currentTheme, themeType, this.themeProperties);
      } catch (error) {
        console.error('테마 변경 리스너 실행 중 오류:', error);
      }
    });
    
    // body에 테마 타입 클래스 추가
    document.body.classList.remove('ape-theme-dark', 'ape-theme-light');
    document.body.classList.add(`ape-theme-${themeType}`);
  }
  
  /**
   * 테마 대비색 계산 (텍스트 색상 자동 선택)
   * @param {string} bgColor - 배경색 (HEX)
   * @returns {string} 적절한 텍스트 색상 (white 또는 black)
   */
  getContrastColor(bgColor) {
    // HEX를 RGB로 변환
    const hexToRgb = hex => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const formattedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
      
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };
    
    // 밝기 계산 (WCAG 기준)
    const rgb = hexToRgb(bgColor);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    
    return brightness >= 128 ? '#000000' : '#ffffff';
  }
  
  /**
   * CSS 변수를 동적으로 설정
   * @param {string} name - CSS 변수 이름 (--로 시작)
   * @param {string} value - CSS 변수 값
   */
  setCssVariable(name, value) {
    document.documentElement.style.setProperty(name, value);
  }
  
  /**
   * 플러그인 전용 스타일 적용
   * @param {string} pluginName - 플러그인 이름 (git, jira, swdp 등)
   * @param {string} color - 플러그인 대표 색상
   */
  setPluginTheme(pluginName, color) {
    this.setCssVariable(`--ape-${pluginName}`, color);
    
    // 대비색 계산 및 적용
    const textColor = this.getContrastColor(color);
    this.setCssVariable(`--ape-${pluginName}-text`, textColor);
    
    // 밝은/어두운 변형 색상 생성
    this.setCssVariable(`--ape-${pluginName}-light`, this.lightenColor(color, 20));
    this.setCssVariable(`--ape-${pluginName}-dark`, this.darkenColor(color, 20));
  }
  
  /**
   * 색상 밝게 변경
   * @param {string} color - HEX 색상
   * @param {number} percent - 밝기 증가 퍼센트
   * @returns {string} 변형된 HEX 색상
   */
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (
      0x1000000 + 
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + 
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 + 
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }
  
  /**
   * 색상 어둡게 변경
   * @param {string} color - HEX 색상
   * @param {number} percent - 어둡기 증가 퍼센트
   * @returns {string} 변형된 HEX 색상
   */
  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    
    return '#' + (
      0x1000000 + 
      (R > 0 ? (R < 255 ? R : 255) : 0) * 0x10000 + 
      (G > 0 ? (G < 255 ? G : 255) : 0) * 0x100 + 
      (B > 0 ? (B < 255 ? B : 255) : 0)
    ).toString(16).slice(1);
  }
  
  /**
   * 코드 블록 테마 적용
   * @param {Object} options - 코드 블록 테마 옵션
   */
  applyCodeBlockTheme(options = {}) {
    const defaults = {
      background: this.getThemeVariable('--vscode-editor-background', '#1e1e1e'),
      foreground: this.getThemeVariable('--vscode-editor-foreground', '#d4d4d4'),
      keyword: this.getThemeVariable('--ape-syntax-keyword', '#569cd6'),
      string: this.getThemeVariable('--ape-syntax-string', '#ce9178'),
      number: this.getThemeVariable('--ape-syntax-number', '#b5cea8'),
      comment: this.getThemeVariable('--ape-syntax-comment', '#6a9955'),
      class: this.getThemeVariable('--ape-syntax-class', '#4ec9b0'),
      function: this.getThemeVariable('--ape-syntax-function', '#dcdcaa'),
      variable: this.getThemeVariable('--ape-syntax-variable', '#9cdcfe')
    };
    
    const theme = { ...defaults, ...options };
    
    // 코드 블록 테마 색상 설정
    Object.entries(theme).forEach(([key, value]) => {
      this.setCssVariable(`--ape-code-${key}`, value);
    });
    
    // 코드 블록 테마 변경 이벤트 발생
    document.dispatchEvent(new CustomEvent('ape-code-theme-changed', { detail: theme }));
  }
}

// 전역 인스턴스 생성
const themeManager = new ThemeManager();

// 전역에 노출
window.apeThemeManager = themeManager;

// 문서 및 CSS 로드 상태 확인
function checkDocumentLoaded() {
  console.log('ThemeManager: DOM 및 리소스 로드 상태 확인...');
  
  // 스타일시트 로드 확인
  const styleSheetsLoaded = Array.from(document.styleSheets).some(sheet => {
    try {
      return sheet.href && sheet.href.includes('theme-vars.css');
    } catch(e) {
      return false;
    }
  });
  
  console.log(`ThemeManager: 스타일시트 로드 ${styleSheetsLoaded ? '완료' : '미완료'}`);
  
  // 문서 로드 상태 확인
  const isDocumentReady = document.readyState === 'complete' || document.readyState === 'interactive';
  console.log(`ThemeManager: 문서 로드 상태 ${isDocumentReady ? '완료' : '미완료'} (${document.readyState})`);
  
  return styleSheetsLoaded && isDocumentReady;
}

// 초기화 함수
function initializeThemeManager() {
  console.log('ThemeManager: 초기화 시작...');
  
  // 테마 타입에 따라 body 클래스 추가
  const themeType = themeManager.getThemeType();
  document.body.classList.add(`ape-theme-${themeType}`);
  console.log(`ThemeManager: 테마 타입 설정 - ${themeType}`);
  
  // 플러그인 테마 설정
  themeManager.setPluginTheme('git', '#F14E32');
  themeManager.setPluginTheme('jira', '#0052CC');
  themeManager.setPluginTheme('swdp', '#6554C0');
  
  // 코드 블록 테마 적용
  themeManager.applyCodeBlockTheme();
  
  console.log('ThemeManager: 초기화가 완료되었습니다.');
}

// DOM 로드 이벤트 및 폴백 타이머 설정
document.addEventListener('DOMContentLoaded', () => {
  console.log('ThemeManager: DOMContentLoaded 이벤트 발생');
  
  if (checkDocumentLoaded()) {
    initializeThemeManager();
  } else {
    console.log('ThemeManager: 리소스가 아직 로드되지 않았습니다. 지연 초기화 예약...');
    // DOM이 로드되었지만 스타일시트가 아직 로드되지 않은 경우
    setTimeout(() => {
      console.log('ThemeManager: 지연 초기화 시도...');
      initializeThemeManager();
    }, 500);
  }
});

// 폴백 초기화 - DOM 이벤트를 놓친 경우를 대비
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('ThemeManager: 문서가 이미 로드되었습니다. 즉시 초기화 시작...');
  setTimeout(() => {
    if (!window.themeManagerInitialized) {
      console.log('ThemeManager: 폴백 초기화 실행...');
      initializeThemeManager();
      window.themeManagerInitialized = true;
    }
  }, 100);
}

// 기본 초기화 보장
setTimeout(() => {
  if (!window.themeManagerInitialized) {
    console.log('ThemeManager: 타임아웃 후 안전 초기화 수행...');
    initializeThemeManager();
    window.themeManagerInitialized = true;
  }
}, 2000);