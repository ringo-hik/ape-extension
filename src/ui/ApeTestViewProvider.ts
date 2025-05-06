/**
 * APE 테스트 뷰 제공자
 * 
 * 테스트용 버튼 인터페이스를 표시하는 웹뷰 제공
 */

import * as vscode from 'vscode';
import { ICoreService } from '../core/ICoreService';
import { LoggerService } from '../core/utils/LoggerService';

/**
 * APE 테스트 뷰 제공자 클래스
 */
export class ApeTestViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _coreService: ICoreService;
  private _logger: LoggerService;
  
  /**
   * 생성자
   * @param extensionUri 확장 URI
   * @param coreService 코어 서비스
   */
  constructor(
    extensionUri: vscode.Uri,
    coreService: ICoreService
  ) {
    this._extensionUri = extensionUri;
    this._coreService = coreService;
    this._logger = new LoggerService();
    this._logger.info('ApeTestViewProvider 생성됨');
  }
  
  /**
   * WebviewViewProvider 인터페이스 구현
   * @param webviewView 웹뷰 객체
   * @param context 웹뷰 컨텍스트
   */
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this._view = webviewView;
    
    // 웹뷰 속성 설정
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri
      ]
    };
    
    // 내용 설정
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    
    // 메시지 핸들러 등록
    this._setWebviewMessageListener(webviewView.webview);
    
    this._logger.info('테스트 뷰 초기화됨');
  }
  
  /**
   * 웹뷰용 HTML 생성
   * @param webview 웹뷰 객체
   * @returns HTML 문자열
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // 리소스 경로 생성
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'components', 'test-buttons.js'));
    const domUtilsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'utils', 'dom-utils.js'));
    const loggerUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'utils', 'logger.js'));
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'main.css'));
    
    // 아이콘 경로
    const phosphorIconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'codicons', 'codicon.css'));
    
    // WebView의 URI 기본 경로
    const webviewResourceBaseUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources'));
    
    // HTML 반환
    return /* html */`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} https://unpkg.com 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval'; img-src ${webview.cspSource} data:; connect-src ${webview.cspSource}; font-src ${webview.cspSource} https://unpkg.com;">
        <title>APE 명령어 테스트</title>
        
        <!-- 통합 스타일 시스템 -->
        <link href="${stylesUri}" rel="stylesheet">
        
        <!-- Phosphor 아이콘 -->
        <link href="${phosphorIconsUri}" rel="stylesheet">
      </head>
      <body>
        <div class="ape-container">
          <div class="ape-header">
            <h2>APE 명령어 테스트</h2>
          </div>
          
          <div class="ape-content">
            <!-- 테스트 버튼 모음 -->
            <div class="ape-flex-col ape-gap-md">
              <div class="ape-section">
                <h3>시나리오 테스트 버튼</h3>
                <div class="buttons-grid">
                  <button class="command-button" data-command-id="test.git">
                    <div class="button-icon"><i class="ph ph-git-branch"></i></div>
                    <div class="button-text" title="Git 통합 테스트">Git 통합 테스트</div>
                  </button>
                  
                  <button class="command-button" data-command-id="test.jira">
                    <div class="button-icon"><i class="ph ph-note"></i></div>
                    <div class="button-text" title="Jira 통합 테스트">Jira 통합 테스트</div>
                  </button>
                  
                  <button class="command-button" data-command-id="test.swdp">
                    <div class="button-icon"><i class="ph ph-code"></i></div>
                    <div class="button-text" title="SWDP 통합 테스트">SWDP 통합 테스트</div>
                  </button>
                  
                  <button class="command-button" data-command-id="test.pocket">
                    <div class="button-icon"><i class="ph ph-bookmark-simple"></i></div>
                    <div class="button-text" title="Pocket 통합 테스트">Pocket 통합 테스트</div>
                  </button>
                </div>
              </div>
              
              <div class="ape-section">
                <h3>API 통합 테스트</h3>
                <div class="buttons-grid">
                  <button class="command-button" data-command-id="api.test">
                    <div class="button-icon"><i class="ph ph-link"></i></div>
                    <div class="button-text" title="API 연결 테스트">API 연결 테스트</div>
                  </button>
                  
                  <button class="command-button" data-command-id="api.models">
                    <div class="button-icon"><i class="ph ph-robot"></i></div>
                    <div class="button-text" title="사용 가능한 모델 목록">모델 목록 가져오기</div>
                  </button>
                  
                  <button class="command-button" data-command-id="api.stream">
                    <div class="button-icon"><i class="ph ph-chat-dots"></i></div>
                    <div class="button-text" title="스트리밍 응답 테스트">스트리밍 응답 테스트</div>
                  </button>
                </div>
              </div>
              
              <div class="ape-section">
                <h3>모드 테스트</h3>
                <div class="buttons-grid">
                  <button class="command-button" data-command-id="mode.toggle">
                    <div class="button-icon"><i class="ph ph-toggle-left"></i></div>
                    <div class="button-text" title="APE 모드 토글">APE 모드 토글</div>
                  </button>
                  
                  <button class="command-button" data-command-id="mode.dev">
                    <div class="button-icon"><i class="ph ph-code"></i></div>
                    <div class="button-text" title="심층 분석 모드 토글">심층 분석 모드 토글</div>
                  </button>
                </div>
              </div>
              
              <div class="ape-section">
                <h3>채팅 기능 테스트</h3>
                <div class="buttons-grid">
                  <button class="command-button" data-command-id="chat.clear">
                    <div class="button-icon"><i class="ph ph-trash"></i></div>
                    <div class="button-text" title="채팅 내용 지우기">채팅 내용 지우기</div>
                  </button>
                  
                  <button class="command-button" data-command-id="chat.save">
                    <div class="button-icon"><i class="ph ph-floppy-disk"></i></div>
                    <div class="button-text" title="채팅 내용 저장">채팅 내용 저장</div>
                  </button>
                  
                  <button class="command-button" data-command-id="chat.history">
                    <div class="button-icon"><i class="ph ph-clock-clockwise"></i></div>
                    <div class="button-text" title="채팅 히스토리 보기">채팅 히스토리 보기</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="ape-footer">
            <div>테스트 결과는 개발자 도구 콘솔(Console)에서 확인하세요.</div>
          </div>
        </div>
        
        <!-- 유틸리티 스크립트 -->
        <script type="module" src="${loggerUri}"></script>
        <script type="module" src="${domUtilsUri}"></script>
        
        <!-- 테스트 버튼 스크립트 -->
        <script type="module" src="${scriptUri}"></script>
      </body>
      </html>
    `;
  }
  
  /**
   * 웹뷰 메시지 리스너 설정
   * @param webview 웹뷰 객체
   */
  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message) => {
        this._logger.debug(`테스트 뷰로부터 메시지 수신: ${message.command}`);
        
        switch (message.command) {
          case 'executeCommand':
            await this._executeCommand(message.commandId);
            break;
            
          case 'ui_initialized':
            // UI 초기화 완료 처리
            this._logger.info('테스트 뷰 UI 초기화 완료');
            break;
        }
      },
      undefined,
      []
    );
  }
  
  /**
   * 명령어 실행 처리
   * @param commandId 명령어 ID
   */
  private async _executeCommand(commandId: string) {
    this._logger.info(`테스트 뷰에서 명령어 실행 요청: ${commandId}`);
    
    try {
      let result;
      
      // 명령어 유형에 따른 처리
      switch (commandId) {
        case 'api.test':
          result = await this._testApiConnection();
          break;
          
        case 'api.models':
          result = await this._getAvailableModels();
          break;
          
        case 'api.stream':
          result = await this._testStreamingResponse();
          break;
          
        case 'mode.toggle':
          result = await this._toggleApeMode();
          break;
          
        case 'mode.dev':
          result = await this._toggleDevMode();
          break;
          
        case 'chat.clear':
          result = await this._clearChat();
          break;
          
        case 'chat.save':
          result = await this._saveChatSession();
          break;
          
        case 'chat.history':
          result = await this._loadChatHistory();
          break;
          
        case 'test.git':
        case 'test.jira':
        case 'test.swdp':
        case 'test.pocket':
          result = await this._testPluginIntegration(commandId.split('.')[1]);
          break;
          
        default:
          result = { error: true, message: `알 수 없는 명령어: ${commandId}` };
      }
      
      // 결과 반환
      this._sendMessageToWebview({
        command: 'executeResult',
        commandId: commandId,
        result: result
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._logger.error(`명령어 실행 중 오류 (${commandId}): ${errorMessage}`);
      
      // 오류 반환
      this._sendMessageToWebview({
        command: 'executeResult',
        commandId: commandId,
        result: { error: true, message: errorMessage }
      });
      
      return { error: true, message: errorMessage };
    }
  }
  
  /**
   * API 연결 테스트
   */
  private async _testApiConnection() {
    this._logger.info('API 연결 테스트 실행');
    try {
      const llmService = this._coreService.llmService;
      if (!llmService) {
        return { error: true, message: 'LLM 서비스를 찾을 수 없습니다' };
      }
      
      // 간단한 핑 요청
      const result = await llmService.testConnection();
      
      return { success: true, message: '연결 테스트 성공', result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: true, message: `API 연결 오류: ${errorMessage}` };
    }
  }
  
  /**
   * 사용 가능한 모델 목록 가져오기
   */
  private async _getAvailableModels() {
    this._logger.info('사용 가능한 모델 목록 요청');
    try {
      const modelManager = this._coreService.llmService.modelManager;
      if (!modelManager) {
        return { error: true, message: '모델 관리자를 찾을 수 없습니다' };
      }
      
      const models = modelManager.getModels();
      
      return { 
        success: true, 
        message: `${models.length}개 모델 발견`, 
        models: models.map(m => ({ id: m.id, name: m.name }))
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: true, message: `모델 목록 가져오기 오류: ${errorMessage}` };
    }
  }
  
  /**
   * 스트리밍 응답 테스트
   */
  private async _testStreamingResponse() {
    this._logger.info('스트리밍 응답 테스트 실행');
    try {
      const llmService = this._coreService.llmService;
      if (!llmService) {
        return { error: true, message: 'LLM 서비스를 찾을 수 없습니다' };
      }
      
      // 간단한 스트리밍 요청
      const testPrompt = { messages: [{ role: 'user', content: '안녕하세요! 스트리밍 테스트입니다.' }] };
      
      // 스트리밍 결과를 수집할 배열
      const streamChunks: string[] = [];
      
      // 스트리밍 콜백
      const onUpdate = (chunk: string) => {
        streamChunks.push(chunk);
      };
      
      // 스트리밍 요청 수행
      await llmService.sendRequest({
        model: llmService.getDefaultModelId(),
        messages: testPrompt.messages,
        stream: true,
        onUpdate: onUpdate
      });
      
      return { 
        success: true, 
        message: '스트리밍 응답 테스트 성공', 
        chunksCount: streamChunks.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: true, message: `스트리밍 응답 오류: ${errorMessage}` };
    }
  }
  
  /**
   * APE 모드 토글
   */
  private async _toggleApeMode() {
    this._logger.info('APE 모드 토글 실행');
    try {
      // VS Code 명령 실행으로 APE 모드 토글
      await vscode.commands.executeCommand('ape.toggleApeMode');
      
      return { success: true, message: 'APE 모드 상태가 변경되었습니다' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: true, message: `APE 모드 토글 오류: ${errorMessage}` };
    }
  }
  
  /**
   * 심층 분석 모드 토글
   */
  private async _toggleDevMode() {
    this._logger.info('심층 분석 모드 토글 실행');
    try {
      // VS Code 명령 실행으로 심층 분석 모드 토글
      await vscode.commands.executeCommand('ape.toggleEmbedDevMode');
      
      return { success: true, message: '심층 분석 모드 상태가 변경되었습니다' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: true, message: `심층 분석 모드 토글 오류: ${errorMessage}` };
    }
  }
  
  /**
   * 채팅 내용 지우기
   */
  private async _clearChat() {
    this._logger.info('채팅 내용 지우기 실행');
    try {
      // VS Code 명령 실행으로 채팅 내용 지우기
      await vscode.commands.executeCommand('ape.clearChat');
      
      return { success: true, message: '채팅 내용이 지워졌습니다' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: true, message: `채팅 내용 지우기 오류: ${errorMessage}` };
    }
  }
  
  /**
   * 채팅 세션 저장
   */
  private async _saveChatSession() {
    this._logger.info('채팅 세션 저장 실행');
    try {
      // VS Code 명령 실행으로 채팅 세션 저장
      await vscode.commands.executeCommand('ape.saveChatSession');
      
      return { success: true, message: '채팅 세션이 저장되었습니다' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: true, message: `채팅 세션 저장 오류: ${errorMessage}` };
    }
  }
  
  /**
   * 채팅 히스토리 로드
   */
  private async _loadChatHistory() {
    this._logger.info('채팅 히스토리 로드 실행');
    try {
      // VS Code 명령 실행으로 채팅 히스토리 로드
      await vscode.commands.executeCommand('ape.loadChatHistory');
      
      return { success: true, message: '채팅 히스토리가 로드되었습니다' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: true, message: `채팅 히스토리 로드 오류: ${errorMessage}` };
    }
  }
  
  /**
   * 플러그인 통합 테스트
   * @param pluginId 플러그인 ID
   */
  private async _testPluginIntegration(pluginId: string) {
    this._logger.info(`${pluginId} 플러그인 통합 테스트 실행`);
    try {
      const pluginRegistry = this._coreService.pluginRegistry;
      if (!pluginRegistry) {
        return { error: true, message: '플러그인 레지스트리를 찾을 수 없습니다' };
      }
      
      // 플러그인 가져오기
      const plugin = pluginRegistry.getPlugin(pluginId);
      if (!plugin) {
        return { error: true, message: `${pluginId} 플러그인을 찾을 수 없습니다` };
      }
      
      // 플러그인 상태 확인
      const status = {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        isEnabled: plugin.isEnabled(),
        commands: plugin.getCommands().map(cmd => cmd.id)
      };
      
      return { 
        success: true, 
        message: `${pluginId} 플러그인 테스트 성공`, 
        status 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: true, message: `${pluginId} 플러그인 테스트 오류: ${errorMessage}` };
    }
  }
  
  /**
   * 웹뷰에 메시지 전송
   * @param message 전송할 메시지
   */
  private _sendMessageToWebview(message: any) {
    if (this._view) {
      this._view.webview.postMessage(message);
      this._logger.debug(`웹뷰에 메시지 전송: ${message.command}`);
    }
  }
}