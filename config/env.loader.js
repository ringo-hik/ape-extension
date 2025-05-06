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
    // 환경 설정 디렉토리 경로
    this.configDir = path.join(__dirname, 'environments');
    
    // 내부망/외부망 설정 경로
    this.internalConfigPath = path.join(this.configDir, 'internal', 'env.config.js');
    this.externalConfigPath = path.join(this.configDir, 'external', 'env.config.js');
    
    // 사용자 환경 설정 파일 (우선순위가 가장 높음)
    this.userConfigPath = path.join(process.cwd(), 'extension.env.js');
    
    // hosts 파일 경로
    this.hostsFilePath = os.platform() === 'win32' ? 
      'C:\\Windows\\System32\\drivers\\etc\\hosts' : 
      '/etc/hosts';
    
    // 설정 캐시
    this.configCache = null;
    
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
      
      // 5. 내부망 도메인 DNS 확인 (비동기이므로 실제로는 사용하지 않음)
      // 아래 코드는 참고용이며 실제로는 동기적으로 설정을 로드해야 함
      // dns.lookup('narrans.internal', (err, address) => {
      //   if (!err && address) {
      //     console.log('[환경 감지] 내부망 도메인 DNS 해석 가능');
      //     this.internalNetworkDetected = true;
      //   }
      // });
      
      // 6. 내부망 서비스 접근 시도 (localhost 포트 확인)
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
      
      // 7. 기본값 - Windows는 내부망으로, 나머지는 외부망으로 간주
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
   * 설정 캐시 초기화
   */
  clearCache() {
    this.configCache = null;
    this.internalNetworkDetected = null;
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const envLoader = new EnvLoader();
module.exports = envLoader;