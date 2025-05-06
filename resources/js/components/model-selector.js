/**
 * 모델 선택기 컴포넌트
 * 
 * 채팅 인터페이스에서 사용할 LLM 모델을 선택하는 드롭다운 컴포넌트입니다.
 * 심플하고 직접적인 구현으로 안정성 확보
 */

import logger from '../utils/logger.js';
import { getElement } from '../utils/dom-utils.js';
import eventBus from '../utils/event-bus.js';

class ModelSelector {
  constructor(containerId = 'modelSelector') {
    this.containerId = containerId;
    this.container = null;
    this.models = [];
    this.selectedModelId = null;
    this.isDropdownOpen = false;
    
    // 콘솔 로그 직접 사용 (디버깅용)
    console.log('모델 선택기 생성 시작');
    
    // VS Code API
    try {
      this.vscode = acquireVsCodeApi();
      console.log('VS Code API 초기화 성공');
    } catch (error) {
      console.error('VS Code API 초기화 실패:', error);
      this.vscode = null;
    }
    
    // DOM 초기화
    this.initialize();
    
    console.log('모델 선택기 생성 완료');
  }
  
  /**
   * 컴포넌트 초기화
   */
  initialize() {
    console.log('모델 선택기 초기화 시작');
    
    try {
      // DOM 컨테이너 요소 가져오기
      this.container = document.getElementById(this.containerId);
      if (!this.container) {
        console.error(`모델 선택기 컨테이너를 찾을 수 없음: #${this.containerId}`);
        // 초기화 재시도를 위한 지연 설정
        setTimeout(() => this.initialize(), 500);
        return;
      }
      
      console.log('모델 선택기 컨테이너 발견:', this.containerId);
      
      // 이미 초기화되었는지 확인
      if (this.container.querySelector('.model-selector')) {
        console.log('모델 선택기가 이미 초기화됨, 재초기화 건너뜀');
        return;
      }
      
      // 기본 HTML 구조 생성
      this.renderBasicStructure();
      
      // 이벤트 핸들러 설정
      this.setupEventHandlers();
      
      // 모델 목록 요청
      this.requestModels();
      
      // 초기화 완료 이벤트 발행
      eventBus.publish('modelSelectorInitialized', true);
      
      console.log('모델 선택기 초기화 완료');
    } catch (error) {
      console.error('모델 선택기 초기화 중 오류 발생:', error);
    }
  }
  
  /**
   * 기본 HTML 구조 생성
   */
  renderBasicStructure() {
    // 간단하고 확실한 HTML 구조
    this.container.innerHTML = `
      <div class="model-selector">
        <div class="model-selector-button" id="model-selector-button">
          <div class="model-name" id="model-name">모델 로딩 중...</div>
          <div class="model-icon"><i class="ph ph-caret-down"></i></div>
        </div>
        <div class="model-selector-dropdown" id="model-dropdown">
          <!-- 모델 목록이 여기에 추가됨 -->
        </div>
      </div>
    `;
    
    // 디버깅용 스타일 추가
    const button = this.container.querySelector('#model-selector-button');
    if (button) {
      button.setAttribute('title', '모델 선택 (클릭하여 드롭다운 열기)');
      button.style.position = 'relative';
      button.style.zIndex = '9999';
    }
    
    const dropdown = this.container.querySelector('#model-dropdown');
    if (dropdown) {
      dropdown.style.zIndex = '9999';
      dropdown.style.position = 'absolute';
    }
    
    console.log('모델 선택기 기본 구조 생성됨');
  }
  
  /**
   * 이벤트 핸들러 설정
   */
  setupEventHandlers() {
    try {
      // 버튼 클릭 이벤트
      const button = this.container.querySelector('#model-selector-button');
      if (button) {
        button.addEventListener('click', (event) => {
          // 이벤트 버블링 방지 (외부 클릭 이벤트와 충돌 방지)
          event.stopPropagation();
          this.toggleDropdown();
        });
        console.log('모델 선택기 버튼 이벤트 등록됨');
      } else {
        console.error('모델 선택기 버튼 요소를 찾을 수 없음');
      }
      
      // 윈도우 리사이즈 이벤트 처리 (드롭다운 위치 조정)
      window.addEventListener('resize', () => {
        if (this.isDropdownOpen) {
          this.closeDropdown();
        }
      });
      
      console.log('모델 선택기 이벤트 핸들러 설정 완료');
    } catch (error) {
      console.error('이벤트 핸들러 설정 실패:', error);
    }
  }
  
