/**
 * API 클라이언트 인터페이스 및 구현체
 * 다양한 LLM 제공자에 대한 API 호출 처리
 */
import { ChatMessage, LlmResponse, ModelConfig } from "../../types/LlmTypes";

/**
 * API 클라이언트 인터페이스
 */
export interface ApiClient {
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

/**
 * 커스텀 API 클라이언트 구현
 * 내부망 모델(NARRANS, Llama 등)을 위한 클라이언트
 */
export class CustomApiClient implements ApiClient {
  private idCounter: number = 0;
  
  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    this.idCounter++;
    return `llm-${Date.now()}-${this.idCounter}`;
  }
  
  /**
   * 환경 변수에서 API URL 가져오기
   */
  private getApiUrlFromEnv(modelConfig: ModelConfig): string {
    try {
      // 환경 변수 모듈 로드
      let envModule: any = null;
      try {
        envModule = require('../../../extension.env.js');
      } catch (envError) {
        // 무시 가능한 오류
        return modelConfig.apiUrl || '';
      }
      
      // Llama 또는 NARRANS 모델인 경우 내부망 URL 재정의 가능
      const isLlamaModel = modelConfig.name.toLowerCase().includes('llama');
      const isNarransModel = 
        modelConfig.name.toLowerCase().includes('narrans') || 
        (modelConfig.apiUrl || '').includes('narrans') || 
        (modelConfig.apiUrl || '').includes('api-se-dev');
      
      if (isLlamaModel && envModule && envModule.LLAMA4_API_ENDPOINT) {
        return envModule.LLAMA4_API_ENDPOINT;
      } else if (isNarransModel && envModule && envModule.INTERNAL_API_ENDPOINT) {
        return envModule.INTERNAL_API_ENDPOINT;
      }
      
      return modelConfig.apiUrl || '';
    } catch (error) {
      console.error('ApiClient: API URL 가져오기 오류', error);
      return modelConfig.apiUrl || '';
    }
  }
  
  /**
   * 환경 변수에서 API 키 가져오기
   */
  private getApiKeyFromEnv(modelConfig: ModelConfig): string | undefined {
    try {
      // 환경 변수 모듈 로드
      let envModule: any = null;
      try {
        envModule = require('../../../extension.env.js');
      } catch (envError) {
        // 무시 가능한 오류
        return modelConfig.apiKey;
      }
      
      // Llama 또는 NARRANS 모델인 경우 내부망 API 키 재정의 가능
      const isLlamaModel = modelConfig.name.toLowerCase().includes('llama');
      const isNarransModel = 
        modelConfig.name.toLowerCase().includes('narrans') || 
        (modelConfig.apiUrl || '').includes('narrans') || 
        (modelConfig.apiUrl || '').includes('api-se-dev');
      
      if (isLlamaModel && envModule && envModule.LLAMA4_API_KEY) {
        return envModule.LLAMA4_API_KEY;
      } else if (isNarransModel && envModule && envModule.INTERNAL_API_KEY) {
        return envModule.INTERNAL_API_KEY;
      }
      
      return modelConfig.apiKey;
    } catch (error) {
      console.error('ApiClient: API 키 가져오기 오류', error);
      return modelConfig.apiKey;
    }
  }
  
