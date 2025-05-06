import * as vscode from 'vscode';
import { ConfigService } from '../core/config';
import { VSCodeService } from '../core/vscode';
import path from 'path';
import fs from 'fs';

/**
 * Provider class for displaying and managing APE settings in a webview
 */
export class ApeSettingsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ape.settingsView';

  private _view?: vscode.WebviewView;
  private _configService: ConfigService;
  private _vscodeService: VSCodeService;
  private _extensionUri: vscode.Uri;
  private _vsCodeConfig: vscode.WorkspaceConfiguration;

  /**
   * Constructor for ApeSettingsViewProvider
   * 
   * @param extensionUri The URI of the extension
   * @param configService The configuration service
   * @param vscodeService The VS Code service
   */
  constructor(
    extensionUri: vscode.Uri,
    configService: ConfigService,
    vscodeService: VSCodeService
  ) {
    this._extensionUri = extensionUri;
    this._configService = configService;
    this._vscodeService = vscodeService;
    this._vsCodeConfig = vscode.workspace.getConfiguration('ape');
  }

  /**
   * Resolves the webview view
   * 
   * @param webviewView The webview view to resolve
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    
    webviewView.webview.onDidReceiveMessage(async (message) => {
      await this._handleWebviewMessage(message);
    });
  }
  
  /**
   * Handles messages from any webview (panel or view)
   * 
   * @param message The message from the webview
   */
  public async _handleWebviewMessage(message: any): Promise<void> {
    switch (message.command) {
      case 'saveUserInfo':
        await this._handleSaveUserInfo(message.userInfo);
        break;
      case 'savePluginSettings':
        await this._handleSavePluginSettings(message.pluginSettings);
        break;
      case 'saveApiEndpoints':
        await this._handleSaveApiEndpoints(message.apiEndpoints);
        break;
      case 'saveLlmSettings':
        await this._handleSaveLlmSettings(message.llmSettings);
        break;
      case 'saveModels':
        await this._handleSaveModels(message.models);
        break;
      case 'getSettings':
        if (this._view) {
          await this._sendCurrentSettings();
        }
        break;
      case 'addPlugin':
        await this._handleAddPlugin(message.pluginInfo);
        break;
      case 'removePlugin':
        await this._handleRemovePlugin(message.pluginId);
        break;
    }
  }

  /**
   * Gets the current settings and sends them to the webview
   * 
   * @param webview Optional webview to send settings to (if not the view)
   */
  public async _sendCurrentSettings(webview?: vscode.Webview) {
    
    const targetWebview = webview || (this._view ? this._view.webview : undefined);
    
    if (!targetWebview) {
      return;
    }

    
    this._vsCodeConfig = vscode.workspace.getConfiguration('ape');
    
    
    const config = this._configService.getAppConfig();
    
    
    const userInfo = {
      displayName: config['user'] ? config['user']['displayName'] || '' : '',
      email: config['user'] ? config['user']['email'] || '' : '',
      gitUsername: config['git'] ? config['git']['username'] || '' : '', 
      gitEmail: config['git'] ? config['git']['email'] || '' : '',
      swdpUsername: config['swdp'] ? config['swdp']['username'] || '' : '',
      swdpTeam: config['swdp'] ? config['swdp']['team'] || '' : ''
    };
    
    
    const plugins = config['plugins'] || [];
    
    
    const apiEndpoints = {
      llmEndpoint: config['endpoints'] ? config['endpoints']['llm'] || '' : '',
      gitApiEndpoint: config['endpoints'] ? config['endpoints']['git'] || '' : '',
      jiraApiEndpoint: config['endpoints'] ? config['endpoints']['jira'] || '' : '',
      swdpApiEndpoint: this._vsCodeConfig.get('swdp.baseUrl') || 'http://localhost:8080',
      pocketApiEndpoint: config['endpoints'] ? config['endpoints']['pocket'] || '' : ''
    };
    
    
    const llmSettings = {
      defaultModel: this._vsCodeConfig.get('llm.defaultModel') || 'gemini-2.5-flash',
      openRouterApiKey: this._vsCodeConfig.get('llm.openrouterApiKey') || '',
      supportsStreaming: this._vsCodeConfig.get('llm.supportsStreaming') || true,
      temperature: 0.7,
      maxTokens: 4000
    };
    
    
    const availableModels = this._vsCodeConfig.get('llm.models') || {};
    console.log('Available models:', availableModels);
    
    
    targetWebview.postMessage({
      command: 'updateSettings',
      settings: {
        userInfo: userInfo,
        pluginSettings: plugins,
        apiEndpoints: apiEndpoints,
        llmSettings: llmSettings,
        availableModels: availableModels,
        coreSettings: {
          sslBypass: this._vsCodeConfig.get('core.sslBypass') || false,
          logLevel: this._vsCodeConfig.get('core.logLevel') || 'info',
          allowAll: this._vsCodeConfig.get('core.allow.all') || true
        },
        swdpSettings: {
          enabled: this._vsCodeConfig.get('swdp.enabled') || true,
          baseUrl: this._vsCodeConfig.get('swdp.baseUrl') || 'http://localhost:8080',
          defaultProject: this._vsCodeConfig.get('swdp.defaultProject') || ''
        }
      }
    });
  }

  /**
   * Handles saving user information
   * 
   * @param userInfo The user information to save
   */
  private async _handleSaveUserInfo(userInfo: any) {
    
    await this._configService.updateConfig('app', {
      user: {
        displayName: userInfo.displayName,
        email: userInfo.email
      },
      git: {
        username: userInfo.gitUsername,
        email: userInfo.gitEmail
      },
      swdp: {
        username: userInfo.swdpUsername,
        team: userInfo.swdpTeam
      }
    });

    
    this._vscodeService.showInformationMessage('User information saved');
  }

  /**
   * Handles saving plugin settings
   * 
   * @param pluginSettings The plugin settings to save
   */
  private async _handleSavePluginSettings(pluginSettings: any) {
    
    await this._configService.updateConfig('app', {
      plugins: pluginSettings
    });

    
    this._vscodeService.showInformationMessage('Plugin settings saved');
  }

  /**
   * Handles saving API endpoints
   * 
   * @param apiEndpoints The API endpoints to save
   */
  private async _handleSaveApiEndpoints(apiEndpoints: any) {
    try {
      
      await this._vsCodeConfig.update('swdp.baseUrl', apiEndpoints.swdpApiEndpoint, vscode.ConfigurationTarget.Global);
      
      
      await this._configService.updateConfig('app', {
        endpoints: {
          llm: apiEndpoints.llmEndpoint,
          git: apiEndpoints.gitApiEndpoint,
          jira: apiEndpoints.jiraApiEndpoint,
          pocket: apiEndpoints.pocketApiEndpoint
        }
      });

      
      this._vscodeService.showInformationMessage('API 엔드포인트가 저장되었습니다');
    } catch (error) {
      console.error('API 엔드포인트 저장 중 오류 발생:', error);
      this._vscodeService.showErrorMessage(`API 엔드포인트 저장 실패: ${error.message || '알 수 없는 오류'}`);
    }
  }

  /**
   * Handles saving LLM settings
   * 
   * @param llmSettings The LLM settings to save
   */
  private async _handleSaveLlmSettings(llmSettings: any) {
    try {
      
      await this._vsCodeConfig.update('llm.defaultModel', llmSettings.defaultModel, vscode.ConfigurationTarget.Global);
      await this._vsCodeConfig.update('llm.openrouterApiKey', llmSettings.openRouterApiKey, vscode.ConfigurationTarget.Global);
      await this._vsCodeConfig.update('llm.supportsStreaming', llmSettings.supportsStreaming, vscode.ConfigurationTarget.Global);
      
      
      await this._configService.updateConfig('app', {
        llm: {
          temperature: llmSettings.temperature,
          maxTokens: llmSettings.maxTokens
        }
      });
      
      
      this._vscodeService.showInformationMessage('LLM 설정이 저장되었습니다');
    } catch (error) {
      console.error('LLM 설정 저장 중 오류 발생:', error);
      this._vscodeService.showErrorMessage(`LLM 설정 저장 실패: ${error.message || '알 수 없는 오류'}`);
    }
  }

  /**
   * Handles saving LLM models
   * 
   * @param models The models to save
   */
  private async _handleSaveModels(models: any) {
    try {
      
      await this._vsCodeConfig.update('llm.models', models, vscode.ConfigurationTarget.Global);
      
      
      this._vscodeService.showInformationMessage('모델 설정이 저장되었습니다');
      
      
      await this._sendCurrentSettings();
    } catch (error) {
      console.error('모델 설정 저장 중 오류 발생:', error);
      this._vscodeService.showErrorMessage(`모델 설정 저장 실패: ${error.message || '알 수 없는 오류'}`);
    }
  }
  
  /**
   * Handles adding a new plugin
   * 
   * @param pluginInfo The plugin information
   */
  private async _handleAddPlugin(pluginInfo: any) {
    const config = this._configService.getAppConfig();
    const currentPlugins = config.plugins || [];
    
    
    currentPlugins.push({
      id: pluginInfo.id,
      name: pluginInfo.name,
      type: pluginInfo.type,
      enabled: true,
      settings: pluginInfo.settings || {}
    });
    
    
    await this._configService.updateConfig('app', {
      plugins: currentPlugins
    });
    
    
    await this._sendCurrentSettings();
    
    
    this._vscodeService.showInformationMessage(`Plugin ${pluginInfo.name} added`);
  }

  /**
   * Handles removing a plugin
   * 
   * @param pluginId The ID of the plugin to remove
   */
  private async _handleRemovePlugin(pluginId: string) {
    const config = this._configService.getAppConfig();
    let currentPlugins = config.plugins || [];
    
    
    currentPlugins = currentPlugins.filter(plugin => plugin.id !== pluginId);
    
    
    await this._configService.updateConfig('app', {
      plugins: currentPlugins
    });
    
    
    await this._sendCurrentSettings();
    
    
    this._vscodeService.showInformationMessage(`Plugin removed`);
  }

  /**
   * Gets the HTML for the webview
   * 
   * @param webview The webview
   * @returns The HTML string
   */
  public _getHtmlForWebview(webview: vscode.Webview): string {
    
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'resources', 'css', 'ape-ui.css')
    );

    
    let cssContent = '';
    try {
      const cssPath = path.join(this._extensionUri.fsPath, 'resources', 'css', 'ape-ui.css');
      cssContent = fs.readFileSync(cssPath, 'utf8');
    } catch (error) {
      console.error('Error reading CSS file:', error);
    }

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>APE Settings</title>
        <link href="${cssUri}" rel="stylesheet">
        <style>
            body {
                padding: 0;
                color: var(--vscode-foreground);
                font-size: var(--vscode-font-size);
                font-weight: var(--vscode-font-weight);
                font-family: var(--vscode-font-family);
                background-color: var(--vscode-editor-background);
            }
            
            .settings-container {
                padding: 10px;
            }
            
            .tab-container {
                display: flex;
                border-bottom: 1px solid var(--vscode-panel-border);
                margin-bottom: 15px;
            }
            
            .tab {
                padding: 8px 12px;
                cursor: pointer;
                border: none;
                background: none;
                color: var(--vscode-foreground);
                opacity: 0.7;
                font-size: 13px;
            }
            
            .tab.active {
                opacity: 1;
                border-bottom: 2px solid var(--vscode-button-background);
                font-weight: bold;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
            }
            
            input[type="text"],
            input[type="email"],
            input[type="password"],
            input[type="number"],
            select,
            textarea {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border-radius: 2px;
            }
            
            input:focus,
            select:focus,
            textarea:focus {
                outline: 1px solid var(--vscode-focusBorder);
            }
            
            button {
                padding: 6px 12px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 2px;
                cursor: pointer;
                margin-right: 5px;
            }
            
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            .button-container {
                display: flex;
                justify-content: flex-end;
                margin-top: 15px;
            }
            
            .section-title {
                font-size: 14px;
                font-weight: 600;
                margin: 15px 0 10px 0;
                padding-bottom: 5px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            
            .plugin-list {
                margin-top: 10px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 3px;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .plugin-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 10px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            
            .plugin-item:last-child {
                border-bottom: none;
            }
            
            .plugin-info {
                display: flex;
                flex-direction: column;
            }
            
            .plugin-name {
                font-weight: 500;
            }
            
            .plugin-type {
                font-size: 12px;
                opacity: 0.8;
            }
            
            .plugin-actions {
                display: flex;
            }
            
            .plugin-toggle {
                margin-right: 8px;
                cursor: pointer;
            }
            
            .remove-plugin {
                color: var(--vscode-errorForeground);
                cursor: pointer;
                background: none;
                border: none;
                padding: 2px 4px;
                font-size: 12px;
            }
            
            .add-plugin-form {
                margin-top: 10px;
                padding: 10px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 3px;
                background-color: var(--vscode-editor-background);
            }
            
            .two-column {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            .endpoint-group {
                padding: 10px;
                margin-bottom: 10px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 3px;
            }
            
            .endpoint-title {
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .api-key-input {
                position: relative;
            }
            
            .toggle-visibility {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: var(--vscode-foreground);
                opacity: 0.7;
                cursor: pointer;
            }
            
            .model-selection {
                margin-top: 15px;
            }
            
            
            .slider-container {
                margin-top: 5px;
            }
            
            .slider {
                -webkit-appearance: none;
                width: 100%;
                height: 4px;
                background: var(--vscode-scrollbarSlider-background);
                outline: none;
                border-radius: 2px;
            }
            
            .slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--vscode-button-background);
                cursor: pointer;
            }
            
            .slider::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--vscode-button-background);
                cursor: pointer;
            }
            
            .slider-value {
                display: inline-block;
                margin-left: 10px;
                font-size: 12px;
            }

            .info-text {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-top: 4px;
            }

            
            .models-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 16px;
                margin-top: 16px;
            }
            
            .model-item {
                border: 1px solid var(--vscode-panel-border);
                border-radius: 6px;
                padding: 16px;
                position: relative;
                background: var(--vscode-editor-background);
                transition: box-shadow 0.2s, transform 0.2s;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .model-item:hover {
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }

            .model-item-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }

            .model-name {
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 4px;
            }

            .model-provider {
                font-size: 12px;
                opacity: 0.8;
                font-style: italic;
                margin-bottom: 4px;
                padding: 2px 6px;
                border-radius: 4px;
                display: inline-block;
            }
            
            .model-provider.internal {
                background-color: var(--vscode-activityBarBadge-background);
                color: var(--vscode-activityBarBadge-foreground);
            }
            
            .model-provider.external {
                background-color: var(--vscode-statusBarItem-warningBackground);
                color: var(--vscode-statusBarItem-warningForeground);
            }

            .model-details {
                font-size: 12px;
                margin-top: 8px;
                flex-grow: 1;
            }

            .model-details div {
                margin-bottom: 6px;
                line-height: 1.4;
            }
            
            .model-detail-label {
                font-weight: 500;
                margin-right: 4px;
                display: inline-block;
                min-width: 100px;
            }

            .model-actions {
                display: flex;
                gap: 8px;
                margin-top: 16px;
                justify-content: flex-end;
            }

            .model-default-badge {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                position: absolute;
                top: 12px;
                right: 12px;
            }

            .model-edit-form {
                border: 1px solid var(--vscode-button-background);
                border-radius: 4px;
                padding: 15px;
                margin-top: 15px;
                margin-bottom: 15px;
                background-color: var(--vscode-sideBar-background);
            }

            .add-button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin-top: 10px;
            }

            .edit-button, .delete-button, .set-default-button {
                padding: 6px 10px;
                cursor: pointer;
                font-size: 12px;
                border-radius: 4px;
                border: 1px solid var(--vscode-button-background);
            }

            .edit-button {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }

            .delete-button {
                background-color: var(--vscode-errorForeground);
                color: white;
            }
            
            .set-default-button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }
        </style>
    </head>
    <body>
        <div class="settings-container">
            <div class="tab-container">
                <button class="tab active" data-tab="user-info">User Info</button>
                <button class="tab" data-tab="plugin-settings">Plugin Settings</button>
                <button class="tab" data-tab="api-endpoints">API Endpoints</button>
                <button class="tab" data-tab="llm-settings">LLM Settings</button>
            </div>
            
            <!-- User Information Tab -->
            <div class="tab-content active" id="user-info">
                <div class="section-title">Basic Information</div>
                <div class="form-group">
                    <label for="displayName">Display Name</label>
                    <input type="text" id="displayName" placeholder="Your display name">
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" placeholder="Your email address">
                </div>
                
                <div class="section-title">Git Information</div>
                <div class="form-group">
                    <label for="gitUsername">Git Username</label>
                    <input type="text" id="gitUsername" placeholder="Your Git username">
                </div>
                <div class="form-group">
                    <label for="gitEmail">Git Email</label>
                    <input type="email" id="gitEmail" placeholder="Your Git email">
                </div>
                
                <div class="section-title">SWDP Information</div>
                <div class="form-group">
                    <label for="swdpUsername">SWDP Username</label>
                    <input type="text" id="swdpUsername" placeholder="Your SWDP username">
                </div>
                <div class="form-group">
                    <label for="swdpTeam">SWDP Team</label>
                    <input type="text" id="swdpTeam" placeholder="Your SWDP team">
                </div>
                
                <div class="button-container">
                    <button id="saveUserInfo">Save</button>
                </div>
            </div>
            
            <!-- Plugin Settings Tab -->
            <div class="tab-content" id="plugin-settings">
                <div class="section-title">Installed Plugins</div>
                <div class="plugin-list" id="pluginList">
                    <!-- Dynamically populated -->
                </div>
                
                <div class="section-title">Add New Plugin</div>
                <div class="add-plugin-form">
                    <div class="form-group">
                        <label for="pluginId">Plugin ID</label>
                        <input type="text" id="pluginId" placeholder="Unique plugin identifier">
                    </div>
                    <div class="form-group">
                        <label for="pluginName">Plugin Name</label>
                        <input type="text" id="pluginName" placeholder="Human-readable name">
                    </div>
                    <div class="form-group">
                        <label for="pluginType">Type</label>
                        <select id="pluginType">
                            <option value="internal">Internal</option>
                            <option value="external">External</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pluginSettings">Plugin Settings (JSON)</label>
                        <textarea id="pluginSettings" rows="4" placeholder='{"key": "value"}'></textarea>
                    </div>
                    <div class="button-container">
                        <button id="addPlugin">Add Plugin</button>
                    </div>
                </div>
                
                <div class="button-container">
                    <button id="savePluginSettings">Save All</button>
                </div>
            </div>
            
            <!-- API Endpoints Tab -->
            <div class="tab-content" id="api-endpoints">
                <div class="section-title">API Endpoint Configuration</div>
                <p class="info-text">Configure API endpoints for various services used by APE. These settings will override the default endpoints.</p>
                
                <div class="endpoint-group">
                    <div class="endpoint-title">LLM Endpoint</div>
                    <div class="form-group">
                        <label for="llmEndpoint">URL</label>
                        <input type="text" id="llmEndpoint" placeholder="https:
                    </div>
                </div>
                
                <div class="endpoint-group">
                    <div class="endpoint-title">Git API Endpoint</div>
                    <div class="form-group">
                        <label for="gitApiEndpoint">URL</label>
                        <input type="text" id="gitApiEndpoint" placeholder="https:
                    </div>
                </div>
                
                <div class="endpoint-group">
                    <div class="endpoint-title">Jira API Endpoint</div>
                    <div class="form-group">
                        <label for="jiraApiEndpoint">URL</label>
                        <input type="text" id="jiraApiEndpoint" placeholder="https:
                    </div>
                </div>
                
                <div class="endpoint-group">
                    <div class="endpoint-title">SWDP API Endpoint</div>
                    <div class="form-group">
                        <label for="swdpApiEndpoint">URL</label>
                        <input type="text" id="swdpApiEndpoint" placeholder="https:
                    </div>
                </div>
                
                <div class="endpoint-group">
                    <div class="endpoint-title">Pocket API Endpoint</div>
                    <div class="form-group">
                        <label for="pocketApiEndpoint">URL</label>
                        <input type="text" id="pocketApiEndpoint" placeholder="https:
                    </div>
                </div>
                
                <div class="button-container">
                    <button id="saveApiEndpoints">Save Endpoints</button>
                </div>
            </div>
            
            <!-- LLM Settings Tab -->
            <div class="tab-content" id="llm-settings">
                <div class="section-title">모델 기본 설정</div>
                <div class="form-group">
                    <label for="defaultModel">기본 모델 선택</label>
                    <select id="defaultModel">
                        <!-- 동적으로 생성됨 -->
                    </select>
                    <p class="info-text">채팅창에서 사용할 기본 모델을 선택합니다</p>
                </div>
                
                <div class="form-group">
                    <label for="supportsStreaming">스트리밍 지원</label>
                    <input type="checkbox" id="supportsStreaming"> 
                    <span class="info-text">스트리밍 응답을 지원합니다.</span>
                </div>
                
                <div class="section-title">모델 관리</div>
                <div class="form-group">
                    <p class="info-text">내부망 및 외부망 LLM 모델을 관리합니다. 여기서 추가한 모델은 채팅창의 모델 선택기에서 사용할 수 있습니다.</p>
                </div>
                
                <div class="form-group">
                    <button id="addModelBtn" class="add-button">새 모델 추가</button>
                </div>
                
                <div class="models-grid" id="models-container">
                    <!-- 동적으로 생성됨 -->
                </div>
                
                <div id="modelEditForm" style="display: none;" class="model-edit-form">
                    <div class="section-title">모델 설정 편집</div>
                    <div class="form-group">
                        <label for="modelId">모델 ID</label>
                        <input type="text" id="modelId" placeholder="모델 식별자">
                    </div>
                    <div class="form-group">
                        <label for="modelName">모델 이름</label>
                        <input type="text" id="modelName" placeholder="표시 이름">
                    </div>
                    <div class="form-group">
                        <label for="modelProvider">제공자</label>
                        <select id="modelProvider">
                            <option value="custom">내부망 (Custom)</option>
                            <option value="openrouter">OpenRouter (외부 테스트용)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="modelApiUrl">API URL</label>
                        <input type="text" id="modelApiUrl" placeholder="https:
                    </div>
                    <div class="form-group">
                        <label for="modelApiModel">API 모델 명칭</label>
                        <input type="text" id="modelApiModel" placeholder="모델 지정자 (선택사항)">
                        <p class="info-text">일부 API에서만 필요합니다</p>
                    </div>
                    <div class="form-group">
                        <label for="modelContextWindow">콘텍스트 윈도우</label>
                        <input type="number" id="modelContextWindow" placeholder="32000">
                    </div>
                    <div class="form-group">
                        <label for="modelMaxTokens">최대 토큰</label>
                        <input type="number" id="modelMaxTokens" placeholder="8192">
                    </div>
                    <div class="form-group">
                        <label for="modelSystemPrompt">시스템 프롬프트</label>
                        <textarea id="modelSystemPrompt" rows="3" placeholder="기본 시스템 프롬프트"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="modelHeadersJson">HTTP 헤더 (JSON)</label>
                        <textarea id="modelHeadersJson" rows="3" placeholder='{"x-api-key": "API_KEY"}'></textarea>
                        <p class="info-text">내부망 API에 필요한 추가 헤더를 JSON 형식으로 입력하세요</p>
                    </div>
                    <div class="button-container">
                        <button id="saveModelBtn">저장</button>
                        <button id="cancelModelBtn">취소</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="temperature">Temperature</label>
                    <div class="slider-container">
                        <input type="range" min="0" max="1" step="0.01" value="0.7" class="slider" id="temperature">
                        <span class="slider-value" id="temperatureValue">0.7</span>
                    </div>
                    <p class="info-text">Lower values make responses more deterministic, higher values more creative.</p>
                </div>
                
                <div class="form-group">
                    <label for="maxTokens">Max Tokens</label>
                    <div class="two-column">
                        <input type="number" id="maxTokens" min="100" max="100000" step="100" value="4000">
                    </div>
                    <p class="info-text">Maximum number of tokens to generate in the response.</p>
                </div>
                
                <div class="button-container">
                    <button id="saveLlmSettings">Save Settings</button>
                </div>
            </div>
        </div>
        
        <script>
            (function() {
                
                const tabs = document.querySelectorAll('.tab');
                const tabContents = document.querySelectorAll('.tab-content');
                
                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const tabId = tab.getAttribute('data-tab');
                        
                        
                        tabs.forEach(t => t.classList.remove('active'));
                        tabContents.forEach(c => c.classList.remove('active'));
                        
                        
                        tab.classList.add('active');
                        document.getElementById(tabId).classList.add('active');
                    });
                });
                
                
                const temperatureSlider = document.getElementById('temperature');
                const temperatureValue = document.getElementById('temperatureValue');
                
                temperatureSlider.addEventListener('input', () => {
                    temperatureValue.textContent = temperatureSlider.value;
                });
                
                
                const toggleButtons = document.querySelectorAll('.toggle-visibility');
                
                toggleButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const targetId = button.getAttribute('data-target');
                        const inputField = document.getElementById(targetId);
                        
                        if (inputField.type === 'password') {
                            inputField.type = 'text';
                            button.textContent = 'Hide';
                        } else {
                            inputField.type = 'password';
                            button.textContent = 'Show';
                        }
                    });
                });
                
                
                function renderPluginList(plugins = []) {
                    const pluginList = document.getElementById('pluginList');
                    pluginList.innerHTML = '';
                    
                    if (plugins.length === 0) {
                        pluginList.innerHTML = '<div class="plugin-item">No plugins installed</div>';
                        return;
                    }
                    
                    plugins.forEach(plugin => {
                        const pluginItem = document.createElement('div');
                        pluginItem.className = 'plugin-item';
                        pluginItem.innerHTML = \`
                            <div class="plugin-info">
                                <span class="plugin-name">\${plugin.name}</span>
                                <span class="plugin-type">\${plugin.type} plugin</span>
                            </div>
                            <div class="plugin-actions">
                                <input type="checkbox" class="plugin-toggle" data-id="\${plugin.id}" \${plugin.enabled ? 'checked' : ''}>
                                <button class="remove-plugin" data-id="\${plugin.id}">Remove</button>
                            </div>
                        \`;
                        
                        pluginList.appendChild(pluginItem);
                    });
                    
                    
                    document.querySelectorAll('.plugin-toggle').forEach(toggle => {
                        toggle.addEventListener('change', (e) => {
                            const pluginId = e.target.getAttribute('data-id');
                            const pluginIndex = plugins.findIndex(p => p.id === pluginId);
                            
                            if (pluginIndex !== -1) {
                                plugins[pluginIndex].enabled = e.target.checked;
                            }
                        });
                    });
                    
                    document.querySelectorAll('.remove-plugin').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const pluginId = e.target.getAttribute('data-id');
                            
                            vscode.postMessage({
                                command: 'removePlugin',
                                pluginId: pluginId
                            });
                        });
                    });
                }
                
                
                document.getElementById('addPlugin').addEventListener('click', () => {
                    const id = document.getElementById('pluginId').value.trim();
                    const name = document.getElementById('pluginName').value.trim();
                    const type = document.getElementById('pluginType').value;
                    let settings = {};
                    
                    try {
                        const settingsText = document.getElementById('pluginSettings').value.trim();
                        if (settingsText) {
                            settings = JSON.parse(settingsText);
                        }
                    } catch (e) {
                        vscode.postMessage({
                            command: 'showError',
                            message: 'Invalid JSON in plugin settings'
                        });
                        return;
                    }
                    
                    if (!id || !name) {
                        vscode.postMessage({
                            command: 'showError',
                            message: 'Plugin ID and name are required'
                        });
                        return;
                    }
                    
                    vscode.postMessage({
                        command: 'addPlugin',
                        pluginInfo: {
                            id,
                            name,
                            type,
                            settings
                        }
                    });
                    
                    
                    document.getElementById('pluginId').value = '';
                    document.getElementById('pluginName').value = '';
                    document.getElementById('pluginSettings').value = '';
                });
                
                
                document.getElementById('saveUserInfo').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'saveUserInfo',
                        userInfo: {
                            displayName: document.getElementById('displayName').value,
                            email: document.getElementById('email').value,
                            gitUsername: document.getElementById('gitUsername').value,
                            gitEmail: document.getElementById('gitEmail').value,
                            swdpUsername: document.getElementById('swdpUsername').value,
                            swdpTeam: document.getElementById('swdpTeam').value
                        }
                    });
                });
                
                
                document.getElementById('savePluginSettings').addEventListener('click', () => {
                    
                    const plugins = [];
                    document.querySelectorAll('.plugin-item').forEach(item => {
                        const nameElement = item.querySelector('.plugin-name');
                        const typeElement = item.querySelector('.plugin-type');
                        const toggleElement = item.querySelector('.plugin-toggle');
                        
                        if (nameElement && typeElement && toggleElement) {
                            plugins.push({
                                id: toggleElement.getAttribute('data-id'),
                                name: nameElement.textContent,
                                type: typeElement.textContent.replace(' plugin', ''),
                                enabled: toggleElement.checked
                            });
                        }
                    });
                    
                    vscode.postMessage({
                        command: 'savePluginSettings',
                        pluginSettings: plugins
                    });
                });
                
                
                document.getElementById('saveApiEndpoints').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'saveApiEndpoints',
                        apiEndpoints: {
                            llmEndpoint: document.getElementById('llmEndpoint').value,
                            gitApiEndpoint: document.getElementById('gitApiEndpoint').value,
                            jiraApiEndpoint: document.getElementById('jiraApiEndpoint').value,
                            swdpApiEndpoint: document.getElementById('swdpApiEndpoint').value,
                            pocketApiEndpoint: document.getElementById('pocketApiEndpoint').value
                        }
                    });
                });
                
                
                document.getElementById('saveLlmSettings').addEventListener('click', () => {
                    
                    const openRouterKeyElement = document.getElementById('openRouterApiKey');
                    const openRouterKey = openRouterKeyElement ? openRouterKeyElement.value : '';

                    vscode.postMessage({
                        command: 'saveLlmSettings',
                        llmSettings: {
                            defaultModel: document.getElementById('defaultModel').value,
                            
                            openRouterApiKey: openRouterKey,
                            supportsStreaming: document.getElementById('supportsStreaming').checked,
                            temperature: parseFloat(document.getElementById('temperature').value),
                            maxTokens: parseInt(document.getElementById('maxTokens').value)
                        }
                    });
                });
                
                
                
                let currentModels = {};
                let editingModelId = null;
                
                
                function renderModelsList(models) {
                    const modelsContainer = document.getElementById('models-container');
                    modelsContainer.innerHTML = '';
                    currentModels = models || {};
                    
                    
                    const defaultModelId = document.getElementById('defaultModel').value;
                    
                    if (Object.keys(models).length === 0) {
                        modelsContainer.innerHTML = '<div class="info-text" style="grid-column: 1/-1; padding: 20px; text-align: center;">등록된 모델이 없습니다. "새 모델 추가" 버튼을 클릭하여 모델을 추가하세요.</div>';
                        return;
                    }
                    
                    for (const [modelId, model] of Object.entries(models)) {
                        const modelItem = document.createElement('div');
                        modelItem.className = 'model-item';
                        modelItem.dataset.id = modelId;
                        
                        const provider = model.provider || 'custom';
                        const isInternal = provider === 'custom';
                        const providerLabel = isInternal ? '내부망' : 'OpenRouter';
                        const providerClass = isInternal ? 'internal' : 'external';
                        
                        const modelName = model.name || modelId;
                        const modelApiUrl = model.apiUrl || '지정되지 않음';
                        const contextWindow = model.contextWindow || 'N/A';
                        const maxTokens = model.maxTokens || 'N/A';
                        
                        
                        let systemPromptDisplay = 'N/A';
                        if (model.systemPrompt) {
                            const promptText = model.systemPrompt;
                            systemPromptDisplay = promptText.length > 50 ? 
                                promptText.substring(0, 50) + '...' : promptText;
                        }
                        
                        
                        let headersDisplay = '';
                        if (model.headers) {
                            const headersText = JSON.stringify(model.headers);
                            const truncated = headersText.length > 30 ? 
                                headersText.substring(0, 30) + '...' : headersText;
                            headersDisplay = '<div><span class="model-detail-label">헤더:</span> ' + truncated + '</div>';
                        }
                        
                        
                        let apiModelDisplay = '';
                        if (model.apiModel) {
                            apiModelDisplay = '<div><span class="model-detail-label">API 모델:</span> ' + model.apiModel + '</div>';
                        }
                        
                        
                        const isDefault = modelId === defaultModelId;
                        const defaultBadge = isDefault ? 
                            '<div class="model-default-badge">기본 모델</div>' : '';
                        
                        modelItem.innerHTML = 
                            defaultBadge +
                            '<div class="model-item-header">' +
                            '  <div>' +
                            '    <div class="model-name">' + modelName + '</div>' +
                            '    <div class="model-provider ' + providerClass + '">' + providerLabel + '</div>' +
                            '    <div style="font-size: 11px; opacity: 0.7;">ID: ' + modelId + '</div>' +
                            '  </div>' +
                            '</div>' +
                            '<div class="model-details">' +
                            '  <div><span class="model-detail-label">API URL:</span> ' + modelApiUrl + '</div>' +
                            apiModelDisplay +
                            '  <div><span class="model-detail-label">콘텍스트 윈도우:</span> ' + contextWindow + '</div>' +
                            '  <div><span class="model-detail-label">최대 토큰:</span> ' + maxTokens + '</div>' +
                            '  <div><span class="model-detail-label">시스템 프롬프트:</span> ' + systemPromptDisplay + '</div>' +
                            headersDisplay +
                            '</div>' +
                            '<div class="model-actions">' +
                            '  <button class="edit-button" data-id="' + modelId + '">편집</button>' +
                            '  <button class="delete-button" data-id="' + modelId + '">삭제</button>' +
                            '  ' + (isDefault ? '' : '<button class="set-default-button" data-id="' + modelId + '">기본 모델로 설정</button>') +
                            '</div>';
                        
                        modelsContainer.appendChild(modelItem);
                    }
                    
                    
                    document.querySelectorAll('.edit-button').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const modelId = e.target.getAttribute('data-id');
                            openModelEditForm(modelId, currentModels[modelId]);
                        });
                    });
                    
                    
                    document.querySelectorAll('.delete-button').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const modelId = e.target.getAttribute('data-id');
                            const modelName = currentModels[modelId] ? (currentModels[modelId].name || modelId) : modelId;
                            if (confirm('정말로 "' + modelName + '" 모델을 삭제하시겠습니까?')) {
                                deleteModel(modelId);
                            }
                        });
                    });
                    
                    
                    document.querySelectorAll('.set-default-button').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const modelId = e.target.getAttribute('data-id');
                            document.getElementById('defaultModel').value = modelId;
                            
                            
                            vscode.postMessage({
                                command: 'saveLlmSettings',
                                llmSettings: {
                                    defaultModel: modelId,
                                    openRouterApiKey: document.getElementById('openRouterApiKey').value,
                                    supportsStreaming: document.getElementById('supportsStreaming').checked,
                                    temperature: parseFloat(document.getElementById('temperature').value),
                                    maxTokens: parseInt(document.getElementById('maxTokens').value)
                                }
                            });
                            
                            
                            renderModelsList(currentModels);
                        });
                    });
                }
                
                
                function openModelEditForm(modelId, model) {
                    const form = document.getElementById('modelEditForm');
                    editingModelId = modelId;
                    
                    
                    document.getElementById('modelId').value = modelId || '';
                    document.getElementById('modelId').disabled = !!modelId;  
                    document.getElementById('modelName').value = model?.name || '';
                    document.getElementById('modelProvider').value = model?.provider || 'custom';
                    document.getElementById('modelApiUrl').value = model?.apiUrl || '';
                    document.getElementById('modelApiModel').value = model?.apiModel || '';
                    document.getElementById('modelContextWindow').value = model?.contextWindow || 32000;
                    document.getElementById('modelMaxTokens').value = model?.maxTokens || 8192;
                    document.getElementById('modelSystemPrompt').value = model?.systemPrompt || '';
                    document.getElementById('modelHeadersJson').value = model?.headers ? JSON.stringify(model.headers, null, 2) : '';
                    
                    
                    form.style.display = 'block';
                    document.getElementById('modelId').focus();
                }
                
                
                function saveModel() {
                    try {
                        const modelId = document.getElementById('modelId').value.trim();
                        
                        if (!modelId) {
                            alert('모델 ID는 필수입니다.');
                            return;
                        }
                        
                        
                        const model = {
                            name: document.getElementById('modelName').value.trim() || modelId,
                            provider: document.getElementById('modelProvider').value,
                            apiUrl: document.getElementById('modelApiUrl').value.trim(),
                            contextWindow: parseInt(document.getElementById('modelContextWindow').value) || 32000,
                            maxTokens: parseInt(document.getElementById('modelMaxTokens').value) || 8192,
                            systemPrompt: document.getElementById('modelSystemPrompt').value.trim()
                        };
                        
                        
                        const apiModel = document.getElementById('modelApiModel').value.trim();
                        if (apiModel) {
                            model.apiModel = apiModel;
                        }
                        
                        
                        const headersJson = document.getElementById('modelHeadersJson').value.trim();
                        if (headersJson) {
                            try {
                                model.headers = JSON.parse(headersJson);
                            } catch (e) {
                                alert('HTTP 헤더 JSON 형식이 올바르지 않습니다.');
                                return;
                            }
                        }
                        
                        
                        const updatedModels = { ...currentModels };
                        
                        
                        if (editingModelId && editingModelId !== modelId) {
                            
                            delete updatedModels[editingModelId];
                            updatedModels[modelId] = model;
                        } else {
                            
                            updatedModels[modelId] = model;
                        }
                        
                        
                        vscode.postMessage({
                            command: 'saveModels',
                            models: updatedModels
                        });
                        
                        
                        closeModelEditForm();
                    } catch (error) {
                        alert('모델 저장 중 오류가 발생했습니다: ' + error.message);
                    }
                }
                
                
                function deleteModel(modelId) {
                    if (!modelId || !currentModels[modelId]) return;
                    
                    
                    const updatedModels = { ...currentModels };
                    delete updatedModels[modelId];
                    
                    
                    vscode.postMessage({
                        command: 'saveModels',
                        models: updatedModels
                    });
                }
                
                
                function closeModelEditForm() {
                    document.getElementById('modelEditForm').style.display = 'none';
                    editingModelId = null;
                }
                
                
                document.getElementById('addModelBtn').addEventListener('click', () => {
                    openModelEditForm(null, null);
                });
                
                
                document.getElementById('saveModelBtn').addEventListener('click', saveModel);
                
                
                document.getElementById('cancelModelBtn').addEventListener('click', closeModelEditForm);
                
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'updateSettings':
                            
                            const userInfo = message.settings.userInfo;
                            document.getElementById('displayName').value = userInfo.displayName || '';
                            document.getElementById('email').value = userInfo.email || '';
                            document.getElementById('gitUsername').value = userInfo.gitUsername || '';
                            document.getElementById('gitEmail').value = userInfo.gitEmail || '';
                            document.getElementById('swdpUsername').value = userInfo.swdpUsername || '';
                            document.getElementById('swdpTeam').value = userInfo.swdpTeam || '';
                            
                            
                            renderPluginList(message.settings.pluginSettings);
                            
                            
                            const apiEndpoints = message.settings.apiEndpoints;
                            document.getElementById('llmEndpoint').value = apiEndpoints.llmEndpoint || '';
                            document.getElementById('gitApiEndpoint').value = apiEndpoints.gitApiEndpoint || '';
                            document.getElementById('jiraApiEndpoint').value = apiEndpoints.jiraApiEndpoint || '';
                            document.getElementById('swdpApiEndpoint').value = apiEndpoints.swdpApiEndpoint || '';
                            document.getElementById('pocketApiEndpoint').value = apiEndpoints.pocketApiEndpoint || '';
                            
                            
                            const llmSettings = message.settings.llmSettings;
                            const availableModels = message.settings.availableModels || {};
                            
                            
                            const defaultModelSelect = document.getElementById('defaultModel');
                            defaultModelSelect.innerHTML = ''; 
                            
                            console.log('웹뷰에서 모델 목록:', availableModels);
                            
                            
                            if (availableModels && Object.keys(availableModels).length > 0) {
                                Object.keys(availableModels).forEach(modelId => {
                                    const model = availableModels[modelId];
                                    const option = document.createElement('option');
                                    option.value = modelId;
                                    option.textContent = model.name || modelId;
                                    defaultModelSelect.appendChild(option);
                                });
                            } else {
                                
                                const option = document.createElement('option');
                                option.value = '';
                                option.textContent = '설정된 모델 없음';
                                defaultModelSelect.appendChild(option);
                                console.warn('모델 목록이 비어있습니다');
                            }
                            
                            
                            defaultModelSelect.value = llmSettings.defaultModel || '';
                            
                            
                            renderModelsList(availableModels);
                            
                            
                            
                            if (document.getElementById('openRouterApiKey')) {
                              document.getElementById('openRouterApiKey').value = llmSettings.openRouterApiKey || '';
                            }
                            
                            
                            document.getElementById('supportsStreaming').checked = llmSettings.supportsStreaming || false;
                            
                            
                            const temperature = llmSettings.temperature || 0.7;
                            document.getElementById('temperature').value = temperature;
                            document.getElementById('temperatureValue').textContent = temperature;
                            
                            
                            document.getElementById('maxTokens').value = llmSettings.maxTokens || 4000;
                            break;
                    }
                });
                
                
                vscode.postMessage({
                    command: 'getSettings'
                });
                
                
                const vscode = acquireVsCodeApi();
            })();
        </script>
    </body>
    </html>`;
  }
}