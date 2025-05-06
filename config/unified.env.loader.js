/**
 * 통합 환경 설정 로더
 * 
 * 이 모듈은 통합된 환경 변수를 로드하고 설정합니다.
 * 내부망/외부망 환경을 자동으로 감지하여 적절한 설정을 제공합니다.
 */

const https = require('https');
const http = require('http');
const unifiedConfig = require('./unified.config.js');

// 기본 환경 설정
const defaultEnv = {
  ENV_MODE: 'external',
  DEFAULT_MODEL_ID: unifiedConfig.MODELS.DEFAULT_MODEL.EXTERNAL
};

/**
 * 내부망 감지 함수
 * 내부망 엔드포인트에 연결 시도하여 환경 감지
 */
async function detectInternalNetwork() {
  return new Promise((resolve) => {
    if (unifiedConfig.ENV_DETECTION.DETECTION_MODE === 'manual') {
      const manualEnv = unifiedConfig.ENV_DETECTION.MANUAL_ENV;
      console.log(`수동 환경 모드: ${manualEnv}`);
      return resolve(manualEnv === 'internal');
    }
    
    const checkUrl = unifiedConfig.ENV_DETECTION.AUTO_DETECTION.INTERNAL_CHECK_URL;
    const timeout = unifiedConfig.ENV_DETECTION.AUTO_DETECTION.TIMEOUT_MS;
    
    console.log(`내부망 감지 시도: ${checkUrl}`);
    
    // URL이 https인지 http인지 확인
    const client = checkUrl.startsWith('https') ? https : http;
    
    const req = client.get(checkUrl, { timeout }, (res) => {
      console.log(`내부망 감지 응답: ${res.statusCode}`);
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    
    req.on('error', (error) => {
      console.log(`내부망 감지 실패: ${error.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('내부망 감지 시간 초과');
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * 활성 환경 기반 구성 가져오기
 */
function getConfigForEnvironment(isInternal) {
  const envType = isInternal ? 'INTERNAL' : 'EXTERNAL';
  const modelList = isInternal ? 
    unifiedConfig.MODELS.INTERNAL_MODELS : 
    unifiedConfig.MODELS.EXTERNAL_MODELS;
  
  const apiEndpoints = isInternal ? 
    { ...unifiedConfig.API_ENDPOINTS.INTERNAL } : 
    { ...unifiedConfig.API_ENDPOINTS.EXTERNAL };
  
  // 로컬 개발 모드이고 내부망이면 로컬 엔드포인트로 덮어쓰기
  if (isInternal && unifiedConfig.ENVIRONMENT_SETTINGS.INTERNAL.LOCAL_DEV_MODE) {
    Object.keys(unifiedConfig.API_ENDPOINTS.LOCAL).forEach(key => {
      apiEndpoints[key] = unifiedConfig.API_ENDPOINTS.LOCAL[key];
    });
  }
  
  const apiKeys = isInternal ? 
    { ...unifiedConfig.API_KEYS.INTERNAL } : 
    { ...unifiedConfig.API_KEYS.EXTERNAL };
  
  const envSettings = isInternal ? 
    { ...unifiedConfig.ENVIRONMENT_SETTINGS.INTERNAL } : 
    { ...unifiedConfig.ENVIRONMENT_SETTINGS.EXTERNAL };
  
  // 기본 구성 생성
  return {
    // 환경 식별
    ENV_MODE: isInternal ? 'internal' : 'external',
    INTERNAL_NETWORK: isInternal,
    EXTERNAL_NETWORK: !isInternal,
    
    // API 엔드포인트
    API_ENDPOINTS: apiEndpoints,
    
    // API 키
    API_KEYS: apiKeys,
    
    // 모델 설정
    MODELS: {
      DEFAULT_MODEL: unifiedConfig.MODELS.DEFAULT_MODEL[envType],
      AVAILABLE_MODELS: modelList
    },
    
    // 모델 매핑
    MODEL_MAPPING: unifiedConfig.MODELS.MODEL_MAPPING,
    
    // 환경별 설정
    ...envSettings,
    
    // 추가 설정
    // Openrouter 설정은 외부망일 때만 포함
    ...(isInternal ? {} : { 
      OPENROUTER_SETTINGS: unifiedConfig.ENVIRONMENT_SETTINGS.EXTERNAL.OPENROUTER_SETTINGS 
    })
  };
}

/**
 * 환경 변수 로드 함수
 */
exports.loadEnvironment = async function() {
  try {
    // 내부망 감지
    const isInternal = await detectInternalNetwork();
    
    // 감지된 환경에 맞는 설정 가져오기
    const envConfig = getConfigForEnvironment(isInternal);
    
    console.log(`감지된 환경: ${isInternal ? '내부망' : '외부망'}`);
    
    // 환경 변수 설정
    Object.keys(envConfig).forEach(key => {
      if (typeof envConfig[key] === 'object' && envConfig[key] !== null) {
        // 객체인 경우 JSON으로 변환
        process.env[key] = JSON.stringify(envConfig[key]);
      } else {
        // 객체가 아닌 경우 문자열로 변환
        process.env[key] = String(envConfig[key]);
      }
    });
    
    return {
      success: true,
      isInternal,
      config: envConfig
    };
  } catch (error) {
    console.error('환경 설정 로드 중 오류 발생:', error);
    
    // 기본 환경(외부망) 설정
    Object.keys(defaultEnv).forEach(key => {
      process.env[key] = defaultEnv[key];
    });
    
    return {
      success: false,
      isInternal: false,
      error: error.message,
      config: defaultEnv
    };
  }
};