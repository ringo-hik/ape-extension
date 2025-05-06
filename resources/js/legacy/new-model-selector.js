/**
 * 개선된 모델 선택 컴포넌트
 * 
 * 채팅 인터페이스에서 사용할 모델을 선택하는 커스텀 드롭다운 컴포넌트입니다.
 * package.json 설정을 기반으로 모델 목록을 표시하고 선택한 모델 정보를 VS Code 설정과 연동합니다.
 */
class ModelSelector {
  constructor(containerId, options = {}) {
    // 기본 설정
    this.containerId = containerId;
    this.options = {
      onChange: () => {},
      models: [],
      defaultModelId: null,
      ...options
    };
    
    this.selectedModelId = this.options.defaultModelId;
    this.isInitialized = false;
    
    // VS Code API 연결
    this.vscode = acquireVsCodeApi();
    
    // DOM 로드 완료 후 초기화
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeAfterDomReady());
    } else {
      this.initializeAfterDomReady();
    }
  }
  
  /**
   * DOM 로드 후 초기화
   */
  initializeAfterDomReady() {
    this.container = document.getElementById(this.containerId);
    
    if (!this.container) {
      console.error(`모델 선택기 컨테이너를 찾을 수 없습니다: ${this.containerId}`);
      // 지연 초기화 시도
      setTimeout(() => {
        this.container = document.getElementById(this.containerId);
        if (this.container) {
          console.log('지연 초기화로 모델 선택기 컨테이너를 찾았습니다.');
          this.initialize();
        } else {
          console.error('지연 초기화 후에도 모델 선택기 컨테이너를 찾을 수 없습니다.');
          this.createFallbackContainer();
        }
      }, 500);
      return;
    }
    
    this.initialize();
  }
  
  /**
   * 선택기 초기화 로직
   */
  initialize() {
    // 로딩 상태 표시
    this.container.innerHTML = `
      <div class="model-selector-header">
        <span class="model-selector-title">모델 로딩 중...</span>
        <span class="model-selector-icon"></span>
      </div>
    `;
    
    // 이벤트 리스너 설정
    this.setupMessageListeners();
    
    // 기본 UI 렌더링
    this.render();
    this.bindEvents();
    
    // 초기화 완료
    this.isInitialized = true;
    console.log('ModelSelector 초기화 완료');
    
    // 모델 목록 요청
    this.requestModelList();
  }
  
  /**
   * 메시지 리스너 설정
   */
  setupMessageListeners() {
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        case 'updateModels':
          console.log(`모델 목록 업데이트 메시지 수신: ${message.models.length}개 모델`);
          this.options.models = message.models;
          this.updateModels(message.models);
          break;
          
        case 'setCurrentModel':
          console.log(`현재 모델 설정 메시지 수신: ${message.modelId}`);
          this.setModelById(message.modelId);
          break;
      }
    });
  }
  
  /**
   * 모델 목록 요청
   */
  requestModelList() {
    // VS Code 확장에 모델 목록 요청
    console.log('VS Code에 모델 목록 요청 중...');
    this.vscode.postMessage({
      command: 'getModelList'
    });
  }
  
  /**
   * 컨테이너가 없을 경우 동적 생성
   */
  createFallbackContainer() {
    // 헤더 요소 찾기
    const header = document.querySelector('.chat-header');
    if (!header) {
      console.error('채팅 헤더 요소를 찾을 수 없어 폴백 컨테이너를 생성할 수 없습니다.');
      return;
    }
    
    // 컨테이너 생성
    this.container = document.createElement('div');
    this.container.id = this.containerId;
    this.container.className = 'model-selector';
    
    // 헤더에 추가
    header.appendChild(this.container);
    console.log('폴백 컨테이너가 생성되었습니다:', this.containerId);
    
    // 초기화 진행
    this.initialize();
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
    
    // 컨테이너 스타일 설정
    this.container.style.display = 'inline-block';
    
    // 헤더에 힌트 추가
    this.header.setAttribute('title', '클릭하여 모델 선택');
    
    // 모델 목록 업데이트 (초기 모델 목록이 있는 경우)
    if (this.options.models && this.options.models.length > 0) {
      this.updateModels(this.options.models);
    }
  }
  
  /**
   * 이벤트 바인딩
   */
  bindEvents() {
    if (!this.header) return;
    
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
    if (!this.dropdown || !this.icon) return;
    
    this.dropdown.classList.add('open');
    this.icon.classList.add('open');
  }
  
  /**
   * 드롭다운 닫기
   */
  closeDropdown() {
    if (!this.dropdown || !this.icon) return;
    
    this.dropdown.classList.remove('open');
    this.icon.classList.remove('open');
  }
  
  /**
   * 드롭다운 상태 확인
   */
  isDropdownOpen() {
    return this.dropdown && this.dropdown.classList.contains('open');
  }
  
  /**
   * 모델 목록 업데이트
   */
  updateModels(models = []) {
    if (!this.dropdown) return;
    
    // 드롭다운 비우기
    this.dropdown.innerHTML = '';
    
    // 모델 없는 경우 메시지 표시
    if (!models || models.length === 0) {
      const emptyOption = document.createElement('div');
      emptyOption.className = 'model-option empty';
      emptyOption.textContent = '사용 가능한 모델이 없습니다';
      this.dropdown.appendChild(emptyOption);
      
      // 타이틀 변경
      if (this.title) {
        this.title.textContent = '모델 로드 오류';
      }
      return;
    }
    
    // 모델 ID 검증
    const validModels = models.map((model, index) => {
      // 모델 ID가 없는 경우 자동 생성
      if (!model.id) {
        const generatedId = `model-${model.provider || 'unknown'}-${index}`;
        console.log(`모델 ID 생성: ${model.name} → ${generatedId}`);
        return { ...model, id: generatedId };
      }
      return model;
    });
    
    // 모델 카테고리 분류
    const internalModels = validModels.filter(model => 
      model.provider === 'custom' || 
      model.name.includes('내부망') || 
      model.name.includes('NARRANS')
    );
    
    const openRouterModels = validModels.filter(model => 
      model.provider === 'openrouter'
    );
    
    const localModels = validModels.filter(model => 
      model.provider === 'local' || 
      model.name.includes('로컬') || 
      model.name.includes('오프라인')
    );
    
    const otherModels = validModels.filter(model => 
      !internalModels.includes(model) && 
      !openRouterModels.includes(model) && 
      !localModels.includes(model)
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
        if (!model.id || !model.name) return;
        
        const option = document.createElement('div');
        option.className = 'model-option';
        option.dataset.id = model.id;
        
        if (model.id === this.selectedModelId) {
          option.classList.add('selected');
        }
        
        // 텍스트 컨테이너
        const textContainer = document.createElement('div');
        textContainer.className = 'model-option-content';
        textContainer.style.display = 'flex';
        textContainer.style.justifyContent = 'space-between';
        textContainer.style.width = '100%';
        
        // 모델 이름
        const nameSpan = document.createElement('span');
        nameSpan.className = 'model-name';
        nameSpan.textContent = model.name;
        textContainer.appendChild(nameSpan);
        
        // 모델 제공자 라벨
        let providerLabel = '';
        if (model.provider === 'openrouter') {
          providerLabel = '(OpenRouter)';
        } else if (model.provider === 'custom') {
          providerLabel = '(내부망)';
        } else if (model.provider === 'local') {
          providerLabel = '(로컬)';
        }
        
        if (providerLabel) {
          const providerSpan = document.createElement('span');
          providerSpan.className = 'model-provider';
          providerSpan.textContent = providerLabel;
          textContainer.appendChild(providerSpan);
        }
        
        option.appendChild(textContainer);
        
        // 클릭 이벤트
        option.addEventListener('click', () => {
          this.selectModel(model.id);
        });
        
        this.dropdown.appendChild(option);
      });
    };
    
    // 내부망 모델 (최우선 순위)
    if (internalModels.length > 0) {
      addCategoryHeader('내부망 모델');
      addModelOptions(internalModels);
    }
    
    // OpenRouter 모델
    if (openRouterModels.length > 0) {
      addCategoryHeader('OpenRouter 모델');
      addModelOptions(openRouterModels);
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
    
    // 선택된 모델이 없는 경우 자동 선택
    if (!this.selectedModelId && validModels.length > 0) {
      // 우선순위: 내부망 > OpenRouter > 로컬 > 기타
      let modelToSelect = null;
      
      if (internalModels.length > 0) {
        modelToSelect = internalModels[0];
      } else if (openRouterModels.length > 0) {
        modelToSelect = openRouterModels[0];
      } else if (localModels.length > 0) {
        modelToSelect = localModels[0];
      } else {
        modelToSelect = validModels[0];
      }
      
      if (modelToSelect) {
        this.selectModel(modelToSelect.id);
      }
    } else {
      // 이미 선택된 모델이 있으면 표시 업데이트
      this.updateSelectedModelDisplay();
    }
  }
  
  /**
   * 모델 선택
   */
  selectModel(modelId) {
    if (!modelId) return;
    
    // 같은 모델이 이미 선택된 경우
    if (this.selectedModelId === modelId) {
      this.closeDropdown();
      return;
    }
    
    // 새 모델 선택
    this.selectedModelId = modelId;
    console.log(`모델 선택됨: ${modelId}`);
    
    // 선택된 옵션 표시 업데이트
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
    
    // VS Code 확장에 모델 변경 알림
    this.vscode.postMessage({
      command: 'changeModel',
      model: modelId
    });
    
    // 변경 이벤트 발생
    if (typeof this.options.onChange === 'function') {
      this.options.onChange(modelId);
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
    const selectedModel = this.options.models.find(model => model.id === this.selectedModelId);
    if (selectedModel) {
      this.title.textContent = selectedModel.name;
    } else {
      this.title.textContent = this.selectedModelId;
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
    if (!modelId) {
      console.warn('빈 모델 ID로 setModelById 호출됨');
      return;
    }
    
    // 모델 목록이 없는 경우
    if (!this.options.models || this.options.models.length === 0) {
      console.log(`모델 목록이 비어있어 ID를 저장만 함: ${modelId}`);
      this.selectedModelId = modelId;
      
      if (this.title) {
        this.title.textContent = `ID: ${modelId}`;
      }
      return;
    }
    
    // 존재하는 모델인지 확인
    const modelExists = this.options.models.some(model => model.id === modelId);
    if (modelExists) {
      this.selectModel(modelId);
    } else {
      console.warn(`ID가 "${modelId}"인 모델이 목록에 없습니다. (목록에 ${this.options.models.length}개 모델 있음)`);
      
      // ID가 미리 생성되었을 수 있으므로 이름으로 찾아보기
      let found = false;
      for (const model of this.options.models) {
        // ID가 모델 이름 또는 제공자 정보를 포함하는지 확인
        const modelNameFormatted = model.name.toLowerCase().replace(/\s+/g, '-');
        if (modelId.includes(modelNameFormatted) || 
            (model.provider && modelId.includes(model.provider))) {
          console.log(`유사한 모델을 찾았습니다: ${model.id} (${model.name})`);
          this.selectModel(model.id);
          found = true;
          break;
        }
      }
      
      // 유사한 모델도 찾지 못한 경우 첫 번째 모델 선택
      if (!found && this.options.models.length > 0) {
        console.log(`일치하는 모델을 찾지 못해 첫 번째 모델 선택: ${this.options.models[0].id}`);
        this.selectModel(this.options.models[0].id);
      }
    }
  }
}

// 모델 선택기 초기화 (DOM 로드 완료 후)
document.addEventListener('DOMContentLoaded', () => {
  window.modelSelector = new ModelSelector('modelSelector', {
    onChange: (modelId) => {
      console.log(`모델 변경: ${modelId}`);
      
      // 채팅 입력창 모델 정보 업데이트
      const chatInput = document.getElementById('chatInput');
      if (chatInput) {
        chatInput.dataset.model = modelId;
      }
      
      // VS Code 확장에 변경사항 알림 (2중 알림 방지를 위해 제거)
      // vscode.postMessage 방식은 selectModel 메서드 내에서 이미 처리함
    }
  });
});