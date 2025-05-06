const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
// ESLint 플러그인은 현재 사용하지 않음
// const eslintPlugin = require('esbuild-plugin-eslint');
const { copy } = require('esbuild-plugin-copy');
const path = require('path');
const fs = require('fs');

// Command line arguments
const args = process.argv.slice(2);
const production = args.includes('--production');
const watch = args.includes('--watch');
const clean = args.includes('--clean');
const analyze = args.includes('--analyze');

// Clean dist directory if --clean is specified
if (clean) {
  console.log('Cleaning dist directory...');
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true, force: true });
  }
  if (!args.includes('--build')) {
    process.exit(0);
  }
}

// 이 함수는 플러그인으로 대체되므로 더 이상 사용되지 않음
// 하지만 이전 코드와의 호환성을 위해 유지
function copyWebAssets() {
  console.log('Using esbuild-plugin-copy for assets instead of manual copy...');
}

const commonConfig = {
  entryPoints: ['./src/extension.ts'],
  bundle: true,
  outdir: 'dist',
  platform: 'node',
  target: 'node16',
  sourcemap: true, // 디버깅을 위해 항상 소스맵 생성
  minify: production,
  format: 'cjs',
  plugins: [
    // 외부 모듈 처리 (node_modules)
    nodeExternalsPlugin({
      allowList: [] // 필요한 내부 모듈만 번들링
    }),
    
    // ESLint 검사는 현재 비활성화
    /*
    !production && eslintPlugin({
      filter: /\.(ts|tsx)$/,
      throwOnError: false,
      throwOnWarning: false
    }),
    */
    
    // 정적 자산 복사
    copy({
      assets: [
        // resources 디렉토리 전체 복사
        {
          from: ['./resources/**/*'],
          to: ['./dist/resources'],
          keepStructure: true
        }
      ],
      watch: watch
    })
  ].filter(Boolean), // false/undefined/null 제거
  
  define: {
    'process.env.NODE_ENV': production ? '"production"' : '"development"'
  },
  logLevel: 'info',
  external: ['vscode'], // vscode는 항상 외부 모듈로 처리
  metafile: true, // 번들링 결과 메타데이터 생성
  treeShaking: true, // 사용하지 않는 코드 제거
  loader: { // 특정 파일 타입에 대한 로더 설정
    '.ts': 'ts',
    '.js': 'js',
    '.json': 'json',
    '.png': 'file',
    '.svg': 'file',
    '.css': 'text', // CSS 파일 처리
    '.html': 'text' // HTML 파일 처리
  }
};

async function build() {
  try {
    if (watch) {
      // Watch mode
      const ctx = await esbuild.context(commonConfig);
      await ctx.watch();
      console.log('Watching for changes...');
      
      // resource 변경 알림 (esbuild-plugin-copy가 실제 복사 처리)
      console.log('Resources will be automatically copied on changes (handled by plugin)');
      
    } else {
      // Single build
      console.time('Build completed in');
      const result = await esbuild.build(commonConfig);
      console.timeEnd('Build completed in');
      
      // 번들 분석 (--analyze 플래그 사용 시)
      if (result.metafile && analyze) {
        console.log('Analyzing bundle...');
        const metrics = await esbuild.analyzeMetafile(result.metafile, {
          verbose: true,
          color: true
        });
        console.log('Bundle analysis:');
        console.log(metrics);
        
        // 메타파일 저장 (추후 분석을 위해)
        const metaFilePath = './dist/meta.json';
        fs.writeFileSync(metaFilePath, JSON.stringify(result.metafile, null, 2));
        console.log(`Metadata saved to ${metaFilePath}`);
        
        // 번들 파일 크기 분석
        console.log('\nBundle size analysis:');
        const outputs = Object.keys(result.metafile.outputs);
        outputs.forEach(output => {
          const fileInfo = result.metafile.outputs[output];
          // 주요 번들 파일만 표시 (JS 파일)
          if (output.endsWith('.js')) {
            const sizeInKB = Math.round(fileInfo.bytes / 1024);
            console.log(`${output}: ${sizeInKB} KB`);
            
            // 큰 의존성 표시 (500바이트 이상)
            const bigImports = Object.entries(fileInfo.imports)
              .filter(([_, imp]) => imp.bytesInOutput > 500)
              .sort((a, b) => b[1].bytesInOutput - a[1].bytesInOutput);
              
            if (bigImports.length > 0) {
              console.log('  Top dependencies:');
              bigImports.slice(0, 5).forEach(([name, imp]) => {
                console.log(`  - ${name}: ${Math.round(imp.bytesInOutput / 1024)} KB`);
              });
            }
          }
        });
      }
      
      console.log('Build completed successfully!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();