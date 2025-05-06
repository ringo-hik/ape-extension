/**
 * APE TreeView 데이터 제공자
 * 
 * VS Code TreeView API를 사용하여 계층적인 데이터 표시를 구현합니다.
 * 채팅 세션, 지식 저장소, 명령어, 설정 등을 계층적으로 표시합니다.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { ApeCoreService } from '../core/ApeCoreService';
import { CommandType, CommandDomain } from '../types/CommandTypes';
import { SwdpDomainService } from '../core/domain/SwdpDomainService';

/**
 * TreeView 노드 타입 열거형
 */
export enum TreeNodeType {
  // 카테고리 노드
  CATEGORY = 'category',
  
  // 채팅 관련 노드
  CHAT_SESSION = 'chat-session',
  CHAT_HISTORY = 'chat-history',
  
  // 명령어 관련 노드
  COMMAND_ROOT = 'command-root',
  COMMAND_DOMAIN = 'command-domain',
  COMMAND = 'command',
  
  // 지식 저장소 관련 노드
  VAULT_ROOT = 'vault-root',
  VAULT_FOLDER = 'vault-folder',
  VAULT_DOCUMENT = 'vault-document',
  
  // SWDP 관련 노드
  SWDP_ROOT = 'swdp-root',
  SWDP_PROJECT = 'swdp-project',
  SWDP_TASK = 'swdp-task',
  SWDP_DOCUMENT = 'swdp-document',
  SWDP_BUILD = 'swdp-build',
  
  // 룰 관련 노드
  RULE_ROOT = 'rule-root',
  RULE = 'rule',
  
  // 설정 관련 노드
  SETTINGS_ROOT = 'settings-root',
  SETTINGS_CATEGORY = 'settings-category',
  SETTINGS_ITEM = 'settings-item'
}

/**
 * TreeView 아이템 인터페이스
 */
export interface ApeTreeItem {
  // 기본 속성
  id: string;
  label: string;
  type: TreeNodeType;
  
  // 추가 속성
  description?: string;
  iconPath?: string | vscode.ThemeIcon;
  tooltip?: string;
  contextValue?: string;
  
  // 메타데이터 (명령어, 실행 함수 등)
  metadata?: any;
  
  // 자식 아이템
  children?: ApeTreeItem[];
}

/**
 * APE TreeView 데이터 제공자 클래스
 */
export class ApeTreeDataProvider implements vscode.TreeDataProvider<ApeTreeItem> {
  // VS Code 이벤트 이미터
  private _onDidChangeTreeData: vscode.EventEmitter<ApeTreeItem | undefined> = new vscode.EventEmitter<ApeTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ApeTreeItem | undefined> = this._onDidChangeTreeData.event;
  
  // 트리 데이터
  private treeData: ApeTreeItem[] = [];
  
  // 컨텍스트 및 서비스 참조
  private context: vscode.ExtensionContext;
  private coreService: ApeCoreService;
  
  /**
   * 생성자
   * @param context VS Code 확장 컨텍스트
   */
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.coreService = ApeCoreService.getInstance();
    
