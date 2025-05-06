@echo off
echo ===== APE EXTENSION - INTERNAL MODE (WINDOWS) =====

REM Create directories
if not exist "dist" mkdir dist

REM Copy environment files
echo Setting up internal environment...
copy /Y extension.env.internal.js extension.env.js
copy /Y extension.env.js dist\extension.env.js 
copy /Y config\internal\settings.json dist\settings.json

REM Create initialization context
echo Creating initialization context...
echo /* APE Extension Initialization Context */ > dist\init.context.js
echo var APE_ENV = { internal: true, ready: true }; >> dist\init.context.js

REM Build the extension
echo Building extension...
call npm run build

REM Start VS Code
echo Starting VS Code...
start code --extensionDevelopmentPath=%CD%

echo ===== SETUP COMPLETE =====
echo APE Extension is running in internal mode