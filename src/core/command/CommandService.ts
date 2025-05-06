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
  
  private contextCache: Map<string, any> = new Map();
  private preferenceCache: Map<string, Map<string, any[]>> = new Map();
  
  /**
   * CommandService 생성자
   * @param configLoader 설정 로더 서비스
   * @param coreService 코어 서비스 인스턴스
   */
  constructor(
    configLoader: IConfigLoader,
    private readonly coreService: ICoreService
  ) {
    super();
    this.logger = new LoggerService();
    
    const pluginRegistry = new PluginRegistryService(configLoader);
    
    this.registry = new CommandRegistryService(pluginRegistry);
    this.executor = new CommandExecutorService(this.registry, pluginRegistry);
    this.parser = new CommandParserService();
    
    this.logger.info('CommandService 초기화됨');
    
    setInterval(() => this.refreshAllContexts(), 30000); 
    
    // CoreService는 이제 필수 의존성으로 주입됩니다
    this.logger.info('생성자 기반 의존성 주입으로 코어 서비스 참조 설정됨');
  }
  
  
  
  /**
   * 초기화
   */
  async initialize(): Promise<void> {
    
    if (typeof this.registry.initialize === 'function') {
      await this.registry.initialize();
    }
    
    
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
      
      
      const parsedCommand = this.parser.parse(command);
      
      if (!parsedCommand) {
        return {
          content: `명령어 파싱 실패: ${command}`,
          error: true
        };
      }
      
      
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
      
      
      const status = await gitClient.getStatus();
      
      
      const branches = await gitClient.getBranches(true);
      
      
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
      
      
      
      
      
      this.contextCache.set('jira', {
        
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
      
      
      const parts = baseCommand.split(':');
      const pluginPrefix = parts.length > 0 ? parts[0] : '';
      const commandName = parts.length > 1 ? parts[1] : '';
      
      if (!pluginPrefix || !commandName) {
        return baseCommand;
      }
      
      const pluginId = pluginPrefix.replace('@', '');
      
      
      const command = this.registry.findCommand(pluginId, commandName);
      
      if (!command) {
        return baseCommand; 
      }
      
      
      if (pluginId === 'git') {
        return this.generateGitCommand(commandName, context);
      } else if (pluginId === 'jira') {
        return this.generateJiraCommand(commandName, context);
      } else if (pluginId === 'swdp') {
        return this.generateSwdpCommand(commandName, context);
      } else if (pluginId === 'pocket') {
        return this.generatePocketCommand(commandName, context);
      }
      
      
      return baseCommand;
    } catch (error) {
      this.logger.error(`컨텍스트 명령어 생성 중 오류: ${error}`);
      return baseCommand; 
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
    
    const gitPlugin = this.registry.getPlugin('git');
    
    if (!gitPlugin) {
      return `@git:${commandName}`; 
    }
    
    
    const gitClient = (gitPlugin as any).client;
    
    if (!gitClient) {
      return `@git:${commandName}`;
    }
    
    try {
      
      const gitContext = this.contextCache.get('git') || {};
      const status = gitContext.status || await gitClient.getStatus();
      const branches = gitContext.branches || await gitClient.getBranches(true);
      
      
      switch (commandName) {
        case 'commit': {
          
          if (!status.changes || status.changes.length === 0) {
            return '@git:commit "변경 사항 없음" --empty';
          }
          
          
          const fileNames = status.changes.map((change: any) => change.path).join(', ');
          const suggestedMessage = `${fileNames}의 변경 사항`;
          
          return `@git:commit "${suggestedMessage}"`;
        }
        
        case 'push': {
          
          const currentBranch = status.branch;
          
          
          if (status.tracking) {
            return `@git:push origin ${currentBranch}`;
          } else {
            
            return `@git:push origin ${currentBranch} --set-upstream`;
          }
        }
        
        case 'checkout': {
          
          const otherBranches = branches
            .filter((branch: any) => !branch.isCurrent)
            .map((branch: any) => `@git:checkout ${branch.name}`);
          
          
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
          
          const currentBranch = status.branch;
          
          
          const prefixMatch = currentBranch.match(/^(feature|bugfix|hotfix|release|support)\//);
          const prefix = prefixMatch ? prefixMatch[1] : 'feature';
          
          
          let userName = '';
          try {
            const configResult = await gitClient.executeGitCommand(['config', 'user.name']);
            if (configResult.success && configResult.stdout) {
              userName = configResult.stdout.trim().split(' ')[0].toLowerCase();
              
              
              if (userName.length > 8) {
                userName = userName.charAt(0);
              }
            }
          } catch (error) {
            
          }
          
          
          const date = new Date();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateStr = month + day;
          
          
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
    
    const jiraPlugin = this.registry.getPlugin('jira');
    
    if (!jiraPlugin) {
      return `@jira:${commandName}`; 
    }
    
    
    const gitPlugin = this.registry.getPlugin('git');
    
    try {
      
      switch (commandName) {
        case 'issue': {
          
          if (gitPlugin) {
            const gitClient = (gitPlugin as any).client;
            if (gitClient) {
              
              const gitContext = this.contextCache.get('git');
              const status = gitContext?.status || await gitClient.getStatus();
              const currentBranch = status.branch;
              
              this.logger.info(`현재 Git 브랜치: ${currentBranch}`);
              
              
              
              const branchIssueKeyMatch = currentBranch.match(/[A-Z]+-\d+/);
              if (branchIssueKeyMatch) {
                const issueKey = branchIssueKeyMatch[0];
                this.logger.info(`브랜치 이름에서 이슈 키 발견: ${issueKey}`);
                
                
                if (!this.contextCache.has('jira')) {
                  this.contextCache.set('jira', {});
                }
                const jiraContext = this.contextCache.get('jira');
                jiraContext.lastIssueKey = issueKey;
                jiraContext.lastIssueKeySource = 'branch';
                jiraContext.lastUpdated = new Date();
                
                return `@jira:issue ${issueKey}`;
              }
              
              
              const jiraContext = this.contextCache.get('jira');
              if (jiraContext?.lastIssueKey && 
                  jiraContext.lastUpdated && 
                  (new Date().getTime() - jiraContext.lastUpdated.getTime() < 5 * 60 * 1000)) { 
                this.logger.info(`캐시된 이슈 키 사용: ${jiraContext.lastIssueKey} (출처: ${jiraContext.lastIssueKeySource})`);
                return `@jira:issue ${jiraContext.lastIssueKey}`;
              }
                
              
              try {
                const logResult = await gitClient.executeGitCommand(['log', '-n', '10', '--pretty=format:%s']);
                if (logResult.success && logResult.stdout) {
                  
                  const recentCommits = logResult.stdout.split('\n');
                  this.logger.info(`최근 커밋 로그 ${recentCommits.length}개 조회됨`);
                  
                  const llmService = this.coreService?.llmService;
                  
                  this.logger.debug('LLM 서비스 확인: ' + (llmService ? '사용 가능' : '사용 불가'));
                  
                  if (llmService) {
                    this.logger.info('LLM 기반 이슈 키 추출 시작');
                    
                    
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
                    
                    
                    this.logger.debug('LLM 요청 프롬프트:');
                    this.logger.debug(`시스템: ${issueKeyPrompt.messages[0].content.slice(0, 100)}...`);
                    this.logger.debug(`사용자: ${issueKeyPrompt.messages[1].content.slice(0, 100)}...`);
                    
                    
                    try {
                      this.logger.info('LLM API 호출 시작');
                      
                      const llmStartTime = Date.now();
                      const response = await llmService.sendRequest({
                        model: "claude-3-haiku-20240307", 
                        messages: issueKeyPrompt.messages,
                        temperature: 0,
                        max_tokens: 50
                      });
                      const llmDuration = Date.now() - llmStartTime;
                      
                      this.logger.info(`LLM 응답 수신 완료 (소요시간: ${llmDuration}ms)`);
                      
                      
                      if (response && response.content) {
                        const content = response.content.trim();
                        this.logger.debug(`LLM 응답 내용: "${content}"`);
                        
                        
                        if (content.toLowerCase() !== '없음') {
                          
                          const llmExtractedKey = content.match(/[A-Z]+-\d+/);
                          
                          if (llmExtractedKey) {
                            const issueKey = llmExtractedKey[0];
                            this.logger.info(`LLM이 추출한 이슈 키: ${issueKey}`);
                            
                            
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
                  
                  
                  this.logger.info('휴리스틱 방식으로 이슈 키 검색 시작');
                  
                  
                  const patterns = [
                    /\[([A-Z]+-\d+)\]/,      
                    /([A-Z]+-\d+):/,         
                    /#([A-Z]+-\d+)/,         
                    /\(([A-Z]+-\d+)\)/,      
                    /fix\(([A-Z]+-\d+)\)/,   
                    /feat\(([A-Z]+-\d+)\)/,  
                    /feat\s*:\s*\(([A-Z]+-\d+)\)/, 
                    /chore\(([A-Z]+-\d+)\)/, 
                    /docs\(([A-Z]+-\d+)\)/,  
                    /test\(([A-Z]+-\d+)\)/,  
                    /refactor\(([A-Z]+-\d+)\)/, 
                    /style\(([A-Z]+-\d+)\)/, 
                    /perf\(([A-Z]+-\d+)\)/,  
                    /build\(([A-Z]+-\d+)\)/, 
                    /ci\(([A-Z]+-\d+)\)/,    
                    /^([A-Z]+-\d+)$/,        
                    /([A-Z]+-\d+)/           
                  ];
                  
                  for (const commit of recentCommits) {
                    for (const pattern of patterns) {
                      const match = commit.match(pattern);
                      if (match && match[1]) {
                        const issueKey = match[1];
                        this.logger.info(`휴리스틱 방식으로 이슈 키 발견: ${issueKey} (패턴: ${pattern})`);
                        
                        
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
          
          
          this.logger.info('이슈 키를 찾을 수 없어 빈 명령어 반환');
          return '@jira:issue ';
        }
        
        case 'create': {
          
          let projectCode = 'PROJ';
          
          if (gitPlugin) {
            const gitClient = (gitPlugin as any).client;
            if (gitClient) {
              try {
                
                const remoteResult = await gitClient.executeGitCommand(['remote', 'get-url', 'origin']);
                if (remoteResult.success && remoteResult.stdout) {
                  
                  const repoName = remoteResult.stdout.trim().split('/').pop()?.replace('.git', '');
                  if (repoName) {
                    
                    projectCode = repoName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    if (projectCode.length > 10) {
                      projectCode = projectCode.substring(0, 10);
                    }
                  }
                }
              } catch (error) {
                
              }
            }
          }
          
          return `@jira:create ${projectCode} "제목" "설명" --type=Task`;
        }
        
        case 'search': {
          
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
    
    const swdpPlugin = this.registry.getPlugin('swdp');
    
    if (!swdpPlugin) {
      return `@swdp:${commandName}`; 
    }
    
    try {
      
      switch (commandName) {
        case 'build': {
          
          const gitPlugin = this.registry.getPlugin('git');
          
          if (gitPlugin) {
            const gitClient = (gitPlugin as any).client;
            if (gitClient) {
              const gitContext = this.contextCache.get('git');
              const status = gitContext?.status || await gitClient.getStatus();
              
              
              if (status.branch === 'main' || status.branch === 'master') {
                return '@swdp:build all';
              } else if (status.branch.startsWith('feature/')) {
                return '@swdp:build local --watch';
              } else if (status.branch.startsWith('release/')) {
                return '@swdp:build layer';
              }
            }
          }
          
          
          return [
            '@swdp:build local',
            '@swdp:build local --watch',
            '@swdp:build layer',
            '@swdp:build all'
          ];
        }
        
        case 'build-status': {
          
          const swdpContext = this.contextCache.get('swdp') || {};
          const recentBuildId = swdpContext.recentBuildId || '12345'; 
          
          return `@swdp:build:status ${recentBuildId}`;
        }
        
        case 'test': {
          
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
    
    const pocketPlugin = this.registry.getPlugin('pocket');
    
    if (!pocketPlugin) {
      return `@pocket:${commandName}`; 
    }
    
    try {
      
      switch (commandName) {
        case 'ls': {
          
          return [
            '@pocket:ls docs/',
            '@pocket:ls config/',
            '@pocket:ls reports/',
            '@pocket:ls '
          ];
        }
        
        case 'load': {
          
          
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
                
              }
            }
          }
          
          
          return [
            '@pocket:load config.json',
            '@pocket:load README.md',
            '@pocket:load settings.json'
          ];
        }
        
        case 'search': {
          
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
    
    
    cmdPrefs.unshift(args);
    if (cmdPrefs.length > 5) {
      cmdPrefs.pop();
    }
  }
}