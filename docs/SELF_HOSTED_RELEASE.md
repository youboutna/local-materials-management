# P0 — release an existing dist in your Docker infrastructure

## Deployment plan

1. Keep the existing, initialized Supabase stack; do not replace it with the alternative Keycloak/MinIO compose.
2. Build the frontend once with `npm ci && npm run build` on a Node 22 release host.
3. Supply reviewed public runtime configuration from outside the repository, mounted read-only.
4. Package only dist with Nginx; release the frontend independently of the database.
5. Verify health, deep links, missing assets, runtime endpoint and PDF worker; then validate authenticated workflows on the real server.
6. Retain the previous image tag and public configuration for rollback.

## Can Settings update .env safely?

No: a browser cannot edit server files, and Vite has already embedded build-time values in dist. Settings currently persist application settings in the database; they do not update Docker environment or function secrets. The legacy sync script is now read-only even when `ALLOW_ENV_WRITE=1` is set. Existing `.env`/`.env.production` files remain unchanged.

Use three distinct configuration stores:

| Configuration | Location | Change requires |
|---|---|---|
| Public endpoint, anon/publishable key, profile | `/etc/hadratech/config.js`, mounted read-only | New browser load; recreate container when replacing mounted file |
| Business referentials/preferences | Existing application settings through services | Application update/read-back |
| Database credentials, service-role, SMTP, Twilio, cron secrets | Operator secret store or private server env file outside checkout | Recreate affected backend service / redeploy function |

Never place a service-role key, JWT signing secret, private database URL, SMTP password, storage secret or SMS credential in a `VITE_*` variable or config.js. Generic Settings now reject these writes and omit secret-bearing rows from display. This is defense in depth, **not a replacement for database permissions**: audit existing settings rows and RLS on the target server, relocate and rotate any historical secrets. No live permissions were changed in this release.

## Build and release

Prepare the directory manually, copy `docker/frontend/public-config.example.json` to `/etc/hadratech/public.json`, and enter your browser-accessible HTTPS Supabase gateway URL and public key. Only the supported Supabase self-hosted profile is validated here; alternative providers are not turnkey.

```bash
# Build on the release host, not inside the serving image.
npm ci
npm run build

# Produces only public config.js; never reads or writes .env.
node scripts/prepare-public-config.mjs /etc/hadratech/public.json /etc/hadratech/config.js

export PUBLIC_CONFIG_FILE=/etc/hadratech/config.js
export APP_IMAGE_TAG=release-20261017-1
export APP_COMPOSE_PROJECT=hadratech-frontend
export APP_PORT=8088
node --test scripts/public-config.test.mjs scripts/release-frontend.test.mjs
bash scripts/release-frontend.sh
```

The release uses `--env-file /dev/null`: it does not load the repository's `.env`. It validates config before Docker, runs `config -q` without printing expanded secrets, packages dist, and starts **only** the app. This frontend-only Compose project runs on the same Docker host as existing backend containers without changing them. The browser calls the configured public gateway, not a Docker service hostname.

Existing image tags and mutable `latest`/`local` tags are rejected to preserve rollback. Startup uses `--no-build` after the explicit build. Acceptance compares the served PDF worker byte-for-byte with this release. The release-script tests use a simulated Docker executable; they do not prove container startup.

Place your existing HTTPS reverse proxy in front of `127.0.0.1:8088`. If the proxy runs inside Docker, attach the app to that proxy's existing network with an operator-managed override and route to `app:80`; container-local localhost does not reach the host app. Do not expose Studio, database or storage admin consoles publicly. Configure Supabase `SITE_URL`/redirect allowlist for the frontend domain separately.

### Existing Nginx container instead of a new app

Use its existing server configuration with `docker/frontend/nginx.conf` routing rules, and mount your release's dist read-only at `/usr/share/nginx/html` plus `/etc/hadratech/config.js` read-only at `/usr/share/nginx/html/config.js`. Keep a versioned dist directory; switch the bind source in the operator Compose override and recreate only that frontend container. Do not copy source, node_modules or private env files to the web root.

