/**
 * SWDP 플러그인 서비스
 * 
 * SWDP Agent를 통해 DevOps 포털 기능에 접근하는 내부 플러그인
 * APE Core 연동을 통한 빌드, 테스트, 문서 관리 지원
 */

import { PluginBaseService } from '../../../core/plugin-system/PluginBaseService';
import { PluginCommand } from '../../../types/PluginTypes';
import { CommandType, CommandPrefix } from '../../../types/CommandTypes';
import { IConfigLoader } from '../../../types/ConfigTypes';
import { SwdpClientService, SwdpBuildType, SwdpBuildOptions, SwdpTestOptions, SwdpTROptions } from './SwdpClientService';
import { SwdpDomainService } from '../../../core/domain/SwdpDomainService';
import { SwdpWorkflowService } from '../../../core/workflow/SwdpWorkflowService';

/**
 * SWDP 플러그인 서비스 클래스
 * SWDP를 통한 DevOps 포털 기능 제공
 */
export class SwdpPluginService extends PluginBaseService {
  /**
   * 플러그인 ID
   */
  id = 'swdp';
  
  /**
   * 플러그인 이름
   */
  name = 'SWDP 포털 통합';
  
  /**
   * 플러그인 도메인 가져오기
   * @returns 플러그인 도메인
   */
  getDomain(): string {
    return 'swdp';
  }
  
  /**
   * SWDP 클라이언트 서비스
   */
  private swdpClient?: SwdpClientService;
  
  /**
   * 초기화 완료 여부
   */
  private initialized: boolean = false;
  
  /**
   * 현재 프로젝트 코드
   */
  private currentProject?: string;
  
  /**
   * SwdpPluginService 생성자
   * @param configLoader 설정 로더
   * @param swdpDomainService SWDP 도메인 서비스 (선택적)
   * @param swdpWorkflowService SWDP 워크플로우 서비스 (선택적)
   * @param swdpNaturalLanguageService SWDP 자연어 처리 서비스 (선택적)
   */
  constructor(
    configLoader: IConfigLoader,
    private readonly swdpDomainService?: SwdpDomainService,
    private readonly swdpWorkflowService?: SwdpWorkflowService,
    private readonly swdpNaturalLanguageService?: SwdpNaturalLanguageService
  ) {
    super(configLoader);
    
    
    this.config = {
      enabled: true
    };
    
    
    this.registerCommands();
  }
  
