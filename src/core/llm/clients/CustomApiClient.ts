/**
 * 커스텀 API 클라이언트
 * 내부망 모델(NARRANS, Llama 등)을 위한 클라이언트
 */
import { ChatMessage, LlmResponse, ModelConfig } from "../../../types/LlmTypes";
import { IApiClient } from "../IApiClient";

/**
 * 커스텀 API 클라이언트 구현
 * 내부망 모델(NARRANS, Llama 등)을 위한 클라이언트
 */
export class CustomApiClient implements IApiClient {
  private idCounter: number = 0;
  
  /**
   * 클라이언트 이름 가져오기
   */
  public getName(): string {
    return 'Custom API Client';
  }
  
  /**
   * 이 클라이언트가 특정 모델을 지원하는지 확인
   * @param modelConfig 모델 설정
   */
  public supportsModel(modelConfig: ModelConfig): boolean {
    return modelConfig.provider === 'custom';
  }
  
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
      // 모델 설정에 API URL이 있으면 우선 사용
      if (modelConfig.apiUrl) {
        return modelConfig.apiUrl;
      }
      
      // 환경 설정에서 API URL 찾기
      let envModule: any = null;
      try {
        envModule = require('../../../../extension.env.js');
      } catch (envError) {
        console.warn('ApiClient: 환경 설정 로드 실패');
        return '';
      }
      
      // 모델 ID 기반의 API 엔드포인트 환경 변수 찾기
      const modelId = modelConfig.id || '';
      const endpointKey = `${modelId.toUpperCase()}_API_ENDPOINT`;
      
      if (envModule[endpointKey]) {
        return envModule[endpointKey];
      }
      
      // 모델 제공자 기반 API 엔드포인트 환경 변수 찾기
      const providerKey = `${modelConfig.provider.toUpperCase()}_API_ENDPOINT`;
      
      if (envModule[providerKey]) {
        return envModule[providerKey];
      }
      
      // 기본 내부망/외부망 API 엔드포인트 확인
      if (envModule.INTERNAL_API_ENDPOINT) {
        return envModule.INTERNAL_API_ENDPOINT;
      }
      
      return '';
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
      // 모델 설정에 API 키가 있으면 우선 사용
      if (modelConfig.apiKey) {
        return modelConfig.apiKey;
      }
      
      // 환경 설정에서 API 키 찾기
      let envModule: any = null;
      try {
        envModule = require('../../../../extension.env.js');
      } catch (envError) {
        console.warn('ApiClient: 환경 설정 로드 실패');
        return undefined;
      }
      
      // 모델 ID 기반의 API 키 환경 변수 찾기
      const modelId = modelConfig.id || '';
      const keyVarName = `${modelId.toUpperCase()}_API_KEY`;
      
      if (envModule[keyVarName]) {
        return envModule[keyVarName];
      }
      
      // 모델 제공자 기반 API 키 환경 변수 찾기
      const providerKey = `${modelConfig.provider.toUpperCase()}_API_KEY`;
      
      if (envModule[providerKey]) {
        return envModule[providerKey];
      }
      
      // 기본 내부망/외부망 API 키 확인
      if (envModule.INTERNAL_API_KEY) {
        return envModule.INTERNAL_API_KEY;
      }
      
      return undefined;
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
    
    // API URL과 키 가져오기
    const apiUrl = this.getApiUrlFromEnv(modelConfig);
    const apiKey = this.getApiKeyFromEnv(modelConfig);
    
    // 환경 변수에서 헤더 설정 정보 로드
    let envModule: any = null;
    try {
      envModule = require('../../../../extension.env.js');
    } catch (error) {
      console.warn('ApiClient: 환경 설정 로드 실패');
    }
    
    // 모델 ID 또는 공급자 기반 헤더 설정 적용
    const headersKey = `${modelConfig.id ? modelConfig.id.toUpperCase() : ''}_HEADERS`;
    const providerHeadersKey = `${modelConfig.provider.toUpperCase()}_HEADERS`;
    
    // 모델별 또는 공급자별 헤더 설정이 있으면 적용
    if (envModule && envModule[headersKey] && typeof envModule[headersKey] === 'object') {
      Object.assign(headers, envModule[headersKey]);
    } else if (envModule && envModule[providerHeadersKey] && typeof envModule[providerHeadersKey] === 'object') {
      Object.assign(headers, envModule[providerHeadersKey]);
    }
    