  /**
   * 드롭다운 토글
   */
  toggleDropdown() {
    console.log('모델 선택기 토글 시작');
    
    const dropdown = this.container.querySelector('#model-dropdown');
    if (!dropdown) {
      console.error('모델 드롭다운 요소를 찾을 수 없음');
      return;
    }
    
    this.isDropdownOpen = !this.isDropdownOpen;
    
    if (this.isDropdownOpen) {
      // 드롭다운 보이기
      dropdown.style.display = 'block';
      dropdown.classList.add('show');
      
      // 드롭다운이 컨테이너를 벗어나지 않도록 위치 조정
      const rect = this.container.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      
      if (rect.right + dropdown.offsetWidth > windowWidth) {
        dropdown.style.left = 'auto';
        dropdown.style.right = '0';
      }
      
      // 아이콘 변경
      const icon = this.container.querySelector('.model-icon i');
      if (icon) {
        icon.className = 'ph ph-caret-up';
      }
      
      // body에 이벤트 리스너 추가 (외부 클릭 시 닫기)
      setTimeout(() => {
        document.body.addEventListener('click', this.handleOutsideClick);
      }, 10);
      
      console.log('드롭다운 열림: 표시 설정됨');
    } else {
      this.closeDropdown();
    }
    
    console.log('모델 선택기 토글 완료:', this.isDropdownOpen ? '열림' : '닫힘');
  }
  
  // 외부 클릭 처리 핸들러 (바인딩 유지를 위해 화살표 함수 사용)
  handleOutsideClick = (event) => {
    if (!this.container.contains(event.target) && this.isDropdownOpen) {
      console.log('외부 클릭 감지됨, 드롭다운 닫기');
      this.closeDropdown();
      // 이벤트 리스너 제거
      document.body.removeEventListener('click', this.handleOutsideClick);
    }
  }
  
  /**
   * 드롭다운 닫기
   */
  closeDropdown() {
    console.log('모델 선택기 드롭다운 닫기');
    
    this.isDropdownOpen = false;
    
    const dropdown = this.container.querySelector('#model-dropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
      dropdown.style.display = 'none';
    }
    
    // 아이콘 변경
    const icon = this.container.querySelector('.model-icon i');
    if (icon) {
      icon.className = 'ph ph-caret-down';
    }
    
    // 이벤트 리스너 제거 (안전하게 제거)
    document.body.removeEventListener('click', this.handleOutsideClick);
    
    console.log('드롭다운 닫힘 완료');
  }
  
  /**
   * VS Code에 모델 목록 요청
   */
  requestModels() {
    console.log('모델 목록 요청 시작');
    
    if (!this.vscode) {
      console.error('VS Code API가 없어 모델을 요청할 수 없습니다');
      return;
    }
    
    try {
      this.vscode.postMessage({
        command: 'getModelList'
      });
      console.log('모델 목록 요청 메시지 전송 완료');
    } catch (error) {
      console.error('모델 목록 요청 실패:', error);
    }
  }
  
  /**
   * 모델 목록 설정 및 렌더링
   */
  setModels(models) {
    console.log('모델 목록 설정:', models);
    
    try {
      // null, undefined 체크 추가
      if (!models) {
        console.warn('모델 목록이 null 또는 undefined입니다');
        return;
      }
      
      if (!Array.isArray(models)) {
        console.warn('모델 목록이 배열이 아닙니다:', models);
        // 객체인 경우 배열로 변환 시도
        if (typeof models === 'object') {
          const converted = Object.values(models);
          if (converted.length > 0) {
            models = converted;
            console.log('객체를 배열로 변환함:', models);
          } else {
            return;
          }
        } else {
          return;
        }
      }
      
      if (models.length === 0) {
        console.warn('모델 목록이 비어 있습니다');
        return;
      }
      
      // 모델 데이터 형식 검증 및 수정
      models = models.map(model => {
        // id가 없는 경우 name으로 사용
        if (!model.id && model.name) {
          model.id = model.name;
        }
        
        // name이 없는 경우 id로 사용
        if (!model.name && model.id) {
          model.name = model.id;
        }
        
        return model;
      }).filter(model => model.id && model.name); // 유효한 모델만 사용
      
      // 최종 유효성 검사
      if (models.length === 0) {
        console.warn('유효한 모델이 없음:', models);
        return;
      }
      
      this.models = models;
      
      // 드롭다운 내용 렌더링
      this.renderModelOptions();
      
      // 기존 선택된 모델이 새 목록에 없는지 확인
      if (this.selectedModelId) {
        const modelExists = models.some(m => m.id === this.selectedModelId);
        if (!modelExists) {
          console.log(`선택된 모델(${this.selectedModelId})이 새 목록에 없어, 첫 번째 모델로 변경`);
          this.selectedModelId = null; // 기존 선택 초기화
        }
      }
      
      // 모델 선택 (아직 선택된 모델이 없는 경우)
      if (!this.selectedModelId && models.length > 0) {
        this.selectModel(models[0].id);
      } else if (this.selectedModelId) {
        // 이미 선택된 모델이 있으면 UI 업데이트
        const selectedModel = this.models.find(m => m.id === this.selectedModelId);
        if (selectedModel) {
          const nameElement = this.container.querySelector('#model-name');
          if (nameElement) {
            nameElement.textContent = selectedModel.name;
            nameElement.title = selectedModel.name;
          }
        }
      }
      
      console.log('모델 목록 설정 완료:', this.models.length, '개의 모델');
    } catch (error) {
      console.error('모델 목록 설정 중 오류 발생:', error);
    }
  }
  
