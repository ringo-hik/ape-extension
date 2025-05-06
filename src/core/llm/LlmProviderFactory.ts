/**
 * LLM 프로바이더 팩토리
 * 
 * 이 팩토리 클래스는 현재 환경(내부망/외부망)에 맞는 LLM 프로바이더를 생성합니다.
 * 환경에 따라 적절한 구현체를 반환하여 내부/외부망 환경의 차이를 추상화합니다.
 */

import { EnvironmentService } from '../env/EnvironmentService';
import { ModelConfig } from '../../types/LlmTypes';
import { ILlmProvider } from './providers/ILlmProvider';



export class LlmProviderFactory {
  /**
   * 모델 설정에 맞는 LLM 프로바이더 생성
   */
  public static async createProvider(modelConfig: ModelConfig): Promise<ILlmProvider> {
    const envService = EnvironmentService.getInstance();
    
    // 내부망 또는 외부망에 따라 적절한 프로바이더 생성
    if (envService.isInternalNetwork()) {
      return this.createInternalProvider(modelConfig.provider, modelConfig);
    }
    
    // 외부망 환경에서는 외부망 프로바이더 사용
    return this.createExternalProvider(modelConfig);
  }
  
  /**
   * 내부망 LLM 프로바이더 생성
   */
  private static createInternalProvider(type: string, modelConfig: ModelConfig): ILlmProvider {
    
    
    
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