    // API 경로에 따른 기본 헤더 설정
    if (apiUrl && apiUrl.includes('apigw-stg')) {
      const requestId = this.generateId();
      
      Object.assign(headers, {
        'Send-System-Name': 'swdp',
        'user-id': 'ape_ext',
        'user-type': 'ape_ext',
        'Prompt-Msg-Id': requestId,
        'Completion-msg-Id': requestId
      });
      
      if (apiKey) {
        headers['x-dep-ticket'] = apiKey;
      }
    } else if (apiKey) {
      // 일반적인 경우 표준 Bearer 인증 헤더 사용
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    // 스트리밍 응답이 필요하면 Accept 헤더 설정
    if (isStreaming && apiUrl && apiUrl.includes('api-se-dev')) {
      headers['Accept'] = 'text/event-stream, charset=utf-8';
    }
    
    return headers;
  }
  
  /**
   * 모델 ID 결정
   */
  private getModelId(modelConfig: ModelConfig): string {
    // 모델 설정에 API 모델 ID가 있으면 우선 사용
    if (modelConfig.apiModel) {
      return modelConfig.apiModel;
    }
    
    // 환경 변수에서 모델 ID 매핑 정보 찾기
    try {
      const envModule = require('../../../../extension.env.js');
      const modelId = modelConfig.id || '';
      const modelVarName = `${modelId.toUpperCase()}_API_MODEL_ID`;
      
      if (envModule[modelVarName]) {
        return envModule[modelVarName];
      }
    } catch (error) {
      console.warn('ApiClient: 환경 설정에서 모델 ID 매핑 로드 실패');
    }
    
    // 모델 이름에서 특수 문자 제거한 소문자 ID 생성
    return modelConfig.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
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
    
    
    const apiUrl = this.getApiUrlFromEnv(modelConfig);
    
    console.log(`ApiClient: 요청 전송 - 모델: ${modelConfig.name}, API URL: ${apiUrl}`);
    console.log(`ApiClient: 메시지 수: ${messages.length}, 온도: ${temperature ?? modelConfig.temperature ?? 0}`);
    
    try {
      
      const headers = this.createHeaders(modelConfig);
      
      
      const modelId = this.getModelId(modelConfig);
      
      
      const requestBody = {
        model: modelId,
        messages,
        temperature: temperature ?? modelConfig.temperature ?? 0,
        max_tokens: maxTokens ?? modelConfig.maxTokens ?? 4096,
        stream: false
      };
      
      
      const fetchResponse = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text().catch(() => '응답 텍스트를 가져올 수 없음');
        throw new Error(`Custom API 응답 오류 (${fetchResponse.status}): ${fetchResponse.statusText} - ${errorText}`);
      }
      
      console.log(`ApiClient: 응답 성공 - 상태 코드: ${fetchResponse.status}`);
      
      
      const responseData = await fetchResponse.json();
      
      
      if (!responseData.choices || !responseData.choices.length || !responseData.choices[0].message) {
        console.error('ApiClient: API 응답 형식이 예상과 다릅니다:', responseData);
        throw new Error('API 응답 데이터 형식이 유효하지 않습니다.');
      }
      
      
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
    
    
    const apiUrl = this.getApiUrlFromEnv(modelConfig);
    
    console.log(`ApiClient: 스트리밍 요청 - 모델: ${modelConfig.name}, API URL: ${apiUrl}`);
    
    try {
      
      const headers = this.createHeaders(modelConfig, true);
      
      
      const modelId = this.getModelId(modelConfig);
      
      
      const requestBody = {
        model: modelId,
        messages,
        temperature: temperature ?? modelConfig.temperature ?? 0,
        max_tokens: maxTokens ?? modelConfig.maxTokens ?? 4096,
        stream: true
      };
      
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      
      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => '응답 텍스트를 가져올 수 없음');
        throw new Error(`Custom 스트리밍 API 응답 오류 (${response.status}): ${response.statusText} - ${errorText}`);
      }
      
      console.log('ApiClient: 스트리밍 연결 성공 - 응답 처리 시작');
      
      
      let responseId = this.generateId();
      let accumulatedContent = '';
      
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      
      let done = false;
      let eventCount = 0;
      let contentChunks = 0;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        
        const events = chunk
          .split('\n\n')
          .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');
        
        eventCount += events.length;
        
        for (const event of events) {
          
          if (event.startsWith('data: ')) {
            try {
              const data = JSON.parse(event.slice(6));
              
              if (data.id) {
                responseId = data.id;
              }
              
              
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                accumulatedContent += content;
                onUpdate(content);
                contentChunks++;
                
                
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
      
      
      if (accumulatedContent.length === 0) {
        console.warn('ApiClient: 스트리밍 응답에서 내용 추출 실패');
        throw new Error('스트리밍 데이터에서 콘텐츠를 추출할 수 없습니다.');
      }
      
      
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