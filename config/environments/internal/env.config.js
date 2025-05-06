/**
 * 내부망 환경 설정 파일
 * 내부망 환경에서 APE 확장 프로그램의 동작을 구성합니다.
 */

module.exports = {
  // 내부망 식별자 (true로 설정하면 내부망 모드로 동작)
  INTERNAL_NETWORK: true,
  
  // SSL 인증서 검증 우회 설정
  FORCE_SSL_BYPASS: true,
  
  // API 엔드포인트 설정
  API_ENDPOINTS: {
    // NARRANS LLM API
    NARRANS_API: 'http://localhost:8001/v1/chat/completions',
    
    // Llama 4 LLM API
    LLAMA4_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
    
    // SWDP API
    SWDP_API: 'http://localhost:8002/api',
    
    // Nexus 패키지 저장소
    NEXUS_REPOSITORY: 'http://localhost:8081/repository/npm-group/'
  },
  
  // 넥서스 설정
  NEXUS: {
    // 넥서스 저장소 URL
    URL: 'http://localhost:8081/repository/npm-group/',
    
    // 인증 정보 (필요한 경우)
    AUTH: {
      username: '',
      password: ''
    }
  },
  
  // 로깅 설정
  LOGGING: {
    LEVEL: 'debug',
    LOG_TO_FILE: true,
    FILE_PATH: './logs/ape-internal.log'
  },
  
  // 모델 설정
  MODELS: {
    // 기본 모델 ID
    DEFAULT_MODEL: 'narrans',
    
    // 내부망 모델 구성
    AVAILABLE_MODELS: [
      {
        id: 'narrans',
        name: 'NARRANS (Default)',
        provider: 'custom',
        apiUrl: 'http://localhost:8001/v1/chat/completions',
        contextWindow: 10000,
        maxTokens: 10000,
        temperature: 0
      },
      {
        id: 'llama-4-maverick',
        name: 'Llama 4 Maverick',
        provider: 'custom',
        apiUrl: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
        contextWindow: 50000,
        maxTokens: 50000,
        temperature: 0
      }
    ]
  },
  
  // 플러그인 설정
  PLUGINS: {
    // 활성화할 플러그인 목록
    ENABLED: ['git', 'jira', 'swdp', 'pocket']
  }
};