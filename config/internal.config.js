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
    LLAMA4_MAVERICK_API: 'http://llama4.internal:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
    LLAMA4_SCOUT_API: 'http://llama4.internal:8000/llama4/1/llama/aiserving/llama-4/scout/v1/chat/completions',
    
    // 이전 버전 호환성을 위한 LLAMA4_API
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
      LLAMA4_MAVERICK_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
      LLAMA4_SCOUT_API: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/scout/v1/chat/completions',
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
      },
      {
        id: 'narrans-local',
        name: 'NARRANS (로컬)',
        provider: 'custom',
        apiUrl: 'http://localhost:8001/v1/chat/completions',
        contextWindow: 10000,
        maxTokens: 10000,
        temperature: 0,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'llama-4-maverick-local',
        name: 'Llama 4 Maverick (로컬)',
        provider: 'custom',
        apiUrl: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
        contextWindow: 50000,
        maxTokens: 50000,
        temperature: 0,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'llama-4-scout-local',
        name: 'Llama 4 Scout (로컬)',
        provider: 'custom',
        apiUrl: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/scout/v1/chat/completions',
        contextWindow: 50000,
        maxTokens: 50000,
        temperature: 0,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
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
        timeout: 30000,
        enabled: true,
        defaultProject: ""
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
      },
      
      // Git 플러그인 설정
      'git': {
        enabled: true,
        useLocalGit: true,
        autoCommitMessage: true,
        defaultBranch: "master",
        commitMessageTemplate: "{{type}}: {{subject}}\n\n{{body}}"
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
    SSL_BYPASS: true,
    
    // 로그 레벨 (debug, info, warn, error)
    LOG_LEVEL: 'info',
    
    // 권한 설정
    ALLOW: {
      ALL: true,
      SSL_BYPASS: true,
      FILE_SYSTEM: true,
      NETWORK: true,
      TERMINAL: true,
      CLIPBOARD: true,
      NOTIFICATIONS: true
    }
  }
};