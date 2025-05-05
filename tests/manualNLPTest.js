/**
 * 수동 자연어 처리 테스트 스크립트
 * 
 * 내부 플러그인의 자연어 처리 기능을 수동으로 테스트하기 위한 스크립트
 * 이 스크립트는 빌드 후 실행 가능합니다.
 * 
 * node manualNLPTest.js
 */

// CommandParserService 임포트
const { CommandParserService } = require('../dist/core/command/CommandParserService');

// LoggerService 모킹
class MockLogger {
  info(message) { console.log(`[INFO] ${message}`); }
  error(message) { console.error(`[ERROR] ${message}`); }
  warn(message) { console.warn(`[WARN] ${message}`); }
  debug(message) { console.log(`[DEBUG] ${message}`); }
}

// LlmService 모킹
class MockLlmService {
  constructor() {
    this.modelResponses = {
      // Git 명령어 응답
      'git 상태': { command: 'status', args: [], confidence: 0.95 },
      'git 변경사항': { command: 'status', args: [], confidence: 0.9 },
      'git 커밋 메시지': { command: 'auto-commit', args: [], confidence: 0.95 },
      'git 브랜치 목록': { command: 'branch', args: [], confidence: 0.9 },
      
      // Jira 명령어 응답
      'jira 이슈 목록': { command: 'list', args: [], confidence: 0.95 },
      'jira 새 이슈': { command: 'create', args: [], confidence: 0.9 },
      'jira APE-123': { command: 'issue', args: ['APE-123'], confidence: 0.95 },
      
      // SWDP 명령어 응답
      'swdp 빌드 상태': { command: 'status', args: [], confidence: 0.95 },
      'swdp 로컬 빌드': { command: 'build:local', args: [], confidence: 0.9 },
      'swdp 테스트 요청': { command: 'test-request', args: [], confidence: 0.95 },
      
      // Pocket 명령어 응답
      'pocket 파일 목록': { command: 'ls', args: [], confidence: 0.95 },
      'pocket 파일 내용': { command: 'load', args: ['config.json'], confidence: 0.9 },
      'pocket 검색': { command: 'search', args: ['report'], confidence: 0.95 }
    };
  }
  
  async queryLlm(prompt) {
    // 자연어 명령에서 플러그인 ID와 명령어 추출
    let matchedResponse = { command: 'help', args: [], confidence: 0.5 };
    
    // 응답 데이터베이스에서 가장 적합한 응답 찾기
    Object.keys(this.modelResponses).forEach(key => {
      if (prompt.toLowerCase().includes(key.toLowerCase())) {
        matchedResponse = this.modelResponses[key];
      }
    });
    
    return JSON.stringify(matchedResponse);
  }
  
  getDefaultModelId() {
    return 'mock-model';
  }
  
  async sendRequest(options) {
    return { content: 'Mock LLM Response' };
  }
}

// 플러그인 자연어 서비스 모킹
class MockPluginNaturalLanguageService {
  constructor(llmService, logger, pluginId, commandPatterns) {
    this.llmService = llmService;
    this.logger = logger;
    this.pluginId = pluginId;
    this.commandPatterns = commandPatterns || [];
  }
  
  async convertNaturalCommand(naturalCommand) {
    this.logger.info(`자연어 ${this.pluginId} 명령 변환 시작: "${naturalCommand}"`);
    
    // LLM에 요청
    try {
      const response = await this.llmService.queryLlm(`${this.pluginId} ${naturalCommand}`);
      const result = JSON.parse(response);
      
      this.logger.info(`LLM 명령어 변환 결과: ${result.command}`);
      
      return {
        command: result.command,
        args: result.args || [],
        confidence: result.confidence || 0.8,
        explanation: `자연어 명령을 @${this.pluginId}:${result.command} 명령으로 변환했습니다.`
      };
    } catch (error) {
      this.logger.error(`LLM 명령어 변환 중 오류 발생: ${error}`);
      
      return {
        command: this.getDefaultCommand(),
        args: [],
        confidence: 0.3,
        explanation: 'LLM 처리 중 오류가 발생하여 기본 명령으로 처리합니다.'
      };
    }
  }
  
  getDefaultCommand() {
    // 각 플러그인별 적절한 기본 명령어 반환
    switch (this.pluginId) {
      case 'git': return 'status';
      case 'jira': return 'list';
      case 'swdp': return 'status';
      case 'pocket': return 'ls';
      default: return 'help';
    }
  }
}

