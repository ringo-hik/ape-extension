/**
 * 모델 관리자 클래스
 * 모델 설정 로드, 관리, 검증 담당
 */
import * as vscode from 'vscode';
import { ModelConfig, ModelProvider } from '../../types/LlmTypes';

/**
 * 모델 관리자 클래스
 */
export class ModelManager {
  private models: Map<string, ModelConfig> = new Map();
  private defaultModelId: string = 'gemini-2.5-flash';
  private idCounter: number = 0;
  
  constructor() {
    this.initialize();
  }
  
  /**
   * 모델 관리자 초기화
   */
  public initialize(): void {
    try {
      // VS Code 설정에서 기본 모델 ID 로드
      const config = vscode.workspace.getConfiguration('ape.llm');
      this.defaultModelId = config.get<string>('defaultModel', 'gemini-2.5-flash');
      
      console.log(`ModelManager: 초기화 - 기본 모델 ID ${this.defaultModelId}`);
      
      // 모델 설정 로드
      this.loadModelsFromConfig();
    } catch (error) {
      console.error('ModelManager: 초기화 오류', error);
      // 오류 발생 시 기본값 유지
      this.loadDefaultModels();
    }
  }
  
  /**
   * 설정에서 모델 정보 로드
   */
  private loadModelsFromConfig(): ModelConfig[] {
    console.log('ModelManager: 모델 설정 로드 시작');
    try {
      const config = vscode.workspace.getConfiguration('ape.llm');
      const modelConfigs = config.get<Record<string, ModelConfig>>('models', {});
      
      console.log(`ModelManager: 설정에서 ${Object.keys(modelConfigs).length}개의 모델 구성 로드됨`);
      
      // 새로 로드하기 전에 기존 모델 맵 초기화
      this.models.clear();
      
      // 설정에서 모델 로드
      Object.entries(modelConfigs).forEach(([id, modelConfig]) => {
        console.log(`ModelManager: 모델 등록: ${id} (${modelConfig.name})`);
        this.models.set(id, this.validateModelConfig(id, modelConfig));
      });
      
      // 설정이 없는 경우 기본 모델 등록
      if (this.models.size === 0) {
        console.log('ModelManager: 등록된 모델이 없습니다. 기본 모델을 등록합니다.');
        this.loadDefaultModels();
      }
      
      // 모든 등록된 모델 로깅
      console.log('ModelManager: 등록된 모든 모델:');
      this.models.forEach((config, id) => {
        console.log(`- ${id}: ${config.name} (${config.provider})`);
      });
      
      console.log('ModelManager: 모델 설정 로드 완료');
      
      return Array.from(this.models.values());
    } catch (error) {
      console.error('ModelManager: 모델 로드 오류', error);
      this.loadDefaultModels();
      return Array.from(this.models.values());
    }
  }
  
