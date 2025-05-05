# "APE"에서 "Ape"로 변경 체크리스트

이 체크리스트는 "APE"에서 "Ape"로 리브랜딩하는 과정에서 모든 필요한 변경 사항이 적용되었는지 확인하기 위한 목록입니다.

## 1. 핵심 파일 이름 변경

- [ ] `/src/core/ApeCoreService.ts` → `/src/core/ApeCoreService.ts`
- [ ] `/src/ui/ApeChatViewProvider.ts` → `/src/ui/ApeChatViewProvider.ts`
- [ ] `/resources/ape_logo.png` → `/resources/ape_logo.png`
- [ ] `/resources/css/ape-ui.css` → `/resources/css/ape-ui.css`
- [ ] `/resources/css/icons/ape-icons.css` → `/resources/css/icons/ape-icons.css`
- [ ] `/resources/js/ape-ui.js` → `/resources/js/ape-ui.js`

## 2. 파일 내용 변경

### 2.1 패키지 설정

- [ ] package.json: 패키지 이름 변경 (`"name": "ape"` → `"name": "ape"`)
- [ ] package.json: 패키지 표시 이름 변경 (`"displayName": "APE 웹뷰"` → `"displayName": "Ape 웹뷰"`)
- [ ] package.json: 명령어 ID 접두사 변경 (`"command": "ape.openSidebar"` → `"command": "ape.openSidebar"`)
- [ ] package.json: 활동 바 ID 변경 (`"id": "ape-sidebar"` → `"id": "ape-sidebar"`)
- [ ] package.json: 뷰 ID 변경 (`"id": "ape.chatView"` → `"id": "ape.chatView"`)
- [ ] package.json: 설정 네임스페이스 변경 (`"ape.core.sslBypass"` 등)
- [ ] package.json: 설정 타이틀 변경 (`"title": "APE"` → `"title": "Ape"`)

### 2.2 소스 코드

- [ ] 클래스 이름 변경 (`ApeCoreService` → `ApeCoreService` 등)
- [ ] 클래스 생성자 함수 이름 변경
- [ ] 싱글톤 인스턴스 접근자 함수 이름 변경
- [ ] 설정 참조 경로 변경 (`vscode.workspace.getConfiguration('ape.core')` → `vscode.workspace.getConfiguration('ape.core')`)
- [ ] 로그 메시지 텍스트 변경 (`'APE 코어 서비스 초기화 시작'` → `'Ape 코어 서비스 초기화 시작'`)
- [ ] 오류 메시지 텍스트 변경 (`'ApeCoreService 초기화에 context가 필요합니다.'` → `'ApeCoreService 초기화에 context가 필요합니다.'`)
- [ ] 주석 텍스트 변경 (`* APE 코어 서비스` → `* Ape 코어 서비스`)
- [ ] 임포트 경로 변경 (`import { ApeCoreService } from '../core/ApeCoreService'` → `import { ApeCoreService } from '../core/ApeCoreService'`)

### 2.3 웹뷰 UI 요소

- [ ] HTML 타이틀 변경 (`<title>APE 채팅</title>` → `<title>Ape 채팅</title>`)
- [ ] 웹뷰 헤더 텍스트 변경 (`APE 채팅` → `Ape 채팅`)
- [ ] 빈 상태 메시지 변경 (`Ape과 대화를 시작하세요` → `Ape과 대화를 시작하세요`)
- [ ] 디버그 객체 이름 변경 (`window.apeDebug` → `window.apeDebug`)
- [ ] 디버그 로그 메시지 변경 (`[APE Debug]` → `[Ape Debug]`)

### 2.4 CSS 선택자

- [ ] CSS 클래스 이름 변경 (`.ape-container` → `.ape-container` 등)
- [ ] CSS ID 선택자 변경 (`#apeChat` → `#apeChat` 등)
- [ ] CSS 파일 내 주석 텍스트 변경

### 2.5 JavaScript 코드

- [ ] DOM 요소 셀렉터 변경 (`document.querySelector('.ape-container')` → `document.querySelector('.ape-container')`)
- [ ] 요소 ID 참조 변경 (`document.getElementById('apeChat')` → `document.getElementById('apeChat')`)
- [ ] 이벤트 리스너 내 참조 변경
- [ ] 문자열 리터럴 내 참조 변경

## 3. 기능 테스트

- [ ] VS Code 명령 팔레트에서 명령어 실행 테스트
- [ ] 사이드바 웹뷰 정상 로드 확인
- [ ] 채팅 기능 동작 확인
- [ ] 설정 저장/로드 동작 확인
- [ ] 플러그인 시스템 동작 확인
- [ ] 로깅 시스템 정상 동작 확인
- [ ] 디버그 모드 동작 확인

## 4. 설정 마이그레이션

- [ ] 기존 `ape.*` 설정을 `ape.*`로 마이그레이션하는 로직 구현
- [ ] 확장 활성화 시 마이그레이션 로직 실행
- [ ] 마이그레이션 후 정상 설정 사용 확인

## 5. 문서 및 메타데이터

- [ ] README.md 업데이트 (제품명 변경)
- [ ] HISTORY.md 업데이트 (변경 내역 추가)
- [ ] 버전 번호 업데이트 (`0.0.1` → `0.1.0` 또는 적절한 버전)
- [ ] 리포지토리 URL 업데이트 (필요시)

## 6. 빌드 및 패키징

- [ ] 타입스크립트 컴파일 확인 (오류 없음)
- [ ] esbuild 패키징 확인
- [ ] VSIX 패키지 생성 및 설치 테스트
- [ ] 새로 설치된 확장에서 모든 기능 테스트

## 7. 릴리스 준비

- [ ] 로고 및 마케팅 이미지 업데이트
- [ ] 마켓플레이스 메타데이터 업데이트
- [ ] 공개 설명 및 태그 업데이트
- [ ] 릴리스 노트 작성

---

## 테스트 완료 사항

각 항목이 테스트되고 확인되면 테스트 수행 날짜와 담당자를 기록하세요.

### 핵심 기능

- 채팅 기능: ______________________
- 명령어 실행: ______________________
- 설정 관리: ______________________
- 플러그인 시스템: ______________________
- 로깅 시스템: ______________________

### 플랫폼 호환성

- Windows: ______________________
- macOS: ______________________
- Linux: ______________________

## 추가 참고 사항

- 모든 변경사항은 별도 브랜치에서 작업 후 `master`로 병합 권장
- 대규모 변경이므로 별도 테스트 환경에서 충분한 테스트 필요
- 업데이트 전후 사용자 경험 점검 필요