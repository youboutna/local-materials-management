# Audit CRUD UI→DB — Schéma `btp` (89 tables)

Règle de référence : `UI → Hook → Service → Repository (port) → Adapter → DB`
(cf. `docs/ARCHITECTURE.md`, `docs/ARCHITECTURE_REFERENTIELS.md`). Zéro `supabase.from()` en UI.

## Chaînes complétées dans ce lot

| table | port | adapter | service | hook | UI rebranchée |
|---|---|---|---|---|---|
| `quantity_takeoffs` | existant | `SupabaseQuantityTakeoffAdapter` | `QuantityTakeoffService` | `useQuantityTakeoffsHex` | `QuantityTakeoffs`, `MetreCalculator`, `ProjectMaterials` |
| `project_resources` | `IProjectResourceRepository` | `SupabaseProjectResourceAdapter` | `ProjectResourceCrudService` | `useProjectResourcesCrudHex` | `TeamOverview` |
| `task_dependencies` | `ITaskDependencyRepository` | `SupabaseTaskDependencyAdapter` | `TaskDependencyService` | `useProjectTaskDependenciesHex` | `EnhancedTaskManager` |
| `system_settings` | `ISystemSettingsRepository` | `SupabaseSystemSettingsAdapter` | `SystemSettingsService` | `useAdminEmailsHex`, `useSystemSettingsHex` | `AdminEmailsSettings` |
| `escalation_thresholds` | `IEscalationThresholdRepository` | `SupabaseEscalationThresholdAdapter` | `EscalationThresholdService` | `useEscalationThresholdsHex` | `EscalationThresholdsSettings` |
| `notifications` | `INotificationRepository` (+ `listAllNotifications`) | `SupabaseNotificationAdapter` | `NotificationService.getAllNotifications` (réel, plus de stub) | `useAllNotificationsHex` | `NotificationCrud` |

Toutes ces tables ont désormais un round-trip UI→DB complet (create / read / update / delete
selon les besoins métier) et les repositories sont enregistrés dans `RepositoryFactory`.

## Backlog priorisé (violations restantes)

### P0 — accès Supabase direct en UI
1. `components/project/inspection/InspectionFormWithContext.tsx` → `useInspectionCrudHex`
2. `components/project/PhaseInspections.tsx` → service inspections
3. `components/project/workflow/StepDetailPanel.tsx` → service inspections
4. `components/tenders/TenderDocumentManager.tsx` (`tender_steps`, `documents`)
5. `components/tenders/TenderEvaluationPanel.tsx` (`tender_submissions`)
6. `components/payments/PaymentRequestModal.tsx` (`documents`)
7. `components/project/ProjectDocumentUpload.tsx`, `components/suppliers/SupplierDocumentUpload.tsx`,
   `components/selectors/DocumentSelector.tsx`, `components/documents/TenderDocumentUploadForm.tsx` → `DocumentService`
8. `components/invoices/ConsultantValidationPanel.tsx` (factures d'avancement)

### P1 — chaînes hexagonales absentes
- `material_suppliers`, `project_organizations`, `supplier_inspections`,
  `material_documents`, `stock_movements`, `supplier_notifications`
- `project_comments`, `project_members`, `tender_lots`, `tender_submissions`
- Exposer `organizational_hierarchy` (hook + UI organigramme, delete non exposé)

### P2 — hygiène / doublons
- Fusionner `SupabaseEmployeeAdapter` et `SupabaseEmployeeEntityAdapter`
- Renommer les adapters aux classes minifiées (`export class l`)
- Corriger l'appel cassé `(OrganizationalHierarchyService as any).getns?.()` dans
  `BankGuaranteeActionFunctions.ts`
- Centraliser unités/catégories dans `src/config/referentials` (listes encore codées en dur dans
  `BoqWorkspace`, `BoqLineTable`, `TenderEstimatorForm`, `QuantityTakeoffsList`,
  `PhaseStepResourceDialog`, `MetreCalculator`, `TenderLotDocumentsManager`)
- Documenter `email_logs`, `scheduled_calls`, `processing_logs` comme « hors flux UI »
  (écrits par edge functions) ou créer des adapters lecture seule pour l'admin
