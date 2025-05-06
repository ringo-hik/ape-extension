/**
 * Pocket 플러그인
 * 
 * S3 호환 스토리지와 연동하여 파일 관리 및 탐색 기능을 제공하는 내부 플러그인
 * 파일 검색, 로드, 요약 및 디렉토리 구조 탐색 기능 지원
 */

import { PluginBaseService } from '../../../core/plugin-system/PluginBaseService';
import { PluginCommand } from '../../../types/PluginTypes';
import { IConfigLoader } from '../../../types/ConfigTypes';
import { CommandType, CommandPrefix } from '../../../types/CommandTypes';
import { PocketClientService } from './PocketClientService';

// LLM 서비스 접근 (파일 내용 요약 등을 위해)
import { LlmService } from '../../../core/llm/LlmService';
import { PluginNaturalLanguageService, CommandPattern } from '../../../core/plugin-system/llm';
import { LoggerService } from '../../../core/utils/LoggerService';

/**
 * Pocket 플러그인 설정 인터페이스
 */
interface PocketPluginConfig {
  enabled: boolean;
  endpoint: string;
  region?: string;
  bucket: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  summarizeModel?: string; // 파일 요약에 사용할 모델 ID
}

/**
 * 파일 타입 열거형
 */
enum FileType {
  TEXT = 'text',
  IMAGE = 'image',
  BINARY = 'binary',
  DIRECTORY = 'directory'
}

/**
 * Pocket 플러그인 클래스
 * S3 호환 스토리지 작업 관련 기능 제공
 */
export class PocketPluginService extends PluginBaseService {
  /**
   * 플러그인 ID
   */
  id = 'pocket';
  
  /**
   * 플러그인 이름
   */
  name = 'S3 호환 스토리지 관리';
  
  /**
   * 플러그인 도메인 가져오기
   * @returns 플러그인 도메인
   */
  getDomain(): string {
    return 'pocket';
  }
  
  /**
   * S3 클라이언트
   */
  private client: PocketClientService;
  
  /**
   * LLM 서비스
   */
  private llmService: LlmService | null = null;
  
  /**
   * 자연어 처리 서비스
   */
  private nlpService: PluginNaturalLanguageService | null = null;
  
  /**
   * 로깅 서비스
   */
  private logger: LoggerService = new LoggerService();
  
  /**
   * PocketPluginService 생성자
   * @param configLoader 설정 로더
   */
  constructor(configLoader: IConfigLoader) {
    super(configLoader);
    
    // 내부 플러그인 설정 로드
    const pluginConfig = this.loadPocketConfig();
    this.config = pluginConfig;
    
    // S3 클라이언트 생성
    this.client = new PocketClientService(
      this.config.endpoint,
      this.config.region || 'us-east-1',
      this.config.bucket,
      this.config.credentials
    );
    
    // 명령어 등록
    this.registerCommands();
    
    // LLM 서비스 초기화 시도
    this.initLlmService();
    
    // 자연어 처리 서비스 초기화
    this.initNlpService();
  }
  
  /**
   * Pocket 플러그인 설정 로드
   * @returns Pocket 플러그인 설정
   */
  private loadPocketConfig(): PocketPluginConfig {
    // 기본 설정
    const defaultConfig: PocketPluginConfig = {
      enabled: true,
      endpoint: 'https://s3.amazonaws.com',
      bucket: 'default-bucket',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    };
    
    try {
      let config = {};
      
      // 설정 로더에서 Pocket 플러그인 설정 로드
      if (this.configLoader && typeof this.configLoader.getPlugin === 'function') {
        config = this.configLoader.getPlugin('pocket') || {};
      }
      
      // 설정 병합
      return {
        ...defaultConfig,
        ...config
      };
    } catch (error) {
      console.error('Pocket 플러그인 설정 로드 중 오류 발생:', error);
      return defaultConfig;
    }
  }
  
  /**
   * LLM 서비스 초기화
   */
  private async initLlmService(): Promise<void> {
    try {
      // LLM 서비스 생성
      this.llmService = new LlmService();
      console.log('LLM 서비스 초기화 완료');
    } catch (error) {
      console.error('LLM 서비스 초기화 중 오류 발생:', error);
      this.llmService = null;
    }
  }
  
