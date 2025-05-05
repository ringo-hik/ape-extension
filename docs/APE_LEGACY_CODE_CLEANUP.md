# APE 익스텐션 레거시 코드 정리 계획

이 문서는 APE 익스텐션 코드베이스에서 확인된 레거시 코드, 사용하지 않는 코드, 브릿지 패턴으로 인한 중복 코드 등을 식별하고 정리하기 위한 계획을 제공합니다.

## 1. Axiom에서 APE로 리브랜딩 관련 레거시 파일

| 파일 경로 | 문제 유형 | 설명 | 의존성 |
|-----------|------------|-------------|--------------|
| `/resources/css/axiom-ui.css` | 레거시 | `ape-ui.css`와 동일한 내용으로 이름만 변경된 파일 | design-concept 파일에서 참조될 수 있으나 활성 코드에서는 미사용 |
| `/resources/css/icons/axiom-icons.css` | 레거시 | 현재 `ape-icons.css`에 해당하는 이전 버전 아이콘 스타일 | 일부 오래된 HTML 파일에서 참조될 수 있음 |
| `/docs/legacy/ui/AxiomChatViewProvider.ts` | 레거시 | APE로 이름 변경 전 이전 버전 ChatView 제공자 | 참조용으로 보존되었으나 활발히 사용되지 않음 |
| `/docs/legacy/core/AxiomCoreService.ts` | 레거시 | APE로 이름 변경 전 이전 버전 Core 서비스 | 참조용으로 보존되었으나 활발히 사용되지 않음 |
| `/scripts/rename-axiom-to-ape.js` | 유틸리티 | 이름 변경 과정에서 사용된 스크립트, 더 이상 필요하지 않음 | 없음, 안전하게 제거 가능 |
| `/resources/axiom_logo.png` | 레거시 | Axiom 브랜딩의 이전 로고 | 없음, `ape_logo.png`로 대체됨 |

## 2. 중복 UI 컴포넌트 파일

| 파일 경로 | 문제 유형 | 설명 | 의존성 |
|-----------|------------|-------------|--------------|
| `/src/ui/ApeChatViewProvider.ts` 및<br>`/src/ui/ApeHybridChatViewProvider.ts` | 중복 | 상당한 코드 중복을 가진 두 채팅 뷰 제공자. 약간의 차이가 있지만 유사한 용도로 사용 | 둘 다 `extension.ts`에 등록됨, 활성 컴포넌트 |
| `/resources/js/ape-ui.js` 및<br>`/resources/js/improved-ape-ui.js` | 중복 | 개선된 버전이 원본을 대체하기 위한 두 개의 UI JavaScript 파일 | 개선된 버전은 `chat.html`에서 참조됨 |
| `/resources/js/hybrid-ape-ui.js` | 중복 | 하이브리드 모드를 위한 UI JavaScript의 세 번째 변형 | `ApeHybridChatViewProvider.ts`에서 참조됨 |
| `/resources/css/ape-ui.css` 및<br>`/resources/css/hybrid-ui.css` | 중복 | 중복 스타일을 가진 두 UI 스타일시트 파일 | 서로 다른 뷰 제공자에서 사용됨 |

## 3. TODO, FIXME 또는 사용 중단 주석이 있는 파일

| 파일 경로 | 문제 유형 | 설명 | 의존성 |
|-----------|------------|-------------|--------------|
| `/src/extension.ts` | TODO | 45-47줄과 59줄에 TreeView 기능 관련 여러 TODO 포함 | 활성 코드, 검토 및 구현 필요 |
| `/src/ui/ApeFileExplorerProvider.ts` | TODO | 파일 탐색기 기능에 대한 TODO 포함 | 완료가 필요한 활성 코드 |
| `/src/ui/ApeTreeDataProvider.ts` | TODO | TreeView 데이터 제공자 관련 TODO 포함 | extension.ts에서 사용되는 활성 컴포넌트 |
| `/src/core/ApeCoreService.ts` | TODO | 보류 중인 TODO가 있는 코어 서비스 | 많은 의존성을 가진 중요 컴포넌트 |
| `/src/plugins/internal/pocket/PocketPluginService.ts` | TODO | 보류 중인 TODO가 있는 플러그인 서비스 | 플러그인 시스템 컴포넌트 |

## 4. 레거시 문서 파일

