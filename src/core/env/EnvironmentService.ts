/**
 * EnvironmentService - 내부망/외부망 환경 설정 서비스
 * 
 * 이 서비스는 APE 익스텐션의 내부망/외부망 환경 설정을 관리합니다.
 * 환경에 따른 서비스 URL, API 키 등을 추상화하여 제공합니다.
 */

export class EnvironmentService {
  private static instance: EnvironmentService;
  private config: any;
  private envType: 'internal' | 'external';
  
  private constructor() {
    this.loadConfig();
    this.envType = this.config.ENV_MODE === 'internal' ? 'internal' : 'external';
  }
  
  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }
  
  /**
   * 환경 설정 로드
   */
  private loadConfig() {
    try {
      // 빌드 시 선택된 환경 설정 파일 로드
      this.config = require('../../../extension.env.js');
      console.log(`환경 설정 로드됨 - 모드: ${this.config.ENV_MODE || 'external'}`);
    } catch (e) {
      console.error('환경 설정 로드 실패', e);
      this.config = { ENV_MODE: 'external' };
    }
  }
  
  /**
   * 서비스 엔드포인트 URL 반환
   */
  public getEndpoint(serviceName: string): string {
    return this.config[`${serviceName.toUpperCase()}_ENDPOINT`] || '';
  }
  
  /**
   * API 키 반환
   */
  public getApiKey(serviceName: string): string {
    return this.config[`${serviceName.toUpperCase()}_API_KEY`] || '';
  }
  
  /**
   * 내부망 환경 여부 확인
   */
  public isInternalNetwork(): boolean {
    return this.envType === 'internal';
  }
  
  /**
   * 외부망 환경 여부 확인
   */
  public isExternalNetwork(): boolean {
    return this.envType === 'external';
  }
  
  /**
   * 현재 환경 타입 반환
   */
  public getEnvironmentType(): 'internal' | 'external' {
    return this.envType;
  }
  
  /**
   * 모킹 사용 여부 확인
   */
  public shouldUseMock(serviceName: string): boolean {
    if (this.isInternalNetwork()) {
      return false;
    }
    
    // 외부망에서는 특정 서비스에 대한 모킹 설정 확인
    const mockConfigKey = `MOCK_${serviceName.toUpperCase()}_ENABLED`;
    return this.config[mockConfigKey] === 'true';
  }
  
  /**
   * 특정 서비스가 현재 환경에서 사용 가능한지 확인
   */
  public isServiceAvailable(serviceName: string): boolean {
    if (this.isInternalNetwork()) {
      // 내부망에서는 모든 서비스 사용 가능
      return true;
    }
    
    // 외부망에서는 특정 서비스만 사용 가능 또는 모킹 설정 확인
    switch (serviceName.toLowerCase()) {
      case 'openrouter':
        return !!this.config.OPENROUTER_API_KEY;
      case 'swdp':
      case 'jira':
      case 'narrans':
      case 'llama4':
        return this.shouldUseMock(serviceName);
      default:
        return false;
    }
  }
  
  /**
   * 환경에 맞는 LLM 모델 ID 반환
   */
  public getEnvironmentCompatibleModel(modelId: string): string {
    // 내부망 환경인 경우 원래 모델 ID 그대로 사용
    if (this.isInternalNetwork()) {
      return modelId;
    }
    
    // 외부망일 경우 내부망 전용 모델을 OpenRouter 호환 모델로 매핑
    switch (modelId) {
      case 'llama-4-maverick':
        return 'meta-llama/llama-3-70b-instruct';
      case 'llama-4-scout':
        return 'meta-llama/llama-3-8b-instruct';
      case 'narrans':
        return 'anthropic/claude-3-5-sonnet';
      default:
        return modelId;
    }
  }
}