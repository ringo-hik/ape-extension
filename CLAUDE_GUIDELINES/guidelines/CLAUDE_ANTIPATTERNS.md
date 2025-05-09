# Claude 개발 안티패턴 목록

이 문서는 APE 익스텐션 개발 시 피해야 할 안티패턴과 금지된 개발 관행을 정의합니다. 이 안티패턴 목록은 코드 품질을 보장하고 프로젝트의 일관성을 유지하기 위해 모든 개발자가 반드시 준수해야 합니다.

## 아키텍처 안티패턴

### 1. 브릿지 패턴 사용 금지
- **금지 사항**: 브릿지 패턴을 사용한 의존성 관리
- **대안**: 인터페이스 기반 구현 및 의존성 주입 패턴 사용
- **이유**: 브릿지 패턴은 코드 복잡성을 증가시키고, 테스트 가능성을 저하시킴

### 2. 순환 의존성 금지
- **금지 사항**: A가 B를 의존하고, B가 다시 A를 의존하는 순환 의존성 구조
- **대안**: 의존성 방향을 단방향으로 설계하고, 필요시 이벤트 기반 통신 사용
- **이유**: 순환 의존성은 코드 이해와 유지보수를 어렵게 만들고, 모듈 테스트를 복잡하게 함

### 3. 과도한 상속 계층 금지
- **금지 사항**: 3단계 이상의 깊은 상속 계층 구조
- **대안**: 컴포지션과 인터페이스 기반 설계 사용
- **이유**: 깊은 상속 계층은 이해하기 어렵고, 취약한 기반 클래스 문제를 발생시킴

## 코드 스타일 안티패턴

### 4. `any` 타입 남용 금지
- **금지 사항**: 명확한 타입을 지정할 수 있는 상황에서 `any` 타입 사용
- **대안**: 구체적인 타입, 인터페이스, 제네릭, 유니온 타입 활용
- **이유**: `any` 타입은 TypeScript의 타입 안전성을 무력화시키고 런타임 오류 위험을 증가시킴

### 5. 하드코딩된 문자열 금지
- **금지 사항**: 코드 전체에 반복되는 문자열 리터럴 하드코딩
- **대안**: 상수 사용, 설정 파일로 분리, 환경 변수 활용
- **이유**: 하드코딩된 문자열은 변경 시 여러 위치를 수정해야 하고 오류 가능성을 높임

### 6. 미사용 코드 보존 금지
- **금지 사항**: 주석 처리된 코드 블록, 사용되지 않는 함수와 변수 보존
- **대안**: 불필요한 코드는 완전히 삭제하고 필요시 버전 관리 시스템에서 복구
- **이유**: 미사용 코드는 코드베이스를 비대하게 만들고 혼란을 야기함

## 기술적 안티패턴

### 7. 콜백 지옥 금지
- **금지 사항**: 중첩된 콜백 함수 사용
- **대안**: Promise, async/await 패턴 사용
- **이유**: 중첩된 콜백은 코드 가독성을 저하시키고 오류 처리를 복잡하게 만듬

### 8. 내부망 환경변수 및 설정 수정 절대 금지 ⚠️
- **금지 사항**: 기존 내부망 환경변수 구조, 값, 헤더 설정, 모델 ID, 요청 파라미터 변경
- **대안**: 외부망 환경변수만 필요에 따라 수정하고, 내부망 설정은 절대 변경하지 않음
- **이유**: 내부망 설정은 안정적인 내부 시스템 연결에 필수적이며, 변경 시 심각한 오류 발생 가능
- **중요 참고**: 자세한 내용은 `/CLAUDE_WORKING_DOCS/status/INTERNAL_NETWORK_WARNING.md` 문서 필수 참조
- **경고**: 이 규칙을 위반하면 "척살" 대상이 됨 (극도로 심각한 위반으로 간주)

### 9. 전역 상태 의존성 금지
- **금지 사항**: 전역 변수, 싱글톤 패턴을 통한 상태 공유
- **대안**: 명시적 의존성 주입, 컨텍스트 객체 사용
- **이유**: 전역 상태는 코드 추론을 어렵게 만들고, 예측하지 못한 부작용을 발생시킴

### 10. 무거운 UI 스레드 작업 금지
- **금지 사항**: UI 스레드에서 장시간 실행되는 계산 작업 수행
- **대안**: 웹 워커, 비동기 프로세싱, 작업 분할
- **이유**: 무거운 UI 스레드 작업은 인터페이스를 응답 불가 상태로 만들어 사용성 저하

