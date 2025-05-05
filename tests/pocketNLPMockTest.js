/**
 * Pocket 플러그인 자연어 처리 테스트 (모킹 버전)
 */

// 모킹 유틸리티
class MockBase {
  constructor() {
    this.callHistory = [];
  }
  
  recordCall(method, args) {
    this.callHistory.push({ method, args });
    return this;
  }
}

// VSCode 모킹
global.vscode = {
  window: {
    showInformationMessage: () => {},
    showErrorMessage: () => {}
  },
  workspace: {
    getConfiguration: () => ({
      get: (key) => {
        if (key === 'llm.providers') {
          return [{
            id: 'openrouter',
            name: 'OpenRouter',
            apiKey: 'mock-api-key',
            apiUrl: 'https://openrouter.ai/api',
            models: [{ id: 'mock-model', name: 'Mock Model' }]
          }];
        }
        return null;
      }
    })
  }
};

// LlmService 모킹
class MockLlmService extends MockBase {
  constructor() {
    super();
    console.log('MockLlmService 초기화됨');
  }
  
  getDefaultModelId() {
    return 'mock-model';
  }
  
  async sendRequest() {
    this.recordCall('sendRequest', arguments);
    return { content: 'Mock LLM 응답' };
  }
  
  async queryLlm(prompt) {
    this.recordCall('queryLlm', { prompt });
    
    // 자연어 명령에 대한 시뮬레이션된 응답
    if (prompt.includes('파일 목록')) {
      return JSON.stringify({
        command: 'ls',
        args: ['docs/'],
        confidence: 0.95,
        explanation: '파일 목록 명령을 ls 명령으로 변환했습니다.',
        alternatives: []
      });
    } else if (prompt.includes('파일 내용') || prompt.includes('열어줘') || prompt.includes('보여줘') && prompt.includes('.json')) {
      return JSON.stringify({
        command: 'load',
        args: ['config.json'],
        confidence: 0.9,
        explanation: '파일 내용 확인 명령을 load 명령으로 변환했습니다.',
        alternatives: [
          {
            command: 'info',
            args: ['config.json'],
            confidence: 0.5
          }
        ]
      });
    } else if (prompt.includes('검색') || prompt.includes('찾아줘')) {
      return JSON.stringify({
        command: 'search',
        args: ['report'],
        confidence: 0.85,
        explanation: '파일 검색 명령을 search 명령으로 변환했습니다.',
        alternatives: []
      });
    } else {
      return JSON.stringify({
        command: 'help',
        args: [],
        confidence: 0.5,
        explanation: '명령을 인식할 수 없어 help 명령으로 변환했습니다.',
        alternatives: []
      });
    }
  }
}

// Logger Service 모킹
class MockLoggerService extends MockBase {
  constructor() {
    super();
    console.log('MockLoggerService 초기화됨');
  }
  
  info(message) {
    this.recordCall('info', { message });
  }
  
  error(message) {
    this.recordCall('error', { message });
  }
  
  warn(message) {
    this.recordCall('warn', { message });
  }
}

// PocketClientService 모킹
class MockPocketClientService extends MockBase {
  constructor() {
    super();
    console.log('MockPocketClientService 초기화됨');
  }
  
  async testConnection() {
    this.recordCall('testConnection', {});
    return true;
  }
  
  async listObjects(path) {
    this.recordCall('listObjects', { path });
    return [
      { Key: 'docs/config.json', Size: 1024, LastModified: new Date() },
      { Key: 'docs/readme.md', Size: 512, LastModified: new Date() }
    ];
  }
  
  async getObject(path) {
    this.recordCall('getObject', { path });
    return Buffer.from('{"key": "value"}');
  }
  
  async getObjectInfo(path) {
    this.recordCall('getObjectInfo', { path });
    return {
      ContentType: 'application/json',
      ContentLength: 1024,
      LastModified: new Date(),
      ETag: 'mock-etag'
    };
  }
}

// 명령어 지원 인터페이스
class MockPluginCommand {
  constructor(id, name, description, execute) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.syntax = `@pocket:${id}`;
    this.examples = [`@pocket:${id}`];
    this.execute = execute;
  }
}

