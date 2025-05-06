@echo off
setlocal

echo ===== APE Extension 내부망 설치 스크립트 =====
echo 실행 시간: %DATE% %TIME%
echo 현재 디렉토리: %CD%

:: 내부망 감지 및 환경 설정
echo 환경 설정 초기화 중...

:: 환경 설정 디렉토리 확인
if not exist "config\environments\internal" (
  echo 내부망 환경 설정 디렉토리가 없습니다. 환경 설정을 진행합니다.
  
  :: 환경 설정 스크립트 실행
  echo 환경 설정 스크립트 실행 중...
  node scripts\setup-environment.js
  
  if %ERRORLEVEL% neq 0 (
    echo 환경 설정에 실패했습니다. 자동으로 내부망 환경으로 설정합니다.
    
    :: 디렉토리 생성
    mkdir config\environments\internal 2>nul
    
    :: 기본 내부망 설정 생성
    echo // 내부망 기본 설정 > config\environments\internal\env.config.js
    echo module.exports = { >> config\environments\internal\env.config.js
    echo   INTERNAL_NETWORK: true, >> config\environments\internal\env.config.js
    echo   FORCE_SSL_BYPASS: true, >> config\environments\internal\env.config.js
    echo   NEXUS: { >> config\environments\internal\env.config.js
    echo     URL: 'http://localhost:8081/repository/npm-group/' >> config\environments\internal\env.config.js
    echo   } >> config\environments\internal\env.config.js
    echo }; >> config\environments\internal\env.config.js
  )
)

:: 넥서스 저장소 URL 가져오기
set NEXUS_URL=http://localhost:8081/repository/npm-group/

:: 환경 설정 파일에서 넥서스 URL 읽기 시도
for /f "tokens=*" %%a in ('node -e "try { const config = require('./config/environments/internal/env.config.js'); console.log(config.NEXUS && config.NEXUS.URL || 'http://localhost:8081/repository/npm-group/'); } catch(e) { console.log('http://localhost:8081/repository/npm-group/'); }"') do (
  set NEXUS_URL=%%a
)

echo 내부망 넥서스 저장소 URL: %NEXUS_URL%

:: 환경 확인
echo Node.js 버전 확인 중...
node -v
npm -v

:: 패키지 설치
echo 패키지 설치 중...
npm install --legacy-peer-deps

:: 에러 확인
if %ERRORLEVEL% neq 0 (
  echo 패키지 설치 중 오류가 발생했습니다. 내부망 넥서스 저장소를 통해 재시도합니다.
  
  :: 넥서스 저장소 사용하여 재시도
  echo 내부망 넥서스 저장소 사용하여 재시도 중...
  npm install --registry=%NEXUS_URL% --no-strict-ssl --legacy-peer-deps
  
  :: 두 번째 시도 결과 확인
  if %ERRORLEVEL% neq 0 (
    echo 패키지 설치에 실패했습니다. 스크립트를 종료합니다.
    exit /b 1
  )
)

:: extension.env.js 파일 생성 확인
if not exist "extension.env.js" (
  echo extension.env.js 파일을 생성합니다...
  
  :: 기본 내용 생성
  echo // 내부망 환경 설정 파일 - 자동 생성됨 > extension.env.js
  echo module.exports = { >> extension.env.js
  echo   // 내부망 모드 활성화 >> extension.env.js
  echo   INTERNAL_NETWORK: true, >> extension.env.js
  echo   >> extension.env.js
  echo   // SSL 우회 활성화 >> extension.env.js
  echo   FORCE_SSL_BYPASS: true, >> extension.env.js
  echo   >> extension.env.js
  echo   // 내부망 모델 API 엔드포인트 >> extension.env.js
  echo   NARRANS_API_ENDPOINT: 'http://localhost:8001/v1/chat/completions', >> extension.env.js
  echo   LLAMA4_API_ENDPOINT: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions', >> extension.env.js
  echo   >> extension.env.js
  echo   // 넥서스 저장소 URL >> extension.env.js
  echo   NEXUS_URL: '%NEXUS_URL%' >> extension.env.js
  echo }; >> extension.env.js
  
  echo extension.env.js 파일 생성 완료
)

:: 빌드 실행
echo APE Extension 빌드 중...
npm run build

:: 빌드 결과 확인
if %ERRORLEVEL% neq 0 (
  echo 빌드에 실패했습니다. 스크립트를 종료합니다.
  exit /b 1
)

echo APE Extension 빌드 완료!

:: VSCode 익스텐션 설치 (선택사항)
set /p install_vscode=VSCode에 개발 버전을 설치하시겠습니까? (y/n): 

if /i "%install_vscode%"=="y" (
  echo VSCode에 개발 버전 설치 중...
  code --install-extension "%CD%" --force
)

echo ===== APE Extension 내부망 설치 완료 =====
echo 실행 완료 시간: %DATE% %TIME%

endlocal