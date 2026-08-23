# Déploiement — Phase 4 (DQE / Factur-X / Appels d’offres)

## 1. Migrations SQL à appliquer

| Ordre | Fichier | Objet |
|-------|---------|-------|
| 1 | `20260823120910_b203f425-a919-4cb7-8d67-0e53ccd0201d.sql` | Colonnes natives de cycle de vie sur `btp.boq_lines` (`document_type`, `business_status`, `parent_document_id`, `billed_percentage`), index, backfill, GRANTs |
| 2 | `2026082600050_update_police_log_access.sql` | Politiques RLS des logs d’accès (partage sécurisé) |

Toutes les instructions sont idempotentes (`IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`) : rejouables sans risque sur recette puis production.

```bash
supabase db push            # recette
supabase db push --linked   # production (après validation QA)
```

## 2. Variables d’environnement requises

| Variable | Rôle | Note |
|----------|------|------|
| `VITE_DATA_PROVIDER` | `supabase` \| `postgrest` | Mode self-hosted = `postgrest` |
| `VITE_BTP_SCHEMA` | Schéma métier (`btp`) | Doit être exposé via `VITE_PGRST_SCHEMAS` |
| `VITE_PGRST_SCHEMAS` | Schémas exposés à l’API | `public,btp` |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Accès API | Clé anon uniquement — jamais la service_role |
| `VITE_STORAGE_PROVIDER` / `VITE_STORAGE_BUCKET` | GED (PDF/XML joints) | Bucket existant, upsert activé |
| `VITE_EMAIL_PROVIDER` / `VITE_EMAIL_FROM` | Envoi facture + Factur-X | Via `CommunicationService` → Edge Function |
| `VITE_DEV_MODE` | Auth locale DEV_USER | **`false` en recette et production** |

Secrets côté Edge Functions (dashboard, jamais en base) : clé du fournisseur d’email et `SUPABASE_SERVICE_ROLE_KEY` (déjà injectée).

## 3. Procédure

```bash
./scripts/deploy-phase4.sh recette      # vérifs + migrations + tests
./scripts/deploy-phase4.sh production
```

## 4. Vérifications post-déploiement

1. `btp.boq_lines` expose bien `document_type`, `business_status`, `parent_document_id`, `billed_percentage`.
2. Créer un DQE → Devis → Contrat → Décompte 30 % → Facture sur un projet de test : statuts et TypeCodes conformes.
3. Dépassement volontaire du plafond sur un décompte : émission refusée **et aucune ligne créée**.
4. Envoi d’une facture par email : PDF + XML Factur-X reçus en pièces jointes.
5. Aucune erreur `PGRST` / `42501` dans les logs API.
