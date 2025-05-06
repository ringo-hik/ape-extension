# APE 익스텐션 문서 구조 가이드

이 문서는 APE 익스텐션 프로젝트의 문서 구조와 각 문서 유형의 목적을 설명합니다. 문서는 대상 사용자와 목적에 따라 명확히 구분되어 있습니다.

## 문서 대상자별 분류

APE 익스텐션의 문서는 다음 네 가지 대상자로 분류됩니다:

1. **Claude와의 협업을 위한 문서**: Claude가 프로젝트를 이해하고 개발에 참여하기 위한 문서
2. **소유자(당신)를 위한 문서**: 프로젝트 소유자가 참조할 가이드라인 및 테스트 문서
3. **개발자를 위한 문서**: 프로젝트에 참여하는 다른 개발자들을 위한 문서
4. **최종 사용자를 위한 문서**: APE 익스텐션을 사용하는 사용자를 위한 문서

## 디렉토리 구조

```
ape-extension/
├── CLAUDE_APE_CONSTITUTION_[DATE_TIME].md    # Claude와 협업을 위한 헌법 문서
├── CLAUDE.md                                 # 원본 헌법 문서 (변경되지 않음)
├── CLAUDE_GUIDELINES/                        # Claude 지침 문서
│   ├── README.md
│   ├── renamed/                              # 새로운 명명 규칙이 적용된 문서
│   │   ├── CLAUDE_APE_CORE_CHECKLIST_[DATE_TIME].md
│   │   ├── CLAUDE_APE_ANTIPATTERNS_[DATE_TIME].md
│   │   └── CLAUDE_APE_DEVELOPMENT_PHILOSOPHY_[DATE_TIME].md
│   ├── checklists/                           # 체크리스트 문서
│   │   ├── CLAUDE_CORE_CHECKLIST.md
│   │   └── temp/                             # 임시 체크리스트
│   └── guidelines/                           # 가이드라인 문서
│       ├── CLAUDE_ANTIPATTERNS.md
│       └── CLAUDE_DEVELOPMENT_PHILOSOPHY.md
├── CLAUDE_WORKING_DOCS/                      # Claude의 작업 문서
│   ├── README.md
│   ├── core/                                 # 핵심 작업 문서
│   ├── design/                               # 설계 작업 문서
│   ├── plan/                                 # 계획 작업 문서
│   ├── status/                               # 상태 작업 문서
│   └── todo/                                 # 할 일 작업 문서
├── TO_OWNER/                                 # 소유자를 위한 문서
│   ├── APE_TEST_GUIDE_[DATE_TIME].md         # 테스트 가이드
│   └── APE_DEBUG_GUIDE_[DATE_TIME].md        # 디버깅 가이드
└── docs/                                     # 공식 프로젝트 문서
    ├── README.md
    ├── developer/                            # 개발자용 문서
    │   └── APE_EXTENSION_DEVELOPER_GUIDE.md
    ├── user/                                 # 최종 사용자용 문서
    │   └── APE_EXTENSION_USER_GUIDE.md
    ├── core/                                 # 핵심 기술 문서
    ├── design/                               # 설계 문서
    ├── plan/                                 # 계획 문서
    ├── status/                               # 진행 상황 문서
    ├── todo/                                 # 할 일 목록
    └── legacy/                               # 레거시 문서
        └── archive/                          # 보관 문서
```

## 문서 명명 규칙

1. **Claude와의 협업 문서**: `CLAUDE_APE_[문서유형]_[날짜_시간].md`
   - 예: `CLAUDE_APE_CORE_CHECKLIST_20240506_1200.md`

2. **소유자를 위한 문서**: `APE_[문서유형]_[날짜_시간].md`
   - 예: `APE_TEST_GUIDE_20240506_1200.md`

3. **개발자용 문서**: `APE_EXTENSION_[문서유형].md` 또는 `APE_[문서유형].md`
   - 예: `APE_EXTENSION_DEVELOPER_GUIDE.md`

4. **사용자용 문서**: `APE_EXTENSION_[문서유형].md`
   - 예: `APE_EXTENSION_USER_GUIDE.md`

## 문서 배치 규칙

1. **루트 디렉토리**:
   - `CLAUDE.md`: 원본 헌법 문서
   - `CLAUDE_APE_CONSTITUTION_[DATE_TIME].md`: 최신 헌법 문서

2. **CLAUDE_GUIDELINES 디렉토리**:
   - Claude의 개발 지침과 체크리스트
   - 버전 관리되는 핵심 지침 문서

3. **CLAUDE_WORKING_DOCS 디렉토리**:
   - Claude의 작업 문서
   - Claude가 자유롭게 생성, 수정, 삭제 가능

4. **TO_OWNER 디렉토리**:
   - 소유자를 위한 가이드라인 및 테스트 문서
   - 최신 문서를 쉽게 식별할 수 있도록 날짜와 시간 포함

5. **docs 디렉토리**:
   - 공식 프로젝트 문서
   - 개발자와 사용자를 위한 서브디렉토리 포함

## 문서 관리 지침

1. **버전 관리**:
   - 중요 문서는 날짜와 시간을 포함하여 버전 관리
   - 최신 버전은 항상 가장 최근 날짜와 시간을 가짐

2. **문서 포맷**:
   - 모든 문서는 마크다운(.md) 형식 사용
   - 각 문서는 명확한 제목, 목적, 그리고 마지막 업데이트 날짜를 포함

3. **콘텐츠 중복 방지**:
   - 각 문서는 고유한 목적을 가져야 함
   - 중복된 내용은 링크로 참조

4. **가독성**:
   - 명확한 섹션 구분과 계층적 구조 사용
   - 코드 블록, 목록, 표 등 마크다운 기능 활용

---

**마지막 업데이트**: 2024-05-06