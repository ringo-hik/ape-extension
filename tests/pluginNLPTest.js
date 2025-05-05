/**
 * 플러그인 자연어 처리 동작 테스트
 * 
 * Git, Jira, SWDP, Pocket 등 모든 내부 플러그인의 자연어 처리 기능 테스트
 */

// CommandParserService 임포트
const { CommandParserService } = require('../dist/core/command/CommandParserService');

// 출력 유틸리티
function printSeparator() {
  console.log('-----------------------------------------------------------');
}

function printHeader(title) {
  printSeparator();
  console.log(title);
  printSeparator();
}

/**
 * 명령어 파싱 테스트
 * 다양한 자연어 명령을 파싱하여 결과 확인
 */
function testCommandParsing() {
  printHeader('명령어 파싱 테스트');
  
  // CommandParserService 인스턴스 생성
  const parser = new CommandParserService();
  
  // 테스트 케이스
  const testCases = [
    // Git 자연어 명령
    '@git 커밋 메시지 자동으로 만들어줘',
    '@git 변경사항 보여줘',
    '@git 상태 확인해줘',
    '@git 브랜치 목록 보여줘',
    '@git:status', // 일반 명령 (비교용)
    
    // Jira 자연어 명령
    '@jira 이슈 목록 보여줘',
    '@jira 새 이슈 만들어줘',
    '@jira APE-123 이슈 상세 정보 보여줘',
    '@jira:list', // 일반 명령 (비교용)
    
    // SWDP 자연어 명령
    '@swdp 빌드 상태 확인해줘',
    '@swdp 로컬 빌드 실행해줘',
    '@swdp 테스트 요청 생성해줘',
    '@swdp:status', // 일반 명령 (비교용)
    
    // Pocket 자연어 명령
    '@pocket 파일 목록 보여줘',
    '@pocket config.json 파일 내용 보여줘',
    '@pocket 리포트 파일 검색해줘',
    '@pocket:ls', // 일반 명령 (비교용)
    
    // 잘못된 명령어
    'This is not a command',
    '@invalid command'
  ];
  
  // 각 테스트 케이스 실행
  testCases.forEach(input => {
    const result = parser.parse(input);
    
    console.log(`\n입력: "${input}"`);
    
    if (result) {
      // 자연어 명령인지 일반 명령인지 구분
      const isNaturalLanguage = result.command === '';
      
      console.log(`결과: ${isNaturalLanguage ? '자연어 명령' : '일반 명령'}`);
      console.log(`- 에이전트: ${result.agentId}`);
      console.log(`- 명령어: ${result.command || '(자연어)'}`);
      console.log(`- 인자: ${JSON.stringify(result.args)}`);
    } else {
      console.log('결과: 명령어로 인식되지 않음');
    }
  });
}

/**
 * 명령어 실행 시뮬레이션
 * 파싱된 명령어가 어떻게 실행될지 시뮬레이션
 */
function simulateCommandExecution() {
  printHeader('명령어 실행 시뮬레이션');
  
  const parser = new CommandParserService();
  
  // 테스트 케이스
  const executionCases = [
    '@git 커밋 메시지 자동으로 만들어줘',
    '@jira 이슈 목록 보여줘',
    '@swdp 빌드 상태 확인해줘',
    '@pocket 파일 목록 보여줘'
  ];
  
  // 각 케이스 실행
  executionCases.forEach(input => {
    const result = parser.parse(input);
    
    console.log(`\n입력: "${input}"`);
    
    if (result && result.command === '') {
      // 자연어 명령 처리 시뮬레이션
      console.log(`실행: ${result.agentId}PluginService.processNaturalLanguage("${result.args[0]}")`);
      console.log('예상 결과:');
      
      // 플러그인별 예상 결과
      switch (result.agentId) {
        case 'git':
          if (input.includes('커밋') && input.includes('메시지')) {
            console.log('- GitNaturalLanguageService에서 "auto-commit" 명령으로 변환');
            console.log('- 실행: GitClientService.executeGitCommand() → 자동 커밋 메시지 생성 및 커밋');
          } else if (input.includes('상태') || input.includes('변경사항')) {
            console.log('- GitNaturalLanguageService에서 "status" 명령으로 변환');
            console.log('- 실행: GitClientService.getStatus() → 현재 변경사항 출력');
          }
          break;
          
        case 'jira':
          if (input.includes('이슈 목록')) {
            console.log('- PluginNaturalLanguageService에서 "list" 명령으로 변환');
            console.log('- 실행: JiraClientService.listIssues() → 이슈 목록 조회 및 출력');
          }
          break;
          
        case 'swdp':
          if (input.includes('빌드 상태')) {
            console.log('- PluginNaturalLanguageService에서 "status" 명령으로 변환');
            console.log('- 실행: SwdpClientService.getBuildStatus() → 빌드 상태 조회 및 출력');
          }
          break;
          
        case 'pocket':
          if (input.includes('파일 목록')) {
            console.log('- PluginNaturalLanguageService에서 "ls" 명령으로 변환');
            console.log('- 실행: PocketClientService.listObjects() → 파일 목록 조회 및 출력');
          }
          break;
      }
    }
  });
}

/**
 * 메인 함수
 */
function main() {
  console.log('===== 플러그인 자연어 처리 테스트 =====\n');
  
  try {
    // 명령어 파싱 테스트
    testCommandParsing();
    
    // 명령어 실행 시뮬레이션
    simulateCommandExecution();
    
    console.log('\n===== 테스트 완료 =====');
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
  }
}

// 테스트 실행
main();