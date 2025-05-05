/**
 * Pocket 자연어 처리 서비스
 * 
 * 자연어 Pocket 명령을 특정 Pocket 명령어로 변환하는 서비스
 * 사용자 경험 향상을 위한 LLM 기반 자연어 처리 기능 제공
 */

import { LlmService } from '../../../core/llm/LlmService';
import { ILoggerService } from '../../../core/utils/LoggerService';

/**
 * 명령어 변환 결과 인터페이스
 */
export interface CommandConversion {
  command: string;    // 변환된 명령어 (예: pocket:ls, pocket:load)
  args: string[];     // 명령어 인자
  confidence: number; // 변환 신뢰도 (0.0-1.0)
  explanation: string; // 변환 설명
  alternatives?: Array<{  // 대체 명령어 옵션
    command: string;
    args: string[];
    confidence: number;
  }>;
}

/**
 * Pocket 자연어 처리 서비스 클래스
 */
export class PocketNaturalLanguageService {
  private llmService: LlmService;
  private logger: ILoggerService;
  
  // 지원되는 Pocket 명령어와 그에 대한 자연어 표현 매핑
  private commandPatterns: Record<string, string[]> = {
    'ls': ['목록', '파일 목록', '디렉토리', '폴더', '리스트', '보여줘'],
    'info': ['정보', '상세 정보', '파일 정보', '메타데이터', '속성'],
    'load': ['로드', '내용', '읽기', '열기', '파일 내용', '보기'],
    'summarize': ['요약', '정리', '분석', '요약해줘', '간략하게'],
    'tree': ['트리', '구조', '폴더 구조', '디렉토리 구조', '계층'],
    'search': ['검색', '찾기', '파일 찾기', '이름 검색', '찾아줘'],
    'grep': ['내용 검색', '텍스트 검색', '문자열 검색', '코드 검색', '패턴 검색'],
    'bucket': ['버킷', '버킷 정보', '저장소', '저장소 정보', '스토리지']
  };
  
  /**
   * PocketNaturalLanguageService 생성자
   * @param llmService LLM 서비스
   * @param logger 로거 서비스
   */
  constructor(llmService: LlmService, logger: ILoggerService) {
    this.llmService = llmService;
    this.logger = logger;
  }
  
