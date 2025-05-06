import * as vscode from 'vscode';


export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}


export interface LoggerConfig {
  level: LogLevel;
  useConsole: boolean;
  useOutputChannel: boolean;
}


export interface ILoggerService {
  debug(message: string, ...optionalParams: any[]): void;
  info(message: string, ...optionalParams: any[]): void;
  warn(message: string, ...optionalParams: any[]): void;
  error(message: string, ...optionalParams: any[]): void;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  clear(): void;
  show(preserveFocus?: boolean): void;
  hide(): void;
}


export class LoggerService implements ILoggerService {
  private static _instance: LoggerService;
  private _outputChannel: vscode.OutputChannel | null = null;
  private _config: LoggerConfig = {
    level: LogLevel.DEBUG,  // DEBUG로 변경하여 모든 로그 출력
    useConsole: true,
    useOutputChannel: true  // VS Code 출력 채널 사용
  };

  constructor() {
    try {
      if (vscode && vscode.window) {
        this._outputChannel = vscode.window.createOutputChannel('APE');
        this._config.useOutputChannel = true;
      }
    } catch (error) {
      
      this._config.useOutputChannel = false;
    }
  }

  public static getInstance(): LoggerService {
    if (!LoggerService._instance) {
      LoggerService._instance = new LoggerService();
    }
    return LoggerService._instance;
  }

  public configure(config: Partial<LoggerConfig>): void {
    this._config = { ...this._config, ...config };
  }

  public debug(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.DEBUG, message, ...optionalParams);
  }

  public info(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.INFO, message, ...optionalParams);
  }

  public warn(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.WARN, message, ...optionalParams);
  }

  public error(message: string, ...optionalParams: any[]): void {
    this.log(LogLevel.ERROR, message, ...optionalParams);
  }

  private log(level: LogLevel, message: string, ...optionalParams: any[]): void {
    if (level < this._config.level) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    const caller = this._getCallerInfo();
    const formattedMessage = `[${timestamp}][${levelStr}][${caller}] ${message}`;

    if (this._config.useConsole) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, ...optionalParams);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, ...optionalParams);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, ...optionalParams);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, ...optionalParams);
          break;
      }
    }
    
    // 파일에도 로그 저장 (디버깅용)
    this._writeToFile(formattedMessage, optionalParams);
  }
  
  private _getCallerInfo(): string {
    try {
      const err = new Error();
      const stack = err.stack || '';
      const stackLines = stack.split('\n');
      // 0: Error, 1: log 메서드, 2: debug/info/warn/error 메서드, 3: 실제 호출한 곳
      const callerLine = stackLines[3] || '';
      const match = callerLine.match(/at\s+(.*)\s+\(/);
      return match ? match[1] : 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }
  
  private _writeToFile(message: string, params: any[]): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const logDir = '/tmp/ape-logs';
      const logFile = path.join(logDir, `ape-debug-${new Date().toISOString().split('T')[0]}.log`);
      
      let logMessage = message;
      if (params.length > 0) {
        try {
          logMessage += ' ' + params.map(p => {
            if (typeof p === 'object') {
              return JSON.stringify(p);
            }
            return String(p);
          }).join(' ');
        } catch (error) {
          logMessage += ' [Parameter serialization error]';
        }
      }
      
      fs.appendFileSync(logFile, logMessage + '\n');
    } catch (error) {
      // 파일 로깅 실패해도 무시
    }
    
    if (this._config.useOutputChannel && this._outputChannel) {
      let outputStr = message; // formattedMessage -> message로 수정
      
      if (params.length > 0) { // optionalParams -> params로 수정
        try {
          outputStr += ' ' + params.map(p => {
            if (typeof p === 'object') {
              return JSON.stringify(p);
            }
            return String(p);
          }).join(' ');
        } catch (error) {
          outputStr += ' [Parameter serialization error]';
        }
      }
      
      this._outputChannel.appendLine(outputStr);
    }
  }

  public show(preserveFocus: boolean = false): void {
    if (this._outputChannel) {
      this._outputChannel.show(preserveFocus);
    }
  }

  public hide(): void {
    if (this._outputChannel) {
      this._outputChannel.hide();
    }
  }

  public clear(): void {
    if (this._outputChannel) {
      this._outputChannel.clear();
    }
  }

  public setLevel(level: LogLevel): void {
    this._config.level = level;
  }

  public getLevel(): LogLevel {
    return this._config.level;
  }
}