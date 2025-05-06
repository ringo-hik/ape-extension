/**
 * 모델 선택기 컴포넌트
 * 
 * 채팅 인터페이스에서 사용할 LLM 모델을 선택하는 드롭다운 컴포넌트입니다.
 */

import logger from '../utils/logger.js';
import { getElement, toggleClass, createElement, appendElement } from '../utils/dom-utils.js';
import eventBus from '../utils/event-bus.js';

class ModelSelector {
  constructor(containerId = 'modelSelector') {
    this.containerId = containerId;
    this.container = null;
    this.headerElement = null;
    this.titleElement = null;
    this.dropdownElement = null;
    this.iconElement = null;
    
    this.models = [];
    this.categories = [];
    this.selectedModelId = null;
    this.isDropdownOpen = false;
    
    // VS Code API
    try {
      this.vscode = acquireVsCodeApi();
    } catch (error) {
      logger.error('VS Code API 초기화 실패:', error);
      this.vscode = null;
    }
    
    // 초기화
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }
  
  /**
   * 컴포넌트 초기화
   */
  initialize() {
    logger.log('모델 선택기 초기화 시작');
    
    // DOM 요소 참조
    this.container = getElement(this.containerId);
    
    if (!this.container) {
      logger.error(`모델 선택기 컨테이너를 찾을 수 없음: #${this.containerId}`);
      return;
    }
    
    // 콘텐츠 초기화
    this.container.innerHTML = '';
    
    // UI 구성 요소 생성
    this.createHeader();
    this.createDropdown();
    
    // 이벤트 핸들러 설정
    this.setupEventHandlers();
    
    // 모델 목록 요청
    this.requestModels();
    
    logger.log('모델 선택기 초기화 완료');
  }
  
  /**
   * 헤더 생성
   */
  createHeader() {
    this.headerElement = createElement('div', { className: 'model-selector-header' });
    this.titleElement = createElement('div', { className: 'model-selector-title' }, '모델 로딩 중...');
    this.iconElement = createElement('div', { className: 'model-selector-icon' }, '<i class="ph ph-caret-down"></i>');
    
    appendElement(this.headerElement, this.titleElement);
    appendElement(this.headerElement, this.iconElement);
    appendElement(this.container, this.headerElement);
  }
  
  /**
   * 드롭다운 생성
   */
  createDropdown() {
    this.dropdownElement = createElement('div', { className: 'model-selector-dropdown' });
    appendElement(this.container, this.dropdownElement);
  }
  
  /**
   * 이벤트 핸들러 설정
   */
  setupEventHandlers() {
    // 헤더 클릭 이벤트
    this.headerElement.addEventListener('click', () => this.toggleDropdown());
    
    // 외부 영역 클릭 시 드롭다운 닫기
    document.addEventListener('click', (event) => {
      if (!this.container.contains(event.target) && this.isDropdownOpen) {
        this.closeDropdown();
      }
    });
    
    // 이벤트 버스 구독
    eventBus.subscribe('modelChanged', (model) => {
      this.updateSelectedModelTitle(model);
    });
  }
  
