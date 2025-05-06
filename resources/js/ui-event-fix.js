/**
 * APE UI 통합 이벤트 핸들링 수정
 * 
 * 이 스크립트는 모델 선택기와 APE 버튼 간의 이벤트 핸들링 충돌 문제를 해결합니다.
 * 기존 핸들러를 제거하고 일관된 방식으로 다시 설정합니다.
 */

// 디버깅 로깅을 위한 네임스페이스
if (!window.apeDebug) {
  window.apeDebug = {
    log: function(message) {
      console.log('[APE Debug]:', message);
    },
    error: function(message) {
      console.error('[APE Error]:', message);
    },
    warn: function(message) {
      console.warn('[APE Warning]:', message);
    }
  };
}

// 문서 완전 로드 후 실행
document.addEventListener('DOMContentLoaded', function() {
  window.apeDebug.log('UI 이벤트 핸들링 수정 초기화 중...');
  
  // 100ms 지연 후 초기화 (다른 스크립트가 DOM을 수정할 시간 제공)
  setTimeout(initializeEventFixes, 100);
});

/**
 * UI 이벤트 핸들링 문제 수정 초기화
 */
function initializeEventFixes() {
  // 모든 핵심 UI 요소 가져오기
  const uiElements = {
    apeToggleButton: document.getElementById('apeToggleButton'),
    modelSelector: document.getElementById('modelSelector'),
    modelSelectorHeader: document.querySelector('#modelSelector .model-selector-header'),
    chatInput: document.getElementById('chatInput'),
    sendButton: document.getElementById('sendButton'),
    clearButton: document.getElementById('clearButton'),
    embedDevButton: document.getElementById('embedDevButton'),
    commandsButton: document.getElementById('commandsButton')
  };
  
  // UI 요소 존재 여부 확인
  let missingElements = [];
  Object.entries(uiElements).forEach(([name, element]) => {
    if (!element) {
      missingElements.push(name);
    }
  });
  
  if (missingElements.length > 0) {
    window.apeDebug.warn(`찾을 수 없는 UI 요소: ${missingElements.join(', ')}`);
    window.apeDebug.log('보다 긴 지연 후 다시 시도합니다...');
    
    // 지연 후 다시 시도 (DOM이 완전히 로드될 시간 제공)
    setTimeout(initializeEventFixes, 500);
    return;
  }
  
  // 모든 UI 요소를 찾았습니다
  window.apeDebug.log('모든 UI 요소를 발견했습니다. 이벤트 핸들러 재설정을 시작합니다...');
  
  // 기존 이벤트 리스너 제거 및 새 핸들러 설정
  resetEventHandlers(uiElements);
  
  // APE 모드 토글 버튼 이벤트 강화
  enhanceApeToggleButton(uiElements.apeToggleButton);
  
  // 모델 선택기 이벤트 강화
  enhanceModelSelector(uiElements.modelSelector, uiElements.modelSelectorHeader, uiElements.chatInput);
  
  // 문서 수준 이벤트 위임 설정
  setupDocumentLevelDelegation(uiElements);
  
  // 모델-챗 입력 연결 강화
  enhanceModelChatIntegration(uiElements);
  
  window.apeDebug.log('UI 이벤트 핸들링 수정 초기화 완료');
}

/**
 * 기존 이벤트 리스너 제거 및 새 핸들러 설정
 */
