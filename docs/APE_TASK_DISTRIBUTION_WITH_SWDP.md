# APE 확장 프로그램 작업 분류 문서 (SWDP 통합 중심)

이 문서는 APE(Agentic Pipeline Engine) 확장 프로그램의 개발 작업을 두 명의 작업자가 독립적으로 진행할 수 있도록 작업을 분류한 내용입니다. 특히 SWDP(Software Development Portal) 통합에 중점을 두고 있습니다.

## 핵심 개념 및 구조

### SWDP 통합 중요성
APE의 핵심 기능은 SWDP Agent를 통한 DevOps 포털 정보 접근 및 활용입니다. SWDP는 프로젝트의 근간이 되는 DevOps 포털로, 프로젝트, 사용자, 작업, 문서 등의 모든 정보를 포함하고 있으며, Git과 Jira 관련 메타정보도 SWDP에서 취득할 수 있습니다.

### 시스템 아키텍처
- **APE 확장 프로그램**: VS Code 내에서 동작하는 UI 및 클라이언트 로직
- **APE Core**: Python 기반 LLM Agent로 구현된 서버 (localhost:8001)
- **SWDP Agent**: APE Core 내에 구현되어 SWDP 데이터에 접근하는 에이전트

### 데이터 흐름
1. APE 확장 프로그램에서 사용자 요청 수신
2. 로컬 저장소(.git)에서 사용자 및 저장소 정보 로드
3. APE Core의 SWDP Agent에 요청 전달
4. SWDP Agent가 포털 정보 접근 및 처리
5. 결과 데이터를 APE 확장 프로그램으로 반환

## 작업자 1: UI 및 SWDP 클라이언트 기능 중심

### 1. SWDP 클라이언트 구현 (최우선)
- **관련 파일**:
  - 새로 생성: `src/plugins/internal/swdp/SwdpClientService.ts`
  - 새로 생성: `src/plugins/internal/swdp/SwdpPluginService.ts`
- **작업 내용**:
  - APE Core의 SWDP Agent(localhost:8001)와 통신하기 위한 클라이언트 구현
  - Git 저장소 정보 자동 로드 및 사용자 ID 관리 기능 구현
  - SWDP 명령어 시스템 구현 (@swdp:로 시작하는 명령어)
  - 인증 및 세션 관리 기능 구현
  - 오류 처리 및 재시도 로직 구현
- **예상 소요 시간**: 4-5일
- **우선순위**: 최상 (프로젝트 핵심 기능)

### 2. SWDP UI 구성요소 구현
- **관련 파일**:
  - 새로 생성: `resources/js/swdp-components.js`
  - 새로 생성: `resources/css/swdp-components.css`
  - 수정: `resources/js/hybrid-ape-ui.js`
- **작업 내용**:
  - SWDP 프로젝트 대시보드 UI 구현
  - 작업 목록 및 세부 정보 표시 패널 구현
  - 문서 목록 및 세부 정보 표시 패널 구현
  - 사용자 정보 및 권한 관리 UI 구현
  - 프로젝트 진행 상황 시각화 구현
- **예상 소요 시간**: 3-4일
- **우선순위**: 높음

### 3. 파일 탐색기 및 Git 통합 개선
- **파일 위치**: 
  - `src/ui/ApeFileExplorerProvider.ts`
  - `src/plugins/internal/git/GitClientService.ts`
- **작업 내용**:
  - 파일 드래그 앤 드롭 기능 구현
  - 파일 필터링 및 검색 기능 구현
  - 파일 상태 캐싱 구현 (파일 시스템 접근 최소화)
  - Git 상태 표시 통합 (SWDP 작업 연결 표시)
  - Git 커밋 시 SWDP 작업 연결 기능 구현
- **예상 소요 시간**: 2-3일
- **우선순위**: 중간-높음

### 4. 하이브리드 UI 기능 강화
- **관련 파일**:
  - `resources/js/hybrid-ape-ui.js`
  - `resources/css/hybrid-ui.css`
  - `src/ui/ApeHybridChatViewProvider.ts`
- **작업 내용**:
  - SWDP 컨텍스트 패널 구현 (현재 작업 중인 프로젝트 정보 표시)
  - SWDP 작업 상태에 따른 제안 바 구현
  - 도메인 도구바에 SWDP 섹션 추가
  - SWDP 명령어 자동완성 기능 구현
- **예상 소요 시간**: 2-3일
- **우선순위**: 중간

## 작업자 2: 백엔드 및 SWDP 통합 기능 중심

