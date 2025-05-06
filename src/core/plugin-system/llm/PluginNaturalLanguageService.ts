/**
 * 플러그인 자연어 처리 서비스
 * 
 * 자연어 명령을 특정 플러그인 명령어로 변환하는 서비스
 * 모든 플러그인에서 공통으로 사용할 수 있는 자연어 처리 기능 제공
 */

import { LlmService } from '../../llm';
import { LoggerService, ILoggerService } from '../../utils/LoggerService';
import { PluginCommand } from '../../../types/PluginTypes';

/**
 * 명령어 변환 결과 인터페이스
 */
export interface CommandConversion {
  command: string;    
  args: string[];     
  confidence: number; 
  explanation: string; 
  alternatives?: Array<{  
    command: string;
    args: string[];
    confidence: number;
  }>;
}

/**
 * 명령어 패턴 정의 인터페이스
 */
export interface CommandPattern {
  command: string;     
  patterns: string[];  
  extractArgs?: (input: string) => string[];  
}

/**
 * 플러그인 자연어 처리 서비스 클래스
 */
export class PluginNaturalLanguageService {
  private llmService: LlmService;
  private logger: ILoggerService;
  private pluginId: string;
  private commandPatterns: CommandPattern[];
  private availableCommands: PluginCommand[];
  
  /**
   * PluginNaturalLanguageService 생성자
   * @param llmService LLM 서비스
   * @param logger 로거 서비스
   * @param pluginId 플러그인 ID
   * @param commandPatterns 명령어 패턴 맵
   * @param availableCommands 사용 가능한 명령어 목록
   */
  constructor(
    llmService: LlmService,
    logger: ILoggerService,
    pluginId: string,
    commandPatterns: CommandPattern[],
    availableCommands: PluginCommand[]
  ) {
    this.llmService = llmService;
    this.logger = logger;
    this.pluginId = pluginId;
    this.commandPatterns = commandPatterns;
    this.availableCommands = availableCommands;
  }
  
  /**
   * 자연어 명령을 플러그인 명령어로 변환
   * @param naturalCommand 자연어 명령
   * @returns 변환된 명령어 정보
   */
  async convertNaturalCommand(naturalCommand: string): Promise<CommandConversion> {
    try {
      this.logger.info(`자연어 ${this.pluginId} 명령 변환 시작: "${naturalCommand}"`);
      
      
      const heuristicMatch = this.heuristicCommandMatch(naturalCommand);
      
      if (heuristicMatch && heuristicMatch.confidence > 0.8) {
        this.logger.info(`휴리스틱 매칭 결과: ${heuristicMatch.command} (신뢰도: ${heuristicMatch.confidence})`);
        return heuristicMatch;
      }
      
      
      return await this.llmCommandMatch(naturalCommand, heuristicMatch);
    } catch (error) {
      this.logger.error(`자연어 명령 변환 중 오류 발생: ${error}`);
      
      
      const defaultCommand = this.getDefaultCommand();
      return {
        command: defaultCommand,
        args: [],
        confidence: 0.5,
        explanation: `명령어 처리 중 오류가 발생하여 기본 ${defaultCommand} 명령으로 처리합니다.`
      };
    }
  }
  
  /**
   * 휴리스틱 기반 명령어 매칭
   * @param naturalCommand 자연어 명령
   * @returns 매칭된 명령어 정보
   */
  private heuristicCommandMatch(naturalCommand: string): CommandConversion | null {
    const normalizedInput = naturalCommand.toLowerCase().trim();
    
    
    let bestMatch = {
      command: '',
      score: 0,
      args: [] as string[],
      patternIndex: -1
    };
    
    this.commandPatterns.forEach((cmdPattern, index) => {
      for (const pattern of cmdPattern.patterns) {
        if (normalizedInput.includes(pattern)) {
          const score = pattern.length / normalizedInput.length;
          
          if (score > bestMatch.score) {
            bestMatch = {
              command: cmdPattern.command,
              score,
              args: cmdPattern.extractArgs ? cmdPattern.extractArgs(normalizedInput) : [],
              patternIndex: index
            };
          }
        }
      }
    });
    
    if (bestMatch.command) {
      return {
        command: bestMatch.command,
        args: bestMatch.args,
        confidence: bestMatch.score * 0.8, 
        explanation: `자연어 명령 "${naturalCommand}"을(를) @${this.pluginId}:${bestMatch.command} 명령으로 변환했습니다.`
      };
    }
    
    return null;
  }
  
