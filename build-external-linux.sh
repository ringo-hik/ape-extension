#!/bin/bash
# build-external-linux.sh - Build script for external environment

echo "====================================================="
echo "        APE Extension - External Build Script        "
echo "====================================================="
echo

# Ensure execution from the correct directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Clean previous build artifacts
echo "[1/5] Cleaning previous build artifacts..."
rm -rf dist/*
rm -f *.vsix

# Step 2: Build the TypeScript files
echo "[2/5] Building TypeScript files..."
npx tsc

# Step 3: Copy resources to dist folder
echo "[3/5] Copying resources..."
mkdir -p dist
cp -r resources dist/
cp package.json dist/

# Step 4: Create a simple deployment package
echo "[4/5] Creating deployment package..."
VSIX_DIR="ape-extension-external"
rm -rf "$VSIX_DIR" 2>/dev/null
mkdir -p "$VSIX_DIR"

# Copy built files to deployment directory
cp -r dist/* "$VSIX_DIR/"
cp package.json "$VSIX_DIR/"
cp -r resources "$VSIX_DIR/"

# Create archive (using tar if zip is not available)
ZIP_FILE="ape-extension-external.zip"
TAR_FILE="ape-extension-external.tar.gz"
rm -f "$ZIP_FILE" "$TAR_FILE" 2>/dev/null

# Check if zip is available
if command -v zip >/dev/null 2>&1; then
    (cd "$VSIX_DIR" && zip -r "../$ZIP_FILE" *)
    PACKAGE_FILE="$ZIP_FILE"
else
    echo "Note: zip command not found, using tar.gz instead"
    (cd "$VSIX_DIR" && tar -czf "../$TAR_FILE" *)
    PACKAGE_FILE="$TAR_FILE"
fi

echo "[5/5] Extension package created: $ZIP_FILE"
echo
echo "To install manually in VS Code:"
echo "1. Open VS Code"
echo "2. Go to Extensions view (Ctrl+Shift+X)"
echo "3. Click on the '...' menu in the top-right"
echo "4. Select 'Install from VSIX...'"
echo "5. Navigate to and select: $PWD/$ZIP_FILE"
echo
echo "Or start in development mode:"
echo "1. Press F5 in VS Code to start debugging"
echo "2. Or select 'File > Open Folder' to open this folder and start debugging"

# Display success message
echo
echo "====================================================="
echo "          Build and Installation Complete            "
echo "====================================================="
echo
echo "The APE extension (external version) has been successfully"
echo "built and installed."
echo
echo "Please reload VS Code to activate the new version:"
echo "  1. Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)"
echo "  2. Type 'Reload Window' and press Enter"
echo
echo "====================================================="