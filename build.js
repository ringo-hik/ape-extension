/**
 * APE 익스텐션 빌드 스크립트
 * 내부망/외부망 환경에 따른 빌드를 지원합니다.
 * 
 * 사용법:
 * - 내부망 빌드: node build.js --env=internal
 * - 외부망 빌드: node build.js --env=external
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 환경 설정
let env = 'external'; // 기본값은 외부망

// 명령줄 인수 파싱
process.argv.forEach(arg => {
  if (arg.startsWith('--env=')) {
    env = arg.split('=')[1];
  }
});

console.log(`APE 익스텐션 빌드 - ${env === 'internal' ? '내부망' : '외부망'} 환경으로 설정됨`);

// 디렉토리 확인 및 생성
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 파일 복사 함수
const copyFile = (source, destination) => {
  try {
    fs.copyFileSync(source, destination);
    console.log(`파일 복사됨: ${source} → ${destination}`);
  } catch (err) {
    console.error(`파일 복사 실패: ${source} → ${destination}`, err);
    process.exit(1);
  }
};

// 빌드 디렉토리 준비
const distDir = path.join(__dirname, 'dist');
ensureDir(distDir);

// 환경에 맞는 설정 파일 준비
if (env === 'internal') {
  // 내부망 설정 파일 사용
  const internalEnvSource = path.join(__dirname, 'extension.env.internal.js');
  const internalSettingsSource = path.join(__dirname, 'config', 'internal', 'settings.json');
  
  if (fs.existsSync(internalEnvSource)) {
    copyFile(internalEnvSource, path.join(distDir, 'extension.env.js'));
  } else {
    console.warn('경고: 내부망 환경 파일이 없습니다. (extension.env.internal.js)');
    // 존재하는 경우 예제 파일을 사용
    if (fs.existsSync(path.join(__dirname, 'extension.env.example.js'))) {
      copyFile(
        path.join(__dirname, 'extension.env.example.js'), 
        path.join(distDir, 'extension.env.js')
      );
    }
  }
  
  // 내부망 설정 JSON 파일 복사
  if (fs.existsSync(internalSettingsSource)) {
    copyFile(internalSettingsSource, path.join(distDir, 'settings.json'));
  } else {
    console.warn('경고: 내부망 설정 파일이 없습니다. (config/internal/settings.json)');
  }
} else {
  // 외부망 설정 파일 사용
  const externalEnvSource = path.join(__dirname, 'extension.env.external.js');
  const externalSettingsSource = path.join(__dirname, 'config', 'external', 'settings.json');
  
  if (fs.existsSync(externalEnvSource)) {
    copyFile(externalEnvSource, path.join(distDir, 'extension.env.js'));
  } else {
    console.warn('경고: 외부망 환경 파일이 없습니다. (extension.env.external.js)');
    // 존재하는 경우 예제 파일을 사용
    if (fs.existsSync(path.join(__dirname, 'extension.env.example.js'))) {
      copyFile(
        path.join(__dirname, 'extension.env.example.js'), 
        path.join(distDir, 'extension.env.js')
      );
    }
  }
  
  // 외부망 설정 JSON 파일 복사
  if (fs.existsSync(externalSettingsSource)) {
    copyFile(externalSettingsSource, path.join(distDir, 'settings.json'));
  } else {
    console.warn('경고: 외부망 설정 파일이 없습니다. (config/external/settings.json)');
  }
}

// 환경 정보 저장
fs.writeFileSync(
  path.join(distDir, 'environment.json'),
  JSON.stringify({ type: env, buildTime: new Date().toISOString() }, null, 2)
);

console.log('환경 설정 파일 준비 완료');

// 기존 빌드 실행
try {
  console.log('esbuild 실행 중...');
  execSync('node esbuild.config.js', { stdio: 'inherit' });
  console.log('빌드 성공');
} catch (err) {
  console.error('빌드 실패:', err);
  process.exit(1);
}

console.log(`APE 익스텐션 ${env} 환경 빌드 완료`);