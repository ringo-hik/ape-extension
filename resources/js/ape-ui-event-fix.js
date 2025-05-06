/**
 * APE UI 이벤트 처리 문제 수정 및 디버깅
 * 
 * 이 스크립트는 APE 확장 프로그램의 UI 이벤트 처리 문제를 해결하기 위한 추가 로직을 제공합니다.
 * 특히 '도구 활용 모드' 버튼과 기타 UI 이벤트가 제대로 작동하지 않는 문제를 해결합니다.
 */

// 전역 이벤트 디버거 설정
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

// 문서 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
  window.apeDebug.log('APE UI 이벤트 수정 모듈 초기화 중...');
  
  // 중요 버튼 이벤트 핸들러 강화
  fixButtonEventHandlers();
  
  // 문서 레벨 이벤트 위임 설정
  setupDocumentLevelDelegation();
  
  // DOM 변경 감지 설정
  setupMutationObserver();
  
  // 전역 수준 이벤트 캡처 추가
  captureAllClicks();
  
  window.apeDebug.log('APE UI 이벤트 수정 모듈 초기화 완료');
});

/**
 * 버튼 이벤트 핸들러 수정
 */
function fixButtonEventHandlers() {
  window.apeDebug.log('버튼 이벤트 핸들러 강화 중...');
  
  // 중요 버튼 ID 목록
  const criticalButtons = [
    'apeToggleButton',    // 도구 활용 모드 버튼
    'commandsButton',     // 명령어 버튼
    'sendButton',         // 전송 버튼
    'clearButton',        // 지우기 버튼
    'embedDevButton'      // 심층 분석 버튼
  ];
  
  // 각 버튼에 강화된 이벤트 핸들러 추가
  criticalButtons.forEach(function(buttonId) {
    const button = document.getElementById(buttonId);
    
    if (button) {
      window.apeDebug.log(`${buttonId} 버튼 이벤트 핸들러 추가 중...`);
      
      // 기존 이벤트 핸들러 제거 (충돌 방지)
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // 새 이벤트 리스너 추가
      newButton.addEventListener('click', function(e) {
        window.apeDebug.log(`${buttonId} 버튼 클릭됨 (기본 이벤트)`);
        
        // 도구 활용 모드 버튼 특별 처리
        if (buttonId === 'apeToggleButton') {
          window.apeDebug.log('도구 활용 모드 토글 처리 중...');
          handleApeToggle(e);
        }
      });
      
      // 인라인 onclick 이벤트 추가 (여러 방식으로 이벤트 처리 보장)
      newButton.onclick = function(e) {
        window.apeDebug.log(`${buttonId} 버튼 onclick 이벤트 발생`);
        
        // 도구 활용 모드 버튼 특별 처리
        if (buttonId === 'apeToggleButton') {
          window.apeDebug.log('도구 활용 모드 토글 처리 중... (onclick)');
          handleApeToggle(e);
        }
      };
      
      // 시각적 피드백 추가
      newButton.classList.add('enhanced-button');
      
      // 마우스 이벤트 추가
      newButton.addEventListener('mousedown', function() {
        this.classList.add('button-active');
      });
      
      newButton.addEventListener('mouseup', function() {
        this.classList.remove('button-active');
      });
      
      newButton.addEventListener('mouseleave', function() {
        this.classList.remove('button-active');
      });
      
      window.apeDebug.log(`${buttonId} 버튼 이벤트 핸들러 추가 완료`);
    } else {
      window.apeDebug.warn(`${buttonId} 버튼을 찾을 수 없습니다. 지연 검색 예약...`);
      
      // 지연 검색 시도 - DOM 요소가 늦게 로드될 수 있음
      setTimeout(function() {
        const laterButton = document.getElementById(buttonId);
        if (laterButton) {
          window.apeDebug.log(`지연 검색으로 ${buttonId} 버튼을 발견함`);
          
          // 클릭 이벤트 핸들러 추가
          laterButton.addEventListener('click', function(e) {
            window.apeDebug.log(`${buttonId} 버튼 클릭됨 (지연 처리)`);
            
            // 도구 활용 모드 버튼 특별 처리
            if (buttonId === 'apeToggleButton') {
              window.apeDebug.log('도구 활용 모드 토글 처리 중... (지연 처리)');
              handleApeToggle(e);
            }
          });
          
          // 인라인 onclick 이벤트 추가
          laterButton.onclick = function(e) {
            window.apeDebug.log(`${buttonId} 버튼 onclick 이벤트 발생 (지연 처리)`);
            
            // 도구 활용 모드 버튼 특별 처리
            if (buttonId === 'apeToggleButton') {
              handleApeToggle(e);
            }
          };
        } else {
          window.apeDebug.error(`지연 검색 후에도 ${buttonId} 버튼을 찾을 수 없습니다.`);
        }
      }, 1500);
    }
  });
}

