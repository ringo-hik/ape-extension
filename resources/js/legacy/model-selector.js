/**
 * 모델 선택 컴포넌트
 * 
 * 채팅 인터페이스에서 사용할 모델을 선택하는 커스텀 드롭다운 컴포넌트입니다.
 * 모델 목록을 표시하고 선택한 모델 정보를 변경 이벤트로 전달합니다.
 */
class ModelSelector {
  constructor(containerId, options = {}) {
    // 디버깅 메시지
    console.log('ModelSelector 초기화 시작:', containerId);
    console.log('제공된 옵션:', JSON.stringify(options));
    
    // 옵션 저장 (DOM 요소가 없어도 나중에 초기화할 수 있도록)
    this.containerId = containerId;
    this.options = options;
    
    // DOM 로드 이벤트 완료 확인
    if (document.readyState === 'loading') {
      // DOM이 아직 로드 중인 경우, DOMContentLoaded 이벤트 기다림
      document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded 이벤트 발생, 모델 선택기 초기화 시도');
        this.initializeAfterDomReady();
      });
    } else {
      // DOM이 이미 로드된 경우, 바로 초기화 시도
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
      // 지연 초기화 시도 (DOM이 완전히 로드되지 않았을 수 있음)
      setTimeout(() => {
        this.container = document.getElementById(this.containerId);
        if (this.container) {
          console.log('지연 초기화로 모델 선택기 컨테이너를 찾았습니다.');
          this.initialize(this.options);
        } else {
          console.error('지연 초기화 후에도 모델 선택기 컨테이너를 찾을 수 없습니다.');
          this.createFallbackContainer(this.containerId);
        }
      }, 1000); // 1초 후 재시도
      return;
    }
    
    this.initialize(this.options);
  }
  
  /**
   * 선택기 초기화 로직
   */
  initialize(options) {
    this.options = {
      onChange: () => {},
      models: [],
      defaultModelId: null,
      ...options
    };
    
    this.selectedModelId = this.options.defaultModelId;
    console.log('선택된 기본 모델 ID:', this.selectedModelId);
    
    // 임시 로딩 상태 표시
    this.container.innerHTML = `
      <div class="model-selector-header">
        <span class="model-selector-title">모델 로딩 중...</span>
        <span class="model-selector-icon"></span>
      </div>
    `;
    
    this.render();
    this.bindEvents();
    
    // 디버깅: 설정된 모델 목록 출력
    if (this.options.models && this.options.models.length > 0) {
      console.log(`ModelSelector: 설정된 모델 ${this.options.models.length}개 초기화 완료`);
      this.options.models.forEach((model, idx) => {
        console.log(`Model ${idx+1}: ID=${model.id}, Name=${model.name}, Provider=${model.provider}`);
      });
    } else {
      console.warn('ModelSelector: 설정된 모델이 없습니다');
    }
    
    console.log('ModelSelector 초기화 완료');
  }
  
  /**
   * 컨테이너가 없을 경우 동적 생성
   */
  createFallbackContainer(containerId) {
    console.log('모델 선택기용 폴백 컨테이너 생성 시도');
    
    // 헤더 요소 찾기
    const header = document.querySelector('.chat-header');
    if (!header) {
      console.error('채팅 헤더 요소를 찾을 수 없어 폴백 컨테이너를 생성할 수 없습니다.');
      return;
    }
    
    // 컨테이너 생성
    this.container = document.createElement('div');
    this.container.id = containerId;
    this.container.className = 'model-selector';
    
    // 헤더에 추가
    header.appendChild(this.container);
    console.log('폴백 컨테이너가 생성되었습니다:', containerId);
    
    // 초기화 진행
    this.initialize(this.options);
  }
  
  /**
   * 컴포넌트 렌더링
   */
  render() {
    // 컨테이너 비우기
    this.container.innerHTML = '';
    
    // 기본 구조 생성 (아이콘 텍스트 추가)
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
    
    // 컨테이너 초기 스타일 설정
    this.container.style.display = 'inline-block';
    
    // 헤더에 "모델 선택" 힌트 추가
    this.header.setAttribute('title', '클릭하여 모델 선택');
  }
  
  /**
   * 이벤트 바인딩
   */
  bindEvents() {
    if (!this.header) {
      console.error('모델 선택기 헤더 요소를 찾을 수 없습니다.');
      return;
    }
    
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
  updateModels(models) {
    console.log('모델 목록 업데이트 시작');
    
    if (!this.dropdown) {
      console.error('드롭다운 요소를 찾을 수 없습니다.');
      return;
    }
    
    // 드롭다운 비우기
    this.dropdown.innerHTML = '';
    
    // 모델이 없는 경우
    if (!models || models.length === 0) {
      console.log('사용 가능한 모델이 없습니다.');
      const emptyOption = document.createElement('div');
      emptyOption.className = 'model-option';
      emptyOption.textContent = '사용 가능한 모델이 없습니다';
      this.dropdown.appendChild(emptyOption);
      
      // 로딩 중 메시지로 타이틀 변경
      if (this.title) {
        this.title.textContent = '모델 로드 오류';
      }
      return;
    }
    
    console.log(`${models.length}개의 모델 옵션 추가 중...`);
    
    // 모델 ID가 정의되지 않은 경우 처리 (수정)
    models = models.map((model, index) => {
      if (!model.id && model.name) {
        // ID가 없지만 이름이 있는 경우 이름으로 ID 생성
        const generatedId = `model-${model.provider || 'unknown'}-${index}`;
        console.log(`모델 ID 생성: ${model.name} → ${generatedId}`);
        return {
          ...model,
          id: generatedId
        };
      }
      return model;
    });
    
    // 모델 정보 디버그 로깅
    models.forEach((model, index) => {
      console.log(`모델 ${index + 1}: ID=${model.id || '없음'}, 이름=${model.name || '이름 없음'}, 제공자=${model.provider || '알 수 없음'}`);
    });
    
    // 모델 카테고리 분류
    const internalModels = models.filter(model => 
      model.provider === 'custom' || 
      model.name.includes('내부망') || 
      model.name.includes('NARRANS')
    );
    
    const openRouterModels = models.filter(model => model.provider === 'openrouter');
    const localModels = models.filter(model => 
      model.provider === 'local' || 
      model.name.includes('로컬') || 
      model.name.includes('오프라인')
    );
    
    const otherModels = models.filter(model => 
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
        // null 또는 빈 ID/이름 방어
        if (!model.id || !model.name) {
          console.warn('유효하지 않은 모델 정보 스킵:', model);
          return;
        }
        
        const option = document.createElement('div');
        option.className = 'model-option';
        if (model.id === this.selectedModelId) {
          option.classList.add('selected');
        }
        
        // 메인 텍스트 컨테이너
        const textContainer = document.createElement('div');
        textContainer.style.display = 'flex';
        textContainer.style.justifyContent = 'space-between';
        textContainer.style.width = '100%';
        
        // 모델 이름
        const nameSpan = document.createElement('span');
        nameSpan.textContent = model.name;
        textContainer.appendChild(nameSpan);
        
        // 모델 제공자에 따른 라벨 추가
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
        option.dataset.id = model.id;
        
        console.log(`모델 옵션 추가: ${model.id} (${model.name}) - ${model.provider || '알 수 없음'}`);
        
        // 옵션 클릭 이벤트
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
    
    // 모델이 있지만 선택된 모델이 없는 경우 선택 우선순위 결정
    if (models.length > 0 && !this.selectedModelId) {
      // 우선순위: 내부망 > OpenRouter > 로컬 > 기타
      let modelToSelect = null;
      
      if (internalModels.length > 0) {
        modelToSelect = internalModels[0];
        console.log('내부망 모델을 기본으로 선택합니다:', modelToSelect.id);
      } else if (openRouterModels.length > 0) {
        modelToSelect = openRouterModels[0];
        console.log('OpenRouter 모델을 기본으로 선택합니다:', modelToSelect.id);
      } else if (localModels.length > 0) {
        modelToSelect = localModels[0];
        console.log('로컬 모델을 기본으로 선택합니다:', modelToSelect.id);
      } else if (otherModels.length > 0) {
        modelToSelect = otherModels[0];
        console.log('기타 모델을 기본으로 선택합니다:', modelToSelect.id);
      } else {
        modelToSelect = models[0];
        console.log('첫 번째 모델을 기본으로 선택합니다:', modelToSelect.id);
      }
      
      if (modelToSelect) {
        this.selectModel(modelToSelect.id);
      }
    } else {
      // 선택된 모델 표시 업데이트
      this.updateSelectedModelDisplay();
    }
    
    console.log('모델 목록 업데이트 완료');
  }
  
  /**
   * 모델 선택
   */
  selectModel(modelId) {
    if (!modelId) {
      console.warn('유효하지 않은 모델 ID:', modelId);
      return;
    }
    
    // 이미 같은 모델이 선택된 경우
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
    
    // 변경 이벤트 발생
    if (typeof this.options.onChange === 'function') {
      this.options.onChange(modelId);
    }
  }
  
  /**
   * 선택된 모델 표시 업데이트
   */
  updateSelectedModelDisplay() {
    if (!this.title) {
      console.warn('모델 이름을 표시할 타이틀 요소를 찾을 수 없습니다.');
      return;
    }
    
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
    
    // 모델 목록이 없거나 비어있는 경우
    if (!this.options.models || this.options.models.length === 0) {
      console.warn('모델 목록이 비어있어 모델을 선택할 수 없습니다.');
      this.selectedModelId = modelId; // 모델이 로드되면 나중에 선택하기 위해 ID 저장
      
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
      console.warn(`ID가 "${modelId}"인 모델이 목록에 없습니다. 기본 모델을 선택합니다.`);
      
      // 첫 번째 모델 선택
      if (this.options.models.length > 0) {
        this.selectModel(this.options.models[0].id);
      }
    }
  }
}