/**
 * 채팅 히스토리 서비스
 * 대화 히스토리 영구 저장 및 관리 담당
 */

import * as vscode from 'vscode';
import { ChatMessage } from './ChatService';

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessage[];
}

/**
 * 채팅 히스토리 서비스 클래스
 * 채팅 세션 저장 및 로드, 관리 기능 제공
 */
export class ChatHistoryService {
  // 전역 상태에 저장될 키
  private readonly CHAT_HISTORY_KEY = 'ape.chatHistory';
  // 최대 저장 세션 수
  private readonly MAX_SESSIONS = 20;

  constructor(
    private readonly context: vscode.ExtensionContext
  ) {}

  /**
   * 새 채팅 세션 저장
   * @param title 세션 제목
   * @param messages 채팅 메시지 배열
   * @returns 저장된 세션 ID
   */
  public saveSession(title: string, messages: ChatMessage[]): string {
    const sessions = this.getAllSessions();
    
    // 새 세션 ID 생성 (타임스탬프 기반)
    const sessionId = `session-${Date.now()}`;
    
    // 새 세션 생성
    const newSession: ChatSession = {
      id: sessionId,
      title: title || this.generateSessionTitle(messages),
      timestamp: Date.now(),
      messages: [...messages]
    };
    
    // 세션 목록 앞에 추가
    sessions.unshift(newSession);
    
    // 최대 저장 개수 초과 시 오래된 항목 제거
    if (sessions.length > this.MAX_SESSIONS) {
      sessions.splice(this.MAX_SESSIONS);
    }
    
    // 전역 상태에 저장
    this.context.globalState.update(this.CHAT_HISTORY_KEY, sessions);
    
    return sessionId;
  }

  /**
   * 채팅 세션 로드
   * @param sessionId 세션 ID
   * @returns 채팅 세션 또는 undefined
   */
  public getSession(sessionId: string): ChatSession | undefined {
    const sessions = this.getAllSessions();
    return sessions.find(session => session.id === sessionId);
  }

  /**
   * 모든 채팅 세션 가져오기
   * @returns 채팅 세션 배열
   */
  public getAllSessions(): ChatSession[] {
    const sessions = this.context.globalState.get<ChatSession[]>(this.CHAT_HISTORY_KEY, []);
    return sessions;
  }

  /**
   * 채팅 세션 삭제
   * @param sessionId 세션 ID
   * @returns 삭제 성공 여부
   */
  public deleteSession(sessionId: string): boolean {
    const sessions = this.getAllSessions();
    const initialLength = sessions.length;
    
    // ID로 세션 필터링
    const filteredSessions = sessions.filter(session => session.id !== sessionId);
    
    // 변경된 경우에만 저장
    if (filteredSessions.length !== initialLength) {
      this.context.globalState.update(this.CHAT_HISTORY_KEY, filteredSessions);
      return true;
    }
    
    return false;
  }

  /**
   * 모든 채팅 히스토리 삭제
   */
  public clearAllHistory(): void {
    this.context.globalState.update(this.CHAT_HISTORY_KEY, []);
  }

  /**
   * 채팅 세션 제목 생성
   * @param messages 채팅 메시지 배열
   * @returns 자동 생성된 세션 제목
   */
  private generateSessionTitle(messages: ChatMessage[]): string {
    // 첫 사용자 메시지를 찾아 제목 생성
    const firstUserMessage = messages.find(msg => msg.type === 'user');
    
    if (firstUserMessage) {
      // 메시지가 긴 경우 앞부분만 사용
      const content = firstUserMessage.content;
      const title = content.length > 30 
        ? content.substring(0, 30) + '...' 
        : content;
      
      return title;
    }
    
    // 기본 제목 (날짜 포함)
    const now = new Date();
    return `대화 세션 ${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR')}`;
  }

  /**
   * 날짜별로 채팅 세션 그룹화
   * @returns 날짜별로 그룹화된 세션 맵
   */
  public getSessionsByDate(): Map<string, ChatSession[]> {
    const sessions = this.getAllSessions();
    const sessionsByDate = new Map<string, ChatSession[]>();
    
    // 오늘 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 어제 날짜
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.timestamp);
      sessionDate.setHours(0, 0, 0, 0);
      
      let dateKey: string;
      
      // 오늘 세션
      if (sessionDate.getTime() === today.getTime()) {
        dateKey = 'today';
      } 
      // 어제 세션
      else if (sessionDate.getTime() === yesterday.getTime()) {
        dateKey = 'yesterday';
      } 
      // 이전 세션 (날짜 포맷팅)
      else {
        dateKey = sessionDate.toLocaleDateString('ko-KR');
      }
      
      // 맵에 추가
      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, []);
      }
      sessionsByDate.get(dateKey)?.push(session);
    });
    
    return sessionsByDate;
  }
}