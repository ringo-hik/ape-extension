/**
 * APE 의존성 주입 컨테이너
 *
 * 싱글톤 패턴 대신 사용할 의존성 주입 컨테이너
 * 서비스 간 의존성 관리 및 결합도 감소가 목적
 */

/**
 * 서비스 제공자 인터페이스
 * 지연 초기화를 위한 팩토리 함수 타입
 */
export type ServiceProvider<T> = () => T;

/**
 * 서비스 등록 옵션
 */
export interface ServiceOptions {
  /**
   * 싱글톤 여부 (기본값: true)
   * true: 한 번만 생성되고 이후 동일 인스턴스 재사용
   * false: 매번 새 인스턴스 생성
   */
  singleton?: boolean;
}

/**
 * 의존성 주입 컨테이너 클래스
 */
export class DIContainer {
  private static instance: DIContainer;
  
  
  private services: Map<string, any> = new Map();
  
  
  private providers: Map<string, ServiceProvider<any>> = new Map();
  
  
  private options: Map<string, ServiceOptions> = new Map();

  /**
   * 싱글톤 인스턴스 반환
   * @returns DIContainer 싱글톤 인스턴스
   */
  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * 생성자 - 직접 호출 방지를 위해 private 지정
   */
  private constructor() {}

  /**
   * 인스턴스 등록
   * @param id 서비스 ID
   * @param instance 서비스 인스턴스
   */
  public register<T>(id: string, instance: T): void {
    this.services.set(id, instance);
  }

  /**
   * 서비스 제공자 등록
   * @param id 서비스 ID
   * @param provider 서비스 제공자 (팩토리 함수)
   * @param options 서비스 옵션
   */
  public registerProvider<T>(
    id: string, 
    provider: ServiceProvider<T>, 
    options: ServiceOptions = { singleton: true }
  ): void {
    this.providers.set(id, provider);
    this.options.set(id, options);
  }

  /**
   * 서비스 인스턴스 반환
   * @param id 서비스 ID
   * @returns 서비스 인스턴스
   */
  public get<T>(id: string): T {
    
    if (this.services.has(id)) {
      return this.services.get(id) as T;
    }

    
    if (this.providers.has(id)) {
      const provider = this.providers.get(id)!;
      const options = this.options.get(id) || { singleton: true };
      
      
      const instance = provider();
      
      
      if (options.singleton) {
        this.services.set(id, instance);
      }
      
      return instance as T;
    }

    throw new Error(`서비스가 등록되지 않음: ${id}`);
  }

  /**
   * 서비스 인스턴스 존재 여부 확인
   * @param id 서비스 ID
   * @returns 존재 여부
   */
  public has(id: string): boolean {
    return this.services.has(id) || this.providers.has(id);
  }

  /**
   * 등록된 모든 서비스 ID 목록 반환
   * @returns 서비스 ID 배열
   */
  public getRegisteredServices(): string[] {
    return [
      ...Array.from(this.services.keys()),
      ...Array.from(this.providers.keys()).filter(id => !this.services.has(id))
    ];
  }

  /**
   * 서비스 등록 해제
   * @param id 서비스 ID
   */
  public unregister(id: string): void {
    this.services.delete(id);
    this.providers.delete(id);
    this.options.delete(id);
  }

  /**
   * 모든 서비스 등록 해제
   */
  public clear(): void {
    this.services.clear();
    this.providers.clear();
    this.options.clear();
  }
}

/**
 * 전역 컨테이너 인스턴스 익스포트
 */
export const container = DIContainer.getInstance();