  /**
   * 플러그인 초기화
   */
  override async initialize(): Promise<void> {
    try {
      
      const pluginConfig = this.configLoader?.getPluginConfig();
      
      
      const swdpConfig = pluginConfig && typeof pluginConfig === 'object' && 'swdp' in pluginConfig 
        ? (pluginConfig as Record<string, any>)['swdp'] 
        : null;
      
      
      const apeCoreUrl = swdpConfig?.apeCoreUrl || 'http://localhost:8080';
      
      
      const bypassSsl = swdpConfig?.bypassSsl !== false;
      
      
      this.swdpClient = new SwdpClientService(apeCoreUrl, bypassSsl);
      
      
      const credentials = {
        userId: swdpConfig?.userId,
        token: swdpConfig?.token,
        gitUsername: swdpConfig?.gitUsername,
        gitEmail: swdpConfig?.gitEmail
      };
      
      
      if (!credentials.gitUsername || !credentials.gitEmail) {
        try {
          
          
          if (!credentials.gitUsername) credentials.gitUsername = 'unknown';
          if (!credentials.gitEmail) credentials.gitEmail = 'unknown@example.com';
        } catch (error) {
          console.warn('Git 사용자 정보를 가져오는데 실패했습니다:', error);
        }
      }
      
      
      await this.swdpClient.initialize(credentials);
      
      
      if (swdpConfig?.currentProject) {
        this.currentProject = swdpConfig.currentProject;
        console.log(`현재 프로젝트가 설정되었습니다: ${this.currentProject}`);
      }
      
      this.initialized = true;
      console.log('SWDP 플러그인 초기화 완료');
    } catch (error) {
      console.error('SWDP 플러그인 초기화 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 초기화 상태 확인
   * @returns 초기화 완료 여부
   */
  override isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * 클라이언트 인스턴스 가져오기
   * @returns SWDP 클라이언트
   */
  private getClient(): SwdpClientService {
    if (!this.swdpClient || !this.initialized) {
      throw new Error('SWDP 클라이언트가 초기화되지 않았습니다.');
    }
    return this.swdpClient;
  }
  
  /**
   * 명령어 등록
   * 
   * @param customCommands 외부에서 추가할 명령어 (사용하지 않음)
   * @returns 등록 성공 여부
   */
  protected override registerCommands(customCommands?: PluginCommand[]): boolean {
    this.commands = [
      
      {
        id: 'projects',
        name: 'projects',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '프로젝트 목록 조회',
        syntax: '@swdp:projects',
        examples: ['@swdp:projects'],
        execute: async () => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            const result = await this.getClient().getProjects();
            
            return {
              content: `프로젝트 목록:\n${this.formatProjects(result.projects)}`,
              data: result,
              type: 'info'
            };
          } catch (error) {
            return {
              content: `프로젝트 목록 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      },
      
      
      {
        id: 'project',
        name: 'project',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '프로젝트 세부 정보 조회',
        syntax: '@swdp:project <project_code>',
        examples: ['@swdp:project PRJ001'],
        execute: async (args) => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            if (args.length === 0) {
              throw new Error('프로젝트 코드가 필요합니다.');
            }
            
            const projectCode = args[0].toString();
            const result = await this.getClient().getProjectDetails(projectCode);
            
            return {
              content: `프로젝트 세부 정보:\n${this.formatProjectDetails(result.project)}`,
              data: result,
              type: 'info'
            };
          } catch (error) {
            return {
              content: `프로젝트 세부 정보 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      },
      
      
      {
        id: 'set-project',
        name: 'set-project',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '현재 작업 프로젝트 설정',
        syntax: '@swdp:set-project <project_code>',
        examples: ['@swdp:set-project PRJ001'],
        execute: async (args) => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            if (args.length === 0) {
              throw new Error('프로젝트 코드가 필요합니다.');
            }
            
            const projectCode = args[0].toString();
            const result = await this.getClient().setCurrentProject(projectCode);
            
            
            this.currentProject = projectCode;
            
            return {
              content: `현재 프로젝트가 '${projectCode}'(으)로 설정되었습니다.`,
              data: result,
              type: 'success'
            };
          } catch (error) {
            return {
              content: `프로젝트 설정 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      },
      
      
      {
        id: 'tasks',
        name: 'tasks',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '작업 목록 조회',
        syntax: '@swdp:tasks [project_code]',
        examples: ['@swdp:tasks', '@swdp:tasks PRJ001'],
        execute: async (args) => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            const projectCode = args.length > 0 ? args[0].toString() : this.currentProject;
            
            if (!projectCode) {
              throw new Error('프로젝트가 설정되지 않았습니다. @swdp:set-project 명령어로 프로젝트를 설정하거나 프로젝트 코드를 지정하세요.');
            }
            
            const result = await this.getClient().getTasks(projectCode);
            
            return {
              content: `작업 목록 (${projectCode}):\n${this.formatTasks(result.tasks)}`,
              data: result,
              type: 'info'
            };
          } catch (error) {
            return {
              content: `작업 목록 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      },
      
      
      {
        id: 'task',
        name: 'task',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '작업 세부 정보 조회',
        syntax: '@swdp:task <task_id>',
        examples: ['@swdp:task TASK001'],
        execute: async (args) => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            if (args.length === 0) {
              throw new Error('작업 ID가 필요합니다.');
            }
            
            const taskId = args[0].toString();
            const result = await this.getClient().getTaskDetails(taskId);
            
            return {
              content: `작업 세부 정보:\n${this.formatTaskDetails(result.task)}`,
              data: result,
              type: 'info'
            };
          } catch (error) {
            return {
              content: `작업 세부 정보 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      },
      
      
      {
        id: 'create-task',
        name: 'create-task',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '새 작업 생성',
        syntax: '@swdp:create-task <title> <description> [project_code]',
        examples: ['@swdp:create-task "새 기능 개발" "사용자 인증 기능 구현" PRJ001'],
        execute: async (args) => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            if (args.length < 2) {
              throw new Error('작업 제목과 설명이 필요합니다.');
            }
            
            const title = args[0].toString();
            const description = args[1].toString();
            const projectCode = args.length > 2 ? args[2].toString() : this.currentProject;
            
            if (!projectCode) {
              throw new Error('프로젝트가 설정되지 않았습니다. @swdp:set-project 명령어로 프로젝트를 설정하거나 프로젝트 코드를 지정하세요.');
            }
            
            const result = await this.getClient().createTask(title, description, projectCode);
            
            return {
              content: `작업이 생성되었습니다. 작업 ID: ${result.taskId}`,
              data: result,
              type: 'success'
            };
          } catch (error) {
            return {
              content: `작업 생성 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      },
      
      
      {
        id: 'update-task',
        name: 'update-task',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '작업 상태 업데이트',
        syntax: '@swdp:update-task <task_id> <status>',
        examples: ['@swdp:update-task TASK001 in_progress', '@swdp:update-task TASK001 completed'],
        execute: async (args) => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            if (args.length < 2) {
              throw new Error('작업 ID와 상태가 필요합니다.');
            }
            
            const taskId = args[0].toString();
            const status = args[1].toString();
            
            const result = await this.getClient().updateTaskStatus(taskId, status);
            
            return {
              content: `작업 상태가 '${status}'(으)로 업데이트되었습니다. 작업 ID: ${taskId}`,
              data: result,
              type: 'success'
            };
          } catch (error) {
            return {
              content: `작업 상태 업데이트 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      },
      
      
      {
        id: 'build',
        name: 'build',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: 'SWDP 빌드 시작',
        syntax: '@swdp:build [type] [--watch] [--pr]',
        examples: ['@swdp:build local', '@swdp:build layer --watch', '@swdp:build all --pr'],
        execute: async (args) => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            
            let buildType = SwdpBuildType.LOCAL;
            if (args.length > 0) {
              const type = args[0].toString().toLowerCase();
              if (Object.values(SwdpBuildType).includes(type as SwdpBuildType)) {
                buildType = type as SwdpBuildType;
              }
            }
            
            
            const options: SwdpBuildOptions = {
              type: buildType,
              watchMode: args.includes('--watch'),
              createPr: args.includes('--pr'),
              params: {}
            };
            
            
            for (let i = 0; i < args.length; i++) {
              const arg = args[i];
              if (typeof arg === 'string' && arg.startsWith('--') && arg.includes('=')) {
                const [key, value] = arg.substring(2).split('=');
                if (key && value) {
                  options.params![key] = value;
                }
              }
            }
            
            
            const result = await this.getClient().startBuild(options);
            
            return {
              content: `빌드가 시작되었습니다. 빌드 ID: ${result.buildId}`,
              data: result,
              type: 'success'
            };
          } catch (error) {
            return {
              content: `빌드 시작 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      },
      
      
      {
        id: 'build-status',
        name: 'build:status',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: 'SWDP 빌드 상태 확인',
        syntax: '@swdp:build:status [buildId]',
        examples: ['@swdp:build:status', '@swdp:build:status 12345'],
        execute: async (args) => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            const buildId = args.length > 0 ? args[0].toString() : undefined;
            const status = await this.getClient().getBuildStatus(buildId);
            
            return {
              content: `빌드 상태: ${status.status}`,
              data: status,
              type: 'info'
            };
          } catch (error) {
            return {
              content: `빌드 상태 확인 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      },
      
      
      {
        id: 'documents',
        name: 'documents',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '문서 목록 조회',
        syntax: '@swdp:documents [project_code]',
        examples: ['@swdp:documents', '@swdp:documents PRJ001'],
        execute: async (args) => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            const projectCode = args.length > 0 ? args[0].toString() : this.currentProject;
            
            if (!projectCode) {
              throw new Error('프로젝트가 설정되지 않았습니다. @swdp:set-project 명령어로 프로젝트를 설정하거나 프로젝트 코드를 지정하세요.');
            }
            
            const result = await this.getClient().getDocuments(projectCode);
            
            return {
              content: `문서 목록 (${projectCode}):\n${this.formatDocuments(result.documents)}`,
              data: result,
              type: 'info'
            };
          } catch (error) {
            return {
              content: `문서 목록 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      },
      
      
      {
        id: 'document',
        name: 'document',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '문서 세부 정보 조회',
        syntax: '@swdp:document <doc_id>',
        examples: ['@swdp:document DOC001'],
        execute: async (args) => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            if (args.length === 0) {
              throw new Error('문서 ID가 필요합니다.');
            }
            
            const docId = args[0].toString();
            const result = await this.getClient().getDocumentDetails(docId);
            
            return {
              content: `문서 세부 정보:\n${this.formatDocumentDetails(result.document)}`,
              data: result,
              type: 'info'
            };
          } catch (error) {
            return {
              content: `문서 세부 정보 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      },
      
      
      {
        id: 'create-document',
        name: 'create-document',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '새 문서 생성',
        syntax: '@swdp:create-document <title> <type> <content> [project_code]',
        examples: ['@swdp:create-document "API 문서" "technical" "# API 문서\\n\\n이 문서는..." PRJ001'],
        execute: async (args) => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            if (args.length < 3) {
              throw new Error('문서 제목, 유형, 내용이 필요합니다.');
            }
            
            const title = args[0].toString();
            const type = args[1].toString();
            const content = args[2].toString();
            const projectCode = args.length > 3 ? args[3].toString() : this.currentProject;
            
            if (!projectCode) {
              throw new Error('프로젝트가 설정되지 않았습니다. @swdp:set-project 명령어로 프로젝트를 설정하거나 프로젝트 코드를 지정하세요.');
            }
            
            const result = await this.getClient().createDocument(title, type, content, projectCode);
            
            return {
              content: `문서가 생성되었습니다. 문서 ID: ${result.docId}`,
              data: result,
              type: 'success'
            };
          } catch (error) {
            return {
              content: `문서 생성 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      },
      
      
      {
        id: 'git-user-info',
        name: 'git:user-info',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: 'Git 저장소에서 사용자 정보 가져오기',
        syntax: '@swdp:git:user-info',
        examples: ['@swdp:git:user-info'],
        execute: async () => {
          try {
            if (!this.isInitialized()) {
              throw new Error('SWDP 플러그인이 초기화되지 않았습니다.');
            }
            
            const result = await this.getClient().getUserInfoFromGit();
            
            return {
              content: `Git 사용자 정보:\n이름: ${result.username}\n이메일: ${result.email}`,
              data: result,
              type: 'info'
            };
          } catch (error) {
            return {
              content: `Git 사용자 정보 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
              type: 'error'
            };
          }
        }
      }
    ];
    
    return true;
  }
  
  /**
   * 프로젝트 목록 포맷팅
   * @param projects 프로젝트 목록
   * @returns 포맷팅된 문자열
   */
  private formatProjects(projects: any[]): string {
    if (!projects || projects.length === 0) {
      return '(프로젝트 없음)';
    }
    
    return projects.map(p => `- ${p.code}: ${p.name} (${p.status})`).join('\n');
  }
  
  /**
   * 프로젝트 세부 정보 포맷팅
   * @param project 프로젝트 정보
   * @returns 포맷팅된 문자열
   */
  private formatProjectDetails(project: any): string {
    if (!project) {
      return '(프로젝트 정보 없음)';
    }
    
    return [
      `코드: ${project.code}`,
      `이름: ${project.name}`,
      `상태: ${project.status}`,
      `설명: ${project.description || '(설명 없음)'}`,
      `시작일: ${project.startDate || '(미정)'}`,
      `종료일: ${project.endDate || '(미정)'}`,
      `담당자: ${project.manager || '(미지정)'}`
    ].join('\n');
  }
  
  /**
   * 작업 목록 포맷팅
   * @param tasks 작업 목록
   * @returns 포맷팅된 문자열
   */
  private formatTasks(tasks: any[]): string {
    if (!tasks || tasks.length === 0) {
      return '(작업 없음)';
    }
    
    return tasks.map(t => `- ${t.id}: ${t.title} (${t.status})`).join('\n');
  }
  
  /**
   * 작업 세부 정보 포맷팅
   * @param task 작업 정보
   * @returns 포맷팅된 문자열
   */
  private formatTaskDetails(task: any): string {
    if (!task) {
      return '(작업 정보 없음)';
    }
    
    return [
      `ID: ${task.id}`,
      `제목: ${task.title}`,
      `상태: ${task.status}`,
      `설명: ${task.description || '(설명 없음)'}`,
      `담당자: ${task.assignee || '(미지정)'}`,
      `생성일: ${task.createdAt || '(정보 없음)'}`,
      `마감일: ${task.dueDate || '(미정)'}`
    ].join('\n');
  }
  
  /**
   * 문서 목록 포맷팅
   * @param documents 문서 목록
   * @returns 포맷팅된 문자열
   */
  private formatDocuments(documents: any[]): string {
    if (!documents || documents.length === 0) {
      return '(문서 없음)';
    }
    
    return documents.map(d => `- ${d.id}: ${d.title} (${d.type})`).join('\n');
  }
  
  /**
   * 문서 세부 정보 포맷팅
   * @param document 문서 정보
   * @returns 포맷팅된 문자열
   */
  private formatDocumentDetails(document: any): string {
    if (!document) {
      return '(문서 정보 없음)';
    }
    
    return [
      `ID: ${document.id}`,
      `제목: ${document.title}`,
      `유형: ${document.type}`,
      `작성자: ${document.author || '(미지정)'}`,
      `생성일: ${document.createdAt || '(정보 없음)'}`,
      `마지막 수정일: ${document.updatedAt || '(정보 없음)'}`,
      `내용:\n${document.content || '(내용 없음)'}`
    ].join('\n');
  }
}