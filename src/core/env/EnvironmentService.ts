import * as vscode from 'vscode';
import { LoggerService } from '../utils/LoggerService';

export class EnvironmentService {
  private static instance: EnvironmentService;
  private config: any;
  private logger: LoggerService;
  
  private constructor() {
    this.logger = new LoggerService('EnvironmentService');
    this.loadConfig();
  }
  
  public static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }
  
  private loadConfig(): void {
    try {
      try {
        this.config = require('../../../extension.env.js');
      } catch (e) {
        this.config = {};
      }
    } catch (error) {
      this.logger.error('환경 설정 로드 중 오류 발생', error);
      this.config = {};
    }
  }
  
  public getApiEndpoint(serviceName: string): string {
    return this.config.API_ENDPOINTS?.[serviceName] || '';
  }
  
  public getApiKey(keyName: string): string {
    return this.config.API_KEYS?.[keyName] || '';
  }
  
  public getDefaultModelId(): string {
    // 환경 설정에서 먼저 확인
    const configModel = this.config.DEFAULT_MODEL;
    if (configModel) {
      this.logger.info(`환경 설정에서 기본 모델 ID 찾음: ${configModel}`);
      return configModel;
    }
    
    // VS Code 설정에서 확인
    try {
      const vsCodeConfig = vscode.workspace.getConfiguration('ape.llm');
      const vsCodeModel = vsCodeConfig.get<string>('defaultModel');
      if (vsCodeModel) {
        this.logger.info(`VS Code 설정에서 기본 모델 ID 찾음: ${vsCodeModel}`);
        return vsCodeModel;
      }
    } catch (error) {
      this.logger.warn('VS Code 설정에서 기본 모델 로드 중 오류:', error);
    }
    
    // 기본값
    this.logger.info('기본 모델 ID 설정되지 않음, 기본값 사용: gemini-2.5-flash');
    return 'gemini-2.5-flash';
  }
  
  public getAvailableModels(): any[] {
    // 환경 설정에서 먼저 확인
    const configModels = this.config.AVAILABLE_MODELS;
    if (Array.isArray(configModels) && configModels.length > 0) {
      this.logger.info(`환경 설정에서 ${configModels.length}개 모델 찾음`);
      return configModels;
    }
    
    // 기본 모델 목록 제공
    this.logger.info('환경 설정에 모델 목록 없음, 기본 모델 목록 생성');
    return [
      {
        id: 'gemini-2.5-flash',
        name: 'Google Gemini 2.5 Flash',
        provider: 'openrouter',
        temperature: 0.7,
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'google/gemini-2.5-flash-preview',
        maxTokens: 4096
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'openrouter',
        temperature: 0.7,
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'anthropic/claude-3-opus',
        maxTokens: 4096
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'openrouter',
        temperature: 0.7,
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'anthropic/claude-3-sonnet',
        maxTokens: 4096
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        provider: 'openrouter',
        temperature: 0.7,
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'anthropic/claude-3-haiku',
        maxTokens: 4096
      },
      {
        id: 'local-model',
        name: '로컬 시뮬레이션 모델',
        provider: 'local',
        temperature: 0.7
      }
    ];
  }
  
  public useMockData(): boolean {
    return this.config.USE_MOCK_DATA || false;
  }
  
  public forceSslBypass(): boolean {
    return this.config.FORCE_SSL_BYPASS || false;
  }
  
  public reload(): void {
    this.loadConfig();
  }
}

export const environmentService = EnvironmentService.getInstance();