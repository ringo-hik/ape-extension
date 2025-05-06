/**
 * 내부망 환경 설정 파일
 * 내부망 환경에서 APE 확장 프로그램의 동작을 구성합니다.
 * 실제 내부망 서비스에 연결합니다.
 */

module.exports = {
  // 환경 식별자
  INTERNAL_NETWORK: true,
  EXTERNAL_NETWORK: false,
  
  // SSL 인증서 검증 우회 설정
  FORCE_SSL_BYPASS: true,
  
  // Mock 모드 비활성화 (내부망에서는 실제 서비스 사용)
  USE_MOCK_DATA: false,
  
  // API 엔드포인트 설정
  API_ENDPOINTS: {
    // 내부망 LLM API 엔드포인트
    NARRANS_API: 'http://narrans.internal:8001/v1/chat/completions',
    LLAMA4_API: 'http://llama4.internal:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
    
    // SWDP API 엔드포인트
    SWDP_API: 'http://swdp.internal:8002/api',
    
    // Nexus 패키지 저장소
    NEXUS_REPOSITORY: 'http://nexus.internal:8081/repository/npm-group/'
  },
  
  // 넥서스 설정
  NEXUS: {
    // 넥서스 저장소 URL
    URL: 'http://nexus.internal:8081/repository/npm-group/',
    
    // 인증 정보 (필요한 경우)
    AUTH: {
      username: '',
      password: ''
    }
  },
  
  // 로컬 개발 설정 (localhost로 매핑된 내부망 서비스)
  LOCAL_DEVELOPMENT: {
    // 로컬 개발 모드 활성화 여부
    ENABLED: true,
    
    // 로컬 매핑 엔드포인트
    ENDPOINTS: {
      NARRANS_API: 'http://localhost:8001/v1/chat/completions',
      LLAMA4_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
      SWDP_API: 'http://localhost:8002/api',
      NEXUS_REPOSITORY: 'http://localhost:8081/repository/npm-group/'
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
        name: 'NARRANS (기본)',
        provider: 'custom',
        apiUrl: 'http://narrans.internal:8001/v1/chat/completions',
        contextWindow: 10000,
        maxTokens: 10000,
        temperature: 0
      },
      {
        id: 'llama-4-maverick',
        name: 'Llama 4 Maverick',
        provider: 'custom',
        apiUrl: 'http://llama4.internal:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
        contextWindow: 50000,
        maxTokens: 50000,
        temperature: 0
      },
      {
        id: 'narrans-local',
        name: 'NARRANS (로컬)',
        provider: 'custom',
        apiUrl: 'http://localhost:8001/v1/chat/completions',
        contextWindow: 10000,
        maxTokens: 10000,
        temperature: 0
      },
      {
        id: 'llama-4-local',
        name: 'Llama 4 (로컬)',
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
    ENABLED: ['git', 'jira', 'swdp', 'pocket'],
    
    // 플러그인별 설정
    PLUGIN_CONFIG: {
      // SWDP 플러그인 설정
      'swdp': {
        baseUrl: 'http://swdp.internal:8002',
        localUrl: 'http://localhost:8002',
        useLocalUrl: true,
        timeout: 30000
      },
      
      // Pocket 플러그인 설정
      'pocket': {
        baseUrl: 'http://pocket.internal:8003',
        localUrl: 'http://localhost:8003',
        useLocalUrl: true,
        timeout: 30000
      },
      
      // Jira 플러그인 설정
      'jira': {
        baseUrl: 'http://jira.internal:8004',
        localUrl: 'http://localhost:8004',
        useLocalUrl: true,
        timeout: 30000
      }
    }
  }
};