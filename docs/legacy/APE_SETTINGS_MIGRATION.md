# Ape에서 Ape로 설정 마이그레이션 전략

이 문서는 "APE" 확장 프로그램의 설정 네임스페이스를 "Ape"로 변경하기 위한 마이그레이션 전략을 설명합니다.

## 1. 설정 네임스페이스 변경 사항

### package.json 설정 스키마 변경

```json
// 변경 전
"configuration": {
  "title": "APE",
  "properties": {
    "ape.core.sslBypass": {
      "type": "boolean",
      "default": false,
      "description": "SSL 인증서 검증 우회 여부"
    },
    "ape.core.logLevel": {
      "type": "string",
      "enum": ["debug", "info", "warn", "error"],
      "default": "info",
      "description": "로그 레벨"
    },
    // 기타 설정...
  }
}

// 변경 후
"configuration": {
  "title": "Ape",
  "properties": {
    "ape.core.sslBypass": {
      "type": "boolean",
      "default": false,
      "description": "SSL 인증서 검증 우회 여부"
    },
    "ape.core.logLevel": {
      "type": "string",
      "enum": ["debug", "info", "warn", "error"],
      "default": "info",
      "description": "로그 레벨"
    },
    // 기타 설정...
  }
}
```

## 2. 설정 참조 변경 사항

### TypeScript 코드의 설정 접근 변경

```typescript
// 변경 전
const config = vscode.workspace.getConfiguration('ape.core');
const sslBypass = config.get('sslBypass', false);

// 변경 후
const config = vscode.workspace.getConfiguration('ape.core');
const sslBypass = config.get('sslBypass', false);
```

### 웹뷰 JavaScript의 설정 참조 변경

```javascript
// 변경 전
vscode.postMessage({
  command: 'toggleEmbedDevMode',
  enabled: embedDevMode
});

// 서버 측에서 설정 업데이트
vscode.workspace.getConfiguration('ape.core').update(
  'embedDevMode', 
  message.enabled, 
  vscode.ConfigurationTarget.Global
);

// 변경 후
vscode.postMessage({
  command: 'toggleEmbedDevMode',
  enabled: embedDevMode
});

// 서버 측에서 설정 업데이트
vscode.workspace.getConfiguration('ape.core').update(
  'embedDevMode', 
  message.enabled, 
  vscode.ConfigurationTarget.Global
);
```

## 3. 설정 마이그레이션 전략

### 3.1 설정 자동 마이그레이션 구현

확장 활성화 시 기존 설정 값을 새 설정으로 복사하는 코드를 `extension.ts`에 추가합니다:

```typescript
/**
 * 기존 ape.* 설정을 ape.* 설정으로 마이그레이션
 * @param context VS Code 확장 컨텍스트
 */
async function migrateSettings(context: vscode.ExtensionContext): Promise<void> {
  // 마이그레이션이 이미 완료되었는지 확인
  const migrationCompleted = context.globalState.get('ape.settings.migrationCompleted', false);
  if (migrationCompleted) {
    return;
  }
  
  console.log('설정 마이그레이션 시작: ape.* → ape.*');
  
  try {
    // 설정 섹션 마이그레이션
    await migrateSettingsSection('core');
    await migrateSettingsSection('llm');
    // 기타 섹션 마이그레이션
    
    // 마이그레이션 완료 표시
    await context.globalState.update('ape.settings.migrationCompleted', true);
    console.log('설정 마이그레이션 완료');
    
    // 사용자에게 알림
    vscode.window.showInformationMessage(
      'APE 설정이 Ape 네임스페이스로 마이그레이션되었습니다. 변경이 필요한 경우 설정을 확인하세요.'
    );
  } catch (error) {
    console.error('설정 마이그레이션 중 오류 발생:', error);
    
    // 오류 알림
    vscode.window.showErrorMessage(
      '설정 마이그레이션 중 오류가 발생했습니다. 설정을 수동으로 확인하세요.'
    );
  }
}

/**
 * 특정 설정 섹션 마이그레이션
 * @param section 설정 섹션 이름 (예: 'core', 'llm')
 */
async function migrateSettingsSection(section: string): Promise<void> {
  console.log(`설정 섹션 마이그레이션: ${section}`);
  
  // 기존 설정 가져오기
  const oldConfig = vscode.workspace.getConfiguration(`ape.${section}`);
  const newConfig = vscode.workspace.getConfiguration(`ape.${section}`);
  
  // 설정 키 목록 가져오기
  const keys = Object.keys(oldConfig).filter(key => 
    // inspect로 실제 사용자가 설정한 값만 선택 (기본값 제외)
    oldConfig.inspect(key)?.globalValue !== undefined || 
    oldConfig.inspect(key)?.workspaceValue !== undefined ||
    oldConfig.inspect(key)?.workspaceFolderValue !== undefined
  );
  
  // 설정 마이그레이션
  for (const key of keys) {
    try {
      // 값 가져오기
      const value = oldConfig.get(key);
      console.log(`설정 마이그레이션: ape.${section}.${key} → ape.${section}.${key}`, value);
      
      // 글로벌 설정 업데이트
      if (oldConfig.inspect(key)?.globalValue !== undefined) {
        await newConfig.update(key, value, vscode.ConfigurationTarget.Global);
      }
      
      // 워크스페이스 설정 업데이트
      if (oldConfig.inspect(key)?.workspaceValue !== undefined) {
        await newConfig.update(key, value, vscode.ConfigurationTarget.Workspace);
      }
      
      // 워크스페이스 폴더 설정 업데이트
      if (oldConfig.inspect(key)?.workspaceFolderValue !== undefined) {
        await newConfig.update(key, value, vscode.ConfigurationTarget.WorkspaceFolder);
      }
    } catch (error) {
      console.error(`설정 마이그레이션 오류 (${key}):`, error);
    }
  }
}
```

