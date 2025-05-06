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
    LLAMA4_MAVERICK_API: 'mock://llama4.maverick.api/v1/chat/completions',
    LLAMA4_SCOUT_API: 'mock://llama4.scout.api/v1/chat/completions',
    LLAMA4_API: 'mock://llama4.api/v1/chat/completions',
    SWDP_API: 'mock://swdp.api/api',
    
    // Nexus Mock 엔드포인트
    NEXUS_REPOSITORY: 'mock://nexus.repository/npm-group/'
  },
  
  // API 키 설정
  API_KEYS: {
    // OpenRouter API 키 (사용자 설정에서 덮어씌워질 수 있음)
    OPENROUTER_API_KEY: ''
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
    
    // Llama4 응답 Mock (기본 호환성용)
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
    
    // Llama4 Maverick 응답 Mock
    LLAMA4_MAVERICK_RESPONSE: {
      id: 'mock-llama4-maverick-response',
      choices: [
        {
          message: {
            content: "이것은 Llama4 Maverick API의 Mock 응답입니다. 실제 내부망 환경에서는 실제 API에 연결됩니다."
          },
          finish_reason: "stop"
        }
      ]
    },
    
    // Llama4 Scout 응답 Mock
    LLAMA4_SCOUT_RESPONSE: {
      id: 'mock-llama4-scout-response',
      choices: [
        {
          message: {
            content: "이것은 Llama4 Scout API의 Mock 응답입니다. 실제 내부망 환경에서는 실제 API에 연결됩니다."
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
        temperature: 0.7,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'qwen3-30b-a3b',
        name: 'Qwen 3 30B A3B',
        provider: 'openrouter',
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'qwen/qwen3-30b-a3b',
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
        id: 'gpt-4-1-mini',
        name: 'OpenAI GPT-4.1-mini',
        provider: 'openrouter',
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'openai/gpt-4.1-mini',
        contextWindow: 128000,
        maxTokens: 8192,
        temperature: 0.7,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      
      // Mock 내부망 모델 (외부망에서 테스트용)
      {
        id: 'narrans-mock',
        name: 'NARRANS (Mock)',
        provider: 'mock',
        apiUrl: 'mock://narrans.api/v1/chat/completions',
        contextWindow: 10000,
        maxTokens: 10000,
        temperature: 0,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'llama-4-maverick-mock',
        name: 'Llama 4 Maverick (Mock)',
        provider: 'mock',
        apiUrl: 'mock://llama4.maverick.api/v1/chat/completions',
        contextWindow: 50000,
        maxTokens: 50000,
        temperature: 0,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'llama-4-scout-mock',
        name: 'Llama 4 Scout (Mock)',
        provider: 'mock',
        apiUrl: 'mock://llama4.scout.api/v1/chat/completions',
        contextWindow: 28000,
        maxTokens: 28000,
        temperature: 0,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'llama-4-mock',
        name: 'Llama 4 (Mock - Legacy)',
        provider: 'mock',
        apiUrl: 'mock://llama4.api/v1/chat/completions',
        contextWindow: 50000,
        maxTokens: 50000,
        temperature: 0,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      }
    ]
  },
  
  // 플러그인 설정
  PLUGINS: {
    // 활성화할 플러그인 목록
    ENABLED: ['git', 'jira', 'mock-swdp', 'mock-pocket'],
    
    // 플러그인별 설정
    PLUGIN_CONFIG: {
      // SWDP Mock 플러그인 설정
      'swdp': {
        baseUrl: 'mock://swdp.api',
        mockEnabled: true,
        enabled: false,
        defaultProject: "",
        mockResponses: {
          getProject: { id: 'mock-project-1', name: 'Mock Project 1' },
          getComponents: ['component1', 'component2', 'component3'],
          getUsers: ['user1', 'user2', 'user3']
        }
      },
      
      // Pocket Mock 플러그인 설정
      'pocket': {
        baseUrl: 'mock://pocket.api',
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
      },
      
      // Git 플러그인 설정
      'git': {
        enabled: true,
        useLocalGit: true,
        autoCommitMessage: true,
        defaultBranch: "master",
        commitMessageTemplate: "{{type}}: {{subject}}\n\n{{body}}"
      },
      
      // Jira Mock 플러그인 설정
      'jira': {
        baseUrl: 'mock://jira.api',
        mockEnabled: true,
        enabled: true
      }
    }
  },
  
  // UI 설정
  UI: {
    // UI 모드 (standard, minimal, advanced)
    MODE: 'standard',
    
    // 로고 경로
    LOGO_PATH: 'resources/icon/ape_final.svg',
    
    // 테마 설정
    THEME: {
      // 테마 모드 (system, light, dark)
      MODE: 'system',
      
      // 커스텀 색상 (필요한 경우)
      COLORS: {
        // 기본 색상
        PRIMARY: '#0078d4',
        SECONDARY: '#2b88d8',
        
        // 텍스트 색상
        TEXT_PRIMARY: '#333333',
        TEXT_SECONDARY: '#666666',
        
        // 배경 색상
        BACKGROUND_PRIMARY: '#ffffff',
        BACKGROUND_SECONDARY: '#f5f5f5'
      }
    }
  },
  
  // 코어 설정
  CORE: {
    // SSL 인증서 검증 우회 설정
    SSL_BYPASS: false,
    
    // 로그 레벨 (debug, info, warn, error)
    LOG_LEVEL: 'info',
    
    // 권한 설정
    ALLOW: {
      ALL: true,
      SSL_BYPASS: false,
      FILE_SYSTEM: true,
      NETWORK: true,
      TERMINAL: true,
      CLIPBOARD: true,
      NOTIFICATIONS: true
    }
  }
};