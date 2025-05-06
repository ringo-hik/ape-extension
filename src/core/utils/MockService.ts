/**
 * Mock 서비스 유틸리티
 * 외부망에서 내부망 서비스 테스트를 위한 Mock 데이터 제공
 */

import { LoggerService } from './LoggerService';

/**
 * Mock 응답 타입
 */
export interface MockResponse {
  status: number;
  headers: Record<string, string>;
  data: any;
}

/**
 * Mock 서비스 클래스
 */
export class MockService {
  private static _instance: MockService;
  private _logger: LoggerService;
  private _mockEnabled: boolean = false;
  private _mockData: Record<string, any> = {};
  
  /**
   * 생성자
   */
  private constructor() {
    this._logger = new LoggerService();
    this._mockEnabled = false;
  }
  
  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): MockService {
    if (!MockService._instance) {
      MockService._instance = new MockService();
    }
    return MockService._instance;
  }
  
  /**
   * Mock 모드 설정
   * @param enabled Mock 모드 활성화 여부
   */
  public setMockMode(enabled: boolean): void {
    this._mockEnabled = enabled;
    this._logger.info(`Mock 모드 ${enabled ? '활성화' : '비활성화'}`);
  }
  
  /**
   * Mock 데이터 설정
   * @param mockData Mock 데이터 객체
   */
  public setMockData(mockData: Record<string, any>): void {
    this._mockData = mockData || {};
    this._logger.info(`Mock 데이터 설정됨: ${Object.keys(this._mockData).length}개 항목`);
  }
  
  /**
   * Mock 응답 필요 여부 확인
   * @param url 요청 URL
   * @returns Mock 필요 여부
   */
  public shouldMock(url: string): boolean {
    if (!this._mockEnabled) {
      return false;
    }
    
    // Mock URL 패턴 확인 (mock:// 프로토콜)
    if (url.startsWith('mock://')) {
      return true;
    }
    
    // 내부망 도메인 패턴 확인
    const internalDomains = [
      'narrans.internal',
      'llama4.internal',
      'swdp.internal',
      'pocket.internal',
      'jira.internal',
      'nexus.internal'
    ];
    
    for (const domain of internalDomains) {
      if (url.includes(domain)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * URL에서 서비스 타입 추출
   * @param url 요청 URL
   * @returns 서비스 타입 문자열
   */
  private extractServiceType(url: string): string {
    // mock:// URL 처리
    if (url.startsWith('mock://')) {
      const mockPath = url.substring(7);
      const serviceName = mockPath.split('.')[0];
      return serviceName.toUpperCase();
    }
    
    // 도메인 기반 처리
    if (url.includes('narrans')) {
      return 'NARRANS';
    } else if (url.includes('llama4')) {
      return 'LLAMA4';
    } else if (url.includes('swdp')) {
      return 'SWDP';
    } else if (url.includes('pocket')) {
      return 'POCKET';
    } else if (url.includes('jira')) {
      return 'JIRA';
    } else if (url.includes('nexus')) {
      return 'NEXUS';
    }
    
    return 'UNKNOWN';
  }
  
  /**
   * Mock 응답 생성
   * @param url 요청 URL
   * @param method HTTP 메서드
   * @param data 요청 데이터
   * @returns Mock 응답
   */
  public getMockResponse(url: string, method: string, data?: any): MockResponse {
    const serviceType = this.extractServiceType(url);
    this._logger.info(`Mock 응답 생성: ${serviceType} (${method} ${url})`);
    
    // 기본 응답 헤더
    const headers = {
      'Content-Type': 'application/json',
      'X-Mock-Response': 'true',
      'X-Mock-Service': serviceType
    };
    
    // 서비스 타입에 따른 응답 생성
    let responseData: any;
    
    switch (serviceType) {
      case 'NARRANS':
        responseData = this._mockData.NARRANS_RESPONSE || this.getDefaultNarransResponse();
        break;
        
      case 'LLAMA4':
        responseData = this._mockData.LLAMA4_RESPONSE || this.getDefaultLlama4Response();
        break;
        
      case 'SWDP':
        responseData = this._mockData.SWDP_RESPONSE || this.getDefaultSwdpResponse();
        break;
        
      case 'POCKET':
        responseData = this._mockData.POCKET_RESPONSE || this.getDefaultPocketResponse();
        break;
        
      case 'JIRA':
        responseData = this._mockData.JIRA_RESPONSE || this.getDefaultJiraResponse();
        break;
        
      case 'NEXUS':
        responseData = this._mockData.NEXUS_RESPONSE || this.getDefaultNexusResponse();
        break;
        
      default:
        // 알 수 없는 서비스는 기본 Mock 응답 반환
        responseData = {
          status: 'success',
          message: 'Mock 응답 (알 수 없는 서비스)',
          data: null
        };
    }
    
    return {
      status: 200,
      headers,
      data: responseData
    };
  }
  
  /**
   * NARRANS 기본 Mock 응답
   */
  private getDefaultNarransResponse(): any {
    return {
      id: 'mock-narrans-response-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'narrans-mock',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '이것은 NARRANS API의 Mock 응답입니다. 실제 내부망 환경에서는 실제 API에 연결됩니다.'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    };
  }
  
  /**
   * Llama4 기본 Mock 응답
   */
  private getDefaultLlama4Response(): any {
    return {
      id: 'mock-llama4-response-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'llama-4-mock',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '이것은 Llama4 API의 Mock 응답입니다. 실제 내부망 환경에서는 실제 API에 연결됩니다.'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 15,
        completion_tokens: 25,
        total_tokens: 40
      }
    };
  }
  
  /**
   * SWDP 기본 Mock 응답
   */
  private getDefaultSwdpResponse(): any {
    return {
      success: true,
      status: 200,
      data: {
        project: {
          id: 'mock-project',
          name: 'Mock Project',
          description: 'Mock project for testing'
        },
        components: [
          { id: 'comp1', name: 'Component 1' },
          { id: 'comp2', name: 'Component 2' }
        ],
        message: 'SWDP API mock 응답입니다.'
      }
    };
  }
  
  /**
   * Pocket 기본 Mock 응답
   */
  private getDefaultPocketResponse(): any {
    return {
      success: true,
      status: 200,
      data: {
        files: [
          { name: 'document1.md', size: 1024, lastModified: '2025-05-01' },
          { name: 'document2.md', size: 2048, lastModified: '2025-05-02' },
          { name: 'document3.md', size: 3072, lastModified: '2025-05-03' }
        ],
        message: 'Pocket API mock 응답입니다.'
      }
    };
  }
  
  /**
   * Jira 기본 Mock 응답
   */
  private getDefaultJiraResponse(): any {
    return {
      success: true,
      status: 200,
      data: {
        issues: [
          { id: 'MOCK-1', summary: 'Mock Issue 1', status: 'Open' },
          { id: 'MOCK-2', summary: 'Mock Issue 2', status: 'In Progress' },
          { id: 'MOCK-3', summary: 'Mock Issue 3', status: 'Closed' }
        ],
        message: 'Jira API mock 응답입니다.'
      }
    };
  }
  
  /**
   * Nexus 기본 Mock 응답
   */
  private getDefaultNexusResponse(): any {
    return {
      success: true,
      status: 200,
      data: {
        packages: [
          { name: 'package1', version: '1.0.0' },
          { name: 'package2', version: '2.0.0' },
          { name: 'package3', version: '3.0.0' }
        ],
        message: 'Nexus API mock 응답입니다.'
      }
    };
  }
}

// 싱글톤 인스턴스 내보내기
export default MockService.getInstance();