  /**
   * 자연어 명령을 Pocket 명령어로 변환
   * @param naturalCommand 자연어 명령
   * @returns 변환된 명령어 정보
   */
  async convertNaturalCommand(naturalCommand: string): Promise<CommandConversion> {
    try {
      this.logger.info(`자연어 Pocket 명령 변환 시작: "${naturalCommand}"`);
      
      // 간단한 휴리스틱 매칭 시도 (빠른 응답을 위해)
      const heuristicMatch = this.heuristicCommandMatch(naturalCommand);
      
      if (heuristicMatch && heuristicMatch.confidence > 0.8) {
        this.logger.info(`휴리스틱 매칭 결과: ${heuristicMatch.command} (신뢰도: ${heuristicMatch.confidence})`);
        return heuristicMatch;
      }
      
      // LLM을 이용한 명령어 변환
      return await this.llmCommandMatch(naturalCommand, heuristicMatch);
    } catch (error) {
      this.logger.error(`자연어 명령 변환 중 오류 발생: ${error}`);
      
      // 오류 발생 시 기본 명령어로 처리
      return {
        command: 'ls',
        args: [],
        confidence: 0.5,
        explanation: '명령어 처리 중 오류가 발생하여 기본 목록 조회 명령으로 처리합니다.'
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
    
    // 각 명령어 패턴별 점수 계산
    let bestMatch = {
      command: '',
      score: 0,
      args: [] as string[]
    };
    
    for (const [command, patterns] of Object.entries(this.commandPatterns)) {
      for (const pattern of patterns) {
        if (normalizedInput.includes(pattern)) {
          const score = pattern.length / normalizedInput.length;
          
          if (score > bestMatch.score) {
            bestMatch = {
              command,
              score,
              args: this.extractArguments(normalizedInput, command)
            };
          }
        }
      }
    }
    
    // 경로 패턴 (폴더/파일.확장자) 확인
    const pathPatterns = [
      /['"]([^'"]+\/[^'"]*)['"]/,  // "경로/" 또는 "경로/파일" 
      /['"]([^'"]+\.[a-zA-Z0-9]+)['"]/,  // "파일.확장자"
      /([a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-\.\/]*)/,  // 경로/경로/
      /([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/  // 파일.확장자
    ];
    
    // 경로 추출
    for (const pattern of pathPatterns) {
      const pathMatch = normalizedInput.match(pattern);
      if (pathMatch && pathMatch[1]) {
        // 이미 경로가 있는지 확인
        if (!bestMatch.args.includes(pathMatch[1])) {
          bestMatch.args.push(pathMatch[1]);
        }
        break;
      }
    }
    
    // 정확한 디렉토리명 추출 (X 폴더, X 디렉토리 패턴)
    const dirMatch = normalizedInput.match(/([a-zA-Z0-9_\-]+)\s*(폴더|디렉토리)/);
    if (dirMatch && dirMatch[1] && !bestMatch.args.length) {
      bestMatch.args.push(dirMatch[1] + '/');
    }
    
    // 'summarize' 명령어가 선택되고 파일 경로가 있는 경우 신뢰도 증가
    if (bestMatch.command === 'summarize' && bestMatch.args.length > 0) {
      bestMatch.score = Math.min(bestMatch.score + 0.2, 1.0);
    }
    
    // 'grep' 명령어가 선택되고 검색어가 없는 경우 검색어 추출 시도
    if (bestMatch.command === 'grep' && bestMatch.args.length === 0) {
      const searchTermMatch = normalizedInput.match(/['"]([^'"]+)['"]/);
      if (searchTermMatch && searchTermMatch[1]) {
        bestMatch.args.push(searchTermMatch[1]);
      }
    }
    
    if (bestMatch.command) {
      return {
        command: bestMatch.command,
        args: bestMatch.args,
        confidence: bestMatch.score * 0.8, // 휴리스틱 신뢰도는 약간 낮게 설정
        explanation: `자연어 명령 "${naturalCommand}"을(를) @pocket:${bestMatch.command} 명령으로 변환했습니다.`
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
    const prompt = `
당신은 Pocket(S3 호환 스토리지) 명령어 변환 전문가입니다. 사용자의 자연어 명령을 적절한 Pocket 명령어로 변환해주세요.

## 사용 가능한 Pocket 명령어:
- ls: 지정된 경로의 파일 목록 조회
- info: 파일 또는 디렉토리 정보 조회
- load: 파일 내용 로드
- summarize: LLM을 사용하여 파일 내용 요약
- tree: 지정된 경로의 디렉토리 구조 조회
- search: 파일 이름 검색
- grep: 파일 내용에서 텍스트 검색
- bucket: 현재 버킷 정보 조회

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
  "command": "적절한 Pocket 명령어",
  "args": ["명령어 인자들의 배열"],
  "confidence": 0.1~1.0 사이의 신뢰도 값,
  "explanation": "변환 이유에 대한 간단한 설명",
  "alternatives": [
    {
      "command": "대안 Pocket 명령어",
      "args": ["명령어 인자들의 배열"],
      "confidence": 0.1~1.0 사이의 신뢰도 값
    }
  ]
}

명령어 분석 결과만 JSON 형식으로 반환해주세요. 다른 설명이나 내용은 포함하지 마세요.
`;

    try {
      const response = await this.llmService.queryLlm(prompt);
      
      // JSON 파싱
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
      
      // LLM 오류 시 휴리스틱 결과 사용 또는 기본값 반환
      if (heuristicMatch) {
        return heuristicMatch;
      }
      
      return {
        command: 'ls',
        args: [],
        confidence: 0.3,
        explanation: 'LLM 처리 중 오류가 발생하여 기본 목록 조회 명령으로 처리합니다.'
      };
    }
  }
  
  /**
   * 자연어 명령에서 인자 추출
   * @param naturalCommand 자연어 명령
   * @param command 매칭된 명령어
   * @returns 추출된 인자 배열
   */
  private extractArguments(naturalCommand: string, command: string): string[] {
    const args: string[] = [];
    
    // 경로 또는 파일명 추출
    const pathMatch = naturalCommand.match(/['"]([^'"]+)['"]/);
    if (pathMatch && pathMatch[1]) {
      args.push(pathMatch[1]);
    }
    
    // 명령어별 특화된 인자 추출 로직
    switch (command) {
      case 'ls':
        // 디렉토리명 추출 (X 폴더, X 디렉토리 패턴)
        if (args.length === 0) {
          const dirMatch = naturalCommand.match(/([a-zA-Z0-9_\-]+)\s*(폴더|디렉토리)/);
          if (dirMatch && dirMatch[1]) {
            args.push(dirMatch[1] + '/');
          }
        }
        break;
        
      case 'tree':
        // 깊이 추출
        const depthMatch = naturalCommand.match(/깊이\s*[:\s]\s*(\d+)/i) || 
                          naturalMessage.match(/(\d+)\s*(단계|레벨)/i);
        
        if (depthMatch && depthMatch[1]) {
          args.push(`--depth=${depthMatch[1]}`);
        }
        break;
        
      case 'search':
        // 키워드 추출 (경로가 아닌 경우)
        if (args.length === 0) {
          const keywordMatch = naturalCommand.match(/(['"])?(검색어|키워드)[:'"\s]\s*([^'"]+)\1?/i) ||
                              naturalCommand.match(/(찾아|검색)[^\d\w]*(['"])?([^'"]+)\2?/i);
          
          if (keywordMatch && keywordMatch[3]) {
            args.push(keywordMatch[3].trim());
          }
        }
        break;
        
      case 'grep':
        // 패턴 추출 (첫 번째 인자가 아직 없는 경우)
        if (args.length === 0) {
          const patternMatch = naturalCommand.match(/(['"])?(패턴|문자열|텍스트)[:'"\s]\s*([^'"]+)\1?/i) ||
                              naturalCommand.match(/(내용에서|코드에서)[^\d\w]*(['"])?([^'"]+)\2?/i);
          
          if (patternMatch && patternMatch[3]) {
            args.push(patternMatch[3].trim());
          }
        }
        
        // 경로 추출 (두 번째 인자)
        if (args.length === 1) {
          const pathDirMatch = naturalCommand.match(/([a-zA-Z0-9_\-\/\.]+)\s*(경로|디렉토리|폴더)에서/i);
          if (pathDirMatch && pathDirMatch[1]) {
            // 경로가 /로 끝나지 않으면 추가
            const path = pathDirMatch[1].endsWith('/') ? pathDirMatch[1] : pathDirMatch[1] + '/';
            args.push(path);
          }
        }
        break;
    }
    
    return args;
  }
}