@echo off
echo ===== APE Quick Dev Setup (Internal Mode) =====

REM Set internal environment
echo Setting up internal environment...
copy /Y extension.env.internal.js dist\extension.env.js
copy /Y config\internal\settings.json dist\settings.json

REM Build the extension
echo Building extension...
npm run build

echo ===== Dev Setup Complete =====
echo Press F5 in VS Code to start debugging