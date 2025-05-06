/**
 * APE 코어 서비스
 * 
 * 모든 핵심 서비스를 통합하고 관리하는 중앙 서비스
 * 의존성 주입 패턴으로 구현되어 결합도 감소 및 테스트 용이성 향상
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';


import { ICoreService, MessageProcessOptions, MessageProcessResult } from './ICoreService';


import { container } from './di/Container';


import { CommandParserService } from './command/CommandParserService';
import { CommandRegistryService } from './command/CommandRegistryService';
import { CommandExecutorService } from './command/CommandExecutorService';
import { CommandService } from './command/CommandService';


import { ConfigService } from './config/ConfigService';


import { PluginRegistryService } from './plugin-system/PluginRegistryService';


import { LlmService } from './llm/LlmService';


import { VSCodeService } from './vscode/VSCodeService';


import { HttpClientService } from './http/HttpClientService';


import { PromptAssemblerService } from './prompt/PromptAssemblerService';
import { RulesEngineService } from './prompt/RulesEngineService';


import { LoggerService } from './utils/LoggerService';


import { Command } from '../types/CommandTypes';
import { ChatMessage, MessageRole } from '../types/LlmTypes';


import { SwdpDomainService } from './domain/SwdpDomainService';
import { SwdpWorkflowService } from './workflow/SwdpWorkflowService';
import { UserAuthService } from './auth/UserAuthService';
import { SwdpNaturalLanguageService } from '../plugins/internal/swdp/SwdpNaturalLanguageService';

/**
 * APE 코어 서비스 클래스
 * 모든 핵심 서비스 통합 및 관리
 */
export class CoreService extends EventEmitter implements ICoreService {
  
  private _isEnabled: boolean = false;
  
  
  private readonly _configService: ConfigService;
  private readonly _commandParser: CommandParserService;
  private readonly _commandRegistry: CommandRegistryService;
  private readonly _commandExecutor: CommandExecutorService;
  private readonly _commandService: CommandService;
  private readonly _pluginRegistry: PluginRegistryService;
  private readonly _llmService: LlmService;
  private readonly _vsCodeService: VSCodeService;
  private readonly _httpService: HttpClientService;
  private readonly _promptAssembler: PromptAssemblerService;
  private readonly _rulesEngine: RulesEngineService;
  private readonly _logger: LoggerService;
  private readonly _userAuthService: UserAuthService;
  private readonly _swdpDomainService: SwdpDomainService;
  private readonly _swdpWorkflowService: SwdpWorkflowService;
  private readonly _swdpNaturalLanguageService: SwdpNaturalLanguageService;
  private _disposables: vscode.Disposable[] = [];
  
  /**
   * CoreService 생성자
   * 모든 서비스 초기화
   * @param context VS Code 확장 컨텍스트
   */
  constructor(private context: vscode.ExtensionContext) {
    super();
    
    
    this._logger = new LoggerService();
    
    // 의존성 주입 방식으로 ConfigService 생성
    this._configService = ConfigService.createInstance(context);
    
    this._commandParser = new CommandParserService();
    this._httpService = new HttpClientService();
    this._vsCodeService = new VSCodeService(context);
    
    // 의존성 주입 방식으로 UserAuthService 생성
    this._userAuthService = UserAuthService.createInstance(this._configService);
    
    this._pluginRegistry = new PluginRegistryService(this._configService);
    
    
    this._commandRegistry = new CommandRegistryService(this._pluginRegistry);
    this._commandExecutor = new CommandExecutorService(
      this._commandRegistry,
      this._pluginRegistry
    );
    
    
    this._commandService = new CommandService(this._configService, this);
    
    
    this._llmService = new LlmService();
    
    
    this._rulesEngine = new RulesEngineService();
    this._promptAssembler = new PromptAssemblerService(this._rulesEngine);
    
    
    // 의존성 주입 방식으로 SwdpDomainService 생성
    this._swdpDomainService = SwdpDomainService.createInstance(
      this._configService,
      this._userAuthService
    );
    
    // 의존성 주입 방식으로 SwdpWorkflowService 생성
    this._swdpWorkflowService = SwdpWorkflowService.createInstance(
      this._configService,
      this._userAuthService,
      this._swdpDomainService
    );
    
    // 의존성 주입 방식으로 SwdpNaturalLanguageService 생성
    this._swdpNaturalLanguageService = new SwdpNaturalLanguageService(
      this._swdpDomainService,
      this._swdpWorkflowService,
      this._configService,
      this._userAuthService
    );
    
    this.registerServices();
  }
  
