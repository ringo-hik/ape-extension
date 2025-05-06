# APE 익스텐션 내부망/외부망 설치 가이드

이 문서는 APE 익스텐션을 내부망 및 외부망 환경에서 설치하고 구성하기 위한 가이드입니다.

## 1. 환경 설정 구조

APE 익스텐션은 내부망과 외부망 환경을 자동으로 감지하고 적절한 설정을 적용하는 시스템을 갖추고 있습니다.

### 환경 설정 디렉토리 구조

```
config/
├── env.loader.js           # 환경 설정 로더
├── model.config.js         # LLM 모델 구성 관리자
└── environments/           # 환경 설정 디렉토리
    ├── internal/           # 내부망 환경 설정
    │   └── env.config.js   # 내부망 설정 파일
    └── external/           # 외부망 환경 설정
        └── env.config.js   # 외부망 설정 파일
```

### 환경 구성 우선순위

설정은 다음 우선순위로 적용됩니다:

1. 사용자 설정 파일 (`extension.env.js`)
2. 환경 감지에 따른 내부망/외부망 설정 (`config/environments/internal|external/env.config.js`)
3. 기본 하드코딩 설정

## 2. 환경 설정 및 설치

### 환경 설정 초기화 (처음 설치 시)

새로운 환경에 처음 설치할 경우 다음 명령으로 환경을 설정하세요:

```bash
# 환경 설정 스크립트 실행
node scripts/setup-environment.js
```

이 스크립트는 대화형 인터페이스로 내부망 또는 외부망 환경을 선택하고, API 서버 정보 및 넥서스 저장소 URL 등을 설정할 수 있습니다.

### 내부망 환경 설치 (Windows)

Windows 내부망 환경에서는 배치 스크립트를 실행하세요:

```batch
internal-install.bat
```

이 스크립트는 다음 작업을 수행합니다:
- 환경 설정 디렉토리 및 파일 확인 (없으면 자동 생성)
- 패키지 설치 (`--legacy-peer-deps` 플래그 사용)
- 설치 실패 시 내부망 넥서스 저장소를 통해 재시도
- `extension.env.js` 파일 생성 (없는 경우)
- 프로젝트 빌드
- VSCode에 개발 버전 설치 (선택 사항)

### 내부망 환경 설치 (Linux/WSL)

Linux 또는 WSL 환경에서는 다음 스크립트를 실행하세요:

```bash
# 실행 권한 추가
chmod +x build-install-internal.sh

# 스크립트 실행
./build-install-internal.sh
```

### 외부망 환경 설치

외부망(인터넷 연결 가능한 환경)에서는 일반적인 npm 명령을 사용하세요:

```bash
# 패키지 설치
npm install

# 빌드 실행
npm run build
```

## 3. 패키지 의존성 문제 해결

내부망 환경에서 `npm install` 실행 시 패키지 의존성 충돌 문제가 발생할 수 있습니다. 이는 다음과 같은 이유로 발생합니다:

1. 내부망 넥서스 저장소에 일부 최신 패키지가 없음
2. 패키지 간 버전 충돌 (esbuild와 esbuild-plugin-eslint 등)

### 호환성 보장 package.json 구성

아래와 같이 package.json의 devDependencies 버전을 고정했습니다:

```json
"devDependencies": {
  "@types/glob": "^8.1.0",
  "@types/node": "16.x",
  "@types/vscode": "^1.85.0",
  "@typescript-eslint/eslint-plugin": "^5.59.1",
  "@typescript-eslint/parser": "^5.59.1",
  "@vscode/test-electron": "^2.3.0",
  "esbuild": "0.17.19",            // 버전 고정
  "esbuild-node-externals": "^1.8.0",
  "esbuild-plugin-copy": "^2.1.1",
  "esbuild-plugin-eslint": "0.3.6", // 버전 고정
  "eslint": "^8.39.0",
  "glob": "^8.1.0",
  "rimraf": "^4.4.1",
  "ts-node": "^10.9.1",
  "typescript": "^5.0.4"
}
```

### 문제 발생 시 대체 방법

패키지 설치에 문제가 발생하면 다음 방법을 시도해보세요:

#### 방법 1: 의존성 직접 설치

```batch
:: 핵심 의존성만 먼저 설치
npm install esbuild@0.17.19 esbuild-plugin-eslint@0.3.6 --no-save

:: 그 후 나머지 패키지 설치
npm install --legacy-peer-deps
```

#### 방법 2: .npmrc 파일 수동 생성

프로젝트 루트에 `.npmrc` 파일을 생성하고 다음 내용을 추가:

```
registry=http://[내부망_넥서스_URL]/repository/npm-group/
strict-ssl=false
legacy-peer-deps=true
```

## 4. 환경 설정 파일 구성

### 내부망 환경 설정 (`config/environments/internal/env.config.js`)

내부망 환경에서 사용되는 기본 설정입니다:

