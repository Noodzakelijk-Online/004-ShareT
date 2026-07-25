#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

command -v node >/dev/null
command -v npm >/dev/null
test -f src/App.jsx
test -f backend/server.js

npm ci
(cd backend && npm ci && npm test)
npm run build
node scripts/copy-frontend-build.js

test -f dist/index.html
test -f backend/frontend/dist/index.html
echo "ShareT build and backend tests passed."
