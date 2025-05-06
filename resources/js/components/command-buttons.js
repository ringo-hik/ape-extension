/**
 * 명령어 버튼 컴포넌트
 * 
 * 자주 사용하는 명령어에 빠르게 접근할 수 있는 버튼 패널을 제공합니다.
 */

import logger from '../utils/logger.js';
import { getElement, createElement, appendElement, removeAllChildren } from '../utils/dom-utils.js';

class CommandButtons {
  constructor() {
    this.container = getElement('commandButtonsContainer');
    this.searchInput = getElement('commandSearch');
    this.commands = [];
    this.categories = [];
    this.vscode = null;
    
    try {
      this.vscode = acquireVsCodeApi();
    } catch (error) {
      logger.error('VS Code API 초기화 실패:', error);
    }
    
    this.initialize();
  }
  
  /**
   * 컴포넌트 초기화
   */
  initialize() {
    logger.log('명령어 버튼 컴포넌트 초기화');
    
    // 명령어 목록 요청
    this.requestCommands();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
  }
  
  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 검색 기능
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.filterCommands(this.searchInput.value);
      });
    }
    
    // 버튼 클릭 이벤트 위임
    if (this.container) {
      this.container.addEventListener('click', (event) => {
        const commandButton = event.target.closest('.command-button');
        if (commandButton) {
          const commandId = commandButton.dataset.commandId;
          if (commandId) {
            this.executeCommand(commandId);
          }
        }
      });
    }
    
    // VS Code 메시지 이벤트 리스너
    window.addEventListener('message', this.handleVsCodeMessage.bind(this));
  }
  
  /**
   * VS Code로부터 메시지 처리
   */
  handleVsCodeMessage(event) {
    const message = event.data;
    
    switch (message.command) {
      case 'setCommands':
        this.setCommands(message.commands);
        break;
        
      default:
        // 다른 메시지는 무시
        break;
    }
  }
  
  /**
   * VS Code에 명령어 목록 요청
   */
  requestCommands() {
    if (!this.vscode) {
      logger.error('VS Code API가 없어 명령어를 요청할 수 없습니다.');
      return;
    }
    
    logger.log('명령어 목록 요청');
    
    this.vscode.postMessage({
      command: 'getCommands'
    });
  }
  
  /**
   * 명령어 목록 설정
   */
  setCommands(commands) {
    if (!commands || !Array.isArray(commands)) {
      logger.error('유효하지 않은 명령어 목록');
      return;
    }
    
    this.commands = commands;
    
    // 카테고리 추출
    this.categories = this.extractCategories(commands);
    
    // 명령어 버튼 렌더링
    this.renderCommands();
  }
  
  /**
   * 카테고리 추출
   */
  extractCategories(commands) {
    const categories = new Set();
    commands.forEach(command => {
      if (command.category) {
        categories.add(command.category);
      }
    });
    return Array.from(categories);
  }
  
  /**
   * 명령어 버튼 렌더링
   */
  renderCommands() {
    if (!this.container) return;
    
    // 컨테이너 초기화
    removeAllChildren(this.container);
    
    if (this.categories.length > 0) {
      // 카테고리별로 명령어 렌더링
      this.categories.forEach(category => {
        const categoryCommands = this.commands.filter(cmd => cmd.category === category);
        
        if (categoryCommands.length > 0) {
          this.renderCategory(category, categoryCommands);
        }
      });
      
      // 카테고리가 없는 명령어 렌더링
      const uncategorizedCommands = this.commands.filter(cmd => !cmd.category);
      if (uncategorizedCommands.length > 0) {
        this.renderCategory('기타', uncategorizedCommands);
      }
    } else {
      // 카테고리 없이 모든 명령어 렌더링
      const buttonsGrid = createElement('div', { className: 'buttons-grid' });
      
      this.commands.forEach(command => {
        const commandButton = this.createCommandButton(command);
        appendElement(buttonsGrid, commandButton);
      });
      
      appendElement(this.container, buttonsGrid);
    }
  }
  
  /**
   * 카테고리 렌더링
   */
  renderCategory(category, commands) {
    const categoryElement = createElement('div', { className: 'command-category' });
    const categoryHeader = createElement('div', { className: 'category-header' }, category);
    const buttonsGrid = createElement('div', { className: 'buttons-grid' });
    
    appendElement(categoryElement, categoryHeader);
    
    commands.forEach(command => {
      const commandButton = this.createCommandButton(command);
      appendElement(buttonsGrid, commandButton);
    });
    
    appendElement(categoryElement, buttonsGrid);
    appendElement(this.container, categoryElement);
  }
  
  /**
   * 명령어 버튼 생성
   */
  createCommandButton(command) {
    const { id, label, icon = 'code' } = command;
    
    const buttonElement = createElement('div', {
      className: 'command-button',
      'data-command-id': id
    });
    
    const iconElement = createElement('div', { className: 'button-icon' }, `<i class="ph ph-${icon}"></i>`);
    const textElement = createElement('div', { className: 'button-text', title: label }, label);
    
    appendElement(buttonElement, iconElement);
    appendElement(buttonElement, textElement);
    
    return buttonElement;
  }
  
  /**
   * 명령어 실행
   */
  executeCommand(commandId) {
    if (!this.vscode) {
      logger.error('VS Code API가 없어 명령어를 실행할 수 없습니다.');
      return;
    }
    
    logger.log(`명령어 실행: ${commandId}`);
    
    this.vscode.postMessage({
      command: 'executeCommand',
      commandId: commandId
    });
  }
  
  /**
   * 명령어 필터링
   */
  filterCommands(searchText) {
    if (!searchText) {
      // 검색어가 없으면 모든 명령어 표시
      this.renderCommands();
      return;
    }
    
    // 소문자로 변환하여 검색 (대소문자 구분 없음)
    const searchLower = searchText.toLowerCase();
    
    // 필터링된 명령어
    const filteredCommands = this.commands.filter(command => {
      const labelMatch = command.label.toLowerCase().includes(searchLower);
      const descriptionMatch = command.description ? command.description.toLowerCase().includes(searchLower) : false;
      return labelMatch || descriptionMatch;
    });
    
    // 컨테이너 초기화
    removeAllChildren(this.container);
    
    if (filteredCommands.length === 0) {
      // 검색 결과 없음
      const noResults = createElement('div', { className: 'no-results' }, '검색 결과가 없습니다.');
      appendElement(this.container, noResults);
      return;
    }
    
    // 필터링된 명령어 렌더링 (카테고리 없음)
    const buttonsGrid = createElement('div', { className: 'buttons-grid' });
    
    filteredCommands.forEach(command => {
      const commandButton = this.createCommandButton(command);
      appendElement(buttonsGrid, commandButton);
    });
    
    appendElement(this.container, buttonsGrid);
  }
}

// 모듈이 로드될 때 인스턴스 생성
window.commandButtons = new CommandButtons();

export default window.commandButtons;