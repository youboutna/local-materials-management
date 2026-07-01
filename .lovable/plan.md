
# Refonte du module Tender Management — Cohérence et fluidité

## 1. Contexte

Socle existant (à réutiliser, pas réécrire) : tables `tenders`, `tender_submissions`, `tender_estimates`, `tender_estimate_items`, `quantity_takeoffs`, `project_phases/tasks/milestones` ; parseurs Excel/PDF/métré en silos ; portail fournisseur basique avec code secret ; module projet (Gantt/PERT) actif.

Défi : **orchestrer** les briques, **uniformiser** les parcours (Wizards/Steppers), **centraliser** les règles dans des référentiels, **fluidifier** les transitions d'état et inter-modules, **tracer** chaque décision.

## 2. Périmètre — 4 lots

### Lot 1 — Backend Tender (manager)

Pages : `TenderManagement.tsx` (liste + indicateurs), `TenderDetail.tsx`.

- **Stepper horizontal 5 étapes** remplace les onglets denses : Identification → Cadre & Lots → DPAO & Pièces → Planning → Publication.
- **Statuts référentiels** : `draft → published → open → under_evaluation → awarded → contracted → closed` avec gardes (ex: publication interdite sans lots).
- **SubmissionsInbox** : centralise réception, filtres statut/fournisseur/lot, badges deadline, `submission_access_logs`.
- **EvaluationPanel** refondu : 3 sous-onglets (Admin / Technique / Financier), critères pondérés, score total auto, verrou post-attribution.
- **Attribution** : dialog confirmation → contrat draft → notification lauréat/rejetés (edge existant).

### Lot 2 — Portail fournisseur `/supplier-portal`

Page : `UnifiedSupplierPortal.tsx`.

- **Mode hybride** conservé : consultation publique (`status IN ('published','open')` ET `deadline_date > now()`), suivi via code secret existant.
- **PublicTendersList** : cartes compactes, filtres (catégorie, région, montant, deadline).
- **SupplierBidWizard vertical 4 étapes** : DPAO → DQE → Pièces (admin/tech/fin) → Récap & soumission.
- Progress tracker persistant, garde deadline bloquante.

### Lot 3 — DQE Wizard (Quote & Takeoff)

Composants : `EnhancedTenderEstimator`, `TenderQuantitativeEstimate`, `QuantityTakeoffForm`.

- **3 modes fusionnés dans un onglet unique** :
  - Import Excel (BPU multi-structure, parser étendu)
  - Import PDF (OCR consolidé, extraction lignes/lots)
  - Saisie manuelle (table lots/sous-lots, drag & drop, duplication)
- Calculs temps réel (PT = qté × PU), totaux/lot, TVA, sous-totaux.
- Validation `TenderEstimateValidation` (unités, quantités > 0, PU numérique).
- Aperçu PDF (`DevisPDFDocument`), export XLSX, autosave debouncé.

### Lot 4 — Post-attribution → hydratation projet

Nouveau service : `AwardedTenderToProjectService`.

Déclencheur : « Signer contrat » sur soumission gagnante (rôles habilités).

Pipeline :
1. Charger `TenderEstimate` lauréat (existant ou reparser).
2. Mapper via référentiel : 1 lot = 1 phase, 1 sous-lot = 1 tâche, jalons à 25/50/75/100 % du montant.
3. **Preview interactive** (`AwardedTenderPreviewDialog`) : renommer, fusionner, ajuster durées.
4. Application via `ProjectWorkflowService` (respecte règle « Project Aggregate ») → `project_phases`, `project_tasks`, `project_milestones`, `project_budget_links`, ajout fournisseur dans `project_stakeholders`.
5. Traçabilité : `project_alerts` + `workflow_history`.

Scénario complémentaire : bouton « Importer depuis DQE » dans `ProjectCreationWorkflow` (upload direct, sans AO).

## 3. Référentiels paramétrables

| Référentiel | Rôle |
|-------------|------|
| `tender-workflow.referential` | Statuts, transitions, gardes métier |
| `evaluation-criteria.referential` | Critères pondérés modifiables |
| `dqe-mapping.referential` | Règles DQE → phases/tâches/jalons |

Stockés dans `src/config/referentials/`, administrables sans redéploiement.

## 4. Contraintes techniques

- **Hexagonal strict** : UI → Hook → Service → Repository → Adapter → DB. Aucun `supabase` direct dans React.
- **Transformers dédiés** : `AwardedTenderTransformer`, extension `TenderEstimateItemTransformer`.
- **TanStack Query v5** : pas de `onSuccess`/`onError` sur `useQuery`/`useMutation`.
- **RLS** : ajout policy publique `anon SELECT` sur `tenders WHERE status IN ('published','open') AND deadline_date > now()`. Autres policies conservées.

## 5. Structure indicative

```text
src/config/referentials/
├── tender-workflow.referential.ts
├── evaluation-criteria.referential.ts
└── dqe-mapping.referential.ts

src/application/services/
├── AwardedTenderToProjectService.ts        (nouveau)
└── TenderEstimateService.ts                (étendu : autosave, parser)

src/dtos/transforms/
└── AwardedTenderTransformer.ts             (nouveau)

src/components/tenders/
├── TenderWizardStepper.tsx                 (nouveau)
├── SubmissionsInbox.tsx                    (nouveau)
├── EvaluationPanelTabs.tsx                 (refonte)
└── AwardedTenderPreviewDialog.tsx          (nouveau)

src/components/supplier/
├── SupplierBidWizard.tsx                   (nouveau, 4 steps)
└── PublicTendersList.tsx                   (nouveau)

src/pages/
├── TenderManagement.tsx                    (wire stepper + inbox)
├── TenderDetail.tsx                        (wire evaluation + award)
└── UnifiedSupplierPortal.tsx               (wire wizard)
```

Migration SQL unique : policy publique lecture `tenders` (statuts publics + deadline valide).

## 6. Ordre d'exécution

| Phase | Périmètre | Justification |
|-------|-----------|---------------|
| 1 | Référentiels + `AwardedTenderToProjectService` | Fondations métier |
| 2 | Lot 1 (Backend Tender) | Cœur gestionnaire |
| 3 | Lot 3 (DQE Wizard) | Indépendant, parallèle possible |
| 4 | Lot 2 (Portail) | Consomme Lot 3 |
| 5 | Lot 4 (Post-attribution) | Boucle le cycle |

## 7. Décisions par défaut

- Portail : hybride (public + code secret).
- Sources DQE : Excel + PDF + manuel dans un même espace.
- Mapping : lot=phase / sous-lot=tâche / jalons 25-50-75-100 %, ajustables en preview.

## 8. Hors périmètre (itérations futures)

Notifications multicanal unifiées ; enrichissement GIS (analyses spatiales) ; schéma DB étendu ; comptes fournisseurs obligatoires ; connecteurs ERP/SCADA fins ; workflow garanties/cautions dédié ; approbations multi-comités granulaires.

## 9. Bénéfices attendus

Parcours guidés sans rupture ; zéro double saisie DQE → contrat → projet ; visibilité temps réel ; règles configurables sans code ; garde-fous métier ; traçabilité complète pour audit.

## 10. Prochaines étapes

Validation plan → paramétrage initial référentiels avec administrateurs → développement itératif lots 1→4 → recette parcours → déploiement progressif.
