/**
 * APE UI - Consolidated JavaScript
 * 통합된 UI 자바스크립트 라이브러리
 */

/******************************************************************************
 * 테마 관리 시스템
 ******************************************************************************/
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

/******************************************************************************
 * 모델 선택 컴포넌트
 ******************************************************************************/
class ModelSelector {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`모델 선택기 컨테이너를 찾을 수 없습니다: ${containerId}`);
      return;
    }
    
    this.options = {
      onChange: () => {},
      models: [],
      defaultModelId: null,
      ...options
    };
    
    this.selectedModelId = this.options.defaultModelId;
    
    this.render();
    this.bindEvents();
  }
  
  /**
   * 컴포넌트 렌더링
   */
  render() {
    // 컨테이너 비우기
    this.container.innerHTML = '';
    
    // 기본 구조 생성
    this.container.innerHTML = `
      <div class="model-selector-header">
        <span class="model-selector-title">모델 선택</span>
        <span class="model-selector-icon">▼</span>
      </div>
      <div class="model-selector-dropdown"></div>
    `;
    
    // 참조 요소 가져오기
    this.header = this.container.querySelector('.model-selector-header');
    this.title = this.container.querySelector('.model-selector-title');
    this.icon = this.container.querySelector('.model-selector-icon');
    this.dropdown = this.container.querySelector('.model-selector-dropdown');
    
    // 모델 옵션 추가
    this.updateModels(this.options.models);
  }
  
  /**
   * 이벤트 바인딩
   */
  bindEvents() {
    // 헤더 클릭시 드롭다운 토글
    this.header.addEventListener('click', () => {
      this.toggleDropdown();
    });
    
    // 외부 클릭시 드롭다운 닫기
    document.addEventListener('click', (event) => {
      if (!this.container.contains(event.target)) {
        this.closeDropdown();
      }
    });
    
    // ESC 키 누르면 드롭다운 닫기
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isDropdownOpen()) {
        this.closeDropdown();
      }
    });
  }
  
  /**
   * 드롭다운 토글
   */
  toggleDropdown() {
    if (this.isDropdownOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }
  
  /**
   * 드롭다운 열기
   */
  openDropdown() {
    this.dropdown.classList.add('open');
    this.icon.classList.add('open');
  }
  
  /**
   * 드롭다운 닫기
   */
  closeDropdown() {
    this.dropdown.classList.remove('open');
    this.icon.classList.remove('open');
  }
  
  /**
   * 드롭다운 상태 확인
   */
  isDropdownOpen() {
    return this.dropdown.classList.contains('open');
  }
  
  /**
   * 모델 목록 업데이트
   */
  updateModels(models) {
    // 드롭다운 비우기
    this.dropdown.innerHTML = '';
    
    // 모델이 없는 경우
    if (!models || models.length === 0) {
      const emptyOption = document.createElement('div');
      emptyOption.className = 'model-option';
      emptyOption.textContent = '사용 가능한 모델이 없습니다';
      this.dropdown.appendChild(emptyOption);
      return;
    }
    
    // 모델 카테고리 분류
    const onPremModels = models.filter(model => model.name.includes('온프레미스'));
    const testModels = models.filter(model => model.name.includes('테스트용'));
    const localModels = models.filter(model => model.name.includes('로컬') || model.name.includes('오프라인'));
    const otherModels = models.filter(model => 
      !model.name.includes('온프레미스') && 
      !model.name.includes('테스트용') && 
      !model.name.includes('로컬') &&
      !model.name.includes('오프라인')
    );
    
    // 카테고리별 헤더 및 모델 추가 함수
    const addCategoryHeader = (title) => {
      const header = document.createElement('div');
      header.className = 'model-category-header';
      header.textContent = title;
      this.dropdown.appendChild(header);
    };
    
    const addModelOptions = (categoryModels) => {
      categoryModels.forEach(model => {
        const option = document.createElement('div');
        option.className = 'model-option';
        if (model.id === this.selectedModelId) {
          option.classList.add('selected');
        }
        option.textContent = model.name;
        option.dataset.id = model.id;
        
        // 옵션 클릭 이벤트
        option.addEventListener('click', () => {
          this.selectModel(model.id);
        });
        
        this.dropdown.appendChild(option);
      });
    };
    
    // 온프레미스 모델 (최우선 순위)
    if (onPremModels.length > 0) {
      addCategoryHeader('온프레미스 모델');
      addModelOptions(onPremModels);
    }
    
    // 테스트용 모델
    if (testModels.length > 0) {
      addCategoryHeader('테스트용 모델 (외부망)');
      addModelOptions(testModels);
    }
    
    // 로컬 모델
    if (localModels.length > 0) {
      addCategoryHeader('로컬/오프라인 모델');
      addModelOptions(localModels);
    }
    
    // 기타 모델
    if (otherModels.length > 0) {
      addCategoryHeader('기타 모델');
      addModelOptions(otherModels);
    }
    
    // 모델이 있지만 선택된 모델이 없는 경우 온프레미스 또는 첫 번째 모델 선택
    if (models.length > 0 && !this.selectedModelId) {
      // 온프레미스 모델 중 첫 번째 모델을 우선 선택
      if (onPremModels.length > 0) {
        this.selectModel(onPremModels[0].id);
      } else {
        this.selectModel(models[0].id);
      }
    } else {
      // 선택된 모델 표시 업데이트
      this.updateSelectedModelDisplay();
    }
  }
  
  /**
   * 모델 선택
   */
  selectModel(modelId) {
    // 이미 같은 모델이 선택된 경우
    if (this.selectedModelId === modelId) {
      this.closeDropdown();
      return;
    }
    
    // 새 모델 선택
    this.selectedModelId = modelId;
    
    // 선택된 옵션 표시 업데이트
    const options = this.dropdown.querySelectorAll('.model-option');
    options.forEach(option => {
      if (option.dataset.id === modelId) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });
    
    // 선택된 모델 표시 업데이트
    this.updateSelectedModelDisplay();
    
    // 드롭다운 닫기
    this.closeDropdown();
    
    // 변경 이벤트 발생
    this.options.onChange(modelId);
  }
  
  /**
   * 선택된 모델 표시 업데이트
   */
  updateSelectedModelDisplay() {
    if (!this.selectedModelId) {
      this.title.textContent = '모델 선택';
      return;
    }
    
    // 선택된 모델 찾기
    const selectedModel = this.options.models.find(model => model.id === this.selectedModelId);
    if (selectedModel) {
      this.title.textContent = selectedModel.name;
    } else {
      this.title.textContent = '모델 선택';
    }
  }
  
  /**
   * 현재 선택된 모델 ID 가져오기
   */
  getCurrentModelId() {
    return this.selectedModelId;
  }
  
  /**
   * 모델 ID로 선택하기
   */
  setModelById(modelId) {
    if (!modelId) return;
    
    // 존재하는 모델인지 확인
    const modelExists = this.options.models.some(model => model.id === modelId);
    if (modelExists) {
      this.selectModel(modelId);
    }
  }
}