  /**
   * 코어 서비스 인스턴스 생성 팩토리 함수
   * @param context VS Code 확장 컨텍스트
   * @returns 코어 서비스 인스턴스
   */
  public static createInstance(context: vscode.ExtensionContext): ICoreService {
    return new CoreService(context);
  }
  
  /**
   * 서비스 DI 컨테이너에 등록
   */
  private registerServices(): void {
    container.register('coreService', this);
    container.register('configService', this._configService);
    container.register('commandParser', this._commandParser);
    container.register('commandRegistry', this._commandRegistry);
    container.register('commandExecutor', this._commandExecutor);
    container.register('commandService', this._commandService);
    container.register('pluginRegistry', this._pluginRegistry);
    container.register('llmService', this._llmService);
    container.register('vsCodeService', this._vsCodeService);
    container.register('httpService', this._httpService);
    container.register('promptAssembler', this._promptAssembler);
    container.register('rulesEngine', this._rulesEngine);
    container.register('logger', this._logger);
    container.register('userAuthService', this._userAuthService);
    container.register('swdpDomainService', this._swdpDomainService);
    container.register('swdpWorkflowService', this._swdpWorkflowService);
    container.register('swdpNaturalLanguageService', this._swdpNaturalLanguageService);
  }
  
  /**
   * 코어 서비스 초기화
   * 모든 하위 서비스 및 플러그인 초기화
   * @returns 초기화 성공 여부
   */
  public async initialize(): Promise<boolean> {
    try {
      this._logger.info('APE 코어 서비스 초기화 시작');
      
      
      try {
        this._logger.info('설정 로드 시작');
        const loadSuccess = await this._configService.load(true);
        if (!loadSuccess) {
          this._logger.warn('설정 로드 실패, 기본 설정 사용');
        } else {
          this._logger.info('설정 로드 성공');
        }
        
        
        try {
          if (typeof this._configService.validate === 'function') {
            const configValid = await this._configService.validate(this._configService.getCoreConfig(), true);
            if (!configValid) {
              this._logger.error('설정 검증 실패');
              this._logger.info('설정 오류 무시하고 진행 (개발 모드)');
            } else {
              this._logger.info('설정 검증 성공');
            }
          } else {
            this._logger.warn('설정 검증 메서드가 없습니다. 검증 단계 건너뜁니다.');
          }
        } catch (validationError) {
          this._logger.error('설정 검증 메서드 호출 중 오류:', validationError);
          this._logger.info('설정 검증 오류 무시하고 진행 (개발 모드)');
        }
      } catch (configError) {
        this._logger.error('설정 검증 중 오류:', configError);
        this._logger.error('상세 오류 정보:', JSON.stringify(configError, Object.getOwnPropertyNames(configError)));
        
        
        this._logger.info('설정 오류 무시하고 진행...');
      }
      
      
      try {
        this._logger.info('SSL 우회 설정 적용 시작');
        const coreConfig = this._configService.getCoreConfig();
        const sslBypassEnabled = coreConfig.sslBypass || this._configService.get('core.sslBypass', false);
        this._httpService.setSSLBypass(sslBypassEnabled);
        this._logger.info(`SSL 우회 설정 적용 완료: ${sslBypassEnabled ? '사용' : '사용 안 함'}`);
      } catch (sslError) {
        this._logger.error('SSL 우회 설정 적용 중 오류:', sslError);
      }
      
      
      try {
        this._logger.info('내부 플러그인 등록 시작');
        const pluginCount = await this.registerInternalPlugins();
        this._logger.info(`${pluginCount}개의 내부 플러그인 등록 완료`);
      } catch (pluginError) {
        this._logger.error('내부 플러그인 등록 중 오류:', pluginError);
        this._logger.error('상세 오류 정보:', JSON.stringify(pluginError, Object.getOwnPropertyNames(pluginError)));
        
        
        this._logger.info('플러그인 오류 무시하고 진행...');
      }
      
      
      try {
        this._logger.info('플러그인 초기화 시작');
        await this._pluginRegistry.initialize();
        this._logger.info('플러그인 초기화 완료');
      } catch (initError) {
        this._logger.error('플러그인 초기화 중 오류:', initError);
        this._logger.error('상세 오류 정보:', JSON.stringify(initError, Object.getOwnPropertyNames(initError)));
        
        
        this._logger.info('초기화 오류 무시하고 진행...');
      }
      
      
      try {
        this._logger.info('컨텍스트 기반 명령어 서비스 초기화 시작');
        // 모든 서비스는 생성자에서 직접 주입되므로 이벤트 발생은 더 이상 필요하지 않음
        // this.emit('core-service-ready', this);
        
        await this._commandService.initialize();
        this._logger.info('컨텍스트 기반 명령어 서비스 초기화 완료');
      } catch (commandServiceError) {
        const errorMessage = commandServiceError instanceof Error ? commandServiceError.message : 
                         (typeof commandServiceError === 'string' ? commandServiceError : '알 수 없는 오류');
        this._logger.error('컨텍스트 기반 명령어 서비스 초기화 중 오류:', errorMessage);
        
        
        this._logger.info('명령어 서비스 오류 무시하고 진행...');
      }
      
      
      this._isEnabled = true;
      this.emit('core-initialized');
      this._logger.info('APE 코어 서비스 초기화 성공');
      
      return true;
    } catch (error) {
      this._logger.error('APE 코어 서비스 초기화 실패:', error);
      this._logger.error('상세 오류 정보:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.error('APE 코어 서비스 초기화 실패 상세 정보:', error);
      
      
      this._logger.info('오류 발생으로 제한 모드로 전환합니다.');
      this._isEnabled = true; 
      return true; 
    }
  }
  
  /**
   * 내부 플러그인 등록
   * @returns 등록된 플러그인 수
   */
  private async registerInternalPlugins(): Promise<number> {
    try {
      this._logger.info('내부 플러그인 등록 시작');
      
      // 테스트 명령어 등록
      try {
        const { registerTestCommands } = await import('./command/test-commands');
        if (typeof registerTestCommands === 'function') {
          registerTestCommands(this._commandRegistry, this);
          this._logger.info('테스트 명령어 등록 완료');
        }
      } catch (error) {
        this._logger.error('테스트 명령어 등록 실패:', error);
      }
      
      let count = 0;
      
      
      const internalPluginsPath = '../plugins/internal';
      this._logger.info(`내부 플러그인 모듈 경로: ${internalPluginsPath}`);
      
      try {
        const internalPlugins = await import(internalPluginsPath);
        this._logger.info('내부 플러그인 모듈 로딩 성공:', Object.keys(internalPlugins));
        
        
        try {
          this._logger.info('Git 플러그인 등록 시도 중...');
          const GitPluginService = internalPlugins.GitPluginService;
          if (!GitPluginService) {
            this._logger.error('GitPluginService를 찾을 수 없습니다');
          } else {
            const gitPlugin = new GitPluginService(this._configService, this._llmService);
            if (this._pluginRegistry.registerPlugin(gitPlugin, 'internal')) {
              count++;
              this._logger.info(`Git 플러그인 등록 성공: ${gitPlugin.name} (${gitPlugin.id})`);
            }
          }
        } catch (gitError) {
          this._logger.error('Git 플러그인 등록 실패:', gitError);
        }
        
        
        try {
          this._logger.info('Jira 플러그인 등록 시도 중...');
          const JiraPluginService = internalPlugins.JiraPluginService;
          if (!JiraPluginService) {
            this._logger.error('JiraPluginService를 찾을 수 없습니다');
          } else {
            const jiraPlugin = new JiraPluginService(this._configService);
            if (this._pluginRegistry.registerPlugin(jiraPlugin, 'internal')) {
              count++;
              this._logger.info(`Jira 플러그인 등록 성공: ${jiraPlugin.name} (${jiraPlugin.id})`);
            }
          }
        } catch (jiraError) {
          this._logger.error('Jira 플러그인 등록 실패:', jiraError);
        }
        
        
        try {
          this._logger.info('SWDP 플러그인 등록 시도 중...');
          const SwdpPluginService = internalPlugins.SwdpPluginService;
          if (!SwdpPluginService) {
            this._logger.error('SwdpPluginService를 찾을 수 없습니다');
          } else {
            const swdpPlugin = new SwdpPluginService(
              this._configService, 
              this._swdpDomainService, 
              this._swdpWorkflowService,
              this._swdpNaturalLanguageService
            );
            if (this._pluginRegistry.registerPlugin(swdpPlugin, 'internal')) {
              count++;
              this._logger.info(`SWDP 플러그인 등록 성공: ${swdpPlugin.name} (${swdpPlugin.id})`);
            }
          }
        } catch (swdpError) {
          this._logger.error('SWDP 플러그인 등록 실패:', swdpError);
        }
        
        
        try {
          this._logger.info('Pocket 플러그인 등록 시도 중...');
          const PocketPluginService = internalPlugins.PocketPluginService;
          if (!PocketPluginService) {
            this._logger.error('PocketPluginService를 찾을 수 없습니다');
          } else {
            const pocketPlugin = new PocketPluginService(
              this._configService,
              this._llmService
            );
            if (this._pluginRegistry.registerPlugin(pocketPlugin, 'internal')) {
              count++;
              this._logger.info(`Pocket 플러그인 등록 성공: ${pocketPlugin.name} (${pocketPlugin.id})`);
            }
          }
        } catch (pocketError) {
          this._logger.error('Pocket 플러그인 등록 실패:', pocketError);
        }
        
        this._logger.info(`총 ${count}개의 내부 플러그인 등록됨`);
        return count;
        
      } catch (importError) {
        this._logger.error('내부 플러그인 모듈 로딩 실패:', importError);
        this._logger.error('상세 오류 정보:', JSON.stringify(importError, Object.getOwnPropertyNames(importError)));
        
        
        this._logger.info('내부 플러그인 없이 진행합니다.');
        return 0;
      }
    } catch (error) {
      this._logger.error('내부 플러그인 등록 중 오류 발생:', error);
      this._logger.error('상세 오류 정보:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return 0;
    }
  }
  
  /**
   * 사용자 메시지 처리
   * 명령어 파싱 및 실행
   * @param text 사용자 입력 텍스트
   * @param options 처리 옵션 (스트리밍 및 대화 맥락 등)
   * @returns 처리 결과
   */
  public async processMessage(text: string, options?: MessageProcessOptions): Promise<MessageProcessResult> {
    try {
      this._logger.info(`메시지 처리 시작: "${text}"`);
      
      
      const command = this._commandParser.parse(text);
      
      
      if (command) {
        this._logger.info(`명령어 감지됨: ${command.prefix}${command.agentId}:${command.command}`);
        
        try {
          const result = await this.executeCommand(command);
          this._logger.info('명령어 실행 성공');
          return result;
        } catch (cmdError) {
          this._logger.error(`명령어 실행 실패: ${cmdError}`);
          
          
          const errorMessage = cmdError instanceof Error ? cmdError.message : String(cmdError);
          return {
            content: `# 명령어 실행 오류\n\n\`${command.prefix}${command.agentId}:${command.command}\`\n\n오류: ${errorMessage}`,
            error: true
          };
        }
      }
      
      
      if (text.trim().toLowerCase() === 'debug') {
        return {
          content: '# 디버그 모드 활성화\n\n' +
                   '현재 시간: ' + new Date().toLocaleString() + '\n\n' +
                   `등록된 명령어: ${this._commandRegistry.getAllCommandUsages().length}개\n` +
                   `등록된 플러그인: ${this._pluginRegistry.getEnabledPlugins().length}개`
        };
      }
      
      
      this._logger.info(`일반 텍스트로 처리: LLM 응답 생성 (스트리밍: ${options?.stream ? '켜짐' : '꺼짐'})`);
      
      
      if (options?.embedDevMode) {
        this._logger.info(`심층 분석 모드 활성화: 고급 프롬프트 엔지니어링 및 내부 데이터 분석 적용`);
      }
      
      
      if (options?.conversationHistory) {
        this._logger.info(`대화 맥락 포함: ${options.conversationHistory.length}개의 메시지`);
      }
      
      if (options?.stream && options?.onUpdate) {
        
        return await this.generateStreamingResponse(text, options.onUpdate, options.conversationHistory, options);
      } else {
        
        return await this.generateResponse(text, options?.conversationHistory, options);
      }
    } catch (error) {
      this._logger.error('메시지 처리 중 오류 발생:', error);
      return {
        content: `메시지 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        error: true
      };
    }
  }
  
  /**
   * 스트리밍 응답 생성
   * @param text 사용자 입력 텍스트
   * @param onUpdate 스트리밍 업데이트 콜백
   * @param conversationHistory 대화 맥락 (선택 사항)
   * @returns 생성된 응답
   */
  private async generateStreamingResponse(
    text: string, 
    onUpdate: (chunk: string) => void,
    conversationHistory?: ChatMessage[],
    options?: MessageProcessOptions
  ): Promise<MessageProcessResult> {
    try {
      
      const promptData = await this._promptAssembler.assemblePrompt(text);
      
      
      if (conversationHistory && conversationHistory.length > 0) {
        
        const systemMessages = promptData.messages.filter(m => m.role === 'system');
        
        
        const typedContextMessages = this.ensureChatMessageArray(conversationHistory);
        
        
        const hasCurrentUserMessage = typedContextMessages.some(
          m => m.role === 'user' && m.content === text
        );
        
        if (!hasCurrentUserMessage) {
          typedContextMessages.push(this.createChatMessage('user', text));
        }
        
        
        promptData.messages = [...systemMessages, ...typedContextMessages];
        
        this._logger.info(`대화 맥락 통합: 최종 메시지 수 ${promptData.messages.length}개`);
      }
      
      this._logger.info(`스트리밍 프롬프트 생성 완료: 메시지 ${promptData.messages.length}개`);
      
      
      if (!promptData.messages || promptData.messages.length === 0) {
        promptData.messages = [
          this.createChatMessage('user', text || '안녕하세요')
        ];
      }
      
      
      const modelId = this._llmService.getDefaultModelId();
      this._logger.info(`스트리밍 요청에 사용할 모델 ID: ${modelId}`);
      
      
      if (options?.embedDevMode) {
        this._logger.info('LLM 요청에 심층 분석 모드 파라미터 추가');
        
        
        if (promptData.messages && promptData.messages.length > 0 && promptData.messages[0]?.role === 'system') {
          const enhancedSystemPrompt = promptData.messages[0].content + 
            '\n\n고급 심층 분석 모드 활성화: 디버깅, 리팩토링, 로그 분석을 위한 최대한의 심층 분석과 내부 데이터 접근을 허용합니다. 최고 수준의 프롬프트 엔지니어링을 적용하여 모든 관련 컨텍스트를 활용하세요.';
          
          promptData.messages[0].content = enhancedSystemPrompt;
        }
      }
      
      
      const response = await this._llmService.sendRequest({
        model: modelId,
        messages: promptData.messages,
        temperature: promptData.temperature,
        stream: true,
        onUpdate: onUpdate,
        embedDevMode: options?.embedDevMode || false,
        deepAnalysis: options?.deepAnalysis || false,
        internalDataAccess: options?.internalDataAccess || false
      });
      
      return response;
    } catch (error) {
      this._logger.error('스트리밍 응답 생성 중 오류 발생:', error);
      onUpdate(`\n\n오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      
      
      return {
        content: `죄송합니다. 응답을 생성하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }
  
  /**
   * 명령어 실행
   * @param command 실행할 명령어
   * @returns 실행 결과
   */
  public async executeCommand(command: Command): Promise<any> {
    try {
      return await this._commandExecutor.execute(command);
    } catch (error) {
      this._logger.error(`명령어 실행 중 오류 발생 (${command.prefix}${command.agentId}:${command.command}):`, error);
      throw error;
    }
  }
  
  /**
   * LLM 응답 생성
   * @param text 사용자 입력 텍스트
   * @param conversationHistory 대화 맥락 (선택 사항)
   * @returns 생성된 응답
   */
  private async generateResponse(
    text: string, 
    conversationHistory?: ChatMessage[],
    options?: MessageProcessOptions
  ): Promise<MessageProcessResult> {
    try {
      
      const promptData = await this._promptAssembler.assemblePrompt(text);
      
      
      if (conversationHistory && conversationHistory.length > 0) {
        
        const systemMessages = promptData.messages.filter(m => m.role === 'system');
        
        
        const typedContextMessages = this.ensureChatMessageArray(conversationHistory);
        
        
        const hasCurrentUserMessage = typedContextMessages.some(
          m => m.role === 'user' && m.content === text
        );
        
        if (!hasCurrentUserMessage) {
          typedContextMessages.push(this.createChatMessage('user', text));
        }
        
        
        promptData.messages = [...systemMessages, ...typedContextMessages];
        
        this._logger.info(`대화 맥락 통합: 최종 메시지 수 ${promptData.messages.length}개`);
      }
      
      this._logger.info(`프롬프트 생성 완료: 메시지 ${promptData.messages.length}개, 온도 ${promptData.temperature}`);
      
      
      if (!promptData.messages || promptData.messages.length === 0) {
        promptData.messages = [
          this.createChatMessage('user', text || '안녕하세요')
        ];
      }
      
      
      if (options?.embedDevMode) {
        this._logger.info('LLM 요청에 심층 분석 모드 파라미터 추가 (비스트리밍 모드)');
        
        
        if (promptData.messages && promptData.messages.length > 0 && promptData.messages[0]?.role === 'system') {
          const enhancedSystemPrompt = promptData.messages[0].content + 
            '\n\n고급 심층 분석 모드 활성화: 디버깅, 리팩토링, 로그 분석을 위한 최대한의 심층 분석과 내부 데이터 접근을 허용합니다. 최고 수준의 프롬프트 엔지니어링을 적용하여 모든 관련 컨텍스트를 활용하세요.';
          
          promptData.messages[0].content = enhancedSystemPrompt;
        }
      }
      
      
      const response = await this._llmService.sendRequest({
        model: this._llmService.getDefaultModelId(),
        messages: promptData.messages,
        temperature: promptData.temperature,
        embedDevMode: options?.embedDevMode || false,
        deepAnalysis: options?.deepAnalysis || false,
        internalDataAccess: options?.internalDataAccess || false
      });
      
      return response;
    } catch (error) {
      this._logger.error('응답 생성 중 오류 발생:', error);
      
      
      return {
        content: `죄송합니다. 응답을 생성하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }
  
  /**
   * 컨텍스트 정보 수집
   * @returns 컨텍스트 정보
   */
  public async collectContext(): Promise<any> {
    try {
      
      const editorContext = await this._vsCodeService.getEditorContext();
      
      
      const pluginInfo = this._pluginRegistry.getEnabledPlugins().map(p => p.id);
      
      return {
        editor: editorContext,
        plugins: pluginInfo
      };
    } catch (error) {
      this._logger.error('컨텍스트 수집 중 오류 발생:', error);
      return {};
    }
  }
  
  /**
   * 메시지 역할 캐스팅 유틸리티 메서드
   * LLM 메시지 역할을 적절한 형식으로 변환
   * @param role 메시지 역할 문자열
   * @returns MessageRole 타입으로 변환된 역할
   */
  private ensureMessageRole(role: string): MessageRole {
    if (role === 'system' || role === 'user' || role === 'assistant') {
      return role as MessageRole;
    }
    return 'user' as MessageRole;
  }
  
  /**
   * 안전한 채팅 메시지 생성
   * @param role 메시지 역할
   * @param content 메시지 내용
   * @returns 타입 안전 채팅 메시지
   */
  private createChatMessage(role: string, content: string): ChatMessage {
    return { 
      role: this.ensureMessageRole(role), 
      content 
    };
  }
  
  /**
   * 안전한 메시지 배열 변환
   * @param messages 변환할 메시지 배열
   * @returns 타입 안전 메시지 배열
   */
  private ensureChatMessageArray(messages: ChatMessage[] | undefined): ChatMessage[] {
    if (!messages) {
      return [];
    }
    return messages.map(msg => this.createChatMessage(msg.role, msg.content));
  }
  
  /**
   * 서비스 활성화 여부
   * @returns 활성화 상태
   */
  public isEnabled(): boolean {
    return this._isEnabled;
  }
  
  
  
  get configService(): ConfigService {
    return this._configService;
  }
  
  get commandRegistry(): CommandRegistryService {
    return this._commandRegistry;
  }
  
  get pluginRegistry(): PluginRegistryService {
    return this._pluginRegistry;
  }
  
  get llmService(): LlmService {
    return this._llmService;
  }
  
  get vsCodeService(): VSCodeService {
    return this._vsCodeService;
  }
  
  get commandService(): CommandService {
    return this._commandService;
  }
  
  get httpService(): HttpClientService {
    return this._httpService;
  }
  
  get promptAssembler(): PromptAssemblerService {
    return this._promptAssembler;
  }
  
  get logger(): LoggerService {
    return this._logger;
  }
  
  get userAuthService(): UserAuthService {
    return this._userAuthService;
  }
  
  get swdpDomainService(): SwdpDomainService {
    return this._swdpDomainService;
  }
  
  get swdpWorkflowService(): SwdpWorkflowService {
    return this._swdpWorkflowService;
  }
  
  get swdpNaturalLanguageService(): SwdpNaturalLanguageService {
    return this._swdpNaturalLanguageService;
  }
  
  /**
   * 리소스 해제
   * 확장 프로그램 비활성화 시 호출
   */
  public dispose(): void {
    try {
      this._logger.info('APE 코어 서비스 리소스 해제 시작');
      
      // 등록된 모든 Disposable 해제
      this._disposables.forEach(disposable => {
        try {
          disposable.dispose();
        } catch (error) {
          this._logger.error('Disposable 해제 중 오류:', error);
        }
      });
      this._disposables = [];
      
      // 이벤트 리스너 제거
      this.removeAllListeners();
      
      // 서비스 비활성화
      this._isEnabled = false;
      
      this._logger.info('APE 코어 서비스 리소스 해제 완료');
    } catch (error) {
      this._logger.error('APE 코어 서비스 리소스 해제 중 오류:', error);
    }
  }
}