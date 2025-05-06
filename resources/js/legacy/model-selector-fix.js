/**
 * 모델 선택기 긴급 수정 스크립트
 * 모델 선택기 관련 문제를 수정하기 위한 스크립트
 */

console.log('[ModelSelectorFix] 모델 선택기 수정 스크립트 로드됨');

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', () => {
  console.log('[ModelSelectorFix] DOM 로드 완료, 모델 선택기 수정 시작');
  
  // 모델 선택기 컨테이너 찾기
  const modelSelectorContainer = document.getElementById('modelSelector');
  if (!modelSelectorContainer) {
    console.error('[ModelSelectorFix] 모델 선택기 컨테이너를 찾을 수 없음');
    
    // 헤더에 모델 선택기 추가
    const header = document.querySelector('.chat-header');
    if (header) {
      console.log('[ModelSelectorFix] 채팅 헤더를 찾음, 모델 선택기 생성');
      const newContainer = document.createElement('div');
      newContainer.id = 'modelSelector';
      newContainer.className = 'model-selector';
      
      // 시각적 가시성 강화
      newContainer.style.border = '2px solid red';
      newContainer.style.padding = '5px';
      newContainer.style.margin = '5px';
      newContainer.style.display = 'inline-block';
      newContainer.style.minWidth = '150px';
      
      // 기본 내용 추가
      newContainer.innerHTML = `
        <div class="model-selector-header">
          <span class="model-selector-title">모델 선택 (수정됨)</span>
          <span class="model-selector-icon">▼</span>
        </div>
        <div class="model-selector-dropdown"></div>
      `;
      
      header.appendChild(newContainer);
      console.log('[ModelSelectorFix] 모델 선택기 컨테이너 생성됨');
    } else {
      console.error('[ModelSelectorFix] 채팅 헤더도 찾을 수 없음');
    }
  } else {
    console.log('[ModelSelectorFix] 기존 모델 선택기 컨테이너를 찾음');
    
    // 시각적 가시성 강화
    modelSelectorContainer.style.border = '2px solid green';
    modelSelectorContainer.style.padding = '5px';
    modelSelectorContainer.style.margin = '5px';
    modelSelectorContainer.style.minWidth = '150px';
    
    // 내용 채우기
    if (modelSelectorContainer.innerHTML.trim() === '') {
      modelSelectorContainer.innerHTML = `
        <div class="model-selector-header">
          <span class="model-selector-title">모델 선택 (수정됨)</span>
          <span class="model-selector-icon">▼</span>
        </div>
        <div class="model-selector-dropdown"></div>
      `;
      console.log('[ModelSelectorFix] 모델 선택기 컨테이너 내용 추가됨');
    }
  }
  
  // 5초 후 모델 목록 직접 요청
  setTimeout(() => {
    console.log('[ModelSelectorFix] 5초 경과, 모델 목록 직접 요청');
    try {
      const vscode = acquireVsCodeApi();
      vscode.postMessage({
        command: 'getModelList'
      });
      console.log('[ModelSelectorFix] getModelList 요청 전송됨');
    } catch (error) {
      console.error('[ModelSelectorFix] VS Code API 요청 전송 실패:', error);
    }
  }, 5000);
});