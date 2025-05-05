# APE (Agentic Pipeline Engine) 버전 변경 내역

## v0.0.1 (현재)

### 2025-05-06
- 프로젝트 리브랜딩: Ape에서 APE(Agentic Pipeline Engine)로 변경
- 설정 네임스페이스 마이그레이션: 'ape.*'에서 'ape.*'로 변경
- 설정 마이그레이션 자동화 도구 추가
- UI 텍스트, 아이콘 및 로고 업데이트
- 파일 및 클래스 이름 점진적 변경 시작 (ApeChatViewProvider)

### 2025-05-05
- 코드 구조 개선: ConfigLoaderService와 ConfigValidatorService를 통합 ConfigService로 통합
- 명령 시스템과 설정 관리 시스템 간 의존성 개선
- 코드 중복 제거 및 관리 용이성 향상

### 2025-05-04
- 코드베이스 정리 및 리팩토링
- dist/ 폴더 정리 및 gitignore에 추가
- 중복된 문서 파일 제거
- extension.ts에서 레거시 파일 참조(chat-test.html) 수정
- HISTORY.md 및 README.md 재작성

### 2023-05-03
- 명령어 시스템 연결 및 디버그 명령어 개선
- 사이드바 UI 연결 및 디버그 명령어 추가

### 2023-05-02
- 웹뷰 로딩 및 모델 선택기 UI 안정성 개선
- 웹뷰 로딩 디버깅 코드 추가 및 모델 선택기 로깅 개선

### 2023-05-01
- 초기 프로젝트 설정 및 권한 부여