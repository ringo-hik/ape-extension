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
    this.parentWindow = null;
    
    try {
      // VS Code API 초기화 시도
      this.vscode = acquireVsCodeApi();
    } catch (error) {
      logger.error('VS Code API 초기화 실패:', error);
      // iframe인 경우 부모 창 참조
      if (window.parent && window.parent !== window) {
        this.parentWindow = window.parent;
        logger.log('부모 창 참조 설정됨');
      }
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
    
    // 부모 창에 초기화 완료 알림 (iframe 통신용)
    this.notifyParentInitialized();
  }
  
  /**
   * 부모 창에 초기화 완료 알림
   */
  notifyParentInitialized() {
    if (this.parentWindow) {
      try {
        this.parentWindow.postMessage({
          command: 'iframe_initialized',
          source: 'command_buttons',
          timestamp: Date.now()
        }, '*');
        logger.log('부모 창에 초기화 완료 알림 전송됨');
      } catch (error) {
        logger.error('부모 창 메시지 전송 실패:', error);
      }
    }
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
    
    // 메시지 이벤트 리스너 (VS Code 및 부모 창으로부터)
    window.addEventListener('message', this.handleMessage.bind(this));
  }
  
  /**
   * 메시지 처리 (VS Code 또는 부모 창으로부터)
   */
  handleMessage(event) {
    const message = event.data;
    
    // 메시지 유효성 검사
    if (!message || !message.command) return;
    
    // iframe 내부 로깅
    logger.log('메시지 수신:', message.command);
    
    switch (message.command) {
      case 'setCommands':
        this.setCommands(message.commands || message.data?.commands);
        break;
        
      // iframe 관련 명령어
      case 'iframe_ping':
        // 연결 확인용 ping에 응답
        this.respondToPing(event.source);
        break;
        
      // 명령어 실행 결과 수신
      case 'iframe_commandStatus':
        // 명령어 실행 성공/실패 피드백
        this.handleCommandStatus(message);
        break;
        
      // 명령어 하이라이트 처리
      case 'highlightCommand':
        if (message.commandId) {
          this.highlightCommand(message.commandId);
        }
        break;
        
      default:
        // 다른 메시지는 무시하지만 로그는 남김
        logger.log(`처리되지 않은 메시지 유형: ${message.command}`);
        break;
    }
  }
  
  /**
   * 명령어 실행 상태 처리
   */
  handleCommandStatus(message) {
    const { commandId, success, error } = message;
    
    logger.log(`명령어 실행 상태 수신 - ID: ${commandId}, 성공: ${success}`);
    
    // 해당 명령어 버튼 찾기
    const commandButton = this.findCommandButtonById(commandId);
    if (!commandButton) return;
    
    // 실행 중 표시 제거
    commandButton.classList.remove('executing');
    
    if (success) {
      // 성공 표시
      commandButton.classList.add('success');
      
      // 성공 표시 제거 (2초 후)
      setTimeout(() => {
        commandButton.classList.remove('success');
      }, 2000);
    } else {
      // 실패 표시
      commandButton.classList.add('error');
      
      // 오류 메시지 툴팁 표시
      if (error) {
        const errorTooltip = createElement('div', {
          className: 'error-tooltip'
        }, error);
        
        appendElement(commandButton, errorTooltip);
        
        // 툴팁 제거 (3초 후)
        setTimeout(() => {
          errorTooltip.remove();
        }, 3000);
      }
      
      // 오류 표시 제거 (3초 후)
      setTimeout(() => {
        commandButton.classList.remove('error');
      }, 3000);
    }
  }
  
  /**
   * 명령어 하이라이트
   */
  highlightCommand(commandId) {
    // 이전 하이라이트 제거
    const previousHighlighted = this.container?.querySelector('.command-button.highlighted');
    if (previousHighlighted) {
      previousHighlighted.classList.remove('highlighted');
    }
    
    // 새로운 하이라이트 적용
    const commandButton = this.findCommandButtonById(commandId);
    if (commandButton) {
      // 스크롤하여 보이게 하기
      commandButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 하이라이트 클래스 적용
      commandButton.classList.add('highlighted');
      
      // 검색 입력창에 해당 명령어 이름 설정
      if (this.searchInput) {
        const label = commandButton.querySelector('.button-text')?.textContent || '';
        this.searchInput.value = label;
        
        // 검색 입력 이벤트 발생시켜 필터링
        this.searchInput.dispatchEvent(new Event('input'));
      }
      
      // 하이라이트 제거 (5초 후)
      setTimeout(() => {
        commandButton.classList.remove('highlighted');
      }, 5000);
    }
  }
  
  /**
   * ping 메시지 응답
   */
  respondToPing(source) {
    if (source) {
      try {
        source.postMessage({
          command: 'iframe_pong',
          source: 'command_buttons',
          timestamp: Date.now()
        }, '*');
        logger.log('ping에 대한 응답 전송됨');
      } catch (error) {
        logger.error('ping 응답 전송 실패:', error);
      }
    }
  }
  
  /**
   * 명령어 목록 요청
   */
  requestCommands() {
    logger.log('명령어 목록 요청');
    
    if (this.vscode) {
      // VS Code API가 있는 경우 직접 요청
      try {
        this.vscode.postMessage({
          command: 'getCommands'
        });
        logger.log('VS Code API를 통해 명령어 목록 요청됨');
      } catch (error) {
        logger.error('VS Code 메시지 전송 실패:', error);
        // VS Code API가 실패하면 부모 창 통신 시도
        this.tryParentCommunication();
      }
    } else if (this.parentWindow) {
      // iframe인 경우 부모 창에 요청
      this.tryParentCommunication();
    } else {
      logger.error('VS Code API와 부모 창 모두 없어 명령어를 요청할 수 없습니다.');
      
      // 통신 복구를 위한 재시도 메커니즘
      this.setupRecoveryMechanism();
    }
  }
  
  /**
   * 부모 창과 통신 시도
   */
  tryParentCommunication() {
    if (!this.parentWindow && window.parent && window.parent !== window) {
      this.parentWindow = window.parent;
      logger.log('부모 창 참조 지연 설정됨');
    }
    
    if (this.parentWindow) {
      try {
        this.parentWindow.postMessage({
          command: 'iframe_getCommands',
          source: 'command_buttons',
          timestamp: Date.now()
        }, '*');
        logger.log('부모 창에 명령어 목록 요청됨');
      } catch (error) {
        logger.error('부모 창 메시지 전송 실패:', error);
        // 부모 창 참조 재설정 시도
        this.setupRecoveryMechanism();
      }
    }
  }
  
  /**
   * 통신 복구 메커니즘 설정
   */
  setupRecoveryMechanism() {
    // 이미 복구 메커니즘이 설정되어 있으면 중복 설정 방지
    if (this._recoveryAttempts) return;
    
    this._recoveryAttempts = 0;
    
    // 정기적으로 통신 재시도
    const recoveryInterval = setInterval(() => {
      this._recoveryAttempts++;
      
      logger.log(`통신 복구 시도 #${this._recoveryAttempts}`);
      
      // 부모 창 참조 재시도
      if (!this.parentWindow && window.parent && window.parent !== window) {
        this.parentWindow = window.parent;
        logger.log('복구: 부모 창 참조 재설정됨');
      }
      
      // VS Code API 재시도
      try {
        if (!this.vscode) {
          this.vscode = acquireVsCodeApi();
          logger.log('복구: VS Code API 재설정됨');
        }
      } catch (error) {
        logger.warn('복구: VS Code API 재설정 실패');
      }
      
      // 부모 창 또는 VS Code API가 설정되면 명령어 요청 재시도
      if (this.vscode || this.parentWindow) {
        this.requestCommands();
        clearInterval(recoveryInterval);
        logger.log('통신 복구 성공, 명령어 재요청');
      }
      
      // 일정 횟수 이상 시도해도 실패하면 포기
      if (this._recoveryAttempts >= 5) {
        clearInterval(recoveryInterval);
        logger.error('통신 복구 실패, 최대 시도 횟수 초과');
        
        // 오프라인 모드 전환
        this.fallbackToOfflineMode();
      }
    }, 2000);
  }
  
  /**
   * 오프라인 모드로 전환
   */
  fallbackToOfflineMode() {
    logger.warn('오프라인 모드로 전환됨');
    
    // 기본 명령어로 폴백
    const fallbackCommands = [
      { id: '/help', label: '도움말', description: '도움말 표시', icon: 'question' },
      { id: '/clear', label: '지우기', description: '채팅 내용 지우기', icon: 'trash' },
      { id: '/model', label: '모델', description: '모델 정보 표시', icon: 'robot' }
    ];
    
    // 오프라인 명령어 표시
    this.setCommands(fallbackCommands);
    
    // 오프라인 상태 표시
    this.showOfflineStatus();
  }
  
  /**
   * 오프라인 상태 표시
   */
  showOfflineStatus() {
    if (!this.container) return;
    
    // 오프라인 알림 추가
    const offlineNotice = createElement('div', {
      className: 'offline-notice'
    }, '오프라인 모드: 제한된 명령어만 사용 가능합니다.');
    
    // 컨테이너 맨 위에 알림 추가
    if (this.container.firstChild) {
      this.container.insertBefore(offlineNotice, this.container.firstChild);
    } else {
      appendElement(this.container, offlineNotice);
    }
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
    logger.log(`명령어 실행: ${commandId}`);
    
    // 버튼에 실행 중 시각적 표시
    const commandButton = this.findCommandButtonById(commandId);
    if (commandButton) {
      commandButton.classList.add('executing');
      
      // 실행 완료 후 표시 제거 (5초 타임아웃)
      setTimeout(() => {
        commandButton.classList.remove('executing');
      }, 5000);
    }
    
    if (this.vscode) {
      // VS Code API가 있는 경우 직접 실행
      try {
        this.vscode.postMessage({
          command: 'executeCommand',
          commandId: commandId
        });
        logger.log('VS Code API를 통해 명령어 실행됨');
      } catch (error) {
        logger.error('VS Code 실행 메시지 전송 실패:', error);
        // VS Code API가 실패하면 부모 창 통신 시도
        this.executeCommandViaParent(commandId);
      }
    } else if (this.parentWindow) {
      // iframe인 경우 부모 창에 요청
      this.executeCommandViaParent(commandId);
    } else {
      logger.error('VS Code API와 부모 창 모두 없어 명령어를 실행할 수 없습니다.');
      
      // 명령어 실행 실패 표시
      if (commandButton) {
        commandButton.classList.add('error');
        commandButton.classList.remove('executing');
        
        // 오류 표시 제거 (3초 후)
        setTimeout(() => {
          commandButton.classList.remove('error');
        }, 3000);
      }
      
      // 오프라인 상태라면 메시지 표시
      if (this._recoveryAttempts >= 5) {
        this.showOfflineCommandError(commandId);
      } else {
        // 통신 복구 메커니즘 시도
        this.setupRecoveryMechanism();
      }
    }
  }
  
  /**
   * 부모 창을 통해 명령어 실행
   */
  executeCommandViaParent(commandId) {
    // 부모 창 참조 재확인
    if (!this.parentWindow && window.parent && window.parent !== window) {
      this.parentWindow = window.parent;
      logger.log('실행: 부모 창 참조 지연 설정됨');
    }
    
    if (this.parentWindow) {
      try {
        this.parentWindow.postMessage({
          command: 'iframe_executeCommand',
          source: 'command_buttons',
          commandId: commandId,
          timestamp: Date.now()
        }, '*');
        logger.log('부모 창에 명령어 실행 요청 전송됨:', commandId);
      } catch (error) {
        logger.error('부모 창 실행 메시지 전송 실패:', error);
        
        // 명령어 버튼 오류 표시
        const commandButton = this.findCommandButtonById(commandId);
        if (commandButton) {
          commandButton.classList.add('error');
          commandButton.classList.remove('executing');
          
          // 오류 표시 제거 (3초 후)
          setTimeout(() => {
            commandButton.classList.remove('error');
          }, 3000);
        }
      }
    }
  }
  
  /**
   * 명령어 버튼 찾기
   */
  findCommandButtonById(commandId) {
    if (!this.container) return null;
    
    return this.container.querySelector(`.command-button[data-command-id="${commandId}"]`);
  }
  
  /**
   * 오프라인 명령어 오류 표시
   */
  showOfflineCommandError(commandId) {
    // 명령어 버튼에 오류 표시
    const commandButton = this.findCommandButtonById(commandId);
    if (commandButton) {
      commandButton.classList.add('error');
      commandButton.classList.remove('executing');
      
      // 임시 툴팁 표시
      const errorTooltip = createElement('div', {
        className: 'error-tooltip'
      }, '오프라인 모드에서는 실행할 수 없습니다.');
      
      appendElement(commandButton, errorTooltip);
      
      // 툴팁 제거 (3초 후)
      setTimeout(() => {
        errorTooltip.remove();
        commandButton.classList.remove('error');
      }, 3000);
    }
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