/**
 * APE Extension 통합 환경 설정
 * 내부망/외부망 환경을 통합하여 관리하는 설정 파일
 */

module.exports = {
  // 환경 감지 및 설정
  ENV_DETECTION: {
    // 환경 감지 방법: 'auto' 또는 'manual'
    DETECTION_MODE: 'auto',
    
    // 수동 설정 (DETECTION_MODE가 'manual'일 때 사용)
    MANUAL_ENV: 'external',
    
    // 환경 자동 감지를 위한 엔드포인트 체크 설정
    AUTO_DETECTION: {
      // 내부망 감지 엔드포인트 (핑 테스트용)
      INTERNAL_CHECK_URL: 'http://narrans.internal:8001/health',
      
      // 요청 타임아웃 (밀리초)
      TIMEOUT_MS: 2000,
      
      // 재시도 횟수
      RETRY_COUNT: 1
    }
  },
  
  // 환경별 API 엔드포인트
  API_ENDPOINTS: {
    // 내부망 엔드포인트
    INTERNAL: {
      NARRANS_API: 'http://narrans.internal:8001/v1/chat/completions',
      LLAMA4_MAVERICK_API: 'http://llama4.internal:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
      LLAMA4_SCOUT_API: 'http://llama4.internal:8000/llama4/1/llama/aiserving/llama-4/scout/v1/chat/completions',
      LLAMA4_API: 'http://llama4.internal:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions'
    },
    
    // 외부망 엔드포인트
    EXTERNAL: {
      OPENROUTER_API: 'https://openrouter.ai/api/v1/chat/completions'
    },
    
    // 로컬 개발 엔드포인트 (localhost로 매핑)
    LOCAL: {
      NARRANS_API: 'http://localhost:8001/v1/chat/completions',
      LLAMA4_MAVERICK_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
      LLAMA4_SCOUT_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/scout/v1/chat/completions',
      LLAMA4_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions'
    }
  },
  
  // API 키 설정
  API_KEYS: {
    // 내부망 API 키
    INTERNAL: {
      NARRANS_API_KEY: '',
      LLAMA4_API_KEY: '',
      LLAMA4_MAVERICK_API_KEY: '',
      LLAMA4_SCOUT_API_KEY: ''
    },
    
    // 외부망 API 키
    EXTERNAL: {
      OPENROUTER_API_KEY: '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'
    }
  },
  
  // 모델 설정
  MODELS: {
    // 환경별 기본 모델
    DEFAULT_MODEL: {
      INTERNAL: 'narrans',
      EXTERNAL: 'gemini-2.5-flash'
    },
    
    // 내부망 모델 구성
    INTERNAL_MODELS: [
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
    ],
    
    // 외부망 모델 구성 (OpenRouter 기반)
    EXTERNAL_MODELS: [
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
    ],
    
    // 모델 ID 환경별 매핑 (내부망 모델 → 외부망 모델)
    MODEL_MAPPING: {
      'narrans': 'claude-3-5-sonnet',
      'llama-4-maverick': 'gemini-2.5-flash',
      'llama-4-scout': 'phi-4-reasoning-plus'
    }
  },
  
  // 환경별 설정
  ENVIRONMENT_SETTINGS: {
    // 내부망 설정
    INTERNAL: {
      // SSL 우회 설정 (내부망에서는 자체 서명 인증서 사용)
      FORCE_SSL_BYPASS: true,
      
      // 로깅 설정
      LOG_LEVEL: 'debug',
      
      // 로컬 개발 모드 활성화
      LOCAL_DEV_MODE: true
    },
    
    // 외부망 설정
    EXTERNAL: {
      // Mock 데이터 사용 설정 (외부망에서는 내부망 서비스 Mock 사용)
      USE_MOCK_DATA: true,
      
      // SSL 우회 설정 (외부망에서는 필요 없음)
      FORCE_SSL_BYPASS: false,
      
      // 로깅 설정
      LOG_LEVEL: 'info',
      
      // OpenRouter 설정
      OPENROUTER_SETTINGS: {
        HTTP_REFERER: 'https://github.com/user/ape-extension',
        X_TITLE: 'APE Extension'
      }
    }
  }
};