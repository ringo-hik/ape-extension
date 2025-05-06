#!/bin/bash

# APE 확장 - 외부망 환경 빌드 및 설치 스크립트
# 기능: 외부망 환경 설정, 빌드, 패키지 설치까지 한번에 처리

set -e  # 오류 발생 시 스크립트 종료

echo "===== APE 확장 외부망 빌드 및 설치 시작 ====="
echo "실행 시간: $(date)"
echo "현재 작업 디렉토리: $(pwd)"

# 외부망 환경 설정 파일 확인
if [ ! -f "extension.env.external.js" ]; then
    echo "오류: 외부망 환경 설정 파일(extension.env.external.js)이 없습니다."
    exit 1
fi

# 환경 설정 디렉토리 확인 및 생성
if [ ! -d "config/environments/external" ]; then
    echo "외부망 환경 설정 디렉토리가 없습니다. 생성합니다."
    mkdir -p config/environments/external
    
    # 기본 외부망 설정 파일 생성
    cat << 'EOF' > config/environments/external/env.config.js
/**
 * 외부망 환경 기본 설정 파일
 * 자동 생성됨
 */

module.exports = {
  // 외부망 식별자
  INTERNAL_NETWORK: false,
  
  // API 엔드포인트 설정
  API_ENDPOINTS: {
    // OpenRouter API 사용
    OPENROUTER_API: 'https://openrouter.ai/api/v1/chat/completions'
  }
};
EOF
fi

# 환경 설정 파일 복사 (External 버전 적용)
echo "외부망 환경 설정 적용 중..."
cp -f extension.env.external.js extension.env.js

# Node.js 및 NPM 버전 확인
echo "Node.js 및 NPM 버전 확인"
node -v
npm -v

# 의존성 설치
echo "패키지 설치 중..."
npm install

# 에러 체크 및 재시도
if [ $? -ne 0 ]; then
    echo "패키지 설치 중 오류가 발생했습니다. 캐시를 초기화하고 다시 시도합니다."
    npm cache clean --force
    npm install
    
    if [ $? -ne 0 ]; then
        echo "패키지 설치에 실패했습니다. 스크립트를 종료합니다."
        exit 1
    fi
fi

# 빌드 실행
echo "외부망 버전 클린 빌드 실행 중..."
npm run build:clean

# 빌드 결과 확인
if [ $? -ne 0 ]; then
    echo "빌드에 실패했습니다. 스크립트를 종료합니다."
    exit 1
fi

# 확장 디렉토리 설정
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    EXTENSION_DIR="$HOME/.vscode/extensions/ape-team.ape-external-0.0.1"
else
    # Linux
    EXTENSION_DIR="$HOME/.vscode/extensions/ape-team.ape-external-0.0.1"
fi

# WSL 환경 확인
if grep -qi microsoft /proc/version; then
    echo "WSL 환경이 감지되었습니다. 확장 설치 디렉토리를 조정합니다."
    WINDOWS_HOME=$(wslpath "$(wslvar USERPROFILE)")
    EXTENSION_DIR="$WINDOWS_HOME/.vscode/extensions/ape-team.ape-external-0.0.1"
fi

# 기존 확장 제거
if [ -d "$EXTENSION_DIR" ]; then
    echo "기존 APE 외부망 확장 제거 중..."
    rm -rf "$EXTENSION_DIR"
fi

# 확장 설치 디렉토리 생성
echo "APE 외부망 확장 설치 디렉토리 생성 중..."
mkdir -p "$EXTENSION_DIR"

# 필요한 파일 복사
echo "필요한 파일 복사 중..."
cp -r dist "$EXTENSION_DIR/"
cp -r resources "$EXTENSION_DIR/"
cp package.json "$EXTENSION_DIR/"
[ -f README.md ] && cp README.md "$EXTENSION_DIR/"
[ -f CHANGELOG.md ] && cp CHANGELOG.md "$EXTENSION_DIR/"
[ -f LICENSE ] && cp LICENSE "$EXTENSION_DIR/"

# node_modules 필요한 모듈 복사 (선택적)
echo "필요한 노드 모듈 복사 중..."
mkdir -p "$EXTENSION_DIR/node_modules"

# VSIX 패키지 생성 (선택적)
echo "VSIX 패키지 생성 중..."
npx vsce package -o ape-external.vsix

echo "===== APE 외부망 확장 빌드 및 설치 완료 ====="
echo "설치 위치: $EXTENSION_DIR"
echo "VSIX 패키지: $(pwd)/ape-external.vsix"
echo "완료 시간: $(date)"
echo "VS Code를 다시 시작하여 확장을 로드하세요."