/**
 * SWDP 클라이언트 서비스
 * 
 * APE Core의 SWDP Agent와 통신하여 빌드 파이프라인 기능을 제공
 * localhost:8001 엔드포인트를 통해 요청 전달
 */

import { HttpClientService } from '../../../core/http/HttpClientService';
import { HttpHeaders } from '../../../types/HttpTypes';

/**
 * SWDP 빌드 타입 열거형
 */
export enum SwdpBuildType {
  /**
   * 로컬 빌드
   */
  LOCAL = 'local',
  
  /**
   * 레이어 빌드
   */
  LAYER = 'layer',
  
  /**
   * 통합 빌드
   */
  INTEGRATION = 'integration',
  
  /**
   * 전체 빌드
   */
  ALL = 'all'
}

/**
 * SWDP 빌드 옵션 인터페이스
 */
export interface SwdpBuildOptions {
  /**
   * 빌드 타입
   */
  type: SwdpBuildType;
  
  /**
   * 워치 모드 여부
   */
  watchMode?: boolean;
  
  /**
   * PR 생성 여부
   */
  createPr?: boolean;
  
  /**
   * 빌드 파라미터
   */
  params?: Record<string, any>;
}

/**
 * SWDP 테스트 옵션 인터페이스
 */
export interface SwdpTestOptions {
  /**
   * 테스트 유형
   */
  type: 'unit' | 'integration' | 'system';
  
  /**
   * 테스트 대상
   */
  target?: string;
  
  /**
   * 테스트 파라미터
   */
  params?: Record<string, any>;
}

/**
 * TR(Test Request) 옵션 인터페이스
 */
export interface SwdpTROptions {
  /**
   * TR 제목
   */
  title: string;
  
  /**
   * TR 설명
   */
  description: string;
  
  /**
   * 테스트 유형
   */
  type: string;
  
  /**
   * 우선순위
   */
  priority?: 'high' | 'medium' | 'low';
  
  /**
   * 담당자
   */
  assignee?: string;
}

/**
 * SWDP 인증 정보 인터페이스
 */
interface SwdpCredentials {
  /**
   * 사용자 ID
   */
  userId?: string;
  
  /**
   * Git 이메일
   */
  gitEmail?: string;
  
  /**
   * Git 사용자명
   */
  gitUsername?: string;
  
  /**
   * API 토큰
   */
  token?: string;
}

/**
 * SWDP 클라이언트 서비스 클래스
 */
export class SwdpClientService {
  /**
   * HTTP 클라이언트
   */
  private httpClient: HttpClientService;
  
  /**
   * APE Core 엔드포인트 기본 URL
   */
  private baseUrl: string;
  
  /**
   * 인증 헤더
   */
  private authHeaders: HttpHeaders = {};
  
  /**
   * 초기화 완료 여부
   */
  private initialized: boolean = false;
  
  /**
   * SwdpClientService 생성자
   * @param baseUrl APE Core 엔드포인트 기본 URL (기본값: http://localhost:8001)
   * @param bypassSsl SSL 인증서 검증 우회 여부
   */
  constructor(baseUrl: string = 'http://localhost:8001', bypassSsl: boolean = false) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.httpClient = new HttpClientService();
    
