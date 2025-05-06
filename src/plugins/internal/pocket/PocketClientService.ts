/**
 * Pocket 클라이언트 서비스
 * 
 * S3 호환 스토리지 API와 통신하는 클라이언트 서비스
 * AWS SDK 또는 호환 라이브러리를 사용하여 S3 호환 스토리지 작업 수행
 */



interface S3 {
  headBucket(params: { Bucket: string }): { promise(): Promise<any> };
  getBucketPolicy(params: { Bucket: string }): { promise(): Promise<any> };
  getBucketVersioning(params: { Bucket: string }): { promise(): Promise<any> };
  listObjectsV2(params: any): { promise(): Promise<any> };
  headObject(params: any): { promise(): Promise<any> };
  getObject(params: any): { promise(): Promise<any> };
}


interface S3Object {
  Key?: string;
  LastModified?: Date;
  Size?: number;
  StorageClass?: string;
  ETag?: string;
}

interface S3CommonPrefix {
  Prefix?: string;
}

interface S3ListObjectsOutput {
  Contents?: S3Object[];
  CommonPrefixes?: S3CommonPrefix[];
  NextContinuationToken?: string;
}

interface S3GetObjectOutput {
  Body?: Buffer | Uint8Array | string;
  ContentType?: string;
  ETag?: string;
  LastModified?: Date;
}


import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * S3 클라이언트 구성 인터페이스
 */
interface S3ClientConfig {
  endpoint: string;
  region: string;
  bucket: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Pocket 클라이언트 서비스 클래스
 * S3 호환 스토리지 서비스와 통신
 */
export class PocketClientService {
  private s3: S3 | null = null;
  private config: S3ClientConfig;
  private tempDir: string;
  private isInitialized: boolean = false;

  /**
   * PocketClientService 생성자
   * @param endpoint S3 엔드포인트 URL
   * @param region AWS 리전 (기본값: us-east-1)
   * @param bucket 기본 버킷 이름
   * @param credentials AWS 인증 정보
   */
  constructor(
    endpoint: string,
    region: string = 'us-east-1',
    bucket: string,
    credentials: { accessKeyId: string; secretAccessKey: string }
  ) {
    this.config = {
      endpoint,
      region,
      bucket,
      credentials
    };

    
    

    
    this.tempDir = path.join(os.tmpdir(), 'ape-pocket-cache');
    this.ensureTempDir();
  }

  /**
   * 임시 디렉토리 생성
   */
  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }
  
  /**
   * S3 클라이언트 초기화
   * 지연 초기화 패턴으로 필요할 때만 AWS SDK 로드
   */
  private async initializeS3(): Promise<boolean> {
    if (this.isInitialized && this.s3) {
      return true;
    }
    
    try {
      
      try {
        
        const AWS = await import('aws-sdk');
        
        
        this.s3 = new AWS.S3({
          endpoint: this.config.endpoint,
          region: this.config.region,
          credentials: this.config.credentials,
          s3ForcePathStyle: true,
          signatureVersion: 'v4'
        });
        
        this.isInitialized = true;
        return true;
      } catch (importError) {
        console.error('AWS SDK 로드 실패:', importError);
        
        
        if (process.env.NODE_ENV === 'test') {
          console.warn('테스트 환경에서 모의 S3 객체 생성');
          this.createMockS3();
          this.isInitialized = true;
          return true;
        }
        
        return false;
      }
    } catch (error) {
      console.error('S3 클라이언트 초기화 실패:', error);
      return false;
    }
  }
  
  /**
   * 테스트용 모의 S3 객체 생성
   */
  private createMockS3(): void {
    
    this.s3 = {
      headBucket: () => ({ promise: async () => ({}) }),
      getBucketPolicy: () => ({ promise: async () => ({ Policy: '{}' }) }),
      getBucketVersioning: () => ({ promise: async () => ({ Status: 'Disabled' }) }),
      listObjectsV2: () => ({ promise: async () => ({ Contents: [] }) }),
      headObject: () => ({ promise: async () => ({}) }),
      getObject: () => ({ promise: async () => ({ Body: Buffer.from('{}') }) })
    };
  }

