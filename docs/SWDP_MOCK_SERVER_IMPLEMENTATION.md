# SWDP Mock 서버 구현 가이드

## 개요

SWDP(Software Development Portal) Mock 서버는 내부망에서만 접근 가능한 실제 SWDP 서비스를 개발 환경에서 시뮬레이션하기 위한 도구입니다. 이 문서는 SWDP Mock 서버 구현에 대한 상세 가이드를 제공합니다.

## 목적

1. 외부망 개발 환경에서 내부망 SWDP 서비스 기능 테스트
2. 실제 API와 동일한 인터페이스로 APE 확장 프로그램 개발 지원
3. 다양한 시나리오 및 에지 케이스 테스트 지원
4. 환경 전환(개발 → 내부망) 메커니즘 검증

## 기술 스택

- **서버**: Node.js + Express.js
- **인증**: JWT 기반 토큰 시스템
- **데이터 저장**: 인메모리 + 파일 시스템(JSON)
- **API 문서화**: Swagger/OpenAPI

## 주요 컴포넌트

### 1. 핵심 서버 구성

```
mock-server/
├── index.js               # 서버 진입점
├── config.js              # 환경 설정
├── middleware/
│   ├── auth.js            # 인증 미들웨어
│   └── logging.js         # 로깅 미들웨어
├── routes/
│   ├── projects.js        # 프로젝트 API 라우트
│   ├── issues.js          # 이슈 API 라우트
│   ├── dashboard.js       # 대시보드 API 라우트
│   ├── docs.js            # 문서 API 라우트
│   └── pipelines.js       # 파이프라인 API 라우트
├── controllers/           # API 엔드포인트 처리 로직
├── models/                # 데이터 모델 및 스키마
├── data/                  # 샘플 데이터 JSON 파일
└── utils/                 # 유틸리티 함수
```

### 2. API 엔드포인트

| 엔드포인트 | 메소드 | 설명 | 매개변수 |
|----------|-------|------|---------|
| `/api/auth/login` | POST | 사용자 인증 및 토큰 발급 | username, password |
| `/api/projects` | GET | 프로젝트 목록 조회 | filter, sort, limit |
| `/api/projects/:id` | GET | 특정 프로젝트 상세 정보 | id |
| `/api/issues` | GET | 이슈 목록 조회 | project, status, assignee |
| `/api/issues/:id` | GET | 특정 이슈 상세 정보 | id |
| `/api/dashboard` | GET | 사용자 대시보드 정보 | user_id |
| `/api/docs/search` | GET | 문서 검색 | query, project |
| `/api/docs/:id` | GET | 특정 문서 조회 | id |
| `/api/pipelines` | GET | 배포 파이프라인 목록 | project |
| `/api/pipelines/:id/status` | GET | 파이프라인 상태 조회 | id |

### 3. 인증 시스템

```javascript
// middleware/auth.js 구현 예시
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (req, res, next) => {
  // 토큰 추출 (Authorization: Bearer {token})
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // 토큰 검증
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 4. Git 사용자 정보 추출

```javascript
// utils/gitConfig.js 구현 예시
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function extractGitUserInfo() {
  try {
    // git config에서 사용자 정보 추출
    const name = execSync('git config --get user.name').toString().trim();
    const email = execSync('git config --get user.email').toString().trim();
    
    return { name, email };
  } catch (error) {
    console.error('Failed to extract git user info:', error);
    return { name: 'Test User', email: 'test@example.com' };
  }
}

