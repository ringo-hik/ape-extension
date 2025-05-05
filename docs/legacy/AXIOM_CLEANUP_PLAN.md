# APE 프로젝트 정리 계획

## 배포용 new_ape 구성을 위한 정리 계획

본 문서는 APE 확장 프로그램의 배포용 버전을 위해 필요한 파일과 불필요한 파일을 분류하고, 정리 작업을 위한 단계별 계획을 제시합니다.

### 1. 파일 분류

#### 배포에 필수적인 파일 목록

1. **핵심 소스 코드 파일**
   - `/src/**/*.ts`: 모든 TypeScript 소스 코드 파일
   - `/dist/**/*`: 컴파일된 JavaScript 파일 (빌드 후 생성)

2. **리소스 파일**
   - `/resources/ape_logo.png`: 로고 이미지
   - `/resources/codicons/`: VS Code 아이콘 세트
   - `/resources/css/`: 스타일시트 파일
     - `ape-ui.css`
     - `chat.css`
     - `code-blocks.css`
     - `command-autocomplete.css`
     - `command-buttons.css`
     - `theme-vars.css`
   - `/resources/html/`: HTML 템플릿
     - `chat.html`
     - `command-buttons.html`
   - `/resources/js/`: 클라이언트 스크립트
     - `ape-ui.js`
     - `code-blocks.js`
     - `command-autocomplete.js`
     - `command-buttons.js`
     - `model-selector.js`
     - `theme-manager.js`
   - `/resources/icon/`: 아이콘 이미지

3. **설정 및 구성 파일**
   - `package.json`: 확장 정의 및 의존성
   - `tsconfig.json`: TypeScript 컴파일 설정
   - `esbuild.config.js`: 빌드 설정
   - `/config/schemas/`: JSON 스키마 파일
     - `settings.schema.json`
     - `pocket.schema.json` (필요시)

4. **빌드 스크립트**
   - `build-install.sh`: Linux/WSL용 빌드 스크립트 
   - `build-install.bat`: Windows용 빌드 스크립트
   - `/build_scripts/`: 추가 빌드 스크립트
     - `build-install.sh`
     - `build-install.bat`
     - `map-wsl.ps1`
     - `windows-build.bat`
     - `wsl-build.bat`

5. **필수 문서 파일**
   - `README.md`: 사용자 가이드
   - `HISTORY.md`: 버전 변경 내역
   - `CLAUDE.md`: 개발 철학 및 핵심 가이드라인

#### 개발용 파일 (배포에는 불필요)

1. **개발 도구 설정**
   - 설정 파일 (settings.json)
   - VS Code 작업 공간 설정

2. **테스트 코드**
   - `/tests/`: 테스트 디렉토리
   - `*-test.js` 패턴의 모든 파일
   - `/src/test-git-plugin.js`

3. **개발 참조 문서**
   - `REFACTORING_PLAN.md`
   - `REFACTORING_SUMMARY.md`
   - `STREAMING_IMPLEMENTATION.md`
   - `UI_CONNECTION_CHECKLIST.md`
   - `WORK_PLAN.md`
   - 기타 개발 관련 .md 파일

#### 완전 삭제 가능한 임시 파일 및 중간 산출물

1. **빌드 결과물 (재생성 가능)**
   - `/node_modules/`: npm 의존성
   - `/*.vsix`: 패키징된 확장 파일

2. **임시 파일**
   - `/logs/`: 로그 파일
   - `temp_setting.txt`
   - `git-test-file-*.txt`: 테스트용 임시 파일
   - `/backup/`: 백업 파일

### 2. 정리 작업 단계별 계획

#### 2.1 사전 준비 단계

1. **현재 프로젝트 백업**
   - 현재 작업 디렉토리 전체를 `old_ape` 디렉토리로 백업
   - Git 저장소 복제하여 별도 보관 (작업 실패 시 복원용)

2. **새 프로젝트 디렉토리 생성**
   - `new_ape` 디렉토리 생성

#### 2.2 핵심 파일 마이그레이션

1. **디렉토리 구조 생성**
   ```
   /new_ape
     ├── src/
     ├── resources/
     ├── config/
     ├── build_scripts/
     ├── dist/ (빌드 후 생성)
   ```

2. **핵심 소스 코드 복사**
   - `/src` 디렉토리 전체 복사

3. **리소스 파일 복사**
   - `/resources` 디렉토리 전체 복사

4. **설정 파일 복사**
   - `package.json`, `tsconfig.json`, `esbuild.config.js` 복사
   - `/config` 디렉토리 복사

5. **빌드 스크립트 복사**
   - `build-install.sh`, `build-install.bat` 복사
   - `/build_scripts` 디렉토리 복사

6. **필수 문서 파일 복사**
   - `README.md`, `HISTORY.md`, `CLAUDE.md` 복사

#### 2.3 프로젝트 초기화 및 검증

1. **의존성 설치**
   - `new_ape` 디렉토리에서 `npm install` 실행

2. **빌드 테스트**
   - `npm run build` 또는 `build-install.sh` 실행하여 빌드 검증

3. **설정 테스트**
   - 기본 설정 파일로 확장 프로그램 실행 테스트

#### 2.4 기능 점검 및 최종 검증

1. **핵심 기능 테스트**
   - 웹뷰 UI 표시 확인
   - 명령어 처리 기능 확인
   - LLM 서비스 연결 확인
   - 플러그인 시스템 동작 확인

2. **빌드 및 패키징 테스트**
   - VSIX 패키지 생성 확인
   - 새로 생성된 VSIX로 설치 테스트

### 3. 이전 작업 후 정리 계획

1. **Git 저장소 정리**
   - 새로운 Git 저장소 초기화 또는 기존 저장소 정리
   - `.gitignore` 파일 추가 또는 업데이트

2. **문서화**
   - 이전 작업 결과 문서화
   - 변경 사항 HISTORY.md에 기록

3. **선택적 문서 정리 및 보존**
   - 개발 참조용 문서 중 보존할 가치가 있는 파일은 `/docs` 디렉토리로 정리
   - 불필요한 문서 제거

## 파일 이전 체크리스트

다음 체크리스트를 사용하여 필수 파일이 모두 이전되었는지 확인:

- [ ] 소스 코드 파일 (/src)
- [ ] 리소스 파일 (/resources)
- [ ] 설정 파일 (package.json, tsconfig.json, esbuild.config.js)
- [ ] 설정 스키마 (/config)
- [ ] 빌드 스크립트
- [ ] 필수 문서 파일 (README.md, HISTORY.md, CLAUDE.md)
- [ ] 의존성 설치 완료
- [ ] 빌드 성공
- [ ] 기본 기능 동작 확인
- [ ] VSIX 패키지 생성 확인

## 결론

이 계획에 따라 불필요한 파일과 중간 산출물을 제거하고, 배포에 필요한 핵심 파일만 포함하는 정리된 프로젝트 구조를 구성할 수 있습니다. 이를 통해 프로젝트의 가독성과 유지보수성이 향상되며, 배포 패키지의 크기도 최적화될 것입니다.

작업 진행 시 단계별로 기능 검증을 수행하여, 정리 작업으로 인한 기능 손실이 없도록 주의해야 합니다.