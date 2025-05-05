/**
 * APE 파일 탐색기 데이터 제공자
 * 
 * VS Code TreeView API를 사용하여 파일 시스템 탐색 기능을 구현합니다.
 * 워크스페이스 내 파일 및 폴더 조회, 생성, 삭제, 이름 변경 기능을 제공합니다.
 * 
 * TODO: 
 * - 디버그 콘솔 로그를 확인하여 오류 발생 여부 확인하고 해결
 * - 대용량 폴더 처리 시 성능 최적화 필요
 * - 파일 드래그 앤 드롭 기능 추가
 * - 파일 필터링 및 검색 기능 구현
 * - 파일 상태 캐싱으로 불필요한 파일 시스템 접근 최소화
 * - Git 상태 표시 기능 통합 고려
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

// fs의 비동기 함수들을 Promise 기반으로 변환
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);
const rename = promisify(fs.rename);

/**
 * 파일 시스템 항목 유형 (파일 또는 폴더)
 */
export enum FileItemType {
  FILE = 'file',
  DIRECTORY = 'directory'
}

/**
 * 파일 시스템 항목 인터페이스
 */
export interface FileItem extends vscode.TreeItem {
  type: FileItemType;
  path: string;
  isDirectory: boolean;
  children?: FileItem[];
}

/**
 * APE 파일 탐색기 데이터 제공자 클래스
 */
export class ApeFileExplorerProvider implements vscode.TreeDataProvider<FileItem> {
  // VS Code 이벤트 이미터
  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined> = new vscode.EventEmitter<FileItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<FileItem | undefined> = this._onDidChangeTreeData.event;
  
  private _workspaceRoot: string | undefined;
  private _dirWatcher: vscode.FileSystemWatcher | undefined;
  
  /**
   * 생성자
   * @param context VS Code 확장 컨텍스트
   */
  constructor(private context: vscode.ExtensionContext) {
    // 워크스페이스 루트 경로 설정
    this._workspaceRoot = vscode.workspace.workspaceFolders 
      ? vscode.workspace.workspaceFolders[0].uri.fsPath 
      : undefined;
    
    // 파일 시스템 변경 감지를 위한 와처 설정
    this._setupWatcher();
  }
  
  /**
   * 파일 시스템 감시자 설정
   */
  private _setupWatcher() {
    if (!this._workspaceRoot) return;
    
    // 파일 시스템 변경 감지를 위한 와처 생성
    this._dirWatcher = vscode.workspace.createFileSystemWatcher('**/*');
    
    // 파일 생성 이벤트
    this._dirWatcher.onDidCreate(() => {
      this.refresh();
    });
    
    // 파일 삭제 이벤트
    this._dirWatcher.onDidDelete(() => {
      this.refresh();
    });
    
    // 파일 변경 이벤트
    this._dirWatcher.onDidChange(() => {
      this.refresh();
    });
  }
  
  /**
   * 트리 데이터 갱신
   */
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
  
  /**
   * TreeItem 요소를 가져옵니다.
   * @param element 파일 항목
   * @returns VS Code TreeItem 인스턴스
   */
  getTreeItem(element: FileItem): vscode.TreeItem {
    return element;
  }
  
  /**
   * 자식 요소를 가져옵니다.
   * @param element 파일 항목 (없으면 루트 항목)
   * @returns 자식 파일 항목 배열
   */
  async getChildren(element?: FileItem): Promise<FileItem[]> {
    // 워크스페이스가 열려있지 않은 경우
    if (!this._workspaceRoot) {
      vscode.window.showInformationMessage('파일 탐색을 위해 폴더를 열어주세요.');
      return [];
    }
    
    if (element) {
      // 폴더 내용 조회
      return this._getFileItems(element.path);
    } else {
      // 루트 디렉토리 조회
      return this._getFileItems(this._workspaceRoot);
    }
  }
  
