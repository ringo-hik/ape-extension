# APE 익스텐션 내부망 설치 가이드

이 문서는 APE 익스텐션을 Windows 내부망 환경에서 설치하기 위한 가이드입니다.

## 1. 패키지 의존성 문제 해결

내부망 환경에서 `npm install` 실행 시 패키지 의존성 충돌 문제가 발생할 수 있습니다. 이는 다음과 같은 이유로 발생합니다:

1. 내부망 넥서스 저장소에 일부 최신 패키지가 없음
2. 패키지 간 버전 충돌 (esbuild와 esbuild-plugin-eslint 등)

### 수정된 package.json 내용

아래와 같이 package.json의 devDependencies를 수정했습니다:

```json
"devDependencies": {
  "@types/glob": "^8.1.0",
  "@types/node": "16.x",
  "@types/vscode": "^1.85.0",
  "@typescript-eslint/eslint-plugin": "^5.59.1",
  "@typescript-eslint/parser": "^5.59.1",
  "@vscode/test-electron": "^2.3.0",
  "esbuild": "0.17.19",            // 버전 고정 (원래: ^0.20.0)
  "esbuild-node-externals": "^1.8.0", // 버전 다운그레이드 (원래: ^1.11.0)
  "esbuild-plugin-copy": "^2.1.1",
  "esbuild-plugin-eslint": "0.3.6", // 버전 고정 및 다운그레이드 (원래: ^0.3.12)
  "eslint": "^8.39.0",
  "glob": "^8.1.0",
  "rimraf": "^4.4.1",              // 버전 다운그레이드 (원래: ^5.0.5)
  "ts-node": "^10.9.1",            // 버전 다운그레이드 (원래: ^10.9.2)
  "typescript": "^5.0.4"
}
```

## 2. Windows 내부망 설치 방법

### 방법 1: 배치 스크립트 사용 (권장)

프로젝트 루트에 있는 `internal-install.bat` 파일을 실행하세요:

```
internal-install.bat
```

이 스크립트는 다음 작업을 수행합니다:
- 패키지 설치 (`--legacy-peer-deps` 플래그 사용)
- 설치 실패 시 내부망 넥서스 저장소를 통해 재시도
- 프로젝트 빌드
- VSCode에 개발 버전 설치 (선택 사항)

### 방법 2: 수동 설치

내부망 환경에서 다음 명령어를 사용하여 수동으로 설치를 진행하세요:

```batch
:: 기본 설치
npm install --legacy-peer-deps

:: 또는 내부망 넥서스 저장소 사용
npm install --registry=http://[내부망_넥서스_URL]/repository/npm-group/ --no-strict-ssl --legacy-peer-deps

:: 빌드 실행
npm run build
```

## 3. 문제 발생 시 대체 방법

만약 여전히 문제가 발생한다면 다음 방법을 시도해보세요:

### 방법 1: 의존성 직접 설치

```batch
:: 핵심 의존성만 먼저 설치
npm install esbuild@0.17.19 esbuild-plugin-eslint@0.3.6 --no-save

:: 그 후 나머지 패키지 설치
npm install --legacy-peer-deps
```

### 방법 2: .npmrc 파일 사용

프로젝트 루트에 `.npmrc` 파일을 생성하고 다음 내용을 추가:

```
registry=http://[내부망_넥서스_URL]/repository/npm-group/
strict-ssl=false
legacy-peer-deps=true
```

## 4. API URL 설정

내부망 환경에서 API URL을 올바르게 설정하려면 `extension.env.js` 파일에서 다음과 같이 수정하세요:

```javascript
module.exports = {
  // 내부망 설정
  INTERNAL_NETWORK: 'true',
  
  // 내부망 API 엔드포인트 (로컬 주소 사용)
  INTERNAL_API_ENDPOINT: 'http://localhost:8001/v1/chat/completions',
  // 또는 IP 주소 사용
  // INTERNAL_API_ENDPOINT: 'http://192.168.1.100:8001/v1/chat/completions',
  
  // Llama API 엔드포인트 (로컬 주소 사용)
  LLAMA4_API_ENDPOINT: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
  
  // SSL 우회 활성화
  FORCE_SSL_BYPASS: 'true',
}
```

## 5. 백업 파일

원본 package.json의 백업은 `package.json.backup`으로 저장되어 있습니다.