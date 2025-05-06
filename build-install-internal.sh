#!/bin/bash

# APE Extension 내부망 환경용 빌드 및 설치 스크립트
# 내부망 넥서스 저장소를 사용하여 의존성을 설치하고 빌드합니다.

# 스크립트 시작 메시지
echo "===== APE Extension 내부망 빌드 및 설치 시작 ====="
echo "실행 시간: $(date)"
echo "현재 디렉토리: $(pwd)"

# 환경 설정 디렉토리 확인 및 생성
if [ ! -d "config/environments/internal" ]; then
  echo "내부망 환경 설정 디렉토리가 없습니다. 환경 설정을 진행합니다."
  
  # 환경 설정 스크립트 실행
  if [ -f "scripts/setup-environment.js" ]; then
    echo "환경 설정 스크립트 실행 중..."
    node scripts/setup-environment.js
    
    # 스크립트 실행 실패 시 기본 설정 생성
    if [ $? -ne 0 ]; then
      echo "환경 설정에 실패했습니다. 기본 내부망 환경으로 설정합니다."
      
      # 디렉토리 생성
      mkdir -p config/environments/internal
      
      # 기본 내부망 설정 생성
      cat << EOF > config/environments/internal/env.config.js
/**
 * 내부망 환경 기본 설정 파일
 * 자동 생성됨
 */

module.exports = {
  // 내부망 식별자
  INTERNAL_NETWORK: true,
  
  // SSL 인증서 검증 우회 설정
  FORCE_SSL_BYPASS: true,
  
  // 넥서스 설정
  NEXUS: {
    URL: 'http://localhost:8081/repository/npm-group/'
  },
  
  // API 엔드포인트 설정
  API_ENDPOINTS: {
    NARRANS_API: 'http://localhost:8001/v1/chat/completions',
    LLAMA4_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions'
  }
};
EOF
    fi
  else
    echo "환경 설정 스크립트를 찾을 수 없습니다. 기본 내부망 환경으로 설정합니다."
    
    # 디렉토리 및 기본 설정 파일 생성
    mkdir -p config/environments/internal
    
    cat << EOF > config/environments/internal/env.config.js
/**
 * 내부망 환경 기본 설정 파일
 * 자동 생성됨
 */

module.exports = {
  // 내부망 식별자
  INTERNAL_NETWORK: true,
  
  // SSL 인증서 검증 우회 설정
  FORCE_SSL_BYPASS: true,
  
  // 넥서스 설정
  NEXUS: {
    URL: 'http://localhost:8081/repository/npm-group/'
  },
  
  // API 엔드포인트 설정
  API_ENDPOINTS: {
    NARRANS_API: 'http://localhost:8001/v1/chat/completions',
    LLAMA4_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions'
  }
};
EOF
  fi
fi

# 넥서스 URL 가져오기
NEXUS_URL="http://localhost:8081/repository/npm-group/"

# 환경 설정 파일에서 넥서스 URL 읽기 시도
if [ -f "config/environments/internal/env.config.js" ]; then
  NEXUS_URL_FROM_CONFIG=$(node -e "try { const config = require('./config/environments/internal/env.config.js'); console.log(config.NEXUS && config.NEXUS.URL || 'http://localhost:8081/repository/npm-group/'); } catch(e) { console.log('http://localhost:8081/repository/npm-group/'); }")
  
  if [ ! -z "$NEXUS_URL_FROM_CONFIG" ]; then
    NEXUS_URL="$NEXUS_URL_FROM_CONFIG"
  fi
fi

# 내부망 API 서버 주소 가져오기
INTERNAL_API_SERVER="localhost:8001"
LLAMA_API_SERVER="localhost:8000"

# 환경 설정 파일에서 API 서버 주소 읽기 시도
if [ -f "config/environments/internal/env.config.js" ]; then
  INTERNAL_API_FROM_CONFIG=$(node -e "try { const config = require('./config/environments/internal/env.config.js'); const url = config.API_ENDPOINTS && config.API_ENDPOINTS.NARRANS_API || ''; if (url) { const match = url.match(/(https?:\\/\\/)?([^:/]+)(:[0-9]+)?/); console.log(match ? match[2] + (match[3] || '') : 'localhost:8001'); } else { console.log('localhost:8001'); } } catch(e) { console.log('localhost:8001'); }")
  
  if [ ! -z "$INTERNAL_API_FROM_CONFIG" ]; then
    INTERNAL_API_SERVER="$INTERNAL_API_FROM_CONFIG"
  fi
  
  LLAMA_API_FROM_CONFIG=$(node -e "try { const config = require('./config/environments/internal/env.config.js'); const url = config.API_ENDPOINTS && config.API_ENDPOINTS.LLAMA4_API || ''; if (url) { const match = url.match(/(https?:\\/\\/)?([^:/]+)(:[0-9]+)?/); console.log(match ? match[2] + (match[3] || '') : 'localhost:8000'); } else { console.log('localhost:8000'); } } catch(e) { console.log('localhost:8000'); }")
  
  if [ ! -z "$LLAMA_API_FROM_CONFIG" ]; then
    LLAMA_API_SERVER="$LLAMA_API_FROM_CONFIG"
  fi
fi

echo "설정 정보 확인:"
echo "넥서스 저장소 URL: $NEXUS_URL"
echo "내부망 API 서버: $INTERNAL_API_SERVER"
echo "Llama API 서버: $LLAMA_API_SERVER"

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
  echo "extension.env.js 파일이 없습니다. 새로 생성합니다."
  
  # 기본 extension.env.js 파일 생성
  cat << EOF > extension.env.js
/**
 * APE Extension 내부망 환경변수 설정 파일
 * 내부망 설치를 위해 자동 생성됨
 */

module.exports = {
  // 내부망 설정 명시적 활성화
  INTERNAL_NETWORK: true,
  
  // SSL 우회 활성화
  FORCE_SSL_BYPASS: true,
  
  // 내부망 API 설정
  NARRANS_API_ENDPOINT: 'http://${INTERNAL_API_SERVER}/v1/chat/completions',
  
  // Llama 4 API 엔드포인트 (내부망)
  LLAMA4_API_ENDPOINT: 'http://${LLAMA_API_SERVER}/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
  
  // 넥서스 저장소
  NEXUS_URL: '${NEXUS_URL}',
  
  // 환경 모드 설정
  ENV_MODE: 'development',
  
  // 로깅 설정
  LOG_LEVEL: 'debug'
};
EOF
  echo "기본 내부망 설정으로 extension.env.js 생성됨"
fi

# Node.js 버전 확인
echo "Node.js 버전 확인 중..."
node -v
npm -v

# 패키지 설치
echo "내부망 넥서스 저장소에서 패키지 설치 중..."
npm install --registry=${NEXUS_URL} --no-strict-ssl --legacy-peer-deps

# 에러 확인
if [ $? -ne 0 ]; then
  echo "패키지 설치 중 오류가 발생했습니다. 다시 시도합니다."
  
  # 캐시 초기화 및 재시도
  npm cache clean --force
  npm install --registry=${NEXUS_URL} --no-strict-ssl --legacy-peer-deps
  
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