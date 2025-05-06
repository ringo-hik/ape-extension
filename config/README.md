# APE Extension 설정 구조

이 디렉토리는 APE Extension의 설정 파일을 관리합니다. 내부망/외부망 환경에 따라 적절한 설정이 로드됩니다.

## 설정 파일 구조

### 기본 설정 파일
- `internal.config.js`: 내부망 환경에서 사용되는 기본 설정
- `external.config.js`: 외부망 환경에서 사용되는 기본 설정
- `env.loader.js`: 환경 설정을 로드하는 유틸리티 (환경 감지 및 설정 로드 로직)
- `env.example.js`: 환경 설정 예제 파일 (사용자 정의 설정 파일 생성용)

### VS Code 설정 파일
- `internal.settings.json`: 내부망 환경용 VS Code 설정
- `external.settings.json`: 외부망 환경용 VS Code 설정
- `internal/settings.json`: 내부망 전용 설정 (레거시 호환용)
- `external/settings.json`: 외부망 전용 설정 (레거시 호환용)

## 설정 파일 우선순위

1. **사용자 정의 설정** (루트 디렉토리에 위치)
   - `extension.env.js`: 모든 환경에 적용되는 최우선 설정
   - `extension.env.internal.js`: 내부망 환경 전용 설정
   - `extension.env.external.js`: 외부망 환경 전용 설정

2. **기본 환경 설정** (이 디렉토리에 위치)
   - `internal.config.js`: 내부망 환경 기본 설정
   - `external.config.js`: 외부망 환경 기본 설정

3. **VS Code 설정**
   - `internal.settings.json`: 내부망 환경 VS Code 설정
   - `external.settings.json`: 외부망 환경 VS Code 설정

## 환경 감지 로직

환경 감지는 다음 로직으로 수행됩니다:

1. 명시적 환경 변수 확인 (`APE_INTERNAL_NETWORK`)
2. 사용자 설정 파일에서 `INTERNAL_NETWORK` 설정 확인
3. Windows 환경 여부 확인 (Windows는 내부망 가능성 높음)
4. hosts 파일에 내부망 도메인 존재 여부 확인
5. 내부망 서비스 접근 가능 여부 확인
6. 기본값: Windows는 내부망, 나머지는 외부망으로 간주

## 레거시 디렉토리

다음 디렉토리는 레거시 호환성을 위해 유지되고 있습니다:

- `internal/`: 내부망 전용 설정 (레거시)
- `external/`: 외부망 전용 설정 (레거시)

이러한 디렉토리는 점진적으로 제거될 예정이며, 최신 설정 파일 구조를 사용하는 것이 권장됩니다.

## 사용자 설정 파일 생성

1. `env.example.js` 파일을 복사하여 루트 디렉토리에 `extension.env.js` 파일 생성
2. 필요에 따라 내부망/외부망 전용 설정 파일 생성:
   - `extension.env.internal.js`: 내부망 환경 전용
   - `extension.env.external.js`: 외부망 환경 전용

## 환경 설정 활용

코드에서 환경 설정을 활용하는 방법:

```javascript
// 환경 설정 로더 가져오기
const envLoader = require('./config/env.loader');

// 설정 값 가져오기
const apiUrl = envLoader.getApiUrl('NARRANS_API');
const apiKey = envLoader.getApiKey('OPENROUTER_API_KEY');
const isInternalNetwork = envLoader.get('INTERNAL_NETWORK');
const defaultModelId = envLoader.getDefaultModelId();
const allModels = envLoader.getAvailableModels();
```