/******************************************************************************
 * 코드 블록 프로세서
 ******************************************************************************/
class CodeBlockProcessor {
  constructor() {
    this.codeBlocks = new Map();
    this.blockCounter = 0;
    this.collapsedState = new Map(); // 코드 블록 접힘/펼침 상태 추적
    this.LANGUAGE_ALIASES = {
      // 언어 별칭 매핑
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'sh': 'bash',
      'c#': 'csharp',
      'c++': 'cpp'
    };
  }

  /**
   * Processes a message content to render code blocks with syntax highlighting
   * @param {string} content - The message content to process
   * @returns {string} HTML with processed code blocks
   */
  processContent(content) {
    if (!content) return '';
    
    // Clear previous blocks for this processing round
    this.blockCounter = 0;
    
    // Process markdown code blocks (```language\ncode\n```)
    const processedContent = content.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
      return this.createCodeBlockHtml(code, language);
    });
    
    // Process inline code blocks (`code`)
    return processedContent.replace(/`([^`]+)`/g, (match, code) => {
      return `<code class="inline-code">${this.escapeHtml(code)}</code>`;
    });
  }
  
  /**
   * Creates HTML for a code block with copy button
   * @param {string} code - The code content
   * @param {string} language - The programming language for syntax highlighting
   * @returns {string} HTML for the code block
   */
  createCodeBlockHtml(code, language) {
    const blockId = `code-block-${Date.now()}-${this.blockCounter++}`;
    const escapedCode = this.escapeHtml(code);
    
    // 언어 정규화 (별칭 처리 및 소문자 변환)
    const normalizedLanguage = this.normalizeLanguage(language);
    const languageClass = normalizedLanguage ? `language-${normalizedLanguage}` : '';
    
    // 라인 수 계산
    const lineCount = code.split('\n').length;
    const isLongCode = lineCount > 15; // 15줄 이상이면 긴 코드로 간주
    
    // 코드 블록 HTML 생성
    return `
      <div class="code-block-container" id="container-${blockId}">
        <div class="code-block-header">
          <div class="code-header-left">
            ${normalizedLanguage ? `<span class="code-language">${this.getLanguageDisplayName(normalizedLanguage)}</span>` : ''}
            ${isLongCode ? `<span class="code-line-count">(${lineCount} lines)</span>` : ''}
          </div>
          <div class="code-header-right">
            ${isLongCode ? 
              `<button class="code-toggle-button" data-block-id="${blockId}" title="Toggle code block">
                <span class="ape-icon codicon codicon-chevron-up"></span>
              </button>` : ''}
            <button class="copy-button" data-block-id="${blockId}" title="Copy code">
              <span class="ape-icon codicon codicon-clippy"></span>
              <span class="copy-text">복사</span>
            </button>
          </div>
        </div>
        <div class="code-block-content">
          <pre class="code-block ${languageClass}" id="${blockId}"><code>${escapedCode}</code></pre>
        </div>
      </div>
    `;
  }
  
  /**
   * 언어 이름을 정규화하고 별칭을 해결
   * @param {string} language - 원래 언어 식별자
   * @returns {string} 정규화된 언어 이름
   */
  normalizeLanguage(language) {
    if (!language) return '';
    
    const normalized = language.toLowerCase().trim();
    return this.LANGUAGE_ALIASES[normalized] || normalized;
  }
  
  /**
   * 언어 표시 이름 가져오기
   * @param {string} language - 정규화된 언어 이름
   * @returns {string} 표시용 언어 이름
   */
  getLanguageDisplayName(language) {
    const displayNames = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'csharp': 'C#',
      'cpp': 'C++',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'sql': 'SQL',
      'bash': 'Bash',
      'shell': 'Shell',
      'yaml': 'YAML',
      'xml': 'XML',
      'markdown': 'Markdown',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'php': 'PHP',
      'kotlin': 'Kotlin',
      'swift': 'Swift'
    };
    
    return displayNames[language] || language.toUpperCase();
  }
  
  /**
   * Escapes HTML special characters
   * @param {string} unsafe - The raw text to escape
   * @returns {string} HTML-escaped text
   */
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  /**
   * Initializes copy buttons functionality for a container
   * @param {HTMLElement} container - The container to process
   */
  initializeCopyButtons(container) {
    const copyButtons = container.querySelectorAll('.copy-button');
    
    copyButtons.forEach(button => {
      button.addEventListener('click', () => {
        const blockId = button.getAttribute('data-block-id');
        const codeBlock = document.getElementById(blockId);
        if (!codeBlock) return;
        
        const code = codeBlock.textContent;
        this.copyToClipboard(code, button);
      });
    });
    
    // 긴 코드 블록의 접기/펼치기 버튼 초기화
    const toggleButtons = container.querySelectorAll('.code-toggle-button');
    
    toggleButtons.forEach(button => {
      button.addEventListener('click', () => {
        const blockId = button.getAttribute('data-block-id');
        this.toggleCodeBlock(blockId, button);
      });
    });
  }
  
  /**
   * 코드 블록 접기/펼치기 토글
   * @param {string} blockId - 코드 블록 ID
   * @param {HTMLElement} button - 토글 버튼 요소
   */
  toggleCodeBlock(blockId, button) {
    const container = document.getElementById(`container-${blockId}`);
    const contentBlock = container.querySelector('.code-block-content');
    const icon = button.querySelector('.codicon');
    
    // 현재 상태 확인 (기본값은 펼쳐진 상태)
    const isCollapsed = this.collapsedState.get(blockId) || false;
    
    if (isCollapsed) {
      // 펼치기
      contentBlock.style.maxHeight = 'none';
      contentBlock.style.overflow = 'visible';
      icon.classList.remove('codicon-chevron-down');
      icon.classList.add('codicon-chevron-up');
      this.collapsedState.set(blockId, false);
    } else {
      // 접기
      contentBlock.style.maxHeight = '100px';
      contentBlock.style.overflow = 'hidden';
      icon.classList.remove('codicon-chevron-up');
      icon.classList.add('codicon-chevron-down');
      this.collapsedState.set(blockId, true);
    }
  }
  
  /**
   * Copies text to clipboard and updates button UI
   * @param {string} text - Text to copy
   * @param {HTMLElement} button - The button element to update
   */
  copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
      const copyText = button.querySelector('.copy-text');
      const originalText = copyText.textContent;
      const icon = button.querySelector('.ape-icon');
      
      // 아이콘 및 텍스트 업데이트
      copyText.textContent = '복사됨!';
      icon.classList.remove('codicon-clippy');
      icon.classList.add('codicon-check');
      button.classList.add('copied');
      
      // 2초 후 원래 상태로 복원
      setTimeout(() => {
        copyText.textContent = originalText;
        icon.classList.remove('codicon-check');
        icon.classList.add('codicon-clippy');
        button.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Could not copy text: ', err);
      
      // 오래된 브라우저를 위한 대체 복사 방법
      this.fallbackCopyToClipboard(text, button);
    });
  }
  
  /**
   * Fallback method for copying to clipboard
   * @param {string} text - Text to copy
   * @param {HTMLElement} button - The button element to update
   */
  fallbackCopyToClipboard(text, button) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      const copyText = button.querySelector('.copy-text');
      const icon = button.querySelector('.ape-icon');
      
      copyText.textContent = '복사됨!';
      icon.classList.remove('codicon-clippy');
      icon.classList.add('codicon-check');
      button.classList.add('copied');
      
      setTimeout(() => {
        copyText.textContent = '복사';
        icon.classList.remove('codicon-check');
        icon.classList.add('codicon-clippy');
        button.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Fallback copy failed: ', err);
    }
    
    document.body.removeChild(textarea);
  }
  
  /**
   * Applies syntax highlighting to code blocks in a container
   * @param {HTMLElement} container - Container with code blocks to highlight
   */
  applySyntaxHighlighting(container) {
    const codeBlocks = container.querySelectorAll('pre.code-block');
    
    codeBlocks.forEach(block => {
      // 언어 클래스를 기반으로 구문 강조 적용
      const languageClass = Array.from(block.classList)
        .find(cls => cls.startsWith('language-'));
      
      if (languageClass) {
        const language = languageClass.replace('language-', '');
        block.classList.add(`highlight-${language}`);
        
        // 언어별 구문 강조 적용
        this.applyBasicSyntaxHighlighting(block, language);
      }
    });
  }
  
  /**
   * 기본적인 구문 강조 적용
   * @param {HTMLElement} block - 코드 블록 요소
   * @param {string} language - 프로그래밍 언어
   */
  applyBasicSyntaxHighlighting(block, language) {
    // 여기에 간단한 구문 강조 구현
    // 실제 프로덕션에서는 highlight.js 같은 라이브러리를 사용하는 것이 좋음
    let code = block.innerHTML;
    
    // 주석 강조
    code = code.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, 
      '<span class="code-comment">$1</span>');
    
    // 문자열 강조
    code = code.replace(/(".*?"|'.*?'|`.*?`)/g, 
      '<span class="code-string">$1</span>');
    
    // 숫자 강조
    code = code.replace(/\b(\d+(\.\d+)?)\b/g, 
      '<span class="code-number">$1</span>');
    
    // 키워드 강조 (언어에 따라 다름)
    const keywords = this.getKeywordsForLanguage(language);
    if (keywords.length > 0) {
      const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
      code = code.replace(keywordPattern, 
        '<span class="code-keyword">$1</span>');
    }
    
    block.innerHTML = code;
  }
  
  /**
   * 언어별 키워드 목록 반환
   * @param {string} language - 프로그래밍 언어
   * @returns {Array} 키워드 목록
   */
  getKeywordsForLanguage(language) {
    const keywordMap = {
      'javascript': ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'new', 'class', 'export', 'import', 'from', 'async', 'await', 'try', 'catch'],
      'typescript': ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'new', 'class', 'export', 'import', 'from', 'async', 'await', 'try', 'catch', 'interface', 'type', 'enum'],
      'python': ['def', 'class', 'import', 'from', 'as', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'return', 'yield', 'pass', 'break', 'continue', 'lambda', 'None', 'True', 'False'],
      'java': ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 'void', 'abstract', 'native', 'new', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'throw', 'throws', 'try', 'catch'],
      'csharp': ['public', 'private', 'protected', 'class', 'interface', 'using', 'namespace', 'static', 'void', 'abstract', 'sealed', 'new', 'return', 'if', 'else', 'for', 'foreach', 'while', 'switch', 'case', 'break', 'continue', 'throw', 'try', 'catch'],
      'html': ['html', 'head', 'body', 'div', 'span', 'a', 'img', 'script', 'style', 'link', 'meta', 'title', 'h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'input', 'button'],
      'css': ['body', 'div', 'span', 'a', 'margin', 'padding', 'border', 'color', 'background', 'font-size', 'font-family', 'text-align', 'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom', '@media', '@keyframes', 'animation', 'transition'],
      'json': ['true', 'false', 'null'],
      'bash': ['if', 'then', 'else', 'elif', 'fi', 'case', 'esac', 'for', 'while', 'do', 'done', 'function', 'echo', 'export', 'source', 'alias']
    };
    
    return keywordMap[language] || [];
  }
}

/******************************************************************************
 * 명령어 버튼 유틸리티
 ******************************************************************************/

/**
 * 명령어 ID로부터 적절한 아이콘을 결정
 * @param {string} commandId 명령어 ID
 * @returns {string} 코디콘 아이콘 이름
 */
function getIconForCommand(commandId) {
  const COMMAND_ICONS = {
    'jira': 'issue-opened',
    'git': 'git-branch',
    'swdp': 'package',
    'build': 'terminal',
    'help': 'question',
    'settings': 'gear',
    'search': 'search',
    'chat': 'comment',
    'code': 'code',
    'model': 'hubot',
    'debug': 'bug',
    'clear': 'trash',
    'default': 'play'
  };

  if (!commandId) return COMMAND_ICONS.default;
  
  // 명령어 ID에서 주요 그룹 추출
  const parts = commandId.split(':');
  const mainGroup = parts[0];
  
  // 명령어 이름은 콜론 이후 부분
  const commandName = parts.length > 1 ? parts[1] : mainGroup;
  
  // 특정 명령어 패턴 매칭
  if (commandName.includes('issue')) return 'issue-opened';
  if (commandName.includes('pull') || commandName.includes('pr')) return 'git-pull-request';
  if (commandName.includes('commit')) return 'git-commit';
  if (commandName.includes('build')) return 'rocket';
  if (commandName.includes('deploy')) return 'cloud-upload';
  if (commandName.includes('test')) return 'beaker';
  if (commandName.includes('help')) return 'question';
  if (commandName.includes('settings')) return 'gear';
  
  // 명령어 이름에 따른 매핑
  if (COMMAND_ICONS[commandName]) {
    return COMMAND_ICONS[commandName];
  }
  
  // 주요 그룹 매칭
  return COMMAND_ICONS[mainGroup] || COMMAND_ICONS.default;
}

/**
 * 명령어 그룹에 따라 CSS 클래스를 생성
 * @param {string} commandId 명령어 ID
 * @returns {string} CSS 클래스 이름
 */
function getCommandGroupClass(commandId) {
  if (!commandId) return '';
  
  const parts = commandId.split(':');
  const mainGroup = parts[0];
  
  // @ 또는 / 접두사가 있는 경우 제거
  let groupName = mainGroup;
  if (groupName.startsWith('@')) {
    groupName = groupName.substring(1);
  } else if (groupName.startsWith('/')) {
    groupName = 'system';
  }
  
  return `command-group-${groupName}`;
}

/**
 * 명령어 버튼 생성 함수
 * @param {Object} command 명령어 객체
 * @returns {HTMLElement} 버튼 컨테이너
 */
function createCommandButton(command) {
  const buttonContainer = document.createElement('div');
  buttonContainer.className = `command-button ${getCommandGroupClass(command.id)}`;
  buttonContainer.title = command.description || '';
  
  const button = document.createElement('button');
  button.className = 'button-content';
  button.onclick = () => {
    vscode.postMessage({
      command: 'executeCommand',
      commandId: command.id
    });
  };
  
  // 아이콘 자동 결정 또는 명시적 아이콘 사용
  const iconName = command.iconName || getIconForCommand(command.id);
  const icon = document.createElement('i');
  icon.className = `codicon codicon-${iconName}`;
  button.appendChild(icon);
  
  // 레이블 추가
  const label = document.createElement('span');
  label.textContent = command.label || command.id.split(':').pop() || command.id;
  button.appendChild(label);
  
  buttonContainer.appendChild(button);
  return buttonContainer;
}

/**
 * 명령어 카테고리 토글
 * @param {string} sectionId 카테고리 섹션 ID 
 */
function toggleCommandSection(sectionId) {
  const container = document.getElementById(sectionId);
  const toggleIcon = document.querySelector(`#${sectionId}-toggle`);
  
  if (container.classList.contains('collapsed')) {
    container.classList.remove('collapsed');
    toggleIcon.classList.remove('collapsed');
  } else {
    container.classList.add('collapsed');
    toggleIcon.classList.add('collapsed');
  }
}

