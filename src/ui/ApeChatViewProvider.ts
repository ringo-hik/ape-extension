/**
 * 채팅 웹뷰 제공자
 * VS Code 웹뷰 UI 관리 및 메시지 처리
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ChatService } from '../services/ChatService';
import { ICoreService } from '../core/ICoreService';
import { CommandResult } from '../types/CommandTypes';
import { LoggerService } from '../core/utils/LoggerService';

/**
 * 채팅 웹뷰 제공자 클래스
 */
export class ApeChatViewProvider implements vscode.WebviewViewProvider {
  // Changed from private to allow access from extension.ts
  public _view?: vscode.WebviewView;

  private _coreService?: ICoreService;
  
  private logger: LoggerService;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _chatService: ChatService
  ) {
    this.logger = new LoggerService();
  }
  
  /**
   * ICoreService 참조 설정
   * 필수 서비스 접근을 위한 메서드
   * @param coreService ICoreService 인스턴스
   */
  public setCoreService(coreService: ICoreService): void {
    this._coreService = coreService;
    this.logger.info('ApeChatViewProvider에 CoreService 참조가 설정되었습니다.');
    
    // 이벤트 기반 설정 추가
    coreService.on('core-service-ready', (coreServiceInstance: ICoreService) => {
      this._coreService = coreServiceInstance;
      this.logger.info('이벤트 기반으로 CoreService 참조가 업데이트되었습니다.');
    });
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    // 웹뷰 제목 설정
    webviewView.description = "채팅 인터페이스";

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    // 웹뷰 HTML 설정
    webviewView.webview.html = this._getHtmlContent(webviewView.webview);
    this.logger.info('채팅 웹뷰 HTML이 설정되었습니다.');
    
    // 초기화 완료 메시지
    setTimeout(() => {
      if (this._view && this._view.visible) {
        webviewView.webview.postMessage({
          command: 'initialized',
          timestamp: Date.now()
        });
        this.logger.info('웹뷰 초기화 완료 메시지 전송');
      }
    }, 1000);

    // 웹뷰에서 메시지 받기
    webviewView.webview.onDidReceiveMessage(message => {
      this.logger.info('채팅 웹뷰로부터 메시지를 받았습니다:', message);
      
      switch (message.command) {
        case 'sendMessage':
          this._handleUserMessage(message);
          return;
          
        case 'clearChat':
          this.clearChat();
          this._chatService.clearConversation();
          return;
          
        case 'changeModel':
          this._changeModel(message.model);
          return;
          
        case 'getModelList':
          // 모델 목록 요청 처리
          this.logger.info('웹뷰에서 모델 목록 요청 받음');
          this._sendModelList();
          this._sendCurrentModel();
          return;
          
        case 'toggleEmbedDevMode':
          // 심층 분석 모드 토글 처리
          this.logger.info(`심층 분석 모드: ${message.enabled ? '활성화' : '비활성화'}`);
          // 설정에 상태 저장
          vscode.workspace.getConfiguration('ape.core').update(
            'embedDevMode', 
            message.enabled, 
            vscode.ConfigurationTarget.Global
          );
          return;
          
        case 'toggleApeMode':
          // 도구 활용 모드 토글 처리
          this.logger.info(`도구 활용 모드: ${message.enabled ? '활성화' : '비활성화'}`);
          
          // 1. 설정에 상태 저장
          vscode.workspace.getConfiguration('ape.ui').update(
            'apeMode', 
            message.enabled, 
            vscode.ConfigurationTarget.Global
          );
          
          // 2. UI 모드 설정 변경 (standard/hybrid)
          const newMode = message.enabled ? 'hybrid' : 'standard';
          vscode.workspace.getConfiguration('ape').update(
            'uiMode', 
            newMode, 
            vscode.ConfigurationTarget.Global
          );
          
          // 알림 메시지 표시
          vscode.window.showInformationMessage(`도구 활용 모드가 ${message.enabled ? '활성화' : '비활성화'}되었습니다.`);
          
          this.logger.info('도구 활용 모드 설정 변경 완료');
          return;
          
        case 'getCommands':
          // 명령어 목록 요청 처리
          this._sendCommandsList();
          return;
          
        case 'executeCommand':
          // 웹뷰에서 직접 명령어 실행 요청
          this.logger.info('명령어 실행 요청:', message.commandId);
          if (message.commandId) {
            this._executeCommand(message.commandId);
          }
          return;
          
        case 'copyToClipboard':
          // 클립보드에 텍스트 복사
          if (message.text) {
            vscode.env.clipboard.writeText(message.text)
              .then(() => {
                // 복사 성공 알림
                this.logger.info('클립보드에 복사됨:', message.text);
              }, (err: Error) => {
                // 오류 처리
                this.logger.error('클립보드 복사 오류:', err);
              });
          }
          return;
          
        case 'treeViewAction':
          // TreeView와 연동된 작업 처리
          this._handleTreeViewAction(message);
          return;
          
        case 'changeUiMode':
          // UI 모드 변경 메시지 (확장 모듈 -> 웹뷰)
          this.logger.info(`UI 모드 변경 요청 수신: ${message.mode}`);
          // 웹뷰에 UI 모드 변경 메시지 전달
          if (this._view && this._view.visible) {
            this._view.webview.postMessage({
              command: 'setApeMode',
              enabled: message.mode === 'hybrid'
            });
          }
          return;
      }
    });
    
    // 모델 목록 전송
    setTimeout(() => {
      this._sendModelList();
    }, 500);
    
    // 현재 모델 설정
    setTimeout(() => {
      this._sendCurrentModel();
    }, 600);
    
    // 웰컴 메시지 전송
    setTimeout(() => {
      this._sendResponse(this._chatService.getWelcomeMessage(), 'assistant');
    }, 1000);
    
    // UI 모드 초기화
    setTimeout(() => {
      // 현재 설정된 UI 모드 확인
      const config = vscode.workspace.getConfiguration('ape');
      const currentMode = config.get<string>('uiMode', 'standard');
      
      // APE 모드 설정 여부 확인
      if (this._view && this._view.visible) {
        this._view.webview.postMessage({
          command: 'setApeMode',
          enabled: currentMode === 'hybrid'
        });
        this.logger.info(`초기 UI 모드 설정됨: ${currentMode}`);
      }
    }, 1200);
  }

  /**
   * 사용자 메시지 처리
   */
  private async _handleUserMessage(message: {text: string; model?: string; embedDevMode?: boolean}): Promise<void> {
    this.logger.info('사용자 메시지 처리 시작:', message);
    
    if (!this._view) {
      this.logger.error('채팅 뷰가 없습니다. 메시지를 처리할 수 없습니다.');
      return;
    }

    const text = message.text;
    const selectedModel = message.model; // 선택된 모델 ID
    const embedDevMode = message.embedDevMode; // 심층 분석 모드 여부
    const useStreaming = true; // 스트리밍 사용 여부 (추후 설정으로 변경 가능)
    
    this.logger.info(`메시지 처리 세부정보:
    - 텍스트: ${text}
    - 선택 모델: ${selectedModel || '기본값'}
    - 심층 분석 모드: ${embedDevMode ? '활성화' : '비활성화'}
    - 스트리밍: ${useStreaming ? '사용' : '미사용'}`)

    try {
      // 로딩 상태 표시
      this._sendResponse('생각 중...', 'system');
      
      // 현재 선택된 모델 정보 업데이트 (필요한 경우)
      if (selectedModel) {
        this._changeModel(selectedModel);
      }
      
      // 시스템 로딩 메시지 제거
      if (this._view && this._view.visible) {
        this._view.webview.postMessage({
          command: 'removeSystemMessage',
          content: '생각 중...'
        });
      }
      
      // @ 명령어 및 / 명령어 처리 (명령어 형식인지 확인)
      const isAtCommand = text.trim().startsWith('@');
      const isSlashCommand = text.trim().startsWith('/');
      
      // 명령어인 경우 스트리밍 없이 직접 처리
      if (isAtCommand || isSlashCommand) {
        this.logger.info(`ApeChatViewProvider: ${isAtCommand ? '@' : '/'}명령어 감지 - "${text}"`);
        
        // 명령어 처리 전 로딩 표시
        const commandResponseId = `cmd-${Date.now()}`;
        this._view.webview.postMessage({
          command: 'startStreaming',
          responseId: commandResponseId,
          type: 'system'
        });
        
        // 명령어 실행 (스트리밍 없이)
        const commandResponse = await this._chatService.processMessage(text);
        
        // 명령어 응답 처리
        if (commandResponse) {
          // 응답 형식에 따라 처리
          let responseContent = '';
          let responseType: 'system' | 'assistant' = 'system';
          let hasError = false;
          
          if (typeof commandResponse === 'object' && commandResponse !== null) {
            // CommandResult 타입 검사
            if (commandResponse && 'success' in commandResponse && 'message' in commandResponse) {
              // CommandResult 형식인 경우
              const result = commandResponse as CommandResult;
              responseContent = result.message || JSON.stringify(result, null, 2);
              responseType = result.error ? 'system' : 'assistant';
              hasError = !!result.error;
            }
            // 객체 응답 처리
            else if (commandResponse && 'content' in commandResponse) {
              const content = (commandResponse as {content: string}).content;
              hasError = 'error' in commandResponse && !!(commandResponse as {error?: unknown}).error;
              responseType = hasError ? 'system' : 'assistant';
              responseContent = content;
            } else {
              responseContent = JSON.stringify(commandResponse, null, 2);
            }
          } else {
            responseContent = String(commandResponse);
          }
          
          // 스트리밍 종료 및 응답 표시
          if (this._view && this._view.visible) {
            // 스트리밍 애니메이션 중지
            this._view.webview.postMessage({
              command: 'endStreaming',
              responseId: commandResponseId
            });
            
            // 명령어 응답 표시
            this._sendResponse(responseContent, responseType);
            
            // 명령어 실행 결과 알림 (명령어 패널에서 시각적 피드백을 위함)
            this._view.webview.postMessage({
              command: 'commandExecuted',
              commandId: text, // text 변수에는 명령어 전체 문자열이 포함되어 있음
              success: !hasError
            });
          }
        }
        
        return;
      }
      
      // 일반 메시지는 스트리밍 모드로 처리
      if (useStreaming) {
        // 스트리밍 응답 처리를 위한 변수
        let isFirstChunk = true;
        let chunkCount = 0;
        let startTime = Date.now();
        
        // 스트리밍 응답 ID
        const responseId = `resp-${Date.now()}`;
        
        this.logger.info(`ApeChatViewProvider: 스트리밍 시작 - 응답 ID: ${responseId}`);
        
        // 심층 분석 모드가 활성화된 경우 로그
        if (embedDevMode) {
          this.logger.info(`심층 분석 모드로 처리 - 고급 프롬프트 엔지니어링 및 내부망 데이터 분석 적용`);
        }
        
        // 스트리밍 시작 메시지 전송
        this._view.webview.postMessage({
          command: 'startStreaming',
          responseId: responseId,
          type: 'assistant'
        });
        
        // 스트리밍 콜백
        const streamHandler = (chunk: string) => {
          if (!this._view || !this._view.visible) return;
          
          chunkCount++;
          
          // 첫 청크인 경우 초기화 메시지 전송
          if (isFirstChunk) {
            this.logger.info(`ApeChatViewProvider: 첫 청크 수신 - 길이: ${chunk.length}자`);
            isFirstChunk = false;
          }
          
          // 로그 간소화를 위해 일부 청크만 로깅
          if (chunkCount <= 2 || chunkCount % 50 === 0) {
            this.logger.info(`ApeChatViewProvider: 스트리밍 청크 #${chunkCount} 수신 - 길이: ${chunk.length}자`);
          }
          
          // 청크 전송
          this._view.webview.postMessage({
            command: 'appendStreamChunk',
            responseId: responseId,
            content: chunk,
            type: 'assistant'
          });
        };
        
        // 스트리밍 모드로 처리 (심층 분석 모드 정보 전달)
        await this._chatService.processMessage(text, streamHandler, { embedDevMode: embedDevMode || false });
        
        // 스트리밍 완료 메시지 전송
        if (this._view && this._view.visible) {
          const endTime = Date.now();
          const duration = (endTime - startTime) / 1000;
          
          this.logger.info(`ApeChatViewProvider: 스트리밍 완료 - 총 청크: ${chunkCount}, 소요 시간: ${duration.toFixed(2)}초`);
          
          this._view.webview.postMessage({
            command: 'endStreaming',
            responseId: responseId
          });
        }
      } else {
        // 일반 모드로 처리
        const response = await this._chatService.processMessage(text);
        
        // 응답이 비어있지 않은 경우만 전송
        if (response && this._view && this._view.visible) {
          // 응답 형식에 따라 처리
          if (typeof response === 'object' && response !== null) {
            if (response && 'content' in response && (response as {content?: string}).content) {
              const responseType = response && 'error' in response && !!(response as {error?: unknown}).error ? 'system' : 'assistant';
              this._sendResponse((response as {content: string}).content, responseType);
            } else if (response) {
              this._sendResponse(JSON.stringify(response, null, 2), 'assistant');
            }
          } else if (typeof response === 'string' && response.trim && response.trim() !== '') {
            this._sendResponse(response, 'assistant');
          }
        }
      }
    } catch (error) {
      this.logger.error('메시지 처리 중 오류 발생:', error);
      this._sendResponse('메시지 처리 중 오류가 발생했습니다. 다시 시도해주세요.', 'system');
    }
  }

  /**
   * 응답 메시지 전송
   */
  private _sendResponse(text: string, type: 'assistant' | 'system' = 'assistant'): void {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'addMessage',
        type: type,
        content: text
      });
    }
  }
  
  /**
   * 모델 목록 전송
   */
  private _sendModelList() {
    if (!this._view) {
      this.logger.error('[UI<-EXT] _sendModelList: 뷰가 없어 모델 목록을 전송할 수 없습니다.');
      return;
    }

    try {
      this.logger.info('[UI<-EXT] 모델 목록 전송 시작');
      
      // 저장된 _coreService 참조 사용 (이벤트 기반 설정)
      if (!this._coreService) {
        this.logger.error('_sendModelList: _coreService가 설정되지 않았습니다 (이벤트 기반 설정이 완료되지 않음)');
        throw new Error('Core 서비스가 설정되지 않았습니다');
      }
      const coreService = this._coreService;
      const llmService = coreService.llmService;
      
      if (!llmService) {
        this.logger.error('[UI<-EXT] LLM 서비스를 찾을 수 없습니다.');
        throw new Error('LLM 서비스를 찾을 수 없습니다.');
      }
      
      // 디버그 정보 출력
      this.logger.info('[UI<-EXT] 기본 모델 ID:', llmService.getDefaultModelId());
      
      // 모델 목록 가져오기
      let modelsArray = llmService.getAvailableModels();
      this.logger.info(`[UI<-EXT] 가져온 모델 수: ${modelsArray.length}`);
      
      // 모델 배열 초기화 및 유효성 검사
      if (!Array.isArray(modelsArray)) {
        this.logger.warn('[UI<-EXT] 유효하지 않은 모델 배열 반환됨. 빈 배열로 초기화.');
        modelsArray = [];
      }
      
      // 환경 확인 (외부망인지 내부망인지)
      let isExternalMode = false;
      try {
        const envModule = require('../../../extension.env.js');
        isExternalMode = envModule.ENV_MODE === 'external';
        this.logger.info(`[UI<-EXT] ENV_MODE=${envModule.ENV_MODE}, isExternalMode=${isExternalMode}`);
      } catch (error) {
        this.logger.warn('[UI<-EXT] 환경 변수 로드 실패, 기본 내부망 모드 사용');
      }
      
      // 외부망 모드에서 모델 목록이 비어있거나 필요한 모델이 없는 경우
      if (isExternalMode) {
        // 외부망 모드: 오직 Llama 4 Maverick만 사용 - 절대 삭제 금지
        if (!modelsArray.some(m => m.apiModel === 'meta-llama/llama-4-maverick')) {
          this.logger.info('[UI<-EXT] 외부망 모드 - Llama 4 Maverick 모델 추가 (유일한 모델)');
          
          // 모델 배열 초기화 (오직 하나의 모델만 사용)
          modelsArray = [{
            id: 'openrouter-llama-4-maverick',
            name: 'Llama 4 Maverick',
            provider: 'openrouter',
            temperature: 0.7,
            apiModel: 'meta-llama/llama-4-maverick',
            systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
          }];
          
          this.logger.info('[UI<-EXT] 외부망 모드 - 단일 모델 설정 완료');
        }
      }
      // 내부망 모드에서 모델 목록이 비어있는 경우 필수 모델 추가
      else if (modelsArray.length < 2) {
        this.logger.info('[UI<-EXT] 내부망 모드 - 모델 목록이 불충분하여 필수 모델 추가');
        
        // 내부망 모델 추가 (항상 포함)
        if (!modelsArray.some(m => m.provider === 'custom' || m.name?.includes('NARRANS'))) {
          modelsArray.push({
            id: 'narrans-default',
            name: 'NARRANS (내부망)',
            provider: 'custom',
            temperature: 0.7,
            apiUrl: 'https://api-se-dev.narrans/v1/chat/completions',
            systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
          });
          this.logger.info('[UI<-EXT] 내부망 모델(NARRANS) 추가됨');
        }
        
        // 로컬 모델 추가 (오프라인 작업용)
        if (!modelsArray.some(m => m.provider === 'local')) {
          modelsArray.push({
            id: 'local-fallback',
            name: '로컬 시뮬레이션 모델',
            provider: 'local',
            temperature: 0.7,
            systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
          });
          this.logger.info('[UI<-EXT] 로컬 모델 추가됨');
        }
        
        this.logger.info(`[UI<-EXT] 필수 모델 추가 후 모델 수: ${modelsArray.length}`);
      }
      
      // 모델 정보 매핑 (웹뷰에 전송할 형식으로 변환)
      const models = modelsArray.map((model, index) => {
        try {
          // ID 유효성 확인 및 처리
          let modelId = model.id || model.modelId || `model-${index}`;
          
          // ID에 특수문자가 있으면 제거
          if (modelId.includes('/') || modelId.includes(':')) {
            modelId = modelId.replace(/[\/:.]/g, '-');
          }
          
          // 모델명 없는 경우 기본값 설정
          const modelName = model.name || `모델 ${index + 1}`;
          
          // 단순화된 모델 정보 반환
          return {
            id: modelId,
            name: modelName,
            provider: model.provider || 'unknown'
          };
        } catch (err) {
          this.logger.error(`[UI<-EXT] 모델 변환 중 오류 (인덱스 ${index}):`, err);
          // 오류 발생 시 기본 모델 정보 반환
          return {
            id: `model-${index}`,
            name: `모델 ${index + 1}`,
            provider: 'unknown'
          };
        }
      });
      
      // 모델 중복 제거 및 정렬
      const uniqueModels = this._removeDuplicateModels(models);
      
      // 모델 정보 로깅
      this.logger.info(`[UI<-EXT] 전송할 모델 목록: ${uniqueModels.length}개 (중복 제거 후)`);
      uniqueModels.forEach((model, index) => {
        this.logger.info(`[UI<-EXT] 모델 ${index + 1}: ID=${model.id}, 이름=${model.name}, 제공자=${model.provider}`);
      });
      
      // 웹뷰에 모델 목록 전송
      this._view.webview.postMessage({
        command: 'updateModels',
        models: uniqueModels
      });
      
      this.logger.info('[UI<-EXT] 모델 목록 전송 완료');
      
      // 추가 안정성을 위해 현재 모델도 전송
      setTimeout(() => {
        if (this._view && this._view.visible) {
          // 기본 모델 ID 가져오기
          let defaultModelId = llmService.getDefaultModelId();
          
          // 기본 모델 ID가 없으면 목록에서 첫 번째 모델 사용
          if (!defaultModelId && uniqueModels.length > 0) {
            defaultModelId = uniqueModels[0].id;
            this.logger.info(`[UI<-EXT] 기본 모델 ID 미설정, 첫 번째 모델로 설정: ${defaultModelId}`);
          }
          
          if (defaultModelId) {
            this._view.webview.postMessage({
              command: 'setCurrentModel',
              modelId: defaultModelId
            });
            
            this.logger.info(`[UI<-EXT] 현재 모델 ID 전송: ${defaultModelId}`);
          }
        }
      }, 500);
    } catch (error: unknown) {
      this.logger.error('[UI<-EXT] 모델 목록 전송 오류:', error);
      
      // 오류 발생 시 다양한 백업 모델 목록 전송
      const fallbackModels = [
        { id: 'narrans-emergency', name: 'NARRANS (내부망)', provider: 'custom' },
        { id: 'openrouter-emergency', name: 'Claude 3 Haiku', provider: 'openrouter' },
        { id: 'local-emergency', name: '오프라인 응급 모드', provider: 'local' }
      ];
      
      this.logger.info('[UI<-EXT] 백업 모델 목록 전송:');
      
      try {
        this._view.webview.postMessage({
          command: 'updateModels',
          models: fallbackModels
        });
        
        // 첫 번째 백업 모델을 기본값으로 설정
        this._view.webview.postMessage({
          command: 'setCurrentModel',
          modelId: 'narrans-emergency'
        });
        
        this.logger.info('[UI<-EXT] 백업 모델 목록 및 기본 모델 전송 성공');
      } catch (postError) {
        this.logger.error('[UI<-EXT] 백업 모델 목록 전송 실패:', postError);
      }
    }
  }
  
  /**
   * 모델 목록에서 중복 제거 및 정렬
   * @param models 모델 목록
   * @returns 중복이 제거된 모델 목록
   */
  private _removeDuplicateModels(models: Array<{id: string; name: string; provider: string}>) {
    // ID 기준으로 중복 제거
    const uniqueIds = new Set<string>();
    const uniqueModels: Array<{id: string; name: string; provider: string}> = [];
    
    // 제공자 우선순위 (내부망 > OpenRouter > 로컬 > 기타)
    const providerPriority: Record<string, number> = {
      'custom': 0,   // 내부망 (최우선)
      'openrouter': 1,  // OpenRouter
      'local': 2,    // 로컬
      'unknown': 3   // 기타
    };
    
    // 중복 제거
    for (const model of models) {
      if (!uniqueIds.has(model.id)) {
        uniqueIds.add(model.id);
        uniqueModels.push(model);
      }
    }
    
    // 제공자 우선순위에 따라 정렬
    uniqueModels.sort((a, b) => {
      // 제공자 우선순위 비교
      const priorityA = providerPriority[a.provider] ?? 999;
      const priorityB = providerPriority[b.provider] ?? 999;
      
      // 우선순위가 다르면 우선순위 기준으로 정렬
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 우선순위가 같으면 이름 기준으로 정렬
      return a.name.localeCompare(b.name);
    });
    
    return uniqueModels;
  }
  
  /**
   * 현재 모델 전송
   */
  private _sendCurrentModel() {
    if (!this._view) {
      this.logger.error('_sendCurrentModel: 뷰가 없어 현재 모델을 전송할 수 없습니다.');
      return;
    }

    try {
      this.logger.info('현재 모델 전송 시작');
      
      // 저장된 _coreService 참조 사용 (이벤트 기반 설정)
      if (!this._coreService) {
        this.logger.error('_sendCurrentModel: _coreService가 설정되지 않았습니다 (이벤트 기반 설정이 완료되지 않음)');
        throw new Error('Core 서비스가 설정되지 않았습니다');
      }
      const coreService = this._coreService;
      if (!coreService) {
        this.logger.error('_sendCurrentModel: coreService를 찾을 수 없습니다.');
        throw new Error('Core 서비스를 찾을 수 없습니다.');
      }
      
      const llmService = coreService.llmService;
      if (!llmService) {
        this.logger.error('_sendCurrentModel: llmService를 찾을 수 없습니다.');
        throw new Error('LLM 서비스를 찾을 수 없습니다.');
      }
      
      // 사용 가능한 모델 목록 가져오기
      const availableModels = llmService.getAvailableModels();
      const modelIds = availableModels.map(m => m.id || m.modelId).filter(Boolean);
      this.logger.info(`사용 가능한 모델 ID: ${JSON.stringify(modelIds)}`);
      
      // 기본 모델 ID 가져오기
      this.logger.info('getDefaultModelId 메서드 호출 시도...');
      let defaultModelId = llmService.getDefaultModelId();
      
      // 기본 모델 ID가 없거나 유효하지 않은 경우 적절한 폴백 처리
      if (!defaultModelId || !modelIds.includes(defaultModelId)) {
        this.logger.warn(`기본 모델 ID(${defaultModelId || 'undefined'})가 없거나 유효하지 않습니다. 폴백 모델 선택...`);
        
        // 우선순위에 따라 폴백 모델 선택
        // 1. 내부망 모델 (custom)
        const internalModel = availableModels.find(m => m.provider === 'custom');
        // 2. OpenRouter 모델
        const openRouterModel = availableModels.find(m => m.provider === 'openrouter');
        // 3. 로컬 모델
        const localModel = availableModels.find(m => m.provider === 'local');
        // 4. 첫 번째 가용 모델
        const firstAvailableModel = availableModels[0];
        
        // 우선순위에 따라 폴백 모델 ID 설정
        defaultModelId = (
          (internalModel && (internalModel.id || internalModel.modelId)) ||
          (openRouterModel && (openRouterModel.id || openRouterModel.modelId)) ||
          (localModel && (localModel.id || localModel.modelId)) ||
          (firstAvailableModel && (firstAvailableModel.id || firstAvailableModel.modelId)) ||
          'openrouter-claude-3-haiku' // 최후의 폴백
        );
        
        this.logger.info(`폴백 모델 ID로 설정됨: ${defaultModelId}`);
      } else {
        this.logger.info(`현재 기본 모델: ${defaultModelId}`);
      }
      
      // 모델 ID가 특수 문자를 포함하는 경우 정리
      if (defaultModelId && (defaultModelId.includes('/') || defaultModelId.includes(':'))) {
        const cleanModelId = defaultModelId.replace(/[\/:.]/g, '-');
        this.logger.info(`모델 ID에 특수 문자 포함, 정리됨: ${defaultModelId} -> ${cleanModelId}`);
        defaultModelId = cleanModelId;
      }
      
      // 선택된 모델에 대한 정보 로깅
      if (defaultModelId) {
        const selectedModel = availableModels.find(m => 
          (m.id === defaultModelId) || (m.modelId === defaultModelId)
        );
        
        if (selectedModel) {
          this.logger.info(`선택된 모델 정보: ${JSON.stringify({
            id: selectedModel.id || selectedModel.modelId,
            name: selectedModel.name,
            provider: selectedModel.provider
          })}`);
        }
      }
      
      // 웹뷰에 모델 ID 전송
      if (this._view && this._view.visible && defaultModelId) {
        try {
          this._view.webview.postMessage({
            command: 'setCurrentModel',
            modelId: defaultModelId
          });
          this.logger.info(`현재 모델 ID(${defaultModelId}) 전송 성공`);
          
          // VS Code 설정에도 저장 (지속성 보장)
          vscode.workspace.getConfiguration('ape.llm').update(
            'defaultModel', 
            defaultModelId, 
            vscode.ConfigurationTarget.Global
          ).then(() => {
            this.logger.info(`모델 ID가 설정에 저장됨: ${defaultModelId}`);
          }).catch(err => {
            this.logger.error('설정 저장 중 오류:', err);
          });
        } catch (postError) {
          this.logger.error('현재 모델 ID 전송 중 오류:', postError);
        }
      }
    } catch (error: unknown) {
      this.logger.error('현재 모델 전송 중 오류 발생:', error);
      this.logger.error('오류 상세:', error instanceof Error ? error.stack : 'Error stack not available');
      
      // 오류 발생 시 상황에 따른 적절한 폴백 모델 선택
      try {
        // 순차적으로 사용 가능한 모델 ID 시도
        const fallbackModelIds = [
          'narrans-emergency',        // 내부망 응급 모델
          'openrouter-claude-3-haiku', // OpenRouter 모델
          'local-emergency'           // 로컬 응급 모델
        ];
        
        let selectedFallback = fallbackModelIds[0]; // 기본값
        
        // 현재 시간에 따라 다른 폴백 모델 선택 (여러 모델을 고르게 사용하기 위함)
        const currentHour = new Date().getHours();
        if (currentHour % 3 === 0) {
          selectedFallback = fallbackModelIds[0];
        } else if (currentHour % 3 === 1) {
          selectedFallback = fallbackModelIds[1];
        } else {
          selectedFallback = fallbackModelIds[2];
        }
        
        this.logger.info(`오류 발생으로 인한 폴백 모델 ID 선택: ${selectedFallback}`);
        
        if (this._view && this._view.visible) {
          this._view.webview.postMessage({
            command: 'setCurrentModel',
            modelId: selectedFallback
          });
          this.logger.info('오류 복구 모델 ID 전송 성공');
        }
      } catch (postError) {
        this.logger.error('오류 복구 모델 ID 전송 중 추가 오류:', postError);
      }
    }
  }
  
  /**
   * 명령어 목록 전송
   */
  private async _sendCommandsList() {
    if (!this._view) {
      return;
    }
    
    try {
      // 저장된 _coreService 참조 사용
      if (!this._coreService) {
        this.logger.error('_sendCommandsList: _coreService가 설정되지 않았습니다');
        throw new Error('Core 서비스가 설정되지 않았습니다');
      }
      const coreService = this._coreService;
      const commandRegistry = coreService.commandRegistry;
      
      // 모든 명령어 사용법 가져오기
      const allUsages = commandRegistry.getAllCommandUsages();
      
      // 명령어 목록 생성 (확장된 구조)
      const commands = allUsages.map(usage => {
        // 명령어 타입 및 도메인 결정
        const isAtCommand = usage.syntax.startsWith('@');
        const isSlashCommand = usage.syntax.startsWith('/');
        
        // 명령어 도메인 추출
        let domain = '';
        if (isAtCommand && usage.domain) {
          domain = usage.domain;
        } else if (isSlashCommand) {
          domain = 'system';
        }
        
        // 즐겨찾기 명령어 결정 (기본 자주 사용하는 명령어)
        const isFavorite = ['help', 'model', 'debug', 'clear'].includes(usage.command);
        
        return {
          id: usage.syntax,
          label: usage.command,
          description: usage.description,
          syntax: usage.syntax,
          examples: usage.examples || [],
          type: isAtCommand ? 'at' : (isSlashCommand ? 'slash' : 'other'),
          domain: domain,
          frequent: isFavorite,
          iconName: this._getIconForCommand(usage.command, domain)
        };
      });
      
      // Git 브랜치 정보 가져오기
      const dynamicData = await this._getDynamicData();
      
      // 명령어 목록과 동적 데이터 전송
      this._view.webview.postMessage({
        command: 'updateCommands',
        commands: commands,
        dynamicData: dynamicData
      });
      
      this.logger.info(`${commands.length}개의 명령어와 동적 데이터를 웹뷰로 전송했습니다.`);
    } catch (error) {
      this.logger.error('명령어 목록 전송 중 오류 발생:', error);
    }
  }
  
  /**
   * 동적 데이터 가져오기 (Git 브랜치 및 컨텍스트 기반 명령어)
   * @returns 동적 데이터 객체
   */
  private async _getDynamicData(): Promise<Record<string, unknown>> {
    try {
      // APE 코어 서비스 접근 (이벤트 기반 저장된 참조 사용)
      if (!this._coreService) {
        this.logger.error('_getDynamicData: _coreService가 설정되지 않았습니다 (이벤트 기반 설정이 완료되지 않음)');
        throw new Error('Core 서비스가 설정되지 않았습니다');
      }
      const coreService = this._coreService;
      const pluginRegistry = coreService.pluginRegistry;
      const commandService = coreService.commandService;
      
      // 동적 데이터 객체 초기화
      const dynamicData: Record<string, unknown> = {};
      
      // Git 플러그인 가져오기
      const gitPlugin = pluginRegistry ? pluginRegistry.getPlugin('git') : null;
      
      if (gitPlugin) {
        // Git 브랜치 정보 가져오기
        try {
          // gitPlugin에서 client 프로퍼티 접근 (내부 GitClientService)
          const gitClient = (gitPlugin as {client?: {getBranches?: (showRemote: boolean) => Promise<string[]>}}).client;
          
          if (gitClient && typeof gitClient.getBranches === 'function') {
            // Git 브랜치 목록 가져오기
            const branches = await gitClient.getBranches(true);
            
            if (branches && Array.isArray(branches)) {
              // 브랜치 정보 추가
              dynamicData['gitBranches'] = branches;
              this.logger.info(`Git 브랜치 정보 로드 완료: ${branches.length}개 브랜치`);
            }
          }
        } catch (gitError) {
          this.logger.error('Git 브랜치 정보 가져오기 실패:', gitError);
        }
      }
      
      // 컨텍스트 기반 명령어 생성
      if (commandService) {
        try {
          // 컨텍스트 캐시 가져오기
          const contextCache = commandService.getContextCache();
          
          // 생성할 컨텍스트 명령어 기본 템플릿
          const baseCommands = [
            // Git 명령어
            { id: '@git:commit', label: 'Git 커밋' },
            { id: '@git:push', label: 'Git 푸시' },
            { id: '@git:checkout', label: 'Git 체크아웃' },
            { id: '@git:branch', label: 'Git 브랜치 생성' },
            
            // Jira 명령어
            { id: '@jira:issue', label: 'Jira 이슈 조회' },
            { id: '@jira:create', label: 'Jira 이슈 생성' },
            { id: '@jira:search', label: 'Jira 이슈 검색' },
            
            // SWDP 명령어
            { id: '@swdp:build', label: 'SWDP 빌드' },
            { id: '@swdp:build-status', label: 'SWDP 빌드 상태' },
            { id: '@swdp:test', label: 'SWDP 테스트' },
            
            // Pocket 명령어
            { id: '@pocket:ls', label: 'Pocket 파일 목록' },
            { id: '@pocket:load', label: 'Pocket 파일 로드' },
            { id: '@pocket:search', label: 'Pocket 파일 검색' }
          ];
          
          // 컨텍스트 기반 명령어 생성 결과
          const contextCommands: {id: string; label: string; description: string; type: string; group: string; contextual: boolean}[] = [];
          
          // 각 명령어에 대해 컨텍스트 기반 명령어 생성
          for (const baseCmd of baseCommands) {
            try {
              const result = await commandService.generateContextualCommand(baseCmd.id);
              
              // 단일 명령어 또는 명령어 배열 처리
              if (Array.isArray(result)) {
                // 여러 옵션이 있는 경우
                result.forEach((cmdStr, index) => {
                  contextCommands.push({
                    id: cmdStr,
                    label: `${baseCmd.label} (컨텍스트 옵션 ${index + 1})`,
                    description: '컨텍스트 기반 추천 명령어',
                    type: 'at',
                    group: cmdStr.split(':')[0].replace('@', ''),
                    contextual: true
                  });
                });
              } else if (typeof result === 'string' && result !== baseCmd.id) {
                // 단일 명령어 추가 (원본과 다른 경우만)
                contextCommands.push({
                  id: result,
                  label: `${baseCmd.label} (컨텍스트 추천)`,
                  description: '컨텍스트 기반 추천 명령어',
                  type: 'at',
                  group: result.split(':')[0].replace('@', ''),
                  contextual: true
                });
              }
            } catch (cmdError) {
              this.logger.error(`컨텍스트 명령어 생성 오류 (${baseCmd.id}):`, cmdError);
            }
          }
          
          // 컨텍스트 명령어 추가
          if (contextCommands.length > 0) {
            dynamicData['contextCommands'] = contextCommands;
            this.logger.info(`컨텍스트 기반 명령어 ${contextCommands.length}개 생성 완료`);
          }
        } catch (contextError) {
          this.logger.error('컨텍스트 기반 명령어 생성 중 오류:', contextError);
        }
      }
      
      return dynamicData;
    } catch (error) {
      this.logger.error('동적 데이터 가져오기 중 오류 발생:', error);
      return {};
    }
  }
  
  /**
   * TreeView 액션 처리
   * @param message 트리뷰 액션 메시지
   */
  private _handleTreeViewAction(message: {actionType: string; item: {id?: string; type: string}}) {
    this.logger.info('TreeView 액션 처리:', message);
    
    const actionType = message.actionType;
    const item = message.item;
    
    if (!actionType || !item) {
      return;
    }
    
    switch (actionType) {
      case 'select':
        // 트리 아이템 선택 처리
        this._handleTreeItemSelection(item);
        break;
        
      case 'execute':
        // 트리 아이템 명령어 실행
        if (item.type === 'command' && item.id) {
          this._executeCommand(item.id);
        }
        break;
        
      case 'showDetails':
        // 트리 아이템 세부 정보 표시
        if (item.type === 'command' && item.id) {
          this._showCommandDetails({id: item.id, type: item.type});
        }
        break;
    }
  }
  
  /**
   * TreeView 아이템 선택 처리
   * @param item 선택된 트리 아이템
   */
  private _handleTreeItemSelection(item: {type: string; id?: string}) {
    this.logger.info('TreeView 아이템 선택:', item);
    
    // 아이템 타입에 따른 처리
    switch (item.type) {
      case 'command':
        // 명령어 아이템 선택 시 명령어 패널에 해당 명령어 표시
        if (this._view && item.id) {
          this._view.webview.postMessage({
            command: 'highlightCommand',
            commandId: item.id
          });
        }
        break;
        
      case 'chat-session':
        // 채팅 세션 선택 시 해당 세션 로드
        if (this._view && item.id) {
          // 여기에서는 채팅 세션 ID로 세션 로드 로직 구현
          this.logger.info('채팅 세션 로드:', item.id);
        }
        break;
    }
  }
  
  /**
   * 명령어 세부 정보 표시
   * @param item 명령어 아이템
   */
  private _showCommandDetails(item: {id: string; type: string}) {
    if (!this._view) {
      return;
    }
    
    this.logger.info('명령어 세부 정보 표시:', item);
    
    // 명령어 세부 정보가 있는 경우 웹뷰에 전달
    this._view.webview.postMessage({
      command: 'showCommandDetail',
      commandItem: item
    });
  }
  
  /**
   * 명령어에 적합한 아이콘 결정
   * @param command 명령어 이름
   * @param domain 명령어 도메인
   * @returns 아이콘 객체 {icon: string, source: string}
   */
  private _getIconForCommand(command: string, domain: string): {icon: string; source: string} {
    // 도메인별 기본 아이콘
    const domainIcons: {[key: string]: {icon: string, source: string}} = {
      'system': { icon: 'gear-six', source: 'phosphor' },
      'git': { icon: 'git-branch', source: 'phosphor' },
      'doc': { icon: 'file-text', source: 'phosphor' },
      'jira': { icon: 'kanban', source: 'phosphor' },
      'pocket': { icon: 'archive-box', source: 'phosphor' },
      'vault': { icon: 'database', source: 'phosphor' },
      'rules': { icon: 'scales', source: 'phosphor' },
      'swdp': { icon: 'infinity', source: 'phosphor' }
    };
    
    // 명령어별 아이콘
    const commandIcons: {[key: string]: {icon: string, source: string}} = {
      // Git 관련
      'commit': { icon: 'git-commit', source: 'phosphor' },
      'push': { icon: 'arrow-up', source: 'phosphor' },
      'pull': { icon: 'git-pull-request', source: 'phosphor' },
      'branch': { icon: 'git-branch', source: 'phosphor' },
      'merge': { icon: 'git-merge', source: 'phosphor' },
      'clone': { icon: 'copy', source: 'phosphor' },
      
      // Jira 관련
      'issue': { icon: 'note-pencil', source: 'phosphor' },
      'ticket': { icon: 'note-pencil', source: 'phosphor' },
      'bug': { icon: 'bug', source: 'phosphor' },
      'task': { icon: 'clipboard-text', source: 'phosphor' },
      
      // 일반 명령어
      'help': { icon: 'question', source: 'phosphor' },
      'model': { icon: 'robot', source: 'phosphor' },
      'debug': { icon: 'bug', source: 'phosphor' },
      'clear': { icon: 'trash', source: 'phosphor' },
      'settings': { icon: 'gear-six', source: 'phosphor' },
      'config': { icon: 'sliders', source: 'phosphor' },
      'search': { icon: 'magnifying-glass', source: 'phosphor' },
      'list': { icon: 'list', source: 'phosphor' },
      'build': { icon: 'hammer', source: 'phosphor' },
      'deploy': { icon: 'cloud-arrow-up', source: 'phosphor' },
      'test': { icon: 'test-tube', source: 'phosphor' },
      'document': { icon: 'file-text', source: 'phosphor' },
      'save': { icon: 'floppy-disk', source: 'phosphor' },
    };
    
    // 명령어 이름으로 직접 매칭
    if (commandIcons[command]) {
      return commandIcons[command];
    }
    
    // 명령어 이름에 특정 키워드 포함 여부 확인
    for (const [keyword, icon] of Object.entries(commandIcons)) {
      if (command.includes(keyword)) {
        return icon;
      }
    }
    
    // 도메인별 기본 아이콘 반환
    return domainIcons[domain] || { icon: 'terminal', source: 'phosphor' };
  }

  /**
   * 명령어 실행
   */
  private async _executeCommand(commandId: string): Promise<void> {
    if (!this._view) {
      return;
    }
    
    try {
      this.logger.info(`명령어 실행: ${commandId}`);
      
      // 명령어 실행 전 로딩 표시
      this._sendResponse(`명령어 '${commandId}' 실행 중...`, 'system');
      
      // 내부 명령어와 외부 명령어 구분하여 처리
      const isInternalCommand = commandId.startsWith('/');
      const isExternalCommand = commandId.startsWith('@');
      
      if (isInternalCommand || isExternalCommand) {
        // ApeCoreService를 통해 명령어 실행
        const result = await this._chatService.processMessage(commandId);
        
        // 명령어 결과를 채팅으로 표시
        if (result) {
          // 시스템 메시지 삭제
          if (this._view && this._view.visible) {
            this._view.webview.postMessage({
              command: 'removeSystemMessage',
              content: `명령어 '${commandId}' 실행 중...`
            });
          }
          
          // 결과 형식에 따른 처리
          let isError = false;
          
          // 타입 가드: CommandResult 타입 체크
          const isCommandResult = (obj: unknown): obj is CommandResult => {
            return obj !== null && typeof obj === 'object' && 'success' in obj;
          };
          
          if (typeof result === 'object' && result !== null) {
            // CommandResult 형식인 경우
            if (result && isCommandResult(result)) {
              // Now we know it's a CommandResult
              const typedResult = result as CommandResult;
              
              // message 속성이 있는 경우 (CommandResult에 message로 정의됨)
              if (typedResult.message) {
                const responseType = typedResult.error ? 'system' : 'assistant';
                isError = !!typedResult.error;
                this._sendResponse(typedResult.message, responseType);
              } else {
                this._sendResponse(JSON.stringify(typedResult, null, 2), 'assistant');
              }
            } 
            // 다른 객체 형식인 경우
            else if (result && 'content' in result) {
              const content = (result as {content: string}).content;
              const hasError = 'error' in result && !!(result as {error?: unknown}).error;
              const responseType = hasError ? 'system' : 'assistant';
              isError = hasError;
              this._sendResponse(content, responseType);
            } 
            // 구조를 알 수 없는 객체
            else {
              this._sendResponse(JSON.stringify(result, null, 2), 'assistant');
            }
          } 
          // 문자열 또는 기타 기본 타입
          else {
            this._sendResponse(String(result), 'assistant');
          }
          
          // 명령어 실행 결과 알림 (명령어 패널 피드백용)
          if (this._view && this._view.visible) {
            this._view.webview.postMessage({
              command: 'commandExecuted',
              commandId: commandId,
              success: !isError
            });
          }
        }
      } else {
        // VS Code 명령어 실행
        vscode.commands.executeCommand(commandId)
          .then(result => {
            this.logger.info('VS Code 명령어 실행 결과:', result);
            // 결과를 웹뷰에 전송
            this._sendResponse(`명령어 '${commandId}' 실행 완료`, 'system');
          }, (error: unknown) => {
            // 타입스크립트 오류 방지를 위해 then의 두 번째 인자로 에러 처리
            this.logger.error('VS Code 명령어 실행 오류:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this._sendResponse(`명령어 실행 오류: ${errorMessage}`, 'system');
          });
      }
    } catch (error) {
      this.logger.error('명령어 실행 중 오류 발생:', error);
      this._sendResponse(`명령어 실행 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'system');
    }
  }
  
  /**
   * 모델 변경
   */
  private _changeModel(modelId: string): void {
    if (!modelId) {
      this.logger.warn('_changeModel: 유효하지 않은 모델 ID로 호출됨');
      return;
    }
    
    try {
      this.logger.info(`모델 변경 요청 - DEBUG 버전: ${modelId}`);
      
      // 저장된 _coreService 참조 사용 (이벤트 기반 설정)
      if (!this._coreService) {
        this.logger.error('_changeModel: _coreService가 설정되지 않았습니다 (이벤트 기반 설정이 완료되지 않음)');
        throw new Error('Core 서비스가 설정되지 않았습니다');
      }
      const coreService = this._coreService;
      
      const llmService = coreService.llmService;
      if (!llmService) {
        this.logger.error('_changeModel: llmService를 찾을 수 없습니다.');
        throw new Error('LLM 서비스를 찾을 수 없습니다.');
      }
      
      // 기존 모델과 같은지 확인
      const currentDefaultId = llmService.getDefaultModelId();
      this.logger.info(`현재 기본 모델: ${currentDefaultId || 'none'}, 변경 요청 모델: ${modelId}`);
      
      if (currentDefaultId && currentDefaultId === modelId) {
        this.logger.info(`현재 모델과 동일한 모델(${modelId})로 변경 요청, 무시함`);
        
        // 즉시 성공 응답을 보내서 UI 상태 동기화
        if (this._view && this._view.visible) {
          this._view.webview.postMessage({
            command: 'modelChanged',
            modelId: modelId,
            success: true,
            changed: false
          });
        }
        return;
      }
      
      // 모델이 유효한지 확인
      this.logger.info('사용 가능한 모델 목록 조회 중...');
      const models = llmService.getAvailableModels();
      this.logger.info(`총 ${models.length}개의 모델 조회됨`);
      
      // 각 모델 정보 로깅
      models.forEach((model, idx) => {
        this.logger.info(`모델 ${idx+1}:`, {
          id: model.id || '[없음]',
          modelId: model.modelId || '[없음]',
          name: model.name,
          provider: model.provider || '[없음]',
          apiModel: model.apiModel || '[없음]'
        });
      });
      
      // 유효성 검사를 위한 모든 가능한 ID 생성
      const validModel = models.find(model => {
        const possibleIds = [
          model.id,
          model.modelId,
          model.apiModel ? model.apiModel.replace(/[\/:.]/g, '-') : null,
          // 이름 기반 ID 생성 (매칭될 가능성 있음)
          model.name ? `${model.provider || 'model'}-${model.name.toLowerCase().replace(/\s+/g, '-')}` : null
        ].filter(Boolean); // null/undefined 제거
        
        this.logger.info(`모델 ${model.name} 가능한 ID 목록:`, possibleIds);
        
        return possibleIds.includes(modelId);
      });
      
      if (!validModel) {
        this.logger.warn(`요청된 모델 ID '${modelId}'가 유효한 모델 목록에 없습니다.`);
        this.logger.info('===== 유효한 모델 목록 (ID 기준) =====');
        models.forEach((model, idx) => {
          this.logger.info(`${idx+1}. ${model.id || model.modelId || '[ID 없음]'}: ${model.name}`);
        });
        
        // 모델 ID가 유효하지 않을 때도 진행 (외부에서 추가된 모델일 수 있음)
        this.logger.info('모델 유효성 검사 실패했으나 계속 진행합니다. 외부에서 추가된 모델일 수 있습니다.');
      } else {
        this.logger.info(`유효한 모델을 찾았습니다: ${validModel.name} (ID: ${validModel.id || validModel.modelId})`);
      }
      
      // VS Code 설정에 모델 ID 저장
      this.logger.info(`VS Code 설정에 모델 ID(${modelId}) 저장 시도...`);
      const config = vscode.workspace.getConfiguration('ape.llm');
      
      config.update('defaultModel', modelId, vscode.ConfigurationTarget.Global)
        .then(() => {
          this.logger.info(`모델이 ${modelId}로 변경되었습니다.`);
          
          // UI에 변경 알림
          if (this._view && this._view.visible) {
            this.logger.info('웹뷰에 모델 변경 성공 알림 전송');
            this._view.webview.postMessage({
              command: 'modelChanged',
              modelId: modelId,
              success: true,
              changed: true
            });
            
            // 시스템 메시지로 변경 알림
            const modelName = validModel ? validModel.name : modelId;
            this.logger.info(`시스템 메시지로 모델 변경 알림: ${modelName}`);
            this._sendResponse(`모델이 '${modelName}'(으)로 변경되었습니다.`, 'system');
          }
        }, (err: Error) => {
          this.logger.error('설정 업데이트 중 오류 발생:', err);
          this.logger.error('오류 상세:', err.stack);
          
          // UI에 오류 알림
          if (this._view && this._view.visible) {
            this.logger.info('웹뷰에 모델 변경 실패 알림 전송');
            this._view.webview.postMessage({
              command: 'modelChanged',
              modelId: modelId,
              success: false,
              error: err.message || '설정 업데이트 실패'
            });
          }
        });
    } catch (error) {
      this.logger.error('모델 변경 중 오류 발생:', error);
      this.logger.error('오류 상세:', error instanceof Error ? error.stack : '스택 정보 없음');
      
      // UI에 오류 알림
      if (this._view && this._view.visible) {
        try {
          this.logger.info('웹뷰에 모델 변경 오류 알림 전송');
          this._view.webview.postMessage({
            command: 'modelChanged',
            modelId: modelId,
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
          });
        } catch (postError) {
          this.logger.error('오류 알림 전송 중 추가 오류:', postError);
        }
      }
    }
  }

  /**
   * 채팅 초기화
   */
  public clearChat() {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'clearChat'
      });
      
      // 시스템 메시지 추가
      setTimeout(() => {
        this._view?.webview.postMessage({
          command: 'addMessage',
          type: 'system',
          content: '채팅이 초기화되었습니다.'
        });
        
        // 웰컴 메시지 다시 표시
        setTimeout(() => {
          this._sendResponse(this._chatService.getWelcomeMessage(), 'assistant');
        }, 500);
      }, 100);
    }
  }

  /**
   * HTML 내용 생성
   */
  private _getHtmlContent(webview: vscode.Webview) {
    // 리소스 경로 가져오기
    const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'resources', 'html', 'chat.html');
    
    // 웹뷰 리소스 기본 URI (아이콘, 폰트 등의 기본 경로)
    const webviewResourceBaseUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources'));
    
    try {
      // HTML 파일이 존재하는지 확인
      if (!fs.existsSync(htmlPath.fsPath)) {
        this.logger.error(`HTML 파일을 찾을 수 없습니다: ${htmlPath.fsPath}`);
        throw new Error('HTML 파일을 찾을 수 없습니다.');
      }
      
      // 리소스 URI 매핑 생성
      const resourceMap = this._createResourceMap(webview);
      
      // HTML 파일 읽기
      let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
      
      // CSP 소스 및 리소스 경로 설정
      const cspSource = webview.cspSource;
      htmlContent = htmlContent.replace(/\$\{cspSource\}/g, cspSource);
      htmlContent = htmlContent.replace(/\$\{webviewResourceBaseUri\}/g, webviewResourceBaseUri.toString());
      
      // 모든 리소스 URI 매핑 적용
      for (const [key, uri] of Object.entries(resourceMap)) {
        const placeholder = `\$\{${key}\}`;
        const regex = new RegExp(placeholder, 'g');
        htmlContent = htmlContent.replace(regex, uri.toString());
      }
      
      this.logger.info('HTML 파일 로드 성공:', htmlPath.fsPath);
      this.logger.info('기본 리소스 경로:', webviewResourceBaseUri.toString());
      
      return htmlContent;
    } catch (error) {
      this.logger.error('HTML 파일을 읽는 중 오류 발생:', error);
      
      // 오류 시 기본 HTML 반환
      return `<!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
        <title>APE 채팅</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
          }
          .error {
            color: var(--vscode-errorForeground);
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>APE 채팅</h1>
        <div class="error">
          <p>오류: 채팅 인터페이스를 로드할 수 없습니다.</p>
          <p>HTML 파일을 찾을 수 없거나 읽는 중 오류가 발생했습니다.</p>
          <p>경로: ${htmlPath.fsPath}</p>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
        </script>
      </body>
      </html>`;
    }
  }

  /**
   * 리소스 URI 매핑 생성
   * @param webview VS Code 웹뷰 인스턴스
   * @returns 리소스 키와 URI 매핑 객체
   */
  private _createResourceMap(webview: vscode.Webview): Record<string, vscode.Uri> {
    // CSS 리소스 매핑 (단일 파일로 통합)
    const cssResources = {
      // 메인 CSS (모든 스타일 통합)
      cssUri: this._getUri(webview, 'resources', 'css', 'main.css'),
      
      // 외부 리소스
      codiconsUri: this._getUri(webview, 'resources', 'codicons', 'codicon.css'),
      
      // Phosphor 아이콘 CSS
      phosphorIconsCssUri: this._getUri(webview, 'resources', 'fonts', 'phosphor', 'css', 'regular.css')
    };
    
    // JS 리소스 매핑 - 새 디렉토리 구조 적용
    const jsResources = {
      // 컴포넌트 JS
      modelSelectorJsUri: this._getUri(webview, 'resources', 'js', 'components', 'model-selector.js'),
      codeBlocksJsUri: this._getUri(webview, 'resources', 'js', 'components', 'code-blocks.js'),
      commandButtonsJsUri: this._getUri(webview, 'resources', 'js', 'components', 'command-buttons.js'),
      
      // 코어 JS
      apeUiJsUri: this._getUri(webview, 'resources', 'js', 'core', 'ape-ui.js'),
      
      // 유틸리티 JS
      loggerJsUri: this._getUri(webview, 'resources', 'js', 'utils', 'logger.js'),
      domUtilsJsUri: this._getUri(webview, 'resources', 'js', 'utils', 'dom-utils.js'),
      eventBusJsUri: this._getUri(webview, 'resources', 'js', 'utils', 'event-bus.js')
    };
    
    // HTML 리소스 매핑
    const htmlResources = {
      commandsHtmlUri: this._getUri(webview, 'resources', 'html', 'command-buttons.html')
    };
    
    // 모든 리소스 병합
    return {
      ...cssResources,
      ...jsResources,
      ...htmlResources
    };
  }
  
  /**
   * 안전한 URI 생성 헬퍼 메소드
   * 파일이 존재하지 않아도 URI는 항상 생성
   */
  private _getUri(webview: vscode.Webview, ...pathSegments: string[]): vscode.Uri {
    return webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, ...pathSegments));
  }
}