/**
 * 향상된 APE UI 이벤트 처리 수정 스크립트
 * 
 * 이 스크립트는 APE 확장 프로그램의 UI 이벤트 처리 문제를 해결하기 위한 개선된 로직을 제공합니다.
 * 특히 모델 선택기와 도구 활용 모드 버튼이 제대로 작동하지 않는 문제를 해결합니다.
 */

// 글로벌 네임스페이스 오염 방지를 위한 IIFE (Immediately Invoked Function Expression)
(function() {
  // 디버그 로거 설정
  const debugEnabled = true;
  
  const debug = {
    log: function(message) {
      if (debugEnabled) console.log('[APE UI Fix]:', message);
    },
    error: function(message) {
      console.error('[APE UI Fix ERROR]:', message);
    },
    warn: function(message) {
      console.warn('[APE UI Fix WARNING]:', message);
    },
    info: function(message) {
      console.info('[APE UI Fix INFO]:', message);
    }
  };
  
  // VS Code API 가져오기
  let vscode;
  try {
    vscode = acquireVsCodeApi();
    debug.log('VS Code API 성공적으로 가져옴');
  } catch (e) {
    debug.error('VS Code API 가져오기 실패:', e);
    // VS Code API 없이도 계속 진행
  }
  
  // 주요 UI 요소 참조를 저장할 객체
  const elements = {
    modelSelector: null,
    modelDropdown: null,
    modelHeader: null,
    chatInput: null,
    sendButton: null,
    apeToggleButton: null,
    commandsButton: null,
    clearButton: null,
    embedDevButton: null
  };
  
  // 이벤트 하이재킹 방지를 위한 플래그
  let isProcessingEvent = false;
  
  // 초기화 함수
  function initialize() {
    debug.log('향상된 UI 이벤트 처리 초기화 시작');
    
    // DOM이 완전히 로드된 후 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeAfterDOM);
    } else {
      initializeAfterDOM();
    }
  }
  
  // DOM 로드 후 초기화
  function initializeAfterDOM() {
    debug.log('DOM 로드 완료, UI 요소 캐싱 시작');
    
    // 주요 UI 요소 캐싱
    elements.modelSelector = document.getElementById('modelSelector');
    elements.chatInput = document.getElementById('chatInput');
    elements.sendButton = document.getElementById('sendButton');
    elements.apeToggleButton = document.getElementById('apeToggleButton');
    elements.commandsButton = document.getElementById('commandsButton');
    elements.clearButton = document.getElementById('clearButton');
    elements.embedDevButton = document.getElementById('embedDevButton');
    
    // 모델 선택기 관련 요소는 지연 초기화 (나중에 로드될 수 있음)
    setTimeout(() => {
      elements.modelHeader = document.querySelector('.model-selector-header');
      elements.modelDropdown = document.querySelector('.model-selector-dropdown');
      if (elements.modelHeader) {
        debug.log('모델 선택기 헤더 요소를 찾았습니다.');
      } else {
        debug.warn('모델 선택기 헤더 요소를 찾을 수 없습니다.');
      }
    }, 1000);
    
    // 이벤트 수정 로직 시작
    fixEventHandlers();
    setupSafeEventDelegation();
    synchronizeModelState();
    fixModelSelection();
    
    // 주기적인 모니터링
    setInterval(monitorUI, 5000);
    
    debug.log('향상된 UI 이벤트 처리 초기화 완료');
  }
  
  // 이벤트 핸들러 수정
  function fixEventHandlers() {
    debug.log('이벤트 핸들러 수정 시작');
    
    // APE 토글 버튼 이벤트 수정
    if (elements.apeToggleButton) {
      debug.log('APE 토글 버튼 이벤트 수정 중');
      
      // 기존 이벤트 핸들러에 영향을 주지 않도록 캡처 단계에서 이벤트 추가
      elements.apeToggleButton.addEventListener('click', handleApeToggleClick, true);
      debug.log('APE 토글 버튼에 캡처 단계 이벤트 리스너 추가됨');
      
      // onclick 속성이 덮어쓰이지 않도록 보존
      const originalOnclick = elements.apeToggleButton.onclick;
      
      // 이 코드는 혼란을 줄이기 위해 기존 onclick을 덮어쓰지 않습니다.
      // 대신 별도의 리스너로 추가합니다.
    }
    
    // 모델 선택기 이벤트 수정은 지연 처리 (요소가 나중에 로드될 수 있음)
    setTimeout(() => {
      if (elements.modelHeader) {
        debug.log('모델 선택기 헤더 이벤트 수정 중');
        // 버블링 단계에서 이벤트 리스너 추가 (기존 이벤트 핸들러 보존)
        elements.modelHeader.addEventListener('click', handleModelHeaderClick);
      }
    }, 1500);
    
    debug.log('이벤트 핸들러 수정 완료');
  }
  
  // 안전한 이벤트 위임 설정
  function setupSafeEventDelegation() {
    debug.log('안전한 이벤트 위임 설정 중');
    
    // 문서 레벨 이벤트 위임 (캡처 단계)
    document.addEventListener('click', function(event) {
      // 이벤트가 이미 처리 중인 경우 중복 처리 방지
      if (isProcessingEvent) return;
      
      // 클릭된 요소 또는 가장 가까운 버튼 찾기
      const clickedButton = event.target.closest('button');
      if (!clickedButton) return;
      
      const buttonId = clickedButton.id;
      debug.log(`문서 레벨 이벤트 위임: 버튼 클릭됨 (ID: ${buttonId || '없음'})`);
      
      // 특정 버튼에 대한 별도 처리
      if (buttonId === 'apeToggleButton') {
        // 이벤트 처리 중 플래그 설정
        isProcessingEvent = true;
        
        // 비동기 처리를 위해 setTimeout 사용 (이벤트 루프에서 분리)
        setTimeout(() => {
          safelyToggleApeMode();
          isProcessingEvent = false;
        }, 0);
      }
    }, true); // true = 캡처 단계에서 처리
    
    debug.log('안전한 이벤트 위임 설정 완료');
  }
  
  // APE 토글 버튼 클릭 핸들러
  function handleApeToggleClick(event) {
    debug.log('APE 토글 버튼 클릭 핸들러 호출됨');
    
    // 이미 처리 중인 이벤트인 경우 중복 처리 방지
    if (isProcessingEvent) {
      debug.log('이벤트가 이미 처리 중입니다. 중복 처리 방지.');
      return;
    }
    
    // 이벤트 처리 중 플래그 설정
    isProcessingEvent = true;
    
    try {
      // 이벤트 전파 중지하지 않음 (다른 핸들러도 실행되도록)
      // event.stopPropagation();
      
      // 안전하게 APE 모드 토글
      safelyToggleApeMode();
    } catch (error) {
      debug.error('APE 토글 처리 중 오류 발생:', error);
    } finally {
      // 플래그 해제
      isProcessingEvent = false;
    }
  }
  
  // 모델 선택기 헤더 클릭 핸들러
  function handleModelHeaderClick(event) {
    debug.log('모델 선택기 헤더 클릭 핸들러 호출됨');
    
    // 다른 클릭 이벤트와 충돌하지 않도록 플래그 설정하지 않음
    // 모델 선택기의 원래 기능은 보존
    
    // 모델 상태 동기화 (선택된 모델이 chatInput 요소에 반영되도록)
    setTimeout(synchronizeModelState, 100);
  }
  
  // 안전하게 APE 모드 토글
  function safelyToggleApeMode() {
    debug.log('안전하게 APE 모드 토글 시도');
    
    if (!vscode) {
      debug.error('VS Code API를 찾을 수 없어 APE 모드를 토글할 수 없습니다.');
      return false;
    }
    
    try {
      // APE 모드 토글 메시지 전송
      debug.log('VS Code에 toggleApeMode 메시지 전송');
      vscode.postMessage({
        command: 'toggleApeMode'
      });
      
      // 버튼 시각적 피드백
      if (elements.apeToggleButton) {
        elements.apeToggleButton.classList.add('button-active');
        setTimeout(() => {
          elements.apeToggleButton.classList.remove('button-active');
        }, 200);
      }
      
      return true;
    } catch (error) {
      debug.error('APE 모드 토글 중 오류 발생:', error);
      return false;
    }
  }
  
  // 모델 상태 동기화
  function synchronizeModelState() {
    debug.log('모델 상태 동기화 시도');
    
    try {
      // 모델 선택기 객체 접근 시도
      const modelSelectorObj = window.modelSelector;
      
      if (modelSelectorObj && typeof modelSelectorObj.getCurrentModelId === 'function') {
        const currentModelId = modelSelectorObj.getCurrentModelId();
        debug.log(`현재 선택된 모델 ID: ${currentModelId || '없음'}`);
        
        // 채팅 입력창에 모델 ID 설정
        if (elements.chatInput && currentModelId) {
          elements.chatInput.dataset.modelId = currentModelId;
          debug.log(`채팅 입력창의 data-model-id 속성을 "${currentModelId}"로 설정`);
        }
      } else {
        // 모델 선택기 객체를 직접 찾을 수 없는 경우 DOM에서 시도
        const modelTitle = document.querySelector('.model-selector-title');
        if (modelTitle) {
          const modelName = modelTitle.textContent;
          debug.log(`DOM에서 찾은 선택된 모델 이름: ${modelName}`);
          
          // 모델 이름으로부터 ID 추론 (선택적)
          // (실제 ID는 일반적으로 이름과 다를 수 있으므로 이 부분은 필요에 따라 구현)
        }
      }
    } catch (error) {
      debug.error('모델 상태 동기화 중 오류 발생:', error);
    }
  }
  
  // 모델 선택 수정
  function fixModelSelection() {
    debug.log('모델 선택 이벤트 수정 시도');
    
    // 지연 처리 (모델 선택기가 완전히 초기화된 후)
    setTimeout(() => {
      // 모델 옵션 요소에 직접 이벤트 리스너 추가
      const modelOptions = document.querySelectorAll('.model-option');
      
      modelOptions.forEach(option => {
        debug.log(`모델 옵션 발견: ${option.textContent.trim()}`);
        
        // 클릭 이벤트 리스너 추가 (기존 이벤트 보존)
        option.addEventListener('click', function(event) {
          const modelId = this.dataset.id;
          debug.log(`모델 옵션 클릭됨: ${modelId}`);
          
          // 채팅 입력창에 모델 ID 직접 설정
          if (elements.chatInput && modelId) {
            setTimeout(() => {
              elements.chatInput.dataset.modelId = modelId;
              debug.log(`채팅 입력창의 data-model-id 속성을 "${modelId}"로 설정 (직접 모델 옵션 클릭 처리)`);
            }, 100);
          }
        });
      });
    }, 2000);
    
    // MutationObserver로 새로 추가되는 모델 옵션 감시
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          
          addedNodes.forEach(node => {
            // 요소 노드이고 모델 옵션 클래스를 가진 경우
            if (node.nodeType === 1 && node.classList && node.classList.contains('model-option')) {
              debug.log(`새 모델 옵션 추가됨: ${node.textContent.trim()}`);
              
              // 클릭 이벤트 리스너 추가
              node.addEventListener('click', function() {
                const modelId = this.dataset.id;
                debug.log(`새로 추가된 모델 옵션 클릭됨: ${modelId}`);
                
                // 채팅 입력창에 모델 ID 직접 설정
                if (elements.chatInput && modelId) {
                  setTimeout(() => {
                    elements.chatInput.dataset.modelId = modelId;
                    debug.log(`채팅 입력창의 data-model-id 속성을 "${modelId}"로 설정 (MutationObserver)`);
                  }, 100);
                }
              });
            }
          });
        }
      });
    });
    
    // 모델 드롭다운 관찰
    if (elements.modelSelector) {
      observer.observe(elements.modelSelector, { childList: true, subtree: true });
      debug.log('모델 선택기 MutationObserver 설정 완료');
    } else {
      debug.warn('모델 선택기 요소를 찾을 수 없어 MutationObserver를 설정할 수 없습니다.');
      
      // 나중에 다시 시도
      setTimeout(() => {
        const laterModelSelector = document.getElementById('modelSelector');
        if (laterModelSelector) {
          observer.observe(laterModelSelector, { childList: true, subtree: true });
          debug.log('모델 선택기 MutationObserver 설정 완료 (지연)');
        }
      }, 3000);
    }
  }
  
  // UI 상태 모니터링
  function monitorUI() {
    // 주요 UI 요소 존재 여부 확인
    const elementStatus = {
      modelSelector: !!elements.modelSelector,
      chatInput: !!elements.chatInput,
      sendButton: !!elements.sendButton,
      apeToggleButton: !!elements.apeToggleButton
    };
    
    // 모델 ID 동기화 검사
    if (elements.chatInput) {
      const modelIdAttribute = elements.chatInput.dataset.modelId;
      if (!modelIdAttribute) {
        debug.warn('채팅 입력창에 data-model-id 속성이 없습니다. 모델 상태 동기화 필요.');
        synchronizeModelState();
      }
    }
    
    // APE 토글 버튼 이벤트 리스너 재확인
    if (elements.apeToggleButton) {
      // 이벤트 핸들러 존재 여부는 직접 확인할 수 없으므로
      // 필요한 경우 여기서 이벤트 핸들러를 다시 추가할 수 있습니다.
    }
  }
  
  // 모든 에러에 대한 전역 핸들러
  window.addEventListener('error', function(event) {
    debug.error(`전역 오류 포착: ${event.message} (${event.filename}:${event.lineno})`);
  });
  
  // 공개 메서드
  window.enhancedUiFix = {
    // 문제가 있는 경우 수동으로 호출할 수 있는 메서드들
    fixEventHandlers,
    synchronizeModelState,
    safelyToggleApeMode
  };
  
  // 초기화 시작
  initialize();
})();