/******************************************************************************
 * 명령어 자동완성 클래스
 ******************************************************************************/
class CommandAutocomplete {
  /**
   * 생성자
   * @param {HTMLElement} inputElement 입력 요소 (textarea 또는 input)
   * @param {Object} options 옵션
   */
  constructor(inputElement, options = {}) {
    this.inputElement = inputElement;
    this.options = Object.assign({
      triggerCharacters: ['@', '/'], // 자동완성을 트리거하는 문자들
      minChars: 1,                   // 자동완성을 시작하기 위한 최소 문자 수
      maxSuggestions: 8,             // 표시할 최대 제안 수
      commandGroups: {               // 명령어 그룹별 색상 설정
        'git': '#0366d6',
        'jira': '#0052cc',
        'swdp': '#ff9900',
        'system': '#6f42c1'
      },
      onSelect: null                 // 명령어 선택 시 콜백
    }, options);

    // 명령어 목록
    this.commands = [];

    // 자동완성 UI 요소
    this.suggestionBox = null;
    this.activeIndex = -1;

    // 이벤트 리스너 바인딩
    this._bindEvents();

    // 자동완성 UI 초기화
    this._createSuggestionBox();
  }

  /**
   * 이벤트 리스너 설정
   */
  _bindEvents() {
    this.inputElement.addEventListener('input', this._onInput.bind(this));
    this.inputElement.addEventListener('keydown', this._onKeyDown.bind(this));
    document.addEventListener('click', this._onDocumentClick.bind(this));
  }