// 모의 플러그인 서비스
class MockPluginService {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.llmService = new MockLlmService();
    this.logger = new MockLogger();
    this.nlpService = new MockPluginNaturalLanguageService(this.llmService, this.logger, id);
  }
  
  async processNaturalLanguage(naturalCommand) {
    console.log(`\n[${this.id}] 자연어 명령 처리: "${naturalCommand}"`);
    
    try {
      // NLP 서비스를 통한 명령 변환
      const conversion = await this.nlpService.convertNaturalCommand(naturalCommand);
      console.log(`[${this.id}] 변환 결과:`, conversion);
      
      // 시뮬레이션된 명령 실행 결과
      const result = {
        content: `# 자연어 명령 처리 결과\n\n` +
                `**입력**: ${naturalCommand}\n\n` +
                `**변환**: @${this.id}:${conversion.command} ${conversion.args.join(' ')}\n\n` +
                `**신뢰도**: ${(conversion.confidence * 100).toFixed(1)}%\n\n` +
                `**설명**: ${conversion.explanation}\n\n` +
                `---\n\n` +
                `# 명령 실행 결과 (시뮬레이션)\n\n` +
                this.getSimulatedResult(conversion.command, conversion.args),
        type: `${this.id}-result`
      };
      
      return result;
    } catch (error) {
      console.error(`[${this.id}] 자연어 명령 처리 중 오류 발생:`, error);
      return {
        content: `# 자연어 명령 처리 오류\n\n자연어 명령 처리 중 오류가 발생했습니다: ${error.message || error}`,
        type: `${this.id}-error`
      };
    }
  }
  
  getSimulatedResult(command, args) {
    // 명령별 시뮬레이션된 결과
    switch (this.id) {
      case 'git':
        switch (command) {
          case 'status': return '현재 브랜치: main\n\n변경된 파일:\nM README.md\nM src/core/llm/LlmService.ts\n?? tests/manualNLPTest.js';
          case 'auto-commit': return '커밋 메시지 생성 중...\n\n생성된 메시지: "feat: 자연어 처리 기능 추가"';
          case 'branch': return '* main\n  develop\n  feature/nlp';
          default: return `Git ${command} 명령 실행 결과 (args: ${args.join(', ')})`;
        }
        
      case 'jira':
        switch (command) {
          case 'list': return '이슈 목록:\nAPE-123: 자연어 처리 기능 구현\nAPE-124: 내부망 테스트 지원';
          case 'create': return '새 이슈 생성 중...\n\n이슈 ID: APE-125\n제목: 내부망 테스트 지원';
          case 'issue': return `이슈 정보:\nID: ${args[0] || 'APE-123'}\n제목: 자연어 처리 기능 구현\n상태: 진행 중\n담당자: 사용자`;
          default: return `Jira ${command} 명령 실행 결과 (args: ${args.join(', ')})`;
        }
        
      case 'swdp':
        switch (command) {
          case 'status': return '빌드 상태:\n빌드 ID: 12345\n상태: 성공\n시작 시간: 2023-05-05 12:34:56\n종료 시간: 2023-05-05 12:40:22';
          case 'build:local': return '로컬 빌드 실행 중...\n\n빌드 ID: 12346\n상태: 진행 중';
          case 'test-request': return '테스트 요청 생성 중...\n\nTR ID: TR-789\n상태: 등록 완료';
          default: return `SWDP ${command} 명령 실행 결과 (args: ${args.join(', ')})`;
        }
        
      case 'pocket':
        switch (command) {
          case 'ls': return '파일 목록:\n- 📁 docs/\n  - 📄 config.json (1.2KB)\n  - 📄 readme.md (3.4KB)';
          case 'load': return `파일 내용 (${args[0] || 'config.json'}):\n\n\`\`\`json\n{\n  "key": "value"\n}\n\`\`\``;
          case 'search': return `검색 결과 (${args[0] || 'report'}):\n- 📄 report-2023.md\n- 📄 quarterly-report.md`;
          default: return `Pocket ${command} 명령 실행 결과 (args: ${args.join(', ')})`;
        }
        
      default:
        return `${this.id} ${command} 명령 실행 결과 (args: ${args.join(', ')})`;
    }
  }
}

// 출력 유틸리티
function printSeparator() {
  console.log('='.repeat(80));
}

function printHeader(title) {
  printSeparator();
  console.log(`${title}`);
  printSeparator();
}

// 사용자 입력 처리
function promptUser(question) {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
}

// 모든 플러그인 테스트
async function testAllPlugins() {
  // 모의 플러그인 서비스 생성
  const plugins = {
    git: new MockPluginService('git', 'Git'),
    jira: new MockPluginService('jira', 'Jira'),
    swdp: new MockPluginService('swdp', 'SWDP'),
    pocket: new MockPluginService('pocket', 'Pocket')
  };
  
  // CommandParserService 인스턴스 생성
  const parser = new CommandParserService();
  
  printHeader('내부 플러그인 자연어 처리 테스트');
  console.log('이 테스트는 플러그인의 자연어 처리 기능을 시뮬레이션합니다.');
  console.log('입력 예시: @git 상태 보여줘, @jira 이슈 목록 보여줘, @swdp 빌드 상태 확인해줘, @pocket 파일 목록 보여줘');
  console.log('종료하려면 "exit"를 입력하세요.\n');
  
  let running = true;
  
  while (running) {
    const input = await promptUser('명령어 입력: ');
    
    if (input.toLowerCase() === 'exit') {
      running = false;
      continue;
    }
    
    // 명령어 파싱
    const parsedCommand = parser.parse(input);
    
    if (!parsedCommand) {
      console.log('명령어로 인식되지 않았습니다. @plugin 자연어 형식으로 입력해주세요.');
      continue;
    }
    
    const { agentId, command, args } = parsedCommand;
    
    // 지원되는 플러그인 확인
    if (!plugins[agentId]) {
      console.log(`지원되지 않는 플러그인입니다: ${agentId}`);
      continue;
    }
    
    try {
      // 자연어 명령 처리
      if (command === '') {
        const naturalCommand = args[0];
        const result = await plugins[agentId].processNaturalLanguage(naturalCommand);
        console.log('\n결과:');
        console.log(result.content);
      } else {
        // 일반 명령어 처리 (시뮬레이션)
        console.log(`\n일반 명령어 실행 (${agentId}:${command}):`);
        console.log(plugins[agentId].getSimulatedResult(command, args));
      }
    } catch (error) {
      console.error('명령어 처리 중 오류 발생:', error);
    }
    
    console.log('\n'); // 결과 후 빈 줄 출력
  }
  
  console.log('테스트를 종료합니다. 감사합니다!');
}

// 테스트 실행
testAllPlugins().catch(error => {
  console.error('테스트 실행 중 오류 발생:', error);
});