  /**
   * 특정 경로의 파일 항목 목록을 가져옵니다.
   * @param dirPath 디렉토리 경로
   * @returns 파일 항목 배열
   */
  private async _getFileItems(dirPath: string): Promise<FileItem[]> {
    try {
      // 디렉토리 내용 읽기
      const files = await readdir(dirPath);
      
      // 각 파일 항목 처리 (병렬로 처리)
      const fileItems = await Promise.all(files.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const fileStat = await stat(filePath);
        const isDirectory = fileStat.isDirectory();
        
        // 트리 항목 생성
        const item: FileItem = {
          label: file,
          path: filePath,
          type: isDirectory ? FileItemType.DIRECTORY : FileItemType.FILE,
          isDirectory: isDirectory,
          collapsibleState: isDirectory 
            ? vscode.TreeItemCollapsibleState.Collapsed 
            : vscode.TreeItemCollapsibleState.None,
          contextValue: isDirectory ? 'directory' : 'file',
          iconPath: this._getIconPath(file, isDirectory)
        };
        
        // 파일 항목에 명령 추가 (클릭 시 파일 열기)
        if (!isDirectory) {
          item.command = {
            command: 'ape.openFile',
            title: '파일 열기',
            arguments: [filePath]
          };
        }
        
        return item;
      }));
      