/**
 * 도구 활용 모드 토글 처리
 */
function handleApeToggle(event) {
  window.apeDebug.log('도구 활용 모드 토글 함수 호출됨');
  
  // 이벤트 처리 중지 (버블링 방지)
  event.stopPropagation();
  
  // 방법 1: apeUI 객체를 통한 처리
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
  
  // 방법 2: window.apeUI 객체가 없는 경우 하이브리드 UI 객체 찾기
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
  
  window.apeDebug.error('도구 활용 모드를 토글할 수 있는 방법을 찾지 못했습니다.');
  return false;
}

/**
 * 문서 레벨 이벤트 위임 설정
 */
function setupDocumentLevelDelegation() {
  window.apeDebug.log('문서 레벨 이벤트 위임 설정 중...');
  
  // 문서 전체에 이벤트 리스너 추가 (버블링 단계)
  document.addEventListener('click', function(event) {
    // 버튼 또는 버튼 내부 요소 클릭 감지
    let targetElement = event.target;
    let isButton = targetElement.tagName === 'BUTTON';
    let buttonElement = isButton ? targetElement : targetElement.closest('button');
    
    if (buttonElement) {
      const buttonId = buttonElement.id || '[ID 없음]';
      const buttonText = buttonElement.textContent.trim() || '[텍스트 없음]';
      
      window.apeDebug.log(`문서 레벨 이벤트 위임: 버튼 클릭됨 (ID: ${buttonId}, 텍스트: ${buttonText})`);
      
      // 특정 버튼 ID에 대한 처리
      if (buttonId === 'apeToggleButton') {
        window.apeDebug.log('문서 레벨 위임: 도구 활용 모드 버튼 처리');
        setTimeout(function() {
          handleApeToggle(event);
        }, 0);
      }
    }
  });
  
  window.apeDebug.log('문서 레벨 이벤트 위임 설정 완료');
}

/**
 * DOM 변경 감지를 위한 MutationObserver 설정
 */
function setupMutationObserver() {
  window.apeDebug.log('DOM 변경 감지 Observer 설정 중...');
  
  // 새로 추가되는 버튼에 이벤트 리스너 추가를 위한 MutationObserver
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      // 새로 추가된 노드 처리
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function(node) {
          // 요소 노드인 경우만 처리
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 버튼 ID가 apeToggleButton인 경우
            if (node.id === 'apeToggleButton') {
              window.apeDebug.log('MutationObserver: 도구 활용 모드 버튼이 DOM에 추가됨');
              
              // 이벤트 리스너 추가
              node.addEventListener('click', function(e) {
                window.apeDebug.log('새로 추가된 도구 활용 모드 버튼 클릭됨');
                handleApeToggle(e);
              });
              
              // 인라인 onclick 속성 추가
              node.onclick = function(e) {
                window.apeDebug.log('새로 추가된 도구 활용 모드 버튼 onclick 이벤트 발생');
                handleApeToggle(e);
              };
            }
            
            // 하위 요소에 버튼이 있는지 확인
            if (node.querySelectorAll) {
              const buttons = node.querySelectorAll('button');
              buttons.forEach(function(button) {
                if (button.id === 'apeToggleButton') {
                  window.apeDebug.log('MutationObserver: 하위 요소에 도구 활용 모드 버튼이 추가됨');
                  
                  // 이벤트 리스너 추가
                  button.addEventListener('click', function(e) {
                    window.apeDebug.log('하위 요소에 추가된 도구 활용 모드 버튼 클릭됨');
                    handleApeToggle(e);
                  });
                  
                  // 인라인 onclick 속성 추가
                  button.onclick = function(e) {
                    window.apeDebug.log('하위 요소에 추가된 도구 활용 모드 버튼 onclick 이벤트 발생');
                    handleApeToggle(e);
                  };
                }
              });
            }
          }
        });
      }
    });
  });
  
  // 전체 문서에 대해 변경 감지 설정
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  window.apeDebug.log('DOM 변경 감지 Observer 설정 완료');
}

