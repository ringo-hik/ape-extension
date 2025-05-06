@echo off
echo ===== APE INTERNAL MODE SETUP =====

REM Create required directories
if not exist "dist" mkdir dist

REM Set to internal mode
echo Setting to internal mode...
copy /Y extension.env.internal.js extension.env.js
copy /Y extension.env.js dist\extension.env.js
copy /Y config\internal\settings.json dist\settings.json

REM Build
echo Building extension...
call npm run build

echo ===== DONE - INTERNAL MODE ACTIVATED =====
echo Run 'code --extensionDevelopmentPath=%CD%' or press F5 in VS Code