```javascript
module.exports = {
  // 내부망 식별자
  INTERNAL_NETWORK: true,
  
  // SSL 인증서 검증 우회 설정
  FORCE_SSL_BYPASS: true,
  
  // API 엔드포인트 설정
  API_ENDPOINTS: {
    // NARRANS LLM API
    NARRANS_API: 'http://localhost:8001/v1/chat/completions',
    
    // Llama 4 LLM API
    LLAMA4_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
    
    // SWDP API
    SWDP_API: 'http://localhost:8002/api',
    
    // Nexus 패키지 저장소
    NEXUS_REPOSITORY: 'http://localhost:8081/repository/npm-group/'
  },
  
  // 모델 설정
  MODELS: {
    // 기본 모델 ID
    DEFAULT_MODEL: 'narrans',
    
    // 내부망 모델 구성
    AVAILABLE_MODELS: [
      {
        id: 'narrans',
        name: 'NARRANS (Default)',
        provider: 'custom',
        apiUrl: 'http://localhost:8001/v1/chat/completions',
        contextWindow: 10000,
        maxTokens: 10000,
        temperature: 0
      },
      {
        id: 'llama-4-maverick',
        name: 'Llama 4 Maverick',
        provider: 'custom',
        apiUrl: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
        contextWindow: 50000,
        maxTokens: 50000,
        temperature: 0
      }
    ]
  }
}
```

### 외부망 환경 설정 (`config/environments/external/env.config.js`)

외부망 환경에서 사용되는 기본 설정입니다:

```javascript
module.exports = {
  // 내부망 식별자 (false로 설정하면 외부망 모드로 동작)
  INTERNAL_NETWORK: false,
  
  // SSL 인증서 검증 우회 설정
  FORCE_SSL_BYPASS: false,
  
  // API 엔드포인트 설정
  API_ENDPOINTS: {
    // OpenRouter LLM API
    OPENROUTER_API: 'https://openrouter.ai/api/v1/chat/completions'
  },
  
  // API 키 설정
  API_KEYS: {
    // OpenRouter API 키
    OPENROUTER_API_KEY: '' // 여기에 실제 API 키 입력
  },
  
  // 모델 설정
  MODELS: {
    // 기본 모델 ID
    DEFAULT_MODEL: 'gemini-2.5-flash',
    
    // 외부망 모델 구성 (OpenRouter 기반)
    AVAILABLE_MODELS: [
      {
        id: 'gemini-2.5-flash',
        name: 'Google Gemini 2.5 Flash',
        provider: 'openrouter',
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'google/gemini-2.5-flash-preview',
        contextWindow: 32000,
        maxTokens: 8192,
        temperature: 0.7
      }
      // 기타 모델...
    ]
  }
}
```

### 사용자 환경 설정 (`extension.env.js`)

프로젝트 루트에 `extension.env.js` 파일을 생성하여 개인화된 설정을 추가할 수 있습니다:

```javascript
// 내부망 환경 예시
module.exports = {
  // 내부망 모드 활성화
  INTERNAL_NETWORK: true,
  
  // SSL 우회 활성화
  FORCE_SSL_BYPASS: true,
  
  // 내부망 API 엔드포인트
  NARRANS_API_ENDPOINT: 'http://your-internal-server:8001/v1/chat/completions',
  LLAMA4_API_ENDPOINT: 'http://your-llama-server:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
  
  // 넥서스 저장소 URL
  NEXUS_URL: 'http://your-nexus-server:8081/repository/npm-group/'
};

// 외부망 환경 예시
module.exports = {
  // 외부망 모드
  INTERNAL_NETWORK: false,
  
  // OpenRouter API 키
  OPENROUTER_API_KEY: 'your-openrouter-api-key',
  
  // 개발 모드 설정
  DEV_MODE: true,
  LOG_LEVEL: 'debug'
};
```

## 5. 환경 자동 감지 로직

시스템은 다음 순서로 환경을 감지합니다:

1. 명시적 환경 변수 확인 (`process.env.APE_INTERNAL_NETWORK`)
2. 사용자 설정 파일 확인 (`extension.env.js`의 `INTERNAL_NETWORK` 속성)
3. OS 타입 확인 (Windows는 내부망 가능성 높음)
4. 기본값으로 외부망 반환

## 6. 코드에서 환경 설정 사용하기

코드에서 환경 설정을 사용하는 방법:

```javascript
// 환경 로더 가져오기
const envLoader = require('./config/env.loader');

// 특정 설정 가져오기
const isInternalNetwork = envLoader.get('INTERNAL_NETWORK', false);
const nexusUrl = envLoader.get('NEXUS.URL');
const narransApi = envLoader.get('API_ENDPOINTS.NARRANS_API');

// 환경 타입 가져오기
const envType = envLoader.getEnvironmentType(); // 'internal' 또는 'external'

// 모델 구성 관리자 가져오기
const modelConfigManager = require('./config/model.config');

// 사용 가능한 모델 목록 가져오기
const models = modelConfigManager.getAvailableModels();

// 기본 모델 ID 가져오기
const defaultModelId = modelConfigManager.getDefaultModelId();
```

## 7. 기타 유의사항

- **설정 파일 관리**: `extension.env.js` 및 `.npmrc` 파일은 git에 커밋하지 않도록 .gitignore에 추가되어 있습니다.
- **로그 파일**: 내부망 환경에서는 로그 파일이 `logs/` 디렉토리에 생성됩니다.
- **API 키 관리**: API 키는 `extension.env.js` 파일에 설정하여 중앙 관리하세요.
- **환경 전환**: 내/외부망 간 전환 시 `node scripts/setup-environment.js`를 재실행하여 환경을 재구성하세요.