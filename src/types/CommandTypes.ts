/**
 * 명령어 관련 타입 정의
 * 
 * APE 시스템의 명령어 처리를 위한 인터페이스 및 타입 정의
 */

/**
 * 명령어 접두사 열거형
 */
export enum CommandPrefix {
  /**
   * 접두사 없음
   */
  NONE = '',
  
  /**
   * @ 접두사 (에이전트 명령어 - LLM 기반 고급 기능, 도메인별 작업)
   */
  AT = '@',
  
  /**
   * / 접두사 (시스템 명령어 - UI 제어, 설정, 채팅 관리 등)
   */
  SLASH = '/'
}

/**
 * 명령어 유형 열거형
 */
export enum CommandType {
  /**
   * 일반 텍스트 (명령어 아님)
   */
  NONE = 'none',
  
  /**
   * @ 접두사 명령어 (에이전트 명령어)
   */
  AT = 'at',
  
  /**
   * / 접두사 명령어 (시스템 명령어)
   */
  SLASH = 'slash'
}

/**
 * 명령어 도메인 열거형
 * 에이전트 명령어(@)에서 사용되는 도메인 구분
 */
export enum CommandDomain {
  /**
   * 도메인 없음 (시스템 명령어 등)
   */
  NONE = 'none',
  
  /**
   * Git 관련 고급 기능
   */
  GIT = 'git',
  
  /**
   * 문서 관리 및 RAG 기능
   */
  DOC = 'doc',
  
  /**
   * Jira 이슈 관리
   */
  JIRA = 'jira',
  
  /**
   * Pocket API 연동
   */
  POCKET = 'pocket',
  
  /**
   * 지식 저장소 관리
   */
  VAULT = 'vault',
  
  /**
   * 프롬프트 룰 관리
   */
  RULES = 'rules',
  
  /**
   * SWDP 포털 연동
   */
  SWDP = 'swdp'
}

/**
 * 명령어 인터페이스 (확장 버전)
 */
export interface Command {
  /**
   * 명령어 접두사
   */
  prefix: CommandPrefix;
  
  /**
   * 명령어 유형
   */
  type: CommandType;
  
  /**
   * 명령어 도메인 (에이전트 명령어에만 적용)
   */
  domain: CommandDomain;
  
  /**
   * 에이전트/플러그인 ID
   */
  agentId: string;
  
  /**
   * 명령어 이름
   */
  command: string;
  
  /**
   * 하위 명령어 (옵션)
   */
  subCommand?: string;
  
  /**
   * 명령어 인자
   */
  args: any[];
  
  /**
   * 명령어 플래그
   */
  flags: Record<string, any>;
  
  /**
   * 세부 옵션 (이름-값 쌍)
   */
  options: Record<string, any>;
  
  /**
   * 원본 입력 문자열
   */
  rawInput: string;
}

/**
 * 파싱된 명령어 인터페이스 (확장 버전)
 */
export interface ParsedCommand {
  /**
   * 명령어 접두사
   */
  prefix: CommandPrefix;
  
  /**
   * 명령어 유형
   */
  type: CommandType;
  
  /**
   * 명령어 도메인 (에이전트 명령어에만 적용)
   */
  domain: CommandDomain;
  
  /**
   * 명령어 이름
   */
  command: string;
  
  /**
   * 하위 명령어 (옵션)
   */
  subCommand?: string;
  
  /**
   * 명령어 인자
   */
  args: any[];
  
  /**
   * 명령어 플래그
   */
  flags: Map<string, string | boolean>;
  
  /**
   * 세부 옵션 (이름-값 쌍)
   */
  options: Map<string, any>;
  
  /**
   * 원본 입력 문자열
   */
  raw: string;
  
  /**
   * 파싱 오류 여부
   */
  hasError?: boolean;
  
  /**
   * 오류 메시지
   */
  errorMessage?: string;
  
  /**
   * 추천 명령어 (오류 시 제안)
   */
  suggestions?: string[];
}

/**
 * 명령어 인터페이스 (확장 버전)
 */
export interface ICommand {
  /**
   * 명령어 ID
   */
  id: string;
  
  /**
   * 명령어 유형
   */
  type: CommandType;
  
  /**
   * 명령어 접두사
   */
  prefix: CommandPrefix;
  
  /**
   * 명령어 도메인 (에이전트 명령어에만 적용)
   */
  domain: CommandDomain;
  
  /**
   * 명령어 설명
   */
  description: string;
  
  /**
   * 명령어 예제
   */
  examples?: string[];
  
  /**
   * 명령어 핸들러
   */
  handler: (...args: any[]) => Promise<any>;
  
  /**
   * 명령어 그룹 (UI 표시용)
   */
  group?: string;
  