  /**
   * 자연어 처리 서비스 초기화
   */
  private initNlpService(): void {
    try {
      if (!this.llmService) {
        console.warn('LLM 서비스가 초기화되지 않아 자연어 처리 서비스를 초기화할 수 없습니다');
        return;
      }
      
      // 자연어 명령어 패턴 정의
      const commandPatterns: CommandPattern[] = [
        {
          command: 'ls',
          patterns: ['목록', '파일', '리스트', '보여줘', '확인', '파일 목록'],
          extractArgs: (input: string) => {
            const pathMatch = input.match(/['\"]([^'"]+)['"]/);
            if (pathMatch) {
              return [pathMatch[1]];
            }
            const pathWords = input.match(/(경로|디렉토리|폴더|위치)[\s:]+([^\s]+)/i);
            return pathWords ? [pathWords[2]] : [];
          }
        },
        {
          command: 'info',
          patterns: ['정보', '상세', '속성', '메타데이터', '파일 정보'],
          extractArgs: (input: string) => {
            const paths = PluginNaturalLanguageService.extractFilePaths(input);
            return paths.length > 0 ? [paths[0]] : [];
          }
        },
        {
          command: 'load',
          patterns: ['로드', '읽기', '내용', '열기', '파일 내용', '가져오기'],
          extractArgs: (input: string) => {
            const paths = PluginNaturalLanguageService.extractFilePaths(input);
            return paths.length > 0 ? [paths[0]] : [];
          }
        },
        {
          command: 'summarize',
          patterns: ['요약', '정리', '분석', '줄여', '핵심'],
          extractArgs: (input: string) => {
            const paths = PluginNaturalLanguageService.extractFilePaths(input);
            return paths.length > 0 ? [paths[0]] : [];
          }
        },
        {
          command: 'tree',
          patterns: ['트리', '구조', '디렉토리 구조', '폴더 구조'],
          extractArgs: (input: string) => {
            const pathMatch = input.match(/['\"]([^'"]+)['"]/);
            const depthMatch = input.match(/깊이[:\s]*(\d+)/i);
            
            const args: string[] = [];
            
            if (pathMatch) {
              args.push(pathMatch[1]);
            }
            
            if (depthMatch) {
              args.push(`--depth=${depthMatch[1]}`);
            }
            
            return args;
          }
        },
        {
          command: 'search',
          patterns: ['검색', '찾기', '파일 찾기', '파일명 검색'],
          extractArgs: (input: string) => {
            const keywordMatch = input.match(/['\"]([^'"]+)['"]/);
            if (keywordMatch) {
              return [keywordMatch[1]];
            }
            const keywordWords = input.match(/(검색어|키워드|단어|이름)[\s:]+([^\s]+)/i);
            return keywordWords ? [keywordWords[2]] : [];
          }
        },
        {
          command: 'grep',
          patterns: ['내용 검색', '텍스트 검색', '본문 검색', '코드 검색', '패턴 검색'],
          extractArgs: (input: string) => {
            const patternMatch = input.match(/['\"]([^'"]+)['"]/);
            const pathMatch = input.match(/([./\\a-zA-Z0-9_-]+\.[a-zA-Z0-9]+|[./\\a-zA-Z0-9_-]+\/)/g);
            
            const args: string[] = [];
            
            if (patternMatch) {
              args.push(patternMatch[1]);
            }
            
            if (pathMatch && pathMatch.length > 0) {
              // 첫 번째 패턴 매치가 검색어일 수 있으므로 두 번째 매치부터 경로로 처리
              if (pathMatch.length > 1) {
                args.push(pathMatch[1]);
              }
            }
            
            return args;
          }
        },
        {
          command: 'bucket',
          patterns: ['버킷', '스토리지', '저장소', '버킷 정보'],
          extractArgs: () => []
        }
      ];
      
      // 자연어 처리 서비스 초기화
      this.nlpService = new PluginNaturalLanguageService(
        this.llmService,
        this.logger,
        this.id,
        commandPatterns,
        this.commands
      );
      
      console.log('Pocket 자연어 처리 서비스 초기화 완료');
    } catch (error) {
      console.error('자연어 처리 서비스 초기화 중 오류 발생:', error);
      this.nlpService = null;
    }
  }
  
  /**
   * 플러그인 초기화
   */
  async initialize(): Promise<void> {
    try {
      // S3 연결 검증
      await this.client.testConnection();
      
      // LLM 서비스가 없는 경우 다시 초기화 시도
      if (!this.llmService) {
        await this.initLlmService();
      }
      
      // 자연어 처리 서비스가 없는 경우 초기화 시도
      if (!this.nlpService && this.llmService) {
        this.initNlpService();
      }
      
      console.log('Pocket 플러그인 초기화 완료');
    } catch (error) {
      console.error('Pocket 플러그인 초기화 중 오류 발생:', error);
      // 오류가 발생해도 초기화는 성공한 것으로 취급 (최소 기능 동작)
    }
  }
  