function resetEventHandlers(elements) {
  // 이벤트 핸들러 강화가 필요한 버튼 목록
  const buttonsToEnhance = [
    { element: elements.apeToggleButton, id: 'apeToggleButton', handler: handleApeToggle },
    { element: elements.clearButton, id: 'clearButton', handler: handleClearChat },
    { element: elements.sendButton, id: 'sendButton', handler: handleSendMessage },
    { element: elements.embedDevButton, id: 'embedDevButton', handler: handleEmbedDevToggle },
    { element: elements.commandsButton, id: 'commandsButton', handler: handleCommandsToggle }
  ];
  
  // 각 버튼 이벤트 핸들러 재설정
  buttonsToEnhance.forEach(button => {
    if (!button.element) return;
    
    window.apeDebug.log(`${button.id} 이벤트 핸들러 재설정 중...`);
    
    // 기존 이벤트 핸들러 제거 (클론 방식)
    const newButton = button.element.cloneNode(true);
    button.element.parentNode.replaceChild(newButton, button.element);
    
    // 새 이벤트 리스너 추가
    newButton.addEventListener('click', function(e) {
      window.apeDebug.log(`${button.id} 클릭됨`);
      e.stopPropagation(); // 이벤트 버블링 방지
      button.handler(e);
    });
    
    // 참조 업데이트
    elements[button.id] = newButton;
  });
}

/**
 * APE 모드 토글 버튼 이벤트 강화
 */
function enhanceApeToggleButton(button) {
  if (!button) return;
  
  window.apeDebug.log('APE 토글 버튼 이벤트 강화 중...');
  
  // 스타일 추가하여 버튼 강조
  button.style.position = 'relative';
  button.style.zIndex = '10';
  
  // 마우스 이벤트 추가
  button.addEventListener('mouseenter', function() {
    this.style.boxShadow = '0 0 5px rgba(0, 120, 212, 0.7)';
  });
  
  button.addEventListener('mouseleave', function() {
    this.style.boxShadow = '';
  });
  
  window.apeDebug.log('APE 토글 버튼 이벤트 강화 완료');
}

/**
 * 모델 선택기 이벤트 강화
 */
function enhanceModelSelector(selector, header, chatInput) {
  if (!selector || !header) return;
  
  window.apeDebug.log('모델 선택기 이벤트 강화 중...');
  
  // 스타일 강화
  selector.style.position = 'relative';
  selector.style.zIndex = '100';
  
  // 모델 선택 통합 핸들러
  function integratedModelSelectHandler(modelId) {
    window.apeDebug.log(`모델 선택됨: ${modelId}`);
    
    // 채팅 입력창에 모델 ID 설정
    if (chatInput) {
      chatInput.dataset.model = modelId;
      window.apeDebug.log(`채팅 입력창에 모델 ID 설정: ${modelId}`);
    }
    
    // VS Code에 모델 변경 알림
    try {
      const vscode = acquireVsCodeApi();
      vscode.postMessage({
        command: 'changeModel',
        model: modelId
      });
      window.apeDebug.log('VS Code에 모델 변경 알림 전송 완료');
    } catch (error) {
      window.apeDebug.error('VS Code API 접근 실패:', error);
    }
  }
  
  // 모델 선택기 객체 확인 및 연결
  if (window.modelSelector) {
    // 기존 모델 선택기에 통합 핸들러 연결
    const originalOnChange = window.modelSelector.options.onChange;
    window.modelSelector.options.onChange = function(modelId) {
      // 원래 핸들러 호출
      if (typeof originalOnChange === 'function') {
        originalOnChange(modelId);
      }
      
      // 통합 핸들러 호출
      integratedModelSelectHandler(modelId);
    };
    
    window.apeDebug.log('기존 모델 선택기에 통합 핸들러 연결됨');
  } else {
    window.apeDebug.warn('모델 선택기 객체를 찾을 수 없습니다. 모델 변경 이벤트를 추적할 수 없습니다.');
  }
  
  window.apeDebug.log('모델 선택기 이벤트 강화 완료');
}

/**
 * 모델-채팅 입력 연결 강화
 */