## 레거시 코드 관리 안티패턴

### 11. 레거시 코드 유지 금지
- **금지 사항**: 정식 배포 전 레거시 코드를 호환성을 위해 유지하는 행위
- **대안**: 레거시 코드 과감히 삭제, 새 구현으로 완전 대체
- **이유**: 정식 배포 전 단계에서는 하위 호환성보다 코드 품질이 우선, 두 가지 구현 유지는 복잡성 증가

### 12. 불완전한 마이그레이션 금지
- **금지 사항**: 부분적 마이그레이션 후 두 가지 패턴 혼용
- **대안**: 한 기능 단위로 완전한 마이그레이션 수행
- **이유**: 혼합된 패턴은 일관성 없는 코드를 만들고 디버깅을 어렵게 함

### 13. 중복 기능 구현 금지
- **금지 사항**: 동일한 기능에 대한 여러 구현체 유지
- **대안**: 단일 구현체로 통합, 추상화를 통한 확장
- **이유**: 중복된 기능은 유지보수 비용을 증가시키고 버그 발생 가능성을 높임

## UI 안티패턴

### 14. 영문 우선 UI 금지
- **금지 사항**: 사용자 인터페이스에 영문 텍스트 우선 사용
- **대안**: 모든 UI 요소는 한글 우선으로 표시, 필요시 영문 병기
- **이유**: 한글 우선 정책에 따라 사용자 경험의 일관성 유지

### 15. 일관성 없는 UI 요소 금지
- **금지 사항**: VS Code 디자인 가이드라인을 따르지 않는 커스텀 UI 요소
- **대안**: VS Code의 기본 UI 컴포넌트와 스타일 활용
- **이유**: 일관된 디자인 언어는 사용자 경험을 향상시키고 학습 곡선을 완화

### 16. 하드코딩된 색상값 금지
- **금지 사항**: CSS에 직접 색상값 하드코딩
- **대안**: VS Code 테마 변수 사용 (`var(--vscode-*)`)
- **이유**: 하드코딩된 색상은 테마 전환 시 문제를 발생시키고 접근성 저하

## 성능 안티패턴

### 17. 불필요한 DOM 조작 금지
- **금지 사항**: 빈번한 DOM 요소 직접 조작
- **대안**: 가상 DOM 접근 방식 사용, 일괄 업데이트
- **이유**: 과도한 DOM 조작은 성능을 저하시키고 jank 현상을 유발

### 18. 메모리 누수 패턴 금지
- **금지 사항**: 이벤트 리스너, 타이머, 구독 등 정리되지 않는 리소스
- **대안**: dispose 패턴 구현, 적절한 정리 함수 호출
- **이유**: 메모리 누수는 장시간 실행 시 성능 저하와 충돌을 유발

### 19. 과도한 API 호출 금지
- **금지 사항**: 불필요하게 반복되는 API 호출
- **대안**: 캐싱, 디바운싱, 스로틀링 기법 적용
- **이유**: 과도한 API 호출은 서버 부하와 클라이언트 성능 저하를 유발

## 보안 안티패턴

### 20. API 키 하드코딩 금지
- **금지 사항**: 소스 코드에 API 키 직접 포함
- **대안**: 환경 변수, 안전한 보안 저장소 사용
- **이유**: 하드코딩된 API 키는 보안 위험을 초래하고 키 교체를 어렵게 함

### 21. 입력 검증 생략 금지
- **금지 사항**: 사용자 또는 외부 입력 검증 없이 사용
- **대안**: 모든 입력에 대한 적절한 유효성 검사 구현
- **이유**: 검증되지 않은 입력은 보안 취약점 및 예기치 않은 동작을 유발

## 준수 가이드

이 안티패턴 목록은 다음과 같이 활용해야 합니다:

1. **적극적 참조**: 코드 작성 전과 코드 리뷰 과정에서 이 목록을 적극적으로 참조하세요.
2. **새로운 안티패턴 추가**: 프로젝트 중 발견된 문제적 패턴은 프로젝트 관리자에게 보고하여 이 목록에 추가될 수 있습니다.
3. **핵심 체크리스트와 함께 활용**: 이 안티패턴 목록은 핵심 체크리스트(`CLAUDE_CORE_CHECKLIST.md`)와 함께 사용해야 합니다.
4. **교육 자료로 활용**: 새로운 팀원들에게 이 목록을 교육 자료로 제공하세요.

**마지막 업데이트: 2023-05-06**