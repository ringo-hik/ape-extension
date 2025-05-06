/**
 * 외부망 환경 설정 파일
 * 외부망(인터넷) 환경에서 APE 확장 프로그램의 동작을 구성합니다.
 * 내부망 서비스에 대해서는 Mock 데이터를 사용합니다.
 */

module.exports = {
  // 환경 식별자
  INTERNAL_NETWORK: false,
  EXTERNAL_NETWORK: true,
  
  // SSL 인증서 검증 우회 설정
  FORCE_SSL_BYPASS: false,
  
  // Mock 모드 활성화 (외부망에서 내부망 서비스 접근 시 Mock 데이터 사용)
  USE_MOCK_DATA: true,
  
  // API 엔드포인트 설정
  API_ENDPOINTS: {
    // OpenRouter LLM API (외부망 LLM)
    OPENROUTER_API: 'https://openrouter.ai/api/v1/chat/completions',
    
    // 내부망 Mock API 엔드포인트 (외부망에서 테스트용)
    NARRANS_API: 'mock://narrans.api/v1/chat/completions',
    LLAMA4_API: 'mock://llama4.api/v1/chat/completions',
    SWDP_API: 'mock://swdp.api/api',
    
    // Nexus Mock 엔드포인트
    NEXUS_REPOSITORY: 'mock://nexus.repository/npm-group/'
  },
  
  // Mock 데이터 설정
  MOCK_DATA: {
    // 내부망 LLM 응답 Mock
    NARRANS_RESPONSE: {
      id: 'mock-narrans-response',
      choices: [
        {
          message: {
            content: "이것은 NARRANS API의 Mock 응답입니다. 실제 내부망 환경에서는 실제 API에 연결됩니다."
          },
          finish_reason: "stop"
        }
      ]
    },
    
    // Llama4 응답 Mock
    LLAMA4_RESPONSE: {
      id: 'mock-llama4-response',
      choices: [
        {
          message: {
            content: "이것은 Llama4 API의 Mock 응답입니다. 실제 내부망 환경에서는 실제 API에 연결됩니다."
          },
          finish_reason: "stop"
        }
      ]
    },
    
    // SWDP 응답 Mock
    SWDP_RESPONSE: {
      success: true,
      data: {
        project: "mock-project",
        components: ["component1", "component2"],
        message: "이것은 SWDP API의 Mock 응답입니다. 실제 내부망 환경에서는 실제 API에 연결됩니다."
      }
    }
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
      },
      
      // Mock 내부망 모델 (외부망에서 테스트용)
      {
        id: 'narrans-mock',
        name: 'NARRANS (Mock)',
        provider: 'mock',
        apiUrl: 'mock://narrans.api/v1/chat/completions',
        contextWindow: 10000,
        maxTokens: 10000,
        temperature: 0
      },
      {
        id: 'llama-4-mock',
        name: 'Llama 4 (Mock)',
        provider: 'mock',
        apiUrl: 'mock://llama4.api/v1/chat/completions',
        contextWindow: 50000,
        maxTokens: 50000,
        temperature: 0
      }
    ]
  },
  
  // 플러그인 설정
  PLUGINS: {
    // 활성화할 플러그인 목록
    ENABLED: ['git', 'jira', 'mock-swdp', 'mock-pocket'],
    
    // Mock 플러그인 설정
    MOCK_PLUGINS: {
      'swdp': {
        mockEnabled: true,
        mockResponses: {
          getProject: { id: 'mock-project-1', name: 'Mock Project 1' },
          getComponents: ['component1', 'component2', 'component3'],
          getUsers: ['user1', 'user2', 'user3']
        }
      },
      'pocket': {
        mockEnabled: true,
        mockResponses: {
          listFiles: [
            { name: 'document1.md', size: 1024, lastModified: '2025-05-01' },
            { name: 'document2.md', size: 2048, lastModified: '2025-05-02' },
            { name: 'presentation1.pptx', size: 10240, lastModified: '2025-05-03' }
          ],
          searchFiles: [
            { name: 'searchResult1.md', size: 1024, lastModified: '2025-05-01' },
            { name: 'searchResult2.md', size: 2048, lastModified: '2025-05-02' }
          ]
        }
      }
    }
  }
};