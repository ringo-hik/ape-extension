/**
 * 하이브리드 채팅 웹뷰 제공자
 * 자연어 인터페이스와 명령어 기반 도구를 통합하는 개선된 UI 제공
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ChatService } from '../services/ChatService';
import { ApeCoreService } from '../core/ApeCoreService';
import { CommandRegistryService } from '../core/command/CommandRegistryService';
import { PluginRegistryService } from '../core/plugin-system/PluginRegistryService';

/**
 * 하이브리드 채팅 웹뷰 제공자 클래스
 */
export class ApeHybridChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _workspaceContext: any = {};
  private _contextSuggestions: any[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _chatService: ChatService,
    private readonly _commandRegistry: CommandRegistryService,
    private readonly _pluginRegistry: PluginRegistryService
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    // 웹뷰 제목 설정
    webviewView.description = "APE 하이브리드 채팅";

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    // 웹뷰 HTML 설정
    webviewView.webview.html = this._getHtmlContent(webviewView.webview);
    console.log('하이브리드 채팅 웹뷰 HTML이 설정되었습니다.');
    
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
          
        case 'toggleApeMode':
          // APE 모드 토글 처리
          console.log(`APE 모드: ${message.enabled ? '활성화' : '비활성화'}`);
          // 설정에 상태 저장
          vscode.workspace.getConfiguration('ape.ui').update(
            'apeMode', 
            message.enabled, 
            vscode.ConfigurationTarget.Global
          );
          
          // APE 모드 변경 후 필요한 처리
          if (message.enabled) {
            // APE 모드 활성화 시 컨텍스트 정보 업데이트
            this._analyzeContext();
            // 명령어 목록 업데이트
            this._sendCommandsList();
            // 도메인 상태 업데이트
            this._sendDomainStates();
          }
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
          
        case 'executeAction':
          // 커스텀 액션 실행 요청
          console.log('액션 실행 요청:', message.action, message.params);
          if (message.action) {
            this._executeAction(message.action, message.params);
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
          
        case 'getContext':
          // 현재 컨텍스트 정보 요청
          this._analyzeContext();
          return;
          
        case 'updateContext':
          // 사용자 메시지로 컨텍스트 업데이트 요청
          this._updateContextFromMessage(message.message);
          return;
          
        case 'analyzeResponse':
          // 어시스턴트 응답 분석 요청
          this._analyzeAssistantResponse(message.content);
          return;
          
        case 'getDomainCommands':
          // 특정 도메인 명령어 요청
          this._sendDomainCommands(message.domain);
          return;
          
        case 'treeViewAction':
          // TreeView와 연동된 작업 처리
          this._handleTreeViewAction(message);
          return;
      }
    });
    
    // 초기 데이터 로드
    setTimeout(() => {
      this._sendModelList();
    }, 500);
    
    setTimeout(() => {
      this._sendCurrentModel();
    }, 600);
    
    // APE 모드 상태 가져오기 및 전송
    setTimeout(() => {
      const config = vscode.workspace.getConfiguration('ape.ui');
      const apeMode = config.get('apeMode', false);
      
      this._view.webview.postMessage({
        command: 'setApeMode',
        enabled: apeMode
      });
      
      // APE 모드가 활성화된 경우에만 컨텍스트 정보 전송
      if (apeMode) {
        this._analyzeContext();
        this._sendDomainStates();
      }
    }, 700);
    
    // 컨텍스트 및 도메인 상태 정보 (APE 모드 전환과 상관없이 백그라운드에서 로드)
    setTimeout(() => {
      this._analyzeContext();
    }, 800);
    
    setTimeout(() => {
      this._sendDomainStates();
    }, 900);
    
    // 웰컴 메시지 전송
    setTimeout(() => {
      this._sendResponse(this._chatService.getWelcomeMessage(), 'assistant');
    }, 1000);
  }

  /**
   * 사용자 메시지 처리 (하이브리드 UI 버전)
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
        console.log(`ApeHybridChatViewProvider: ${isAtCommand ? '@' : '/'}명령어 감지 - "${text}"`);
        
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
            
            // 컨텍스트 업데이트
            this._analyzeContext();
            
            // 도메인 상태 업데이트
            this._updateDomainState(text);
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
        
        console.log(`ApeHybridChatViewProvider: 스트리밍 시작 - 응답 ID: ${responseId}`);
        
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
            console.log(`ApeHybridChatViewProvider: 첫 청크 수신 - 길이: ${chunk.length}자`);
            isFirstChunk = false;
          }
          
          // 로그 간소화를 위해 일부 청크만 로깅
          if (chunkCount <= 2 || chunkCount % 50 === 0) {
            console.log(`ApeHybridChatViewProvider: 스트리밍 청크 #${chunkCount} 수신 - 길이: ${chunk.length}자`);
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
          
          console.log(`ApeHybridChatViewProvider: 스트리밍 완료 - 총 청크: ${chunkCount}, 소요 시간: ${duration.toFixed(2)}초`);
          
          this._view.webview.postMessage({
            command: 'endStreaming',
            responseId: responseId
          });
          
          // 응답 분석 및 컨텍스트 업데이트
          setTimeout(() => {
            this._analyzeContext();
          }, 500);
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
          
          // 응답 후 컨텍스트 업데이트
          setTimeout(() => {
            this._analyzeContext();
          }, 500);
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
      // 모든 명령어 사용법 가져오기
      const allUsages = this._commandRegistry.getAllCommandUsages();
      
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
        } else if (isAtCommand) {
          // @ 명령어에서 도메인 추출 (없는 경우)
          const domainMatch = usage.syntax.match(/^@([a-z]+):/);
          if (domainMatch) {
            domain = domainMatch[1];
          }
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
      
      // 컨텍스트 정보 수집
      const context = await this._analyzeContext();
      
      // 추천 명령어 생성
      let suggestedCommands: any[] = [];
      
      // 방법 1: 백엔드 서버에서 추천 명령어 가져오기
      if (this._commandRegistry && typeof this._commandRegistry.suggestCommands === 'function') {
        try {
          const suggestions = await this._commandRegistry.suggestCommands(context, 10);
          // 서버에서 생성된 추천 명령어 매핑
          const serverSuggestions = suggestions.map(cmd => ({
            id: cmd,
            label: cmd.split(':').pop() || cmd,
            description: '서버 기반 추천 명령어',
            type: cmd.startsWith('@') ? 'at' : 'slash',
            suggested: true,
            source: 'server',
            iconName: this._getIconForCommand(cmd.replace(/^[@/]/, ''), cmd.split(':')[0].replace(/^[@/]/, ''))
          }));
          suggestedCommands = [...suggestedCommands, ...serverSuggestions];
        } catch (error) {
          console.error('서버 기반 명령어 추천 중 오류 발생:', error);
        }
      }
      
      // 방법 2: 우리의 개선된 컨텍스트 기반 생성기 추가 (프론트엔드 사이드 로직)
      try {
        // 컨텍스트 기반 객체의 generateContextualCommand를 사용하여 추가 추천
        // 기본 명령어 템플릿에서 컨텍스트 기반 확장
        const baseCommands = [
          '@git:commit', '@git:push', '@git:checkout', '@git:branch',
          '@jira:issue', '@jira:create', '@jira:search',
          '@swdp:build', '@swdp:test'
        ];
        
        // 각 기본 명령어로부터 컨텍스트 기반 명령어 생성
        for (const baseCmd of baseCommands) {
          // 컨텍스트 기반 명령어 생성 (각각 자체적으로 보유해야 함)
          let contextualCommands = [];
          
          // Git 명령어 특별 처리 
          if (baseCmd.startsWith('@git:')) {
            if (baseCmd === '@git:commit' && context.gitChangedFiles > 0) {
              const files = context.gitChangedFilesList || [];
              if (files.length > 0) {
                // 변경된 파일이 있는 경우 해당 파일을 기반으로 커밋 명령어 생성
                contextualCommands.push(`${baseCmd} -m "Update ${files[0]}"`);
              } else {
                contextualCommands.push(`${baseCmd} -m "Update files"`);
              }
            } else if (baseCmd === '@git:push' && context.gitBranch) {
              contextualCommands.push(`${baseCmd} origin ${context.gitBranch}`);
            } else if (baseCmd === '@git:checkout' && context.gitBranch) {
              // 현재 브랜치가 아닌 다른 기본 브랜치로 체크아웃 제안
              const defaultBranches = ['main', 'master', 'develop'].filter(b => b !== context.gitBranch);
              if (defaultBranches.length > 0) {
                contextualCommands.push(`${baseCmd} ${defaultBranches[0]}`);
              }
            }
          }
          
          // 생성된 컨텍스트 명령어 추가
          for (const cmd of contextualCommands) {
            suggestedCommands.push({
              id: cmd,
              label: cmd.split(':').pop() || cmd,
              description: '로컬 컨텍스트 기반 추천',
              type: 'at',
              suggested: true,
              source: 'client',
              iconName: this._getIconForCommand(cmd.replace(/^[@/]/, ''), cmd.split(':')[0].replace(/^[@/]/, ''))
            });
          }
        }
      } catch (error) {
        console.error('로컬 컨텍스트 기반 명령어 생성 중 오류 발생:', error);
      }
      
      // 중복 제거 및 10개로 제한
      suggestedCommands = this._removeDuplicateCommands(suggestedCommands).slice(0, 10);
      
      // 명령어 목록과 동적 데이터, 제안 명령어 전송
      this._view.webview.postMessage({
        command: 'updateCommands',
        commands: commands,
        dynamicData: dynamicData,
        suggestedCommands: suggestedCommands,
        context: context
      });
      
      console.log(`${commands.length}개의 명령어와 ${suggestedCommands.length}개의 제안 명령어를 웹뷰로 전송했습니다.`);
    } catch (error) {
      console.error('명령어 목록 전송 중 오류 발생:', error);
    }
  }
  
  /**
   * 중복 명령어 제거
   * @param commands 명령어 목록
   * @returns 중복 제거된 명령어 목록
   */
  private _removeDuplicateCommands(commands: any[]): any[] {
    const uniqueIds = new Set();
    return commands.filter(cmd => {
      if (uniqueIds.has(cmd.id)) {
        return false;
      }
      uniqueIds.add(cmd.id);
      return true;
    });
  }
  
  /**
   * 도메인별 명령어 전송
   */
  private async _sendDomainCommands(domain: string) {
    if (!this._view || !domain) {
      return;
    }
    
    try {
      // 도메인별 접두사 결정
      const prefix = domain === 'system' ? '/' : `@${domain}:`;
      
      // 모든 명령어 가져오기
      const allUsages = this._commandRegistry.getAllCommandUsages();
      
      // 해당 도메인 명령어만 필터링
      const domainCommands = allUsages
        .filter(usage => usage.syntax.startsWith(prefix))
        .map(usage => ({
          id: usage.syntax,
          label: usage.command,
          description: usage.description,
          syntax: usage.syntax,
          examples: usage.examples || [],
          type: domain === 'system' ? 'slash' : 'at',
          domain: domain,
          iconName: this._getIconForCommand(usage.command, domain)
        }));
      
      // 도메인 명령어 전송
      this._view.webview.postMessage({
        command: 'updateDomainCommands',
        domain: domain,
        commands: domainCommands
      });
      
      console.log(`${domain} 도메인 명령어 ${domainCommands.length}개를 웹뷰로 전송했습니다.`);
    } catch (error) {
      console.error(`${domain} 도메인 명령어 전송 중 오류 발생:`, error);
    }
  }
  
  /**
   * 도메인 상태 전송
   */
  private _sendDomainStates() {
    if (!this._view) {
      return;
    }
    
    // 사용 가능한 도메인 목록 (플러그인 등록 정보 기반)
    const domains = ['git', 'jira', 'pocket', 'swdp'];
    
    // 각 도메인별 상태 정보 전송
    domains.forEach(domain => {
      // 도메인 플러그인 상태 확인
      const plugin = this._pluginRegistry.getPlugin(domain);
      
      // 도메인 상태 객체 생성
      const state = {
        active: plugin !== null,
        count: 0 // 기본값, 향후 각 도메인별 카운트 정보 추가
      };
      
      // 도메인 상태 전송
      this._view?.webview.postMessage({
        command: 'updateDomainState',
        domain: domain,
        state: state
      });
    });
    
    console.log('도메인 상태 정보를 웹뷰로 전송했습니다.');
  }
  
  /**
   * 도메인 상태 업데이트
   */
  private _updateDomainState(commandText: string) {
    if (!this._view || !commandText) {
      return;
    }
    
    let updatedDomain = '';
    
    // 명령어 텍스트에서 도메인 추출
    if (commandText.startsWith('@')) {
      const parts = commandText.split(':');
      if (parts.length > 0) {
        updatedDomain = parts[0].substring(1); // @ 접두사 제거
      }
    }
    
    // 유효한 도메인이 아닌 경우 처리 중단
    if (!updatedDomain || !['git', 'jira', 'pocket', 'swdp'].includes(updatedDomain)) {
      return;
    }
    
    // 도메인 플러그인 상태 확인
    const plugin = this._pluginRegistry.getPlugin(updatedDomain);
    
    // 도메인 상태 객체 생성
    const state = {
      active: plugin !== null,
      count: 1 // 명령어 실행으로 카운트 증가
    };
    
    // 도메인 상태 전송
    this._view.webview.postMessage({
      command: 'updateDomainState',
      domain: updatedDomain,
      state: state
    });
    
    console.log(`${updatedDomain} 도메인 상태 업데이트: ${JSON.stringify(state)}`);
  }
  
  /**
   * 동적 데이터 가져오기 (Git 브랜치 및 컨텍스트 기반 명령어)
   * @returns 동적 데이터 객체
   */
  private async _getDynamicData(): Promise<any> {
    try {
      // APE 코어 서비스 접근
      const coreService = ApeCoreService.getInstance();
      const commandService = coreService.commandService;
      
      // 동적 데이터 객체 초기화
      const dynamicData: any = {};
      
      // Git 플러그인 가져오기
      const gitPlugin = this._pluginRegistry.getPlugin('git');
      
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
   * 커스텀 액션 실행
   */
  private async _executeAction(action: string, params?: string) {
    if (!this._view) {
      return;
    }
    
    try {
      console.log(`커스텀 액션 실행: ${action}, 파라미터: ${params || '없음'}`);
      
      // 액션 타입별 처리
      switch (action) {
        case 'generateDoc':
          // 문서 생성 액션
          await this._generateDocumentation(params);
          break;
          
        case 'analyzeCode':
          // 코드 분석 액션
          await this._analyzeCodeAction(params);
          break;
          
        case 'runCommand':
          // 명령어 실행 액션
          if (params) {
            await this._executeCommand(params);
          }
          break;
          
        case 'refresh':
          // 새로고침 액션
          this._analyzeContext();
          break;
          
        default:
          // 알 수 없는 액션
          throw new Error(`알 수 없는 액션: ${action}`);
      }
      
      // 액션 성공 피드백
      this._view.webview.postMessage({
        command: 'showActionFeedback',
        action: action,
        success: true,
        message: `${action} 액션이 성공적으로 실행되었습니다.`
      });
    } catch (error) {
      console.error(`액션 실행 오류 (${action}):`, error);
      
      // 액션 오류 피드백
      this._view.webview.postMessage({
        command: 'showActionFeedback',
        action: action,
        success: false,
        message: `${action} 액션 실행 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      });
    }
  }
  
  /**
   * 문서 생성 액션
   */
  private async _generateDocumentation(type?: string) {
    // 현재 활성 편집기 가져오기
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error('활성 편집기가 없습니다.');
    }
    
    // 문서 생성 요청 생성
    const request = {
      command: 'generateDoc',
      type: type || 'jsdoc',
      content: editor.document.getText(),
      language: editor.document.languageId,
      file: editor.document.fileName
    };
    
    // ChatService를 통해 처리
    const response = await this._chatService.processSpecialCommand(request);
    
    // 응답 처리
    if (typeof response === 'object' && response.content) {
      // 생성된 문서 내용
      const docContent = response.content;
      
      // 문서 내용 표시
      this._sendResponse(`문서 생성 완료:\n\n${docContent}`, 'assistant');
    } else {
      throw new Error('문서 생성에 실패했습니다.');
    }
  }
  
  /**
   * 코드 분석 액션
   */
  private async _analyzeCodeAction(focus?: string) {
    // 현재 활성 편집기 가져오기
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error('활성 편집기가 없습니다.');
    }
    
    // 선택된 텍스트 또는 전체 파일 내용 가져오기
    const selection = editor.selection;
    const text = selection.isEmpty 
      ? editor.document.getText() 
      : editor.document.getText(selection);
    
    // 분석 요청 생성
    const request = {
      command: 'analyzeCode',
      content: text,
      language: editor.document.languageId,
      file: editor.document.fileName,
      focus: focus || 'general'
    };
    
    // ChatService를 통해 처리
    const response = await this._chatService.processSpecialCommand(request);
    
    // 응답 처리
    if (typeof response === 'object' && response.content) {
      // 분석 결과
      const analysisResult = response.content;
      
      // 분석 결과 표시
      this._sendResponse(`코드 분석 결과:\n\n${analysisResult}`, 'assistant');
    } else {
      throw new Error('코드 분석에 실패했습니다.');
    }
  }
  
  /**
   * 컨텍스트 분석 및 UI 업데이트
   */
  private async _analyzeContext() {
    if (!this._view) {
      return;
    }
    
    try {
      const workspaceContext: any = {};
      
      // 1. 워크스페이스 정보 수집
      if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        workspaceContext.workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
      }
      
      // 2. 활성 편집기 정보 수집
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        workspaceContext.activeFile = editor.document.fileName;
        workspaceContext.language = editor.document.languageId;
        
        // 파일 확장자 추출
        const fileExtMatch = workspaceContext.activeFile.match(/\.([^.]+)$/);
        if (fileExtMatch) {
          workspaceContext.fileExtension = fileExtMatch[1].toLowerCase();
        }
        
        // 선택된 텍스트 가져오기
        const selection = editor.selection;
        if (!selection.isEmpty) {
          workspaceContext.selectedText = editor.document.getText(selection);
        }
        
        // 파일 내용의 키워드 분석
        try {
          // 파일의 처음 1000자 정도만 분석
          const fileContent = editor.document.getText(new vscode.Range(0, 0, 20, 0));
          const keywords = this._extractKeywords(fileContent);
          workspaceContext.fileKeywords = keywords;
        } catch (ex) {
          console.log('파일 키워드 추출 중 오류:', ex);
        }
      }
      
      // 3. Git 관련 정보 수집
      const gitPlugin = this._pluginRegistry.getPlugin('git');
      if (gitPlugin) {
        try {
          const gitClient = (gitPlugin as any).client;
          if (gitClient) {
            // 현재 브랜치 정보
            const currentBranch = await gitClient.getCurrentBranch();
            if (currentBranch) {
              workspaceContext.gitBranch = currentBranch;
            }
            
            // 변경된 파일 수 (커밋되지 않은)
            const status = await gitClient.getStatus();
            if (status) {
              workspaceContext.gitChangedFiles = status.length;
              
              // 변경된 파일 목록 (최대 5개)
              if (status.length > 0) {
                workspaceContext.gitChangedFilesList = status
                  .slice(0, 5)
                  .map((s: any) => s.path || s.file || s.toString());
              }
            }
            
            // 최근 커밋 가져오기
            try {
              const recentCommits = await gitClient.getRecentCommits(3);
              if (recentCommits && recentCommits.length > 0) {
                workspaceContext.gitRecentCommits = recentCommits;
              }
            } catch (commitErr) {
              console.log('Git 최근 커밋 가져오기 오류:', commitErr);
            }
          }
        } catch (gitError) {
          console.error('Git 컨텍스트 정보 가져오기 오류:', gitError);
        }
      }
      
      // 4. 활성 도메인 상태 수집
      workspaceContext.activeDomains = {};
      ['git', 'jira', 'pocket', 'swdp'].forEach(domain => {
        const plugin = this._pluginRegistry.getPlugin(domain);
        workspaceContext.activeDomains[domain] = plugin !== null;
      });
      
      // 5. 최근 실행한 명령어 가져오기 (차후 구현)
      workspaceContext.recentCommands = this._getRecentCommands();
      
      // 6. 제안 명령어 생성
      const suggestions = await this._generateContextSuggestions();
      
      // 컨텍스트 데이터 저장
      this._workspaceContext = workspaceContext;
      this._contextSuggestions = suggestions;
      
      // 7. 웹뷰에 컨텍스트 정보 전송
      this._view.webview.postMessage({
        command: 'updateContext',
        context: {
          ...workspaceContext,
          suggestions: suggestions
        }
      });
      
      console.log('컨텍스트 정보 및 제안 명령어 웹뷰로 전송 완료');
      return workspaceContext;
    } catch (error) {
      console.error('컨텍스트 분석 오류:', error);
      return {};
    }
  }
  
  /**
   * 텍스트에서 키워드 추출
   * @param text 분석할 텍스트
   * @returns 추출된 키워드 배열
   */
  private _extractKeywords(text: string): string[] {
    if (!text) return [];
    
    // 기본적인 키워드 추출 로직
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // 특수문자 제거
      .split(/\s+/)              // 공백으로 분리
      .filter(word => word.length > 3)  // 3글자 이하 제외
      .filter(word => !['this', 'that', 'with', 'from', 'have', 'function'].includes(word));  // 일반 단어 제외
    
    // 중복 제거 및 상위 10개 단어만 선택
    return [...new Set(words)].slice(0, 10);
  }
  
  /**
   * 최근 실행한 명령어 목록 가져오기
   * @returns 최근 명령어 배열
   */
  private _getRecentCommands(): string[] {
    // 메모리 기반 최근 명령어 (실제로는 영구 저장소 사용 필요)
    // 여기서는 임시 데이터 반환
    return [
      '@git:status',
      '@git:diff',
      '@jira:issues',
      '/help',
      '@doc:search'
    ];
  }
  
  /**
   * 사용자 메시지로부터 컨텍스트 업데이트
   */
  private async _updateContextFromMessage(message: string) {
    if (!this._view || !message) {
      return;
    }
    
    try {
      // 메시지 기반 제안 생성
      const newSuggestions = await this._generateSuggestionsFromMessage(message);
      
      // 기존 제안과 병합
      this._contextSuggestions = [...newSuggestions, ...this._contextSuggestions.slice(0, 5)];
      
      // 웹뷰에 업데이트된 제안 전송
      this._view.webview.postMessage({
        command: 'updateSuggestions',
        suggestions: this._contextSuggestions.slice(0, 10) // 최대 10개 제안
      });
      
      console.log('메시지 기반 제안 명령어 업데이트 완료');
    } catch (error) {
      console.error('메시지 기반 컨텍스트 업데이트 오류:', error);
    }
  }
  
  /**
   * 어시스턴트 응답 분석
   */
  private async _analyzeAssistantResponse(content: string) {
    if (!this._view || !content) {
      return;
    }
    
    try {
      // 응답 기반 제안 생성
      const newSuggestions = await this._generateSuggestionsFromResponse(content);
      
      // 기존 제안과 병합
      this._contextSuggestions = [...newSuggestions, ...this._contextSuggestions.slice(0, 5)];
      
      // 웹뷰에 업데이트된 제안 전송
      this._view.webview.postMessage({
        command: 'updateSuggestions',
        suggestions: this._contextSuggestions.slice(0, 10) // 최대 10개 제안
      });
      
      console.log('응답 기반 제안 명령어 업데이트 완료');
    } catch (error) {
      console.error('응답 분석 오류:', error);
    }
  }
  
  /**
   * 컨텍스트 기반 제안 명령어 생성
   */
  private async _generateContextSuggestions(): Promise<any[]> {
    try {
      const suggestions: any[] = [];
      
      // 1. 현재 상황에 관련된 기본 명령어 추가
      suggestions.push({
        id: '/help',
        label: '도움말 보기',
        description: 'APE 사용 방법에 대한 도움말 표시',
        type: 'slash'
      });
      
      // 2. Git 관련 제안
      const gitPlugin = this._pluginRegistry.getPlugin('git');
      if (gitPlugin) {
        // Git 상태 확인
        suggestions.push({
          id: '@git:status',
          label: 'Git 상태 확인',
          description: '변경된 파일 확인',
          type: 'at'
        });
        
        // Git 브랜치 또는 내역이 있는 경우
        if (this._workspaceContext.gitBranch) {
          suggestions.push({
            id: '@git:log',
            label: 'Git 로그 확인',
            description: '최근 커밋 내역 보기',
            type: 'at'
          });
          
          suggestions.push({
            id: '@git:diff',
            label: 'Git 변경 사항 확인',
            description: '현재 브랜치의 변경 사항 확인',
            type: 'at'
          });
        }
        
        // 변경된 파일이 있는 경우
        if (this._workspaceContext.gitChangedFiles > 0) {
          suggestions.push({
            id: '@git:commit',
            label: 'Git 커밋하기',
            description: '변경 사항 커밋',
            type: 'at'
          });
          
          suggestions.push({
            id: '@git:add .',
            label: 'Git 모든 파일 스테이징',
            description: '모든 변경 사항 스테이징',
            type: 'at'
          });
        }
      }
      
      // 3. 현재 파일 타입에 따른 제안
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const language = editor.document.languageId;
        
        if (['javascript', 'typescript', 'typescriptreact'].includes(language)) {
          // JS/TS 파일인 경우
          suggestions.push({
            id: '/format',
            label: '코드 포맷팅',
            description: '현재 파일 포맷팅',
            type: 'slash'
          });
          
          suggestions.push({
            id: '@swdp:test',
            label: '테스트 실행',
            description: '현재 파일 관련 테스트 실행',
            type: 'at'
          });
        } else if (['json'].includes(language)) {
          // JSON 파일인 경우
          suggestions.push({
            id: '/validate',
            label: 'JSON 유효성 검사',
            description: 'JSON 유효성 검사',
            type: 'slash'
          });
        } else if (['markdown'].includes(language)) {
          // Markdown 파일인 경우
          suggestions.push({
            id: '/preview',
            label: 'Markdown 미리보기',
            description: 'Markdown 문서 미리보기',
            type: 'slash'
          });
        }
      }
      
      // 4. Jira 관련 제안
      const jiraPlugin = this._pluginRegistry.getPlugin('jira');
      if (jiraPlugin) {
        suggestions.push({
          id: '@jira:issues',
          label: 'Jira 이슈 목록',
          description: '내 이슈 확인',
          type: 'at'
        });
      }
      
      // 5. 컨텍스트 기반 명령어 (CommandService 사용)
      const coreService = ApeCoreService.getInstance();
      if (coreService.commandService) {
        try {
          // 컨텍스트 명령어 마지막 2개 추가
          const contextualGitCommand = await coreService.commandService.generateContextualCommand('@git:commit');
          if (typeof contextualGitCommand === 'string' && contextualGitCommand !== '@git:commit') {
            suggestions.push({
              id: contextualGitCommand,
              label: 'Git 커밋 (컨텍스트)',
              description: '현재 변경 사항에 대한 커밋',
              type: 'at'
            });
          }
        } catch (err) {
          console.error('컨텍스트 명령어 생성 오류:', err);
        }
      }
      
      return suggestions;
    } catch (error) {
      console.error('제안 명령어 생성 오류:', error);
      return [];
    }
  }
  
  /**
   * 메시지 기반 제안 명령어 생성
   */
  private async _generateSuggestionsFromMessage(message: string): Promise<any[]> {
    try {
      const suggestions: any[] = [];
      
      // 메시지 키워드 분석
      const keywords = this._extractKeywords(message);
      
      // Git 관련 키워드가 있는 경우
      if (keywords.some(k => ['git', 'commit', 'push', 'pull', 'branch', 'merge'].includes(k))) {
        suggestions.push({
          id: '@git:status',
          label: 'Git 상태 확인',
          description: 'Git 상태 확인',
          type: 'at'
        });
        
        if (keywords.includes('commit')) {
          suggestions.push({
            id: '@git:commit',
            label: 'Git 커밋',
            description: '변경 사항 커밋',
            type: 'at'
          });
        }
        
        if (keywords.includes('push')) {
          suggestions.push({
            id: '@git:push',
            label: 'Git 푸시',
            description: '로컬 변경 사항 원격 저장소에 푸시',
            type: 'at'
          });
        }
      }
      
      // Jira 관련 키워드가 있는 경우
      if (keywords.some(k => ['jira', 'issue', 'ticket', 'task', 'bug'].includes(k))) {
        suggestions.push({
          id: '@jira:issues',
          label: 'Jira 이슈 목록',
          description: '내 이슈 확인',
          type: 'at'
        });
        
        if (keywords.includes('create') || keywords.includes('new')) {
          suggestions.push({
            id: '@jira:create',
            label: 'Jira 이슈 생성',
            description: '새 Jira 이슈 생성',
            type: 'at'
          });
        }
      }
      
      // 도움말 관련 키워드가 있는 경우
      if (keywords.some(k => ['help', 'guide', 'manual', 'how'].includes(k))) {
        suggestions.push({
          id: '/help',
          label: '도움말 보기',
          description: 'APE 사용 방법에 대한 도움말 표시',
          type: 'slash'
        });
      }
      
      return suggestions;
    } catch (error) {
      console.error('메시지 기반 제안 생성 오류:', error);
      return [];
    }
  }
  
  /**
   * 응답 기반 제안 명령어 생성
   */
  private async _generateSuggestionsFromResponse(response: string): Promise<any[]> {
    try {
      const suggestions: any[] = [];
      
      // 응답 키워드 분석
      const keywords = this._extractKeywords(response);
      
      // Git 관련 키워드가 있는 경우
      if (keywords.some(k => ['git', 'commit', 'push', 'pull', 'branch', 'merge'].includes(k))) {
        if (keywords.includes('commit')) {
          suggestions.push({
            id: '@git:commit',
            label: 'Git 커밋',
            description: '응답에 언급된 변경 사항 커밋',
            type: 'at'
          });
        }
        
        if (keywords.includes('branch')) {
          suggestions.push({
            id: '@git:branch',
            label: 'Git 브랜치 생성',
            description: '새 브랜치 생성',
            type: 'at'
          });
        }
      }
      
      // 코드 분석 제안
      if (keywords.some(k => ['code', 'analyze', 'review', 'refactor'].includes(k))) {
        suggestions.push({
          id: '[action:analyzeCode]',
          label: '코드 분석하기',
          description: '현재 편집기 코드 분석',
          type: 'action'
        });
      }
      
      // 문서 생성 제안
      if (keywords.some(k => ['document', 'documentation', 'jsdoc', 'comment'].includes(k))) {
        suggestions.push({
          id: '[action:generateDoc]',
          label: '문서 생성하기',
          description: '현재 코드에 대한 문서 생성',
          type: 'action'
        });
      }
      
      return suggestions;
    } catch (error) {
      console.error('응답 기반 제안 생성 오류:', error);
      return [];
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
   * @returns 아이콘 이름
   */
  private _getIconForCommand(command: string, domain: string): string {
    // 도메인별 기본 아이콘
    const domainIcons: {[key: string]: string} = {
      'system': 'settings-gear',
      'git': 'git-branch',
      'doc': 'book',
      'jira': 'issues',
      'pocket': 'archive',
      'vault': 'database',
      'rules': 'law'
    };
    
    // 명령어별 아이콘
    const commandIcons: {[key: string]: string} = {
      // Git 관련
      'commit': 'git-commit',
      'push': 'arrow-up',
      'pull': 'git-pull-request',
      'branch': 'git-branch',
      'merge': 'git-merge',
      'clone': 'repo-clone',
      
      // Jira 관련
      'issue': 'issue-opened',
      'ticket': 'issue-opened',
      'bug': 'bug',
      'task': 'tasklist',
      
      // 일반 명령어
      'help': 'question',
      'model': 'hubot',
      'debug': 'debug',
      'clear': 'clear-all',
      'settings': 'gear',
      'config': 'settings',
      'search': 'search',
      'list': 'list-ordered'
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
    return domainIcons[domain] || 'terminal';
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
          
          // 컨텍스트 다시 분석
          setTimeout(() => {
            this._analyzeContext();
          }, 500);
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
   * HTML 내용 생성 (하이브리드 UI 버전)
   */
  private _getHtmlContent(webview: vscode.Webview) {
    // 리소스 경로 가져오기
    const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'resources', 'html', 'chat.html');
    
    // 웹뷰 리소스 기본 경로
    const webviewResourceBaseUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources'));
    
    // CSS 및 JS 경로 설정
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'chat.css'));
    const claudeStyleCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'claude-style.css'));
    const hybridUiCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'hybrid-ui.css'));
    const codeBlocksCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'code-blocks.css'));
    const commandAutocompleteCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'command-autocomplete.css'));
    const contextSuggestionsCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'context-suggestions.css'));
    const modelSelectorUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'model-selector.js'));
    const codeBlocksJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'code-blocks.js'));
    const commandAutocompleteJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'command-autocomplete.js'));
    const commandsHtmlUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'html', 'command-buttons.html'));
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'codicons', 'codicon.css'));
    const commandButtonsJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'command-buttons.js'));
    const hybridApeUiJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'hybrid-ape-ui.js'));
    const improvedContextHandlerJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'improved-context-handler.js'));
    const workflowAnalyzerJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'js', 'workflow-analyzer.js'));
    
    try {
      // HTML 파일이 존재하는지 확인
      if (!fs.existsSync(htmlPath.fsPath)) {
        console.error(`HTML 파일을 찾을 수 없습니다: ${htmlPath.fsPath}`);
        throw new Error('HTML 파일을 찾을 수 없습니다.');
      }
      
      // HTML 파일 읽기
      let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
      
      // 하이브리드 UI를 위한 수정
      htmlContent = htmlContent.replace(
        '<link href="${claudeStyleCssUri}" rel="stylesheet">',
        '<link href="${claudeStyleCssUri}" rel="stylesheet">\n  <link href="${hybridUiCssUri}" rel="stylesheet">'
      );
      
      // improved-ape-ui.js를 hybrid-ape-ui.js로 변경
      htmlContent = htmlContent.replace(
        '<script src="${improvedApeUiJsUri}"></script>',
        '<script src="${hybridApeUiJsUri}"></script>'
      );
      
      // CSP 소스 및 리소스 경로 설정
      const cspSource = webview.cspSource;
      htmlContent = htmlContent.replace(/\$\{cspSource\}/g, cspSource);
      htmlContent = htmlContent.replace(/\$\{webviewResourceBaseUri\}/g, webviewResourceBaseUri.toString());
      htmlContent = htmlContent.replace(/\$\{cssUri\}/g, cssUri.toString());
      htmlContent = htmlContent.replace(/\$\{claudeStyleCssUri\}/g, claudeStyleCssUri.toString());
      htmlContent = htmlContent.replace(/\$\{hybridUiCssUri\}/g, hybridUiCssUri.toString());
      htmlContent = htmlContent.replace(/\$\{codeBlocksCssUri\}/g, codeBlocksCssUri.toString());
      htmlContent = htmlContent.replace(/\$\{commandAutocompleteCssUri\}/g, commandAutocompleteCssUri.toString());
      htmlContent = htmlContent.replace(/\$\{contextSuggestionsCssUri\}/g, contextSuggestionsCssUri.toString());
      htmlContent = htmlContent.replace(/\$\{modelSelectorUri\}/g, modelSelectorUri.toString());
      htmlContent = htmlContent.replace(/\$\{codeBlocksJsUri\}/g, codeBlocksJsUri.toString());
      htmlContent = htmlContent.replace(/\$\{commandAutocompleteJsUri\}/g, commandAutocompleteJsUri.toString());
      htmlContent = htmlContent.replace(/\$\{commandsHtmlUri\}/g, commandsHtmlUri.toString());
      htmlContent = htmlContent.replace(/\$\{codiconsUri\}/g, codiconsUri.toString());
      htmlContent = htmlContent.replace(/\$\{commandButtonsJsUri\}/g, commandButtonsJsUri.toString());
      htmlContent = htmlContent.replace(/\$\{hybridApeUiJsUri\}/g, hybridApeUiJsUri.toString());
      htmlContent = htmlContent.replace(/\$\{improvedContextHandlerJsUri\}/g, improvedContextHandlerJsUri.toString());
      htmlContent = htmlContent.replace(/\$\{workflowAnalyzerJsUri\}/g, workflowAnalyzerJsUri.toString());
      
      console.log('하이브리드 UI HTML 파일 로드 성공:', htmlPath.fsPath);
      
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
        <title>APE 하이브리드 채팅</title>
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
        <h1>APE 하이브리드 채팅</h1>
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