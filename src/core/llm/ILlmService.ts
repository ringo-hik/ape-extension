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
 * 모든 LLM 관련 기능을 정의합니다.
 */
export interface ILlmService {
  /**
   * LLM API로 요청 전송
   * @param options 요청 옵션
   * @returns LLM 응답
   */
  sendRequest(options: LlmRequestOptions): Promise<LlmResponse>;
  
  /**
   * LLM에 텍스트 쿼리 전송 (편의 메서드)
   * @param text 쿼리 텍스트
   * @param model 사용할 모델 ID (선택적)
   * @param options 추가 옵션 (선택적)
   * @returns 응답 텍스트
   */
  queryLlm(text: string, model?: string, options?: Partial<LlmRequestOptions>): Promise<string>;
  
  /**
   * 기본 모델 ID 가져오기
   * @returns 기본 모델 ID
   */
  getDefaultModelId(): string;
  
  /**
   * 기본 모델 변경하기
   * @param modelId 새 모델 ID
   * @returns 변경 성공 여부
   */
  setDefaultModel(modelId: string): Promise<boolean>;
  
  /**
   * 사용 가능한 모델 목록 가져오기
   * @returns 모델 설정 배열
   */
  getAvailableModels(): ModelConfig[];
  
  /**
   * 모델 설정 가져오기
   * @returns 모든 모델 설정 배열
   */
  getModelConfig(): ModelConfig[];
  
  /**
   * 특정 모델 설정 가져오기
   * @param modelId 모델 ID
   * @returns 모델 설정 또는 모델이 없는 경우 undefined
   */
  getModelConfig(modelId: string): ModelConfig | undefined;
  
}