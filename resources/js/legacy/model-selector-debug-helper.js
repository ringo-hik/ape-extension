/**
 * 모델 선택기 디버그 도우미
 * 
 * 모델 선택기 컴포넌트 문제 해결을 위한 추가 로직을 제공합니다.
 * UI 이벤트 문제, 모델 데이터 문제 등을 디버깅하는 데 유용합니다.
 */

// 전역 디버그 네임스페이스 확인/생성
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

// 디버그 네임스페이스에 모델 관련 함수 추가
window.apeDebug.model = {
  // 모델 선택기 상태 출력
  status: function() {
    if (!window.modelSelector) {
      console.error('모델 선택기 객체를 찾을 수 없습니다.');
      return '모델 선택기 객체 없음';
    }
    
    const selector = window.modelSelector;
    console.log('===== 모델 선택기 상태 =====');
    console.log(`초기화 완료: ${selector.isInitialized ? '예' : '아니오'}`);
    console.log(`현재 선택된 모델 ID: ${selector.selectedModelId || '없음'}`);
    console.log(`사용 가능한 모델 수: ${selector.options.models?.length || 0}`);
    console.log(`컨테이너 ID: ${selector.containerId}`);
    console.log(`컨테이너 요소 찾음: ${selector.container ? '예' : '아니오'}`);
    console.log(`드롭다운 상태: ${selector.isDropdownOpen() ? '열림' : '닫힘'}`);
    
    // 모델 목록 출력
    if (selector.options.models && selector.options.models.length > 0) {
      console.log('===== 사용 가능한 모델 목록 =====');
      selector.options.models.forEach((model, idx) => {
        console.log(`${idx+1}. ${model.name} (ID: ${model.id}, 제공자: ${model.provider || '알 수 없음'})${model.id === selector.selectedModelId ? ' [선택됨]' : ''}`);
      });
    } else {
      console.log('사용 가능한 모델이 없습니다.');
    }
    
    return '모델 선택기 상태가 콘솔에 출력되었습니다.';
  },
  
  // 모델 선택기 초기화
  reset: function() {
    const modelSelector = document.getElementById('modelSelector');
    
    if (!modelSelector) {
      console.error('모델 선택기 DOM 요소를 찾을 수 없습니다.');
      return '모델 선택기 요소 없음';
    }
    
    // 강제 초기화를 위해 요소 재생성
    const parentNode = modelSelector.parentNode;
    const newSelector = document.createElement('div');
    newSelector.id = 'modelSelector';
    newSelector.className = 'model-selector';
    
    // 특별한 스타일 추가 (디버그용)
    newSelector.style.border = '2px solid #0078D4';
    newSelector.style.borderRadius = '4px';
    newSelector.style.padding = '2px';
    
    // 기존 요소 대체
    if (parentNode) {
      parentNode.replaceChild(newSelector, modelSelector);
      console.log('모델 선택기 DOM 요소가 재생성되었습니다.');
    } else {
      console.error('모델 선택기의 부모 요소를 찾을 수 없습니다.');
      return '모델 선택기 부모 요소 없음';
    }
    
    // 모델 선택기 객체 재생성
    try {
      window.modelSelector = new ModelSelector('modelSelector', {
        onChange: (modelId) => {
          console.log(`모델 변경: ${modelId}`);
          
          // 채팅 입력창 모델 정보 업데이트
          const chatInput = document.getElementById('chatInput');
          if (chatInput) {
            chatInput.dataset.model = modelId;
          }
        }
      });
      
      console.log('모델 선택기 객체가 재생성되었습니다.');
      
      // VS Code에 모델 목록 요청
      const vscode = acquireVsCodeApi();
      vscode.postMessage({
        command: 'getModelList'
      });
      
      console.log('VS Code에 모델 목록 요청을 보냈습니다.');
      return '모델 선택기가 재설정되었습니다.';
    } catch (error) {
      console.error('모델 선택기 객체 재생성 중 오류 발생:', error);
      return '모델 선택기 재설정 실패';
    }
  },
  
  // 모델 강제 선택
  select: function(modelId) {
    if (!window.modelSelector) {
      console.error('모델 선택기 객체를 찾을 수 없습니다.');
      return '모델 선택기 객체 없음';
    }
    
    if (!modelId) {
      console.error('모델 ID가 제공되지 않았습니다.');
      return '모델 ID 필요';
    }
    
    try {
      window.modelSelector.setModelById(modelId);
      console.log(`모델 ${modelId}가 선택되었습니다.`);
      
      // 채팅 입력창 모델 정보 업데이트
      const chatInput = document.getElementById('chatInput');
      if (chatInput) {
        chatInput.dataset.model = modelId;
        console.log(`채팅 입력창 dataset.model이 ${modelId}로 설정되었습니다.`);
      }
      
      // VS Code에 모델 변경 알림
      try {
        const vscode = acquireVsCodeApi();
        vscode.postMessage({
          command: 'changeModel',
          model: modelId
        });
        console.log('VS Code에 모델 변경 알림을 보냈습니다.');
      } catch (err) {
        console.error('VS Code API 접근 실패:', err);
      }
      
      return `모델 ${modelId}가 선택되었습니다.`;
    } catch (error) {
      console.error('모델 선택 중 오류 발생:', error);
      return '모델 선택 실패';
    }
  },
  
  // 모델 드롭다운 토글
  toggleDropdown: function() {
    if (!window.modelSelector) {
      console.error('모델 선택기 객체를 찾을 수 없습니다.');
      return '모델 선택기 객체 없음';
    }
    
    try {
      window.modelSelector.toggleDropdown();
      const isOpen = window.modelSelector.isDropdownOpen();
      console.log(`모델 드롭다운이 ${isOpen ? '열렸습니다.' : '닫혔습니다.'}`);
      return `모델 드롭다운 ${isOpen ? '열림' : '닫힘'}`;
    } catch (error) {
      console.error('모델 드롭다운 토글 중 오류 발생:', error);
      return '모델 드롭다운 토글 실패';
    }
  },
  
  // 선택된 모델 정보 표시
  showSelectedModel: function() {
    if (!window.modelSelector) {
      console.error('모델 선택기 객체를 찾을 수 없습니다.');
      return '모델 선택기 객체 없음';
    }
    
    const selectedId = window.modelSelector.selectedModelId;
    if (!selectedId) {
      console.log('선택된 모델이 없습니다.');
      return '선택된 모델 없음';
    }
    
    const models = window.modelSelector.options.models || [];
    const selectedModel = models.find(model => model.id === selectedId);
    
    if (selectedModel) {
      console.log('===== 선택된 모델 정보 =====');
      console.log(`ID: ${selectedModel.id}`);
      console.log(`이름: ${selectedModel.name}`);
      console.log(`제공자: ${selectedModel.provider || '알 수 없음'}`);
      
      // 채팅 입력창에 모델 정보가 올바르게 설정되었는지 확인
      const chatInput = document.getElementById('chatInput');
      if (chatInput) {
        console.log(`채팅 입력창 dataset.model: ${chatInput.dataset.model || '없음'}`);
        console.log(`일치 여부: ${chatInput.dataset.model === selectedId ? '예' : '아니오'}`);
      } else {
        console.log('채팅 입력창 요소를 찾을 수 없습니다.');
      }
      
      return `선택된 모델: ${selectedModel.name}`;
    } else {
      console.warn(`ID가 ${selectedId}인 모델을 모델 목록에서 찾을 수 없습니다.`);
      return `알 수 없는 모델 ID: ${selectedId}`;
    }
  },
  
  // DOM 요소 검사
  inspectDom: function() {
    console.log('===== 모델 선택기 DOM 검사 =====');
    
    // 모델 선택기 컨테이너
    const container = document.getElementById('modelSelector');
    if (!container) {
      console.error('모델 선택기 컨테이너를 찾을 수 없습니다.');
      return '모델 선택기 컨테이너 없음';
    }
    
    console.log('컨테이너 정보:');
    console.log(`- className: ${container.className}`);
    console.log(`- style.display: ${window.getComputedStyle(container).display}`);
    console.log(`- innerHTML 길이: ${container.innerHTML.length}자`);
    console.log(`- 자식 요소 수: ${container.children.length}`);
    
    // 헤더 검사
    const header = container.querySelector('.model-selector-header');
    if (header) {
      console.log('헤더 정보:');
      console.log(`- textContent: ${header.textContent.trim()}`);
      console.log(`- style.display: ${window.getComputedStyle(header).display}`);
      console.log(`- 자식 요소 수: ${header.children.length}`);
    } else {
      console.error('모델 선택기 헤더를 찾을 수 없습니다.');
    }
    
    // 드롭다운 검사
    const dropdown = container.querySelector('.model-selector-dropdown');
    if (dropdown) {
      console.log('드롭다운 정보:');
      console.log(`- className: ${dropdown.className}`);
      console.log(`- style.display: ${window.getComputedStyle(dropdown).display}`);
      console.log(`- 자식 요소 수: ${dropdown.children.length}`);
      console.log(`- 열림 상태: ${dropdown.classList.contains('open') ? '열림' : '닫힘'}`);
      
      // 옵션 검사
      const options = dropdown.querySelectorAll('.model-option');
      console.log(`- 모델 옵션 수: ${options.length}`);
      
      if (options.length > 0) {
        console.log('모델 옵션 정보:');
        options.forEach((option, idx) => {
          console.log(`  ${idx+1}. ${option.textContent.trim()} (ID: ${option.dataset.id}, 선택됨: ${option.classList.contains('selected') ? '예' : '아니오'})`);
        });
      }
    } else {
      console.error('모델 선택기 드롭다운을 찾을 수 없습니다.');
    }
    
    return '모델 선택기 DOM 검사 결과가 콘솔에 출력되었습니다.';
  }
};

