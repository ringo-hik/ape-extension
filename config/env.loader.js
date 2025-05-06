/**
 * 환경 설정 로더
 * 내부망/외부망 환경에 따라 적절한 설정 파일을 로드하는 유틸리티
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

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
    
    // 설정 캐시
    this.configCache = null;
  }
  
  /**
   * 현재 환경이 내부망인지 감지
   * - Windows 환경일 경우 내부망 가능성 높음
   * - 특정 도메인 접근 가능성 체크
   * - 명시적 플래그 확인
   */
  detectInternalNetwork() {
    try {
      // 1. 명시적 환경 변수 확인
      if (process.env.APE_INTERNAL_NETWORK === 'true') {
        return true;
      } else if (process.env.APE_INTERNAL_NETWORK === 'false') {
        return false;
      }
      
      // 2. 사용자 설정 파일 확인
      if (fs.existsSync(this.userConfigPath)) {
        try {
          const userConfig = require(this.userConfigPath);
          if (typeof userConfig.INTERNAL_NETWORK === 'boolean') {
            return userConfig.INTERNAL_NETWORK;
          }
        } catch (e) {
          console.warn('사용자 설정 파일을 읽는 중 오류 발생:', e);
        }
      }
      
      // 3. OS 타입 확인 (Windows는 내부망 가능성 높음)
      const isWindows = os.platform() === 'win32';
      if (isWindows) {
        return true;
      }
      
      // 4. 도메인 접근성 체크 (실제로는 ping이나 요청 테스트가 필요하지만 여기선 생략)
      
      // 5. 기본값으로 외부망 반환
      return false;
    } catch (error) {
      console.error('내부망 감지 중 오류 발생:', error);
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
          console.log(`[환경 설정] ${isInternalNetwork ? '내부망' : '외부망'} 설정 로드됨`);
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
          config = { ...config, ...userConfig };
          console.log('[환경 설정] 사용자 정의 설정 로드됨');
        } catch (e) {
          console.error('[환경 설정] 사용자 설정 로드 중 오류 발생:', e);
        }
      }
      
      // 환경 감지 결과 설정
      config.INTERNAL_NETWORK = isInternalNetwork;
      
      // 설정 캐싱
      this.configCache = config;
      
      // 환경 정보 로깅
      console.log(`[환경 설정] 현재 환경: ${isInternalNetwork ? '내부망' : '외부망'}`);
      console.log(`[환경 설정] 기본 모델: ${config.MODELS?.DEFAULT_MODEL || '지정되지 않음'}`);
      
      return config;
    } catch (error) {
      console.error('[환경 설정] 설정 로드 중 오류 발생:', error);
      
      // 오류 발생 시 최소 설정으로 대체
      const fallbackConfig = {
        INTERNAL_NETWORK: isInternalNetwork,
        FORCE_SSL_BYPASS: isInternalNetwork,
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
   * 환경 타입 반환 (내부망/외부망)
   */
  getEnvironmentType() {
    return this.get('INTERNAL_NETWORK', false) ? 'internal' : 'external';
  }
  
  /**
   * 설정 캐시 초기화
   */
  clearCache() {
    this.configCache = null;
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const envLoader = new EnvLoader();
module.exports = envLoader;