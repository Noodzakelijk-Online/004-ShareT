# Final verification

Date: 2026-08-09
Branch: `agent/sharet-giant-goal`

## Release decision

The repository is a production-oriented owner-acceptance candidate. The local application, browser flows, database boundary, connector contract, Windows scripts, and Docker configuration have been exercised. It is not yet provider-accepted: real Trello accounts, SMTP delivery, a static ngrok origin, HAI import, CouchDB recovery, and credential rotation require the operator's accounts and approval.

## Automated evidence

| Gate | Result |
| --- | --- |
| Frontend clean install | Passed with `npm ci`; dependency tree is consistent. |
| Backend clean install | Passed with `npm ci`; dependency tree is consistent. |
| Frontend lint | Passed with zero warnings. |
| Backend tests | 32 passed, 0 failed. |
| Production build/copy | Passed; 2,369 modules transformed and the served bundle refreshed. |
| Frontend audit | 0 vulnerabilities after lockfile-safe advisory updates. |
| Backend audit | 0 high/critical; 7 moderate reports are the upstream PouchDB UUID advisory. npm's only automatic proposal is an unsafe downgrade from PouchDB 8 to 6, so it was not applied. |
| Diff integrity | `git diff --check` passed. |
| Docker Compose parse | `docker compose --env-file .env.docker.example config --quiet` passed. |
| Doctor | Passed with an isolated valid runtime configuration; the owner's unconfigured local file correctly fails closed on missing production secrets. |

## Runtime and browser evidence

- `/ready` returned 200 with PouchDB connected, bounded cache statistics, explicit provider capability warnings, and approximately 22 MB used heap in the QA fixture.
- Signed-out `/api/auth/session` returned 200 with `authenticated: false`, avoiding an expected 401 console error while protected endpoints remain protected.
- HTML returned `Cache-Control: no-cache`; the hashed JavaScript bundle returned `public, max-age=31536000, immutable`.
- The public HAI OpenAPI endpoint returned OpenAPI 3.1 with the status, board, and share-management paths.
- A write-scoped connector token was created, used, revoked, and then rejected; a read-only token received 403 for a write. Connector secrets were shown once and only hashes were stored.
- Chromium rendered sign-in, privacy, terms, the canonical `/shared/:id` link, and the compatibility `/share/:id` link. A valid link secret advanced to the freelancer name/email gate with no application console errors.
- The QA environment intentionally lacked SMTP and Trello credentials; the UI and readiness endpoint reported those capabilities unavailable instead of simulating success.
- The database index marker skipped index rebuilding on restart. On this Windows/antivirus environment, cold process and database startup still reached readiness at about 85 seconds, so Docker now grants a 90-second first-start health period.

## Security and truthfulness checks

- Public card data and mutations are denied until every configured password and participant factor passes.
- Browser sessions use HttpOnly cookies; API credentials, password hashes, encrypted relay data, and connector hashes are stripped from presentations and exports.
- Trello relay assignment, owner watching, notification-health reporting, signed webhook validation, conservative reply routing, retry, and idempotency have regression coverage.
- Payment-page navigation cannot grant credits. Client-declared billing/resource-success endpoints and fake dashboard behavior were removed.
- Tracked secret-bearing environment files were removed. Any credential that existed in Git history must still be rotated by its owner; removing the current file does not revoke it.

## Required live acceptance

Before calling the deployment production-live, complete the operator checklist in `docs/ACCEPTANCE_TESTS.md`: rotate historical credentials; configure a dedicated ShareT Trello relay, SMTP, and a static HTTPS origin; run a real freelancer comment to Trello bell to mobile owner reply to verified-email cycle; import and revoke a connector in HAI; and test backup/restore plus optional CouchDB recovery.
