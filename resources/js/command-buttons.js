// 명령어 버튼 UI를 위한 추가 자바스크립트

/**
 * 명령어 그룹별 아이콘 매핑 (Phosphor Icons 기반)
 */
const COMMAND_ICONS = {
  // 도메인별 아이콘
  'jira': { icon: 'kanban', source: 'phosphor' },
  'git': { icon: 'git-branch', source: 'phosphor' },
  'swdp': { icon: 'infinity', source: 'phosphor' },
  'build': { icon: 'hammer', source: 'phosphor' },
  'help': { icon: 'question', source: 'phosphor' },
  'settings': { icon: 'gear-six', source: 'phosphor' },
  'search': { icon: 'magnifying-glass', source: 'phosphor' },
  'chat': { icon: 'chat-text', source: 'phosphor' },
  'code': { icon: 'code', source: 'phosphor' },
  'model': { icon: 'robot', source: 'phosphor' },
  'debug': { icon: 'bug', source: 'phosphor' },
  'clear': { icon: 'trash', source: 'phosphor' },
  
  // 작업별 아이콘
  'commit': { icon: 'git-commit', source: 'phosphor' },
  'pull': { icon: 'git-pull-request', source: 'phosphor' },
  'push': { icon: 'arrow-up', source: 'phosphor' },
  'branch': { icon: 'git-branch', source: 'phosphor' },
  'merge': { icon: 'git-merge', source: 'phosphor' },
  'deploy': { icon: 'cloud-arrow-up', source: 'phosphor' },
  'test': { icon: 'test-tube', source: 'phosphor' },
  'issue': { icon: 'note-pencil', source: 'phosphor' },
  'task': { icon: 'clipboard-text', source: 'phosphor' },
  'bug': { icon: 'bug', source: 'phosphor' },
  'document': { icon: 'file-text', source: 'phosphor' },
  'save': { icon: 'floppy-disk', source: 'phosphor' },
  'config': { icon: 'sliders', source: 'phosphor' },
  
  // 기본 아이콘
  'default': { icon: 'play', source: 'phosphor' }
};

/**
 * 명령어 ID로부터 적절한 아이콘을 결정합니다.
 * @param {string} commandId 명령어 ID
 * @returns {string} 코디콘 아이콘 이름
 */
function getIconForCommand(commandId) {
  if (!commandId) return COMMAND_ICONS.default;
  
  // 명령어 ID에서 주요 그룹 추출
  const parts = commandId.split(':');
  const mainGroup = parts[0];
  
  // 명령어 이름은 콜론 이후 부분
  const commandName = parts.length > 1 ? parts[1] : mainGroup;
  
  // 특정 명령어 패턴 매칭
  if (commandName.includes('issue')) return 'issue-opened';
  if (commandName.includes('pull') || commandName.includes('pr')) return 'git-pull-request';
  if (commandName.includes('commit')) return 'git-commit';
  if (commandName.includes('build')) return 'rocket';
  if (commandName.includes('deploy')) return 'cloud-upload';
  if (commandName.includes('test')) return 'beaker';
  if (commandName.includes('help')) return 'question';
  if (commandName.includes('settings')) return 'gear';
  
  // 명령어 이름에 따른 매핑
  if (COMMAND_ICONS[commandName]) {
    return COMMAND_ICONS[commandName];
  }
  
  // 주요 그룹 매칭
  return COMMAND_ICONS[mainGroup] || COMMAND_ICONS.default;
}

/**
 * 명령어 그룹에 따라 CSS 클래스를 생성합니다.
 * @param {string} commandId 명령어 ID
 * @returns {string} CSS 클래스 이름
 */
function getCommandGroupClass(commandId) {
  if (!commandId) return '';
  
  const parts = commandId.split(':');
  const mainGroup = parts[0];
  
  // @ 또는 / 접두사가 있는 경우 제거
  let groupName = mainGroup;
  if (groupName.startsWith('@')) {
    groupName = groupName.substring(1);
  } else if (groupName.startsWith('/')) {
    groupName = 'system';
  }
  
  return `command-group-${groupName}`;
}

/**
 * 명령어 버튼 생성 함수
 * @param {Object} command 명령어 객체
 * @returns {HTMLElement} 버튼 컨테이너
 */
function createCommandButton(command) {
  const buttonContainer = document.createElement('div');
  buttonContainer.className = `command-button ${getCommandGroupClass(command.id)}`;
  buttonContainer.title = command.description || '';
  
  const button = document.createElement('button');
  button.className = 'button-content';
  button.onclick = () => {
    vscode.postMessage({
      command: 'executeCommand',
      commandId: command.id
    });
  };
  
  // 아이콘 자동 결정 또는 명시적 아이콘 사용
  const iconInfo = command.iconName ? 
    (typeof command.iconName === 'string' ? { icon: command.iconName, source: 'codicon' } : command.iconName) : 
    getIconForCommand(command.id);
  
  let icon;
  
  // IconManager를 사용해 아이콘 생성 (가능한 경우)
  if (window.iconManager) {
    icon = window.iconManager.createIcon(iconInfo.icon, {
      source: iconInfo.source || 'phosphor',
      size: 'default'
    });
  } else {
    // 폴백: 기존 방식으로 코디콘 아이콘 생성
    icon = document.createElement('i');
    if (iconInfo.source === 'phosphor') {
      icon.className = `ph ph-${iconInfo.icon}`;
    } else {
      icon.className = `codicon codicon-${iconInfo.icon}`;
    }
  }
  
  button.appendChild(icon);
  
  // 레이블 추가
  const label = document.createElement('span');
  label.textContent = command.label || command.id.split(':').pop() || command.id;
  button.appendChild(label);
  
  buttonContainer.appendChild(button);
  return buttonContainer;
}

/**
 * 명령어 카테고리 토글
 * @param {string} sectionId 카테고리 섹션 ID 
 */
function toggleCommandSection(sectionId) {
  const container = document.getElementById(sectionId);
  const toggleIcon = document.querySelector(`#${sectionId}-toggle`);
  
  if (container.classList.contains('collapsed')) {
    container.classList.remove('collapsed');
    toggleIcon.classList.remove('collapsed');
  } else {
    container.classList.add('collapsed');
    toggleIcon.classList.add('collapsed');
  }
}