# APE 테마 시스템 및 명령어 자동완성 UX 구현 계획

## 1. 테마 시스템 구현

### 1.1 VS Code 테마 통합

APE 확장은 VS Code의 내장 테마 시스템과 긴밀하게 통합하여 사용자 인터페이스의 일관성을 유지합니다.

#### 주요 통합 지점:
- **색상 변수 매핑**: VS Code 테마 변수를 CSS 변수로 매핑
- **테마 변경 감지**: 에디터 테마 변경 이벤트 구독 및 실시간 업데이트
- **고대비 모드 지원**: 접근성을 위한 고대비 모드 적응

### 1.2 CSS 변수 시스템

모든 UI 구성 요소는 중앙에서 관리되는 CSS 변수를 통해 스타일링됩니다.

#### CSS 변수 계층:
1. **기본 변수**: VS Code 테마에서 직접 매핑된 기본 색상 및 스타일
2. **파생 변수**: 기본 변수를 기반으로 한 UI 특화 변수
3. **구성 요소 변수**: 각 UI 구성 요소에 적용되는 특정 변수

### 1.3 테마 관리자 구현

`theme-manager.js`는 테마 변경 감지 및 적용을 담당합니다.

```javascript
class ThemeManager {
  constructor() {
    // VS Code API 구독
    this.vscode = acquireVsCodeApi();
    this.setupThemeSync();
    this.applyCurrentTheme();
  }
  
  setupThemeSync() {
    // VS Code 테마 변경 이벤트 구독
    window.addEventListener('message', (event) => {
      if (event.data.command === 'themeChanged') {
        this.applyTheme(event.data.theme);
      }
    });
  }
  
  applyCurrentTheme() {
    // 현재 VS Code 테마 정보 요청
    this.vscode.postMessage({
      command: 'getCurrentTheme'
    });
  }
  
  applyTheme(themeData) {
    // 문서 루트에 테마 변수 적용
    const root = document.documentElement;
    
    // 기본 색상 변수 적용
    Object.entries(themeData.colors).forEach(([key, value]) => {
      root.style.setProperty(`--vscode-${key}`, value);
    });
    
    // 테마 유형에 따른 클래스 적용 (다크/라이트)
    document.body.classList.toggle('vscode-light', themeData.type === 'light');
    document.body.classList.toggle('vscode-dark', themeData.type === 'dark');
    document.body.classList.toggle('vscode-high-contrast', themeData.type === 'high-contrast');
  }
}
```

## 2. 명령어 자동완성 UX 구현

### 2.1 컨텍스트 기반 명령어 시스템

명령어 시스템은 사용자가 직접 인자를 입력하지 않아도 되도록 컨텍스트 정보를 활용합니다.

#### 핵심 구성 요소:
1. **CommandService**: 중앙 명령어 처리 서비스
2. **ContextCollector**: 다양한 플러그인에서 상태 정보 수집
3. **CommandGenerator**: 컨텍스트 기반 명령어 생성

### 2.2 명령어 자동완성 UI

자동완성 시스템은 명령어 입력 과정을 간소화하고 컨텍스트 인식 제안을 제공합니다.

#### UI 구성 요소:
- **명령어 팝오버**: 명령어 유형별 계층적 메뉴
- **인라인 제안**: 현재 입력에 기반한 실시간 제안
- **컨텍스트 프리뷰**: 명령어 실행 결과 미리보기

### 2.3 통합 컨텍스트 수집기

각 플러그인의 상태 정보를 주기적으로 수집하여 명령어 생성에 활용합니다.

```typescript
class ContextCollector {
  private contextCache: Map<string, any> = new Map();
  
  constructor(private pluginRegistry: PluginRegistryService) {
    // 주기적 컨텍스트 업데이트
    setInterval(() => this.refreshAllContexts(), 30000);
  }
  
  async refreshAllContexts(): Promise<void> {
    // 각 플러그인 컨텍스트 수집
    await this.refreshGitContext();
    await this.refreshJiraContext();
    await this.refreshSwdpContext();
    await this.refreshPocketContext();
  }
  
  // Git 컨텍스트 수집
  private async refreshGitContext(): Promise<void> {
    const gitPlugin = this.pluginRegistry.getPlugin('git');
    if (!gitPlugin) return;
    
    const client = gitPlugin.getClient();
    
    // 상태 정보 수집
    const status = await client.getStatus();
    const branches = await client.getBranches();
    
    // 컨텍스트 캐시 업데이트
    this.contextCache.set('git', {
      status,
      branches,
      lastUpdated: new Date()
    });
  }
  
  // 다른 플러그인 컨텍스트 수집 메서드...
}
```

### 2.4 명령어 생성기

컨텍스트 정보를 기반으로 실행 가능한 완전한 명령어를 생성합니다.

```typescript
class CommandGenerator {
  constructor(private contextCollector: ContextCollector) {}
  
  async generateGitCommand(commandName: string): Promise<string | string[]> {
    const gitContext = this.contextCollector.getContext('git');
    
    switch (commandName) {
      case 'commit':
        // 변경 파일 기반 커밋 메시지 생성
        const fileNames = gitContext.status.changes
          .map(change => change.path).join(', ');
        return `@git:commit "${fileNames}의 변경 사항"`;
      
      case 'push':
        // 현재 브랜치 기반 push 명령어
        const currentBranch = gitContext.status.branch;
        const needsUpstream = !gitContext.status.tracking;
        
        return needsUpstream
          ? `@git:push origin ${currentBranch} --set-upstream`
          : `@git:push origin ${currentBranch}`;
      
      // 다른 명령어 처리...
    }
  }
  
  // 다른 플러그인 명령어 생성 메서드...
}
```

## 3. 구현 전략

### 3.1 점진적 확장

기존 시스템에 단계적으로 구현하여 안정성을 유지합니다.

1. **기반 구축**:
   - 테마 관리자 시스템 구현
   - 컨텍스트 수집 아키텍처 설계

2. **플러그인 통합**:
   - Git 플러그인 컨텍스트 수집 및 명령어 생성 구현
   - 다른 플러그인으로 점진적 확장

3. **UI 개선**:
   - 기존 자동완성 UI에 컨텍스트 인식 기능 추가
   - 사용자 피드백 기반 지속적 개선

### 3.2 모듈화 및 확장성

시스템은 모듈식 설계로 쉽게 확장 가능합니다.

- **플러그인 독립성**: 각 플러그인은 자체 컨텍스트 수집 및 명령어 생성 로직 포함
- **공통 인터페이스**: 모든 플러그인은 표준화된 인터페이스를 통해 시스템과 통합
- **확장 포인트**: 써드파티 플러그인이 자체 컨텍스트 및 명령어 로직 추가 가능

## 4. 구현 일정

1. **1주차**: 테마 시스템 및 기본 컨텍스트 아키텍처 구현
2. **2주차**: Git 플러그인 컨텍스트 수집 및 명령어 생성 구현
3. **3주차**: Jira 및 SWDP 플러그인 통합
4. **4주차**: Pocket 플러그인 통합 및 UI 개선
5. **5주차**: 테스트, 디버깅 및 사용자 피드백 기반 개선

## 5. 결과물

- **테마 시스템**: VS Code 테마와 완벽하게 통합된 일관된 UI
- **컨텍스트 인식 명령어**: 사용자 상황에 맞는, 즉시 실행 가능한 완성된 명령어
- **향상된 생산성**: 반복적인 입력을 최소화하고 워크플로우 효율성 향상
- **일관된 UX**: 모든 플러그인에 적용되는 통일된 사용자 경험