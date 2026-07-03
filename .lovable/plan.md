## Diagnostic

Bugs/régressions confirmés dans le module Tender + Documents :

1. **Liste AO tronquée** — `TenderCrud` n'affiche que titre/description/statut. Pas de `tender_number`, deadlines, projet lié, valeur, ni bouton "Voir détail".
2. **Appel statique cassé** — `TenderManagement.tsx:80` appelle `TenderService.getTenderSubmissions(id)` en statique alors que `TenderService` est instance-based. Onglet "Réception" vide.
3. **Persistance incomplète** — `useTenderMutation` ignore `submission_deadline`, `evaluation_deadline`, `procurement_type`, `estimated_value`, `current_phase`, `current_stage`, `procurementSteps`.
4. **Workflow invisible** — Onglet empile 4 composants sans hiérarchie. `TENDER_WIZARD_STEPS` du référentiel non rendu comme fil conducteur.
5. **Codes secrets dispersés** — Saisie dupliquée entre `TenderManagement` inline et `SubmissionSecretDialog`. Pas de vue centralisée.
6. **Documents** — Onglet "Tender" de `Documents.tsx` non branché à `TenderDocumentManager`.
7. **TenderDetail spartiate** — Aucun `useSearchParams` côté `TenderManagement` pour `?tenderId=`.

## Livraison — 6 lots livrés en un seul batch

### Lot 1 — Fondations Service & Hooks
- `TenderManagement.tsx` : instancier `TenderSubmissionService` / `SubmissionSecretService` correctement, retirer `@ts-nocheck`, honorer `?tenderId=` via `useSearchParams`.
- `useTenderCrudHex.ts` : `useTenderMutation` persiste tous les champs formulaire ; `useTenders` retourne les valeurs brutes sans écrasement.
- Ajouter `createTender` / `updateTender` à `TenderService` (couvrent tous les champs DB).

### Lot 2 — Liste & Détail AO
- `TenderCrud` : cartes denses (numéro, projet lié, dates lancement/deadline/attribution, valeur, badges statut+type+mode), recherche+tri, boutons Voir/Sélectionner/Modifier/Supprimer.
- `TenderDetail.tsx` : blocs soumissions (count par statut), documents (count), codes secrets actifs, timeline, boutons "Ouvrir dans TenderManagement" et "Retour liste".

### Lot 3 — Workflow lisible
- Onglet "Workflow" refondu : stepper principal basé sur `TENDER_WIZARD_STEPS` (Identification → Cadre&Lots → DPAO → Planning → Publication), statut par étape calculé depuis `TenderStatusCode` + gardes de `getAllowedTransitions`.
- Section "Transitions" : boutons Publier/Ouvrir/Évaluer/Attribuer/Contractualiser/Clôturer avec blocages affichés.
- Fusion `PublicProcurementWorkflow` + `TenderWorkflowSteps` en une seule section "Étapes détaillées".

### Lot 4 — Réception, Évaluation, Décision, Notifications
- Onglets restructurés : `Workflow | Réception | Évaluation | Décision | Notifications | Documents | Codes | Lots`.
- **Réception** : `SubmissionsInbox` + compteurs référentiel + bouton "Notifier".
- **Évaluation** : `EvaluationPanelTabs` par soumission approuvée, sans bloc code inline.
- **Décision** (nouveau) : lauréat proposé, transitions `awarded → contracted → closed`, bouton "Signer & hydrater projet" → `AwardedTenderPreviewDialog`.
- **Notifications** (nouveau) : liste envois (via table `email_logs`), bouton renvoi.

### Lot 5 — Codes Secrets centralisés
- Nouvel onglet "Codes secrets" : liste `tender_sharing_secrets` (via nouveau hook `useTenderSharingSecrets`), colonnes email/expiration/accès/actif, actions régénérer/révoquer/copier lien portail.
- Bouton "Nouveau code" → `SecureSharingDialog` existant.
- Suppression du bloc "Vérifier code" de l'onglet Évaluation (validation reste côté portail public).

### Lot 6 — Page Documents
- `Documents.tsx` onglet "Tender" branché sur `TenderDocumentManager` (sélection AO + upload catégorisé DPAO/technique/financier/admin/garanties).
- Recherche par tag, filtre par type.
- Bouton "Ouvrir dans l'AO" → `/tender-management?tenderId=X&tab=documents`.

## Règles

- Aucun `supabase.from(...)` dans les composants touchés (services uniquement).
- TanStack Query v5 sans `onError`/`onSuccess` sur `useQuery`.
- `tender-workflow.referential.ts` = seule source des statuts/transitions/gardes/étapes.
- Aucun `@ts-nocheck` ajouté ; ceux touchés retirés.
- Flow DB → Adapter → Transformer → Entity → Service → DTO → UI respecté.

## Livrables

Un seul batch. Édits parallélisés au maximum. Typecheck strict en fin de passe. Rapport final avec liste des fichiers créés/modifiés + points de vérification manuels (créer un AO, publier, générer code, recevoir soumission, évaluer, attribuer, hydrater projet, upload document tender).
