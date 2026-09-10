# Scénario 3 : OSS Légère (GoTrue + PostgREST + MinIO)

## 🎯 Objectif

Stack minimale **sans Supabase** :

- **GoTrue** pour l'authentification
- **PostgREST** pour l'API REST
- **MinIO** pour le stockage S3-compatible

## 🚀 Démarrage

```bash
cd docker/postgrest

# 1. Copier le template
cp .env.example .env

# 2. Éditer .env
nano .env

# 3. Démarrer
docker compose up -d