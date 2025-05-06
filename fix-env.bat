@echo off
echo ===== APE ENVIRONMENT FIX =====

REM Create dist directory if it doesn't exist
if not exist "dist" mkdir dist

REM Copy all environment files
echo Copying environment files...
copy /Y extension.env.internal.js extension.env.js
copy /Y extension.env.js dist\extension.env.js
copy /Y config\internal\settings.json dist\settings.json

REM Create init context file
echo Creating init context...
echo /* APE Extension Initialization Context */ > dist\init.context.js
echo var APE_ENV = { internal: true, ready: true }; >> dist\init.context.js

echo ===== ENVIRONMENT FIXED =====
echo Run "npm run build" and then launch VS Code with F5