function enhanceModelChatIntegration(elements) {
  const { chatInput } = elements;
  if (!chatInput) return;
  
  window.apeDebug.log('모델-채팅 입력 연결 강화 중...');
  
  // 현재 선택된 모델이 없으면 설정 시도
  if (!chatInput.dataset.model && window.modelSelector) {
    const currentModelId = window.modelSelector.getCurrentModelId();
    if (currentModelId) {
      chatInput.dataset.model = currentModelId;
      window.apeDebug.log(`채팅 입력창에 현재 모델 ID 설정: ${currentModelId}`);
    }
  }
  
  // 메세지 전송 전에 모델 ID 확인하는 이벤트 리스너
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey && window.modelSelector) {
      const currentModelId = window.modelSelector.getCurrentModelId();
      if (currentModelId && this.dataset.model !== currentModelId) {
        this.dataset.model = currentModelId;
        window.apeDebug.log(`채팅 입력창 모델 ID 업데이트: ${currentModelId}`);
      }
    }
  });
  
  window.apeDebug.log('모델-채팅 입력 연결 강화 완료');
}

/**
 * 문서 레벨 이벤트 위임 설정
 */
function setupDocumentLevelDelegation(elements) {
  window.apeDebug.log('문서 레벨 이벤트 위임 설정 중...');
  
  // 문서 전체에 이벤트 리스너 추가 (캡처 단계 - 버블링보다 먼저 실행)
  document.addEventListener('click', function(event) {
    // 버튼 또는 버튼 내부 요소 클릭 감지
    let targetElement = event.target;
    let buttonElement = targetElement.tagName === 'BUTTON' ? 
                       targetElement : targetElement.closest('button');
    
    if (buttonElement) {
      const buttonId = buttonElement.id || '[ID 없음]';
      const buttonText = buttonElement.textContent.trim() || '[텍스트 없음]';
      
      window.apeDebug.log(`문서 레벨 캡처: 버튼 클릭됨 (ID: ${buttonId}, 텍스트: ${buttonText})`);
      
      // APE 토글 버튼 특별 처리
      if (buttonId === 'apeToggleButton' && elements.apeToggleButton === buttonElement) {
        window.apeDebug.log('문서 레벨 캡처: APE 토글 버튼 처리');
        // 단일 핸들러 보장을 위해 이벤트 중지
        if (!event.handled) {
          event.handled = true;
          handleApeToggle(event);
        }
      }
    }
    
    // 모델 선택기 헤더 클릭 감지
    if (elements.modelSelectorHeader && 
        (targetElement === elements.modelSelectorHeader || 
         elements.modelSelectorHeader.contains(targetElement))) {
      window.apeDebug.log('문서 레벨 캡처: 모델 선택기 헤더 클릭됨');
    }
    
  }, true); // true는 캡처 단계를 의미
  
  window.apeDebug.log('문서 레벨 이벤트 위임 설정 완료');
}

/**
 * APE 모드 토글 처리
 */
function handleApeToggle(event) {
  window.apeDebug.log('APE 모드 토글 함수 호출됨');
  
  // 중복 실행 방지
  if (event.preventToggle) return;
  event.preventToggle = true;
  
  // 방법 1: window.apeUI 객체를 통한 처리
  if (window.apeUI) {
    if (typeof window.apeUI.toggleApeMode === 'function') {
      window.apeDebug.log('apeUI.toggleApeMode 함수 호출');
      window.apeUI.toggleApeMode();
      return true;
    } else if (window.apeUI.container && typeof window.apeUI.container.toggleApeMode === 'function') {
      window.apeDebug.log('apeUI.container.toggleApeMode 함수 호출');
      window.apeUI.container.toggleApeMode();
      return true;
    }
  }
  
  // 방법 2: window.ApeHybridUI 객체 사용
  if (window.ApeHybridUI && typeof window.ApeHybridUI.prototype.toggleApeMode === 'function') {
    window.apeDebug.log('ApeHybridUI 생성 및 toggleApeMode 호출');
    const tempUI = new window.ApeHybridUI();
    tempUI.toggleApeMode();
    return true;
  }
  
  // 방법 3: VS Code에 직접 메시지 전송
  try {
    const vscode = acquireVsCodeApi();
    window.apeDebug.log('VS Code API를 통해 toggleApeMode 메시지 전송');
    vscode.postMessage({
      command: 'toggleApeMode',
      enabled: true // 현재 상태를 알 수 없으므로 활성화 시도
    });
    return true;
  } catch (error) {
    window.apeDebug.error('VS Code API 접근 실패:', error);
  }
  
  window.apeDebug.error('APE 모드 토글 방법을 찾지 못했습니다.');
  return false;
}

