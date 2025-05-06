/**
 * APE UI 디버깅 도구
 * 
 * 이 스크립트는 UI 이벤트 문제를 디버깅하기 위한 도구를 제공합니다.
 */

// 디버깅 네임스페이스
if (!window.apeUIDebug) {
  window.apeUIDebug = {
    // 모든 UI 요소 상태 기록
    logAllUIElements: function() {
      console.log('===== UI 요소 상태 기록 =====');
      
      // 중요 요소 목록
      const importantElements = [
        { id: 'modelSelector', type: 'container' },
        { id: 'apeToggleButton', type: 'button' },
        { id: 'chatInput', type: 'input' },
        { id: 'sendButton', type: 'button' },
        { id: 'clearButton', type: 'button' },
        { id: 'embedDevButton', type: 'button' },
        { id: 'commandsButton', type: 'button' },
        { id: 'messages', type: 'container' },
        { id: 'commandsPanelContainer', type: 'container' }
      ];
      
      // 각 요소 검사
      importantElements.forEach(el => {
        const element = document.getElementById(el.id);
        console.log(`${el.id} (${el.type}):`);
        
        if (!element) {
          console.log(`  - 요소를 찾을 수 없음`);
          return;
        }
        
        // 기본 정보
        console.log(`  - 존재: 예`);
        console.log(`  - 클래스: ${element.className}`);
        console.log(`  - 보임: ${window.getComputedStyle(element).display !== 'none'}`);
        
        // 요소 유형별 추가 정보
        if (el.type === 'button') {
          console.log(`  - 비활성화: ${element.disabled}`);
          console.log(`  - 이벤트 핸들러: ${element.onclick ? '있음(onclick)' : '없음(onclick)'}`);
          
          // 이벤트 핸들러 테스트
          console.log('  - 이벤트 핸들러 테스트 중...');
          
          // 이벤트 기록 함수
          const logEvent = function(e) {
            console.log(`    -> 클릭 이벤트 감지됨`);
            e.preventDefault();
            e.stopPropagation();
            document.removeEventListener('click', logEvent, true);
            return false;
          };
          
          // 캡처 단계에서 이벤트 리스너 추가
          document.addEventListener('click', logEvent, true);
          
          // 시뮬레이션된 이벤트로 테스트
          try {
            const testEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            element.dispatchEvent(testEvent);
          } catch (error) {
            console.log(`    -> 이벤트 테스트 중 오류: ${error.message}`);
          }
        } else if (el.type === 'input') {
          console.log(`  - 값: "${element.value}"`);
          console.log(`  - placeholder: "${element.placeholder}"`);
          console.log(`  - dataset: ${JSON.stringify(element.dataset)}`);
        } else if (el.type === 'container') {
          console.log(`  - 자식 요소 수: ${element.children.length}`);
          console.log(`  - 내부 HTML 길이: ${element.innerHTML.length}자`);
        }
      });
      
      return '모든 UI 요소 상태가 콘솔에 출력되었습니다.';
    },
    
    // 모델 선택기 상태 디버깅
    checkModelSelector: function() {
      console.log('===== 모델 선택기 상태 점검 =====');
      
      // 요소 확인
      const selector = document.getElementById('modelSelector');
      if (!selector) {
        console.log('모델 선택기 요소를 찾을 수 없습니다.');
        return '모델 선택기를 찾을 수 없음';
      }
      
      // 스타일 및 DOM 정보
      console.log('DOM 정보:');
      console.log(`- 표시 상태: ${window.getComputedStyle(selector).display}`);
      console.log(`- z-index: ${window.getComputedStyle(selector).zIndex}`);
      console.log(`- 위치: ${window.getComputedStyle(selector).position}`);
      
      // 모델 선택기 전역 객체 확인
      if (window.modelSelector) {
        console.log('modelSelector 객체 정보:');
        console.log(`- 초기화됨: ${window.modelSelector.isInitialized === true}`);
        console.log(`- 현재 모델: ${window.modelSelector.selectedModelId || '없음'}`);
        console.log(`- 모델 수: ${window.modelSelector.options?.models?.length || 0}`);
        
        // 드롭다운 상태
        if (typeof window.modelSelector.isDropdownOpen === 'function') {
          const isOpen = window.modelSelector.isDropdownOpen();
          console.log(`- 드롭다운 상태: ${isOpen ? '열림' : '닫힘'}`);
          
          // 문제 해결 시도
          if (!isOpen) {
            console.log('드롭다운 토글 시도 중...');
            
            const header = selector.querySelector('.model-selector-header');
            if (header) {
              console.log('헤더 클릭 시뮬레이션');
              try {
                header.click();
                setTimeout(() => {
                  const isOpenNow = window.modelSelector.isDropdownOpen();
                  console.log(`시뮬레이션 후 드롭다운 상태: ${isOpenNow ? '열림' : '닫힘'}`);
                }, 100);
              } catch (error) {
                console.error('헤더 클릭 시뮬레이션 중 오류:', error);
              }
            }
          }
        }
      } else {
        console.log('modelSelector 전역 객체를 찾을 수 없습니다.');
      }
      
      // DOM 이벤트 처리 테스트
      console.log('모델 선택기 이벤트 처리 테스트 중...');
      const header = selector.querySelector('.model-selector-header');
      if (header) {
        const testClick = function(e) {
          console.log('모델 선택기 헤더 테스트 클릭이 감지되었습니다.');
          e.preventDefault();
          e.stopPropagation();
          selector.removeEventListener('click', testClick, true);
          return false;
        };
        
        selector.addEventListener('click', testClick, true);
        
        try {
          const testEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          header.dispatchEvent(testEvent);
        } catch (error) {
          console.error('이벤트 테스트 중 오류:', error);
        }
      }
      
      return '모델 선택기 상태가 콘솔에 출력되었습니다.';
    },
    
    // APE 토글 버튼 상태 디버깅
    checkApeToggleButton: function() {
      console.log('===== APE 토글 버튼 상태 점검 =====');
      
      // 요소 확인
      const button = document.getElementById('apeToggleButton');
      if (!button) {
        console.log('APE 토글 버튼을 찾을 수 없습니다.');
        return 'APE 토글 버튼을 찾을 수 없음';
      }
      
      // 기본 정보
      console.log('버튼 정보:');
      console.log(`- 텍스트: "${button.textContent.trim()}"`);
      console.log(`- 클래스: ${button.className}`);
      console.log(`- 비활성화: ${button.disabled}`);
      console.log(`- 스타일: ${window.getComputedStyle(button).display}, z-index: ${window.getComputedStyle(button).zIndex}`);
      
      // 이벤트 리스너 테스트
      console.log('이벤트 핸들링 테스트 중...');
      const clickHandler = function(e) {
        console.log('APE 토글 버튼 클릭 핸들러가 호출되었습니다.');
        e.preventDefault();
        e.stopPropagation();
        document.removeEventListener('click', clickHandler, true);
        return false;
      };
      
      document.addEventListener('click', clickHandler, true);
      
      try {
        console.log('클릭 시뮬레이션 시도...');
        const testEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        button.dispatchEvent(testEvent);
      } catch (error) {
        console.error('이벤트 테스트 중 오류:', error);
      }
      
      return 'APE 토글 버튼 상태가 콘솔에 출력되었습니다.';
    },
    
    // 특정 UI 요소에 대한 특별 이벤트 핸들러 추가
    fixButtonEvent: function(buttonId) {
      const button = document.getElementById(buttonId);
      if (!button) {
        console.error(`버튼을 찾을 수 없음: ${buttonId}`);
        return `버튼을 찾을 수 없음: ${buttonId}`;
      }
      
      console.log(`${buttonId} 버튼에 강화된 이벤트 핸들러 추가 중...`);
      
      // 기존 이벤트 제거
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // 새 이벤트 추가
      newButton.addEventListener('click', function(e) {
        console.log(`${buttonId} 버튼 클릭됨 (강화된 핸들러)`);
        
        // 이벤트 버블링 중지
        e.stopPropagation();
        
        // 버튼별 처리
        if (buttonId === 'apeToggleButton') {
          // UI에 직접 메시지 전달
          if (window.apeUI && typeof window.apeUI.toggleApeMode === 'function') {
            return window.apeUI.toggleApeMode();
          }
          
          // VS Code API에 직접 메시지 전송
          try {
            const vscode = acquireVsCodeApi();
            vscode.postMessage({
              command: 'toggleApeMode',
              enabled: !newButton.classList.contains('active')
            });
            
            // UI 상태 직접 토글
            newButton.classList.toggle('active');
            return true;
          } catch (error) {
            console.error('VS Code API 접근 실패:', error);
          }
        }
      });
      
      console.log(`${buttonId} 버튼 이벤트 핸들러 강화 완료`);
      return `${buttonId} 버튼에 강화된 이벤트 핸들러가 추가되었습니다.`;
    },
    
    // 이벤트 처리 전체 리셋
    fullReset: function() {
      console.log('===== UI 이벤트 처리 전체 리셋 중 =====');
      
      try {
        // 중요 버튼 목록
        const importantButtons = [
          'apeToggleButton',
          'sendButton',
          'clearButton',
          'embedDevButton',
          'commandsButton'
        ];
        
        // 각 버튼 리셋
        importantButtons.forEach(buttonId => {
          const button = document.getElementById(buttonId);
          if (button) {
            console.log(`${buttonId} 리셋 중...`);
            
            // 기존 이벤트 제거 및 신규 버튼 생성
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // 기본 이벤트 추가
            newButton.addEventListener('click', function(e) {
              console.log(`${buttonId} 클릭됨 (리셋 후 핸들러)`);
              e.stopPropagation();
              
              // VS Code API에 메시지 전송 (필요시)
              try {
                const vscode = acquireVsCodeApi();
                if (buttonId === 'apeToggleButton') {
                  vscode.postMessage({
                    command: 'toggleApeMode',
                    enabled: !newButton.classList.contains('active')
                  });
                  newButton.classList.toggle('active');
                } else if (buttonId === 'clearButton') {
                  vscode.postMessage({ command: 'clearChat' });
                } else if (buttonId === 'embedDevButton') {
                  vscode.postMessage({
                    command: 'toggleEmbedDevMode',
                    enabled: !newButton.classList.contains('active')
                  });
                  newButton.classList.toggle('active');
                } else if (buttonId === 'commandsButton') {
                  // 명령어 패널 토글
                  const panelContainer = document.getElementById('commandsPanelContainer');
                  if (panelContainer) {
                    const isVisible = panelContainer.style.display !== 'none';
                    panelContainer.style.display = isVisible ? 'none' : 'block';
                    newButton.classList.toggle('active', !isVisible);
                  }
                } else if (buttonId === 'sendButton') {
                  // 메시지 전송
                  const chatInput = document.getElementById('chatInput');
                  if (chatInput && chatInput.value.trim()) {
                    vscode.postMessage({
                      command: 'sendMessage',
                      text: chatInput.value.trim(),
                      model: chatInput.dataset.model
                    });
                    chatInput.value = '';
                  }
                }
              } catch (error) {
                console.error('VS Code API 접근 실패:', error);
              }
            });
          } else {
            console.warn(`${buttonId} 버튼을 찾을 수 없습니다.`);
          }
        });
        
        // 모델 선택기 재설정 시도 (가능한 경우)
        const modelSelector = document.getElementById('modelSelector');
        if (modelSelector && window.modelSelector) {
          console.log('모델 선택기 이벤트 리셋 시도');
          
          // 헤더 재설정
          const header = modelSelector.querySelector('.model-selector-header');
          if (header) {
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            // 클릭 이벤트 재설정
            newHeader.addEventListener('click', function(e) {
              console.log('모델 선택기 헤더 클릭됨 (리셋 후 핸들러)');
              e.stopPropagation();
              
              if (typeof window.modelSelector.toggleDropdown === 'function') {
                window.modelSelector.toggleDropdown();
              }
            });
          }
        }
        
        // ui-event-fix.js 로직 초기화 시도
        if (typeof initializeEventFixes === 'function') {
          console.log('ui-event-fix.js 초기화 함수 실행 시도');
          try {
            initializeEventFixes();
          } catch (error) {
            console.error('ui-event-fix.js 초기화 중 오류:', error);
          }
        }
        
        console.log('===== UI 이벤트 처리 전체 리셋 완료 =====');
        return '이벤트 처리 시스템이 완전히 재설정되었습니다.';
      } catch (error) {
        console.error('이벤트 처리 리셋 중 오류:', error);
        return '이벤트 처리 리셋 중 오류가 발생했습니다.';
      }
    }
  };
}

// 글로벌 함수 등록
window.debugUI = function() {
  return window.apeUIDebug.logAllUIElements();
};

window.fixApeToggleButton = function() {
  return window.apeUIDebug.fixButtonEvent('apeToggleButton');
};

window.resetUIEvents = function() {
  return window.apeUIDebug.fullReset();
};

// 자동 진단 (페이지 로드 2초 후)
setTimeout(function() {
  console.log('[UI 디버거] 자동 진단 시작');
  window.apeUIDebug.logAllUIElements();
  console.log('[UI 디버거] 자동 진단 완료, 콘솔에서 debugUI(), fixApeToggleButton(), resetUIEvents() 함수로 추가 디버깅할 수 있습니다.');
}, 2000);