  /**
   * 모델 옵션 렌더링
   */
  renderModelOptions() {
    console.log('모델 옵션 렌더링 시작');
    
    const dropdown = this.container.querySelector('#model-dropdown');
    if (!dropdown) {
      console.error('모델 드롭다운 요소를 찾을 수 없음');
      return;
    }
    
    // 이전 내용 지우기
    dropdown.innerHTML = '';
    
    // 모델 목록 생성
    this.models.forEach(model => {
      const option = document.createElement('div');
      option.className = 'model-option';
      if (model.id === this.selectedModelId) {
        option.className += ' selected';
      }
      
      option.dataset.id = model.id;
      option.innerHTML = `
        <div class="model-option-content">
          <div class="model-name">${model.name}</div>
          ${model.provider ? `<div class="model-provider">${model.provider}</div>` : ''}
        </div>
      `;
      
      // 클릭 이벤트 추가
      option.addEventListener('click', () => {
        this.selectModel(model.id);
      });
      
      dropdown.appendChild(option);
    });
    
    console.log('모델 옵션 렌더링 완료');
  }
  
  /**
   * 모델 선택
   */
  selectModel(modelId) {
    console.log('모델 선택:', modelId);
    
    try {
      const model = this.models.find(m => m.id === modelId);
      if (!model) {
        console.error(`ID가 ${modelId}인 모델을 찾을 수 없음`);
        return;
      }
      
      this.selectedModelId = modelId;
      
      // 타이틀 업데이트
      const nameElement = this.container.querySelector('#model-name');
      if (nameElement) {
        nameElement.textContent = model.name;
        nameElement.title = model.name;
        console.log('모델 이름 업데이트됨:', model.name);
      } else {
        console.error('모델 이름 요소를 찾을 수 없음');
      }
      
      // 선택 상태 업데이트
      const options = this.container.querySelectorAll('.model-option');
      options.forEach(option => {
        if (option.dataset.id === modelId) {
          option.classList.add('selected');
        } else {
          option.classList.remove('selected');
        }
      });
      
      // 드롭다운 닫기
      this.closeDropdown();
      
      // 이벤트 발행
      eventBus.publish('modelSelected', model);
      console.log('modelSelected 이벤트 발행됨:', model.name);
      
      // VS Code에 모델 변경 알림
      if (this.vscode) {
        try {
          this.vscode.postMessage({
            command: 'changeModel',
            model: modelId
          });
          console.log('모델 변경 요청 전송 완료:', modelId);
          
          // 사용자에게 시각적 피드백 제공
          this.showSelectionFeedback(model.name);
        } catch (error) {
          console.error('모델 변경 요청 전송 실패:', error);
        }
      }
      
      console.log('모델 선택 완료:', model.name);
    } catch (error) {
      console.error('모델 선택 중 오류 발생:', error);
    }
  }
  
  /**
   * 모델 선택 피드백 표시
   */
  showSelectionFeedback(modelName) {
    try {
      // 버튼에 시각적 피드백 효과 추가
      const button = this.container.querySelector('#model-selector-button');
      if (button) {
        // 일시적인 강조 효과
        button.classList.add('model-selected');
        
        // 일정 시간 후 효과 제거
        setTimeout(() => {
          button.classList.remove('model-selected');
        }, 1000);
      }
      
      console.log('모델 선택 피드백 표시됨:', modelName);
    } catch (error) {
      console.error('모델 선택 피드백 표시 중 오류 발생:', error);
    }
  }
}

// 전역 객체로 내보내기
window.modelSelector = new ModelSelector();

export default window.modelSelector;