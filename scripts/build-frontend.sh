#!/bin/bash

# TIMS Frontend Build Script
# This script builds the frontend assets for the TIMS application

echo "🚀 Building TIMS Frontend Assets..."

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

# Check if Node.js version is compatible
if [[ "$NODE_VERSION" < "v20.19" && "$NODE_VERSION" < "v22.12" ]]; then
    echo "❌ Node.js version $NODE_VERSION is not compatible with Vite"
    echo "📋 Please upgrade to Node.js 20.19+ or 22.12+"
    echo "📖 See NODEJS_UPGRADE_GUIDE.md for instructions"
    exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Build assets
echo "🔨 Building assets..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Frontend build completed successfully!"
    echo "🎉 TIMS application is ready to use"
else
    echo "❌ Frontend build failed"
    exit 1
fi