      // 정렬: 폴더 먼저, 그 다음 파일
      return fileItems.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) {
          return -1;
        }
        if (!a.isDirectory && b.isDirectory) {
          return 1;
        }
        return (a.label as string).localeCompare(b.label as string);
      });
    } catch (error) {
      console.error(`디렉토리 읽기 오류 (${dirPath}):`, error);
      return [];
    }
  }
  
  /**
   * 파일/폴더 아이콘 경로를 가져옵니다.
   * @param filename 파일 이름
   * @param isDirectory 디렉토리 여부
   * @returns 아이콘 경로 또는 ThemeIcon
   */
  private _getIconPath(filename: string, isDirectory: boolean): vscode.ThemeIcon {
    if (isDirectory) {
      return new vscode.ThemeIcon('folder');
    }
    
    // 파일 확장자에 따른 아이콘 할당
    const ext = path.extname(filename).toLowerCase();
    
    switch (ext) {
      case '.js':
        return new vscode.ThemeIcon('javascript');
      case '.ts':
        return new vscode.ThemeIcon('typescript');
      case '.json':
        return new vscode.ThemeIcon('json');
      case '.html':
        return new vscode.ThemeIcon('html');
      case '.css':
        return new vscode.ThemeIcon('css');
      case '.md':
        return new vscode.ThemeIcon('markdown');
      case '.py':
        return new vscode.ThemeIcon('python');
      case '.java':
        return new vscode.ThemeIcon('java');
      case '.php':
        return new vscode.ThemeIcon('php');
      case '.c':
      case '.cpp':
      case '.h':
        return new vscode.ThemeIcon('c');
      case '.go':
        return new vscode.ThemeIcon('go');
      case '.rb':
        return new vscode.ThemeIcon('ruby');
      case '.sh':
        return new vscode.ThemeIcon('terminal');
      case '.bat':
      case '.cmd':
        return new vscode.ThemeIcon('terminal-cmd');
      case '.sql':
        return new vscode.ThemeIcon('database');
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
      case '.svg':
        return new vscode.ThemeIcon('image');
      default:
        return new vscode.ThemeIcon('file');
    }
  }
  
  /**
   * 파일 또는 폴더 생성
   * @param parentPath 부모 디렉토리 경로
   * @param type 생성할 항목 유형 (파일 또는 폴더)
   */
  async createFileOrFolder(parentPath: string, type: FileItemType): Promise<void> {
    try {
      const baseName = type === FileItemType.DIRECTORY ? '새 폴더' : '새 파일.txt';
      const inputOptions: vscode.InputBoxOptions = {
        prompt: `${type === FileItemType.DIRECTORY ? '폴더' : '파일'} 이름을 입력하세요`,
        value: baseName
      };
      
      // 이름 입력 받기
      const fileName = await vscode.window.showInputBox(inputOptions);
      
      if (!fileName) return; // 사용자가 취소한 경우
      
      const newPath = path.join(parentPath, fileName);
      
      // 파일 또는 폴더 생성
      if (type === FileItemType.DIRECTORY) {
        await mkdir(newPath);
      } else {
        // 파일 생성 (빈 파일)
        await writeFile(newPath, '');
        
        // 생성된 파일 열기
        const document = await vscode.workspace.openTextDocument(newPath);
        await vscode.window.showTextDocument(document);
      }
      
      // 트리 뷰 갱신
      this.refresh();
      
    } catch (error) {
      console.error('파일/폴더 생성 오류:', error);
      vscode.window.showErrorMessage(`${type === FileItemType.DIRECTORY ? '폴더' : '파일'} 생성 중 오류가 발생했습니다.`);
    }
  }
  
  /**
   * 파일 또는 폴더 삭제
   * @param itemPath 삭제할 항목 경로
   * @param isDirectory 디렉토리 여부
   */
  async deleteFileOrFolder(itemPath: string, isDirectory: boolean): Promise<void> {
    try {
      // 확인 메시지
      const itemName = path.basename(itemPath);
      const confirmMessage = isDirectory
        ? `폴더 '${itemName}'와 그 내용을 삭제하시겠습니까?`
        : `파일 '${itemName}'을 삭제하시겠습니까?`;
        
      const confirmOptions = {
        modal: true,
        detail: '이 작업은 되돌릴 수 없습니다.'
      };
      
      const confirmed = await vscode.window.showWarningMessage(
        confirmMessage, 
        confirmOptions, 
        '삭제'
      );
      
      if (confirmed !== '삭제') {
        return; // 사용자가 취소한 경우
      }
      
      // 삭제 수행
      if (isDirectory) {
        // 재귀적으로 폴더 삭제
        await this._removeDirectoryRecursive(itemPath);
      } else {
        // 파일 삭제
        await unlink(itemPath);
      }
      
      // 트리 뷰 갱신
      this.refresh();
      
    } catch (error) {
      console.error('삭제 오류:', error);
      vscode.window.showErrorMessage('항목 삭제 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 재귀적으로 디렉토리 삭제
   * @param dirPath 삭제할 디렉토리 경로
   */
  private async _removeDirectoryRecursive(dirPath: string): Promise<void> {
    try {
      const entries = await readdir(dirPath);
      
      // 모든 하위 항목에 대해 처리
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        const entryStat = await stat(entryPath);
        
        if (entryStat.isDirectory()) {
          // 하위 디렉토리 재귀적 삭제
          await this._removeDirectoryRecursive(entryPath);
        } else {
          // 파일 삭제
          await unlink(entryPath);
        }
      }
      
      // 디렉토리 자체 삭제
      await rmdir(dirPath);
      
    } catch (error) {
      console.error(`디렉토리 삭제 오류 (${dirPath}):`, error);
      throw error;
    }
  }
  
  /**
   * 파일 또는 폴더 이름 변경
   * @param itemPath 이름을 변경할 항목 경로
   */
  async renameFileOrFolder(itemPath: string): Promise<void> {
    try {
      const dirName = path.dirname(itemPath);
      const baseName = path.basename(itemPath);
      
      const inputOptions: vscode.InputBoxOptions = {
        prompt: '새 이름을 입력하세요',
        value: baseName
      };
      
      // 새 이름 입력 받기
      const newName = await vscode.window.showInputBox(inputOptions);
      
      if (!newName || newName === baseName) {
        return; // 변경 없거나 사용자가 취소한 경우
      }
      
      // 새 경로 생성
      const newPath = path.join(dirName, newName);
      
      // 이미 존재하는 파일/폴더인지 확인
      try {
        await stat(newPath);
        // 파일이 이미 존재하는 경우
        vscode.window.showErrorMessage(`'${newName}'은 이미 존재합니다.`);
        return;
      } catch (e) {
        // 파일이 존재하지 않음 - 정상 진행
      }
      
      // 이름 변경 수행
      await rename(itemPath, newPath);
      
      // 트리 뷰 갱신
      this.refresh();
      
    } catch (error) {
      console.error('이름 변경 오류:', error);
      vscode.window.showErrorMessage('이름 변경 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 부모 항목 조회 (선택적 구현)
   */
  getParent(element: FileItem): vscode.ProviderResult<FileItem> {
    const parentPath = path.dirname(element.path);
    
    // 루트 디렉토리인 경우
    if (parentPath === element.path) {
      return null;
    }
    
    // 부모 항목 반환
    return {
      label: path.basename(parentPath),
      path: parentPath,
      type: FileItemType.DIRECTORY,
      isDirectory: true,
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
      contextValue: 'directory',
      iconPath: new vscode.ThemeIcon('folder')
    };
  }
}