### 1. Mock 서버 및 테스트 환경 구현 (최우선)
- **관련 파일**:
  - 새로 생성: `tests/mocks/MockServerSetup.ts`
  - 새로 생성: `tests/mocks/services/GitMockService.ts`
  - 새로 생성: `tests/mocks/services/JiraMockService.ts`
  - 새로 생성: `tests/mocks/services/PocketMockService.ts`
  - 새로 생성: `tests/mocks/services/SwdpMockService.ts`
- **작업 내용**:
  - 모든 내부망 서비스(Git, Jira, Pocket, SWDP)를 위한 Mock 서버 구현
  - APE Core API를 모방하는 localhost:8001 서버 구현
  - 제공된 SWDP 스키마 기반 가짜 데이터 생성
  - 네트워크 지연 및 오류 시뮬레이션 기능 구현
  - 환경 전환 메커니즘 구현 (내부망 이전 시 설정만 변경하면 작동하도록)
  - 요청/응답 로깅 및 분석 도구 구현
- **예상 소요 시간**: 4-5일
- **우선순위**: 최상 (다른 모든 개발의 기반)

### 2. 사용자 인증 및 설정 관리 시스템 구현
- **관련 파일**:
  - 새로 생성: `src/core/auth/UserAuthService.ts`
  - 수정: `src/core/config/ConfigService.ts`
- **작업 내용**:
  - Git 저장소에서 사용자 정보 자동 추출 기능 구현
  - 사용자 ID, 이메일 등 인증 정보 관리
  - SWDP 인증 정보 저장 및 관리
  - 사용자 환경설정 저장 및 로드 기능 개선
  - 설정 변경 이벤트 시스템 구현
  - Mock 환경과 실제 환경 간 전환 메커니즘 구현
- **예상 소요 시간**: 3일
- **우선순위**: 높음

### 3. SWDP 도메인 서비스 구현
- **관련 파일**:
  - 새로 생성: `src/core/domain/SwdpDomainService.ts`
  - 새로 생성: `src/plugins/internal/swdp/SwdpNaturalLanguageService.ts`
- **작업 내용**:
  - SWDP 데이터 모델 정의 (프로젝트, 작업, 문서, 사용자 등)
  - SWDP Agent와의 통신 프로토콜 구현
  - SWDP 작업 상태 변경 이벤트 시스템 구현
  - 자연어 명령어를 SWDP 작업으로 변환하는 서비스 구현
  - SWDP 데이터 캐싱 및 동기화 메커니즘 구현
- **예상 소요 시간**: 4-5일
- **우선순위**: 최상

### 4. SWDP 작업 흐름 통합
- **관련 파일**:
  - 새로 생성: `src/core/workflow/SwdpWorkflowService.ts`
  - 수정: `src/plugins/internal/git/GitPluginService.ts`
  - 수정: `src/plugins/internal/jira/JiraPluginService.ts`
- **작업 내용**:
  - Git 커밋과 SWDP 작업 연결 로직 구현
  - Jira 이슈와 SWDP 작업 연결 로직 구현
  - 작업 상태 변경에 따른 자동화 워크플로우 구현
  - 작업 진행 상황 추적 및 보고 기능 구현
  - 작업 히스토리 및 로그 기능 구현
- **예상 소요 시간**: 3-4일
- **우선순위**: 중간-높음

### 5. 문서 및 지식 통합 서비스
- **관련 파일**:
  - 수정: `src/ui/ApeTreeDataProvider.ts` (356줄 TODO)
  - 새로 생성: `src/services/DocumentService.ts`
- **작업 내용**:
  - SWDP 문서 시스템과 APE 지식 저장소 통합
  - 문서 버전 관리 및 동기화 기능 구현
  - 문서 검색 및 태그 시스템 구현
  - 문서 편집 및 승인 워크플로우 구현
  - 문서 템플릿 시스템 구현
- **예상 소요 시간**: 3일
- **우선순위**: 중간

## SWDP 명령어 시스템 설계

SWDP 관련 명령어는 `@swdp:` 접두사로 시작하며, 다음과 같은 주요 명령어를 포함합니다:

### 프로젝트 관련
- `@swdp:projects` - 프로젝트 목록 조회
- `@swdp:project <project_code>` - 특정 프로젝트 세부 정보 조회
- `@swdp:set-project <project_code>` - 현재 작업 프로젝트 설정

### 작업 관련
- `@swdp:tasks` - 현재 프로젝트의 작업 목록 조회
- `@swdp:task <task_id>` - 특정 작업 세부 정보 조회
- `@swdp:create-task <title>` - 새 작업 생성
- `@swdp:update-task <task_id> <status>` - 작업 상태 업데이트

