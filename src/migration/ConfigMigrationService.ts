/**
 * 설정 마이그레이션 서비스
 * 
 * Ape에서 APE로의 설정 마이그레이션을 처리하는 서비스
 */

import * as vscode from 'vscode';
import { LoggerService } from '../core/utils/LoggerService';

/**
 * 설정 마이그레이션 서비스 클래스
 */
export class ConfigMigrationService {
  private logger: LoggerService;

  constructor() {
    this.logger = new LoggerService();
  }

  /**
   * 설정 마이그레이션 실행
   * 
   * Ape에서 APE로 설정을 마이그레이션합니다.
   * 기존의 사용자 설정을 보존하면서 새로운 네임스페이스로 이동합니다.
   */
  public async migrateConfigs(): Promise<boolean> {
    this.logger.info('설정 마이그레이션 시작: APE → APE');
    
    try {
      
      const configMappings = [
        { from: 'ape.core.sslBypass', to: 'ape.core.sslBypass' },
        { from: 'ape.core.logLevel', to: 'ape.core.logLevel' },
        { from: 'ape.core.allow.all', to: 'ape.core.allow.all' },
        { from: 'ape.core.embedDevMode', to: 'ape.core.embedDevMode' },
        { from: 'ape.llm.defaultModel', to: 'ape.llm.defaultModel' },
        { from: 'ape.llm.supportsStreaming', to: 'ape.llm.supportsStreaming' },
        { from: 'ape.llm.openrouterApiKey', to: 'ape.llm.openrouterApiKey' },
        { from: 'ape.llm.models', to: 'ape.llm.models' }
      ];
      
      
      let migratedCount = 0;
      for (const mapping of configMappings) {
        try {
          
          const config = vscode.workspace.getConfiguration();
          const oldValue = config.get(mapping.from);
          
          
          if (oldValue !== undefined) {
            this.logger.info(`설정 마이그레이션: ${mapping.from} → ${mapping.to}`);
            
            
            const parts = mapping.to.split('.');
            const section = parts.slice(0, 2).join('.');
            const key = parts.slice(2).join('.');
            
            const sectionConfig = vscode.workspace.getConfiguration(section);
            await sectionConfig.update(key, oldValue, vscode.ConfigurationTarget.Global);
            
            
            
            
            migratedCount++;
          }
        } catch (mappingError) {
          this.logger.error(`설정 마이그레이션 중 오류 (${mapping.from} → ${mapping.to}):`, mappingError);
        }
      }
      
      this.logger.info(`설정 마이그레이션 완료: ${migratedCount}개 설정 마이그레이션됨`);
      
      
      if (migratedCount > 0) {
        vscode.window.showInformationMessage(
          `APE: ${migratedCount}개의 설정이 성공적으로 마이그레이션되었습니다. (APE → APE)`
        );
      }
      
      return true;
    } catch (error) {
      this.logger.error('설정 마이그레이션 중 오류 발생:', error);
      
      
      vscode.window.showErrorMessage(
        'APE: 설정 마이그레이션 중 오류가 발생했습니다. 자세한 내용은 로그를 확인하세요.'
      );
      
      return false;
    }
  }
  
  /**
   * 마이그레이션 필요 여부 확인
   * 
   * 기존 APE 설정이 존재하는지 확인하여 마이그레이션 필요 여부를 결정합니다.
   */
  public async isMigrationNeeded(): Promise<boolean> {
    try {
      const config = vscode.workspace.getConfiguration();
      
      
      const hasApeConfig = 
        config.has('ape.core.sslBypass') || 
        config.has('ape.llm.defaultModel') ||
        config.has('ape.core.logLevel');
      
      return hasApeConfig;
    } catch (error) {
      this.logger.error('마이그레이션 필요 여부 확인 중 오류 발생:', error);
      return false;
    }
  }
}