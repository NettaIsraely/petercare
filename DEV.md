# Local Development

Run the backend and mobile app against local Docker Postgres and Redis so unpushed code and test data never touch production.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Postgres + Redis)
- Node.js 20+
- Expo Go on your iPhone (same Wi‑Fi as this PC)

## First-time setup

1. Copy env templates if you have not already:

   ```powershell
   copy .env.example .env
   copy petercare-mobile\.env.example petercare-mobile\.env
   ```

2. In the root `.env`, ensure local database mode is on:

   ```env
   USE_LOCAL_DATABASE=true
   ```

   The `DB_*` values should match `docker-compose.yml` (`ranch_owner` / `stablehands`).

3. In `petercare-mobile/.env`, set your PC's LAN IP (physical iPhone cannot use `localhost`):

   ```powershell
   cd petercare-mobile
   npm run print:lan-ip
   ```

   Copy the suggested URL into `EXPO_PUBLIC_API_URL`, e.g.:

   ```env
   EXPO_PUBLIC_API_URL=http://10.100.102.12:3000
   ```

4. Install dependencies:

   ```powershell
   cd api && npm install
   cd ..\petercare-mobile && npm install
   ```

5. Start infrastructure and run migrations (first time only):

   ```powershell
   npm run infra:up
   npm run db:migrate
   ```

   In development, the API can also auto-sync schema via TypeORM when `USE_LOCAL_DATABASE=true`.

## Daily workflow

**Terminal 1 — backend**

```powershell
npm run infra:up
npm run dev:api
```

Confirm the startup log shows local DB, e.g.:

```text
Listening on port 3000 (NODE_ENV=development, DB=local stablehands@127.0.0.1:5432)
```

**Terminal 2 — mobile**

```powershell
npm run dev:mobile
```

Scan the QR code in Expo Go on your iPhone. Sign up with a new account — it is stored in local Postgres only.

## Switching back to production (mobile only)

In `petercare-mobile/.env`, comment out the local URL and use production:

```env
# EXPO_PUBLIC_API_URL=http://10.100.102.12:3000
EXPO_PUBLIC_API_URL=https://petercare.onrender.com
```

Restart Expo after any env change.

## Cloud database migrations

Local `npm run db:migrate` targets Docker Postgres by default. To run migrations against Supabase:

```powershell
cd api
$env:USE_CLOUD_DATABASE="true"; npm run migration:run
```

Keep `USE_LOCAL_DATABASE=true` in `.env` for day-to-day API development so the running server still uses local Postgres.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| App cannot reach API | Phone and PC must be on the same Wi‑Fi. Re-run `npm run print:lan-ip` if your IP changed. |
| Windows firewall blocks requests | Allow inbound TCP on port 3000 for Node.js. |
| Backend hits Supabase | Ensure `USE_LOCAL_DATABASE=true` in root `.env` and restart the API. Check startup log for `DB=local ...`. |
| Mobile hits Render | Ensure `petercare-mobile/.env` exists with your LAN IP and restart Expo. |
| Migration fails on fresh DB | Run `npm run infra:down`, remove the Docker volume if needed, `npm run infra:up`, then `npm run db:migrate`. The init script enables `uuid-ossp`. |
| Redis connection errors | Run `npm run infra:up` — Redis is required for notification queues. |

## Production email (password reset)

Password reset emails require SMTP credentials on Render. Without them, the API queues jobs but delivery fails.

1. Sign up for a transactional provider (e.g. [Resend](https://resend.com) or SendGrid).
2. Verify the `stablehands.app` domain (add SPF/DKIM DNS records the provider gives you).
3. In the Render dashboard for the API service, set:
   - `EMAIL_HOST` — e.g. `smtp.resend.com`
   - `EMAIL_PORT` — `587`
   - `EMAIL_USER` — e.g. `resend` (Resend) or `apikey` (SendGrid)
   - `EMAIL_PASSWORD` — your provider API key
   - `EMAIL_FROM` — `"Peter Care Support" <noreply@stablehands.app>` (must match verified domain)
4. Redeploy the API service.
5. Check startup logs for `Email SMTP verified (...)` — if missing, credentials or DNS are wrong.
6. Trigger forgot-password and confirm logs show `OTP email sent to [...] messageId=...` and the email arrives.

Do not use Ethereal in production; it only delivers to a preview URL, not real inboxes.

## Script reference

| Command | Description |
|---------|-------------|
| `npm run infra:up` | Start Postgres + Redis containers |
| `npm run infra:down` | Stop containers |
| `npm run dev:api` | NestJS API with hot reload |
| `npm run dev:mobile` | Expo dev server (prints LAN IP first) |
| `npm run db:migrate` | Run TypeORM migrations on local Postgres |
