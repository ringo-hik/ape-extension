@echo off
echo ===== APE Extension Dev Setup =====

REM Set internal environment for development
echo Setting up internal environment...
copy /Y extension.env.internal.js dist\extension.env.js
copy /Y config\internal\settings.json dist\settings.json

REM Build the extension
echo Building extension...
npm run build

echo ===== Dev Setup Complete =====
echo Press F5 in VS Code to start debugging