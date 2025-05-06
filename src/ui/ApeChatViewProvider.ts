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

// 로그 레벨 정의
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * 채팅 웹뷰 제공자 클래스
 */
export class ApeChatViewProvider implements vscode.WebviewViewProvider {
  
  public _view?: vscode.WebviewView;

  private logger: LoggerService;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _chatService: ChatService,
    private readonly _coreService: ICoreService
  ) {
    this.logger = new LoggerService();
    this.logger.setLevel(LogLevel.DEBUG); // 로깅 레벨을 DEBUG로 변경
    this.logger.info('ApeChatViewProvider 생성자 - CoreService 직접 주입됨');
    this.logger.debug('_extensionUri: ' + _extensionUri.fsPath);
    
    try {
      // 중요 파일들 존재 여부 확인
      const fs = require('fs');
      const path = require('path');
      
      // 리소스 파일 경로
      const htmlPath = path.join(_extensionUri.fsPath, 'resources', 'html', 'chat.html');
      const mainCssPath = path.join(_extensionUri.fsPath, 'resources', 'css', 'main.css');
      const apeUiJsPath = path.join(_extensionUri.fsPath, 'resources', 'js', 'core', 'ape-ui.js');
      
      // 서브 디렉토리 경로 확인
      const cssComponentsPath = path.join(_extensionUri.fsPath, 'resources', 'css', 'components');
      const cssCoreFilesPath = path.join(_extensionUri.fsPath, 'resources', 'css', 'core');
      const jsComponentsPath = path.join(_extensionUri.fsPath, 'resources', 'js', 'components');
      const jsCorePath = path.join(_extensionUri.fsPath, 'resources', 'js', 'core');
      const jsUtilsPath = path.join(_extensionUri.fsPath, 'resources', 'js', 'utils');
      
      this.logger.debug('주요 리소스 파일 경로 확인:');
      this.logger.debug('- HTML 파일: ' + htmlPath + ' (존재: ' + fs.existsSync(htmlPath) + ')');
      this.logger.debug('- CSS 파일: ' + mainCssPath + ' (존재: ' + fs.existsSync(mainCssPath) + ')');
      this.logger.debug('- JS 파일: ' + apeUiJsPath + ' (존재: ' + fs.existsSync(apeUiJsPath) + ')');
      
      // 서브 디렉토리 존재 확인
      this.logger.debug('서브 디렉토리 존재 확인:');
      this.logger.debug('- CSS/components 디렉토리: ' + cssComponentsPath + ' (존재: ' + fs.existsSync(cssComponentsPath) + ')');
      this.logger.debug('- CSS/core 디렉토리: ' + cssCoreFilesPath + ' (존재: ' + fs.existsSync(cssCoreFilesPath) + ')');
      this.logger.debug('- JS/components 디렉토리: ' + jsComponentsPath + ' (존재: ' + fs.existsSync(jsComponentsPath) + ')');
      this.logger.debug('- JS/core 디렉토리: ' + jsCorePath + ' (존재: ' + fs.existsSync(jsCorePath) + ')');
      this.logger.debug('- JS/utils 디렉토리: ' + jsUtilsPath + ' (존재: ' + fs.existsSync(jsUtilsPath) + ')');
    } catch (error) {
      this.logger.error('리소스 파일 확인 중 오류:', error);
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.logger.info('resolveWebviewView 메서드 시작');
    this._view = webviewView;

    
    webviewView.description = "채팅 인터페이스";
    this.logger.debug('웹뷰 설명 설정: "채팅 인터페이스"');

    this.logger.debug('웹뷰 옵션 설정 시작');
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    this.logger.debug('웹뷰 옵션 설정 완료 (스크립트 활성화, 로컬 리소스 루트 설정)');
    
    // 뷰의 크기 변경 속성 설정
    this.logger.debug('뷰 가시성 변경 이벤트 리스너 등록');
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.logger.info('채팅 웹뷰가 표시되었습니다.');
        this._sendCurrentTheme();
      } else {
        this.logger.info('채팅 웹뷰가 숨겨졌습니다.');
      }
    });
    
    // 웹뷰가 리사이즈될 때 대응
    this.logger.debug('뷰 상태 변경 이벤트 리스너 등록');
    // VS Code API에서 제공하는 정확한 이벤트 리스너 사용
    vscode.window.onDidChangeActiveTextEditor(() => {
      this.logger.info('활성 편집기 변경됨');
      if (this._view && this._view.visible) {
        this.logger.debug('viewStateChanged 메시지 전송');
        this._view.webview.postMessage({
          command: 'viewStateChanged',
          isVisible: true
        });
      }
    });
    
    // HTML 콘텐츠 설정
    this.logger.debug('웹뷰 HTML 콘텐츠 생성 시작');
    try {
      const htmlContent = this._getHtmlContent(webviewView.webview);
      this.logger.debug(`생성된 HTML 콘텐츠 길이: ${htmlContent.length}자`);
      
      // HTML 설정
      this.logger.debug('웹뷰에 HTML 콘텐츠 설정 시작');
      webviewView.webview.html = htmlContent;
      this.logger.info('채팅 웹뷰 HTML 설정 완료');
    } catch (error) {
      this.logger.error('웹뷰 HTML 콘텐츠 설정 중 오류 발생:', error);
      
      // 간단한 오류 페이지 표시
      webviewView.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); }
            .error { color: var(--vscode-errorForeground); margin: 20px 0; }
            pre { background: rgba(0,0,0,0.1); padding: 10px; overflow: auto; }
          </style>
        </head>
        <body>
          <h2>웹뷰 로딩 오류</h2>
          <div class="error">
            <p>APE 채팅 인터페이스를 로드하는 중 오류가 발생했습니다.</p>
            <p>오류 상세 정보:</p>
            <pre>${error instanceof Error ? error.message : String(error)}</pre>
          </div>
          <p>VS Code를 다시 시작하거나 확장을 재설치해보세요.</p>
        </body>
        </html>
      `;
      
      // 오류 알림 표시
      vscode.window.showErrorMessage('APE 채팅 인터페이스 로딩 실패: ' + (error instanceof Error ? error.message : String(error)));
    }
    
    // VS Code 테마 변경 이벤트 구독
    this._registerThemeChangeListener();
    
    // 뷰 너비 및 높이 변경 알림
    const viewStateChangeEmitter = new vscode.EventEmitter<void>();
    const onDidChangeViewState = viewStateChangeEmitter.event;
    
    // 뷰 크기 변경 이벤트 리스너 추가
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this._sendViewDimensions();
      }
    });
    
    // 주기적으로 뷰 크기를 확인하고 변경사항 전송
    const resizeInterval = setInterval(() => {
      if (this._view && this._view.visible) {
        this._sendViewDimensions();
      }
    }, 2000);
    
    // 확장 프로그램 비활성화 시 인터벌 제거
    const disposable = {
      dispose: () => {
        clearInterval(resizeInterval);
      }
    };
    
    // 이벤트 구독 정리를 위한 disposable 객체 생성 및 저장
    if (context && 'subscriptions' in context) {
      (context as any).subscriptions.push(disposable);
    } else {
      // 컨텍스트에 subscriptions가 없는 경우 확장 프로그램 컨텍스트에 추가
      vscode.Disposable.from(disposable);
    }
    
    setTimeout(() => {
      if (this._view && this._view.visible) {
        webviewView.webview.postMessage({
          command: 'initialized',
          timestamp: Date.now()
        });
        this.logger.info('웹뷰 초기화 완료 메시지 전송');
        
        // 초기 뷰 크기 전송
        this._sendViewDimensions();
      }
    }, 1000);

    
    webviewView.webview.onDidReceiveMessage(message => {
      this.logger.info('채팅 웹뷰로부터 메시지를 받았습니다:', message);
      
      switch (message.command) {
        case 'resizeStart':
          // 크기 조절 시작 처리
          this.logger.info('웹뷰 크기 조절 시작');
          return;
          
        case 'resizeEnd':
          // 크기 조절 완료 처리
          this.logger.info('웹뷰 크기 조절 완료');
          // 트리뷰와 채팅뷰 사이의 크기 조정 처리
          this._sendViewDimensions();
          return;
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
          
        case 'getTheme':
          this._sendCurrentTheme();
          return;
          
        case 'getModelList':
          
          this.logger.info('웹뷰에서 모델 목록 요청 받음');
          this._sendModelList();
          this._sendCurrentModel();
          return;
          
        case 'toggleEmbedDevMode':
          
          this.logger.info(`심층 분석 모드: ${message.enabled ? '활성화' : '비활성화'}`);
          
          vscode.workspace.getConfiguration('ape.core').update(
            'embedDevMode', 
            message.enabled, 
            vscode.ConfigurationTarget.Global
          );
          return;
          
        case 'toggleApeMode':
          
          this.logger.info(`도구 활용 모드: ${message.enabled ? '활성화' : '비활성화'}`);
          
          
          vscode.workspace.getConfiguration('ape.ui').update(
            'apeMode', 
            message.enabled, 
            vscode.ConfigurationTarget.Global
          );
          
          
          const newMode = message.enabled ? 'hybrid' : 'standard';
          vscode.workspace.getConfiguration('ape').update(
            'uiMode', 
            newMode, 
            vscode.ConfigurationTarget.Global
          );
          
          
          vscode.window.showInformationMessage(`도구 활용 모드가 ${message.enabled ? '활성화' : '비활성화'}되었습니다.`);
          
          this.logger.info('도구 활용 모드 설정 변경 완료');
          return;
          
        case 'getCommands':
          
          this._sendCommandsList();
          return;
          
        case 'executeCommand':
          
          this.logger.info('명령어 실행 요청:', message.commandId);
          if (message.commandId) {
            this._executeCommand(message.commandId);
          }
          return;
          
        case 'copyToClipboard':
          
          if (message.text) {
            vscode.env.clipboard.writeText(message.text)
              .then(() => {
                
                this.logger.info('클립보드에 복사됨:', message.text);
              }, (err: Error) => {
                
                this.logger.error('클립보드 복사 오류:', err);
              });
          }
          return;
          
        case 'newChat':
          // 새 채팅 시작
          this.clearChat();
          this._chatService.clearConversation();
          return;
          
        case 'saveAndNewChat':
          // 현재 대화 저장 후 새 채팅 시작
          this.saveCurrentSession(""); // 빈 문자열 전달하여 기본 제목 사용
          this.clearChat();
          this._chatService.clearConversation();
          return;
          
        case 'saveChatSession':
          // 현재 대화 저장
          this.saveCurrentSession(message.title);
          return;
          
        case 'treeViewAction':
          
          this._handleTreeViewAction(message);
          return;
          
        case 'changeUiMode':
          
          this.logger.info(`UI 모드 변경 요청 수신: ${message.mode}`);
          
          if (this._view && this._view.visible) {
            this._view.webview.postMessage({
              command: 'setApeMode',
              enabled: message.mode === 'hybrid'
            });
          }
          return;
      }
    });
    
    
    setTimeout(() => {
      this._sendModelList();
    }, 500);
    
    
    setTimeout(() => {
      this._sendCurrentModel();
    }, 600);
    
    
    setTimeout(() => {
      this._sendResponse(this._chatService.getWelcomeMessage(), 'assistant');
    }, 1000);
    
    
    setTimeout(() => {
      
      const config = vscode.workspace.getConfiguration('ape');
      const currentMode = config.get<string>('uiMode', 'standard');
      
      
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
    const selectedModel = message.model; 
    const embedDevMode = message.embedDevMode; 
    const useStreaming = true; 
    
    this.logger.info(`메시지 처리 세부정보:
    - 텍스트: ${text}
    - 선택 모델: ${selectedModel || '기본값'}
    - 심층 분석 모드: ${embedDevMode ? '활성화' : '비활성화'}
    - 스트리밍: ${useStreaming ? '사용' : '미사용'}`)

    try {
      
      this._sendResponse('생각 중...', 'system');
      
      
      if (selectedModel) {
        this._changeModel(selectedModel);
      }
      
      
      if (this._view && this._view.visible) {
        this._view.webview.postMessage({
          command: 'removeSystemMessage',
          content: '생각 중...'
        });
      }
      
      
      const isAtCommand = text.trim().startsWith('@');
      const isSlashCommand = text.trim().startsWith('/');
      
      
      if (isAtCommand || isSlashCommand) {
        this.logger.info(`ApeChatViewProvider: ${isAtCommand ? '@' : '/'}명령어 감지 - "${text}"`);
        
        
        const commandResponseId = `cmd-${Date.now()}`;
        this._view.webview.postMessage({
          command: 'startStreaming',
          responseId: commandResponseId,
          type: 'system'
        });
        
        
        const commandResponse = await this._chatService.processMessage(text);
        
        
        if (commandResponse) {
          
          let responseContent = '';
          let responseType: 'system' | 'assistant' = 'system';
          let hasError = false;
          
          if (typeof commandResponse === 'object' && commandResponse !== null) {
            
            if (commandResponse && 'success' in commandResponse && 'message' in commandResponse) {
              
              const result = commandResponse as CommandResult;
              responseContent = result.message || JSON.stringify(result, null, 2);
              responseType = result.error ? 'system' : 'assistant';
              hasError = !!result.error;
            }
            
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
          
          
          if (this._view && this._view.visible) {
            
            this._view.webview.postMessage({
              command: 'endStreaming',
              responseId: commandResponseId
            });
            
            
            this._sendResponse(responseContent, responseType);
            
            
            this._view.webview.postMessage({
              command: 'commandExecuted',
              commandId: text, 
              success: !hasError
            });
          }
        }
        
        return;
      }
      
      
      if (useStreaming) {
        
        let isFirstChunk = true;
        let chunkCount = 0;
        let startTime = Date.now();
        
        
        const responseId = `resp-${Date.now()}`;
        
        this.logger.info(`ApeChatViewProvider: 스트리밍 시작 - 응답 ID: ${responseId}`);
        
        
        if (embedDevMode) {
          this.logger.info(`심층 분석 모드로 처리 - 고급 프롬프트 엔지니어링 및 내부망 데이터 분석 적용`);
        }
        
        
        this._view.webview.postMessage({
          command: 'startStreaming',
          responseId: responseId,
          type: 'assistant'
        });
        
        
        const streamHandler = (chunk: string) => {
          if (!this._view || !this._view.visible) return;
          
          chunkCount++;
          
          
          if (isFirstChunk) {
            this.logger.info(`ApeChatViewProvider: 첫 청크 수신 - 길이: ${chunk.length}자`);
            isFirstChunk = false;
          }
          
          
          if (chunkCount <= 2 || chunkCount % 50 === 0) {
            this.logger.info(`ApeChatViewProvider: 스트리밍 청크 #${chunkCount} 수신 - 길이: ${chunk.length}자`);
          }
          
          
          this._view.webview.postMessage({
            command: 'appendStreamChunk',
            responseId: responseId,
            content: chunk,
            type: 'assistant'
          });
        };
        
        
        await this._chatService.processMessage(text, streamHandler, { embedDevMode: embedDevMode || false });
        
        
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
        
        const response = await this._chatService.processMessage(text);
        
        
        if (response && this._view && this._view.visible) {
          
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
      
      
      // CoreService는 생성자에서 주입되므로 검사 필요 없음
      const coreService = this._coreService;
      const llmService = coreService.llmService;
      
      if (!llmService) {
        this.logger.error('[UI<-EXT] LLM 서비스를 찾을 수 없습니다.');
        throw new Error('LLM 서비스를 찾을 수 없습니다.');
      }
      
      
      this.logger.info('[UI<-EXT] 기본 모델 ID:', llmService.getDefaultModelId());
      
      
      let modelsArray = llmService.getAvailableModels();
      this.logger.info(`[UI<-EXT] 가져온 모델 수: ${modelsArray.length}`);
      
      
      if (!Array.isArray(modelsArray)) {
        this.logger.warn('[UI<-EXT] 유효하지 않은 모델 배열 반환됨. 빈 배열로 초기화.');
        modelsArray = [];
      }
      
      
      // 모델 목록이 비어있으면 기본 모델 추가
      if (modelsArray.length < 2) {
        this.logger.info('[UI<-EXT] 모델 목록이 불충분하여 기본 모델 추가');
        
        // 기본 모델 추가
        modelsArray.push({
          id: 'gemini-2.5-flash',
          name: 'Google Gemini 2.5 Flash',
          provider: 'openrouter',
          temperature: 0.7,
          apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
          apiModel: 'google/gemini-2.5-flash-preview'
        });
        
        // 로컬 모델 없으면 추가
        if (!modelsArray.some(m => m.provider === 'local')) {
          modelsArray.push({
            id: 'local-fallback',
            name: '로컬 시뮬레이션 모델',
            provider: 'local',
            temperature: 0.7
          });
          this.logger.info('[UI<-EXT] 로컬 모델 추가됨');
        }
        
        this.logger.info(`[UI<-EXT] 기본 모델 추가 후 모델 수: ${modelsArray.length}`);
      }
      
      
      const models = modelsArray.map((model, index) => {
        try {
          
          let modelId = model.id || model.modelId || `model-${index}`;
          
          
          if (modelId.includes('/') || modelId.includes(':')) {
            modelId = modelId.replace(/[\/:.]/g, '-');
          }
          
          
          const modelName = model.name || `모델 ${index + 1}`;
          
          
          return {
            id: modelId,
            name: modelName,
            provider: model.provider || 'unknown'
          };
        } catch (err) {
          this.logger.error(`[UI<-EXT] 모델 변환 중 오류 (인덱스 ${index}):`, err);
          
          return {
            id: `model-${index}`,
            name: `모델 ${index + 1}`,
            provider: 'unknown'
          };
        }
      });
      
      
      const uniqueModels = this._removeDuplicateModels(models);
      
      
      this.logger.info(`[UI<-EXT] 전송할 모델 목록: ${uniqueModels.length}개 (중복 제거 후)`);
      uniqueModels.forEach((model, index) => {
        this.logger.info(`[UI<-EXT] 모델 ${index + 1}: ID=${model.id}, 이름=${model.name}, 제공자=${model.provider}`);
      });
      
      
      this._view.webview.postMessage({
        command: 'updateModels',
        models: uniqueModels
      });
      
      this.logger.info('[UI<-EXT] 모델 목록 전송 완료');
      
      
      setTimeout(() => {
        if (this._view && this._view.visible) {
          
          let defaultModelId = llmService.getDefaultModelId();
          
          
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
    
    const uniqueIds = new Set<string>();
    const uniqueModels: Array<{id: string; name: string; provider: string}> = [];
    
    
    const providerPriority: Record<string, number> = {
      'custom': 0,   
      'openrouter': 1,  
      'local': 2,    
      'unknown': 3   
    };
    
    
    for (const model of models) {
      if (!uniqueIds.has(model.id)) {
        uniqueIds.add(model.id);
        uniqueModels.push(model);
      }
    }
    
    
    uniqueModels.sort((a, b) => {
      
      const priorityA = providerPriority[a.provider] ?? 999;
      const priorityB = providerPriority[b.provider] ?? 999;
      
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      
      return a.name.localeCompare(b.name);
    });
    
    return uniqueModels;
  }
  
  /**
   * VS Code 테마 변경 리스너 등록
   */
  private _registerThemeChangeListener(): void {
    // 현재 테마 정보 전송
    this._sendCurrentTheme();
    
    // 테마 변경 이벤트 구독
    vscode.window.onDidChangeActiveColorTheme((colorTheme) => {
      if (this._view && this._view.visible) {
        this.logger.info(`VS Code 테마 변경됨: ${colorTheme.kind}`);
        
        this._sendCurrentTheme();
      }
    });
  }
  
  /**
   * 현재 테마 정보 전송
   */
  private _sendCurrentTheme(): void {
    if (!this._view || !this._view.visible) return;
    
    try {
      const currentTheme = vscode.window.activeColorTheme;
      let themeName: string;
      
      // 테마 종류에 따라 클래스 이름 결정
      switch (currentTheme.kind) {
        case vscode.ColorThemeKind.Light:
          themeName = 'vscode-light';
          break;
        case vscode.ColorThemeKind.Dark:
          themeName = 'vscode-dark';
          break;
        case vscode.ColorThemeKind.HighContrast:
          themeName = 'vscode-high-contrast';
          break;
        case vscode.ColorThemeKind.HighContrastLight:
          themeName = 'vscode-high-contrast-light';
          break;
        default:
          themeName = 'vscode-dark'; // 기본값
      }
      
      this.logger.info(`테마 정보 전송: ${themeName}`);
      
      this._view.webview.postMessage({
        type: 'theme-update',
        theme: themeName
      });
    } catch (error) {
      this.logger.error('테마 정보 전송 중 오류:', error);
    }
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
      
      
      // CoreService는 생성자에서 주입되므로 검사 필요 없음
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
      
      
      const availableModels = llmService.getAvailableModels();
      const modelIds = availableModels.map(m => m.id || m.modelId).filter(Boolean);
      this.logger.info(`사용 가능한 모델 ID: ${JSON.stringify(modelIds)}`);
      
      
      this.logger.info('getDefaultModelId 메서드 호출 시도...');
      let defaultModelId = llmService.getDefaultModelId();
      
      
      if (!defaultModelId || !modelIds.includes(defaultModelId)) {
        this.logger.warn(`기본 모델 ID(${defaultModelId || 'undefined'})가 없거나 유효하지 않습니다. 폴백 모델 선택...`);
        
        
        
        const internalModel = availableModels.find(m => m.provider === 'custom');
        
        const openRouterModel = availableModels.find(m => m.provider === 'openrouter');
        
        const localModel = availableModels.find(m => m.provider === 'local');
        
        const firstAvailableModel = availableModels[0];
        
        
        defaultModelId = (
          (internalModel && (internalModel.id || internalModel.modelId)) ||
          (openRouterModel && (openRouterModel.id || openRouterModel.modelId)) ||
          (localModel && (localModel.id || localModel.modelId)) ||
          (firstAvailableModel && (firstAvailableModel.id || firstAvailableModel.modelId)) ||
          'openrouter-claude-3-haiku' 
        );
        
        this.logger.info(`폴백 모델 ID로 설정됨: ${defaultModelId}`);
      } else {
        this.logger.info(`현재 기본 모델: ${defaultModelId}`);
      }
      
      
      if (defaultModelId && (defaultModelId.includes('/') || defaultModelId.includes(':'))) {
        const cleanModelId = defaultModelId.replace(/[\/:.]/g, '-');
        this.logger.info(`모델 ID에 특수 문자 포함, 정리됨: ${defaultModelId} -> ${cleanModelId}`);
        defaultModelId = cleanModelId;
      }
      
      
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
      
      
      if (this._view && this._view.visible && defaultModelId) {
        try {
          this._view.webview.postMessage({
            command: 'setCurrentModel',
            modelId: defaultModelId
          });
          this.logger.info(`현재 모델 ID(${defaultModelId}) 전송 성공`);
          
          
          // 설정값 업데이트 (Promise 처리 방식 변경)
          const configPromise = vscode.workspace.getConfiguration('ape.llm').update(
            'defaultModel', 
            defaultModelId, 
            vscode.ConfigurationTarget.Global
          );
          
          // Promise 처리
          configPromise.then(
            () => {
              this.logger.info(`모델 ID가 설정에 저장됨: ${defaultModelId}`);
            },
            (error: Error) => {
              this.logger.error('설정 저장 중 오류:', error);
            }
          );
        } catch (postError) {
          this.logger.error('현재 모델 ID 전송 중 오류:', postError);
        }
      }
    } catch (error: unknown) {
      this.logger.error('현재 모델 전송 중 오류 발생:', error);
      this.logger.error('오류 상세:', error instanceof Error ? error.stack : 'Error stack not available');
      
      
      try {
        
        const fallbackModelIds = [
          'narrans-emergency',        
          'openrouter-claude-3-haiku', 
          'local-emergency'           
        ];
        
        let selectedFallback = fallbackModelIds[0]; 
        
        
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
      
      // CoreService는 생성자에서 주입되므로 검사 필요 없음
      const coreService = this._coreService;
      const commandRegistry = coreService.commandRegistry;
      
      
      const allUsages = commandRegistry.getAllCommandUsages();
      
      
      const commands = allUsages.map(usage => {
        
        const isAtCommand = usage.syntax.startsWith('@');
        const isSlashCommand = usage.syntax.startsWith('/');
        
        
        let domain = '';
        if (isAtCommand && usage.domain) {
          domain = usage.domain;
        } else if (isSlashCommand) {
          domain = 'system';
        }
        
        
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
      
      
      const dynamicData = await this._getDynamicData();
      
      
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
      
      // CoreService는 생성자에서 주입되므로 검사 필요 없음
      const coreService = this._coreService;
      const pluginRegistry = coreService.pluginRegistry;
      const commandService = coreService.commandService;
      
      
      const dynamicData: Record<string, unknown> = {};
      
      
      const gitPlugin = pluginRegistry ? pluginRegistry.getPlugin('git') : null;
      
      if (gitPlugin) {
        
        try {
          
          const gitClient = (gitPlugin as {client?: {getBranches?: (showRemote: boolean) => Promise<string[]>}}).client;
          
          if (gitClient && typeof gitClient.getBranches === 'function') {
            
            const branches = await gitClient.getBranches(true);
            
            if (branches && Array.isArray(branches)) {
              
              dynamicData['gitBranches'] = branches;
              this.logger.info(`Git 브랜치 정보 로드 완료: ${branches.length}개 브랜치`);
            }
          }
        } catch (gitError) {
          this.logger.error('Git 브랜치 정보 가져오기 실패:', gitError);
        }
      }
      
      
      if (commandService) {
        try {
          
          const contextCache = commandService.getContextCache();
          
          
          const baseCommands = [
            
            { id: '@git:commit', label: 'Git 커밋' },
            { id: '@git:push', label: 'Git 푸시' },
            { id: '@git:checkout', label: 'Git 체크아웃' },
            { id: '@git:branch', label: 'Git 브랜치 생성' },
            
            
            { id: '@jira:issue', label: 'Jira 이슈 조회' },
            { id: '@jira:create', label: 'Jira 이슈 생성' },
            { id: '@jira:search', label: 'Jira 이슈 검색' },
            
            
            { id: '@swdp:build', label: 'SWDP 빌드' },
            { id: '@swdp:build-status', label: 'SWDP 빌드 상태' },
            { id: '@swdp:test', label: 'SWDP 테스트' },
            
            
            { id: '@pocket:ls', label: 'Pocket 파일 목록' },
            { id: '@pocket:load', label: 'Pocket 파일 로드' },
            { id: '@pocket:search', label: 'Pocket 파일 검색' }
          ];
          
          
          const contextCommands: {id: string; label: string; description: string; type: string; group: string; contextual: boolean}[] = [];
          
          
          for (const baseCmd of baseCommands) {
            try {
              const result = await commandService.generateContextualCommand(baseCmd.id);
              
              
              if (Array.isArray(result)) {
                
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
        
        this._handleTreeItemSelection(item);
        break;
        
      case 'execute':
        
        if (item.type === 'command' && item.id) {
          this._executeCommand(item.id);
        }
        break;
        
      case 'showDetails':
        
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
    
    
    switch (item.type) {
      case 'command':
        
        if (this._view && item.id) {
          this._view.webview.postMessage({
            command: 'highlightCommand',
            commandId: item.id
          });
        }
        break;
        
      case 'chat-session':
        
        if (this._view && item.id) {
          
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
  /**
   * 뷰 크기 정보 전송 - 웹뷰 레이아웃 조정에 사용됨
   */
  private _sendViewDimensions(): void {
    if (!this._view || !this._view.visible) {
      return;
    }
    
    try {
      // 뷰 상태 정보를 웹뷰에 전송
      this._view.webview.postMessage({
        command: 'viewDimensions',
        // 실제 치수는 웹뷰에서 window.innerWidth/Height로 접근함
        visible: true,
        timestamp: Date.now()
      });
      
      this.logger.debug('뷰 크기 정보 전송됨');
    } catch (error) {
      this.logger.error('뷰 크기 정보 전송 실패:', error);
    }
  }
    
  private _getIconForCommand(command: string, domain: string): {icon: string; source: string} {
    
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
    
    
    const commandIcons: {[key: string]: {icon: string, source: string}} = {
      
      'commit': { icon: 'git-commit', source: 'phosphor' },
      'push': { icon: 'arrow-up', source: 'phosphor' },
      'pull': { icon: 'git-pull-request', source: 'phosphor' },
      'branch': { icon: 'git-branch', source: 'phosphor' },
      'merge': { icon: 'git-merge', source: 'phosphor' },
      'clone': { icon: 'copy', source: 'phosphor' },
      
      
      'issue': { icon: 'note-pencil', source: 'phosphor' },
      'ticket': { icon: 'note-pencil', source: 'phosphor' },
      'bug': { icon: 'bug', source: 'phosphor' },
      'task': { icon: 'clipboard-text', source: 'phosphor' },
      
      
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
    
    
    if (commandIcons[command]) {
      return commandIcons[command];
    }
    
    
    for (const [keyword, icon] of Object.entries(commandIcons)) {
      if (command.includes(keyword)) {
        return icon;
      }
    }
    
    
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
      
      
      this._sendResponse(`명령어 '${commandId}' 실행 중...`, 'system');
      
      
      const isInternalCommand = commandId.startsWith('/');
      const isExternalCommand = commandId.startsWith('@');
      
      if (isInternalCommand || isExternalCommand) {
        
        const result = await this._chatService.processMessage(commandId);
        
        
        if (result) {
          
          if (this._view && this._view.visible) {
            this._view.webview.postMessage({
              command: 'removeSystemMessage',
              content: `명령어 '${commandId}' 실행 중...`
            });
          }
          
          
          let isError = false;
          
          
          const isCommandResult = (obj: unknown): obj is CommandResult => {
            return obj !== null && typeof obj === 'object' && 'success' in obj;
          };
          
          if (typeof result === 'object' && result !== null) {
            
            if (result && isCommandResult(result)) {
              
              const typedResult = result as CommandResult;
              
              
              if (typedResult.message) {
                const responseType = typedResult.error ? 'system' : 'assistant';
                isError = !!typedResult.error;
                this._sendResponse(typedResult.message, responseType);
              } else {
                this._sendResponse(JSON.stringify(typedResult, null, 2), 'assistant');
              }
            } 
            
            else if (result && 'content' in result) {
              const content = (result as {content: string}).content;
              const hasError = 'error' in result && !!(result as {error?: unknown}).error;
              const responseType = hasError ? 'system' : 'assistant';
              isError = hasError;
              this._sendResponse(content, responseType);
            } 
            
            else {
              this._sendResponse(JSON.stringify(result, null, 2), 'assistant');
            }
          } 
          
          else {
            this._sendResponse(String(result), 'assistant');
          }
          
          
          if (this._view && this._view.visible) {
            this._view.webview.postMessage({
              command: 'commandExecuted',
              commandId: commandId,
              success: !isError
            });
          }
        }
      } else {
        
        vscode.commands.executeCommand(commandId)
          .then(result => {
            this.logger.info('VS Code 명령어 실행 결과:', result);
            
            this._sendResponse(`명령어 '${commandId}' 실행 완료`, 'system');
          }, (error: unknown) => {
            
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
  /**
   * 현재 대화 저장
   */
  public saveCurrentSession(): void {
    try {
      this.logger.info('현재 대화 저장 시도');
      
      vscode.window.showInputBox({
        prompt: '저장할 대화 세션의 제목을 입력하세요',
        placeHolder: '제목 없음'
      }).then(title => {
        if (title !== undefined) {
          try {
            this._chatService.saveCurrentSession(title);
            
            vscode.window.showInformationMessage('대화가 저장되었습니다.');
            
            // 트리뷰 새로고침
            vscode.commands.executeCommand('ape.refreshTreeView');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('대화 저장 중 오류 발생:', error);
            
            if (this._view) {
              this._view.webview.postMessage({
                command: 'addMessage',
                type: 'system',
                content: `대화를 저장하지 못했습니다: ${errorMessage}`
              });
            }
            
            vscode.window.showErrorMessage(`대화를 저장할 수 없습니다: ${errorMessage}`);
          }
        }
      });
    } catch (error) {
      this.logger.error('대화 저장 입력 상자 표시 중 오류 발생:', error);
    }
  }
  
  private _changeModel(modelId: string): void {
    if (!modelId) {
      this.logger.warn('_changeModel: 유효하지 않은 모델 ID로 호출됨');
      return;
    }
    
    try {
      this.logger.info(`모델 변경 요청 - DEBUG 버전: ${modelId}`);
      
      
      // CoreService는 생성자에서 주입되므로 검사 필요 없음
      const coreService = this._coreService;
      
      const llmService = coreService.llmService;
      if (!llmService) {
        this.logger.error('_changeModel: llmService를 찾을 수 없습니다.');
        throw new Error('LLM 서비스를 찾을 수 없습니다.');
      }
      
      
      const currentDefaultId = llmService.getDefaultModelId();
      this.logger.info(`현재 기본 모델: ${currentDefaultId || 'none'}, 변경 요청 모델: ${modelId}`);
      
      if (currentDefaultId && currentDefaultId === modelId) {
        this.logger.info(`현재 모델과 동일한 모델(${modelId})로 변경 요청, 무시함`);
        
        
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
      
      
      this.logger.info('사용 가능한 모델 목록 조회 중...');
      const models = llmService.getAvailableModels();
      this.logger.info(`총 ${models.length}개의 모델 조회됨`);
      
      
      models.forEach((model, idx) => {
        this.logger.info(`모델 ${idx+1}:`, {
          id: model.id || '[없음]',
          modelId: model.modelId || '[없음]',
          name: model.name,
          provider: model.provider || '[없음]',
          apiModel: model.apiModel || '[없음]'
        });
      });
      
      
      const validModel = models.find(model => {
        const possibleIds = [
          model.id,
          model.modelId,
          model.apiModel ? model.apiModel.replace(/[\/:.]/g, '-') : null,
          
          model.name ? `${model.provider || 'model'}-${model.name.toLowerCase().replace(/\s+/g, '-')}` : null
        ].filter(Boolean); 
        
        this.logger.info(`모델 ${model.name} 가능한 ID 목록:`, possibleIds);
        
        return possibleIds.includes(modelId);
      });
      
      if (!validModel) {
        this.logger.warn(`요청된 모델 ID '${modelId}'가 유효한 모델 목록에 없습니다.`);
        this.logger.info('===== 유효한 모델 목록 (ID 기준) =====');
        models.forEach((model, idx) => {
          this.logger.info(`${idx+1}. ${model.id || model.modelId || '[ID 없음]'}: ${model.name}`);
        });
        
        
        this.logger.info('모델 유효성 검사 실패했으나 계속 진행합니다. 외부에서 추가된 모델일 수 있습니다.');
      } else {
        this.logger.info(`유효한 모델을 찾았습니다: ${validModel.name} (ID: ${validModel.id || validModel.modelId})`);
      }
      
      
      this.logger.info(`VS Code 설정에 모델 ID(${modelId}) 저장 시도...`);
      const config = vscode.workspace.getConfiguration('ape.llm');
      
      config.update('defaultModel', modelId, vscode.ConfigurationTarget.Global)
        .then(() => {
          this.logger.info(`모델이 ${modelId}로 변경되었습니다.`);
          
          
          if (this._view && this._view.visible) {
            this.logger.info('웹뷰에 모델 변경 성공 알림 전송');
            this._view.webview.postMessage({
              command: 'modelChanged',
              modelId: modelId,
              success: true,
              changed: true
            });
            
            
            const modelName = validModel ? validModel.name : modelId;
            this.logger.info(`시스템 메시지로 모델 변경 알림: ${modelName}`);
            this._sendResponse(`모델이 '${modelName}'(으)로 변경되었습니다.`, 'system');
          }
        }, (err: Error) => {
          this.logger.error('설정 업데이트 중 오류 발생:', err);
          this.logger.error('오류 상세:', err.stack);
          
          
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
      
      
      setTimeout(() => {
        this._view?.webview.postMessage({
          command: 'addMessage',
          type: 'system',
          content: '채팅이 초기화되었습니다.'
        });
        
        
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
    
    const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'resources', 'html', 'chat.html');
    
    
    const webviewResourceBaseUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources'));
    
    this.logger.debug('_getHtmlContent 시작 - HTML 경로: ' + htmlPath.fsPath);
    this.logger.debug('webviewResourceBaseUri: ' + webviewResourceBaseUri.toString());
    this.logger.info('HTML 템플릿 로딩 시작');
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      if (!fs.existsSync(htmlPath.fsPath)) {
        this.logger.error(`HTML 파일을 찾을 수 없습니다: ${htmlPath.fsPath}`);
        throw new Error('HTML 파일을 찾을 수 없습니다.');
      }
      
      this.logger.debug('HTML 파일 존재 확인됨');
      
      // 디렉토리 구조 로깅을 위한 함수
      const logDirectoryStructure = (dirPath: string, prefix: string, maxDepth = 2, currentDepth = 0) => {
        try {
          if (currentDepth > maxDepth || !fs.existsSync(dirPath)) return;
          
          const files = fs.readdirSync(dirPath);
          if (files.length === 0) return;
          
          this.logger.debug(`${prefix} 디렉토리 내용 (${dirPath}):`);
          
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
              this.logger.debug(`${prefix}- [디렉토리] ${file}`);
              if (currentDepth < maxDepth) {
                logDirectoryStructure(filePath, `${prefix}  `, maxDepth, currentDepth + 1);
              }
            } else {
              this.logger.debug(`${prefix}- [파일] ${file} (${stat.size} bytes)`);
            }
          }
        } catch (error) {
          this.logger.error(`디렉토리 구조 로깅 중 오류 (${dirPath}):`, error);
        }
      };
      
      // resources 디렉토리 구조 로깅
      const resourcesPath = path.join(this._extensionUri.fsPath, 'resources');
      this.logger.debug('리소스 디렉토리 구조:');
      logDirectoryStructure(resourcesPath, '', 2);
      
      // 리소스 맵 생성
      this.logger.debug('리소스 맵 생성 시작');
      const resourceMap = this._createResourceMap(webview);
      this.logger.debug('리소스 맵 생성 완료, 총 ' + Object.keys(resourceMap).length + '개 항목');
      
      // HTML 파일 로드
      this.logger.debug('HTML 파일 로드 시작');
      let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
      this.logger.debug('HTML 파일 로드 완료, 길이: ' + htmlContent.length + '자');
      
      // CSP 및 기본 리소스 경로 교체
      this.logger.debug('기본 플레이스홀더 교체 시작');
      const cspSource = webview.cspSource;
      htmlContent = htmlContent.replace(/\$\{cspSource\}/g, cspSource);
      htmlContent = htmlContent.replace(/\$\{webviewResourceBaseUri\}/g, webviewResourceBaseUri.toString());
      
      // 리소스 맵 기반 플레이스홀더 교체
      this.logger.debug('리소스 맵 기반 플레이스홀더 교체 시작');
      
      // 교체 성공/실패 카운트
      let successCount = 0;
      let failCount = 0;
      
      for (const [key, uri] of Object.entries(resourceMap)) {
        const placeholder = `\$\{${key}\}`;
        const regex = new RegExp(placeholder, 'g');
        const before = htmlContent;
        htmlContent = htmlContent.replace(regex, uri.toString());
        
        // 변경된 항목 로깅
        if (before !== htmlContent) {
          this.logger.debug(`✅ 플레이스홀더 "${placeholder}" 교체 완료`);
          successCount++;
        } else {
          this.logger.warn(`❌ 플레이스홀더 "${placeholder}" 교체 실패 - 매칭 없음`);
          failCount++;
        }
      }
      
      this.logger.info(`플레이스홀더 교체 결과: 성공 ${successCount}개, 실패 ${failCount}개`);
      
      // 미해결 플레이스홀더 확인
      const remainingPlaceholders = htmlContent.match(/\$\{([^}]+)\}/g);
      if (remainingPlaceholders) {
        this.logger.warn('미해결 플레이스홀더 발견: ' + remainingPlaceholders.join(', '));
        
        // 각 미해결 플레이스홀더에 대해 비슷한 키 제안
        remainingPlaceholders.forEach((placeholder: string) => {
          const key = placeholder.replace(/\$\{|\}/g, '');
          const similarKeys = Object.keys(resourceMap)
            .filter(k => k.includes(key.substring(0, 3)) || key.includes(k.substring(0, 3)))
            .slice(0, 3);
          
          if (similarKeys.length > 0) {
            this.logger.debug(`미해결 키 "${key}"의 유사 키 제안: ${similarKeys.join(', ')}`);
          }
        });
      } else {
        this.logger.debug('모든 플레이스홀더가 교체됨');
      }
      
      this.logger.info('HTML 템플릿 처리 완료, 플레이스홀더 교체 후 길이: ' + htmlContent.length + '자');
      
      return htmlContent;
    } catch (error) {
      this.logger.error('HTML 파일을 읽는 중 오류 발생:', error);
      
      
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
    this.logger.debug('리소스 맵 생성 시작');
    
    // 파일 존재 확인 함수
    const checkFile = (uriPath: vscode.Uri, keyName: string): boolean => {
      try {
        const fs = require('fs');
        const exists = fs.existsSync(uriPath.fsPath);
        if (!exists) {
          this.logger.warn(`파일이 존재하지 않음 [${keyName}]: ${uriPath.fsPath}`);
        } else {
          this.logger.debug(`파일 존재 확인 성공 [${keyName}]: ${uriPath.fsPath}`);
        }
        return exists;
      } catch (error) {
        this.logger.error(`파일 존재 확인 중 오류 [${keyName}]: ${uriPath.fsPath}`, error);
        return false;
      }
    };
    
    // CSS 리소스
    const cssResources = {
      // 기본 CSS
      cssUri: this._getUri(webview, 'resources', 'css', 'main.css'),
      
      // 아이콘 CSS
      codiconsUri: this._getUri(webview, 'resources', 'codicons', 'codicon.css'),
      phosphorIconsCssUri: this._getUri(webview, 'resources', 'fonts', 'phosphor', 'css', 'regular.css'),
      
      // 테마 CSS - 핵심 파일이므로 추가
      themeVarsCssUri: this._getUri(webview, 'resources', 'css', 'core', 'theme-vars.css'),
      chatCssUri: this._getUri(webview, 'resources', 'css', 'core', 'chat.css'),
      
      // 컴포넌트 CSS 파일
      codeBlocksCssUri: this._getUri(webview, 'resources', 'css', 'components', 'code-blocks.css'),
      commandButtonsCssUri: this._getUri(webview, 'resources', 'css', 'components', 'command-buttons.css'),
      modelSelectorCssUri: this._getUri(webview, 'resources', 'css', 'components', 'model-selector.css'),
      resizeHandleCssUri: this._getUri(webview, 'resources', 'css', 'components', 'resize-handle.css')
    };
    
    // 존재 확인
    Object.entries(cssResources).forEach(([key, uri]) => {
      checkFile(uri, key);
    });
    
    // JS 리소스 
    const jsResources = {
      // 컴포넌트 JS
      modelSelectorJsUri: this._getUri(webview, 'resources', 'js', 'components', 'model-selector.js'),
      codeBlocksJsUri: this._getUri(webview, 'resources', 'js', 'components', 'code-blocks.js'),
      commandButtonsJsUri: this._getUri(webview, 'resources', 'js', 'components', 'command-buttons.js'),
      newChatButtonJsUri: this._getUri(webview, 'resources', 'js', 'components', 'new-chat-button.js'),
      saveButtonJsUri: this._getUri(webview, 'resources', 'js', 'components', 'save-button.js'),
      
      // 컴포넌트 UI JS
      resizeHandleJsUri: this._getUri(webview, 'resources', 'js', 'components', 'ui', 'resize-handle.js'),
      
      // 코어 JS
      apeUiJsUri: this._getUri(webview, 'resources', 'js', 'core', 'ape-ui.js'),
      
      // 유틸리티 JS
      loggerJsUri: this._getUri(webview, 'resources', 'js', 'utils', 'logger.js'),
      domUtilsJsUri: this._getUri(webview, 'resources', 'js', 'utils', 'dom-utils.js'),
      eventBusJsUri: this._getUri(webview, 'resources', 'js', 'utils', 'event-bus.js')
    };
    
    // 존재 확인
    Object.entries(jsResources).forEach(([key, uri]) => {
      checkFile(uri, key);
    });
    
    // HTML 리소스
    const htmlResources = {
      commandsHtmlUri: this._getUri(webview, 'resources', 'html', 'command-buttons.html')
    };
    
    // 존재 확인
    Object.entries(htmlResources).forEach(([key, uri]) => {
      checkFile(uri, key);
    });
    
    // 웹뷰 리소스 기본 URI
    const webviewResourcesUri = {
      webviewResourceBaseUri: webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources'))
    };
    
    // 모든 리소스 결합 및 로깅
    const allResources = {
      ...cssResources,
      ...jsResources,
      ...htmlResources,
      ...webviewResourcesUri
    };
    
    this.logger.debug(`리소스 맵 생성 완료: ${Object.keys(allResources).length}개 항목`);
    
    // 리소스 목록 로깅
    this.logger.debug('리소스 맵 항목:');
    Object.entries(allResources).forEach(([key, uri], index) => {
      this.logger.debug(`[${index+1}] ${key}: ${uri.toString()}`);
    });
    
    return allResources;
  }
  
  /**
   * 안전한 URI 생성 헬퍼 메소드
   * 파일이 존재하지 않아도 URI는 항상 생성
   */
  private _getUri(webview: vscode.Webview, ...pathSegments: string[]): vscode.Uri {
    return webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, ...pathSegments));
  }
}