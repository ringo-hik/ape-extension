/**
 * 채팅 서비스
 * 대화 히스토리 관리 및 메시지 처리 담당
 */

import * as vscode from 'vscode';
import { ICoreService } from '../core/ICoreService';
import { container } from '../core/di/Container';
import { ChatHistoryService } from './ChatHistoryService';

/**
 * 채팅 메시지 타입
 */
export interface ChatMessage {
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/**
 * 채팅 서비스 클래스
 * 대화 히스토리 관리 및 UI 상호작용 담당
 */
export class ChatService {
  private conversation: ChatMessage[] = [];
  private readonly welcomeMessages = [
    '안녕하세요! APE 채팅에 오신 것을 환영합니다.',
    '문의사항이나 도움이 필요한 내용을 입력해주세요.',
    '@ 명령어나 / 명령어를 사용하여 특별한 기능을 사용할 수 있습니다.'
  ];
  
  private readonly historyService: ChatHistoryService;
  private currentSessionId: string | null = null;
  
  constructor(
    private readonly apeCore: ICoreService,
    private readonly context: vscode.ExtensionContext
  ) {
    // 히스토리 서비스 초기화
    this.historyService = new ChatHistoryService(context);
    
    this.apeCore.initialize().then(() => {
      this.addSystemMessage('APE 코어 서비스가 초기화되었습니다.');
    }).catch(error => {
      this.addSystemMessage('APE 코어 서비스 초기화 중 오류가 발생했습니다.');
      console.error('코어 서비스 초기화 오류:', error);
    });
  }
  
  /**
   * 사용자 메시지 처리 후 응답 생성
   */
  public async processMessage(
    text: string, 
    onUpdate?: (chunk: string) => void, 
    options?: { embedDevMode?: boolean }
  ): Promise<string> {
    
    this.addMessage('user', text);
    
    
    const embedDevMode = options?.embedDevMode || false;
    
    console.log(`ChatService: 메시지 처리 시작 - "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
    console.log(`ChatService: 스트리밍 모드 - ${onUpdate ? '켜짐' : '꺼짐'}`);
    console.log(`ChatService: 심층 분석 모드 - ${embedDevMode ? '켜짐' : '꺼짐'}`);
    
    
    if (text.trim().toLowerCase() === '/clear') {
      this.clearConversation();
      const clearMessage = '대화 기록이 초기화되었습니다.';
      this.addMessage('system', clearMessage);
      return Promise.resolve(clearMessage);
    }
    
    try {
      
      let accumulatedResponse = '';
      let chunkCount = 0;
      
      const streamingCallback = onUpdate ? (chunk: string) => {
        accumulatedResponse += chunk;
        onUpdate(chunk);
        
        chunkCount++;
        if (chunkCount <= 2 || chunkCount % 50 === 0) {
          console.log(`ChatService: 스트리밍 청크 #${chunkCount} 수신 및 전달 - 길이: ${chunk.length}자`);
        }
      } : undefined;
      
      console.log('ChatService: ApeCoreService에 메시지 전달');
      
      
      let enhancedOptions: any = {};
      
      if (embedDevMode) {
        
        enhancedOptions = {
          embedDevMode: true,
          deepAnalysis: true,
          internalDataAccess: true
        };
        console.log('ChatService: 심층 분석 모드 적용 - 고급 프롬프트 생성 및 내부 데이터 접근 활성화');
      }
      
      
      const response = await this.apeCore.processMessage(text, streamingCallback ? {
        stream: true,
        onUpdate: streamingCallback,
        ...enhancedOptions
      } : enhancedOptions);
      