/**
 * 채팅 지우기 처리
 */
function handleClearChat(event) {
  window.apeDebug.log('채팅 지우기 함수 호출됨');
  
  try {
    const vscode = acquireVsCodeApi();
    vscode.postMessage({ command: 'clearChat' });
    window.apeDebug.log('clearChat 메시지 전송됨');
    return true;
  } catch (error) {
    window.apeDebug.error('VS Code API 접근 실패:', error);
    return false;
  }
}

/**
 * 메시지 전송 처리
 */
function handleSendMessage(event) {
  window.apeDebug.log('메시지 전송 함수 호출됨');
  
  const chatInput = document.getElementById('chatInput');
  if (!chatInput) {
    window.apeDebug.error('채팅 입력창을 찾을 수 없습니다.');
    return false;
  }
  
  const text = chatInput.value.trim();
  if (!text) {
    window.apeDebug.log('전송할 텍스트가 없습니다.');
    return false;
  }
  
  // window.apeUI를 통해 전송
  if (window.apeUI && typeof window.apeUI.sendMessage === 'function') {
    window.apeDebug.log('apeUI.sendMessage를 통해 메시지 전송');
    window.apeUI.sendMessage();
    return true;
  }
  
  // VS Code에 직접 메시지 전송
  try {
    const vscode = acquireVsCodeApi();
    const modelId = chatInput.dataset.model;
    
    window.apeDebug.log(`VS Code API를 통해 메시지 전송: "${text}", 모델: ${modelId || '기본값'}`);
    
    vscode.postMessage({
      command: 'sendMessage',
      text: text,
      model: modelId
    });
    
    // 입력창 초기화
    chatInput.value = '';
    
    return true;
  } catch (error) {
    window.apeDebug.error('VS Code API 접근 실패:', error);
    return false;
  }
}

/**
 * 심층 분석 모드 토글 처리
 */
function handleEmbedDevToggle(event) {
  window.apeDebug.log('심층 분석 모드 토글 함수 호출됨');
  
  // window.apeUI를 통해 토글
  if (window.apeUI && typeof window.apeUI.toggleEmbedDevMode === 'function') {
    window.apeDebug.log('apeUI.toggleEmbedDevMode를 통해 심층 분석 모드 토글');
    window.apeUI.toggleEmbedDevMode();
    return true;
  }
  
  // VS Code에 직접 메시지 전송
  try {
    const vscode = acquireVsCodeApi();
    const button = document.getElementById('embedDevButton');
    const isActive = button && button.classList.contains('active');
    
    window.apeDebug.log(`VS Code API를 통해 심층 분석 모드 토글: ${!isActive}`);
    
    vscode.postMessage({
      command: 'toggleEmbedDevMode',
      enabled: !isActive
    });
    
    // 버튼 상태 토글
    if (button) {
      button.classList.toggle('active');
    }
    
    return true;
  } catch (error) {
    window.apeDebug.error('VS Code API 접근 실패:', error);
    return false;
  }
}

/**
 * 명령어 패널 토글 처리
 */
