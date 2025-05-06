/**
 * 통합 모델 선택 컴포넌트
 * 
 * 채팅 인터페이스에서 사용할 모델을 선택하는 컴포넌트입니다.
 * 여러 구현을 하나로 통합하여 명확한 인터페이스를 제공합니다.
 */

class ModelSelector {
  constructor(containerId) {
    // 기본 속성 설정
    this.containerId = containerId;
    this.container = null;
    this.selectedModelId = null;
    this.models = [];
    this.isInitialized = false;
    
    // VS Code API 연결
    try {
      this.vscode = acquireVsCodeApi();
      console.log('[ModelSelector] VS Code API 연결됨');
    } catch (error) {
      console.error('[ModelSelector] VS Code API 연결 실패:', error);
    }
    
    // DOM 로드 확인 및 초기화
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }
  
  /**
   * 선택기 초기화
   */
  initialize() {
    console.log('[ModelSelector] 초기화 시작');
    
    // 컨테이너 찾기 또는 생성
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`[ModelSelector] 컨테이너 요소를 찾을 수 없음: ${this.containerId}`);
      this.createContainer();
    }
    
    // 기본 UI 렌더링
    this.renderInitialUI();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 모델 목록 요청
    this.requestModelList();
    
    // 초기화 완료
    this.isInitialized = true;
    console.log('[ModelSelector] 초기화 완료');
  }
  
  /**
   * 컨테이너 생성
   */
  createContainer() {
    console.log('[ModelSelector] 컨테이너 생성 시도');
    
    // 헤더 요소 찾기
    const header = document.querySelector('.chat-header');
    if (!header) {
      console.error('[ModelSelector] 채팅 헤더를 찾을 수 없어 컨테이너를 생성할 수 없음');
      return;
    }
    
    // 컨테이너 생성
    this.container = document.createElement('div');
    this.container.id = this.containerId;
    this.container.className = 'model-selector';
    
    // 시각적 가시성 강화
    this.container.style.border = '1px solid var(--vscode-button-background)';
    this.container.style.minWidth = '150px';
    
    // 헤더에 추가
    header.appendChild(this.container);
    console.log('[ModelSelector] 컨테이너 생성됨');
  }
  
  /**
   * 초기 UI 렌더링
   */
  renderInitialUI() {
    if (!this.container) return;
    
    // 로딩 상태 표시
    this.container.innerHTML = `
      <div class="model-selector-header">
        <span class="model-selector-title">모델 선택</span>
        <span class="model-selector-icon">▼</span>
      </div>
      <div class="model-selector-dropdown"></div>
    `;
    
    // 요소 참조 저장
    this.header = this.container.querySelector('.model-selector-header');
    this.title = this.container.querySelector('.model-selector-title');
    this.dropdown = this.container.querySelector('.model-selector-dropdown');
    
    console.log('[ModelSelector] 초기 UI 렌더링 완료');
  }
  
  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    console.log('[ModelSelector] 이벤트 리스너 설정 시작');
    
    // 웹뷰 메시지 리스너
    window.addEventListener('message', (event) => {
      const message = event.data;
      
      if (!message || !message.command) return;
      console.log(`[ModelSelector] 메시지 수신: ${message.command}`);
      
      switch (message.command) {
        case 'updateModels':
          if (message.models) {
            console.log(`[ModelSelector] 모델 목록 업데이트: ${message.models.length}개 모델`);
            this.models = message.models;
            this.renderModelList();
          }
          break;
          
        case 'setCurrentModel':
          if (message.modelId) {
            console.log(`[ModelSelector] 현재 모델 설정: ${message.modelId}`);
            this.selectModel(message.modelId, false);
          }
          break;
      }
    });
    
    // 헤더 클릭 이벤트
    if (this.header) {
      this.header.addEventListener('click', () => {
        this.toggleDropdown();
      });
    }
    
    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', (event) => {
      if (this.container && !this.container.contains(event.target)) {
        this.closeDropdown();
      }
    });
    
    console.log('[ModelSelector] 이벤트 리스너 설정 완료');
  }
  
  /**
   * 모델 목록 요청
   */
  requestModelList() {
    console.log('[ModelSelector] 모델 목록 요청 전송');
    
    try {
      // VS Code에 모델 목록 요청
      this.vscode.postMessage({
        command: 'getModelList'
      });
      
      // 시각적 로딩 표시
      if (this.title) {
        this.title.textContent = '모델 로딩 중...';
      }
      
      console.log('[ModelSelector] 모델 목록 요청 전송 완료');
    } catch (error) {
      console.error('[ModelSelector] 모델 목록 요청 전송 실패:', error);
      
      // 오류 표시
      if (this.title) {
        this.title.textContent = '모델 로드 오류';
      }
      
      // 임시 기본 모델 설정
      this.models = [
        { id: 'local-fallback', name: '로컬 모델 (오류)', provider: 'local' }
      ];
      this.renderModelList();
    }
  }
  
  /**
   * 모델 목록 렌더링
   */
  renderModelList() {
    if (!this.dropdown) return;
    
    console.log(`[ModelSelector] 모델 목록 렌더링: ${this.models.length}개 모델`);
    
    // 드롭다운 비우기
    this.dropdown.innerHTML = '';
    
    // 모델이 없는 경우
    if (!this.models || this.models.length === 0) {
      const emptyOption = document.createElement('div');
      emptyOption.className = 'model-option';
      emptyOption.textContent = '사용 가능한 모델이 없습니다';
      this.dropdown.appendChild(emptyOption);
      
      // 타이틀 업데이트
      if (this.title) {
        this.title.textContent = '모델 없음';
      }
      
      return;
    }
    
    // 모델 분류
    const internalModels = this.models.filter(m => 
      m.provider === 'custom' || 
      m.name.includes('내부망') || 
      m.name.includes('NARRANS')
    );
    
    const localModels = this.models.filter(m => 
      m.provider === 'local' || 
      m.name.includes('로컬') || 
      m.name.includes('오프라인')
    );
    
    const openRouterModels = this.models.filter(m => 
      m.provider === 'openrouter'
    );
    
    const otherModels = this.models.filter(m => 
      !internalModels.includes(m) && 
      !localModels.includes(m) && 
      !openRouterModels.includes(m)
    );
    
    // 카테고리 렌더링 함수
    const renderCategory = (title, models) => {
      if (models.length === 0) return;
      
      // 카테고리 헤더 추가
      const header = document.createElement('div');
      header.className = 'model-category-header';
      header.textContent = title;
      this.dropdown.appendChild(header);
      
      // 모델 옵션 추가
      models.forEach(model => {
        const option = document.createElement('div');
        option.className = 'model-option';
        option.dataset.id = model.id;
        option.dataset.provider = model.provider;
        
        if (model.id === this.selectedModelId) {
          option.classList.add('selected');
        }
        
        // 모델 이름 및 제공자 레이블
        let providerLabel = '';
        if (model.provider === 'openrouter') {
          providerLabel = '(OpenRouter)';
        } else if (model.provider === 'custom') {
          providerLabel = '(내부망)';
        } else if (model.provider === 'local') {
          providerLabel = '(로컬)';
        }
        
        option.innerHTML = `
          <div class="model-option-content">
            <span class="model-name">${model.name}</span>
            ${providerLabel ? `<span class="model-provider">${providerLabel}</span>` : ''}
          </div>
        `;
        
        // 클릭 이벤트
        option.addEventListener('click', () => {
          this.selectModel(model.id, true);
        });
        
        this.dropdown.appendChild(option);
      });
    };
    
    // 카테고리별 렌더링 (우선순위 순)
    renderCategory('내부망 모델', internalModels);
    renderCategory('OpenRouter 모델', openRouterModels);
    renderCategory('로컬 모델', localModels);
    renderCategory('기타 모델', otherModels);
    
    // 선택된 모델이 없을 경우 첫 모델 자동 선택
    if (!this.selectedModelId && this.models.length > 0) {
      // 우선순위: 내부망 > OpenRouter > 로컬 > 기타
      let modelToSelect = null;
      
      if (internalModels.length > 0) {
        modelToSelect = internalModels[0];
      } else if (openRouterModels.length > 0) {
        modelToSelect = openRouterModels[0];
      } else if (localModels.length > 0) {
        modelToSelect = localModels[0];
      } else {
        modelToSelect = this.models[0];
      }
      
      if (modelToSelect) {
        this.selectModel(modelToSelect.id, true);
      }
    } else {
      // 이미 선택된 모델이 있으면 표시 업데이트
      this.updateSelectedModelDisplay();
    }
    
    console.log('[ModelSelector] 모델 목록 렌더링 완료');
  }
  
  /**
   * 모델 선택
   */
  selectModel(modelId, notifyExtension = true) {
    if (!modelId) return;
    
    console.log(`[ModelSelector] 모델 선택: ${modelId}, 알림=${notifyExtension}`);
    
    // 같은 모델이 이미 선택된 경우
    if (this.selectedModelId === modelId) {
      this.closeDropdown();
      return;
    }
    
    // 새 모델 선택
    this.selectedModelId = modelId;
    
    // UI 업데이트
    if (this.dropdown) {
      const options = this.dropdown.querySelectorAll('.model-option');
      options.forEach(option => {
        if (option.dataset.id === modelId) {
          option.classList.add('selected');
        } else {
          option.classList.remove('selected');
        }
      });
    }
    
    // 선택된 모델 표시 업데이트
    this.updateSelectedModelDisplay();
    
    // 드롭다운 닫기
    this.closeDropdown();
    
    // VS Code에 모델 변경 알림
    if (notifyExtension) {
      try {
        this.vscode.postMessage({
          command: 'changeModel',
          model: modelId
        });
        console.log(`[ModelSelector] 모델 변경 알림 전송: ${modelId}`);
        
        // 채팅 입력창 모델 정보 업데이트
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
          chatInput.dataset.model = modelId;
        }
      } catch (error) {
        console.error('[ModelSelector] 모델 변경 알림 전송 실패:', error);
      }
    }
  }
  
  /**
   * 선택된 모델 표시 업데이트
   */
  updateSelectedModelDisplay() {
    if (!this.title) return;
    
    if (!this.selectedModelId) {
      this.title.textContent = '모델 선택';
      return;
    }
    
    // 선택된 모델 찾기
    const selectedModel = this.models.find(model => model.id === this.selectedModelId);
    if (selectedModel) {
      this.title.textContent = selectedModel.name;
    } else {
      this.title.textContent = this.selectedModelId;
    }
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
    if (!this.dropdown) return;
    this.dropdown.classList.add('open');
    
    // 아이콘 회전
    const icon = this.container.querySelector('.model-selector-icon');
    if (icon) {
      icon.textContent = '▲';
    }
  }
  
  /**
   * 드롭다운 닫기
   */
  closeDropdown() {
    if (!this.dropdown) return;
    this.dropdown.classList.remove('open');
    
    // 아이콘 회전
    const icon = this.container.querySelector('.model-selector-icon');
    if (icon) {
      icon.textContent = '▼';
    }
  }
  
  /**
   * 드롭다운 상태 확인
   */
  isDropdownOpen() {
    return this.dropdown && this.dropdown.classList.contains('open');
  }
  
  /**
   * 현재 선택된 모델 ID 가져오기
   */
  getCurrentModelId() {
    return this.selectedModelId;
  }
}

// DOM 로드 완료 후 모델 선택기 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('모델 선택기 초기화 시작');
  window.modelSelector = new ModelSelector('modelSelector');
});