// 실제 타입 구현 모킹
const CommandType = { AT: 'AT', SLASH: 'SLASH', NONE: 'NONE' };
const CommandPrefix = { AT: 'AT', SLASH: 'SLASH', NONE: 'NONE' };

// Plugin Natural Language Service 모킹
class MockPluginNaturalLanguageService extends MockBase {
  constructor() {
    super();
    console.log('MockPluginNaturalLanguageService 초기화됨');
  }
  
  async convertNaturalCommand(naturalCommand) {
    this.recordCall('convertNaturalCommand', { naturalCommand });
    
    // 자연어 명령에 대한 시뮬레이션된 변환
    if (naturalCommand.includes('파일 목록') || naturalCommand.includes('리스트') || naturalCommand.includes('보여줘')) {
      return {
        command: 'ls',
        args: [],
        confidence: 0.9,
        explanation: '파일 목록 명령을 ls 명령으로 변환했습니다.'
      };
    } else if (naturalCommand.includes('내용') || naturalCommand.includes('열어') || naturalCommand.includes('로드')) {
      // 파일 경로 추출 시뮬레이션
      let args = [];
      
      if (naturalCommand.includes('config.json')) {
        args = ['config.json'];
      } else if (naturalCommand.includes('readme.md')) {
        args = ['readme.md'];
      }
      
      return {
        command: 'load',
        args,
        confidence: 0.85,
        explanation: '파일 내용 확인 명령을 load 명령으로 변환했습니다.'
      };
    } else if (naturalCommand.includes('검색') || naturalCommand.includes('찾아')) {
      // 검색어 추출 시뮬레이션
      return {
        command: 'search',
        args: ['report'],
        confidence: 0.8,
        explanation: '파일 검색 명령을 search 명령으로 변환했습니다.'
      };
    } else {
      // 기본 응답
      return {
        command: 'help',
        args: [],
        confidence: 0.5,
        explanation: '명령을 인식할 수 없어 help 명령으로 변환했습니다.'
      };
    }
  }
  