### 빌드 및 배포 관련
- `@swdp:build` - 현재 프로젝트 빌드 실행
- `@swdp:build-status` - 빌드 상태 확인
- `@swdp:deploy <environment>` - 특정 환경에 배포
- `@swdp:deployment-history` - 배포 이력 조회

### 문서 관련
- `@swdp:documents` - 문서 목록 조회
- `@swdp:document <doc_id>` - 특정 문서 조회
- `@swdp:create-document <title> <type>` - 새 문서 생성

## 사용자 인증 및 설정 시스템

### .git에서 사용자 정보 추출
1. 앱 시작 시 `.git/config` 파일에서 사용자 정보 추출
2. `user.name` 및 `user.email` 값을 기본 사용자 정보로 설정
3. 추출된 정보를 `ConfigService`에 저장

### 사용자 정보 검증 흐름
1. SWDP 명령 요청 시 사용자 정보 존재 여부 확인
2. 정보가 없을 경우 사용자에게 입력 요청 (userId 입력 필수)
3. 입력된 정보를 `.git/config`에 저장하고 세션에 적용

### 구현 요구사항
- 사용자 정보가 없을 때 명확한 오류 메시지 표시
- 간편한 사용자 정보 설정 UI 제공
- 설정된 사용자 정보 자동 기억 및 재사용

## 통합 테스트 계획

### 1단계: 컴포넌트별 단위 테스트
- SWDP 클라이언트 API 테스트
- 사용자 인증 및 설정 기능 테스트
- UI 컴포넌트 렌더링 테스트

### 2단계: 통합 테스트
- Git, Jira, SWDP 연동 테스트
- 명령어 실행 및 응답 처리 테스트
- 오류 처리 및 복구 메커니즘 테스트

### 3단계: 엔드-투-엔드 테스트
- 실제 사용자 시나리오 기반 테스트
- 성능 및 부하 테스트
- 보안 및 인증 테스트

## 작업 진행 시 고려사항

### 작업자 간 협업 필요 지점

1. **API 및 데이터 모델 설계**
   - SWDP 데이터 모델 및 인터페이스 정의
   - API 규격 및 반환 데이터 형식 사전 합의
   - 오류 코드 및 처리 방식 합의

2. **사용자 인증 및 설정 공유**
   - 사용자 인증 정보 관리 방식 합의
   - 설정 저장 및 로드 메커니즘 공유
   - 인증 상태 관리 방식 합의

3. **UI 및 비즈니스 로직 연동**
   - UI 이벤트와 비즈니스 로직 연결 방식 합의
   - 데이터 표시 포맷 및 필터링 방식 합의
   - 오류 메시지 및 사용자 안내 문구 표준화

### 독립적으로 진행할 수 있는 방법

1. **명확한 인터페이스 정의**
   - 각 컴포넌트의 공개 API 및 이벤트 명세 사전 합의
   - 인터페이스 변경 시 즉시 공유 및 논의
   - 목업 데이터 및 테스트 환경 공유

2. **모듈화 및 의존성 분리**
   - UI와 비즈니스 로직 철저히 분리
   - 명확한 책임 경계 설정
   - 최소한의 의존성만 가진 독립 모듈 설계

3. **중간 통합 테스트**
   - 작업 진행 중 주기적인 통합 테스트 진행
   - 통합 이슈 조기 발견 및 해결
   - 문제 발생 시 신속한 피드백 공유

## 개발 환경 설정

1. **Mock 서버 구현 및 테스트 환경 설정**
   - 내부망 데이터 서비스(Git, Jira, Pocket, SWDP)를 위한 Mock 서버 구현
   - localhost:8001에서 동작하는 APE Core API 모방 서버 구축
   - SWDP 스키마(~/ape/ape-core/src/schema/swdp-db.json) 기반 가짜 데이터 생성
   - Mock 데이터는 실제 형식과 동일하게 구성하여 실제 환경에서 주소만 변경하면 작동하도록 구현
   - 요청 및 응답 로깅 기능 추가하여 디버깅 용이성 확보
   - 네트워크 지연 및 오류 시뮬레이션 기능 구현(실제 내부망 환경 테스트 위함)

