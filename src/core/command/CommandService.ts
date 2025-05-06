/**
 * 명령어 서비스
 * 
 * 명령어 처리의 중앙 허브 역할을 담당
 * 모든 명령어 관련 기능을 통합 관리
 */

import { CommandRegistryService } from './CommandRegistryService';
import { CommandExecutorService } from './CommandExecutorService';
import { CommandParserService } from './CommandParserService';
import { IConfigLoader } from '../../types/ConfigTypes';
import { LoggerService } from '../utils/LoggerService';
import { EventEmitter } from 'events';
import { Command, CommandPrefix, CommandType, ParsedCommand } from '../../types/CommandTypes';
import { PluginRegistryService } from '../plugin-system/PluginRegistryService';
import { ICoreService } from '../ICoreService';

/**
 * 명령어 서비스 클래스
 * 
 * 명령어 등록, 파싱, 실행을 총괄하는 중앙 서비스
 * 사용자 편의성을 위한 고급 명령어 기능 제공
 */
export class CommandService extends EventEmitter {
  private registry: CommandRegistryService;
  private executor: CommandExecutorService;
  private parser: CommandParserService;
  private logger: LoggerService;
  
  // 코어 서비스 참조
  private coreService: ICoreService | null = null;
  
  // 컨텍스트 캐시 (플러그인 -> 컨텍스트 데이터)
  private contextCache: Map<string, any> = new Map();
  
  // 사용자 선호도 캐시 (플러그인 -> 명령어 -> 자주 사용하는 인자)
  private preferenceCache: Map<string, Map<string, any[]>> = new Map();
  
  /**
   * CommandService 생성자
   * @param configLoader 설정 로더 서비스
   */
  constructor(configLoader: IConfigLoader) {
    super();
    this.logger = new LoggerService();
    
    // PluginRegistryService 인스턴스 생성 (configLoader를 사용)
    const pluginRegistry = new PluginRegistryService(configLoader);
    
    // registry, executor, parser 초기화
    this.registry = new CommandRegistryService(pluginRegistry);
    this.executor = new CommandExecutorService(this.registry, pluginRegistry);
    this.parser = new CommandParserService();
    
    this.logger.info('CommandService 초기화됨');
    
    // 주기적으로 컨텍스트 정보 업데이트
    setInterval(() => this.refreshAllContexts(), 30000); // 30초마다 새로고침
    
    // 이벤트 기반 코어 서비스 참조 설정 (순환 의존성 해결)
    this.on('core-service-ready', (coreService: ICoreService) => {
      this.coreService = coreService;
      this.logger.info('이벤트 기반 코어 서비스 참조 설정됨');
    });
  }
  
  /**
   * 코어서비스 설정 - 레거시 메서드 (이벤트 기반으로 대체)
   * @deprecated 이벤트 기반 연결을 사용하세요
   * @param coreService 코어 서비스 인스턴스
   */
  setCoreService(coreService: ICoreService): void {
    // 이벤트 기반 방식을 우선하고, 기존 메서드는 호환성 유지
    this.coreService = coreService;
    this.logger.info('레거시 방식으로 코어 서비스 참조 설정됨 (deprecated)');
  }
  
  /**
   * 초기화
   */
  async initialize(): Promise<void> {
    // CommandRegistryService 초기화
    if (typeof this.registry.initialize === 'function') {
      await this.registry.initialize();
    }
    
    // 컨텍스트 초기 로딩
    await this.refreshAllContexts();
    
    this.logger.info('CommandService 완전히 초기화됨');
  }
  
