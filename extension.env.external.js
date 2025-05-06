/**
 * APE Extension 외부망 환경 변수 파일
 * 
 * 중요: 이 파일은 외부망 환경에서만 사용됩니다.
 * 내부망 테스트를 위해서는 extension.env.internal.js 파일을 사용하세요.
 */

module.exports = {
  // 환경 모드 설정
  ENV_MODE: 'external',
  
  // OpenRouter API 키 (외부망 테스트용)
  OPENROUTER_API_KEY: 'your_openrouter_api_key_here',
  
  // 로깅 설정
  LOG_LEVEL: 'info',
  
  // 플러그인 설정 (외부망 - 모킹 서비스 사용)
  GIT_INTEGRATION_ENABLED: 'true',
  
  // 외부망 모킹 서비스 URL
  MOCK_SERVICE_URL: 'http://localhost:3000',
  
  // 내부망 서비스가 필요한 경우 모킹 데이터 사용
  MOCK_SWDP_ENABLED: 'true',
  MOCK_JIRA_ENABLED: 'true'
};