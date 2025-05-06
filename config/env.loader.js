/**
 * 환경 설정 로더
 * 내부망/외부망 환경에 따라 적절한 설정 파일을 로드하는 유틸리티
 * 외부망에서 Mock 데이터를 사용하도록 지원
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const dns = require('dns');

/**
 * 환경 설정 로더 클래스
 */
class EnvLoader {
  constructor() {
    // 환경 설정 경로
    this.configDir = __dirname;
    
    // 내부망/외부망 설정 경로
    this.internalConfigPath = path.join(this.configDir, 'internal.config.js');
    this.externalConfigPath = path.join(this.configDir, 'external.config.js');
    
    // 설정 파일 경로
    this.internalSettingsPath = path.join(this.configDir, 'internal.settings.json');
    this.externalSettingsPath = path.join(this.configDir, 'external.settings.json');
    
    // 사용자 환경 설정 파일 (우선순위가 가장 높음)
    this.userConfigPath = path.join(process.cwd(), 'extension.env.js');
    
    // hosts 파일 경로
    this.hostsFilePath = os.platform() === 'win32' ? 
      'C:\\Windows\\System32\\drivers\\etc\\hosts' : 
      '/etc/hosts';
    
    // 설정 캐시
    this.configCache = null;
    this.settingsCache = null;
    
    // 내부망 테스트 완료 여부
    this.internalNetworkDetected = null;
  }
  
  /**
   * 현재 환경이 내부망인지 감지
   * - Windows 환경일 경우 내부망 가능성 높음
   * - 특정 도메인 접근 가능성 체크
   * - hosts 파일에 내부망 도메인 존재 여부 확인
   * - 명시적 플래그 확인
   */
  detectInternalNetwork() {
    try {
      // 이미 테스트했으면 캐시된 결과 반환
      if (this.internalNetworkDetected !== null) {
        return this.internalNetworkDetected;
      }
      
      // 1. 명시적 환경 변수 확인
      if (process.env.APE_INTERNAL_NETWORK === 'true') {
        this.internalNetworkDetected = true;
        return true;
      } else if (process.env.APE_INTERNAL_NETWORK === 'false') {
        this.internalNetworkDetected = false;
        return false;
      }
      
      // 2. 사용자 설정 파일 확인
      if (fs.existsSync(this.userConfigPath)) {
        try {
          const userConfig = require(this.userConfigPath);
          if (typeof userConfig.INTERNAL_NETWORK === 'boolean') {
            this.internalNetworkDetected = userConfig.INTERNAL_NETWORK;
            return userConfig.INTERNAL_NETWORK;
          }
        } catch (e) {
          console.warn('사용자 설정 파일을 읽는 중 오류 발생:', e);
        }
      }
      
      // 3. OS 타입 확인 (Windows는 내부망 가능성 높음)
      const isWindows = os.platform() === 'win32';
      if (isWindows) {
        console.log('[환경 감지] Windows 환경 감지됨, 내부망 가능성 높음');
      }
      
      // 4. hosts 파일에 내부망 도메인 존재 여부 확인
      try {
        if (fs.existsSync(this.hostsFilePath)) {
          const hostsContent = fs.readFileSync(this.hostsFilePath, 'utf8');
          const internalDomainPatterns = [
            'narrans.internal',
            'llama4.internal',
            'swdp.internal',
            'pocket.internal',
            'jira.internal',
            'nexus.internal'
          ];
          
          // 내부망 도메인이 hosts 파일에 있는지 확인
          const hostsHasInternalDomains = internalDomainPatterns.some(domain => 
            hostsContent.includes(domain));
          
          if (hostsHasInternalDomains) {
            console.log('[환경 감지] hosts 파일에서 내부망 도메인 발견');
            this.internalNetworkDetected = true;
            return true;
          }
        }
      } catch (hostsError) {
        console.warn('[환경 감지] hosts 파일 확인 중 오류:', hostsError);
      }
      
      // 5. 내부망 서비스 접근 시도 (localhost 포트 확인)
      // 여기에서는 간단한 구현만 포함
      const localPorts = [8001, 8000, 8002, 8003, 8004, 8081];
      let internalServicesAvailable = false;
      
      // TODO: TCP 연결 테스트 로직 필요 (실제 구현 필요)
      // localPorts.forEach(port => {
      //   // TCP 연결 테스트
      // });
      
      if (internalServicesAvailable) {
        console.log('[환경 감지] 내부망 서비스 포트 접근 가능');
        this.internalNetworkDetected = true;
        return true;
      }
      
      // 6. 기본값 - Windows는 내부망으로, 나머지는 외부망으로 간주
      const defaultValue = isWindows;
      
      this.internalNetworkDetected = defaultValue;
      console.log(`[환경 감지] 기본값으로 ${defaultValue ? '내부망' : '외부망'} 환경으로 설정`);
      return defaultValue;
    } catch (error) {
      console.error('[환경 감지] 내부망 감지 중 오류 발생:', error);
      this.internalNetworkDetected = false;
      return false; // 오류 발생 시 기본값으로 외부망 사용
    }
  }
  
