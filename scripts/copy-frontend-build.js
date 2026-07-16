import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const source = path.join(projectRoot, 'dist');
const destination = path.join(projectRoot, 'backend', 'frontend', 'dist');

if (!fs.existsSync(path.join(source, 'index.html'))) {
  console.error('Frontend build not found. Run "npm run build" first.');
  process.exit(1);
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.cpSync(source, destination, { recursive: true });

console.log(`Frontend build copied to ${destination}`);
console.log('ShareT will serve it from http://localhost:5005');