/**
 * 모든 클릭 캡처
 */
function captureAllClicks() {
  window.apeDebug.log('모든 클릭 이벤트 캡처 설정 중...');
  
  // 캡처 단계에서 모든 클릭 이벤트 로깅
  document.addEventListener('click', function(event) {
    const target = event.target;
    const tagName = target.tagName;
    const id = target.id || '[ID 없음]';
    const classes = target.className || '[클래스 없음]';
    
    window.apeDebug.log(`클릭 캡처 (캡처 단계): 요소 ${tagName}#${id}.${classes}`);
    
    // 버튼 관련 클릭 특별 처리
    if (tagName === 'BUTTON' || target.closest('button')) {
      const button = tagName === 'BUTTON' ? target : target.closest('button');
      window.apeDebug.log(`버튼 클릭 감지: ${button.id || '[ID 없음]'} - ${button.textContent.trim() || '[텍스트 없음]'}`);
      
      // 도구 활용 모드 버튼 처리
      if (button.id === 'apeToggleButton' || button.textContent.includes('도구 활용 모드')) {
        window.apeDebug.log('도구 활용 모드 버튼 캡처 단계 처리');
        // 처리는 버블링 단계에서 수행하도록 함
      }
    }
  }, true); // true는 캡처 단계를 의미
  
  window.apeDebug.log('모든 클릭 이벤트 캡처 설정 완료');
}

// 글로벌 수준의 도구 활용 모드 토글 도우미 함수
window.toggleApeMode = function() {
  window.apeDebug.log('글로벌 toggleApeMode 함수 호출됨');
  
  // 도구 활용 모드 버튼 찾기
  const apeToggleButton = document.getElementById('apeToggleButton');
  
  if (apeToggleButton) {
    // 버튼 클릭 시뮬레이션
    window.apeDebug.log('apeToggleButton 클릭 시뮬레이션');
    apeToggleButton.click();
  } else {
    // 버튼을 찾을 수 없는 경우 직접 처리
    window.apeDebug.warn('apeToggleButton을 찾을 수 없어 직접 처리 시도');
    
    // 가상 이벤트 생성
    const fakeEvent = new Event('click', {
      bubbles: true,
      cancelable: true
    });
    
    // 이벤트 핸들러 호출
    handleApeToggle(fakeEvent);
  }
};

// 1초 후 이벤트 핸들러 상태 확인
setTimeout(function() {
  const apeToggleButton = document.getElementById('apeToggleButton');
  
  if (apeToggleButton) {
    window.apeDebug.log('apeToggleButton 상태 확인:');
    window.apeDebug.log(` - id: ${apeToggleButton.id}`);
    window.apeDebug.log(` - textContent: ${apeToggleButton.textContent.trim()}`);
    window.apeDebug.log(` - className: ${apeToggleButton.className}`);
    window.apeDebug.log(` - onclick 핸들러: ${apeToggleButton.onclick ? '있음' : '없음'}`);
    window.apeDebug.log(` - innerHTML: ${apeToggleButton.innerHTML}`);
    
    // 이벤트 리스너 목록은 직접 액세스할 수 없으므로 클릭 테스트
    window.apeDebug.log('apeToggleButton 클릭 테스트 준비 (5초 후 실행)');
    
    // 5초 후 테스트 클릭 (사용자가 수동으로 중단할 시간 제공)
    setTimeout(function() {
      window.apeDebug.log('apeToggleButton 테스트 클릭 시작...');
      // 실제 클릭은 하지 않고 로그만 남김 (사용자 혼란 방지)
      window.apeDebug.log('apeToggleButton 테스트 클릭을 건너뜀 (실제 사용자 상호작용 방해 방지)');
    }, 5000);
  } else {
    window.apeDebug.error('apeToggleButton을 찾을 수 없어 상태를 확인할 수 없습니다.');
  }
}, 1000);

// 글로벌 오류 핸들러
window.addEventListener('error', function(event) {
  window.apeDebug.error(`전역 오류 발생: ${event.message} (${event.filename}:${event.lineno})`);
});