import * as vscode from 'vscode';
import { 
  ChatMessage, 
  LlmRequestOptions, 
  LlmResponse, 
  ModelConfig,
  ApiKeyError
} from '../../types/LlmTypes';
import { ILlmService } from './ILlmService';
import { ApiClient } from './ApiClient';
import { environmentService } from '../env/EnvironmentService';
import { LoggerService } from '../utils/LoggerService';

export class LlmService implements ILlmService {
  private modelCache: Map<string, ModelConfig> = new Map();
  private logger: LoggerService;
  private defaultModelId: string;
  
  constructor() {
    this.logger = new LoggerService('LlmService');
    this.loadAvailableModels();
    this.defaultModelId = this.getDefaultModelId();
  }
  
  private loadAvailableModels(): void {
    try {
      const models = environmentService.getAvailableModels();
      
      this.modelCache.clear();
      
      for (const model of models) {
        this.modelCache.set(model.id, model);
      }
      
      if (this.modelCache.size === 0) {
        const fallbackModels = this.getFallbackModels();
        for (const model of fallbackModels) {
          this.modelCache.set(model.id, model);
        }
      }
    } catch (error) {
      this.logger.error('모델 목록 로드 중 오류 발생', error);
      
      const fallbackModels = this.getFallbackModels();
      for (const model of fallbackModels) {
        this.modelCache.set(model.id, model);
      }
    }
  }
  
  private getFallbackModels(): ModelConfig[] {
    return [
      {
        id: 'local-fallback',
        name: '로컬 시뮬레이션 (오프라인)',
        provider: 'local',
        temperature: 0.7
      }
    ];
  }
  
  public async sendRequest(options: LlmRequestOptions): Promise<LlmResponse> {
    if (!options) {
      throw new Error('요청 옵션이 제공되지 않았습니다.');
    }
    
    const { 
      model = this.getDefaultModelId(), 
      messages = [], 
      temperature, 
      maxTokens, 
      stream, 
      onUpdate 
    } = options;
    
    if (!Array.isArray(messages)) {
      throw new Error('요청 메시지가 유효하지 않습니다.');
    }
    
    const finalMessages = messages.length === 0 ? [{
      role: 'user',
      content: '안녕하세요'
    }] : messages;
    
    const modelId = String(model || this.getDefaultModelId());
    let modelConfig = this.getModelConfig(modelId);
    
    if (!modelConfig) {
      return this.simulateLocalModel(finalMessages);
    }
    
    if (modelConfig.systemPrompt && !finalMessages.some(m => m.role === 'system')) {
      finalMessages.unshift({
        role: 'system',
        content: modelConfig.systemPrompt
      });
    }
    
    try {
      const apiClient = new ApiClient(modelConfig);
      
      if (stream && onUpdate) {
        const result = await apiClient.chatCompletion({
          messages: finalMessages,
          modelId: modelConfig.id,
          systemPrompt: modelConfig.systemPrompt,
          temperature: temperature || modelConfig.temperature,
          maxTokens: maxTokens || modelConfig.maxTokens,
          stream: true,
          onUpdate
        });
        
        return {
          content: result.content,
          model: modelConfig.id,
          raw: result
        };
      }
      
      const result = await apiClient.chatCompletion({
        messages: finalMessages,
        modelId: modelConfig.id,
        systemPrompt: modelConfig.systemPrompt,
        temperature: temperature || modelConfig.temperature,
        maxTokens: maxTokens || modelConfig.maxTokens,
        stream: false
      });
      
      return {
        content: result.content,
        model: modelConfig.id,
        raw: result
      };
    } catch (error) {
      this.logger.error('LlmService: 요청 중 오류 발생:', error);
      
      const isApiKeyError = (err: unknown): err is ApiKeyError => {
        return err instanceof Error && 
               'code' in err && 
               (err as { code?: string }).code !== undefined &&
               ((err as { code: string }).code === 'missing_api_key' || (err as { code: string }).code === 'invalid_api_key');
      };
      
      if (isApiKeyError(error)) {
        return this.simulateLocalModel(finalMessages);
      }
      
      return this.simulateLocalModel(finalMessages);
    }
  }
  
  public async queryLlm(
    text: string, 
    model?: string, 
    options?: Partial<LlmRequestOptions>
  ): Promise<string> {
    if (!text) {
      return '쿼리 텍스트가 비어 있습니다.';
    }
    
    try {
      const requestOptions: LlmRequestOptions = {
        model: model || this.getDefaultModelId(),
        messages: [{
          role: 'user',
          content: text
        }],
        ...options
      };
      
      const response = await this.sendRequest(requestOptions);
      
      return response.content;
    } catch (error) {
      return `쿼리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
    }
  }
  
  private async simulateLocalModel(messages: ChatMessage[]): Promise<LlmResponse> {
    const localModelConfig: ModelConfig = {
      id: 'local-fallback',
      name: '로컬 시뮬레이션 (오프라인)',
      provider: 'local',
      temperature: 0.7
    };
    
    const lastMessage = messages[messages.length - 1];
    const mockResponse = '이것은 로컬 시뮬레이션 응답입니다.';
    
    return {
      content: mockResponse,
      model: localModelConfig.id,
      raw: {
        content: mockResponse,
        model: localModelConfig.id,
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      }
    };
  }
  
  public getDefaultModelId(): string {
    return environmentService.getDefaultModelId();
  }
  
  public async setDefaultModel(modelId: string): Promise<boolean> {
    try {
      if (!modelId || typeof modelId !== 'string') {
        return false;
      }
    
      const modelConfig = this.getModelConfig(modelId);
      if (!modelConfig) {
        return false;
      }
      
      try {
        const config = vscode.workspace.getConfiguration('ape.llm');
        await config.update('defaultModel', modelId, vscode.ConfigurationTarget.Global);
        return true;
      } catch (updateError) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  
  public getAvailableModels(): ModelConfig[] {
    return Array.from(this.modelCache.values());
  }
  
  public getModelConfig(): ModelConfig[];
  public getModelConfig(modelId: string): ModelConfig | undefined;
  public getModelConfig(modelId?: string): ModelConfig[] | ModelConfig | undefined {
    if (modelId === undefined) {
      return this.getAvailableModels();
    }
    return this.modelCache.get(modelId);
  }
}