@echo off
setlocal enabledelayedexpansion

:: APE 확장 - 내부망 환경 빌드 및 설치 스크립트
:: 기능: 기존 패키지 제거, 빌드, 패키지 설치까지 한번에 처리

echo ===== APE 확장 내부망 빌드 및 설치 시작 =====
echo 실행 시간: %date% %time%
echo 현재 작업 디렉토리: %cd%

:: 환경 설정 - 내부망용 설정 파일 확인
if not exist config\environments\internal\env.config.js (
    echo 내부망 환경 설정 파일이 없습니다. 기본 설정을 생성합니다.
    
    :: 환경 설정 디렉토리 확인 및 생성
    if not exist config\environments\internal mkdir config\environments\internal
    
    :: 기본 내부망 설정 파일 생성
    echo /**> config\environments\internal\env.config.js
    echo  * 내부망 환경 기본 설정 파일>> config\environments\internal\env.config.js
    echo  * 자동 생성됨>> config\environments\internal\env.config.js
    echo  */>> config\environments\internal\env.config.js
    echo.>> config\environments\internal\env.config.js
    echo module.exports = {>> config\environments\internal\env.config.js
    echo   // 내부망 식별자>> config\environments\internal\env.config.js
    echo   INTERNAL_NETWORK: true,>> config\environments\internal\env.config.js
    echo.>> config\environments\internal\env.config.js
    echo   // SSL 인증서 검증 우회 설정>> config\environments\internal\env.config.js
    echo   FORCE_SSL_BYPASS: true,>> config\environments\internal\env.config.js
    echo.>> config\environments\internal\env.config.js
    echo   // 넥서스 설정>> config\environments\internal\env.config.js
    echo   NEXUS: {>> config\environments\internal\env.config.js
    echo     URL: 'http://localhost:8081/repository/npm-group/'>> config\environments\internal\env.config.js
    echo   },>> config\environments\internal\env.config.js
    echo.>> config\environments\internal\env.config.js
    echo   // API 엔드포인트 설정>> config\environments\internal\env.config.js
    echo   API_ENDPOINTS: {>> config\environments\internal\env.config.js
    echo     NARRANS_API: 'http://localhost:8001/v1/chat/completions',>> config\environments\internal\env.config.js
    echo     LLAMA4_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions'>> config\environments\internal\env.config.js
    echo   }>> config\environments\internal\env.config.js
    echo };>> config\environments\internal\env.config.js
)

:: extension.env.js 파일 생성 (내부망 설정)
echo /**> extension.env.js
echo  * APE Extension 내부망 환경변수 설정 파일>> extension.env.js
echo  * 내부망 설치를 위해 자동 생성됨>> extension.env.js
echo  */>> extension.env.js
echo.>> extension.env.js
echo module.exports = {>> extension.env.js
echo   // 내부망 설정 명시적 활성화>> extension.env.js
echo   INTERNAL_NETWORK: true,>> extension.env.js
echo.>> extension.env.js
echo   // SSL 우회 활성화>> extension.env.js
echo   FORCE_SSL_BYPASS: true,>> extension.env.js
echo.>> extension.env.js
echo   // 내부망 API 설정>> extension.env.js
echo   NARRANS_API_ENDPOINT: 'http://localhost:8001/v1/chat/completions',>> extension.env.js
echo.>> extension.env.js
echo   // Llama 4 API 엔드포인트 (내부망)>> extension.env.js
echo   LLAMA4_API_ENDPOINT: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',>> extension.env.js
echo.>> extension.env.js
echo   // 넥서스 저장소>> extension.env.js
echo   NEXUS_URL: 'http://localhost:8081/repository/npm-group/',>> extension.env.js
echo.>> extension.env.js
echo   // 환경 모드 설정>> extension.env.js
echo   ENV_MODE: 'development',>> extension.env.js
echo.>> extension.env.js
echo   // 로깅 설정>> extension.env.js
echo   LOG_LEVEL: 'debug'>> extension.env.js
echo };>> extension.env.js

echo 내부망 환경 설정 완료.

:: 기존 설치 패키지 제거
set EXTENSION_DIR=%USERPROFILE%\.vscode\extensions\ape-team.ape-0.0.1
if exist "%EXTENSION_DIR%" (
    echo 기존 APE 확장 제거 중...
    rmdir /s /q "%EXTENSION_DIR%"
)

:: 의존성 설치
echo 패키지 설치 중...
call npm install

:: 에러 체크
if %ERRORLEVEL% neq 0 (
    echo 패키지 설치 중 오류가 발생했습니다. 캐시를 초기화하고 다시 시도합니다.
    call npm cache clean --force
    call npm install
    
    if %ERRORLEVEL% neq 0 (
        echo 패키지 설치에 실패했습니다. 스크립트를 종료합니다.
        exit /b 1
    )
)

:: 빌드 실행
echo APE 확장 빌드 중...
call npm run build:clean

:: 빌드 실패 확인
if %ERRORLEVEL% neq 0 (
    echo 빌드에 실패했습니다. 스크립트를 종료합니다.
    exit /b 1
)

:: 확장 설치 디렉토리 생성
echo APE 확장 설치 디렉토리 생성 중...
mkdir "%EXTENSION_DIR%"

:: 필요한 파일 복사
echo 필요한 파일 복사 중...
xcopy /E /I /Y dist "%EXTENSION_DIR%\dist"
xcopy /E /I /Y resources "%EXTENSION_DIR%\resources"
copy /Y package.json "%EXTENSION_DIR%\"
if exist README.md copy /Y README.md "%EXTENSION_DIR%\"
if exist CHANGELOG.md copy /Y CHANGELOG.md "%EXTENSION_DIR%\"
if exist LICENSE copy /Y LICENSE "%EXTENSION_DIR%\"

:: node_modules 필요한 모듈 복사 (선택적)
echo 필요한 노드 모듈 복사 중...
mkdir "%EXTENSION_DIR%\node_modules"

echo ===== APE 확장 내부망 빌드 및 설치 완료 =====
echo 설치 위치: %EXTENSION_DIR%
echo 완료 시간: %date% %time%
echo VS Code를 다시 시작하여 확장을 로드하세요.