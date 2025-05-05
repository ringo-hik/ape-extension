# Ape에서 APE로의 리브랜딩 계획

## 개요

APE 프로젝트가 APE(Agentic Pipeline Engine/Extension)로 리브랜딩됩니다. 이 문서는 코드 리팩토링 계획과 전략을 상세히 설명합니다.

## 변경 계획 요약

1. **코어 구조 변경**: 모든 `APE` 접두사를 `Ape`로 변경
2. **설정 네임스페이스 변경**: `ape.*`에서 `ape.*`로 변경
3. **명령어 ID 업데이트**: 모든 명령어 ID 패턴 업데이트
4. **UI 텍스트 변경**: 사용자 인터페이스의 모든 참조 업데이트
5. **파일 이름 변경**: 모든 관련 파일명 업데이트
6. **문서 업데이트**: 모든 문서에서 브랜드명 변경

## 작업 우선순위

1. **프로젝트 메타데이터**: package.json 업데이트
2. **타입 시스템**: 핵심 인터페이스 및 타입 변경
3. **코어 서비스**: 주요 클래스 및 서비스 리팩토링
4. **플러그인 시스템**: 플러그인 인터페이스 및 구현 업데이트
5. **UI 구성요소**: 웹뷰 및 UI 관련 코드 업데이트
6. **리소스 파일**: HTML, CSS, JS 파일 업데이트
7. **설정 마이그레이션**: 기존 사용자 설정 마이그레이션
8. **문서화**: 모든 문서 업데이트

## 상세 변경 내역

### 1. 파일 이름 변경

| 현재 파일 경로 | 새 파일 경로 |
|---------------|-------------|
| `/src/core/ApeCoreService.ts` | `/src/core/ApeCoreService.ts` |
| `/src/ui/ApeChatViewProvider.ts` | `/src/ui/ApeChatViewProvider.ts` |
| `/resources/ape_logo.png` | `/resources/ape_logo.png` |

### 2. 클래스명 변경

| 현재 클래스명 | 새 클래스명 |
|--------------|------------|
| `ApeCoreService` | `ApeCoreService` |
| `ApeChatViewProvider` | `ApeChatViewProvider` |

### 3. 설정 키 변경

| 현재 설정 | 새 설정 |
|----------|--------|
| `ape.core.sslBypass` | `ape.core.sslBypass` |
| `ape.core.logLevel` | `ape.core.logLevel` |
| `ape.llm.defaultModel` | `ape.llm.defaultModel` |

### 4. 명령어 ID 변경

| 현재 명령어 ID | 새 명령어 ID |
|--------------|------------|
| `ape.openSidebar` | `ape.openSidebar` |
| `ape.openChat` | `ape.openChat` |
| `ape.clearChat` | `ape.clearChat` |
| `ape.debug` | `ape.debug` |

## 테스트 전략

### 테스트 우선순위

1. **핵심 기능 테스트**:
   - 명령어 파싱 기능
   - 플러그인 시스템 통합
   - VS Code 확장 활성화

2. **테스트 자동화**:
   - 단위 테스트 자동화
   - 통합 테스트 스크립트
   - 수동 테스트 체크리스트

3. **검증 체크리스트**:
   - 모든 명령어 기능 검증
   - UI 렌더링 확인
   - 설정 마이그레이션 확인
   - 플러그인 동작 검증
   - 오류 처리 확인

## 사용자 설정 마이그레이션

설정 마이그레이션 코드를 구현하여 확장이 활성화될 때 기존 `ape.*` 설정을 `ape.*` 설정으로 자동 변환합니다.

```typescript
// 설정 마이그레이션 예시 코드
function migrateSettings() {
  const apeConfig = vscode.workspace.getConfiguration('ape');
  const apeConfig = vscode.workspace.getConfiguration('ape');
  
  // 코어 설정 마이그레이션
  if (apeConfig.has('core.sslBypass')) {
    apeConfig.update('core.sslBypass', apeConfig.get('core.sslBypass'), true);
  }
  
  // 다른 설정들 마이그레이션...
}
```

## 위험 요소 및 완화 전략

1. **기존 설정 손실**:
   - 마이그레이션 코드 구현
   - 백업 메커니즘 제공

2. **명령어 ID 충돌**:
   - 모든 명령어 목록 문서화
   - 단계적 변환 및 테스트

3. **플러그인 호환성**:
   - 호환성 레이어 구현
   - 플러그인 시스템 확장성 유지

## 구현 체크리스트

- [ ] package.json 업데이트
- [ ] 코어 서비스 클래스 이름 변경
- [ ] UI 제공자 클래스 이름 변경
- [ ] 설정 네임스페이스 업데이트
- [ ] 명령어 ID 업데이트
- [ ] 로그 및 오류 메시지 업데이트
- [ ] UI 텍스트 업데이트
- [ ] 리소스 파일 경로 업데이트
- [ ] 문서 업데이트
- [ ] 설정 마이그레이션 구현
- [ ] 테스트 케이스 업데이트
- [ ] 최종 검증 수행

## 결론

이 계획은 APE 프로젝트를 APE로 리브랜딩하기 위한 체계적인 접근 방식을 제공합니다. 적절한 계획과 테스트로 기존 기능을 유지하면서 브랜드 변경을 완료할 수 있습니다.