  /**
   * 단축키
   */
  shortcut?: string;
  
  /**
   * 자주 사용하는 명령어 여부
   */
  frequent?: boolean;
}

/**
 * 명령어 핸들러 타입 (확장 버전)
 */
export type CommandHandler = (args: any[], flags: Record<string, any>, options?: Record<string, any>) => Promise<CommandResult>;

/**
 * 명령어 결과 인터페이스
 * 명령어 실행 결과 표현을 위한 기본 형식
 */
export interface CommandResult {
  /**
   * 결과 성공 여부
   */
  success: boolean;
  
  /**
   * 결과 메시지 (사용자에게 표시)
   */
  message?: string;
  
  /**
   * 결과 데이터 (UI 표시 또는 후속 처리용)
   */
  data?: any;
  
  /**
   * 오류 정보 (실패 시)
   */
  error?: Error | string;
  
  /**
   * 결과 표시 방식
   */
  displayMode?: 'text' | 'markdown' | 'json' | 'html' | 'none';
  
  /**
   * 추천 후속 명령어
   */
  suggestedNextCommands?: string[];
}

/**
 * 명령어 사용법 인터페이스 (확장 버전)
 */
export interface CommandUsage {
  /**
   * 에이전트/플러그인 ID
   */
  agentId: string;
  
  /**
   * 명령어 이름
   */
  command: string;
  
  /**
   * 명령어 도메인 (에이전트 명령어에만 적용)
   */
  domain?: CommandDomain;
  
  /**
   * 명령어 설명
   */
  description: string;
  
  /**
   * 명령어 문법
   */
  syntax: string;
  
  /**
   * 명령어 예시
   */
  examples: string[];
  
  /**
   * 명령어 인자 설명
   */
  args?: Array<{
    name: string;
    description: string;
    required?: boolean;
    defaultValue?: any;
  }>;
  
  /**
   * 명령어 옵션 설명
   */
  options?: Array<{
    name: string;
    description: string;
    required?: boolean;
    defaultValue?: any;
  }>;
  
  /**
   * 상세 도움말
   */
  detailedHelp?: string;
}

/**
 * 명령어 파서 인터페이스 (확장 버전)
 */
export interface ICommandParser {
  /**
   * 명령어 파싱
   * @param input 입력 문자열
   * @returns 파싱된 명령어 또는 null
   */
  parse(input: string): Command | null;
  
  /**
   * 상세 명령어 파싱 (오타 감지, 추천 등 기능 포함)
   * @param input 입력 문자열
   * @returns 파싱된 명령어 인터페이스
   */
  parseWithSuggestions(input: string): ParsedCommand;
  
  /**
   * 입력 문자열이 명령어인지 확인
   * @param input 입력 문자열
   * @returns 명령어 여부
   */
  isCommand(input: string): boolean;
  
  /**
   * 입력 문자열에서 도메인 추출
   * @param input 입력 문자열
   * @returns 도메인 또는 null
   */
  extractDomain(input: string): CommandDomain | null;
  
  /**
   * 유사한 명령어 제안
   * @param command 입력된 오류 명령어
   * @returns 유사한 명령어 목록
   */
  suggestSimilarCommands(command: string): string[];
}

/**
 * 명령어 레지스트리 인터페이스 (확장 버전)
 */
export interface ICommandRegistry {
  /**
   * 명령어 등록
   * @param agentId 에이전트/플러그인 ID
   * @param command 명령어 이름
   * @param handler 명령어 핸들러
   * @param options 추가 옵션 (도메인, 설명 등)
   * @returns 등록 성공 여부
   */
  register(
    agentId: string,
    command: string, 
    handler: CommandHandler,
    options?: {
      domain?: CommandDomain;
      description?: string;
      examples?: string[];
      group?: string;
      frequent?: boolean;
    }
  ): boolean;
  
  /**
   * 에이전트 명령어 등록 (@ 접두사, 도메인 기반)
   * @param domain 명령어 도메인
   * @param command 명령어 이름
   * @param handler 명령어 핸들러
   * @param options 추가 옵션
   * @returns 등록 성공 여부
   */
  registerAgentCommand(
    domain: CommandDomain,
    command: string,
    handler: CommandHandler,
    options?: {
      description?: string;
      examples?: string[];
      group?: string;
      frequent?: boolean;
    }
  ): boolean;
  
  /**
   * 시스템 명령어 등록 (/ 접두사)
   * @param command 명령어 이름
   * @param handler 명령어 핸들러
   * @param options 추가 옵션
   * @returns 등록 성공 여부
   */
  registerSystemCommand(
    command: string,
    handler: CommandHandler,
    options?: {
      description?: string;
      examples?: string[];
      group?: string;
      frequent?: boolean;
    }
  ): boolean;
  
