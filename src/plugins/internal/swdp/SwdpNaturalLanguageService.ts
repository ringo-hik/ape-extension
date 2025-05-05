/**
 * SWDP 자연어 서비스
 * 
 * SWDP 관련 자연어 처리 및 명령어 변환 기능 제공
 * 사용자의 질문을 SWDP 명령어로 변환
 */

import { PluginNaturalLanguageService } from '../../../core/plugin-system/llm/PluginNaturalLanguageService';
import { SwdpDomainService } from '../../../core/domain/SwdpDomainService';
import { SwdpWorkflowService } from '../../../core/workflow/SwdpWorkflowService';
import { ConfigService } from '../../../core/config/ConfigService';
import { UserAuthService } from '../../../core/auth/UserAuthService';

/**
 * SWDP 자연어 처리 서비스 클래스
 */
export class SwdpNaturalLanguageService extends PluginNaturalLanguageService {
  /**
   * SWDP 도메인 서비스
   */
  private swdpDomainService: SwdpDomainService;
  
  /**
   * SWDP 워크플로우 서비스
   */
  private swdpWorkflowService: SwdpWorkflowService;
  
  /**
   * 설정 서비스
   */
  private configService: ConfigService;
  
  /**
   * 사용자 인증 서비스
   */
  private userAuthService: UserAuthService;
  
  /**
   * SWDP 자연어 처리 서비스 생성자
   */
  constructor() {
    super('swdp');
    
    this.swdpDomainService = SwdpDomainService.getInstance();
    this.swdpWorkflowService = SwdpWorkflowService.getInstance();
    this.configService = ConfigService.getInstance();
    this.userAuthService = UserAuthService.getInstance();
  }
  
  /**
   * 자연어 질문을 SWDP 명령어로 변환
   * @param question 사용자 질문
   * @returns SWDP 명령어 또는 null (처리할 수 없는 경우)
   */
  public async processNaturalLanguage(question: string): Promise<string | null> {
    // 질문 전처리 및 소문자 변환
    const normalizedQuestion = question.trim().toLowerCase();
    
    // 프로젝트 관련 질문 처리
    if (this.isProjectRelatedQuestion(normalizedQuestion)) {
      return this.processProjectQuestion(normalizedQuestion);
    }
    
    // 작업 관련 질문 처리
    if (this.isTaskRelatedQuestion(normalizedQuestion)) {
      return this.processTaskQuestion(normalizedQuestion);
    }
    
    // 빌드 관련 질문 처리
    if (this.isBuildRelatedQuestion(normalizedQuestion)) {
      return this.processBuildQuestion(normalizedQuestion);
    }
    
    // 문서 관련 질문 처리
    if (this.isDocumentRelatedQuestion(normalizedQuestion)) {
      return this.processDocumentQuestion(normalizedQuestion);
    }
    
    // 기타 명령어로 변환할 수 없는 경우
    return null;
  }
  
  /**
   * 프로젝트 관련 질문인지 확인
   * @param question 질문
   * @returns 프로젝트 관련 여부
   */
  private isProjectRelatedQuestion(question: string): boolean {
    const projectKeywords = [
      '프로젝트', '프로젝트 목록', '프로젝트 리스트', '프로젝트 정보',
      'project', 'projects', 'project list', 'project info'
    ];
    
    return projectKeywords.some(keyword => question.includes(keyword));
  }
  
  /**
   * 작업 관련 질문인지 확인
   * @param question 질문
   * @returns 작업 관련 여부
   */
  private isTaskRelatedQuestion(question: string): boolean {
    const taskKeywords = [
      '작업', '작업 목록', '작업 리스트', '작업 정보', '태스크',
      'task', 'tasks', 'task list', 'task info'
    ];
    
    return taskKeywords.some(keyword => question.includes(keyword));
  }
  