module.exports = { extractGitUserInfo };
```

## 테스트 데이터

### 1. 프로젝트 데이터

```json
[
  {
    "id": "PRJ-001",
    "name": "APE Extension",
    "description": "Agentic Pipeline Engine VS Code Extension",
    "status": "active",
    "created_at": "2024-05-01T00:00:00Z",
    "last_updated": "2024-05-06T00:00:00Z",
    "team_members": [
      {"id": "USR-001", "name": "Worker 1", "role": "UI Developer"},
      {"id": "USR-002", "name": "Worker 2", "role": "Backend Developer"}
    ],
    "repository": {
      "url": "https://github.com/org/ape-extension",
      "branch": "master"
    }
  },
  {
    "id": "PRJ-002",
    "name": "APE Core",
    "description": "Agentic Pipeline Engine Core Service",
    "status": "active",
    "created_at": "2024-04-15T00:00:00Z",
    "last_updated": "2024-05-05T00:00:00Z",
    "team_members": [
      {"id": "USR-003", "name": "Core Team Lead", "role": "Project Lead"},
      {"id": "USR-004", "name": "API Developer", "role": "Backend Developer"}
    ],
    "repository": {
      "url": "https://github.com/org/ape-core",
      "branch": "main"
    }
  }
]
```

### 2. 이슈 데이터

```json
[
  {
    "id": "ISS-001",
    "project_id": "PRJ-001",
    "title": "Implement Hybrid UI",
    "description": "Implement a hybrid UI combining natural language and command-based interfaces",
    "status": "in_progress",
    "priority": "high",
    "assignee": "USR-001",
    "created_at": "2024-05-03T00:00:00Z",
    "due_date": "2024-05-20T00:00:00Z",
    "labels": ["UI", "enhancement"],
    "comments": [
      {
        "id": "CMT-001",
        "user_id": "USR-001",
        "content": "Started implementing the context panel",
        "created_at": "2024-05-04T00:00:00Z"
      }
    ]
  },
  {
    "id": "ISS-002",
    "project_id": "PRJ-001",
    "title": "Implement SWDP Integration",
    "description": "Integrate with the Software Development Portal API",
    "status": "todo",
    "priority": "high",
    "assignee": "USR-002",
    "created_at": "2024-05-03T00:00:00Z",
    "due_date": "2024-05-25T00:00:00Z",
    "labels": ["integration", "backend"],
    "comments": []
  }
]
```

## 환경 전환 메커니즘

Mock 서버는 실제 내부망 API와 동일한 인터페이스를 제공해야 합니다. 환경 전환은 설정 파일 또는 환경 변수를 통해 관리합니다.

```javascript
// config.js 구현 예시
require('dotenv').config();

const config = {
  environment: process.env.APE_ENVIRONMENT || 'development',
  port: process.env.MOCK_SERVER_PORT || 8001,
  jwtSecret: process.env.JWT_SECRET || 'mock-secret-key',
  
  apis: {
    development: {
      swdp: 'http://localhost:8001/api',
      git: 'http://localhost:8001/api/git',
      jira: 'http://localhost:8001/api/jira'
    },
    production: {
      swdp: 'https://internal-swdp.company.net/api',
      git: 'https://internal-git.company.net/api',
      jira: 'https://internal-jira.company.net/api'
    }
  },
  
  // 현재 환경에 맞는 API URL 반환
  getApiUrl: function(service) {
    return this.apis[this.environment][service];
  }
};

module.exports = config;
```

## 서버 시작 및 테스트

### 서버 시작

```javascript
// index.js 구현 예시
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');

// 라우터 임포트
const projectsRouter = require('./routes/projects');
const issuesRouter = require('./routes/issues');
// ... 기타 라우터 임포트

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(require('./middleware/logging'));

// 라우트 설정
app.use('/api/projects', projectsRouter);
app.use('/api/issues', issuesRouter);
// ... 기타 라우트 설정

// 서버 시작
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`SWDP Mock Server running on port ${PORT}`);
  console.log(`Environment: ${config.environment}`);
});
```

### 스크립트 설정

`package.json`에 다음 스크립트를 추가합니다:

```json
{
  "scripts": {
    "mock-server": "node mock-server/index.js",
    "test-mock-api": "jest mock-server/tests"
  }
}
```

## 통합 테스트

SWDP Mock 서버와 APE 확장 프로그램 간 통합 테스트를 위한 시나리오입니다:

1. **인증 테스트**: Git 사용자 정보 기반 인증 및 토큰 발급
2. **프로젝트 정보 조회**: 프로젝트 목록 및 상세 정보 조회
3. **이슈 관리**: 이슈 목록 조회, 상세 정보, 상태 변경
4. **문서 검색 및 조회**: 프로젝트 문서 검색 및 내용 조회
5. **파이프라인 상태 모니터링**: 배포 파이프라인 상태 조회

각 시나리오별 테스트 케이스를 개발하고, Jest를 사용하여 자동화 테스트를 구현합니다.

## 확장 및 최적화

1. **요청 캐싱**: 빈번한 요청에 대한 캐싱 구현
2. **지연 시뮬레이션**: 실제 네트워크 환경과 유사한 지연 시뮬레이션
3. **오류 시나리오**: 다양한 오류 상황 시뮬레이션 (권한 오류, 서버 오류 등)
4. **실시간 업데이트**: WebSocket을 통한 실시간 업데이트 시뮬레이션

## 문서화

Swagger/OpenAPI를 사용하여 Mock 서버 API를 문서화합니다:

```javascript
// swagger.js 구현 예시
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SWDP Mock API',
      version: '1.0.0',
      description: 'API documentation for SWDP Mock Server'
    },
    servers: [
      {
        url: 'http://localhost:8001',
        description: 'Development server'
      }
    ]
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
```

## 결론

SWDP Mock 서버는 내부망 서비스를 시뮬레이션하여 APE 확장 프로그램 개발을 지원하는 핵심 도구입니다. 실제 API와 동일한 인터페이스를 제공하고, 환경 전환 메커니즘을 구현하여 개발에서 프로덕션으로의 쉬운 전환을 지원합니다.