function handleCommandsToggle(event) {
  window.apeDebug.log('명령어 패널 토글 함수 호출됨');
  
  // window.apeUI를 통해 토글
  if (window.apeUI && typeof window.apeUI.toggleCommandPanel === 'function') {
    window.apeDebug.log('apeUI.toggleCommandPanel를 통해 명령어 패널 토글');
    window.apeUI.toggleCommandPanel();
    return true;
  }
  
  // 직접 패널 토글
  const panelContainer = document.getElementById('commandsPanelContainer');
  const button = document.getElementById('commandsButton');
  
  if (panelContainer) {
    const isVisible = panelContainer.style.display !== 'none';
    
    window.apeDebug.log(`명령어 패널 토글: ${!isVisible ? '표시' : '숨김'}`);
    
    panelContainer.style.display = isVisible ? 'none' : 'block';
    
    if (button) {
      button.classList.toggle('active', !isVisible);
    }
    
    // VS Code에 명령어 요청
    if (!isVisible) {
      try {
        const vscode = acquireVsCodeApi();
        vscode.postMessage({
          command: 'getCommands'
        });
      } catch (error) {
        window.apeDebug.error('VS Code API 접근 실패:', error);
      }
    }
    
    return true;
  }
  
  window.apeDebug.error('명령어 패널 컨테이너를 찾을 수 없습니다.');
  return false;
}

// 전역 수준의 보조 함수 등록
window.apeUIFix = {
  toggleApeMode: function() {
    const button = document.getElementById('apeToggleButton');
    if (button) {
      window.apeDebug.log('apeToggleButton 클릭 시뮬레이션');
      button.click();
    } else {
      window.apeDebug.error('apeToggleButton을 찾을 수 없습니다.');
      
      // 가상 이벤트로 시도
      const fakeEvent = new Event('click');
      handleApeToggle(fakeEvent);
    }
  },
  
  debugButtons: function() {
    const buttons = document.querySelectorAll('button');
    console.log('===== 버튼 상태 디버그 =====');
    buttons.forEach((button, idx) => {
      console.log(`${idx+1}. ID: ${button.id || '없음'}, 텍스트: ${button.textContent.trim() || '없음'}`);
      console.log(`   클래스: ${button.className}`);
      console.log(`   보임: ${window.getComputedStyle(button).display !== 'none'}`);
      console.log(`   이벤트 핸들러: ${button.onclick ? '있음(onclick)' : '없음(onclick)'}, ${button.getAttribute('onclick') ? '있음(attr)' : '없음(attr)'}`);
    });
    return '버튼 상태가 콘솔에 출력되었습니다.';
  },
  
  debugModelSelector: function() {
    if (!window.modelSelector) {
      return '모델 선택기 객체를 찾을 수 없습니다.';
    }
    
    console.log('===== 모델 선택기 상태 =====');
    console.log(`선택된 모델: ${window.modelSelector.selectedModelId || '없음'}`);
    console.log(`모델 개수: ${window.modelSelector.options.models?.length || 0}`);
    console.log(`드롭다운 열림: ${window.modelSelector.isDropdownOpen ? window.modelSelector.isDropdownOpen() : '알 수 없음'}`);
    
    // 채팅 입력창 확인
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      console.log(`채팅 입력창 dataset.model: ${chatInput.dataset.model || '없음'}`);
    }
    
    return '모델 선택기 상태가 콘솔에 출력되었습니다.';
  }
};

// MutationObserver를 사용하여 DOM 변경 감지
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // 새로 추가된 노드 중 관심 있는 요소가 있는지 확인
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // APE 토글 버튼이 다시 추가된 경우
          if (node.id === 'apeToggleButton' || node.querySelector('#apeToggleButton')) {
            window.apeDebug.log('APE 토글 버튼이 다시 추가되었습니다. 이벤트 핸들러 재설정 중...');
            setTimeout(initializeEventFixes, 10);
          }
          
          // 모델 선택기가 다시 추가된 경우
          if (node.id === 'modelSelector' || node.querySelector('#modelSelector')) {
            window.apeDebug.log('모델 선택기가 다시 추가되었습니다. 이벤트 핸들러 재설정 중...');
            setTimeout(initializeEventFixes, 10);
          }
        }
      });
    }
  });
});

// 전체 문서에 대한 변경 감지 설정
observer.observe(document.body, {
  childList: true,
  subtree: true
});