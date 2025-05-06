# 내부망 환경 설정 가이드

이 문서는 APE 익스텐션을 내부망 환경에서 설정하고 사용하기 위한 가이드입니다.

## 주요 내부망 설정 문제 해결

### 1. npm install 문제 해결 (넥서스 저장소 사용)

내부망 환경에서는 외부 npm 저장소 접근이 불가능하므로 내부 넥서스(Nexus) 저장소를 사용해야 합니다.

#### 원인
- 내부망에서는 외부 npm 저장소(registry.npmjs.org)에 접근 불가
- 내부 넥서스 저장소만 접근 가능
- npm 패키지 URL 해석 문제로 invalid_url 에러 발생

#### 해결 방법

1. **.npmrc 파일 생성**:
   프로젝트 루트에 `.npmrc` 파일을 생성하여 내부 넥서스 저장소를 사용하도록 설정합니다.

   ```
   # .npmrc 파일 내용
   registry=http://[내부_넥서스_서버_주소]/repository/npm-group/
   strict-ssl=false
   ```

   예시:
   ```
   registry=http://localhost:8081/repository/npm-group/
   strict-ssl=false
   ```

   또는 IP 주소 사용:
   ```
   registry=http://10.0.0.1:8081/repository/npm-group/
   strict-ssl=false
   ```

2. **npm 명령어에 레지스트리 지정**:
   .npmrc 파일 대신 명령어에 직접 레지스트리 지정도 가능합니다.
   ```bash
   npm install --registry=http://[내부_넥서스_서버_주소]/repository/npm-group/ --no-strict-ssl
   ```

3. **내부망 서비스 포트 매핑**:
   필요한 경우 내부망 서비스를 로컬 포트로 매핑합니다.
   ```bash
   ssh -L 8081:내부_넥서스_서버:8081 내부망접속서버
   ```

### 2. LLM API 연결 문제 해결

내부망 환경에서 `invalid_url` 오류가 발생하는 경우:

#### 원인
- 외부망에서 사용하는 도메인 이름(예: `api-se-dev.narrans.samsungds.net`)이 내부망에서 해석되지 않음
- 내부망 DNS가 외부 도메인을 해석할 수 없어 발생하는 문제

#### 해결 방법

1. **extension.env.js 수정**:
   - 도메인 이름 대신 직접 IP 주소 또는 `localhost` 사용
   - SSL 우회 설정 활성화
   - 내부망 모드 명시적 활성화

   ```javascript
   // extension.env.js 예시
   module.exports = {
     // 내부망 설정 명시적 활성화
     INTERNAL_NETWORK: 'true',
     
     // SSL 우회 활성화
     FORCE_SSL_BYPASS: 'true',
     
     // 내부망 API 엔드포인트 (로컬 주소 사용)
     INTERNAL_API_ENDPOINT: 'http://localhost:8001/v1/chat/completions',
     
     // Llama API 엔드포인트 (로컬 주소 사용)
     LLAMA4_API_ENDPOINT: 'http://localhost:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions'
   };
   ```

### 2. 내부망 도메인 해석 문제

내부망에서 도메인 해석 문제가 발생하는 경우:

#### 해결 방법

1. **hosts 파일 설정**:
   - Windows의 경우: `C:\Windows\System32\drivers\etc\hosts`
   - Linux의 경우: `/etc/hosts`
   - 예: `127.0.0.1 api-se-dev.narrans.samsungds.net`

2. **내부 DNS 서버 사용**:
   - 네트워크 설정에서 내부망 DNS 서버 지정
   - Windows: 네트워크 어댑터 설정 -> IPv4 속성 -> DNS 서버
   - Linux: `/etc/resolv.conf` 수정

### 3. SSL 인증서 검증 우회

내부망에서 자체 서명 인증서를 사용하는 경우:

#### 해결 방법

1. **Node.js SSL 검증 비활성화**:
   - `NODE_TLS_REJECT_UNAUTHORIZED=0` 환경 변수 설정
   - APE 익스텐션은 설정 파일을 통해 자동 처리 (FORCE_SSL_BYPASS)

2. **자체 서명 인증서 신뢰**:
   - 내부 CA 인증서를 시스템에 설치
   - Windows: 인증서 관리자 -> 신뢰할 수 있는 루트 인증 기관
   - Linux: `/etc/ssl/certs` 디렉토리

## 내부망 환경에서의 개발 및 테스트 방법

1. **개발 환경 구성**:
   - 외부망에서 개발 후 `extension.env.js` 파일을 내부망 환경에 맞게 수정
   - 내부망 URL과 인증 설정 조정
   - 필요한 경우 별도 분기 관리 (내부망/외부망)

2. **모델 설정 관리**:
   - 외부망: OpenRouter 등 외부 API 사용
   - 내부망: 내부 LLM 모델 서버 사용 (Narrans, Llama 등)

3. **설정 구성 우선순위**:
   1. 환경 변수 (`extension.env.js`)
   2. VS Code 설정 (`settings.json`)
   3. 프로그램 하드코딩 기본값

4. **에러 처리 및 로깅**:
   - 내부망 연결 실패 시 로컬 시뮬레이션 모드로 대체
   - 개발 로그 확인을 통한 문제 해결

## 주의사항

1. **보안**:
   - API 키와 인증 정보 관리에 주의
   - `extension.env.js` 파일은 버전 관리에서 제외 (.gitignore)

2. **개발/배포 분리**:
   - 개발은 외부망에서, 배포는 내부망에서 수행
   - 배포 전 모든 내부망 관련 설정 확인

3. **DNS 및 네트워크**:
   - 내부망에서는 도메인명 대신 IP 주소 사용을 권장
   - 보안 정책에 따라 필요한 포트 허용 확인