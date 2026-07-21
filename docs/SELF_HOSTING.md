# Self-hosting Guide

This app is provider-agnostic. Auth, data, and storage are switched via
environment variables — no code change required.

## 1. Providers

| Concern  | Env var                 | Values                                   |
| -------- | ----------------------- | ---------------------------------------- |
| Auth     | `VITE_AUTH_PROVIDER`    | `supabase` \| `gotrue` \| `keycloak` \| `local` |
| Data     | `VITE_DATA_PROVIDER`    | `supabase` \| `postgrest` \| `local`     |
| Storage  | `VITE_STORAGE_PROVIDER` | `supabase` \| `s3` \| `minio` \| `local` |

Validation runs at startup (`src/config/app-validate.ts`). Invalid values are
logged to the console.

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

Studio is served at `http://localhost:8000` (login with `DASHBOARD_PASSWORD`).

## 4. Lightweight PostgREST + GoTrue + MinIO

If you don't need the full Supabase toolkit, use the compose file shipped with
this repo:

```bash
docker compose -f docker-compose.selfhosted.yml up -d
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
