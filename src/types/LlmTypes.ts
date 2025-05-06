/**
 * LLM 메시지 역할
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * 채팅 메시지 인터페이스
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * 모델 제공자 타입
 */
export type ModelProvider = 'custom' | 'local';

// 내부망 서비스를 위한 설정이므로 외부 API 제공자(openai/anthropic/azure 등)은 제거됨

/**
 * 모델 설정 인터페이스
 */
export interface ModelConfig {
  id?: string;           // 모델의 고유 식별자
  modelId?: string;      // UI 표시용 모델 ID
  name: string;
  provider: ModelProvider;
  apiKey?: string;
  apiUrl?: string;
  contextWindow?: number;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  apiModel?: string; // API 호출 시 사용할 정확한 모델 ID
}

/**
 * LLM 요청 옵션
 */
export interface LlmRequestOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onUpdate?: (chunk: string) => void;
  signal?: AbortSignal; // 요청 취소 시그널
  embedDevMode?: boolean; // 심층 분석 모드
  deepAnalysis?: boolean; // 심층 분석 활성화
  internalDataAccess?: boolean; // 내부 데이터 접근 권한
}

/**
 * LLM 응답 인터페이스
 */
export interface LlmResponse {
  id: string;
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * API 키 오류 인터페이스
 */
export interface ApiKeyError extends Error {
  code: 'missing_api_key' | 'invalid_api_key';
  model: string;
  provider: ModelProvider;
}