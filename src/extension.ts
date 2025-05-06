/**
 * APE 확장 프로그램 진입점
 * 
 * VS Code 확장 API를 통해 APE 확장 프로그램을 활성화 및 비활성화합니다.
 * 모든 서비스 및 핵심 기능을 초기화하고 관리합니다.
 */

import * as vscode from 'vscode';
import { ICoreService } from './core/ICoreService';
import { CoreService } from './core/CoreService';
import { ApeChatViewProvider } from './ui/ApeChatViewProvider';
import { ChatService } from './services/ChatService';
import { ApeTreeDataProvider } from './ui/ApeTreeDataProvider';
import { ApeSettingsViewProvider } from './ui/ApeSettingsViewProvider';

// 확장 프로그램 인스턴스
let coreService: ICoreService;
let chatService: ChatService;
let chatViewProvider: ApeChatViewProvider;
let treeDataProvider: ApeTreeDataProvider;
let settingsViewProvider: ApeSettingsViewProvider;

/**
 * 확장 프로그램 활성화
 * @param context 확장 프로그램 컨텍스트
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    console.log('APE 확장 프로그램 활성화 시작');
    
    // 채팅 뷰 표시를 위한 컨텍스트 설정
    console.log('ape:showChatView 컨텍스트 설정 - true');
    await vscode.commands.executeCommand('setContext', 'ape:showChatView', true);
    
    // 환경설정 로드
    await loadEnvironment();
    
    // 코어 서비스 초기화
    coreService = new CoreService(context);
    await coreService.initialize();
    
    // 채팅 서비스 초기화
    chatService = new ChatService(coreService, context);
    
    // 웹뷰 제공자 생성
    chatViewProvider = new ApeChatViewProvider(
      context.extensionUri,
      chatService,
      coreService
    );
    
    // 트리 데이터 제공자 생성
    treeDataProvider = new ApeTreeDataProvider(coreService, chatService);
    
    
    // 설정 뷰 제공자 생성
    settingsViewProvider = new ApeSettingsViewProvider(
      context.extensionUri,
      coreService
    );
    
    // 웹뷰 패널 등록
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        'ape.chatView', // package.json에 정의된 ID와 일치
        chatViewProvider,
        {
          webviewOptions: {
            retainContextWhenHidden: true
          }
        }
      )
    );
    
    // 트리뷰 등록
    console.log('트리뷰 등록 시작: ape.treeView');
    const treeView = vscode.window.createTreeView('ape.treeView', { // package.json에 정의된 ID와 일치
      treeDataProvider: treeDataProvider,
      showCollapseAll: true
    });
    console.log('트리뷰 등록 완료: ape.treeView');
    
    // 트리뷰 변경 이벤트 리스너 추가
    treeView.onDidChangeVisibility(e => {
      console.log(`트리뷰 가시성 변경: 보임=${e.visible}`);
    });
    
    context.subscriptions.push(treeView);
    
    // 설정 뷰 등록
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        'ape.settingsView', // package.json에 정의된 ID와 일치
        settingsViewProvider
      )
    );
    
    // 명령 등록
    registerCommands(context);
    
    console.log('APE 확장 프로그램 활성화 완료');
  } catch (error) {
    console.error('APE 확장 프로그램 활성화 오류:', error);
    
    // 사용자에게 오류 알림
    vscode.window.showErrorMessage(
      `APE 확장 프로그램을 활성화하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 확장 프로그램 비활성화
 */
export function deactivate(): void {
  try {
    console.log('APE 확장 프로그램 비활성화 시작');
    
    // 코어 서비스 해제
    if (coreService) {
      coreService.dispose();
    }
    
    console.log('APE 확장 프로그램 비활성화 완료');
  } catch (error) {
    console.error('APE 확장 프로그램 비활성화 오류:', error);
  }
}

/**
 * 환경설정 로드
 */
async function loadEnvironment(): Promise<void> {
  try {
    // 환경 변수 설정 파일 로드 시도
    try {
      const envLoader = require('../config/env.loader.js');
      if (envLoader && typeof envLoader.loadEnvironment === 'function') {
        await envLoader.loadEnvironment();
        console.log('환경설정 로드 완료');
      } else {
        console.warn('환경설정 로더 함수를 찾을 수 없습니다');
      }
    } catch (error) {
      console.warn('환경설정 로드 실패:', error);
    }
  } catch (error) {
    console.error('환경설정 로드 중 오류 발생:', error);
  }
}

/**
 * 명령 등록
 * @param context 확장 프로그램 컨텍스트
 */
function registerCommands(context: vscode.ExtensionContext): void {
  // 트리뷰 새로고침 명령
  context.subscriptions.push(
    vscode.commands.registerCommand('ape.refreshTreeView', () => {
      if (treeDataProvider) {
        treeDataProvider.refresh();
      }
    })
  );
  
  // 채팅 뷰 열기 명령 추가
  context.subscriptions.push(
    vscode.commands.registerCommand('ape.openChat', async () => {
      console.log('채팅 뷰 열기 명령 실행');
      // 채팅 뷰 표시 컨텍스트 설정
      await vscode.commands.executeCommand('setContext', 'ape:showChatView', true);
      // 사이드바 표시
      await vscode.commands.executeCommand('workbench.view.extension.ape-sidebar');
      // 채팅 뷰로 포커스
      await vscode.commands.executeCommand('ape.chatView.focus');
    })
  );
  
  // 코어 서비스 명령 등록
  if (coreService && coreService.commandRegistry) {
    const commands = coreService.commandRegistry.getCommandMap();
    
    for (const [id, handler] of commands.entries()) {
      context.subscriptions.push(
        vscode.commands.registerCommand(`ape.${id}`, handler)
      );
    }
  }
}