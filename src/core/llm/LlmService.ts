/**
 * LLM 서비스 클래스
 * 다양한 제공자의 LLM API와 통신
 */
import * as vscode from 'vscode';
import { 
  ChatMessage, 
  LlmRequestOptions, 
  LlmResponse, 
  ModelConfig,
  ModelProvider
} from '../../types/LlmTypes';
import { ILlmService } from './ILlmService';
import { ModelManager } from './ModelManager';
import { ApiClientFactory } from './ApiClient';

/**
 * LLM 서비스 클래스
 */
export class LlmService implements ILlmService {
  private modelManager: ModelManager;
  
  constructor() {
    this.modelManager = new ModelManager();
    console.log('LlmService 초기화 완료');
  }
  
  /**
   * LLM API로 요청 전송
   */
  public async sendRequest(options: LlmRequestOptions): Promise<LlmResponse> {
    // 옵션 객체 자체가 유효한지 검증
    if (!options) {
      console.error('LlmService: options 객체가 없습니다.');
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
    
    // 메시지 배열이 유효한지 확인
    if (!Array.isArray(messages)) {
      console.error('LlmService: messages가 배열이 아닙니다:', messages);
      throw new Error('요청 메시지가 유효하지 않습니다.');
    }
    
    // 메시지가 비어있는 경우 기본 메시지 추가
    const finalMessages = messages.length === 0 ? [{
      role: 'user',
      content: '안녕하세요'
    }] : messages;
    
    // 모델 ID 로깅
    const modelId = String(model || this.getDefaultModelId());
    console.log(`LlmService: 요청 모델 ID - '${modelId}'`);
    
    // 모델 설정 가져오기
    const modelConfig = this.getModelConfig(modelId);
    if (!modelConfig) {
      console.error(`LlmService: 모델 '${modelId}'를 찾을 수 없습니다.`);
      // 오류 발생 시 로컬 모델로 대체
      console.log(`LlmService: 모델을 찾을 수 없어 로컬 시뮬레이션 모델로 대체합니다.`);
      return this.simulateLocalModel(finalMessages);
    }
    
    // 시스템 프롬프트가 제공되지 않은 경우 기본값 추가
    if (modelConfig.systemPrompt && !finalMessages.some(m => m.role === 'system')) {
      finalMessages.unshift({
        role: 'system',
        content: modelConfig.systemPrompt
      });
    }
    
    console.log('LlmService: 준비된 메시지:', JSON.stringify(finalMessages));
    
    try {
      // 모델 제공자에 맞는 API 클라이언트 생성
      const apiClient = ApiClientFactory.createClient(modelConfig);
      
      // 스트리밍 모드인 경우
      if (stream && onUpdate) {
        return await apiClient.sendStreamingRequest(
          modelConfig,
          finalMessages,
          onUpdate,
          temperature,
          maxTokens
        );
      }
      
      // 일반 모드 (비스트리밍)
      return await apiClient.sendRequest(
        modelConfig,
        finalMessages,
        temperature,
        maxTokens
      );
    } catch (error: any) {
      console.error('LlmService: 요청 중 오류 발생:', error);
      
      // API 키 오류인 경우 로컬 시뮤레이션으로 대체
      if (error.code === 'missing_api_key' || error.code === 'invalid_api_key') {
        console.warn(`LlmService: API 키 오류로 인해 로컬 시뮤레이션으로 전환: ${error.message}`);
        return this.simulateLocalModel(finalMessages);
      }
      
      // 기타 모든 오류 발생 시 로컬 모드로 폴백
      console.warn(`LlmService: 오류로 인해 로컬 시뮤레이션으로 전환: ${error.message}`);
      return this.simulateLocalModel(finalMessages);
    }
  }
  
  /**
   * LLM에 텍스트 쿼리 전송 (편의 메서드)
   */
  public async queryLlm(
    text: string, 
    model?: string, 
    options?: Partial<LlmRequestOptions>
  ): Promise<string> {
    if (!text) {
      return '쿼리 텍스트가 비어 있습니다.';
    }
    
    try {
      // 기본 요청 옵션 구성
      const requestOptions: LlmRequestOptions = {
        model: model || this.getDefaultModelId(),
        messages: [{
          role: 'user',
          content: text
        }],
        ...options
      };
      
      // 요청 전송
      const response = await this.sendRequest(requestOptions);
      
      // 응답 컨텐츠 반환
      return response.content;
    } catch (error) {
      console.error('LlmService.queryLlm 오류:', error);
      return `쿼리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
    }
  }
  
  /**
   * 로컬 모델 시뮬레이션 (실제 API 호출 없이 데모용)
   */
  private async simulateLocalModel(messages: ChatMessage[]): Promise<LlmResponse> {
    console.log('LlmService: 로컬 모델 시뮬레이션 시작');
    
    // 로컬 모델용 기본 설정
    const localModelConfig: ModelConfig = {
      id: 'local-fallback',
      name: '로컬 시뮬레이션 (오프라인)',
      provider: 'local',
      temperature: 0.7,
      systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
    };
    
    // 로컬 API 클라이언트 생성 및 요청 전송
    const localClient = ApiClientFactory.createClient(localModelConfig);
    return localClient.sendRequest(localModelConfig, messages);
  }
  
  /**
   * 기본 모델 ID 가져오기
   */
  public getDefaultModelId(): string {
    return this.modelManager.getDefaultModelId();
  }
  
  /**
   * 사용 가능한 모델 목록 가져오기
   */
  public getAvailableModels(): ModelConfig[] {
    try {
      // 1. 모델 매니저에서 모델 가져오기
      let models = this.modelManager.getAllModels();
      
      // 2. 모델이 없으면 package.json에서 로드
      if (models.length < 2) {
        const packageModels = this.modelManager.loadModelsFromPackageJson();
        if (packageModels.length > 0) {
          models = packageModels;
        }
      }
      
      // 3. 여전히 없으면 폴백 모델 사용
      if (models.length < 2) {
        models = this.modelManager.getFallbackModels();
      }
      
      return models;
    } catch (error) {
      console.error('getAvailableModels 실행 중 오류 발생:', error);
      return this.modelManager.getFallbackModels();
    }
  }
  
  /**
   * 모델 설정 가져오기 - 오버로딩 구현
   */
  public getModelConfig(): ModelConfig[];
  public getModelConfig(modelId: string): ModelConfig | undefined;
  public getModelConfig(modelId?: string): ModelConfig[] | ModelConfig | undefined {
    if (modelId === undefined) {
      // 모든 모델 설정 반환
      return this.modelManager.getAllModels();
    }
    // 특정 모델 설정 반환
    return this.modelManager.getModelConfig(modelId);
  }
}