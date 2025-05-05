# 내부망 배포 및 테스트 체크리스트

아래 체크리스트를 활용하여 내부망 환경에서 확장 배포 및 테스트를 진행하세요.

## 1. 코드 준비

- [ ] Git 저장소에서 최신 코드 확인 (`git pull` 또는 최신 버전 다운로드)
- [ ] 모든 종속성 설치 (`npm install`)
- [ ] 확장 패키지 빌드 (`npm run build`)
- [ ] VSIX 파일 생성 (`npm run package` 또는 `vsce package`)

## 2. 내부망 설정 준비

- [ ] `settings.json` 파일에서 내부망 URL 설정 확인 및 업데이트
  - [ ] LLM API URL 업데이트
  - [ ] Jira API URL 업데이트
  - [ ] SWDP API URL 업데이트
  - [ ] Pocket(S3) URL 업데이트
- [ ] API 키 및 인증 정보 업데이트
- [ ] SSL 인증서 검증 설정 확인 (자체 서명 인증서 사용 시)

## 3. 배포

- [ ] 내부망에 VSIX 파일 복사
- [ ] VS Code에서 확장 설치 (`.vsix` 파일에서 설치 메뉴 사용)
- [ ] 필요한 테스트 스크립트 복사 (`tests` 디렉토리)

## 4. 기본 기능 테스트

- [ ] VS Code에서 확장 활성화 확인 (상태 표시줄)
- [ ] LLM 서비스 연결 테스트 (`/test:llm` 명령)
- [ ] 기본 명령어 작동 확인 (`/help` 명령)

## 5. 자연어 처리 기능 테스트

- [ ] 테스트 스크립트 실행 준비 (`node tests/pluginNLPTest.js`)
- [ ] 수동 테스트 스크립트 실행 준비 (`node tests/manualNLPTest.js`)
- [ ] Git 자연어 명령 테스트:
  - [ ] `@git 상태 보여줘`
  - [ ] `@git 변경사항 확인해줘`
  - [ ] `@git 커밋 메시지 만들어줘`
  - [ ] `@git 브랜치 목록 보여줘`
- [ ] Jira 자연어 명령 테스트:
  - [ ] `@jira 이슈 목록 보여줘`
  - [ ] `@jira 새 이슈 만들어줘`
  - [ ] `@jira 이슈 상세 정보 보여줘`
- [ ] SWDP 자연어 명령 테스트:
  - [ ] `@swdp 빌드 상태 확인해줘`
  - [ ] `@swdp 로컬 빌드 실행해줘`
  - [ ] `@swdp 테스트 요청 생성해줘`
- [ ] Pocket 자연어 명령 테스트:
  - [ ] `@pocket 파일 목록 보여줘`
  - [ ] `@pocket 파일 내용 보여줘`
  - [ ] `@pocket 파일 검색해줘`

## 6. 연결 문제 해결

- [ ] 로그 확인 (VS Code 출력 패널)
- [ ] SSL 인증서 오류 확인 및 해결
- [ ] 네트워크 오류 확인 및 해결
- [ ] 권한 문제 확인 및 해결

## 7. 성능 모니터링

- [ ] 응답 시간 확인
- [ ] 메모리 사용량 확인
- [ ] CPU 사용률 확인

## 참고 문서

- [URL_MIGRATION.md](/home/hik90/ape-extension/URL_MIGRATION.md) - URL 변경 가이드
- [INTERNAL_TESTING.md](/home/hik90/ape-extension/INTERNAL_TESTING.md) - 내부망 테스트 가이드
- [src/core/plugin-system/llm/README.md](/home/hik90/ape-extension/src/core/plugin-system/llm/README.md) - 자연어 처리 시스템 문서