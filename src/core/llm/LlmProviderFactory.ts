/**
 * LLM 프로바이더 팩토리
 * 
 * 이 팩토리 클래스는 현재 환경(내부망/외부망)에 맞는 LLM 프로바이더를 생성합니다.
 * 환경에 따라 적절한 구현체를 반환하여 내부/외부망 환경의 차이를 추상화합니다.
 */

import { EnvironmentService } from '../env/EnvironmentService';
import { ModelConfig } from '../../types/LlmTypes';
import { ILlmProvider } from './providers/ILlmProvider';

// 실제 구현체는 별도 파일로 구현되어야 합니다

export class LlmProviderFactory {
  /**
   * 모델 설정에 맞는 LLM 프로바이더 생성
   */
  public static async createProvider(modelConfig: ModelConfig): Promise<ILlmProvider> {
    const envService = EnvironmentService.getInstance();
    
    // 내부망 환경에서는 모델 유형에 따라 적절한 프로바이더 반환
    if (envService.isInternalNetwork()) {
      if (modelConfig.name.toLowerCase().includes('llama')) {
        // Llama 모델용 내부망 프로바이더
        return this.createInternalProvider('llama', modelConfig);
      } else if (modelConfig.name.toLowerCase().includes('narrans') || 
                 modelConfig.provider === 'narrans') {
        // NARRANS 모델용 내부망 프로바이더
        return this.createInternalProvider('narrans', modelConfig);
      }
    }
    
    // 외부망 환경에서는 OpenRouter 프로바이더 반환
    return this.createExternalProvider(modelConfig);
  }
  
  /**
   * 내부망 LLM 프로바이더 생성
   */
  private static createInternalProvider(type: string, modelConfig: ModelConfig): ILlmProvider {
    // 임시 구현
    
    // 임시 구현 (인터페이스 구현 필요)
    return {
      initialize: async () => {},
      supportsModel: () => true,
      sendRequest: async () => ({ content: '', model: '', id: '' }),
      sendStreamingRequest: async () => ({ content: '', model: '', id: '' }),
      getAvailableModels: async () => [],
      isAvailableInCurrentEnvironment: () => true
    };
  }
  
  /**
   * 외부망 LLM 프로바이더 생성
   */
  private static createExternalProvider(modelConfig: ModelConfig): ILlmProvider {
    // 임시 구현
    
    // 임시 구현 (인터페이스 구현 필요)
    return {
      initialize: async () => {},
      supportsModel: () => true,
      sendRequest: async () => ({ content: '', model: '', id: '' }),
      sendStreamingRequest: async () => ({ content: '', model: '', id: '' }),
      getAvailableModels: async () => [],
      isAvailableInCurrentEnvironment: () => true
    };
  }
}