# Scénario 4 : Keycloak SSO Entreprise

## 🎯 Objectif

Alternative **entreprise** à Supabase self-hosted :

- **Keycloak** pour le SSO (Single Sign-On)
- **PostgREST** pour l'API REST
- **MinIO** pour le stockage S3-compatible

## 🚀 Démarrage

```bash
cd docker/keycloak

# 1. Copier le template
cp .env.example .env

# 2. Éditer .env avec les vraies valeurs
nano .env

# 3. Démarrer
docker compose up -d

# 4. Vérifier
docker compose ps