  /**
   * 요청 헤더 생성
   */
  private createHeaders(modelConfig: ModelConfig, isStreaming: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (isStreaming) {
      headers['Accept'] = 'text/event-stream';
    }
    
    // API URL 가져오기
    const apiUrl = this.getApiUrlFromEnv(modelConfig);
    
    // API 키 가져오기
    const apiKey = this.getApiKeyFromEnv(modelConfig);
    
    // Llama 또는 NARRANS 모델 확인
    const isLlamaModel = modelConfig.name.toLowerCase().includes('llama');
    const isNarransModel = 
      modelConfig.name.toLowerCase().includes('narrans') || 
      apiUrl.includes('narrans') || 
      apiUrl.includes('api-se-dev');
    
    // 내부망 모델인 Llama나 NARRANS일 경우 특수 헤더 추가
    if (isLlamaModel || apiUrl.includes('apigw-stg')) {
      // 고유 ID 생성
      const requestId = this.generateId();
      
      Object.assign(headers, {
        'Send-System-Name': 'swdp',
        'user-id': 'ape_ext',
        'user-type': 'ape_ext',
        'Prompt-Msg-Id': requestId,
        'Completion-msg-Id': requestId
      });
      
      // API 키가 있으면 티켓 헤더에 추가
      if (apiKey) {
        headers['x-dep-ticket'] = apiKey;
      }
    } else if (isNarransModel) {
      // NARRANS 모델 헤더 설정
      if (isStreaming) {
        headers['Accept'] = 'text/event-stream, charset=utf-8';
      }
      
      // API 키가 있으면 인증 헤더 추가
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    } else if (apiKey) {
      // 다른 모델 인증 헤더
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    return headers;
  }
  
  /**
   * 모델 ID 결정
   */
  private getModelId(modelConfig: ModelConfig): string {
    // 모델 ID 결정 (apiModel이 있으면 그것 사용, 없으면 모델 이름 기반)
    let modelId = modelConfig.apiModel;
    
    // Llama 4 모델 특수 처리
    if (modelConfig.name.includes('Llama 4 Maverick')) {
      modelId = 'meta-llama/llama-4-maverick-17b-128e-instruct';
    } else if (modelConfig.name.includes('Llama 4 Scout')) {
      modelId = 'meta-llama/llama-4-scout-17b-15e-instruct';
    } else if (!modelId) {
      modelId = modelConfig.name.toLowerCase();
    }
    
    return modelId;
  }
  
  /**
   * API 요청 전송 (비스트리밍)
   */
  public async sendRequest(
    modelConfig: ModelConfig,
    messages: ChatMessage[],
    temperature?: number,
    maxTokens?: number
  ): Promise<LlmResponse> {
    if (!modelConfig.apiUrl) {
      throw new Error(`Custom 모델 ${modelConfig.name}의 API URL이 지정되지 않았습니다.`);
    }
    
    // API URL 가져오기
    const apiUrl = this.getApiUrlFromEnv(modelConfig);
    
    console.log(`ApiClient: 요청 전송 - 모델: ${modelConfig.name}, API URL: ${apiUrl}`);
    console.log(`ApiClient: 메시지 수: ${messages.length}, 온도: ${temperature ?? modelConfig.temperature ?? 0}`);
    
    try {
      // 헤더 생성
      const headers = this.createHeaders(modelConfig);
      
      // 모델 ID 결정
      const modelId = this.getModelId(modelConfig);
      
      // 요청 본문 생성
      const requestBody = {
        model: modelId,
        messages,
        temperature: temperature ?? modelConfig.temperature ?? 0,
        max_tokens: maxTokens ?? modelConfig.maxTokens ?? 4096,
        stream: false
      };
      
      // 요청 전송
      const fetchResponse = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      // 응답 확인
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text().catch(() => '응답 텍스트를 가져올 수 없음');
        throw new Error(`Custom API 응답 오류 (${fetchResponse.status}): ${fetchResponse.statusText} - ${errorText}`);
      }
      
      console.log(`ApiClient: 응답 성공 - 상태 코드: ${fetchResponse.status}`);
      
      // 응답 파싱
      const responseData = await fetchResponse.json();
      
      // 응답 데이터 구조 검증
      if (!responseData.choices || !responseData.choices.length || !responseData.choices[0].message) {
        console.error('ApiClient: API 응답 형식이 예상과 다릅니다:', responseData);
        throw new Error('API 응답 데이터 형식이 유효하지 않습니다.');
      }
      
      // 응답 변환
      return {
        id: responseData.id || this.generateId(),
        content: responseData.choices[0].message.content,
        model: modelConfig.name,
        usage: responseData.usage ? {
          promptTokens: responseData.usage.prompt_tokens || 0,
          completionTokens: responseData.usage.completion_tokens || 0,
          totalTokens: responseData.usage.total_tokens || 0
        } : undefined
      };
    } catch (error) {
      console.error(`ApiClient: ${modelConfig.name} 요청 오류:`, error);
      throw error;
    }
  }
  
