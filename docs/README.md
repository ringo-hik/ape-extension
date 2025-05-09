# APE 익스텐션 문서 디렉토리

이 디렉토리는 APE(Agentic Pipeline Engine) 익스텐션 개발과 관련된 다양한 문서를 포함하고 있습니다. 이 문서들은 개발 과정, 구현 지침, 작업 계획 등을 기록하고 관리하기 위한 목적으로 사용됩니다.

## 문서 구조

```
docs/
├── README.md                 # 이 파일
├── core/                     # 핵심 문서 (기술 아키텍처, 핵심 API 등)
├── design/                   # 설계 문서 (UI/UX, 시스템 설계 등)
├── plan/                     # 계획 문서 (로드맵, 마일스톤 등)
├── status/                   # 상태 문서 (진행 상황, 완료 보고서 등)
├── todo/                     # 할 일 목록 (세부 작업 항목 등)
└── legacy/                   # 레거시 문서 (참고용으로 유지됨)
```

## docs/ vs CLAUDE_GUIDELINES/

- **docs/**:
  - 프로젝트 전반에 관한 **문서화 및 계획**
  - 기술 가이드, 설계 문서, 계획, 현황 등 **정보 제공** 중심
  - 주로 **서술 형식**으로 "이것은 이렇게 구현한다" 관점
  - 참조용 정보 및 지침
  - 팀원 전체가 참조하는 공유 문서

- **CLAUDE_GUIDELINES/**:
  - Claude가 직접 관리하는 **검증 항목 및 개발 철학**
  - 주로 코드 품질, 아키텍처, 구현에 관한 **검증 기준** 중심
  - 주로 **질문 형식**의 체크리스트 ("이것이 제대로 구현되었는가?")
  - 강제성을 가진 점검 항목 및 금지된 패턴
  - Claude의 작업 지침 및 가이드라인 역할

## 주요 문서 목록

### 주요 참조 문서

- `core/APE_PROJECT_HISTORY.md`: 프로젝트 히스토리 및 변경 내역
- `core/APE_IMPLEMENTATION_GUIDE.md`: 구현 세부 사항 및 개발자 가이드
- `core/APE_PLUGIN_SYSTEM.md`: 플러그인 시스템 설계 및 사용 방법
- `status/APE_CHANGELOG.md`: 버전별 변경 사항
- `core/APE_DEV_GUIDE.md`: 개발자 가이드

### 핵심 문서 (core/)

핵심 아키텍처, API 설계, 기반 시스템에 관한 문서들입니다.

### 설계 문서 (design/)

UI/UX 디자인, 시스템 설계, 플로우 차트 등의 설계 관련 문서들입니다.

### 계획 문서 (plan/)

로드맵, 마일스톤, 작업 계획 등의 계획 관련 문서들입니다.

### 상태 문서 (status/)

현재 진행 상황, 완료 보고서, 통합 테스트 결과 등의 상태 관련 문서들입니다.

### 할 일 목록 (todo/)

세부 작업 항목, 담당자 배정, 우선순위 등의 할 일 목록 문서들입니다.

### 레거시 문서 (legacy/)

이전 버전 또는 참고용으로 유지되는 문서들로, 더 이상 적극적으로 관리되지 않습니다. 프로젝트 리브랜딩 및 리팩토링 과정에서 생성된 과거 문서들이 포함되어 있습니다.

## 문서 작성 및 관리 지침

1. **문서 분류**: 모든 새 문서는 적절한 하위 디렉토리에 저장해야 합니다.
2. **파일명 지정**: 파일명은 문서 내용을 명확히 나타내는 영문 대문자와 언더스코어를 사용합니다.
3. **날짜 기록**: 모든 문서는 마지막 업데이트 날짜를 포함해야 합니다.
4. **레거시 문서**: 더 이상 관련이 없는 문서는 `legacy/` 디렉토리로 이동하되, 삭제하지 않습니다.
5. **문서 형식**: 각 문서는 명확한 목적, 대상 독자, 설명 및 예제를 포함해야 합니다.

## 관련 문서

APE 익스텐션의 핵심 개발 지침과 철학은 루트 디렉토리의 `CLAUDE.md`와 `CLAUDE_GUIDELINES/` 디렉토리에 있는 문서들을 참조하세요.

---

**마지막 업데이트**: 2023-05-06