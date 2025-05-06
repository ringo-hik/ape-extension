#!/usr/bin/env node

/**
 * APE 익스텐션 QA 체크리스트 관리 스크립트
 * 
 * 이 스크립트는 다음 기능을 제공합니다:
 * 1. 새 버전 체크리스트 생성
 * 2. 기존 체크리스트 업데이트
 * 3. 체크리스트 검증 상태 보고
 * 4. 미완료 검증 항목 확인
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const CORE_CHECKLIST_PATH = path.join(ROOT_DIR, 'APE_CORE_CHECKLIST.md');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'APE_VERSION_CHECKLIST_TEMPLATE.md');
const VERSION_CHECKLIST_PREFIX = 'APE_VERSION_CHECKLIST_v';

// 명령행 인터페이스
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 메인 메뉴 표시
 */
function showMainMenu() {
  console.log('\n=== APE QA 체크리스트 관리 시스템 ===');
  console.log('1. 새 버전 체크리스트 생성');
  console.log('2. 현재 체크리스트 상태 확인');
  console.log('3. 체크리스트 항목 완료 표시');
  console.log('4. 핵심 체크리스트 상태 확인');
  console.log('5. 종료');
  
  rl.question('\n선택하세요: ', (answer) => {
    switch (answer.trim()) {
      case '1':
        createNewVersionChecklist();
        break;
      case '2':
        checkCurrentStatus();
        break;
      case '3':
        markItemComplete();
        break;
      case '4':
        checkCoreStatus();
        break;
      case '5':
        rl.close();
        break;
      default:
        console.log('잘못된 선택입니다. 다시 시도하세요.');
        showMainMenu();
        break;
    }
  });
}

/**
 * 새 버전 체크리스트 생성
 */
function createNewVersionChecklist() {
  rl.question('새 버전 번호를 입력하세요 (예: 1.0.0): ', (version) => {
    if (!version.match(/^\d+\.\d+\.\d+$/)) {
      console.log('올바른 버전 형식이 아닙니다. x.y.z 형식으로 입력하세요.');
      return showMainMenu();
    }
    
    const targetPath = path.join(ROOT_DIR, `${VERSION_CHECKLIST_PREFIX}${version}.md`);
    
    if (fs.existsSync(targetPath)) {
      console.log(`이미 ${version} 버전의 체크리스트가 존재합니다.`);
      return showMainMenu();
    }
    
    try {
      let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
      template = template.replace(/{VERSION}/g, version);
      
      // 현재 날짜로 업데이트
      const currentDate = new Date().toISOString().split('T')[0];
      template = template.replace(/YYYY-MM-DD/g, currentDate);
      
      fs.writeFileSync(targetPath, template);
      console.log(`✅ 버전 ${version} 체크리스트가 생성되었습니다.`);
      console.log(`   위치: ${targetPath}`);
      console.log('\n이제 다음을 진행하세요:');
      console.log('1. 새 체크리스트 파일을 열고 버전별 특성에 맞게 내용을 편집하세요.');
      console.log('2. 주요 기능, 버그 수정 등 이 버전의 변경사항을 반영하세요.');
    } catch (error) {
      console.error('체크리스트 생성 중 오류가 발생했습니다:', error);
    }
    
    showMainMenu();
  });
}

/**
 * 체크리스트 파일에서 완료되지 않은 항목 추출
 * @param {string} filePath 체크리스트 파일 경로
 * @returns {Object} 미완료 항목 정보
 */
function getIncompleteItems(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const incompleteItems = [];
    let currentSection = '';
    let currentSubSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 섹션 헤더 감지
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').trim();
        currentSubSection = '';
      }
      // 하위 섹션 헤더 감지
      else if (line.startsWith('### ')) {
        currentSubSection = line.replace('### ', '').trim();
      }
      // 미완료 항목 감지
      else if (line.match(/^- \[ \]/)) {
        const item = line.replace(/^- \[ \]/, '').trim();
        incompleteItems.push({
          section: currentSection,
          subSection: currentSubSection,
          item: item,
          lineNumber: i + 1,
          text: line
        });
      }
    }
    
    return {
      fileName: path.basename(filePath),
      filePath: filePath,
      totalIncomplete: incompleteItems.length,
      items: incompleteItems
    };
  } catch (error) {
    console.error(`파일 읽기 오류 (${filePath}):`, error);
    return { fileName: path.basename(filePath), totalIncomplete: 0, items: [] };
  }
}

/**
 * 현재 체크리스트 상태 확인
 */
function checkCurrentStatus() {
  console.log('\n=== 현재 체크리스트 상태 ===');
  
  // 모든 버전 체크리스트 찾기
  const files = fs.readdirSync(ROOT_DIR);
  const versionChecklists = files.filter(file => 
    file.startsWith(VERSION_CHECKLIST_PREFIX) && file.endsWith('.md')
  );
  
  if (versionChecklists.length === 0) {
    console.log('버전 체크리스트가 없습니다. 새 체크리스트를 생성하세요.');
    return showMainMenu();
  }
  
  // 가장 최신 버전 체크리스트 찾기
  const latestVersion = versionChecklists.sort().pop();
  const latestPath = path.join(ROOT_DIR, latestVersion);
  
  console.log(`최신 버전 체크리스트: ${latestVersion}`);
  
  const incompleteInfo = getIncompleteItems(latestPath);
  console.log(`미완료 항목: ${incompleteInfo.totalIncomplete}개`);
  
  if (incompleteInfo.totalIncomplete > 0) {
    console.log('\n미완료 항목 목록:');
    incompleteInfo.items.forEach((item, index) => {
      console.log(`${index + 1}. [${item.section} > ${item.subSection}] ${item.item}`);
    });
  } else {
    console.log('모든 항목이 완료되었습니다! 👍');
  }
  
  showMainMenu();
}