2. **서비스별 Mock 데이터 구현**
   - **Git Mock 데이터**: 저장소 정보, 브랜치, 커밋 내역, 파일 변경 등 Mock 데이터 구현
   - **Jira Mock 데이터**: 프로젝트, 이슈, 상태, 담당자 등 정보 Mock 데이터 구현
   - **Pocket Mock 데이터**: 문서, 파일 시스템 등 Mock 데이터 구현
   - **SWDP Mock 데이터**: 프로젝트, 사용자, 작업, 문서 등 제공된 스키마 기반 Mock 데이터 구현
   - 모든 Mock 데이터는 스키마 검증 후 사용하여 실제 데이터 형식 일치 보장

3. **환경 전환 메커니즘 구현**
   - 개발/테스트/프로덕션 환경 설정 분리
   - 설정 파일에서 URL만 변경하여 내부망 환경으로 손쉽게 전환 가능하도록 구현
   - 환경별 설정 파일 구성 (.env.development, .env.test, .env.production)
   - 내부망 전환 시 별도 코드 수정 없이 설정만으로 전환 가능하도록 구성

4. **로컬 저장소 설정**
   - Git 정보 접근 권한 확인
   - 사용자 정보 추출 및 관리 메커니즘 테스트
   - `.git/config` 파일 조작 테스트
   - Git 정보가 없는 환경에서도 테스트 가능하도록 Mock 설정 구현

5. **개발 브랜치 전략**
   - feature/mock-services - 모든 내부망 서비스를 위한 Mock 서버 구현
   - feature/swdp-client - SWDP 클라이언트 기능 개발
   - feature/swdp-ui - SWDP UI 구성요소 개발
   - feature/swdp-domain - SWDP 도메인 서비스 개발
   - feature/user-auth - 사용자 인증 및 설정 개발

## 우선순위 및 개발 로드맵

### 1주차
- **작업자 1**:
  - SWDP 클라이언트 구현 기본 뼈대 완성
  - SWDP UI 기본 컴포넌트 구현
  - Mock 환경과 통합 테스트 시작
  
- **작업자 2**:
  - Mock 서버 및 테스트 환경 구현 (최우선 작업)
  - 가짜 데이터 세트 구축 (Git, Jira, Pocket, SWDP)
  - 사용자 인증 및 설정 시스템 기본 구조 구현

### 2주차
- **작업자 1**:
  - SWDP 명령어 시스템 완성
  - 파일 탐색기 및 Git 통합 개선
  - SWDP UI 컴포넌트 완성
  - 환경 전환 테스트 (Mock에서 실제 환경으로)

- **작업자 2**:
  - 사용자 인증 시스템 완성
  - SWDP 도메인 서비스 구현
  - SWDP 작업 흐름 통합 구현
  - 문서 및 지식 통합 서비스 구현
  - 최종 통합 테스트 및 환경 전환 검증

## 결론

이 작업 분류는 SWDP 통합에 중점을 둔 APE 확장 프로그램의 핵심 기능 개발을 위한 가이드라인입니다. SWDP Agent를 통한 DevOps 포털 정보 접근 및 활용이 이 프로젝트의 핵심이며, 사용자 경험을 향상시킬 수 있는 UI/UX 개선과 함께 진행됩니다.

### 중요 구현 포인트

1. **Mock 환경 우선 구현**: 
   - 내부망 서비스(Git, Jira, Pocket, SWDP)를 위한 Mock 서버를 먼저 구현
   - 외부 환경에서 기능 개발 및 테스트 완료 후 내부망으로 이전 가능하도록 설계
   - 설정 변경만으로 Mock 환경과 실제 환경 간 전환 가능하도록 구현

2. **환경 전환 메커니즘**:
   - 내부망으로 코드 이전 시 주소만 변경하면 모든 기능이 동작하도록 설계
   - 코드 수정 없이 환경 변수나 설정 파일만으로 전환 가능하도록 구현
   - 실제 서비스 URL과 Mock 서비스 URL을 쉽게 전환할 수 있는 메커니즘 제공

3. **사용자 인증 데이터 관리**:
   - .git에서 사용자 정보 자동 로드 및 관리
   - 사용자 정보가 없는 경우 적절한 안내 메시지와 입력 UI 제공
   - 내부망 환경에서의 인증 메커니즘 사전 고려

두 작업자 간의 원활한 소통과 명확한 인터페이스 정의가 이 작업의 성공을 위해 가장 중요한 요소이며, 정기적인 동기화 미팅을 통해 진행 상황을 공유하고 문제점을 해결해 나가야 합니다. 내부망 이전 시 추가 수정 없이 바로 동작할 수 있도록 철저한 테스트와 환경 설정을 선행하는 것이 중요합니다.