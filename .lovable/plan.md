## Objectif
Terminer la migration `public → btp` pour les Lots 2 à 5 (dette technique restante), en suivant la stratégie « Copie + bascule » validée pour le Lot 1.

## Stratégie appliquée par lot
Pour chaque table du lot :
1. `CREATE TABLE btp.<t> (LIKE public.<t> INCLUDING ALL)` + copie des données.
2. Recréation FK, RLS, policies, index, triggers dans `btp`.
3. `GRANT` explicites (`authenticated`, `service_role`, `anon` si policy publique).
4. Bascule des services applicatifs vers `btpClient` (import `schema-clients`).
5. Refactor des fonctions SECURITY DEFINER concernées : `SET search_path = 'btp, public'`.
6. Ajout à `supabase_realtime` pour les tables abonnées.
7. `public.<t>` laissée en lecture seule (REVOKE writes) jusqu'à validation UI, puis `DROP` au lot suivant.

---

## Lot 2 — Projects & Workflow
**Tables** : `projects`, `project_phases`, `project_steps`, `project_milestones`, `project_comments`, `project_alerts`, `project_resources`, `project_risks`, `project_organizations`, `organizations`, `organizational_hierarchy`, `employees`, `phase_employees`, `phase_materials`, `task_dependencies`, `risk_task_relations`, `resource_assignments`, `workflow_status`.

**Fonctions refactorées** : `get_project_hierarchy`, `get_hierarchy_chain`, `get_escalation_targets`, `search_projects_autocomplete` (déjà en `search_path='public, btp'`, à basculer sur `btp` en source).

**Services basculés** : `ProjectService`, `ProjectWorkflowService`, `PhaseService`, `WorkflowService`, `WorkflowStepService`, adaptateurs monitoring, hooks `useProjects`, `useProjectHierarchy`, `useWorkflowSteps`.

**Point d'attention** : `projects` est référencé par de nombreuses FK sortantes du Lot 1 (tenders → projects). Les FK cross-schema doivent être recréées avec le nouveau target `btp.projects`.

---

## Lot 3 — Inspections & Paiements
**Tables** : `inspection_pvs`, `inspection_documents`, `supplier_inspections`, `supplier_payments`, `supplier_payment_requests`, `payment_blocks`, `progress_invoices`, `profit_distributions`.

**Fonctions refactorées** : `create_progress_invoice`, `create_supplier_payment_request` (déjà multi-schéma, à valider).

**Services basculés** : `InspectionService`, `PVGeneratorService`, `PaymentService`, `SupplierPaymentRepository`.

**Point d'attention** : `PVGeneratorAdapter` utilise déjà le client par défaut pour les PVs + `btpClient` pour lookup inspection — à unifier sur `btpClient` post-migration.

---

## Lot 4 — Référentiels & Prix
**Tables** : `price_references`, `price_calculations`, `price_revaluation_logs`, `stock_thresholds`, `stock_alerts`, `form_templates`, `escalation_thresholds`, `import_forecasts`, `supply_requests`, `distance_matrix`, `locations`.

**Fonctions refactorées** : `get_escalation_thresholds`, `increment_template_usage`.

**Services basculés** : `PriceService`, `FormTemplateService`, `LocationService`.

**Note** : `stocks` reste en `public` (module fuel hors périmètre BTP).

---

## Lot 5 — Communication & Notifications
**Tables** : `notifications`, `email_logs`, `email_templates`, `contact_messages`, `scheduled_calls`, `complaints`, `danger_reports`, `prospect_subscription_requests`, `subscriptions`, `supplier_notifications`, `supplier_viewed_items`, `processing_logs`.

**Services basculés** : `NotificationService`, `EmailService`, `ContactService`, `ComplaintService`, `SubscriptionService`.

**Point d'attention** : Edge Functions (`send-email-notification`, `send-supplier-notification`, `send-tender-*`) utilisent `SUPABASE_SERVICE_ROLE_KEY` avec client racine → doivent explicitement cibler `schema: 'btp'` dans leurs requêtes.

---

## Cadence de livraison
- **1 migration SQL = 1 lot** (approbation utilisateur entre chaque).
- Après migration approuvée : types TS régénérés, bascule code, `tsgo` typecheck, smoke test UI.
- Après validation UI d'un lot → `DROP TABLE public.<t> CASCADE` inclus dans la migration du lot suivant.

## Livrable ce tour
**Lot 2 uniquement** (migration SQL + bascule des services Projects/Workflow + refactor des 4 fonctions SECURITY DEFINER). Les Lots 3-5 suivront à validation.

## Risques transversaux
- **Realtime subscriptions** : chaque table utilisée en subscription doit être ajoutée à `supabase_realtime` côté `btp`.
- **Edge Functions Lot 5** : audit obligatoire — le client `service_role` ne cible pas `btp` par défaut.
- **Types TS** : régénération automatique après chaque migration ; certains `as any` deviendront redondants.
- **Fonctions cross-lot** : `create_progress_invoice` (Lot 3) référence `projects` (Lot 2) → ordre d'exécution respecté.