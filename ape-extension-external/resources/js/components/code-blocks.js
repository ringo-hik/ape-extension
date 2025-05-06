/**
 * 코드 블록 처리 컴포넌트
 * 
 * 채팅 메시지 내 코드 블록 렌더링 및 기능 구현
 */

import logger from '../utils/logger.js';
import { getElement, createElement, appendElement } from '../utils/dom-utils.js';

class CodeBlocks {
  constructor() {
    this.initialized = false;
    this.vscode = null;
    
    try {
      this.vscode = acquireVsCodeApi();
    } catch (error) {
      logger.error('VS Code API 초기화 실패:', error);
    }
    
    // DOM이 준비되면 초기화
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
    if (this.initialized) return;
    
    logger.log('코드 블록 처리기 초기화');
    
    // 전역 스타일 추가
    this.addStyles();
    
    // 이벤트 핸들러 설정
    this.setupEventHandlers();
    
    this.initialized = true;
  }
  
  /**
   * 스타일 추가
   */
  addStyles() {
    // 필요한 추가 스타일이 있는 경우 여기에 추가
  }
  
  /**
   * 이벤트 핸들러 설정
   */
  setupEventHandlers() {
    // 코드 블록 클릭 이벤트 위임 처리
    document.addEventListener('click', (event) => {
      // 복사 버튼 클릭 처리
      if (event.target.closest('.code-block-copy')) {
        const copyButton = event.target.closest('.code-block-copy');
        const codeBlock = copyButton.closest('.code-block');
        if (codeBlock) {
          this.copyCodeToClipboard(codeBlock);
        }
      }
      
      // 전체 화면 토글 버튼 클릭 처리
      if (event.target.closest('.code-block-expand')) {
        const expandButton = event.target.closest('.code-block-expand');
        const codeBlock = expandButton.closest('.code-block');
        if (codeBlock) {
          this.toggleFullscreen(codeBlock);
        }
      }
      
      // 파일로 저장 버튼 클릭 처리
      if (event.target.closest('.code-block-save')) {
        const saveButton = event.target.closest('.code-block-save');
        const codeBlock = saveButton.closest('.code-block');
        if (codeBlock) {
          this.saveToFile(codeBlock);
        }
      }
    });
  }
  
  /**
   * 코드 블록 처리
   */
  processCodeBlocks(container) {
    if (!container) return;
    
    const codeBlocks = container.querySelectorAll('pre code');
    
    codeBlocks.forEach((codeElement) => {
      const preElement = codeElement.parentElement;
      
      // 이미 처리된 코드 블록은 건너뜀
      if (preElement.classList.contains('code-block')) return;
      
      // 언어 식별
      let language = '';
      preElement.classList.forEach((className) => {
        if (className.startsWith('language-')) {
          language = className.replace('language-', '');
        }
      });
      
      // 코드 블록 래퍼 생성
      this.enhanceCodeBlock(preElement, codeElement, language);
    });
  }
  
  /**
   * 코드 블록 강화
   */
  enhanceCodeBlock(preElement, codeElement, language) {
    // 코드 블록 클래스 추가
    preElement.classList.add('code-block');
    
    // 코드 언어 식별 및 표시
    if (language) {
      // 언어 레이블 생성
      const languageLabel = createElement('div', { className: 'code-block-language' }, language);
      preElement.insertBefore(languageLabel, codeElement);
    }
    
    // 툴바 생성
    const toolbar = createElement('div', { className: 'code-block-toolbar' });
    
    // 복사 버튼
    const copyButton = createElement('button', { 
      className: 'code-block-button code-block-copy',
      title: '코드 복사'
    }, '<i class="ph ph-copy"></i>');
    
    // 전체 화면 버튼
    const expandButton = createElement('button', { 
      className: 'code-block-button code-block-expand',
      title: '전체 화면'
    }, '<i class="ph ph-arrows-out"></i>');
    
    // 파일로 저장 버튼
    const saveButton = createElement('button', { 
      className: 'code-block-button code-block-save',
      title: '파일로 저장'
    }, '<i class="ph ph-download"></i>');
    
    // 툴바에 버튼 추가
    appendElement(toolbar, copyButton);
    appendElement(toolbar, expandButton);
    appendElement(toolbar, saveButton);
    
    // 툴바를 코드 블록의 첫 번째 자식으로 추가
    preElement.insertBefore(toolbar, preElement.firstChild);
  }
  
  /**
   * 코드를 클립보드에 복사
   */
  copyCodeToClipboard(codeBlock) {
    const codeElement = codeBlock.querySelector('code');
    if (!codeElement) return;
    
    const code = codeElement.textContent;
    
    navigator.clipboard.writeText(code)
      .then(() => {
        this.showCopyFeedback(codeBlock);
        logger.log('코드가 클립보드에 복사됨');
      })
      .catch((error) => {
        logger.error('클립보드 복사 실패:', error);
      });
  }
  
  /**
   * 복사 피드백 표시
   */
  showCopyFeedback(codeBlock) {
    const copyButton = codeBlock.querySelector('.code-block-copy');
    if (!copyButton) return;
    
    const originalIcon = copyButton.innerHTML;
    copyButton.innerHTML = '<i class="ph ph-check"></i>';
    copyButton.classList.add('success');
    
    setTimeout(() => {
      copyButton.innerHTML = originalIcon;
      copyButton.classList.remove('success');
    }, 2000);
  }
  
  /**
   * 전체 화면 토글
   */
  toggleFullscreen(codeBlock) {
    codeBlock.classList.toggle('fullscreen');
    
    const expandButton = codeBlock.querySelector('.code-block-expand');
    if (expandButton) {
      if (codeBlock.classList.contains('fullscreen')) {
        expandButton.innerHTML = '<i class="ph ph-arrows-in"></i>';
        expandButton.title = '전체 화면 종료';
      } else {
        expandButton.innerHTML = '<i class="ph ph-arrows-out"></i>';
        expandButton.title = '전체 화면';
      }
    }
  }
  
  /**
   * 코드를 파일로 저장
   */
  saveToFile(codeBlock) {
    if (!this.vscode) {
      logger.error('VS Code API가 없어 파일을 저장할 수 없습니다.');
      return;
    }
    
    const codeElement = codeBlock.querySelector('code');
    if (!codeElement) return;
    
    const code = codeElement.textContent;
    
    // 언어 확인
    let language = '';
    const languageLabel = codeBlock.querySelector('.code-block-language');
    if (languageLabel) {
      language = languageLabel.textContent.trim();
    }
    
    // 파일 확장자 추론
    const extension = this.getFileExtensionFromLanguage(language);
    
    // VS Code에 파일 저장 요청
    this.vscode.postMessage({
      command: 'saveCodeToFile',
      code: code,
      language: language,
      extension: extension
    });
  }
  
  /**
   * 언어에 따른 파일 확장자 가져오기
   */
  getFileExtensionFromLanguage(language) {
    const extensions = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'csharp': 'cs',
      'go': 'go',
      'rust': 'rs',
      'ruby': 'rb',
      'php': 'php',
      'swift': 'swift',
      'kotlin': 'kt',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'yaml': 'yml',
      'markdown': 'md',
      'shell': 'sh',
      'bash': 'sh',
      'powershell': 'ps1',
      'sql': 'sql'
    };
    
    return extensions[language.toLowerCase()] || 'txt';
  }
}

// 코드 블록 인스턴스 생성 및 전역 객체로 내보내기
window.codeBlocks = new CodeBlocks();

export default window.codeBlocks;