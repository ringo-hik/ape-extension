/**
 * LLM 모델 구성 유틸리티
 * 내부망/외부망 환경에 따라 적절한 LLM 모델 구성을 제공합니다.
 */

const envLoader = require('./env.loader');

/**
 * 모델 구성 관리자 클래스
 */
class ModelConfigManager {
  constructor() {
    // 기본 모델 시스템 프롬프트
    this.defaultSystemPrompt = '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.';
  }
  
  /**
   * 사용 가능한 모든 모델 목록 가져오기
   * @returns {Array} 모델 설정 배열
   */
  getAvailableModels() {
    // 환경 설정에서 모델 목록 가져오기
    const envModels = envLoader.get('MODELS.AVAILABLE_MODELS', []);
    
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
    return models.map(model => {
      // 모델 ID 확인
      if (!model.id) {
        model.id = this._generateModelId(model);
      }
      
      // 시스템 프롬프트 확인
      if (!model.systemPrompt) {
        model.systemPrompt = this.defaultSystemPrompt;
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
    const isInternalNetwork = envLoader.get('INTERNAL_NETWORK', false);
    
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
          systemPrompt: this.defaultSystemPrompt
        },
        {
          id: 'llama-4-maverick',
          name: 'Llama 4 Maverick',
          provider: 'custom',
          apiUrl: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
          contextWindow: 50000,
          maxTokens: 50000,
          temperature: 0,
          systemPrompt: this.defaultSystemPrompt
        },
        {
          id: 'local',
          name: '로컬 시뮬레이션',
          provider: 'local',
          temperature: 0.7,
          systemPrompt: this.defaultSystemPrompt
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
          systemPrompt: this.defaultSystemPrompt
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
          systemPrompt: this.defaultSystemPrompt
        },
        {
          id: 'local',
          name: '로컬 시뮬레이션',
          provider: 'local',
          temperature: 0.7,
          systemPrompt: this.defaultSystemPrompt
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
    const defaultModelId = envLoader.get('MODELS.DEFAULT_MODEL');
    
    if (defaultModelId) {
      return defaultModelId;
    }
    
    // 환경에 따른 기본값
    const isInternalNetwork = envLoader.get('INTERNAL_NETWORK', false);
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
    
    // 내부망 여부에 따른 기본 API URL
    const isInternalNetwork = envLoader.get('INTERNAL_NETWORK', false);
    if (isInternalNetwork) {
      return envLoader.get('API_ENDPOINTS.NARRANS_API', 'http://localhost:8001/v1/chat/completions');
    } else {
      return envLoader.get('API_ENDPOINTS.OPENROUTER_API', 'https://openrouter.ai/api/v1/chat/completions');
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const modelConfigManager = new ModelConfigManager();
module.exports = modelConfigManager;