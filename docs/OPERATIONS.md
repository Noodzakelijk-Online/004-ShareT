# Windows, tunnel, and operator runbook

## Windows 11 standalone

1. Install Node.js 22 LTS and Git.
2. Run `install.bat` once. It performs clean installs, builds the frontend, and copies the immutable build into the backend serving directory.
3. Edit `backend\.env`. Generate three different random values for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `ENCRYPTION_KEY`.
4. Run `npm run doctor`. Errors block startup; provider warnings mean the related feature is unavailable.
5. Run `start-sharet.bat`. Local access is `http://localhost:5005`.
6. Check `http://localhost:5005/ready`; a ready response confirms runtime validation and the database, not live Trello/SMTP acceptance.

Do not rebuild files while the server is serving them. Run `npm run build:serve`, then restart ShareT. HTML is revalidated and content-hashed assets are cached, preventing stale-manifest failures.

## Docker plus static ngrok domain

1. Copy `.env.docker.example` to `.env.docker` and fill every required value.
2. Set `NGROK_DOMAIN` to the hostname without `https://`; set `PUBLIC_URL`, `FRONTEND_URL`, and `CORS_ORIGIN` to its HTTPS URL.
3. Run `docker compose --env-file .env.docker config` and inspect the ngrok command without sharing the secret output.
4. Run `docker compose --env-file .env.docker up -d --build`.
5. Check `docker compose ps`, local `/ready`, public `/ready`, Trello OAuth, and webhook creation.

`redeploy.bat` automates the same Compose invocation. A changing temporary ngrok hostname is unsuitable because Trello callbacks, webhooks, existing links, and HAI's OpenAPI server URL depend on a stable origin.

## HAI connection

1. Sign in to ShareT and open **HAI connector** in the profile.
2. Create read-only access first. Copy the token once into HAI's secure credential store.
3. Import the displayed `/api/connector/openapi.json` URL.
4. Call `getShareTStatus`, then `listTrelloTargets`, then `listShareLinks`.
5. If HAI must create or revoke links, issue a separate credential with link-management scope. Revoke it when not required.

## Backup, restore, and support

- Stop writes, then run `npm run backup` before upgrades or credential migrations.
- Verify the manifest and test `npm run restore -- <backup-directory> --confirm` only against a non-production copy first.
- `npm run support-bundle` gathers configuration state and health without copying secret environment files or raw database data.
- Set `MAINTENANCE_MODE=true` to block mutations during work.
- Set `SHARET_DISABLE_PUBLIC_ACCESS=true` to stop all public share routes immediately.

## Recovery order

1. Preserve `backend/data` and take a backup.
2. Run doctor and inspect `/ready`.
3. Check disk space and write access.
4. Check Trello/SMTP/tunnel credentials without printing values.
5. If only public access is unsafe, enable the public-access kill switch while owner diagnostics remain available.
6. Restore only after identifying corruption and keeping the previous data directory.
