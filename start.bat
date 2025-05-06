@echo off
echo ===== SIMPLE APE STARTER =====

REM Create required directories
if not exist "dist" mkdir dist

REM Copy environment files (BOTH LOCATIONS)
echo Copying environment files...
copy /Y extension.env.internal.js extension.env.js
copy /Y extension.env.js dist\extension.env.js

REM Copy settings
echo Copying settings...
copy /Y config\internal\settings.json dist\settings.json

REM Build
echo Building extension...
call npm run build

REM Start VS Code
echo Starting VS Code...
start "VS Code with APE" code --extensionDevelopmentPath=%CD%

echo ===== STARTED =====