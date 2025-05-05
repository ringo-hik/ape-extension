/**
 * SWDP Mock 서비스
 * 
 * SWDP API에 대한 Mock 구현을 제공합니다.
 * 내부망 환경이 없는 상태에서 개발 및 테스트에 활용됩니다.
 */

import { EventEmitter } from 'events';
import * as http from 'http';
import * as url from 'url';

/**
 * SWDP 빌드 상태 열거형
 */
enum SwdpBuildStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

/**
 * SWDP 테스트 상태 열거형
 */
enum SwdpTestStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

/**
 * SWDP 배포 상태 열거형
 */
enum SwdpDeploymentStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

/**
 * SWDP TR 상태 열거형
 */
enum SwdpTRStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CLOSED = 'closed'
}

/**
 * Mock 빌드 데이터 인터페이스
 */
interface MockBuild {
  buildId: string;
  type: string;
  status: SwdpBuildStatus;
  watchMode: boolean;
  createPr: boolean;
  params: Record<string, any>;
  timestamp: string;
  logs: string[];
}

/**
 * Mock 테스트 데이터 인터페이스
 */
interface MockTest {
  testId: string;
  type: string;
  target?: string;
  status: SwdpTestStatus;
  params: Record<string, any>;
  timestamp: string;
  results: {
    passed: number;
    failed: number;
    total: number;
    details: string;
  };
}

/**
 * Mock TR 데이터 인터페이스
 */
interface MockTR {
  trId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  assignee?: string;
  status: SwdpTRStatus;
  timestamp: string;
}

/**
 * Mock 배포 데이터 인터페이스
 */
interface MockDeployment {
  deploymentId: string;
  environment: string;
  buildId: string;
  status: SwdpDeploymentStatus;
  params: Record<string, any>;
  timestamp: string;
}

/**
 * SWDP Mock 서비스 클래스
 */
export class SwdpMockService {
  /**
   * 이벤트 이미터
   */
  private eventEmitter = new EventEmitter();
  
  /**
   * HTTP 서버
   */
  private server: http.Server | null = null;
  
  /**
   * 서버 포트
   */
  private port: number;
  
  /**
   * 인증 토큰 맵
   */
  private authTokens: Map<string, string> = new Map();
  
  /**
   * Mock 빌드 맵
   */
  private builds: Map<string, MockBuild> = new Map();
  
  /**
   * Mock 테스트 맵
   */
  private tests: Map<string, MockTest> = new Map();
  
  /**
   * Mock TR 맵
   */
  private trs: Map<string, MockTR> = new Map();
  
  /**
   * Mock 배포 맵
   */
  private deployments: Map<string, MockDeployment> = new Map();
  
  /**
   * 자동 상태 업데이트를 위한 타이머 ID 맵
   */
  private timers: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * 사용자 인증 정보
   */
  private users: Map<string, { password: string, name: string }> = new Map();
  
  /**
   * 서버 실행 여부
   */
  private isRunning: boolean = false;
  
  /**
   * 네트워크 지연 모드 활성화 여부
   */
  private networkDelayEnabled: boolean = false;
  
  /**
   * 네트워크 지연 시간 (밀리초)
   */
  private networkDelay: number = 200;
  
  /**
   * 오류 발생 확률 (0-1)
   */
  private errorRate: number = 0;
  
  /**
   * SwdpMockService 생성자
   * @param port 서버 포트 (기본값: 8001)
   */
  constructor(port: number = 8001) {
    this.port = port;
    
    // 기본 사용자 추가
    this.users.set('admin', { password: 'admin123', name: '관리자' });
    this.users.set('developer', { password: 'dev123', name: '개발자' });
    this.users.set('tester', { password: 'test123', name: '테스터' });
  }
  
