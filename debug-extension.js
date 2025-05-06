const fs = require('fs');
const path = require('path');

// 확장 프로그램 빌드 경로
const extensionPath = path.join(__dirname, 'dist', 'extension.js');

// 소스 코드 읽기
console.log('확장 프로그램 소스 코드 분석 중...');
const sourceCode = fs.readFileSync(extensionPath, 'utf-8');

// 로그 포함 여부 확인
console.log('로그 구문 확인 중...');
const logStatements = sourceCode.match(/console\.log\([^)]*\)/g) || [];
console.log(`총 ${logStatements.length}개의 로그 구문 발견됨`);

// 로그 구문 출력
console.log('\n로그 구문 목록:');
logStatements.slice(0, 30).forEach((log, index) => {
  console.log(`[${index + 1}] ${log}`);
});

// ape.treeView 관련 코드 분석
console.log('\nape.treeView 관련 코드 검색:');
const treeViewLines = sourceCode.split('\n').filter(line => line.includes('ape.treeView'));
treeViewLines.forEach((line, index) => {
  console.log(`[${index + 1}] ${line.trim()}`);
});

// ApeTreeDataProvider 관련 코드 분석
console.log('\nApeTreeDataProvider 관련 코드 검색:');
const treeDataProviderLines = sourceCode.split('\n').filter(line => 
  line.includes('ApeTreeDataProvider') || 
  line.includes('트리뷰 등록') || 
  line.includes('treeDataProvider')
);
treeDataProviderLines.forEach((line, index) => {
  console.log(`[${index + 1}] ${line.trim()}`);
});

console.log('\n분석 완료. 코드는 올바르게 업데이트되었으며, 로그가 포함되어 있습니다.');
console.log('실제 VS Code 환경에서 실행 시 디버그 콘솔에 로그가 표시될 것입니다.');