  /**
   * 빌드 관련 질문인지 확인
   * @param question 질문
   * @returns 빌드 관련 여부
   */
  private isBuildRelatedQuestion(question: string): boolean {
    const buildKeywords = [
      '빌드', '빌드 시작', '빌드 상태', '빌드 로그', '빌드 취소',
      'build', 'build start', 'build status', 'build log', 'build cancel'
    ];
    
    return buildKeywords.some(keyword => question.includes(keyword));
  }
  
  /**
   * 문서 관련 질문인지 확인
   * @param question 질문
   * @returns 문서 관련 여부
   */
  private isDocumentRelatedQuestion(question: string): boolean {
    const documentKeywords = [
      '문서', '문서 목록', '문서 리스트', '문서 정보', '도큐먼트',
      'document', 'documents', 'document list', 'document info'
    ];
    
    return documentKeywords.some(keyword => question.includes(keyword));
  }
  
  /**
   * 프로젝트 관련 질문 처리
   * @param question 질문
   * @returns SWDP 명령어
   */
  private processProjectQuestion(question: string): string {
    // 프로젝트 목록 요청
    if (question.includes('목록') || question.includes('리스트') || 
        question.includes('list') || question.match(/프로젝트(\s+)?$/) || 
        question.match(/projects?(\s+)?$/)) {
      return '@swdp:projects';
    }
    
    // 프로젝트 상세 정보 요청
    const projectCodeMatch = question.match(/프로젝트\s+정보\s+(\w+)/) || 
                             question.match(/프로젝트\s+(\w+)/) || 
                             question.match(/project\s+info\s+(\w+)/) || 
                             question.match(/project\s+(\w+)/);
    
    if (projectCodeMatch) {
      return `@swdp:project ${projectCodeMatch[1]}`;
    }
    
    // 현재 프로젝트 설정 요청
    const setProjectMatch = question.match(/프로젝트\s+설정\s+(\w+)/) || 
                           question.match(/프로젝트\s+선택\s+(\w+)/) || 
                           question.match(/set\s+project\s+(\w+)/);
    
    if (setProjectMatch) {
      return `@swdp:set-project ${setProjectMatch[1]}`;
    }
    
    // 기본값: 프로젝트 목록
    return '@swdp:projects';
  }
  
