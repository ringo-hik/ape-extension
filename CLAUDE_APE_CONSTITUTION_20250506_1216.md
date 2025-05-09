# APE 익스텐션 개발 지침 - Claude 헌법

이 문서는 APE(Agentic Pipeline Engine) 익스텐션 개발을 위한 최상위 지침입니다. Claude는 세션 시작 시 반드시 이 문서를 읽고 준수해야 합니다.

## 문서 구조 및 규칙

APE 익스텐션 프로젝트의 문서는 다음과 같은 계층 구조로 관리됩니다:

### 1. 헌법 (이 문서)
- **위치**: `/CLAUDE.md`
- **성격**: 절대 불변, 모든 규칙의 기초
- **권한**: 사용자만 수정 가능 (supervisor 모드)
- **목적**: 모든 개발 원칙의 기초를 제공하고 다른 문서들의 위치를 안내

### 2. 법률 문서 (Claude Guidelines)
- **위치**: `/CLAUDE_GUIDELINES/`
- **성격**: 버전 관리되는 핵심 지침
- **권한**: Claude가 수정 가능하지만, 사용자의 리뷰와 승인 필요
- **특징**: 주로 **질문 형식**의 체크리스트와 안티패턴 목록, 개발 철학 포함
- **주요 문서**:
  - **[CLAUDE_CORE_CHECKLIST.md](/CLAUDE_GUIDELINES/checklists/CLAUDE_CORE_CHECKLIST.md)**: 모든 개발 과정에서 검증해야 할 핵심 체크리스트
  - **[CLAUDE_ANTIPATTERNS.md](/CLAUDE_GUIDELINES/guidelines/CLAUDE_ANTIPATTERNS.md)**: 반드시 피해야 할 안티패턴 목록
  - **[CLAUDE_DEVELOPMENT_PHILOSOPHY.md](/CLAUDE_GUIDELINES/guidelines/CLAUDE_DEVELOPMENT_PHILOSOPHY.md)**: APE 시스템 개발 철학과 원칙

### 3. 임시 체크리스트 (Temporary Checklists)
- **위치**: `/CLAUDE_GUIDELINES/checklists/temp/`
- **성격**: 특정 버전, 기능, 작업에 대한 검증 항목
- **권한**: Claude가 자유롭게 생성, 수정, 삭제 가능
- **특징**: 핵심 체크리스트를 보완하는 임시적이고 구체적인 검증 항목
- **목적**: 특정 구현에 대한 세부 검증, 실험적 체크리스트 테스트

