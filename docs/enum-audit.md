# Audit ENUM PostgreSQL — Phase 6

Périmètre : `supabase/migrations/**/*.sql`, tables `projects`, `tasks`, `documents`, `users/profiles`.
Lecture seule — aucune requête destructive exécutée.

## 1. Constat général

Le schéma **n'utilise quasiment jamais les types `ENUM` réellement en colonne**. La quasi-totalité
des colonnes de statut/priorité/type sont des `TEXT`/`VARCHAR` contraintes par `CHECK (... IN (...))`,
et les `CREATE TYPE ... AS ENUM` déclarés dans `20260811000000_move_from_sql_folder.sql` ne sont
jamais appliqués via `ALTER TABLE ... TYPE <enum>` ni référencés par `::<enum>` ailleurs dans les
migrations. Il y a donc un **référentiel ENUM mort/orphelin** en base, en parallèle d'un référentiel
`CHECK` divergent sur les mêmes colonnes.

## 2. Types ENUM déclarés (orphelins ou partiellement utilisés)

| Fichier:ligne | Type | Valeurs | Usage réel constaté |
|---|---|---|---|
| `20260811000000_move_from_sql_folder.sql:13` | `project_status` | `en cours, terminé, en attente, en inspection, suspendu, annulé` | **Aucune colonne ne référence ce type.** `btp.projects.status` reste `TEXT` avec un `CHECK` distinct (voir §3). |
| `20260811000000_move_from_sql_folder.sql:18` | `inspection_status` | `approved, requires_changes, rejected, pending` | Non utilisé comme type de colonne. `btp.inspections.status` (même fichier, ligne 57) est `VARCHAR(20) CHECK (...)` avec les **mêmes valeurs mais un ordre/texte différent** de définition — double source. |
| `20260811000000_move_from_sql_folder.sql:23` | `task_status` | `pending, in_progress, completed, cancelled` | Non retrouvé sur une colonne `tasks.status` dans les migrations auditées (la table `btp.project_tasks` créée dans `20250813150000_create_comprehensive_project_phase_tables.sql` n'a pas été confirmée avec ce même jeu de valeurs — cf. §4). |
| `20260811000000_move_from_sql_folder.sql:28` | `task_priority` | `low, medium, high, urgent` | Non utilisé sur colonne. |
| `20260811000000_move_from_sql_folder.sql:33` | `notification_type` | `task_assignment, project_update, inspection_required, payment_due, document_review, system` | Non utilisé ; `btp.supplier_notifications.notification_type` (`20250827064238_...sql:10`) est un `TEXT CHECK` avec un **jeu de valeurs totalement différent** (`password_reset, task_assignment, payment_reminder, inspection_scheduled, general`). |
| `20260811000000_move_from_sql_folder.sql:38` | `task_type` | `project, inspection, document, payment, material, general` | Non utilisé sur colonne. |
| `20260811000000_move_from_sql_folder.sql:43` | `user_role` | `admin, manager, director, agent, supplier, user` | Non appliqué à une colonne role ; la gestion des rôles passe par `public.user_roles` (table, cf. `20250629000000_bootstrap_core_schema.sql`), pas par ce type. |
| `20260811000000_move_from_sql_folder.sql:48` | `document_status` | `draft, pending_review, approved, rejected, archived` | Coïncide avec le `CHECK` de `documents.status` (`20250815000000_create_documents_table.sql:16`) mais **le type n'est pas utilisé** ; en parallèle une colonne `approval_status` distincte existe (`20250815000001_enhance_documents.sql:19`) avec un jeu de valeurs différent (`pending, approved, rejected, under_review`). |
| `20250830171458_..._sql:4,13` | `tender_document_category` / `tender_document_subcategory` | à vérifier (fichier tronqué dans l'audit) | À confirmer si utilisé par `ALTER TABLE`. |
| `20250918080326_..._sql:18` | `workflow_step_status` | `pending, in_progress, completed, approved, rejected, on_hold` | Semble utilisé (à confirmer par la requête §5.2). |
| `20260401225047_create_stock_movements_table.sql:10` | `movement_validation_status` | `pending, validated, rejected` | Probablement utilisé sur `stock_movements` (à confirmer). |

## 3. Divergences ENUM vs CHECK sur les mêmes colonnes métier

### 3.1 `projects.status`
- `20250719130635_create_projects.sql:11` : `CHECK (status IN ('en cours','terminé','en attente','suspendu','annulé'))` — **ne contient pas `'en inspection'`**.
- `20260811000000_move_from_sql_folder.sql:13` : `CREATE TYPE project_status` contient `'en inspection'`.
- `20260811000000_move_from_sql_folder.sql:91` : nouvelle colonne `btp.payments.project_status` avec un **troisième** jeu de valeurs (`pending, approved, rejected, requires_changes, payé, en inspection`) qui mélange le vocabulaire "projet" (français) et "inspection" (anglais/DB inspection_status).
- ⚠️ **Risque fonctionnel** : si une valeur `'en inspection'` est insérée dans `btp.projects.status` (cohérente avec le type ENUM ou avec l'UI), le `CHECK` de la table la rejettera — la table et le type ENUM sont désynchronisés depuis la création du type.

### 3.2 `documents.status` vs `approval_status`
- Deux colonnes de statut documentaire coexistent avec des vocabulaires différents (`draft/pending_review/approved/rejected/archived` vs `pending/approved/rejected/under_review`). À clarifier : périmètre fonctionnel distinct (statut cycle de vie vs statut d'approbation) ou doublon accidentel issu d'itérations successives.

### 3.3 `notification_type`
- Le type ENUM (`task_assignment, project_update, inspection_required, payment_due, document_review, system`) et la colonne réelle `btp.supplier_notifications.notification_type` (`password_reset, task_assignment, payment_reminder, inspection_scheduled, general`) ne partagent qu'une seule valeur commune (`task_assignment`). Ce sont deux référentiels métiers différents portant le même nom de type logique — source de confusion.

### 3.4 Statuts d'inspection (3 vocabulaires distincts constatés)
- ENUM `inspection_status` (DB, orphelin) : `approved, requires_changes, rejected, pending`.
- `CHECK` réel sur `btp.inspections.status` : `pending, approved, rejected, requires_changes` (mêmes valeurs, ordre différent — OK fonctionnellement).
- Référentiel front `src/config/referentials/inspections/inspection-statuses.referential.ts:8-14` : `pending, scheduled, in_progress, completed, failed, cancelled` — **vocabulaire complètement différent** de la colonne DB réelle. Le front ne pourra pas représenter les statuts DB `approved` / `requires_changes` / `rejected` avec ce référentiel (`getInspectionStatus` retombera silencieusement sur `pending` par défaut, ligne 36-40).

## 4. Table `tasks` — code manquant pour confirmation

La création de `btp.project_tasks` est dans `20250813150000_create_comprehensive_project_phase_tables.sql`
mais les colonnes `status`/`priority` de cette table précise n'ont pas pu être confirmées dans cet
audit (fichier volumineux, lecture partielle). **Action requise** : exécuter la requête 5.1 pour
extraire la définition exacte avant toute consolidation d'ENUM.

## 5. Requêtes SQL de vérification (lecture seule, sûres à exécuter en prod/staging)

```sql
-- 5.1 Définition exacte des colonnes status/priority/type sur les tables cibles
SELECT table_schema, table_name, column_name, data_type, udt_name,
       column_default, is_nullable
FROM information_schema.columns
WHERE table_name IN ('projects','tasks','project_tasks','documents','users','profiles','inspections')
  AND column_name IN ('status','priority','type','document_type','role','approval_status')
ORDER BY table_schema, table_name, column_name;

-- 5.2 Types réellement utilisés comme udt_name (confirme si un ENUM est appliqué à une colonne)
SELECT table_schema, table_name, column_name, udt_name
FROM information_schema.columns
WHERE udt_name IN (
  'project_status','inspection_status','task_status','task_priority',
  'notification_type','task_type','user_role','document_status',
  'tender_document_category','tender_document_subcategory',
  'workflow_step_status','movement_validation_status'
);

-- 5.3 Liste de tous les types ENUM existants en base + leurs labels, et colonnes qui les utilisent (ou non)
SELECT t.typname AS enum_name,
       array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels,
       (SELECT count(*) FROM information_schema.columns c WHERE c.udt_name = t.typname) AS nb_colonnes_utilisatrices
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
GROUP BY t.typname
ORDER BY nb_colonnes_utilisatrices ASC, t.typname;

-- 5.4 Contraintes CHECK actives sur les colonnes de statut/type (source de vérité réelle en prod)
SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'c'
  AND conrelid::regclass::text IN ('btp.projects','btp.tasks','btp.project_tasks','btp.documents','btp.inspections','public.profiles','public.users')
ORDER BY table_name, conname;

-- 5.5 Détection des valeurs réellement stockées hors du référentiel documenté (dérive silencieuse)
-- (adapter table/colonne selon 5.1 avant exécution)
SELECT status, count(*) FROM btp.projects GROUP BY status ORDER BY count(*) DESC;
SELECT status, count(*) FROM btp.inspections GROUP BY status ORDER BY count(*) DESC;
SELECT status, count(*) FROM btp.documents GROUP BY status ORDER BY count(*) DESC;

-- 5.6 Vérifier si les types ENUM orphelins sont réellement inutilisés (candidats DROP TYPE après confirmation métier)
SELECT t.typname
FROM pg_type t
WHERE t.typtype = 'e'
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.udt_name = t.typname);
```

## 6. Recommandations

1. **Ne pas dupliquer les libellés en base** : les `ENUM`/`CHECK` doivent rester des codes techniques
   (`pending`, `en_cours`, ...) — c'est déjà globalement respecté côté DB (aucun libellé fr/ar/en
   trouvé stocké dans une contrainte CHECK). Continuer sur ce principe.
2. **Choisir une seule source de vérité par colonne** : soit le `CREATE TYPE ... ENUM`, soit le
   `CHECK (... IN (...))`, jamais les deux en parallèle avec des valeurs qui divergent. Vu qu'aucune
   colonne n'utilise réellement les types ENUM créés dans `20260811000000_move_from_sql_folder.sql`,
   il est recommandé de :
   - soit **supprimer ces types orphelins** (après confirmation via requête 5.6) s'ils ne sont pas
     un contrat d'API/migration future ;
   - soit **migrer réellement les colonnes concernées vers ces types** en premier alignant les valeurs
     (ajout de `'en inspection'` au `CHECK`/ENUM `projects.status`, harmonisation `notification_type`).
3. **Harmoniser `inspections.status`** entre le référentiel front (`inspection-statuses.referential.ts`)
   et le vocabulaire réellement stocké en base (`pending, approved, rejected, requires_changes`). Le
   référentiel front actuel décrit un tout autre workflow (planification physique de la visite) qui
   semble correspondre à un besoin différent (peut-être `mission_status` / `visit_status`) — à
   documenter explicitement pour éviter la confusion de nommage.
4. **Clarifier `documents.status` vs `documents.approval_status`** : documenter la distinction
   fonctionnelle (cycle de vie du document vs cycle d'approbation) dans un commentaire SQL
   (`COMMENT ON COLUMN`) et dans le référentiel associé, ou fusionner si redondant.
5. Ajouter des `COMMENT ON TYPE` / `COMMENT ON CONSTRAINT` pointant vers le référentiel front
   (`STATUS_LABELS`) correspondant, pour tracer la correspondance code technique ↔ labels sans
   dupliquer les labels en base.