  /**
   * 설정 로드
   * 우선순위: 
   * 1. 사용자 정의 설정 (extension.env.js)
   * 2. 환경 감지에 따른 내부망/외부망 설정
   */
  loadConfig() {
    // 캐시된 설정이 있으면 반환
    if (this.configCache) {
      return this.configCache;
    }
    
    // 기본 설정 객체
    let config = {};
    
    // 내부망 여부 감지
    const isInternalNetwork = this.detectInternalNetwork();
    
    try {
      // 내부망/외부망에 따른 기본 설정 로드
      const configPath = isInternalNetwork ? this.internalConfigPath : this.externalConfigPath;
      
      if (fs.existsSync(configPath)) {
        try {
          const envConfig = require(configPath);
          config = { ...config, ...envConfig };
          console.log(`[환경 설정] ${isInternalNetwork ? '내부망' : '외부망'} 설정 로드됨: ${configPath}`);
          
          // 내부망/외부망 플래그 설정
          config.INTERNAL_NETWORK = isInternalNetwork;
          config.EXTERNAL_NETWORK = !isInternalNetwork;
          
          // 외부망에서는 Mock 사용 플래그 설정
          if (!isInternalNetwork) {
            config.USE_MOCK_DATA = config.USE_MOCK_DATA !== undefined ? config.USE_MOCK_DATA : true;
          } else {
            config.USE_MOCK_DATA = config.USE_MOCK_DATA !== undefined ? config.USE_MOCK_DATA : false;
          }
        } catch (e) {
          console.error(`[환경 설정] ${configPath} 로드 중 오류 발생:`, e);
        }
      } else {
        console.warn(`[환경 설정] ${configPath} 파일을 찾을 수 없습니다.`);
      }
      
      // 사용자 정의 설정 로드 (최우선)
      if (fs.existsSync(this.userConfigPath)) {
        try {
          const userConfig = require(this.userConfigPath);
          
          // 특정 환경변수만 추출하여 적용 (전체 덮어쓰기X)
          const userSettings = {};
          
          // 사용자 설정 키 목록
          const userSettingKeys = [
            'INTERNAL_NETWORK',
            'EXTERNAL_NETWORK',
            'USE_MOCK_DATA',
            'FORCE_SSL_BYPASS',
            'NARRANS_API_ENDPOINT',
            'LLAMA4_API_ENDPOINT',
            'LLAMA4_MAVERICK_API_ENDPOINT',
            'LLAMA4_SCOUT_API_ENDPOINT',
            'SWDP_API_ENDPOINT',
            'NEXUS_URL',
            'OPENROUTER_API_KEY',
            'LOG_LEVEL',
            'ENV_MODE'
          ];
          
          // 사용자 설정 키만 추출
          for (const key of userSettingKeys) {
            if (userConfig[key] !== undefined) {
              userSettings[key] = userConfig[key];
            }
          }
          
          // 사용자 설정 적용
          config = { ...config, ...userSettings };
          
          // 사용자 지정 API 엔드포인트 처리
          if (userConfig.NARRANS_API_ENDPOINT) {
            config.API_ENDPOINTS = config.API_ENDPOINTS || {};
            config.API_ENDPOINTS.NARRANS_API = userConfig.NARRANS_API_ENDPOINT;
          }
          
          if (userConfig.LLAMA4_API_ENDPOINT) {
            config.API_ENDPOINTS = config.API_ENDPOINTS || {};
            config.API_ENDPOINTS.LLAMA4_API = userConfig.LLAMA4_API_ENDPOINT;
          }
          
          if (userConfig.LLAMA4_MAVERICK_API_ENDPOINT) {
            config.API_ENDPOINTS = config.API_ENDPOINTS || {};
            config.API_ENDPOINTS.LLAMA4_MAVERICK_API = userConfig.LLAMA4_MAVERICK_API_ENDPOINT;
          }
          
          if (userConfig.LLAMA4_SCOUT_API_ENDPOINT) {
            config.API_ENDPOINTS = config.API_ENDPOINTS || {};
            config.API_ENDPOINTS.LLAMA4_SCOUT_API = userConfig.LLAMA4_SCOUT_API_ENDPOINT;
          }
          
          console.log('[환경 설정] 사용자 정의 설정 로드됨');
        } catch (e) {
          console.error('[환경 설정] 사용자 설정 로드 중 오류 발생:', e);
        }
      }
      
      // 설정 캐싱
      this.configCache = config;
      
      // 환경 정보 로깅
      console.log(`[환경 설정] 현재 환경: ${config.INTERNAL_NETWORK ? '내부망' : '외부망'}`);
      console.log(`[환경 설정] Mock 데이터 사용: ${config.USE_MOCK_DATA ? '활성화' : '비활성화'}`);
      console.log(`[환경 설정] 기본 모델: ${config.MODELS?.DEFAULT_MODEL || '지정되지 않음'}`);
      
      // 로컬 개발 모드인 경우 localhost 엔드포인트 사용
      if (config.LOCAL_DEVELOPMENT?.ENABLED && config.INTERNAL_NETWORK) {
        console.log('[환경 설정] 로컬 개발 모드 활성화됨 - localhost 엔드포인트 사용');
        
        // localhost 엔드포인트로 API URL 대체
        if (config.LOCAL_DEVELOPMENT.ENDPOINTS) {
          config.API_ENDPOINTS = { ...config.API_ENDPOINTS, ...config.LOCAL_DEVELOPMENT.ENDPOINTS };
        }
      }
      
      return config;
    } catch (error) {
      console.error('[환경 설정] 설정 로드 중 오류 발생:', error);
      
      // 오류 발생 시 최소 설정으로 대체
      const fallbackConfig = {
        INTERNAL_NETWORK: isInternalNetwork,
        EXTERNAL_NETWORK: !isInternalNetwork,
        USE_MOCK_DATA: !isInternalNetwork,
        FORCE_SSL_BYPASS: isInternalNetwork,
        API_ENDPOINTS: {
          NARRANS_API: isInternalNetwork ? 'http://localhost:8001/v1/chat/completions' : 'mock://narrans.api/v1/chat/completions',
          LLAMA4_MAVERICK_API: isInternalNetwork ? 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions' : 'mock://llama4.maverick.api/v1/chat/completions',
          LLAMA4_SCOUT_API: isInternalNetwork ? 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/scout/v1/chat/completions' : 'mock://llama4.scout.api/v1/chat/completions',
          LLAMA4_API: isInternalNetwork ? 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions' : 'mock://llama4.api/v1/chat/completions'
        },
        MODELS: {
          DEFAULT_MODEL: isInternalNetwork ? 'narrans' : 'gemini-2.5-flash'
        }
      };
      
      this.configCache = fallbackConfig;
      return fallbackConfig;
    }
  }

