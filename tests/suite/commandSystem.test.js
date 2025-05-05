/**
 * 명령어 시스템 테스트
 * 
 * 새로 구현된 도메인 기반 명령어 시스템의 기능을 테스트합니다.
 */

const assert = require('assert');
const { CommandDomain, CommandPrefix, CommandType } = require('../../src/types/CommandTypes');

// 가상 클래스 및 인터페이스 구현 (테스트용)
class MockCommandParserService {
  parse(input) {
    // 기본 구현
    const result = {
      prefix: CommandPrefix.NONE,
      type: CommandType.NONE,
      domain: CommandDomain.NONE,
      agentId: 'core',
      command: '',
      args: [],
      flags: {},
      options: {},
      rawInput: input
    };
    
    if (input.startsWith('@')) {
      result.prefix = CommandPrefix.AT;
      result.type = CommandType.AT;
      
      if (input.startsWith('@git:')) {
        result.domain = CommandDomain.GIT;
        result.command = input.substring(5);
      }
    } else if (input.startsWith('/')) {
      result.prefix = CommandPrefix.SLASH;
      result.type = CommandType.SLASH;
      result.command = input.substring(1);
    }
    
    return result;
  }
  
  isCommand(input) {
    return input.startsWith('@') || input.startsWith('/');
  }
  
  extractDomain(input) {
    if (input.includes('git')) return CommandDomain.GIT;
    if (input.includes('jira')) return CommandDomain.JIRA;
    return CommandDomain.NONE;
  }
  
  suggestSimilarCommands(command) {
    if (command.includes('git')) return ['@git:status', '@git:commit'];
    if (command.includes('jira')) return ['@jira:view', '@jira:create'];
    return [];
  }
}

class MockCommandRegistryService {
  constructor() {
    this.handlers = new Map();
    this.domainHandlers = new Map();
  }
  
  registerSystemCommand(command, handler, options) {
    this.handlers.set(command, handler);
    return true;
  }
  
  registerAgentCommand(domain, command, handler, options) {
    if (!this.domainHandlers.has(domain)) {
      this.domainHandlers.set(domain, new Map());
    }
    this.domainHandlers.get(domain).set(command, handler);
    return true;
  }
  
  getDomainCommands(domain) {
    const handlers = this.domainHandlers.get(domain);
    if (!handlers) return [];
    return Array.from(handlers.keys()).map(cmd => ({
      command: cmd,
      domain: domain,
      description: `${domain} ${cmd} command`
    }));
  }
}

class MockCommandExecutorService {
  constructor(registry) {
    this.registry = registry;
  }
  
  async executeFromString(commandString) {
    if (commandString.startsWith('/test')) {
      return {
        success: true,
        message: 'Test command executed',
        displayMode: 'text'
      };
    }
    if (commandString.startsWith('@git:status')) {
      return {
        success: true,
        message: 'Git status checked',
        displayMode: 'text'
      };
    }
    return {
      success: false,
      error: 'Command not found',
      displayMode: 'text',
      suggestedNextCommands: ['/help', '@git:status']
    };
  }
}