  /**
   * 작업 관련 질문 처리
   * @param question 질문
   * @returns SWDP 명령어
   */
  private processTaskQuestion(question: string): string {
    // 작업 목록 요청
    if (question.includes('목록') || question.includes('리스트') || 
        question.includes('list') || question.match(/작업(\s+)?$/) || 
        question.match(/tasks?(\s+)?$/)) {
      // 프로젝트 코드가 있는지 확인
      const projectCodeMatch = question.match(/프로젝트\s+(\w+)/) || 
                              question.match(/project\s+(\w+)/);
      
      return projectCodeMatch ? 
        `@swdp:tasks ${projectCodeMatch[1]}` : 
        '@swdp:tasks';
    }
    
    // 작업 상세 정보 요청
    const taskIdMatch = question.match(/작업\s+정보\s+(\w+)/) || 
                       question.match(/작업\s+(\w+)/) || 
                       question.match(/task\s+info\s+(\w+)/) || 
                       question.match(/task\s+(\w+)/);
    
    if (taskIdMatch) {
      return `@swdp:task ${taskIdMatch[1]}`;
    }
    
    // 작업 생성 요청
    if (question.includes('생성') || question.includes('추가') || 
        question.includes('create') || question.includes('add')) {
      const titleMatch = question.match(/"([^"]+)"/) || question.match(/'([^']+)'/);
      const descriptionMatch = question.match(/내용[은|이]?\s+"([^"]+)"/) || 
                              question.match(/내용[은|이]?\s+'([^']+)'/) || 
                              question.match(/description\s+"([^"]+)"/) || 
                              question.match(/description\s+'([^']+)'/);
      
      if (titleMatch) {
        const title = titleMatch[1];
        const description = descriptionMatch ? descriptionMatch[1] : '자동 생성된 작업';
        
        // 프로젝트 코드가 있는지 확인
        const projectCodeMatch = question.match(/프로젝트\s+(\w+)/) || 
                                question.match(/project\s+(\w+)/);
        
        return projectCodeMatch ? 
          `@swdp:create-task "${title}" "${description}" ${projectCodeMatch[1]}` : 
          `@swdp:create-task "${title}" "${description}"`;
      }
    }
    
    // 작업 상태 업데이트 요청
    if (question.includes('상태') || question.includes('업데이트') || 
        question.includes('변경') || question.includes('update') || 
        question.includes('status') || question.includes('change')) {
      const taskIdMatch = question.match(/작업\s+(\w+)/) || 
                         question.match(/task\s+(\w+)/);
      
      const statusMatch = question.match(/상태[를|을]?\s+(\w+)/) || 
                         question.match(/status\s+(\w+)/);
      
      if (taskIdMatch && statusMatch) {
        return `@swdp:update-task ${taskIdMatch[1]} ${statusMatch[1]}`;
      }
    }
    
    // 기본값: 작업 목록
    return '@swdp:tasks';
  }
  
  /**
   * 빌드 관련 질문 처리
   * @param question 질문
   * @returns SWDP 명령어
   */
  private processBuildQuestion(question: string): string {
    // 빌드 시작 요청
    if (question.includes('시작') || question.includes('실행') || 
        question.includes('start') || question.includes('run')) {
      // 빌드 타입 확인
      let buildType = 'local'; // 기본 타입
      
      if (question.includes('전체') || question.includes('all')) {
        buildType = 'all';
      } else if (question.includes('통합') || question.includes('integration')) {
        buildType = 'integration';
      } else if (question.includes('레이어') || question.includes('layer')) {
        buildType = 'layer';
      }
      
      // 옵션 확인
      const options = [];
      
      if (question.includes('워치') || question.includes('watch')) {
        options.push('--watch');
      }
      
      if (question.includes('pr') || question.includes('pull request')) {
        options.push('--pr');
      }
      
      return `@swdp:build ${buildType} ${options.join(' ')}`.trim();
    }
    
    // 빌드 상태 확인 요청
    if (question.includes('상태') || question.includes('status')) {
      const buildIdMatch = question.match(/빌드\s+(\w+)/) || 
                          question.match(/build\s+(\w+)/);
      
      return buildIdMatch ? 
        `@swdp:build:status ${buildIdMatch[1]}` : 
        '@swdp:build:status';
    }
    
    // 빌드 로그 확인 요청
    if (question.includes('로그') || question.includes('log')) {
      const buildIdMatch = question.match(/빌드\s+(\w+)/) || 
                          question.match(/build\s+(\w+)/);
      
      if (buildIdMatch) {
        return `@swdp:build:logs ${buildIdMatch[1]}`;
      }
    }
    
    // 빌드 취소 요청
    if (question.includes('취소') || question.includes('중단') || 
        question.includes('cancel') || question.includes('stop')) {
      const buildIdMatch = question.match(/빌드\s+(\w+)/) || 
                          question.match(/build\s+(\w+)/);
      
      if (buildIdMatch) {
        return `@swdp:build:cancel ${buildIdMatch[1]}`;
      }
    }
    
    // 기본값: 빌드 상태
    return '@swdp:build:status';
  }
  
  /**
   * 문서 관련 질문 처리
   * @param question 질문
   * @returns SWDP 명령어
   */
  private processDocumentQuestion(question: string): string {
    // 문서 목록 요청
    if (question.includes('목록') || question.includes('리스트') || 
        question.includes('list') || question.match(/문서(\s+)?$/) || 
        question.match(/documents?(\s+)?$/)) {
      // 프로젝트 코드가 있는지 확인
      const projectCodeMatch = question.match(/프로젝트\s+(\w+)/) || 
                              question.match(/project\s+(\w+)/);
      
      return projectCodeMatch ? 
        `@swdp:documents ${projectCodeMatch[1]}` : 
        '@swdp:documents';
    }
    
    // 문서 상세 정보 요청
    const docIdMatch = question.match(/문서\s+정보\s+(\w+)/) || 
                      question.match(/문서\s+(\w+)/) || 
                      question.match(/document\s+info\s+(\w+)/) || 
                      question.match(/document\s+(\w+)/);
    
    if (docIdMatch) {
      return `@swdp:document ${docIdMatch[1]}`;
    }
    
    // 문서 생성 요청
    if (question.includes('생성') || question.includes('추가') || 
        question.includes('create') || question.includes('add')) {
      const titleMatch = question.match(/"([^"]+)"/) || question.match(/'([^']+)'/);
      const typeMatch = question.match(/타입[은|이]?\s+(\w+)/) || 
                       question.match(/유형[은|이]?\s+(\w+)/) || 
                       question.match(/type\s+(\w+)/);
      
      if (titleMatch && typeMatch) {
        const title = titleMatch[1];
        const type = typeMatch[1];
        
        // 내용 처리
        const contentMatch = question.match(/내용[은|이]?\s+"([^"]+)"/) || 
                            question.match(/내용[은|이]?\s+'([^']+)'/) || 
                            question.match(/content\s+"([^"]+)"/) || 
                            question.match(/content\s+'([^']+)'/);
        
        const content = contentMatch ? contentMatch[1] : '# ' + title + '\n\n자동 생성된 문서';
        
        // 프로젝트 코드가 있는지 확인
        const projectCodeMatch = question.match(/프로젝트\s+(\w+)/) || 
                                question.match(/project\s+(\w+)/);
        
        return projectCodeMatch ? 
          `@swdp:create-document "${title}" "${type}" "${content}" ${projectCodeMatch[1]}` : 
          `@swdp:create-document "${title}" "${type}" "${content}"`;
      }
    }
    
    // 기본값: 문서 목록
    return '@swdp:documents';
  }
  
  /**
   * 이 플러그인이 질문을 처리할 수 있는지 확인
   * @param question 사용자 질문
   * @returns 처리 가능 여부
   */
  public canProcessQuestion(question: string): boolean {
    const normalizedQuestion = question.trim().toLowerCase();
    
    // SWDP 관련 키워드 확인
    const swdpKeywords = [
      'swdp', '프로젝트', '작업', '빌드', '문서', '태스크',
      'project', 'task', 'build', 'document'
    ];
    
    return swdpKeywords.some(keyword => normalizedQuestion.includes(keyword));
  }
  
  /**
   * 도움말 생성
   * @returns 도움말 문자열
   */
  public getHelp(): string {
    return `
# SWDP 명령어 도움말

## 프로젝트 관련 명령어
- @swdp:projects - 프로젝트 목록 조회
- @swdp:project <project_code> - 프로젝트 세부 정보 조회
- @swdp:set-project <project_code> - 현재 작업 프로젝트 설정

## 작업 관련 명령어
- @swdp:tasks [project_code] - 작업 목록 조회
- @swdp:task <task_id> - 작업 세부 정보 조회
- @swdp:create-task <title> <description> [project_code] - 새 작업 생성
- @swdp:update-task <task_id> <status> - 작업 상태 업데이트

## 빌드 관련 명령어
- @swdp:build [type] [--watch] [--pr] - 빌드 시작
- @swdp:build:status [buildId] - 빌드 상태 확인
- @swdp:build:logs <buildId> - 빌드 로그 확인
- @swdp:build:cancel <buildId> - 빌드 취소

## 문서 관련 명령어
- @swdp:documents [project_code] - 문서 목록 조회
- @swdp:document <doc_id> - 문서 세부 정보 조회
- @swdp:create-document <title> <type> <content> [project_code] - 새 문서 생성

자연어 예시:
- "SWDP 프로젝트 목록 보여줘"
- "프로젝트 PRJ001 정보 알려줘"
- "현재 프로젝트를 PRJ001로 설정해줘"
- "작업 목록 보여줘"
- "작업 TASK001 상태를 in_progress로 변경해줘"
- "빌드 시작해줘 (local)"
- "문서 목록 보여줘"
    `.trim();
  }
}