/**
 * APE Extension 내부망 환경 변수 파일
 * 
 * 중요: 이 파일은 내부망 환경에서만 사용됩니다.
 * 외부망 테스트를 위해서는 extension.env.external.js 파일을 사용하세요.
 */

module.exports = {
  // 환경 모드 설정
  ENV_MODE: 'internal',
  
  // 내부망 API 설정
  INTERNAL_API_ENDPOINT: 'https://api-se-dev.narrans.samsungds.net/v1/chat/completions',
  INTERNAL_API_KEY: 'your_internal_api_key_here',
  
  // Llama 4 모델 API 엔드포인트 (내부망)
  LLAMA4_API_ENDPOINT: 'http://apigw-stg.samsungds.net:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
  LLAMA4_API_KEY: 'your_llama4_api_key_here',
  
  // 로깅 설정
  LOG_LEVEL: 'info',
  
  // 플러그인 설정 (내부망)
  GIT_INTEGRATION_ENABLED: 'true',
  JIRA_API_URL: 'https://internal-jira.samsungds.net',
  JIRA_API_TOKEN: 'your_jira_api_token_here',
  
  // 내부망 SWDP 설정
  SWDP_API_URL: 'http://internal-swdp:8001',
  SWDP_API_KEY: 'your_swdp_api_key_here'
};