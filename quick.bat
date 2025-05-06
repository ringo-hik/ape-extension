@echo off
echo ===== APE Quick Dev Setup (Internal Mode) =====

REM Create required directories if they don't exist
if not exist "dist" mkdir dist

REM Copy assets required for extension
echo Copying license and readme...
if exist "LICENSE" copy /Y LICENSE dist\LICENSE
if exist "README.md" copy /Y README.md dist\README.md

REM Set internal environment
echo Setting up internal environment...
copy /Y extension.env.internal.js extension.env.js
copy /Y extension.env.js dist\extension.env.js
copy /Y config\internal\settings.json dist\settings.json

REM Configure environment properly
echo Configuring environment...
if not exist "extension.env.js" copy /Y extension.env.internal.js extension.env.js

REM Building the extension
echo Building extension...
call npm run build

REM Launching VS Code with the extension
echo Starting VS Code with the extension...
code --extensionDevelopmentPath=%CD%

echo ===== Dev Setup Complete =====
echo Extension should be running in the new VS Code window