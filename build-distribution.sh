#!/bin/bash

echo "🚀 Building Project Pulse Distribution Packages..."
echo ""

# Step 1: Build React app
echo "📦 Building React app..."
npm run build

# Step 2: Build Neutralino app
echo "📦 Building Neutralino app..."
npx neu build

# Step 3: Navigate to distribution directory
cd "dist/project-pulse-ui"

# Step 4: Create package directories
echo "📁 Creating package directories..."
mkdir -p packages/windows packages/macos-intel packages/macos-arm packages/linux

# Step 5: Copy files to Windows package
echo "🪟 Creating Windows package..."
cp project-pulse-ui-win_x64.exe resources.neu index.html favicon.ico vite.svg packages/windows/
cp -r assets packages/windows/
mkdir -p packages/windows/resources/js
cp ../../resources/js/neutralino.js packages/windows/resources/js/

# Step 6: Copy files to macOS Intel package
echo "🍎 Creating macOS Intel package..."
cp project-pulse-ui-mac_x64 resources.neu index.html favicon.ico vite.svg packages/macos-intel/
cp -r assets packages/macos-intel/
mkdir -p packages/macos-intel/resources/js
cp ../../resources/js/neutralino.js packages/macos-intel/resources/js/

# Step 7: Copy files to macOS ARM package
echo "🍎 Creating macOS ARM package..."
cp project-pulse-ui-mac_arm64 resources.neu index.html favicon.ico vite.svg packages/macos-arm/
cp -r assets packages/macos-arm/
mkdir -p packages/macos-arm/resources/js
cp ../../resources/js/neutralino.js packages/macos-arm/resources/js/

# Step 8: Copy files to Linux package
echo "🐧 Creating Linux package..."
cp project-pulse-ui-linux_x64 resources.neu index.html favicon.ico vite.svg packages/linux/
cp -r assets packages/linux/
mkdir -p packages/linux/resources/js
cp ../../resources/js/neutralino.js packages/linux/resources/js/

# Step 9: Create README files
echo "📝 Creating README files..."

# Windows README
cat > packages/windows/README.txt << 'EOF'
Project Pulse - Windows Installation
=====================================

INSTALLATION:
1. Extract all files to a folder (keep them together!)
2. Double-click "project-pulse-ui-win_x64.exe" to run the app
3. Windows may show a security warning - click "More info" then "Run anyway"
4. The app will start automatically

IMPORTANT:
- Keep ALL files and folders in the same directory:
  * project-pulse-ui-win_x64.exe
  * resources.neu
  * index.html
  * assets/ folder
  * resources/ folder (contains neutralino.js)
  * favicon.ico
  * vite.svg
  * README.txt

REQUIREMENTS:
- Windows 10 or later (64-bit)
- 50MB free disk space
- No additional software needed

TROUBLESHOOTING:
- If Windows Defender blocks the app, add it to your exclusions
- Make sure ALL files and folders are in the same directory
- Run as administrator if you encounter permission issues
- If you get "localhost page can't be found" or "ERR_INVALID_RESPONSE", ensure all files are together

For support, contact: [your-email@domain.com]
EOF

# macOS Intel README
cat > packages/macos-intel/README.txt << 'EOF'
Project Pulse - macOS Installation (Intel Macs)
===============================================

INSTALLATION:
1. Extract all files to a folder (keep them together!)
2. Right-click "project-pulse-ui-mac_x64" and select "Open"
3. macOS may show "unidentified developer" warning - click "Open" anyway
4. The app will start automatically

IMPORTANT:
- Keep ALL files and folders in the same directory:
  * project-pulse-ui-mac_x64
  * resources.neu
  * index.html
  * assets/ folder
  * resources/ folder (contains neutralino.js)
  * favicon.ico
  * vite.svg
  * README.txt

REQUIREMENTS:
- macOS 10.15 (Catalina) or later
- Intel-based Mac
- 50MB free disk space
- No additional software needed