  /**
   * 기본 모델 로드
   */
  private loadDefaultModels(): void {
    console.log('ModelManager: 기본 모델 로드');
    
    // 기본 시스템 프롬프트
    const defaultSystemPrompt = '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.';
    
    // 모델맵 초기화
    this.models.clear();
    
    // 환경 변수에서 외부망 모드인지 확인
    let isExternalMode = false;
    try {
      const envModule = require('../../../extension.env.js');
      isExternalMode = envModule.ENV_MODE === 'external';
      console.log(`ModelManager: ENV_MODE=${envModule.ENV_MODE}, isExternalMode=${isExternalMode}`);
    } catch (error) {
      console.log('ModelManager: 환경 변수 로드 실패, 기본 내부망 모드 사용');
    }
    
    if (isExternalMode) {
      // ===== 외부망 모드: OpenRouter Llama 4 Maverick 단독 모델 - 절대 삭제 금지 =====
      console.log('ModelManager: 외부망 모드 - 유일한 OpenRouter 모델(Llama 4 Maverick)만 등록');
      
      // ===== Llama 4 Maverick (OpenRouter) - 외부망 유일 모델, 절대 삭제 금지 =====
      this.models.set('openrouter-llama-4-maverick', {
        id: 'openrouter-llama-4-maverick',
        name: 'Llama 4 Maverick',
        provider: 'openrouter',
        apiModel: 'meta-llama/llama-4-maverick',
        contextWindow: 128000,
        maxTokens: 4096,
        temperature: 0.7,
        systemPrompt: defaultSystemPrompt
      });
      
      // 기본 모델 ID 변경
      this.defaultModelId = 'openrouter-llama-4-maverick';
    } else {
      // ===== 내부망 모드: NARRANS/Llama 모델 우선 =====
      
      // ===== NARRANS (내부망 기본 모델) =====
      this.models.set('narrans', {
        name: 'NARRANS (Default)',
        provider: 'custom',
        apiUrl: 'https://api-se-dev.narrans/v1/chat/completions',
        contextWindow: 10000,
        maxTokens: 10000,
        temperature: 0,
        systemPrompt: defaultSystemPrompt
      });
      
      // ===== Llama 4 Maverick (내부망 모델) =====
      this.models.set('llama-4-maverick', {
        name: 'Llama 4 Maverick',
        provider: 'custom',
        apiUrl: 'http://apigw-stg:8000/llama4/1/llama/aiserving/llama-4/maverick/v1/chat/completions',
        contextWindow: 50000,
        maxTokens: 50000,
        temperature: 0,
        systemPrompt: defaultSystemPrompt
      });
    }
    
    // ===== 로컬 시뮬레이션 모델 (항상 추가) =====
    this.models.set('local', {
      name: '로컬 시뮬레이션 (오프라인)',
      provider: 'local',
      temperature: 0.7,
      systemPrompt: defaultSystemPrompt
    });
    
    console.log(`ModelManager: 기본 모델 로드 완료 (${this.models.size}개)`);
  }
  
  /**
   * 모델 설정 유효성 검사 및 보완
   */
  private validateModelConfig(id: string, config: Partial<ModelConfig>): ModelConfig {
    // 필수 필드 확인 및 기본값 할당
    const validatedConfig: ModelConfig = {
      id: id,
      modelId: id,
      name: config.name || '알 수 없는 모델',
      provider: config.provider || 'local',
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      contextWindow: config.contextWindow,
      maxTokens: config.maxTokens,
      temperature: config.temperature ?? 0.7,
      systemPrompt: config.systemPrompt || '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.',
      apiModel: config.apiModel
    };
    
    return validatedConfig;
  }
  
  /**
   * 고유 ID 생성
   */
  public generateId(): string {
    this.idCounter++;
    return `llm-${Date.now()}-${this.idCounter}`;
  }
  
  /**
   * 패키지에서 모델 구성 로드
   */
  public loadModelsFromPackageJson(): ModelConfig[] {
    try {
      console.log('ModelManager: package.json에서 모델 구성 로드 시도');
      
      // 확장 컨텍스트 가져오기 (VSCode API 활용)
      const extensionId = 'ape-team.ape';
      const extension = vscode.extensions.getExtension(extensionId);
      
      if (!extension) {
        console.warn(`ModelManager: 확장 ID '${extensionId}'를 찾을 수 없습니다, 대체 방법 시도...`);
        
        // 대체 확장 ID로 시도
        const extensions = vscode.extensions.all;
        let foundExtension = null;
        
        for (const ext of extensions) {
          // 확장 ID가 'ape'를 포함하는지 확인
          if (ext.id.toLowerCase().includes('ape')) {
            foundExtension = ext;
            console.log(`ModelManager: 대체 확장 발견: ${ext.id}`);
            break;
          }
        }
        
        if (!foundExtension) {
          console.warn('ModelManager: 패키지 정보를 찾을 수 없습니다');
          return [];
        }
        
        // 찾은 확장의 packageJSON 사용
        return this.parseModelsFromPackageJson(foundExtension.packageJSON);
      }
      
      return this.parseModelsFromPackageJson(extension.packageJSON);
    } catch (error) {
      console.error('ModelManager: package.json에서 모델 로드 오류', error);
      return [];
    }
  }
  
