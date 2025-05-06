#!/bin/bash

# APE Extension 내부망 환경용 빌드 및 설치 스크립트
# 내부망 넥서스 저장소를 사용하여 의존성을 설치하고 빌드합니다.

# 스크립트 시작 메시지
echo "===== APE Extension 내부망 빌드 및 설치 시작 ====="
echo "실행 시간: $(date)"
echo "현재 디렉토리: $(pwd)"

# 내부망 넥서스 서버 주소 (필요시 수정)
NEXUS_URL="http://localhost:8081/repository/npm-group/"

# 수정 가능한 환경 변수
# 아래 값들을 내부망 환경에 맞게 수정하세요
INTERNAL_API_SERVER="localhost:8001"
LLAMA_API_SERVER="localhost:8000"

# 임시 .npmrc 파일 생성
echo "내부망 넥서스 저장소 설정(.npmrc 생성)..."
cat << EOF > .npmrc
registry=${NEXUS_URL}
strict-ssl=false
EOF

echo ".npmrc 파일 생성됨:"
cat .npmrc

# 내부망 환경 설정 파일 확인
if [ ! -f "extension.env.js" ]; then
  echo "extension.env.js 파일이 없습니다. 예제 파일로부터 생성합니다."
  
  if [ -f "extension.env.example.js" ]; then
    cp extension.env.example.js extension.env.js
    echo "extension.env.example.js로부터 extension.env.js 생성됨"
  else
    echo "extension.env.example.js 파일도 없습니다. 기본 설정으로 생성합니다."
    
    # 기본 extension.env.js 파일 생성
    cat << EOF > extension.env.js
/**
 * APE Extension 내부망 환경변수 설정 파일
 * 내부망 설치를 위해 자동 생성됨
 */

module.exports = {
  // 내부망 설정 명시적 활성화
  INTERNAL_NETWORK: 'true',
  
  // SSL 우회 활성화
  FORCE_SSL_BYPASS: 'true',
  
  // 내부망 API 설정
  INTERNAL_API_ENDPOINT: 'http://${INTERNAL_API_SERVER}/v1/chat/completions',
  INTERNAL_API_KEY: 'your_internal_api_key_here',
  
  // Llama 4 API 엔드포인트 (내부망)
  LLAMA4_API_ENDPOINT: 'http://${LLAMA_API_SERVER}/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
  
  // 환경 모드 설정
  ENV_MODE: 'development',
  
  // 로깅 설정
  LOG_LEVEL: 'debug'
};
EOF
    echo "기본 내부망 설정으로 extension.env.js 생성됨"
  fi
fi

# Node.js 버전 확인
echo "Node.js 버전 확인 중..."
node -v
npm -v

# 패키지 설치
echo "내부망 넥서스 저장소에서 패키지 설치 중..."
npm install --registry=${NEXUS_URL} --no-strict-ssl

# 에러 확인
if [ $? -ne 0 ]; then
  echo "패키지 설치 중 오류가 발생했습니다. 다시 시도합니다."
  
  # 캐시 초기화 및 재시도
  npm cache clean --force
  npm install --registry=${NEXUS_URL} --no-strict-ssl --loglevel verbose
  
  # 두 번째 시도 결과 확인
  if [ $? -ne 0 ]; then
    echo "패키지 설치에 실패했습니다. 스크립트를 종료합니다."
    exit 1
  fi
fi

# 빌드 실행
echo "APE Extension 빌드 중..."
npm run build

# 빌드 결과 확인
if [ $? -ne 0 ]; then
  echo "빌드에 실패했습니다. 스크립트를 종료합니다."
  exit 1
fi

echo "APE Extension 빌드 완료!"

# VSCode 익스텐션 설치 (선택사항)
read -p "VSCode에 개발 버전을 설치하시겠습니까? (y/n): " install_vscode

if [ "$install_vscode" = "y" ] || [ "$install_vscode" = "Y" ]; then
  echo "VSCode에 개발 버전 설치 중..."
  
  # Windows (WSL) 환경 확인
  if grep -qi microsoft /proc/version; then
    echo "WSL 환경 감지됨, Windows VSCode에 설치합니다."
    VSCODE_PATH=$(wslpath "$(wslvar LOCALAPPDATA)/Programs/Microsoft VS Code/bin/code")
    
    if [ -f "$VSCODE_PATH" ]; then
      "$VSCODE_PATH" --install-extension "$(pwd)" --force
    else
      echo "VSCode 실행 파일을 찾을 수 없습니다. 수동으로 설치해주세요."
    fi
  else
    # Linux/Mac 환경
    if command -v code &> /dev/null; then
      code --install-extension "$(pwd)" --force
    else
      echo "VSCode 실행 파일을 찾을 수 없습니다. 수동으로 설치해주세요."
    fi
  fi
fi

echo "===== APE Extension 내부망 빌드 및 설치 완료 ====="
echo "실행 완료 시간: $(date)"