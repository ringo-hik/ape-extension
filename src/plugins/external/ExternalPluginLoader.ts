import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PluginRegistryService } from '../../core/plugin-system/PluginRegistryService';
import { ConfigService } from '../../core/config/ConfigService';
import { PluginType } from '../../types/PluginTypes';
import { DynamicPluginService } from './DynamicPluginService';
import { HttpClientService } from '../../core/http/HttpClientService';

/**
 * 외부 플러그인 로더
 * 설정에서 플러그인 로드 및 관리를 담당하는 클래스
 */
export class ExternalPluginLoader {
  /**
   * 플러그인 레지스트리
   */
  private _pluginRegistry: PluginRegistryService;
  
  /**
   * 설정 서비스
   */
  private _configService: ConfigService;
  
  /**
   * HTTP 클라이언트
   */
  private _httpClient: HttpClientService;
  
  /**
   * 플러그인 디렉토리 경로
   */
  private _pluginsDir?: string;
  
  /**
   * ExternalPluginLoader 생성자
   * @param pluginRegistry 플러그인 레지스트리
   * @param configService 설정 서비스
   * @param httpClient HTTP 클라이언트
   */
  constructor(
    pluginRegistry: PluginRegistryService,
    configService: ConfigService,
    httpClient: HttpClientService
  ) {
    this._pluginRegistry = pluginRegistry;
    this._configService = configService;
    this._httpClient = httpClient;
    
    
    this._setupPluginsDirectory();
  }
  
