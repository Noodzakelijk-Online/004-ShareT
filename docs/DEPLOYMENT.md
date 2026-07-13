# ShareT Deployment

ShareT does not need Vercel. It is a Node/Express backend that serves the API and, after a frontend build, the frontend files as well.

The reliable deployment requirement is a stable public HTTPS URL, not a specific hosting provider.

## Recommended options

### 1. Local machine + Cloudflare Tunnel

Good for a personal installation that runs from your own computer or small server.

```bash
npm install
npm run build
cd backend
npm install
npm start
```

In another terminal:

```bash
cloudflared tunnel --url http://localhost:5005
```

For production use, configure a named Cloudflare Tunnel and a permanent hostname.

### 2. Local machine + ngrok

Good for testing and acceptable for production only when you use a static ngrok domain.

```bash
ngrok http 5005
```

Set `PUBLIC_URL`, `FRONTEND_URL`, and `CORS_ORIGIN` to the stable ngrok HTTPS URL.

### 3. VPS / always-on server

Best for production. Run the backend as a long-running Node process behind HTTPS, for example with Caddy, Nginx, or a platform-provided proxy.

## Required environment values

```env
PORT=5005
PUBLIC_URL=https://your-stable-sharet-domain.example
FRONTEND_URL=https://your-stable-sharet-domain.example
CORS_ORIGIN=https://your-stable-sharet-domain.example
TRELLO_API_KEY=...
TRELLO_API_SECRET=...
```

## Trello notifications for external freelancers

Freelancers do not need to sign in to Trello. Configure a dedicated Trello relay account such as `ShareT Updates`, add that account to the relevant Trello boards, and put its token in:

```env
TRELLO_BOT_TOKEN=...
SHARET_TRELLO_NOTIFY_USERNAME=noodzakelijkonline
```

The relay account must be different from the account named by `SHARET_TRELLO_NOTIFY_USERNAME`. Trello does not create notifications for actions performed by the same member, so the owner-token fallback can deliver a comment but cannot turn that owner's bell red.

When a freelancer submits a ShareT comment, ShareT posts the update through the relay account and directly mentions the configured Trello username. The freelancer's name is the first, bold part of the comment. The Admin tab reports whether the shared relay is configured, and each successful comment response records `bellExpected` after Trello identifies the actual posting member.

### Native Trello author names

Trello's comment API does not accept an author override: the visible author is always the member that owns the posting token. If a freelancer must appear in Trello's native author row, create a clearly attributed admin-managed relay account such as `Kamal Uddin via ShareT`, add it to the board, and put its token in the share's `Native Trello Author Token` advanced option.

The freelancer never needs the account credentials or access to Trello. A single shared relay account cannot safely rotate its display name between freelancers because Trello member identity is account-wide.

There are therefore two supported modes:

- Shared relay: one ShareT Trello account, compact bold freelancer name in the comment, and a normal owner notification.
- Per-freelancer relay: native Trello author name plus a normal owner notification, still without requiring the freelancer to use Trello.

For extra reliability, configure email fallback notifications:

```env
SHARET_NOTIFY_EMAIL_TO=you@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=ShareT <notifications@example.com>
```

This keeps the Trello card as the source of truth while also making sure important freelancer updates do not depend only on Trello's notification bell.