  /**
   * 명령어 등록
   * 
   * @param customCommands 외부에서 추가할 명령어 (사용하지 않음)
   * @returns 등록 성공 여부
   */
  protected registerCommands(customCommands?: PluginCommand[]): boolean {
    this.commands = [
      // 자연어 명령어 (최상단에 배치)
      {
        id: '',
        name: 'natural-language',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '자연어로 Pocket 명령 실행',
        syntax: '@pocket <자연어 명령>',
        examples: [
          '@pocket docs 폴더의 파일 목록 보여줘',
          '@pocket 리포트 파일 검색해줘',
          '@pocket settings.json 파일 내용 로드해줘',
          '@pocket config.json 요약해줘'
        ],
        execute: async (args) => this.processNaturalLanguage(args.join(' '))
      },
      
      // 버킷 내 파일 목록 명령어
      {
        id: 'ls',
        name: 'ls',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '지정된 경로의 파일 목록 조회',
        syntax: '@pocket:ls [path]',
        examples: ['@pocket:ls', '@pocket:ls docs/', '@pocket:ls images/'],
        execute: async (args) => this.listFiles(args[0] || '')
      },
      
      // 파일 정보 조회 명령어
      {
        id: 'info',
        name: 'info',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '파일 또는 디렉토리 정보 조회',
        syntax: '@pocket:info <path>',
        examples: ['@pocket:info readme.md', '@pocket:info docs/guide.pdf'],
        execute: async (args) => this.getFileInfo(args[0])
      },
      
      // 파일 로드 명령어
      {
        id: 'load',
        name: 'load',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '파일 내용 로드',
        syntax: '@pocket:load <path>',
        examples: ['@pocket:load config.json', '@pocket:load docs/notes.txt'],
        execute: async (args) => this.loadFile(args[0])
      },
      
      // 파일 요약 명령어
      {
        id: 'summarize',
        name: 'summarize',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: 'LLM을 사용하여 파일 내용 요약',
        syntax: '@pocket:summarize <path>',
        examples: ['@pocket:summarize report.md', '@pocket:summarize docs/guide.txt'],
        execute: async (args) => this.summarizeFile(args[0])
      },
      
      // 디렉토리 구조 탐색 명령어
      {
        id: 'tree',
        name: 'tree',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '지정된 경로의 디렉토리 구조 조회',
        syntax: '@pocket:tree [path] [--depth=<depth>]',
        examples: ['@pocket:tree', '@pocket:tree docs/ --depth=2'],
        execute: async (args) => this.getDirectoryTree(args[0] || '', this.extractOptions(args))
      },
      
      // 파일 검색 명령어
      {
        id: 'search',
        name: 'search',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '파일 이름 검색',
        syntax: '@pocket:search <keyword>',
        examples: ['@pocket:search report', '@pocket:search "2023 data"'],
        execute: async (args) => this.searchFiles(args[0])
      },
      
      // 파일 내용 검색 명령어
      {
        id: 'grep',
        name: 'grep',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '파일 내용에서 텍스트 검색',
        syntax: '@pocket:grep <pattern> [path]',
        examples: ['@pocket:grep "TODO" *.md', '@pocket:grep "config" settings/'],
        execute: async (args) => this.grepFiles(args[0], args[1])
      },
      
      // 버킷 정보 명령어
      {
        id: 'bucket',
        name: 'bucket',
        type: CommandType.AT,
        prefix: CommandPrefix.AT,
        description: '현재 버킷 정보 조회',
        syntax: '@pocket:bucket',
        examples: ['@pocket:bucket'],
        execute: async () => this.getBucketInfo()
      }
    ];
    return true;
  }
  
