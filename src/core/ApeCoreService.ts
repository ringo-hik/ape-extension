/**
 * APE 코어 서비스
 * 
 * 모든 핵심 서비스를 통합하고 관리하는 중앙 서비스
 * 싱글톤 패턴으로 구현되어 전역적인 접근 제공
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';

// 명령어 시스템
import { 
  CommandParserService, 
  CommandRegistryService, 
  CommandExecutorService,
  CommandService 
} from './command';

// 설정 시스템
import { ConfigService } from './config';

// 플러그인 시스템
import { 
  PluginRegistryService 
} from './plugin-system';

// LLM 서비스
import { LlmService } from './llm';

// VS Code 서비스
import { VSCodeService } from './vscode';

// HTTP 클라이언트
import { HttpClientService } from './http';

// 프롬프트 시스템
import { 
  PromptAssemblerService,
  RulesEngineService
} from './prompt';

// 유틸리티
import { LoggerService } from './utils';

// 타입 임포트
import { Command } from '../types/CommandTypes';

/**
 * APE 코어 서비스 클래스
 * 모든 핵심 서비스 통합 및 관리
 */
export class ApeCoreService extends EventEmitter {
  // 싱글톤 인스턴스
  private static _instance: ApeCoreService;
  
  // 서비스 활성화 상태
  private _isEnabled: boolean = false;
  
  // 서비스 인스턴스
  private _configService: ConfigService;
  private _commandParser: CommandParserService;
  private _commandRegistry: CommandRegistryService;
  private _commandExecutor: CommandExecutorService;
  private _commandService: CommandService; // 컨텍스트 기반 명령어 서비스
  private _pluginRegistry: PluginRegistryService;
  private _llmService: LlmService;
  private _vsCodeService: VSCodeService;
  private _httpService: HttpClientService;
  private _promptAssembler: PromptAssemblerService;
  private _rulesEngine: RulesEngineService;
  private _logger: LoggerService;
  
  /**
   * ApeCoreService 생성자
   * 모든 서비스 초기화
   * @param context VS Code 확장 컨텍스트
   */
  private constructor(private context: vscode.ExtensionContext) {
    super();
    
    // 필수 서비스 초기화
    this._logger = new LoggerService();
    this._configService = new ConfigService();
    this._commandParser = new CommandParserService();
    this._httpService = new HttpClientService();
    this._vsCodeService = new VSCodeService(context);
    
    // 플러그인 시스템 초기화
    this._pluginRegistry = new PluginRegistryService(this._configService);
    
    // 명령어 시스템 초기화
    this._commandRegistry = new CommandRegistryService(this._pluginRegistry);
    this._commandExecutor = new CommandExecutorService(
      this._commandRegistry,
      this._pluginRegistry
    );
    
    // 컨텍스트 기반 명령어 서비스 초기화
    this._commandService = new CommandService(this._configService);
    
    // LLM 서비스 초기화
    this._llmService = new LlmService();
    
    // 프롬프트 시스템 초기화
    this._rulesEngine = new RulesEngineService();
    this._promptAssembler = new PromptAssemblerService(this._rulesEngine);
  }
  
  /**
   * 싱글톤 인스턴스 반환
   * @param context VS Code 확장 컨텍스트 (최초 호출 시에만 필요)
   * @returns ApeCoreService 인스턴스
   */
  public static getInstance(context?: vscode.ExtensionContext): ApeCoreService {
    if (!ApeCoreService._instance) {
      if (!context) {
        throw new Error('ApeCoreService 초기화에 context가 필요합니다.');
      }
      ApeCoreService._instance = new ApeCoreService(context);
    }
    return ApeCoreService._instance;
  }
  