  /**
   * 입력 변경 이벤트 핸들러
   * @param {Event} e 입력 이벤트
   */
  _onInput(e) {
    const text = this.inputElement.value;
    const currentPosition = this.inputElement.selectionStart;
    const tokens = this._tokenizeInput(text, currentPosition);

    // 명령어와 현재 토큰의 내용을 확인
    const lastToken = tokens.current;
    
    // @ 또는 / 명령어 감지
    if (lastToken && this.options.triggerCharacters.includes(lastToken.charAt(0))) {
      const query = lastToken.substring(1); // @ 또는 / 접두사 제거
      
      // 자동완성 표시 결정
      if (query.length >= this.options.minChars || query.length === 0) {
        this._showSuggestions(query, lastToken, tokens.position);
        return;
      }
    }
    
    // 조건에 맞지 않으면 자동완성 숨기기
    this._hideSuggestions();
  }

  /**
   * 키 입력 이벤트 핸들러
   * @param {KeyboardEvent} e 키보드 이벤트
   */
  _onKeyDown(e) {
    // 자동완성이 표시된 상태에서만 처리
    if (!this.suggestionBox || this.suggestionBox.style.display === 'none') {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._moveSelection(1);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this._moveSelection(-1);
        break;
        
      case 'Tab':
      case 'Enter':
        if (this.activeIndex >= 0) {
          e.preventDefault();
          this._selectCurrentSuggestion();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        this._hideSuggestions();
        break;
    }
  }

  /**
   * 문서 클릭 이벤트 핸들러
   * @param {MouseEvent} e 마우스 이벤트
   */
  _onDocumentClick(e) {
    // 자동완성 UI 외부 클릭 시 숨기기
    if (this.suggestionBox && 
        !this.suggestionBox.contains(e.target) && 
        e.target !== this.inputElement) {
      this._hideSuggestions();
    }
  }

  /**
   * 입력 텍스트를 토큰화하여 현재 편집 중인 토큰 정보 추출
   * @param {string} text 입력 텍스트
   * @param {number} position 커서 위치
   * @returns {Object} 토큰 정보
   */
  _tokenizeInput(text, position) {
    // 공백으로 나누기 (단, 커서 위치 이전까지만)
    const textBeforeCursor = text.substring(0, position);
    const textAfterCursor = text.substring(position);
    
    // 커서 위치에서 시작해 왼쪽으로 검색하여 마지막 공백 찾기
    let startPos = textBeforeCursor.lastIndexOf(' ') + 1;
    
    // 공백이 없는 경우 텍스트의 시작부터
    if (startPos <= 0) startPos = 0;
    
    // 오른쪽으로 검색하여 다음 공백 찾기
    let endPos = textAfterCursor.indexOf(' ');
    
    // 공백이 없는 경우 텍스트의 끝까지
    if (endPos < 0) endPos = textAfterCursor.length;
    
    // 현재 편집 중인 토큰
    const currentToken = textBeforeCursor.substring(startPos) + textAfterCursor.substring(0, endPos);
    
    return {
      current: currentToken,
      position: {
        start: startPos,
        end: position + endPos
      }
    };
  }

  /**
   * 자동완성 제안 상자 생성
   */
  _createSuggestionBox() {
    this.suggestionBox = document.createElement('div');
    this.suggestionBox.className = 'command-suggestions';
    this.suggestionBox.style.display = 'none';
    document.body.appendChild(this.suggestionBox);
  }

  /**
   * 자동완성 제안 표시
   * @param {string} query 검색 쿼리
   * @param {string} fullToken 전체 토큰
   * @param {Object} position 토큰 위치 정보
   */
  _showSuggestions(query, fullToken, position) {
    // 명령어가 로드되지 않은 경우 요청
    if (this.commands.length === 0) {
      // vscode API를 통해 명령어 목록 요청
      if (window.vscode) {
        window.vscode.postMessage({
          command: 'getCommands'
        });
      }
      return;
    }

    // 접두사 확인 (@ 또는 /)
    const prefix = fullToken.charAt(0);

    // 접두사에 맞는 명령어만 필터링
    const prefixType = prefix === '@' ? 'at' : prefix === '/' ? 'slash' : null;
    
    if (!prefixType) {
      this._hideSuggestions();
      return;
    }

    // 이름으로 필터링 (쿼리가 없으면 모든 해당 타입 명령어 표시)
    const filteredCommands = this.commands
      .filter(cmd => cmd.type === prefixType)
      .filter(cmd => query.length === 0 || cmd.id.toLowerCase().includes(query.toLowerCase()));

    // 결과가 없으면 숨기기
    if (filteredCommands.length === 0) {
      this._hideSuggestions();
      return;
    }

    // 결과 수 제한
    const limitedCommands = filteredCommands.slice(0, this.options.maxSuggestions);

    // 제안 상자 내용 생성
    this.suggestionBox.innerHTML = '';
    
    // 제목 추가
    const titleElem = document.createElement('div');
    titleElem.className = 'suggestion-title';
    titleElem.textContent = prefix === '@' ? '외부 명령어' : '내부 명령어';
    this.suggestionBox.appendChild(titleElem);

    // 명령어 목록 추가
    limitedCommands.forEach((cmd, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.dataset.index = index;
      item.dataset.value = cmd.id;
      
      // 명령어 그룹에 따른 색상 적용
      const commandGroup = cmd.id.split(':')[0].replace(/^[@/]/, '');
      const groupColor = this.options.commandGroups[commandGroup] || '#666';
      
      // 아이콘 생성 (이 부분은 getIconForCommand 함수 호출)
      const iconName = window.getIconForCommand ? 
                     window.getIconForCommand(cmd.id) : 
                     'play';
                     
      // HTML 생성
      item.innerHTML = `
        <i class="codicon codicon-${iconName}" style="color: ${groupColor};"></i>
        <span class="suggestion-label">${cmd.label || cmd.id}</span>
        <span class="suggestion-description">${cmd.description || ''}</span>
      `;
      
      // 클릭 이벤트 리스너
      item.addEventListener('click', () => {
        this.activeIndex = index;
        this._selectCurrentSuggestion();
      });
      
      // 마우스 오버 이벤트
      item.addEventListener('mouseover', () => {
        this._setActiveItem(index);
      });
      
      this.suggestionBox.appendChild(item);
    });

    // 입력 요소 위치 계산
    const inputRect = this.inputElement.getBoundingClientRect();
    
    // 입력 영역 내 커서 위치에 따른 가로 위치 조정
    const inputStyle = window.getComputedStyle(this.inputElement);
    const lineHeight = parseInt(inputStyle.lineHeight) || parseInt(inputStyle.height) || 20;
    
    // 제안 상자 위치 설정
    this.suggestionBox.style.position = 'absolute';
    this.suggestionBox.style.width = '320px';
    this.suggestionBox.style.maxHeight = '250px';
    this.suggestionBox.style.overflowY = 'auto';
    this.suggestionBox.style.left = `${inputRect.left}px`;
    this.suggestionBox.style.top = `${inputRect.top - lineHeight}px`;
    this.suggestionBox.style.display = 'block';
    
    // 활성 항목 초기화
    this.activeIndex = 0;
    this._setActiveItem(0);
  }

  /**
   * 자동완성 제안 숨기기
   */
  _hideSuggestions() {
    if (this.suggestionBox) {
      this.suggestionBox.style.display = 'none';
      this.activeIndex = -1;
    }
  }

  /**
   * 활성 항목 설정
   * @param {number} index 활성화할 항목 인덱스
   */
  _setActiveItem(index) {
    // 이전 활성 항목에서 클래스 제거
    const prevActive = this.suggestionBox.querySelector('.suggestion-item.active');
    if (prevActive) {
      prevActive.classList.remove('active');
    }
    
    // 새 활성 항목에 클래스 추가
    const activeItem = this.suggestionBox.querySelector(`.suggestion-item[data-index="${index}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
      
      // 뷰포트 내에 보이도록 스크롤
      if (activeItem.offsetTop < this.suggestionBox.scrollTop) {
        this.suggestionBox.scrollTop = activeItem.offsetTop;
      } else if (activeItem.offsetTop + activeItem.offsetHeight > this.suggestionBox.scrollTop + this.suggestionBox.clientHeight) {
        this.suggestionBox.scrollTop = activeItem.offsetTop + activeItem.offsetHeight - this.suggestionBox.clientHeight;
      }
    }
    
    this.activeIndex = index;
  }

  /**
   * 선택 이동
   * @param {number} step 이동 단계 (1: 아래, -1: 위)
   */
  _moveSelection(step) {
    const items = this.suggestionBox.querySelectorAll('.suggestion-item');
    let newIndex = this.activeIndex + step;
    
    // 범위 내 제한
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;
    
    this._setActiveItem(newIndex);
  }

  /**
   * 현재 선택된 제안 선택
   */
  _selectCurrentSuggestion() {
    const activeItem = this.suggestionBox.querySelector('.suggestion-item.active');
    if (!activeItem) return;
    
    const commandId = activeItem.dataset.value;
    
    // 입력 필드 업데이트
    const text = this.inputElement.value;
    const currentPosition = this.inputElement.selectionStart;
    const tokens = this._tokenizeInput(text, currentPosition);
    
    // 새 텍스트 생성
    const newText = text.substring(0, tokens.position.start) + 
                  commandId + 
                  text.substring(tokens.position.end);
    
    // 입력 필드 업데이트
    this.inputElement.value = newText;
    
    // 커서 위치 설정
    const newCursorPos = tokens.position.start + commandId.length;
    this.inputElement.setSelectionRange(newCursorPos, newCursorPos);
    
    // 이벤트 적용
    this.inputElement.focus();
    this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    
    // 콜백 호출
    if (typeof this.options.onSelect === 'function') {
      this.options.onSelect(commandId);
    }
    
    // 자동완성 숨기기
    this._hideSuggestions();
  }

  /**
   * 명령어 목록 설정
   * @param {Array} commands 명령어 목록
   */
  setCommands(commands) {
    this.commands = commands;
  }

  /**
   * 옵션 업데이트
   * @param {Object} options 업데이트할 옵션
   */
  updateOptions(options) {
    this.options = Object.assign(this.options, options);
  }

  /**
   * 자동완성 기능 제거
   */
  destroy() {
    // 이벤트 리스너 제거
    this.inputElement.removeEventListener('input', this._onInput);
    this.inputElement.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('click', this._onDocumentClick);
    
    // UI 요소 제거
    if (this.suggestionBox && this.suggestionBox.parentNode) {
      this.suggestionBox.parentNode.removeChild(this.suggestionBox);
    }
    
    this.suggestionBox = null;
  }
}

/******************************************************************************
 * 전역 인스턴스 및 유틸리티 함수 내보내기
 ******************************************************************************/

// 전역 인스턴스 생성
const themeManager = new ThemeManager();
const codeBlockProcessor = new CodeBlockProcessor();

// 전역에 노출
window.apeThemeManager = themeManager;
window.codeBlockProcessor = codeBlockProcessor;
window.getIconForCommand = getIconForCommand;
window.getCommandGroupClass = getCommandGroupClass;
window.createCommandButton = createCommandButton;
window.toggleCommandSection = toggleCommandSection;
window.CommandAutocomplete = CommandAutocomplete;
window.ModelSelector = ModelSelector;

// DOMContentLoaded 이벤트에서 필요한 초기화 수행
document.addEventListener('DOMContentLoaded', () => {
  // 테마 타입에 따라 body 클래스 추가
  const themeType = themeManager.getThemeType();
  document.body.classList.add(`ape-theme-${themeType}`);
  
  // 플러그인 테마 설정
  themeManager.setPluginTheme('git', '#F14E32');
  themeManager.setPluginTheme('jira', '#0052CC');
  themeManager.setPluginTheme('swdp', '#6554C0');
  
  // 코드 블록 테마 적용
  themeManager.applyCodeBlockTheme();
});