  /**
   * 드롭다운 토글
   */
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    toggleClass(this.dropdownElement, 'open', this.isDropdownOpen);
    toggleClass(this.iconElement, 'open', this.isDropdownOpen);
  }
  
  /**
   * 드롭다운 닫기
   */
  closeDropdown() {
    this.isDropdownOpen = false;
    toggleClass(this.dropdownElement, 'open', false);
    toggleClass(this.iconElement, 'open', false);
  }
  
  /**
   * VS Code에 모델 목록 요청
   */
  requestModels() {
    if (!this.vscode) {
      logger.error('VS Code API가 없어 모델을 요청할 수 없습니다.');
      return;
    }
    
    logger.log('모델 목록 요청');
    
    this.vscode.postMessage({
      command: 'getModels'
    });
  }
  
  /**
   * 모델 목록 설정
   */
  setModels(models) {
    this.models = models;
    this.categories = this.extractCategories(models);
    
    this.renderModels();
    
    // 선택된 모델이 없다면 첫 번째 모델 선택
    if (!this.selectedModelId && models.length > 0) {
      this.selectModel(models[0].id);
    }
  }
  
  /**
   * 모델 카테고리 추출
   */
  extractCategories(models) {
    const categories = new Set();
    models.forEach(model => {
      if (model.category) {
        categories.add(model.category);
      }
    });
    return Array.from(categories);
  }
  
  /**
   * 모델 목록 렌더링
   */
  renderModels() {
    if (!this.dropdownElement) return;
    
    // 드롭다운 콘텐츠 초기화
    this.dropdownElement.innerHTML = '';
    
    if (this.categories.length > 0) {
      // 카테고리별로 모델 렌더링
      this.categories.forEach(category => {
        const categoryModels = this.models.filter(model => model.category === category);
        
        if (categoryModels.length > 0) {
          this.renderCategory(category, categoryModels);
        }
      });
      
      // 카테고리가 없는 모델 렌더링
      const uncategorizedModels = this.models.filter(model => !model.category);
      if (uncategorizedModels.length > 0) {
        this.renderCategory('기타', uncategorizedModels);
      }
    } else {
      // 카테고리 없이 모든 모델 렌더링
      this.models.forEach(model => {
        this.renderModelOption(model);
      });
    }
  }
  
  /**
   * 카테고리 렌더링
   */
  renderCategory(category, models) {
    const categoryHeader = createElement('div', { className: 'model-category-header' }, category);
    appendElement(this.dropdownElement, categoryHeader);
    
    models.forEach(model => {
      this.renderModelOption(model);
    });
  }
  
  /**
   * 모델 옵션 렌더링
   */
  renderModelOption(model) {
    const isSelected = model.id === this.selectedModelId;
    const optionClass = isSelected ? 'model-option selected' : 'model-option';
    
    const option = createElement('div', { 
      className: optionClass,
      'data-id': model.id
    });
    
    const content = createElement('div', { className: 'model-option-content' });
    const nameElement = createElement('div', { className: 'model-name' }, model.name);
    
    appendElement(content, nameElement);
    
    if (model.provider) {
      const providerElement = createElement('div', { className: 'model-provider' }, model.provider);
      appendElement(content, providerElement);
    }
    
    appendElement(option, content);
    appendElement(this.dropdownElement, option);
    
    // 이벤트 리스너 추가
    option.addEventListener('click', () => {
      this.selectModel(model.id);
    });
  }
  
  /**
   * 모델 선택
   */
  selectModel(modelId) {
    const model = this.models.find(m => m.id === modelId);
    
    if (!model) {
      logger.error(`모델을 찾을 수 없음: ${modelId}`);
      return;
    }
    
    this.selectedModelId = modelId;
    
    // 모델 옵션 선택 상태 업데이트
    const options = this.dropdownElement.querySelectorAll('.model-option');
    
    options.forEach(option => {
      const optionId = option.getAttribute('data-id');
      toggleClass(option, 'selected', optionId === modelId);
    });
    
    // 타이틀 업데이트
    this.updateSelectedModelTitle(model);
    
    // 드롭다운 닫기
    this.closeDropdown();
    
    // 모델 변경 이벤트 발행
    eventBus.publish('modelSelected', model);
    
    // VS Code에 모델 변경 알림
    if (this.vscode) {
      this.vscode.postMessage({
        command: 'selectModel',
        modelId: modelId
      });
    }
  }
  
  /**
   * 선택된 모델 타이틀 업데이트
   */
  updateSelectedModelTitle(model) {
    if (!this.titleElement) return;
    
    this.titleElement.textContent = model.name;
    this.titleElement.title = `${model.name}${model.provider ? ` (${model.provider})` : ''}`;
  }
  
  /**
   * 현재 선택된 모델 ID 가져오기
   */
  getSelectedModelId() {
    return this.selectedModelId;
  }
}

// 모델 선택기 인스턴스 생성 및 전역 객체로 내보내기
window.modelSelector = new ModelSelector();

export default window.modelSelector;