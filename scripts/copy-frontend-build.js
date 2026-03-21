const fs = require('fs-extra');
const path = require('path');

const source = path.join(__dirname, '..', 'ShareT-main', 'dist');
const destination = path.join(__dirname, '..', 'backend', 'frontend', 'dist');
const backendDir = path.join(__dirname, '..', 'backend', 'frontend');

// Ensure backend/frontend directory exists
if (!fs.existsSync(backendDir)) {
  fs.mkdirSync(backendDir, { recursive: true });
}

console.log('📦 Copying frontend build to backend...');
console.log(`   Source: ${source}`);
console.log(`   Destination: ${destination}`);

try {
  // Check if source exists
  if (!fs.existsSync(source)) {
    console.error('❌ Frontend build not found! Please run: npm run build:frontend');
    process.exit(1);
  }

  // Remove old build if exists
  if (fs.existsSync(destination)) {
    console.log('🗑️  Removing old build...');
    fs.removeSync(destination);
  }

  // Copy new build
  console.log('📋 Copying files...');
  fs.copySync(source, destination);

  console.log('✅ Frontend build copied successfully!');
  console.log('');
  console.log('Frontend is now served from backend at:');
  console.log('  http://localhost:5000');
  console.log('');
} catch (error) {
  console.error('❌ Error copying frontend build:', error.message);
  process.exit(1);
}
