/**
 * SWDP 도메인 서비스
 * 
 * SWDP 데이터 모델 정의 및 도메인 로직 처리
 * APE Core와의 통신 및 데이터 캐싱 처리
 */

import { EventEmitter } from 'events';
import { SwdpClientService } from '../../plugins/internal/swdp/SwdpClientService';
import { UserAuthService } from '../auth/UserAuthService';
import { ConfigService } from '../config/ConfigService';

/**
 * SWDP 이벤트 열거형
 */
export enum SwdpEvent {
  /**
   * 프로젝트 로드됨
   */
  PROJECTS_LOADED = 'projects_loaded',
  
  /**
   * 작업 로드됨
   */
  TASKS_LOADED = 'tasks_loaded',
  
  /**
   * 문서 로드됨
   */
  DOCUMENTS_LOADED = 'documents_loaded',
  
  /**
   * 작업 변경됨
   */
  TASK_CHANGED = 'task_changed',
  
  /**
   * 빌드 상태 변경됨
   */
  BUILD_STATUS_CHANGED = 'build_status_changed',
  
  /**
   * 오류 발생
   */
  ERROR_OCCURRED = 'error_occurred'
}

/**
 * SWDP 프로젝트 인터페이스
 */
export interface SwdpProject {
  /**
   * 프로젝트 코드
   */
  code: string;
  
  /**
   * 프로젝트 이름
   */
  name: string;
  
  /**
   * 프로젝트 상태
   */
  status: string;
  
  /**
   * 프로젝트 설명
   */
  description?: string;
  
  /**
   * 시작일
   */
  startDate?: string;
  
  /**
   * 종료일
   */
  endDate?: string;
  
  /**
   * 담당자
   */
  manager?: string;
}

/**
 * SWDP 작업 인터페이스
 */
export interface SwdpTask {
  /**
   * 작업 ID
   */
  id: string;
  
  /**
   * 작업 제목
   */
  title: string;
  
  /**
   * 작업 상태
   */
  status: string;
  
  /**
   * 작업 설명
   */
  description?: string;
  
  /**
   * 담당자
   */
  assignee?: string;
  
  /**
   * 생성일
   */
  createdAt?: string;
  
  /**
   * 마감일
   */
  dueDate?: string;
  
  /**
   * 프로젝트 코드
   */
  projectCode: string;
}

/**
 * SWDP 문서 인터페이스
 */
export interface SwdpDocument {
  /**
   * 문서 ID
   */
  id: string;
  
  /**
   * 문서 제목
   */
  title: string;
  
  /**
   * 문서 유형
   */
  type: string;
  
  /**
   * 작성자
   */
  author?: string;
  
  /**
   * 생성일
   */
  createdAt?: string;
  
  /**
   * 마지막 수정일
   */
  updatedAt?: string;
  
  /**
   * 문서 내용
   */
  content?: string;
  
  /**
   * 프로젝트 코드
   */
  projectCode: string;
}

/**
 * SWDP 빌드 인터페이스
 */
export interface SwdpBuild {
  /**
   * 빌드 ID
   */
  buildId: string;
  
  /**
   * 빌드 타입
   */
  type: string;
  
  /**
   * 빌드 상태
   */
  status: string;
  
  /**
   * 워치 모드 여부
   */
  watchMode: boolean;
  
  /**
   * PR 생성 여부
   */
  createPr: boolean;
  
  /**
   * 빌드 생성 시간
   */
  timestamp: string;
  
  /**
   * 빌드 로그
   */
  logs?: string[];
}

/**
 * SWDP 도메인 서비스 클래스
 */
export class SwdpDomainService {
  /**
   * 싱글톤 인스턴스
   */
  private static instance: SwdpDomainService;
  
  /**
   * 이벤트 이미터
   */
  private eventEmitter = new EventEmitter();
  
  /**
   * SWDP 클라이언트 서비스
   */
  private swdpClient: SwdpClientService;
  
  /**
   * 사용자 인증 서비스
   */
  private userAuthService: UserAuthService;
  
  /**
   * 설정 서비스
   */
  private configService: ConfigService;
  
  /**
   * 프로젝트 캐시
   */
  private projectsCache: Map<string, SwdpProject> = new Map();
  