    // 트리 데이터 초기화 (비동기 처리)
    // 코어 서비스가 초기화될 때까지 기다리지 않음
    // refresh() 메서드를 통해 UI 업데이트 가능
    setTimeout(() => {
      console.log('ApeTreeDataProvider: 초기 트리 데이터 초기화 시작');
      this.initializeTreeData();
      console.log('ApeTreeDataProvider: 초기 트리 데이터 초기화 완료');
    }, 1000);
  }
  
  /**
   * TreeView 데이터를 초기화합니다.
   */
  private initializeTreeData(): void {
    this.treeData = [
      // 채팅 카테고리
      {
        id: 'chat',
        label: '채팅',
        type: TreeNodeType.CATEGORY,
        iconPath: new vscode.ThemeIcon('comment'),
        contextValue: 'chatCategory',
        children: [
          {
            id: 'chat-current',
            label: '현재 세션',
            type: TreeNodeType.CHAT_SESSION,
            iconPath: new vscode.ThemeIcon('comment-discussion'),
            contextValue: 'chatSession',
            description: '진행 중인 대화'
          },
          {
            id: 'chat-history',
            label: '히스토리',
            type: TreeNodeType.CHAT_HISTORY,
            iconPath: new vscode.ThemeIcon('history'),
            contextValue: 'chatHistory',
            children: this.getChatHistoryItems()
          }
        ]
      },
      
      // 명령어 카테고리
      {
        id: 'commands',
        label: '명령어',
        type: TreeNodeType.COMMAND_ROOT,
        iconPath: new vscode.ThemeIcon('terminal'),
        contextValue: 'commandRoot',
        children: this.getCommandDomainItems()
      },
      
      // 지식 저장소 카테고리
      {
        id: 'vault',
        label: '지식 저장소',
        type: TreeNodeType.VAULT_ROOT,
        iconPath: new vscode.ThemeIcon('library'),
        contextValue: 'vaultRoot',
        children: this.getVaultItems()
      },
      
      // SWDP 카테고리
      {
        id: 'swdp',
        label: 'SWDP 포털',
        type: TreeNodeType.SWDP_ROOT,
        iconPath: new vscode.ThemeIcon('organization'),
        contextValue: 'swdpRoot',
        children: this.getSwdpItems()
      },
      
      // 룰 카테고리
      {
        id: 'rules',
        label: '프롬프트 룰',
        type: TreeNodeType.RULE_ROOT,
        iconPath: new vscode.ThemeIcon('law'),
        contextValue: 'ruleRoot',
        children: this.getRuleItems()
      },
      
      // 설정 카테고리
      {
        id: 'settings',
        label: '설정',
        type: TreeNodeType.SETTINGS_ROOT,
        iconPath: new vscode.ThemeIcon('gear'),
        contextValue: 'settingsRoot',
        children: this.getSettingsItems()
      }
    ];
  }
  
  /**
   * 채팅 히스토리 아이템을 가져옵니다.
   * @returns 채팅 히스토리 트리 아이템 배열
   */
  private getChatHistoryItems(): ApeTreeItem[] {
    // TODO: 실제 채팅 히스토리 데이터로 대체
    return [
      {
        id: 'chat-history-1',
        label: '오늘 (2 세션)',
        type: TreeNodeType.CHAT_HISTORY,
        iconPath: new vscode.ThemeIcon('calendar'),
        contextValue: 'chatHistoryDay',
        children: [
          {
            id: 'chat-session-1',
            label: '프로젝트 설정 도움말',
            type: TreeNodeType.CHAT_SESSION,
            iconPath: new vscode.ThemeIcon('comment'),
            description: '오늘 10:30',
            contextValue: 'chatHistorySession'
          },
          {
            id: 'chat-session-2',
            label: '명령어 시스템 개발',
            type: TreeNodeType.CHAT_SESSION,
            iconPath: new vscode.ThemeIcon('comment'),
            description: '오늘 14:15',
            contextValue: 'chatHistorySession'
          }
        ]
      },
      {
        id: 'chat-history-2',
        label: '어제 (1 세션)',
        type: TreeNodeType.CHAT_HISTORY,
        iconPath: new vscode.ThemeIcon('calendar'),
        contextValue: 'chatHistoryDay',
        children: [
          {
            id: 'chat-session-3',
            label: 'UI 개선 작업',
            type: TreeNodeType.CHAT_SESSION,
            iconPath: new vscode.ThemeIcon('comment'),
            description: '어제 15:45',
            contextValue: 'chatHistorySession'
          }
        ]
      }
    ];
  }
  
  /**
   * 명령어 도메인 아이템을 가져옵니다.
   * @returns 명령어 도메인 트리 아이템 배열
   */
  private getCommandDomainItems(): ApeTreeItem[] {
    // commandRegistry가 undefined일 수 있으므로 안전하게 처리
    const commandRegistry = this.coreService?.commandRegistry;
    const domains: ApeTreeItem[] = [];
    
    if (!commandRegistry) {
      console.log('ApeTreeDataProvider: commandRegistry가 초기화되지 않았습니다. 기본 명령어 도메인 반환');
      return [{
        id: 'commands-not-ready',
        label: '명령어 로딩 중...',
        type: TreeNodeType.COMMAND_DOMAIN,
        iconPath: new vscode.ThemeIcon('loading~spin'),
        contextValue: 'commandLoading',
        description: '명령어 시스템 초기화 중',
        children: []
      }];
    }
    
    // 시스템 명령어 (/로 시작하는 명령어)
    const systemCommandItem: ApeTreeItem = {
      id: 'commands-system',
      label: '시스템 명령어',
      type: TreeNodeType.COMMAND_DOMAIN,
      iconPath: new vscode.ThemeIcon('settings-gear'),
      contextValue: 'commandDomain',
      description: '/로 시작하는 명령어',
      children: []
    };
    
    try {
      // 시스템 명령어 로드
      const systemCommands = commandRegistry.getAllSystemCommandUsages() || [];
      systemCommandItem.children = systemCommands.map(cmd => ({
        id: `command-${cmd.command}`,
        label: cmd.command,
        type: TreeNodeType.COMMAND,
        description: cmd.description,
        iconPath: new vscode.ThemeIcon('terminal'),
        contextValue: 'command',
        metadata: {
          syntax: cmd.syntax,
          examples: cmd.examples,
          agentId: cmd.agentId
        }
      }));
    } catch (error) {
      console.error('ApeTreeDataProvider: 시스템 명령어 로드 중 오류 발생:', error);
      systemCommandItem.children = [{
        id: 'commands-system-error',
        label: '명령어 로드 오류',
        type: TreeNodeType.COMMAND,
        description: '명령어를 로드하는 중 오류가 발생했습니다',
        iconPath: new vscode.ThemeIcon('error'),
        contextValue: 'commandError'
      }];
    }
    
    domains.push(systemCommandItem);
    
    // 도메인별 명령어 ('@'로 시작하는 명령어)
    // Git 도메인
    domains.push({
      id: 'commands-git',
      label: 'Git 명령어',
      type: TreeNodeType.COMMAND_DOMAIN,
      iconPath: new vscode.ThemeIcon('git-merge'),
      contextValue: 'commandDomain',
      description: '@git:로 시작하는 명령어',
      children: this.getCommandsForDomain(CommandDomain.GIT)
    });
    
    // 문서 도메인
    domains.push({
      id: 'commands-doc',
      label: '문서 명령어',
      type: TreeNodeType.COMMAND_DOMAIN,
      iconPath: new vscode.ThemeIcon('book'),
      contextValue: 'commandDomain',
      description: '@doc:로 시작하는 명령어',
      children: this.getCommandsForDomain(CommandDomain.DOC)
    });
    
    // Jira 도메인
    domains.push({
      id: 'commands-jira',
      label: 'Jira 명령어',
      type: TreeNodeType.COMMAND_DOMAIN,
      iconPath: new vscode.ThemeIcon('issues'),
      contextValue: 'commandDomain',
      description: '@jira:로 시작하는 명령어',
      children: this.getCommandsForDomain(CommandDomain.JIRA)
    });
    
    // Pocket 도메인
    domains.push({
      id: 'commands-pocket',
      label: 'Pocket 명령어',
      type: TreeNodeType.COMMAND_DOMAIN,
      iconPath: new vscode.ThemeIcon('archive'),
      contextValue: 'commandDomain',
      description: '@pocket:로 시작하는 명령어',
      children: this.getCommandsForDomain(CommandDomain.POCKET)
    });
    
    // Vault 도메인
    domains.push({
      id: 'commands-vault',
      label: 'Vault 명령어',
      type: TreeNodeType.COMMAND_DOMAIN,
      iconPath: new vscode.ThemeIcon('database'),
      contextValue: 'commandDomain',
      description: '@vault:로 시작하는 명령어',
      children: this.getCommandsForDomain(CommandDomain.VAULT)
    });
    
    // Rules 도메인
    domains.push({
      id: 'commands-rules',
      label: 'Rules 명령어',
      type: TreeNodeType.COMMAND_DOMAIN,
      iconPath: new vscode.ThemeIcon('law'),
      contextValue: 'commandDomain',
      description: '@rules:로 시작하는 명령어',
      children: this.getCommandsForDomain(CommandDomain.RULES)
    });
    
    // SWDP 도메인
    domains.push({
      id: 'commands-swdp',
      label: 'SWDP 명령어',
      type: TreeNodeType.COMMAND_DOMAIN,
      iconPath: new vscode.ThemeIcon('organization'),
      contextValue: 'commandDomain',
      description: '@swdp:로 시작하는 명령어',
      children: this.getCommandsForDomain(CommandDomain.SWDP)
    });
    
    return domains;
  }
  
  /**
   * 특정 도메인의 명령어를 가져옵니다.
   * @param domain 명령어 도메인
   * @returns 해당 도메인의 명령어 트리 아이템 배열
   */
  private getCommandsForDomain(domain: CommandDomain): ApeTreeItem[] {
    try {
      const commandRegistry = this.coreService?.commandRegistry;
      
      // commandRegistry가 undefined인 경우 처리
      if (!commandRegistry) {
        console.log(`ApeTreeDataProvider: ${domain} 도메인 명령어 로드 실패 - commandRegistry가 초기화되지 않음`);
        return [{
          id: `command-${domain}-loading`,
          label: '로딩 중...',
          type: TreeNodeType.COMMAND,
          description: '명령어 로드 중',
          iconPath: new vscode.ThemeIcon('loading~spin'),
          contextValue: 'commandLoading'
        }];
      }
      
      const domainCommands = commandRegistry.getDomainCommands(domain) || [];
      
      return domainCommands.map(cmd => ({
        id: `command-${domain}-${cmd.command}`,
        label: cmd.command,
        type: TreeNodeType.COMMAND,
        description: cmd.description,
        iconPath: new vscode.ThemeIcon('terminal'),
        contextValue: 'command',
        metadata: {
          syntax: cmd.syntax,
          examples: cmd.examples,
          domain: domain,
          agentId: cmd.agentId
        }
      }));
    } catch (error) {
      console.error(`ApeTreeDataProvider: ${domain} 도메인 명령어 로드 중 오류 발생:`, error);
      return [{
        id: `command-${domain}-error`,
        label: '명령어 로드 오류',
        type: TreeNodeType.COMMAND,
        description: '명령어를 로드하는 중 오류가 발생했습니다',
        iconPath: new vscode.ThemeIcon('error'),
        contextValue: 'commandError'
      }];
    }
  }
  
  /**
   * 지식 저장소 아이템을 가져옵니다.
   * @returns 지식 저장소 트리 아이템 배열
   */
  private getVaultItems(): ApeTreeItem[] {
    // TODO: 실제 지식 저장소 데이터로 대체
    return [
      {
        id: 'vault-coding',
        label: '코딩 가이드',
        type: TreeNodeType.VAULT_FOLDER,
        iconPath: new vscode.ThemeIcon('folder'),
        contextValue: 'vaultFolder',
        children: [
          {
            id: 'vault-doc-1',
            label: 'TypeScript 스타일 가이드',
            type: TreeNodeType.VAULT_DOCUMENT,
            iconPath: new vscode.ThemeIcon('file-text'),
            contextValue: 'vaultDocument',
            description: '2024-05-01'
          },
          {
            id: 'vault-doc-2',
            label: 'VS Code API 사용법',
            type: TreeNodeType.VAULT_DOCUMENT,
            iconPath: new vscode.ThemeIcon('file-text'),
            contextValue: 'vaultDocument',
            description: '2024-04-28'
          }
        ]
      },
      {
        id: 'vault-project',
        label: '프로젝트 문서',
        type: TreeNodeType.VAULT_FOLDER,
        iconPath: new vscode.ThemeIcon('folder'),
        contextValue: 'vaultFolder',
        children: [
          {
            id: 'vault-doc-3',
            label: 'APE 아키텍처 문서',
            type: TreeNodeType.VAULT_DOCUMENT,
            iconPath: new vscode.ThemeIcon('file-text'),
            contextValue: 'vaultDocument',
            description: '2024-05-03'
          }
        ]
      }
    ];
  }
  
  /**
   * 프롬프트 룰 아이템을 가져옵니다.
   * @returns 프롬프트 룰 트리 아이템 배열
   */
  private getRuleItems(): ApeTreeItem[] {
    // TODO: 실제 프롬프트 룰 데이터로 대체
    return [
      {
        id: 'rule-1',
        label: '코드 스타일 룰',
        type: TreeNodeType.RULE,
        iconPath: new vscode.ThemeIcon('symbol-interface'),
        contextValue: 'rule',
        description: '활성화됨'
      },
      {
        id: 'rule-2',
        label: '문서화 룰',
        type: TreeNodeType.RULE,
        iconPath: new vscode.ThemeIcon('symbol-interface'),
        contextValue: 'rule',
        description: '활성화됨'
      },
      {
        id: 'rule-3',
        label: '테스트 작성 룰',
        type: TreeNodeType.RULE,
        iconPath: new vscode.ThemeIcon('symbol-interface'),
        contextValue: 'rule',
        description: '비활성화됨'
      }
    ];
  }
  
  /**
   * 설정 아이템을 가져옵니다.
   * @returns 설정 트리 아이템 배열
   */
  private getSettingsItems(): ApeTreeItem[] {
    return [
      {
        id: 'settings-open',
        label: '설정 열기',
        type: TreeNodeType.SETTINGS_ITEM,
        iconPath: new vscode.ThemeIcon('gear'),
        contextValue: 'settingsOpen',
        description: '설정 페이지로 이동',
        metadata: {
          command: 'ape.openSettings',
          title: '설정 열기'
        }
      },
      {
        id: 'settings-llm',
        label: 'LLM 설정',
        type: TreeNodeType.SETTINGS_CATEGORY,
        iconPath: new vscode.ThemeIcon('dashboard'),
        contextValue: 'settingsCategory',
        children: [
          {
            id: 'settings-llm-model',
            label: '기본 모델',
            type: TreeNodeType.SETTINGS_ITEM,
            iconPath: new vscode.ThemeIcon('symbol-parameter'),
            contextValue: 'settingsItem',
            description: this.getConfigValue('ape.llm.defaultModel')
          },
          {
            id: 'settings-llm-streaming',
            label: '스트리밍 지원',
            type: TreeNodeType.SETTINGS_ITEM,
            iconPath: new vscode.ThemeIcon('symbol-parameter'),
            contextValue: 'settingsItem',
            description: this.getConfigValue('ape.llm.supportsStreaming') === 'true' ? '활성화됨' : '비활성화됨'
          }
        ]
      },
      {
        id: 'settings-core',
        label: '코어 설정',
        type: TreeNodeType.SETTINGS_CATEGORY,
        iconPath: new vscode.ThemeIcon('gear'),
        contextValue: 'settingsCategory',
        children: [
          {
            id: 'settings-core-ssl',
            label: 'SSL 우회',
            type: TreeNodeType.SETTINGS_ITEM,
            iconPath: new vscode.ThemeIcon('symbol-parameter'),
            contextValue: 'settingsItem',
            description: this.getConfigValue('ape.core.sslBypass') === 'true' ? '활성화됨' : '비활성화됨'
          },
          {
            id: 'settings-core-log',
            label: '로그 레벨',
            type: TreeNodeType.SETTINGS_ITEM,
            iconPath: new vscode.ThemeIcon('symbol-parameter'),
            contextValue: 'settingsItem',
            description: this.getConfigValue('ape.core.logLevel')
          }
        ]
      }
    ];
  }
  
  /**
   * VS Code 설정에서 값을 가져옵니다.
   * @param key 설정 키
   * @returns 설정 값 (문자열로 변환)
   */
  private getConfigValue(key: string): string {
    const config = vscode.workspace.getConfiguration();
    const value = config.get(key);
    return value !== undefined ? String(value) : '설정되지 않음';
  }
  
  /**
   * TreeView를 새로고침합니다.
   */
  public refresh(): void {
    console.log('ApeTreeDataProvider: 트리뷰 새로고침 시작');
    try {
      this.initializeTreeData();
      console.log('ApeTreeDataProvider: 트리 데이터 초기화 완료');
      this._onDidChangeTreeData.fire(undefined);
      console.log('ApeTreeDataProvider: TreeView 업데이트 이벤트 발생 완료');
    } catch (error) {
      console.error('ApeTreeDataProvider: 새로고침 중 오류 발생:', error);
    }
  }
  
  /**
   * TreeItem 요소를 가져옵니다.
   * @param element TreeView 아이템
   * @returns VS Code TreeItem 인스턴스
   */
  getTreeItem(element: ApeTreeItem): vscode.TreeItem {
    // TreeItem 인스턴스 생성
    const treeItem = new vscode.TreeItem(
      element.label,
      element.children && element.children.length > 0 
        ? vscode.TreeItemCollapsibleState.Collapsed 
        : vscode.TreeItemCollapsibleState.None
    );
    
    // 기본 속성 설정
    treeItem.description = element.description;
    treeItem.tooltip = element.tooltip || element.description || element.label;
    treeItem.contextValue = element.contextValue;
    
    // 아이콘 설정
    if (element.iconPath) {
      treeItem.iconPath = element.iconPath;
    }
    
    // 메타데이터 설정 및 명령 연결
    if (element.metadata) {
      if (element.contextValue === 'settingsOpen') {
        // 설정 열기 명령 설정
        treeItem.command = {
          command: element.metadata.command,
          title: element.metadata.title || '설정 열기'
        };
      } else if (element.type === TreeNodeType.COMMAND) {
        // 명령어 세부정보 보기 명령 설정
        treeItem.command = {
          command: 'ape.showCommandDetails',
          title: '명령어 세부정보 보기',
          arguments: [element]
        };
      }
    }
    
    return treeItem;
  }
  
  /**
   * 아이템의 자식 요소를 가져옵니다.
   * @param element TreeView 아이템 (없으면 루트 아이템)
   * @returns 자식 아이템 배열 또는 null
   */
  getChildren(element?: ApeTreeItem): ApeTreeItem[] | null {
    if (!element) {
      return this.treeData;
    }
    
    return element.children || [];
  }
  
  /**
   * SWDP 포털 아이템을 가져옵니다.
   * @returns SWDP 트리 아이템 배열
   */
  private getSwdpItems(): ApeTreeItem[] {
    try {
      // SWDP 기능 활성화 여부 확인
      const swdpEnabled = vscode.workspace.getConfiguration('ape').get('swdp.enabled', true);
      if (!swdpEnabled) {
        return [{
          id: 'swdp-disabled',
          label: 'SWDP 기능이 비활성화되었습니다',
          type: TreeNodeType.SWDP_ROOT,
          iconPath: new vscode.ThemeIcon('warning'),
          contextValue: 'swdpDisabled'
        }];
      }
      
      // 연결 상태 확인
      try {
        const swdpDomainService = SwdpDomainService.getInstance();
        const isInitialized = swdpDomainService.isInitialized();
        
        if (!isInitialized) {
          return [{
            id: 'swdp-not-initialized',
            label: 'SWDP 서비스 초기화 중...',
            type: TreeNodeType.SWDP_ROOT,
            iconPath: new vscode.ThemeIcon('loading~spin'),
            contextValue: 'swdpLoading'
          }];
        }
        
        // 프로젝트 목록 (미리 가져온 캐시 데이터 활용)
        const projects = swdpDomainService.getCachedProjects() || [];
        
        if (projects.length === 0) {
          return [{
            id: 'swdp-no-projects',
            label: '프로젝트가 없습니다',
            type: TreeNodeType.SWDP_ROOT,
            iconPath: new vscode.ThemeIcon('info'),
            contextValue: 'swdpNoProjects',
            description: '새로고침하여 다시 시도하세요'
          }];
        }
        
        // 프로젝트 트리 아이템 생성
        return projects.map(project => ({
          id: `swdp-project-${project.code}`,
          label: project.name,
          type: TreeNodeType.SWDP_PROJECT,
          iconPath: new vscode.ThemeIcon('project'),
          contextValue: 'swdpProject',
          description: project.description,
          metadata: {
            projectId: project.code,
            projectKey: project.code // code 사용
          },
          children: [
            {
              id: `swdp-tasks-${project.code}`,
              label: '작업',
              type: TreeNodeType.SWDP_ROOT,
              iconPath: new vscode.ThemeIcon('tasklist'),
              contextValue: 'swdpTasksFolder',
              description: '프로젝트 작업'
            },
            {
              id: `swdp-documents-${project.code}`,
              label: '문서',
              type: TreeNodeType.SWDP_ROOT,
              iconPath: new vscode.ThemeIcon('file-text'),
              contextValue: 'swdpDocsFolder',
              description: '프로젝트 문서'
            },
            {
              id: `swdp-builds-${project.code}`,
              label: '빌드',
              type: TreeNodeType.SWDP_ROOT,
              iconPath: new vscode.ThemeIcon('package'),
              contextValue: 'swdpBuildsFolder',
              description: '프로젝트 빌드'
            }
          ]
        }));
      } catch (error) {
        console.error('SWDP 데이터 가져오기 실패:', error);
        return [{
          id: 'swdp-error',
          label: 'SWDP 연결 오류',
          type: TreeNodeType.SWDP_ROOT,
          iconPath: new vscode.ThemeIcon('error'),
          contextValue: 'swdpError',
          description: error.message || '알 수 없는 오류'
        }];
      }
    } catch (error) {
      console.error('SWDP 트리 구성 중 오류 발생:', error);
      return [{
        id: 'swdp-error',
        label: 'SWDP 데이터 로드 오류',
        type: TreeNodeType.SWDP_ROOT,
        iconPath: new vscode.ThemeIcon('error'),
        contextValue: 'swdpError'
      }];
    }
  }

  /**
   * 특정 아이템의 부모를 가져옵니다.
   * @param element TreeView 아이템
   * @returns 부모 아이템 또는 null
   */
  getParent(element: ApeTreeItem): vscode.ProviderResult<ApeTreeItem> {
    // 부모 찾기는 선택적 구현이지만, 제공하면 트리의 탐색이 향상됨
    // 복잡한 트리 구조에서는 부모 참조를 별도로 유지하는 것이 좋음
    return null;
  }
}