    // SSL 우회 설정
    if (bypassSsl) {
      this.httpClient.setSSLBypass(true);
    }
  }
  
  /**
   * 클라이언트 초기화
   * @param credentials 인증 정보
   */
  async initialize(credentials: SwdpCredentials): Promise<void> {
    try {
      // 기본 헤더 설정
      this.authHeaders = {
        'Content-Type': 'application/json'
      };
      
      // 인증 정보 설정
      if (credentials.userId) {
        this.authHeaders['User-ID'] = credentials.userId;
      }
      
      if (credentials.token) {
        this.authHeaders['Authorization'] = `Bearer ${credentials.token}`;
      }
      
      if (credentials.gitUsername) {
        this.authHeaders['Git-Username'] = credentials.gitUsername;
      }
      
      if (credentials.gitEmail) {
        this.authHeaders['Git-Email'] = credentials.gitEmail;
      }
      
      // 연결 테스트
      await this.testConnection();
      
      this.initialized = true;
      console.log('SWDP 클라이언트 초기화 완료');
    } catch (error) {
      console.error('SWDP 클라이언트 초기화 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 연결 테스트
   */
  private async testConnection(): Promise<void> {
    try {
      const response = await this.httpClient.get(
        `${this.baseUrl}api/status`,
        this.authHeaders
      );
      
      if (!response.ok) {
        throw new Error(`APE Core 연결 테스트 실패: ${response.statusCode} ${response.statusText}`);
      }
      
      console.log('APE Core 연결 테스트 성공:', response.data.status);
    } catch (error) {
      console.error('APE Core 연결 테스트 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 초기화 확인
   */
  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error('SWDP 클라이언트가 초기화되지 않았습니다');
    }
  }
  
  /**
   * SWDP Agent에 명령 전송
   * @param route API 라우트
   * @param data 요청 데이터
   * @returns 응답 데이터
   */
  private async sendSwdpCommand(route: string, data: any): Promise<any> {
    this.checkInitialized();
    
    try {
      // SWDP Agent 라우트 구성
      const apiUrl = `${this.baseUrl}api/swdp/${route}`;
      
      // 요청 데이터에 타임스탬프 추가
      const requestData = {
        ...data,
        timestamp: new Date().toISOString()
      };
      
      // API 호출
      const response = await this.httpClient.post(
        apiUrl,
        requestData,
        this.authHeaders
      );
      
      if (!response.ok) {
        throw new Error(`SWDP 요청 실패 (${route}): ${response.statusCode} ${response.statusText}`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`SWDP 요청 중 오류 발생 (${route}):`, error);
      throw error;
    }
  }
  
  /**
   * SWDP 빌드 시작
   * @param options 빌드 옵션
   * @returns 빌드 결과
   */
  async startBuild(options: SwdpBuildOptions): Promise<any> {
    return this.sendSwdpCommand('builds/start', {
      type: options.type,
      watchMode: options.watchMode || false,
      createPr: options.createPr || false,
      params: options.params || {}
    });
  }
  
  /**
   * 빌드 상태 조회
   * @param buildId 빌드 ID (생략 시 최근 빌드)
   * @returns 빌드 상태
   */
  async getBuildStatus(buildId?: string): Promise<any> {
    return this.sendSwdpCommand('builds/status', {
      buildId: buildId
    });
  }
  
  /**
   * 빌드 로그 조회
   * @param buildId 빌드 ID
   * @returns 빌드 로그
   */
  async getBuildLogs(buildId: string): Promise<any> {
    return this.sendSwdpCommand('builds/logs', {
      buildId
    });
  }
  
  /**
   * 빌드 취소
   * @param buildId 빌드 ID
   * @returns 취소 결과
   */
  async cancelBuild(buildId: string): Promise<any> {
    return this.sendSwdpCommand('builds/cancel', {
      buildId
    });
  }
  
  /**
   * 테스트 실행
   * @param options 테스트 옵션
   * @returns 테스트 결과
   */
  async runTest(options: SwdpTestOptions): Promise<any> {
    return this.sendSwdpCommand('tests/run', {
      type: options.type,
      target: options.target,
      params: options.params || {}
    });
  }
  
  /**
   * 테스트 결과 조회
   * @param testId 테스트 ID
   * @returns 테스트 결과
   */
  async getTestResults(testId: string): Promise<any> {
    return this.sendSwdpCommand('tests/results', {
      testId
    });
  }
  
  /**
   * TR(Test Request) 생성
   * @param options TR 옵션
   * @returns TR 정보
   */
  async createTR(options: SwdpTROptions): Promise<any> {
    return this.sendSwdpCommand('tr/create', {
      title: options.title,
      description: options.description,
      type: options.type,
      priority: options.priority || 'medium',
      assignee: options.assignee
    });
  }
  
  /**
   * TR 상태 조회
   * @param trId TR ID
   * @returns TR 상태
   */
  async getTRStatus(trId: string): Promise<any> {
    return this.sendSwdpCommand('tr/status', {
      trId
    });
  }
  
  /**
   * 배포 시작
   * @param environment 배포 환경
   * @param buildId 빌드 ID
   * @param params 배포 파라미터
   * @returns 배포 결과
   */
  async startDeployment(environment: string, buildId: string, params?: Record<string, any>): Promise<any> {
    return this.sendSwdpCommand('deployments/start', {
      environment,
      buildId,
      params: params || {}
    });
  }
  
  /**
   * 배포 상태 조회
   * @param deploymentId 배포 ID
   * @returns 배포 상태
   */
  async getDeploymentStatus(deploymentId: string): Promise<any> {
    return this.sendSwdpCommand('deployments/status', {
      deploymentId
    });
  }
  
  /**
   * 프로젝트 목록 조회
   * @returns 프로젝트 목록
   */
  async getProjects(): Promise<any> {
    return this.sendSwdpCommand('projects/list', {});
  }
  
  /**
   * 프로젝트 세부 정보 조회
   * @param projectCode 프로젝트 코드
   * @returns 프로젝트 세부 정보
   */
  async getProjectDetails(projectCode: string): Promise<any> {
    return this.sendSwdpCommand('projects/details', {
      projectCode
    });
  }
  
  /**
   * 현재 작업 프로젝트 설정
   * @param projectCode 프로젝트 코드
   * @returns 설정 결과
   */
  async setCurrentProject(projectCode: string): Promise<any> {
    return this.sendSwdpCommand('projects/set-current', {
      projectCode
    });
  }
  
  /**
   * 작업 목록 조회
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @returns 작업 목록
   */
  async getTasks(projectCode?: string): Promise<any> {
    return this.sendSwdpCommand('tasks/list', {
      projectCode
    });
  }
  
  /**
   * 작업 세부 정보 조회
   * @param taskId 작업 ID
   * @returns 작업 세부 정보
   */
  async getTaskDetails(taskId: string): Promise<any> {
    return this.sendSwdpCommand('tasks/details', {
      taskId
    });
  }
  
  /**
   * 작업 생성
   * @param title 작업 제목
   * @param description 작업 설명
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @param params 추가 파라미터
   * @returns 생성된 작업 정보
   */
  async createTask(title: string, description: string, projectCode?: string, params?: Record<string, any>): Promise<any> {
    return this.sendSwdpCommand('tasks/create', {
      title,
      description,
      projectCode,
      params: params || {}
    });
  }
  
  /**
   * 작업 상태 업데이트
   * @param taskId 작업 ID
   * @param status 새 상태
   * @returns 업데이트 결과
   */
  async updateTaskStatus(taskId: string, status: string): Promise<any> {
    return this.sendSwdpCommand('tasks/update-status', {
      taskId,
      status
    });
  }
  
  /**
   * 문서 목록 조회
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @returns 문서 목록
   */
  async getDocuments(projectCode?: string): Promise<any> {
    return this.sendSwdpCommand('documents/list', {
      projectCode
    });
  }
  
  /**
   * 문서 세부 정보 조회
   * @param docId 문서 ID
   * @returns 문서 세부 정보
   */
  async getDocumentDetails(docId: string): Promise<any> {
    return this.sendSwdpCommand('documents/details', {
      docId
    });
  }
  
  /**
   * 문서 생성
   * @param title 문서 제목
   * @param type 문서 유형
   * @param content 문서 내용
   * @param projectCode 프로젝트 코드 (생략 시 현재 프로젝트)
   * @returns 생성된 문서 정보
   */
  async createDocument(title: string, type: string, content: string, projectCode?: string): Promise<any> {
    return this.sendSwdpCommand('documents/create', {
      title,
      type,
      content,
      projectCode
    });
  }
  
  /**
   * Git 저장소에서 사용자 정보 가져오기
   * @returns 사용자 정보
   */
  async getUserInfoFromGit(): Promise<any> {
    return this.sendSwdpCommand('git/user-info', {});
  }
}