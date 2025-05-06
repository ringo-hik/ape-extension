import * as vscode from 'vscode';
import { HttpClientService } from '../http/HttpClientService';
import { 
  ChatMessage, 
  LlmRequestOptions, 
  LlmResponse, 
  ModelConfig,
  ModelProvider
} from '../../types/LlmTypes';

/**
 * LLM 서비스 클래스
 * 다양한 제공자의 LLM API와 통신
 */
export class LlmService {
  private httpClient: HttpClientService;
  private models: Map<string, ModelConfig> = new Map();
  private defaultModel: string = 'gemini-2.5-flash'; // 기본 모델을 Google Gemini 2.5 Flash로 변경
  private idCounter: number = 0;
  
  constructor() {
    this.httpClient = new HttpClientService();
    this.httpClient.setSSLBypass(true);
    
    try {
      // VS Code 설정에서 기본 모델 ID 로드
      const config = vscode.workspace.getConfiguration('ape.llm');
      this.defaultModel = config.get<string>('defaultModel', 'gemini-2.5-flash');
      
      console.log(`LLM 서비스 초기화: 기본 모델 ID - ${this.defaultModel}`);
      
      // 스트리밍 지원 여부 확인
      const supportsStreaming = config.get<boolean>('supportsStreaming', true);
      console.log(`스트리밍 지원 여부: ${supportsStreaming ? '지원' : '미지원'}`);
      
      // 서비스 환경 로그 (내부망/외부망)
      if (this.canConnectToInternalNetwork()) {
        console.log('내부망 환경으로 감지됨 - 내부 LLM 모델 사용 가능');
      } else {
        console.log('외부망 환경으로 감지됨 - 외부 LLM 모델 (OpenRouter 등) 사용 권장');
      }
      
      this.loadModelsFromConfig();
    } catch (error) {
      console.error('LLM 서비스 초기화 오류:', error);
      this.defaultModel = 'local';
      this.loadModelsFromConfig();
    }
  }
  
  /**
   * 내부망 연결 가능 여부 확인 (간단한 체크)
   * 철칙: 이 코드는 두 환경 모두에서 작동해야 함
   */
  private canConnectToInternalNetwork(): boolean {
    try {
      // 내부망 주소 패턴 체크 (간단한 휴리스틱)
      const modelsConfig = vscode.workspace.getConfiguration('ape.llm').get<Record<string, ModelConfig>>('models', {});
      
      // 1. 모델 구성에서 내부망 주소 확인
      for (const modelConfig of Object.values(modelsConfig)) {
        // 내부망 도메인 체크
        if (modelConfig.apiUrl && (
            modelConfig.apiUrl.includes('narrans') || 
            modelConfig.apiUrl.includes('api-se-dev') ||
            modelConfig.apiUrl.includes('apigw-stg'))) {
          
          // 2. 내부망 체크를 위한 추가 조건 (실제 환경 체크)
          if (process.platform === 'win32') {
            // Windows 환경에서는 내부망일 가능성이 높음
            console.log('Windows 환경에서 실행 중 - 내부망 환경 가정');
            return true;
          } else {
            // WSL/Linux 환경에서는 내부망 테스트
            console.log('WSL/Linux 환경에서 실행 중 - 도메인 체크 필요');
            
            // 여기서는 단순 패턴 체크만 수행 (실제로는 핑이나 요청 테스트 필요)
            // 실시간 연결 체크는 하지 않고, 설정 기반으로 판단
            const forceInternalNetwork = vscode.workspace.getConfiguration('ape.core').get<boolean>('forceInternalNetwork', false);
            
            if (forceInternalNetwork) {
              console.log('설정에 의해 내부망 모드 강제 적용됨');
              return true;
            }
            
            return false; // 기본적으로 WSL/Linux에서는 외부망으로 가정
          }
        }
      }
      
      // 모델 설정에 내부망 주소가 없으면 외부망으로 간주
      return false;
    } catch (error) {
      console.error('내부망 확인 오류:', error);
      return false;
    }
  }
  
  /**
   * 고유 ID 생성 (uuid 대신 간단한 구현)
   */
  private generateId(): string {
    this.idCounter++;
    return `llm-${Date.now()}-${this.idCounter}`;
  }
  
  /**
   * 설정에서 모델 정보 로드
   */
  private loadModelsFromConfig(): void {
    console.log('LLM 모델 설정 로드 시작');
    const config = vscode.workspace.getConfiguration('ape.llm');
    const modelConfigs = config.get<Record<string, ModelConfig>>('models', {});
    
    console.log(`설정에서 ${Object.keys(modelConfigs).length}개의 모델 구성 로드됨`);
    
    Object.entries(modelConfigs).forEach(([id, modelConfig]) => {
      console.log(`모델 등록: ${id} (${modelConfig.name})`);
      this.models.set(id, modelConfig);
    });
    
    this.defaultModel = config.get<string>('defaultModel', this.defaultModel);
    console.log(`기본 모델 ID: ${this.defaultModel}`);
    
    // 설정이 없는 경우 기본 모델 등록
    if (this.models.size === 0) {
      console.log('등록된 모델이 없습니다. 기본 모델을 등록합니다.');
      this.registerDefaultModels();
    }
    
    // 모든 등록된 모델 로깅
    console.log('등록된 모든 모델:');
    this.models.forEach((config, id) => {
      console.log(`- ${id}: ${config.name} (${config.provider})`);
    });
    
    console.log('LLM 모델 설정 로드 완료');
  }
  