  /**
   * 내부 플러그인 등록
   * @returns 등록된 플러그인 수
   */
  private async registerInternalPlugins(): Promise<number> {
    try {
      this._logger.info('내부 플러그인 등록 시작');
      
      // 대체 방식: 직접 클래스 가져오기
      try {
        this._logger.info('직접 클래스 가져오기 시도...');
        
        // Git 플러그인 
        try {
          this._logger.info('Git 플러그인 직접 로드 시도...');
          const GitPluginService = (await import('../plugins/internal/git/GitPluginService')).GitPluginService;
          const gitPlugin = new GitPluginService(this._configService);
          if (this._pluginRegistry.registerPlugin(gitPlugin, 'internal')) {
            this._logger.info(`Git 플러그인 등록 성공: ${gitPlugin.name} (${gitPlugin.id})`);
          }
        } catch (gitError) {
          this._logger.error('Git 플러그인 로드 실패:', gitError);
          this._logger.error('상세 오류 정보:', JSON.stringify(gitError, Object.getOwnPropertyNames(gitError)));
        }

        // Jira 플러그인 
        try {
          this._logger.info('Jira 플러그인 직접 로드 시도...');
          const JiraPluginService = (await import('../plugins/internal/jira/JiraPluginService')).JiraPluginService;
          const jiraPlugin = new JiraPluginService(this._configService);
          if (this._pluginRegistry.registerPlugin(jiraPlugin, 'internal')) {
            this._logger.info(`Jira 플러그인 등록 성공: ${jiraPlugin.name} (${jiraPlugin.id})`);
          }
        } catch (jiraError) {
          this._logger.error('Jira 플러그인 로드 실패:', jiraError);
          this._logger.error('상세 오류 정보:', JSON.stringify(jiraError, Object.getOwnPropertyNames(jiraError)));
        }

        // SWDP 플러그인 
        try {
          this._logger.info('SWDP 플러그인 직접 로드 시도...');
          const SwdpPluginService = (await import('../plugins/internal/swdp/SwdpPluginService')).SwdpPluginService;
          const swdpPlugin = new SwdpPluginService(this._configService);
          if (this._pluginRegistry.registerPlugin(swdpPlugin, 'internal')) {
            this._logger.info(`SWDP 플러그인 등록 성공: ${swdpPlugin.name} (${swdpPlugin.id})`);
          }
        } catch (swdpError) {
          this._logger.error('SWDP 플러그인 로드 실패:', swdpError);
          this._logger.error('상세 오류 정보:', JSON.stringify(swdpError, Object.getOwnPropertyNames(swdpError)));
        }

        // Pocket 플러그인 (S3 호환 스토리지)
        try {
          this._logger.info('Pocket 플러그인 직접 로드 시도...');
          const PocketPluginService = (await import('../plugins/internal/pocket/PocketPluginService')).PocketPluginService;
          const pocketPlugin = new PocketPluginService(this._configService);
          if (this._pluginRegistry.registerPlugin(pocketPlugin, 'internal')) {
            this._logger.info(`Pocket 플러그인 등록 성공: ${pocketPlugin.name} (${pocketPlugin.id})`);
          }
        } catch (pocketError) {
          this._logger.error('Pocket 플러그인 로드 실패:', pocketError);
          this._logger.error('상세 오류 정보:', JSON.stringify(pocketError, Object.getOwnPropertyNames(pocketError)));
        }
        
        // 등록된 플러그인 수 계산
        const count = this._pluginRegistry.getInternalPlugins().length;
        this._logger.info(`총 ${count}개의 내부 플러그인 등록됨`);
        return count;
        
      } catch (directImportError) {
        this._logger.error('직접 클래스 가져오기 실패:', directImportError);
        this._logger.error('상세 오류 정보:', JSON.stringify(directImportError, Object.getOwnPropertyNames(directImportError)));
        
        // 이전 방식으로 시도
        this._logger.info('내부 플러그인 모듈 인덱스를 통한 로딩 시도...');
        const internalPluginsPath = '../plugins/internal';
        this._logger.info(`모듈 경로: ${internalPluginsPath}`);
        
        try {
          const internalPlugins = await import(internalPluginsPath);
          this._logger.info('내부 플러그인 모듈 로딩 성공:', Object.keys(internalPlugins));
          
          // 내부 플러그인 인스턴스 생성 및 등록
          let count = 0;
          
          // Git 플러그인 등록
          try {
            this._logger.info('Git 플러그인 등록 시도 중...');
            const GitPluginService = internalPlugins.GitPluginService;
            if (!GitPluginService) {
              this._logger.error('GitPluginService를 찾을 수 없습니다');
            } else {
              const gitPlugin = new GitPluginService(this._configService);
              if (this._pluginRegistry.registerPlugin(gitPlugin, 'internal')) {
                count++;
                this._logger.info(`내부 플러그인 등록 성공: ${gitPlugin.name} (${gitPlugin.id})`);
              }
            }
          } catch (gitError) {
            this._logger.error('Git 플러그인 등록 실패:', gitError);
          }
          
          // Jira 플러그인 등록
          try {
            this._logger.info('Jira 플러그인 등록 시도 중...');
            const JiraPluginService = internalPlugins.JiraPluginService;
            if (!JiraPluginService) {
              this._logger.error('JiraPluginService를 찾을 수 없습니다');
            } else {
              const jiraPlugin = new JiraPluginService(this._configService);
              if (this._pluginRegistry.registerPlugin(jiraPlugin, 'internal')) {
                count++;
                this._logger.info(`내부 플러그인 등록 성공: ${jiraPlugin.name} (${jiraPlugin.id})`);
              }
            }
          } catch (jiraError) {
            this._logger.error('Jira 플러그인 등록 실패:', jiraError);
          }
          
          // SWDP 플러그인 등록
          try {
            this._logger.info('SWDP 플러그인 등록 시도 중...');
            const SwdpPluginService = internalPlugins.SwdpPluginService;
            if (!SwdpPluginService) {
              this._logger.error('SwdpPluginService를 찾을 수 없습니다');
            } else {
              const swdpPlugin = new SwdpPluginService(this._configService);
              if (this._pluginRegistry.registerPlugin(swdpPlugin, 'internal')) {
                count++;
                this._logger.info(`내부 플러그인 등록 성공: ${swdpPlugin.name} (${swdpPlugin.id})`);
              }
            }
          } catch (swdpError) {
            this._logger.error('SWDP 플러그인 등록 실패:', swdpError);
          }
          
          // Pocket 플러그인 등록
          try {
            this._logger.info('Pocket 플러그인 등록 시도 중...');
            const PocketPluginService = internalPlugins.PocketPluginService;
            if (!PocketPluginService) {
              this._logger.error('PocketPluginService를 찾을 수 없습니다');
            } else {
              const pocketPlugin = new PocketPluginService(this._configService);
              if (this._pluginRegistry.registerPlugin(pocketPlugin, 'internal')) {
                count++;
                this._logger.info(`내부 플러그인 등록 성공: ${pocketPlugin.name} (${pocketPlugin.id})`);
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
          
          // 임시 대응: 없이 진행
          this._logger.info('내부 플러그인 없이 진행합니다.');
          return 0;
        }
      }
    } catch (error) {
      this._logger.error('내부 플러그인 등록 중 오류 발생:', error);
      this._logger.error('상세 오류 정보:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return 0;
    }
  }
  
  /**
   * 코어 서비스 초기화
   * 모든 하위 서비스 및 플러그인 초기화
   * @returns 초기화 성공 여부
   */
  public async initialize(): Promise<boolean> {
    try {
      this._logger.info('APE 코어 서비스 초기화 시작');
      
      // 설정 로드 및 검증
      try {
        this._logger.info('설정 로드 시작');
        const loadSuccess = await this._configService.load();
        if (!loadSuccess) {
          this._logger.warn('설정 로드 실패, 기본 설정 사용');
        } else {
          this._logger.info('설정 로드 성공');
        }
        
        this._logger.info('설정 검증 시작');
        try {
          // 메서드 존재 여부 확인 후 호출
          if (typeof this._configService.validate === 'function') {
            const configValid = await this._configService.validate(this._configService.getCoreConfig());
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
        
        // 설정 오류 무시하고 진행 (개발 모드)
        this._logger.info('설정 오류 무시하고 진행...');
      }
      
      // SSL 우회 설정 확인 및 적용
      try {
        this._logger.info('SSL 우회 설정 적용 시작');
        // getCoreConfig와 get 메서드를 사용하여 sslBypass 값 가져오기
        const coreConfig = this._configService.getCoreConfig();
        const sslBypassEnabled = coreConfig.sslBypass || this._configService.get('core.sslBypass', false);
        this._httpService.setSSLBypass(sslBypassEnabled);
        this._logger.info(`SSL 우회 설정 적용 완료: ${sslBypassEnabled ? '사용' : '사용 안 함'}`);
      } catch (sslError) {
        this._logger.error('SSL 우회 설정 적용 중 오류:', sslError);
      }
      
      // 내부 플러그인 등록
      try {
        this._logger.info('내부 플러그인 등록 시작');
        const pluginCount = await this.registerInternalPlugins();
        this._logger.info(`${pluginCount}개의 내부 플러그인 등록 완료`);
      } catch (pluginError) {
        this._logger.error('내부 플러그인 등록 중 오류:', pluginError);
        this._logger.error('상세 오류 정보:', JSON.stringify(pluginError, Object.getOwnPropertyNames(pluginError)));
        
        // 플러그인 오류 무시하고 진행
        this._logger.info('플러그인 오류 무시하고 진행...');
      }
      
      // 플러그인 초기화
      try {
        this._logger.info('플러그인 초기화 시작');
        await this._pluginRegistry.initialize();
        this._logger.info('플러그인 초기화 완료');
      } catch (initError) {
        this._logger.error('플러그인 초기화 중 오류:', initError);
        this._logger.error('상세 오류 정보:', JSON.stringify(initError, Object.getOwnPropertyNames(initError)));
        
        // 초기화 오류 무시하고 진행
        this._logger.info('초기화 오류 무시하고 진행...');
      }
      
      // 컨텍스트 기반 명령어 서비스 초기화
      try {
        this._logger.info('컨텍스트 기반 명령어 서비스 초기화 시작');
        
        // 코어 서비스 참조 설정 (LLM 서비스 등 접근을 위해)
        this._commandService.setCoreService(this);
        
        await this._commandService.initialize();
        this._logger.info('컨텍스트 기반 명령어 서비스 초기화 완료');
      } catch (commandServiceError) {
        this._logger.error('컨텍스트 기반 명령어 서비스 초기화 중 오류:', commandServiceError);
        
        // 초기화 오류 무시하고 진행
        this._logger.info('명령어 서비스 오류 무시하고 진행...');
      }
      
      // 서비스 활성화
      this._isEnabled = true;
      this.emit('core-initialized');
      this._logger.info('APE 코어 서비스 초기화 성공');
      
      return true;
    } catch (error) {
      this._logger.error('APE 코어 서비스 초기화 실패:', error);
      this._logger.error('상세 오류 정보:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.error('APE 코어 서비스 초기화 실패 상세 정보:', error);
      
      // 중요: 오류가 발생해도 최소한의 기능은 활성화
      this._logger.info('오류 발생으로 제한 모드로 전환합니다.');
      this._isEnabled = true; // 최소 기능 활성화
      return true; // 오류가 있어도 초기화 성공으로 처리
    }
  }
  
  /**
   * 사용자 메시지 처리
   * 명령어 파싱 및 실행
   * @param text 사용자 입력 텍스트
   * @param options 처리 옵션 (스트리밍 및 대화 맥락 등)
   * @returns 처리 결과
   */
  public async processMessage(text: string, options?: {
    stream?: boolean;
    onUpdate?: (chunk: string) => void;
    conversationHistory?: Array<{role: string, content: string}>;
    embedDevMode?: boolean;
    deepAnalysis?: boolean;
    internalDataAccess?: boolean;
  }): Promise<any> {
    try {
      this._logger.info(`메시지 처리 시작: "${text}"`);
      
      // 명령어 파싱
      const command = this._commandParser.parse(text);
      
      // 명령어인 경우 실행
      if (command) {
        this._logger.info(`명령어 감지됨: ${command.prefix}${command.agentId}:${command.command}`);
        
        try {
          const result = await this.executeCommand(command);
          this._logger.info('명령어 실행 성공');
          return result;
        } catch (cmdError) {
          this._logger.error(`명령어 실행 실패: ${cmdError}`);
          
          // 오류 메시지 포맷팅
          const errorMessage = cmdError instanceof Error ? cmdError.message : String(cmdError);
          return {
            content: `# 명령어 실행 오류\n\n\`${command.prefix}${command.agentId}:${command.command}\`\n\n오류: ${errorMessage}`,
            error: true
          };
        }
      }
      
      // 일반 텍스트인 경우 디버그 모드에서는 간단한 응답 반환
      if (text.trim().toLowerCase() === 'debug') {
        return {
          content: '# 디버그 모드 활성화\n\n' +
                   '현재 시간: ' + new Date().toLocaleString() + '\n\n' +
                   `등록된 명령어: ${this._commandRegistry.getAllCommandUsages().length}개\n` +
                   `등록된 플러그인: ${this._pluginRegistry.getEnabledPlugins().length}개`
        };
      }
      
      // 일반 텍스트는 LLM 응답 생성 (스트리밍 옵션 포함)
      this._logger.info(`일반 텍스트로 처리: LLM 응답 생성 (스트리밍: ${options?.stream ? '켜짐' : '꺼짐'})`);
      
      // 심층 분석 모드 로깅
      if (options?.embedDevMode) {
        this._logger.info(`심층 분석 모드 활성화: 고급 프롬프트 엔지니어링 및 내부 데이터 분석 적용`);
      }
      
      // 대화 맥락 로깅
      if (options?.conversationHistory) {
        this._logger.info(`대화 맥락 포함: ${options.conversationHistory.length}개의 메시지`);
      }
      
      if (options?.stream && options?.onUpdate) {
        // 스트리밍 모드
        return await this.generateStreamingResponse(text, options.onUpdate, options.conversationHistory, options);
      } else {
        // 일반 모드
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
    conversationHistory?: Array<{role: string, content: string}>,
    options?: {
      embedDevMode?: boolean;
      deepAnalysis?: boolean;
      internalDataAccess?: boolean;
    }
  ): Promise<any> {
    try {
      // 프롬프트 어셈블러로 컨텍스트 주입
      const promptData = await this._promptAssembler.assemblePrompt(text);
      
      // 대화 맥락이 있는 경우, 기존 프롬프트 데이터에 통합
      if (conversationHistory && conversationHistory.length > 0) {
        // 시스템 메시지 분리 (항상 첫 번째로 유지)
        const systemMessages = promptData.messages.filter(m => m.role === 'system');
        
        // 대화 맥락 메시지와 현재 사용자 메시지 결합
        const contextMessages = [...conversationHistory];
        
        // 현재 사용자 메시지가 컨텍스트에 없으면 추가
        const hasCurrentUserMessage = contextMessages.some(
          m => m.role === 'user' && m.content === text
        );
        
        if (!hasCurrentUserMessage) {
          contextMessages.push({ role: 'user', content: text });
        }
        
        // 최종 메시지 배열 생성 (시스템 메시지 + 대화 맥락)
        promptData.messages = [...systemMessages, ...contextMessages];
        
        this._logger.info(`대화 맥락 통합: 최종 메시지 수 ${promptData.messages.length}개`);
      }
      
      this._logger.info(`스트리밍 프롬프트 생성 완료: 메시지 ${promptData.messages.length}개`);
      
      // 메시지가 비어있는 경우 기본 메시지 추가
      if (!promptData.messages || promptData.messages.length === 0) {
        promptData.messages = [
          {
            role: 'user',
            content: text || '안녕하세요'
          }
        ];
      }
      
      // 현재 설정된 모델 ID 확인
      const modelId = this._llmService.getDefaultModelId();
      this._logger.info(`스트리밍 요청에 사용할 모델 ID: ${modelId}`);
      
      // 심층 분석 모드 설정
      if (options?.embedDevMode) {
        this._logger.info('LLM 요청에 심층 분석 모드 파라미터 추가');
        
        /**
         * TODO: 내부망 데이터 접근 및 분석 로직 구현
         * 
         * 이 부분에서 다음과 같은 심층 분석 기능을 구현해야 합니다:
         * 1. 내부망 접근 및 데이터 수집 (narrans API, 로그 서버, 내부 문서 등)
         * 2. 수집된 내부 데이터와 컨텍스트 통합
         * 3. 고급 디버깅 정보 추출 및 전처리
         * 4. 로그 분석 알고리즘 적용
         * 5. 리팩토링 컨텍스트 강화 (내부 코드베이스 참조)
         * 
         * 구현 요구사항:
         * - 내부망 인증 및 접근 관리
         * - 데이터 보안 및 민감 정보 처리
         * - 리소스 사용 최적화 (메모리, 네트워크 요청)
         * - 비동기 데이터 수집 및 병렬 처리
         * 
         * 현재는 기본 프레임워크만 구현된 상태이며
         * 복잡한 비즈니스 로직은 향후 구현 예정
         */
        
        // 심층 분석을 위한 시스템 프롬프트 강화
        if (promptData.messages.length > 0 && promptData.messages[0].role === 'system') {
          const enhancedSystemPrompt = promptData.messages[0].content + 
            '\n\n고급 심층 분석 모드 활성화: 디버깅, 리팩토링, 로그 분석을 위한 최대한의 심층 분석과 내부 데이터 접근을 허용합니다. 최고 수준의 프롬프트 엔지니어링을 적용하여 모든 관련 컨텍스트를 활용하세요.';
          
          promptData.messages[0].content = enhancedSystemPrompt;
        }
      }
      
      // LLM 서비스로 응답 생성 (스트리밍 모드)
      const response = await this._llmService.sendRequest({
        model: modelId,
        messages: promptData.messages,
        temperature: promptData.temperature,
        stream: true,
        onUpdate: onUpdate,
        embedDevMode: options?.embedDevMode,
        deepAnalysis: options?.deepAnalysis,
        internalDataAccess: options?.internalDataAccess
      });
      
      return response;
    } catch (error) {
      this._logger.error('스트리밍 응답 생성 중 오류 발생:', error);
      onUpdate(`\n\n오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      
      // 오류 발생 시 기본 응답 반환
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
    conversationHistory?: Array<{role: string, content: string}>,
    options?: {
      embedDevMode?: boolean;
      deepAnalysis?: boolean;
      internalDataAccess?: boolean;
    }
  ): Promise<any> {
    try {
      // 프롬프트 어셈블러로 컨텍스트 주입
      const promptData = await this._promptAssembler.assemblePrompt(text);
      
      // 대화 맥락이 있는 경우, 기존 프롬프트 데이터에 통합
      if (conversationHistory && conversationHistory.length > 0) {
        // 시스템 메시지 분리 (항상 첫 번째로 유지)
        const systemMessages = promptData.messages.filter(m => m.role === 'system');
        
        // 대화 맥락 메시지와 현재 사용자 메시지 결합
        const contextMessages = [...conversationHistory];
        
        // 현재 사용자 메시지가 컨텍스트에 없으면 추가
        const hasCurrentUserMessage = contextMessages.some(
          m => m.role === 'user' && m.content === text
        );
        
        if (!hasCurrentUserMessage) {
          contextMessages.push({ role: 'user', content: text });
        }
        
        // 최종 메시지 배열 생성 (시스템 메시지 + 대화 맥락)
        promptData.messages = [...systemMessages, ...contextMessages];
        
        this._logger.info(`대화 맥락 통합: 최종 메시지 수 ${promptData.messages.length}개`);
      }
      
      this._logger.info(`프롬프트 생성 완료: 메시지 ${promptData.messages.length}개, 온도 ${promptData.temperature}`);
      
      // 메시지가 비어있는 경우 기본 메시지 추가
      if (!promptData.messages || promptData.messages.length === 0) {
        promptData.messages = [
          {
            role: 'user',
            content: text || '안녕하세요'
          }
        ];
      }
      
      // 심층 분석 모드 설정
      if (options?.embedDevMode) {
        this._logger.info('LLM 요청에 심층 분석 모드 파라미터 추가 (비스트리밍 모드)');
        
        /**
         * TODO: 내부망 데이터 접근 및 분석 로직 구현
         * 
         * 이 부분에서 다음과 같은 심층 분석 기능을 구현해야 합니다:
         * 1. 내부망 접근 및 데이터 수집 (narrans API, 로그 서버, 내부 문서 등)
         * 2. 수집된 내부 데이터와 컨텍스트 통합
         * 3. 고급 디버깅 정보 추출 및 전처리
         * 4. 로그 분석 알고리즘 적용
         * 5. 리팩토링 컨텍스트 강화 (내부 코드베이스 참조)
         * 
         * 구현 요구사항:
         * - 내부망 인증 및 접근 관리
         * - 데이터 보안 및 민감 정보 처리
         * - 리소스 사용 최적화 (메모리, 네트워크 요청)
         * - 비동기 데이터 수집 및 병렬 처리
         * 
         * 현재는 기본 프레임워크만 구현된 상태이며
         * 복잡한 비즈니스 로직은 향후 구현 예정
         */
        
        // 심층 분석을 위한 시스템 프롬프트 강화
        if (promptData.messages.length > 0 && promptData.messages[0].role === 'system') {
          const enhancedSystemPrompt = promptData.messages[0].content + 
            '\n\n고급 심층 분석 모드 활성화: 디버깅, 리팩토링, 로그 분석을 위한 최대한의 심층 분석과 내부 데이터 접근을 허용합니다. 최고 수준의 프롬프트 엔지니어링을 적용하여 모든 관련 컨텍스트를 활용하세요.';
          
          promptData.messages[0].content = enhancedSystemPrompt;
        }
      }
      
      // LLM 서비스로 응답 생성
      const response = await this._llmService.sendRequest({
        model: this._llmService.getDefaultModelId(),
        messages: promptData.messages,
        temperature: promptData.temperature,
        embedDevMode: options?.embedDevMode,
        deepAnalysis: options?.deepAnalysis,
        internalDataAccess: options?.internalDataAccess
      });
      
      return response;
    } catch (error) {
      this._logger.error('응답 생성 중 오류 발생:', error);
      
      // 오류 발생 시 기본 응답 반환
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
      // VS Code 정보 수집
      const editorContext = await this._vsCodeService.getEditorContext();
      
      // 활성 플러그인 정보
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
  
  // 서비스 인스턴스 접근자
  
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
  
  /**
   * 서비스 활성화 여부
   * @returns 활성화 상태
   */
  public isEnabled(): boolean {
    return this._isEnabled;
  }
}

