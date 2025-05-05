/**
 * Jira 자연어 처리 서비스
 * 
 * 자연어 Jira 명령을 특정 Jira 명령어로 변환하는 서비스
 * 사용자 경험 향상을 위한 LLM 기반 자연어 처리 기능 제공
 */

import { LlmService } from '../../../core/llm/LlmService';
import { ILoggerService } from '../../../core/utils/LoggerService';

/**
 * 명령어 변환 결과 인터페이스
 */
export interface CommandConversion {
  command: string;    // 변환된 명령어 (예: jira:issue, jira:create)
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
 * Jira 자연어 처리 서비스 클래스
 */
export class JiraNaturalLanguageService {
  private llmService: LlmService;
  private logger: ILoggerService;
  
  // 지원되는 Jira 명령어와 그에 대한 자연어 표현 매핑
  private commandPatterns: Record<string, string[]> = {
    'issue': ['이슈', '작업', '티켓', '이슈 보여줘', '이슈 정보', '이슈 확인'],
    'create': ['생성', '만들어', '새 이슈', '이슈 생성', '새로 만들어', '추가해'],
    'search': ['검색', '찾아', '이슈 검색', '이슈 찾아', '조회', '목록'],
    'update': ['업데이트', '수정', '변경', '이슈 업데이트', '업데이트해', '바꿔'],
    'comment': ['코멘트', '댓글', '의견', '추가', '코멘트 달아', '댓글 달아']
  };
  
  /**
   * JiraNaturalLanguageService 생성자
   * @param llmService LLM 서비스
   * @param logger 로거 서비스
   */
  constructor(llmService: LlmService, logger: ILoggerService) {
    this.llmService = llmService;
    this.logger = logger;
  }
  
