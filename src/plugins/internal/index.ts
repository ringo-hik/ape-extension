/**
 * 내부 플러그인 모듈
 * 
 * 기본 제공되는 플러그인 서비스 내보내기
 * Git, Jira, SWDP 등의 내부 플러그인 제공
 */

// Git 플러그인
export { GitPluginService } from './git/GitPluginService';
export { GitClientService } from './git/GitClientService';
export { GitNaturalLanguageService } from './git/GitNaturalLanguageService';

// Jira 플러그인
export { JiraPluginService } from './jira/JiraPluginService';
export { JiraClientService } from './jira/JiraClientService';
export { JiraNaturalLanguageService } from './jira/JiraNaturalLanguageService';

// SWDP 플러그인
export { SwdpPluginService } from './swdp/SwdpPluginService';
export { SwdpClientService } from './swdp/SwdpClientService';
export { SwdpNaturalLanguageService } from './swdp/SwdpNaturalLanguageService';

// Pocket 플러그인
export { PocketPluginService } from './pocket/PocketPluginService';
export { PocketClientService } from './pocket/PocketClientService';
export { PocketNaturalLanguageService } from './pocket/PocketNaturalLanguageService';