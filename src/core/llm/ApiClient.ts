import { environmentService } from '../env/EnvironmentService';
import { IApiClient } from './IApiClient';
import { LoggerService } from '../utils/LoggerService';
import { SSLBypassService } from '../utils/SSLBypassService';
import { HttpClientService } from '../http/HttpClientService';
import { 
  ChatCompletionRequest, 
  ChatCompletionResponse,
  ModelInfo, 
  ChatMessage,
  LLMErrorResponse
} from '../../types/LlmTypes';

export class ApiClient implements IApiClient {
  private logger: LoggerService;
  private httpClient: HttpClientService;
  private sslBypassService: SSLBypassService;
  
  constructor(private modelInfo: ModelInfo) {
    this.logger = new LoggerService('ApiClient');
    this.httpClient = new HttpClientService();
    this.sslBypassService = new SSLBypassService();
    
    if (environmentService.forceSslBypass()) {
      this.sslBypassService.bypassSSLVerification();
    }
  }
  
  private getApiEndpoint(): string {
    if (this.modelInfo.apiUrl) {
      return this.modelInfo.apiUrl;
    }
    
    switch (this.modelInfo.provider) {
      case 'openrouter':
        return environmentService.getApiEndpoint('OPENROUTER_API');
      case 'custom':
        return this.modelInfo.apiUrl || '';
      default:
        return environmentService.getApiEndpoint('NARRANS_API');
    }
  }
  
  private getApiKey(): string {
    if (this.modelInfo.apiKey) {
      return this.modelInfo.apiKey;
    }
    
    switch (this.modelInfo.provider) {
      case 'openrouter':
        return environmentService.getApiKey('OPENROUTER_API_KEY');
      case 'custom':
        if (this.modelInfo.name?.toLowerCase().includes('narrans')) {
          return environmentService.getApiKey('NARRANS_API_KEY');
        } else if (this.modelInfo.name?.toLowerCase().includes('llama')) {
          return environmentService.getApiKey('LLAMA4_API_KEY');
        }
        return '';
      default:
        return environmentService.getApiKey('NARRANS_API_KEY');
    }
  }
  
  private createHeaders(): Record<string, string> {
    const apiKey = this.getApiKey();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      if (this.modelInfo.provider === 'openrouter') {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['HTTP-Referer'] = 'https://ape.samsungds.net';
        headers['X-Title'] = 'APE - Agentic Pipeline Engine';
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }
    
    return headers;
  }
  
  private createRequestBody(messages: ChatMessage[], systemPrompt?: string): any {
    const requestMessages = [...messages];
    
    if (systemPrompt && (messages.length === 0 || messages[0].role !== 'system')) {
      requestMessages.unshift({
        role: 'system',
        content: systemPrompt
      });
    }
    
    const requestBody: any = {
      messages: requestMessages,
      temperature: this.modelInfo.temperature || 0.7,
      max_tokens: this.modelInfo.maxTokens || 2048,
      stream: true
    };
    
    if (this.modelInfo.provider === 'openrouter') {
      requestBody.model = this.modelInfo.apiModel || 'google/gemini-2.5-flash-preview';
      requestBody.transforms = ['middle-out'];
    }
    
    if (this.modelInfo.topK) requestBody.top_k = this.modelInfo.topK;
    if (this.modelInfo.topP) requestBody.top_p = this.modelInfo.topP;
    if (this.modelInfo.presencePenalty) requestBody.presence_penalty = this.modelInfo.presencePenalty;
    if (this.modelInfo.frequencyPenalty) requestBody.frequency_penalty = this.modelInfo.frequencyPenalty;
    
    return requestBody;
  }
  
  public async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      if (environmentService.useMockData() || this.modelInfo.provider === 'local') {
        return this.getMockResponse(request);
      }
      
      const apiUrl = this.getApiEndpoint();
      if (!apiUrl) {
        throw new Error('API 엔드포인트가 설정되지 않았습니다.');
      }
      
      const headers = this.createHeaders();
      const requestBody = this.createRequestBody(
        request.messages, 
        request.systemPrompt || this.modelInfo.systemPrompt
      );
      
      const isStreaming = request.stream !== undefined ? request.stream : true;
      
      if (isStreaming && request.onUpdate) {
        return this.handleStreamingRequest(apiUrl, headers, requestBody, request.onUpdate);
      } else {
        return this.handleNonStreamingRequest(apiUrl, headers, requestBody);
      }
    } catch (error) {
      this.logger.error('채팅 완성 요청 중 오류 발생', error);
      
      const errorResponse: LLMErrorResponse = {
        error: true,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        code: error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN_ERROR'
      };
      
      return {
        error: errorResponse,
        content: '',
        model: this.modelInfo.id || 'unknown',
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    }
  }
  
  private async handleStreamingRequest(
    apiUrl: string, 
    headers: Record<string, string>, 
    requestBody: any,
    onUpdate: (content: string) => void
  ): Promise<ChatCompletionResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        let fullContent = '';
        
        const response = await this.httpClient.post(
          apiUrl,
          requestBody,
          {
            headers,
            responseType: 'stream'
          }
        );
        
        for await (const chunk of response.data) {
          try {
            const chunkStr = chunk.toString();
            const lines = chunkStr.split('\n').filter(Boolean);
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                
                if (jsonStr === '[DONE]') {
                  break;
                }
                
                try {
                  const json = JSON.parse(jsonStr);
                  
                  const content = json.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullContent += content;
                    onUpdate(fullContent);
                  }
                } catch (e) {}
              }
            }
          } catch (e) {}
        }
        
        resolve({
          content: fullContent,
          model: this.modelInfo.id || 'unknown',
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private async handleNonStreamingRequest(
    apiUrl: string, 
    headers: Record<string, string>, 
    requestBody: any
  ): Promise<ChatCompletionResponse> {
    requestBody.stream = false;
    
    const response = await this.httpClient.post(apiUrl, requestBody, { headers });
    const responseData = response.data;
    
    return {
      content: responseData.choices?.[0]?.message?.content || '',
      model: responseData.model || this.modelInfo.id || 'unknown',
      usage: responseData.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }
  
  private getMockResponse(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return new Promise(resolve => {
      const lastMessage = request.messages[request.messages.length - 1];
      const query = lastMessage.content;
      
      let mockResponse = '이것은 Mock 응답입니다.';
      
      if (request.onUpdate) {
        request.onUpdate(mockResponse);
      }
      
      resolve({
        content: mockResponse,
        model: `mock-${this.modelInfo.id || 'model'}`,
        usage: {
          prompt_tokens: query.length / 4,
          completion_tokens: mockResponse.length / 4,
          total_tokens: (query.length + mockResponse.length) / 4
        }
      });
    });
  }
}