  /**
   * 스트리밍 API 요청 전송
   */
  public async sendStreamingRequest(
    modelConfig: ModelConfig,
    messages: ChatMessage[],
    onUpdate: (chunk: string) => void,
    temperature?: number,
    maxTokens?: number
  ): Promise<LlmResponse> {
    if (!modelConfig.apiUrl) {
      throw new Error(`Custom 모델 ${modelConfig.name}의 API URL이 지정되지 않았습니다.`);
    }
    
    // API URL 가져오기
    const apiUrl = this.getApiUrlFromEnv(modelConfig);
    
    console.log(`ApiClient: 스트리밍 요청 - 모델: ${modelConfig.name}, API URL: ${apiUrl}`);
    
    try {
      // 헤더 생성 (스트리밍용)
      const headers = this.createHeaders(modelConfig, true);
      
      // 모델 ID 결정
      const modelId = this.getModelId(modelConfig);
      
      // 요청 본문 생성
      const requestBody = {
        model: modelId,
        messages,
        temperature: temperature ?? modelConfig.temperature ?? 0,
        max_tokens: maxTokens ?? modelConfig.maxTokens ?? 4096,
        stream: true
      };
      
      // 스트리밍 요청 전송
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      // 응답 확인
      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => '응답 텍스트를 가져올 수 없음');
        throw new Error(`Custom 스트리밍 API 응답 오류 (${response.status}): ${response.statusText} - ${errorText}`);
      }
      
      console.log('ApiClient: 스트리밍 연결 성공 - 응답 처리 시작');
      
      // 응답 ID 및 누적 콘텐츠
      let responseId = this.generateId();
      let accumulatedContent = '';
      
      // 스트림 리더 생성
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // 스트림 처리
      let done = false;
      let eventCount = 0;
      let contentChunks = 0;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        // Server-Sent Events 형식 파싱
        const events = chunk
          .split('\n\n')
          .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');
        
        eventCount += events.length;
        
        for (const event of events) {
          // 'data: ' 접두사 제거 및 JSON 파싱
          if (event.startsWith('data: ')) {
            try {
              const data = JSON.parse(event.slice(6));
              
              if (data.id) {
                responseId = data.id;
              }
              
              // 실제 콘텐츠 추출
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                accumulatedContent += content;
                onUpdate(content);
                contentChunks++;
                
                // 처음 몇 개의 청크만 로깅
                if (contentChunks <= 3 || contentChunks % 50 === 0) {
                  console.log(`ApiClient: 스트리밍 청크 #${contentChunks}: ${content.length > 20 ? content.substring(0, 20) + '...' : content}`);
                }
              }
            } catch (error) {
              console.warn('ApiClient: 스트리밍 데이터 파싱 오류:', error);
            }
          }
        }
      }
      
      console.log(`ApiClient: 스트리밍 완료 - 총 이벤트: ${eventCount}, 청크: ${contentChunks}, 길이: ${accumulatedContent.length}자`);
      
      // 누적 콘텐츠가 없는 경우 오류 처리
      if (accumulatedContent.length === 0) {
        console.warn('ApiClient: 스트리밍 응답에서 내용 추출 실패');
        throw new Error('스트리밍 데이터에서 콘텐츠를 추출할 수 없습니다.');
      }
      
      // 완료된 응답 반환
      return {
        id: responseId,
        content: accumulatedContent,
        model: modelConfig.name
      };
    } catch (error) {
      console.error(`ApiClient: ${modelConfig.name} 스트리밍 오류:`, error);
      throw error;
    }
  }
}

/**
 * 로컬 시뮬레이션 API 클라이언트
 * API 연결 없이 로컬에서 간단한 응답 생성
 */
