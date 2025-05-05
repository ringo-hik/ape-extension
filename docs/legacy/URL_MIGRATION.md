# URL 마이그레이션 가이드

이 문서는 APE 확장을 외부망에서 내부망으로 마이그레이션하기 위한 URL 변경 절차를 설명합니다.

## 설정 파일 업데이트

내부망 환경에서는 아래 설정 파일에서 URL을 업데이트하여 사용할 수 있습니다.

### 1. settings.json 파일

이 파일은 확장의 루트 디렉토리에 위치합니다. 다음 항목을 내부망 환경에 맞게 수정하세요:

```json
{
  "llm": {
    "providers": [
      {
        "id": "openrouter",
        "name": "OpenRouter",
        "apiKey": "your-api-key",
        "apiUrl": "https://내부망-llm-서버-주소/api", // 이 부분 수정
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
      "apiUrl": "https://내부망-jira-서버-주소/rest/api/2" // 이 부분 수정
    },
    "swdp": {
      "enabled": true,
      "apiUrl": "https://내부망-swdp-서버-주소/api" // 이 부분 수정
    },
    "pocket": {
      "enabled": true,
      "endpoint": "https://내부망-s3-서버-주소" // 이 부분 수정
    }
  }
}
```

## 내부망 URL 목록

다음은 일반적으로 변경해야 할 URL 목록입니다. 내부망 환경에 맞게 업데이트하세요:

| 서비스 | 외부망 URL (예시) | 내부망 URL (예시) |
|-------|----------------|----------------|
| LLM API | https://openrouter.ai/api | https://내부망-llm-서버-주소/api |
| Jira API | https://your-domain.atlassian.net/rest/api/2 | https://내부망-jira-서버/rest/api/2 |
| SWDP API | https://swdp-api.external.com/api | https://내부망-swdp-서버/api |
| S3 스토리지 | https://s3.amazonaws.com | https://내부망-s3-서버 |

## 내부망 연결 테스트

URL을 변경한 후 연결을 테스트하려면:

1. VS Code에서 확장을 설치합니다.
2. 다음 명령어를 실행하여 각 서비스 연결을 확인합니다:
   - `/test:llm` - LLM 서비스 연결 테스트
   - `/test:jira` - Jira 연결 테스트 
   - `/test:swdp` - SWDP 연결 테스트
   - `/test:pocket` - S3 호환 스토리지 연결 테스트

## 내부망 SSL 인증서 문제 해결

내부망에서 자체 서명된 SSL 인증서를 사용하는 경우:

1. `src/core/utils/SSLBypassService.ts` 파일에서 SSL 인증서 검증을 우회하는 설정이 활성화되어 있는지 확인합니다.
2. Node.js 환경 변수 `NODE_TLS_REJECT_UNAUTHORIZED=0`를 설정하여 인증서 검증을 비활성화할 수 있습니다.

## 주의사항

1. API 키와 인증 정보는 보안을 위해 환경 변수나 내부망 시스템에 적절히 보관하세요.
2. 내부망 URL로 변경 후에는 보안을 위해 외부망에 대한 호출이 없는지 확인하세요.
3. 내부망 방화벽 정책에 따라 필요한 포트가 열려 있는지 확인하세요.