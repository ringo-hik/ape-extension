/**
 * APE 확장 프로그램 진입점
 * Agentic Pipeline Engine/Extension
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { CoreService } from './core/CoreService';
import { ChatService } from './services/ChatService';
import { ApeChatViewProvider } from './ui/ApeChatViewProvider';
import { ApeTreeDataProvider, ApeTreeItem } from './ui/ApeTreeDataProvider';
import { ApeFileExplorerProvider, FileItemType, FileItem } from './ui/ApeFileExplorerProvider';
import { ApeSettingsViewProvider } from './ui/ApeSettingsViewProvider';
import { ConfigMigrationService } from './migration/ConfigMigrationService';
import { UserAuthService } from './core/auth/UserAuthService';
import { SwdpDomainService } from './core/domain/SwdpDomainService';
import { SwdpWorkflowService } from './core/workflow/SwdpWorkflowService';
import { SwdpPluginService } from './plugins/internal/swdp/SwdpPluginService';
import { container } from './core/di/Container';
import { ICoreService } from './core/ICoreService';

/**
 * 확장 활성화 함수
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('APE 확장이 활성화되었습니다!');

  // APE 코어 서비스 초기화 (의존성 주입 패턴)
  const apeCore = CoreService.createInstance(context);
  
  // DI 컨테이너에 코어 서비스 등록
  container.register('coreService', apeCore);
  
  // 채팅 서비스 인스턴스 생성
  const chatService = new ChatService(context);
  
  // 채팅 웹뷰 제공자 등록 (통합된 단일 인터페이스)
  const chatProvider = new ApeChatViewProvider(context.extensionUri, chatService);
  chatProvider.setCoreService(apeCore); // 코어 서비스 참조 설정 (직접 참조 및 이벤트 리스너 설정)
  
  // TreeView 데이터 제공자 등록
  const treeDataProvider = new ApeTreeDataProvider(context);
  
  // 파일 탐색기 데이터 제공자 등록
  const fileExplorerProvider = new ApeFileExplorerProvider(context);
  
  // 설정 웹뷰 제공자 등록
  const settingsViewProvider = new ApeSettingsViewProvider(
    context.extensionUri,
    apeCore.configService,
    apeCore.vsCodeService // Fix: correct property name is vsCodeService
  );
  
  // TreeView 제공자를 등록
  // 코어 서비스가 초기화되고 commandRegistry가 준비될 때까지 지연
  // apeCore.initialize() 완료 후 treeView 새로고침
  const treeView = vscode.window.createTreeView('ape.treeView', {
    treeDataProvider: treeDataProvider,
    showCollapseAll: true
  });
  
  // 파일 탐색기 TreeView 등록
  const fileExplorerView = vscode.window.createTreeView('ape.fileExplorerView', {
    treeDataProvider: fileExplorerProvider,
    showCollapseAll: true,
    canSelectMany: false // TODO: 향후 다중 선택 고려 (복사/이동 등 배치 작업 시)
  });
  
  // 웹뷰와 TreeView를 사이드바에 등록
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'ape.chatView', 
      chatProvider,
      {
        webviewOptions: { retainContextWhenHidden: true }
      }
    ),
    treeView,
    fileExplorerView
  );

  // 상태 표시줄 항목 추가
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(comment) APE';
  statusBarItem.command = 'ape.openChat';
  statusBarItem.tooltip = 'APE 채팅 열기';
  statusBarItem.show();
  console.log('APE 상태 표시줄 항목이 활성화되었습니다.');
  
  context.subscriptions.push(statusBarItem);
  
  // APE 모드 토글 명령 - 도구 활용 모드 버튼과 동일하게 작동
  context.subscriptions.push(
    vscode.commands.registerCommand('ape.toggleUIMode', async () => {
      console.log('ape.toggleUIMode 명령 실행');
      
      // 현재 활성화된 UI 모드 확인
      const config = vscode.workspace.getConfiguration('ape');
      const currentMode = config.get<string>('uiMode', 'standard');
      
      // 모드 전환
      const newMode = currentMode === 'standard' ? 'hybrid' : 'standard';
      
      // 설정 업데이트
      await config.update('uiMode', newMode, vscode.ConfigurationTarget.Global);
      
      // 동일한 채팅뷰에 새로운 모드 적용 명령 전송
      if (chatProvider && chatProvider._view) {
        chatProvider._view.webview.postMessage({
          command: 'changeUiMode',
          mode: newMode
        });
        
        // 도구 활용 모드 토글 메시지도 함께 전송 - 버튼 상태와 동기화
        chatProvider._view.webview.postMessage({
          command: 'toggleApeMode',
          enabled: newMode === 'hybrid'
        });
      }
      
      // 알림 메시지 표시
      vscode.window.showInformationMessage(`도구 활용 모드가 ${newMode === 'standard' ? '비활성화' : '활성화'}되었습니다.`);
    }),
    
    // APE 모드로 채팅 열기 명령
    vscode.commands.registerCommand('ape.openHybridChat', async () => {
      console.log('ape.openHybridChat 명령 실행 (APE 모드로 채팅 열기)');
      
      // 현재 모드를 hybrid로 설정
      const config = vscode.workspace.getConfiguration('ape');
      await config.update('uiMode', 'hybrid', vscode.ConfigurationTarget.Global);
      
      // 채팅 사이드바 열기
      try {
        await vscode.commands.executeCommand('workbench.view.extension.ape-sidebar');
        await vscode.commands.executeCommand('ape.chatView.focus');
        
        console.log('APE 모드 채팅 열기 성공');
        
        // 이미 열려있는 채팅뷰에 모드 변경 메시지 전송
        if (chatProvider && chatProvider._view) {
          chatProvider._view.webview.postMessage({
            command: 'changeUiMode',
            mode: 'hybrid'
          });
        }
      } catch (err: unknown) {
        console.error('APE 모드 채팅 열기 실패:', err);
      }
    }),
    
    // 설정 열기 명령
    vscode.commands.registerCommand('ape.openSettings', () => {
      console.log('ape.openSettings 명령 실행');
      // 설정 패널 생성
      const panel = vscode.window.createWebviewPanel(
        'ape.settingsPanel',
        'APE 설정',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.file(context.extensionPath)]
        }
      );
      
      // 웹뷰 내용 설정
      panel.webview.html = settingsViewProvider._getHtmlForWebview(panel.webview);
      
      // 웹뷰 메시지 처리 설정
      panel.webview.onDidReceiveMessage(async (message) => {
        // 메시지 처리 내용은 ApeSettingsViewProvider와 동일
        await settingsViewProvider._handleWebviewMessage(message);
      });
      
      // 설정 데이터 전송
      setTimeout(() => {
        settingsViewProvider._sendCurrentSettings(panel.webview);
      }, 500);
      
      console.log('설정 패널이 열렸습니다.');
    }),
    
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
    }),
    
    // TreeView 새로고침 명령
    vscode.commands.registerCommand('ape.refreshTreeView', () => {
      console.log('ape.refreshTreeView 명령 실행');
      treeDataProvider.refresh();
      vscode.window.showInformationMessage('APE 트리뷰가 새로고침되었습니다.');
    }),
    
    // 파일 탐색기 새로고침
    vscode.commands.registerCommand('ape.refreshFileExplorer', () => {
      console.log('ape.refreshFileExplorer 명령 실행');
      fileExplorerProvider.refresh();
      vscode.window.showInformationMessage('파일 탐색기가 새로고침되었습니다.');
    }),
    
    // 파일 열기 명령
    vscode.commands.registerCommand('ape.openFile', (filePath: string) => {
      console.log(`ape.openFile 명령 실행: ${filePath}`);
      
      if (filePath) {
        vscode.workspace.openTextDocument(filePath)
          .then(document => vscode.window.showTextDocument(document))
          .then(() => console.log(`파일 열기 성공: ${filePath}`))
          .catch(err => {
            console.error(`파일 열기 실패: ${filePath}`, err);
            vscode.window.showErrorMessage(`파일을 열 수 없습니다: ${path.basename(filePath)}`);
          });
      }
    }),
    
    // 새 파일 생성 명령
    vscode.commands.registerCommand('ape.createFile', (fileItem: FileItem) => {
      console.log('ape.createFile 명령 실행');
      const parentPath = fileItem ? fileItem.path : vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      
      if (parentPath) {
        fileExplorerProvider.createFileOrFolder(parentPath, FileItemType.FILE);
      } else {
        vscode.window.showErrorMessage('파일을 생성할 위치를 지정할 수 없습니다.');
      }
    }),
    
    // 새 폴더 생성 명령
    vscode.commands.registerCommand('ape.createFolder', (fileItem: FileItem) => {
      console.log('ape.createFolder 명령 실행');
      const parentPath = fileItem ? fileItem.path : vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      
      if (parentPath) {
        fileExplorerProvider.createFileOrFolder(parentPath, FileItemType.DIRECTORY);
      } else {
        vscode.window.showErrorMessage('폴더를 생성할 위치를 지정할 수 없습니다.');
      }
    }),
    
    // 파일/폴더 삭제 명령
    vscode.commands.registerCommand('ape.deleteFileOrFolder', (fileItem: FileItem) => {
      console.log('ape.deleteFileOrFolder 명령 실행');
      
      if (fileItem && fileItem.path) {
        fileExplorerProvider.deleteFileOrFolder(fileItem.path, fileItem.isDirectory);
      } else {
        vscode.window.showErrorMessage('삭제할 항목을 선택하세요.');
      }
    }),
    
    // 파일/폴더 이름 변경 명령
    vscode.commands.registerCommand('ape.renameFileOrFolder', (fileItem: FileItem) => {
      console.log('ape.renameFileOrFolder 명령 실행');
      
      if (fileItem && fileItem.path) {
        fileExplorerProvider.renameFileOrFolder(fileItem.path);
      } else {
        vscode.window.showErrorMessage('이름을 변경할 항목을 선택하세요.');
      }
    }),
    
    // 명령어 세부정보 보기 명령
    vscode.commands.registerCommand('ape.showCommandDetails', (item: ApeTreeItem) => {
      console.log('ape.showCommandDetails 명령 실행', item);
      
      if (item.type === 'command') {
        // 명령어 세부정보 패널 생성
        const panel = vscode.window.createWebviewPanel(
          'ape.commandDetailView',
          `명령어: ${item.label}`,
          vscode.ViewColumn.One,
          {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'resources'))]
          }
        );
        
        // 세부정보 HTML 생성
        const metadata = item.metadata || {};
        const cssPath = panel.webview.asWebviewUri(vscode.Uri.file(
          path.join(context.extensionPath, 'resources', 'css', 'claude-style.css')
        ));
        
        const contentHtml = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="${cssPath}">
          <title>명령어 세부정보: ${item.label}</title>
          <style>
            body {
              padding: 20px;
              font-family: var(--vscode-font-family);
              color: var(--vscode-editor-foreground);
              background-color: var(--vscode-editor-background);
            }
            .command-detail {
              background-color: var(--vscode-sideBar-background);
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 16px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .command-name {
              font-size: 1.5em;
              font-weight: bold;
              margin-bottom: 10px;
              color: var(--vscode-textLink-foreground);
            }
            .command-description {
              margin-bottom: 15px;
              font-size: 1.1em;
            }
            .command-syntax {
              font-family: var(--vscode-editor-font-family);
              background-color: var(--vscode-textCodeBlock-background);
              padding: 8px 12px;
              border-radius: 4px;
              margin: 10px 0;
              overflow-x: auto;
            }
            .command-examples-title {
              font-weight: bold;
              margin: 15px 0 10px 0;
            }
            .command-example {
              font-family: var(--vscode-editor-font-family);
              background-color: var(--vscode-textCodeBlock-background);
              padding: 8px 12px;
              border-radius: 4px;
              margin: 5px 0;
              overflow-x: auto;
            }
            .command-domain {
              font-style: italic;
              margin-top: 15px;
              color: var(--vscode-descriptionForeground);
            }
          </style>
        </head>
        <body>
          <div class="command-detail">
            <div class="command-name">${item.label}</div>
            <div class="command-description">${item.description || '설명 없음'}</div>
            
            ${metadata.syntax ? `
            <div class="command-syntax-title">사용법:</div>
            <div class="command-syntax">${metadata.syntax}</div>
            ` : ''}
            
            ${metadata.examples && metadata.examples.length > 0 ? `
            <div class="command-examples-title">예제:</div>
            ${metadata.examples.map((example: string) => `
              <div class="command-example">${example}</div>
            `).join('')}
            ` : ''}
            
            ${metadata.domain ? `
            <div class="command-domain">도메인: ${metadata.domain}</div>
            ` : ''}
          </div>
        </body>
        </html>
        `;
        
        panel.webview.html = contentHtml;
      }
    }),

    
    // SWDP 연결 테스트 명령
    vscode.commands.registerCommand('ape.testSwdpConnection', async () => {
      console.log('ape.testSwdpConnection 명령 실행');
      try {
        const swdpDomainService = SwdpDomainService.getInstance();
        const projects = await swdpDomainService.getProjects(true);
        
        if (projects && projects.length > 0) {
          const projectNames = projects.map(p => p.name).join(', ');
          vscode.window.showInformationMessage(`SWDP 연결 성공: ${projects.length}개 프로젝트 발견 (${projectNames})`);
        } else {
          vscode.window.showInformationMessage('SWDP 연결 성공: 프로젝트가 없습니다.');
        }
      } catch (error) {
        console.error('SWDP 연결 테스트 중 오류 발생:', error);
        vscode.window.showErrorMessage(`SWDP 연결 실패: ${error.message || '알 수 없는 오류'}`);
      }
    })
  );
  
  // 설정 마이그레이션 서비스 생성
  const migrationService = new ConfigMigrationService();
  
  // 웰컴 페이지 등록
  const registerWelcomePage = () => {
    // 웰컴 페이지 패널 생성 함수
    const createWelcomePanel = () => {
      const panel = vscode.window.createWebviewPanel(
        'ape.welcomeView',
        'APE: 시작하기',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, 'resources'))
          ]
        }
      );
      
      // 리소스 경로 설정
      const htmlPath = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'html', 'welcome.html'));
      const cssPath = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'resources', 'css')));
      const mediaDirPath = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'resources')));
      const codiconsPath = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'resources', 'codicons')));
      
      // HTML 파일 읽기 및 리소스 경로 교체
      vscode.workspace.fs.readFile(htmlPath).then(data => {
        let html = data.toString();
        html = html.replace(/{{cssPath}}/g, cssPath.toString());
        html = html.replace(/{{mediaDirPath}}/g, mediaDirPath.toString());
        html = html.replace(/{{codiconsPath}}/g, codiconsPath.toString());
        panel.webview.html = html;
      });
      
      // 웹뷰에서 메시지 수신
      panel.webview.onDidReceiveMessage(async message => {
        switch (message.command) {
          case 'openChat':
            await vscode.commands.executeCommand('ape.openChat');
            break;
          case 'setHybridMode':
            // 하이브리드 모드로 설정
            await vscode.workspace.getConfiguration('ape').update('uiMode', 'hybrid', vscode.ConfigurationTarget.Global);
            // 추가 명령 실행 (openHybridChat)
            if (message.command2) {
              await vscode.commands.executeCommand(message.command2);
            }
            break;
          case 'openHybridChat':
            await vscode.commands.executeCommand('ape.openHybridChat');
            break;
          case 'openDocumentation':
            await vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-repo/ape-extension/blob/main/docs/README.md'));
            break;
          case 'dontShowWelcome':
            await context.globalState.update('ape.hasShownWelcome', true);
            panel.dispose();
            break;
        }
      });
      
      return panel;
    };
    
    // 웰컴 커맨드 등록
    context.subscriptions.push(
      vscode.commands.registerCommand('ape.showWelcome', () => {
        createWelcomePanel();
      })
    );
    
    // 첫 실행 여부 확인 및 웰컴 페이지 표시
    const hasShownWelcome = context.globalState.get('ape.hasShownWelcome', false);
    if (!hasShownWelcome) {
      createWelcomePanel();
      context.globalState.update('ape.hasShownWelcome', true);
    }
  };
  
  // 코어 서비스 초기화
  apeCore.initialize().then(async (success) => {
    if (success) {
      console.log('APE 코어 서비스가 성공적으로 초기화되었습니다.');
      
      // 코어 서비스 초기화 후 TreeView 데이터 제공자 새로고침
      try {
        console.log('TreeView 새로고침 시작');
        treeDataProvider.refresh();
        console.log('TreeView 새로고침 완료');
      } catch (treeError) {
        console.error('TreeView 새로고침 중 오류 발생:', treeError);
      }
      
      // SWDP 관련 서비스 초기화
      try {
        // 사용자 인증 서비스 초기화
        const userAuthService = UserAuthService.getInstance();
        await userAuthService.initialize();
        console.log('UserAuthService 초기화 완료');
        
        // SWDP 도메인 서비스 초기화
        const swdpDomainService = SwdpDomainService.getInstance();
        await swdpDomainService.initialize();
        console.log('SwdpDomainService 초기화 완료');
        
        // SWDP 워크플로우 서비스 초기화
        const swdpWorkflowService = SwdpWorkflowService.getInstance();
        await swdpWorkflowService.initialize();
        console.log('SwdpWorkflowService 초기화 완료');
        
        // SWDP 플러그인 서비스 등록
        const swdpPluginService = new SwdpPluginService();
        (apeCore as ICoreService).pluginRegistry.registerPlugin(swdpPluginService);
        console.log('SwdpPluginService 등록 완료');
      } catch (swdpError) {
        console.error('SWDP 서비스 초기화 중 오류 발생:', swdpError);
        // 오류 발생해도 확장 프로그램 동작은 계속 진행
      }
      
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
      
      // 웰컴 페이지 등록
      registerWelcomePage();
      
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