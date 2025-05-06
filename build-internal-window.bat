@echo off
REM build-internal-window.bat - Build script for internal environment

echo =====================================================
echo         APE Extension - Internal Build Script        
echo =====================================================
echo.

REM Step 1: Clean previous build artifacts
echo [1/5] Cleaning previous build artifacts...
if exist dist rmdir /s /q dist
if exist *.vsix del /q *.vsix

REM Step 2: Simply copy source files instead of compiling (for development purposes)
echo [2/5] Copying source files...
mkdir dist\src
xcopy /E /I /Y src\* dist\src\

REM Step 3: Copy resources to dist folder
echo [3/5] Copying resources...
mkdir dist
xcopy /E /I /Y resources dist\resources
copy /Y package.json dist\

REM Step 4: Create a simple deployment package
echo [4/5] Creating deployment package...
set VSIX_DIR=ape-extension-internal
if exist %VSIX_DIR% rmdir /s /q %VSIX_DIR%
mkdir %VSIX_DIR%

REM Copy built files to deployment directory
xcopy /E /I /Y dist\* %VSIX_DIR%\
copy /Y package.json %VSIX_DIR%\
xcopy /E /I /Y resources %VSIX_DIR%\resources\

REM Fix main entry point in package.json
powershell -Command "(Get-Content %VSIX_DIR%\package.json) -replace '\"main\": \"./dist/extension.js\"', '\"main\": \"./extension.js\"' | Set-Content %VSIX_DIR%\package.json"

REM Create a minimal entry point JS file if it doesn't exist
if not exist "%VSIX_DIR%\extension.js" (
    echo Creating minimal extension.js entry point...
    echo // APE Extension entry point > %VSIX_DIR%\extension.js
    echo const src = require('./src/extension'); >> %VSIX_DIR%\extension.js
    echo. >> %VSIX_DIR%\extension.js
    echo // Export all functions from the src/extension module >> %VSIX_DIR%\extension.js
    echo module.exports = { >> %VSIX_DIR%\extension.js
    echo   activate: src.activate, >> %VSIX_DIR%\extension.js
    echo   deactivate: src.deactivate >> %VSIX_DIR%\extension.js
    echo }; >> %VSIX_DIR%\extension.js
)

REM Create archive using PowerShell
set ZIP_FILE=ape-extension-internal.zip
if exist %ZIP_FILE% del /f %ZIP_FILE%

powershell -Command "Compress-Archive -Path '%VSIX_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"

echo [5/5] Extension package created: %ZIP_FILE%

REM Direct installation method - create extension in VS Code extensions folder
echo.
echo Installing extension directly...

REM Get VSCode extensions directory
set VSCODE_EXT_DIR=%USERPROFILE%\.vscode\extensions
if exist "%APPDATA%\Code\User\extensions" (
    set VSCODE_EXT_DIR=%APPDATA%\Code\User\extensions
)

REM Create extension directory with unique name including version
set EXT_INSTALL_DIR=%VSCODE_EXT_DIR%\ape-team.ape-0.0.1-internal

REM Remove existing extension if it exists
if exist "%EXT_INSTALL_DIR%" rmdir /s /q "%EXT_INSTALL_DIR%"

REM Create extension directory and copy files
mkdir "%EXT_INSTALL_DIR%"
xcopy /E /I /Y "%VSIX_DIR%\*" "%EXT_INSTALL_DIR%\"

echo Extension successfully installed to: %EXT_INSTALL_DIR%
echo.
echo To activate the extension:
echo 1. Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)
echo 2. Type 'Reload Window' and press Enter
echo.
echo Or start in development mode:
echo 1. Press F5 in VS Code to start debugging
echo 2. Or select 'File ^> Open Folder' to open this folder and start debugging

REM Display success message
echo.
echo =====================================================
echo           Build and Installation Complete            
echo =====================================================
echo.
echo The APE extension (internal version) has been successfully
echo built and installed.
echo.
echo Please reload VS Code to activate the new version:
echo   1. Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)
echo   2. Type 'Reload Window' and press Enter
echo.
echo ====================================================