  /**
   * 자연어 명령어 처리
   * @param naturalCommand 자연어 명령어
   * @returns 처리 결과
   */
  private async processNaturalLanguage(naturalCommand: string): Promise<any> {
    try {
      this.logger.info(`Pocket 자연어 명령 처리: "${naturalCommand}"`);
      
      // 자연어 처리 서비스 확인
      if (!this.nlpService) {
        if (this.llmService) {
          // 자연어 처리 서비스 초기화 시도
          this.initNlpService();
        }
        
        // 여전히 없는 경우 오류 반환
        if (!this.nlpService) {
          return {
            content: `# 자연어 명령 처리 불가\n\n자연어 처리 서비스가 초기화되지 않았습니다. '@pocket:help' 명령을 사용하여 사용 가능한 명령어를 확인하세요.`,
            type: 'pocket-error'
          };
        }
      }
      
      // 자연어 명령을 형식적 명령으로 변환
      const conversion = await this.nlpService.convertNaturalCommand(naturalCommand);
      
      // 변환 결과가 없는 경우
      if (!conversion || !conversion.command) {
        return {
          content: `# 명령 인식 실패\n\n입력된 자연어 명령을 인식할 수 없습니다. '@pocket:help' 명령을 사용하여 사용 가능한 명령어를 확인하세요.`,
          type: 'pocket-error'
        };
      }
      
      // 명령 실행 전 안내 메시지
      const commandInfo = {
        content: `# 자연어 명령 처리\n\n**입력**: ${naturalCommand}\n\n**변환**: @pocket:${conversion.command} ${conversion.args.join(' ')}\n\n**신뢰도**: ${(conversion.confidence * 100).toFixed(1)}%\n\n**설명**: ${conversion.explanation}\n\n---\n\n`,
        type: 'pocket-nlp-info'
      };
      
      // 해당 명령어 찾기
      const command = this.commands.find(cmd => cmd.id === conversion.command);
      
      if (!command) {
        return {
          ...commandInfo,
          content: commandInfo.content + `# 명령 실행 실패\n\n변환된 명령 '${conversion.command}'을(를) 찾을 수 없습니다.`,
          type: 'pocket-error'
        };
      }
      
      // 명령 실행
      try {
        if (!command.execute) {
          throw new Error(`명령 '${conversion.command}'에 실행 함수가 없습니다.`);
        }
        
        const result = await command.execute(conversion.args);
        
        // 결과에 자연어 처리 정보 추가
        if (typeof result === 'object') {
          // 객체인 경우 내용 병합
          return {
            ...result,
            content: commandInfo.content + result.content,
            nlpInfo: {
              input: naturalCommand,
              convertedCommand: conversion.command,
              args: conversion.args,
              confidence: conversion.confidence
            }
          };
        } else {
          // 문자열 등 다른 타입인 경우
          return {
            content: commandInfo.content + result,
            type: 'pocket-nlp-result',
            nlpInfo: {
              input: naturalCommand,
              convertedCommand: conversion.command,
              args: conversion.args,
              confidence: conversion.confidence
            }
          };
        }
      } catch (error) {
        console.error('자연어 명령 실행 중 오류 발생:', error);
        return {
          ...commandInfo,
          content: commandInfo.content + `# 명령 실행 실패\n\n오류: ${error instanceof Error ? error.message : String(error)}`,
          type: 'pocket-error'
        };
      }
    } catch (error) {
      console.error('자연어 명령 처리 중 오류 발생:', error);
      return {
        content: `# 자연어 명령 처리 오류\n\n자연어 명령 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        type: 'pocket-error'
      };
    }
  }
  
  /**
   * 버킷 내 파일 목록 조회
   * @param path 조회할 경로
   * @returns 파일 목록
   */
  private async listFiles(path: string): Promise<any> {
    try {
      // 경로 정규화
      const normalizedPath = path.endsWith('/') || path === '' ? path : `${path}/`;
      
      // 파일 목록 조회
      const files = await this.client.listObjects(normalizedPath);
      
      // 결과가 없는 경우
      if (files.length === 0) {
        return {
          content: `# 파일 없음\n\n경로 \`${normalizedPath}\`에 파일이 없습니다.`,
          type: 'pocket-ls'
        };
      }
      
      // 파일과 디렉토리 분리
      const directories = files.filter(file => file.Key.endsWith('/'));
      const fileObjects = files.filter(file => !file.Key.endsWith('/'));
      
      // 결과 포맷팅
      let content = `# 파일 목록: ${normalizedPath || '/'}\n\n`;
      
      if (directories.length > 0) {
        content += '## 디렉토리\n';
        directories.forEach(dir => {
          const dirName = dir.Key.split('/').slice(-2)[0] + '/';
          content += `- 📁 \`${dirName}\`\n`;
        });
        content += '\n';
      }
      
      if (fileObjects.length > 0) {
        content += '## 파일\n';
        fileObjects.forEach(file => {
          const fileName = file.Key.split('/').pop() || '';
          const fileSize = this.formatFileSize(file.Size);
          const lastModified = new Date(file.LastModified).toLocaleString();
          content += `- 📄 \`${fileName}\` (${fileSize}, ${lastModified})\n`;
        });
      }
      
      return {
        content,
        data: files,
        type: 'pocket-ls'
      };
    } catch (error) {
      console.error('파일 목록 조회 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 파일 정보 조회
   * @param path 파일 경로
   * @returns 파일 정보
   */
  private async getFileInfo(path: string): Promise<any> {
    try {
      if (!path) {
        throw new Error('파일 경로는 필수입니다');
      }
      
      // 파일 정보 조회
      const fileInfo = await this.client.getObjectInfo(path);
      
      // 파일 유형 감지
      const fileType = this.detectFileType(path, fileInfo.ContentType);
      
      // 결과 포맷팅
      const content = `# 파일 정보: ${path}\n\n` +
                      `**유형**: ${fileInfo.ContentType || '알 수 없음'}\n` +
                      `**크기**: ${this.formatFileSize(fileInfo.ContentLength)}\n` +
                      `**마지막 수정**: ${new Date(fileInfo.LastModified).toLocaleString()}\n` +
                      `**ETag**: ${fileInfo.ETag}\n\n` +
                      `## 추가 정보\n` +
                      `**스토리지 클래스**: ${fileInfo.StorageClass || '표준'}\n` +
                      `**서버 측 암호화**: ${fileInfo.ServerSideEncryption || '없음'}\n` +
                      `**메타데이터**: ${JSON.stringify(fileInfo.Metadata || {}, null, 2)}`;
      
      return {
        content,
        data: {
          ...fileInfo,
          fileType
        },
        type: 'pocket-file-info'
      };
    } catch (error) {
      console.error('파일 정보 조회 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 파일 내용 로드
   * @param path 파일 경로
   * @returns 파일 내용
   */
  private async loadFile(path: string): Promise<any> {
    try {
      if (!path) {
        throw new Error('파일 경로는 필수입니다');
      }
      
      // 파일 내용 로드
      const fileData = await this.client.getObject(path);
      const fileInfo = await this.client.getObjectInfo(path);
      
      // 파일 유형 감지
      const fileType = this.detectFileType(path, fileInfo.ContentType);
      
      // 결과 포맷팅 (파일 유형에 따라)
      let content = `# 파일 내용: ${path}\n\n`;
      
      // 파일 정보 추가
      content += `**유형**: ${fileInfo.ContentType || '알 수 없음'}\n` +
                 `**크기**: ${this.formatFileSize(fileInfo.ContentLength)}\n` +
                 `**마지막 수정**: ${new Date(fileInfo.LastModified).toLocaleString()}\n\n`;
      
      // 파일 내용 포맷팅
      if (fileType === FileType.TEXT) {
        // 텍스트 파일인 경우
        const textContent = fileData.toString('utf-8');
        
        // 파일 확장자를 사용하여 적절한 코드 블록 언어 추가
        const extension = path.split('.').pop()?.toLowerCase() || '';
        let language = '';
        
        switch (extension) {
          case 'js':
            language = 'javascript';
            break;
          case 'ts':
            language = 'typescript';
            break;
          case 'py':
            language = 'python';
            break;
          case 'java':
            language = 'java';
            break;
          case 'json':
            language = 'json';
            break;
          case 'html':
            language = 'html';
            break;
          case 'css':
            language = 'css';
            break;
          case 'md':
            language = 'markdown';
            break;
          default:
            language = extension || '';
        }
        
        // 내용이 너무 큰 경우 잘라내기
        const MAX_CONTENT_SIZE = 50000;
        let displayContent = textContent;
        let truncated = false;
        
        if (textContent.length > MAX_CONTENT_SIZE) {
          displayContent = textContent.substring(0, MAX_CONTENT_SIZE);
          truncated = true;
        }
        
        content += `## 파일 내용\n\`\`\`${language}\n${displayContent}\n\`\`\``;
        
        if (truncated) {
          content += `\n\n**참고**: 파일이 너무 커서 처음 ${MAX_CONTENT_SIZE}자만 표시됩니다.`;
        }
      } else if (fileType === FileType.IMAGE) {
        // 이미지 파일인 경우
        content += `## 이미지 파일\n이 파일은 이미지입니다. 내용을 직접 표시할 수 없습니다.`;
      } else {
        // 바이너리 파일인 경우
        content += `## 바이너리 파일\n이 파일은 바이너리 형식입니다. 내용을 텍스트로 표시할 수 없습니다.`;
      }
      
      return {
        content,
        data: {
          fileInfo,
          fileContent: fileType === FileType.TEXT ? fileData.toString('utf-8') : null,
          fileType
        },
        type: 'pocket-file-content'
      };
    } catch (error) {
      console.error('파일 로드 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * LLM을 사용하여 파일 내용 요약
   * @param path 파일 경로
   * @returns 파일 요약
   */
  private async summarizeFile(path: string): Promise<any> {
    try {
      // LLM 서비스 확인
      if (!this.llmService) {
        throw new Error('LLM 서비스가 초기화되지 않았습니다. 파일 요약을 수행할 수 없습니다.');
      }
      
      if (!path) {
        throw new Error('파일 경로는 필수입니다');
      }
      
      // 파일 내용 로드
      const fileData = await this.client.getObject(path);
      const fileInfo = await this.client.getObjectInfo(path);
      
      // 파일 유형 감지
      const fileType = this.detectFileType(path, fileInfo.ContentType);
      
      // 텍스트 파일이 아닌 경우 요약 불가
      if (fileType !== FileType.TEXT) {
        return {
          content: `# 파일 요약 불가\n\n파일 \`${path}\`은(는) 텍스트 파일이 아니므로 요약할 수 없습니다.`,
          type: 'pocket-summarize-error'
        };
      }
      
      // 텍스트 내용 가져오기
      const textContent = fileData.toString('utf-8');
      
      // 내용이 너무 크면 자르기
      const MAX_CONTENT_SIZE = 15000; // LLM 컨텍스트 창 고려
      let contentToSummarize = textContent;
      let truncated = false;
      
      if (textContent.length > MAX_CONTENT_SIZE) {
        contentToSummarize = textContent.substring(0, MAX_CONTENT_SIZE);
        truncated = true;
      }
      
      // 파일 확장자를 감지하여 적절한 프롬프트 작성
      const extension = path.split('.').pop()?.toLowerCase() || '';
      const fileFormat = this.getFileFormatFromExtension(extension);
      
      // LLM 요청을 위한 프롬프트 생성
      const prompt = `
다음 ${fileFormat} 파일의 내용을 요약해주세요:

파일명: ${path}
파일 크기: ${this.formatFileSize(fileInfo.ContentLength)}
${truncated ? '참고: 파일이 너무 커서 처음 일부만 표시됩니다.' : ''}

파일 내용:
\`\`\`
${contentToSummarize}
\`\`\`

다음 내용을 포함하여 요약해주세요:
1. 이 파일의 주요 목적
2. 주요 내용과 구성
3. 중요한 정보나 데이터
4. 파일의 전체 구조 (섹션이나 주요 부분)

마크다운 형식으로 응답해주세요.
`;
      
      // LLM 요청
      console.log('LLM을 사용하여 파일 요약 생성 중...');
      
      const modelId = this.config.summarizeModel || this.llmService.getDefaultModelId();
      const llmResult = await this.llmService.sendRequest({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: '당신은 파일 내용을 분석하고 간결하게 요약하는 전문가입니다. 사용자가 제공한 파일을 명확하고 체계적으로 요약해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });
      
      // 결과 포맷팅
      const content = `# 파일 요약: ${path}\n\n` +
                      `**파일 유형**: ${fileInfo.ContentType || '알 수 없음'}\n` +
                      `**파일 크기**: ${this.formatFileSize(fileInfo.ContentLength)}\n` +
                      `**마지막 수정**: ${new Date(fileInfo.LastModified).toLocaleString()}\n\n` +
                      `${truncated ? '**참고**: 파일이 너무 커서 처음 일부만 요약했습니다.\n\n' : ''}` +
                      `## 요약\n${llmResult.content}`;
      
      return {
        content,
        data: {
          fileInfo,
          summary: llmResult.content,
          truncated
        },
        type: 'pocket-summarize'
      };
    } catch (error) {
      console.error('파일 요약 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 디렉토리 구조 트리 형태로 조회
   * @param path 경로
   * @param options 옵션
   * @returns 디렉토리 구조
   */
  private async getDirectoryTree(path: string, options: Record<string, any>): Promise<any> {
    try {
      // 기본 옵션 설정
      const depth = options.depth ? parseInt(options.depth) : 3;
      
      // 경로 정규화
      const normalizedPath = path.endsWith('/') || path === '' ? path : `${path}/`;
      
      // 모든 객체 조회
      const allObjects = await this.client.listAllObjects(normalizedPath);
      
      // 디렉토리 트리 구성
      const tree: any = {};
      
      allObjects.forEach(obj => {
        // 전체 키에서 기준 경로 제거
        const relativePath = obj.Key.startsWith(normalizedPath) ? 
          obj.Key.substring(normalizedPath.length) : obj.Key;
        
        // 빈 문자열이거나 깊이를 초과하는 경로는 건너뛰기
        if (!relativePath) return;
        
        // 경로 분할
        const parts = relativePath.split('/');
        
        // 지정된 깊이보다 깊은 경로는 건너뛰기
        if (parts.length > depth) return;
        
        // 트리 구성
        let current = tree;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!part && i !== parts.length - 1) continue; // 빈 부분 건너뛰기 (디렉토리 구분자 연속)
          
          // 마지막 부분이 빈 문자열인 경우 디렉토리
          const isDir = i === parts.length - 1 && !part;
          
          if (isDir) continue; // 디렉토리 자체는 이미 상위 레벨에서 처리됨
          
          // 현재 부분이 트리에 없으면 추가
          if (!current[part]) {
            // 마지막 부분이거나 다음 부분이 빈 문자열이면 파일, 아니면 디렉토리
            const isFile = i === parts.length - 1;
            
            if (isFile) {
              current[part] = {
                type: 'file',
                size: obj.Size,
                lastModified: obj.LastModified
              };
            } else {
              current[part] = {
                type: 'directory',
                children: {}
              };
            }
          }
          
          // 디렉토리인 경우 하위 레벨로 이동
          if (current[part].type === 'directory') {
            current = current[part].children;
          }
        }
      });
      
      // 트리를 문자열로 변환
      const treeString = this.formatTree(tree, '', true);
      
      // 결과 포맷팅
      const content = `# 디렉토리 구조: ${normalizedPath || '/'}\n\n` +
                      `**최대 깊이**: ${depth}\n\n` +
                      `\`\`\`\n${treeString || '(빈 디렉토리)'}\n\`\`\``;
      
      return {
        content,
        data: {
          tree,
          path: normalizedPath,
          depth
        },
        type: 'pocket-tree'
      };
    } catch (error) {
      console.error('디렉토리 구조 조회 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 파일 이름 검색
   * @param keyword 검색 키워드
   * @returns 검색 결과
   */
  private async searchFiles(keyword: string): Promise<any> {
    try {
      if (!keyword) {
        throw new Error('검색 키워드는 필수입니다');
      }
      
      // 모든 객체 조회
      const allObjects = await this.client.listAllObjects('');
      
      // 키워드로 필터링
      const matchedObjects = allObjects.filter(obj => {
        const fileName = obj.Key.split('/').pop() || '';
        return fileName.toLowerCase().includes(keyword.toLowerCase());
      });
      
      // 결과가 없는 경우
      if (matchedObjects.length === 0) {
        return {
          content: `# 검색 결과 없음\n\n키워드 \`${keyword}\`와 일치하는 파일을 찾을 수 없습니다.`,
          type: 'pocket-search'
        };
      }
      
      // 결과 포맷팅
      const content = `# 파일 검색 결과: "${keyword}"\n\n` +
                      `**총 ${matchedObjects.length}개 파일 발견**\n\n` +
                      matchedObjects.map(obj => {
                        const fileName = obj.Key.split('/').pop() || '';
                        const dirPath = obj.Key.substring(0, obj.Key.length - fileName.length);
                        return `- 📄 \`${fileName}\` (위치: \`${dirPath || '/'}\`, 크기: ${this.formatFileSize(obj.Size)})`;
                      }).join('\n');
      
      return {
        content,
        data: matchedObjects,
        type: 'pocket-search'
      };
    } catch (error) {
      console.error('파일 검색 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 파일 내용 검색
   * @param pattern 검색 패턴
   * @param path 검색 경로
   * @returns 검색 결과
   */
  private async grepFiles(pattern: string, path: string = ''): Promise<any> {
    try {
      if (!pattern) {
        throw new Error('검색 패턴은 필수입니다');
      }
      
      // 경로 정규화
      const normalizedPath = path.endsWith('/') || path === '' ? path : `${path}/`;
      
      // 해당 경로의 파일 목록 조회
      const files = await this.client.listObjects(normalizedPath);
      
      // 파일만 필터링
      const fileObjects = files.filter(file => !file.Key.endsWith('/'));
      
      // 각 파일 내용 검색
      const matchResults = [];
      
      for (const file of fileObjects) {
        try {
          // 파일 확장자 확인
          const fileName = file.Key.split('/').pop() || '';
          const extension = fileName.split('.').pop()?.toLowerCase() || '';
          
          // 텍스트 파일만 검색
          if (!this.isTextFile(extension)) continue;
          
          // 파일 내용 로드
          const fileData = await this.client.getObject(file.Key);
          const textContent = fileData.toString('utf-8');
          
          // 패턴으로 검색
          const lines = textContent.split('\n');
          const matches = [];
          
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(pattern)) {
              matches.push({
                line: i + 1,
                content: lines[i]
              });
            }
          }
          
          // 매칭된 결과가 있는 경우만 추가
          if (matches.length > 0) {
            matchResults.push({
              file: file.Key,
              matches
            });
          }
        } catch (fileError) {
          console.warn(`파일 내용 검색 중 오류 (${file.Key}):`, fileError);
          // 개별 파일 오류는 무시하고 계속 진행
        }
      }
      
      // 결과가 없는 경우
      if (matchResults.length === 0) {
        return {
          content: `# 내용 검색 결과 없음\n\n패턴 \`${pattern}\`과 일치하는 내용을 찾을 수 없습니다.`,
          type: 'pocket-grep'
        };
      }
      
      // 결과 포맷팅
      let content = `# 내용 검색 결과: "${pattern}"\n\n`;
      content += `**패턴과 일치하는 파일**: ${matchResults.length}개\n\n`;
      
      matchResults.forEach(result => {
        const fileName = result.file.split('/').pop() || '';
        content += `## 📄 ${fileName}\n`;
        content += `**경로**: \`${result.file}\`\n\n`;
        
        // 최대 표시할 매칭 수
        const MAX_MATCHES = 10;
        const displayMatches = result.matches.slice(0, MAX_MATCHES);
        const hasMoreMatches = result.matches.length > MAX_MATCHES;
        
        displayMatches.forEach(match => {
          content += `**줄 ${match.line}**: \`${match.content.trim()}\`\n`;
        });
        
        if (hasMoreMatches) {
          content += `\n... 및 ${result.matches.length - MAX_MATCHES}개 더 매칭\n`;
        }
        
        content += '\n';
      });
      
      return {
        content,
        data: matchResults,
        type: 'pocket-grep'
      };
    } catch (error) {
      console.error('파일 내용 검색 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 버킷 정보 조회
   * @returns 버킷 정보
   */
  private async getBucketInfo(): Promise<any> {
    try {
      // 버킷 정보 조회
      const bucketInfo = await this.client.getBucketInfo();
      
      // 총 객체 수 및 크기 계산
      const allObjects = await this.client.listAllObjects('');
      const totalSize = allObjects.reduce((sum, obj) => sum + obj.Size, 0);
      
      // 디렉토리 카운트
      const directories = new Set();
      allObjects.forEach(obj => {
        const parts = obj.Key.split('/');
        parts.pop(); // 마지막 파일 이름 제거
        
        let path = '';
        for (const part of parts) {
          path += part + '/';
          directories.add(path);
        }
      });
      
      // 결과 포맷팅
      const content = `# 버킷 정보: ${this.config.bucket}\n\n` +
                      `**엔드포인트**: ${this.config.endpoint}\n` +
                      `**리전**: ${this.config.region || 'us-east-1'}\n` +
                      `**총 객체 수**: ${allObjects.length}\n` +
                      `**총 디렉토리 수**: ${directories.size}\n` +
                      `**총 크기**: ${this.formatFileSize(totalSize)}\n\n` +
                      `## 버킷 속성\n` +
                      `**생성 시간**: ${bucketInfo.CreationDate ? new Date(bucketInfo.CreationDate).toLocaleString() : '알 수 없음'}\n` +
                      `**버킷 정책**: ${bucketInfo.Policy ? '있음' : '없음'}\n` +
                      `**버전 관리**: ${bucketInfo.VersioningConfiguration?.Status || '비활성화'}\n` +
                      `**공개 액세스 차단**: ${bucketInfo.BlockPublicAccessConfiguration ? '활성화' : '비활성화'}\n`;
      
      return {
        content,
        data: {
          bucketInfo,
          stats: {
            objectCount: allObjects.length,
            directoryCount: directories.size,
            totalSize
          }
        },
        type: 'pocket-bucket-info'
      };
    } catch (error) {
      console.error('버킷 정보 조회 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 파일 타입 감지
   * @param path 파일 경로
   * @param contentType ContentType 헤더
   * @returns 파일 타입
   */
  private detectFileType(path: string, contentType?: string): FileType {
    // 경로가 /로 끝나면 디렉토리
    if (path.endsWith('/')) {
      return FileType.DIRECTORY;
    }
    
    // 확장자로 판단
    const extension = path.split('.').pop()?.toLowerCase() || '';
    
    // 이미지 확장자
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    if (imageExtensions.includes(extension) || contentType?.startsWith('image/')) {
      return FileType.IMAGE;
    }
    
    // 텍스트 확장자
    if (this.isTextFile(extension) || contentType?.startsWith('text/')) {
      return FileType.TEXT;
    }
    
    // 기본값은 바이너리
    return FileType.BINARY;
  }
  
  /**
   * 텍스트 파일 여부 확인
   * @param extension 파일 확장자
   * @returns 텍스트 파일 여부
   */
  private isTextFile(extension: string): boolean {
    const textExtensions = [
      'txt', 'md', 'markdown', 'csv', 'tsv',
      'json', 'yaml', 'yml', 'xml', 'html', 'htm', 'css', 'scss', 'less',
      'js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'java', 'c', 'cpp', 'h', 'cs',
      'php', 'go', 'rs', 'sh', 'bat', 'ps1', 'log', 'ini', 'conf', 'toml',
      'sql', 'graphql', 'kt', 'swift', 'dart', 'scala', 'tex'
    ];
    
    return textExtensions.includes(extension.toLowerCase());
  }
  
  /**
   * 파일 크기 포맷팅
   * @param bytes 바이트 수
   * @returns 포맷된 파일 크기
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * 파일 확장자에 따른 형식 설명
   * @param extension 파일 확장자
   * @returns 파일 형식 설명
   */
  private getFileFormatFromExtension(extension: string): string {
    switch (extension.toLowerCase()) {
      case 'js':
        return 'JavaScript';
      case 'ts':
        return 'TypeScript';
      case 'py':
        return 'Python';
      case 'java':
        return 'Java';
      case 'c':
        return 'C';
      case 'cpp':
        return 'C++';
      case 'cs':
        return 'C#';
      case 'rb':
        return 'Ruby';
      case 'go':
        return 'Go';
      case 'rs':
        return 'Rust';
      case 'php':
        return 'PHP';
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      case 'json':
        return 'JSON';
      case 'xml':
        return 'XML';
      case 'yaml':
      case 'yml':
        return 'YAML';
      case 'md':
      case 'markdown':
        return 'Markdown';
      case 'txt':
        return '텍스트';
      case 'csv':
        return 'CSV';
      case 'sql':
        return 'SQL';
      case 'sh':
        return 'Shell';
      case 'bat':
        return 'Batch';
      case 'ps1':
        return 'PowerShell';
      case 'ini':
      case 'conf':
        return '설정';
      default:
        return extension ? extension.toUpperCase() : '텍스트';
    }
  }
  
  /**
   * 트리 구조 포맷팅
   * @param tree 트리 객체
   * @param prefix 접두사 (들여쓰기용)
   * @param isRoot 루트 노드 여부
   * @returns 포맷된 트리 문자열
   */
  private formatTree(tree: any, prefix: string = '', isRoot: boolean = false): string {
    let result = '';
    
    // 노드 정렬 (디렉토리 먼저, 그 다음 파일)
    const sortedEntries = Object.entries(tree).sort((a, b) => {
      const aIsDir = a[1].type === 'directory';
      const bIsDir = b[1].type === 'directory';
      
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a[0].localeCompare(b[0]);
    });
    
    // 각 항목 처리
    sortedEntries.forEach(([name, info], index) => {
      const isLast = index === sortedEntries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      
      // 파일이나 디렉토리 표시
      if (info.type === 'directory') {
        result += `${prefix}${isRoot ? '' : connector}📁 ${name}/\n`;
        result += this.formatTree(info.children, newPrefix);
      } else {
        // 파일 크기 포맷팅
        const sizeStr = info.size !== undefined ? ` (${this.formatFileSize(info.size)})` : '';
        result += `${prefix}${isRoot ? '' : connector}📄 ${name}${sizeStr}\n`;
      }
    });
    
    return result;
  }
  
  /**
   * 명령어 옵션 추출
   * @param args 명령어 인자
   * @returns 옵션 객체
   */
  private extractOptions(args: any[]): Record<string, any> {
    const options: Record<string, any> = {};
    
    // 플래그 형식 옵션 추출 (--key=value 또는 --flag)
    for (const arg of args) {
      if (typeof arg === 'string' && arg.startsWith('--')) {
        const parts = arg.substring(2).split('=');
        const key = parts[0];
        const value = parts.length > 1 ? parts.slice(1).join('=') : true;
        
        if (key) {
          options[key] = value;
        }
      }
    }
    
    return options;
  }
}