  /**
   * 서버 시작
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('SWDP Mock 서버가 이미 실행 중입니다.');
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        this.server = http.createServer((req, res) => {
          this.handleRequest(req, res);
        });
        
        this.server.listen(this.port, () => {
          this.isRunning = true;
          console.log(`SWDP Mock 서버가 포트 ${this.port}에서 시작되었습니다.`);
          resolve();
        });
        
        this.server.on('error', (error) => {
          console.error('SWDP Mock 서버 시작 중 오류 발생:', error);
          reject(error);
        });
      } catch (error) {
        console.error('SWDP Mock 서버 시작 중 오류 발생:', error);
        reject(error);
      }
    });
  }
  
  /**
   * 서버 중지
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      console.log('SWDP Mock 서버가 실행 중이 아닙니다.');
      return;
    }
    
    return new Promise((resolve, reject) => {
      // 모든 타이머 정리
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      this.timers.clear();
      
      this.server!.close((error) => {
        if (error) {
          console.error('SWDP Mock 서버 중지 중 오류 발생:', error);
          reject(error);
          return;
        }
        
        this.isRunning = false;
        console.log('SWDP Mock 서버가 중지되었습니다.');
        resolve();
      });
    });
  }
  
  /**
   * 네트워크 지연 모드 설정
   * @param enabled 활성화 여부
   * @param delay 지연 시간 (밀리초)
   */
  setNetworkDelay(enabled: boolean, delay: number = 200): void {
    this.networkDelayEnabled = enabled;
    this.networkDelay = delay;
    console.log(`네트워크 지연 모드: ${enabled ? '활성화' : '비활성화'} (${delay}ms)`);
  }
  
  /**
   * 오류 발생 확률 설정
   * @param rate 오류 발생 확률 (0-1)
   */
  setErrorRate(rate: number): void {
    this.errorRate = Math.max(0, Math.min(1, rate));
    console.log(`오류 발생 확률: ${this.errorRate * 100}%`);
  }
  
  /**
   * 새 사용자 추가
   * @param userId 사용자 ID
   * @param password 비밀번호
   * @param name 이름
   */
  addUser(userId: string, password: string, name: string): void {
    this.users.set(userId, { password, name });
    console.log(`사용자 추가됨: ${userId}`);
  }
  
  /**
   * HTTP 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-ID');
    
    // OPTIONS 요청 (CORS preflight) 처리
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    // 네트워크 지연 시뮬레이션
    if (this.networkDelayEnabled) {
      await new Promise(resolve => setTimeout(resolve, this.networkDelay));
    }
    
    // 오류 시뮬레이션
    if (Math.random() < this.errorRate) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '서버 내부 오류가 발생했습니다.' }));
      return;
    }
    
    // URL 파싱
    const parsedUrl = url.parse(req.url || '/', true);
    const path = parsedUrl.pathname || '/';
    
    try {
      // API 엔드포인트 라우팅
      if (path === '/api/v1/auth/login') {
        await this.handleLogin(req, res);
      } else if (path === '/api/v1/system/status') {
        await this.handleSystemStatus(req, res);
      } else if (path === '/api/v1/builds' && req.method === 'POST') {
        await this.handleCreateBuild(req, res);
      } else if (path.match(/^\/api\/v1\/builds\/[^/]+\/status$/)) {
        await this.handleBuildStatus(req, res, path);
      } else if (path === '/api/v1/builds/recent/status') {
        await this.handleRecentBuildStatus(req, res);
      } else if (path.match(/^\/api\/v1\/builds\/[^/]+\/logs$/)) {
        await this.handleBuildLogs(req, res, path);
      } else if (path.match(/^\/api\/v1\/builds\/[^/]+\/cancel$/)) {
        await this.handleCancelBuild(req, res, path);
      } else if (path === '/api/v1/tests' && req.method === 'POST') {
        await this.handleCreateTest(req, res);
      } else if (path.match(/^\/api\/v1\/tests\/[^/]+\/results$/)) {
        await this.handleTestResults(req, res, path);
      } else if (path === '/api/v1/tr' && req.method === 'POST') {
        await this.handleCreateTR(req, res);
      } else if (path.match(/^\/api\/v1\/tr\/[^/]+$/)) {
        await this.handleTRStatus(req, res, path);
      } else if (path === '/api/v1/deployments' && req.method === 'POST') {
        await this.handleCreateDeployment(req, res);
      } else if (path.match(/^\/api\/v1\/deployments\/[^/]+\/status$/)) {
        await this.handleDeploymentStatus(req, res, path);
      } else {
        // 알 수 없는 엔드포인트
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '엔드포인트를 찾을 수 없습니다.' }));
      }
    } catch (error) {
      console.error('요청 처리 중 오류 발생:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '서버 내부 오류가 발생했습니다.' }));
    }
  }
  
  /**
   * 요청 본문 읽기
   * @param req HTTP 요청
   * @returns 요청 본문 객체
   */
  private async readRequestBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      const bodyChunks: any[] = [];
      req.on('data', (chunk) => {
        bodyChunks.push(chunk);
      });
      req.on('end', () => {
        try {
          const bodyString = Buffer.concat(bodyChunks).toString();
          const body = bodyString ? JSON.parse(bodyString) : {};
          resolve(body);
        } catch (error) {
          reject(error);
        }
      });
      req.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  /**
   * 인증 확인
   * @param req HTTP 요청
   * @returns 인증 성공 여부 및 사용자 ID
   */
  private checkAuth(req: http.IncomingMessage): { authorized: boolean, userId?: string } {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return { authorized: false };
    }
    
