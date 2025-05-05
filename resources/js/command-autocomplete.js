/**
 * 명령어 자동완성 클래스
 * 
 * Claude.ai 스타일의 명령어 자동완성 기능 구현
 * 입력창 위로 팝오버 형태로 표시되는 자동완성 제안
 */
class CommandAutocomplete {
  /**
   * 생성자
   * @param {HTMLElement} inputElement 입력 요소 (textarea)
   * @param {Object} options 옵션
   */
  constructor(inputElement, options = {}) {
    this.inputElement = inputElement;
    this.options = Object.assign({
      triggerCharacters: ['@', '/'],    // 자동완성을 트리거하는 문자들
      minChars: -1,                     // 자동완성을 시작하기 위한 최소 문자 수 (항상 표시)
      maxSuggestions: 10,               // 표시할 최대 제안 수
      commandGroups: {                  // 명령어 그룹별 색상 설정
        'git': '#F14E32',
        'jira': '#0052CC',
        'swdp': '#6554C0',
        'pocket': '#5A3096',
        'system': '#333333'
      },
      onSelect: null                    // 명령어 선택 시 콜백
    }, options);

    // 명령어 목록
    this.commands = [];
    
    // 명령어 카테고리 (계층 구조)
    this.categories = [];
    this.currentCategory = null;
    this.navigationHistory = [];

    // 자동완성 UI 요소
    this.suggestionBox = null;
    this.activeIndex = -1;
    this.visible = false;
    
    // 플레이스홀더 요소
    this.placeholderElement = null;
    this.currentPlaceholder = null;
    
    // 명령어 트리거 버튼
    this.triggerButton = null;
    this.externalTriggerButton = null;
    
    // 외부 플러그인 명령어 플래그
    this.isExternalPlugin = false;

    // 이벤트 리스너 바인딩
    this._bindEvents();

    // 자동완성 UI 초기화
    this._createSuggestionBox();
    
    // 플레이스홀더 초기화
    this._createPlaceholder();
    
    // 명령어 트리거 버튼 생성
    this._createTriggerButton();
  }

  /**
   * 이벤트 리스너 설정
   */
  _bindEvents() {
    // 이벤트 핸들러 바인딩
    this._handleInput = this._onInput.bind(this);
    this._handleKeyDown = this._onKeyDown.bind(this);
    this._handleDocumentClick = this._onDocumentClick.bind(this);
    this._handleWindowResize = this._updatePosition.bind(this);
    this._handleTriggerClick = this._onTriggerClick.bind(this);
    this._handleExternalTriggerClick = this._onExternalTriggerClick.bind(this);
    
    // 이벤트 리스너 등록
    this.inputElement.addEventListener('input', this._handleInput);
    this.inputElement.addEventListener('keydown', this._handleKeyDown);
    document.addEventListener('click', this._handleDocumentClick);
    window.addEventListener('resize', this._handleWindowResize);
    
    // 입력 요소 포커스 관련 이벤트
    this.inputElement.addEventListener('focus', () => {
      if (this.triggerButton) {
        this.triggerButton.style.display = 'flex';
      }
      if (this.externalTriggerButton) {
        this.externalTriggerButton.style.display = 'flex';
      }
      this._updatePlaceholder();
    });
    
    this.inputElement.addEventListener('blur', () => {
      // 플레이스홀더 초기화
      if (this.placeholderElement) {
        this.placeholderElement.textContent = '';
      }
    });
  }
  
  /**
   * 명령어 트리거 버튼 생성
   */
  _createTriggerButton() {
    const inputWrapper = this.inputElement.closest('.input-wrapper');
    if (!inputWrapper) return;
    
    // 기존 버튼이 있으면 제거
    if (this.triggerButton && this.triggerButton.parentNode) {
      this.triggerButton.parentNode.removeChild(this.triggerButton);
    }
    
    if (this.externalTriggerButton && this.externalTriggerButton.parentNode) {
      this.externalTriggerButton.parentNode.removeChild(this.externalTriggerButton);
    }
    
    // 내부 명령어(@) 트리거 버튼 생성
    this.triggerButton = document.createElement('button');
    this.triggerButton.className = 'command-trigger-btn';
    this.triggerButton.title = '내부 명령어 메뉴 (@)';
    this.triggerButton.textContent = '@';
    
    // 클릭 이벤트 추가
    this.triggerButton.addEventListener('click', this._handleTriggerClick);
    
    // 입력 요소 컨테이너에 추가
    inputWrapper.appendChild(this.triggerButton);
    
    // 외부 플러그인(@@) 트리거 버튼 생성
    this.externalTriggerButton = document.createElement('button');
    this.externalTriggerButton.className = 'external-trigger-btn';
    this.externalTriggerButton.title = '외부 플러그인 명령어 메뉴 (@@)';
    this.externalTriggerButton.textContent = '🔍';
    
    // 클릭 이벤트 추가
    this.externalTriggerButton.addEventListener('click', this._handleExternalTriggerClick);
    
    // 입력 요소 컨테이너에 추가
    inputWrapper.appendChild(this.externalTriggerButton);
    
    // 초기 상태는 입력 요소에 포커스가 없으면 숨김
    if (document.activeElement !== this.inputElement) {
      this.triggerButton.style.display = 'none';
      this.externalTriggerButton.style.display = 'none';
    }
  }
  
  /**
   * 명령어 트리거 버튼 클릭 이벤트 핸들러
   * @param {MouseEvent} e 클릭 이벤트
   */
  _onTriggerClick(e) {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 버블링 방지
    
    // 입력 요소에 포커스
    this.inputElement.focus();
    
    // 내부 명령어 모드로 설정
    this.isExternalPlugin = false;
    
    // 이미 표시중인 경우 토글
    if (this.visible) {
      this._hideSuggestions();
      return;
    }
    
    // '@' 명령어를 기본으로 표시
    const defaultTrigger = '@';
    const lastTokenInfo = this._getLastToken();
    
    // 이미 트리거 문자로 시작하는 경우 기존 입력 유지
    if (lastTokenInfo.token && this.options.triggerCharacters.includes(lastTokenInfo.token[0])) {
      this._showCategories(lastTokenInfo.token[0]);
    } else {
      // 새 트리거 문자 추가 - 커서 위치에 @ 삽입
      this._insertAtCursor(defaultTrigger);
      
      // 명령어 목록 표시
      this._showCategories(defaultTrigger);
    }
  }
  
