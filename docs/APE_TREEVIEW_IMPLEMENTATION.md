# APE TreeView 구현 문서

## 개요

APE Extension의 TreeView 구현은 VS Code의 사이드바에 계층적 인터페이스를 제공하여 채팅, 명령어, 지식 저장소, 룰, 설정 등의 기능을 탐색하고 관리할 수 있도록 합니다.

## 주요 구성 요소

### 1. ApeTreeDataProvider

`src/ui/ApeTreeDataProvider.ts` 파일에 구현된 VS Code TreeDataProvider 인터페이스를 구현한 클래스로, 트리 데이터의 구조와 표시 방식을 정의합니다.

- **주요 기능:**
  - TreeView의 노드 타입 정의
  - 계층적 데이터 구조 생성
  - 카테고리별 데이터 표시
  - 노드 선택 및 상호작용 처리

- **구현된 메서드:**
  - `getTreeItem`: 각 트리 항목의 표시 방식 정의
  - `getChildren`: 트리 항목의 자식 요소 반환
  - `refresh`: 트리 데이터 새로고침
  - 각 카테고리별 데이터 생성 메서드 (채팅 히스토리, 명령어, 지식 저장소 등)

### 2. 통합 구성

- **패키지 설정:** `package.json`에 TreeView를 위한 view 및 commands 등록
- **extension.ts 통합:** TreeDataProvider 등록 및 명령어 핸들러 구현
- **명령어 세부정보 디스플레이:** 명령어 노드 클릭 시 상세 정보를 표시하는 웹뷰 패널

## 트리 구조

APE TreeView는 다음의 카테고리를 포함합니다:

1. **채팅 (Chat)**
   - 현재 세션
   - 히스토리 (날짜별로 그룹화)

2. **명령어 (Commands)**
   - 시스템 명령어 (`/` 접두사)
   - 도메인별 명령어 (`@` 접두사)
     - Git
     - 문서
     - Jira
     - Pocket
     - Vault
     - Rules

3. **지식 저장소 (Vault)**
   - 폴더별 문서 구조

4. **프롬프트 룰 (Rules)**
   - 활성화/비활성화 상태 표시

5. **설정 (Settings)**
   - LLM 설정
   - 코어 설정

## 구현된 기능

- [x] TreeDataProvider 클래스 구현
- [x] 트리 노드 타입 및 인터페이스 정의
- [x] 기본 데이터 구조 정의
- [x] 패키지 설정 업데이트
- [x] extension.ts 통합
- [x] 명령어 세부정보 보기 기능
- [x] 트리 새로고침 명령어
- [x] 트리 데이터 초기화 방법

## 향후 개선 사항

- [ ] 실제 데이터 연동 (현재는 샘플 데이터)
- [ ] 상태 저장 및 복원 (확장/축소 상태 등)
- [ ] 필터링 및 검색 기능
- [ ] 드래그 앤 드롭 지원
- [ ] 컨텍스트 메뉴 확장 (더 많은 액션 추가)
- [ ] 테마별 아이콘 및 스타일 지원
- [ ] 드래그 앤 드롭 지원

## 사용 방법

1. APE Extension 활성화 시 자동으로 사이드바에 표시됩니다.
2. 트리 항목을 클릭하여 확장하거나 접을 수 있습니다.
3. 명령어 항목을 클릭하면 세부 정보를 확인할 수 있습니다.
4. 새로고침 버튼을 클릭하여 트리 데이터를 업데이트할 수 있습니다.

## 연관 파일

- `src/ui/ApeTreeDataProvider.ts`: TreeView 데이터 제공자 구현
- `src/extension.ts`: TreeView 등록 및 명령어 핸들러
- `package.json`: TreeView 및 명령어 등록
- `resources/css/claude-style.css`: UI 스타일 정의