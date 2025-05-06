/**
 * Jira LLM 서비스
 * 
 * LLM을 활용하여 Jira 작업을 강화하는 서비스
 * - 자연어 이슈 생성 및 분석
 * - 이슈 요약 및 추천
 * - 코멘트 자동 생성
 */

import { LlmService } from '../../../core/llm/LlmService';
import { JiraClientService } from './JiraClientService';

interface IssueSuggestion {
  summary: string;       
  description: string;   
  issueType: string;     
  priority?: string;     
  labels?: string[];     
}

interface CommentSuggestion {
  body: string;          
  isInternal?: boolean;  
}

/**
 * Jira LLM 서비스 클래스
 */
export class JiraLlmService {
  private llmService: LlmService;
  private client: JiraClientService;
  
  /**
   * JiraLlmService 생성자
   * @param llmService LLM 서비스
   * @param client Jira 클라이언트 서비스
   */
  constructor(llmService: LlmService, client: JiraClientService) {
    this.llmService = llmService;
    this.client = client;
  }
  
  /**
   * 자연어 설명에서 이슈 데이터 생성
   * @param description 자연어 이슈 설명
   * @param projectKey 프로젝트 키
   * @returns 생성된 이슈 제안
   */
  async generateIssueFromDescription(description: string, projectKey: string): Promise<IssueSuggestion> {
    try {
      
      const availableIssueTypes = ['Bug', 'Task', 'Story', 'Improvement'];
      
      
      const prompt = `
다음 자연어 설명을 기반으로 Jira 이슈를 생성하기 위한 정보를 추출해주세요.

## 설명
${description}

## 프로젝트 정보
프로젝트 키: ${projectKey}

## 사용 가능한 이슈 유형
${availableIssueTypes.join(', ')}

다음 JSON 형식으로 응답해주세요:
{
  "summary": "이슈 제목 (80자 이내)",
  "description": "이슈 상세 설명 (마크다운 형식)",
  "issueType": "이슈 유형 (위 목록 중 하나)",
  "priority": "우선순위 (Highest, High, Medium, Low, Lowest 중 하나)",
  "labels": ["라벨1", "라벨2"] (선택 사항)
}

이슈 제목은 명확하고 간결하게 작성하되, 이슈의 핵심을 담아야 합니다.
이슈 설명은 마크다운 형식으로 구조화하고, 재현 단계, 예상 결과, 실제 결과 등을 포함해주세요.
`;

      
      const result = await this.llmService.sendRequest({
        model: this.llmService.getDefaultModelId(),
        messages: [
          {
            role: 'system',
            content: '당신은 Jira 이슈 관리 전문가입니다. 사용자의 요청을 분석하여 효과적인 Jira 이슈를 생성합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });
      
      
      try {
        
        const jsonStr = result.content.match(/\{[\s\S]*\}/)?.[0];
        
        if (!jsonStr) {
          throw new Error('LLM 응답에서 JSON을 찾을 수 없습니다.');
        }
        
        return JSON.parse(jsonStr) as IssueSuggestion;
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        
        
        return {
          summary: description.substring(0, 80),
          description: result.content,
          issueType: 'Task'
        };
      }
    } catch (error) {
      console.error('이슈 생성 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 코드와 관련된 이슈 생성
   * @param code 코드 스니펫
   * @param context 추가 컨텍스트
   * @param projectKey 프로젝트 키
   * @returns 생성된 이슈 제안
   */
  async generateIssueFromCode(code: string, context: string, projectKey: string): Promise<IssueSuggestion> {
    try {
      
      const prompt = `
다음 코드와 컨텍스트를 분석하여 Jira 이슈를 생성해주세요. 

## 코드
\`\`\`
${code}
\`\`\`

## 컨텍스트
${context}

## 프로젝트 정보
프로젝트 키: ${projectKey}

다음 JSON 형식으로 응답해주세요:
{
  "summary": "이슈 제목 (80자 이내)",
  "description": "이슈 상세 설명 (마크다운 형식)",
  "issueType": "이슈 유형 (Bug, Task, Story, Improvement 중 가장 적합한 것)",
  "priority": "우선순위 (Highest, High, Medium, Low, Lowest 중 하나)",
  "labels": ["라벨1", "라벨2"] (선택 사항)
}

코드를 분석하여 다음 사항을 판단해주세요:
1. 코드에 버그가 있는가? 있다면 어떤 종류의 버그인가?
2. 성능 개선이 필요한가?
3. 리팩토링이 필요한가?
4. 새 기능 추가가 필요한가?

분석 결과에 따라 가장 적합한 이슈 유형을 선택하고, 상세한 설명을 제공해주세요.
`;

      
      const result = await this.llmService.sendRequest({
        model: this.llmService.getDefaultModelId(),
        messages: [
          {
            role: 'system',
            content: '당신은 코드 분석 및 Jira 이슈 관리 전문가입니다. 코드를 분석하여 적절한 Jira 이슈를 생성합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });
      
      
      try {
        
        const jsonStr = result.content.match(/\{[\s\S]*\}/)?.[0];
        
        if (!jsonStr) {
          throw new Error('LLM 응답에서 JSON을 찾을 수 없습니다.');
        }
        
        return JSON.parse(jsonStr) as IssueSuggestion;
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        
        
        return {
          summary: `코드 검토: ${context.substring(0, 70)}`,
          description: result.content,
          issueType: 'Task'
        };
      }
    } catch (error) {
      console.error('코드 기반 이슈 생성 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 이슈에 대한 응답 코멘트 자동 생성
   * @param issueData 이슈 데이터
   * @param context 추가 컨텍스트
   * @returns 생성된 코멘트 제안
   */
  async generateResponseComment(issueData: any, context: string): Promise<CommentSuggestion> {
    try {
      
      const prompt = `
다음 Jira 이슈 정보를 바탕으로 적절한 응답 코멘트를 작성해주세요.

## 이슈 정보
- 키: ${issueData.key}
- 제목: ${issueData.fields.summary}
- 유형: ${issueData.fields.issuetype.name}
- 상태: ${issueData.fields.status.name}
- 설명: ${issueData.fields.description || '(설명 없음)'}

## 담당자
${issueData.fields.assignee ? issueData.fields.assignee.displayName : '미할당'}

## 추가 컨텍스트
${context}

다음 JSON 형식으로 응답해주세요:
{
  "body": "코멘트 내용 (마크다운 형식)",
  "isInternal": false
}

코멘트 작성 시 다음 사항을 고려해주세요:
1. 이슈 유형과 상태에 적합한 응답
2. 구체적이고 명확한 정보 제공
3. 필요한 경우 추가 질문이나 명확화 요청
4. 전문적이고 예의 바른 톤 유지

isInternal 필드는 코멘트가 내부용인지 여부를 나타냅니다 (선택 사항).
`;

      
      const result = await this.llmService.sendRequest({
        model: this.llmService.getDefaultModelId(),
        messages: [
          {
            role: 'system',
            content: '당신은 Jira 이슈 관리 전문가입니다. 이슈의 맥락을 이해하고 적절한 응답 코멘트를 생성합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5  
      });
      
      
      try {
        
        const jsonStr = result.content.match(/\{[\s\S]*\}/)?.[0];
        
        if (!jsonStr) {
          throw new Error('LLM 응답에서 JSON을 찾을 수 없습니다.');
        }
        
        return JSON.parse(jsonStr) as CommentSuggestion;
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        
        
        return {
          body: result.content,
          isInternal: false
        };
      }
    } catch (error) {
      console.error('코멘트 생성 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 이슈 요약 생성
   * @param issueKeys 이슈 키 목록
   * @returns 이슈 요약 내용
   */
  async summarizeIssues(issueKeys: string[]): Promise<string> {
    try {
      
      const issues = await Promise.all(issueKeys.map(key => this.client.getIssue(key)));
      
      const issueData = issues.map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        type: issue.fields.issuetype.name,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee ? issue.fields.assignee.displayName : '미할당',
        description: issue.fields.description || '(설명 없음)'
      }));
      
      
      const prompt = `
다음 Jira 이슈 목록을 분석하고 요약해주세요:

## 이슈 목록
${issueData.map(issue => `
- ${issue.key}: ${issue.summary}
  유형: ${issue.type}, 상태: ${issue.status}, 담당자: ${issue.assignee}
  설명: ${issue.description.substring(0, 200)}${issue.description.length > 200 ? '...' : ''}
`).join('\n')}

다음 내용을 포함하여 요약해주세요:
1. 이슈 그룹의 전체적인 주제 또는 목적
2. 공통적인 패턴이나 관련성
3. 각 이슈의 핵심 포인트
4. 이슈 진행 상태에 대한 종합적인 뷰
5. 다음 단계에 대한 제안

마크다운 형식으로 응답해주세요.
`;

      
      const result = await this.llmService.sendRequest({
        model: this.llmService.getDefaultModelId(),
        messages: [
          {
            role: 'system',
            content: '당신은 Jira 이슈 분석 전문가입니다. 여러 이슈를 분석하고 의미 있는 요약과 통찰을 제공합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });
      
      return result.content;
    } catch (error) {
      console.error('이슈 요약 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 이슈 우선순위 추천
   * @param issueKey 이슈 키
   * @returns 추천 우선순위와 설명
   */
  async suggestIssuePriority(issueKey: string): Promise<{priority: string, explanation: string}> {
    try {
      
      const issue = await this.client.getIssue(issueKey);
      
      
      const prompt = `
다음 Jira 이슈를 분석하고 적절한 우선순위를 추천해주세요:

## 이슈 정보
- 키: ${issue.key}
- 제목: ${issue.fields.summary}
- 유형: ${issue.fields.issuetype.name}
- 설명: ${issue.fields.description || '(설명 없음)'}

## 우선순위 옵션
- Highest: 즉시 해결해야 하는 심각한 문제
- High: 중요하며 빠른 해결이 필요한 문제
- Medium: 일반적인 중요도를 가진 문제
- Low: 낮은 중요도, 다른 작업 이후에 처리 가능
- Lowest: 매우 낮은 중요도, 시간이 남을 때 처리 가능

다음 JSON 형식으로 응답해주세요:
{
  "priority": "추천 우선순위 (Highest, High, Medium, Low, Lowest 중 하나)",
  "explanation": "우선순위 추천 이유에 대한 설명"
}

우선순위 결정 시 다음 요소를 고려해주세요:
1. 이슈의 영향 범위 (사용자 수, 영향 받는 기능의 중요도)
2. 문제의 심각도 (시스템 다운, 데이터 손실, 기능 저하 등)
3. 긴급성 (즉시 해결 필요 여부)
4. 전략적 중요도 (비즈니스 목표와의 연관성)
`;

      
      const result = await this.llmService.sendRequest({
        model: this.llmService.getDefaultModelId(),
        messages: [
          {
            role: 'system',
            content: '당신은 Jira 이슈 분석 전문가입니다. 이슈의 특성을 분석하여 적절한 우선순위를 추천합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });
      
      
      try {
        
        const jsonStr = result.content.match(/\{[\s\S]*\}/)?.[0];
        
        if (!jsonStr) {
          throw new Error('LLM 응답에서 JSON을 찾을 수 없습니다.');
        }
        
        return JSON.parse(jsonStr) as {priority: string, explanation: string};
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        
        
        return {
          priority: 'Medium',
          explanation: result.content
        };
      }
    } catch (error) {
      console.error('우선순위 추천 중 오류 발생:', error);
      throw error;
    }
  }
}