/**
 * API 클라이언트 인터페이스
 * 다양한 LLM 제공자에 대한 API 호출 처리를 위한 인터페이스
 */
import { ChatMessage, LlmResponse, ModelConfig } from "../../types/LlmTypes";

/**
 * API 클라이언트 인터페이스
 * 모든 LLM 제공자 클라이언트가 구현해야 하는 공통 인터페이스
 */
export interface IApiClient {
  /**
   * 클라이언트 이름 가져오기
   */
  getName(): string;
  
  /**
   * 이 클라이언트가 특정 모델을 지원하는지 확인
   * @param modelConfig 모델 설정
   */
  supportsModel(modelConfig: ModelConfig): boolean;
  
  /**
   * API 요청 전송
   * @param modelConfig 모델 설정
   * @param messages 채팅 메시지 배열
   * @param temperature 온도 설정 (선택적)
   * @param maxTokens 최대 토큰 수 (선택적)
   */
  sendRequest(
    modelConfig: ModelConfig,
    messages: ChatMessage[],
    temperature?: number,
    maxTokens?: number
  ): Promise<LlmResponse>;
  
  /**
   * 스트리밍 API 요청 전송
   * @param modelConfig 모델 설정
   * @param messages 채팅 메시지 배열
   * @param onUpdate 청크 업데이트 콜백
   * @param temperature 온도 설정 (선택적)
   * @param maxTokens 최대 토큰 수 (선택적)
   */
  sendStreamingRequest(
    modelConfig: ModelConfig,
    messages: ChatMessage[],
    onUpdate: (chunk: string) => void,
    temperature?: number,
    maxTokens?: number
  ): Promise<LlmResponse>;
}