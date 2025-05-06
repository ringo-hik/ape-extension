const fs = require('fs');
const path = require('path');

// 확장 로그 경로 정의 (플랫폼별로 다름)
const isWindows = process.platform === 'win32';
const homeDir = process.env.HOME || process.env.USERPROFILE;
let logPath;

if (isWindows) {
  // Windows
  logPath = path.join(homeDir, 'AppData', 'Roaming', 'Code', 'logs', 'extension-host.log');
} else if (process.platform === 'darwin') {
  // macOS
  logPath = path.join(homeDir, 'Library', 'Application Support', 'Code', 'logs', 'extension-host.log');
} else {
  // Linux
  logPath = path.join(homeDir, '.config', 'Code', 'logs', 'extension-host.log');
}

// WSL 경로를 처리하기 위한 로그 경로 체크
const wslLogPath = '/mnt/c/Users/hik90/AppData/Roaming/Code/logs/extension-host.log';

// 파일 존재 확인
if (fs.existsSync(logPath)) {
  console.log(`로그 파일 발견: ${logPath}`);
  const log = fs.readFileSync(logPath, 'utf8');
  
  // APE 익스텐션 관련 로그 추출
  const apeLines = log.split('\n').filter(line => line.includes('ape'));
  
  if (apeLines.length > 0) {
    console.log('APE 익스텐션 로그:');
    apeLines.slice(-50).forEach(line => console.log(line)); // 최근 50개 라인만 표시
  } else {
    console.log('APE 익스텐션 관련 로그가 없습니다.');
  }
} else if (fs.existsSync(wslLogPath)) {
  console.log(`WSL 로그 파일 발견: ${wslLogPath}`);
  const log = fs.readFileSync(wslLogPath, 'utf8');
  
  // APE 익스텐션 관련 로그 추출
  const apeLines = log.split('\n').filter(line => line.includes('ape'));
  
  if (apeLines.length > 0) {
    console.log('APE 익스텐션 로그:');
    apeLines.slice(-50).forEach(line => console.log(line)); // 최근 50개 라인만 표시
  } else {
    console.log('APE 익스텐션 관련 로그가 없습니다.');
  }
} else {
  console.log(`로그 파일을 찾을 수 없습니다: ${logPath}`);
  
  // 대체 로그 위치 확인
  const altLogDirs = [
    path.join(homeDir, '.vscode/logs'),
    path.join(homeDir, '.vscode-server/logs'),
    '/tmp/vscode-logs'
  ];
  
  console.log('가능한 로그 파일 위치 확인 중...');
  altLogDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`로그 디렉토리 발견: ${dir}`);
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file.includes('extension') || file.includes('log')) {
            console.log(`  로그 파일: ${path.join(dir, file)}`);
          }
        });
      } catch (err) {
        console.error(`디렉토리 읽기 오류: ${err.message}`);
      }
    }
  });
}

// 확장 초기화 확인 - dist 디렉토리 검사
console.log('\n=== 확장 초기화 상태 확인 ===');

// 필수 파일 확인
const requiredFiles = [
  'dist/extension.js',
  'dist/extension.env.js',
  'dist/settings.json',
  'dist/init.context.js'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} 존재함`);
    
    // 내용 간략히 로깅
    if (file.endsWith('.js') || file.endsWith('.json')) {
      const content = fs.readFileSync(file, 'utf8');
      const preview = content.substring(0, 100).replace(/\n/g, ' ') + '...';
      console.log(`   내용 미리보기: ${preview}`);
    }
  } else {
    console.log(`❌ ${file} 없음`);
  }
});

// 환경 설정 확인
console.log('\n=== 환경 설정 확인 ===');
try {
  if (fs.existsSync('extension.env.js')) {
    const envContent = fs.readFileSync('extension.env.js', 'utf8');
    console.log('extension.env.js 내용:');
    console.log(envContent);
  } else {
    console.log('❌ extension.env.js 파일을 찾을 수 없습니다');
  }
} catch (err) {
  console.error(`환경 파일 읽기 오류: ${err.message}`);
}

console.log('\n디버그 확인 완료');