### 3.2 설정 접근 호환성 레이어 (선택 사항)

일시적으로 기존 `ape.*` 설정을 계속 지원하기 위한 호환성 레이어를 구현할 수 있습니다:

```typescript
/**
 * 설정 호환성 래퍼
 * 기존 ape.* 설정과 새 ape.* 설정을 모두 지원
 */
class SettingsProvider {
  /**
   * 설정 값 가져오기 (ape.* 우선, 없으면 ape.* 확인)
   */
  public static get<T>(section: string, key: string, defaultValue: T): T {
    // 새 네임스페이스에서 값 확인
    const newConfig = vscode.workspace.getConfiguration(`ape.${section}`);
    const newValue = newConfig.get<T>(key);
    
    if (newValue !== undefined) {
      return newValue;
    }
    
    // 이전 네임스페이스에서 값 확인
    const oldConfig = vscode.workspace.getConfiguration(`ape.${section}`);
    const oldValue = oldConfig.get<T>(key);
    
    // 값이 존재하면 반환, 없으면 기본값 반환
    return oldValue !== undefined ? oldValue : defaultValue;
  }
  
  /**
   * 설정 값 저장 (ape.* 네임스페이스에만 저장)
   */
  public static async set<T>(
    section: string, 
    key: string, 
    value: T, 
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(`ape.${section}`);
    await config.update(key, value, target);
  }
}
```

사용 예:
```typescript
// 설정 값 가져오기
const sslBypass = SettingsProvider.get('core', 'sslBypass', false);

// 설정 값 저장
await SettingsProvider.set('core', 'logLevel', 'debug');
```

### 3.3 이전 설정 삭제 (선택 사항)

마이그레이션 완료 후 일정 기간(예: 몇 번의 버전 업데이트) 후에 이전 설정을 삭제할 수 있습니다:

```typescript
/**
 * 이전 ape.* 설정 삭제
 */
async function cleanupOldSettings(): Promise<void> {
  try {
    // 이전 설정 섹션 삭제
    await cleanupSettingsSection('core');
    await cleanupSettingsSection('llm');
    // 기타 섹션 정리
    
    console.log('이전 설정 정리 완료');
  } catch (error) {
    console.error('이전 설정 정리 중 오류 발생:', error);
  }
}

/**
 * 특정 설정 섹션 정리
 * @param section 설정 섹션 이름 (예: 'core', 'llm')
 */
async function cleanupSettingsSection(section: string): Promise<void> {
  const config = vscode.workspace.getConfiguration(`ape.${section}`);
  
  // 설정 키 목록 가져오기
  const keys = Object.keys(config).filter(key => 
    config.inspect(key)?.globalValue !== undefined || 
    config.inspect(key)?.workspaceValue !== undefined ||
    config.inspect(key)?.workspaceFolderValue !== undefined
  );
  
  // 이전 설정 삭제
  for (const key of keys) {
    try {
      // 글로벌 설정 제거
      if (config.inspect(key)?.globalValue !== undefined) {
        await config.update(key, undefined, vscode.ConfigurationTarget.Global);
      }
      
      // 워크스페이스 설정 제거
      if (config.inspect(key)?.workspaceValue !== undefined) {
        await config.update(key, undefined, vscode.ConfigurationTarget.Workspace);
      }
      
      // 워크스페이스 폴더 설정 제거
      if (config.inspect(key)?.workspaceFolderValue !== undefined) {
        await config.update(key, undefined, vscode.ConfigurationTarget.WorkspaceFolder);
      }
      
      console.log(`이전 설정 삭제: ape.${section}.${key}`);
    } catch (error) {
      console.error(`설정 삭제 오류 (${key}):`, error);
    }
  }
}
```

## 4. UI에서 설정 표시 업데이트

### 4.1 명령어 패널의 설정 명령어 업데이트

```typescript
// 변경 전
function openSettingsCommand(setting: string) {
  return vscode.commands.executeCommand(
    'workbench.action.openSettings', 
    `ape.${setting}`
  );
}

// 변경 후
function openSettingsCommand(setting: string) {
  return vscode.commands.executeCommand(
    'workbench.action.openSettings', 
    `ape.${setting}`
  );
}
```

### 4.2 설정 UI 참조 업데이트

