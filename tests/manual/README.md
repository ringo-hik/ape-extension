# APE 수동 테스트 디렉토리

이 디렉토리는 APE 프로젝트의 수동 테스트 스크립트를 포함하고 있습니다.

## 테스트 파일

- `git-direct-test.js` - Git 직접 연동 테스트
- `mock-test.js` - 모의 객체 테스트
- `test-git-plugin.js` - Git 플러그인 테스트
- `test-parser.js` - 명령어 파서 테스트

## 사용 방법

이 테스트 스크립트들은 주로 개발 과정에서 특정 기능을 빠르게 테스트하기 위한 목적으로 사용됩니다. 다음과 같이 실행할 수 있습니다:

```bash
node tests/manual/test-parser.js
```

## 참고 사항

- 이 스크립트들은 자동화된 테스트가 아니라 수동 테스트를 위한 것입니다.
- 정식 자동화 테스트는 tests/suite 디렉토리에 있습니다.
- 새로운 테스트 스크립트를 추가할 때는 이 디렉토리에 추가해 주세요.