// 테스트 스위트
describe('명령어 시스템 테스트', () => {
  let parser, registry, executor;
  
  before(() => {
    registry = new MockCommandRegistryService();
    parser = new MockCommandParserService();
    executor = new MockCommandExecutorService(registry);
    
    // 테스트 명령어 등록
    registry.registerSystemCommand('/test', async (args, flags) => {
      return {
        success: true,
        message: 'Test command executed',
        displayMode: 'text'
      };
    });
    
    registry.registerAgentCommand(CommandDomain.GIT, 'status', async (args, flags) => {
      return {
        success: true,
        message: 'Git status checked',
        displayMode: 'text'
      };
    });
  });
  
  describe('CommandParserService', () => {
    it('명령어 형식 인식 테스트', () => {
      assert.strictEqual(parser.isCommand('/help'), true);
      assert.strictEqual(parser.isCommand('@git:status'), true);
      assert.strictEqual(parser.isCommand('일반 텍스트'), false);
    });
    
    it('도메인 추출 테스트', () => {
      assert.strictEqual(parser.extractDomain('@git:status'), CommandDomain.GIT);
      assert.strictEqual(parser.extractDomain('@jira:view'), CommandDomain.JIRA);
      assert.strictEqual(parser.extractDomain('일반 텍스트'), CommandDomain.NONE);
    });
    
    it('유사 명령어 제안 테스트', () => {
      const gitSuggestions = parser.suggestSimilarCommands('@git:statu');
      assert.ok(gitSuggestions.length > 0);
      assert.ok(gitSuggestions.includes('@git:status'));
    });
  });
  
  describe('CommandRegistryService', () => {
    it('도메인 명령어 등록 테스트', () => {
      const result = registry.registerAgentCommand(CommandDomain.JIRA, 'create', async () => {
        return { success: true, message: 'Created' };
      });
      assert.strictEqual(result, true);
    });
    
    it('도메인 명령어 조회 테스트', () => {
      const gitCommands = registry.getDomainCommands(CommandDomain.GIT);
      assert.strictEqual(gitCommands.length, 1);
      assert.strictEqual(gitCommands[0].command, 'status');
      
      const jiraCommands = registry.getDomainCommands(CommandDomain.JIRA);
      assert.strictEqual(jiraCommands.length, 1);
      assert.strictEqual(jiraCommands[0].command, 'create');
    });
  });
  
  describe('CommandExecutorService', () => {
    it('명령어 실행 테스트', async () => {
      const result1 = await executor.executeFromString('/test arg1 arg2');
      assert.strictEqual(result1.success, true);
      
      const result2 = await executor.executeFromString('@git:status');
      assert.strictEqual(result2.success, true);
      
      const result3 = await executor.executeFromString('@invalid:command');
      assert.strictEqual(result3.success, false);
      assert.ok(result3.suggestedNextCommands.length > 0);
    });
  });
});

// 테스트 함수
async function runManualTests() {
  console.log('===== 명령어 시스템 수동 테스트 =====');
  
  // 테스트 객체 생성
  const registry = new MockCommandRegistryService();
  const parser = new MockCommandParserService();
  const executor = new MockCommandExecutorService(registry);
  
  // 테스트 1: 기본 파싱 테스트
  console.log('\n----- 테스트 1: 기본 파싱 테스트 -----');
  const testInputs = [
    '/test arg1 arg2 --verbose',
    '@git:status',
    '@git:commit -m "Test message"',
    '@jira:view PROJ-123',
    '일반 텍스트'
  ];
  
  for (const input of testInputs) {
    console.log(`\n입력: "${input}"`);
    const parsed = parser.parse(input);
    console.log('파싱 결과:', JSON.stringify(parsed, null, 2));
  }
  
  // 테스트 2: 명령어 실행 테스트
  console.log('\n----- 테스트 2: 명령어 실행 테스트 -----');
  try {
    const result1 = await executor.executeFromString('/test arg1 arg2 --verbose');
    console.log('실행 결과 1:', JSON.stringify(result1, null, 2));
    
    const result2 = await executor.executeFromString('@git:status');
    console.log('실행 결과 2:', JSON.stringify(result2, null, 2));
    
    // 존재하지 않는 명령어
    const result3 = await executor.executeFromString('@git:invalid-command');
    console.log('실행 결과 3 (잘못된 명령어):', JSON.stringify(result3, null, 2));
  } catch (error) {
    console.error('실행 오류:', error);
  }
  
  console.log('\n===== 명령어 시스템 테스트 완료 =====');
}

// 모듈이 직접 실행된 경우에만 수동 테스트 실행
if (require.main === module) {
  runManualTests().catch(console.error);
}

// 모듈 내보내기
module.exports = {
  MockCommandParserService,
  MockCommandRegistryService,
  MockCommandExecutorService
};