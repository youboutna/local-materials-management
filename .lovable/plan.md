# Migration schéma `btp` — plan par lots

## Périmètre retenu
- **Migrer vers `btp`** : toutes les tables métier de `public` (tender_*, project_*, inspection_*, phase_*, price_*, form_*, workflow_*, subscription_*, complaints, contact_messages, notifications, email_*, danger_reports, prospect_*, etc.).
- **Reste en `public`** (transverse indispensable) : `profiles`, `user_roles`, `oauth_providers`, `auth_sessions`, `blocked_senders`, `system_settings`, `pharmaceutical_specialties`, `prescription_medications`, `insurance_companies`, `territories`, storage.objects, toutes les tables `fuel_stations.*` et `public.stocks`/`deliveries`/`stations_*`/`brand_*`/`national_depots` (hors périmètre BTP, module fuel).
- **Fonctions SECURITY DEFINER** avec `SET search_path = 'public'` : mises à jour vers `'btp, public'` quand elles référencent des tables migrées.

## Stratégie de migration (par table)
Pour chaque table migrée :
```sql
-- 1. CREATE TABLE btp.<t> (LIKE public.<t> INCLUDING ALL);
-- 2. INSERT INTO btp.<t> SELECT * FROM public.<t>;
-- 3. Recréer FKs, RLS, policies, triggers, indexes en btp
-- 4. GRANT SELECT/INSERT/UPDATE/DELETE TO authenticated + ALL TO service_role
-- 5. Laisser public.<t> intacte (lecture seule via REVOKE INSERT/UPDATE/DELETE)
-- 6. Bascule code → btpClient
-- 7. Après validation utilisateur : DROP TABLE public.<t> CASCADE
```
Chaque lot = 1 migration approuvée + 1 batch de bascule code, testable indépendamment.

## Lots de migration (ordre de dépendance)

### Lot 1 — Tenders (5 tables)
`tenders`, `tender_submissions`, `tender_document_submissions`, `tender_submission_documents`, `tender_sharing_secrets`, `tender_sharing_access_logs`, `tender_workflow_status`, `tender_suppliers`, `tender_estimates`, `tender_estimate_items`, `submission_access_logs`, `submission_activity_logs`, `document_validation_logs`.
Services à basculer : `TenderService`, `TenderSubmissionService`, `TenderEstimateService`, `SubmissionAccessService`.

### Lot 2 — Projects & Workflow (8 tables)
`projects`, `project_phases`, `project_steps`, `project_milestones`, `project_comments`, `project_alerts`, `project_resources`, `project_risks`, `project_organizations`, `organizations`, `organizational_hierarchy`, `employees`, `phase_employees`, `phase_materials`, `task_dependencies`, `risk_task_relations`, `resource_assignments`, `workflow_status`.
Services : `ProjectService`, `ProjectWorkflowService`, `PhaseService`, adaptateurs monitoring.
Refactor fonctions : `get_project_hierarchy`, `get_hierarchy_chain`, `get_escalation_targets`, `search_projects_autocomplete`.

### Lot 3 — Inspections & Paiements (6 tables)
`inspection_pvs`, `inspection_documents`, `supplier_inspections`, `supplier_payments`, `supplier_payment_requests`, `payment_blocks`, `progress_invoices`, `profit_distributions`.
Services : `InspectionService`, `PVGeneratorService`, `PaymentService`.
Refactor fonction : `create_progress_invoice`.

### Lot 4 — Référentiels & Prix (5 tables)
`price_references`, `price_calculations`, `price_revaluation_logs`, `stock_thresholds`, `stock_alerts`, `form_templates`, `escalation_thresholds`, `import_forecasts`, `supply_requests`, `distance_matrix`, `locations`.
Services : `PriceService`, `FormTemplateService`.

### Lot 5 — Communication & Notifications (5 tables)
`notifications`, `email_logs`, `email_templates`, `contact_messages`, `scheduled_calls`, `complaints`, `danger_reports`, `prospect_subscription_requests`, `subscriptions`, `supplier_notifications`, `supplier_viewed_items`, `processing_logs`.
Services : `NotificationService`, `EmailService`, `ContactService`.

## Refonte code (par lot)
Pattern uniforme dans chaque service :
```ts
// avant
import { supabase } from '@/integrations/supabase/client';
// après
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
// storage / auth restent sur `rootSupabase` importé séparément
```
Vérifier que chaque `supabase.functions.invoke()`, `supabase.auth.*`, `supabase.storage.*` utilise `rootSupabase` (non schema-scoped).

## Config d'isolation
- `VITE_BTP_SCHEMA=btp` dans `.env` (activation globale).
- `schema-clients.ts` déjà prêt : bascule `btpClient` en un flag.
- Types régénérés automatiquement après chaque migration approuvée.

## Contrôles par lot
1. Migration SQL approuvée → types régénérés.
2. Diff `src/integrations/supabase/types.ts` : vérifier que `btp.<table>` apparaît.
3. Bascule code (search-replace ciblé).
4. `tsgo` typecheck.
5. Smoke test UI sur le module concerné.
6. Après validation : DROP `public.<table>` dans la migration du lot suivant.

## Risques identifiés
- **Fonctions SECURITY DEFINER** hardcodées sur `public.*` : à réécrire, sinon RLS/hiérarchie cassent en silence.
- **Types TS** : `src/integrations/supabase/types.ts` régénéré → certains `as any` peuvent devenir inutiles ou incorrects.
- **Edge Functions** : à auditer lot par lot (elles utilisent `SUPABASE_SERVICE_ROLE_KEY` + client racine).
- **Realtime** : `ALTER PUBLICATION supabase_realtime ADD TABLE btp.<t>` requis pour chaque table utilisée en subscription.
- **RLS avec sous-requêtes cross-schema** : `user_roles` reste en `public`, donc `has_role(auth.uid(), 'admin')` continue de marcher — vérifié.

## Livrable ce tour
Uniquement le **Lot 1 (Tenders)** — migration + bascule services + typecheck. Les lots suivants seront lancés à votre validation du Lot 1.