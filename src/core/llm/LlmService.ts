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
  ModelProvider,
  ApiKeyError
} from '../../types/LlmTypes';
import { ILlmService } from './ILlmService';
import { ModelManager } from './ModelManager';
import { ApiClientFactory } from './ApiClient';
import { LoggerService } from '../utils/LoggerService';

/**
 * LLM 서비스 클래스
 * ILlmService 인터페이스 구현
 */
export class LlmService implements ILlmService {
  private modelManager: ModelManager;
  private logger: LoggerService;
  
  constructor() {
    this.modelManager = new ModelManager();
    this.logger = new LoggerService();
    this.logger.info('LlmService 초기화 완료');
  }
  
  /**
   * LLM API로 요청 전송
   * @param options 요청 옵션
   */
  public async sendRequest(options: LlmRequestOptions): Promise<LlmResponse> {
    // 옵션 객체 검증
    if (!options) {
      this.logger.error('LlmService: options 객체가 없습니다.');
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
    
    // 메시지 배열 검증
    if (!Array.isArray(messages)) {
      this.logger.error('LlmService: messages가 배열이 아닙니다:', messages);
      throw new Error('요청 메시지가 유효하지 않습니다.');
    }
    
    // 메시지가 비어있는 경우 기본 메시지 추가
    const finalMessages = messages.length === 0 ? [{
      role: 'user',
      content: '안녕하세요'
    }] : messages;
    
    // 모델 ID 로깅
    const modelId = String(model || this.getDefaultModelId());
    this.logger.info(`LlmService: 요청 모델 ID - '${modelId}'`);
    
    // 모델 설정 가져오기
    const modelConfig = this.getModelConfig(modelId);
    if (!modelConfig) {
      this.logger.error(`LlmService: 모델 '${modelId}'를 찾을 수 없습니다.`);
      // 오류 발생 시 로컬 모델로 대체
      this.logger.info(`LlmService: 모델을 찾을 수 없어 로컬 시뮬레이션 모델로 대체합니다.`);
      return this.simulateLocalModel(finalMessages);
    }
    
    // 시스템 프롬프트가 제공되지 않은 경우 기본값 추가
    if (modelConfig.systemPrompt && !finalMessages.some(m => m.role === 'system')) {
      finalMessages.unshift({
        role: 'system',
        content: modelConfig.systemPrompt
      });
    }
    
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
    } catch (error) {
      this.logger.error('LlmService: 요청 중 오류 발생:', error);
      
      // API 키 오류인지 확인하는 타입 가드
      const isApiKeyError = (err: unknown): err is ApiKeyError => {
        return err instanceof Error && 
               'code' in err && 
               (err as { code?: string }).code !== undefined &&
               ((err as { code: string }).code === 'missing_api_key' || (err as { code: string }).code === 'invalid_api_key');
      };
      
      // API 키 오류인 경우 로컬 시뮤레이션으로 대체
      if (isApiKeyError(error)) {
        this.logger.warn(`LlmService: API 키 오류로 인해 로컬 시뮤레이션으로 전환: ${error.message}`);
        return this.simulateLocalModel(finalMessages);
      }
      
      // 기타 모든 오류 발생 시 로컬 모드로 폴백
      const errorMessage = error instanceof Error ? error.message : 
                         (typeof error === 'string' ? error : '알 수 없는 오류');
      this.logger.warn(`LlmService: 오류로 인해 로컬 시뮤레이션으로 전환: ${errorMessage}`);
      return this.simulateLocalModel(finalMessages);
    }
  }
  
