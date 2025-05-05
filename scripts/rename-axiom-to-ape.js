/**
 * APE → APE 리브랜딩 스크립트
 * 
 * 파일 및 코드 내용에서 'ape'/'APE' 참조를 'ape'/'APE'로 변경합니다.
 * 주의: 이 스크립트는 파일 이름 변경을 포함하지 않습니다. 파일 이름 변경은 별도로 관리해야 합니다.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// 변환 목록 정의
const replacements = [
  { from: 'ape\\.', to: 'ape.' }, // 설정 네임스페이스 (ape.core.logLevel → ape.core.logLevel)
  { from: 'Ape', to: 'Ape' },     // 클래스 이름 및 표시 텍스트
  { from: 'ape', to: 'ape' },     // 소문자 참조 (변수명, 파일명 등)
  { from: 'APE', to: 'APE' }      // 대문자 참조 (상수 등)
];

// 제외할 디렉토리 목록
const excludeDirs = [
  'node_modules',
  'dist',
  '.git',
  '.vscode'
];

// 작업할 확장자 목록
const includeExts = [
  '.ts',
  '.js',
  '.json',
  '.md',
  '.html',
  '.css'
];

// 처리할 파일 찾기
async function findFiles(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory()) {
      // 제외 디렉토리가 아닌 경우에만 재귀 탐색
      if (!excludeDirs.includes(file)) {
        await findFiles(filePath, fileList);
      }
    } else {
      // 포함할 확장자만 추가
      const ext = path.extname(file);
      if (includeExts.includes(ext)) {
        fileList.push(filePath);
      }
    }
  }
  
  return fileList;
}

// 파일 내용 교체
async function processFile(filePath) {
  try {
    // 파일 읽기
    const content = await readFile(filePath, 'utf8');
    
    // 교체 적용
    let newContent = content;
    let hasChanges = false;
    
    for (const replacement of replacements) {
      const regex = new RegExp(replacement.from, 'g');
      
      if (regex.test(newContent)) {
        newContent = newContent.replace(regex, replacement.to);
        hasChanges = true;
      }
    }
    
    // 변경된 경우에만 저장
    if (hasChanges) {
      await writeFile(filePath, newContent, 'utf8');
      console.log(`변경됨: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`오류 발생 (${filePath}):`, error);
    return false;
  }
}

// 메인 함수
async function main() {
  try {
    console.log('APE → APE 리브랜딩 시작...');
    
    // 시작 디렉토리 설정
    const rootDir = path.resolve(__dirname, '..');
    console.log(`루트 디렉토리: ${rootDir}`);
    
    // 파일 목록 찾기
    console.log('처리할 파일 찾는 중...');
    const files = await findFiles(rootDir);
    console.log(`총 ${files.length}개 파일 발견됨`);
    
    // 각 파일 처리
    let changedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const changed = await processFile(file);
        if (changed) {
          changedCount++;
        }
      } catch (error) {
        console.error(`파일 처리 실패 (${file}):`, error);
        errorCount++;
      }
      
      // 진행 상황 표시
      if ((i + 1) % 10 === 0 || i === files.length - 1) {
        console.log(`진행: ${i + 1}/${files.length} (${Math.round((i + 1) / files.length * 100)}%)`);
      }
    }
    
    console.log('\n===== 변경 요약 =====');
    console.log(`총 파일: ${files.length}개`);
    console.log(`변경된 파일: ${changedCount}개`);
    console.log(`오류 발생: ${errorCount}개`);
    console.log('===================\n');
    
    console.log('리브랜딩 완료!');
    console.log('참고: 이 스크립트는 파일 내용만 변경하고 파일 이름은 변경하지 않습니다.');
    console.log('파일 이름 변경은 별도로 수행해야 합니다.');
  } catch (error) {
    console.error('리브랜딩 중 오류 발생:', error);
  }
}

// 스크립트 실행
main().catch(error => {
  console.error('스크립트 오류:', error);
  process.exit(1);
});