  /**
   * 기본 모델 등록
   * 철칙: 내부망 모델 설정 및 주소는 절대 수정/삭제 불가
   */
  private registerDefaultModels(): void {
    // 기본 시스템 프롬프트
    const defaultSystemPrompt = '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.';
    
    try {
      // 설정에서 모델 구성 로드
      const config = vscode.workspace.getConfiguration('ape.llm');
      const modelsConfig = config.get<Record<string, ModelConfig>>('models', {});
      
      console.log(`설정에서 ${Object.keys(modelsConfig).length}개의 모델 구성 로드됨`);
      
      // 환경 체크로 내부망/외부망 감지
      const isInternalNetwork = this.canConnectToInternalNetwork();
      
      // 설정된 모델이 있으면 그것들을 사용
      if (Object.keys(modelsConfig).length > 0) {
        for (const [id, modelConfig] of Object.entries(modelsConfig)) {
          // OpenRouter 모델인 경우 apiModel 필드 추가
          if (modelConfig.provider === 'openrouter') {
            // 이미 apiModel이 있는지 확인
            if (!modelConfig.apiModel) {
              // 모델 이름이 gemini 관련인 경우 apiModel 설정
              if (id.includes('gemini') || modelConfig.name.includes('Gemini')) {
                modelConfig.apiModel = 'google/gemini-2.5-flash-preview';
              }
              // 다른 모델들에 대한 apiModel 매핑 추가 가능
            }
          }
          
          console.log(`모델 등록: ${id} (${modelConfig.name} - ${modelConfig.provider})`);
          this.models.set(id, modelConfig);
        }
      } else {
        // 설정이 없는 경우 기본값 사용 - 철칙: 내부망 모델은 항상 포함해야 함
        console.log('설정된 모델 없음. 기본 모델 등록 (철칙: 내부망 모델은 항상 포함)');
        
        // [TODO-내부망-삭제] 외부망 테스트용 OpenRouter 모델 정의
        // ===== OpenRouter - Google Gemini 2.5 Flash Preview (외부망 테스트용) =====
        this.models.set('gemini-2.5-flash', {
          name: 'Google Gemini 2.5 Flash',
          provider: 'openrouter',
          apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
          contextWindow: 32000,
          maxTokens: 8192,
          temperature: 0.7,
          systemPrompt: defaultSystemPrompt,
          apiModel: 'google/gemini-2.5-flash-preview' // API 요청 시 사용할 정확한 모델 ID
        });
        
        // ===== NARRANS (내부망 기본 모델) - 철칙: 절대 수정/삭제 불가 =====
        this.models.set('narrans', {
          name: 'NARRANS (Default)',
          provider: 'custom',
          apiUrl: 'https://api-se-dev.narrans/v1/chat/completions',
          contextWindow: 10000,
          maxTokens: 10000,
          temperature: 0,
          systemPrompt: defaultSystemPrompt
        });
        
        // ===== Llama 4 Maverick (내부망 모델) - 철칙: 절대 수정/삭제 불가 =====
        this.models.set('llama-4-maverick', {
          name: 'Llama 4 Maverick',
          provider: 'custom',
          apiUrl: 'http://apigw-stg:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
          contextWindow: 50000,
          maxTokens: 50000,
          temperature: 0,
          systemPrompt: defaultSystemPrompt
        });
        
        // ===== 로컬 시뮬레이션 모델 (API 키/연결 없이 사용 가능) =====
        this.models.set('local', {
          name: '로컬 시뮬레이션 (오프라인)',
          provider: 'local',
          temperature: 0.7,
          systemPrompt: defaultSystemPrompt
        });
      }
      
      // 환경에 따른 기본 모델 설정 조정 (내부망의 경우)
      if (isInternalNetwork) {
        // 내부망일 경우 narrans로 기본 모델 변경
        if (this.models.has('narrans')) {
          console.log('내부망 환경 감지됨: 기본 모델을 narrans로 자동 설정');
          this.defaultModel = 'narrans';
        }
      }
      
      // 등록된 모든 모델 수 로깅
      console.log(`총 ${this.models.size}개의 모델이 등록되었습니다.`);
      for (const [id, model] of this.models.entries()) {
        console.log(`- ${id}: ${model.name} (${model.provider})`);
      }
    } catch (error) {
      console.error('모델 로딩 중 오류 발생:', error);
      
      // 오류 발생 시 기본 모델만 등록
      this.models.set('local', {
        name: '로컬 시뮬레이션 (오프라인 - 오류 복구)',
        provider: 'local',
        temperature: 0.7,
        systemPrompt: defaultSystemPrompt
      });
      
      console.log('오류로 인해 로컬 시뮬레이션 모델만 등록됨');
    }
  }
  
  /**
   * LLM API로 요청 전송
   */
  public async sendRequest(options: LlmRequestOptions): Promise<LlmResponse> {
    const { model = this.defaultModel, messages = [], temperature, maxTokens, stream, onUpdate } = options;
    
    // 메시지 배열이 유효한지 확인
    if (!Array.isArray(messages)) {
      console.error('sendRequest: messages is not an array:', messages);
      throw new Error('요청 메시지가 유효하지 않습니다.');
    }
    
    // 메시지가 비어있는 경우 기본 메시지 추가
    if (messages.length === 0) {
      console.warn('sendRequest: empty messages array, adding default message');
      messages.push({
        role: 'user',
        content: '안녕하세요'
      });
    }
    
    console.log(`sendRequest: 요청 모델 ID - '${model}'`);
    console.log(`sendRequest: 등록된 모델 목록 - ${Array.from(this.models.keys()).join(', ')}`);
    
    const modelConfig = this.models.get(model);
    if (!modelConfig) {
      console.error(`sendRequest: model '${model}' not found`);
      // 오류 발생 시 로컬 모델로 대체
      console.log(`sendRequest: 모델을 찾을 수 없어 로컬 시뮬레이션 모델로 대체합니다.`);
      return this.simulateLocalModel({
        name: '임시 대체 모델',
        provider: 'local',
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      }, messages);
    }
    
    // 시스템 프롬프트가 제공되지 않은 경우 기본값 추가
    if (modelConfig.systemPrompt && !messages.some(m => m.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: modelConfig.systemPrompt
      });
    }
    
    console.log('sendRequest: prepared messages:', JSON.stringify(messages));
    