  /**
   * 설정 파일 로드
   * 내부망/외부망에 따라 적절한 settings.json 파일을 로드
   */
  loadSettings() {
    // 캐시된 설정이 있으면 반환
    if (this.settingsCache) {
      return this.settingsCache;
    }

    // 내부망 여부 감지
    const isInternalNetwork = this.detectInternalNetwork();
    const settingsPath = isInternalNetwork ? this.internalSettingsPath : this.externalSettingsPath;
    
    try {
      if (fs.existsSync(settingsPath)) {
        const settingsContent = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(settingsContent);
        
        console.log(`[설정] ${isInternalNetwork ? '내부망' : '외부망'} 설정 파일 로드됨: ${settingsPath}`);
        
        // 환경에 따른 LLM 모델 설정
        this.settingsCache = settings;
        return settings;
      } else {
        console.error(`[설정] 설정 파일을 찾을 수 없습니다: ${settingsPath}`);
        // 빈 객체 반환
        return {};
      }
    } catch (error) {
      console.error('[설정] 설정 파일 로드 중 오류 발생:', error);
      return {};
    }
  }
  
  /**
   * 특정 설정 값 가져오기
   * @param {string} key 설정 키 (점 표기법 지원: 'MODELS.DEFAULT_MODEL')
   * @param {any} defaultValue 기본값
   */
  get(key, defaultValue = undefined) {
    const config = this.loadConfig();
    
    // 점 표기법 지원
    if (key.includes('.')) {
      const parts = key.split('.');
      let value = config;
      
      for (const part of parts) {
        if (value === undefined || value === null) {
          return defaultValue;
        }
        value = value[part];
      }
      
      return value !== undefined ? value : defaultValue;
    }
    
    // 단일 키 조회
    return config[key] !== undefined ? config[key] : defaultValue;
  }
  