  static extractFilePaths(input) {
    // 간단한 파일 경로 추출 구현
    const fileMatch = input.match(/([./\\a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g);
    return fileMatch || [];
  }
  
  static extractIssueId(input) {
    return null;
  }
}

// 모의 ConfigLoader
class MockConfigLoader extends MockBase {
  constructor() {
    super();
  }
  
  getPlugin() {
    return {
      enabled: true,
      endpoint: 'https://s3.amazonaws.com',
      bucket: 'test-bucket',
      credentials: {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret'
      }
    };
  }
}

// PocketPluginService 구현 모킹 (주요 메서드만)
class MockPocketPluginService extends MockBase {
  constructor() {
    super();
    this.id = 'pocket';
    this.name = 'S3 호환 스토리지 관리';
    this.configLoader = new MockConfigLoader();
    this.client = new MockPocketClientService();
    this.llmService = new MockLlmService();
    this.nlpService = new MockPluginNaturalLanguageService();
    this.logger = new MockLoggerService();
    
    // 명령어 등록
    this.commands = this.registerCommands();
    
    console.log('MockPocketPluginService 초기화됨');
  }
  
  registerCommands() {
    return [
      // 자연어 명령어
      {
        id: '',
        name: 'natural-language',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '자연어로 Pocket 명령 실행',
        syntax: '@pocket <자연어 명령>',
        examples: ['@pocket 파일 목록 보여줘'],
        execute: async (args) => this.processNaturalLanguage(args.join(' '))
      },
      
      // 일반 명령어들
      new MockPluginCommand('ls', 'ls', '파일 목록 조회', 
        async (args) => this.listFiles(args[0] || '')),
      
      new MockPluginCommand('load', 'load', '파일 내용 로드', 
        async (args) => this.loadFile(args[0])),
      
      new MockPluginCommand('search', 'search', '파일 검색', 
        async (args) => this.searchFiles(args[0])),
        
      new MockPluginCommand('help', 'help', '도움말 표시',
        async () => this.showHelp())
    ];
  }
  
  async initialize() {
    this.recordCall('initialize', {});
    return true;
  }
  
  async processNaturalLanguage(naturalCommand) {
    this.recordCall('processNaturalLanguage', { naturalCommand });
    
    console.log(`\n[processNaturalLanguage] 입력: "${naturalCommand}"`);
    
    try {
      // NLP 서비스를 통한 명령 변환
      const conversion = await this.nlpService.convertNaturalCommand(naturalCommand);
      console.log(`[processNaturalLanguage] 변환 결과:`, conversion);
      
      // 해당 명령 검색
      const command = this.commands.find(cmd => cmd.id === conversion.command);
      
      if (!command) {
        console.log(`[processNaturalLanguage] 명령을 찾을 수 없음: ${conversion.command}`);
        return {
          content: `# 명령 실행 실패\n\n변환된 명령 '${conversion.command}'을(를) 찾을 수 없습니다.`,
          type: 'pocket-error'
        };
      }
      
      // 명령 실행 (실제로는 실행하지 않고 모킹)
      console.log(`[processNaturalLanguage] 실행할 명령: ${command.id}, 인자:`, conversion.args);
      
      // 실행 결과 시뮬레이션
      const commandInfo = {
        content: `# 자연어 명령 처리\n\n**입력**: ${naturalCommand}\n\n**변환**: @pocket:${conversion.command} ${conversion.args.join(' ')}\n\n**신뢰도**: ${(conversion.confidence * 100).toFixed(1)}%\n\n**설명**: ${conversion.explanation}\n\n---\n\n`,
        type: 'pocket-nlp-info'
      };
      
      // 시뮬레이션된 명령 실행 결과
      let result;
      
      switch (command.id) {
        case 'ls':
          result = {
            content: '# 파일 목록\n\n- 📁 docs/\n  - 📄 config.json\n  - 📄 readme.md',
            type: 'pocket-ls'
          };
          break;
          
        case 'load':
          result = {
            content: '# 파일 내용: ' + (conversion.args[0] || 'unknown') + '\n\n```json\n{"key": "value"}\n```',
            type: 'pocket-file-content'
          };
          break;
          
        case 'search':
          result = {
            content: '# 검색 결과: ' + (conversion.args[0] || '') + '\n\n- 📄 report.md\n- 📄 report-2023.md',
            type: 'pocket-search'
          };
          break;
          
        default:
          result = {
            content: '# Pocket 플러그인 도움말\n\n사용 가능한 명령어:\n- @pocket:ls - 파일 목록 조회\n- @pocket:load - 파일 내용 로드\n- @pocket:search - 파일 검색',
            type: 'pocket-help'
          };
      }
      
      // 결과 병합
      return {
        ...result,
        content: commandInfo.content + result.content,
        nlpInfo: {
          input: naturalCommand,
          convertedCommand: conversion.command,
          args: conversion.args,
          confidence: conversion.confidence
        }
      };
      
    } catch (error) {
      console.error('[processNaturalLanguage] 오류 발생:', error);
      return {
        content: `# 자연어 명령 처리 오류\n\n자연어 명령 처리 중 오류가 발생했습니다: ${error.message || error}`,
        type: 'pocket-error'
      };
    }
  }
  
  // 실제 기능 구현이 아닌 모킹된 메서드들
  async listFiles(path) {
    this.recordCall('listFiles', { path });
    return { content: '# 파일 목록 (모킹)', type: 'pocket-ls' };
  }
  
  async loadFile(path) {
    this.recordCall('loadFile', { path });
    return { content: '# 파일 내용 (모킹)', type: 'pocket-file-content' };
  }
  
  async searchFiles(keyword) {
    this.recordCall('searchFiles', { keyword });
    return { content: '# 검색 결과 (모킹)', type: 'pocket-search' };
  }
  
  async showHelp() {
    this.recordCall('showHelp', {});
    return { content: '# 도움말 (모킹)', type: 'pocket-help' };
  }
}

// CommandParser 모킹
class MockCommandParserService extends MockBase {
  constructor() {
    super();
    console.log('MockCommandParserService 초기화됨');
  }
  
  parse(input) {
    this.recordCall('parse', { input });
    
    if (!input || !input.trim()) {
      return null;
    }
    
    const trimmed = input.trim();
    
    // 간단한 '@pocket 자연어' 형식 감지
    if (trimmed.startsWith('@pocket ')) {
      const naturalCommand = trimmed.substring('@pocket '.length).trim();
      
      if (naturalCommand) {
        return {
          prefix: CommandPrefix.AT,
          type: CommandType.AT,
          agentId: 'pocket',
          command: '',
          args: [naturalCommand],
          flags: {},
          rawInput: trimmed
        };
      }
    }
    
    // '@pocket:command' 형식 감지
    if (trimmed.startsWith('@pocket:')) {
      const parts = trimmed.substring('@pocket:'.length).split(' ');
      const command = parts[0];
      const args = parts.slice(1);
      
      return {
        prefix: CommandPrefix.AT,
        type: CommandType.AT,
        agentId: 'pocket',
        command,
        args,
        flags: {},
        rawInput: trimmed
      };
    }
    
    return null;
  }
}

// 테스트 시나리오 실행 함수
async function runTests() {
  console.log('===== Pocket 플러그인 자연어 처리 모킹 테스트 =====\n');
  
  // 1. CommandParser 테스트
  console.log('1. CommandParser 테스트');
  const parser = new MockCommandParserService();
  
  const parserInputs = [
    '@pocket 파일 목록 보여줘',
    '@pocket config.json 파일 내용 보여줘',
    '@pocket report 파일 검색해줘',
    '@pocket:ls docs/',
    '@pocket:load config.json',
    'This is not a command'
  ];
  
  parserInputs.forEach(input => {
    const result = parser.parse(input);
    console.log(`\n입력: "${input}"`);
    console.log('결과:', result ? JSON.stringify(result, null, 2) : 'null');
  });
  
  // 2. Pocket 플러그인 자연어 처리 테스트
  console.log('\n\n2. Pocket 플러그인 자연어 처리 테스트');
  const pocketPlugin = new MockPocketPluginService();
  
  const naturalCommands = [
    '파일 목록 보여줘',
    'config.json 파일 내용 보여줘',
    'report 파일 검색해줘',
    '이해할 수 없는 명령'
  ];
  
  for (const cmd of naturalCommands) {
    console.log(`\n테스트 명령: "${cmd}"`);
    
    const result = await pocketPlugin.processNaturalLanguage(cmd);
    console.log('처리 결과 타입:', result.type);
    console.log('- NLP 변환 정보:', result.nlpInfo);
    
    // 결과 내용이 너무 길면 줄여서 출력
    let content = result.content;
    if (content.length > 200) {
      content = content.substring(0, 200) + '...';
    }
    console.log('- 결과 내용:', content);
  }
  
  // 3. 통합 테스트 - 실제 명령어 처리 흐름
  console.log('\n\n3. 통합 테스트 - 명령어 처리 흐름');
  
  const testCommand = '@pocket 파일 목록 보여줘';
  console.log(`\n테스트 명령: "${testCommand}"`);
  
  // 명령어 파싱
  const parsedCommand = parser.parse(testCommand);
  console.log('1. 명령어 파싱 결과:', parsedCommand ? JSON.stringify(parsedCommand, null, 2) : 'null');
  
  if (parsedCommand && parsedCommand.agentId === 'pocket' && parsedCommand.command === '') {
    // 자연어 명령 처리
    const naturalCommand = parsedCommand.args[0];
    console.log(`2. 자연어 명령 추출: "${naturalCommand}"`);
    
    // 플러그인 명령 처리
    const result = await pocketPlugin.processNaturalLanguage(naturalCommand);
    console.log('3. 명령 처리 결과 타입:', result.type);
    console.log('- NLP 변환 정보:', result.nlpInfo);
    
    // 결과 내용 확인
    if (result.content.includes('@pocket:ls')) {
      console.log('✅ 올바르게 "@pocket:ls" 명령으로 변환되었습니다.');
    } else {
      console.log('❌ 예상된 명령으로 변환되지 않았습니다.');
    }
  }
  
  console.log('\n===== 테스트 완료 =====');
}

// 테스트 실행
runTests();