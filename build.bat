@echo off
echo ===== APE Extension Build and Install =====
echo Current working directory: %CD%

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    exit /b 1
)

REM Display versions
echo Node.js version:
node --version
echo NPM version:
npm --version

REM Install dependencies
echo Installing dependencies...
call npm install

REM Set internal environment
echo Setting up internal environment...
copy /Y extension.env.internal.js dist\extension.env.js
copy /Y config\internal\settings.json dist\settings.json

REM Clean build
echo Running clean build...
call node esbuild.config.js --clean --build

REM Initialize permissions
echo Setting up permissions...
call node init_permissions.js

REM Install to VS Code extensions
echo Installing extension to VS Code...

REM Remove existing extension
if exist "%USERPROFILE%\.vscode\extensions\ape-team.ape-0.0.1" (
    echo Removing existing APE extension...
    rmdir /S /Q "%USERPROFILE%\.vscode\extensions\ape-team.ape-0.0.1"
)

REM Create extension directory
echo Creating extension directory...
mkdir "%USERPROFILE%\.vscode\extensions\ape-team.ape-0.0.1"

REM Copy files
echo Copying files...
xcopy /E /Y dist\* "%USERPROFILE%\.vscode\extensions\ape-team.ape-0.0.1\"
xcopy /E /Y node_modules "%USERPROFILE%\.vscode\extensions\ape-team.ape-0.0.1\node_modules\"
copy /Y package.json "%USERPROFILE%\.vscode\extensions\ape-team.ape-0.0.1\"

echo ===== APE Extension Build and Install Complete =====
echo Installation location: %USERPROFILE%\.vscode\extensions\ape-team.ape-0.0.1
echo Please restart VS Code to load the extension.