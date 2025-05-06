/**
 * 외부망 환경 설정 파일
 * 외부망(인터넷) 환경에서 APE 확장 프로그램의 동작을 구성합니다.
 */

module.exports = {
  // 내부망 식별자 (false로 설정하면 외부망 모드로 동작)
  INTERNAL_NETWORK: false,
  
  // SSL 인증서 검증 우회 설정
  FORCE_SSL_BYPASS: false,
  
  // API 엔드포인트 설정
  API_ENDPOINTS: {
    // OpenRouter LLM API
    OPENROUTER_API: 'https://openrouter.ai/api/v1/chat/completions'
  },
  
  // 로깅 설정
  LOGGING: {
    LEVEL: 'info',
    LOG_TO_FILE: false
  },
  
  // 모델 설정
  MODELS: {
    // 기본 모델 ID
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
        temperature: 0.7
      },
      {
        id: 'qwen3-30b-a3b',
        name: 'Qwen 3 30B A3B',
        provider: 'openrouter',
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'qwen/qwen3-30b-a3b',
        contextWindow: 32000,
        maxTokens: 8192,
        temperature: 0.7
      },
      {
        id: 'phi-4-reasoning-plus',
        name: 'Microsoft Phi-4 Reasoning Plus',
        provider: 'openrouter',
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'microsoft/phi-4-reasoning-plus',
        contextWindow: 32000,
        maxTokens: 8192,
        temperature: 0.7
      }
    ]
  },
  
  // 플러그인 설정
  PLUGINS: {
    // 활성화할 플러그인 목록
    ENABLED: ['git', 'jira']
  }
};