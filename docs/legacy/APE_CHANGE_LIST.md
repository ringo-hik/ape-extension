# "APE"에서 "Ape"로 세부 변경 목록

이 문서는 APE 확장 프로그램을 Ape로 변경하기 위한 세부 파일 목록과 각 파일의 변경 사항을 나열합니다.

## 파일 이름 변경

### 코어 클래스 파일
- `/src/core/ApeCoreService.ts` → `/src/core/ApeCoreService.ts`
- `/src/ui/ApeChatViewProvider.ts` → `/src/ui/ApeChatViewProvider.ts`

### 리소스 파일
- `/resources/ape_logo.png` → `/resources/ape_logo.png`
- `/resources/css/ape-ui.css` → `/resources/css/ape-ui.css`
- `/resources/css/icons/ape-icons.css` → `/resources/css/icons/ape-icons.css`
- `/resources/js/ape-ui.js` → `/resources/js/ape-ui.js`

## 코드 변경 목록

### package.json
```json
{
  "name": "ape",
  "displayName": "Ape 웹뷰",
  // ... 기타 메타데이터 업데이트
  "contributes": {
    "commands": [
      {
        "command": "ape.openSidebar",
        "title": "사이드바 열기",
        "category": "Ape"
      },
      // ... 기타 명령어 업데이트
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "ape-sidebar",
          "title": "Ape",
          "icon": "resources/ape_logo.png"
        }
      ]
    },
    "views": {
      "ape-sidebar": [
        {
          "id": "ape.chatView",
          "name": "Ape 채팅",
          "type": "webview"
        }
      ]
    },
    "configuration": {
      "title": "Ape",
      "properties": {
        "ape.core.sslBypass": {
          // ... 기존 설정을 ape 네임스페이스로 업데이트
        },
        // ... 기타 설정 업데이트
      }
    }
  }
}
```

### src/core/ApeCoreService.ts → src/core/ApeCoreService.ts
```typescript
/**
 * Ape 코어 서비스
 * 
 * 모든 핵심 서비스를 통합하고 관리하는 중앙 서비스
 * 싱글톤 패턴으로 구현되어 전역적인 접근 제공
 */
// ... 임포트 문

/**
 * Ape 코어 서비스 클래스
 * 모든 핵심 서비스 통합 및 관리
 */
export class ApeCoreService extends EventEmitter {
  // 싱글톤 인스턴스
  private static _instance: ApeCoreService;
  
  // ... 기타 클래스 내용

  /**
   * ApeCoreService 생성자
   * 모든 서비스 초기화
   * @param context VS Code 확장 컨텍스트
   */
  private constructor(private context: vscode.ExtensionContext) {
    // ... 생성자 내용
  }
  
  /**
   * 싱글톤 인스턴스 반환
   * @param context VS Code 확장 컨텍스트 (최초 호출 시에만 필요)
   * @returns ApeCoreService 인스턴스
   */
  public static getInstance(context?: vscode.ExtensionContext): ApeCoreService {
    if (!ApeCoreService._instance) {
      if (!context) {
        throw new Error('ApeCoreService 초기화에 context가 필요합니다.');
      }
      ApeCoreService._instance = new ApeCoreService(context);
    }
    return ApeCoreService._instance;
  }
  
  // ... 로깅 메시지 업데이트
  this._logger.info('Ape 코어 서비스 초기화 시작');
  // ... 기타 로깅 메시지 업데이트
}
```

### src/ui/ApeChatViewProvider.ts → src/ui/ApeChatViewProvider.ts
```typescript
/**
 * 채팅 웹뷰 제공자
 * VS Code 웹뷰 UI 관리 및 메시지 처리
 */
// ... 임포트 문

/**
 * 채팅 웹뷰 제공자 클래스
 */
export class ApeChatViewProvider implements vscode.WebviewViewProvider {
  // ... 클래스 내용

  // 설정 참조 업데이트
  vscode.workspace.getConfiguration('ape.core').update(
    'embedDevMode', 
    message.enabled, 
    vscode.ConfigurationTarget.Global
  );
  
  // ... 기타 클래스 내용
}
```

