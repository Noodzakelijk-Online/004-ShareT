#!/bin/bash
# Test build script to verify everything works

set -e

echo "========================================="
echo "  ShareT Build Test Script"
echo "========================================="
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Project root: $PROJECT_ROOT"
echo ""

# Check Node.js
echo "Checking Node.js..."
node --version || { echo "ERROR: Node.js not found"; exit 1; }
npm --version || { echo "ERROR: npm not found"; exit 1; }
echo "✓ Node.js OK"
echo ""

# Check frontend source
echo "Checking frontend source..."
if [ ! -d "ShareT-main/src" ]; then
    echo "ERROR: Frontend source not found at ShareT-main/src"
    exit 1
fi
echo "✓ Frontend source OK"
echo ""

# Check backend source
echo "Checking backend..."
if [ ! -f "backend/server.js" ]; then
    echo "ERROR: Backend server.js not found"
    exit 1
fi
echo "✓ Backend OK"
echo ""

# Install dependencies
echo "Installing dependencies..."
echo "This may take a few minutes..."
echo ""

echo "[1/3] Installing root dependencies..."
npm install --silent

echo "[2/3] Installing backend dependencies..."
cd backend && npm install --silent && cd ..

echo "[3/3] Installing frontend dependencies..."
cd ShareT-main && npm install --silent && cd ..

echo "✓ Dependencies installed"
echo ""

# Build frontend
echo "Building frontend..."
cd ShareT-main
npm run build
cd ..
echo "✓ Frontend built"
echo ""

# Check build output
echo "Checking build output..."
if [ ! -d "ShareT-main/dist" ]; then
    echo "ERROR: Frontend build failed - dist directory not found"
    exit 1
fi

if [ ! -f "ShareT-main/dist/index.html" ]; then
    echo "ERROR: Frontend build failed - index.html not found"
    exit 1
fi

echo "✓ Build output OK"
echo ""

# Copy build to backend
echo "Copying build to backend..."
node scripts/copy-frontend-build.js
echo ""

# Verify copy
echo "Verifying copy..."
if [ ! -d "backend/frontend/dist" ]; then
    echo "ERROR: Copy failed - backend/frontend/dist not found"
    exit 1
fi

if [ ! -f "backend/frontend/dist/index.html" ]; then
    echo "ERROR: Copy failed - index.html not found in backend"
    exit 1
fi

echo "✓ Copy verified"
echo ""

# Show summary
echo "========================================="
echo "  Build Test Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ Dependencies installed"
echo "  ✓ Frontend built"
echo "  ✓ Build copied to backend"
echo ""
echo "File structure:"
echo "  ShareT-main/dist/          - Original build"
echo "  backend/frontend/dist/     - Served by backend"
echo ""
echo "Next steps:"
echo "  1. Configure backend/.env"
echo "  2. Start server: npm start"
echo "  3. Or use PM2: pm2 start ecosystem.config.js"
echo ""
