/**
 * esbuild.config.js
 * VS Code Extension build configuration
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
  plugins: [
    // Exclude node_modules from bundling
    nodeExternalsPlugin(),
    
    // Copy static assets
    copy({
      resolveFrom: 'cwd',
      assets: [
        { from: 'resources/**/*', to: 'resources' },
        { from: 'package.json', to: './' },
        { from: 'README.md', to: './' },
        { from: 'LICENSE', to: './' },
      ],
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
      
      // Copy environment file based on environment
      try {
        const envFile = fs.existsSync('extension.env.js') 
          ? 'extension.env.js'
          : (fs.existsSync('extension.env.external.js') 
              ? 'extension.env.external.js' 
              : null);
        
        if (envFile) {
          fs.copyFileSync(envFile, path.join(outdir, 'extension.env.js'));
          console.log(`Copied environment file: ${envFile}`);
        }
      } catch (err) {
        console.warn('Warning: Could not copy environment file:', err.message);
      }
    })
    .catch(err => {
      console.error('Build error:', err);
      process.exit(1);
    });
}