  /**
   * 설정 파일에서 특정 값 가져오기
   * @param {string} key 설정 키 (점 표기법 지원: 'ape.llm.defaultModel')
   * @param {any} defaultValue 기본값
   */
  getSetting(key, defaultValue = undefined) {
    const settings = this.loadSettings();
    
    // 점 표기법 지원
    if (key.includes('.')) {
      const parts = key.split('.');
      let value = settings;
      
      for (const part of parts) {
        if (value === undefined || value === null) {
          return defaultValue;
        }
        value = value[part];
      }
      
      return value !== undefined ? value : defaultValue;
    }
    
    // 단일 키 조회
    return settings[key] !== undefined ? settings[key] : defaultValue;
  }
  
  /**
   * 환경 타입 반환 (internal/external)
   */
  getEnvironmentType() {
    return this.get('INTERNAL_NETWORK', false) ? 'internal' : 'external';
  }
  
  /**
   * Mock 모드 활성화 여부 반환
   */
  isMockModeEnabled() {
    return this.get('USE_MOCK_DATA', false);
  }
  
  /**
   * API 엔드포인트 URL 가져오기
   * @param {string} apiName API 이름 (NARRANS_API, LLAMA4_API 등)
   * @param {string} defaultUrl 기본 URL
   */
  getApiUrl(apiName, defaultUrl = '') {
    const url = this.get(`API_ENDPOINTS.${apiName}`);
    if (url) {
      return url;
    }
    
    // 직접 속성으로 설정된 경우 확인 (extension.env.js 호환성)
    const directUrl = this.get(`${apiName}_ENDPOINT`);
    if (directUrl) {
      return directUrl;
    }
    
    return defaultUrl;
  }
  
  /**
   * API 키 가져오기
   * @param {string} keyName API 키 이름 (OPENROUTER_API_KEY 등)
   */
  getApiKey(keyName) {
    // API_KEYS 객체에서 확인
    const key = this.get(`API_KEYS.${keyName}`);
    if (key) {
      return key;
    }
    
    // 직접 속성으로 설정된 경우 확인 (extension.env.js 호환성)
    return this.get(keyName);
  }
  
  /**
   * Mock 데이터 가져오기
   * @param {string} mockName Mock 데이터 이름 (NARRANS_RESPONSE 등)
   */
  getMockData(mockName) {
    return this.get(`MOCK_DATA.${mockName}`);
  }
  
  /**
   * 전체 Mock 데이터 가져오기
   */
  getAllMockData() {
    return this.get('MOCK_DATA', {});
  }

  /**
   * 사용 가능한 모든 모델 목록 가져오기
   * @returns {Array} 모델 설정 배열
   */
  getAvailableModels() {
    // 환경 설정에서 모델 목록 가져오기
    const envModels = this.get('MODELS.AVAILABLE_MODELS', []);
    
    // 모델 있는지 확인
    if (Array.isArray(envModels) && envModels.length > 0) {
      return this._enhanceModels(envModels);
    }
    
    // 환경에 따른 기본 모델 목록 반환
    return this._getDefaultModels();
  }
  
  /**
   * 모델 향상 (기본값 등 채우기)
   * @param {Array} models 원본 모델 배열
   * @returns {Array} 향상된 모델 배열
   */
  _enhanceModels(models) {
    const defaultSystemPrompt = '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.';
    
    return models.map(model => {
      // 모델 ID 확인
      if (!model.id) {
        model.id = this._generateModelId(model);
      }
      
      // 시스템 프롬프트 확인
      if (!model.systemPrompt) {
        model.systemPrompt = defaultSystemPrompt;
      }
      
      // 온도값 기본 설정
      if (model.temperature === undefined) {
        model.temperature = 0.7;
      }
      
      return model;
    });
  }
  
