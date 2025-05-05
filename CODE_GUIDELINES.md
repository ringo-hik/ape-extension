# APE Extension 코드 정리 지침

## 개요

이 문서는 APE Extension(VSCode 확장 프로그램) 코드베이스의 정리 및 개선 지침을 제공합니다. 모든 개발자는 이 지침을 따라 코드 일관성과 유지보수성을 향상시켜야 합니다.

## 보안 강화

### 1. API 키 관리

- package.json에 하드코딩된 OpenRouter API 키 제거
- 환경 변수 또는 VS Code 보안 저장소 활용
- 기본값은 템플릿 형태로 제공 (`YOUR_API_KEY_HERE`)

### 2. 내부망/외부망 설정 분리

- 내부망과 외부망 API URL 하드코딩 제거
- 환경 설정 기반으로 분리하여 관리
- 사용자 설정을 통해 쉽게 전환 가능하도록 구성

## 불필요한 코드 제거

### 1. 중복 코드 정리

- 유사한 기능을 하는 중복 유틸리티 함수 통합
- 일관된 에러 처리 및 로깅 메커니즘 적용

### 2. 미사용 코드 제거

- 주석 처리된 미사용 코드 삭제
- 불필요한 콘솔 로그 제거
- 개발용 디버깅 코드 정리

## 코드 구조 개선

### 1. 모듈화 강화

- **commands 모듈**: VSCode 명령어 구현
- **views 모듈**: 웹뷰 UI 컴포넌트
- **services 모듈**: 핵심 비즈니스 로직 구현
- **plugins 모듈**: 플러그인 시스템 구현
- **api 모듈**: ape-core와의 통신 관리

### 2. 의존성 관리

- 서비스 중심 아키텍처 적용
- 이벤트 기반 통신으로 모듈 간 결합도 낮추기
- API 클라이언트 추상화로 백엔드 의존성 격리

### 3. 설계 패턴 적용

- **서비스 로케이터**: VSCode 확장 내 서비스 관리
- **커맨드 패턴**: 다양한 명령어 구현
- **옵저버 패턴**: UI 상태 변화 감지
- **플러그인 패턴**: 확장 기능 구현

## 코드 스타일 통일

### 1. TypeScript 스타일 가이드

```typescript
// 인터페이스: 접두사 I 사용
interface IUserProfile {
  name: string;
  email: string;
}

// 타입: PascalCase
type CommandHandler = (args: any) => Promise<void>;

// 상수: UPPER_CASE
const MAX_RETRY_COUNT = 3;

// 변수 및 함수: camelCase
const userMessage = "Hello";
function processRequest(requestData: any): void {
  // 구현
}
```

### 2. 주석 및 문서화

- 모든 클래스, 인터페이스, 함수에 JSDoc 형식 주석 추가
- 복잡한 로직에 인라인 주석 추가
- 코드 블록 시작에 목적 설명 주석 추가

### 3. 들여쓰기 및 형식

- 2칸 공백 들여쓰기 사용
- 최대 줄 길이 100자 제한
- 함수 간 1줄 공백, 클래스 간 2줄 공백

## 에러 처리 표준화

### 1. 일관된 예외 처리

```typescript
try {
  // 작업 수행
} catch (error) {
  console.error(`작업 실패: ${error.message}`);
  vscode.window.showErrorMessage(`작업을 완료할 수 없습니다: ${error.message}`);
}
```

### 2. 사용자 정의 에러 클래스

```typescript
class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## 테스트 가이드라인

### 1. 단위 테스트

- Jest 기반 단위 테스트 작성
- 각 유틸리티 함수 및 서비스 클래스에 대한 테스트 케이스 작성
- 모의 객체(mock)를 활용한 의존성 격리

### 2. 통합 테스트

- VS Code Extension Testing API 활용
- 실제 VS Code 환경에서의 기능 테스트

## 의존성 관리

### 1. 패키지 정리

- 불필요한 개발 의존성 제거
- 런타임 의존성 명시적 추가
- Node.js 버전 업데이트 (16.x → 18+)

### 2. 패키지 매니저 설정

```json
{
  "packageManager": "npm@8.19.2"
}
```

## 성능 최적화

### 1. 리소스 사용 개선

- VS Code WebView API 효율적 사용
- 대용량 데이터 처리 시 청크 단위 처리
- 불필요한 상태 업데이트 최소화

### 2. 비동기 처리

- Promise 기반 비동기 패턴 일관되게 적용
- async/await 활용한 가독성 높은 코드 작성

## 플러그인 시스템 개선

### 1. 표준 인터페이스 정의

- 명확한 플러그인 API 인터페이스 정의
- 버전 관리 가능한 인터페이스 설계

### 2. 동적 로딩 지원

- 실행 시간에 플러그인 로딩 지원
- 핫 리로딩 및 업데이트 메커니즘 구현

## 개선 작업 우선순위

1. 민감 정보 및 하드코딩된 API 키 제거 - ts,js에서 제거하고 settings. package.에는 그대로 유지
2. package.json 의존성 정리 및 업데이트
3. 불필요한 코드 및 중복 코드 제거
4. 모듈 구조 개선 및 일관성 확보
5. 에러 처리 및 로깅 표준화
6. 테스트 코드 추가