| 파일 경로 | 문제 유형 | 설명 | 의존성 |
|-----------|------------|-------------|--------------|
| `/docs/legacy/APE_CHANGE_LIST.md` | 사용되지 않음 | 최신 문서로 대체된 이전 변경 목록 문서 | 없음, 정보 제공용 |
| `/docs/legacy/APE_CHANGE_STRATEGY.md` | 사용되지 않음 | 최신 파일에 내용이 반영된 이전 전략 문서 | 없음, 정보 제공용 |
| `/docs/legacy/AXIOM_CLEANUP_PLAN.md` | 사용되지 않음 | Axiom 시대의 이전 정리 계획 | 없음, 정보 제공용 |
| `/docs/legacy/AXIOM_DESIGN_GUIDE.md` | 사용되지 않음 | 최신 APE 디자인 문서로 대체된 이전 디자인 가이드라인 | 없음, 정보 제공용 |
| `/docs/legacy/REBRANDING.md` 및<br>`/docs/legacy/REBRANDING_SUMMARY.md` | 사용되지 않음 | Axiom에서 APE로의 전환 관련 문서, 더 이상 관련 없음 | 없음, 정보 제공용 |

## 5. 중복 리소스 파일

| 파일 경로 | 문제 유형 | 설명 | 의존성 |
|-----------|------------|-------------|--------------|
| `/resources/icon/ape_bar.svg` 및<br>`/resources/icon/ape_temp.svg` | 미사용 | git 상태에서 삭제 대상으로 표시됨, 임시 로고 변형으로 추정됨 | 없음, 안전하게 제거 가능 |
| `/resources/icon/ape_final.svg` 및<br>`/resources/icon/ape_main.svg` | 중복 | 구분이 명확하지 않은 여러 아이콘 버전 | HTML/CSS에서 참조될 수 있음 |
| `/resources/icon/ape/ape_final.svg` | 중복 | 중첩 폴더에 있는 ape_final.svg의 중복 | 참조 여부가 명확하지 않음 |

## 6. 중복 UI 컴포넌트 구조

| 파일 경로 | 문제 유형 | 설명 | 의존성 |
|-----------|------------|-------------|--------------|
| Standard vs Hybrid UI 시스템 | 아키텍처 | 코드베이스는 상당한 코드 중복이 있는 두 개의 병렬 UI 시스템(표준 및 하이브리드)을 유지 | UI 전환 로직이 있는 extension.ts에서 모두 활성화됨 |

## 7. 레거시 브릿지 패턴

| 파일 경로 | 문제 유형 | 설명 | 의존성 |
|-----------|------------|-------------|--------------|
| `ConfigMigrationService.ts`의 구성 경로 마이그레이션 | 레거시 브릿지 | 더 이상 필요하지 않을 수 있는 Axiom 구성에서 APE 구성으로 마이그레이션하는 서비스 | 초기화 중 extension.ts에서 사용됨 |

## 8. 잠재적으로 혼란스러운 파일 구성

| 파일 경로 | 문제 유형 | 설명 | 의존성 |
|-----------|------------|-------------|--------------|
| 여러 환영 HTML 파일 | 중복 | `resources/html/welcome.html`은 새로운 파일이지만 기능이 중복될 수 있음 | extension.ts에서 참조됨 |
| 여러 CSS 스타일링 접근 방식 | 일관성 없음 | 직접 CSS 파일과 Claude 특정 스타일링의 혼합 | 활성 UI 컴포넌트 |

## 권장 사항

### 1. 코드 통합

- 표준 및 하이브리드 채팅 뷰 제공자를 단일 구성 가능한 컴포넌트로 병합
- 여러 UI JavaScript 파일(ape-ui.js, improved-ape-ui.js, hybrid-ape-ui.js) 통합
- 어떤 파일이 활발히 사용되는지 확인한 후 중복 CSS 파일 제거

### 2. 리소스 정리

- 참조되지 않는지 확인한 후 모든 Axiom 이름의 리소스 제거
- 단일 아이콘 세트로 표준화하고 임시/중복 버전 제거
- 더 이상 필요하지 않은 이름 변경 스크립트 제거

### 3. TODO 해결

- 활성 코드의 TODO 검토 및 구현 또는 제거
- 완료된 TODO를 변경 로그에 문서화

### 4. 문서 업데이트

- 모든 레거시 문서를 별도 저장소 또는 폴더로 보관
- 정리 후 현재 아키텍처를 반영하도록 문서 업데이트

### 5. 사용되지 않는 서비스 제거

- 모든 사용자가 마이그레이션되었는지 확인한 후 ConfigMigrationService 제거

## 구현 접근 방식

1. **심각도 기준 정리**
   - 첫 단계: 미사용 리소스 및 불필요한 문서 제거
   - 두 번째 단계: 레거시 코드 파일 제거
   - 세 번째 단계: 코드 통합 및 중복 제거

2. **테스트 및 검증**
   - 각 변경 후 철저한 기능 테스트 수행
   - 제거 전 참조 확인을 위한 정적 분석 사용

3. **문서화**
   - 제거된 각 구성 요소와 제거 이유를 문서화
   - 필요한 경우 대체 구성 요소 또는 접근 방식 제공

이 분석을 통해 코드베이스의 유지보수성 향상과 기술 부채 감소를 위해 제거하거나 통합할 수 있는 약 25개의 파일 또는 구성 요소를 식별했습니다.