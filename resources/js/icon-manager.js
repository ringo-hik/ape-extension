/**
 * APE 아이콘 관리자
 * 
 * Phosphor Icons와 Codicons를 통합하여 관리하는 모듈
 */

(function() {
  // VS Code API
  const vscode = acquireVsCodeApi();
  
  // 아이콘 리소스 기본 경로 (웹뷰 리소스 경로 활용)
  // CDN 패스
  const PHOSPHOR_CDN_URL = 'https://unpkg.com/@phosphor-icons/web@2.0.3';
  // 로컬 패스 (상대 경로)
  const PHOSPHOR_LOCAL_URL = '${webviewResourceBaseUri}/fonts/phosphor';
  
  // 아이콘 스타일 종류
  const ICON_WEIGHTS = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'];
  
  /**
   * 아이콘 관리자 클래스
   */
  class IconManager {
    constructor() {
      this.loadedStyles = new Set();
      this.iconCache = new Map();
      this.defaultWeight = 'regular';
    }
    
    /**
     * 기본 아이콘 스타일 설정
     * @param {string} weight - 'thin', 'light', 'regular', 'bold', 'fill', 'duotone'
     */
    setDefaultWeight(weight) {
      if (ICON_WEIGHTS.includes(weight)) {
        this.defaultWeight = weight;
      }
    }
    
    /**
     * Phosphor 아이콘 스타일 로드
     * @param {string} weight - 아이콘 두께 스타일
     */
    async loadPhosphorStyle(weight = 'regular') {
      if (this.loadedStyles.has(`phosphor-${weight}`)) {
        return; // 이미 로드된 스타일이면 스킵
      }
      
      try {
        // 먼저 로컬 스타일 로드 시도
        try {
          await new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${PHOSPHOR_LOCAL_URL}/css/${weight}.css`;
            link.onload = () => {
              this.loadedStyles.add(`phosphor-${weight}`);
              resolve();
            };
            link.onerror = () => reject(new Error(`Failed to load local Phosphor ${weight} style`));
            document.head.appendChild(link);
          });
          
          console.log(`Phosphor ${weight} icons loaded successfully from local source`);
          return; // 로컬 로드 성공 시 종료
        } catch (localError) {
          console.warn(`Local Phosphor ${weight} style not available, falling back to CDN:`, localError.message);
        }
        
        // 로컬 로드 실패 시 CDN에서 로드 시도
        await new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `${PHOSPHOR_CDN_URL}/src/${weight}/style.css`;
          link.onload = () => {
            this.loadedStyles.add(`phosphor-${weight}`);
            resolve();
          };
          link.onerror = () => reject(new Error(`Failed to load CDN Phosphor ${weight} style`));
          document.head.appendChild(link);
        });
        
        console.log(`Phosphor ${weight} icons loaded successfully from CDN`);
      } catch (error) {
        console.error(`Error loading Phosphor ${weight} style:`, error);
        
        // 로드 실패 시 VS Code에 알림
        vscode.postMessage({
          command: 'iconLoadError',
          error: error.message
        });
      }
    }
    
    /**
     * 지정된 아이콘에 대한 HTML 요소 생성
     * @param {string} name - 아이콘 이름
     * @param {Object} options - 아이콘 옵션
     * @returns {HTMLElement} 아이콘 요소
     */
    createIcon(name, options = {}) {
      const {
        weight = this.defaultWeight,
        size = 'default',
        color = null,
        mirrored = false,
        source = 'auto'
      } = options;
      
      let iconElement;
      
      // 코디콘 우선, 없으면 Phosphor 아이콘 사용
      if (source === 'codicon' || (source === 'auto' && name.startsWith('codicon-'))) {
        // VS Code Codicon 아이콘
        const actualName = name.startsWith('codicon-') ? name.substring(9) : name;
        iconElement = document.createElement('i');
        iconElement.className = `codicon codicon-${actualName}`;
      } else if (source === 'phosphor' || source === 'auto') {
        // 필요한 스타일 로드
        if (!this.loadedStyles.has(`phosphor-${weight}`)) {
          this.loadPhosphorStyle(weight);
        }
        
        // Phosphor 아이콘
        iconElement = document.createElement('i');
        iconElement.className = `ph ph-${name}`;
        iconElement.dataset.weight = weight;
      } else {
        // 기본 폴백 아이콘
        iconElement = document.createElement('i');
        iconElement.className = 'codicon codicon-symbol-misc'; // 기본 폴백 아이콘
        iconElement.title = name; // 이름을 툴팁으로 표시
      }
      
      // 크기 클래스 적용
      if (size === 'small') {
        iconElement.classList.add('icon-small');
      } else if (size === 'large') {
        iconElement.classList.add('icon-large');
      } else if (typeof size === 'number') {
        iconElement.style.fontSize = `${size}px`;
      }
      
      // 색상 적용
      if (color) {
        iconElement.style.color = color;
      }
      
      // 반전 적용
      if (mirrored) {
        iconElement.style.transform = 'scaleX(-1)';
      }
      
      return iconElement;
    }
    
    /**
     * 아이콘 요소 일괄 생성
     * @param {Object} container - 부모 컨테이너 요소
     * @param {Array} icons - 아이콘 설정 배열
     */
    populateIcons(container, icons) {
      if (!container || !Array.isArray(icons)) return;
      
      // 컨테이너 초기화
      container.innerHTML = '';
      
      // 각 아이콘 생성 및 추가
      icons.forEach(iconConfig => {
        const { name, ...options } = iconConfig;
        const iconElement = this.createIcon(name, options);
        container.appendChild(iconElement);
      });
    }
    
    /**
     * 아이콘 모두 프리로드
     * @param {Array} weights - 로드할 두께 스타일 배열
     */
    preloadAllStyles(weights = ['regular', 'fill']) {
      weights.forEach(weight => {
        if (ICON_WEIGHTS.includes(weight)) {
          this.loadPhosphorStyle(weight);
        }
      });
    }
  }
  
  // 전역 인스턴스 생성 및 내보내기
  window.iconManager = new IconManager();
  
  // APE 확장 프로그램 준비 시 기본 스타일 로드
  document.addEventListener('DOMContentLoaded', () => {
    // 기본 스타일 로드
    window.iconManager.loadPhosphorStyle('regular');
  });
})();
