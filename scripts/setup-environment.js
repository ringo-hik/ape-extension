/**
 * 환경 설정 스크립트
 * 내부망/외부망 환경에 따른 설정 파일 자동 생성
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// 프로젝트 루트 경로
const rootDir = path.resolve(__dirname, '..');

// 환경 설정 파일 경로
const configDir = path.join(rootDir, 'config');
const envConfigDir = path.join(configDir, 'environments');
const internalConfigDir = path.join(envConfigDir, 'internal');
const externalConfigDir = path.join(envConfigDir, 'external');
const userEnvFile = path.join(rootDir, 'extension.env.js');

// readline 인터페이스 생성
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 사용자 입력 프롬프트 (Promise 래핑)
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * 디렉토리 생성 (재귀적)
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`디렉토리 생성됨: ${dirPath}`);
  }
}

/**
 * 내부망 모드 감지
 */
function detectInternalNetwork() {
  // Windows이면 내부망 가능성 높음
  return os.platform() === 'win32';
}

/**
 * 내부망 환경 설정 파일 생성
 */
async function createInternalConfig(customSettings = {}) {
  // 내부망 디렉토리 생성
  ensureDirectoryExists(internalConfigDir);
  
  // API 엔드포인트 설정
  const narransApi = customSettings.narransApi || 'http://localhost:8001/v1/chat/completions';
  const llama4Api = customSettings.llama4Api || 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions';
  const swdpApi = customSettings.swdpApi || 'http://localhost:8002/api';
  const nexusUrl = customSettings.nexusUrl || 'http://localhost:8081/repository/npm-group/';
  
  // 설정 파일 내용
  const configContent = `/**
 * 내부망 환경 설정 파일
 * 내부망 환경에서 APE 확장 프로그램의 동작을 구성합니다.
 */

module.exports = {
  // 내부망 식별자 (true로 설정하면 내부망 모드로 동작)
  INTERNAL_NETWORK: true,
  
  // SSL 인증서 검증 우회 설정
  FORCE_SSL_BYPASS: true,
  
  // API 엔드포인트 설정
  API_ENDPOINTS: {
    // NARRANS LLM API
    NARRANS_API: '${narransApi}',
    
    // Llama 4 LLM API
    LLAMA4_API: '${llama4Api}',
    
    // SWDP API
    SWDP_API: '${swdpApi}',
    
    // Nexus 패키지 저장소
    NEXUS_REPOSITORY: '${nexusUrl}'
  },
  
  // 넥서스 설정
  NEXUS: {
    // 넥서스 저장소 URL
    URL: '${nexusUrl}',
    
    // 인증 정보 (필요한 경우)
    AUTH: {
      username: '${customSettings.nexusUsername || ''}',
      password: '${customSettings.nexusPassword || ''}'
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
        name: 'NARRANS (Default)',
        provider: 'custom',
        apiUrl: '${narransApi}',
        contextWindow: 10000,
        maxTokens: 10000,
        temperature: 0
      },
      {
        id: 'llama-4-maverick',
        name: 'Llama 4 Maverick',
        provider: 'custom',
        apiUrl: '${llama4Api}',
        contextWindow: 50000,
        maxTokens: 50000,
        temperature: 0
      }
    ]
  },
  
  // 플러그인 설정
  PLUGINS: {
    // 활성화할 플러그인 목록
    ENABLED: ['git', 'jira', 'swdp', 'pocket']
  }
};`;

  // 설정 파일 저장
  const configPath = path.join(internalConfigDir, 'env.config.js');
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log(`내부망 환경 설정 파일이 생성되었습니다: ${configPath}`);
}

/**
 * 외부망 환경 설정 파일 생성
 */
async function createExternalConfig(customSettings = {}) {
  // 외부망 디렉토리 생성
  ensureDirectoryExists(externalConfigDir);
  
  // API 키 설정
  const openrouterApiKey = customSettings.openrouterApiKey || '';
  
  // 설정 파일 내용
  const configContent = `/**
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
  
  // API 키 설정
  API_KEYS: {
    // OpenRouter API 키
    OPENROUTER_API_KEY: '${openrouterApiKey}'
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
};`;

  // 설정 파일 저장
  const configPath = path.join(externalConfigDir, 'env.config.js');
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log(`외부망 환경 설정 파일이 생성되었습니다: ${configPath}`);
}

/**
 * 사용자 환경 설정 파일 생성
 */
