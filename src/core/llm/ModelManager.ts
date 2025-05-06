import * as vscode from 'vscode';
import { ModelConfig } from '../../types/LlmTypes';

export class ModelManager {
  private models: Map<string, ModelConfig> = new Map();
  private defaultModelId: string = 'gemini-2.5-flash';
  
  constructor() {
    this.initialize();
  }
  
  public initialize(): void {
    try {
      this.loadModelsFromConfig();
      
      if (this.models.size === 0) {
        this.loadModelsFromEnv();
      }
      
      const config = vscode.workspace.getConfiguration('ape.llm');
      this.defaultModelId = config.get<string>('defaultModel', 'gemini-2.5-flash');
      
      if (!this.models.has(this.defaultModelId)) {
        this.defaultModelId = this.models.size > 0 ? 
          Array.from(this.models.keys())[0] : 'local';
      }
    } catch (error) {
      this.loadFallbackModels();
    }
  }
  
  private loadModelsFromConfig(): void {
    try {
      const config = vscode.workspace.getConfiguration('ape.llm');
      const modelConfigs = config.get<Record<string, ModelConfig>>('models', {});
      
      this.models.clear();
      
      Object.entries(modelConfigs).forEach(([id, modelConfig]) => {
        this.models.set(id, this.validateModelConfig(id, modelConfig));
      });
    } catch (error) {
      this.loadFallbackModels();
    }
  }
  
  private loadModelsFromEnv(): void {
    try {
      const envConfig = require('../../../extension.env.js');
      
      if (envConfig.AVAILABLE_MODELS && Array.isArray(envConfig.AVAILABLE_MODELS)) {
        for (const model of envConfig.AVAILABLE_MODELS) {
          if (model && model.id) {
            this.models.set(model.id, this.validateModelConfig(model.id, model));
          }
        }
      }
      
      if (envConfig.DEFAULT_MODEL) {
        this.defaultModelId = envConfig.DEFAULT_MODEL;
      }
    } catch (error) {
      this.loadFallbackModels();
    }
  }
  
  private loadFallbackModels(): void {
    this.models.clear();
    
    this.models.set('gemini-2.5-flash', {
      id: 'gemini-2.5-flash',
      name: 'Google Gemini 2.5 Flash',
      provider: 'openrouter',
      apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
      apiModel: 'google/gemini-2.5-flash-preview',
      contextWindow: 32000,
      maxTokens: 8192,
      temperature: 0.7
    });
    
    this.models.set('local', {
      id: 'local',
      name: '로컬 시뮬레이션',
      provider: 'local',
      temperature: 0.7
    });
    
    this.defaultModelId = 'gemini-2.5-flash';
  }
  
  private validateModelConfig(id: string, config: Partial<ModelConfig>): ModelConfig {
    return {
      id: id,
      name: config.name || '알 수 없는 모델',
      provider: config.provider || 'local',
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      contextWindow: config.contextWindow,
      maxTokens: config.maxTokens,
      temperature: config.temperature ?? 0.7,
      systemPrompt: config.systemPrompt,
      apiModel: config.apiModel
    };
  }
  
  public getAllModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }
  
  public getDefaultModelId(): string {
    if (!this.models.has(this.defaultModelId)) {
      if (this.models.size > 0) {
        return Array.from(this.models.keys())[0];
      } else {
        this.loadFallbackModels();
        return 'local';
      }
    }
    
    return this.defaultModelId;
  }
  
  public getModelConfig(modelId: string): ModelConfig | undefined {
    return this.models.get(modelId);
  }
}