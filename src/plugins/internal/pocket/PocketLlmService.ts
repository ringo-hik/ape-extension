/**
 * Pocket LLM 서비스
 * 
 * LLM을 활용하여 S3 호환 스토리지 작업을 강화하는 서비스
 * - 파일 내용 분석 및 요약
 * - 파일 타입 및 메타데이터 추론
 * - 자연어 질의 처리
 */

import { LlmService } from '../../../core/llm/LlmService';
import { PocketClientService } from './PocketClientService';

interface FileSummary {
  title: string;        // 파일 제목/요약
  contentType: string;  // 추론된 내용 유형
  keyPoints: string[];  // 주요 포인트
  structure?: string;   // 파일 구조 (선택 사항)
}

interface FileRelationship {
  relatedFiles: string[];  // 관련 파일 목록
  relationship: string;    // 관계 설명
  confidence: number;      // 관계 신뢰도 (0-1)
}

/**
 * Pocket LLM 서비스 클래스
 */
export class PocketLlmService {
  private llmService: LlmService;
  private client: PocketClientService;
  
  /**
   * PocketLlmService 생성자
   * @param llmService LLM 서비스
   * @param client Pocket 클라이언트 서비스
   */
  constructor(llmService: LlmService, client: PocketClientService) {
    this.llmService = llmService;
    this.client = client;
  }
  
