/**
 * 사용자 인증 및 설정 관리 서비스
 * 
 * 사용자 인증 정보 관리 및 Git 정보 추출 기능 제공
 * 사용자 ID, Git 사용자명, 이메일 정보 관리
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '../config/ConfigService';
import { EventEmitter } from 'events';

/**
 * 사용자 정보 인터페이스
 */
export interface UserInfo {
  /**
   * 사용자 ID
   */
  userId?: string;
  
  /**
   * Git 사용자명
   */
  gitUsername?: string;
  
  /**
   * Git 이메일
   */
  gitEmail?: string;
  
  /**
   * 접근 토큰
   */
  token?: string;
}

/**
 * 사용자 설정 인터페이스
 */
export interface UserSettings {
  /**
   * 현재 프로젝트
   */
  currentProject?: string;
  
  /**
   * API 엔드포인트
   */
  apiEndpoint?: string;
  
  /**
   * 기타 사용자 설정
   */
  [key: string]: any;
}

/**
 * 사용자 인증 관련 이벤트 타입
 */
export enum UserAuthEvent {
  /**
   * 사용자 정보 변경됨
   */
  USER_INFO_CHANGED = 'user_info_changed',
  
  /**
   * 사용자 설정 변경됨
   */
  USER_SETTINGS_CHANGED = 'user_settings_changed',
  
  /**
   * 로그인됨
   */
  LOGGED_IN = 'logged_in',
  
  /**
   * 로그아웃됨
   */
  LOGGED_OUT = 'logged_out'
}

/**
 * 사용자 인증 서비스 클래스
 * Git 기반 사용자 인증 및 설정 관리
 */
export class UserAuthService {
  /**
   * 싱글톤 인스턴스
   */
  private static instance: UserAuthService;
  
  /**
   * 이벤트 이미터
   */
  private eventEmitter = new EventEmitter();
  
  /**
   * 설정 서비스
   */
  private configService: ConfigService;
  
  /**
   * 사용자 정보
   */
  private userInfo: UserInfo = {};
  
  /**
   * 사용자 설정
   */
  private userSettings: UserSettings = {};
  
  /**
   * 초기화 완료 여부
   */
  private initialized: boolean = false;
  
  /**
   * 싱글톤 인스턴스 가져오기
   * @returns UserAuthService 인스턴스
   */
  public static getInstance(): UserAuthService {
    if (!UserAuthService.instance) {
      UserAuthService.instance = new UserAuthService();
    }
    return UserAuthService.instance;
  }
  