### src/types/ConfigTypes.ts
```typescript
/**
 * 설정 관련 타입 정의
 * 
 * Ape 시스템의 설정 관리를 위한 인터페이스 및 타입 정의
 */
// ... 타입 정의 내용
```

### resources/html/chat.html
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <!-- 메타 태그 -->
  <title>Ape 채팅</title>
  <!-- CSS 링크 -->
  <script>
    // 디버깅 헬퍼
    window.apeDebug = {
      log: function(message) {
        console.log('[Ape Debug]:', message);
      }
    };
    
    // 페이지 로드 시 디버깅 메시지
    window.addEventListener('DOMContentLoaded', function() {
      apeDebug.log('채팅 인터페이스 로드됨');
      // ... 기타 디버깅 메시지
    });
  </script>
</head>
<body>
  <div class="chat-container">
    <div class="chat-header">
      <h1><span class="logo">⚡</span> Ape 채팅</h1>
      <!-- ... 기타 헤더 내용 -->
    </div>
    
    <div class="chat-messages" id="messages">
      <!-- 빈 상태 메시지 -->
      <div class="empty-state" id="emptyState">
        <div class="empty-state-icon">⚡</div>
        <div class="empty-state-title">Ape과 대화를 시작하세요</div>
        <div class="empty-state-text">질문이나 명령어를 입력하여 대화를 시작할 수 있습니다.</div>
      </div>
      
      <!-- ... 기타 HTML 내용 -->
    </div>
    
    <!-- ... 기타 컨테이너 -->
  </div>
  
  <script>
    // ... JS 코드에서 ape 관련 참조 업데이트
  </script>
</body>
</html>
```

### resources/css/chat.css
```css
/* 채팅 인터페이스 기본 스타일 - Ape 버전 */
/* ... CSS 내용 */
```

### src/extension.ts
```typescript
// Ape VS Code 확장 진입점
// ... 코드 내용
```

## 설정 값 참조 변경 목록

### VS Code 설정 참조
다음 패턴의 코드를 모두 찾아 업데이트:
```typescript
// 이전
vscode.workspace.getConfiguration('ape.core')
vscode.workspace.getConfiguration('ape.llm')

// 이후
vscode.workspace.getConfiguration('ape.core')
vscode.workspace.getConfiguration('ape.llm')
```

### 명령어 ID 참조
다음 패턴의 코드를 모두 찾아 업데이트:
```typescript
// 이전
vscode.commands.registerCommand('ape.openSidebar', ...)
context.subscriptions.push(vscode.commands.registerCommand('ape.openChat', ...))

// 이후
vscode.commands.registerCommand('ape.openSidebar', ...)
context.subscriptions.push(vscode.commands.registerCommand('ape.openChat', ...))
```

### HTML/CSS ID 및 클래스 관련 참조
다음 패턴의 코드를 모두 찾아 업데이트:
```html
<!-- 이전 -->
<div class="ape-container">
<div id="apeChat">

<!-- 이후 -->
<div class="ape-container">
<div id="apeChat">
```

```javascript
// 이전
document.querySelector('.ape-container')
document.getElementById('apeChat')

// 이후
document.querySelector('.ape-container')
document.getElementById('apeChat')
```

```css
/* 이전 */
.ape-container { ... }
#apeChat { ... }

/* 이후 */
.ape-container { ... }
#apeChat { ... }
```

## 로그 메시지 변경 목록

다음과 같은 로그 메시지 패턴을 모두 찾아 업데이트:

```typescript
// 이전
this._logger.info('APE 코어 서비스 초기화 시작');
console.log('APE 웹뷰 초기화 완료');

// 이후
this._logger.info('Ape 코어 서비스 초기화 시작');
console.log('Ape 웹뷰 초기화 완료');
```

## 기타 참조 변경

### 오류 메시지
```typescript
// 이전
throw new Error('ApeCoreService 초기화에 context가 필요합니다.');

// 이후
throw new Error('ApeCoreService 초기화에 context가 필요합니다.');
```

### 주석 업데이트
```typescript
// 이전
 * APE 코어 서비스
 * APE 설정 관리

// 이후
 * Ape 코어 서비스
 * Ape 설정 관리
```