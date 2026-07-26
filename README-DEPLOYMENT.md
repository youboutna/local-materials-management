# Déploiement HadraTech-GPI

> **Philosophie** : L'application est **infrastructure-agnostique**. Elle peut fonctionner indifféremment avec Supabase Cloud, Supabase Self-Hosted, une stack PostgREST + GoTrue + MinIO, ou en mode local mocké.

---

## 📋 Vue d'ensemble

Le déploiement est entièrement piloté par **variables d'environnement**. Les scénarios de déploiement sont documentés en détail dans **[`docs/SELF_HOSTING.md`](docs/SELF_HOSTING.md)**.

### 🔄 Provider switches (canoniques)

Trois variables d'environnement sélectionnent les providers actifs, validés au démarrage par `src/config/app-validate.ts` :

| Concern  | Env var                 | Valeurs                                        |
| -------- | ----------------------- | --------------------------------------------- |
| Auth     | `VITE_AUTH_PROVIDER`    | `supabase` \| `gotrue` \| `keycloak` \| `local` |
| Data     | `VITE_DATA_PROVIDER`    | `supabase` \| `postgrest` \| `local`          |
| Storage  | `VITE_STORAGE_PROVIDER` | `supabase` \| `s3` \| `minio` \| `local`      |

**Configuration** : Copier `.env.example` vers `.env` et ajuster les valeurs. Consulter `docs/SELF_HOSTING.md` pour chaque scénario :
- Supabase Cloud (managed)
- Supabase Self-Hosted (Docker)
- PostgREST + GoTrue + MinIO (stack légère)
- Keycloak + PostgREST + MinIO (SSO Entreprise)
- Développement local (mock)

---

## 🐳 Fichiers Docker Compose

| Fichier | Stack | Utilisation |
|---------|-------|-------------|
| `docker-compose.yml` | Postgres + Keycloak + PostgREST + MinIO | SSO Entreprise, production |
| `docker-compose.postgrest.yml` | PostgREST + GoTrue + MinIO | Stack légère OSS, développement |
| `supabase/docker/docker-compose.yml` | Supabase complet (Kong + Studio + Realtime) | Self-hosted upstream |

---

## 🛠️ Scripts de déploiement

| Script | Description |
|--------|-------------|
| `scripts/install-cli.sh` | Installe la CLI Supabase via npm (locale ou globale) |
| `scripts/deploy.sh` | Déploie les migrations Supabase (local ou production) |
| `scripts/generate-keys.sh` | Génère les clés JWT pour le self-hosting |
| `scripts/start-supabase.sh` | Démarre la stack Supabase self-hosted |
| `scripts/setup-supabase-migrations.sh` | Copie les migrations dans les volumes Docker |
| `scripts/create-migration.sh` | Crée un nouveau fichier de migration |
| `scripts/sync-config.sh` | Synchronise les configurations entre fichiers `.env` |
| `scripts/check-config.sh` | Vérifie la cohérence des fichiers de configuration |

---

## 🚀 Démarrage rapide

### 1. Installer la CLI Supabase

```bash
# Installation locale (recommandée)
./scripts/install-cli.sh

# OU manuellement
npm install supabase --save-dev

2. Configurer l'environnement 
```bash 
# Copier le template
cp .env.example .env

# Ajuster selon votre scénario
# Voir docs/SELF_HOSTING.md pour les détails# Copier le template
cp .env.example .env

# Ajuster selon votre scénario
# Voir docs/SELF_HOSTING.md pour les détails

3.Démarrer la stack (selon le scénario)

    A   Option A – Supabase Self-Hosted (complet)
    ```bash
    cd supabase/docker && sh run.sh start

    B Option B – Stack légère OSS
    ```bash 
    docker compose -f docker-compose.postgrest.yml up -d

    c Option C – SSO Entreprise 
```bash 
    docker compose up -d
 
4. Déployer les migrations
```bash
# Local (Docker)
./scripts/deploy.sh --push --local

# Production (Supabase Cloud)
./scripts/deploy.sh --push --prod --project-id <id> --anon-key <key>

5. Lancer l'application
# Installer les dépendances

```bash  
npm install

# Démarrer le serveur de développement
npm run dev

# Build pour production
```bash
npm run build


#📁 Structure des fichiers de configuration
.
├── .env                         # Variables d'environnement de l'application (VITE_*)
├── .env.example                 # Template pour tous les scénarios
├── supabase/
│   ├── docker/
│   │   ├── .env.hadratech       # Configuration Supabase self-hosted
│   │   ├── .env                 # Utilisé par Docker Compose (copié depuis .env.hadratech)
│   │   └── docker-compose.yml   # Stack complète upstream
│   └── config.toml              # Configuration CLI Supabase (cloud)
├── docs/
│   └── SELF_HOSTING.md          # Guide complet des scénarios de déploiement
└── scripts/
    ├── deploy.sh                # Déploiement des migrations
    ├── generate-keys.sh         # Génération des clés JWT
    ├── start-supabase.sh        # Démarrage Supabase self-hosted
    └── ...