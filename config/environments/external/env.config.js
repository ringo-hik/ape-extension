/**
 * 외부망 환경 설정
 * 참고: 이 파일은 직접 로드되지 않습니다. 외부망 환경 설정의 레퍼런스 용도입니다.
 * 실제 설정은 루트의 extension.env.external.js 파일을 사용하세요.
 */

module.exports = {
  // 환경 식별
  ENV_MODE: 'external',
  EXTERNAL_NETWORK: true,
  
  // 외부망 모델 환경 설정
  API_ENDPOINTS: {
    // OpenRouter API 엔드포인트
    OPENROUTER_API: 'https://openrouter.ai/api/v1/chat/completions'
  },
  
  // API 키 설정 (실제 값은 입력하지 마세요)
  API_KEYS: {
    OPENROUTER_API_KEY: ''
  },
  
  // 모델 설정
  MODELS: {
    // 기본 모델
    DEFAULT_MODEL: 'gemini-2.5-flash',
    
    // 외부망 모델 구성 (OpenRouter 기반)
    AVAILABLE_MODELS: [
      {
        id: 'gemini-2.5-flash',
        name: 'Google Gemini 2.5 Flash',
        provider: 'openrouter',
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'google/gemini-2.5-flash-preview',
        contextWindow: 32000,
        maxTokens: 8192,
        temperature: 0.7,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'phi-4-reasoning-plus',
        name: 'Microsoft Phi-4 Reasoning Plus',
        provider: 'openrouter',
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'microsoft/phi-4-reasoning-plus',
        contextWindow: 32000,
        maxTokens: 8192,
        temperature: 0.7,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Anthropic Claude 3.5 Sonnet',
        provider: 'openrouter',
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'anthropic/claude-3-5-sonnet',
        contextWindow: 200000,
        maxTokens: 4096,
        temperature: 0.7,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      }
    ]
  },
  
  // Mock 데이터 사용 설정 (외부망에서는 내부망 서비스 Mock 사용)
  USE_MOCK_DATA: true,
  
  // SSL 우회 설정 (외부망에서는 필요 없음)
  FORCE_SSL_BYPASS: false,
  
  // 로깅 설정
  LOG_LEVEL: 'info',
  
  // 모델 ID 환경별 매핑 (내부망 모델 → 외부망 모델)
  MODEL_MAPPING: {
    'narrans': 'claude-3-5-sonnet',
    'llama-4-maverick': 'gemini-2.5-flash',
    'llama-4-scout': 'phi-4-reasoning-plus'
  },
  
  // OpenRouter 설정
  OPENROUTER_SETTINGS: {
    HTTP_REFERER: 'https://github.com/user/ape-extension',
    X_TITLE: 'APE Extension'
  }
};