  /**
   * 모델 ID 생성
   * @param {Object} model 모델 객체
   * @returns {string} 생성된 모델 ID
   */
  _generateModelId(model) {
    if (model.name) {
      // 이름 기반으로 ID 생성
      return model.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    // 프로바이더 + 랜덤값
    return `${model.provider || 'model'}-${Date.now().toString(36)}`;
  }
  
  /**
   * 환경에 따른 기본 모델 목록 반환
   * @returns {Array} 기본 모델 배열
   */
  _getDefaultModels() {
    // 내부망인지 확인
    const isInternalNetwork = this.get('INTERNAL_NETWORK', false);
    const defaultSystemPrompt = '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.';
    
    if (isInternalNetwork) {
      // 내부망 기본 모델
      return [
        {
          id: 'narrans',
          name: 'NARRANS (Default)',
          provider: 'custom',
          apiUrl: 'http://localhost:8001/v1/chat/completions',
          contextWindow: 10000,
          maxTokens: 10000,
          temperature: 0,
          systemPrompt: defaultSystemPrompt
        },
        {
          id: 'llama-4-maverick',
          name: 'Llama 4 Maverick',
          provider: 'custom',
          apiUrl: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
          contextWindow: 50000,
          maxTokens: 50000,
          temperature: 0,
          systemPrompt: defaultSystemPrompt
        },
        {
          id: 'local',
          name: '로컬 시뮬레이션',
          provider: 'local',
          temperature: 0.7,
          systemPrompt: defaultSystemPrompt
        }
      ];
    } else {
      // 외부망 기본 모델
      return [
        {
          id: 'gemini-2.5-flash',
          name: 'Google Gemini 2.5 Flash',
          provider: 'openrouter',
          apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
          apiModel: 'google/gemini-2.5-flash-preview',
          contextWindow: 32000,
          maxTokens: 8192,
          temperature: 0.7,
          systemPrompt: defaultSystemPrompt
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
          systemPrompt: defaultSystemPrompt
        },
        {
          id: 'local',
          name: '로컬 시뮬레이션',
          provider: 'local',
          temperature: 0.7,
          systemPrompt: defaultSystemPrompt
        }
      ];
    }
  }
  
  /**
   * 기본 모델 ID 가져오기
   * @returns {string} 기본 모델 ID
   */
  getDefaultModelId() {
    // 환경 설정에서 기본 모델 ID 가져오기
    const defaultModelId = this.get('MODELS.DEFAULT_MODEL');
    
    if (defaultModelId) {
      return defaultModelId;
    }
    
    // settings.json에서 기본 모델 확인
    const settingsDefaultModel = this.getSetting('ape.llm.defaultModel');
    if (settingsDefaultModel) {
      return settingsDefaultModel;
    }
    
    // 환경에 따른 기본값
    const isInternalNetwork = this.get('INTERNAL_NETWORK', false);
    return isInternalNetwork ? 'narrans' : 'gemini-2.5-flash';
  }
  
  /**
   * 모델 API URL 가져오기
   * @param {string} modelId 모델 ID
   * @returns {string|null} API URL 또는 null
   */
  getModelApiUrl(modelId) {
    const models = this.getAvailableModels();
    const model = models.find(m => m.id === modelId);
    
    if (model && model.apiUrl) {
      return model.apiUrl;
    }
    
    // settings.json에서 모델 정보 확인
    const settingsModel = this.getSetting(`ape.llm.models.${modelId}`);
    if (settingsModel && settingsModel.apiUrl) {
      return settingsModel.apiUrl;
    }
    
    // 내부망 여부에 따른 기본 API URL
    const isInternalNetwork = this.get('INTERNAL_NETWORK', false);
    if (isInternalNetwork) {
      return this.get('API_ENDPOINTS.NARRANS_API', 'http://localhost:8001/v1/chat/completions');
    } else {
      return this.get('API_ENDPOINTS.OPENROUTER_API', 'https://openrouter.ai/api/v1/chat/completions');
    }
  }
  
  /**
   * 설정 캐시 초기화
   */
  clearCache() {
    this.configCache = null;
    this.settingsCache = null;
    this.internalNetworkDetected = null;
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const envLoader = new EnvLoader();
module.exports = envLoader;