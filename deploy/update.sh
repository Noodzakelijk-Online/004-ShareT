#!/usr/bin/env bash
# ShareT one-command update: pull latest + rebuild
set -e
cd /opt/sharet
git pull origin main
docker compose down
docker compose up -d --build
echo "ShareT updated and restarted."
