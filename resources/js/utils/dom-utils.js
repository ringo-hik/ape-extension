/**
 * DOM 관련 유틸리티 함수
 * 
 * DOM 조작을 위한 헬퍼 함수들을 제공합니다.
 */

import logger from './logger.js';

/**
 * ID로 요소를 가져오고 결과를 로깅합니다.
 */
export function getElement(id) {
  if (!id) {
    logger.error('getElement 호출 시 id가 제공되지 않음');
    return null;
  }
  
  try {
    const element = document.getElementById(id);
    if (!element) {
      logger.warn(`요소를 찾을 수 없음: ${id}`);
    } else {
      logger.debug(`요소 발견: #${id}`);
    }
    return element;
  } catch (error) {
    logger.error(`getElement 오류 (id: ${id}):`, error);
    return null;
  }
}

/**
 * 모든 요소에 이벤트 리스너를 추가합니다.
 */
export function addEventListeners(elements, eventType, handler) {
  if (!elements) return;
  
  const elementArray = Array.isArray(elements) ? elements : [elements];
  
  elementArray.forEach(element => {
    if (element) {
      element.addEventListener(eventType, handler);
    }
  });
}

/**
 * 요소의 클래스를 토글합니다.
 */
export function toggleClass(element, className, force) {
  if (!element) return;
  element.classList.toggle(className, force);
}

/**
 * 요소를 생성하고 속성과 내용을 설정합니다.
 */
export function createElement(tag, attributes = {}, content = '') {
  const element = document.createElement(tag);
  
  // 속성 설정
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // 내용 설정
  if (content) {
    element.innerHTML = content;
  }
  
  return element;
}

/**
 * 요소를 부모에 추가합니다.
 */
export function appendElement(parent, child) {
  if (!parent || !child) return null;
  return parent.appendChild(child);
}

/**
 * IntersectionObserver를 생성하여 요소가 화면에 나타날 때 콜백을 실행합니다.
 */
export function observeElementVisibility(element, callback, options = {}) {
  if (!element || !callback) return null;
  
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
      }
    });
  }, options);
  
  observer.observe(element);
  return observer;
}

/**
 * 요소의 쿼리 선택자를 선택합니다.
 */
export function queryElement(selector, parent = document) {
  try {
    return parent.querySelector(selector);
  } catch (error) {
    logger.error(`선택자 오류: ${selector}`, error);
    return null;
  }
}

/**
 * 여러 요소의 쿼리 선택자를 선택합니다.
 */
export function queryElements(selector, parent = document) {
  try {
    return Array.from(parent.querySelectorAll(selector));
  } catch (error) {
    logger.error(`선택자 오류: ${selector}`, error);
    return [];
  }
}

/**
 * 모든 자식 요소를 제거합니다.
 */
export function removeAllChildren(element) {
  if (!element) return;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}