export class LocalApiClient implements ApiClient {
  private idCounter: number = 0;
  
  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    this.idCounter++;
    return `local-${Date.now()}-${this.idCounter}`;
  }
  
  /**
   * 로컬 시뮬레이션 응답 생성
   */
  private async simulateResponse(
    modelConfig: ModelConfig,
    messages: ChatMessage[]
  ): Promise<LlmResponse> {
    // 메시지 배열 검증
    if (!Array.isArray(messages) || messages.length === 0) {
      console.warn('LocalApiClient: 메시지 배열이 비어있거나 유효하지 않음, 기본 메시지 사용');
      messages = [{
        role: 'user',
        content: '안녕하세요'
      }];
    }
    
    // 마지막 메시지 추출
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content || '';
    
    // 간단한 질의응답 패턴 구현
    let responseText = '';
    
    if (userMessage.match(/안녕|반가워|헬로|하이/i)) {
      responseText = '안녕하세요! 무엇을 도와드릴까요?';
    } 
    else if (userMessage.match(/시간|날짜|오늘|몇 시/i)) {
      responseText = `현재 시간은 ${new Date().toLocaleString()} 입니다.`;
    }
    else if (userMessage.match(/코드|프로그램|개발|버그/i)) {
      responseText = '코드에 대해 질문이 있으신가요? 어떤 부분에서 도움이 필요하신지 자세히 알려주세요.';
    }
    else if (userMessage.match(/도움|도와줘|어떻게|사용법/i)) {
      responseText = '무엇을 도와드릴까요? 더 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.';
    }
    else {
      responseText = `"${userMessage}"에 대한 답변을 찾고 있습니다. 로컬 모델 시뮬레이션 모드에서는 제한된 응답만 제공합니다.`;
    }
    
    // 응답 대기 시간 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: this.generateId(),
      content: responseText,
      model: modelConfig.name || '로컬 시뮬레이션',
      usage: {
        promptTokens: userMessage.length,
        completionTokens: responseText.length,
        totalTokens: userMessage.length + responseText.length
      }
    };
  }
  
  /**
   * API 요청 전송 (비스트리밍)
   */
  public async sendRequest(
    modelConfig: ModelConfig,
    messages: ChatMessage[],
    temperature?: number,
    maxTokens?: number
  ): Promise<LlmResponse> {
    console.log('LocalApiClient: 로컬 시뮬레이션 요청');
    return this.simulateResponse(modelConfig, messages);
  }
  
  /**
   * 스트리밍 API 요청 전송
   */
  public async sendStreamingRequest(
    modelConfig: ModelConfig,
    messages: ChatMessage[],
    onUpdate: (chunk: string) => void,
    temperature?: number,
    maxTokens?: number
  ): Promise<LlmResponse> {
    console.log('LocalApiClient: 로컬 시뮬레이션 스트리밍 요청');
    
    // 로컬 응답 생성
    const response = await this.simulateResponse(modelConfig, messages);
    
    // 스트리밍 시뮬레이션
    const content = response.content;
    
    // 문자 단위로 분할하여 스트리밍 시뮬레이션
    const chunks = content.split(' ');
    let accumulatedContent = '';
    
    for (const chunk of chunks) {
      // 짧은 지연 시간
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 청크 전송 (단어 + 공백)
      const chunkWithSpace = chunk + ' ';
      onUpdate(chunkWithSpace);
      accumulatedContent += chunkWithSpace;
    }
    
    return {
      ...response,
      content: accumulatedContent.trim()
    };
  }
}

/**
 * OpenRouter API 클라이언트 구현
 * OpenRouter를 통해 다양한 LLM 모델에 접근
 */
