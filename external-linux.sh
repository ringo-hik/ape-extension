#!/bin/bash
echo "===== APE EXTENSION - EXTERNAL MODE (LINUX) ====="

# Create directories
mkdir -p dist

# Copy environment files
echo "Setting up external environment..."
cp -f extension.env.external.js extension.env.js
cp -f extension.env.js dist/extension.env.js
cp -f config/external/settings.json dist/settings.json

# Create initialization context
echo "Creating initialization context..."
echo "/* APE Extension Initialization Context */" > dist/init.context.js
echo "var APE_ENV = { internal: false, ready: true };" >> dist/init.context.js

# Build the extension
echo "Building extension..."
npm run build

echo "===== SETUP COMPLETE ====="
echo "Type this command to run APE Extension in external mode:"
echo "code --extensionDevelopmentPath=$(pwd)"