  /**
   * 명령어 핸들러 조회
   * @param agentId 에이전트/플러그인 ID
   * @param command 명령어 이름
   * @returns 명령어 핸들러
   */
  getHandler(agentId: string, command: string): CommandHandler | undefined;
  
  /**
   * 도메인 기반 명령어 핸들러 조회
   * @param domain 명령어 도메인
   * @param command 명령어 이름
   * @returns 명령어 핸들러
   */
  getDomainHandler(domain: CommandDomain, command: string): CommandHandler | undefined;
  
  /**
   * 모든 명령어 핸들러 조회
   * @returns 명령어 핸들러 맵
   */
  getAllHandlers(): Map<string, Map<string, CommandHandler>>;
  
  /**
   * 모든 도메인 명령어 핸들러 조회
   * @returns 도메인별 명령어 핸들러 맵
   */
  getAllDomainHandlers(): Map<CommandDomain, Map<string, CommandHandler>>;
  
  /**
   * 명령어 사용법 등록
   * @param usage 명령어 사용법
   * @returns 등록 성공 여부
   */
  registerUsage(usage: CommandUsage): boolean;
  
  /**
   * 명령어 사용법 조회
   * @param agentId 에이전트/플러그인 ID
   * @param command 명령어 이름
   * @returns 명령어 사용법
   */
  getUsage(agentId: string, command: string): CommandUsage | undefined;
  
  /**
   * 도메인 기반 명령어 사용법 조회
   * @param domain 명령어 도메인
   * @param command 명령어 이름
   * @returns 명령어 사용법
   */
  getDomainUsage(domain: CommandDomain, command: string): CommandUsage | undefined;
  
  /**
   * 에이전트의 모든 명령어 사용법 조회
   * @param agentId 에이전트/플러그인 ID
   * @returns 명령어 사용법 목록
   */
  getAgentCommands(agentId: string): CommandUsage[];
  
  /**
   * 도메인의 모든 명령어 사용법 조회
   * @param domain 명령어 도메인
   * @returns 명령어 사용법 목록
   */
  getDomainCommands(domain: CommandDomain): CommandUsage[];
  
  /**
   * 모든 명령어 사용법 조회
   * @returns 명령어 사용법 목록
   */
  getAllCommandUsages(): CommandUsage[];
  
  /**
   * 모든 시스템 명령어 사용법 조회
   * @returns 시스템 명령어 사용법 목록
   */
  getAllSystemCommandUsages(): CommandUsage[];
  
  /**
   * 모든 에이전트 명령어 사용법 조회
   * @returns 에이전트 명령어 사용법 목록
   */
  getAllAgentCommandUsages(): CommandUsage[];
  
  /**
   * 컨텍스트 기반 명령어 생성
   * 현재 컨텍스트에 따라 명령어를 자동 생성하거나 추천
   * @param command 기본 명령어 또는 명령어 패턴
   * @param context 추가 컨텍스트 객체 (선택적)
   * @returns 컨텍스트 인식 명령어 또는 명령어 배열
   */
  generateContextualCommand(command: string, context?: Record<string, any>): Promise<string | string[]>;
  
  /**
   * 명령어 추천 제안 목록 생성
   * 현재 컨텍스트, 이전 사용 패턴, 관련 항목 등을 고려하여 추천
   * @param context 컨텍스트 정보 (작업 중인 파일, 브랜치, 히스토리 등)
   * @param limit 최대 추천 수 (기본값: 5)
   * @returns 추천 명령어 목록
   */
  suggestCommands(context: Record<string, any>, limit?: number): Promise<string[]>;
  
  /**
   * 현재 컨텍스트 캐시 조회
   * @returns 컨텍스트 캐시 객체
   */
  getContextCache(): any;
}

/**
 * 명령어 실행기 인터페이스 (확장 버전)
 */
export interface ICommandExecutor {
  /**
   * 명령어 실행
   * @param command 명령어
   * @returns 실행 결과
   */
  execute(command: Command): Promise<CommandResult>;
  
  /**
   * 명령어 실행 (문자열 입력)
   * @param commandString 명령어 문자열
   * @returns 실행 결과
   */
  executeFromString(commandString: string): Promise<CommandResult>;
  
  /**
   * 명령어 실행 이력 조회
   * @param limit 조회할 이력 수 (기본값: 10)
   * @returns 최근 실행 이력
   */
  getExecutionHistory(limit?: number): Array<{
    command: Command;
    result: CommandResult;
    timestamp: number;
  }>;
  
  /**
   * 명령어 실행 취소
   * @param commandId 취소할 명령어 ID
   * @returns 취소 성공 여부
   */
  cancel(commandId: string): boolean;
}