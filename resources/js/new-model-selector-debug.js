/**
 * 개선된 모델 선택 컴포넌트 (디버그 버전)
 * 
 * 채팅 인터페이스에서 사용할 모델을 선택하는 커스텀 드롭다운 컴포넌트입니다.
 * package.json 설정을 기반으로 모델 목록을 표시하고 선택한 모델 정보를 VS Code 설정과 연동합니다.
 * 
 * 이 파일은 디버그 로그가 강화된 버전입니다.
 */
class ModelSelector {
  constructor(containerId, options = {}) {
    // 디버그 로그
    console.log(`[ModelSelector] 초기화 시작: containerId=${containerId}`);
    console.log(`[ModelSelector] 제공된 옵션:`, JSON.stringify(options, null, 2));
    
    // 기본 설정
    this.containerId = containerId;
    this.options = {
      onChange: () => {
        console.log('[ModelSelector] onChange 기본 핸들러 호출됨');
      },
      models: [],
      defaultModelId: null,
      ...options
    };
    
    this.selectedModelId = this.options.defaultModelId;
    this.isInitialized = false;
    
    // VS Code API 연결
    try {
      this.vscode = acquireVsCodeApi();
      console.log('[ModelSelector] VS Code API 연결 성공');
    } catch (error) {
      console.error('[ModelSelector] VS Code API 연결 실패:', error);
    }
    
    // DOM 로드 완료 후 초기화
    if (document.readyState === 'loading') {
      console.log('[ModelSelector] 문서가 로드 중이므로 DOMContentLoaded 이벤트 등록');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[ModelSelector] DOMContentLoaded 이벤트 발생, 초기화 시작');
        this.initializeAfterDomReady();
      });
    } else {
      console.log('[ModelSelector] 문서가 이미 로드되어 있어 즉시 초기화 시작');
      this.initializeAfterDomReady();
    }
  }
  
  /**
   * DOM 로드 후 초기화
   */
  initializeAfterDomReady() {
    console.log(`[ModelSelector] DOM 로드 후 초기화 시작`);
    this.container = document.getElementById(this.containerId);
    
    if (!this.container) {
      console.error(`[ModelSelector] 컨테이너를 찾을 수 없음: ${this.containerId}`);
      
      // 지연 초기화 시도
      console.log('[ModelSelector] 지연 초기화 시도 예약 (500ms)');
      setTimeout(() => {
        this.container = document.getElementById(this.containerId);
        if (this.container) {
          console.log('[ModelSelector] 지연 초기화 성공: 컨테이너 발견');
          this.initialize();
        } else {
          console.error('[ModelSelector] 지연 초기화 실패: 컨테이너를 여전히 찾을 수 없음');
          console.log('[ModelSelector] 폴백 컨테이너 생성 시도');
          this.createFallbackContainer();
        }
      }, 500);
      return;
    }
    
    console.log('[ModelSelector] 컨테이너 발견, 초기화 진행');
    this.initialize();
  }
  
  /**
   * 선택기 초기화 로직
   */
  initialize() {
    console.log('[ModelSelector] 초기화 메서드 호출됨');
    
    // 로딩 상태 표시
    this.container.innerHTML = `
      <div class="model-selector-header">
        <span class="model-selector-title">모델 로딩 중...</span>
        <span class="model-selector-icon"></span>
      </div>
    `;
    
    // 이벤트 리스너 설정
    console.log('[ModelSelector] 메시지 리스너 설정');
    this.setupMessageListeners();
    
    // 기본 UI 렌더링
    console.log('[ModelSelector] UI 렌더링 시작');
    this.render();
    
    console.log('[ModelSelector] 이벤트 바인딩 시작');
    this.bindEvents();
    
    // 초기화 완료
    this.isInitialized = true;
    console.log('[ModelSelector] 초기화 완료, 상태:', {
      isInitialized: this.isInitialized,
      containerId: this.containerId,
      selectedModelId: this.selectedModelId,
      modelCount: this.options.models?.length || 0
    });
    
    // 모델 목록 요청
    console.log('[ModelSelector] 모델 목록 요청 전송');
    this.requestModelList();
  }
  
  /**
   * 메시지 리스너 설정
   */
  setupMessageListeners() {
    console.log('[ModelSelector] 메시지 리스너 설정 시작');
    window.addEventListener('message', event => {
      const message = event.data;
      console.log(`[ModelSelector] 메시지 수신: ${message.command}`);
      
      switch (message.command) {
        case 'updateModels':
          console.log(`[ModelSelector] 모델 목록 업데이트 메시지 수신: ${message.models?.length || 0}개 모델`);
          if (message.models && message.models.length > 0) {
            message.models.forEach((model, idx) => {
              console.log(`[ModelSelector] 모델 ${idx+1}: id=${model.id}, name=${model.name}, provider=${model.provider || '없음'}`);
            });
          } else {
            console.warn('[ModelSelector] 빈 모델 목록 또는 잘못된 형식의 모델 목록');
          }
          
          this.options.models = message.models || [];
          this.updateModels(message.models);
          break;
          
        case 'setCurrentModel':
          console.log(`[ModelSelector] 현재 모델 설정 메시지 수신: ${message.modelId}`);
          this.setModelById(message.modelId);
          break;
          
        default:
          console.log(`[ModelSelector] 처리되지 않은 메시지 명령: ${message.command}`);
      }
    });
    console.log('[ModelSelector] 메시지 리스너 설정 완료');
  }
  
  /**
   * 모델 목록 요청
   */
  requestModelList() {
    // VS Code 확장에 모델 목록 요청
    console.log('[ModelSelector] VS Code에 모델 목록 요청 전송');
    try {
      this.vscode.postMessage({
        command: 'getModelList'
      });
      console.log('[ModelSelector] 모델 목록 요청 전송 성공');
    } catch (error) {
      console.error('[ModelSelector] 모델 목록 요청 전송 실패:', error);
    }
  }
  
  /**
   * 컨테이너가 없을 경우 동적 생성
   */
  createFallbackContainer() {
    console.log('[ModelSelector] 폴백 컨테이너 생성 시작');
    
    // 헤더 요소 찾기
    const header = document.querySelector('.chat-header');
    if (!header) {
      console.error('[ModelSelector] 채팅 헤더 요소를 찾을 수 없어 폴백 컨테이너를 생성할 수 없음');
      return;
    }
    
    // 컨테이너 생성
    this.container = document.createElement('div');
    this.container.id = this.containerId;
    this.container.className = 'model-selector';
    
    // 스타일 강조
    this.container.style.border = '2px solid #0078D4';
    this.container.style.boxShadow = '0 0 5px rgba(0, 120, 212, 0.5)';
    
    // 헤더에 추가
    header.appendChild(this.container);
    console.log('[ModelSelector] 폴백 컨테이너 생성 성공:', this.containerId);
    
    // 초기화 진행
    this.initialize();
  }
  
  /**
   * 컴포넌트 렌더링
   */
  render() {
    console.log('[ModelSelector] 렌더링 시작');
    
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
      console.log(`[ModelSelector] 초기 모델 목록 있음: ${this.options.models.length}개`);
      this.updateModels(this.options.models);
    } else {
      console.log('[ModelSelector] 초기 모델 목록 없음');
    }
    
    console.log('[ModelSelector] 렌더링 완료');
  }
  
  /**
   * 이벤트 바인딩
   */
  bindEvents() {
    console.log('[ModelSelector] 이벤트 바인딩 시작');
    
    if (!this.header) {
      console.error('[ModelSelector] 헤더 요소를 찾을 수 없어 이벤트를 바인딩할 수 없음');
      return;
    }
    
    // 헤더 클릭시 드롭다운 토글
    this.header.addEventListener('click', (event) => {
      console.log('[ModelSelector] 헤더 클릭됨, 드롭다운 토글');
      event.stopPropagation(); // 이벤트 전파 중지
      this.toggleDropdown();
    });
    
    // 외부 클릭시 드롭다운 닫기
    document.addEventListener('click', (event) => {
      if (!this.container.contains(event.target)) {
        if (this.isDropdownOpen()) {
          console.log('[ModelSelector] 외부 클릭 감지, 드롭다운 닫기');
          this.closeDropdown();
        }
      }
    });
    
    // ESC 키 누르면 드롭다운 닫기
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isDropdownOpen()) {
        console.log('[ModelSelector] ESC 키 감지, 드롭다운 닫기');
        this.closeDropdown();
      }
    });
    
    console.log('[ModelSelector] 이벤트 바인딩 완료');
  }
  
  /**
   * 드롭다운 토글
   */
  toggleDropdown() {
    console.log('[ModelSelector] 드롭다운 토글 요청');
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
    console.log('[ModelSelector] 드롭다운 열기');
    if (!this.dropdown || !this.icon) {
      console.error('[ModelSelector] 드롭다운 또는 아이콘 요소 없음');
      return;
    }
    
    this.dropdown.classList.add('open');
    this.icon.classList.add('open');
    
    // DOM에 변경사항이 적용되었는지 확인
    console.log(`[ModelSelector] 드롭다운 상태: ${this.dropdown.classList.contains('open') ? '열림' : '닫힘'}`);
    
    // 시각적 피드백 강화 (디버그용)
    this.dropdown.style.border = '2px solid #0078D4';
    this.dropdown.style.boxShadow = '0 0 8px rgba(0, 120, 212, 0.7)';
  }
  
  /**
   * 드롭다운 닫기
   */
  closeDropdown() {
    console.log('[ModelSelector] 드롭다운 닫기');
    if (!this.dropdown || !this.icon) {
      console.error('[ModelSelector] 드롭다운 또는 아이콘 요소 없음');
      return;
    }
    
    this.dropdown.classList.remove('open');
    this.icon.classList.remove('open');
    
    // 시각적 피드백 제거
    this.dropdown.style.border = '';
    this.dropdown.style.boxShadow = '';
    
    console.log(`[ModelSelector] 드롭다운 상태: ${this.dropdown.classList.contains('open') ? '열림' : '닫힘'}`);
  }
  
  /**
   * 드롭다운 상태 확인
   */
  isDropdownOpen() {
    const isOpen = this.dropdown && this.dropdown.classList.contains('open');
    return isOpen;
  }
  
  /**
   * 모델 목록 업데이트
   */
  updateModels(models = []) {
    console.log(`[ModelSelector] 모델 목록 업데이트 시작: ${models?.length || 0}개 모델`);
    
    if (!this.dropdown) {
      console.error('[ModelSelector] 드롭다운 요소를 찾을 수 없음');
      return;
    }
    
    // 드롭다운 비우기
    this.dropdown.innerHTML = '';
    
    // 모델 없는 경우 메시지 표시
    if (!models || models.length === 0) {
      console.warn('[ModelSelector] 모델 목록이 비어있음, 비어있음 메시지 표시');
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
        console.log(`[ModelSelector] 모델 ID 생성: ${model.name} → ${generatedId}`);
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
    
    console.log(`[ModelSelector] 모델 분류: 내부망=${internalModels.length}, OpenRouter=${openRouterModels.length}, 로컬=${localModels.length}, 기타=${otherModels.length}`);
    
    // 카테고리별 헤더 및 모델 추가 함수
    const addCategoryHeader = (title) => {
      const header = document.createElement('div');
      header.className = 'model-category-header';
      header.textContent = title;
      this.dropdown.appendChild(header);
      console.log(`[ModelSelector] 카테고리 헤더 추가: ${title}`);
    };
    
    const addModelOptions = (categoryModels) => {
      categoryModels.forEach(model => {
        if (!model.id || !model.name) {
          console.warn(`[ModelSelector] 유효하지 않은 모델 정보 무시: id=${model.id}, name=${model.name}`);
          return;
        }
        
        const option = document.createElement('div');
        option.className = 'model-option';
        option.dataset.id = model.id;
        
        if (model.id === this.selectedModelId) {
          option.classList.add('selected');
          console.log(`[ModelSelector] 모델 옵션 선택됨: ${model.id}`);
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
        option.addEventListener('click', (event) => {
          console.log(`[ModelSelector] 모델 옵션 클릭됨: ${model.id} (${model.name})`);
          event.stopPropagation(); // 이벤트 전파 중지
          this.selectModel(model.id);
        });
        
        this.dropdown.appendChild(option);
        console.log(`[ModelSelector] 모델 옵션 추가됨: ${model.id} (${model.name})`);
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
      console.log('[ModelSelector] 선택된 모델이 없어 자동 선택 수행');
      
      // 우선순위: 내부망 > OpenRouter > 로컬 > 기타
      let modelToSelect = null;
      
      if (internalModels.length > 0) {
        modelToSelect = internalModels[0];
        console.log(`[ModelSelector] 내부망 모델을 기본으로 선택: ${modelToSelect.id}`);
      } else if (openRouterModels.length > 0) {
        modelToSelect = openRouterModels[0];
        console.log(`[ModelSelector] OpenRouter 모델을 기본으로 선택: ${modelToSelect.id}`);
      } else if (localModels.length > 0) {
        modelToSelect = localModels[0];
        console.log(`[ModelSelector] 로컬 모델을 기본으로 선택: ${modelToSelect.id}`);
      } else {
        modelToSelect = validModels[0];
        console.log(`[ModelSelector] 첫 번째 모델을 기본으로 선택: ${modelToSelect.id}`);
      }
      
      if (modelToSelect) {
        this.selectModel(modelToSelect.id);
      }
    } else {
      console.log(`[ModelSelector] 현재 선택된 모델: ${this.selectedModelId || '없음'}`);
      // 이미 선택된 모델이 있으면 표시 업데이트
      this.updateSelectedModelDisplay();
    }
    
    console.log('[ModelSelector] 모델 목록 업데이트 완료');
  }
  
  /**
   * 모델 선택
   */
  selectModel(modelId) {
    console.log(`[ModelSelector] 모델 선택 시도: ${modelId}`);
    
    if (!modelId) {
      console.warn('[ModelSelector] 유효하지 않은 모델 ID');
      return;
    }
    
    // 같은 모델이 이미 선택된 경우
    if (this.selectedModelId === modelId) {
      console.log(`[ModelSelector] 이미 선택된 모델: ${modelId}, 드롭다운만 닫음`);
      this.closeDropdown();
      return;
    }
    
    // 새 모델 선택
    this.selectedModelId = modelId;
    console.log(`[ModelSelector] 새 모델 선택됨: ${modelId}`);
    
    // 선택된 옵션 표시 업데이트
    if (this.dropdown) {
      const options = this.dropdown.querySelectorAll('.model-option');
      console.log(`[ModelSelector] 선택 UI 업데이트: ${options.length}개 옵션 처리`);
      
      let foundSelected = false;
      options.forEach(option => {
        if (option.dataset.id === modelId) {
          option.classList.add('selected');
          foundSelected = true;
        } else {
          option.classList.remove('selected');
        }
      });
      
      console.log(`[ModelSelector] 선택된 모델 옵션 ${foundSelected ? '찾음' : '찾지 못함'}`);
    }
    
    // 선택된 모델 표시 업데이트
    this.updateSelectedModelDisplay();
    
    // 드롭다운 닫기
    this.closeDropdown();
    
    // VS Code 확장에 모델 변경 알림
    try {
      console.log(`[ModelSelector] VS Code에 모델 변경 알림 전송: ${modelId}`);
      this.vscode.postMessage({
        command: 'changeModel',
        model: modelId
      });
    } catch (error) {
      console.error('[ModelSelector] VS Code에 모델 변경 알림 전송 실패:', error);
    }
    
    // 변경 이벤트 발생
    if (typeof this.options.onChange === 'function') {
      console.log(`[ModelSelector] onChange 콜백 호출: ${modelId}`);
      this.options.onChange(modelId);
    }
  }
  
  /**
   * 선택된 모델 표시 업데이트
   */
  updateSelectedModelDisplay() {
    console.log('[ModelSelector] 선택된 모델 표시 업데이트');
    
    if (!this.title) {
      console.warn('[ModelSelector] 타이틀 요소를 찾을 수 없음');
      return;
    }
    
    if (!this.selectedModelId) {
      console.log('[ModelSelector] 선택된 모델 없음, 기본 메시지 표시');
      this.title.textContent = '모델 선택';
      return;
    }
    
    // 선택된 모델 찾기
    const selectedModel = this.options.models.find(model => model.id === this.selectedModelId);
    if (selectedModel) {
      console.log(`[ModelSelector] 선택된 모델 찾음: ${selectedModel.name}`);
      this.title.textContent = selectedModel.name;
    } else {
      console.warn(`[ModelSelector] 선택된 모델 정보를 찾을 수 없음: ${this.selectedModelId}, ID만 표시`);
      this.title.textContent = this.selectedModelId;
    }
  }
  
  /**
   * 현재 선택된 모델 ID 가져오기
   */
  getCurrentModelId() {
    console.log(`[ModelSelector] 현재 모델 ID 요청: ${this.selectedModelId || '없음'}`);
    return this.selectedModelId;
  }
  
  /**
   * 모델 ID로 선택하기
   */
  setModelById(modelId) {
    console.log(`[ModelSelector] modelId로 모델 설정 시도: ${modelId}`);
    
    if (!modelId) {
      console.warn('[ModelSelector] 빈 모델 ID');
      return;
    }
    
    // 모델 목록이 없는 경우
    if (!this.options.models || this.options.models.length === 0) {
      console.log(`[ModelSelector] 모델 목록이 비어있어 ID만 저장: ${modelId}`);
      this.selectedModelId = modelId;
      
      if (this.title) {
        this.title.textContent = `ID: ${modelId}`;
      }
      return;
    }
    
    // 존재하는 모델인지 확인
    const modelExists = this.options.models.some(model => model.id === modelId);
    if (modelExists) {
      console.log(`[ModelSelector] 목록에서 모델 ID 찾음: ${modelId}`);
      this.selectModel(modelId);
    } else {
      console.warn(`[ModelSelector] 목록에서 모델 ID를 찾을 수 없음: ${modelId} (목록에 ${this.options.models.length}개 모델 있음)`);
      
      // ID가 미리 생성되었을 수 있으므로 이름으로 찾아보기
      console.log('[ModelSelector] 유사한 모델 찾기 시도');
      let found = false;
      for (const model of this.options.models) {
        // ID가 모델 이름 또는 제공자 정보를 포함하는지 확인
        const modelNameFormatted = model.name.toLowerCase().replace(/\s+/g, '-');
        if (modelId.includes(modelNameFormatted) || 
            (model.provider && modelId.includes(model.provider))) {
          console.log(`[ModelSelector] 유사한 모델 찾음: ${model.id} (${model.name})`);
          this.selectModel(model.id);
          found = true;
          break;
        }
      }
      
      // 유사한 모델도 찾지 못한 경우 첫 번째 모델 선택
      if (!found && this.options.models.length > 0) {
        console.log(`[ModelSelector] 일치하는 모델을 찾지 못해 첫 번째 모델 선택: ${this.options.models[0].id}`);
        this.selectModel(this.options.models[0].id);
      }
    }
  }
}

// 모델 선택기 초기화 (DOM 로드 완료 후)
document.addEventListener('DOMContentLoaded', () => {
  console.log('[모델 선택기] DOM 로드 완료 이벤트 발생, 모델 선택기 초기화 시작');
  
  try {
    window.modelSelector = new ModelSelector('modelSelector', {
      onChange: (modelId) => {
        console.log(`[모델 선택기] 모델 변경됨: ${modelId}`);
        
        // 채팅 입력창 모델 정보 업데이트
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
          chatInput.dataset.model = modelId;
          console.log(`[모델 선택기] 채팅 입력창 dataset.model 설정: ${modelId}`);
        } else {
          console.warn('[모델 선택기] 채팅 입력창을 찾을 수 없음');
        }
        
        // 모델 선택 상태 로그
        const selectedModel = document.querySelector('.model-option.selected');
        console.log(`[모델 선택기] 선택됨: ${selectedModel ? selectedModel.textContent.trim() : 'none'}`);
      }
    });
    
    console.log('[모델 선택기] 모델 선택기 객체 생성 완료');
    
    // 글로벌 도우미 함수 추가 (디버깅용)
    window.debugModelSelector = function() {
      const selector = window.modelSelector;
      if (!selector) {
        console.error('모델 선택기 객체를 찾을 수 없습니다.');
        return '모델 선택기를 찾을 수 없음';
      }
      
      console.log('===== 모델 선택기 디버그 정보 =====');
      console.log(`컨테이너: ${selector.containerId}`);
      console.log(`컨테이너 요소 존재: ${!!selector.container}`);
      console.log(`초기화 완료: ${selector.isInitialized}`);
      console.log(`현재 선택된 모델: ${selector.selectedModelId || '없음'}`);
      console.log(`모델 개수: ${selector.options.models?.length || 0}`);
      console.log(`드롭다운 상태: ${selector.isDropdownOpen() ? '열림' : '닫힘'}`);
      
      const header = document.querySelector('.model-selector-header');
      const dropdown = document.querySelector('.model-selector-dropdown');
      
      console.log(`헤더 요소 존재: ${!!header}`);
      console.log(`드롭다운 요소 존재: ${!!dropdown}`);
      
      if (dropdown) {
        const options = dropdown.querySelectorAll('.model-option');
        console.log(`드롭다운 옵션 수: ${options.length}`);
        
        options.forEach((opt, idx) => {
          console.log(`옵션 ${idx+1}: id=${opt.dataset.id}, 텍스트=${opt.textContent.trim()}, 선택됨=${opt.classList.contains('selected')}`);
        });
      }
      
      return '모델 선택기 디버그 정보가 콘솔에 출력되었습니다.';
    };
    
    // 지연 상태 확인
    setTimeout(() => {
      const selector = window.modelSelector;
      if (selector) {
        console.log(`[모델 선택기] 1초 후 상태 확인: 초기화=${selector.isInitialized}, 모델 수=${selector.options.models?.length || 0}, 선택된 모델=${selector.selectedModelId || '없음'}`);
      } else {
        console.error('[모델 선택기] 1초 후 상태 확인: 모델 선택기 객체가 없음');
      }
    }, 1000);
    
  } catch (error) {
    console.error('[모델 선택기] 초기화 중 오류 발생:', error);
  }
});