  /**
   * 플러그인 디렉토리 설정
   */
  private _setupPluginsDirectory(): void {
    try {
      
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        
        
        this._pluginsDir = path.join(workspaceRoot, '.ape', 'plugins');
        
        
        if (!fs.existsSync(this._pluginsDir)) {
          
          fs.mkdirSync(this._pluginsDir, { recursive: true });
        }
      }
    } catch (error) {
      console.warn('플러그인 디렉토리 설정 중 오류 발생:', error);
    }
  }
  
  /**
   * 외부 플러그인 로드
   * @returns 로드된 플러그인 수
   */
  public async loadExternalPlugins(): Promise<number> {
    try {
      
      const existingPlugins = this._pluginRegistry.getExternalPlugins();
      for (const plugin of existingPlugins) {
        this._pluginRegistry.unregisterPlugin(plugin.id, PluginType.EXTERNAL);
      }
      
      
      const pluginsConfig = this._configService.getPluginConfig();
      if (!pluginsConfig) {
        console.log('외부 플러그인 설정을 찾을 수 없습니다');
        return 0;
      }
      
      
      const typedPluginsConfig = pluginsConfig as Record<string, any>;

      let loadedCount = 0;
      
      
      const globalConfig = typedPluginsConfig.global || {};

      
      await this._loadPluginsFromConfig(typedPluginsConfig, globalConfig);
      
      
      if (this._pluginsDir && fs.existsSync(this._pluginsDir)) {
        await this._loadPluginsFromDirectory();
      }
      
      
      loadedCount = this._pluginRegistry.getExternalPlugins().length;
      
      console.log(`외부 플러그인 로드 완료: ${loadedCount}개 플러그인`);
      return loadedCount;
    } catch (error) {
      console.error('외부 플러그인 로드 중 오류 발생:', error);
      return 0;
    }
  }
  
  /**
   * 설정에서 플러그인 로드
   * @param config 플러그인 설정
   * @param globalConfig 전역 설정
   */
  private async _loadPluginsFromConfig(config: Record<string, any>, globalConfig: Record<string, any>): Promise<void> {
    try {
      
      for (const [pluginId, pluginConfig] of Object.entries(config.plugins || {})) {
        try {
          await this._loadSinglePlugin(pluginId, pluginConfig as Record<string, any>, globalConfig);
        } catch (error) {
          console.error(`설정에서 플러그인 로드 오류 (${pluginId}):`, error);
        }
      }
    } catch (error) {
      console.error('설정에서 플러그인 로드 중 오류 발생:', error);
    }
  }
  
  /**
   * 디렉토리에서 플러그인 로드
   */
  private async _loadPluginsFromDirectory(): Promise<void> {
    try {
      if (!this._pluginsDir) return;
      
      
      const items = fs.readdirSync(this._pluginsDir);
      
      for (const item of items) {
        try {
          const itemPath = path.join(this._pluginsDir, item);
          const stat = fs.statSync(itemPath);
          
          
          if (stat.isDirectory()) {
            
            const configPath = path.join(itemPath, 'plugin.json');
            
            
            if (fs.existsSync(configPath)) {
              try {
                
                const configContent = fs.readFileSync(configPath, 'utf8');
                const pluginConfig = JSON.parse(configContent);
                
                
                const pluginId = pluginConfig.id || item;
                
                
                await this._loadSinglePlugin(pluginId, pluginConfig, {});
              } catch (error) {
                console.error(`플러그인 설정 파일 로드 오류 (${item}):`, error);
              }
            }
          }
        } catch (error) {
          console.error(`디렉토리에서 플러그인 로드 오류 (${item}):`, error);
        }
      }
    } catch (error) {
      console.error('디렉토리에서 플러그인 로드 중 오류 발생:', error);
    }
  }
  
  /**
   * 단일 플러그인 로드
   * @param pluginId 플러그인 ID
   * @param pluginConfig 플러그인 설정
   * @param globalConfig 전역 설정
   * @returns 성공 여부
   */
  private async _loadSinglePlugin(pluginId: string, pluginConfig: Record<string, any>, globalConfig: Record<string, any>): Promise<boolean> {
    try {
      
      if (pluginConfig.enabled === false) {
        console.log(`플러그인 비활성화됨: ${pluginId}`);
        return false;
      }
      
      
      const mergedConfig = { ...globalConfig, ...pluginConfig };
      
      
      const commands = (mergedConfig.commands || []).map((cmd: any) => {
        
        if (cmd.api && cmd.api.endpoint && !cmd.api.endpoint.startsWith('http')) {
          cmd.api.endpoint = `${mergedConfig.base_url || ''}${cmd.api.endpoint}`;
        }
        
        
        if (cmd.api && mergedConfig.api_key && cmd.api.headers) {
          if (!cmd.api.headers['X-API-Key'] && !cmd.api.headers['x-api-key']) {
            cmd.api.headers['X-API-Key'] = mergedConfig.api_key;
          }
        }
        
        return cmd;
      });
      
      
      const dynamicPlugin = new DynamicPluginService(
        pluginId,
        mergedConfig.name || pluginId,
        mergedConfig.description || '',
        commands,
        this._httpClient
      );
      
      
      const registered = this._pluginRegistry.registerPlugin(
        dynamicPlugin,
        PluginType.EXTERNAL
      );
      
      if (registered) {
        console.log(`외부 플러그인 로드됨: ${pluginId} (명령어 ${commands.length}개)`);
        
        
        await dynamicPlugin.initialize();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`플러그인 로드 오류 (${pluginId}):`, error);
      return false;
    }
  }
  
  /**
   * 플러그인 유효성 검사
   * @param pluginConfig 플러그인 설정
   * @returns 유효성 여부 및 오류 메시지
   */
  private _validatePlugin(pluginConfig: Record<string, any>): { valid: boolean, error?: string } {
    
    if (!pluginConfig.id) {
      return { valid: false, error: '플러그인 ID가 필요합니다' };
    }
    
    
    if (!pluginConfig.commands || !Array.isArray(pluginConfig.commands) || pluginConfig.commands.length === 0) {
      return { valid: false, error: '플러그인에 명령어가 없습니다' };
    }
    
    
    const validCommands = pluginConfig.commands.filter((cmd: any) => 
      cmd && cmd.id && ((cmd.api && cmd.api.endpoint) || cmd.handler)
    );
    
    if (validCommands.length === 0) {
      return { valid: false, error: '유효한 명령어가 없습니다' };
    }
    
    return { valid: true };
  }

  /**
   * 외부 플러그인 다시 로드
   * @returns 로드된 플러그인 수
   */
  public async reloadExternalPlugins(): Promise<number> {
    try {
      console.log('외부 플러그인 다시 로드 중...');
      
      
      await this._configService.reload();
      
      
      return this.loadExternalPlugins();
    } catch (error) {
      console.error('외부 플러그인 다시 로드 중 오류 발생:', error);
      return 0;
    }
  }
  
  /**
   * 단일 플러그인 다시 로드
   * @param pluginId 플러그인 ID
   * @returns 성공 여부
   */
  public async reloadSinglePlugin(pluginId: string): Promise<boolean> {
    try {
      console.log(`플러그인 다시 로드 중: ${pluginId}`);
      
      
      const existingPlugin = this._pluginRegistry.getPlugin(pluginId);
      if (existingPlugin) {
        this._pluginRegistry.unregisterPlugin(pluginId, PluginType.EXTERNAL);
      }
      
      
      const pluginsConfig = this._configService.getPluginConfig();
      if (!pluginsConfig) {
        console.log('외부 플러그인 설정을 찾을 수 없습니다');
        return false;
      }
      
      
      const typedPluginsConfig = pluginsConfig as Record<string, any>;
      const pluginConfig = typedPluginsConfig.plugins?.[pluginId];
      
      if (!pluginConfig) {
        console.log(`플러그인 설정 없음: ${pluginId}`);
        return false;
      }
      
      
      const globalConfig = typedPluginsConfig.global || {};
      
      
      const result = await this._loadSinglePlugin(pluginId, pluginConfig, globalConfig);
      
      if (result) {
        console.log(`플러그인 다시 로드 완료: ${pluginId}`);
      }
      
      return result;
    } catch (error) {
      console.error(`플러그인 다시 로드 중 오류 발생 (${pluginId}):`, error);
      return false;
    }
  }
  
  /**
   * 플러그인 설치
   * @param pluginPath 플러그인 패키지 경로
   * @returns 성공 여부
   */
  public async installPlugin(pluginPath: string): Promise<boolean> {
    try {
      
      if (!this._pluginsDir) {
        this._setupPluginsDirectory();
        
        if (!this._pluginsDir) {
          throw new Error('플러그인 디렉토리를 설정할 수 없습니다');
        }
      }
      
      
      if (!fs.existsSync(pluginPath)) {
        throw new Error(`플러그인 패키지를 찾을 수 없습니다: ${pluginPath}`);
      }
      
      
      
      
      await this.reloadExternalPlugins();
      
      return true;
    } catch (error) {
      console.error('플러그인 설치 중 오류 발생:', error);
      return false;
    }
  }
  
  /**
   * 플러그인 삭제
   * @param pluginId 플러그인 ID
   * @returns 성공 여부
   */
  public async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      
      if (!this._pluginsDir) {
        throw new Error('플러그인 디렉토리가 설정되지 않았습니다');
      }
      
      
      const pluginDir = path.join(this._pluginsDir, pluginId);
      
      
      if (fs.existsSync(pluginDir)) {
        
        fs.rmdirSync(pluginDir, { recursive: true });
      }
      
      
      const existingPlugin = this._pluginRegistry.getPlugin(pluginId);
      if (existingPlugin) {
        this._pluginRegistry.unregisterPlugin(pluginId, PluginType.EXTERNAL);
      }
      
      
      const pluginsConfig = this._configService.getPluginConfig();
      if (pluginsConfig && typeof pluginsConfig === 'object' && 'plugins' in pluginsConfig) {
        const typedConfig = pluginsConfig as Record<string, any>;
        const plugins = typedConfig.plugins || {};
        
        
        if (pluginId in plugins) {
          delete plugins[pluginId];
          
          
          await this._configService.updatePluginConfig(typedConfig);
        }
      }
      
      return true;
    } catch (error) {
      console.error('플러그인 삭제 중 오류 발생:', error);
      return false;
    }
  }
}