/**
 * 환경 설정 로더
 * 
 * 이 모듈은 환경 변수를 로드하고 설정합니다.
 * 내부망/외부망 환경에 따른 설정을 관리합니다.
 */

// 기본 환경 설정
const defaultEnv = {
  ENV_MODE: 'external',
  DEFAULT_MODEL_ID: 'gemini-2.5-flash',
  DEFAULT_EXTERNAL_MODEL_ID: 'gemini-2.5-flash'
};

/**
 * 환경 변수 로드 함수
 */
exports.loadEnvironment = async function() {
  try {
    // 환경 변수 로드 시도
    let envConfig;
    
    try {
      // 환경 설정 파일 로드 시도
      envConfig = require('./env.example.js');
      console.log('환경 설정 파일을 성공적으로 로드했습니다.');
    } catch (error) {
      console.warn('환경 설정 파일을 찾을 수 없어 기본값을 사용합니다:', error.message);
      envConfig = defaultEnv;
    }
    
    // 환경 변수 설정
    Object.keys(envConfig).forEach(key => {
      process.env[key] = envConfig[key];
    });
    
    return true;
  } catch (error) {
    console.error('환경 설정 로드 중 오류 발생:', error);
    return false;
  }
};