  /**
   * LLM에 텍스트 쿼리 전송 (편의 메서드)
   * @param text 쿼리 텍스트
   * @param model 사용할 모델 ID (선택적)
   * @param options 추가 옵션 (선택적)
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
      this.logger.error('LlmService.queryLlm 오류:', error);
      return `쿼리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
    }
  }
  
  /**
   * 로컬 모델 시뮬레이션 (실제 API 호출 없이 데모용)
   * @param messages 메시지 배열
   * @returns 시뮬레이션 응답
   */
  private async simulateLocalModel(messages: ChatMessage[]): Promise<LlmResponse> {
    this.logger.info('LlmService: 로컬 모델 시뮬레이션 시작');
    
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
   * 기본 모델 ID 설정하기
   * @param modelId 새 모델 ID
   * @returns 설정 성공 여부
   */
  public async setDefaultModel(modelId: string): Promise<boolean> {
    try {
      // 입력값 검증
      if (!modelId || typeof modelId !== 'string') {
        this.logger.error('LlmService: 유효하지 않은 모델 ID');
        return false;
      }
    
      // 모델 존재 확인
      const modelConfig = this.getModelConfig(modelId);
      if (!modelConfig) {
        this.logger.error(`LlmService: 모델 '${modelId}'를 찾을 수 없어 기본 모델로 설정할 수 없습니다.`);
        return false;
      }
      
      try {
        // VS Code 설정 업데이트 (async/await 패턴으로 수정)
        const config = vscode.workspace.getConfiguration('ape.llm');
        await config.update('defaultModel', modelId, vscode.ConfigurationTarget.Global);
        this.logger.info(`LlmService: 기본 모델이 '${modelId}'(으)로 설정되었습니다.`);
        return true;
      } catch (updateError) {
        const errorMessage = updateError instanceof Error ? updateError.message : 
                           (typeof updateError === 'string' ? updateError : '알 수 없는 오류');
        this.logger.error(`LlmService: 기본 모델 설정 중 오류: ${errorMessage}`);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 
                         (typeof error === 'string' ? error : '알 수 없는 오류');
      this.logger.error(`LlmService: 기본 모델 설정 중 오류: ${errorMessage}`);
      return false;
    }
  }
  
  /**
   * 사용 가능한 모델 목록 가져오기
   */
  public getAvailableModels(): ModelConfig[] {
    try {
      // 1. 모델 매니저에서 모델 가져오기
      let models = this.modelManager.getAllModels();
      
      // 2. 모델이 없으면 package.json에서 로드
      if (!models || models.length < 2) {
        try {
          const packageModels = this.modelManager.loadModelsFromPackageJson();
          if (packageModels && packageModels.length > 0) {
            models = packageModels;
            this.logger.info(`package.json에서 ${packageModels.length}개의 모델을 로드했습니다.`);
          }
        } catch (packageLoadError) {
          this.logger.error('package.json에서 모델 로드 중 오류:', 
            packageLoadError instanceof Error ? packageLoadError.message : String(packageLoadError));
        }
      }
      
      // 3. 여전히 없으면 폴백 모델 사용
      if (!models || models.length < 2) {
        this.logger.warn('충분한 모델을 찾을 수 없어 폴백 모델을 사용합니다.');
        models = this.modelManager.getFallbackModels();
      }
      
      return models;
    } catch (error) {
      this.logger.error('getAvailableModels 실행 중 오류 발생:',
        error instanceof Error ? error.message : String(error));
      
      try {
        // 안전한 폴백 메커니즘
        return this.modelManager.getFallbackModels();
      } catch (fallbackError) {
        // 최악의 경우 기본 모델 배열 반환
        this.logger.error('폴백 모델 로드 중 심각한 오류 발생. 기본 모델 사용:',
          fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
        
        return [{
          id: 'local-emergency',
          name: '로컬 시뮬레이션 (오프라인)',
          provider: 'local',
          temperature: 0.7,
          systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
        }];
      }
    }
  }
  
  /**
   * 모델 설정 가져오기 - 오버로딩 구현
   * @param modelId 모델 ID (선택적)
   * @returns 모델 ID가 없는 경우 모든 모델 설정, 있는 경우 특정 모델 설정
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