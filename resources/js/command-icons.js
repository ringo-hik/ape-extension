/**
 * 명령어 아이콘 매핑 모듈
 * 
 * 명령어 ID에 따른 아이콘을 매핑하는 유틸리티 함수 제공
 */

/**
 * 명령어 그룹별 아이콘 매핑
 */
const COMMAND_ICONS = {
  // 플러그인 그룹
  'jira': 'issue-opened',
  'git': 'git-branch',
  'swdp': 'package',
  'pocket': 'archive',
  
  // 작업 타입
  'build': 'rocket',
  'help': 'question',
  'settings': 'gear',
  'search': 'search',
  'chat': 'comment',
  'code': 'code',
  'model': 'hubot',
  'debug': 'bug',
  'clear': 'trash',
  
  // Git 관련 명령어
  'commit': 'git-commit',
  'pull': 'git-pull-request',
  'push': 'cloud-upload',
  'pr': 'git-pull-request',
  'branch': 'git-branch',
  'status': 'git-compare',
  'diff': 'git-compare',
  'log': 'history',
  
  // Jira 관련 명령어
  'issue': 'issue-opened',
  'issues': 'list-unordered',
  'search': 'search',
  'assign': 'person',
  
  // SWDP 관련 명령어
  'deploy': 'rocket',
  'test': 'beaker',
  
  // 기본값
  'default': 'play'
};

/**
 * 명령어 ID로부터 적절한 아이콘을 결정합니다.
 * @param {string} commandId 명령어 ID (예: @git:commit, /help)
 * @returns {string} 코디콘 아이콘 이름
 */
function getIconForCommand(commandId) {
  if (!commandId) return COMMAND_ICONS.default;
  
  // 명령어 ID에서 접두사 제거 (@, /)
  const cleanId = commandId.replace(/^[@/]/, '');
  
  // 명령어 ID에서 주요 그룹 추출
  const parts = cleanId.split(':');
  const mainGroup = parts[0]; // 첫 부분 (git, jira 등)
  
  // 명령어 이름은 콜론 이후 부분
  const commandName = parts.length > 1 ? parts[1] : mainGroup;
  
  // 특정 명령어 패턴 매칭
  if (commandName.includes('issue')) return COMMAND_ICONS.issue;
  if (commandName.includes('pull') || commandName.includes('pr')) return COMMAND_ICONS.pull;
  if (commandName.includes('commit')) return COMMAND_ICONS.commit;
  if (commandName.includes('build')) return COMMAND_ICONS.build;
  if (commandName.includes('deploy')) return COMMAND_ICONS.deploy;
  if (commandName.includes('test')) return COMMAND_ICONS.test;
  if (commandName.includes('help')) return COMMAND_ICONS.help;
  if (commandName.includes('settings')) return COMMAND_ICONS.settings;
  if (commandName.includes('log')) return COMMAND_ICONS.log;
  if (commandName.includes('branch')) return COMMAND_ICONS.branch;
  if (commandName.includes('status')) return COMMAND_ICONS.status;
  if (commandName.includes('diff')) return COMMAND_ICONS.diff;
  
  // 명령어 이름에 따른 매핑
  if (COMMAND_ICONS[commandName]) {
    return COMMAND_ICONS[commandName];
  }
  
  // 주요 그룹 매칭
  return COMMAND_ICONS[mainGroup] || COMMAND_ICONS.default;
}

// 모듈 내보내기 (브라우저 환경용)
if (typeof window !== 'undefined') {
  window.getIconForCommand = getIconForCommand;
  window.COMMAND_ICONS = COMMAND_ICONS;
}

// CommonJS 환경용
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getIconForCommand,
    COMMAND_ICONS
  };
}