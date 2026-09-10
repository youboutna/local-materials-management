# Déploiement HadraTech-GPI

> **Philosophie** : L'application est **infrastructure-agnostique**. Elle peut fonctionner indifféremment avec Supabase Cloud, Supabase Self-Hosted, une stack PostgREST + GoTrue + MinIO, ou en mode local mocké.

---

## 📋 Table des matières

1. [Vue d'ensemble](#-vue-densemble)
2. [Provider switches](#-provider-switches)
3. [Scénarios de déploiement](#-scénarios-de-déploiement)
4. [Structure des fichiers](#-structure-des-fichiers)
5. [Scripts de déploiement](#-scripts-de-déploiement)
6. [Démarrage rapide](#-démarrage-rapide)
7. [Basculer entre scénarios](#-basculer-entre-scénarios)
8. [Vérifications](#-vérifications)
9. [Troubleshooting](#-troubleshooting)
10. [Documentation complète](#-documentation-complète)

---

## 📋 Vue d'ensemble

Le déploiement est entièrement piloté par **variables d'environnement**. Les scénarios de déploiement sont documentés en détail dans **[`docs/SELF_HOSTING.md`](SELF_HOSTING.md)**.

### 🎯 Principes clés

| Principe | Description |
|----------|-------------|
| **Infra-agnostique** | Aucun code à modifier pour changer d'infra |
| **Piloté par `.env`** | 3 variables sélectionnent les providers |
| **Scénarios isolés** | Chaque scénario a son dossier Docker |
| **Secrets isolés** | `.env.local` (gitignored) contient les secrets |
| **Idempotent** | Peut être ré-exécuté sans casser |

---

## 🔄 Provider switches

Trois variables d'environnement sélectionnent les providers actifs, validés au démarrage par `src/config/app-validate.ts` :

| Concern | Env var | Valeurs | Défaut |
|---------|---------|---------|--------|
| **Auth** | `VITE_AUTH_PROVIDER` | `supabase` \| `gotrue` \| `keycloak` \| `local` | `supabase` |
| **Data** | `VITE_DATA_PROVIDER` | `supabase` \| `postgrest` \| `local` | `supabase` |
| **Storage** | `VITE_STORAGE_PROVIDER` | `supabase` \| `s3` \| `minio` \| `local` | `supabase` |

### Matrice de compatibilité
Auth \ Data	supabase	postgrest	local
supabase	✅	❌	❌
gotrue	✅	✅	❌
keycloak	❌	✅	❌
local	✅ (B)	✅ (B')	✅ (C)


> ⚠️ **Mode B** : `VITE_JWT_SECRET` doit être synchronisé avec `JWT_SECRET` du backend.

---

## 🎯 Scénarios de déploiement

| # | Scénario | Dossier Compose | Front config | Cible |
|---|----------|-----------------|--------------|-------|
| 1 | **Supabase Cloud** | N/A (managé) | `VITE_*=supabase` + URL Cloud | Cloud |
| 2 | **Supabase Self-Hosted** | `supabase/docker/` | `VITE_*=supabase` + URL self | VPS |
| 3 | **OSS Légère** | `docker/postgrest/` | `VITE_*=gotrue/postgrest` | VPS |
| 4 | **Keycloak SSO** | `docker/keycloak/` | `VITE_*=keycloak/postgrest` | Entreprise |
| 5 | **Local Dev** | N/A | `VITE_*=local` | Machine locale |

### Détail des scénarios

#### 1. Supabase Cloud (managé)

**Recommandé pour** : prototypage rapide, MVP, petites équipes

```env
VITE_AUTH_PROVIDER=supabase
VITE_DATA_PROVIDER=supabase
VITE_STORAGE_PROVIDER=supabase
VITE_SUPABASE_URL=https://arenvzltuvjjroigbzlu.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>