export class OpenRouterApiClient implements ApiClient {
  private idCounter: number = 0;
  
  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    this.idCounter++;
    return `openrouter-${Date.now()}-${this.idCounter}`;
  }
  
  /**
   * 환경 변수에서 API 키 가져오기
   */
  private getApiKeyFromEnv(): string | undefined {
    try {
      // 환경 변수 모듈 로드
      let envModule: any = null;
      try {
        envModule = require('../../../extension.env.js');
      } catch (envError) {
        console.error('OpenRouterApiClient: 환경 변수 로드 실패', envError);
        return undefined;
      }
      
      // OpenRouter API 키 가져오기
      if (envModule && envModule.OPENROUTER_API_KEY) {
        return envModule.OPENROUTER_API_KEY;
      }
      
      console.warn('OpenRouterApiClient: API 키가 환경 변수에 설정되지 않았습니다.');
      return undefined;
    } catch (error) {
      console.error('OpenRouterApiClient: API 키 가져오기 오류', error);
      return undefined;
    }
  }
  
  /**
   * API 요청 전송 (비스트리밍)
   */
  public async sendRequest(
    modelConfig: ModelConfig,
    messages: ChatMessage[],
    temperature?: number,
    maxTokens?: number
  ): Promise<LlmResponse> {
    // API URL 설정 (OpenRouter는 고정 URL 사용)
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    console.log(`OpenRouterApiClient: 요청 전송 - 모델: ${modelConfig.name}, API 모델: ${modelConfig.apiModel}`);
    
    try {
      // API 키 가져오기
      const apiKey = this.getApiKeyFromEnv();
      
      if (!apiKey) {
        throw new Error('OpenRouter API 키가 설정되지 않았습니다.');
      }
      
      // 헤더 생성
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/user/ape-extension',
        'X-Title': 'APE Extension'
      };
      
      // 모델 ID 결정 (apiModel 필드 사용)
      const modelId = modelConfig.apiModel;
      
      if (!modelId) {
        throw new Error(`OpenRouter 모델 ID가 설정되지 않았습니다. (${modelConfig.name})`);
      }
      
      // 요청 본문 생성
      const requestBody = {
        model: modelId,
        messages,
        temperature: temperature ?? modelConfig.temperature ?? 0.7,
        max_tokens: maxTokens ?? modelConfig.maxTokens ?? 4096,
        stream: false
      };
      
      console.log(`OpenRouterApiClient: 요청 데이터 - 모델: ${modelId}, 메시지 수: ${messages.length}`);
      
      // 요청 전송
      const fetchResponse = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      // 응답 확인
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text().catch(() => '응답 텍스트를 가져올 수 없음');
        throw new Error(`OpenRouter API 응답 오류 (${fetchResponse.status}): ${fetchResponse.statusText} - ${errorText}`);
      }
      
      console.log(`OpenRouterApiClient: 응답 성공 - 상태 코드: ${fetchResponse.status}`);
      
      // 응답 파싱
      const responseData = await fetchResponse.json();
      
      // 응답 데이터 구조 검증
      if (!responseData.choices || !responseData.choices.length || !responseData.choices[0].message) {
        console.error('OpenRouterApiClient: API 응답 형식이 예상과 다릅니다:', responseData);
        throw new Error('API 응답 데이터 형식이 유효하지 않습니다.');
      }
      
      // 응답 변환
      return {
        id: responseData.id || this.generateId(),
        content: responseData.choices[0].message.content,
        model: modelConfig.name,
        usage: responseData.usage ? {
          promptTokens: responseData.usage.prompt_tokens || 0,
          completionTokens: responseData.usage.completion_tokens || 0,
          totalTokens: responseData.usage.total_tokens || 0
        } : undefined
      };
    } catch (error) {
      console.error(`OpenRouterApiClient: ${modelConfig.name} 요청 오류:`, error);
      throw error;
    }
  }
  
  /**
   * 스트리밍 API 요청 전송
   */
  public async sendStreamingRequest(
    modelConfig: ModelConfig,
    messages: ChatMessage[],
    onUpdate: (chunk: string) => void,
    temperature?: number,
    maxTokens?: number
  ): Promise<LlmResponse> {
    // API URL 설정 (OpenRouter는 고정 URL 사용)
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    console.log(`OpenRouterApiClient: 스트리밍 요청 - 모델: ${modelConfig.name}, API 모델: ${modelConfig.apiModel}`);
    
    try {
      // API 키 가져오기
      const apiKey = this.getApiKeyFromEnv();
      
      if (!apiKey) {
        throw new Error('OpenRouter API 키가 설정되지 않았습니다.');
      }
      
      // 헤더 생성
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/user/ape-extension',
        'X-Title': 'APE Extension',
        'Accept': 'text/event-stream'
      };
      
      // 모델 ID 결정 (apiModel 필드 사용)
      const modelId = modelConfig.apiModel;
      
      if (!modelId) {
        throw new Error(`OpenRouter 모델 ID가 설정되지 않았습니다. (${modelConfig.name})`);
      }
      
      // 요청 본문 생성
      const requestBody = {
        model: modelId,
        messages,
        temperature: temperature ?? modelConfig.temperature ?? 0.7,
        max_tokens: maxTokens ?? modelConfig.maxTokens ?? 4096,
        stream: true
      };
      
      console.log(`OpenRouterApiClient: 스트리밍 요청 데이터 - 모델: ${modelId}, 메시지 수: ${messages.length}`);
      
      // 요청 전송
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      // 응답 확인
      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => '응답 텍스트를 가져올 수 없음');
        throw new Error(`OpenRouter 스트리밍 API 응답 오류 (${response.status}): ${response.statusText} - ${errorText}`);
      }
      
      console.log('OpenRouterApiClient: 스트리밍 연결 성공 - 응답 처리 시작');
      
      // 응답 ID 및 누적 콘텐츠
      let responseId = this.generateId();
      let accumulatedContent = '';
      
      // 스트림 리더 생성
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // 스트림 처리
      let done = false;
      let eventCount = 0;
      let contentChunks = 0;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        // Server-Sent Events 형식 파싱
        const events = chunk
          .split('\n\n')
          .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');
        
        eventCount += events.length;
        
        for (const event of events) {
          // 'data: ' 접두사 제거 및 JSON 파싱
          if (event.startsWith('data: ')) {
            try {
              const data = JSON.parse(event.slice(6));
              
              if (data.id) {
                responseId = data.id;
              }
              
              // 실제 콘텐츠 추출
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                accumulatedContent += content;
                onUpdate(content);
                contentChunks++;
                
                // 처음 몇 개의 청크만 로깅
                if (contentChunks <= 3 || contentChunks % 50 === 0) {
                  console.log(`OpenRouterApiClient: 스트리밍 청크 #${contentChunks}: ${content.length > 20 ? content.substring(0, 20) + '...' : content}`);
                }
              }
            } catch (error) {
              console.warn('OpenRouterApiClient: 스트리밍 데이터 파싱 오류:', error);
            }
          }
        }
      }
      
      console.log(`OpenRouterApiClient: 스트리밍 완료 - 총 이벤트: ${eventCount}, 청크: ${contentChunks}, 길이: ${accumulatedContent.length}자`);
      
      // 누적 콘텐츠가 없는 경우 오류 처리
      if (accumulatedContent.length === 0) {
        console.warn('OpenRouterApiClient: 스트리밍 응답에서 내용 추출 실패');
        throw new Error('스트리밍 데이터에서 콘텐츠를 추출할 수 없습니다.');
      }
      
      // 완료된 응답 반환
      return {
        id: responseId,
        content: accumulatedContent,
        model: modelConfig.name
      };
    } catch (error) {
      console.error(`OpenRouterApiClient: ${modelConfig.name} 스트리밍 오류:`, error);
      throw error;
    }
  }
}

/**
 * API 클라이언트 팩토리
 * 모델 제공자에 따라 적절한 API 클라이언트 생성
 */
export class ApiClientFactory {
  /**
   * 모델 제공자에 따른 API 클라이언트 생성
   */
  public static createClient(modelConfig: ModelConfig): ApiClient {
    switch (modelConfig.provider) {
      case 'custom':
        return new CustomApiClient();
      case 'openrouter': // 외부망 OpenRouter 모델 추가
        return new OpenRouterApiClient();
      case 'local':
        return new LocalApiClient();
      default:
        console.warn(`알 수 없는 제공자: ${modelConfig.provider}, 로컬 클라이언트 사용`);
        return new LocalApiClient();
    }
  }
}