  /**
   * LLM 기반 명령어 매칭
   * @param naturalCommand 자연어 명령
   * @param heuristicMatch 휴리스틱 매칭 결과
   * @returns 매칭된 명령어 정보
   */
  private async llmCommandMatch(
    naturalCommand: string, 
    heuristicMatch: CommandConversion | null
  ): Promise<CommandConversion> {
    
    const commandDescriptions = this.availableCommands
      .filter(cmd => cmd.id !== '') 
      .map(cmd => `- ${cmd.id}: ${cmd.description} (사용법: ${cmd.syntax})`)
      .join('\n');
    
    
    let pluginSpecificInstructions = '';
    
    switch (this.pluginId) {
      case 'git':
        pluginSpecificInstructions = `
## Git 명령어 변환 가이드라인:
- 'commit', '커밋', '변경사항 저장' 등의 표현은 'commit' 명령으로 변환
- '상태', '변경사항', '뭐가 바뀌었는지' 등은 'status' 명령으로 변환
- '브랜치 생성', '새 브랜치' 등은 'branch' 명령으로 변환
- 'pull request', 'PR', '풀리퀘' 등은 'pr' 명령으로 변환
- '저장소 복제', '클론' 등은 'clone' 명령으로 변환
- '자동 커밋'은 'auto-commit' 명령으로 변환 (특히 좋은 커밋 메시지를 요청하는 경우)
- 'diff', '차이', '비교' 등은 'diff' 명령으로 변환

## 우선순위:
1. 명령어 의도가 명확한 경우 해당 명령어로 변환
2. 'auto-commit'은 명확한 커밋 작업이 필요할 때만 사용
3. 단순 조회나 상태 확인은 'status' 명령 우선 고려
`;
        break;
        
      case 'jira':
        pluginSpecificInstructions = `
## Jira 명령어 변환 가이드라인:
- '이슈 생성', '티켓 만들기', '새 작업' 등은 'create' 명령으로 변환
- '이슈 조회', '티켓 보기', '이슈 확인' 등은 'issue' 명령으로 변환
- '이슈 목록', '티켓 목록', '작업 리스트' 등은 'list' 명령으로 변환
- '이슈 할당', '담당자 변경' 등은 'assign' 명령으로 변환
- '이슈 상태 변경', '진행중으로 변경' 등은 'transition' 명령으로 변환
- '이슈 댓글', '코멘트 추가' 등은 'comment' 명령으로 변환
- '이슈 수정', '티켓 업데이트' 등은 'update' 명령으로 변환

## 우선순위:
1. 특정 이슈 키(예: PROJ-123)가 언급된 경우 해당 이슈에 대한 작업으로 판단
2. 이슈 조회 관련 명령이 우선 (issue, list 등)
3. 이슈 생성 및 수정 관련 명령 (create, update 등)
`;
        break;
        
      case 'swdp':
        pluginSpecificInstructions = `
## SWDP 명령어 변환 가이드라인:
- '빌드', '컴파일', '로컬 빌드' 등은 'build' 또는 'build:local' 명령으로 변환
- '배포', '릴리즈', '업로드' 등은 'deploy' 명령으로 변환
- '빌드 상태', '빌드 결과', '진행 상황' 등은 'status' 명령으로 변환
- '테스트 요청', 'TR 생성', '테스트 생성' 등은 'test-request' 또는 'tr' 명령으로 변환
- '레이어 빌드', '계층 빌드' 등은 'build:layer' 명령으로 변환
- '설정', '환경 설정' 등은 'config' 명령으로 변환

## 우선순위:
1. 빌드/배포 관련 작업 명령 우선 (build, deploy 등)
2. 상태 확인 관련 명령 (status)
3. 테스트 관련 명령 (test-request 등)
`;
        break;
        
      case 'pocket':
        pluginSpecificInstructions = `
## Pocket 명령어 변환 가이드라인:
- '파일 목록', '디렉토리 내용', '폴더 보기' 등은 'ls' 명령으로 변환
- '파일 정보', '메타데이터', '속성' 등은 'info' 명령으로 변환
- '파일 내용', '파일 열기', '내용 보기' 등은 'load' 명령으로 변환
- '파일 요약', '내용 요약', '요약해줘' 등은 'summarize' 명령으로 변환
- '디렉토리 구조', '폴더 트리', '트리 보기' 등은 'tree' 명령으로 변환
- '파일 검색', '이름으로 검색', '찾기' 등은 'search' 명령으로 변환
- '내용 검색', '텍스트 검색', '패턴 검색' 등은 'grep' 명령으로 변환
- '버킷 정보', '스토리지 정보' 등은 'bucket' 명령으로 변환

## 우선순위:
1. 특정 파일 경로가 언급된 경우 해당 파일에 대한 작업으로 판단
2. 목록/구조 조회 관련 명령이 우선 (ls, tree 등)
3. 파일 내용 관련 명령 (load, summarize 등)
4. 검색 관련 명령 (search, grep 등)

## 인자 추출 가이드:
- 따옴표(", ')로 감싸진 텍스트는 검색어나 경로로 추출
- 파일 경로는 일반적으로 확장자(.txt, .json 등)가 포함된 형태
- 디렉토리 경로는 일반적으로 슬래시(/)로 끝나는 형태
`;
        break;
        
      default:
        
        break;
    }
    
    const prompt = `
당신은 ${this.pluginId} 명령어 변환 전문가입니다. 사용자의 자연어 명령을 적절한 ${this.pluginId} 명령어로 변환해주세요.

## 사용 가능한 ${this.pluginId} 명령어:
${commandDescriptions}

${pluginSpecificInstructions}

## 사용자 입력:
"${naturalCommand}"

${heuristicMatch ? `
## 휴리스틱 분석 결과:
- 명령어: ${heuristicMatch.command}
- 인자: ${JSON.stringify(heuristicMatch.args)}
- 신뢰도: ${heuristicMatch.confidence}
` : ''}

## 출력 형식:
JSON 형식으로 다음 필드를 포함해 응답해주세요:
{
  "command": "적절한 ${this.pluginId} 명령어",
  "args": ["명령어 인자들의 배열"],
  "confidence": 0.1~1.0 사이의 신뢰도 값,
  "explanation": "변환 이유에 대한 간단한 설명",
  "alternatives": [
    {
      "command": "대안 ${this.pluginId} 명령어",
      "args": ["명령어 인자들의 배열"],
      "confidence": 0.1~1.0 사이의 신뢰도 값
    }
  ]
}

명령어 분석 결과만 JSON 형식으로 반환해주세요. 다른 설명이나 내용은 포함하지 마세요.
`;

    try {
      
      const response = await this.llmService.sendRequest({
        model: this.llmService.getDefaultModelId(),
        messages: [
          {
            role: 'system',
            content: '당신은 명령어 변환 전문가입니다. JSON 형식으로 응답해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      }).then(result => result.content);
      
      
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```|{[\s\S]*}/);
      
      if (!jsonMatch) {
        throw new Error('LLM 응답에서 JSON을 찾을 수 없습니다');
      }
      
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const result = JSON.parse(jsonStr) as CommandConversion;
      
      this.logger.info(`LLM 명령어 변환 결과: ${result.command}`);
      return result;
    } catch (error) {
      this.logger.error(`LLM 명령어 변환 중 오류 발생: ${error}`);
      
      
      if (heuristicMatch) {
        return heuristicMatch;
      }
      
      const defaultCommand = this.getDefaultCommand();
      return {
        command: defaultCommand,
        args: [],
        confidence: 0.3,
        explanation: 'LLM 처리 중 오류가 발생하여 기본 명령으로 처리합니다.'
      };
    }
  }
  
  /**
   * 기본 명령어 가져오기 (오류 상황에서 사용)
   * @returns 기본 명령어
   */
  private getDefaultCommand(): string {
    
    switch (this.pluginId) {
      case 'git':
        return 'status';
      case 'jira':
        return 'list';
      case 'swdp':
        return 'status';
      case 'pocket':
        return 'ls';
      default:
        return 'help';
    }
  }
  
  /**
   * 자연어 명령어 처리 유틸리티 메서드 제공
   */
  
  /**
   * 커밋 메시지 추출 유틸리티
   * @param input 자연어 입력
   * @returns 추출된 커밋 메시지
   */
  static extractCommitMessage(input: string): string | null {
    const messageMatch = input.match(/["'](.+?)["']|메시지\s*[:\s]\s*(.+?)(?:\s|$)/i);
    if (messageMatch) {
      return messageMatch[1] || messageMatch[2];
    }
    return null;
  }
  
  /**
   * 파일 경로 추출 유틸리티
   * @param input 자연어 입력
   * @returns 추출된 파일 경로 목록
   */
  static extractFilePaths(input: string): string[] {
    const fileMatch = input.match(/([./\\a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g);
    return fileMatch || [];
  }
  
  /**
   * 이슈 ID 추출 유틸리티
   * @param input 자연어 입력
   * @returns 추출된 이슈 ID
   */
  static extractIssueId(input: string): string | null {
    const issueMatch = input.match(/([A-Z]+-\d+)/);
    return issueMatch ? issueMatch[1] : null;
  }
  
  /**
   * 숫자 추출 유틸리티
   * @param input 자연어 입력
   * @returns 추출된 숫자
   */
  static extractNumber(input: string): number | null {
    const numberMatch = input.match(/(\d+)/);
    return numberMatch ? parseInt(numberMatch[1], 10) : null;
  }
}