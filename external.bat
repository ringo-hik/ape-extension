@echo off
echo ===== APE EXTERNAL MODE SETUP =====

REM Create required directories
if not exist "dist" mkdir dist

REM Set to external mode
echo Setting to external mode...
copy /Y extension.env.external.js extension.env.js
copy /Y extension.env.js dist\extension.env.js
copy /Y config\external\settings.json dist\settings.json

REM Build
echo Building extension...
call npm run build

echo ===== DONE - EXTERNAL MODE ACTIVATED =====
echo Run 'code --extensionDevelopmentPath=%CD%' or press F5 in VS Code