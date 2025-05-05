# APE 명령어 시스템 사용 예제

APE 확장 프로그램은 강력한 도메인 기반 명령어 시스템을 제공합니다. 이 문서에서는 명령어 시스템의 기본 개념과 사용 방법을 설명합니다.

## 명령어 기본 구조

APE 명령어 시스템은 두 가지 접두사를 지원합니다:

1. **슬래시 명령어(`/`)**: 내부 시스템 기능을 위한 명령어
   ```
   /help
   /clear
   /model gpt-4
   ```

2. **앳 명령어(`@`)**: 외부 시스템 연동 및 도메인 기반 고급 기능
   ```
   @git:status
   @jira:view PROJ-123
   @pocket:search "machine learning"
   ```

## 도메인 기반 명령어 예시

APE의 도메인 기반 명령어는 특정 도메인에 맞춰진 기능을 제공합니다. 도메인은 관련 기능의 논리적 그룹을 의미합니다.

### Git 도메인 (`@git`)

Git 저장소 관리를 위한 명령어 세트:

```
@git:status                    # 현재 Git 저장소 상태 확인
@git:checkout main             # 브랜치 전환
@git:commit -m "메시지"        # 변경사항 커밋
@git:log --oneline            # 커밋 히스토리 조회
@git:pull                     # 원격 저장소에서 변경사항 가져오기
@git:branch -l                # 브랜치 목록 조회
@git:diff file.txt            # 특정 파일의 변경사항 확인
```

### Jira 도메인 (`@jira`)

Jira 이슈 관리를 위한 명령어 세트:

```
@jira:search "버그"            # Jira에서 버그 이슈 검색
@jira:view PROJ-123           # 특정 이슈 상세 정보 조회
@jira:assign PROJ-123 user    # 이슈 할당
@jira:create                  # 새 이슈 생성 (대화형)
@jira:comment PROJ-123 "코멘트" # 이슈에 코멘트 추가
@jira:transition PROJ-123 "In Progress" # 이슈 상태 변경
```

### Pocket 도메인 (`@pocket`)

Pocket API 연동을 위한 명령어 세트:

```
@pocket:list                  # 저장된 항목 목록 조회
@pocket:save https://example.com # URL 저장
@pocket:search "AI"           # 저장된 항목 검색
@pocket:tag item123 "읽을거리"  # 항목에 태그 추가
@pocket:favorite item123      # 항목을 즐겨찾기에 추가
@pocket:archive item123       # 항목 보관처리
```

### 문서 도메인 (`@doc`)

문서 관리 및 검색을 위한 명령어 세트:

```
@doc:search "설정 방법"        # 문서 검색
@doc:find-similar README.md   # 유사 문서 찾기
@doc:summarize file.md        # 문서 요약
@doc:extract-code file.py     # 코드 추출
@doc:topic-model docs/        # 주제 모델링
```

### 규칙 도메인 (`@rules`)

프롬프트 규칙 관리를 위한 명령어 세트:

```
@rules:list                   # 모든 규칙 목록 조회
@rules:add "규칙명" "규칙내용"  # 새 규칙 추가
@rules:enable "규칙명"         # 규칙 활성화
@rules:disable "규칙명"        # 규칙 비활성화
@rules:delete "규칙명"         # 규칙 삭제
@rules:details "규칙명"        # 규칙 상세 조회
```

## 명령어 구성 요소

APE 명령어는 다음과 같은 구성 요소를 가질 수 있습니다:

1. **접두사**: `/` 또는 `@`
2. **도메인** (앳 명령어): `git`, `jira`, `pocket` 등
3. **명령어 이름**: `status`, `search`, `view` 등 
4. **인자**: 명령어에 전달되는 값 (`@git:checkout main`에서 `main`)
5. **플래그**: 추가 옵션 (`@git:log --oneline`에서 `--oneline`)
6. **하위 명령어**: 일부 명령어는 하위 명령어를 가짐 (`@jira:issue:create`)

## 고급 명령어 기능

### 1. 명령어 자동 완성

APE는 명령어 자동 완성 기능을 제공합니다. 명령어 입력 시 `@` 또는 `/`를 입력하면 사용 가능한 명령어 목록이 표시됩니다.

### 2. 오타 수정 및 제안

명령어를 잘못 입력한 경우, APE는 유사한 명령어를 제안합니다:

```
> @git:satus
명령어를 찾을 수 없음: @git:satus
다음 명령어를 사용해 보세요: @git:status
```

### 3. 컨텍스트 인식 명령어

APE는 현재 컨텍스트를 기반으로 관련 명령어를 제안합니다. 예를 들어, Git 저장소에서 작업 중이라면 Git 관련 명령어가 우선적으로 제안됩니다.

### 4. 명령어 조합

복잡한 작업을 위해 여러 명령어를 조합할 수 있습니다:

```
@git:status && @git:diff && @git:commit -m "변경사항 반영"
```

## 사용자 지정 명령어

APE는 사용자 지정 명령어 등록을 지원합니다. 설정 파일을 통해 자신만의 명령어를 정의할 수 있습니다:

```json
{
  "customCommands": [
    {
      "name": "setup-project",
      "description": "새 프로젝트 설정",
      "command": "@git:clone {repo} && npm install && npm run build"
    }
  ]
}
```

## 도움말 및 문서

각 명령어에 대한 도움말은 다음과 같이 확인할 수 있습니다:

```
/help            # 모든 명령어 목록 및 도움말
/help:at         # @ 명령어 목록
@git:help        # Git 도메인 명령어 도움말
@jira:help       # Jira 도메인 명령어 도움말
```

## 명령어 시스템 통합

개발자는 도메인 기반 명령어 시스템을 쉽게 확장할 수 있습니다. 자세한 내용은 [명령어 시스템 통합 가이드](COMMAND_SYSTEM_INTEGRATION_GUIDE.md)를 참조하세요.

## 예제 시나리오

### 시나리오 1: Git 작업 흐름

```
> @git:status
[현재 Git 상태 표시]

> @git:checkout -b feature/new-login
[새 브랜치 생성 및 전환]

> @git:diff
[현재 변경사항 표시]

> @git:commit -m "로그인 화면 디자인 개선"
[변경사항 커밋]

> @git:push origin feature/new-login
[원격 저장소에 푸시]
```

### 시나리오 2: Jira 이슈 관리

```
> @jira:search "로그인 버그"
[관련 이슈 목록 표시]

> @jira:view PROJ-123
[선택한 이슈 상세 정보 표시]

> @jira:assign PROJ-123 myself
[이슈를 자신에게 할당]

> @jira:transition PROJ-123 "In Progress"
[이슈 상태 변경]

> @jira:comment PROJ-123 "이 이슈 작업 중입니다. 내일까지 완료 예정입니다."
[이슈에 코멘트 추가]
```

### 시나리오 3: 문서 관리

```
> @doc:search "API 문서"
[관련 문서 목록 표시]

> @doc:summarize api-docs.md
[선택한 문서 요약 표시]

> @doc:extract-code api-docs.md
[문서에서 코드 예제 추출]
```

## 결론

APE의 도메인 기반 명령어 시스템은 개발 작업 흐름을 크게 향상시킵니다. 직관적인 명령어 구조와 강력한 기능을 통해 다양한 외부 시스템과의 연동을 간소화하고, 생산성을 높일 수 있습니다.