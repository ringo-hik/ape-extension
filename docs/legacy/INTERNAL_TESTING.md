# 내부망 테스트 가이드

이 문서는 APE 확장의 플러그인 자연어 처리 기능을 내부망에서 테스트하기 위한 지침을 제공합니다.

## 테스트 준비

1. 내부망으로 코드 이동
   - `dist` 디렉토리와 필요한 모든 파일을 내부망으로 복사합니다.
   - `settings.json` 파일에서 URL 설정을 내부망 환경에 맞게 업데이트합니다.

2. 설정 확인
   - `settings.json` 파일에 모든 플러그인 설정이 올바른지 확인합니다.
   - 내부망의 엔드포인트 URL이 올바르게 설정되었는지 확인합니다.

## 자연어 처리 기능 테스트

### 1. 테스트 스크립트 실행

`tests` 디렉토리에 있는 다음 테스트 스크립트를 실행하여 자연어 처리 기능을 테스트할 수 있습니다:

```bash
node tests/pluginNLPTest.js
```

이 스크립트는 다양한 자연어 명령을 시뮬레이션하고 명령어 파싱 결과를 보여줍니다.

### 2. 수동 테스트

VS Code에서 확장을 설치한 후 다음 자연어 명령을 테스트합니다:

#### Git 플러그인:
- `@git 상태 보여줘`
- `@git 변경사항 확인해줘`
- `@git 커밋 메시지 만들어줘`
- `@git 브랜치 목록 보여줘`

#### Jira 플러그인:
- `@jira 이슈 목록 보여줘`
- `@jira 새 이슈 만들어줘`
- `@jira APE-123 이슈 상세 정보 보여줘`

#### SWDP 플러그인:
- `@swdp 빌드 상태 확인해줘`
- `@swdp 로컬 빌드 실행해줘`
- `@swdp 테스트 요청 생성해줘`

#### Pocket 플러그인:
- `@pocket 파일 목록 보여줘`
- `@pocket config.json 파일 내용 보여줘`
- `@pocket 리포트 파일 검색해줘`

## URL 변경 방법

내부망에서 사용할 수 있도록 URL을 변경하는 방법:

### 설정 파일에서 URL 변경

`settings.json` 파일에서 다음 항목을 내부망 환경에 맞게 업데이트합니다:

```json
{
  "llm": {
    "providers": [
      {
        "id": "openrouter",
        "name": "OpenRouter",
        "apiKey": "your-api-key",
        "apiUrl": "https://내부망-llm-서버-주소/api",
        "models": [
          {
            "id": "default-model",
            "name": "기본 모델"
          }
        ]
      }
    ]
  },
  "plugins": {
    "jira": {
      "enabled": true,
      "apiUrl": "https://내부망-jira-서버-주소/rest/api/2"
    },
    "swdp": {
      "enabled": true,
      "apiUrl": "https://내부망-swdp-서버-주소/api"
    },
    "pocket": {
      "enabled": true,
      "endpoint": "https://내부망-s3-서버-주소"
    }
  }
}
```

### 코드 직접 수정

필요한 경우 아래 파일에서 URL을 직접 수정할 수 있습니다:

- `src/core/llm/LlmService.ts` - LLM 서비스 URL
- `src/plugins/internal/jira/JiraClientService.ts` - Jira API URL
- `src/plugins/internal/swdp/SwdpClientService.ts` - SWDP API URL
- `src/plugins/internal/pocket/PocketClientService.ts` - S3 호환 스토리지 URL

## 주의사항

1. 내부망에서는 LLM 서비스에 접근이 가능해야 자연어 처리 기능이 작동합니다.
2. 서비스 URL이 올바르게 설정되어 있어야 합니다.
3. API 키와 인증 정보가 내부망 환경에 맞게 업데이트되어야 합니다.

## 문제 해결

문제가 발생할 경우 다음 로그 파일을 확인하세요:

- VS Code 로그: VS Code의 '출력' 패널에서 'APE' 또는 'VS Code 확장' 로그 확인
- 콘솔 로그: 개발자 도구의 콘솔 로그 확인 (VS Code에서 `Help > Toggle Developer Tools`)