/**
 * Git 자연어 처리 서비스
 * 
 * 자연어 Git 명령을 특정 Git 명령어로 변환하는 서비스
 * 사용자 경험 향상을 위한 LLM 기반 자연어 처리 기능 제공
 */

import { LlmService } from '../../../core/llm/LlmService';
import { ILoggerService } from '../../../core/utils/LoggerService';

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
 * Git 자연어 처리 서비스 클래스
 */
export class GitNaturalLanguageService {
  private llmService: LlmService;
  private logger: ILoggerService;
  
  
  private commandPatterns: Record<string, string[]> = {
    'status': ['상태', '상황', '뭐 바뀌었어', '변경사항', '변경 내역', '현재 상태'],
    'diff': ['차이', '변경 내용', '뭐가 바뀌었어', '코드 변경', '변경점'],
    'changes': ['변경된 파일', '어떤 파일', '파일 목록', '수정된 파일'],
    'add': ['스테이징', '추가해', '스테이지', '추가', '담기'],
    'commit': ['커밋', '변경사항 저장', '변경 기록', '체크포인트'],
    'auto-commit': ['자동 커밋', '알아서 커밋', '커밋 메시지 생성', '커밋 메시지 만들어', '커밋 문구'],
    'push': ['푸시', '업로드', '서버에 올려', '원격 저장소에 올려', '깃허브에 올려'],
    'branch': ['브랜치', '가지', '분기', '브랜치 목록', '브랜치 정보'],
    'checkout': ['체크아웃', '브랜치 변경', '브랜치 이동', '전환'],
    'pull': ['풀', '당겨', '다운로드', '가져와', '업데이트'],
    'log': ['로그', '히스토리', '기록', '커밋 내역', '이력'],
    'explain': ['설명', '이해', '해석', '분석 해줘', '뜻이 뭐야'],
    'summarize': ['요약', '정리', '간단하게', '짧게 설명', '핵심만'],
    'analyze': ['분석', '코드 리뷰', '검토', '평가', '리뷰']
  };
  
  /**
   * GitNaturalLanguageService 생성자
   * @param llmService LLM 서비스
   * @param logger 로거 서비스
   */
  constructor(llmService: LlmService, logger: ILoggerService) {
    this.llmService = llmService;
    this.logger = logger;
  }
  
  /**
   * 자연어 명령을 Git 명령어로 변환
   * @param naturalCommand 자연어 명령
   * @returns 변환된 명령어 정보
   */
  async convertNaturalCommand(naturalCommand: string): Promise<CommandConversion> {
    try {
      this.logger.info(`자연어 Git 명령 변환 시작: "${naturalCommand}"`);
      
      
      const heuristicMatch = this.heuristicCommandMatch(naturalCommand);
      
      if (heuristicMatch && heuristicMatch.confidence > 0.8) {
        this.logger.info(`휴리스틱 매칭 결과: ${heuristicMatch.command} (신뢰도: ${heuristicMatch.confidence})`);
        return heuristicMatch;
      }
      
      
      return await this.llmCommandMatch(naturalCommand, heuristicMatch);
    } catch (error) {
      this.logger.error(`자연어 명령 변환 중 오류 발생: ${error}`);
      
      
      return {
        command: 'status',
        args: [],
        confidence: 0.5,
        explanation: '명령어 처리 중 오류가 발생하여 기본 상태 명령으로 처리합니다.'
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
    
    
    if (bestMatch.command === 'commit' || bestMatch.command === 'auto-commit') {
      const messageMatch = normalizedInput.match(/["'](.+?)["']|메시지\s*[:\s]\s*(.+?)(?:\s|$)/i);
      if (messageMatch) {
        const message = messageMatch[1] || messageMatch[2];
        if (message) {
          bestMatch.args = [message];
        }
      }
      
      
      if (/메시지.*만들|자동.*생성|알아서.*커밋/.test(normalizedInput)) {
        bestMatch.command = 'auto-commit';
      }
    }
    
    if (bestMatch.command) {
      return {
        command: bestMatch.command,
        args: bestMatch.args,
        confidence: bestMatch.score * 0.8, 
        explanation: `자연어 명령 "${naturalCommand}"을(를) @git:${bestMatch.command} 명령으로 변환했습니다.`
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
당신은 Git 명령어 변환 전문가입니다. 사용자의 자연어 명령을 적절한 Git 명령어로 변환해주세요.

## 사용 가능한 Git 명령어:
- status: Git 저장소 상태 확인
- diff: 변경 내역 확인
- changes: 변경된 파일 목록 확인
- add: 변경 파일 스테이징
- commit: 변경 내용 커밋
- auto-commit: LLM을 사용하여 자동으로 커밋 메시지 생성 및 커밋
- push: 커밋 푸시
- branch: 브랜치 목록 확인 및 관리
- checkout: 브랜치 전환
- pull: 원격 저장소에서 변경 사항 가져오기
- log: 커밋 이력 확인
- explain: LLM을 사용하여 특정 커밋의 변경 내용을 자세히 설명
- summarize: LLM을 사용하여 여러 커밋을 요약
- analyze: LLM을 사용하여 현재 변경 사항을 분석

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
  "command": "적절한 Git 명령어",
  "args": ["명령어 인자들의 배열"],
  "confidence": 0.1~1.0 사이의 신뢰도 값,
  "explanation": "변환 이유에 대한 간단한 설명",
  "alternatives": [
    {
      "command": "대안 Git 명령어",
      "args": ["명령어 인자들의 배열"],
      "confidence": 0.1~1.0 사이의 신뢰도 값
    }
  ]
}

명령어 분석 결과만 JSON 형식으로 반환해주세요. 다른 설명이나 내용은 포함하지 마세요.
`;

    try {
      const response = await this.llmService.queryLlm(prompt);
      
      
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
      
      return {
        command: 'status',
        args: [],
        confidence: 0.3,
        explanation: 'LLM 처리 중 오류가 발생하여 기본 상태 명령으로 처리합니다.'
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
    
    
    switch (command) {
      case 'add':
        
        const fileMatch = naturalCommand.match(/([./\\a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g);
        if (fileMatch) {
          args.push(...fileMatch);
        } else if (naturalCommand.includes('모든') || naturalCommand.includes('전체')) {
          args.push('.');
        }
        break;
        
      case 'commit':
        
        const messageMatch = naturalCommand.match(/["'](.+?)["']|메시지\s*[:\s]\s*(.+?)(?:\s|$)/i);
        if (messageMatch) {
          const message = messageMatch[1] || messageMatch[2];
          if (message) {
            args.push(message);
          }
        }
        
        
        if (naturalCommand.includes('모든') || naturalCommand.includes('전체')) {
          args.push('--all');
        }
        break;
        
      case 'auto-commit':
        
        const typeMatch = naturalCommand.match(/타입[은:]?\s*([a-z]+)/i);
        if (typeMatch && typeMatch[1]) {
          args.push(`--type=${typeMatch[1].toLowerCase()}`);
        }
        
        
        if (naturalCommand.includes('모든') || naturalCommand.includes('전체')) {
          args.push('--all');
        }
        break;
        
      case 'checkout':
      case 'branch':
        
        const branchMatch = naturalCommand.match(/브랜치[는:]?\s*([a-zA-Z0-9_/-]+)/i);
        if (branchMatch && branchMatch[1]) {
          args.push(branchMatch[1]);
        }
        break;
        
      case 'log':
        
        const countMatch = naturalCommand.match(/(\d+)개/);
        if (countMatch && countMatch[1]) {
          args.push(`--count=${countMatch[1]}`);
        }
        break;
    }
    
    return args;
  }
}