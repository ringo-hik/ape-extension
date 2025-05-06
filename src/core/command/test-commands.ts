/**
 * 테스트 명령어 모듈
 * 
 * APE 익스텐션의 테스트를 위한 명령어 정의
 */

import { CommandRegistryService } from './CommandRegistryService';
import { CommandPrefix, CommandResult, CommandType } from '../../types/CommandTypes';
import { ICoreService } from '../ICoreService';

/**
 * 테스트 명령어 등록
 * @param registry 명령어 레지스트리
 * @param coreService 코어 서비스
 */
export function registerTestCommands(registry: CommandRegistryService, coreService: ICoreService): void {
  // API 테스트 명령어
  registry.register('test', 'api.test', async () => {
    console.log('API 연결 테스트 명령 실행');
    
    try {
      const llmService = coreService.llmService;
      if (!llmService) {
        return {
          success: false,
          content: 'LLM 서비스를 찾을 수 없습니다',
          displayMode: 'text'
        };
      }
      
      // 간단한 연결 테스트
      const result = await llmService.testConnection();
      return {
        success: true,
        content: `API 연결 테스트 성공! 응답 시간: ${result.latency}ms`,
        displayMode: 'text'
      };
    } catch (error) {
      console.error('API 테스트 오류:', error);
      return {
        success: false,
        content: `API 연결 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        displayMode: 'text'
      };
    }
  }, {
    description: 'API 연결 테스트',
    syntax: '/test:api',
    agentId: 'test',
    command: 'api.test',
    prefix: CommandPrefix.SLASH,
    type: CommandType.SYSTEM
  });
  
  // 모델 목록 명령어
  registry.register('test', 'api.models', async () => {
    console.log('모델 목록 명령 실행');
    
    try {
      const modelManager = coreService.llmService.modelManager;
      if (!modelManager) {
        return {
          success: false,
          content: '모델 관리자를 찾을 수 없습니다',
          displayMode: 'text'
        };
      }
      
      // 사용 가능한 모델 조회
      const models = modelManager.getModels();
      const modelList = models.map(m => `- ${m.name}: ${m.id}`).join('\n');
      
      return {
        success: true,
        content: `사용 가능한 모델 (${models.length}개):\n${modelList}`,
        displayMode: 'text'
      };
    } catch (error) {
      console.error('모델 목록 오류:', error);
      return {
        success: false,
        content: `모델 목록 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        displayMode: 'text'
      };
    }
  }, {
    description: '사용 가능한 모델 목록 조회',
    syntax: '/test:models',
    agentId: 'test',
    command: 'api.models',
    prefix: CommandPrefix.SLASH,
    type: CommandType.SYSTEM
  });
  
  // 스트리밍 테스트 명령어
  registry.register('test', 'api.stream', async () => {
    console.log('스트리밍 응답 테스트 명령 실행');
    
    try {
      const llmService = coreService.llmService;
      if (!llmService) {
        return {
          success: false,
          content: 'LLM 서비스를 찾을 수 없습니다',
          displayMode: 'text'
        };
      }
      
      // 간단한 스트리밍 요청
      const testPrompt = { messages: [{ role: 'user', content: '안녕하세요! 스트리밍 테스트입니다.' }] };
      
      // 스트리밍 결과를 수집할 배열
      const streamChunks: string[] = [];
      
      // 스트리밍 콜백
      const onUpdate = (chunk: string) => {
        streamChunks.push(chunk);
      };
      
      // 스트리밍 요청 수행
      const result = await llmService.sendRequest({
        model: llmService.getDefaultModelId(),
        messages: testPrompt.messages,
        stream: true,
        onUpdate: onUpdate
      });
      
      return {
        success: true,
        content: `스트리밍 응답 테스트 성공!\n수신된 청크 수: ${streamChunks.length}개\n최종 응답: ${result.content}`,
        displayMode: 'text'
      };
    } catch (error) {
      console.error('스트리밍 테스트 오류:', error);
      return {
        success: false,
        content: `스트리밍 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        displayMode: 'text'
      };
    }
  }, {
    description: '스트리밍 응답 테스트',
    syntax: '/test:stream',
    agentId: 'test',
    command: 'api.stream',
    prefix: CommandPrefix.SLASH,
    type: CommandType.SYSTEM
  });
  
  // APE 모드 토글 명령어
  registry.register('test', 'mode.toggle', async () => {
    console.log('APE 모드 토글 명령 실행');
    
    try {
      // 현재 APE 모드 확인
      const configService = coreService.configService;
      const currentApeMode = configService.getConfig('ape.core.apeMode') || false;
      
      // 반대 값으로 설정
      const newApeMode = !currentApeMode;
      await configService.updateConfig('ape.core.apeMode', newApeMode);
      
      return {
        success: true,
        content: `APE 모드가 ${newApeMode ? '활성화' : '비활성화'}되었습니다.`,
        displayMode: 'text'
      };
    } catch (error) {
      console.error('APE 모드 토글 오류:', error);
      return {
        success: false,
        content: `APE 모드 토글 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        displayMode: 'text'
      };
    }
  }, {
    description: 'APE 모드 활성화/비활성화',
    syntax: '/test:ape-mode',
    agentId: 'test',
    command: 'mode.toggle',
    prefix: CommandPrefix.SLASH,
    type: CommandType.SYSTEM
  });
  
  // 심층 분석 모드 토글 명령어
  registry.register('test', 'mode.dev', async () => {
    console.log('심층 분석 모드 토글 명령 실행');
    
    try {
      // 현재 개발 모드 확인
      const configService = coreService.configService;
      const currentDevMode = configService.getConfig('ape.core.devMode') || false;
      
      // 반대 값으로 설정
      const newDevMode = !currentDevMode;
      await configService.updateConfig('ape.core.devMode', newDevMode);
      
      return {
        success: true,
        content: `심층 분석 모드가 ${newDevMode ? '활성화' : '비활성화'}되었습니다.`,
        displayMode: 'text'
      };
    } catch (error) {
      console.error('심층 분석 모드 토글 오류:', error);
      return {
        success: false,
        content: `심층 분석 모드 토글 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        displayMode: 'text'
      };
    }
  }, {
    description: '심층 분석 모드 활성화/비활성화',
    syntax: '/test:dev-mode',
    agentId: 'test',
    command: 'mode.dev',
    prefix: CommandPrefix.SLASH,
    type: CommandType.SYSTEM
  });
  
  // 채팅 내용 지우기 명령어
  registry.register('test', 'chat.clear', async () => {
    console.log('채팅 내용 지우기 명령 실행');
    
    try {
      // ChatService가 있다면 호출
      const chatService = (coreService as any).chatService;
      if (chatService && typeof chatService.clearChatHistory === 'function') {
        await chatService.clearChatHistory();
      }
      
      return {
        success: true,
        content: '채팅 내용이 지워졌습니다.',
        displayMode: 'text'
      };
    } catch (error) {
      console.error('채팅 내용 지우기 오류:', error);
      return {
        success: false,
        content: `채팅 내용 지우기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        displayMode: 'text'
      };
    }
  }, {
    description: '채팅 내용 지우기',
    syntax: '/test:clear-chat',
    agentId: 'test',
    command: 'chat.clear',
    prefix: CommandPrefix.SLASH,
    type: CommandType.SYSTEM
  });
  
  // 플러그인 테스트 명령어들
  const testPlugins = ['git', 'jira', 'swdp', 'pocket'];
  testPlugins.forEach(plugin => {
    registry.register('test', `test.${plugin}`, async () => {
      console.log(`${plugin} 플러그인 테스트 명령 실행`);
      
      try {
        const pluginRegistry = coreService.pluginRegistry;
        if (!pluginRegistry) {
          return {
            success: false,
            content: '플러그인 레지스트리를 찾을 수 없습니다',
            displayMode: 'text'
          };
        }
        
        // 플러그인 가져오기
        const targetPlugin = pluginRegistry.getPlugin(plugin);
        if (!targetPlugin) {
          return {
            success: false,
            content: `${plugin} 플러그인을 찾을 수 없습니다`,
            displayMode: 'text'
          };
        }
        
        // 플러그인 상태 확인
        const commands = targetPlugin.getCommands();
        return {
          success: true,
          content: `${plugin} 플러그인 테스트 성공!\n상태: ${targetPlugin.isEnabled() ? '활성화' : '비활성화'}\n명령어 수: ${commands.length}개`,
          displayMode: 'text'
        };
      } catch (error) {
        console.error(`${plugin} 플러그인 테스트 오류:`, error);
        return {
          success: false,
          content: `${plugin} 플러그인 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          displayMode: 'text'
        };
      }
    }, {
      description: `${plugin} 플러그인 테스트`,
      syntax: `/test:${plugin}`,
      agentId: 'test',
      command: `test.${plugin}`,
      prefix: CommandPrefix.SLASH,
      type: CommandType.SYSTEM
    });
  });
}