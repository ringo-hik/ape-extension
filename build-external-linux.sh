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

# Step 2: Running the build script
echo "[2/5] Building with esbuild..."
npm run build

# Step 3: Copy resources to dist folder if not already copied
echo "[3/5] Copying resources..."
mkdir -p dist
[ -d "dist/resources" ] || cp -r resources dist/
[ -f "dist/package.json" ] || cp package.json dist/
[ -f "dist/extension.env.js" ] || cp extension.env.js dist/

# Step 4: Create a simple deployment package
echo "[4/5] Creating deployment package..."
VSIX_DIR="ape-extension-external"
rm -rf "$VSIX_DIR" 2>/dev/null
mkdir -p "$VSIX_DIR"

# Copy built files to deployment directory
cp -r dist/* "$VSIX_DIR/"
cp package.json "$VSIX_DIR/"
cp -r resources "$VSIX_DIR/"

# Fix main entry point in package.json
sed -i 's/"main": ".\/dist\/extension.js"/"main": ".\/extension.js"/g' "$VSIX_DIR/package.json"

# Create a minimal entry point JS file if it doesn't exist
if [ ! -f "$VSIX_DIR/extension.js" ]; then
  echo "Creating minimal extension.js entry point..."
  cat > "$VSIX_DIR/extension.js" << 'EOT'
// APE Extension entry point
const src = require('./src/extension');

// Export all functions from the src/extension module
module.exports = {
  activate: src.activate,
  deactivate: src.deactivate
};
EOT
fi

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

echo "[5/5] Extension package created: $PACKAGE_FILE"

# Direct installation method - create a link in the VS Code extensions folder
echo
echo "Installing extension directly..."

# Get VSCode extensions directory
VSCODE_EXT_DIR="$HOME/.vscode/extensions"
if [ -d "$HOME/.vscode-server/extensions" ]; then
    # For VS Code server (remote)
    VSCODE_EXT_DIR="$HOME/.vscode-server/extensions"
fi

# Create extension directory with unique name including version
EXT_INSTALL_DIR="$VSCODE_EXT_DIR/ape-team.ape-0.0.1"

# Remove existing extension if it exists
rm -rf "$EXT_INSTALL_DIR" 2>/dev/null

# Create extension directory and copy files
mkdir -p "$EXT_INSTALL_DIR"
cp -r "$VSIX_DIR"/* "$EXT_INSTALL_DIR"

echo "Extension successfully installed to: $EXT_INSTALL_DIR"
echo
echo "To activate the extension:"
echo "1. Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)"
echo "2. Type 'Reload Window' and press Enter"
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