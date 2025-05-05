/**
 * 명령어 시스템 테스트
 * 
 * 새로 구현된 도메인 기반 명령어 시스템의 기능을 테스트합니다.
 */

const { CommandParserService } = require('../../src/core/command/CommandParserService');
const { CommandRegistryService } = require('../../src/core/command/CommandRegistryService');
const { CommandExecutorService } = require('../../src/core/command/CommandExecutorService');
const { CommandDomain, CommandPrefix, CommandType } = require('../../src/types/CommandTypes');

// 테스트 함수
async function runTests() {
  console.log('===== 명령어 시스템 테스트 시작 =====');
  
  // 테스트 레지스트리 생성
  const registry = new CommandRegistryService();
  const parser = new CommandParserService();
  const executor = new CommandExecutorService(registry, null);
  
  // 테스트 명령어 등록
  registry.registerSystemCommand('/test', async (args, flags) => {
    return {
      success: true,
      message: `시스템 명령어 실행: 인자 = ${args.join(', ')}, 플래그 = ${JSON.stringify(flags)}`,
      displayMode: 'text'
    };
  }, {
    description: '테스트 명령어'
  });
  
  registry.registerAgentCommand(CommandDomain.GIT, 'status', async (args, flags) => {
    return {
      success: true,
      message: `Git 상태 확인: ${args.join(' ')}`,
      displayMode: 'text'
    };
  }, {
    description: 'Git 저장소 상태 확인'
  });
  
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
    const parsed = parser.parseWithSuggestions(input);
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
  
  // 테스트 3: 도메인 명령어 등록 및 검색
  console.log('\n----- 테스트 3: 도메인 명령어 등록 및 검색 -----');
  registry.registerAgentCommand(CommandDomain.JIRA, 'create', async (args, flags) => {
    return {
      success: true,
      message: '새 Jira 이슈 생성 테스트',
      displayMode: 'text'
    };
  }, {
    description: '새 Jira 이슈 생성'
  });
  
  const gitCommands = registry.getDomainCommands(CommandDomain.GIT);
  console.log('Git 명령어 목록:', gitCommands);
  
  const jiraCommands = registry.getDomainCommands(CommandDomain.JIRA);
  console.log('Jira 명령어 목록:', jiraCommands);
  
  // 테스트 4: 명령어 유사도 및 추천 테스트
  console.log('\n----- 테스트 4: 명령어 유사도 및 추천 테스트 -----');
  const suggestions1 = parser.suggestSimilarCommands('@git:statu');
  console.log('@git:statu 명령어 추천:', suggestions1);
  
  const suggestions2 = parser.suggestSimilarCommands('@jir:view');
  console.log('@jir:view 명령어 추천:', suggestions2);
  
  console.log('\n===== 명령어 시스템 테스트 완료 =====');
}

// 테스트 실행
runTests().catch(console.error);