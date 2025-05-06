/**
 * SWDP 워크플로우 서비스
 * 
 * Git, Jira 등과 SWDP 작업을 연결하는 워크플로우 서비스
 * 작업 상태 변경, 히스토리 추적 기능 제공
 */

import { EventEmitter } from 'events';
import { SwdpDomainService, SwdpTask, SwdpEvent } from '../domain/SwdpDomainService';
import { UserAuthService } from '../auth/UserAuthService';
import { ConfigService } from '../config/ConfigService';

/**
 * 워크플로우 이벤트 열거형
 */
export enum WorkflowEvent {
  /**
   * 워크플로우 시작됨
   */
  WORKFLOW_STARTED = 'workflow_started',
  
  /**
   * 워크플로우 완료됨
   */
  WORKFLOW_COMPLETED = 'workflow_completed',
  
  /**
   * 워크플로우 실패함
   */
  WORKFLOW_FAILED = 'workflow_failed',
  
  /**
   * 작업 연결 생성됨
   */
  TASK_LINKED = 'task_linked',
  
  /**
   * 작업 상태 변경됨
   */
  TASK_STATUS_CHANGED = 'task_status_changed'
}

/**
 * 워크플로우 로그 항목 인터페이스
 */
export interface WorkflowLogItem {
  /**
   * 타임스탬프
   */
  timestamp: string;
  
  /**
   * 작업 ID
   */
  taskId?: string;
  
  /**
   * 작업 유형
   */
  actionType: string;
  
  /**
   * 설명
   */
  description: string;
  
  /**
   * 상태
   */
  status: 'success' | 'failed' | 'pending';
  
  /**
   * 메타데이터
   */
  metadata?: Record<string, any>;
}

/**
 * SWDP 워크플로우 서비스 클래스
 */
export class SwdpWorkflowService {
  /**
   * 싱글톤 인스턴스
   */
  private static instance: SwdpWorkflowService;
  
  /**
   * 이벤트 이미터
   */
  private eventEmitter = new EventEmitter();
  
  /**
   * SWDP 도메인 서비스
   */
  private swdpDomainService: SwdpDomainService;
  
  /**
   * 사용자 인증 서비스
   */
  private userAuthService: UserAuthService;
  
  /**
   * 설정 서비스
   */
  private configService: ConfigService;
  
  /**
   * 워크플로우 로그
   */
  private workflowLogs: Map<string, WorkflowLogItem[]> = new Map();
  
  /**
   * 현재 작업 ID
   */
  private currentTaskId?: string;
  
  /**
   * 초기화 완료 여부
   */
  private initialized: boolean = false;
  
  /**
   * 싱글톤 인스턴스 가져오기
   * @returns SwdpWorkflowService 인스턴스
   */
  public static getInstance(): SwdpWorkflowService {
    if (!SwdpWorkflowService.instance) {
      SwdpWorkflowService.instance = new SwdpWorkflowService();
    }
    return SwdpWorkflowService.instance;
  }
  
