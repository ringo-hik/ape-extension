@echo off
setlocal

echo ===== APE Extension 내부망 설치 스크립트 =====
echo 실행 시간: %DATE% %TIME%
echo 현재 디렉토리: %CD%

:: 내부망 넥서스 저장소 URL (필요 시 수정)
set NEXUS_URL=http://localhost:8081/repository/npm-group/

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