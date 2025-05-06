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

REM Step 2: Build the TypeScript files
echo [2/5] Building TypeScript files...
call npx tsc

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

REM Create archive using PowerShell
set ZIP_FILE=ape-extension-internal.zip
if exist %ZIP_FILE% del /f %ZIP_FILE%

powershell -Command "Compress-Archive -Path '%VSIX_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"

echo [5/5] Extension package created: %ZIP_FILE%
echo.
echo To install manually in VS Code:
echo 1. Open VS Code
echo 2. Go to Extensions view (Ctrl+Shift+X)
echo 3. Click on the '...' menu in the top-right
echo 4. Select 'Install from VSIX...'
echo 5. Navigate to and select: %CD%\%ZIP_FILE%
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