  /**
   * 생성자 (private)
   */
  private constructor() {
    this.configService = ConfigService.getInstance();
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  public on(event: UserAuthEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 이벤트 리스너
   */
  public off(event: UserAuthEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
  
  /**
   * 서비스 초기화
   */
  public async initialize(): Promise<void> {
    try {
      // 설정에서 사용자 정보 로드
      await this.loadUserInfo();
      
      // 사용자 정보가 없으면 Git에서 자동으로 추출
      if (!this.userInfo.gitUsername || !this.userInfo.gitEmail) {
        try {
          const gitInfo = await this.extractGitUserInfo();
          if (gitInfo) {
            this.userInfo = {
              ...this.userInfo,
              ...gitInfo
            };
            
            // 설정에 사용자 정보 저장
            await this.saveUserInfo();
          }
        } catch (error) {
          console.warn('Git 사용자 정보 추출 실패:', error);
        }
      }
      
      // 사용자 설정 로드
      await this.loadUserSettings();
      
      this.initialized = true;
      console.log('사용자 인증 서비스 초기화 완료');
    } catch (error) {
      console.error('사용자 인증 서비스 초기화 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 초기화 확인
   */
  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error('사용자 인증 서비스가 초기화되지 않았습니다');
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
   * 사용자 정보 가져오기
   * @returns 사용자 정보
   */
  public getUserInfo(): UserInfo {
    this.checkInitialized();
    return { ...this.userInfo };
  }
  
  /**
   * 사용자 설정 가져오기
   * @returns 사용자 설정
   */
  public getUserSettings(): UserSettings {
    this.checkInitialized();
    return { ...this.userSettings };
  }
  
  /**
   * 사용자 ID 설정
   * @param userId 사용자 ID
   */
  public async setUserId(userId: string): Promise<void> {
    this.checkInitialized();
    
    this.userInfo.userId = userId;
    await this.saveUserInfo();
    
    this.eventEmitter.emit(UserAuthEvent.USER_INFO_CHANGED, this.userInfo);
  }
  
  /**
   * 접근 토큰 설정
   * @param token 접근 토큰
   */
  public async setToken(token: string): Promise<void> {
    this.checkInitialized();
    
    this.userInfo.token = token;
    await this.saveUserInfo();
    
    this.eventEmitter.emit(UserAuthEvent.USER_INFO_CHANGED, this.userInfo);
  }
  
  /**
   * 현재 프로젝트 설정
   * @param projectCode 프로젝트 코드
   */
  public async setCurrentProject(projectCode: string): Promise<void> {
    this.checkInitialized();
    
    this.userSettings.currentProject = projectCode;
    await this.saveUserSettings();
    
    this.eventEmitter.emit(UserAuthEvent.USER_SETTINGS_CHANGED, this.userSettings);
  }
  
  /**
   * 사용자 설정 업데이트
   * @param settings 업데이트할 설정
   */
  public async updateUserSettings(settings: Partial<UserSettings>): Promise<void> {
    this.checkInitialized();
    
    this.userSettings = {
      ...this.userSettings,
      ...settings
    };
    
    await this.saveUserSettings();
    
    this.eventEmitter.emit(UserAuthEvent.USER_SETTINGS_CHANGED, this.userSettings);
  }
  
  /**
   * 로그인
   * @param userId 사용자 ID
   * @param token 접근 토큰
   */
  public async login(userId: string, token: string): Promise<void> {
    this.checkInitialized();
    
    this.userInfo.userId = userId;
    this.userInfo.token = token;
    
    await this.saveUserInfo();
    
    this.eventEmitter.emit(UserAuthEvent.LOGGED_IN, this.userInfo);
    this.eventEmitter.emit(UserAuthEvent.USER_INFO_CHANGED, this.userInfo);
  }
  
  /**
   * 로그아웃
   */
  public async logout(): Promise<void> {
    this.checkInitialized();
    
    // 토큰만 제거
    delete this.userInfo.token;
    
    await this.saveUserInfo();
    
    this.eventEmitter.emit(UserAuthEvent.LOGGED_OUT);
    this.eventEmitter.emit(UserAuthEvent.USER_INFO_CHANGED, this.userInfo);
  }
  
  /**
   * Git 저장소에서 사용자 정보 추출
   * @returns Git 사용자 정보
   */
  private async extractGitUserInfo(): Promise<{ gitUsername?: string, gitEmail?: string }> {
    try {
      // 워크스페이스 루트 디렉토리 가져오기
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('열린 워크스페이스가 없습니다');
      }
      
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const gitConfigPath = path.join(workspaceRoot, '.git', 'config');
      
      // .git/config 파일이 있는지 확인
      if (!fs.existsSync(gitConfigPath)) {
        throw new Error('Git 저장소가 아닙니다');
      }
      
      // .git/config 파일 읽기
      const configContent = fs.readFileSync(gitConfigPath, 'utf8');
      
      // 사용자 이름과 이메일 추출
      const usernameMatch = configContent.match(/\[user\][^\[]*name\s*=\s*([^\n\r]*)/);
      const emailMatch = configContent.match(/\[user\][^\[]*email\s*=\s*([^\n\r]*)/);
      
      const gitUsername = usernameMatch?.[1]?.trim();
      const gitEmail = emailMatch?.[1]?.trim();
      
      const result: { gitUsername?: string, gitEmail?: string } = {};
      if (gitUsername) result.gitUsername = gitUsername;
      if (gitEmail) result.gitEmail = gitEmail;
      return result;
    } catch (error) {
      console.warn('Git 사용자 정보 추출 중 오류 발생:', error);
      return {};
    }
  }
  
  /**
   * 설정에서 사용자 정보 로드
   */
  private async loadUserInfo(): Promise<void> {
    try {
      const userConfig = this.configService.getUserConfig();
      if (userConfig && userConfig['auth']) {
        const auth = userConfig['auth'];
        this.userInfo = {
          userId: auth['userId'],
          gitUsername: auth['gitUsername'],
          gitEmail: auth['gitEmail'],
          token: auth['token']
        };
      }
    } catch (error) {
      console.warn('사용자 정보 로드 중 오류 발생:', error);
    }
  }
  
  /**
   * 설정에 사용자 정보 저장
   */
  private async saveUserInfo(): Promise<void> {
    try {
      await this.configService.updateUserConfig({
        auth: { ...this.userInfo }
      });
    } catch (error) {
      console.error('사용자 정보 저장 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 설정에서 사용자 설정 로드
   */
  private async loadUserSettings(): Promise<void> {
    try {
      const userConfig = this.configService.getUserConfig();
      if (userConfig && userConfig['settings']) {
        this.userSettings = { ...userConfig['settings'] };
      }
    } catch (error) {
      console.warn('사용자 설정 로드 중 오류 발생:', error);
    }
  }
  
  /**
   * 설정에 사용자 설정 저장
   */
  private async saveUserSettings(): Promise<void> {
    try {
      await this.configService.updateUserConfig({
        settings: { ...this.userSettings }
      });
    } catch (error) {
      console.error('사용자 설정 저장 중 오류 발생:', error);
      throw error;
    }
  }
}