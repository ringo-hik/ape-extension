@echo off
echo ===== Running APE Extension (Internal Mode) =====

REM Create required directories if they don't exist
if not exist "dist" mkdir dist

REM Set internal environment
echo Setting up internal environment...
copy /Y extension.env.internal.js dist\extension.env.js
copy /Y config\internal\settings.json dist\settings.json

REM Configure environment properly
echo Configuring environment...
if not exist "extension.env.js" copy /Y extension.env.internal.js extension.env.js

REM Build the extension
echo Building extension...
call npm run build

REM Starting VS Code with extension
echo Launching VS Code with extension...
start "APE Extension" /B code --extensionDevelopmentPath=%CD%

echo ===== VS Code should be starting with the APE extension loaded =====