# Self-hosting Guide

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

Copy `.env.example` to `.env` and pick a scenario below.


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

## 4. Full self-hosted stack (Postgres + Keycloak + PostgREST + MinIO)

Use the top-level compose file that ships with this repo:

```bash
docker compose up -d
```

Services exposed:

- Postgres on `5432`
- Keycloak on `8081` (admin / `KEYCLOAK_ADMIN_PASSWORD`)
- PostgREST on `3001`
- MinIO API on `9000`, console on `9001`

Frontend `.env`:

```
VITE_AUTH_PROVIDER=keycloak
VITE_DATA_PROVIDER=postgrest
VITE_STORAGE_PROVIDER=minio
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_POSTGREST_URL=http://localhost:3001
VITE_STORAGE_ENDPOINT=http://localhost:9000
VITE_STORAGE_BUCKET=documents
```

## 5. Lightweight PostgREST + GoTrue + MinIO

For teams that don't want Keycloak, use the lightweight variant:

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
