/**
 * APE 코어 서비스 인터페이스
 * 
 * 코어 서비스의 기본 기능을 정의하는 인터페이스
 * 의존성 주입 및 명확한 타입 정의를 위한 기반
 */

import { EventEmitter } from 'events';
import { ChatMessage } from '../types/LlmTypes';
import { Command } from '../types/CommandTypes';
import { ConfigService } from './config/ConfigService';
import { CommandService } from './command/CommandService';
import { PluginRegistryService } from './plugin-system/PluginRegistryService';
import { LlmService } from './llm/LlmService';
import { VSCodeService } from './vscode/VSCodeService';
import { HttpClientService } from './http/HttpClientService';
import { PromptAssemblerService } from './prompt/PromptAssemblerService';
import { LoggerService } from './utils/LoggerService';

/**
 * 메시지 처리 옵션 인터페이스
 */
export interface MessageProcessOptions {
  /**
   * 스트리밍 응답 사용 여부
   */
  stream?: boolean;
  
  /**
   * 스트리밍 콜백 함수
   * stream이 true인 경우 필수
   */
  onUpdate?: (chunk: string) => void;
  
  /**
   * 대화 맥락 메시지 배열
   */
  conversationHistory?: ChatMessage[];
  
  /**
   * 심층 분석 모드 활성화 여부
   * 개발 모드에서만 사용 가능
   */
  embedDevMode?: boolean;
  
  /**
   * 심층 분석 수준 (기본: false)
   */
  deepAnalysis?: boolean;
  
  /**
   * 내부 데이터 접근 허용 여부 (기본: false)
   */
  internalDataAccess?: boolean;
}

/**
 * 메시지 처리 결과 인터페이스
 */
export interface MessageProcessResult {
  /**
   * 응답 내용
   */
  content: string;
  
  /**
   * 오류 발생 여부
   */
  error?: boolean;
  
  /**
   * 추가 데이터
   */
  data?: any;
}

/**
 * 코어 서비스 인터페이스
 */
export interface ICoreService {
  /**
   * 코어 서비스 초기화
   * @returns 초기화 성공 여부
   */
  initialize(): Promise<boolean>;

  /**
   * 사용자 메시지 처리
   * @param text 사용자 입력 텍스트
   * @param options 처리 옵션
   * @returns 처리 결과
   */
  processMessage(text: string, options?: MessageProcessOptions): Promise<MessageProcessResult>;

  /**
   * 명령어 실행
   * @param command 실행할 명령어
   * @returns 실행 결과
   */
  executeCommand(command: Command): Promise<any>;

  /**
   * 컨텍스트 정보 수집
   * @returns 컨텍스트 정보
   */
  collectContext(): Promise<any>;

  /**
   * 서비스 활성화 여부 확인
   * @returns 활성화 상태
   */
  isEnabled(): boolean;

  /**
   * 이벤트 수신 설정
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  on(event: string, listener: (...args: any[]) => void): EventEmitter;

  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param args 이벤트 인자
   */
  emit(event: string, ...args: any[]): boolean;

  // 서비스 인스턴스 접근자
  readonly configService: ConfigService;
  readonly commandService: CommandService;
  readonly pluginRegistry: PluginRegistryService;
  readonly llmService: LlmService;
  readonly vsCodeService: VSCodeService;
  readonly httpService: HttpClientService;
  readonly promptAssembler: PromptAssemblerService;
  readonly logger: LoggerService;
}