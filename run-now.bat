@echo off
echo ===== APE EMERGENCY LAUNCHER =====

REM Create all required directories
if not exist "dist" mkdir dist

REM Copy ALL required files
echo Copying ALL environment files...
copy /Y extension.env.internal.js extension.env.js
copy /Y extension.env.js dist\extension.env.js
copy /Y config\internal\settings.json dist\settings.json

REM Create init context file if needed
echo Creating initialization context...
echo /* APE Extension Initialization Context */ > dist\init.context.js
echo var APE_ENV = { internal: true, ready: true }; >> dist\init.context.js

REM Copy node_modules
if not exist "dist\node_modules" mkdir dist\node_modules
echo Copying core dependencies...
xcopy /E /Y node_modules\@phosphor-icons dist\node_modules\@phosphor-icons\

REM Build
echo Full emergency build...
call npm run build

REM Launch VS Code directly
echo Starting VS Code...
start code --extensionDevelopmentPath=%CD%

echo ===== EMERGENCY LAUNCH COMPLETE =====