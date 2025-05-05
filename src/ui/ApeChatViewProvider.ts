/**
 * 채팅 웹뷰 제공자
 * VS Code 웹뷰 UI 관리 및 메시지 처리
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ChatService } from '../services/ChatService';
import { ApeCoreService } from '../core/ApeCoreService';

/**
 * 채팅 웹뷰 제공자 클래스
 */
export class ApeChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _chatService: ChatService
  ) {}

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
    console.log('채팅 웹뷰 HTML이 설정되었습니다.');
    
    // 초기화 완료 메시지
    setTimeout(() => {
      if (this._view && this._view.visible) {
        webviewView.webview.postMessage({
          command: 'initialized',
          timestamp: Date.now()
        });
        console.log('웹뷰 초기화 완료 메시지 전송');
      }
    }, 1000);

    // 웹뷰에서 메시지 받기
    webviewView.webview.onDidReceiveMessage(message => {
      console.log('채팅 웹뷰로부터 메시지를 받았습니다:', message);
      
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
          
        case 'toggleEmbedDevMode':
          // 심층 분석 모드 토글 처리
          console.log(`심층 분석 모드: ${message.enabled ? '활성화' : '비활성화'}`);
          // 설정에 상태 저장
          vscode.workspace.getConfiguration('ape.core').update(
            'embedDevMode', 
            message.enabled, 
            vscode.ConfigurationTarget.Global
          );
          return;
          
        case 'getCommands':
          // 명령어 목록 요청 처리
          this._sendCommandsList();
          return;
          
        case 'executeCommand':
          // 웹뷰에서 직접 명령어 실행 요청
          console.log('명령어 실행 요청:', message.commandId);
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
                console.log('클립보드에 복사됨:', message.text);
              })
              .catch(err => {
                console.error('클립보드 복사 오류:', err);
              });
          }
          return;
          
        case 'treeViewAction':
          // TreeView와 연동된 작업 처리
          this._handleTreeViewAction(message);
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
  }

  /**
   * 사용자 메시지 처리
   */
  private async _handleUserMessage(message: any) {
    if (!this._view) {
      return;
    }

    const text = message.text;
    const selectedModel = message.model; // 선택된 모델 ID
    const embedDevMode = message.embedDevMode; // 심층 분석 모드 여부
    const useStreaming = true; // 스트리밍 사용 여부 (추후 설정으로 변경 가능)

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
        console.log(`ApeChatViewProvider: ${isAtCommand ? '@' : '/'}명령어 감지 - "${text}"`);
        
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
          let responseType = 'system';
          
          if (typeof commandResponse === 'object') {
            // 객체 응답 처리
            if (commandResponse.content) {
              responseContent = commandResponse.content;
              responseType = commandResponse.error ? 'system' : 'assistant';
            } else {
              responseContent = JSON.stringify(commandResponse, null, 2);
            }
          } else {
            responseContent = commandResponse.toString();
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
              success: !commandResponse.error
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
        
        console.log(`ApeChatViewProvider: 스트리밍 시작 - 응답 ID: ${responseId}`);
        
        // 심층 분석 모드가 활성화된 경우 로그
        if (embedDevMode) {
          console.log(`심층 분석 모드로 처리 - 고급 프롬프트 엔지니어링 및 내부망 데이터 분석 적용`);
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
            console.log(`ApeChatViewProvider: 첫 청크 수신 - 길이: ${chunk.length}자`);
            isFirstChunk = false;
          }
          
          // 로그 간소화를 위해 일부 청크만 로깅
          if (chunkCount <= 2 || chunkCount % 50 === 0) {
            console.log(`ApeChatViewProvider: 스트리밍 청크 #${chunkCount} 수신 - 길이: ${chunk.length}자`);
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
        await this._chatService.processMessage(text, streamHandler, { embedDevMode });
        
        // 스트리밍 완료 메시지 전송
        if (this._view && this._view.visible) {
          const endTime = Date.now();
          const duration = (endTime - startTime) / 1000;
          
          console.log(`ApeChatViewProvider: 스트리밍 완료 - 총 청크: ${chunkCount}, 소요 시간: ${duration.toFixed(2)}초`);
          
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
          if (typeof response === 'object') {
            if (response.content) {
              const responseType = response.error ? 'system' : 'assistant';
              this._sendResponse(response.content, responseType);
            } else {
              this._sendResponse(JSON.stringify(response, null, 2), 'assistant');
            }
          } else if (response.trim && response.trim() !== '') {
            this._sendResponse(response, 'assistant');
          }
        }
      }
    } catch (error) {
      console.error('메시지 처리 중 오류 발생:', error);
      this._sendResponse('메시지 처리 중 오류가 발생했습니다. 다시 시도해주세요.', 'system');
    }
  }

  /**
   * 응답 메시지 전송
   */
  private _sendResponse(text: string, type: 'assistant' | 'system' = 'assistant') {
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
    if (this._view) {
      const coreService = ApeCoreService.getInstance();
      const llmService = coreService.llmService;
      
      // models Map에서 key-value 쌍으로 변환하여 id 속성 추가
      const modelsArray = Array.from(llmService.getAvailableModels());
      const models = modelsArray.map((model) => ({
        id: model.name.toLowerCase().replace(/\s+/g, '-'),
        name: model.name
      }));
      
      this._view.webview.postMessage({
        command: 'updateModels',
        models: models
      });
    }
  }
  
  /**
   * 현재 모델 전송
   */
  private _sendCurrentModel() {
    if (this._view) {
      const coreService = ApeCoreService.getInstance();
      const llmService = coreService.llmService;
      const defaultModelId = llmService.getDefaultModelId();
      
      this._view.webview.postMessage({
        command: 'setCurrentModel',
        modelId: defaultModelId
      });
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
      const coreService = ApeCoreService.getInstance();
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
      
      console.log(`${commands.length}개의 명령어와 동적 데이터를 웹뷰로 전송했습니다.`);
    } catch (error) {
      console.error('명령어 목록 전송 중 오류 발생:', error);
    }
  }
  
  /**
   * 동적 데이터 가져오기 (Git 브랜치 및 컨텍스트 기반 명령어)
   * @returns 동적 데이터 객체
   */
  private async _getDynamicData(): Promise<any> {
    try {
      // APE 코어 서비스 접근
      const coreService = ApeCoreService.getInstance();
      const pluginRegistry = coreService.pluginRegistry;
      const commandService = coreService.commandService;
      
      // 동적 데이터 객체 초기화
      const dynamicData: any = {};
      
      // Git 플러그인 가져오기
      const gitPlugin = pluginRegistry ? pluginRegistry.getPlugin('git') : null;
      
      if (gitPlugin) {
        // Git 브랜치 정보 가져오기
        try {
          // gitPlugin에서 client 프로퍼티 접근 (내부 GitClientService)
          const gitClient = (gitPlugin as any).client;
          
          if (gitClient && typeof gitClient.getBranches === 'function') {
            // Git 브랜치 목록 가져오기
            const branches = await gitClient.getBranches(true);
            
            if (branches && Array.isArray(branches)) {
              // 브랜치 정보 추가
              dynamicData.gitBranches = branches;
              console.log(`Git 브랜치 정보 로드 완료: ${branches.length}개 브랜치`);
            }
          }
        } catch (gitError) {
          console.error('Git 브랜치 정보 가져오기 실패:', gitError);
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
          const contextCommands = [];
          
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
              console.error(`컨텍스트 명령어 생성 오류 (${baseCmd.id}):`, cmdError);
            }
          }
          
          // 컨텍스트 명령어 추가
          if (contextCommands.length > 0) {
            dynamicData.contextCommands = contextCommands;
            console.log(`컨텍스트 기반 명령어 ${contextCommands.length}개 생성 완료`);
          }
        } catch (contextError) {
          console.error('컨텍스트 기반 명령어 생성 중 오류:', contextError);
        }
      }
      
      return dynamicData;
    } catch (error) {
      console.error('동적 데이터 가져오기 중 오류 발생:', error);
      return {};
    }
  }
  
  /**
   * TreeView 액션 처리
   * @param message 트리뷰 액션 메시지
   */
  private _handleTreeViewAction(message: any) {
    console.log('TreeView 액션 처리:', message);
    
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
        if (item.type === 'command') {
          this._showCommandDetails(item);
        }
        break;
    }
  }
  
  /**
   * TreeView 아이템 선택 처리
   * @param item 선택된 트리 아이템
   */
  private _handleTreeItemSelection(item: any) {
    console.log('TreeView 아이템 선택:', item);
    
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
          console.log('채팅 세션 로드:', item.id);
        }
        break;
    }
  }
  
  /**
   * 명령어 세부 정보 표시
   * @param item 명령어 아이템
   */
  private _showCommandDetails(item: any) {
    if (!this._view) {
      return;
    }
    
    console.log('명령어 세부 정보 표시:', item);
    
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
  private _getIconForCommand(command: string, domain: string): any {
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
  private async _executeCommand(commandId: string) {
    if (!this._view) {
      return;
    }
    
    try {
      console.log(`명령어 실행: ${commandId}`);
      
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
          if (typeof result === 'object') {
            if (result.content) {
              const responseType = result.error ? 'system' : 'assistant';
              isError = !!result.error;
              this._sendResponse(result.content, responseType);
            } else {
              this._sendResponse(JSON.stringify(result, null, 2), 'assistant');
            }
          } else {
            this._sendResponse(result, 'assistant');
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
            console.log('VS Code 명령어 실행 결과:', result);
            // 결과를 웹뷰에 전송
            this._sendResponse(`명령어 '${commandId}' 실행 완료`, 'system');
          })
          .catch(err => {
            console.error('VS Code 명령어 실행 오류:', err);
            this._sendResponse(`명령어 실행 오류: ${err.message || '알 수 없는 오류'}`, 'system');
          });
      }
    } catch (error) {
      console.error('명령어 실행 중 오류 발생:', error);
      this._sendResponse(`명령어 실행 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'system');
    }
  }
  
  /**
   * 모델 변경
   */
  private _changeModel(modelId: string) {
    if (!modelId) {
      return;
    }
    
    try {
      const config = vscode.workspace.getConfiguration('ape.llm');
      config.update('defaultModel', modelId, vscode.ConfigurationTarget.Global);
      
      console.log(`모델이 ${modelId}로 변경되었습니다.`);
    } catch (error) {
      console.error('모델 변경 중 오류 발생:', error);
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
    
    // CSS 및 JS 경로 설정
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'chat.css'));
    const claudeStyleCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'claude-style.css'));
    const codeBlocksCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'code-blocks.css'));
    const commandAutocompleteCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'command-autocomplete.css'));
    const contextSuggestionsCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'context-suggestions.css'));
    const apeIconsCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'icons', 'ape-icons.css'));
    const phosphorIconsCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'phosphor-icons.css'));
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'codicons', 'codicon.css'));
    
    // JS 파일 경로
    const modelSelectorUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'model-selector.js'));
    const codeBlocksJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'code-blocks.js'));
    const commandIconsJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'command-icons.js'));
    const commandAutocompleteJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'command-autocomplete.js'));
    const iconManagerJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'icon-manager.js'));
    const commandButtonsJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'command-buttons.js'));
    const improvedApeUiJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'improved-ape-ui.js'));
    const improvedContextHandlerJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'improved-context-handler.js'));
    const workflowAnalyzerJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'workflow-analyzer.js'));
    const hybridApeUiJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'hybrid-ape-ui.js'));
    
    // HTML 리소스
    const commandsHtmlUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'html', 'command-buttons.html'));
    
    try {
      // HTML 파일이 존재하는지 확인
      if (!fs.existsSync(htmlPath.fsPath)) {
        console.error(`HTML 파일을 찾을 수 없습니다: ${htmlPath.fsPath}`);
        throw new Error('HTML 파일을 찾을 수 없습니다.');
      }
      
      // HTML 파일 읽기
      let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
      
      // CSP 소스 및 리소스 경로 설정
      const cspSource = webview.cspSource;
      htmlContent = htmlContent.replace(/\$\{cspSource\}/g, cspSource);
      htmlContent = htmlContent.replace(/\$\{webviewResourceBaseUri\}/g, webviewResourceBaseUri.toString());
      htmlContent = htmlContent.replace(/\$\{cssUri\}/g, cssUri.toString());
      htmlContent = htmlContent.replace(/\$\{claudeStyleCssUri\}/g, claudeStyleCssUri.toString());
      htmlContent = htmlContent.replace(/\$\{codeBlocksCssUri\}/g, codeBlocksCssUri.toString());
      htmlContent = htmlContent.replace(/\$\{commandAutocompleteCssUri\}/g, commandAutocompleteCssUri.toString());
      htmlContent = htmlContent.replace(/\$\{contextSuggestionsCssUri\}/g, contextSuggestionsCssUri.toString());
      htmlContent = htmlContent.replace(/\$\{apeIconsCssUri\}/g, apeIconsCssUri.toString());
      htmlContent = htmlContent.replace(/\$\{codiconsUri\}/g, codiconsUri.toString());
      htmlContent = htmlContent.replace(/\$\{modelSelectorUri\}/g, modelSelectorUri.toString());
      htmlContent = htmlContent.replace(/\$\{codeBlocksJsUri\}/g, codeBlocksJsUri.toString());
      htmlContent = htmlContent.replace(/\$\{commandIconsJsUri\}/g, commandIconsJsUri.toString());
      htmlContent = htmlContent.replace(/\$\{commandAutocompleteJsUri\}/g, commandAutocompleteJsUri.toString());
      htmlContent = htmlContent.replace(/\$\{commandsHtmlUri\}/g, commandsHtmlUri.toString());
      htmlContent = htmlContent.replace(/\$\{commandButtonsJsUri\}/g, commandButtonsJsUri.toString());
      htmlContent = htmlContent.replace(/\$\{improvedApeUiJsUri\}/g, improvedApeUiJsUri.toString());
      htmlContent = htmlContent.replace(/\$\{improvedContextHandlerJsUri\}/g, improvedContextHandlerJsUri.toString());
      htmlContent = htmlContent.replace(/\$\{workflowAnalyzerJsUri\}/g, workflowAnalyzerJsUri.toString());
      htmlContent = htmlContent.replace(/\$\{hybridApeUiJsUri\}/g, hybridApeUiJsUri.toString());
      
      console.log('HTML 파일 로드 성공:', htmlPath.fsPath);
      console.log('기본 리소스 경로:', webviewResourceBaseUri.toString());
      console.log('CSS URI:', cssUri.toString());
      console.log('JS URI:', modelSelectorUri.toString());
      
      return htmlContent;
    } catch (error) {
      console.error('HTML 파일을 읽는 중 오류 발생:', error);
      
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
}