  /**
   * 패키지 JSON에서 모델 구성 파싱
   */
  private parseModelsFromPackageJson(packageJson: any): ModelConfig[] {
    if (!packageJson || !packageJson.contributes) {
      console.warn('ModelManager: package.json에 contributes 섹션이 없습니다');
      return [];
    }
    
    // 모델 설정 추출
    const contributes = packageJson.contributes;
    const configurations = Array.isArray(contributes.configuration) 
      ? contributes.configuration 
      : [contributes.configuration];
    
    let modelsProperty = null;
    
    // 모든 구성에서 ape.llm.models 속성 찾기
    for (const config of configurations) {
      if (config && config.properties && config.properties['ape.llm.models']) {
        modelsProperty = config.properties['ape.llm.models'];
        break;
      }
    }
    
    if (!modelsProperty || !modelsProperty.default) {
      console.warn('ModelManager: ape.llm.models 구성을 찾을 수 없습니다');
      return [];
    }
    
    // 기본 모델 구성 가져오기
    const defaultModels = modelsProperty.default;
    const modelConfigs: ModelConfig[] = [];
    
    // 모델 추가
    console.log(`ModelManager: package.json에서 ${Object.keys(defaultModels).length}개의 모델 정의를 찾았습니다`);
    
    for (const [id, modelData] of Object.entries(defaultModels)) {
      // 모델 데이터 검증
      if (!modelData || typeof modelData !== 'object') {
        console.log(`ModelManager: 모델 ID ${id}: 유효하지 않은 모델 데이터 형식`);
        continue;
      }
      
      // TypeScript 타입 단언 추가
      const typedModelData = modelData as any;
      
      // 필수 속성 검증
      if (!typedModelData.name) {
        console.log(`ModelManager: 모델 ID ${id}: 필수 속성 'name'이 없음`);
        continue;
      }
      
      console.log(`ModelManager: 모델 추가 중: ${id} (${typedModelData.name}) - ${typedModelData.provider || 'local'}`);
      
      // ModelConfig 형식으로 변환하여 추가
      const modelConfig = this.validateModelConfig(id, {
        name: typedModelData.name,
        provider: typedModelData.provider || 'local',
        apiUrl: typedModelData.apiUrl,
        contextWindow: typedModelData.contextWindow,
        maxTokens: typedModelData.maxTokens,
        temperature: typedModelData.temperature || 0.7,
        apiModel: typedModelData.apiModel,
        systemPrompt: typedModelData.systemPrompt || '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      });
      
      // 모델 목록에 추가
      modelConfigs.push(modelConfig);
      
      // 이미 등록된 모델이 아니라면 모델 맵에도 추가
      if (!this.models.has(id)) {
        this.models.set(id, modelConfig);
      }
    }
    
    console.log(`ModelManager: package.json에서 ${modelConfigs.length}개의 모델 구성 추가 완료`);
    return modelConfigs;
  }
  
  /**
   * 예비용 폴백 모델 생성
   */
  public getFallbackModels(): ModelConfig[] {
    console.log('ModelManager: 비상용 폴백 모델 생성');
    
    try {
      const defaultSystemPrompt = '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.';
      const config = vscode.workspace.getConfiguration('ape.llm');
      // 설정 존재 여부 확인
      const modelsRaw = config.get('models');
      
      if (modelsRaw && typeof modelsRaw === 'object') {
        // 설정에서 모델 정보를 가져와 폴백 모델로 변환
        const models: ModelConfig[] = [];
        for (const [id, modelData] of Object.entries(modelsRaw)) {
          // null이나 undefined인 경우 방어 코드
          if (!modelData || typeof modelData !== 'object') continue;
          
          // 필수 필드 있는지 검증
          if (!modelData.name) continue;
          
          // ModelConfig 형식으로 변환
          models.push(this.validateModelConfig(id, modelData as Partial<ModelConfig>));
        }
        
        // 최소 하나 이상의 모델이 있으면 반환
        if (models.length > 0) {
          console.log(`ModelManager: 설정에서 ${models.length}개의 폴백 모델 로드됨`);
          return models;
        }
      }
    } catch (error) {
      console.error('ModelManager: 폴백 모델 로드 실패', error);
    }
    
    // 가장 기본적인 모델들 제공 (최후의 수단)
    return [
      {
        id: 'narrans',
        modelId: 'narrans',
        name: 'NARRANS (내부망)',
        provider: 'custom',
        temperature: 0.7,
        apiUrl: 'https://api-se-dev.narrans.samsungds.net/v1/chat/completions',
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      },
      {
        id: 'local-emergency',
        modelId: 'local-emergency',
        name: '오프라인 비상 모드',
        provider: 'local',
        temperature: 0.7,
        systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
      }
    ];
  }
  
  /**
   * 내부망 연결 가능 여부 확인
   */
  public canConnectToInternalNetwork(): boolean {
    try {
      console.log('ModelManager: 내부망 연결 확인 시작');
      
      // 환경 변수 모듈 로드
      let envModule: any = null;
      try {
        envModule = require('../../../extension.env.js');
        console.log('ModelManager: extension.env.js 로드 성공');
      } catch (envError) {
        console.log('ModelManager: extension.env.js 로드 실패, 기본 설정 사용');
      }

      // 1. extension.env.js에 명시적인 설정이 있으면 우선 적용 (최우선)
      if (envModule && envModule.INTERNAL_NETWORK === 'true') {
        console.log('ModelManager: 내부망 모드 - extension.env.js에서 설정됨 (true)');
        return true;
      } else if (envModule && envModule.INTERNAL_NETWORK === 'false') {
        console.log('ModelManager: 외부망 모드 - extension.env.js에서 설정됨 (false)');
        return false;
      }

      // 2. VS Code 설정에서 강제 내부망 설정 확인
      const forceInternalNetwork = vscode.workspace.getConfiguration('ape.core')
        .get<boolean>('forceInternalNetwork', false);
      
      if (forceInternalNetwork) {
        console.log('ModelManager: 설정에 의해 내부망 모드 강제 적용됨');
        return true;
      }
      
      // 3. 플랫폼 기반 판단 (마지막 방법)
      if (process.platform === 'win32') {
        console.log('ModelManager: Windows 환경에서 실행 중 - 내부망 환경으로 감지');
        return true;
      }
      
      // 4. 기본값: 내부망 우선 (특수 조건 없으면 내부망으로 가정)
      console.log('ModelManager: 기본값으로 내부망 모드 사용');
      return true;
    } catch (error) {
      console.error('ModelManager: 내부망 확인 오류', error);
      // 오류 발생시 안전하게 내부망으로 처리
      return true;
    }
  }
  
  /**
   * 모든 모델 설정 가져오기
   */
  public getAllModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }
  
  /**
   * 기본 모델 ID 가져오기
   */
  public getDefaultModelId(): string {
    // 모델이 실제로 등록되어 있는지 확인
    if (!this.models.has(this.defaultModelId)) {
      console.warn(`ModelManager: 주의 - 기본 모델 ID '${this.defaultModelId}'가 등록된 모델 목록에 없습니다.`);
      
      // 대체 모델 사용: 등록된 첫 번째 모델 또는 'local'
      if (this.models.size > 0) {
        const fallbackModel = Array.from(this.models.keys())[0];
        console.log(`ModelManager: 대체 모델 ID로 '${fallbackModel}'를 사용합니다.`);
        return fallbackModel;
      } else {
        console.log(`ModelManager: 등록된 모델이 없어 'local' 모델을 사용합니다.`);
        // 최후의 수단: local 모델 등록 및 사용
        this.models.set('local', {
          id: 'local',
          modelId: 'local',
          name: '로컬 시뮬레이션 (오프라인)',
          provider: 'local',
          temperature: 0.7,
          maxTokens: 500,
          systemPrompt: '당신은 코딩과 개발을 도와주는 유능한 AI 어시스턴트입니다.'
        });
        return 'local';
      }
    }
    
    return this.defaultModelId;
  }
  
  /**
   * 특정 모델 설정 가져오기
   */
  public getModelConfig(modelId: string): ModelConfig | undefined {
    return this.models.get(modelId);
  }
  
  /**
   * 모델 설정 업데이트
   */
  public updateDefaultModel(modelId: string): boolean {
    try {
      if (!this.models.has(modelId)) {
        console.warn(`ModelManager: 요청된 모델 ID '${modelId}'가 등록되지 않았습니다.`);
        return false;
      }
      
      this.defaultModelId = modelId;
      
      // VS Code 설정에도 저장
      vscode.workspace.getConfiguration('ape.llm').update(
        'defaultModel', 
        modelId, 
        vscode.ConfigurationTarget.Global
      );
      
      console.log(`ModelManager: 기본 모델이 '${modelId}'로 업데이트되었습니다.`);
      return true;
    } catch (error) {
      console.error('ModelManager: 기본 모델 업데이트 오류', error);
      return false;
    }
  }
}