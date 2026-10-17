# Self-hosting Guide

For the current P0 release procedure, external public configuration, packaging an existing `npm run build` artifact, rollback and remaining acceptance gates, see [SELF_HOSTED_RELEASE.md](SELF_HOSTED_RELEASE.md). The frontend Compose now requires `PUBLIC_CONFIG_FILE`; use that procedure rather than the older commands below without a mounted config.

This app is provider-agnostic. Auth, data, and storage are switched via
environment variables — no code change required.

## 1. Providers (canonical switches)

Validated at startup by `src/config/app-validate.ts`. Any other value is
logged as an error and falls back to `supabase` (or `local` in DEV_MODE).

| Concern  | Env var                 | Values                                          |
| -------- | ----------------------- | ----------------------------------------------- |
| Auth     | `VITE_AUTH_PROVIDER`    | `supabase` \| `gotrue` \| `keycloak` \| `local` |
| Data     | `VITE_DATA_PROVIDER`    | `supabase` \| `postgrest` \| `local`            |
| Storage  | `VITE_STORAGE_PROVIDER` | `supabase` \| `s3` \| `minio` \| `local`        |

Prepare your deployment configuration manually and pick a scenario below. Existing `.env` files are user-owned: startup scripts must not rewrite them or print credentials.


## 2. Managed Supabase (default)

```
VITE_AUTH_PROVIDER=supabase
VITE_DATA_PROVIDER=supabase
VITE_STORAGE_PROVIDER=supabase
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```

## 3. Self-hosted Supabase (full stack)

Follow the official docs, then point the app at your instance:

```bash
git clone --depth 1 https://github.com/supabase/supabase
mkdir supabase-project && cp -rf supabase/docker/* supabase-project/
cd supabase-project
bash utils/generate-keys.sh
bash utils/add-new-auth-keys.sh
# Edit .env: SUPABASE_PUBLIC_URL, API_EXTERNAL_URL, SITE_URL, DASHBOARD_PASSWORD
docker compose up -d
```

Frontend `.env`:

```
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_PUBLISHABLE_KEY=<generated-anon-key>
```

Studio is accessed through the configured gateway (login with your dashboard credentials). Localhost examples are for local testing only; production URLs must be reachable HTTPS addresses from the user's browser.

The upstream stack must be initialized before applying the application's SQL migrations. A nested mount under `docker-entrypoint-initdb.d/migrations/` does **not** execute those files automatically. Against the reviewed target database, apply tracked migrations explicitly with the Supabase CLI, for example `supabase db push --db-url "$DEPLOY_DATABASE_URL"`; reconcile the migration history first for an existing database. Keep the connection string in the server's secret environment, never in browser configuration. Deploy the required edge functions separately, including newsletter subscription/action/send functions, and configure email delivery and the newsletter site URL/cron secret on that server.

## 4. Alternative backend stack (Postgres + Keycloak + PostgREST + MinIO)

Use the top-level compose file that ships with this repo:

```bash
docker compose up -d
```

Services exposed:

- Postgres bound to `127.0.0.1:5433` (override with `POSTGRES_HOST_PORT`)
- Keycloak on `8081` (admin / `KEYCLOAK_ADMIN_PASSWORD`)
- PostgREST on `3001`
- MinIO API on `9000`, console on `9001`

Frontend `.env`:

```
VITE_AUTH_PROVIDER=keycloak
VITE_DATA_PROVIDER=postgrest
VITE_STORAGE_PROVIDER=minio
VITE_KEYCLOAK_URL=http://localhost:8081/auth
VITE_POSTGREST_URL=http://localhost:3001
VITE_STORAGE_ENDPOINT=http://localhost:9000
VITE_STORAGE_BUCKET=documents
```

## 5. Lightweight PostgREST + GoTrue + MinIO

For teams that don't want Keycloak, use the lightweight variant:

```bash
docker compose -f docker/postgrest/docker-compose.yml up -d
```

Frontend `.env`:

```
VITE_AUTH_PROVIDER=gotrue
VITE_GOTRUE_URL=http://localhost:9999
VITE_DATA_PROVIDER=postgrest
VITE_POSTGREST_URL=http://localhost:3001
VITE_STORAGE_PROVIDER=s3
VITE_STORAGE_ENDPOINT=http://localhost:9000
VITE_STORAGE_BUCKET=documents
```

Signed URLs must be produced by a small backend — see
`src/infrastructure/adapters/storage/S3StorageAdapter.ts`.
The current factory does not configure a signer; MinIO/S3 uploads are therefore not production-ready. The alternative stacks also require application schema migration, Keycloak JWT/PostgREST integration and an extension-compatible database image: the checked-in initialization requests `pgjwt`, which plain `postgres:15` does not include. These alternatives are not equivalent to the Supabase stack and must not be declared turnkey.

## Frontend container and release checks

Build on your release server using Node 22 and the reviewed production public configuration, then package the generated artifact:

```bash
npm ci
npm run build
docker compose -f docker-compose.frontend.yml build
docker compose -f docker-compose.frontend.yml up -d --wait
curl --fail http://127.0.0.1:8088/healthz
```

The image contains only `dist` and Nginx configuration, never `.env` or source dependencies. Place Caddy/Traefik in front of the loopback port for HTTPS. It serves SPA routes through `index.html` and PDF `.mjs` workers as JavaScript; missing assets return 404, not HTML. An optional reviewed public `config.js` can override Supabase runtime settings; never put private keys there.

Before release, check `docker compose -f docker-compose.frontend.yml config -q`, apply migrations and deploy edge functions against the correct instance, verify health endpoints, and test a real private document upload → preview → download → delete plus newsletter consent → confirmation → campaign delivery → unsubscribe. Verify backups/restore and email delivery independently. No production readiness claim follows from static configuration checks alone.

Validation on 2026-10-17: the preview loads and focused document/newsletter service tests pass. Docker is unavailable in the Lovable sandbox and the external Supabase session cannot be restored for authenticated checks; container startup, migrations and real mail delivery still require server-side validation.

## 5. Keycloak

```
VITE_AUTH_PROVIDER=keycloak
VITE_KEYCLOAK_URL=https://kc.example.com
VITE_KEYCLOAK_REALM=my-realm
VITE_KEYCLOAK_CLIENT_ID=my-client
```

## 6. Local (offline / DEV_MODE)

```
VITE_DEV_MODE=true
VITE_AUTH_PROVIDER=local
VITE_DATA_PROVIDER=local
VITE_STORAGE_PROVIDER=local
```

Users, roles, notifications, and files live in `localStorage` — see
`src/infrastructure/adapters/local/`.

## 7. Responsibilities

| Area          | Owner                                    |
| ------------- | ---------------------------------------- |
| Backups       | You (pg_dump / MinIO lifecycle policies) |
| Updates       | You (`docker compose pull`)              |
| Monitoring    | You (Prometheus / Grafana / logs)        |
| Certificates  | You (reverse proxy: Caddy / Traefik)     |