  /**
   * S3 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      
      if (!await this.initializeS3()) {
        return false;
      }
      
      
      if (!this.s3) {
        throw new Error('S3 클라이언트가 초기화되지 않았습니다');
      }
      
      await this.s3.headBucket({ Bucket: this.config.bucket }).promise();
      console.log(`S3 연결 성공 (${this.config.endpoint}, 버킷: ${this.config.bucket})`);
      return true;
    } catch (error) {
      console.error('S3 연결 테스트 실패:', error);
      return false;
    }
  }

  /**
   * 버킷 정보 조회
   */
  async getBucketInfo(): Promise<any> {
    try {
      
      if (!await this.initializeS3()) {
        throw new Error('S3 클라이언트를 초기화할 수 없습니다');
      }
      
      if (!this.s3) {
        throw new Error('S3 클라이언트가 초기화되지 않았습니다');
      }
      
      const result = await this.s3.headBucket({ Bucket: this.config.bucket }).promise();
      
      
      try {
        const policyResult = await this.s3.getBucketPolicy({ Bucket: this.config.bucket }).promise();
        (result as any).Policy = policyResult.Policy;
      } catch (policyError) {
        
      }
      
      
      try {
        const versioningResult = await this.s3.getBucketVersioning({ Bucket: this.config.bucket }).promise();
        (result as any).VersioningConfiguration = versioningResult;
      } catch (versioningError) {
        
      }
      
      return result;
    } catch (error) {
      console.error('버킷 정보 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 객체 목록 조회
   * @param prefix 객체 접두사 (경로)
   * @param delimiter 구분자 (기본값: /)
   * @returns 객체 목록
   */
  async listObjects(prefix: string = '', delimiter: string = '/'): Promise<AWS.S3.Object[]> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: this.config.bucket,
        Prefix: prefix,
        Delimiter: delimiter
      };
      
      const result = await this.s3.listObjectsV2(params).promise();
      
      
      const objects: AWS.S3.Object[] = result.Contents || [];
      
      
      if (result.CommonPrefixes && result.CommonPrefixes.length > 0) {
        for (const commonPrefix of result.CommonPrefixes) {
          if (commonPrefix.Prefix) {
            objects.push({
              Key: commonPrefix.Prefix,
              LastModified: new Date(),
              Size: 0,
              StorageClass: 'DIRECTORY'
            });
          }
        }
      }
      
      return objects;
    } catch (error) {
      console.error('객체 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 객체 목록 조회 (재귀)
   * @param prefix 객체 접두사 (경로)
   * @returns 모든 객체 목록
   */
  async listAllObjects(prefix: string = ''): Promise<AWS.S3.Object[]> {
    try {
      const result: AWS.S3.Object[] = [];
      let continuationToken: string | undefined;
      
      do {
        const params: AWS.S3.ListObjectsV2Request = {
          Bucket: this.config.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken
        };
        
        const response = await this.s3.listObjectsV2(params).promise();
        
        if (response.Contents) {
          result.push(...response.Contents);
        }
        
        continuationToken = response.NextContinuationToken;
      } while (continuationToken);
      
      return result;
    } catch (error) {
      console.error('모든 객체 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 객체 정보 조회
   * @param key 객체 키 (경로)
   * @returns 객체 정보
   */
  async getObjectInfo(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: this.config.bucket,
        Key: key
      };
      
      return await this.s3.headObject(params).promise();
    } catch (error) {
      console.error(`객체 정보 조회 실패 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 객체 내용 가져오기
   * @param key 객체 키 (경로)
   * @returns 객체 내용 (Buffer)
   */
  async getObject(key: string): Promise<Buffer> {
    try {
      
      const cacheKey = this.getCacheKey(key);
      
      if (fs.existsSync(cacheKey)) {
        try {
          
          const cachedInfo = JSON.parse(fs.readFileSync(`${cacheKey}.meta`, 'utf8'));
          const remoteInfo = await this.getObjectInfo(key);
          
          
          if (cachedInfo.ETag === remoteInfo.ETag) {
            return fs.readFileSync(cacheKey);
          }
        } catch (cacheError) {
          console.warn('캐시 검증 실패, 원격 객체 사용:', cacheError);
        }
      }
      
      
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.config.bucket,
        Key: key
      };
      
      const result = await this.s3.getObject(params).promise();
      const data = result.Body instanceof Buffer ? result.Body : Buffer.from(result.Body as any);
      
      
      try {
        fs.writeFileSync(cacheKey, data);
        fs.writeFileSync(`${cacheKey}.meta`, JSON.stringify({
          ETag: result.ETag,
          LastModified: result.LastModified,
          ContentType: result.ContentType
        }));
      } catch (cacheError) {
        console.warn('캐시 저장 실패:', cacheError);
      }
      
      return data;
    } catch (error) {
      console.error(`객체 내용 가져오기 실패 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 캐시 키 생성
   * @param key 객체 키
   * @returns 캐시 키
   */
  private getCacheKey(key: string): string {
    
    const safeKey = key.replace(/[/\\?%*:|"<>]/g, '_');
    return path.join(this.tempDir, safeKey);
  }
}