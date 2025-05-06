@echo off
echo ===== APE 확장 External 빌드 시작 =====

REM 현재 디렉토리 출력
echo 현재 작업 디렉토리: %cd%

REM 환경 설정 파일 검사
if not exist extension.env.external.js (
    echo 오류: External 환경 설정 파일(extension.env.external.js)이 없습니다.
    exit /b 1
)

REM 환경 설정 파일 복사 (External 버전 적용)
echo External 환경 설정 적용 중...
copy /Y extension.env.external.js extension.env.js

REM 의존성 설치
echo 의존성 설치 중...
call npm install

REM 클린 빌드 실행
echo External 버전 클린 빌드 실행 중...
call npm run build:clean

REM 확장 디렉토리 설정 (Windows용)
set EXTENSION_DIR=%USERPROFILE%\.vscode\extensions\ape-team.ape-external-0.0.1

REM 기존 확장 제거
if exist "%EXTENSION_DIR%" (
    echo 기존 APE External 확장 제거 중...
    rmdir /s /q "%EXTENSION_DIR%"
)

REM 확장 설치 디렉토리 생성
echo APE External 확장 설치 디렉토리 생성 중...
mkdir "%EXTENSION_DIR%"

REM 필요한 파일 복사
echo 필요한 파일 복사 중...
xcopy /E /I /Y dist "%EXTENSION_DIR%\dist"
xcopy /E /I /Y resources "%EXTENSION_DIR%\resources"
copy /Y package.json "%EXTENSION_DIR%\"
if exist README.md copy /Y README.md "%EXTENSION_DIR%\"
if exist CHANGELOG.md copy /Y CHANGELOG.md "%EXTENSION_DIR%\"
if exist LICENSE copy /Y LICENSE "%EXTENSION_DIR%\"

REM node_modules 필요한 모듈 복사 (선택적)
echo 필요한 노드 모듈 복사 중...
mkdir "%EXTENSION_DIR%\node_modules"

REM VSIX 패키지 생성 (선택적)
echo VSIX 패키지 생성 중...
call npx vsce package -o ape-external.vsix

echo ===== APE External 확장 빌드 및 설치 완료 =====
echo 설치 위치: %EXTENSION_DIR%
echo VSIX 패키지: %cd%\ape-external.vsix
echo VS Code를 다시 시작하여 확장을 로드하세요.