# "APE"에서 "Ape"로 변경 전략

이 문서는 APE 확장 프로그램을 Ape로 리브랜딩하기 위한 상세한 변경 전략을 설명합니다.

## 1. 클래스명 변경: ApeXXX → ApeXXX

### 변경 패턴
- `ApeCoreService` → `ApeCoreService`
- `ApeChatViewProvider` → `ApeChatViewProvider`
- 그 외 `APE` 접두사가 있는 모든 클래스 및 인터페이스명

### 영향 범위
- TypeScript 클래스 정의
- 클래스 생성자 및 상속 관계
- 클래스 참조 코드
- 임포트/익스포트 구문

### 변경 방법
1. 각 파일에서 클래스 정의 변경
2. 생성자 함수 이름 변경
3. 모든 참조 코드 업데이트
4. 파일명 변경 (예: `ApeCoreService.ts` → `ApeCoreService.ts`)

### 주의 사항
- 클래스명이 변경되면 관련 생성자와 상속 참조도 같이 변경해야 함
- 임포트 경로를 모두 확인하고 업데이트해야 함
- 타입스크립트 컴파일러를 통해 변경 후 타입 오류를 확인해야 함

## 2. 네임스페이스 변경: ape.* → ape.*

### 변경 패턴
- VS Code 명령어 ID: `ape.openSidebar` → `ape.openSidebar`
- 설정 키: `ape.core.sslBypass` → `ape.core.sslBypass`
- 네임스페이스: `ape.llm.models` → `ape.llm.models`

### 영향 범위
- package.json의 명령어 ID 및 설정 키
- TypeScript 코드 내 설정 참조
- 웹뷰에서 설정 참조

### 변경 방법
1. package.json의 명령어 ID와 설정 키 일괄 변경
2. TypeScript 코드의 설정 키 참조 업데이트 (예: `vscode.workspace.getConfiguration('ape.core')`)
3. 웹뷰 코드의 설정 참조 업데이트

### 주의 사항
- 사용자 설정이 유지되어야 함 (기존 사용자의 경우 마이그레이션 로직 필요)
- 확장 활성화 시 이전 설정 키 값을 새 설정 키로 마이그레이션하는 코드 추가 고려

## 3. 로깅 및 디버그 메시지 변경

### 변경 패턴
- 로그 메시지: `'APE 코어 서비스 초기화 시작'` → `'Ape 코어 서비스 초기화 시작'`
- 오류 메시지: `'ApeCoreService 초기화에 context가 필요합니다.'` → `'ApeCoreService 초기화에 context가 필요합니다.'`

### 영향 범위
- Logger 서비스 호출 코드
- 콘솔 로그 메시지
- 오류 메시지 및 예외 텍스트
- 사용자에게 표시되는 알림 메시지

### 변경 방법
1. TypeScript 코드의 문자열 리터럴 업데이트
2. 로깅 호출 메시지 업데이트
3. 오류 메시지 업데이트

### 주의 사항
- 오류 메시지는 디버깅 목적으로 사용되므로 모두 업데이트되어야 함
- 한글 메시지도 고려해서 변경해야 함 (예: '앞슴' 또는 '에이프'로 번역하여 일관성 유지)

## 4. UI 텍스트 변경: HTML, JS, CSS에서 'APE'이 포함된 모든 문자열

### 변경 패턴
- HTML 타이틀: `<title>APE 채팅</title>` → `<title>Ape 채팅</title>`
- UI 레이블: `APE 채팅` → `Ape 채팅`
- 웹뷰 설명: `"description": "APE"` → `"description": "Ape"`

### 영향 범위
- HTML 파일 (chat.html, command-buttons.html 등)
- JavaScript 파일의 문자열 리터럴
- CSS 주석 및 설명
- package.json의 displayName 및 설명

### 변경 방법
1. HTML 파일의 텍스트 및 타이틀 변경
2. JavaScript 파일의 문자열 리터럴 업데이트
3. package.json의 표시 이름 및 설명 업데이트

### 주의 사항
- 웹뷰는 런타임에 동적으로 생성되므로 모든 문자열 리터럴 확인 필요
- 다국어 지원이 있는 경우 모든 번역본도 업데이트해야 함

## 5. 내부 변수명 변경