  /**
   * 명령어 실행
   * @param command 실행할 명령어 문자열
   * @returns 명령어 실행 결과
   */
  async executeCommand(command: string): Promise<any> {
    try {
      this.logger.debug(`명령어 실행: ${command}`);
      
      // 명령어 파싱
      const parsedCommand = this.parser.parse(command);
      
      if (!parsedCommand) {
        return {
          content: `명령어 파싱 실패: ${command}`,
          error: true
        };
      }
      
      // 명령어 실행
      return await this.executor.execute(parsedCommand);
    } catch (error) {
      this.logger.error(`명령어 실행 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: `명령어 실행 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`,
        error: true
      };
    }
  }
  
  /**
   * 모든 플러그인의 컨텍스트 정보 새로고침
   */
  private async refreshAllContexts(): Promise<void> {
    try {
      // 각 플러그인의 실시간 컨텍스트 수집
      await this.refreshGitContext();
      await this.refreshJiraContext();
      await this.refreshSwdpContext();
      await this.refreshPocketContext();
      
      this.emit('contexts-updated');
    } catch (error) {
      this.logger.error('컨텍스트 정보 새로고침 중 오류 발생:', error);
    }
  }
  
  /**
   * Git 플러그인 컨텍스트 새로고침
   */
  private async refreshGitContext(): Promise<void> {
    try {
      const plugin = this.registry.getPlugin('git');
      if (!plugin) return;
      
      const gitClient = (plugin as any).client;
      if (!gitClient) return;
      
      // 현재 상태 정보
      const status = await gitClient.getStatus();
      
      // 브랜치 정보
      const branches = await gitClient.getBranches(true);
      
      // Git 컨텍스트 업데이트
      this.contextCache.set('git', {
        status,
        branches,
        lastUpdated: new Date()
      });
      
      this.logger.debug('Git 컨텍스트 정보 업데이트됨');
    } catch (error) {
      this.logger.error('Git 컨텍스트 새로고침 중 오류 발생:', error);
    }
  }
  
  /**
   * Jira 플러그인 컨텍스트 새로고침
   */
  private async refreshJiraContext(): Promise<void> {
    try {
      const plugin = this.registry.getPlugin('jira');
      if (!plugin || !(plugin as any).client) return;
      
      const jiraClient = (plugin as any).client;
      
      // 최근 이슈 목록 (추후 구현)
      // const recentIssues = await jiraClient.getRecentIssues();
      
      // Jira 컨텍스트 업데이트
      this.contextCache.set('jira', {
        // recentIssues,
        lastUpdated: new Date()
      });
      
      this.logger.debug('Jira 컨텍스트 정보 업데이트됨');
    } catch (error) {
      this.logger.error('Jira 컨텍스트 새로고침 중 오류 발생:', error);
    }
  }
  
  /**
   * SWDP 플러그인 컨텍스트 새로고침
   */
  private async refreshSwdpContext(): Promise<void> {
    try {
      const plugin = this.registry.getPlugin('swdp');
      if (!plugin || !(plugin as any).swdpClient) return;
      
      // SWDP 컨텍스트 업데이트
      this.contextCache.set('swdp', {
        lastUpdated: new Date()
      });
      
      this.logger.debug('SWDP 컨텍스트 정보 업데이트됨');
    } catch (error) {
      this.logger.error('SWDP 컨텍스트 새로고침 중 오류 발생:', error);
    }
  }
  
  /**
   * Pocket 플러그인 컨텍스트 새로고침
   */
  private async refreshPocketContext(): Promise<void> {
    try {
      const plugin = this.registry.getPlugin('pocket');
      if (!plugin || !(plugin as any).client) return;
      
      // Pocket 컨텍스트 업데이트
      this.contextCache.set('pocket', {
        lastUpdated: new Date()
      });
      
      this.logger.debug('Pocket 컨텍스트 정보 업데이트됨');
    } catch (error) {
      this.logger.error('Pocket 컨텍스트 새로고침 중 오류 발생:', error);
    }
  }
  
  /**
   * 실시간 컨텍스트 기반 명령어 생성
   * 사용자가 직접 인자를 입력하지 않아도 되도록 완성된 명령어 제공
   * 
   * @param baseCommand 기본 명령어 (예: '@git:commit')
   * @param context 실행 컨텍스트 및 환경 정보
   * @returns 완성된 명령어 문자열 또는 후보 목록
   */
  async generateContextualCommand(baseCommand: string, context?: any): Promise<string | string[]> {
    try {
      if (!baseCommand) {
        return '';
      }
      
      // 플러그인 명령어 분리
      const parts = baseCommand.split(':');
      const pluginPrefix = parts.length > 0 ? parts[0] : '';
      const commandName = parts.length > 1 ? parts[1] : '';
      
      if (!pluginPrefix || !commandName) {
        return baseCommand;
      }
      
      const pluginId = pluginPrefix.replace('@', '');
      
      // 명령어 레지스트리에서 플러그인 및 명령어 정보 조회
      const command = this.registry.findCommand(pluginId, commandName);
      
      if (!command) {
        return baseCommand; // 명령어를 찾을 수 없으면 원본 반환
      }
      
      // 플러그인별 컨텍스트 명령어 생성 (각 플러그인의 상태에 따라 다른 동작)
      if (pluginId === 'git') {
        return this.generateGitCommand(commandName, context);
      } else if (pluginId === 'jira') {
        return this.generateJiraCommand(commandName, context);
      } else if (pluginId === 'swdp') {
        return this.generateSwdpCommand(commandName, context);
      } else if (pluginId === 'pocket') {
        return this.generatePocketCommand(commandName, context);
      }
      
      // 알 수 없는 플러그인의 경우 기본 명령어 반환
      return baseCommand;
    } catch (error) {
      this.logger.error(`컨텍스트 명령어 생성 중 오류: ${error}`);
      return baseCommand; // 오류 발생 시 원본 명령어 반환
    }
  }
  
  /**
   * Git 명령어 자동 생성
   * 현재 Git 상태에 따라 최적화된 명령어 생성
   * 
   * @param commandName Git 명령어 이름
   * @param context 컨텍스트 정보
   * @returns 완성된 Git 명령어 또는 후보 목록
   */
  private async generateGitCommand(commandName: string, context?: any): Promise<string | string[]> {
    // Git 플러그인 가져오기
    const gitPlugin = this.registry.getPlugin('git');
    
    if (!gitPlugin) {
      return `@git:${commandName}`; // 플러그인을 찾을 수 없으면 기본 형식 반환
    }
    
    // Git 클라이언트로부터 현재 상태 가져오기
    const gitClient = (gitPlugin as any).client;
    
    if (!gitClient) {
      return `@git:${commandName}`;
    }
    
    try {
      // 캐시된 Git 컨텍스트 정보 사용
      const gitContext = this.contextCache.get('git') || {};
      const status = gitContext.status || await gitClient.getStatus();
      const branches = gitContext.branches || await gitClient.getBranches(true);
      
      // 명령어별 컨텍스트 처리
      switch (commandName) {
        case 'commit': {
          // 변경 사항 확인
          if (!status.changes || status.changes.length === 0) {
            return '@git:commit "변경 사항 없음" --empty';
          }
          
          // 변경 파일 기반 커밋 메시지 추천
          const fileNames = status.changes.map((change: any) => change.path).join(', ');
          const suggestedMessage = `${fileNames}의 변경 사항`;
          
          return `@git:commit "${suggestedMessage}"`;
        }
        
        case 'push': {
          // 현재 브랜치 확인
          const currentBranch = status.branch;
          
          // 트래킹 브랜치가 있는지 확인
          if (status.tracking) {
            return `@git:push origin ${currentBranch}`;
          } else {
            // 트래킹 브랜치가 없으면 --set-upstream 옵션 추가
            return `@git:push origin ${currentBranch} --set-upstream`;
          }
        }
        
        case 'checkout': {
          // 현재 브랜치 제외한 최근 브랜치 목록 생성
          const otherBranches = branches
            .filter((branch: any) => !branch.isCurrent)
            .map((branch: any) => `@git:checkout ${branch.name}`);
          
          // 자주 사용하는 브랜치 우선 정렬 (main, develop, master)
          const priorityBranches = ['main', 'develop', 'master'];
          
          otherBranches.sort((a: string, b: string) => {
            const branchA = a.split(' ')[1];
            const branchB = b.split(' ')[1];
            
            const priorityA = priorityBranches.indexOf(branchA);
            const priorityB = priorityBranches.indexOf(branchB);
            
            if (priorityA !== -1 && priorityB !== -1) {
              return priorityA - priorityB;
            } else if (priorityA !== -1) {
              return -1;
            } else if (priorityB !== -1) {
              return 1;
            }
            
            return 0;
          });
          
          return otherBranches.length > 0 ? otherBranches : '@git:checkout';
        }
        
        case 'branch': {
          // 현재 브랜치 기반 새 브랜치 추천
          const currentBranch = status.branch;
          
          // feature/, bugfix/, hotfix/ 등의 접두사 추출
          const prefixMatch = currentBranch.match(/^(feature|bugfix|hotfix|release|support)\//);
          const prefix = prefixMatch ? prefixMatch[1] : 'feature';
          
          // 사용자 이름 또는 이니셜 추출 (Git 설정에서)
          let userName = '';
          try {
            const configResult = await gitClient.executeGitCommand(['config', 'user.name']);
            if (configResult.success && configResult.stdout) {
              userName = configResult.stdout.trim().split(' ')[0].toLowerCase();
              
              // 이름이 너무 길면 이니셜만 추출
              if (userName.length > 8) {
                userName = userName.charAt(0);
              }
            }
          } catch (error) {
            // Git 설정을 가져올 수 없는 경우 무시
          }
          
          // 현재 날짜 추가 (MMDD 형식)
          const date = new Date();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateStr = month + day;
          
          // 브랜치 이름 패턴 생성
          let branchPattern = '';
          if (userName) {
            branchPattern = `${prefix}/${userName}/${dateStr}/`;
          } else {
            branchPattern = `${prefix}/${dateStr}/`;
          }
          
          return `@git:branch ${branchPattern}`;
        }
        
        default:
          return `@git:${commandName}`;
      }
    } catch (error) {
      this.logger.error(`Git 명령어 생성 중 오류: ${error}`);
      return `@git:${commandName}`;
    }
  }
  
  /**
   * Jira 명령어 자동 생성
   * 현재 Jira 상태에 따라 최적화된 명령어 생성
   * 
   * @param commandName Jira 명령어 이름
   * @param context 컨텍스트 정보
   * @returns 완성된 Jira 명령어 또는 후보 목록
   */
  private async generateJiraCommand(commandName: string, context?: any): Promise<string | string[]> {
    // Jira 플러그인 가져오기
    const jiraPlugin = this.registry.getPlugin('jira');
    
    if (!jiraPlugin) {
      return `@jira:${commandName}`; // 플러그인을 찾을 수 없으면 기본 형식 반환
    }
    
    // Git 플러그인을 통해 Jira 이슈 정보 추출
    const gitPlugin = this.registry.getPlugin('git');
    
    try {
      // 명령어별 컨텍스트 처리
      switch (commandName) {
        case 'issue': {
          // Git 브랜치와 커밋 로그에서 Jira 이슈 키 추출
          if (gitPlugin) {
            const gitClient = (gitPlugin as any).client;
            if (gitClient) {
              // 실시간 Git 상태 정보 가져오기
              const gitContext = this.contextCache.get('git');
              const status = gitContext?.status || await gitClient.getStatus();
              const currentBranch = status.branch;
              
              this.logger.info(`현재 Git 브랜치: ${currentBranch}`);
              
              // 1. 먼저 브랜치 이름에서 추출 시도 (가장 직접적이고 신뢰할 수 있는 방법)
              // 다양한 브랜치 명명 규칙 지원 (feature/ABC-123-description, bugfix/ABC-123/fix-issue 등)
              const branchIssueKeyMatch = currentBranch.match(/[A-Z]+-\d+/);
              if (branchIssueKeyMatch) {
                const issueKey = branchIssueKeyMatch[0];
                this.logger.info(`브랜치 이름에서 이슈 키 발견: ${issueKey}`);
                
                // 캐시에 이슈 키 저장 (향후 성능 최적화용)
                if (!this.contextCache.has('jira')) {
                  this.contextCache.set('jira', {});
                }
                const jiraContext = this.contextCache.get('jira');
                jiraContext.lastIssueKey = issueKey;
                jiraContext.lastIssueKeySource = 'branch';
                jiraContext.lastUpdated = new Date();
                
                return `@jira:issue ${issueKey}`;
              }
              
              // 2. 캐시된 이슈 키가 있는지 확인 (성능 최적화)
              const jiraContext = this.contextCache.get('jira');
              if (jiraContext?.lastIssueKey && 
                  jiraContext.lastUpdated && 
                  (new Date().getTime() - jiraContext.lastUpdated.getTime() < 5 * 60 * 1000)) { // 5분 이내
                this.logger.info(`캐시된 이슈 키 사용: ${jiraContext.lastIssueKey} (출처: ${jiraContext.lastIssueKeySource})`);
                return `@jira:issue ${jiraContext.lastIssueKey}`;
              }
                
              // 3. 최근 커밋 로그 가져오기 (더 많은 커밋 로그 확인)
              try {
                const logResult = await gitClient.executeGitCommand(['log', '-n', '10', '--pretty=format:%s']);
                if (logResult.success && logResult.stdout) {
                  // 로그 메시지들
                  const recentCommits = logResult.stdout.split('\n');
                  this.logger.info(`최근 커밋 로그 ${recentCommits.length}개 조회됨`);
                  
                  // 4. LLM 서비스에 접근하기 위해 코어 서비스 가져오기
                  if (!this.coreService) {
                    this.logger.warn('코어 서비스 참조가 설정되지 않았습니다');
                  }
                  const llmService = this.coreService?.llmService;
                  
                  this.logger.debug('LLM 서비스 확인: ' + (llmService ? '사용 가능' : '사용 불가'));
                  
                  if (llmService) {
                    this.logger.info('LLM 기반 이슈 키 추출 시작');
                    
                    // 5. LLM에게 커밋 메시지에서 이슈 키 추출 요청 (개선된 시스템 프롬프트)
                    const issueKeyPrompt = {
                      messages: [
                        {
                          role: "system",
                          content: "당신은 Git 커밋 메시지에서 Jira 이슈 키를 추출하는 전문가입니다. Jira 이슈 키는 일반적으로 PROJ-123, ABC-456 같은 형식(대문자 프로젝트 코드, 하이픈, 숫자)입니다.\n\n" + 
                                   "팀마다 다양한 포맷을 사용합니다:\n" +
                                   "- [KEY-123] 메시지\n" +
                                   "- KEY-123: 메시지\n" +
                                   "- #KEY-123 메시지\n" +
                                   "- (KEY-123) 메시지\n" +
                                   "- fix(KEY-123): 메시지\n" +
                                   "- 'feat: 기능 구현 (KEY-123)'\n" +
                                   "- 'Implement feature KEY-123'\n\n" +
                                   "가장 최근의 관련 이슈 키 하나만 추출해 주세요. 전체 커밋 메시지를 읽고 가장 관련성이 높은 이슈 키를 선택하세요."
                        },
                        {
                          role: "user", 
                          content: `다음 Git 커밋 메시지 목록에서 가장 최근의 Jira 이슈 키만 하나 추출해주세요. 없으면 '없음'이라고 응답하세요. 응답은 이슈 키만 간결하게 작성해주세요.\n\n${recentCommits.join('\n')}`
                        }
                      ]
                    };
                    
                    // 디버깅을 위한 상세 로깅
                    this.logger.debug('LLM 요청 프롬프트:');
                    this.logger.debug(`시스템: ${issueKeyPrompt.messages[0].content.slice(0, 100)}...`);
                    this.logger.debug(`사용자: ${issueKeyPrompt.messages[1].content.slice(0, 100)}...`);
                    
                    // 6. 가벼운 모델로 API 호출 수행 (기본 모델로 폴백 지원)
                    try {
                      this.logger.info('LLM API 호출 시작');
                      
                      const llmStartTime = Date.now();
                      const response = await llmService.sendRequest({
                        model: "claude-3-haiku-20240307", // 가벼운 모델 사용
                        messages: issueKeyPrompt.messages,
                        temperature: 0,
                        max_tokens: 50
                      });
                      const llmDuration = Date.now() - llmStartTime;
                      
                      this.logger.info(`LLM 응답 수신 완료 (소요시간: ${llmDuration}ms)`);
                      
                      // 7. 응답에서 이슈 키 추출 (개선된 로직)
                      if (response && response.content) {
                        const content = response.content.trim();
                        this.logger.debug(`LLM 응답 내용: "${content}"`);
                        
                        // 응답이 '없음'이 아니면 이슈 키 추출 시도
                        if (content.toLowerCase() !== '없음') {
                          // 응답에서 이슈 키 형식 매칭 (정확한 패턴 매칭)
                          const llmExtractedKey = content.match(/[A-Z]+-\d+/);
                          
                          if (llmExtractedKey) {
                            const issueKey = llmExtractedKey[0];
                            this.logger.info(`LLM이 추출한 이슈 키: ${issueKey}`);
                            
                            // 캐시에 이슈 키 저장
                            if (!this.contextCache.has('jira')) {
                              this.contextCache.set('jira', {});
                            }
                            const jiraContext = this.contextCache.get('jira');
                            jiraContext.lastIssueKey = issueKey;
                            jiraContext.lastIssueKeySource = 'llm';
                            jiraContext.lastUpdated = new Date();
                            
                            return `@jira:issue ${issueKey}`;
                          } else {
                            this.logger.warn(`LLM 응답에서 유효한 이슈 키 패턴을 찾을 수 없음: "${content}"`);
                          }
                        } else {
                          this.logger.info('LLM 응답: 커밋 메시지에서 이슈 키를 찾을 수 없음');
                        }
                      } else {
                        this.logger.warn('LLM 응답이 비어있거나 유효하지 않음');
                      }
                    } catch (llmError) {
                      this.logger.error('LLM 호출 중 오류:', llmError);
                      this.logger.error('상세 오류 정보:', JSON.stringify(llmError, Object.getOwnPropertyNames(llmError)));
                      this.logger.info('휴리스틱 방식으로 대체 작동');
                    }
                  }
                  
                  // 8. 휴리스틱 방식 적용 (LLM 사용 불가 또는 실패시 폴백 메커니즘)
                  this.logger.info('휴리스틱 방식으로 이슈 키 검색 시작');
                  
                  // 향상된 패턴 목록 (다양한 팀 커밋 규칙 지원)
                  const patterns = [
                    /\[([A-Z]+-\d+)\]/,      // [KEY-123]
                    /([A-Z]+-\d+):/,         // KEY-123:
                    /#([A-Z]+-\d+)/,         // #KEY-123
                    /\(([A-Z]+-\d+)\)/,      // (KEY-123)
                    /fix\(([A-Z]+-\d+)\)/,   // fix(KEY-123)
                    /feat\(([A-Z]+-\d+)\)/,  // feat(KEY-123)
                    /feat\s*:\s*\(([A-Z]+-\d+)\)/, // feat: (KEY-123)
                    /chore\(([A-Z]+-\d+)\)/, // chore(KEY-123)
                    /docs\(([A-Z]+-\d+)\)/,  // docs(KEY-123)
                    /test\(([A-Z]+-\d+)\)/,  // test(KEY-123)
                    /refactor\(([A-Z]+-\d+)\)/, // refactor(KEY-123)
                    /style\(([A-Z]+-\d+)\)/, // style(KEY-123)
                    /perf\(([A-Z]+-\d+)\)/,  // perf(KEY-123)
                    /build\(([A-Z]+-\d+)\)/, // build(KEY-123)
                    /ci\(([A-Z]+-\d+)\)/,    // ci(KEY-123)
                    /^([A-Z]+-\d+)$/,        // KEY-123 (단독 이슈 키)
                    /([A-Z]+-\d+)/           // 기타 모든 형태 (가장 마지막에 체크)
                  ];
                  
                  for (const commit of recentCommits) {
                    for (const pattern of patterns) {
                      const match = commit.match(pattern);
                      if (match && match[1]) {
                        const issueKey = match[1];
                        this.logger.info(`휴리스틱 방식으로 이슈 키 발견: ${issueKey} (패턴: ${pattern})`);
                        
                        // 캐시에 이슈 키 저장
                        if (!this.contextCache.has('jira')) {
                          this.contextCache.set('jira', {});
                        }
                        const jiraContext = this.contextCache.get('jira');
                        jiraContext.lastIssueKey = issueKey;
                        jiraContext.lastIssueKeySource = 'regex';
                        jiraContext.lastUpdated = new Date();
                        
                        return `@jira:issue ${issueKey}`;
                      }
                    }
                  }
                  
                  this.logger.info('휴리스틱 방식으로도 이슈 키를 찾지 못함');
                }
              } catch (logError) {
                this.logger.error('Git 로그 가져오기 실패:', logError);
                this.logger.error('상세 오류 정보:', JSON.stringify(logError, Object.getOwnPropertyNames(logError)));
              }
            }
          }
          
          // 최근 이슈 목록 추천 (향후 구현)
          this.logger.info('이슈 키를 찾을 수 없어 빈 명령어 반환');
          return '@jira:issue ';
        }
        
        case 'create': {
          // Git 워크스페이스에서 프로젝트 코드 추출
          let projectCode = 'PROJ';
          
          if (gitPlugin) {
            const gitClient = (gitPlugin as any).client;
            if (gitClient) {
              try {
                // 디렉토리 또는 저장소 이름에서 프로젝트 코드 추측
                const remoteResult = await gitClient.executeGitCommand(['remote', 'get-url', 'origin']);
                if (remoteResult.success && remoteResult.stdout) {
                  // 저장소 URL에서 프로젝트 이름 추출
                  const repoName = remoteResult.stdout.trim().split('/').pop()?.replace('.git', '');
                  if (repoName) {
                    // 프로젝트 코드 형식으로 변환 (대문자, 특수문자 제거)
                    projectCode = repoName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    if (projectCode.length > 10) {
                      projectCode = projectCode.substring(0, 10);
                    }
                  }
                }
              } catch (error) {
                // Git 명령 실행 중 오류 발생 시 기본값 사용
              }
            }
          }
          
          return `@jira:create ${projectCode} "제목" "설명" --type=Task`;
        }
        
        case 'search': {
          // 자주 사용하는 검색 쿼리 제안
          const queries = [
            `@jira:search "assignee = currentUser()"`,
            `@jira:search "project = PROJ AND status = Open"`,
            `@jira:search "created >= -7d"`,
          ];
          
          return queries;
        }
        
        default:
          return `@jira:${commandName}`;
      }
    } catch (error) {
      this.logger.error(`Jira 명령어 생성 중 오류: ${error}`);
      return `@jira:${commandName}`;
    }
  }
  
  /**
   * SWDP 명령어 자동 생성
   * 현재 SWDP 상태에 따라 최적화된 명령어 생성
   * 
   * @param commandName SWDP 명령어 이름
   * @param context 컨텍스트 정보
   * @returns 완성된 SWDP 명령어 또는 후보 목록
   */
  private async generateSwdpCommand(commandName: string, context?: any): Promise<string | string[]> {
    // SWDP 플러그인 가져오기
    const swdpPlugin = this.registry.getPlugin('swdp');
    
    if (!swdpPlugin) {
      return `@swdp:${commandName}`; // 플러그인을 찾을 수 없으면 기본 형식 반환
    }
    
    try {
      // 명령어별 컨텍스트 처리
      switch (commandName) {
        case 'build': {
          // 최근 Git 변경 사항 기반 빌드 유형 추천
          const gitPlugin = this.registry.getPlugin('git');
          
          if (gitPlugin) {
            const gitClient = (gitPlugin as any).client;
            if (gitClient) {
              const gitContext = this.contextCache.get('git');
              const status = gitContext?.status || await gitClient.getStatus();
              
              // 현재 브랜치에 따른 빌드 유형 결정
              if (status.branch === 'main' || status.branch === 'master') {
                return '@swdp:build all';
              } else if (status.branch.startsWith('feature/')) {
                return '@swdp:build local --watch';
              } else if (status.branch.startsWith('release/')) {
                return '@swdp:build layer';
              }
            }
          }
          
          // 기본 빌드 옵션 제안
          return [
            '@swdp:build local',
            '@swdp:build local --watch',
            '@swdp:build layer',
            '@swdp:build all'
          ];
        }
        
        case 'build-status': {
          // 최근 빌드 ID 가져오기 (캐싱/저장된 값 활용)
          const swdpContext = this.contextCache.get('swdp') || {};
          const recentBuildId = swdpContext.recentBuildId || '12345'; // 기본값
          
          return `@swdp:build:status ${recentBuildId}`;
        }
        
        case 'test': {
          // 자주 사용하는 테스트 유형 제안
          return [
            '@swdp:test unit',
            '@swdp:test integration',
            '@swdp:test system'
          ];
        }
        
        default:
          return `@swdp:${commandName}`;
      }
    } catch (error) {
      this.logger.error(`SWDP 명령어 생성 중 오류: ${error}`);
      return `@swdp:${commandName}`;
    }
  }
  
  /**
   * Pocket 명령어 자동 생성
   * 현재 Pocket 상태에 따라 최적화된 명령어 생성
   * 
   * @param commandName Pocket 명령어 이름
   * @param context 컨텍스트 정보
   * @returns 완성된 Pocket 명령어 또는 후보 목록
   */
  private async generatePocketCommand(commandName: string, context?: any): Promise<string | string[]> {
    // Pocket 플러그인 가져오기
    const pocketPlugin = this.registry.getPlugin('pocket');
    
    if (!pocketPlugin) {
      return `@pocket:${commandName}`; // 플러그인을 찾을 수 없으면 기본 형식 반환
    }
    
    try {
      // 명령어별 컨텍스트 처리
      switch (commandName) {
        case 'ls': {
          // 자주 사용하는 디렉토리 추천
          return [
            '@pocket:ls docs/',
            '@pocket:ls config/',
            '@pocket:ls reports/',
            '@pocket:ls '
          ];
        }
        
        case 'load': {
          // 현재 작업 컨텍스트에 관련된 파일 추천
          // 예: Git 저장소 이름과 관련된 파일
          const gitPlugin = this.registry.getPlugin('git');
          
          if (gitPlugin) {
            const gitClient = (gitPlugin as any).client;
            if (gitClient) {
              try {
                const remoteResult = await gitClient.executeGitCommand(['remote', 'get-url', 'origin']);
                if (remoteResult.success && remoteResult.stdout) {
                  const repoName = remoteResult.stdout.trim().split('/').pop()?.replace('.git', '');
                  if (repoName) {
                    return `@pocket:load ${repoName}.json`;
                  }
                }
              } catch (error) {
                // Git 명령 실행 중 오류 발생 시 기본값 사용
              }
            }
          }
          
          // 기본 파일 추천
          return [
            '@pocket:load config.json',
            '@pocket:load README.md',
            '@pocket:load settings.json'
          ];
        }
        
        case 'search': {
          // 현재 Git 저장소 이름 기반 검색어 추천
          const gitPlugin = this.registry.getPlugin('git');
          
          if (gitPlugin) {
            const gitClient = (gitPlugin as any).client;
            if (gitClient) {
              try {
                const remoteResult = await gitClient.executeGitCommand(['remote', 'get-url', 'origin']);
                if (remoteResult.success && remoteResult.stdout) {
                  const repoName = remoteResult.stdout.trim().split('/').pop()?.replace('.git', '');
                  if (repoName) {
                    return `@pocket:search ${repoName}`;
                  }
                }
              } catch (error) {
                // Git 명령 실행 중 오류 발생 시 기본값 사용
              }
            }
          }
          
          return '@pocket:search ';
        }
        
        default:
          return `@pocket:${commandName}`;
      }
    } catch (error) {
      this.logger.error(`Pocket 명령어 생성 중 오류: ${error}`);
      return `@pocket:${commandName}`;
    }
  }
  
  /**
   * 명령어 Registry 서비스 가져오기
   * @returns 명령어 Registry 서비스
   */
  getCommandRegistry(): CommandRegistryService {
    return this.registry;
  }
  
  /**
   * 명령어 Executor 서비스 가져오기
   * @returns 명령어 Executor 서비스
   */
  getCommandExecutor(): CommandExecutorService {
    return this.executor;
  }
  
  /**
   * 현재 컨텍스트 캐시 상태 가져오기
   * @returns 컨텍스트 캐시 맵
   */
  getContextCache(): Map<string, any> {
    return this.contextCache;
  }
  
  /**
   * 사용자 선호도 데이터 업데이트
   * @param pluginId 플러그인 ID
   * @param commandName 명령어 이름
   * @param args 사용된 인자
   */
  updatePreference(pluginId: string, commandName: string, args: any[]): void {
    if (!this.preferenceCache.has(pluginId)) {
      this.preferenceCache.set(pluginId, new Map());
    }
    
    const pluginPrefs = this.preferenceCache.get(pluginId)!;
    
    if (!pluginPrefs.has(commandName)) {
      pluginPrefs.set(commandName, []);
    }
    
    const cmdPrefs = pluginPrefs.get(commandName)!;
    
    // 최근 사용한 인자 추가 (최대 5개 유지)
    cmdPrefs.unshift(args);
    if (cmdPrefs.length > 5) {
      cmdPrefs.pop();
    }
  }
}