### 4. 프로젝트 문서 (Project Documentation)
- **위치**: `/docs/`
- **성격**: 프로젝트 전반에 관한 문서화 및 계획
- **권한**: 팀 전체가 참조하는 공유 문서, 사용자가 주로 관리
- **특징**: 주로 **서술 형식**으로 "이것은 이렇게 구현한다" 관점의 문서
- **주요 디렉토리**:
  - **core/**: 핵심 기술 문서
  - **design/**: 설계 문서
  - **plan/**: 계획 문서
  - **status/**: 진행 상황 문서
  - **todo/**: 할 일 목록
  - **legacy/**: 레거시 문서

### 5. Claude 작업 문서 (Claude Working Documents)
- **위치**: `/CLAUDE_WORKING_DOCS/`
- **성격**: Claude가 직접 생성하고 관리하는 작업 문서
- **권한**: Claude가 자유롭게 생성, 수정, 삭제 가능
- **특징**: Claude의 개발 계획, 진행 상황, 참조 자료 등
- **주요 디렉토리**:
  - **core/**: Claude의 핵심 작업 문서
  - **design/**: Claude의 설계 작업 문서
  - **plan/**: Claude의 계획 작업 문서
  - **status/**: Claude의 상태 작업 문서
  - **todo/**: Claude의 할 일 작업 문서

## APE 익스텐션 개발 핵심 원칙

1. **개발자 중심 설계**: 모든 기능은 실제 개발 워크플로우에 자연스럽게 통합되어야 합니다.
   
2. **단순함과 유연함**: 복잡한 기능보다 단순하고 유연한 설계를 우선시합니다.
   
3. **알아차리는 강화**: 사용자 작업 패턴을 학습하고 컨텍스트 기반 응답을 제공합니다.
   
4. **안정적 연결**: 내부망/외부망 환경에서 모두 안정적으로 작동해야 합니다.
   
5. **한글 우선**: 모든 사용자 인터페이스는 한글로 표시되어야 합니다.
   
6. **레거시 코드 정리**: 정식 배포 전까지는 하위 호환성보다 코드 품질이 우선입니다.
   
7. **브릿지 패턴 금지**: 인터페이스 기반 구현을 사용하고 브릿지 패턴은 지양합니다.
   
8. **내부망 환경 보존**: 내부망 환경변수를 수정하지 않고 그대로 유지합니다.

## 문서 관리 지침

1. **CLAUDE.md (헌법)**:
   - 이 파일은 사용자만이 수정할 수 있습니다.
   - Claude는 이 문서를 지침의 최상위 원천으로 참조해야 합니다.
   - 문서 간 충돌이 있을 경우, 이 문서의 지침이 우선합니다.

2. **CORE 문서 (법률)**:
   - 수정이 필요한 경우, Claude는 변경 사항을 제안하고 사용자의 승인을 받아야 합니다.
   - 모든 변경은 버전 관리되어야 하며, 이전 버전과의 차이점을 명확히 설명해야 합니다.
   - 핵심 원칙을 변경하는 수정은 지양하고, 명확화나 확장에 초점을 맞춰야 합니다.

3. **실행 문서**:
   - Claude는 개발 과정을 효율적으로 관리하기 위해 필요한 문서를 자유롭게 생성할 수 있습니다.
   - 현재 상태 문서는 항상 최신 정보를 반영해야 합니다.
   - TODO 목록은 우선순위와 상태를 명확히 표시해야 합니다.

## 개발 단계별 접근 방식

1. **분석 단계**:
   - CORE_CHECKLIST를 참조하여 요구사항을 검증합니다.
   - ANTIPATTERNS를 확인하여 금지된 패턴을 피합니다.
   - DEVELOPMENT_PHILOSOPHY에 따라 설계 방향을 수립합니다.

2. **구현 단계**:
   - 코드 작성 시 CORE_CHECKLIST의 코드 품질 항목을 지속적으로 확인합니다.
   - 실행 문서를 통해 진행 상황을 추적합니다.
   - 금지된 패턴이 사용되지 않도록 지속적으로 검증합니다.

3. **검증 단계**:
   - 구현된 기능이 CORE_CHECKLIST의 모든 항목을 만족하는지 확인합니다.
   - 사용자 경험이 개발 철학에 부합하는지 검증합니다.
   - TODO 목록의 모든 항목이 완료되었는지 확인합니다.

## 문서 읽기 순서

Claude는 다음 순서로 문서를 읽고 개발 작업을 진행해야 합니다:

1. **CLAUDE.md** (현재 문서) - 최상위 원칙과 지침
2. **CLAUDE_DEVELOPMENT_PHILOSOPHY.md** - 개발 철학과 원칙
3. **CLAUDE_ANTIPATTERNS.md** - 피해야 할 패턴
4. **CLAUDE_CORE_CHECKLIST.md** - 검증해야 할 항목
5. 현재 상태 문서 - 진행 중인 작업 파악
6. TODO 목록 - 다음으로 수행할 작업 확인

## 결론

이 문서는 APE 익스텐션 개발의 최상위 지침으로, 모든 개발 과정에서 이 원칙을 따라야 합니다. Claude는 세션 시작 시 반드시 이 문서를 읽고, 모든 개발 활동이 이 원칙에 부합하는지 지속적으로 확인해야 합니다.

---

**마지막 업데이트**: 2023-05-06