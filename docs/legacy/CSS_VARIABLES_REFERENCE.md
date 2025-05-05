# VS Code CSS 변수 참조 가이드

이 문서는 APE UI 개발 시 사용할 VS Code의 CSS 변수와 적용 방법에 대한 참조 가이드입니다.

## VS Code 테마 변수 활용 방법

VS Code의 테마 변수를 사용하면 확장 프로그램의 UI가 사용자의 VS Code 테마와 자연스럽게 통합됩니다. 사용자가 테마를 변경하면 확장 프로그램의 UI도 자동으로 업데이트됩니다.

### 기본 사용법

```css
.my-element {
  color: var(--vscode-foreground);
  background-color: var(--vscode-editor-background);
  border: 1px solid var(--vscode-input-border);
}
```

## 주요 테마 변수 목록

### 기본 색상

| 변수명 | 설명 | 사용 예시 |
|--------|------|-----------|
| `--vscode-foreground` | 기본 텍스트 색상 | 일반 텍스트 |
| `--vscode-editor-foreground` | 에디터 텍스트 색상 | 코드 블록 내 텍스트 |
| `--vscode-editor-background` | 에디터 배경 색상 | 코드 블록 배경 |
| `--vscode-sideBar-background` | 사이드바 배경 색상 | 패널 배경 |

### 버튼 및 입력 요소

| 변수명 | 설명 | 사용 예시 |
|--------|------|-----------|
| `--vscode-button-background` | 버튼 배경 색상 | 주요 버튼 |
| `--vscode-button-foreground` | 버튼 텍스트 색상 | 버튼 텍스트 |
| `--vscode-button-hoverBackground` | 버튼 호버 시 배경 색상 | 버튼 상호작용 |
| `--vscode-input-background` | 입력 필드 배경 색상 | 텍스트 입력 영역 |
| `--vscode-input-foreground` | 입력 필드 텍스트 색상 | 텍스트 입력 텍스트 |
| `--vscode-input-border` | 입력 필드 테두리 색상 | 입력 필드 경계 |

### 패널 및 섹션

| 변수명 | 설명 | 사용 예시 |
|--------|------|-----------|
| `--vscode-sideBarSectionHeader-background` | 섹션 헤더 배경 색상 | 패널 헤더 |
| `--vscode-sideBarSectionHeader-border` | 섹션 헤더 테두리 색상 | 패널 구분선 |
| `--vscode-sideBarTitle-foreground` | 사이드바 제목 색상 | 패널 제목 |
| `--vscode-panel-border` | 패널 테두리 색상 | 섹션 구분선 |

### 목록 및 선택

| 변수명 | 설명 | 사용 예시 |
|--------|------|-----------|
| `--vscode-list-hoverBackground` | 목록 항목 호버 시 배경 색상 | 메뉴 항목 호버 |
| `--vscode-list-activeSelectionBackground` | 선택된 목록 항목 배경 색상 | 선택된 항목 |
| `--vscode-list-activeSelectionForeground` | 선택된 목록 항목 텍스트 색상 | 선택된 항목 텍스트 |
| `--vscode-dropdown-background` | 드롭다운 배경 색상 | 모델 선택기 배경 |
| `--vscode-dropdown-foreground` | 드롭다운 텍스트 색상 | 모델 선택기 텍스트 |
| `--vscode-dropdown-border` | 드롭다운 테두리 색상 | 모델 선택기 테두리 |
| `--vscode-dropdown-listBackground` | 드롭다운 목록 배경 색상 | 드롭다운 메뉴 배경 |

### 상태 및 알림

| 변수명 | 설명 | 사용 예시 |
|--------|------|-----------|
| `--vscode-activityBarBadge-background` | 활동 배지 배경 색상 | 시스템 메시지 배경 |
| `--vscode-activityBarBadge-foreground` | 활동 배지 텍스트 색상 | 시스템 메시지 텍스트 |
| `--vscode-descriptionForeground` | 설명 텍스트 색상 | 부가 설명 텍스트 |
| `--vscode-errorForeground` | 오류 텍스트 색상 | 오류 메시지 |
| `--vscode-gitDecoration-addedResourceForeground` | Git 추가 요소 색상 | 성공 상태 표시 |

### 위젯 및 에디터

| 변수명 | 설명 | 사용 예시 |
|--------|------|-----------|
| `--vscode-editorWidget-border` | 에디터 위젯 테두리 색상 | 코드 블록 테두리 |
| `--vscode-editorGroupHeader-tabsBackground` | 에디터 탭 배경 색상 | 코드 블록 헤더 |

## APE 고유 색상 변수

Ape의 고유한 브랜드 아이덴티티와 기능별 색상 구분을 위해 추가적인 CSS 변수를 정의합니다.

```css
:root {
  /* 브랜드 색상 */
  --ape-accent: #FF9900;
  
  /* 기능별 색상 */
  --ape-git: #F14E32;
  --ape-jira: #0052CC;
  --ape-swdp: #6554C0;
  
  /* 간격 시스템 */
  --ape-space-xs: 4px;
  --ape-space-sm: 8px;
  --ape-space-md: 12px;
  --ape-space-lg: 16px;
  --ape-space-xl: 24px;
}
```

## 테마 전환 지원

라이트 모드와 다크 모드를 모두 지원하기 위해 VS Code의 테마 변수를 활용하면 자동으로 테마에 맞는 스타일이 적용됩니다. 추가적인 조정이 필요한 경우 다음과 같이 클래스 기반 접근법을 사용할 수 있습니다:

```css
body.vscode-light {
  /* 라이트 테마에서만 적용될 스타일 */
}

body.vscode-dark {
  /* 다크 테마에서만 적용될 스타일 */
}

body.vscode-high-contrast {
  /* 고대비 테마에서만 적용될 스타일 */
}
```

## 참고 사항

- VS Code 테마 변수는 웹뷰(WebView)에서 자동으로 주입됩니다.
- 테마 변수가 정의되지 않은 환경에서 대체 색상을 정의하려면 CSS 변수의 fallback 값을 사용하세요:
  ```css
  color: var(--vscode-foreground, #cccccc);
  ```

---

© 2025 APE Team