/**
 * APE 확장 프로그램 진입점
 * Agentic Pipeline Engine/Extension
 */

import * as vscode from 'vscode';
import { ApeCoreService } from './core/ApeCoreService';
import { ChatService } from './services/ChatService';
import { ApeChatViewProvider } from './ui/ApeChatViewProvider';
import { ConfigMigrationService } from './migration/ConfigMigrationService';

/**
 * 확장 활성화 함수
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('APE 확장이 활성화되었습니다!');

  // APE 코어 서비스 초기화
  const apeCore = ApeCoreService.getInstance(context);
  
  // 채팅 서비스 인스턴스 생성
  const chatService = new ChatService(context);

  // 채팅 웹뷰 제공자 등록
  const chatProvider = new ApeChatViewProvider(context.extensionUri, chatService);
  
  // 웹뷰를 사이드바에 등록
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'ape.chatView', 
      chatProvider,
      {
        webviewOptions: { retainContextWhenHidden: true }
      }
    )
  );

  // 상태 표시줄 항목 추가
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(comment) APE';
  statusBarItem.command = 'ape.openChat';
  statusBarItem.tooltip = 'APE 채팅 열기';
  statusBarItem.show();
  console.log('APE 상태 표시줄 항목이 활성화되었습니다.');
  
  context.subscriptions.push(statusBarItem);
  
  // 명령어 등록
  context.subscriptions.push(
    vscode.commands.registerCommand('ape.openSidebar', () => {
      console.log('ape.openSidebar 명령 실행');
      vscode.commands.executeCommand('workbench.view.extension.ape-sidebar')
        .then(() => console.log('사이드바 열기 명령 성공'))
        .catch(err => console.error('사이드바 열기 명령 실패:', err));
    }),
    
    vscode.commands.registerCommand('ape.openChat', () => {
      console.log('ape.openChat 명령 실행');
      vscode.commands.executeCommand('workbench.view.extension.ape-sidebar')
        .then(() => console.log('채팅 열기 명령 성공'))
        .catch(err => console.error('채팅 열기 명령 실패:', err));
    }),
    
    vscode.commands.registerCommand('ape.clearChat', () => {
      console.log('ape.clearChat 명령 실행');
      chatProvider.clearChat();
      chatService.clearConversation();
      console.log('채팅 내용이 초기화되었습니다.');
    }),
    
    // 추가 명령어: 로그 출력 (디버깅용)
    vscode.commands.registerCommand('ape.debug', () => {
      console.log('ape.debug 명령 실행');
      vscode.window.showInformationMessage('APE 디버그 모드 활성화됨');
      
      // 모델 로드 확인
      const models = apeCore.llmService.getAvailableModels();
      console.log(`사용 가능한 모델 수: ${models.length}`);
      models.forEach(model => console.log(`- ${model.name} (${model.provider})`));
    })
  );
  
  // 설정 마이그레이션 서비스 생성
  const migrationService = new ConfigMigrationService();
  
  // 코어 서비스 초기화
  apeCore.initialize().then(async (success) => {
    if (success) {
      console.log('APE 코어 서비스가 성공적으로 초기화되었습니다.');
      
      // 설정 마이그레이션 필요 여부 확인 및 실행
      try {
        const isMigrationNeeded = await migrationService.isMigrationNeeded();
        if (isMigrationNeeded) {
          console.log('Ape에서 APE로 설정 마이그레이션 필요');
          await migrationService.migrateConfigs();
        }
      } catch (migrationError) {
        console.error('설정 마이그레이션 중 오류 발생:', migrationError);
      }
      
      // 초기화 완료 후 사이드바 자동 열기 (약간의 지연 추가)
      setTimeout(() => {
        console.log('사이드바 자동 열기 시도 중...');
        vscode.commands.executeCommand('workbench.view.extension.ape-sidebar')
          .then(() => console.log('사이드바가 성공적으로 열렸습니다.'))
          .catch(err => console.error('사이드바 열기 실패:', err));
      }, 500);
      
    } else {
      console.error('APE 코어 서비스 초기화 실패');
    }
  }).catch(error => {
    console.error('APE 코어 서비스 초기화 중 오류 발생:', error);
  });
}

/**
 * 확장 비활성화 함수
 */
export function deactivate() {
  console.log('APE 확장이 비활성화되었습니다!');
}