// 전역 모델 선택기 디버그 도우미
window.debugModelSelector = function() {
  return window.apeDebug.model.status();
};

// 문서 로드 완료 후 초기 상태 확인
document.addEventListener('DOMContentLoaded', function() {
  console.log('[모델 선택기 디버그] 도우미 초기화 완료');
  
  // 4초 후 모델 선택기 상태 확인 (UI 초기화 시간 고려)
  setTimeout(function() {
    console.log('[모델 선택기 디버그] 지연 상태 확인 시작');
    window.apeDebug.model.status();
    window.apeDebug.model.inspectDom();
    console.log('[모델 선택기 디버그] 지연 상태 확인 완료');
  }, 4000);
});

// 콘솔 명령어 안내
console.log(`
모델 선택기 디버깅을 위한 명령어:
- window.debugModelSelector() - 모델 선택기 상태 확인
- window.apeDebug.model.status() - 모델 선택기 상태 출력
- window.apeDebug.model.reset() - 모델 선택기 초기화
- window.apeDebug.model.select(modelId) - 모델 강제 선택
- window.apeDebug.model.toggleDropdown() - 모델 드롭다운 토글
- window.apeDebug.model.showSelectedModel() - 선택된 모델 정보 표시
- window.apeDebug.model.inspectDom() - DOM 요소 검사
`);

// UI 이벤트 리스너 강화
document.addEventListener('click', function(event) {
  // 모델 선택기 관련 클릭 디버깅
  if (event.target.closest('.model-selector')) {
    const target = event.target;
    const classNames = target.className || '';
    
    console.log(`[모델 선택기 디버그] 클릭 감지: ${target.tagName}, 클래스=${classNames}`);
    
    // 모델 옵션 클릭 추적
    if (target.closest('.model-option')) {
      const option = target.closest('.model-option');
      const modelId = option.dataset.id;
      const modelText = option.textContent.trim();
      
      console.log(`[모델 선택기 디버그] 모델 옵션 클릭: ID=${modelId}, 텍스트=${modelText}`);
    }
    
    // 헤더 클릭 추적
    if (target.closest('.model-selector-header')) {
      console.log('[모델 선택기 디버그] 헤더 클릭 감지');
    }
  }
});

// 모델 변경 이벤트 전파 확인
const originalPostMessage = window.postMessage;
window.postMessage = function(message, targetOrigin, transfer) {
  if (message && message.command === 'changeModel') {
    console.log(`[모델 선택기 디버그] 모델 변경 메시지 감지: ${message.model}`);
  }
  return originalPostMessage.call(this, message, targetOrigin, transfer);
};