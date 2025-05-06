# UI 수정 및 통합 안내

## 변경 내용

1. **모델 선택기 파일 통합**
   - 여러 버전으로 분산된 모델 선택기 코드를 정리하여 단일 파일로 통합했습니다.
   - 기존 파일은 `resources/js/legacy/` 폴더로 이동했습니다.

2. **CSS 파일 정리**
   - 모델 선택기 관련 CSS를 단일 파일 (`resources/css/model-selector.css`)로 통합했습니다.
   - 사용하지 않는 CSS 파일은 `resources/css/legacy/` 폴더로 이동했습니다.

3. **통신 로그 개선**
   - UI와 확장 간 통신 시 명확한 로그 메시지 형식 (`[UI->EXT]`, `[EXT->UI]`) 사용
   - 로그 가독성 향상을 위한 일관된 로깅 패턴 적용

4. **빈 모델 목록 대응**
   - 모델 목록이 비어 있는 경우 로컬 모델 자동 추가 로직 구현
   - 에러 조건에서도 모델 선택기 작동 보장

## 파일 구조 변경

```
resources/
├── css/
│   ├── legacy/             # 사용하지 않는 레거시 CSS 파일 
│   │   └── model-dropdown.css
│   └── model-selector.css  # 모든 모델 선택기 스타일 (통합)
├── js/
│   ├── legacy/             # 사용하지 않는 레거시 JS 파일
│   │   ├── model-selector.js
│   │   ├── new-model-selector.js
│   │   ├── new-model-selector-debug.js
│   │   ├── model-selector-debug-helper.js
│   │   └── model-selector-fix.js
│   └── model-selector.js   # 모든 모델 선택기 코드 (통합)
```

## UI 디버그 가이드

UI 디버그 수행 시 다음 메시지 패턴을 확인하세요:

1. 모델 선택기 초기화: `[ModelSelector] 초기화 시작` ~ `[ModelSelector] 초기화 완료`
2. 모델 목록 요청: `[ModelSelector] 모델 목록 요청 전송`
3. 확장에서 모델 목록 처리: `[UI<-EXT] 모델 목록 전송 시작` ~ `[UI<-EXT] 모델 목록 전송 완료`
4. 모델 정보 업데이트: `[ModelSelector] 모델 목록 업데이트` ~ `[ModelSelector] 모델 목록 렌더링 완료`

## 주의사항

- 이 변경으로 UI 초기화와 표시 과정이 최적화되었습니다.
- VS Code 재시작 후 확장을 다시 로드하여 변경사항을 적용해주세요.
- 디버그 모드에서 실행하여 로그 메시지를 확인하면 문제 진단에 도움이 됩니다.