      let responseContent: string;
      
      
      if (streamingCallback && accumulatedResponse) {
        console.log(`ChatService: 스트리밍 응답 완료 - 총 청크: ${chunkCount}, 전체 길이: ${accumulatedResponse.length}자`);
        responseContent = accumulatedResponse;
      } else {
        console.log('ChatService: 일반 응답 처리');
        
        if (typeof response === 'object') {
          if (response.content) {
            responseContent = response.content;
          } else {
            responseContent = JSON.stringify(response, null, 2);
          }
        } else {
          responseContent = response.toString();
        }
        console.log(`ChatService: 응답 길이: ${responseContent.length}자`);
      }
      
      
      this.addMessage('assistant', responseContent);
      return responseContent;
    } catch (error) {
      console.error('메시지 처리 중 오류 발생:', error);
      
      
      const errorMessage = '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      this.addMessage('assistant', errorMessage);
      return errorMessage;
    }
  }
  
  /**
   * 메시지 추가
   */
  private addMessage(type: 'user' | 'assistant' | 'system', content: string) {
    // 메시지 추가
    this.conversation.push({
      type,
      content,
      timestamp: Date.now()
    });
    
    // 대화가 실질적인 내용을 가지면 자동 저장 시도
    // (시스템 메시지가 아닐 때만 카운트)
    const significantMsgCount = this.conversation.filter(msg => msg.type !== 'system').length;
    
    if (type !== 'system' && significantMsgCount >= 4) {
      // 자동 저장 시도 (오류는 무시)
      this.trySaveCurrentSession();
    }
  }
  
  /**
   * 현재 대화 자동 저장 시도
   * 저장 로직에서 오류가 발생해도 무시
   */
  private trySaveCurrentSession(): void {
    try {
      // 이미 현재 세션이 저장된 상태면 업데이트
      if (this.currentSessionId) {
        // 기존 세션 삭제 후 새로 저장 (덮어쓰기)
        this.historyService.deleteSession(this.currentSessionId);
      }
      
      // 새 세션으로 저장 (제목 자동 생성)
      this.saveCurrentSession();
    } catch (error) {
      // 자동 저장 실패는 무시 (로그만 기록)
      console.log('대화 자동 저장 실패:', error);
    }
  }
  
  /**
   * 시스템 메시지 추가
   */
  public addSystemMessage(content: string) {
    this.addMessage('system', content);
  }
  
  /**
   * 대화 내용 초기화
   */
  public clearConversation() {
    this.conversation = [];
    this.currentSessionId = null;
  }
  
  /**
   * 웰컴 메시지 가져오기
   */
  public getWelcomeMessage(): string {
    return this.welcomeMessages[Math.floor(Math.random() * this.welcomeMessages.length)] || '안녕하세요! APE 채팅에 오신 것을 환영합니다.';
  }
  
  /**
   * 대화 히스토리 가져오기
   */
  public getConversation(): ChatMessage[] {
    return [...this.conversation];
  }
  
  /**
   * 현재 대화 저장하기
   * @param title 대화 제목 (옵션)
   * @returns 저장된 세션 ID
   */
  public saveCurrentSession(title?: string): string {
    // 의미 있는 대화만 저장 (사용자 메시지가 최소 1개 이상)
    const hasUserMessages = this.conversation.some(msg => msg.type === 'user');
    if (!hasUserMessages || this.conversation.length < 2) {
      throw new Error('저장할 대화가 충분하지 않습니다.');
    }
    
    // 제목이 없으면 첫 번째 사용자 메시지로 자동 생성
    const sessionTitle = title || this.generateSessionTitle();
    
    // 히스토리 서비스로 저장
    const sessionId = this.historyService.saveSession(sessionTitle, this.conversation);
    
    // 현재 세션 ID 업데이트
    this.currentSessionId = sessionId;
    
    return sessionId;
  }
  
  /**
   * 세션 제목 자동 생성
   */
  private generateSessionTitle(): string {
    const firstUserMessage = this.conversation.find(msg => msg.type === 'user');
    if (firstUserMessage) {
      // 첫 번째 사용자 메시지 기반으로 제목 생성 (30자 제한)
      const content = firstUserMessage.content;
      return content.length > 30 ? content.substring(0, 30) + '...' : content;
    }
    return `대화 세션 ${new Date().toLocaleString('ko-KR')}`;
  }
  
  /**
   * 저장된 세션 불러오기
   * @param sessionId 세션 ID
   * @returns 성공 여부
   */
  public loadSession(sessionId: string): boolean {
    const session = this.historyService.getSession(sessionId);
    if (!session) {
      return false;
    }
    
    // 현재 대화 초기화 후 저장된 메시지로 대체
    this.conversation = [...session.messages];
    this.currentSessionId = sessionId;
    
    return true;
  }
  
  /**
   * 모든 저장된 세션 불러오기
   * @returns 저장된 모든 세션
   */
  public getAllSavedSessions() {
    return this.historyService.getAllSessions();
  }
  
  /**
   * 날짜별로 그룹화된 세션 목록 가져오기
   * @returns 날짜별 세션 맵
   */
  public getSessionsByDate() {
    return this.historyService.getSessionsByDate();
  }
  
  /**
   * 특정 세션 삭제
   * @param sessionId 세션 ID
   * @returns 삭제 성공 여부
   */
  public deleteSession(sessionId: string): boolean {
    // 현재 로드된 세션인 경우, 현재 세션 ID 초기화
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    
    return this.historyService.deleteSession(sessionId);
  }
  
  /**
   * 모든 히스토리 삭제
   */
  public clearAllHistory(): void {
    this.historyService.clearAllHistory();
    this.currentSessionId = null;
  }
  
  /**
   * 특별 명령어 처리 (문서 생성, 코드 분석 등 고급 작업용)
   */
  public async processSpecialCommand(request: any): Promise<any> {
    try {
      switch (request.command) {
        case 'generateDoc':
          
          this.addSystemMessage(`${request.type} 문서 생성 중...`);
          
          return await this.apeCore.processMessage(
            `코드에 대한 ${request.type} 문서를 생성해 주세요:\n\n\`\`\`${request.language}\n${request.content}\n\`\`\``, 
            { embedDevMode: true }
          );
          
        case 'analyzeCode':
          
          this.addSystemMessage(`코드 분석 중 (${request.focus})...`);
          
          return await this.apeCore.processMessage(
            `다음 코드를 분석해 주세요 (중점: ${request.focus}):\n\n\`\`\`${request.language}\n${request.content}\n\`\`\``, 
            { embedDevMode: true }
          );
          
        default:
          throw new Error(`지원하지 않는 특별 명령어: ${request.command}`);
      }
    } catch (error) {
      console.error('특별 명령어 처리 중 오류 발생:', error);
      return {
        content: `명령어 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        error: true
      };
    }
  }
}