/**
 * LLM 프로바이더 인터페이스
 * 
 * 이 인터페이스는 다양한 LLM 프로바이더(내부망/외부망)에 대한 공통 인터페이스를 정의합니다.
 * 모든 LLM 프로바이더 구현체는 이 인터페이스를 따라야 합니다.
 */

import { ModelConfig, ChatMessage, LlmResponse } from '../../../types/LlmTypes';

export interface ILlmProvider {
  /**
   * 프로바이더 초기화
   */
  initialize(): Promise<void>;
  
  /**
   * 모델 지원 여부 확인
   */
  supportsModel(modelConfig: ModelConfig): boolean;
  
  /**
   * 비스트리밍 LLM 요청 처리
   */
  sendRequest(
    modelConfig: ModelConfig,
    messages: ChatMessage[],
    temperature?: number,
    maxTokens?: number
  ): Promise<LlmResponse>;
  
  /**
   * 스트리밍 LLM 요청 처리
   */
  sendStreamingRequest(
    modelConfig: ModelConfig,
    messages: ChatMessage[],
    onUpdate: (chunk: string) => void,
    temperature?: number,
    maxTokens?: number
  ): Promise<LlmResponse>;
  
  /**
   * 사용 가능한 모델 목록 조회
   */
  getAvailableModels(): Promise<ModelConfig[]>;
  
  /**
   * 이 프로바이더가 현재 환경에서 사용 가능한지 여부
   */
  isAvailableInCurrentEnvironment(): boolean;
}