    // Bearer 토큰 추출
    const tokenMatch = authHeader.toString().match(/^Bearer\s+(.+)$/);
    if (!tokenMatch) {
      return { authorized: false };
    }
    
    const token = tokenMatch[1];
    const userId = this.authTokens.get(token);
    
    if (!userId) {
      return { authorized: false };
    }
    
    return { authorized: true, userId };
  }
  
  /**
   * 새로운 ID 생성
   * @returns 생성된 ID
   */
  private generateId(): string {
    return Math.floor(Math.random() * 100000).toString();
  }
  
  /**
   * 로그인 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   */
  private async handleLogin(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const body = await this.readRequestBody(req);
      
      if (!body.userId || !body.password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '사용자 ID와 비밀번호가 필요합니다.' }));
        return;
      }
      
      // 사용자 인증
      const user = this.users.get(body.userId);
      if (!user || user.password !== body.password) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '인증 실패: 유효하지 않은 사용자 ID 또는 비밀번호' }));
        return;
      }
      
      // 토큰 생성
      const token = `mock_token_${body.userId}_${Date.now()}`;
      this.authTokens.set(token, body.userId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ token, userId: body.userId, name: user.name }));
    } catch (error) {
      console.error('로그인 처리 중 오류 발생:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '로그인 처리 중 오류가 발생했습니다.' }));
    }
  }
  
  /**
   * 시스템 상태 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   */
  private async handleSystemStatus(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // 인증 확인
    const authResult = this.checkAuth(req);
    if (!authResult.authorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '인증이 필요합니다.' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        cache: 'ok',
        messaging: 'ok'
      }
    }));
  }
  
  /**
   * 빌드 생성 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   */
  private async handleCreateBuild(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // 인증 확인
    const authResult = this.checkAuth(req);
    if (!authResult.authorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '인증이 필요합니다.' }));
      return;
    }
    
    try {
      const body = await this.readRequestBody(req);
      
      // 필수 필드 확인
      if (!body.type) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '빌드 타입이 필요합니다.' }));
        return;
      }
      
      // 빌드 ID 생성
      const buildId = this.generateId();
      
      // 빌드 생성
      const build: MockBuild = {
        buildId,
        type: body.type,
        status: SwdpBuildStatus.PENDING,
        watchMode: body.watchMode || false,
        createPr: body.createPr || false,
        params: body.params || {},
        timestamp: body.timestamp || new Date().toISOString(),
        logs: ['빌드 준비 중...']
      };
      
      this.builds.set(buildId, build);
      
      // 빌드 상태 자동 업데이트 시작
      this.startBuildStatusUpdates(buildId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        buildId,
        status: build.status,
        timestamp: build.timestamp
      }));
    } catch (error) {
      console.error('빌드 생성 중 오류 발생:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '빌드 생성 중 오류가 발생했습니다.' }));
    }
  }
  
  /**
   * 빌드 상태 자동 업데이트 시작
   * @param buildId 빌드 ID
   */
  private startBuildStatusUpdates(buildId: string): void {
    const build = this.builds.get(buildId);
    if (!build) return;
    
    // 단계별 로그 및 상태 업데이트
    const updateSteps = [
      {
        delay: 2000,
        status: SwdpBuildStatus.RUNNING,
        logMessage: '소스 코드 다운로드 중...'
      },
      {
        delay: 3000,
        status: SwdpBuildStatus.RUNNING,
        logMessage: '의존성 설치 중...'
      },
      {
        delay: 4000,
        status: SwdpBuildStatus.RUNNING,
        logMessage: '컴파일 및 빌드 중...'
      },
      {
        delay: 3000,
        status: SwdpBuildStatus.RUNNING,
        logMessage: '테스트 실행 중...'
      },
      {
        delay: 2000,
        status: SwdpBuildStatus.SUCCESS,
        logMessage: '빌드 완료: 성공!'
      }
    ];
    
    let totalDelay = 0;
    
    // 각 단계별 업데이트 예약
    updateSteps.forEach((step, index) => {
      totalDelay += step.delay;
      
      const timerId = setTimeout(() => {
        const currentBuild = this.builds.get(buildId);
        if (!currentBuild) return;
        
        // 이전에 취소된 빌드는 업데이트하지 않음
        if (currentBuild.status === SwdpBuildStatus.CANCELED) return;
        
        // 상태 및 로그 업데이트
        currentBuild.status = step.status;
        currentBuild.logs.push(step.logMessage);
        
        console.log(`빌드 ${buildId} 상태 업데이트: ${step.status}, 로그: ${step.logMessage}`);
        
        // 가끔 랜덤하게 실패하도록 설정 (10% 확률)
        if (index === updateSteps.length - 1 && Math.random() < 0.1) {
          currentBuild.status = SwdpBuildStatus.FAILED;
          currentBuild.logs.push('빌드 실패: 오류가 발생했습니다.');
          console.log(`빌드 ${buildId} 실패로 설정됨`);
        }
      }, totalDelay);
      
      // 타이머 ID 저장 (정리를 위해)
      this.timers.set(`build_${buildId}_${index}`, timerId);
    });
  }
  
  /**
   * 빌드 상태 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   * @param path 요청 경로
   */
  private async handleBuildStatus(req: http.IncomingMessage, res: http.ServerResponse, path: string): Promise<void> {
    // 인증 확인
    const authResult = this.checkAuth(req);
    if (!authResult.authorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '인증이 필요합니다.' }));
      return;
    }
    
    // 빌드 ID 추출
    const buildIdMatch = path.match(/^\/api\/v1\/builds\/([^/]+)\/status$/);
    if (!buildIdMatch) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 빌드 ID 형식입니다.' }));
      return;
    }
    
    const buildId = buildIdMatch[1];
    const build = this.builds.get(buildId);
    
    if (!build) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '빌드를 찾을 수 없습니다.' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      buildId: build.buildId,
      status: build.status,
      type: build.type,
      timestamp: build.timestamp,
      watchMode: build.watchMode,
      createPr: build.createPr
    }));
  }
  
  /**
   * 최근 빌드 상태 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   */
  private async handleRecentBuildStatus(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // 인증 확인
    const authResult = this.checkAuth(req);
    if (!authResult.authorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '인증이 필요합니다.' }));
      return;
    }
    
    // 빌드가 없는 경우
    if (this.builds.size === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '빌드를 찾을 수 없습니다.' }));
      return;
    }
    
    // 가장 최근 빌드 찾기
    let latestBuild: MockBuild | null = null;
    for (const build of this.builds.values()) {
      if (!latestBuild || new Date(build.timestamp) > new Date(latestBuild.timestamp)) {
        latestBuild = build;
      }
    }
    
    if (!latestBuild) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '빌드를 찾을 수 없습니다.' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      buildId: latestBuild.buildId,
      status: latestBuild.status,
      type: latestBuild.type,
      timestamp: latestBuild.timestamp,
      watchMode: latestBuild.watchMode,
      createPr: latestBuild.createPr
    }));
  }
  
  /**
   * 빌드 로그 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   * @param path 요청 경로
   */
  private async handleBuildLogs(req: http.IncomingMessage, res: http.ServerResponse, path: string): Promise<void> {
    // 인증 확인
    const authResult = this.checkAuth(req);
    if (!authResult.authorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '인증이 필요합니다.' }));
      return;
    }
    
    // 빌드 ID 추출
    const buildIdMatch = path.match(/^\/api\/v1\/builds\/([^/]+)\/logs$/);
    if (!buildIdMatch) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 빌드 ID 형식입니다.' }));
      return;
    }
    
    const buildId = buildIdMatch[1];
    const build = this.builds.get(buildId);
    
    if (!build) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '빌드를 찾을 수 없습니다.' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      buildId: build.buildId,
      logs: build.logs.join('\n'),
      timestamp: new Date().toISOString()
    }));
  }
  
  /**
   * 빌드 취소 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   * @param path 요청 경로
   */
  private async handleCancelBuild(req: http.IncomingMessage, res: http.ServerResponse, path: string): Promise<void> {
    // 인증 확인
    const authResult = this.checkAuth(req);
    if (!authResult.authorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '인증이 필요합니다.' }));
      return;
    }
    
    // 빌드 ID 추출
    const buildIdMatch = path.match(/^\/api\/v1\/builds\/([^/]+)\/cancel$/);
    if (!buildIdMatch) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 빌드 ID 형식입니다.' }));
      return;
    }
    
    const buildId = buildIdMatch[1];
    const build = this.builds.get(buildId);
    
    if (!build) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '빌드를 찾을 수 없습니다.' }));
      return;
    }
    
    // 이미 완료된 빌드는 취소 불가
    if (build.status === SwdpBuildStatus.SUCCESS || build.status === SwdpBuildStatus.FAILED) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '이미 완료된 빌드는 취소할 수 없습니다.' }));
      return;
    }
    
    // 빌드 취소
    build.status = SwdpBuildStatus.CANCELED;
    build.logs.push('빌드가 사용자에 의해 취소되었습니다.');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      buildId: build.buildId,
      status: build.status,
      timestamp: new Date().toISOString()
    }));
  }
  
  /**
   * 테스트 생성 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   */
  private async handleCreateTest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // 인증 확인
    const authResult = this.checkAuth(req);
    if (!authResult.authorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '인증이 필요합니다.' }));
      return;
    }
    
    try {
      const body = await this.readRequestBody(req);
      
      // 필수 필드 확인
      if (!body.type) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '테스트 타입이 필요합니다.' }));
        return;
      }
      
      // 테스트 ID 생성
      const testId = this.generateId();
      
      // 테스트 생성
      const test: MockTest = {
        testId,
        type: body.type,
        target: body.target,
        status: SwdpTestStatus.PENDING,
        params: body.params || {},
        timestamp: body.timestamp || new Date().toISOString(),
        results: {
          passed: 0,
          failed: 0,
          total: 0,
          details: ''
        }
      };
      
      this.tests.set(testId, test);
      
      // 테스트 상태 자동 업데이트 시작
      this.startTestStatusUpdates(testId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        testId,
        status: test.status,
        timestamp: test.timestamp
      }));
    } catch (error) {
      console.error('테스트 생성 중 오류 발생:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '테스트 생성 중 오류가 발생했습니다.' }));
    }
  }
  
  /**
   * 테스트 상태 자동 업데이트 시작
   * @param testId 테스트 ID
   */
  private startTestStatusUpdates(testId: string): void {
    const test = this.tests.get(testId);
    if (!test) return;
    
    // 테스트 종류에 따라 가상의 테스트 케이스 수 결정
    let totalTests: number;
    switch (test.type) {
      case 'unit':
        totalTests = Math.floor(Math.random() * 50) + 10; // 10-59 테스트
        break;
      case 'integration':
        totalTests = Math.floor(Math.random() * 20) + 5; // 5-24 테스트
        break;
      case 'system':
        totalTests = Math.floor(Math.random() * 10) + 3; // 3-12 테스트
        break;
      default:
        totalTests = Math.floor(Math.random() * 30) + 5; // 5-34 테스트
    }
    
    // 5초 후 테스트 실행 중 상태로 변경
    const runningTimerId = setTimeout(() => {
      const currentTest = this.tests.get(testId);
      if (!currentTest) return;
      
      currentTest.status = SwdpTestStatus.RUNNING;
    }, 2000);
    
    this.timers.set(`test_${testId}_running`, runningTimerId);
    
    // 10초 후 테스트 완료
    const completedTimerId = setTimeout(() => {
      const currentTest = this.tests.get(testId);
      if (!currentTest) return;
      
      // 실패한 테스트 수 (실패율 약 5-15%)
      const failedTests = Math.floor(totalTests * (0.05 + Math.random() * 0.1));
      const passedTests = totalTests - failedTests;
      
      currentTest.results = {
        passed: passedTests,
        failed: failedTests,
        total: totalTests,
        details: this.generateTestDetails(passedTests, failedTests, test.type)
      };
      
      currentTest.status = failedTests > 0 ? SwdpTestStatus.FAILED : SwdpTestStatus.SUCCESS;
    }, 8000);
    
    this.timers.set(`test_${testId}_completed`, completedTimerId);
  }
  
  /**
   * 테스트 세부 정보 생성
   * @param passed 통과한 테스트 수
   * @param failed 실패한 테스트 수
   * @param type 테스트 타입
   * @returns 테스트 세부 정보 문자열
   */
  private generateTestDetails(passed: number, failed: number, type: string): string {
    let details = `${type.toUpperCase()} 테스트 결과:\n`;
    details += `총 테스트: ${passed + failed}\n`;
    details += `통과: ${passed}\n`;
    details += `실패: ${failed}\n\n`;
    
    if (failed > 0) {
      details += '실패한 테스트:\n';
      
      for (let i = 0; i < failed; i++) {
        const testName = this.generateTestName(type);
        const errorMessage = this.generateErrorMessage();
        details += `- ${testName}: ${errorMessage}\n`;
      }
    }
    
    return details;
  }
  
  /**
   * 테스트 이름 생성
   * @param type 테스트 타입
   * @returns 테스트 이름
   */
  private generateTestName(type: string): string {
    const unitTestNames = [
      'should calculate correct sum',
      'should return null when input is invalid',
      'should throw error for negative values',
      'should parse JSON correctly',
      'should validate user input',
      'should format date string properly',
      'should encrypt password securely'
    ];
    
    const integrationTestNames = [
      'should connect to database successfully',
      'should handle API request correctly',
      'should process form submission',
      'should authenticate user credentials',
      'should sync data between services'
    ];
    
    const systemTestNames = [
      'should complete end-to-end workflow',
      'should handle concurrent user requests',
      'should maintain data integrity during failover',
      'should respond within performance requirements'
    ];
    
    let names: string[];
    switch (type) {
      case 'unit':
        names = unitTestNames;
        break;
      case 'integration':
        names = integrationTestNames;
        break;
      case 'system':
        names = systemTestNames;
        break;
      default:
        names = [...unitTestNames, ...integrationTestNames, ...systemTestNames];
    }
    
    return names[Math.floor(Math.random() * names.length)];
  }
  
  /**
   * 오류 메시지 생성
   * @returns 오류 메시지
   */
  private generateErrorMessage(): string {
    const errorMessages = [
      'Expected true but got false',
      'TypeError: Cannot read property of undefined',
      'AssertionError: expected 42 to equal 43',
      'Timeout - test exceeded 5000ms',
      'Network request failed',
      'Failed to parse response: Unexpected token',
      'Database connection refused'
    ];
    
    return errorMessages[Math.floor(Math.random() * errorMessages.length)];
  }
  
  /**
   * 테스트 결과 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   * @param path 요청 경로
   */
  private async handleTestResults(req: http.IncomingMessage, res: http.ServerResponse, path: string): Promise<void> {
    // 인증 확인
    const authResult = this.checkAuth(req);
    if (!authResult.authorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '인증이 필요합니다.' }));
      return;
    }
    
    // 테스트 ID 추출
    const testIdMatch = path.match(/^\/api\/v1\/tests\/([^/]+)\/results$/);
    if (!testIdMatch) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 테스트 ID 형식입니다.' }));
      return;
    }
    
    const testId = testIdMatch[1];
    const test = this.tests.get(testId);
    
    if (!test) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '테스트를 찾을 수 없습니다.' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      testId: test.testId,
      status: test.status,
      type: test.type,
      target: test.target,
      passed: test.results.passed,
      failed: test.results.failed,
      total: test.results.total,
      details: test.results.details,
      timestamp: test.timestamp
    }));
  }
  
  /**
   * TR(Test Request) 생성 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   */
  private async handleCreateTR(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // 인증 확인
    const authResult = this.checkAuth(req);
    if (!authResult.authorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '인증이 필요합니다.' }));
      return;
    }
    
    try {
      const body = await this.readRequestBody(req);
      
      // 필수 필드 확인
      if (!body.title || !body.description || !body.type) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '제목, 설명, 유형이 필요합니다.' }));
        return;
      }
      
      // TR ID 생성
      const trId = `TR-${this.generateId()}`;
      
      // TR 생성
      const tr: MockTR = {
        trId,
        title: body.title,
        description: body.description,
        type: body.type,
        priority: body.priority || 'medium',
        assignee: body.assignee,
        status: SwdpTRStatus.DRAFT,
        timestamp: body.timestamp || new Date().toISOString()
      };
      
      this.trs.set(trId, tr);
      
      // TR 상태 자동 업데이트 시작
      this.startTRStatusUpdates(trId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        trId,
        status: tr.status,
        timestamp: tr.timestamp
      }));
    } catch (error) {
      console.error('TR 생성 중 오류 발생:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'TR 생성 중 오류가 발생했습니다.' }));
    }
  }
  
  /**
   * TR 상태 자동 업데이트 시작
   * @param trId TR ID
   */
  private startTRStatusUpdates(trId: string): void {
    const tr = this.trs.get(trId);
    if (!tr) return;
    
    // 상태 업데이트 단계 및 지연 시간
    const statusUpdates = [
      { status: SwdpTRStatus.SUBMITTED, delay: 5000 },
      { status: SwdpTRStatus.IN_REVIEW, delay: 10000 },
      { status: SwdpTRStatus.APPROVED, delay: 15000 }
    ];
    
    let totalDelay = 0;
    
    // 각 단계별 업데이트 예약
    statusUpdates.forEach((update, index) => {
      totalDelay += update.delay;
      
      const timerId = setTimeout(() => {
        const currentTR = this.trs.get(trId);
        if (!currentTR) return;
        
        currentTR.status = update.status;
        console.log(`TR ${trId} 상태 업데이트: ${update.status}`);
        
        // 마지막 단계에서 랜덤하게 승인 또는 거부 (80% 승인, 20% 거부)
        if (index === statusUpdates.length - 1 && Math.random() < 0.2) {
          currentTR.status = SwdpTRStatus.REJECTED;
          console.log(`TR ${trId} 거부됨`);
        }
      }, totalDelay);
      
      this.timers.set(`tr_${trId}_${index}`, timerId);
    });
  }
  
  /**
   * TR 상태 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   * @param path 요청 경로
   */
  private async handleTRStatus(req: http.IncomingMessage, res: http.ServerResponse, path: string): Promise<void> {
    // 인증 확인
    const authResult = this.checkAuth(req);
    if (!authResult.authorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '인증이 필요합니다.' }));
      return;
    }
    
    // TR ID 추출
    const trIdMatch = path.match(/^\/api\/v1\/tr\/([^/]+)$/);
    if (!trIdMatch) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 TR ID 형식입니다.' }));
      return;
    }
    
    const trId = trIdMatch[1];
    const tr = this.trs.get(trId);
    
    if (!tr) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'TR을 찾을 수 없습니다.' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      trId: tr.trId,
      title: tr.title,
      description: tr.description,
      type: tr.type,
      priority: tr.priority,
      assignee: tr.assignee,
      status: tr.status,
      timestamp: tr.timestamp
    }));
  }
  
  /**
   * 배포 생성 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   */
  private async handleCreateDeployment(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // 인증 확인
    const authResult = this.checkAuth(req);
    if (!authResult.authorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '인증이 필요합니다.' }));
      return;
    }
    
    try {
      const body = await this.readRequestBody(req);
      
      // 필수 필드 확인
      if (!body.environment || !body.buildId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '환경과 빌드 ID가 필요합니다.' }));
        return;
      }
      
      // 배포 ID 생성
      const deploymentId = this.generateId();
      
      // 배포 생성
      const deployment: MockDeployment = {
        deploymentId,
        environment: body.environment,
        buildId: body.buildId,
        status: SwdpDeploymentStatus.PENDING,
        params: body.params || {},
        timestamp: body.timestamp || new Date().toISOString()
      };
      
      this.deployments.set(deploymentId, deployment);
      
      // 배포 상태 자동 업데이트 시작
      this.startDeploymentStatusUpdates(deploymentId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        deploymentId,
        status: deployment.status,
        timestamp: deployment.timestamp
      }));
    } catch (error) {
      console.error('배포 생성 중 오류 발생:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '배포 생성 중 오류가 발생했습니다.' }));
    }
  }
  
  /**
   * 배포 상태 자동 업데이트 시작
   * @param deploymentId 배포 ID
   */
  private startDeploymentStatusUpdates(deploymentId: string): void {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return;
    
    // 환경에 따라 배포 시간 및 성공 확률 결정
    let totalDuration = 5000; // 기본 5초
    let successRate = 0.9; // 기본 90% 성공
    
    switch (deployment.environment.toLowerCase()) {
      case 'dev':
        totalDuration = 5000; // 5초
        successRate = 0.95; // 95% 성공
        break;
      case 'staging':
        totalDuration = 8000; // 8초
        successRate = 0.9; // 90% 성공
        break;
      case 'prod':
      case 'production':
        totalDuration = 12000; // 12초
        successRate = 0.85; // 85% 성공
        break;
      default:
        totalDuration = 5000;
        successRate = 0.9;
    }
    
    // 배포 시작 (RUNNING 상태로 변경)
    const runningTimerId = setTimeout(() => {
      const currentDeployment = this.deployments.get(deploymentId);
      if (!currentDeployment) return;
      
      currentDeployment.status = SwdpDeploymentStatus.RUNNING;
    }, 2000);
    
    this.timers.set(`deployment_${deploymentId}_running`, runningTimerId);
    
    // 배포 완료
    const completedTimerId = setTimeout(() => {
      const currentDeployment = this.deployments.get(deploymentId);
      if (!currentDeployment) return;
      
      // 성공 또는 실패 결정
      currentDeployment.status = Math.random() < successRate ? 
        SwdpDeploymentStatus.SUCCESS : SwdpDeploymentStatus.FAILED;
    }, totalDuration);
    
    this.timers.set(`deployment_${deploymentId}_completed`, completedTimerId);
  }
  
  /**
   * 배포 상태 요청 처리
   * @param req HTTP 요청
   * @param res HTTP 응답
   * @param path 요청 경로
   */
  private async handleDeploymentStatus(req: http.IncomingMessage, res: http.ServerResponse, path: string): Promise<void> {
    // 인증 확인
    const authResult = this.checkAuth(req);
    if (!authResult.authorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '인증이 필요합니다.' }));
      return;
    }
    
    // 배포 ID 추출
    const deploymentIdMatch = path.match(/^\/api\/v1\/deployments\/([^/]+)\/status$/);
    if (!deploymentIdMatch) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 배포 ID 형식입니다.' }));
      return;
    }
    
    const deploymentId = deploymentIdMatch[1];
    const deployment = this.deployments.get(deploymentId);
    
    if (!deployment) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '배포를 찾을 수 없습니다.' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      deploymentId: deployment.deploymentId,
      environment: deployment.environment,
      buildId: deployment.buildId,
      status: deployment.status,
      timestamp: deployment.timestamp
    }));
  }
}