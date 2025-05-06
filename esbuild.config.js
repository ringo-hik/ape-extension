/**
 * esbuild.config.js
 * VS Code Extension build configuration
 * 
 * 내부망/외부망 환경에 따라 설정 파일만 달리 사용하고 코드는 동일하게 유지
 */

const esbuild = require('esbuild');
const { copy } = require('esbuild-plugin-copy');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const { ESLint } = require('eslint');
const path = require('path');
const fs = require('fs');

// Process command-line arguments
const args = process.argv.slice(2);
const isProduction = args.includes('--production');
const isWatch = args.includes('--watch');
const isClean = args.includes('--clean');
const isAnalyze = args.includes('--analyze');
const isBuild = args.includes('--build') || isProduction;
const isInternal = args.includes('--env=internal');
const isExternal = args.includes('--env=external') || (!isInternal); // Default to external

// 환경 설정
console.log(`빌드 환경: ${isInternal ? '내부망' : '외부망'}`);

// Output directory
const outdir = 'dist';

// Clean build directory if requested
if (isClean) {
  console.log('Cleaning output directory...');
  try {
    if (fs.existsSync(outdir)) {
      fs.rmSync(outdir, { recursive: true, force: true });
    }
    fs.mkdirSync(outdir, { recursive: true });
    console.log('Clean completed successfully');
  } catch (err) {
    console.error('Error during clean:', err);
  }
}

// Build configuration
const buildOptions = {
  entryPoints: ['src/extension.ts'],
  outfile: `${outdir}/extension.js`,
  bundle: true,
  minify: isProduction,
  sourcemap: !isProduction,
  platform: 'node',
  external: ['vscode'],
  logLevel: 'info',
  banner: {
    js: '// APE Extension - Agentic Pipeline Engine\n// Generated: ' + new Date().toISOString(),
  },
  plugins: [
    // Exclude node_modules from bundling
    nodeExternalsPlugin(),
    
    // Copy static assets
    copy({
      resolveFrom: 'cwd',
      assets: [
        { from: ['resources/**/*'], to: ['./dist/resources'] }
      ]
    }),
  ],
  define: {
    'process.env.NODE_ENV': isProduction 
      ? '"production"' 
      : '"development"'
  },
};

// Watch mode
if (isWatch) {
  console.log('Starting watch mode...');
  esbuild.context(buildOptions)
    .then(ctx => ctx.watch())
    .then(() => {
      console.log('Watching for changes...');
    })
    .catch(err => {
      console.error('Watch error:', err);
      process.exit(1);
    });
} 
// Normal build
else {
  console.log(`Building in ${isProduction ? 'production' : 'development'} mode...`);
  esbuild.build(buildOptions)
    .then(() => {
      console.log('Build completed successfully');
      
      // Copy environment file
      try {
        const envFile = 'extension.env.js';
        
        if (fs.existsSync(envFile)) {
          fs.copyFileSync(envFile, path.join(outdir, 'extension.env.js'));
          console.log(`Copied environment file: ${envFile}`);
        } else {
          console.warn(`Warning: Environment file ${envFile} not found`);
        }
        
        // Copy settings
        const settingsDestDir = path.join(outdir, 'config');
        
        if (!fs.existsSync(settingsDestDir)) {
          fs.mkdirSync(settingsDestDir, { recursive: true });
        }
        
        // Create a default settings.json if it doesn't exist
        const settingsDestFile = path.join(settingsDestDir, 'settings.json');
        
        if (!fs.existsSync(settingsDestFile)) {
          const defaultSettings = {
            "environment": "unified",
            "apiBaseUrl": "https://api.example.com",
            "logLevel": "info",
            "features": {
              "streamingEnabled": true,
              "sslVerification": true
            }
          };
          
          fs.writeFileSync(settingsDestFile, JSON.stringify(defaultSettings, null, 2));
          console.log(`Created default settings.json`);
        }
      } catch (err) {
        console.warn('Warning: Could not copy environment files:', err.message);
      }
    })
    .catch(err => {
      console.error('Build error:', err);
      process.exit(1);
    });
}