```typescript
// 변경 전
const settingsLink = `<a href="command:workbench.action.openSettings?%22ape.core%22">설정 열기</a>`;

// 변경 후
const settingsLink = `<a href="command:workbench.action.openSettings?%22ape.core%22">설정 열기</a>`;
```

### 4.3 도움말 및 안내 메시지 업데이트

```typescript
// 변경 전
const helpMessage = `
설정을 변경하려면 다음 단계를 따르세요:
1. VS Code 설정 열기 (File > Preferences > Settings)
2. "APE"을 검색
3. 원하는 설정 변경
`;

// 변경 후
const helpMessage = `
설정을 변경하려면 다음 단계를 따르세요:
1. VS Code 설정 열기 (File > Preferences > Settings)
2. "Ape"를 검색
3. 원하는 설정 변경
`;
```

## 5. 마이그레이션 테스트 전략

### 5.1 마이그레이션 기능 단위 테스트

```typescript
// 설정 마이그레이션 테스트
describe('Settings Migration', () => {
  test('should migrate settings from ape to ape namespace', async () => {
    // 테스트 설정
    await vscode.workspace.getConfiguration('ape.core')
      .update('logLevel', 'debug', vscode.ConfigurationTarget.Global);
    
    // 마이그레이션 실행
    await migrateSettings(mockContext);
    
    // 결과 확인
    const newValue = vscode.workspace.getConfiguration('ape.core')
      .get('logLevel');
    expect(newValue).toBe('debug');
  });
});
```

### 5.2 수동 테스트 시나리오

1. **설정 마이그레이션 검증**
   - 다양한 설정 값을 `ape.*` 네임스페이스에 설정
   - 확장 다시 로드 또는 VS Code 다시 시작
   - `ape.*` 네임스페이스에 설정이 올바르게 복사되었는지 확인

2. **설정 값 사용 검증**
   - 설정이 실제 기능에 올바르게 적용되는지 테스트
   - 로그 레벨, SSL 우회, 기타 동작이 설정에 따라 변경되는지 확인

3. **호환성 레이어 검증** (구현한 경우)
   - 이전 설정을 유지한 상태에서 새 설정 네임스페이스만 사용하도록 코드 변경
   - 기존 동작이 유지되는지 확인

## 6. 사용자 커뮤니케이션

### 6.1 변경 알림

```typescript
// 설정 마이그레이션 후 사용자에게 알림
vscode.window.showInformationMessage(
  'Ape에서 Ape로 이름이 변경되었습니다. 기존 설정이 새 네임스페이스로 마이그레이션되었습니다.',
  '설정 보기'
).then(selection => {
  if (selection === '설정 보기') {
    vscode.commands.executeCommand('workbench.action.openSettings', 'ape');
  }
});
```

### 6.2 README 및 문서 업데이트

README.md 및 관련 문서에 다음 내용 추가:

```markdown
## 주요 변경 사항 (v0.1.0)

**Ape에서 Ape로 이름 변경**

v0.1.0부터 확장의 이름이 "APE"에서 "Ape"로 변경되었습니다. 이에 따라 다음 변경 사항이 적용되었습니다:

1. **설정 네임스페이스 변경**: 모든 설정이 `ape.*`에서 `ape.*`로 변경되었습니다.
2. **명령어 ID 변경**: 모든 명령어 ID가 `ape.*`에서 `ape.*`로 변경되었습니다.

**기존 사용자를 위한 안내**

확장은 자동으로 기존 설정을 새 네임스페이스로 마이그레이션합니다. 하지만 다음과 같은 경우 수동 조정이 필요할 수 있습니다:

- 사용자 지정 키 바인딩이 있는 경우
- 스크립트나 다른 확장에서 이 확장의 명령어를 직접 호출하는 경우
- 사용자 지정 작업 또는 태스크에서 이 확장의 설정을 참조하는 경우
```

## 7. 설정 키 참조 문서

### 7.1 설정 키 전체 목록 및 변경 대응표

| 이전 설정 키 | 새 설정 키 | 설명 |
|-------------|-----------|------|
| `ape.core.sslBypass` | `ape.core.sslBypass` | SSL 인증서 검증 우회 여부 |
| `ape.core.logLevel` | `ape.core.logLevel` | 로그 레벨 |
| `ape.core.allow.all` | `ape.core.allow.all` | 모든 권한 허용 여부 |
| `ape.llm.defaultModel` | `ape.llm.defaultModel` | 기본 LLM 모델 |
| `ape.llm.supportsStreaming` | `ape.llm.supportsStreaming` | 스트리밍 응답 지원 여부 |
| `ape.llm.openaiApiKey` | `ape.llm.openaiApiKey` | OpenAI API 키 |
| `ape.llm.anthropicApiKey` | `ape.llm.anthropicApiKey` | Anthropic API 키 |
| `ape.llm.azureApiKey` | `ape.llm.azureApiKey` | Azure OpenAI API 키 |
| `ape.llm.openrouterApiKey` | `ape.llm.openrouterApiKey` | OpenRouter API 키 |
| `ape.llm.models` | `ape.llm.models` | LLM 모델 설정 |