  /**
   * 자연어 명령을 Jira 명령어로 변환
   * @param naturalCommand 자연어 명령
   * @returns 변환된 명령어 정보
   */
  async convertNaturalCommand(naturalCommand: string): Promise<CommandConversion> {
    try {
      this.logger.info(`자연어 Jira 명령 변환 시작: "${naturalCommand}"`);
      
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
        command: 'issue',
        args: [],
        confidence: 0.5,
        explanation: '명령어 처리 중 오류가 발생하여 기본 이슈 조회 명령으로 처리합니다.'
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
    
    // 이슈 키(ex: PROJ-123) 패턴 확인 및 처리
    const issueKeyMatch = normalizedInput.match(/[a-z]+-\d+/i);
    if (issueKeyMatch) {
      if (bestMatch.command === '' || bestMatch.command === 'issue') {
        bestMatch.command = 'issue';
        bestMatch.args = [issueKeyMatch[0].toUpperCase()];
        bestMatch.score = Math.max(bestMatch.score, 0.8);  // 이슈 키가 있으면 신뢰도 높임
      }
    }
    
    // 생성 관련 키워드 및 프로젝트 키 처리
    if (bestMatch.command === 'create') {
      const projectKeyMatch = normalizedInput.match(/프로젝트\s*[:\s]\s*([a-z]+)/i) ||
                             normalizedInput.match(/([a-z]+)\s*프로젝트/i);
      
      if (projectKeyMatch) {
        bestMatch.args = [projectKeyMatch[1].toUpperCase()];
        
        // 제목, 설명 추출 시도
        const summaryMatch = normalizedInput.match(/제목\s*[:\s]\s*["'](.+?)["']/i) ||
                            normalizedInput.match(/["'](.+?)["']\s*제목/i);
        
        if (summaryMatch) {
          bestMatch.args.push(summaryMatch[1]);
        }
        
        const descriptionMatch = normalizedInput.match(/설명\s*[:\s]\s*["'](.+?)["']/i) ||
                                normalizedInput.match(/["'](.+?)["']\s*설명/i);
        
        if (descriptionMatch) {
          bestMatch.args.push(descriptionMatch[1]);
        }
      }
    }
    
    if (bestMatch.command) {
      return {
        command: bestMatch.command,
        args: bestMatch.args,
        confidence: bestMatch.score * 0.8, // 휴리스틱 신뢰도는 약간 낮게 설정
        explanation: `자연어 명령 "${naturalCommand}"을(를) @jira:${bestMatch.command} 명령으로 변환했습니다.`
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
당신은 Jira 명령어 변환 전문가입니다. 사용자의 자연어 명령을 적절한 Jira 명령어로 변환해주세요.

## 사용 가능한 Jira 명령어:
- issue: Jira 이슈 조회
- create: 새 Jira 이슈 생성
- search: Jira 이슈 검색
- update: Jira 이슈 업데이트
- comment: Jira 이슈에 코멘트 추가

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
  "command": "적절한 Jira 명령어",
  "args": ["명령어 인자들의 배열"],
  "confidence": 0.1~1.0 사이의 신뢰도 값,
  "explanation": "변환 이유에 대한 간단한 설명",
  "alternatives": [
    {
      "command": "대안 Jira 명령어",
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
        command: 'issue',
        args: [],
        confidence: 0.3,
        explanation: 'LLM 처리 중 오류가 발생하여 기본 이슈 조회 명령으로 처리합니다.'
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
    
    // 이슈 키 추출 (PROJ-123 형식)
    const issueKeyMatch = naturalCommand.match(/([a-z]+-\d+)/i);
    if (issueKeyMatch) {
      args.push(issueKeyMatch[1].toUpperCase());
    }
    
    // 명령어별 특화된 인자 추출 로직
    switch (command) {
      case 'issue':
        // 이슈 키는 이미 위에서 추출됨
        break;
        
      case 'create':
        // 프로젝트 키 추출
        const projectKeyMatch = naturalCommand.match(/프로젝트\s*[:\s]\s*([a-z]+)/i) ||
                               naturalCommand.match(/([a-z]+)\s*프로젝트/i);
        
        if (projectKeyMatch && !args.includes(projectKeyMatch[1].toUpperCase())) {
          args.push(projectKeyMatch[1].toUpperCase());
        }
        
        // 제목 추출
        const summaryMatch = naturalCommand.match(/제목\s*[:\s]\s*["'](.+?)["']/i) ||
                            naturalCommand.match(/["'](.+?)["']\s*제목/i);
        
        if (summaryMatch) {
          args.push(summaryMatch[1]);
        }
        
        // 설명 추출
        const descriptionMatch = naturalCommand.match(/설명\s*[:\s]\s*["'](.+?)["']/i) ||
                                naturalCommand.match(/["'](.+?)["']\s*설명/i);
        
        if (descriptionMatch) {
          args.push(descriptionMatch[1]);
        }
        
        // 이슈 유형 추출
        const typeMatch = naturalCommand.match(/타입\s*[:\s]\s*([a-z]+)/i) ||
                         naturalCommand.match(/유형\s*[:\s]\s*([a-z]+)/i);
        
        if (typeMatch) {
          args.push(`--type=${typeMatch[1]}`);
        }
        break;
        
      case 'search':
        // 검색 쿼리 추출
        const queryMatch = naturalCommand.match(/쿼리\s*[:\s]\s*["'](.+?)["']/i) ||
                          naturalCommand.match(/["'](.+?)["']/i);
        
        if (queryMatch) {
          args.push(queryMatch[1]);
        }
        
        // 결과 제한 추출
        const limitMatch = naturalCommand.match(/(\d+)개/);
        if (limitMatch) {
          args.push(`--limit=${limitMatch[1]}`);
        }
        break;
        
      case 'update':
        // 필드 및 값 추출
        const fieldMatch = naturalCommand.match(/필드\s*[:\s]\s*([a-z가-힣]+)/i);
        const valueMatch = naturalCommand.match(/값\s*[:\s]\s*["'](.+?)["']/i) ||
                          naturalCommand.match(/["'](.+?)["']\s*값/i);
        
        if (fieldMatch && args.length > 0) {  // 이슈 키가 이미 추출됨
          args.push(fieldMatch[1]);
          
          if (valueMatch) {
            args.push(valueMatch[1]);
          }
        }
        break;
        
      case 'comment':
        // 코멘트 내용 추출
        const commentMatch = naturalCommand.match(/코멘트\s*[:\s]\s*["'](.+?)["']/i) ||
                            naturalCommand.match(/["'](.+?)["']/i);
        
        if (commentMatch && args.length > 0) {  // 이슈 키가 이미 추출됨
          args.push(commentMatch[1]);
        }
        break;
    }
    
    return args;
  }
}