### Rollback

Restore the previous public config file and set its original `APP_IMAGE_TAG`, then:

```bash
docker compose --project-name "$APP_COMPOSE_PROJECT" --env-file /dev/null \
  -f docker-compose.frontend.yml up -d --no-build --no-deps --wait app
bash scripts/check-frontend-http.sh http://127.0.0.1:8088
```

Do not prune the previous image until acceptance. Never run `down -v` during a release. A frontend rollback does not roll back database migrations.

## Backend prerequisites

The project workbench release also requires the `infra` PostGIS migrations and the unexposed `workbench_private` helper schema. Apply the checked-in migrations explicitly after backup; keep `workbench_private` out of the API exposed-schema list. Calendar journals use `btp.project_operation_entries`, not duplicated payments. GIS browser calls use invoker RPCs in `public`; anonymous execution is denied. Validate project membership, expired roles and inspection-backed completion on the target server before acceptance.

Keep server secrets outside the repository with restricted operator access. Supply an external env file using `docker compose --env-file /etc/hadratech/backend.env ...`; do not run `docker compose config` without `-q` because it prints resolved credentials. Each service needs its own reviewed environment configuration; a frontend env file is not a backend secret store.

On a reviewed target, take a backup, reconcile migration history and explicitly apply application migrations (`supabase db push` against your private connection). The nested initialization migration mount does not apply migrations. Deploy functions to **your own** edge runtime and verify their authentication/RLS against the target instance; deployment to the connected Lovable project does not deploy them to your server. The checked-in upstream edge runtime mounts `volumes/functions`, not this repository's application function directory: stage the required functions and `_shared` into its configured function volume while preserving its upstream main dispatcher, then restart only that edge runtime. Do not assume `npm run build` includes functions, database, files, SMTP or cron jobs.

## SMS

Twilio connection credentials were verified with a read-only request (HTTP 200). That account currently has no active phone number. `send-sms-notification` now uses a server provider port, validates E.164 recipients and checks Twilio acceptance plus message reference. Paid SMS calls require an active admin/super_admin/director/manager role on the server. `queued`/`accepted` is not proof of delivery to the handset.

Rechecked on 2026-10-18: no incoming phone numbers and no Messaging Services. Activate an approved SMS-capable number in Twilio Console → Phone Numbers → Manage → Buy a number, or configure an approved sender in a Messaging Service with a populated sender pool. Account/trial restrictions and destination-country requirements still apply. Do not enter a personal recipient number as the sender. Provider rejections now preserve their status and details rather than reporting a generic success or hiding the cause.

Purchase/approve an SMS-capable sender in Twilio, enable SMS Pumping Protection and restrict SMS Geo Permissions to destination countries. Configure `TWILIO_FROM_NUMBER` (or `TWILIO_MESSAGING_SERVICE_SID`) server-side; the sender form was declined, so no real send was attempted. On your self-hosted edge runtime, supply `TWILIO_API_KEY` (the connector key), `LOVABLE_API_KEY` and the sender securely; they are not included in dist or an exported source checkout. Connector gateway mode remains required for this connection.

## Scheduling and acceptance gates

Existing newsletter and project-alert dispatchers must be invoked by an operator-controlled scheduler. Configure HTTPS POSTs to `/functions/v1/newsletter-campaign-dispatcher` with `x-newsletter-cron-secret` and `/functions/v1/project-alerts-processor` with `x-cron-secret`, using their matching private server secrets. Choose frequency from approved operational policy; persisted interval settings alone do not create a scheduler. Avoid overlapping runs and monitor non-2xx results. Calls and inspections are scheduled records, not an implemented phone/reminder worker; payment notifications do not transfer funds.

Before declaring production ready: prove backup restore, authentication and permissions; supplier and consultant CRUD; document upload → preview → download → delete; real PDF parsing; email and SMS acceptance then delivery; newsletter consent/unsubscribe; scheduler execution and failures. Docker is unavailable in this sandbox, and authenticated external Supabase checks are unavailable. Passing code tests is not proof of your infrastructure startup or delivery.