# Deployment

Deployment scenarios and provider configuration are consolidated in a single
guide: **[`docs/SELF_HOSTING.md`](docs/SELF_HOSTING.md)**.

## Provider switches (canonical)

The app is infrastructure-agnostic. Three environment variables select the
active providers, validated at startup by `src/config/app-validate.ts`:

| Concern  | Env var                 | Values                                        |
| -------- | ----------------------- | --------------------------------------------- |
| Auth     | `VITE_AUTH_PROVIDER`    | `supabase` \| `gotrue` \| `keycloak` \| `local` |
| Data     | `VITE_DATA_PROVIDER`    | `supabase` \| `postgrest` \| `local`          |
| Storage  | `VITE_STORAGE_PROVIDER` | `supabase` \| `s3` \| `minio` \| `local`      |

Copy `.env.example` to `.env` and adjust — see `docs/SELF_HOSTING.md` for each
scenario (managed Supabase, self-hosted Supabase, PostgREST + GoTrue + MinIO,
Keycloak, local dev).

## Compose files

- `docker-compose.yml` — full self-hosted stack: Postgres, Keycloak, PostgREST,
  MinIO (and optional backend). Used for local development and on-prem.
- `docker-compose.selfhosted.yml` — lightweight PostgREST + GoTrue + MinIO
  stack for teams that don't need the full Supabase toolkit.

## Scripts

- `scripts/deploy.sh` — provision Node, PostgreSQL/Docker, and build the app.
  Reads provider selection from `.env`.
