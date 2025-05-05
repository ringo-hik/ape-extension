/**
 * APE Extension 환경 변수 예제 파일
 * 사용 시 extension.env.js로 복사하고 실제 값으로 수정하세요
 * extension.env.js 파일은 .gitignore에 추가하여 저장소에 커밋되지 않도록 해야 합니다
 */

module.exports = {
  // OpenRouter API 키
  OPENROUTER_API_KEY: 'your_openrouter_api_key_here',
  
  // 내부망 API 설정
  INTERNAL_API_ENDPOINT: 'https://internal-llm-api.example.com',
  INTERNAL_API_KEY: 'your_internal_api_key_here',
  
  // 환경 모드 설정
  ENV_MODE: 'development', // development, production
  
  // 로깅 설정
  LOG_LEVEL: 'info', // debug, info, warning, error
  
  // 기타 플러그인 설정
  GIT_INTEGRATION_ENABLED: 'true',
  JIRA_API_URL: 'https://your-jira-instance.atlassian.net',
  JIRA_API_TOKEN: 'your_jira_api_token_here'
};