    // API 키가 없을 경우 로컬 시뮤레이션 모드로 전환
    try {
      // 모델 제공자에 따라 적절한 요청 생성 및 전송
      // 내부망 정책에 따라 외부 API 제공자는 제거하고 테스트용 OpenRouter 및 내부 API만 유지
      switch (modelConfig.provider) {
        case 'openrouter':
          // [TODO-내부망-삭제] OpenRouter 관련 코드는 내부망 이관 시 삭제 예정
          return this.sendOpenRouterRequest(modelConfig, messages, temperature, maxTokens, stream, onUpdate);
        case 'custom':
          return this.sendCustomRequest(modelConfig, messages, temperature, maxTokens, stream, onUpdate);
        case 'local':
          return this.simulateLocalModel(modelConfig, messages);
        default:
          console.warn(`알 수 없는 프로바이더: ${modelConfig.provider}, 로컬 시뮤레이션으로 전환합니다.`);
          return this.simulateLocalModel(modelConfig, messages);
      }
    } catch (error: any) {
      // API 키 오류인 경우 로컬 시뮤레이션으로 대체
      if (error.code === 'missing_api_key' || error.code === 'invalid_api_key') {
        console.warn(`API 키 오류로 인해 로컬 시뮤레이션으로 전환: ${error.message}`);
        return this.simulateLocalModel(modelConfig, messages);
      }
      throw error;
    }
  }
  
  /**
   * [REMOVED: 외부 API 구현부 삭제함]
   * 내부망 환경에서만 작동하도록 변경하여 언급된 외부 API 제공자 구현부 삭제
   * 테스트용 OpenRouter 및 내부 API용 구현만 유지
   */
  
  /**
   * OpenRouter API 요청
   * [TODO-내부망-삭제] 내분망 이관 시 이 함수 삭제 예정
   */
  private async sendOpenRouterRequest(
    modelConfig: ModelConfig, 
    messages: ChatMessage[], 
    temperature?: number, 
    maxTokens?: number,
    stream?: boolean,
    onUpdate?: (chunk: string) => void
  ): Promise<LlmResponse> {
    const apiKey = modelConfig.apiKey || this.getApiKey('openrouter');
    if (!apiKey) {
      throw this.createApiKeyError('missing_api_key', modelConfig.name, 'openrouter');
    }
    
    const apiUrl = modelConfig.apiUrl || 'https://openrouter.ai/api/v1/chat/completions';
    
    try {
      // 요청 모델 설정 (OpenRouter API 모델명 포맷으로 변환)
      // apiModel 속성을 최우선적으로 사용, 항상 설정 파일에서 로드
      let requestModel = modelConfig.apiModel || "google/gemini-2.5-flash-preview";
      
      console.log(`OpenRouter API 요청 - 모델: ${modelConfig.name} → API 요청 모델: ${requestModel}`);
      console.log(`메시지 수: ${messages.length}, 온도: ${temperature ?? modelConfig.temperature ?? 0.7}, 스트리밍: ${stream ? '켜짐' : '꺼짐'}`);
      
      // 스트리밍 모드인 경우
      if (stream && onUpdate) {
        return await this.handleOpenRouterStream(
          apiUrl,
          apiKey,
          modelConfig,
          messages,
          temperature,
          maxTokens,
          onUpdate
        );
      }
      
      // 일반 모드 (비스트리밍)
      console.log('일반 모드(비스트리밍)로 요청 전송');
      
      // SSL 인증서 검증 오류 회피를 위해 fetch API 직접 사용
      console.log(`OpenRouter 요청 세부정보:
      URL: ${apiUrl}
      모델: ${requestModel}
      API 키: ${apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'}
      메시지 수: ${messages.length}
      온도: ${temperature ?? modelConfig.temperature ?? 0.7}
      최대 토큰: ${maxTokens ?? modelConfig.maxTokens ?? 4096}`);
      
      const fetchResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/anthropics/claude-code',
          'X-Title': 'APE VSCode Extension'
        },
        body: JSON.stringify({
          model: requestModel,
          messages,
          temperature: temperature ?? modelConfig.temperature ?? 0.7,
          max_tokens: maxTokens ?? modelConfig.maxTokens ?? 4096,
          stream: false
        })
      });
      
      if (!fetchResponse.ok) {
        const responseText = await fetchResponse.text();
        console.error(`OpenRouter API 응답 오류 (${fetchResponse.status}): ${responseText}`);
        throw new Error(`OpenRouter API 응답 오류: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }
      
      console.log(`OpenRouter API 응답 성공 - 상태 코드: ${fetchResponse.status}`);
      
      const responseData = await fetchResponse.json();
      
      // Headers 객체를 일반 객체로 변환
      const headersObj: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      
      const response = {
        data: responseData,
        statusCode: fetchResponse.status,
        headers: headersObj,
        ok: fetchResponse.ok
      };
      
      // 응답 처리
      return {
        id: response.data.id || this.generateId(),
        content: response.data.choices[0].message.content,
        model: modelConfig.name,
        usage: {
          promptTokens: response.data.usage?.prompt_tokens || 0,
          completionTokens: response.data.usage?.completion_tokens || 0,
          totalTokens: response.data.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      console.error('OpenRouter API 요청 오류:', error);
      throw error;
    }
  }
  
  /**
   * OpenRouter 스트리밍 응답 처리
   */
  private async handleOpenRouterStream(
    apiUrl: string,
    apiKey: string,
    modelConfig: ModelConfig,
    messages: ChatMessage[],
    temperature?: number, 
    maxTokens?: number,
    onUpdate: (chunk: string) => void
  ): Promise<LlmResponse> {
    try {
      // 요청 모델 설정 (OpenRouter API 모델명 포맷으로 변환)
      // apiModel 속성을 최우선적으로 사용
      const requestModel = modelConfig.apiModel || "google/gemini-2.5-flash-preview";
      
      console.log(`OpenRouter 스트리밍 요청 - 모델: ${modelConfig.name} → API 요청 모델: ${requestModel}`);
      console.log(`메시지 수: ${messages.length}, 온도: ${temperature ?? modelConfig.temperature ?? 0.7}`);
      
      // 스트리밍 요청 전송
      console.log(`OpenRouter 스트리밍 요청 세부정보:
      URL: ${apiUrl}
      모델: ${requestModel}
      API 키: ${apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'}
      메시지 수: ${messages.length}
      온도: ${temperature ?? modelConfig.temperature ?? 0.7}
      최대 토큰: ${maxTokens ?? modelConfig.maxTokens ?? 4096}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'HTTP-Referer': 'https://github.com/anthropics/claude-code',
          'X-Title': 'APE VSCode Extension'
        },
        body: JSON.stringify({
          model: requestModel,
          messages,
          temperature: temperature ?? modelConfig.temperature ?? 0.7,
          max_tokens: maxTokens ?? modelConfig.maxTokens ?? 4096,
          stream: true
        })
      });
      
      if (!response.ok || !response.body) {
        const responseText = await response.text();
        console.error(`OpenRouter 스트리밍 API 응답 오류 (${response.status}): ${responseText}`);
        throw new Error(`OpenRouter 스트리밍 API 응답 오류: ${response.status} ${response.statusText}`);
      }
      
      console.log('OpenRouter 스트리밍 연결 성공 - 응답 처리 시작');
      
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
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                accumulatedContent += content;
                onUpdate(content);
                contentChunks++;
                
                // 처음 몇 개의 청크만 로깅
                if (contentChunks <= 3 || contentChunks % 50 === 0) {
                  console.log(`스트리밍 청크 수신 #${contentChunks}: ${content.length > 20 ? content.substring(0, 20) + '...' : content}`);
                }
              }
            } catch (error) {
              console.warn('스트리밍 데이터 파싱 오류:', error);
            }
          }
        }
      }
      
      console.log(`스트리밍 완료 - 총 이벤트: ${eventCount}, 콘텐츠 청크: ${contentChunks}, 응답 길이: ${accumulatedContent.length}자`);
      
      // 완료된 응답 반환
      return {
        id: responseId,
        content: accumulatedContent,
        model: modelConfig.name
      };
    } catch (error) {
      console.error('OpenRouter 스트리밍 오류:', error);
      throw error;
    }
  }
  
  /**
   * Custom API 요청 (Narrans, Llama 등 온프레미스 모델)
   */
  private async sendCustomRequest(
    modelConfig: ModelConfig, 
    messages: ChatMessage[], 
    temperature?: number, 
    maxTokens?: number,
    stream?: boolean,
    onUpdate?: (chunk: string) => void
  ): Promise<LlmResponse> {
    if (!modelConfig.apiUrl) {
      throw new Error(`Custom 모델 ${modelConfig.name}의 API URL이 지정되지 않았습니다.`);
    }
    
    console.log(`Custom API 요청 - 모델: ${modelConfig.name}, API URL: ${modelConfig.apiUrl}`);
    console.log(`메시지 수: ${messages.length}, 온도: ${temperature ?? modelConfig.temperature ?? 0}, 스트리밍: ${stream ? '켜짐' : '꺼짐'}`);
    
    try {
      // 환경 변수 모듈 로드 (API URL 오버라이드를 위해)
      let envModule: any = null;
      try {
        envModule = require('../../../extension.env.js');
      } catch (envError) {
        // 무시 가능한 오류
      }
      
      // 내부망 환경 체크
      const isInternalNetwork = this.canConnectToInternalNetwork();
      
      // 스트리밍 모드인 경우
      if (stream && onUpdate) {
        return await this.handleCustomStream(
          modelConfig,
          messages,
          temperature,
          maxTokens,
          onUpdate
        );
      }
      
      // 일반 모드 (비스트리밍)
      console.log('일반 모드(비스트리밍)로 요청 전송');
      
      // 모델별 특수 헤더 생성
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // API 키 정보 설정
      const apiKey = modelConfig.apiKey || this.getApiKey(modelConfig.provider as ModelProvider);
      
      // API URL 확인 및 설정 (환경별)
      let apiUrl = modelConfig.apiUrl;
      
      // Llama 또는 NARRANS 모델인 경우 내부망 URL 재정의 가능
      const isLlamaModel = modelConfig.name.toLowerCase().includes('llama');
      const isNarransModel = modelConfig.name.toLowerCase().includes('narrans') || 
                           apiUrl.includes('narrans') || 
                           apiUrl.includes('api-se-dev');
      
      if (isLlamaModel && envModule && envModule.LLAMA4_API_ENDPOINT) {
        // Llama 모델용 환경 변수에서 URL 가져오기
        apiUrl = envModule.LLAMA4_API_ENDPOINT;
        console.log(`Llama 모델 URL을 환경 변수에서 가져옴: ${apiUrl}`);
      } else if (isNarransModel && envModule && envModule.INTERNAL_API_ENDPOINT) {
        // NARRANS 모델용 환경 변수에서 URL 가져오기
        apiUrl = envModule.INTERNAL_API_ENDPOINT;
        console.log(`NARRANS 모델 URL을 환경 변수에서 가져옴: ${apiUrl}`);
      }
      
      // 내부망 모델인 Llama나 NARRANS일 경우 특수 헤더 추가
      if (isLlamaModel || apiUrl.includes('apigw-stg')) {
        console.log('Llama 모델 요청을 위한 특수 헤더 추가');
        
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
        console.log('NARRANS 모델 요청을 위한 헤더 추가');
        
        // API 키가 있으면 인증 헤더 추가
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      } else if (apiKey) {
        // 다른 내부망 모델의 경우 일반 인증 헤더 사용
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      // 모델 ID 결정 (apiModel이 있으면 그것 사용, 없으면 모델 이름 기반)
      let modelId = modelConfig.apiModel;
      
      // Llama 4 모델 특수 처리
      if (modelConfig.name.includes('Llama 4 Maverick')) {
        modelId = 'meta-llama/llama-4-maverick-17b-128e-instruct';
      } else if (modelConfig.name.includes('Llama 4 Scout')) {
        modelId = 'meta-llama/llama-4-scout-17b-16e-instruct';
      } else if (!modelId) {
        modelId = modelConfig.name.toLowerCase();
      }
      
      console.log(`사용 모델 ID: ${modelId}`);
      console.log(`요청 URL: ${apiUrl}`);
      
      // 추가 요청 파라미터
      const requestBody: any = {
        model: modelId,
        messages,
        temperature: temperature ?? modelConfig.temperature ?? 0,
        max_tokens: maxTokens ?? modelConfig.maxTokens ?? 4096,
        stream: false
      };
      
      // 내부망 모델별 특수 처리 (필요시)
      if (isLlamaModel) {
        // Llama 모델 특수 파라미터 (필요한 경우)
        // requestBody.additional_parameter = 'value';
      }
      
      // SSL 인증서 검증 오류 회피를 위해 fetch API 직접 사용
      const fetchResponse = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text().catch(() => '응답 텍스트를 가져올 수 없음');
        throw new Error(`Custom API 응답 오류 (${fetchResponse.status}): ${fetchResponse.statusText} - ${errorText}`);
      }
      
      console.log(`Custom API 응답 성공 - 상태 코드: ${fetchResponse.status}`);
      
      const responseData = await fetchResponse.json();
      
      // 응답 데이터 구조 검증
      if (!responseData.choices || !responseData.choices.length || !responseData.choices[0].message) {
        console.error('API 응답 형식이 예상과 다릅니다:', responseData);
        throw new Error('API 응답 데이터 형식이 유효하지 않습니다.');
      }
      
      // 응답 처리
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
      console.error(`Custom API(${modelConfig.name}) 요청 오류:`, error);
      
      // 오류 상세 정보 기록
      if (error instanceof Error) {
        console.error(`오류 메시지: ${error.message}`);
        console.error(`오류 스택: ${error.stack}`);
      }
      
      // 내부망 오류 시 로컬 시뮤레이션으로 대체
      console.warn(`API 오류로 인해 로컬 시뮤레이션으로 전환: ${error}`);
      return this.simulateLocalModel(modelConfig, messages);
    }
  }
  
  /**
   * Custom 스트리밍 응답 처리
   */
  private async handleCustomStream(
    modelConfig: ModelConfig,
    messages: ChatMessage[],
    temperature?: number, 
    maxTokens?: number,
    onUpdate: (chunk: string) => void
  ): Promise<LlmResponse> {
    try {
      // 환경 변수 모듈 로드 (API URL 오버라이드를 위해)
      let envModule: any = null;
      try {
        envModule = require('../../../extension.env.js');
      } catch (envError) {
        // 무시 가능한 오류
      }
      
      // 내부망 환경 체크
      const isInternalNetwork = this.canConnectToInternalNetwork();
      
      // API URL 확인 및 설정 (환경별)
      let apiUrl = modelConfig.apiUrl;
      
      // Llama 또는 NARRANS 모델인 경우 내부망 URL 재정의 가능
      const isLlamaModel = modelConfig.name.toLowerCase().includes('llama');
      const isNarransModel = modelConfig.name.toLowerCase().includes('narrans') || 
                         apiUrl.includes('narrans') || 
                         apiUrl.includes('api-se-dev');
      
      if (isLlamaModel && envModule && envModule.LLAMA4_API_ENDPOINT) {
        // Llama 모델용 환경 변수에서 URL 가져오기
        apiUrl = envModule.LLAMA4_API_ENDPOINT;
        console.log(`Llama 모델 URL을 환경 변수에서 가져옴: ${apiUrl}`);
      } else if (isNarransModel && envModule && envModule.INTERNAL_API_ENDPOINT) {
        // NARRANS 모델용 환경 변수에서 URL 가져오기
        apiUrl = envModule.INTERNAL_API_ENDPOINT;
        console.log(`NARRANS 모델 URL을 환경 변수에서 가져옴: ${apiUrl}`);
      }
      
      console.log(`Custom 스트리밍 요청 - 모델: ${modelConfig.name}, API URL: ${apiUrl}`);
      
      // 모델별 특수 헤더 생성
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      };
      
      // API 키 정보 설정
      const apiKey = modelConfig.apiKey || this.getApiKey(modelConfig.provider as ModelProvider);
      
      // 내부망 모델인 Llama나 NARRANS일 경우 특수 헤더 추가
      if (isLlamaModel || apiUrl.includes('apigw-stg')) {
        console.log('Llama 모델 스트리밍 요청을 위한 특수 헤더 추가');
        
        // 고유 ID 생성
        const requestId = this.generateId();
        
        Object.assign(headers, {
          'Send-System-Name': 'swdp',
          'user-id': 'ape_ext',
          'user-type': 'ape_ext',
          'Prompt-Msg-Id': requestId,
          'Completion-msg-Id': requestId,
          'accept': 'text/event-stream, charset=utf-8'
        });
        
        // API 키가 있으면 티켓 헤더에 추가
        if (apiKey) {
          headers['x-dep-ticket'] = apiKey;
        }
      } else if (isNarransModel) {
        // NARRANS 모델 헤더 설정
        console.log('NARRANS 모델 스트리밍 요청을 위한 헤더 추가');
        headers['Accept'] = 'text/event-stream, charset=utf-8';
        
        // API 키가 있으면 인증 헤더 추가
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      } else if (apiKey) {
        // 다른 모델의 경우 일반 인증 헤더 사용
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      // 모델 ID 결정 (apiModel이 있으면 그것 사용, 없으면 모델 이름 기반)
      let modelId = modelConfig.apiModel;
      
      // Llama 4 모델 특수 처리
      if (modelConfig.name.includes('Llama 4 Maverick')) {
        modelId = 'meta-llama/llama-4-maverick-17b-128e-instruct';
      } else if (modelConfig.name.includes('Llama 4 Scout')) {
        modelId = 'meta-llama/llama-4-scout-17b-16e-instruct';
      } else if (!modelId) {
        modelId = modelConfig.name.toLowerCase();
      }
      
      console.log(`스트리밍 사용 모델 ID: ${modelId}`);
      console.log(`스트리밍 요청 URL: ${apiUrl}`);
      
      // 추가 요청 파라미터
      const requestBody: any = {
        model: modelId,
        messages,
        temperature: temperature ?? modelConfig.temperature ?? 0,
        max_tokens: maxTokens ?? modelConfig.maxTokens ?? 4096,
        stream: true
      };
      
      // 내부망 모델별 특수 처리 (필요시)
      if (isLlamaModel) {
        // Llama 모델 특수 파라미터 (필요한 경우)
        // requestBody.additional_parameter = 'value';
      }
      
      // 스트리밍 요청 전송
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => '응답 텍스트를 가져올 수 없음');
        throw new Error(`Custom 스트리밍 API 응답 오류 (${response.status}): ${response.statusText} - ${errorText}`);
      }
      
      console.log('Custom 스트리밍 연결 성공 - 응답 처리 시작');
      
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
                  console.log(`스트리밍 청크 수신 #${contentChunks}: ${content.length > 20 ? content.substring(0, 20) + '...' : content}`);
                }
              }
            } catch (error) {
              console.warn('스트리밍 데이터 파싱 오류:', error);
              // 오류 상세 정보 기록
              if (typeof event === 'string') {
                console.warn(`문제가 있는 이벤트 데이터: ${event.length > 100 ? event.substring(0, 100) + '...' : event}`);
              }
            }
          }
        }
      }
      
      console.log(`스트리밍 완료 - 총 이벤트: ${eventCount}, 콘텐츠 청크: ${contentChunks}, 응답 길이: ${accumulatedContent.length}자`);
      
      // 누적 콘텐츠가 없는 경우 오류 처리
      if (accumulatedContent.length === 0) {
        console.warn('스트리밍 응답에서 내용을 추출하지 못했습니다.');
        throw new Error('스트리밍 데이터에서 콘텐츠를 추출할 수 없습니다.');
      }
      
      // 완료된 응답 반환
      return {
        id: responseId,
        content: accumulatedContent,
        model: modelConfig.name
      };
    } catch (error) {
      console.error(`Custom 스트리밍 오류(${modelConfig.name}):`, error);
      
      // 오류 상세 정보 기록
      if (error instanceof Error) {
        console.error(`오류 메시지: ${error.message}`);
        console.error(`오류 스택: ${error.stack}`);
      }
      
      // 오류 발생 시 로컬 시뮤레이션으로 대체
      console.warn(`API 오류로 인해 로컬 시뮤레이션으로 전환: ${error}`);
      return this.simulateLocalModel(modelConfig, messages);
    }
  }

  /**
   * 로컬 모델 시뮤레이션 (실제 API 호출 없이 데모용)
   */
  private async simulateLocalModel(modelConfig: ModelConfig, messages: ChatMessage[]): Promise<LlmResponse> {
    // 마지막 메시지 추출
    const lastMessage = messages[messages.length - 1];
    
    // 간단한 질의응답 패턴 구현
    let responseText = '';
    
    if (lastMessage.content.match(/안녕|반가워|헬로|하이/i)) {
      responseText = '안녕하세요! 무엇을 도와드릴까요?';
    } 
    else if (lastMessage.content.match(/시간|날짜|오늘|몇 시/i)) {
      responseText = `현재 시간은 ${new Date().toLocaleString()} 입니다.`;
    }
    else if (lastMessage.content.match(/코드|프로그램|개발|버그/i)) {
      responseText = '코드에 대해 질문이 있으신가요? 어떤 부분에서 도움이 필요하신지 자세히 알려주세요.';
    }
    else if (lastMessage.content.match(/도움|도와줘|어떻게|사용법/i)) {
      responseText = '무엇을 도와드릴까요? 더 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.';
    }
    else {
      responseText = `"${lastMessage.content}"에 대한 답변을 찾고 있습니다. 로컬 모델 시뮤레이션 모드에서는 제한된 응답만 제공합니다.`;
    }
    
    // 응답 대기 시간 시뮤레이션
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: this.generateId(),
      content: responseText,
      model: modelConfig.name
    };
  }
  
  /**
   * 환경 변수 또는 설정에서 API 키 가져오기
   * 내부망 정책에 따라 OpenRouter만 지원 (테스트용)
   * [TODO-내부망-삭제] 이 함수는 내부망 이관 시 완전히 삭제되거나 내부망 키만 반환하도록 수정 예정
   */
  private getApiKey(provider: ModelProvider): string | undefined {
    // 환경 변수 모듈 로드
    let envModule: any = null;
    try {
      // extension.env.js 파일에서 환경 변수 가져오기 시도
      envModule = require('../../../extension.env.js');
      console.log('extension.env.js 파일을 성공적으로 로드했습니다.');
    } catch (envError) {
      console.warn('extension.env.js 로드 실패:', envError);
    }
    
    // 프로바이더별 API 키 처리
    switch(provider) {
      // OpenRouter 키 (외부망 테스트용)
      case 'openrouter':
        try {
          // 환경 변수에서 키 확인
          if (envModule && envModule.OPENROUTER_API_KEY && 
              envModule.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here') {
            console.log('extension.env.js에서 OpenRouter API 키를 로드했습니다.');
            return envModule.OPENROUTER_API_KEY;
          }
          
          // VS Code 설정에서 확인
          const config = vscode.workspace.getConfiguration('ape.llm');
          return config.get<string>('openrouterApiKey');
        } catch (e) {
          console.warn('외부 테스트용 OpenRouter API 키를 가져오는 중 오류 발생:', e);
        }
        break;
        
      // 내부 커스텀 API 키 (Narrans, Llama 등)
      case 'custom':
        try {
          // 내부망 API 키 확인
          if (envModule && envModule.INTERNAL_API_KEY && 
              envModule.INTERNAL_API_KEY !== 'your_internal_api_key_here') {
            console.log('extension.env.js에서 내부망 API 키를 로드했습니다.');
            return envModule.INTERNAL_API_KEY;
          }
          
          // VS Code 설정에서 확인 (향후 지원 가능성을 위해)
          const config = vscode.workspace.getConfiguration('ape.llm');
          return config.get<string>('internalApiKey');
        } catch (e) {
          console.warn('내부망 API 키를 가져오는 중 오류 발생:', e);
        }
        break;
        
      default:
        console.log(`프로바이더 "${provider}"에 대한 API 키 처리 로직이 정의되지 않았습니다.`);
    }
    
    // 해당 프로바이더에 대한 키를 찾지 못한 경우
    return undefined;
  }
  
  /**
   * API 키 오류 생성
   */
  private createApiKeyError(
    code: 'missing_api_key' | 'invalid_api_key', 
    modelName: string, 
    provider: ModelProvider
  ): Error {
    const error = new Error(`${provider} API 키가 필요합니다.`) as any;
    error.code = code;
    error.model = modelName;
    error.provider = provider;
    return error;
  }
  
  /**
   * 기본 모델 ID 가져오기
   * 1. configService에 설정된 기본 모델
  /* 중복된 getDefaultModelId 메서드가 제거되었습니다. */
  public getDefaultModelId(): string {
    // 모델이 실제로 등록되어 있는지 확인
    if (!this.models.has(this.defaultModel)) {
      console.warn(`주의: 기본 모델 ID '${this.defaultModel}'가 등록된 모델 목록에 없습니다.`);
      console.log(`등록된 모델 목록: ${Array.from(this.models.keys()).join(', ')}`);
      
      // 대체 모델 사용: 등록된 첫 번째 모델 또는 'local'
      if (this.models.size > 0) {
        const fallbackModel = Array.from(this.models.keys())[0];
        console.log(`대체 모델 ID로 '${fallbackModel}'를 사용합니다.`);
        return fallbackModel;
      } else {
        console.log(`등록된 모델이 없어 'local' 모델을 사용합니다.`);
        // 최후의 수단: local 모델 등록 및 사용
        this.models.set('local', {
          name: '로컬 시뮬레이션 (오프라인)',
          provider: 'local',
          temperature: 0.7,
          maxTokens: 500
        });
        return 'local';
      }
    }
    
    return this.defaultModel;
  }

  /**
   * 사용 가능한 모델 목록 가져오기
   * 1. configService에 설정된 모델
   * 2. OpenRouter API를 통해 동적으로 가져온 모델
   * 3. 내부망 모델 목록
   */
  public getAvailableModels(): ModelConfig[] {
    try {
      console.log('getAvailableModels 호출됨 - 모델 목록 수집 시작');
      
      // 1. 먼저 설정에서 모델 가져오기
      const configModels = this.getModelsFromConfig();
      console.log(`설정에서 ${configModels.length}개의 모델 로드됨`);
      
      // 2. models 맵에 있는 모든 모델 수집
      let allModels = new Map<string, ModelConfig>(this.models);
      
      // 3. 설정에서 가져온 모델 추가
      for (const model of configModels) {
        if (model.id) {
          allModels.set(model.id, model);
        }
      }
      
      // 4. 모델이 충분히 있는지 확인
      if (allModels.size < 2) {
        // 부족하면 package.json에서 모델 로드
        console.log('모델이 부족하여 package.json에서 추가 모델 로드');
        const packageModels = this.loadModelsFromPackageJson();
        
        // package.json 모델 추가
        for (const model of packageModels) {
          if (model.id && !allModels.has(model.id)) {
            allModels.set(model.id, model);
          }
        }
        
        console.log(`package.json에서 ${packageModels.length}개의 모델 추가됨, 현재 총 ${allModels.size}개 모델`);
      }
      
      // 5. 여전히 부족하면 기본 모델 추가
      if (allModels.size < 2) {
        console.log('여전히 모델이 부족하여 하드코딩된 기본 모델 추가');
        
        const defaultModels = [
          {
            id: 'gemini-2.5-flash',
            modelId: 'gemini-2.5-flash',
            name: 'Google Gemini 2.5 Flash',
            provider: 'openrouter' as ModelProvider,
            apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
            contextWindow: 32000,
            maxTokens: 8192,
            temperature: 0.7,
            apiModel: 'google/gemini-2.5-flash-preview',
            systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
          },
          {
            id: 'narrans',
            modelId: 'narrans',
            name: 'NARRANS (내부망)',
            provider: 'custom' as ModelProvider,
            apiUrl: 'https://api-se-dev.narrans.samsungds.net/v1/chat/completions',
            contextWindow: 10000,
            maxTokens: 10000,
            temperature: 0,
            systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
          }
        ];
        
        // 하드코딩된 모델 추가
        for (const model of defaultModels) {
          if (!allModels.has(model.id)) {
            allModels.set(model.id, model);
          }
        }
      }
      
      // 6. 모델 로그 및 반환
      const modelArray = Array.from(allModels.values());
      console.log(`총 ${modelArray.length}개의 모델 수집 완료`);
      
      // 모델 목록 상세 로깅
      const modelSummary = modelArray.map(model => 
        `${model.id}: ${model.name} (${model.provider || 'unknown'})`
      ).join('\n- ');
      console.log(`모델 목록 요약:\n- ${modelSummary}`);
      
      return modelArray;
    } catch (error) {
      console.error('getAvailableModels 실행 중 오류 발생:', error);
      
      // 오류 발생 시 비상 폴백 모델 반환
      return this.getFallbackModels();
    }
  }

  /**
   * 예비용 폴백 모델 생성
   * 모델 맵이 비어있을 때 사용
   */
  private getFallbackModels(): ModelConfig[] {
    console.log('비상용 폴백 모델 생성 중');
    
    try {
      const defaultSystemPrompt = '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.';
      const config = vscode.workspace.getConfiguration('ape.llm');
      // 설정 존재 여부 확인
      const modelsRaw = config.get('models');
      
      if (modelsRaw && typeof modelsRaw === 'object') {
        // 설정에서 모델 정보를 가져와 폴백 모델로 변환
        const models: ModelConfig[] = [];
        for (const [id, modelData] of Object.entries(modelsRaw)) {
          // null이나 undefined인 경우 방어 코드
          if (!modelData || typeof modelData !== 'object') continue;
          
          // 필수 필드 있는지 검증
          if (!modelData.name) continue;
          
          // ModelConfig 형식으로 변환
          models.push({
            id: id,
            modelId: id,
            name: modelData.name,
            provider: modelData.provider || 'local',
            apiUrl: modelData.apiUrl,
            contextWindow: modelData.contextWindow,
            maxTokens: modelData.maxTokens,
            temperature: modelData.temperature || 0.7,
            apiModel: modelData.apiModel,
            systemPrompt: modelData.systemPrompt || defaultSystemPrompt
          });
        }
        
        // 최소 하나 이상의 모델이 있으면 반환
        if (models.length > 0) {
          console.log(`설정에서 ${models.length}개의 폴백 모델 로드됨`);
          return models;
        }
      }
    } catch (error) {
      console.error('폴백 모델 로드 실패:', error);
    }
    
    // 가장 기본적인 모델들 제공 (최후의 수단)
    // [TODO-내부망-삭제] 내부망 이관 시 OpenRouter 관련 정의 삭제 필요
    // 중요: OpenRouter는 외부망 테스트용으로만 사용됩니다. 내부망에서는 내부망 모델로 대체됩니다.
    return [
      {
        id: 'gemini-2.5-flash',
        modelId: 'gemini-2.5-flash',
        name: 'Google Gemini 2.5 Flash (외부망 테스트용)',
        provider: 'openrouter',
        temperature: 0.7,
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiModel: 'google/gemini-2.5-flash-preview',
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'narrans',
        modelId: 'narrans',
        name: 'NARRANS (내부망)',
        provider: 'custom',
        temperature: 0.7,
        apiUrl: 'https://api-se-dev.narrans.samsungds.net/v1/chat/completions',
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'local-emergency',
        modelId: 'local-emergency',
        name: '오프라인 비상 모드',
        provider: 'local',
        temperature: 0.7,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      }
    ];
  }
  
  /**
   * package.json에서 모델 구성 로드
   * 동적으로 package.json에 정의된 모델 정보를 가져와 추가
   */
  private loadModelsFromPackageJson(): ModelConfig[] {
    try {
      console.log('package.json에서 모델 구성 로드 시도');
      
      // 확장 컨텍스트 가져오기 (VSCode API 활용)
      const extensionId = 'ape-team.ape';
      const extension = vscode.extensions.getExtension(extensionId);
      
      if (!extension) {
        console.warn(`확장 ID '${extensionId}'를 찾을 수 없습니다, 대체 방법 시도...`);
        
        // 대체 확장 ID로 시도 - VS Code는 종종 확장 ID를 소문자로 정규화합니다
        const extensions = vscode.extensions.all;
        let foundExtension = null;
        
        for (const ext of extensions) {
          // 확장 ID가 'ape'를 포함하는지 확인
          if (ext.id.toLowerCase().includes('ape')) {
            foundExtension = ext;
            console.log(`대체 확장 발견: ${ext.id}`);
            break;
          }
        }
        
        if (!foundExtension) {
          console.warn('패키지 정보를 찾을 수 없습니다');
          return [];
        }
        
        // 찾은 확장의 packageJSON 사용
        return this.parseModelsFromPackageJson(foundExtension.packageJSON);
      }
      
      return this.parseModelsFromPackageJson(extension.packageJSON);
    } catch (error) {
      console.error('package.json에서 모델 로드 중 오류:', error);
      return [];
    }
  }
  
  /**
   * 패키지 JSON에서 모델 구성 파싱
   */
  private parseModelsFromPackageJson(packageJson: any): ModelConfig[] {
    if (!packageJson || !packageJson.contributes) {
      console.warn('package.json에 contributes 섹션이 없습니다');
      return [];
    }
    
    // 모델 설정 추출
    const contributes = packageJson.contributes;
    const configurations = Array.isArray(contributes.configuration) 
      ? contributes.configuration 
      : [contributes.configuration];
    
    let modelsProperty = null;
    
    // 모든 구성에서 ape.llm.models 속성 찾기
    for (const config of configurations) {
      if (config && config.properties && config.properties['ape.llm.models']) {
        modelsProperty = config.properties['ape.llm.models'];
        break;
      }
    }
    
    if (!modelsProperty || !modelsProperty.default) {
      console.warn('ape.llm.models 구성을 찾을 수 없습니다');
      return [];
    }
    
    // 기본 모델 구성 가져오기
    const defaultModels = modelsProperty.default;
    const modelConfigs: ModelConfig[] = [];
    
    // 모델 추가
    console.log(`package.json에서 ${Object.keys(defaultModels).length}개의 모델 정의를 찾았습니다`);
    
    for (const [id, modelData] of Object.entries(defaultModels)) {
      // 모델 데이터 검증
      if (!modelData || typeof modelData !== 'object') {
        console.log(`모델 ID ${id}: 유효하지 않은 모델 데이터 형식`);
        continue;
      }
      
      // 필수 속성 검증
      if (!modelData.name) {
        console.log(`모델 ID ${id}: 필수 속성 'name'이 없음`);
        continue;
      }
      
      console.log(`모델 추가 중: ${id} (${modelData.name}) - ${modelData.provider || 'local'}`);
      
      // ModelConfig 형식으로 변환하여 추가
      const modelConfig: ModelConfig = {
        id: id,
        modelId: id,
        name: modelData.name,
        provider: modelData.provider || 'local',
        apiUrl: modelData.apiUrl,
        contextWindow: modelData.contextWindow,
        maxTokens: modelData.maxTokens,
        temperature: modelData.temperature || 0.7,
        apiModel: modelData.apiModel,
        systemPrompt: modelData.systemPrompt || '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      };
      
      // 모델 목록에 추가
      modelConfigs.push(modelConfig);
      
      // 이미 등록된 모델이 아니라면 모델 맵에도 추가
      if (!this.models.has(id)) {
        this.models.set(id, modelConfig);
      }
    }
    
    console.log(`package.json에서 ${modelConfigs.length}개의 모델 구성 추가 완료`);
    return modelConfigs;
  }
  
  // 이전 메서드 getAvailableModels() 구현과 중복된 메서드를 제거함
  
  /**
   * 모델 설정 가져오기
   */
  public getModelConfig(modelId: string): ModelConfig | undefined {
    return this.models.get(modelId);
  }
}