  /**
   * 작업 캐시 (프로젝트 코드별)
   */
  private tasksCache: Map<string, SwdpTask[]> = new Map();
  
  /**
   * 문서 캐시 (프로젝트 코드별)
   */
  private documentsCache: Map<string, SwdpDocument[]> = new Map();
  
  /**
   * 빌드 캐시
   */
  private buildsCache: Map<string, SwdpBuild> = new Map();
  
  /**
   * 현재 프로젝트 코드
   */
  private currentProject?: string;
  
  /**
   * 초기화 완료 여부
   */
  private initialized: boolean = false;
  
  /**
   * 캐시 유효 시간 (밀리초)
   */
  private cacheTTL: number = 5 * 60 * 1000; // 5분
  
  /**
   * 싱글톤 인스턴스 가져오기
   * @returns SwdpDomainService 인스턴스
   */
  public static getInstance(): SwdpDomainService {
    if (!SwdpDomainService.instance) {
      SwdpDomainService.instance = new SwdpDomainService();
    }
    return SwdpDomainService.instance;
  }
  
  /**
   * 생성자 (private)
   */
  private constructor() {
    this.configService = ConfigService.getInstance();
    this.userAuthService = UserAuthService.getInstance();
    
    // SWDP 클라이언트 생성
    const config = this.configService.getPluginConfig();
    const swdpConfig = config && typeof config === 'object' && 'swdp' in config 
      ? (config as Record<string, any>).swdp 
      : null;
    
    const apeCoreUrl = swdpConfig?.apeCoreUrl || 'http://localhost:8001';
    const bypassSsl = swdpConfig?.bypassSsl !== false;
    
    this.swdpClient = new SwdpClientService(apeCoreUrl, bypassSsl);
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  public on(event: SwdpEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  public off(event: SwdpEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
  
  /**
   * 초기화
   */
  public async initialize(): Promise<void> {
    try {
      // 사용자 인증 서비스 초기화
      if (!this.userAuthService.isInitialized()) {
        await this.userAuthService.initialize();
      }
      
      // 사용자 정보 가져오기
      const userInfo = this.userAuthService.getUserInfo();
      const userSettings = this.userAuthService.getUserSettings();
      
      // SWDP 클라이언트 초기화
      await this.swdpClient.initialize({
        userId: userInfo.userId,
        gitUsername: userInfo.gitUsername,
        gitEmail: userInfo.gitEmail,
        token: userInfo.token
      });
      
      // 현재 프로젝트 설정
      this.currentProject = userSettings.currentProject;
      
      // 캐시 TTL 설정 (설정에서 가져오기)
      const ttl = this.configService.getAppConfig()?.cache?.ttl;
      if (ttl && typeof ttl === 'number') {
        this.cacheTTL = ttl;
      }
      
      this.initialized = true;
      console.log('SWDP 도메인 서비스 초기화 완료');
    } catch (error) {
      console.error('SWDP 도메인 서비스 초기화 중 오류 발생:', error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 초기화 확인
   */
  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error('SWDP 도메인 서비스가 초기화되지 않았습니다');
    }
  }
  
  /**
   * 초기화 상태 확인
   * @returns 초기화 상태
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * 프로젝트 목록 가져오기
   * @param forceRefresh 강제 새로고침 여부
   * @returns 프로젝트 목록
   */
  public async getProjects(forceRefresh: boolean = false): Promise<SwdpProject[]> {
    this.checkInitialized();
    
    try {
      // 캐시된 프로젝트 목록이 있고 강제 새로고침이 아닌 경우
      if (this.projectsCache.size > 0 && !forceRefresh) {
        return Array.from(this.projectsCache.values());
      }
      
      // 프로젝트 목록 가져오기
      const result = await this.swdpClient.getProjects();
      const projects = result.projects || [];
      
      // 캐시 업데이트
      this.projectsCache.clear();
      for (const project of projects) {
        this.projectsCache.set(project.code, project);
      }
      
      // 이벤트 발생
      this.eventEmitter.emit(SwdpEvent.PROJECTS_LOADED, projects);
      
      return projects;
    } catch (error) {
      console.error('프로젝트 목록 가져오기 중 오류 발생:', error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 프로젝트 세부 정보 가져오기
   * @param projectCode 프로젝트 코드
   * @param forceRefresh 강제 새로고침 여부
   * @returns 프로젝트 세부 정보
   */
  public async getProjectDetails(projectCode: string, forceRefresh: boolean = false): Promise<SwdpProject> {
    this.checkInitialized();
    
    try {
      // 캐시된 프로젝트 정보가 있고 강제 새로고침이 아닌 경우
      if (this.projectsCache.has(projectCode) && !forceRefresh) {
        return this.projectsCache.get(projectCode)!;
      }
      
      // 프로젝트 세부 정보 가져오기
      const result = await this.swdpClient.getProjectDetails(projectCode);
      const project = result.project;
      
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없음: ${projectCode}`);
      }
      
      // 캐시 업데이트
      this.projectsCache.set(projectCode, project);
      
      return project;
    } catch (error) {
      console.error(`프로젝트 세부 정보 가져오기 중 오류 발생 (${projectCode}):`, error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 현재 프로젝트 설정
   * @param projectCode 프로젝트 코드
   */
  public async setCurrentProject(projectCode: string): Promise<void> {
    this.checkInitialized();
    
    try {
      // SWDP 서버에 현재 프로젝트 설정
      await this.swdpClient.setCurrentProject(projectCode);
      
      // 클라이언트 상태 업데이트
      this.currentProject = projectCode;
      
      // 사용자 설정 업데이트
      await this.userAuthService.setCurrentProject(projectCode);
      
      console.log(`현재 프로젝트가 설정됨: ${projectCode}`);
    } catch (error) {
      console.error(`현재 프로젝트 설정 중 오류 발생 (${projectCode}):`, error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 현재 프로젝트 가져오기
   * @returns 현재 프로젝트 코드
   */
  public getCurrentProject(): string | undefined {
    return this.currentProject;
  }
  
  /**
   * 작업 목록 가져오기
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @param forceRefresh 강제 새로고침 여부
   * @returns 작업 목록
   */
  public async getTasks(projectCode?: string, forceRefresh: boolean = false): Promise<SwdpTask[]> {
    this.checkInitialized();
    
    try {
      // 프로젝트 코드 결정
      const targetProject = projectCode || this.currentProject;
      if (!targetProject) {
        throw new Error('프로젝트가 설정되지 않았습니다');
      }
      
      // 캐시된 작업 목록이 있고 강제 새로고침이 아닌 경우
      if (this.tasksCache.has(targetProject) && !forceRefresh) {
        return this.tasksCache.get(targetProject)!;
      }
      
      // 작업 목록 가져오기
      const result = await this.swdpClient.getTasks(targetProject);
      const tasks = result.tasks || [];
      
      // 각 작업에 프로젝트 코드 추가
      const tasksWithProject = tasks.map(task => ({
        ...task,
        projectCode: targetProject
      }));
      
      // 캐시 업데이트
      this.tasksCache.set(targetProject, tasksWithProject);
      
      // 이벤트 발생
      this.eventEmitter.emit(SwdpEvent.TASKS_LOADED, tasksWithProject);
      
      return tasksWithProject;
    } catch (error) {
      console.error('작업 목록 가져오기 중 오류 발생:', error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 작업 세부 정보 가져오기
   * @param taskId 작업 ID
   * @returns 작업 세부 정보
   */
  public async getTaskDetails(taskId: string): Promise<SwdpTask> {
    this.checkInitialized();
    
    try {
      // 작업 세부 정보 가져오기
      const result = await this.swdpClient.getTaskDetails(taskId);
      const task = result.task;
      
      if (!task) {
        throw new Error(`작업을 찾을 수 없음: ${taskId}`);
      }
      
      // 프로젝트 코드 확인
      if (!task.projectCode && task.project) {
        task.projectCode = task.project;
      }
      
      // 캐시 업데이트
      if (task.projectCode) {
        if (!this.tasksCache.has(task.projectCode)) {
          this.tasksCache.set(task.projectCode, []);
        }
        
        const tasks = this.tasksCache.get(task.projectCode)!;
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex >= 0) {
          tasks[taskIndex] = task;
        } else {
          tasks.push(task);
        }
      }
      
      return task;
    } catch (error) {
      console.error(`작업 세부 정보 가져오기 중 오류 발생 (${taskId}):`, error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 작업 생성
   * @param title 작업 제목
   * @param description 작업 설명
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @param params 추가 파라미터
   * @returns 생성된 작업 정보
   */
  public async createTask(title: string, description: string, projectCode?: string, params?: Record<string, any>): Promise<SwdpTask> {
    this.checkInitialized();
    
    try {
      // 프로젝트 코드 결정
      const targetProject = projectCode || this.currentProject;
      if (!targetProject) {
        throw new Error('프로젝트가 설정되지 않았습니다');
      }
      
      // 작업 생성
      const result = await this.swdpClient.createTask(title, description, targetProject, params);
      const task = result.task || {
        id: result.taskId,
        title,
        description,
        projectCode: targetProject,
        status: 'created'
      };
      
      // 캐시 업데이트
      if (!this.tasksCache.has(targetProject)) {
        this.tasksCache.set(targetProject, []);
      }
      
      const tasks = this.tasksCache.get(targetProject)!;
      tasks.push(task);
      
      // 이벤트 발생
      this.eventEmitter.emit(SwdpEvent.TASK_CHANGED, task);
      
      return task;
    } catch (error) {
      console.error('작업 생성 중 오류 발생:', error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 작업 상태 업데이트
   * @param taskId 작업 ID
   * @param status 새 상태
   * @returns 업데이트된 작업 정보
   */
  public async updateTaskStatus(taskId: string, status: string): Promise<SwdpTask> {
    this.checkInitialized();
    
    try {
      // 작업 상태 업데이트
      const result = await this.swdpClient.updateTaskStatus(taskId, status);
      const task = result.task;
      
      if (!task) {
        throw new Error(`작업을 찾을 수 없음: ${taskId}`);
      }
      
      // 프로젝트 코드 확인
      if (!task.projectCode && task.project) {
        task.projectCode = task.project;
      }
      
      // 캐시 업데이트
      if (task.projectCode) {
        if (!this.tasksCache.has(task.projectCode)) {
          this.tasksCache.set(task.projectCode, []);
        }
        
        const tasks = this.tasksCache.get(task.projectCode)!;
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex >= 0) {
          tasks[taskIndex] = task;
        } else {
          tasks.push(task);
        }
      }
      
      // 이벤트 발생
      this.eventEmitter.emit(SwdpEvent.TASK_CHANGED, task);
      
      return task;
    } catch (error) {
      console.error(`작업 상태 업데이트 중 오류 발생 (${taskId}):`, error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 문서 목록 가져오기
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @param forceRefresh 강제 새로고침 여부
   * @returns 문서 목록
   */
  public async getDocuments(projectCode?: string, forceRefresh: boolean = false): Promise<SwdpDocument[]> {
    this.checkInitialized();
    
    try {
      // 프로젝트 코드 결정
      const targetProject = projectCode || this.currentProject;
      if (!targetProject) {
        throw new Error('프로젝트가 설정되지 않았습니다');
      }
      
      // 캐시된 문서 목록이 있고 강제 새로고침이 아닌 경우
      if (this.documentsCache.has(targetProject) && !forceRefresh) {
        return this.documentsCache.get(targetProject)!;
      }
      
      // 문서 목록 가져오기
      const result = await this.swdpClient.getDocuments(targetProject);
      const documents = result.documents || [];
      
      // 각 문서에 프로젝트 코드 추가
      const documentsWithProject = documents.map(doc => ({
        ...doc,
        projectCode: targetProject
      }));
      
      // 캐시 업데이트
      this.documentsCache.set(targetProject, documentsWithProject);
      
      // 이벤트 발생
      this.eventEmitter.emit(SwdpEvent.DOCUMENTS_LOADED, documentsWithProject);
      
      return documentsWithProject;
    } catch (error) {
      console.error('문서 목록 가져오기 중 오류 발생:', error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 문서 세부 정보 가져오기
   * @param docId 문서 ID
   * @returns 문서 세부 정보
   */
  public async getDocumentDetails(docId: string): Promise<SwdpDocument> {
    this.checkInitialized();
    
    try {
      // 문서 세부 정보 가져오기
      const result = await this.swdpClient.getDocumentDetails(docId);
      const document = result.document;
      
      if (!document) {
        throw new Error(`문서를 찾을 수 없음: ${docId}`);
      }
      
      // 프로젝트 코드 확인
      if (!document.projectCode && document.project) {
        document.projectCode = document.project;
      }
      
      // 캐시 업데이트
      if (document.projectCode) {
        if (!this.documentsCache.has(document.projectCode)) {
          this.documentsCache.set(document.projectCode, []);
        }
        
        const documents = this.documentsCache.get(document.projectCode)!;
        const docIndex = documents.findIndex(d => d.id === docId);
        
        if (docIndex >= 0) {
          documents[docIndex] = document;
        } else {
          documents.push(document);
        }
      }
      
      return document;
    } catch (error) {
      console.error(`문서 세부 정보 가져오기 중 오류 발생 (${docId}):`, error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 문서 생성
   * @param title 문서 제목
   * @param type 문서 유형
   * @param content 문서 내용
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @returns 생성된 문서 정보
   */
  public async createDocument(title: string, type: string, content: string, projectCode?: string): Promise<SwdpDocument> {
    this.checkInitialized();
    
    try {
      // 프로젝트 코드 결정
      const targetProject = projectCode || this.currentProject;
      if (!targetProject) {
        throw new Error('프로젝트가 설정되지 않았습니다');
      }
      
      // 문서 생성
      const result = await this.swdpClient.createDocument(title, type, content, targetProject);
      const document = result.document || {
        id: result.docId,
        title,
        type,
        content,
        projectCode: targetProject,
        createdAt: new Date().toISOString()
      };
      
      // 캐시 업데이트
      if (!this.documentsCache.has(targetProject)) {
        this.documentsCache.set(targetProject, []);
      }
      
      const documents = this.documentsCache.get(targetProject)!;
      documents.push(document);
      
      return document;
    } catch (error) {
      console.error('문서 생성 중 오류 발생:', error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 빌드 시작
   * @param type 빌드 타입
   * @param watchMode 워치 모드 여부
   * @param createPr PR 생성 여부
   * @param params 추가 파라미터
   * @returns 빌드 정보
   */
  public async startBuild(type: string, watchMode: boolean = false, createPr: boolean = false, params: Record<string, any> = {}): Promise<SwdpBuild> {
    this.checkInitialized();
    
    try {
      // 빌드 시작
      const result = await this.swdpClient.startBuild({
        type: type as any,
        watchMode,
        createPr,
        params
      });
      
      const build: SwdpBuild = {
        buildId: result.buildId,
        type,
        status: result.status || 'pending',
        watchMode,
        createPr,
        timestamp: result.timestamp || new Date().toISOString(),
        logs: []
      };
      
      // 캐시 업데이트
      this.buildsCache.set(build.buildId, build);
      
      // 빌드 상태 주기적 업데이트 시작 (완료 또는 오류 상태가 될 때까지)
      this.startBuildStatusPolling(build.buildId);
      
      return build;
    } catch (error) {
      console.error('빌드 시작 중 오류 발생:', error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 빌드 상태 가져오기
   * @param buildId 빌드 ID (생략 시 최근 빌드)
   * @returns 빌드 상태
   */
  public async getBuildStatus(buildId?: string): Promise<SwdpBuild> {
    this.checkInitialized();
    
    try {
      // 빌드 ID가 없으면 최근 빌드 찾기
      if (!buildId) {
        // 빌드 캐시에서 가장 최근 빌드 찾기
        let latestBuild: SwdpBuild | null = null;
        let latestTimestamp = 0;
        
        for (const build of this.buildsCache.values()) {
          const timestamp = new Date(build.timestamp).getTime();
          if (timestamp > latestTimestamp) {
            latestBuild = build;
            latestTimestamp = timestamp;
          }
        }
        
        if (latestBuild) {
          buildId = latestBuild.buildId;
        } else {
          // 캐시에 빌드가 없으면 서버에서 최근 빌드 조회
          const result = await this.swdpClient.getBuildStatus();
          
          if (!result.buildId) {
            throw new Error('빌드를 찾을 수 없습니다');
          }
          
          buildId = result.buildId;
        }
      }
      
      // 빌드 상태 조회
      const result = await this.swdpClient.getBuildStatus(buildId);
      
      // 빌드 정보 업데이트
      const build: SwdpBuild = {
        buildId,
        type: result.type || 'unknown',
        status: result.status || 'unknown',
        watchMode: result.watchMode || false,
        createPr: result.createPr || false,
        timestamp: result.timestamp || new Date().toISOString()
      };
      
      // 캐시 업데이트
      this.buildsCache.set(buildId, build);
      
      // 이벤트 발생
      this.eventEmitter.emit(SwdpEvent.BUILD_STATUS_CHANGED, build);
      
      return build;
    } catch (error) {
      console.error('빌드 상태 조회 중 오류 발생:', error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 빌드 로그 가져오기
   * @param buildId 빌드 ID
   * @returns 빌드 로그
   */
  public async getBuildLogs(buildId: string): Promise<string[]> {
    this.checkInitialized();
    
    try {
      // 빌드 로그 조회
      const result = await this.swdpClient.getBuildLogs(buildId);
      const logs = result.logs ? 
        (typeof result.logs === 'string' ? result.logs.split('\n') : result.logs) : 
        [];
      
      // 캐시된 빌드 정보가 있으면 로그 업데이트
      if (this.buildsCache.has(buildId)) {
        const build = this.buildsCache.get(buildId)!;
        build.logs = logs;
        this.buildsCache.set(buildId, build);
      }
      
      return logs;
    } catch (error) {
      console.error(`빌드 로그 조회 중 오류 발생 (${buildId}):`, error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 빌드 취소
   * @param buildId 빌드 ID
   * @returns 취소 결과
   */
  public async cancelBuild(buildId: string): Promise<boolean> {
    this.checkInitialized();
    
    try {
      // 빌드 취소
      await this.swdpClient.cancelBuild(buildId);
      
      // 캐시된 빌드 정보가 있으면 상태 업데이트
      if (this.buildsCache.has(buildId)) {
        const build = this.buildsCache.get(buildId)!;
        build.status = 'canceled';
        this.buildsCache.set(buildId, build);
        
        // 이벤트 발생
        this.eventEmitter.emit(SwdpEvent.BUILD_STATUS_CHANGED, build);
      }
      
      return true;
    } catch (error) {
      console.error(`빌드 취소 중 오류 발생 (${buildId}):`, error);
      this.eventEmitter.emit(SwdpEvent.ERROR_OCCURRED, error);
      throw error;
    }
  }
  
  /**
   * 빌드 상태 폴링 시작
   * @param buildId 빌드 ID
   */
  private startBuildStatusPolling(buildId: string): void {
    // 상태 확인 간격 (초)
    const interval = 5;
    
    // 초기 딜레이 (빌드 시작 후 5초 후부터 폴링 시작)
    setTimeout(async () => {
      try {
        // 빌드 상태 확인
        const build = await this.getBuildStatus(buildId);
        
        // 완료 또는 오류 상태인지 확인
        const isCompleted = ['success', 'failed', 'canceled'].includes(build.status);
        
        if (isCompleted) {
          // 완료된 경우 로그 한 번만 가져오기
          try {
            await this.getBuildLogs(buildId);
          } catch (error) {
            console.warn(`빌드 로그 조회 실패 (${buildId}):`, error);
          }
        } else {
          // 완료되지 않은 경우 계속 폴링
          setTimeout(() => this.startBuildStatusPolling(buildId), interval * 1000);
        }
      } catch (error) {
        console.warn(`빌드 상태 폴링 중 오류 발생 (${buildId}):`, error);
      }
    }, 5000);
  }
  
  /**
   * 캐시된 프로젝트 목록 가져오기
   * @returns 캐시된 프로젝트 목록
   */
  public getCachedProjects(): SwdpProject[] {
    return Array.from(this.projectsCache.values());
  }
  
  /**
   * 캐시 비우기
   */
  public clearCache(): void {
    this.projectsCache.clear();
    this.tasksCache.clear();
    this.documentsCache.clear();
    this.buildsCache.clear();
    
    console.log('SWDP 도메인 서비스 캐시 비움');
  }
}