  /**
   * 파일 내용 분석 및 요약
   * @param filePath 파일 경로
   * @param options 분석 옵션
   * @returns 파일 요약 정보
   */
  async analyzeFile(filePath: string, options: any = {}): Promise<FileSummary> {
    try {
      // 파일 내용 가져오기
      const fileData = await this.client.getObject(filePath);
      const fileInfo = await this.client.getObjectInfo(filePath);
      
      // 텍스트 형식인지 확인
      if (!this.isTextFormat(fileInfo.ContentType || '')) {
        throw new Error('이 파일은 텍스트 형식이 아니라 분석할 수 없습니다.');
      }
      
      // 파일 내용을 문자열로 변환
      const textContent = fileData.toString('utf-8');
      
      // 내용이 너무 크면 일부만 사용
      const maxLength = options.maxLength || 15000;
      const truncatedContent = textContent.length > maxLength ? 
        textContent.substring(0, maxLength) + '...(truncated)' : textContent;
      
      // 파일 확장자 획득
      const extension = filePath.split('.').pop()?.toLowerCase() || '';
      
      // LLM에 전송할 프롬프트 생성
      const prompt = `
다음 파일을 분석하고 요약해주세요:

## 파일 정보
- 파일 경로: ${filePath}
- 파일 유형: ${fileInfo.ContentType || '알 수 없음'}
- 파일 크기: ${fileData.length} 바이트
- 확장자: ${extension}

## 파일 내용
\`\`\`
${truncatedContent}
\`\`\`

다음 JSON 형식으로 분석 결과를 제공해주세요:
{
  "title": "파일에 대한 간결한 제목 또는 1-2 문장 요약",
  "contentType": "파일 내용의 실제 유형(코드, 데이터, 문서, 설정 등)",
  "keyPoints": ["주요 포인트 1", "주요 포인트 2", "주요 포인트 3", ...],
  "structure": "파일의 전체적인 구조 설명(선택 사항)"
}

주의사항:
1. 파일의 실제 내용과 형식을 기반으로 분석해주세요.
2. 주요 포인트는 3-5개 정도로 제공해주세요.
3. 파일 내용이 코드인 경우, 언어와 주요 기능을 명시해주세요.
4. 모든 응답은 JSON 형식으로만 제공해주세요.
`;

      // LLM 요청
      const result = await this.llmService.sendRequest({
        model: options.model || this.llmService.getDefaultModelId(),
        messages: [
          {
            role: 'system',
            content: '당신은 파일 분석 전문가입니다. 파일 내용을 구조적으로 분석하고 주요 정보를 추출해 JSON 형식으로 제공합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });
      
      // JSON 응답 파싱
      try {
        // 응답에서 JSON 부분 추출
        const jsonStr = result.content.match(/\{[\s\S]*\}/)?.[0];
        
        if (!jsonStr) {
          throw new Error('LLM 응답에서 JSON을 찾을 수 없습니다.');
        }
        
        return JSON.parse(jsonStr) as FileSummary;
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        
        // 파싱 실패 시 기본 요약 반환
        return {
          title: filePath,
          contentType: fileInfo.ContentType || '알 수 없음',
          keyPoints: ['파일 내용 분석 중 오류 발생'],
          structure: '구조 분석 불가'
        };
      }
    } catch (error) {
      console.error('파일 분석 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 여러 파일 간의 관계 분석
   * @param filePaths 파일 경로 배열
   * @returns 파일 관계 분석 결과
   */
  async analyzeFileRelationships(filePaths: string[]): Promise<FileRelationship[]> {
    try {
      if (filePaths.length < 2) {
        throw new Error('관계 분석을 위해서는 최소 2개 이상의 파일이 필요합니다.');
      }
      
      // 각 파일의 내용과 메타데이터 가져오기
      const fileContents: Record<string, any> = {};
      
      for (const filePath of filePaths) {
        try {
          const fileData = await this.client.getObject(filePath);
          const fileInfo = await this.client.getObjectInfo(filePath);
          
          // 텍스트 파일만 내용 포함
          if (this.isTextFormat(fileInfo.ContentType || '')) {
            const textContent = fileData.toString('utf-8');
            // 내용이 너무 크면 일부만 사용
            const truncatedContent = textContent.length > 5000 ? 
              textContent.substring(0, 5000) + '...(truncated)' : textContent;
            
            fileContents[filePath] = {
              content: truncatedContent,
              contentType: fileInfo.ContentType,
              size: fileData.length
            };
          } else {
            fileContents[filePath] = {
              content: '[비텍스트 파일]',
              contentType: fileInfo.ContentType,
              size: fileData.length
            };
          }
        } catch (fileError) {
          console.warn(`파일 내용 가져오기 실패 (${filePath}):`, fileError);
          fileContents[filePath] = {
            content: '[파일 내용 가져오기 실패]',
            contentType: 'unknown',
            size: 0
          };
        }
      }
      
      // LLM에 전송할 프롬프트 생성
      const prompt = `
다음 파일들 간의 관계를 분석해주세요:

${Object.entries(fileContents).map(([path, info]) => `
## ${path}
- 유형: ${info.contentType || '알 수 없음'}
- 크기: ${info.size} 바이트
- 내용: 
\`\`\`
${info.content}
\`\`\`
`).join('\n')}

각 파일 쌍에 대해 다음 JSON 형식으로 관계 분석 결과를 제공해주세요:
[
  {
    "relatedFiles": ["파일1", "파일2"],
    "relationship": "두 파일 간의 관계 설명",
    "confidence": 0.0~1.0 사이의 신뢰도 값
  },
  ...
]

주의사항:
1. 모든 가능한 파일 쌍의 관계를 분석해주세요.
2. 관계가 명확하지 않은 경우 낮은 신뢰도 값을 부여해주세요.
3. 파일 내용, 형식, 이름 등을 기반으로 관계를 분석해주세요.
4. 모든 응답은 JSON 형식으로만 제공해주세요.
`;

      // LLM 요청
      const result = await this.llmService.sendRequest({
        model: this.llmService.getDefaultModelId(),
        messages: [
          {
            role: 'system',
            content: '당신은 파일 관계 분석 전문가입니다. 여러 파일의 내용과 메타데이터를 분석하여 파일 간의 관계를 식별하고 JSON 형식으로 제공합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });
      
      // JSON 응답 파싱
      try {
        // 응답에서 JSON 부분 추출
        const jsonStr = result.content.match(/\[[\s\S]*\]/)?.[0];
        
        if (!jsonStr) {
          throw new Error('LLM 응답에서 JSON을 찾을 수 없습니다.');
        }
        
        return JSON.parse(jsonStr) as FileRelationship[];
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        
        // 파싱 실패 시 기본 관계 정보 반환
        return filePaths.slice(0, -1).map((file, index) => ({
          relatedFiles: [file, filePaths[index + 1]],
          relationship: '관계 분석 실패',
          confidence: 0.1
        }));
      }
    } catch (error) {
      console.error('파일 관계 분석 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 자연어 질의에 대한 파일 내용 기반 응답 생성
   * @param query 자연어 질의
   * @param filePath 파일 경로
   * @returns 질의에 대한 응답
   */
  async answerQueryAboutFile(query: string, filePath: string): Promise<string> {
    try {
      if (!query) {
        throw new Error('질의 내용은 필수입니다.');
      }
      
      if (!filePath) {
        throw new Error('파일 경로는 필수입니다.');
      }
      
      // 파일 내용 가져오기
      const fileData = await this.client.getObject(filePath);
      const fileInfo = await this.client.getObjectInfo(filePath);
      
      // 텍스트 형식인지 확인
      if (!this.isTextFormat(fileInfo.ContentType || '')) {
        return '이 파일은 텍스트 형식이 아니라 질의에 답변할 수 없습니다.';
      }
      
      // 파일 내용을 문자열로 변환
      const textContent = fileData.toString('utf-8');
      
      // 내용이 너무 크면 일부만 사용
      const maxLength = 20000;
      const truncatedContent = textContent.length > maxLength ? 
        textContent.substring(0, maxLength) + '...(truncated)' : textContent;
      
      // LLM에 전송할 프롬프트 생성
      const prompt = `
다음 파일 내용을 참고하여 질의에 답변해주세요:

## 파일 정보
- 파일 경로: ${filePath}
- 파일 유형: ${fileInfo.ContentType || '알 수 없음'}

## 파일 내용
\`\`\`
${truncatedContent}
\`\`\`

## 질의
${query}

파일 내용에 기반하여 정확하고 상세하게 답변해주세요. 파일 내용에서 답을 찾을 수 없는 경우, "파일 내용에서 해당 정보를 찾을 수 없습니다"라고 답변해주세요.
`;

      // LLM 요청
      const result = await this.llmService.sendRequest({
        model: this.llmService.getDefaultModelId(),
        messages: [
          {
            role: 'system',
            content: '당신은 파일 내용에 기반하여 질문에 답변하는 전문가입니다. 제공된 파일 내용만을 참고하여 객관적이고 정확한 답변을 제공합니다.'
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
      console.error('파일 질의 응답 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 여러 파일에 대한 통합 분석 및 요약
   * @param filePaths 파일 경로 배열
   * @param topic 분석 주제/관점 (선택 사항)
   * @returns 통합 분석 결과
   */
  async analyzeFilesGrouped(filePaths: string[], topic?: string): Promise<string> {
    try {
      if (filePaths.length === 0) {
        throw new Error('분석할 파일이 없습니다.');
      }
      
      // 파일 내용 수집
      const fileContents: Record<string, any> = {};
      let totalContentSize = 0;
      
      for (const filePath of filePaths) {
        try {
          const fileData = await this.client.getObject(filePath);
          const fileInfo = await this.client.getObjectInfo(filePath);
          
          // 텍스트 파일만 내용 포함
          if (this.isTextFormat(fileInfo.ContentType || '')) {
            const textContent = fileData.toString('utf-8');
            fileContents[filePath] = {
              content: textContent,
              contentType: fileInfo.ContentType,
              size: fileData.length
            };
            totalContentSize += textContent.length;
          } else {
            fileContents[filePath] = {
              content: '[비텍스트 파일]',
              contentType: fileInfo.ContentType,
              size: fileData.length
            };
          }
        } catch (fileError) {
          console.warn(`파일 내용 가져오기 실패 (${filePath}):`, fileError);
          fileContents[filePath] = {
            content: '[파일 내용 가져오기 실패]',
            contentType: 'unknown',
            size: 0
          };
        }
      }
      
      // 최대 컨텍스트 크기 제한
      const maxContextSize = 30000;
      
      // 내용 크기가 제한을 초과하는 경우 파일별로 내용 잘라내기
      if (totalContentSize > maxContextSize) {
        const filesCount = Object.keys(fileContents).length;
        const avgSizePerFile = Math.floor(maxContextSize / filesCount);
        
        // 각 파일 내용 잘라내기
        for (const filePath in fileContents) {
          const fileInfo = fileContents[filePath];
          if (fileInfo.content.length > avgSizePerFile && fileInfo.content !== '[비텍스트 파일]' && fileInfo.content !== '[파일 내용 가져오기 실패]') {
            fileInfo.content = fileInfo.content.substring(0, avgSizePerFile) + '...(truncated)';
          }
        }
      }
      
      // LLM에 전송할 프롬프트 생성
      const prompt = `
다음 파일들을 통합적으로 분석하고 요약해주세요:

${Object.entries(fileContents).map(([path, info]) => `
## ${path}
- 유형: ${info.contentType || '알 수 없음'}
- 크기: ${info.size} 바이트
- 내용: 
\`\`\`
${info.content}
\`\`\`
`).join('\n')}

${topic ? `## 분석 관점/주제\n${topic}\n` : ''}

다음 내용을 포함하여 마크다운 형식으로 통합 분석 및 요약을 제공해주세요:
1. 전체 파일 그룹의 목적과 주요 기능
2. 각 파일의 역할과 중요 포인트
3. 파일 간의 관계 및 의존성
4. 주요 발견사항 및 통찰
${topic ? '5. 지정한 주제/관점에 따른 분석' : ''}

가능한 구체적이고 명확한 분석을 제공해주세요.
`;

      // LLM 요청
      const result = await this.llmService.sendRequest({
        model: this.llmService.getDefaultModelId(),
        messages: [
          {
            role: 'system',
            content: '당신은 파일 그룹 분석 전문가입니다. 여러 파일의 내용을 종합적으로 분석하여 통찰력 있는 요약과 관계 분석을 제공합니다.'
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
      console.error('파일 그룹 분석 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 파일 형식이 텍스트인지 확인
   * @param contentType 콘텐츠 타입
   * @returns 텍스트 형식 여부
   */
  private isTextFormat(contentType: string): boolean {
    // 텍스트 기반 콘텐츠 타입
    const textTypes = [
      'text/',
      'application/json',
      'application/javascript',
      'application/xml',
      'application/x-javascript',
      'application/xhtml+xml',
      'application/x-sh',
      'application/typescript',
      'application/x-typescript'
    ];
    
    return textTypes.some(type => contentType.startsWith(type));
  }
}