  /**
   * 외부 플러그인 명령어 트리거 버튼 클릭 이벤트 핸들러
   * @param {MouseEvent} e 클릭 이벤트
   */
  _onExternalTriggerClick(e) {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 버블링 방지
    
    // 입력 요소에 포커스
    this.inputElement.focus();
    
    // 이미 표시중인 경우 토글
    if (this.visible) {
      this._hideSuggestions();
      return;
    }
    
    // 외부 플러그인 모드로 설정
    this.isExternalPlugin = true;
    
    // '@@' 명령어를 기본으로 표시
    const defaultTrigger = '@@';
    const lastTokenInfo = this._getLastToken();
    
    // 이미 @@ 로 시작하는 경우 기존 입력 유지
    if (lastTokenInfo.token && lastTokenInfo.token.startsWith('@@')) {
      this._showExternalCategories();
    } else {
      // 새 트리거 문자 추가 - 커서 위치에 @@ 삽입
      this._insertAtCursor(defaultTrigger);
      
      // 명령어 목록 표시
      this._showExternalCategories();
    }
  }
  
  /**
   * 커서 위치에 텍스트 삽입
   * @param {string} text 삽입할 텍스트
   */
  _insertAtCursor(text) {
    const startPos = this.inputElement.selectionStart;
    const endPos = this.inputElement.selectionEnd;
    const value = this.inputElement.value;
    
    // 텍스트 삽입
    this.inputElement.value = value.substring(0, startPos) + text + value.substring(endPos);
    
    // 커서 위치 설정
    const newPos = startPos + text.length;
    this.inputElement.setSelectionRange(newPos, newPos);
    
    // 입력 이벤트 트리거 (Input 이벤트 핸들러 호출)
    this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  /**
   * 플레이스홀더 요소 생성
   */
  _createPlaceholder() {
    const inputWrapper = this.inputElement.closest('.input-wrapper');
    if (!inputWrapper) return;
    
    // 기존 플레이스홀더가 있으면 제거
    if (this.placeholderElement && this.placeholderElement.parentNode) {
      this.placeholderElement.parentNode.removeChild(this.placeholderElement);
    }
    
    // 플레이스홀더 요소 생성
    this.placeholderElement = document.createElement('div');
    this.placeholderElement.className = 'command-hint';
    
    // 초기 상태는 비어있음
    this.placeholderElement.textContent = '';
    
    // 스타일 설정
    this.placeholderElement.style.top = '8px';  // 입력 요소의 패딩과 동일하게
    this.placeholderElement.style.left = '8px';
    
    // 입력 요소 컨테이너에 추가
    inputWrapper.appendChild(this.placeholderElement);
  }

  /**
   * 입력 변경 이벤트 핸들러
   * @param {Event} e 입력 이벤트
   */
  _onInput(e) {
    const text = this.inputElement.value;
    const currentPosition = this.inputElement.selectionStart;
    const tokenInfo = this._getLastToken();

    // 플레이스홀더 업데이트
    this._updatePlaceholder();

    // 명령어와 현재 토큰의 내용을 확인
    const lastToken = tokenInfo.token;
    
    // @@ 외부 플러그인 명령어 감지
    if (lastToken && lastToken.startsWith('@@')) {
      this.isExternalPlugin = true;
      this._showExternalCategories();
      return;
    }
    
    // @ 또는 / 내부 명령어 감지
    if (lastToken && this.options.triggerCharacters.includes(lastToken.charAt(0))) {
      this.isExternalPlugin = false;
      const query = lastToken.substring(1); // @ 또는 / 접두사 제거
      
      // 자동완성 표시 결정 - @ 또는 / 만 입력해도 바로 표시
      if (this.categories && this.categories.length > 0) {
        this._showCategories(lastToken.charAt(0));
      } else {
        this._showSuggestions(query, lastToken, tokenInfo);
      }
      return;
    }
    
    // 조건에 맞지 않고 현재 입력 중인 문자가 명령어 시작 문자가 아닌 경우만 숨김
    // 이는 @ 입력 직후에 자동완성이 사라지는 것을 방지하기 위함
    if (e && e.data && !this.options.triggerCharacters.includes(e.data) && e.data !== '@') {
      this._hideSuggestions();
    }
  }
  
  /**
   * 현재 토큰 정보 가져오기
   * @returns {Object} 토큰 정보 (token, startPos, endPos)
   */
  _getLastToken() {
    const text = this.inputElement.value;
    const currentPosition = this.inputElement.selectionStart;
    
    // 커서 위치 이전까지의 텍스트
    const textBeforeCursor = text.substring(0, currentPosition);
    // 커서 위치 이후의 텍스트
    const textAfterCursor = text.substring(currentPosition);
    
    // 커서 위치에서 시작해 왼쪽으로 검색하여 마지막 공백 찾기
    let startPos = textBeforeCursor.lastIndexOf(' ') + 1;
    
    // 공백이 없는 경우 텍스트의 시작부터
    if (startPos <= 0) startPos = 0;
    
    // 오른쪽으로 검색하여 다음 공백 찾기
    let endPos = textAfterCursor.indexOf(' ');
    
    // 공백이 없는 경우 텍스트의 끝까지
    if (endPos < 0) endPos = textAfterCursor.length;
    
    // 현재 편집 중인 토큰
    const token = textBeforeCursor.substring(startPos) + textAfterCursor.substring(0, endPos);
    
    return {
      token: token,
      startPos: startPos,
      endPos: currentPosition + endPos,
      cursorPos: currentPosition
    };
  }
  
  /**
   * 플레이스홀더 업데이트
   */
  _updatePlaceholder() {
    if (!this.placeholderElement) return;
    
    const tokenInfo = this._getLastToken();
    const token = tokenInfo.token;
    
    // 플레이스홀더 초기화
    this.placeholderElement.textContent = '';
    this.placeholderElement.style.display = 'none';
    this.currentPlaceholder = null;
    
    // 트리거 문자로 시작하고 현재 입력 중인 경우만 처리
    if (token && this.options.triggerCharacters.includes(token.charAt(0))) {
      const query = token.substring(1); // @ 또는 / 접두사 제거
      
      if (query.length > 0) {
        // 필터링된 명령어 가져오기
        const prefix = token.charAt(0);
        const prefixType = prefix === '@' ? 'at' : prefix === '/' ? 'slash' : null;
        
        if (!prefixType) return;
        
        // 이름으로 필터링
        const filteredCommands = this.commands
          .filter(cmd => cmd.type === prefixType)
          .filter(cmd => cmd.id.toLowerCase().startsWith(token.toLowerCase()));
        
        // 일치하는 명령어가 있으면 첫 번째 명령어를 플레이스홀더로 사용
        if (filteredCommands.length > 0) {
          const firstMatch = filteredCommands[0];
          const placeholderText = firstMatch.id;
          
          // 이미 입력된 부분을 제외한 나머지 부분을 플레이스홀더로 표시
          const remainingText = placeholderText.substring(token.length);
          
          if (remainingText) {
            // 입력 위치 계산
            const inputRect = this.inputElement.getBoundingClientRect();
            const inputStyle = window.getComputedStyle(this.inputElement);
            const lineHeight = parseInt(inputStyle.lineHeight) || 20;
            
            // 커서 위치 계산 (텍스트 측정용 임시 요소 사용)
            const measurer = document.createElement('span');
            measurer.style.visibility = 'hidden';
            measurer.style.position = 'absolute';
            measurer.style.whiteSpace = 'pre';
            measurer.style.font = inputStyle.font;
            measurer.textContent = token;
            document.body.appendChild(measurer);
            const tokenWidth = measurer.offsetWidth;
            document.body.removeChild(measurer);
            
            // 플레이스홀더 위치 및 내용 설정
            this.placeholderElement.style.left = `${8 + tokenWidth}px`;
            this.placeholderElement.textContent = remainingText;
            this.placeholderElement.style.display = 'block';
            
            // 현재 플레이스홀더 저장
            this.currentPlaceholder = placeholderText;
            
            // Tab 힌트 추가
            const tabHint = document.createElement('span');
            tabHint.className = 'tab-hint';
            tabHint.textContent = 'Tab';
            this.placeholderElement.appendChild(tabHint);
          }
        }
      }
    }
  }

  /**
   * 키 입력 이벤트 핸들러
   * @param {KeyboardEvent} e 키보드 이벤트
   */
  _onKeyDown(e) {
    // Tab 키로 명령어 완성
    if (e.key === 'Tab' && !e.shiftKey && this.currentPlaceholder && this.placeholderElement.style.display !== 'none') {
      e.preventDefault();
      this._completeWithPlaceholder();
      return;
    }
    
    // 자동완성이 표시되지 않은 상태라면 Escape 키로 플레이스홀더 숨기기
    if (!this.visible) {
      if (e.key === 'Escape' && this.placeholderElement && this.placeholderElement.style.display !== 'none') {
        e.preventDefault();
        this.placeholderElement.style.display = 'none';
        this.currentPlaceholder = null;
      }
      return;
    }

    // 자동완성이 표시된 상태에서 처리
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._moveSelection(1);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this._moveSelection(-1);
        break;
      
      case 'ArrowLeft':
        // 카테고리 내부에 있는 경우에만 뒤로가기 처리
        if (this.navigationHistory.length > 0) {
          e.preventDefault();
          this._goBack();
        }
        break;
        
      case 'ArrowRight':
        // 카테고리 목록에서 오른쪽 화살표는 현재 선택된 카테고리 진입
        if (this.currentCategory === null) {
          e.preventDefault();
          const activeItem = this.suggestionBox.querySelector('.command-category.active');
          if (activeItem) {
            const categoryId = activeItem.dataset.category;
            const category = this.categories.find(cat => cat.id === categoryId);
            if (category) {
              this._selectCategory(category);
            }
          }
        }
        break;
        
      case 'Tab':
      case 'Enter':
        if (this.activeIndex >= 0) {
          e.preventDefault();
          // 카테고리 선택인지 명령어 선택인지 구분
          if (this.currentCategory === null) {
            const activeItem = this.suggestionBox.querySelector('.command-category.active');
            if (activeItem) {
              const categoryId = activeItem.dataset.category;
              const category = this.categories.find(cat => cat.id === categoryId);
              if (category) {
                this._selectCategory(category);
              }
            }
          } else {
            this._selectCurrentSuggestion();
          }
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        // 카테고리 내부에 있는 경우 뒤로 가기, 아니면 팝오버 닫기
        if (this.navigationHistory.length > 0) {
          this._goBack();
        } else {
          this._hideSuggestions();
        }
        break;
    }
  }
  
  /**
   * 플레이스홀더로 명령어 완성
   */
  _completeWithPlaceholder() {
    if (!this.currentPlaceholder) return;
    
    const tokenInfo = this._getLastToken();
    const token = tokenInfo.token;
    
    if (token && this.options.triggerCharacters.includes(token.charAt(0))) {
      // 입력 필드 업데이트
      const text = this.inputElement.value;
      
      // 새 텍스트 생성 (현재 토큰을 플레이스홀더로 대체)
      const newText = text.substring(0, tokenInfo.startPos) + 
                    this.currentPlaceholder + ' ' + 
                    text.substring(tokenInfo.endPos);
      
      // 입력 필드 업데이트
      this.inputElement.value = newText;
      
      // 커서 위치 설정 (명령어 뒤의 공백 다음으로)
      const newCursorPos = tokenInfo.startPos + this.currentPlaceholder.length + 1;
      this.inputElement.setSelectionRange(newCursorPos, newCursorPos);
      
      // 플레이스홀더 초기화
      this.placeholderElement.textContent = '';
      this.placeholderElement.style.display = 'none';
      this.currentPlaceholder = null;
      
      // 이벤트 적용
      this.inputElement.focus();
      this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
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
        e.target !== this.inputElement &&
        e.target !== this.triggerButton &&
        e.target !== this.externalTriggerButton) {
      this._hideSuggestions();
    }
  }

  // _tokenizeInput 메서드는 _getLastToken 메서드로 대체되었습니다.

  /**
   * 자동완성 제안 상자 생성
   */
  _createSuggestionBox() {
    // 기존 요소 제거
    if (this.suggestionBox) {
      this.suggestionBox.remove();
    }

    // 팝오버 컨테이너 생성
    this.suggestionBox = document.createElement('div');
    this.suggestionBox.className = 'command-suggestions';
    
    // 입력 요소 컨테이너에 추가
    const inputWrapper = this.inputElement.closest('.input-wrapper');
    if (inputWrapper) {
      // 팝오버 컨테이너 생성
      const popoverContainer = document.createElement('div');
      popoverContainer.className = 'command-popover';
      popoverContainer.appendChild(this.suggestionBox);
      
      // 입력 요소 컨테이너에 추가
      inputWrapper.appendChild(popoverContainer);
      this.popoverContainer = popoverContainer;
    } else {
      // 입력 요소 컨테이너가 없는 경우 body에 직접 추가
      document.body.appendChild(this.suggestionBox);
    }
    
    // 초기 상태는 숨김
    this._hideSuggestions();
  }

  /**
   * 자동완성 제안 상자 위치 업데이트
   */
  _updatePosition() {
    if (!this.suggestionBox || !this.visible) return;
    
    // 팝오버 컨테이너가 있는 경우 위치 업데이트 필요 없음
    if (this.popoverContainer) return;
    
    // 입력 요소 위치 계산
    const inputRect = this.inputElement.getBoundingClientRect();
    
    // 제안 상자 위치 설정 (Claude AI 스타일: 입력창 위에 위치)
    this.suggestionBox.style.position = 'absolute';
    this.suggestionBox.style.left = `${inputRect.left}px`;
    this.suggestionBox.style.bottom = `${window.innerHeight - inputRect.top + 8}px`; // 입력창 위에 8px 간격
  }

  /**
   * 자동완성 제안 표시
   * @param {string} query 검색 쿼리
   * @param {string} fullToken 전체 토큰
   * @param {Object} tokenInfo 토큰 정보 객체
   */
  _showSuggestions(query, fullToken, tokenInfo) {
    // 명령어가 로드되지 않은 경우 요청
    if (this.commands.length === 0) {
      // 로딩 메시지 표시
      this.suggestionBox.innerHTML = `
        <div class="suggestion-loading">
          <div class="suggestion-loading-spinner"></div>
          <span>명령어 로딩 중...</span>
        </div>
      `;
      
      // suggestionBox 표시
      this.suggestionBox.style.display = 'block';
      this.suggestionBox.classList.add('visible');
      this.visible = true;
      console.log('명령어 로딩 중 자동완성 메뉴 표시');
      
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
      .filter(cmd => query.length === 0 || 
        cmd.id.toLowerCase().includes(query.toLowerCase()) || 
        (cmd.description && cmd.description.toLowerCase().includes(query.toLowerCase())));

    // 결과가 없으면 "명령어 없음" 메시지 표시
    if (filteredCommands.length === 0) {
      this.suggestionBox.innerHTML = `
        <div class="suggestion-title">${prefix === '@' ? '외부 명령어' : '내부 명령어'}</div>
        <div class="empty-suggestion-message">일치하는 명령어가 없습니다</div>
        <div class="keyboard-hint">
          <span>이동: <span class="key">↑</span><span class="key">↓</span></span>
          <span>선택: <span class="key">Enter</span></span>
          <span>닫기: <span class="key">Esc</span></span>
        </div>
      `;
      
      // suggestionBox 표시
      this.suggestionBox.style.display = 'block';
      this.suggestionBox.classList.add('visible');
      this.visible = true;
      console.log('자동완성 메뉴 표시 (명령어 없음)');
      
      // 위치 업데이트
      this._updatePosition();
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

    // 목록 컨테이너 추가
    const listContainer = document.createElement('div');
    listContainer.className = 'suggestion-list';
    this.suggestionBox.appendChild(listContainer);

    // 명령어 목록 추가
    limitedCommands.forEach((cmd, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.dataset.index = index;
      item.dataset.value = cmd.id;
      
      // 명령어 그룹 식별
      const commandGroup = cmd.id.split(':')[0].replace(/^[@/]/, '');
      const groupClassName = `command-group-${commandGroup}`;
      item.classList.add(groupClassName);
      
      // 아이콘 생성
      const iconName = window.getIconForCommand ? 
                      window.getIconForCommand(cmd.id) : 
                      'play';
      
      // 카테고리 태그 생성
      const categoryHtml = `<span class="suggestion-category cat-${commandGroup}">${commandGroup}</span>`;
                  
      // HTML 생성 (코디콘 대신 간단한 아이콘 문자 사용)
      const iconChar = commandGroup === 'git' ? '⎇' :
                       commandGroup === 'jira' ? '⚐' :
                       commandGroup === 'swdp' ? '⚙' :
                       commandGroup === 'pocket' ? '◈' : '▶';
      
      item.innerHTML = `
        <span style="font-weight: bold; margin-right: 8px; min-width: 16px; text-align: center;">${iconChar}</span>
        <span class="suggestion-label">${cmd.label || cmd.id}</span>
        ${cmd.description ? `<span class="suggestion-description">${cmd.description}</span>` : ''}
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
      
      listContainer.appendChild(item);
    });

    // 키보드 단축키 힌트 추가
    const keyboardHint = document.createElement('div');
    keyboardHint.className = 'keyboard-hint';
    keyboardHint.innerHTML = `
      <span>이동: <span class="key">↑</span><span class="key">↓</span></span>
      <span>선택: <span class="key">Enter</span></span>
      <span>닫기: <span class="key">Esc</span></span>
      <span>완성: <span class="key">Tab</span></span>
    `;
    this.suggestionBox.appendChild(keyboardHint);
    
    // suggestionBox 표시
    this.suggestionBox.style.display = 'block';
    this.suggestionBox.classList.add('visible');
    this.visible = true;
    console.log('자동완성 메뉴 표시됨');
    
    // 위치 업데이트
    this._updatePosition();
    
    // 활성 항목 초기화
    this.activeIndex = 0;
    this._setActiveItem(0);
  }

  /**
   * 자동완성 제안 숨기기
   */
  _hideSuggestions() {
    if (this.suggestionBox) {
      this.suggestionBox.classList.remove('visible');
      this.suggestionBox.style.display = 'none'; // 명시적으로 display 속성 설정
      this.activeIndex = -1;
      this.visible = false;
      console.log('자동완성 메뉴 숨김 처리됨');
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
      const listContainer = this.suggestionBox.querySelector('.suggestion-list');
      if (listContainer) {
        if (activeItem.offsetTop < listContainer.scrollTop) {
          listContainer.scrollTop = activeItem.offsetTop;
        } else if (activeItem.offsetTop + activeItem.offsetHeight > listContainer.scrollTop + listContainer.clientHeight) {
          listContainer.scrollTop = activeItem.offsetTop + activeItem.offsetHeight - listContainer.clientHeight;
        }
      }
    }
    
    this.activeIndex = index;
  }

  /**
   * 선택 이동
   * @param {number} step 이동 단계 (1: 아래, -1: 위)
   */
  _moveSelection(step) {
    // 현재 카테고리가 있는 경우 항목 이동, 아니면 카테고리 이동
    if (this.currentCategory) {
      // 항목 모드 (suggestion-item)
      const items = this.suggestionBox.querySelectorAll('.suggestion-item');
      if (items.length === 0) return;
      
      let newIndex = this.activeIndex + step;
      
      // 범위 내 제한
      if (newIndex < 0) newIndex = items.length - 1;
      if (newIndex >= items.length) newIndex = 0;
      
      this._setActiveItem(newIndex);
      console.log(`항목 선택 이동: ${newIndex}`);
    } else {
      // 카테고리 모드 (command-category)
      const categories = this.suggestionBox.querySelectorAll('.command-category');
      if (categories.length === 0) return;
      
      let newIndex = this.activeIndex + step;
      
      // 범위 내 제한
      if (newIndex < 0) newIndex = categories.length - 1;
      if (newIndex >= categories.length) newIndex = 0;
      
      this._setActiveCategory(newIndex);
      console.log(`카테고리 선택 이동: ${newIndex}`);
    }
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
    const tokenInfo = this._getLastToken();
    
    // 새 텍스트 생성
    const newText = text.substring(0, tokenInfo.startPos) + 
                    commandId + ' ' + 
                    text.substring(tokenInfo.endPos);
    
    // 입력 필드 업데이트
    this.inputElement.value = newText;
    
    // 커서 위치 설정 (명령어 뒤의 공백 다음으로)
    const newCursorPos = tokenInfo.startPos + commandId.length + 1;
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
    
    // 플레이스홀더 초기화
    if (this.placeholderElement) {
      this.placeholderElement.textContent = '';
      this.placeholderElement.style.display = 'none';
    }
    this.currentPlaceholder = null;
  }

  /**
   * 명령어 목록 설정 및 카테고리 구성
   * @param {Array} commands 명령어 목록
   * @param {Object} dynamicData 동적 데이터 (브랜치 목록 등)
   */
  setCommands(commands, dynamicData) {
    this.commands = commands;
    
    // 동적 데이터 저장 (브랜치 목록 등)
    this.dynamicData = dynamicData || {};
    
    // 명령어를 카테고리별로 그룹화
    this._organizeCommandsByCategory();
    
    // Git 관련 명령어 파라미터를 동적으로 구성
    this._extendGitCommands();
    
    // 명령어가 로드된 후 현재 입력 상태에 따라 자동완성 다시 표시
    const text = this.inputElement.value;
    const currentPosition = this.inputElement.selectionStart;
    
    // 현재 입력된 텍스트 확인
    const tokenInfo = this._getLastToken();
    const lastToken = tokenInfo.token;
    
    // 입력 상태에 따라 적절한 표시
    if (lastToken) {
      // @@ 로 시작하는 경우 외부 플러그인 카테고리 표시
      if (lastToken.startsWith('@@')) {
        this.isExternalPlugin = true;
        this._showExternalCategories();
      } 
      // @ 또는 / 로 시작하는 경우 내부 명령어 카테고리 표시
      else if (this.options.triggerCharacters.includes(lastToken.charAt(0))) {
        this.isExternalPlugin = false;
        this._showCategories(lastToken.charAt(0));
      }
    }
    
    // 플레이스홀더 업데이트
    this._updatePlaceholder();
  }
  
  /**
   * 컨텍스트 기반 명령어에 대한 동적 자동완성 구성
   * CommandService의 컨텍스트 기반 명령어 생성 활용
   */
  _extendGitCommands() {
    if (!this.dynamicData) return;
    
    console.log(`컨텍스트 기반 명령어 확장 시작`);
    
    // Git 명령어 확장 (기존 로직은 여전히 유지)
    if (this.dynamicData.gitBranches) {
      // Git 브랜치 정보
      const branches = this.dynamicData.gitBranches || [];
      const branchNames = branches.map(branch => branch.name);
      
      console.log(`Git 브랜치 명령어 확장: ${branchNames.length}개 브랜치 처리 중`);
      
      // 확장할 명령어 목록
      const gitCommandsToExtend = [
        { base: '@git:checkout', param: 'branch', description: '브랜치 전환' },
        { base: '@git:pull', param: 'branch', description: '브랜치에서 변경사항 가져오기' },
        { base: '@git:push', param: 'branch', description: '브랜치로 변경사항 푸시' },
        { base: '@git:merge', param: 'branch', description: '브랜치 병합' },
        { base: '@git:diff', param: 'branch', description: '브랜치와 현재 변경사항 비교' },
        { base: '@git:branch', param: 'action', description: '브랜치 관리' }
      ];
      
      // 기존 명령어 목록에서 해당 명령어 찾기
      gitCommandsToExtend.forEach(cmdInfo => {
        // 기본 Git 명령어
        const baseCmd = this.commands.find(cmd => cmd.id === cmdInfo.base);
        if (!baseCmd) {
          console.log(`기본 명령어를 찾을 수 없음: ${cmdInfo.base}`);
          return;
        }
        
        // 브랜치 관련 자동완성 명령어 추가
        branchNames.forEach(branch => {
          // 현재 브랜치 여부 확인
          const isCurrent = branches.find(b => b.name === branch)?.isCurrent || false;
          
          const branchCommand = {
            id: `${cmdInfo.base} ${branch}`,
            label: `${baseCmd.label} ${branch}`,
            description: isCurrent ? '현재 브랜치' : 
                        (branch === 'main' || branch === 'master') ? '기본 브랜치' : '',
            type: baseCmd.type,
            parent: cmdInfo.base,
            group: 'git'
          };
          
          // 중복 방지를 위해 이미 있는지 확인
          if (!this.commands.some(cmd => cmd.id === branchCommand.id)) {
            this.commands.push(branchCommand);
          }
        });
      });
    }
    
    // 컨텍스트 기반 명령어 확장 (CommandService 활용)
    if (this.dynamicData.contextCommands) {
      const contextCommands = this.dynamicData.contextCommands;
      
      // 컨텍스트 명령어 추가
      contextCommands.forEach(cmd => {
        // 이미 있는 명령어와 중복 검사
        if (!this.commands.some(existingCmd => existingCmd.id === cmd.id)) {
          this.commands.push(cmd);
        }
      });
      
      console.log(`컨텍스트 기반 명령어 ${contextCommands.length}개 추가됨`);
    }
    
    console.log(`명령어 확장 완료`);
  }
  
  /**
   * 외부 플러그인 카테고리 표시
   */
  _showExternalCategories() {
    if (!this.suggestionBox) return;
    
    // 현재 카테고리 초기화
    this.currentCategory = null;
    this.navigationHistory = [];
    
    // 제안 상자 내용 생성
    this.suggestionBox.innerHTML = '';
    
    // 제목 추가
    const titleElem = document.createElement('div');
    titleElem.className = 'suggestion-title';
    titleElem.textContent = '외부 플러그인 (Settings.json에서 정의)';
    this.suggestionBox.appendChild(titleElem);
    
    // 목록 컨테이너 추가
    const listContainer = document.createElement('div');
    listContainer.className = 'suggestion-list';
    this.suggestionBox.appendChild(listContainer);
    
    // 외부 플러그인 카테고리 생성 (Settings에 설정된 외부 플러그인 기반)
    // 스텁 카테고리만 표시 (실제로는 settings.json에서 로드)
    const externalCategories = [
      { id: 'custom1', label: 'Custom 1', icon: '📦' },
      { id: 'custom2', label: 'Custom 2', icon: '📦' },
      { id: 'custom3', label: 'Custom 3', icon: '📦' },
      { id: 'custom4', label: 'Custom 4', icon: '📦' }
    ];
    
    // 카테고리 목록 추가
    externalCategories.forEach((category, index) => {
      const item = document.createElement('div');
      item.className = 'command-category';
      item.dataset.index = index;
      item.dataset.category = category.id;
      
      // HTML 생성
      item.innerHTML = `
        <span class="command-category-icon">${category.icon}</span>
        <span class="command-category-label">${category.label}</span>
        <span class="command-category-arrow">›</span>
      `;
      
      // 클릭 이벤트 리스너
      item.addEventListener('click', () => {
        this.activeIndex = index;
        this._selectExternalCategory(category);
      });
      
      // 마우스 오버 이벤트
      item.addEventListener('mouseover', () => {
        this._setActiveCategory(index);
      });
      
      listContainer.appendChild(item);
    });
    
    // 키보드 단축키 힌트 추가
    const keyboardHint = document.createElement('div');
    keyboardHint.className = 'keyboard-hint';
    keyboardHint.innerHTML = `
      <span>이동: <span class="key">↑</span><span class="key">↓</span></span>
      <span>선택: <span class="key">Enter</span></span>
      <span>닫기: <span class="key">Esc</span></span>
    `;
    this.suggestionBox.appendChild(keyboardHint);
    
    // suggestionBox 표시
    this.suggestionBox.style.display = 'block';
    this.suggestionBox.classList.add('visible');
    this.visible = true;
    console.log('자동완성 메뉴 표시 (카테고리)');
    
    // 위치 업데이트
    this._updatePosition();
    
    // 활성 항목 초기화
    this.activeIndex = 0;
    this._setActiveCategory(0);
  }
  
  /**
   * 외부 플러그인 카테고리 선택
   * @param {Object} category 선택한 카테고리
   */
  _selectExternalCategory(category) {
    // 선택한 카테고리에 대한 하위 명령어 표시
    this._showExternalCommandsInCategory(category);
  }
  
  /**
   * 외부 플러그인 카테고리 내 명령어 표시
   * @param {Object} category 선택한 카테고리
   */
  _showExternalCommandsInCategory(category) {
    if (!this.suggestionBox) return;
    
    // 현재 카테고리 저장
    this.currentCategory = category;
    this.navigationHistory.push(category);
    
    // 제안 상자 내용 생성
    this.suggestionBox.innerHTML = '';
    
    // 뒤로 가기 버튼 추가
    const backButton = document.createElement('div');
    backButton.className = 'back-button';
    backButton.innerHTML = `<span class="back-arrow">‹</span> 돌아가기`;
    backButton.addEventListener('click', this._goBack.bind(this));
    this.suggestionBox.appendChild(backButton);
    
    // 경로 표시
    const pathIndicator = document.createElement('div');
    pathIndicator.className = 'path-indicator';
    pathIndicator.textContent = `@@ > ${category.label}`;
    this.suggestionBox.appendChild(pathIndicator);
    
    // 목록 컨테이너 추가
    const listContainer = document.createElement('div');
    listContainer.className = 'suggestion-list';
    this.suggestionBox.appendChild(listContainer);
    
    // 스텁 명령어 생성 (실제로는 settings.json에서 가져와야 함)
    const exampleCommands = [];
    
    // 각 커스텀 카테고리별 기본 명령어 생성
    if (category.id === 'custom1') {
      exampleCommands.push(
        { id: `@@${category.id}:command1`, label: 'Command 1-1', icon: '⚙️', description: '명령어 1-1 설명' },
        { id: `@@${category.id}:command2`, label: 'Command 1-2', icon: '⚙️', description: '명령어 1-2 설명' },
        { id: `@@${category.id}:command3`, label: 'Command 1-3', icon: '⚙️', description: '명령어 1-3 설명' }
      );
    } else if (category.id === 'custom2') {
      exampleCommands.push(
        { id: `@@${category.id}:command1`, label: 'Command 2-1', icon: '⚙️', description: '명령어 2-1 설명' },
        { id: `@@${category.id}:command2`, label: 'Command 2-2', icon: '⚙️', description: '명령어 2-2 설명' }
      );
    } else if (category.id === 'custom3') {
      exampleCommands.push(
        { id: `@@${category.id}:command1`, label: 'Command 3-1', icon: '⚙️', description: '명령어 3-1 설명' },
        { id: `@@${category.id}:command2`, label: 'Command 3-2', icon: '⚙️', description: '명령어 3-2 설명' }
      );
    } else if (category.id === 'custom4') {
      exampleCommands.push(
        { id: `@@${category.id}:command1`, label: 'Command 4-1', icon: '⚙️', description: '명령어 4-1 설명' },
        { id: `@@${category.id}:command2`, label: 'Command 4-2', icon: '⚙️', description: '명령어 4-2 설명' }
      );
    }
    
    // 명령어 목록 추가
    exampleCommands.forEach((cmd, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.dataset.index = index;
      item.dataset.value = cmd.id;
      
      // HTML 생성
      item.innerHTML = `
        <span style="font-weight: bold; margin-right: 8px; min-width: 16px; text-align: center;">${cmd.icon}</span>
        <span class="suggestion-label">${cmd.label}</span>
        ${cmd.description ? `<span class="suggestion-description">${cmd.description}</span>` : ''}
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
      
      listContainer.appendChild(item);
    });
    
    // 키보드 단축키 힌트 추가
    const keyboardHint = document.createElement('div');
    keyboardHint.className = 'keyboard-hint';
    keyboardHint.innerHTML = `
      <span>이동: <span class="key">↑</span><span class="key">↓</span></span>
      <span>선택: <span class="key">Enter</span></span>
      <span>뒤로: <span class="key">←</span></span>
      <span>닫기: <span class="key">Esc</span></span>
    `;
    this.suggestionBox.appendChild(keyboardHint);
    
    // 활성 항목 초기화
    this.activeIndex = 0;
    this._setActiveItem(0);
  }
  
  /**
   * 명령어를 카테고리별로 그룹화
   */
  _organizeCommandsByCategory() {
    // 카테고리 맵 (임시)
    const categoryMap = {};
    
    // 명령어를 그룹별로 분류
    this.commands.forEach(cmd => {
      // 명령어 ID에서 접두사 제거 (@, /)
      const cleanId = cmd.id.replace(/^[@/]/, '');
      
      // 명령어 ID에서 주요 그룹 추출
      const parts = cleanId.split(':');
      const mainGroup = parts[0]; // 첫 부분 (git, jira 등)
      
      // 카테고리가 없으면 생성
      if (!categoryMap[mainGroup]) {
        categoryMap[mainGroup] = {
          id: mainGroup,
          label: this._formatCategoryLabel(mainGroup),
          type: cmd.type, // at 또는 slash
          commands: []
        };
      }
      
      // 명령어를 해당 카테고리에 추가
      categoryMap[mainGroup].commands.push(cmd);
    });
    
    // 카테고리 맵을 배열로 변환
    this.categories = Object.values(categoryMap);
    
    // 각 카테고리 내 명령어 정렬 (알파벳순)
    this.categories.forEach(category => {
      category.commands.sort((a, b) => a.id.localeCompare(b.id));
    });
    
    // 카테고리 정렬 (알파벳순)
    this.categories.sort((a, b) => a.label.localeCompare(b.label));
  }
  
  /**
   * 카테고리 레이블 포맷팅
   * @param {string} categoryId 카테고리 ID
   * @returns {string} 포맷팅된 레이블
   */
  _formatCategoryLabel(categoryId) {
    // 첫 글자를 대문자로 변환
    return categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  }
  
  /**
   * 카테고리 목록 표시
   * @param {string} prefix 명령어 접두사 (@ 또는 /)
   */
  _showCategories(prefix) {
    if (!this.suggestionBox) return;
    
    // 접두사에 맞는 카테고리만 필터링
    const prefixType = prefix === '@' ? 'at' : prefix === '/' ? 'slash' : null;
    
    if (!prefixType) {
      this._hideSuggestions();
      return;
    }
    
    // 해당 접두사 타입의 카테고리만 필터링
    const filteredCategories = this.categories.filter(cat => cat.type === prefixType);
    
    if (filteredCategories.length === 0) {
      this._showSuggestions('', prefix, this._getLastToken());
      return;
    }
    
    // 현재 카테고리 초기화
    this.currentCategory = null;
    this.navigationHistory = [];
    
    // 제안 상자 내용 생성
    this.suggestionBox.innerHTML = '';
    
    // 제목 추가
    const titleElem = document.createElement('div');
    titleElem.className = 'suggestion-title';
    titleElem.textContent = prefix === '@' ? '외부 명령어 카테고리' : '내부 명령어 카테고리';
    this.suggestionBox.appendChild(titleElem);
    
    // 목록 컨테이너 추가
    const listContainer = document.createElement('div');
    listContainer.className = 'suggestion-list';
    this.suggestionBox.appendChild(listContainer);
    
    // 카테고리 목록 추가
    filteredCategories.forEach((category, index) => {
      const item = document.createElement('div');
      item.className = 'command-category';
      item.dataset.index = index;
      item.dataset.category = category.id;
      
      // 카테고리별 아이콘 문자 결정
      const iconChar = category.id === 'git' ? '⎇' :
                       category.id === 'jira' ? '⚐' :
                       category.id === 'swdp' ? '⚙' :
                       category.id === 'pocket' ? '◈' : '▶';
                       
      // HTML 생성
      item.innerHTML = `
        <span class="command-category-icon">${iconChar}</span>
        <span class="command-category-label">${category.label}</span>
        <span class="command-category-arrow">›</span>
      `;
      
      // 클릭 이벤트 리스너
      item.addEventListener('click', () => {
        this.activeIndex = index;
        this._selectCategory(category);
      });
      
      // 마우스 오버 이벤트
      item.addEventListener('mouseover', () => {
        this._setActiveCategory(index);
      });
      
      listContainer.appendChild(item);
    });
    
    // 키보드 단축키 힌트 추가
    const keyboardHint = document.createElement('div');
    keyboardHint.className = 'keyboard-hint';
    keyboardHint.innerHTML = `
      <span>이동: <span class="key">↑</span><span class="key">↓</span></span>
      <span>선택: <span class="key">Enter</span></span>
      <span>닫기: <span class="key">Esc</span></span>
    `;
    this.suggestionBox.appendChild(keyboardHint);
    
    // suggestionBox 표시
    this.suggestionBox.style.display = 'block';
    this.suggestionBox.classList.add('visible');
    this.visible = true;
    console.log('자동완성 메뉴 표시 (카테고리)');
    
    // 위치 업데이트
    this._updatePosition();
    
    // 활성 항목 초기화
    this.activeIndex = 0;
    this._setActiveCategory(0);
  }
  
  /**
   * 활성 카테고리 설정
   * @param {number} index 활성화할 카테고리 인덱스
   */
  _setActiveCategory(index) {
    // 이전 활성 항목에서 클래스 제거
    const prevActive = this.suggestionBox.querySelector('.command-category.active');
    if (prevActive) {
      prevActive.classList.remove('active');
    }
    
    // 새 활성 항목에 클래스 추가
    const activeItem = this.suggestionBox.querySelector(`.command-category[data-index="${index}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
    
    this.activeIndex = index;
  }
  
  /**
   * 카테고리 선택
   * @param {Object} category 선택한 카테고리
   */
  _selectCategory(category) {
    // 카테고리 내의 명령어 표시
    this._showCommandsInCategory(category);
  }
  
  /**
   * 카테고리 내 명령어 표시
   * @param {Object} category 선택한 카테고리
   */
  _showCommandsInCategory(category) {
    if (!this.suggestionBox) return;
    
    // 현재 카테고리 저장
    this.currentCategory = category;
    this.navigationHistory.push(category);
    
    // 제안 상자 내용 생성
    this.suggestionBox.innerHTML = '';
    
    // 뒤로 가기 버튼 추가
    const backButton = document.createElement('div');
    backButton.className = 'back-button';
    backButton.innerHTML = `<span class="back-arrow">‹</span> 돌아가기`;
    backButton.addEventListener('click', this._goBack.bind(this));
    this.suggestionBox.appendChild(backButton);
    
    // 경로 표시
    const pathIndicator = document.createElement('div');
    pathIndicator.className = 'path-indicator';
    pathIndicator.textContent = `${category.type === 'at' ? '@' : '/'}${category.label}`;
    this.suggestionBox.appendChild(pathIndicator);
    
    // 목록 컨테이너 추가
    const listContainer = document.createElement('div');
    listContainer.className = 'suggestion-list';
    this.suggestionBox.appendChild(listContainer);
    
    // 카테고리에 속한 명령어 추가
    category.commands.forEach((cmd, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.dataset.index = index;
      item.dataset.value = cmd.id;
      
      // 명령어 그룹 식별
      const commandGroup = cmd.id.split(':')[0].replace(/^[@/]/, '');
      const groupClassName = `command-group-${commandGroup}`;
      item.classList.add(groupClassName);
      
      // 아이콘 문자 결정
      const iconChar = commandGroup === 'git' ? '⎇' :
                       commandGroup === 'jira' ? '⚐' :
                       commandGroup === 'swdp' ? '⚙' :
                       commandGroup === 'pocket' ? '◈' : '▶';
      
      // HTML 생성
      item.innerHTML = `
        <span style="font-weight: bold; margin-right: 8px; min-width: 16px; text-align: center;">${iconChar}</span>
        <span class="suggestion-label">${cmd.label || cmd.id}</span>
        ${cmd.description ? `<span class="suggestion-description">${cmd.description}</span>` : ''}
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
      
      listContainer.appendChild(item);
    });
    
    // 키보드 단축키 힌트 추가
    const keyboardHint = document.createElement('div');
    keyboardHint.className = 'keyboard-hint';
    keyboardHint.innerHTML = `
      <span>이동: <span class="key">↑</span><span class="key">↓</span></span>
      <span>선택: <span class="key">Enter</span></span>
      <span>뒤로: <span class="key">←</span></span>
      <span>닫기: <span class="key">Esc</span></span>
    `;
    this.suggestionBox.appendChild(keyboardHint);
    
    // 활성 항목 초기화
    this.activeIndex = 0;
    this._setActiveItem(0);
  }
  
  /**
   * 이전 화면으로 돌아가기
   */
  _goBack() {
    // 현재 카테고리 제거
    this.navigationHistory.pop();
    
    // 히스토리가 비어있으면 최상위 카테고리로 돌아감
    if (this.navigationHistory.length === 0) {
      // 외부 플러그인 모드인 경우
      if (this.isExternalPlugin) {
        this._showExternalCategories();
      } 
      // 내부 명령어 모드인 경우
      else {
        const tokenInfo = this._getLastToken();
        const lastToken = tokenInfo.token;
        if (lastToken && this.options.triggerCharacters.includes(lastToken.charAt(0))) {
          this._showCategories(lastToken.charAt(0));
        } else {
          this._hideSuggestions();
        }
      }
      return;
    }
    
    // 히스토리의 마지막 카테고리로 이동
    const previousCategory = this.navigationHistory[this.navigationHistory.length - 1];
    this.navigationHistory.pop(); // 중복 방지를 위해 제거
    
    // 외부 플러그인 모드인 경우
    if (this.isExternalPlugin) {
      this._showExternalCommandsInCategory(previousCategory);
    } 
    // 내부 명령어 모드인 경우
    else {
      this._showCommandsInCategory(previousCategory);
    }
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
    this.inputElement.removeEventListener('input', this._handleInput);
    this.inputElement.removeEventListener('keydown', this._handleKeyDown);
    document.removeEventListener('click', this._handleDocumentClick);
    window.removeEventListener('resize', this._handleWindowResize);
    
    // UI 요소 제거
    if (this.popoverContainer && this.popoverContainer.parentNode) {
      this.popoverContainer.parentNode.removeChild(this.popoverContainer);
    } else if (this.suggestionBox && this.suggestionBox.parentNode) {
      this.suggestionBox.parentNode.removeChild(this.suggestionBox);
    }
    
    // 플레이스홀더 제거
    if (this.placeholderElement && this.placeholderElement.parentNode) {
      this.placeholderElement.parentNode.removeChild(this.placeholderElement);
    }
    
    // 트리거 버튼 제거
    if (this.triggerButton && this.triggerButton.parentNode) {
      this.triggerButton.parentNode.removeChild(this.triggerButton);
    }
    
    this.suggestionBox = null;
    this.popoverContainer = null;
    this.placeholderElement = null;
    this.triggerButton = null;
  }
}

// 모듈 내보내기 (브라우저 환경에서)
if (typeof window !== 'undefined') {
  window.CommandAutocomplete = CommandAutocomplete;
}