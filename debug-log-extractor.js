const fs = require('fs');
const path = require('path');

// 확장 프로그램 파일 경로
const distPath = path.join(__dirname, 'dist');
const extensionJsPath = path.join(distPath, 'extension.js');

// 로그 찾기 함수
function findLogs(content) {
  const logLines = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('console.log(')) {
      let logLine = lines[i].trim();
      let j = i + 1;
      
      // 여러 줄에 걸친 로그 처리
      while (j < lines.length && !lines[j].includes(');') && !lines[j].includes('console.log(')) {
        logLine += ' ' + lines[j].trim();
        j++;
      }
      
      if (j < lines.length && lines[j].includes(');')) {
        logLine += ' ' + lines[j].trim();
      }
      
      logLines.push({
        line: i + 1,
        text: logLine
      });
    }
  }
  
  return logLines;
}

// 로그 관련 검사
function analyzeExtension() {
  try {
    console.log('APE 확장 프로그램 로그 분석 시작...\n');
    
    // 파일 존재 확인
    if (!fs.existsSync(extensionJsPath)) {
      console.error(`오류: 확장 프로그램 파일이 없습니다: ${extensionJsPath}`);
      return;
    }
    
    const content = fs.readFileSync(extensionJsPath, 'utf-8');
    console.log(`확장 프로그램 파일 크기: ${Math.round(content.length / 1024)} KB`);
    
    // 뷰 ID 검사
    const viewIdPattern = /'(ape\.\w+?)'/g;
    const viewIds = [];
    let match;
    
    while ((match = viewIdPattern.exec(content)) !== null) {
      if (!viewIds.includes(match[1])) {
        viewIds.push(match[1]);
      }
    }
    
    console.log('\n확장 프로그램에서 사용 중인 뷰 ID:');
    viewIds.forEach(id => console.log(` - ${id}`));
    
    // 로그 검사
    const logs = findLogs(content);
    
    console.log(`\n확장 프로그램에 총 ${logs.length}개의 로그가 있습니다.`);
    
    // 뷰 관련 로그 필터링
    const viewLogs = logs.filter(log => 
      log.text.includes('ape.treeView') || 
      log.text.includes('ape.chatView') ||
      log.text.includes('ape.settingsView') ||
      log.text.includes('ape.fileExplorerView') ||
      log.text.includes('treeDataProvider') ||
      log.text.includes('트리뷰')
    );
    
    console.log('\n뷰 관련 로그:');
    viewLogs.forEach(log => console.log(` - 줄 ${log.line}: ${log.text}`));
    
    // 초기화 관련 로그 필터링
    const initLogs = logs.filter(log => 
      log.text.includes('초기화') ||
      log.text.includes('활성화') ||
      log.text.includes('initialize') ||
      log.text.includes('activate')
    );
    
    console.log('\n초기화 관련 로그:');
    initLogs.forEach(log => console.log(` - 줄 ${log.line}: ${log.text}`));
  } catch (error) {
    console.error('분석 중 오류 발생:', error);
  }
}

analyzeExtension();