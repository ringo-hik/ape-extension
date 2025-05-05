# Ape에서 Ape로 명령어 ID 변경 목록

이 문서는 VS Code 확장의 명령어 ID를 `ape.*`에서 `ape.*`로 변경하기 위한 세부 목록입니다.

## package.json의 명령어 ID 변경

```json
// 변경 전
{
  "contributes": {
    "commands": [
      {
        "command": "ape.openSidebar",
        "title": "사이드바 열기",
        "category": "APE"
      },
      {
        "command": "ape.openChat",
        "title": "채팅 열기",
        "category": "APE"
      },
      {
        "command": "ape.clearChat",
        "title": "채팅 지우기",
        "category": "APE"
      },
      {
        "command": "ape.debug",
        "title": "디버그 정보 표시",
        "category": "APE"
      }
    ]
  }
}

// 변경 후
{
  "contributes": {
    "commands": [
      {
        "command": "ape.openSidebar",
        "title": "사이드바 열기",
        "category": "Ape"
      },
      {
        "command": "ape.openChat",
        "title": "채팅 열기",
        "category": "Ape"
      },
      {
        "command": "ape.clearChat",
        "title": "채팅 지우기",
        "category": "Ape"
      },
      {
        "command": "ape.debug",
        "title": "디버그 정보 표시",
        "category": "Ape"
      }
    ]
  }
}
```

## src/extension.ts의 명령어 등록 코드 변경

```typescript
// 변경 전
context.subscriptions.push(
  vscode.commands.registerCommand('ape.openSidebar', () => {
    // ...
  })
);

context.subscriptions.push(
  vscode.commands.registerCommand('ape.openChat', () => {
    // ...
  })
);

context.subscriptions.push(
  vscode.commands.registerCommand('ape.clearChat', () => {
    // ...
  })
);

context.subscriptions.push(
  vscode.commands.registerCommand('ape.debug', () => {
    // ...
  })
);

// 변경 후
context.subscriptions.push(
  vscode.commands.registerCommand('ape.openSidebar', () => {
    // ...
  })
);

context.subscriptions.push(
  vscode.commands.registerCommand('ape.openChat', () => {
    // ...
  })
);

context.subscriptions.push(
  vscode.commands.registerCommand('ape.clearChat', () => {
    // ...
  })
);

context.subscriptions.push(
  vscode.commands.registerCommand('ape.debug', () => {
    // ...
  })
);
```

## 내부 명령어 호출 코드 변경

```typescript
// 변경 전
vscode.commands.executeCommand('ape.openSidebar');
vscode.commands.executeCommand('ape.openChat');
vscode.commands.executeCommand('ape.clearChat');
vscode.commands.executeCommand('ape.debug');

// 변경 후
vscode.commands.executeCommand('ape.openSidebar');
vscode.commands.executeCommand('ape.openChat');
vscode.commands.executeCommand('ape.clearChat');
vscode.commands.executeCommand('ape.debug');
```

## 웹뷰에서 명령어 실행 코드 변경

```javascript
// 변경 전
vscode.postMessage({
  command: 'executeCommand',
  commandId: 'ape.openChat'
});

// 변경 후
vscode.postMessage({
  command: 'executeCommand',
  commandId: 'ape.openChat'
});
```

## 명령어 ID 문자열 리터럴 변경

```typescript
// 변경 전
const COMMAND_IDS = {
  OPEN_SIDEBAR: 'ape.openSidebar',
  OPEN_CHAT: 'ape.openChat',
  CLEAR_CHAT: 'ape.clearChat',
  DEBUG: 'ape.debug'
};

// 변경 후
const COMMAND_IDS = {
  OPEN_SIDEBAR: 'ape.openSidebar',
  OPEN_CHAT: 'ape.openChat',
  CLEAR_CHAT: 'ape.clearChat',
  DEBUG: 'ape.debug'
};
```

## 명령어 자동완성 및 UI 참조 변경

```javascript
// 변경 전
if (commandId.startsWith('ape.')) {
  // 처리 로직
}

// 변경 후
if (commandId.startsWith('ape.')) {
  // 처리 로직
}
```

## 명령어 도움말 텍스트 변경

```typescript
// 변경 전
const helpText = `
# APE 명령어 도움말

## 기본 명령어
- ape.openSidebar: APE 사이드바 열기
- ape.openChat: APE 채팅 열기
- ape.clearChat: 채팅 내용 지우기
- ape.debug: 디버그 정보 표시

## @ 명령어
- @ape:help: 도움말 표시
`;

// 변경 후
const helpText = `
# Ape 명령어 도움말

## 기본 명령어
- ape.openSidebar: Ape 사이드바 열기
- ape.openChat: Ape 채팅 열기
- ape.clearChat: 채팅 내용 지우기
- ape.debug: 디버그 정보 표시

## @ 명령어
- @ape:help: 도움말 표시
`;
```

## 플러그인 명령어 ID 접두사 변경

```typescript
// 변경 전
const prefix = '@ape';
const commandId = `${prefix}:${command}`;

// 변경 후
const prefix = '@ape';
const commandId = `${prefix}:${command}`;
```

```typescript
// 변경 전
if (text.startsWith('@ape:')) {
  // 명령어 처리
}

// 변경 후
if (text.startsWith('@ape:')) {
  // 명령어 처리
}
```

## 설정 & 색상 테마 관련 명령어 변경

```typescript
// 변경 전
vscode.commands.executeCommand('workbench.action.openSettings', 'ape');

// 변경 후
vscode.commands.executeCommand('workbench.action.openSettings', 'ape');
```

## 키 바인딩 설정 변경

```json
// 변경 전
{
  "key": "ctrl+shift+a",
  "command": "ape.openSidebar"
}

// 변경 후
{
  "key": "ctrl+shift+a",
  "command": "ape.openSidebar"
}
```

## 외부 플러그인 확장 명령어 ID 변경

```typescript
// 변경 전
const EXTERNAL_COMMAND_PREFIX = '@ape';

// 변경 후
const EXTERNAL_COMMAND_PREFIX = '@ape';
```

## 마이그레이션 고려사항

1. **이전 명령어 지원**: 초기에는 이전 명령어 ID도 지원하여 기존 사용자의 키 바인딩이나 스크립트가 계속 작동하도록 할 수 있습니다.

   ```typescript
   // 이전 명령어 ID를 새 명령어 ID로 리디렉션
   context.subscriptions.push(
     vscode.commands.registerCommand('ape.openSidebar', () => {
       vscode.commands.executeCommand('ape.openSidebar');
     })
   );
   ```

2. **사용자 알림**: 처음 업데이트 후 실행 시 사용자에게 명령어 ID 변경 사항을 알리고 필요한 조치를 안내합니다.

3. **문서 업데이트**: README 및 관련 문서에서 새 명령어 ID 형식을 명확히 안내합니다.