/**
 * 체크리스트 항목 완료 표시
 */
function markItemComplete() {
  // 모든 버전 체크리스트 찾기
  const files = fs.readdirSync(ROOT_DIR);
  const versionChecklists = files.filter(file => 
    file.startsWith(VERSION_CHECKLIST_PREFIX) && file.endsWith('.md')
  );
  
  if (versionChecklists.length === 0) {
    console.log('버전 체크리스트가 없습니다. 새 체크리스트를 생성하세요.');
    return showMainMenu();
  }
  
  // 가장 최신 버전 체크리스트 찾기
  const latestVersion = versionChecklists.sort().pop();
  const latestPath = path.join(ROOT_DIR, latestVersion);
  
  const incompleteInfo = getIncompleteItems(latestPath);
  
  if (incompleteInfo.totalIncomplete === 0) {
    console.log('모든 항목이 이미 완료되었습니다! 👍');
    return showMainMenu();
  }
  
  console.log('\n=== 항목 완료 표시 ===');
  console.log(`체크리스트: ${latestVersion}`);
  console.log('\n미완료 항목 목록:');
  
  incompleteInfo.items.forEach((item, index) => {
    console.log(`${index + 1}. [${item.section} > ${item.subSection}] ${item.item}`);
  });
  
  rl.question('\n완료 표시할 항목 번호를 입력하세요 (쉼표로 구분하여 여러 항목 선택 가능): ', (answer) => {
    const selectedItems = answer.split(',')
      .map(num => num.trim())
      .filter(num => num !== '' && !isNaN(parseInt(num)) && parseInt(num) > 0 && parseInt(num) <= incompleteInfo.totalIncomplete)
      .map(num => parseInt(num) - 1);
    
    if (selectedItems.length === 0) {
      console.log('유효한 항목이 선택되지 않았습니다.');
      return showMainMenu();
    }
    
    try {
      let content = fs.readFileSync(latestPath, 'utf8');
      const lines = content.split('\n');
      
      selectedItems.forEach(index => {
        const item = incompleteInfo.items[index];
        lines[item.lineNumber - 1] = lines[item.lineNumber - 1].replace('- [ ]', '- [x]');
      });
      
      fs.writeFileSync(latestPath, lines.join('\n'));
      console.log(`✅ ${selectedItems.length}개 항목이 완료 표시되었습니다.`);
    } catch (error) {
      console.error('파일 업데이트 중 오류가 발생했습니다:', error);
    }
    
    showMainMenu();
  });
}

/**
 * 핵심 체크리스트 상태 확인
 */
function checkCoreStatus() {
  console.log('\n=== 핵심 체크리스트 상태 ===');
  
  if (!fs.existsSync(CORE_CHECKLIST_PATH)) {
    console.log('핵심 체크리스트 파일을 찾을 수 없습니다.');
    return showMainMenu();
  }
  
  const incompleteInfo = getIncompleteItems(CORE_CHECKLIST_PATH);
  console.log(`미완료 항목: ${incompleteInfo.totalIncomplete}개`);
  
  if (incompleteInfo.totalIncomplete > 0) {
    console.log('\n미완료 항목 목록:');
    incompleteInfo.items.forEach((item, index) => {
      console.log(`${index + 1}. [${item.section} > ${item.subSection}] ${item.item}`);
    });
    
    rl.question('\n핵심 체크리스트 항목을 완료 표시하시겠습니까? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        markCoreItemComplete(incompleteInfo);
      } else {
        showMainMenu();
      }
    });
  } else {
    console.log('모든 핵심 항목이 완료되었습니다! 👍');
    showMainMenu();
  }
}

/**
 * 핵심 체크리스트 항목 완료 표시
 */
function markCoreItemComplete(incompleteInfo) {
  rl.question('완료 표시할 항목 번호를 입력하세요 (쉼표로 구분하여 여러 항목 선택 가능): ', (answer) => {
    const selectedItems = answer.split(',')
      .map(num => num.trim())
      .filter(num => num !== '' && !isNaN(parseInt(num)) && parseInt(num) > 0 && parseInt(num) <= incompleteInfo.totalIncomplete)
      .map(num => parseInt(num) - 1);
    
    if (selectedItems.length === 0) {
      console.log('유효한 항목이 선택되지 않았습니다.');
      return showMainMenu();
    }
    
    try {
      let content = fs.readFileSync(CORE_CHECKLIST_PATH, 'utf8');
      const lines = content.split('\n');
      
      selectedItems.forEach(index => {
        const item = incompleteInfo.items[index];
        lines[item.lineNumber - 1] = lines[item.lineNumber - 1].replace('- [ ]', '- [x]');
      });
      
      fs.writeFileSync(CORE_CHECKLIST_PATH, lines.join('\n'));
      console.log(`✅ ${selectedItems.length}개 핵심 항목이 완료 표시되었습니다.`);
    } catch (error) {
      console.error('파일 업데이트 중 오류가 발생했습니다:', error);
    }
    
    showMainMenu();
  });
}

// 프로그램 시작
console.log('APE 익스텐션 QA 체크리스트 관리 시스템');
showMainMenu();

// 종료 이벤트 핸들러
rl.on('close', () => {
  console.log('\n체크리스트 관리 시스템을 종료합니다. 안녕히 가세요!');
  process.exit(0);
});