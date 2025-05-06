/**
 * Jira API 클라이언트 서비스
 * 
 * Jira 이슈 관리 기능을 제공하는 API 클라이언트
 * REST API를 통한 이슈 조회, 생성, 업데이트 등의 기능 지원
 */

import { HttpClientService } from '../../../core/http/HttpClientService';
import { HttpHeaders } from '../../../types/HttpTypes';
import { JiraIssueData } from '../../../types/PluginTypes';

/**
 * Jira 인증 정보 인터페이스
 */
interface JiraCredentials {
  /**
   * 사용자 이름
   */
  username?: string;
  
  /**
   * 비밀번호
   */
  password?: string;
  
  /**
   * API 토큰
   */
  token?: string;
}

/**
 * Jira API 클라이언트 클래스
 * Jira REST API 요청 처리
 */
export class JiraClientService {
  /**
   * HTTP 클라이언트
   */
  private httpClient: HttpClientService;
  
  /**
   * 인증 헤더
   */
  private authHeaders: HttpHeaders = {};
  
  /**
   * 기본 URL
   */
  private baseUrl: string;
  
  /**
   * 초기화 완료 여부
   */
  private initialized: boolean = false;
  
  /**
   * JiraClientService 생성자
   * @param baseUrl Jira API 기본 URL
   * @param bypassSsl SSL 인증서 검증 우회 여부
   */
  constructor(baseUrl: string, bypassSsl: boolean = false) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.httpClient = new HttpClientService();
    
    
    if (bypassSsl) {
      this.httpClient.setSSLBypass(true);
    }
  }
  
  /**
   * 클라이언트 초기화
   * @param credentials Jira 인증 정보
   */
  async initialize(credentials: JiraCredentials): Promise<void> {
    try {
      
      if (credentials.token) {
        
        this.authHeaders = {
          'Authorization': `Bearer ${credentials.token}`
        };
      } else if (credentials.username && credentials.password) {
        
        const authString = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        this.authHeaders = {
          'Authorization': `Basic ${authString}`
        };
      } else {
        throw new Error('유효한 인증 정보를 제공해야 합니다 (토큰 또는 사용자 이름/비밀번호)');
      }
      
      
      await this.testConnection();
      
      this.initialized = true;
    } catch (error) {
      console.error('Jira 클라이언트 초기화 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 연결 테스트
   */
  private async testConnection(): Promise<void> {
    try {
      const response = await this.httpClient.get(
        `${this.baseUrl}rest/api/2/myself`,
        this.authHeaders
      );
      
      if (!response.ok) {
        throw new Error(`Jira 연결 테스트 실패: ${response.statusCode} ${response.statusText}`);
      }
      
      console.log('Jira 연결 테스트 성공:', response.data.displayName);
    } catch (error) {
      console.error('Jira 연결 테스트 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 초기화 확인
   * @returns 초기화 상태
   */
  private checkInitialized(): boolean {
    if (!this.initialized) {
      console.warn('Jira 클라이언트가 초기화되지 않았습니다. 인증 정보를 확인하세요.');
      return false;
    }
    return true;
  }
  
  /**
   * 초기화 상태 반환
   * @returns 초기화 여부
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * 이슈 조회
   * @param issueKey 이슈 키
   * @returns 이슈 정보
   */
  async getIssue(issueKey: string): Promise<any> {
    if (!this.checkInitialized()) {
      return {
        error: true,
        message: '인증 정보가 없습니다. settings.json에 Jira 인증 정보를 설정하세요.'
      };
    }
    
    try {
      const response = await this.httpClient.get(
        `${this.baseUrl}rest/api/2/issue/${issueKey}`,
        this.authHeaders
      );
      
      if (!response.ok) {
        throw new Error(`이슈 조회 실패: ${response.statusCode} ${response.statusText}`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`이슈 조회 중 오류 발생 (${issueKey}):`, error);
      throw error;
    }
  }
  
  /**
   * 이슈 생성
   * @param issueData 이슈 데이터
   * @returns 생성된 이슈 정보
   */
  async createIssue(issueData: JiraIssueData): Promise<any> {
    if (!this.checkInitialized()) {
      return {
        error: true,
        message: '인증 정보가 없습니다. settings.json에 Jira 인증 정보를 설정하세요.'
      };
    }
    
    try {
      
      const payload = {
        fields: {
          project: {
            key: issueData.projectKey
          },
          summary: issueData.summary,
          description: issueData.description,
          issuetype: {
            name: issueData.issueType
          }
        }
      };
      
      
      const typedFields = payload.fields as Record<string, any>;
      
      
      if (issueData.priority) {
        typedFields.priority = {
          name: issueData.priority
        };
      }
      
      
      if (issueData.assignee) {
        typedFields.assignee = {
          name: issueData.assignee
        };
      }
      
      
      if (issueData.labels && issueData.labels.length > 0) {
        typedFields.labels = issueData.labels;
      }
      
      
      if (issueData.customFields) {
        for (const [fieldId, value] of Object.entries(issueData.customFields)) {
          typedFields[fieldId] = value;
        }
      }
      
      
      const response = await this.httpClient.post(
        `${this.baseUrl}rest/api/2/issue`,
        payload,
        {
          ...this.authHeaders,
          'Content-Type': 'application/json'
        }
      );
      
      if (!response.ok) {
        throw new Error(`이슈 생성 실패: ${response.statusCode} ${response.statusText}`);
      }
      
      
      return await this.getIssue(response.data.key);
    } catch (error) {
      console.error('이슈 생성 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 이슈 검색
   * @param jql JQL 쿼리
   * @param maxResults 최대 결과 수
   * @returns 검색 결과
   */
  async searchIssues(jql: string, maxResults: number = 10): Promise<any> {
    this.checkInitialized();
    
    try {
      const response = await this.httpClient.post(
        `${this.baseUrl}rest/api/2/search`,
        {
          jql,
          maxResults,
          fields: ['summary', 'description', 'status', 'assignee', 'priority', 'issuetype']
        },
        {
          ...this.authHeaders,
          'Content-Type': 'application/json'
        }
      );
      
      if (!response.ok) {
        throw new Error(`이슈 검색 실패: ${response.statusCode} ${response.statusText}`);
      }
      
      return response.data;
    } catch (error) {
      console.error('이슈 검색 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 이슈 업데이트
   * @param issueKey 이슈 키
   * @param field 필드 이름
   * @param value 새 값
   * @returns 업데이트 결과
   */
  async updateIssue(issueKey: string, field: string, value: any): Promise<any> {
    this.checkInitialized();
    
    try {
      
      let payload: any = {
        fields: {}
      };
      
      
      switch (field) {
        case 'summary':
        case 'description':
          payload.fields[field] = value;
          break;
          
        case 'priority':
          payload.fields.priority = { name: value };
          break;
          
        case 'status':
          
          return await this.transitionIssue(issueKey, value);
          
        case 'assignee':
          payload.fields.assignee = { name: value };
          break;
          
        default:
          
          payload.fields[field] = value;
      }
      
      
      const response = await this.httpClient.put(
        `${this.baseUrl}rest/api/2/issue/${issueKey}`,
        payload,
        {
          ...this.authHeaders,
          'Content-Type': 'application/json'
        }
      );
      
      if (!response.ok) {
        throw new Error(`이슈 업데이트 실패: ${response.statusCode} ${response.statusText}`);
      }
      
      
      return await this.getIssue(issueKey);
    } catch (error) {
      console.error(`이슈 업데이트 중 오류 발생 (${issueKey}):`, error);
      throw error;
    }
  }
  
  /**
   * 이슈 상태 전환
   * @param issueKey 이슈 키
   * @param statusName 상태 이름
   * @returns 전환 결과
   */
  private async transitionIssue(issueKey: string, statusName: string): Promise<any> {
    try {
      
      const transitionsResponse = await this.httpClient.get(
        `${this.baseUrl}rest/api/2/issue/${issueKey}/transitions`,
        this.authHeaders
      );
      
      if (!transitionsResponse.ok) {
        throw new Error(`전환 상태 조회 실패: ${transitionsResponse.statusCode} ${transitionsResponse.statusText}`);
      }
      
      
      const transitions = transitionsResponse.data.transitions;
      const transition = transitions.find((t: any) => 
        t.to.name.toLowerCase() === statusName.toLowerCase() ||
        t.name.toLowerCase() === statusName.toLowerCase()
      );
      
      if (!transition) {
        throw new Error(`상태 "${statusName}"에 대한 전환을 찾을 수 없습니다`);
      }
      
      
      const response = await this.httpClient.post(
        `${this.baseUrl}rest/api/2/issue/${issueKey}/transitions`,
        {
          transition: {
            id: transition.id
          }
        },
        {
          ...this.authHeaders,
          'Content-Type': 'application/json'
        }
      );
      
      if (!response.ok) {
        throw new Error(`상태 전환 실패: ${response.statusCode} ${response.statusText}`);
      }
      
      
      return await this.getIssue(issueKey);
    } catch (error) {
      console.error(`이슈 상태 전환 중 오류 발생 (${issueKey}):`, error);
      throw error;
    }
  }
  
  /**
   * 이슈에 코멘트 추가
   * @param issueKey 이슈 키
   * @param comment 코멘트 내용
   * @returns 코멘트 추가 결과
   */
  async addComment(issueKey: string, comment: string): Promise<any> {
    this.checkInitialized();
    
    try {
      const response = await this.httpClient.post(
        `${this.baseUrl}rest/api/2/issue/${issueKey}/comment`,
        {
          body: comment
        },
        {
          ...this.authHeaders,
          'Content-Type': 'application/json'
        }
      );
      
      if (!response.ok) {
        throw new Error(`코멘트 추가 실패: ${response.statusCode} ${response.statusText}`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`코멘트 추가 중 오류 발생 (${issueKey}):`, error);
      throw error;
    }
  }
}