### 변경 패턴
- 변수명: `apeConfig` → `apeConfig`
- 디버그 객체: `window.apeDebug` → `window.apeDebug`
- 고유 식별자: `APE_UUID` → `APE_UUID`

### 영향 범위
- TypeScript 코드의 변수 선언 및 참조
- JavaScript 코드의 변수 선언 및 참조
- 설정 관련 변수명

### 변경 방법
1. 코드 내 변수 선언부 변경
2. 변수 참조 모두 찾아 변경
3. 웹뷰 JavaScript의 변수 및 객체명 변경

### 주의 사항
- 변수명 변경 시 범위(scope)를 고려하여 모든 참조를 업데이트해야 함
- 클로저나 특별한 스코프 내 변수도 확인해야 함

## 6. DOM ID 및 클래스명 변경

### 변경 패턴
- CSS 클래스: `ape-container` → `ape-container`
- DOM ID: `apeChat` → `apeChat`
- CSS 파일명: `ape-ui.css` → `ape-ui.css`

### 영향 범위
- HTML 파일의 클래스 및 ID 속성
- CSS 선택자 및 스타일 정의
- JavaScript DOM 조작 코드 (getElementById, querySelector 등)
- CSS 파일 참조

### 변경 방법
1. HTML 파일의 클래스명 및 ID 변경
2. CSS 파일의 선택자 업데이트
3. JavaScript DOM 조작 코드 업데이트
4. 웹뷰 생성 코드의 클래스명 및 ID 업데이트

### 주의 사항
- CSS 선택자와 JavaScript DOM 조작이 연계되어 있으므로 두 가지를 함께 변경해야 함
- 동적으로 생성되는 요소의 클래스 및 ID도 고려해야 함

## 7. 기타 고려사항

### 패키지명 변경
- package.json의 "name" 필드: `"name": "ape"` → `"name": "ape"`
- 패키지 경로 및 참조 업데이트

### 아이콘 및 이미지 파일
- 리소스 파일명: `ape_logo.png` → `ape_logo.png`
- 아이콘 파일 경로 업데이트

### 활동 바 아이콘
- viewsContainers.activitybar의 icon 경로 업데이트

### 버전 관리
- 이름 변경과 함께 버전 업데이트 고려 (예: 0.0.1 → 0.1.0)

## 8. 위험 요소 및 대응 방안

### 위험 요소
1. **설정 호환성**: 사용자가 이미 설정한 `ape.*` 설정이 무효화될 수 있음
2. **실행중인 확장과 충돌**: 동일 시스템에 두 확장이 설치되면 충돌 가능성
3. **외부 참조 누락**: 일부 하드코딩된 문자열이나 동적 참조가 누락될 수 있음
4. **리소스 경로**: HTML 내 리소스 경로 참조가 깨질 수 있음

### 대응 방안
1. **마이그레이션 로직**: 확장 활성화 시 기존 설정을 새 설정으로 마이그레이션하는 코드 추가
2. **버전 검증**: 확장 시작 시 이전 버전에서 업그레이드된 경우 감지하고 청소 작업 수행
3. **테스트 계획**: 각 변경 후 기능 테스트 계획 수립 (명령어, 웹뷰, 설정 등)
4. **단계별 배포**: 모든 변경 사항을 한번에 적용하지 않고 단계별로 적용 및 테스트

## 9. 실행 계획

### 1단계: 코드 분석 및 변경 목록 생성
- 모든 `ape` 패턴 검색 및 문서화
- 우선순위 및 의존관계 분석
- 변경 항목 목록 작성

### 2단계: 핵심 파일 및 구조 변경
- package.json 업데이트
- 핵심 클래스 이름 및 파일명 변경
- 설정 네임스페이스 변경

### 3단계: UI 및 텍스트 변경
- HTML/CSS/JS 파일의 텍스트 변경
- 로깅 및 디버그 메시지 변경
- 웹뷰 인터페이스 업데이트

### 4단계: 테스트 및 검증
- 각 주요 기능 테스트
- 설정 마이그레이션 테스트
- UI 표시 검증

### 5단계: 최종 정리 및 패키징
- 버전 업데이트
- CHANGELOG.md 업데이트
- 배포 패키지 생성