  /**
   * 생성자 (private)
   */
  private constructor() {
    this.swdpDomainService = SwdpDomainService.getInstance();
    this.userAuthService = UserAuthService.getInstance();
    this.configService = ConfigService.getInstance();
    
    // SWDP 이벤트 리스너 등록
    this.swdpDomainService.on(SwdpEvent.TASK_CHANGED, (task) => {
      this.handleTaskChanged(task);
    });
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  public on(event: WorkflowEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  public off(event: WorkflowEvent, listener: (...args: any[]) => void): void {
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
      
      // SWDP 도메인 서비스 초기화
      if (!this.swdpDomainService.isInitialized()) {
        await this.swdpDomainService.initialize();
      }
      
      // 사용자 설정에서 현재 작업 ID 가져오기
      const userSettings = this.userAuthService.getUserSettings();
      if (userSettings.currentTask) {
        this.currentTaskId = userSettings.currentTask;
        console.log(`현재 작업이 설정됨: ${this.currentTaskId}`);
      }
      
      this.initialized = true;
      console.log('SWDP 워크플로우 서비스 초기화 완료');
    } catch (error) {
      console.error('SWDP 워크플로우 서비스 초기화 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 초기화 확인
   */
  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error('SWDP 워크플로우 서비스가 초기화되지 않았습니다');
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
   * 현재 작업 설정
   * @param taskId 작업 ID
   */
  public async setCurrentTask(taskId: string): Promise<void> {
    this.checkInitialized();
    
    try {
      // 작업 존재 여부 확인
      const task = await this.swdpDomainService.getTaskDetails(taskId);
      
      // 현재 작업 업데이트
      this.currentTaskId = taskId;
      
      // 사용자 설정 업데이트
      await this.userAuthService.updateUserSettings({
        currentTask: taskId
      });
      
      console.log(`현재 작업이 설정됨: ${taskId} (${task.title})`);
      
      // 작업 시작 워크플로우 로그 추가
      this.addWorkflowLog(taskId, {
        timestamp: new Date().toISOString(),
        taskId,
        actionType: 'task_selection',
        description: `작업 "${task.title}" 선택됨`,
        status: 'success',
        metadata: {
          taskStatus: task.status
        }
      });
    } catch (error) {
      console.error(`현재 작업 설정 중 오류 발생 (${taskId}):`, error);
      throw error;
    }
  }
  
  /**
   * 현재 작업 가져오기
   * @returns 현재 작업 ID
   */
  public getCurrentTaskId(): string | undefined {
    return this.currentTaskId;
  }
  
  /**
   * 현재 작업 상세 정보 가져오기
   * @returns 현재 작업 상세 정보
   */
  public async getCurrentTask(): Promise<SwdpTask | undefined> {
    this.checkInitialized();
    
    if (!this.currentTaskId) {
      return undefined;
    }
    
    try {
      return await this.swdpDomainService.getTaskDetails(this.currentTaskId);
    } catch (error) {
      console.error(`현재 작업 조회 중 오류 발생 (${this.currentTaskId}):`, error);
      return undefined;
    }
  }
  
  /**
   * Git 커밋과 작업 연결
   * @param commitId Git 커밋 ID
   * @param taskId 작업 ID (생략 시 현재 작업)
   * @param message 커밋 메시지
   * @returns 연결 성공 여부
   */
  public async linkCommitToTask(commitId: string, taskId?: string, message?: string): Promise<boolean> {
    this.checkInitialized();
    
    try {
      // 작업 ID 결정
      const targetTaskId = taskId || this.currentTaskId;
      if (!targetTaskId) {
        throw new Error('작업이 설정되지 않았습니다');
      }
      
      // 작업 존재 여부 확인
      const task = await this.swdpDomainService.getTaskDetails(targetTaskId);
      
      // 로그 기록 및 이벤트 발생
      
      // 워크플로우 로그 추가
      this.addWorkflowLog(targetTaskId, {
        timestamp: new Date().toISOString(),
        taskId: targetTaskId,
        actionType: 'git_commit_linked',
        description: `Git 커밋 "${commitId.substring(0, 8)}" 연결됨${message ? ': ' + message : ''}`,
        status: 'success',
        metadata: {
          commitId,
          commitMessage: message,
          taskStatus: task.status
        }
      });
      
      // 이벤트 발생
      this.eventEmitter.emit(WorkflowEvent.TASK_LINKED, {
        taskId: targetTaskId,
        commitId,
        message
      });
      
      return true;
    } catch (error) {
      console.error(`Git 커밋 연결 중 오류 발생 (${commitId}):`, error);
      return false;
    }
  }
  
  /**
   * Jira 이슈와 작업 연결
   * @param issueKey Jira 이슈 키
   * @param taskId 작업 ID (생략 시 현재 작업)
   * @returns 연결 성공 여부
   */
  public async linkJiraIssueToTask(issueKey: string, taskId?: string): Promise<boolean> {
    this.checkInitialized();
    
    try {
      // 작업 ID 결정
      const targetTaskId = taskId || this.currentTaskId;
      if (!targetTaskId) {
        throw new Error('작업이 설정되지 않았습니다');
      }
      
      // 작업 존재 여부 확인
      const task = await this.swdpDomainService.getTaskDetails(targetTaskId);
      
      // 로그 기록 및 이벤트 발생
      
      // 워크플로우 로그 추가
      this.addWorkflowLog(targetTaskId, {
        timestamp: new Date().toISOString(),
        taskId: targetTaskId,
        actionType: 'jira_issue_linked',
        description: `Jira 이슈 "${issueKey}" 연결됨`,
        status: 'success',
        metadata: {
          issueKey,
          taskStatus: task.status
        }
      });
      
      // 이벤트 발생
      this.eventEmitter.emit(WorkflowEvent.TASK_LINKED, {
        taskId: targetTaskId,
        issueKey
      });
      
      return true;
    } catch (error) {
      console.error(`Jira 이슈 연결 중 오류 발생 (${issueKey}):`, error);
      return false;
    }
  }
  
  /**
   * 작업 상태 변경
   * @param taskId 작업 ID (생략 시 현재 작업)
   * @param status 새 상태
   * @returns 업데이트된 작업
   */
  public async updateTaskStatus(taskId: string | undefined, status: string): Promise<SwdpTask> {
    this.checkInitialized();
    
    try {
      // 작업 ID 결정
      const targetTaskId = taskId || this.currentTaskId;
      if (!targetTaskId) {
        throw new Error('작업이 설정되지 않았습니다');
      }
      
      // 작업 상태 업데이트
      const updatedTask = await this.swdpDomainService.updateTaskStatus(targetTaskId, status);
      
      // 워크플로우 로그 추가
      this.addWorkflowLog(targetTaskId, {
        timestamp: new Date().toISOString(),
        taskId: targetTaskId,
        actionType: 'task_status_changed',
        description: `작업 상태가 "${status}"(으)로 변경됨`,
        status: 'success',
        metadata: {
          newStatus: status,
          oldStatus: updatedTask.status !== status ? updatedTask.status : undefined
        }
      });
      
      // 이벤트 발생
      this.eventEmitter.emit(WorkflowEvent.TASK_STATUS_CHANGED, {
        taskId: targetTaskId,
        status,
        task: updatedTask
      });
      
      return updatedTask;
    } catch (error) {
      console.error(`작업 상태 변경 중 오류 발생 (${taskId}, ${status}):`, error);
      throw error;
    }
  }
  
  /**
   * 작업 변경 처리
   * @param task 변경된 작업
   */
  private handleTaskChanged(task: SwdpTask): void {
    // 현재 작업인 경우 처리
    if (this.currentTaskId === task.id) {
      // 이벤트 발생
      this.eventEmitter.emit(WorkflowEvent.TASK_STATUS_CHANGED, {
        taskId: task.id,
        status: task.status,
        task
      });
    }
  }
  
  /**
   * 워크플로우 로그 추가
   * @param taskId 작업 ID
   * @param logItem 로그 항목
   */
  private addWorkflowLog(taskId: string, logItem: WorkflowLogItem): void {
    if (!this.workflowLogs.has(taskId)) {
      this.workflowLogs.set(taskId, []);
    }
    
    const logs = this.workflowLogs.get(taskId)!;
    logs.push(logItem);
    
    // 로그 저장
    this.saveWorkflowLogs(taskId);
  }
  
  /**
   * 워크플로우 로그 가져오기
   * @param taskId 작업 ID (생략 시 현재 작업)
   * @returns 워크플로우 로그
   */
  public getWorkflowLogs(taskId?: string): WorkflowLogItem[] {
    // 작업 ID 결정
    const targetTaskId = taskId || this.currentTaskId;
    if (!targetTaskId) {
      return [];
    }
    
    // 캐시된 로그 가져오기
    if (this.workflowLogs.has(targetTaskId)) {
      return [...this.workflowLogs.get(targetTaskId)!];
    }
    
    // 로그 로드
    this.loadWorkflowLogs(targetTaskId);
    
    return this.workflowLogs.has(targetTaskId) ? 
      [...this.workflowLogs.get(targetTaskId)!] : 
      [];
  }
  
  /**
   * 워크플로우 로그 저장
   * @param taskId 작업 ID
   */
  private saveWorkflowLogs(taskId: string): void {
    try {
      // 작업별 로그 저장
      const logs = this.workflowLogs.get(taskId);
      if (!logs) return;
      
      // 사용자 설정에 워크플로우 로그 저장
      const workflowLogsConfig = this.configService.getUserConfig()?.workflowLogs || {};
      workflowLogsConfig[taskId] = logs;
      
      this.configService.updateUserConfig({
        workflowLogs: workflowLogsConfig
      });
    } catch (error) {
      console.warn(`워크플로우 로그 저장 중 오류 발생 (${taskId}):`, error);
    }
  }
  
  /**
   * 워크플로우 로그 로드
   * @param taskId 작업 ID
   */
  private loadWorkflowLogs(taskId: string): void {
    try {
      // 사용자 설정에서 워크플로우 로그 로드
      const workflowLogsConfig = this.configService.getUserConfig()?.workflowLogs || {};
      const logs = workflowLogsConfig[taskId] || [];
      
      // 캐시 업데이트
      this.workflowLogs.set(taskId, logs);
    } catch (error) {
      console.warn(`워크플로우 로그 로드 중 오류 발생 (${taskId}):`, error);
    }
  }
  
  /**
   * 작업 종료
   * @param taskId 작업 ID (생략 시 현재 작업)
   * @param status 종료 상태 (기본값: 'completed')
   * @param comment 종료 코멘트
   * @returns 성공 여부
   */
  public async completeTask(taskId?: string, status: string = 'completed', comment?: string): Promise<boolean> {
    this.checkInitialized();
    
    try {
      // 작업 ID 결정
      const targetTaskId = taskId || this.currentTaskId;
      if (!targetTaskId) {
        throw new Error('작업이 설정되지 않았습니다');
      }
      
      // 작업 상태 업데이트
      await this.swdpDomainService.updateTaskStatus(targetTaskId, status);
      
      // 워크플로우 로그 추가
      this.addWorkflowLog(targetTaskId, {
        timestamp: new Date().toISOString(),
        taskId: targetTaskId,
        actionType: 'task_completed',
        description: `작업 종료: ${comment || '작업 완료'}`,
        status: 'success',
        metadata: {
          finalStatus: status,
          comment
        }
      });
      
      // 현재 작업이 종료된 경우 현재 작업 정보 초기화
      if (targetTaskId === this.currentTaskId) {
        this.currentTaskId = undefined;
        
        // 사용자 설정 업데이트
        await this.userAuthService.updateUserSettings({
          currentTask: undefined
        });
      }
      
      // 작업 종료 이벤트 발생
      this.eventEmitter.emit(WorkflowEvent.WORKFLOW_COMPLETED, {
        taskId: targetTaskId,
        status,
        comment
      });
      
      return true;
    } catch (error) {
      console.error(`작업 종료 중 오류 발생 (${taskId}):`, error);
      
      // 워크플로우 실패 이벤트 발생
      this.eventEmitter.emit(WorkflowEvent.WORKFLOW_FAILED, {
        taskId,
        error
      });
      
      return false;
    }
  }
  
  /**
   * 워크플로우 시작
   * @param taskId 작업 ID (생략 시 현재 작업)
   * @param workflowType 워크플로우 유형
   * @param params 추가 파라미터
   * @returns 성공 여부
   */
  public async startWorkflow(taskId?: string, workflowType: string = 'default', params?: Record<string, any>): Promise<boolean> {
    this.checkInitialized();
    
    try {
      // 작업 ID 결정
      const targetTaskId = taskId || this.currentTaskId;
      if (!targetTaskId) {
        throw new Error('작업이 설정되지 않았습니다');
      }
      
      // 작업 존재 여부 확인
      const task = await this.swdpDomainService.getTaskDetails(targetTaskId);
      
      // 워크플로우 로그 추가
      this.addWorkflowLog(targetTaskId, {
        timestamp: new Date().toISOString(),
        taskId: targetTaskId,
        actionType: 'workflow_started',
        description: `워크플로우 시작: ${workflowType}`,
        status: 'success',
        metadata: {
          workflowType,
          taskStatus: task.status,
          params
        }
      });
      
      // 워크플로우 시작 이벤트 발생
      this.eventEmitter.emit(WorkflowEvent.WORKFLOW_STARTED, {
        taskId: targetTaskId,
        workflowType,
        params,
        task
      });
      
      return true;
    } catch (error) {
      console.error(`워크플로우 시작 중 오류 발생 (${taskId}, ${workflowType}):`, error);
      
      // 워크플로우 실패 이벤트 발생
      this.eventEmitter.emit(WorkflowEvent.WORKFLOW_FAILED, {
        taskId,
        workflowType,
        error
      });
      
      return false;
    }
  }
}