async function createUserConfig(isInternal, customSettings = {}) {
  // 기본 파일 내용
  const configContent = `/**
 * APE 확장 프로그램 사용자 환경 설정
 * 참고: 이 파일은 git에 커밋하지 않습니다.
 */

module.exports = {
  // 내부망 식별자 (true: 내부망, false: 외부망)
  INTERNAL_NETWORK: ${isInternal},
  
  // SSL 인증서 검증 우회 설정
  FORCE_SSL_BYPASS: ${isInternal},
  
  // 개발 모드 설정
  DEV_MODE: true,
  
  // 환경 모드
  ENV_MODE: 'development',
  
  // 로깅 설정
  LOG_LEVEL: 'debug'${isInternal ? ',\n  \n  // 내부망 API 엔드포인트\n  NARRANS_API_ENDPOINT: \'' + 
    (customSettings.narransApi || 'http://localhost:8001/v1/chat/completions') + 
    '\',\n  LLAMA4_API_ENDPOINT: \'' + 
    (customSettings.llama4Api || 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions') + 
    '\'\n' : 
    ',\n  \n  // OpenRouter API 키\n  OPENROUTER_API_KEY: \'' + 
    (customSettings.openrouterApiKey || '') + '\'\n'}
};`;

  // 이미 파일이 존재하는 경우 확인
  if (fs.existsSync(userEnvFile)) {
    const overwrite = await prompt('extension.env.js 파일이 이미 존재합니다. 덮어쓰시겠습니까? (y/n) ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('기존 extension.env.js 파일을 유지합니다.');
      return;
    }
  }

  // 설정 파일 저장
  fs.writeFileSync(userEnvFile, configContent, 'utf8');
  console.log(`사용자 환경 설정 파일이 생성되었습니다: ${userEnvFile}`);
}

/**
 * 메인 설정 프로세스
 */
async function main() {
  try {
    console.log('===== APE 확장 환경 설정 도구 =====');
    
    // 내부망/외부망 선택
    const detectedInternal = detectInternalNetwork();
    const networkType = await prompt(`환경 타입을 선택하세요 (내부망/외부망) [${detectedInternal ? '내부망' : '외부망'}]: `);
    const isInternal = networkType === '내부망' || (networkType === '' && detectedInternal);
    
    console.log(`선택된 환경: ${isInternal ? '내부망' : '외부망'}`);
    
    // 커스텀 설정
    const customSettings = {};
    
    if (isInternal) {
      // 내부망 설정
      console.log('\n----- 내부망 환경 설정 -----');
      customSettings.narransApi = await prompt('NARRANS API 엔드포인트 [http://localhost:8001/v1/chat/completions]: ');
      if (!customSettings.narransApi) {
        customSettings.narransApi = 'http://localhost:8001/v1/chat/completions';
      }
      
      customSettings.llama4Api = await prompt('Llama 4 API 엔드포인트 [http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions]: ');
      if (!customSettings.llama4Api) {
        customSettings.llama4Api = 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions';
      }
      
      customSettings.nexusUrl = await prompt('Nexus 저장소 URL [http://localhost:8081/repository/npm-group/]: ');
      if (!customSettings.nexusUrl) {
        customSettings.nexusUrl = 'http://localhost:8081/repository/npm-group/';
      }
      
      // 내부망 설정 파일 생성
      await createInternalConfig(customSettings);
    } else {
      // 외부망 설정
      console.log('\n----- 외부망 환경 설정 -----');
      customSettings.openrouterApiKey = await prompt('OpenRouter API 키 (비워두면 기본값 사용): ');
      
      // 외부망 설정 파일 생성
      await createExternalConfig(customSettings);
    }
    
    // 사용자 환경 설정 파일 생성
    const createUser = await prompt('사용자 환경 설정 파일(extension.env.js)을 생성하시겠습니까? (y/n) [y]: ');
    if (createUser === '' || createUser.toLowerCase() === 'y') {
      await createUserConfig(isInternal, customSettings);
    }
    
    console.log('\n환경 설정이 완료되었습니다!');
    console.log(`환경 타입: ${isInternal ? '내부망' : '외부망'}`);
    console.log('설정 디렉토리: ' + envConfigDir);
    console.log('사용자 설정 파일: ' + (createUser === '' || createUser.toLowerCase() === 'y' ? userEnvFile : '생성되지 않음'));
    
    // 사용자가 npm 명령 실행할 것을 안내
    if (isInternal) {
      console.log('\n내부망 환경에서 다음 명령을 실행하여 패키지를 설치하세요:');
      console.log('npm install --registry=' + customSettings.nexusUrl + ' --no-strict-ssl --legacy-peer-deps');
      console.log('또는 scripts/internal-install.bat 스크립트를 사용하세요.');
    } else {
      console.log('\n외부망 환경에서 다음 명령을 실행하여 패키지를 설치하세요:');
      console.log('npm install');
    }
  } catch (error) {
    console.error('설정 중 오류가 발생했습니다:', error);
  } finally {
    rl.close();
  }
}

// 스크립트 실행
main();