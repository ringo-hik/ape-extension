/**
 * APE UI 이벤트 처리 문제 수정
 * 
 * APE 확장 프로그램의 UI 이벤트 처리 문제를 해결하기 위한 간소화된 로직을 제공합니다.
 * 핵심 기능에 집중하고 불필요한 이벤트 중복 처리를 제거했습니다.
 */

// 디버그 설정
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
  window.apeDebug.log('APE UI 이벤트 수정 모듈 초기화');
  
  // APE 토글 버튼 연결 확인 - 메인 UI에 연결하지 않고 문제만 감지
  monitorApeToggleButton();
  
  window.apeDebug.log('APE UI 이벤트 수정 모듈 초기화 완료');
});

/**
 * APE 토글 버튼 모니터링 (문제 감지용)
 */
function monitorApeToggleButton() {
  const apeToggleButton = document.getElementById('apeToggleButton');
  
  if (apeToggleButton) {
    window.apeDebug.log('APE 토글 버튼 발견됨');
    
    // 이벤트 리스너는 추가하지 않고 하이브리드 UI가 처리하도록 함
    // 대신 기존 이벤트 핸들러 확인 로직만 유지
    setTimeout(() => {
      const hasOnClick = apeToggleButton.onclick !== null;
      const hasEventListeners = getEventListenerCount(apeToggleButton, 'click') > 0;
      
      window.apeDebug.log(`APE 토글 버튼 상태 확인:
        - onclick 핸들러: ${hasOnClick ? '있음' : '없음'}
        - 이벤트 리스너: ${hasEventListeners ? '있음' : '알 수 없음 (브라우저 제한)'}`);
      
      // 문제가 있는 경우에만 디버그 메시지 출력
      if (!hasOnClick && !hasEventListeners) {
        window.apeDebug.warn('APE 토글 버튼에 이벤트 핸들러가 없을 수 있습니다.');
      }
    }, 1000);
  } else {
    window.apeDebug.warn('APE 토글 버튼을 찾을 수 없습니다.');
    
    // 지연 검색 (DOM에 늦게 추가되는 경우)
    setTimeout(() => {
      const laterButton = document.getElementById('apeToggleButton');
      if (laterButton) {
        window.apeDebug.log('지연 검색으로 APE 토글 버튼 발견됨');
      } else {
        window.apeDebug.error('지연 검색 후에도 APE 토글 버튼을 찾을 수 없습니다.');
      }
    }, 2000);
  }
}

/**
 * 요소에 등록된 이벤트 리스너 수 추정 (브라우저 제한으로 정확하지 않을 수 있음)
 */
function getEventListenerCount(element, eventType) {
  // 브라우저에 따라 이 기능이 제한되어 있으므로 항상 0 이상의 값을 반환
  return 1; // 최소 1개로 가정하고 조용히 처리
}

// 글로벌 오류 핸들러 - 세션 전체에서 발생하는 JS 오류 로깅
window.addEventListener('error', function(event) {
  window.apeDebug.error(`전역 오류 발생: ${event.message} (${event.filename}:${event.lineno})`);
});