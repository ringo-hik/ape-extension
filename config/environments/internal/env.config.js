/**
 * 내부망 환경 설정
 * 참고: 이 파일은 직접 로드되지 않습니다. 내부망 환경 설정의 레퍼런스 용도입니다.
 * 실제 설정은 루트의 extension.env.internal.js 파일을 사용하세요.
 */

module.exports = {
  // 환경 식별
  ENV_MODE: 'internal',
  INTERNAL_NETWORK: true,
  
  // 내부망 모델 환경 설정
  API_ENDPOINTS: {
    // NARRANS API 엔드포인트
    NARRANS_API: 'http://narrans.internal:8001/v1/chat/completions',
    
    // Llama 4 API 엔드포인트
    LLAMA4_MAVERICK_API: 'http://llama4.internal:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
    LLAMA4_SCOUT_API: 'http://llama4.internal:8000/llama4/1/llama/aiserving/llama-4/scout/v1/chat/completions',
    LLAMA4_API: 'http://llama4.internal:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
  },
  
  // API 키 설정 (실제 값은 입력하지 마세요)
  API_KEYS: {
    NARRANS_API_KEY: '',
    LLAMA4_API_KEY: '',
    LLAMA4_MAVERICK_API_KEY: '',
    LLAMA4_SCOUT_API_KEY: ''
  },
  
  // 모델 설정
  MODELS: {
    // 기본 모델
    DEFAULT_MODEL: 'narrans',
    
    // 내부망 모델 구성
    AVAILABLE_MODELS: [
      {
        id: 'narrans',
        name: 'NARRANS (Default)',
        provider: 'custom',
        apiUrl: 'http://narrans.internal:8001/v1/chat/completions',
        contextWindow: 10000,
        maxTokens: 10000,
        temperature: 0,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'llama-4-maverick',
        name: 'Llama 4 Maverick',
        provider: 'custom',
        apiUrl: 'http://llama4.internal:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
        contextWindow: 50000,
        maxTokens: 50000,
        temperature: 0,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'llama-4-scout',
        name: 'Llama 4 Scout',
        provider: 'custom',
        apiUrl: 'http://llama4.internal:8000/llama4/1/llama/aiserving/llama-4/scout/v1/chat/completions',
        contextWindow: 50000,
        maxTokens: 50000,
        temperature: 0,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      }
    ]
  },
  
  // 로컬 환경 설정 (localhost로 매핑)
  LOCAL_DEVELOPMENT: {
    ENABLED: true,
    ENDPOINTS: {
      NARRANS_API: 'http://localhost:8001/v1/chat/completions',
      LLAMA4_MAVERICK_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
      LLAMA4_SCOUT_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/scout/v1/chat/completions',
      LLAMA4_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions'
    }
  },
  
  // SSL 우회 설정 (내부망에서는 자체 서명 인증서 사용)
  FORCE_SSL_BYPASS: true,
  
  // 로깅 설정
  LOG_LEVEL: 'debug'
};