TROUBLESHOOTING:
- If macOS blocks the app, go to System Preferences > Security & Privacy
- Click "Open Anyway" next to the blocked app message
- Make sure ALL files and folders are in the same directory
- You may need to make the file executable: chmod +x project-pulse-ui-mac_x64

For support, contact: [your-email@domain.com]
EOF

# macOS ARM README
cat > packages/macos-arm/README.txt << 'EOF'
Project Pulse - macOS Installation (Apple Silicon)
==================================================

INSTALLATION:
1. Extract all files to a folder (keep them together!)
2. Right-click "project-pulse-ui-mac_arm64" and select "Open"
3. macOS may show "unidentified developer" warning - click "Open" anyway
4. The app will start automatically

IMPORTANT:
- Keep ALL files and folders in the same directory:
  * project-pulse-ui-mac_arm64
  * resources.neu
  * index.html
  * assets/ folder
  * resources/ folder (contains neutralino.js)
  * favicon.ico
  * vite.svg
  * README.txt

REQUIREMENTS:
- macOS 11.0 (Big Sur) or later
- Apple Silicon Mac (M1, M2, M3, etc.)
- 50MB free disk space
- No additional software needed

TROUBLESHOOTING:
- If macOS blocks the app, go to System Preferences > Security & Privacy
- Click "Open Anyway" next to the blocked app message
- Make sure ALL files and folders are in the same directory
- You may need to make the file executable: chmod +x project-pulse-ui-mac_arm64

For support, contact: [your-email@domain.com]
EOF

# Linux README
cat > packages/linux/README.txt << 'EOF'
Project Pulse - Linux Installation
===================================

INSTALLATION:
1. Extract all files to a folder (keep them together!)
2. Open terminal in this folder
3. Make the file executable: chmod +x project-pulse-ui-linux_x64
4. Run the app: ./project-pulse-ui-linux_x64

IMPORTANT:
- Keep ALL files and folders in the same directory:
  * project-pulse-ui-linux_x64
  * resources.neu
  * index.html
  * assets/ folder
  * resources/ folder (contains neutralino.js)
  * favicon.ico
  * vite.svg
  * README.txt

REQUIREMENTS:
- Linux x64 (Ubuntu, Debian, Fedora, etc.)
- GTK3 or later (usually pre-installed)
- 50MB free disk space
- No additional software needed

TROUBLESHOOTING:
- If you get "permission denied", run: chmod +x project-pulse-ui-linux_x64
- Make sure ALL files and folders are in the same directory
- For some distributions, you may need: sudo apt install libgtk-3-0
- For Fedora/CentOS: sudo dnf install gtk3

For support, contact: [your-email@domain.com]
EOF

# Step 10: Create compressed packages
echo "📦 Creating compressed packages..."
cd packages
tar -czf project-pulse-windows.tar.gz windows/
tar -czf project-pulse-macos-intel.tar.gz macos-intel/
tar -czf project-pulse-macos-arm.tar.gz macos-arm/
tar -czf project-pulse-linux.tar.gz linux/

echo ""
echo "✅ Distribution packages created successfully!"
echo ""
echo "📁 Package locations:"
echo "   • Windows: dist/project-pulse-ui/packages/windows/"
echo "   • macOS Intel: dist/project-pulse-ui/packages/macos-intel/"
echo "   • macOS ARM: dist/project-pulse-ui/packages/macos-arm/"
echo "   • Linux: dist/project-pulse-ui/packages/linux/"
echo ""
echo "📦 Compressed packages:"
echo "   • project-pulse-windows.tar.gz"
echo "   • project-pulse-macos-intel.tar.gz" 
echo "   • project-pulse-macos-arm.tar.gz"
echo "   • project-pulse-linux.tar.gz"
echo ""
echo "🎉 Your Project Pulse app is ready for distribution!"
echo "🚀 The Windows executable should now work correctly!" 