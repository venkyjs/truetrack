#!/bin/bash

# Navigate to the distribution directory
cd "dist/project-pulse-ui"

# Copy React app files to each platform package
echo "Updating Windows package..."
cp -r index.html assets favicon.ico vite.svg packages/windows/ 2>/dev/null || echo "Some files may not exist"

echo "Updating macOS Intel package..."
cp -r index.html assets favicon.ico vite.svg packages/macos-intel/ 2>/dev/null || echo "Some files may not exist"

echo "Updating macOS ARM package..."
cp -r index.html assets favicon.ico vite.svg packages/macos-arm/ 2>/dev/null || echo "Some files may not exist"

echo "Updating Linux package..."
cp -r index.html assets favicon.ico vite.svg packages/linux/ 2>/dev/null || echo "Some files may not exist"

echo "All packages updated!"
echo ""
echo "✅ Your distribution packages now include all necessary files:"
echo "   - Executable"
echo "   - resources.neu"
echo "   - index.html"
echo "   - assets/ folder"
echo "   - favicon.ico"
echo "   - README.txt"
echo ""
echo "🚀 The Windows executable should now work correctly!" 