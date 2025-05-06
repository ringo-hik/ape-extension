# APE 익스텐션 디버깅 가이드

이 문서는 APE 익스텐션의 개발 및 디버깅 방법을 안내합니다. 소유자(당신)를 위해 작성되었으며, VS Code 확장 프로그램 개발 환경에서 효율적으로 디버깅할 수 있는 방법을 제공합니다.

## VS Code 디버깅 설정

### launch.json 구성

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": [
        "${workspaceFolder}/dist/**/*.js"
      ],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

### 디버깅 브레이크포인트 설정

디버깅에 유용한 주요 파일과 브레이크포인트 설정 위치:

1. **extension.ts**: 확장 프로그램 활성화 지점
2. **ApeCoreService.ts**: 핵심 서비스 초기화 지점
3. **LlmService.ts**: API 호출 및 응답 처리 지점
4. **ApeChatViewProvider.ts**: 웹뷰 생성 및 메시지 교환 지점

## 콘솔 로깅 활성화

개발 모드에서 상세 로깅을 활성화하려면:

```typescript
// src/core/utils/LoggerService.ts
this.logLevel = LogLevel.DEBUG;
```

로그 출력 확인 방법:
- VS Code 출력 패널에서 "APE Extension" 채널 선택
- 개발자 도구 콘솔 (웹뷰의 경우)

## 웹뷰 디버깅

1. **개발자 도구 열기**:
   - 웹뷰에서 우클릭 후 "개발자 도구 열기" 선택
   - 또는 명령 팔레트에서 "Developer: Open Webview Developer Tools" 실행

2. **주요 디버깅 포인트**:
   - 웹뷰-확장 간 통신: `window.vsCodeApi.postMessage()` 호출
   - 메시지 수신: `window.addEventListener('message', ...)` 핸들러
   - DOM 업데이트: 채팅 메시지 렌더링 함수

## API 호출 디버깅

1. **네트워크 요청 모니터링**:
   ```typescript
   // 디버그용 로그 추가
   console.log('API Request:', requestOptions);
   try {
     const response = await fetch(url, requestOptions);
     console.log('API Response:', response.status);
     // ...
   } catch (error) {
     console.error('API Error:', error);
     // ...
   }
   ```

2. **모의 응답 사용**:
   ```typescript
   // src/core/llm/LlmService.ts 수정
   // API 호출을 모의 응답으로 대체
   private async callApi(options): Promise<any> {
     if (process.env.USE_MOCK_RESPONSE === 'true') {
       return this.getMockResponse();
     }
     // 실제 API 호출 코드...
   }
   
   private getMockResponse() {
     return { /* 모의 응답 데이터 */ };
   }
   ```

## 내부망/외부망 전환 디버깅

1. **환경 감지 로직 테스트**:
   ```typescript
   // 환경 전환 강제 설정
   process.env.FORCE_ENVIRONMENT = 'internal'; // 또는 'external'
   ```

2. **SSL 우회 디버깅**:
   ```typescript
   // SSL 검증 로그 추가
   console.log('SSL Bypass Status:', process.env.NODE_TLS_REJECT_UNAUTHORIZED);
   ```

## 플러그인 디버깅

1. **플러그인 등록 확인**:
   ```typescript
   // 플러그인 등록 시 로그 추가
   console.log('Registered Plugins:', this.plugins.map(p => p.name));
   ```

2. **플러그인 호출 추적**:
   ```typescript
   // 플러그인 메서드 호출 전후 로그
   console.log(`Calling plugin: ${plugin.name}.${methodName}`);
   const result = await plugin[methodName](...args);
   console.log(`Plugin result:`, result);
   ```

## 성능 프로파일링

1. **코드 실행 시간 측정**:
   ```typescript
   const start = performance.now();
   // 측정할 코드...
   const end = performance.now();
   console.log(`Execution time: ${end - start}ms`);
   ```

2. **VS Code 성능 도구 사용**:
   - 명령 팔레트에서 "Developer: Start Performance Profile" 실행
   - 테스트 수행 후 "Developer: Stop Performance Profile" 실행

## 자주 발생하는 오류 해결

1. **웹뷰 로드 실패**:
   - 리소스 경로 확인 (URI 변환 오류)
   - CSP 설정 확인
   - 웹뷰 컨텐츠 보안 정책 로그 확인

2. **API 키 오류**:
   - 환경 변수 로드 확인
   - API 키 형식 및 유효성 확인
   - 네트워크 요청 헤더 검사

3. **메모리 누수**:
   - 이벤트 리스너 등록/해제 확인
   - dispose 메서드 구현 검증
   - 순환 참조 검사

---

**마지막 업데이트**: 2024-05-06 12:05