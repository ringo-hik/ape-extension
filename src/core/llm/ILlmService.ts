/**
 * LLM 서비스 인터페이스
 * 다양한 LLM 제공자와의 통신을 추상화
 */
import {
  ChatMessage,
  LlmRequestOptions,
  LlmResponse,
  ModelConfig
} from '../../types/LlmTypes';

/**
 * LLM 서비스 인터페이스
 */
export interface ILlmService {
  /**
   * LLM API로 요청 전송
   * @param options 요청 옵션
   */
  sendRequest(options: LlmRequestOptions): Promise<LlmResponse>;
  
  /**
   * LLM에 텍스트 쿼리 전송 (편의 메서드)
   * @param text 쿼리 텍스트
   * @param model 사용할 모델 ID (선택적)
   * @param options 추가 옵션 (선택적)
   */
  queryLlm(text: string, model?: string, options?: Partial<LlmRequestOptions>): Promise<string>;
  
  /**
   * 기본 모델 ID 가져오기
   */
  getDefaultModelId(): string;
  
  /**
   * 사용 가능한 모델 목록 가져오기
   */
  getAvailableModels(): ModelConfig[];
  
  /**
   * 모델 설정 가져오기 (오버로딩)
   * - 매개변수 없이 호출: 모든 모델 설정 반환
   * - 모델 ID 지정: 특정 모델 설정 반환
   */
  getModelConfig(): ModelConfig[];
  getModelConfig(modelId: string): ModelConfig | undefined;
}