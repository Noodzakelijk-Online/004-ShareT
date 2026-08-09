# ShareT

ShareT creates secure external links for Trello cards so freelancers can view work, upload files, and post updates without needing a Trello account.

Freelancer updates are relayed into Trello by a dedicated ShareT member. ShareT automatically assigns that member to the card when needed, mentions the Trello owner, and includes the freelancer's name in the comment. The owner can reply normally from Trello web, desktop, or mobile. Verified freelancers receive those replies by email and can also see them when the shared page refreshes.

## Main capabilities

- Share one Trello card or all cards in a list.
- Search Trello content by workspace, board, list, or card from one structured picker.
- Protect a link with a password and optional expiry date.
- Require a freelancer's name and verified email before commenting.
- Relay freelancer comments through a dedicated Trello bot account.
- Automatically add the relay member to a card before its first relayed comment.
- Trigger a normal Trello mention notification for the configured owner.
- Route normal Trello replies back to the correct freelancer by email.
- Preserve complete share-link history with pagination, copy, QR, status, and delete controls.
- Store data locally in PouchDB, with optional CouchDB synchronization.
- Connect HAI through a revocable, scoped credential and an OpenAPI contract.

No Trello Power-Up panel is required for the conversation flow.

## Requirements

- Node.js 22 or newer
- A Trello API key and secret
- A stable public HTTPS URL for production OAuth callbacks and Trello webhooks
- SMTP credentials for freelancer verification and reply email
- A separate Trello member and token for reliable unread bell notifications

## Windows installation

1. Clone the repository.
2. Run `install.bat`.
3. Configure `backend\.env` using the comments in `backend\.env.example`.
4. Run `start-sharet.bat`.
5. Open `http://localhost:5005`.

The installer installs both dependency sets, builds the frontend, copies the production build, and creates `backend\.env` when it is missing.

## Manual installation

```bash
npm ci
npm run build

cd backend
npm ci
cp .env.example .env
# Edit .env before starting ShareT.
npm start
```

The backend serves the frontend build from the repository's `dist` directory or from `backend/frontend/dist`. The default local URL is `http://localhost:5005`.

## Essential configuration

Start from `backend/.env.example`. Production secrets must be unique and must not use the development defaults.

```env
PORT=5005
NODE_ENV=production

PUBLIC_URL=https://sharet.example.com
FRONTEND_URL=https://sharet.example.com
CORS_ORIGIN=https://sharet.example.com

JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
ENCRYPTION_KEY=replace-with-a-long-random-encryption-key

TRELLO_API_KEY=your-trello-api-key
TRELLO_API_SECRET=your-trello-api-secret
TRELLO_CALLBACK_URL=https://sharet.example.com/api/trello/callback

TRELLO_BOT_TOKEN=token-owned-by-the-sharet-relay-member
SHARET_TRELLO_NOTIFY_USERNAME=your-trello-username
SHARET_ALLOW_OWNER_COMMENT_FALLBACK=false

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=ShareT <notifications@example.com>
```

The relay token must belong to a different Trello member than the owner. Add the relay member to each relevant board once. ShareT handles card-level assignment automatically. An action posted with the owner's own token can create the comment but cannot create an unread notification for that same owner.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for webhook behavior, freelancer reply routing, SMTP aliases, and deployment options.

## Deployment

ShareT is a Node/Express application, not a static-only frontend. It needs an always-running backend and a stable public HTTPS URL. Supported approaches include:

- Docker Compose using `docker-compose.yml`
- A local or always-on Windows machine behind a named Cloudflare Tunnel
- A static ngrok domain
- A VPS or Node hosting platform behind HTTPS

For Docker:

```bash
docker compose --env-file .env.docker up -d --build
docker compose ps
```

The liveness endpoint is `GET /health`; deployment readiness is `GET /ready`. Run `npm run doctor` before startup, and use `npm run backup` before upgrades.

## API

The browser uses secure HttpOnly authentication cookies. Non-browser API clients can opt into a short-lived bearer response by sending `X-ShareT-Token-Response: true` to the login endpoint:

```http
Authorization: Bearer your_access_token
```

For HAI, use **HAI connector** in the profile. ShareT creates a 90-day, revocable credential that is shown once and stored only as a hash. Give HAI the OpenAPI URL shown in that dialog (normally `/api/connector/openapi.json`) and the generated bearer token. Choose read-only or link-management access; password login credentials are never needed.

### Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in and establish a secure cookie session |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Read the current profile |
| PUT | `/api/auth/profile` | Update the current profile |
| PUT | `/api/auth/password` | Change the password |
| GET | `/api/auth/export` | Download the account's ShareT data |
| DELETE | `/api/auth/account` | Delete the account and owned data after password confirmation |
| GET/POST/DELETE | `/api/auth/api-tokens` | List, create, or revoke HAI connector credentials |

### Trello

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/trello/auth-url` | Start Trello authorization |
| GET | `/api/trello/callback` | Handle Trello's OAuth callback |
| POST | `/api/trello/connect` | Complete a token connection |
| POST | `/api/trello/disconnect` | Remove the current connection |
| GET | `/api/trello/status` | Read connection status |
| GET | `/api/trello/boards` | List visible boards |
| GET | `/api/trello/boards/:boardId/cards` | List cards on a board |
| GET | `/api/trello/boards/:boardId/lists` | List lists on a board |

### Share links

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/shared-links` | Create a share link |
| GET | `/api/shared-links?page=1&limit=25` | List all links with pagination |
| GET | `/api/shared-links/:shareId` | Read a link |
| PUT | `/api/shared-links/:shareId` | Update permissions or status |
| DELETE | `/api/shared-links/:shareId` | Delete a link |
| GET | `/api/shared-links/:shareId/stats` | Read link statistics |

Public recipient operations live under `/api/shared-access/:shareId`. Comment-enabled links require an email verification session before a freelancer can post.

## Credits and payment

Non-admin accounts receive a limited credit balance. Opening a Wise payment page does not grant credits. Credits are added only after payment confirmation through the protected admin workflow, which prevents browser-side credit spoofing.

The obsolete prototype resource-metering and self-declared payment endpoints are intentionally not exposed. ShareT does not claim to measure billable CPU, memory, or bandwidth until a trusted server-side meter exists.

## Verification

```bash
npm run build
npm run lint
npm run doctor

cd backend
npm test
npm audit --omit=dev
```

## Data and backups

PouchDB data is stored in `backend/data` by default or in the directory configured by `DATA_DIR`. Back up that directory while the app is stopped, or configure CouchDB synchronization for an external replica.

## License

MIT
