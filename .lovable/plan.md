# Plan v3.2 — Correctifs BOQ (post-audit v3.1)

Objectif : combler les écarts constatés entre le plan v3.1 et l'implémentation réelle. Exécution en 4 lots parallèles en background, sans reprise de main entre les lots.

## État des lieux (audit rapide)

| Point v3.1 | Statut réel | Écart |
|---|---|---|
| Migration `btp.boq_lines` + vues compat | Fait (B1) | Repository cible encore les tables historiques |
| `BoqContextService` / `DocumentService` / `BoqWorkflowService` | Fichiers présents | `DocumentService.generate` produit un CSV, pas un PDF ; pas d'entête/pied ; agrège uniquement les lignes passées |
| `DqeWorkspace` unifié | Monté sur projet + portail | Carte legacy « Métrés / Métrés ajouter / Liste des Métrés » toujours affichée sous le workspace ⇒ doublon |
| Onglets Devis / Factures fournisseur | Refactor OK | Flux « Créer un devis depuis un AO » non câblé ; « Joindre à la soumission » absent ; onglet Facture n'impose pas l'association projet/AO |
| Actions PDF / Email / Signer / Diffuser | Boutons visibles | Email OK (edge function), PDF = CSV, Signer = no-op, Diffuser non branché côté projet |
| Statut `draft` sur lignes | Absent | Chaque ligne créée est immédiatement persistée sans état brouillon explicite ⇒ pas de "finaliser DQE" |
| Shadow-writes `quantity_takeoffs` | Toujours en place dans `BoqWorkspace` / `BoqImportDialog` | À retirer une fois `boq_lines` en lecture |

## Lot 1 — Workflow brouillon + suppression carte Métrés legacy

- `src/components/project/ProjectDqeTab.tsx` (et tout écran affichant `Métrés` / `Métrés ajouter` / `Liste des Métrés` sous `DqeWorkspace`) : supprimer la section legacy. Le takeoff dimensionnel reste accessible depuis l'import (`AdvancedQuantityCalculator`) déjà intégré dans `BoqWorkspace`.
- `BoqLineDTO` : ajouter `status?: BoqStatus` (défaut `draft`).
- `SupabaseBoqRepository.create` / `bulkCreate` : persister `status='draft'` par défaut, colonne déjà présente sur `btp.boq_lines`; pour tables legacy, mapper vers `status` existant ou champ metadata.
- `BoqWorkflowService` : exposer `finalize(lines) → submitted` (bulk transition).
- `BoqActionsBar` : ajouter action `finalize` (bouton « Finaliser le DQE ») visible quand ≥1 ligne `draft`. Après finalize, déclencher automatiquement `generate` (Lot 2).
- KPI header : afficher badge « N brouillon(s) » quand présent.

## Lot 2 — PDF complet + actions contextuelles

- Créer `src/application/services/boq/BoqPdfRenderer.ts` (pure TS + `jspdf` + `jspdf-autotable` déjà installés) :
  - Entête : titre contexte (`ctx.title`), n° document, date, émetteur/destinataire, projet/AO référencés.
  - Corps : tableau lignes (Désignation, WBS Phase/Jalon/Tâche, Type, Qté, Unité, PU, TVA, Total HT).
  - Totaux : HT / TVA / RAS / TTC via `BoqCalculatorService.aggregate`.
  - Pied : mentions légales, pagination, signature (si `signed`).
- `DocumentService.generate(ctx)` : signature revue — charge **toutes** les lignes du contexte via `boqRepository.list({ source, contextId, projectId })` (plus de dépendance sur la sélection UI), renvoie `{ blob: Blob(pdf), filename: '<prefix>-<ctx>-<date>.pdf' }`.
- `DocumentService.email` : joindre le PDF (base64) au payload edge `send-email-notification`. Corriger le sujet/HTML par contexte (Devis vs Facture vs DQE).
- `DocumentService.sign` : écrire `signature_hash` + `signed_at` + `signed_by` dans les métadonnées du document (table `btp.boq_documents` si présente, sinon `boq_lines.metadata`) et mettre à jour statut via `BoqWorkflowService`.
- `BoqActionsBar` : appels alignés sur la nouvelle signature (`generate(ctx)` sans passer `lines` manuellement) ; masquage par `BoqContextService.can(ctx, action)` déjà en place.

## Lot 3 — Flux Devis-depuis-AO & Facture→projet obligatoire

- Portail fournisseur `UnifiedSupplierPortal.tsx` :
  - Onglet « Appels d'Offres » : bouton « Créer un devis » sur chaque AO ⇒ `setActiveTab('devis')` + `setActiveTenderId(tender.id)` + `setSubmissionId(submission?.id)`.
  - Onglet « Devis » : monte `<DqeWorkspace routeContext="supplier-bid" tenderId submissionId senderId />` avec les IDs mémorisés ; sinon état vide « sélectionnez un AO ».
  - Action `attachToSubmission` : après `generate` + `sign`, upload du PDF dans bucket `tender-submissions` et insertion dans `tender_submission_documents` (table existante) avec `submission_id`, `document_type='quote'`.
- Onglet « Factures » : imposer sélection Projet **ou** AO avant validation (état bloquant dans `BoqWorkspace`) ; à la soumission, écriture `boq_lines.line_type='invoice'` + `project_id`/`tender_id` renseigné ⇒ alimente automatiquement `BoqBudgetDashboard` (déjà branché sur `boq` query key).
- Supprimer la seconde barre d'onglets redondante dans `UnifiedSupplierPortal.tsx` (image-109) — ne garder que la barre principale (Appels / Devis / Documents / Télécharger / Paiements / Notifications / Tâches / Inspections / Factures).

## Lot 4 — Nettoyage shadow-writes & bascule lecture `boq_lines`

- `SupabaseBoqRepository` : basculer les 4 sources sur `btp.boq_lines` en lecture (via colonne `line_type`) ; conserver les tables legacy en écriture jusqu'à validation prod (feature flag `BOQ_UNIFIED_READ=true`).
- Retirer les shadow-writes vers `quantity_takeoffs` dans `BoqWorkspace.flushDrafts` et `BoqImportDialog` : les takeoffs dimensionnels sont désormais représentés comme `boq_lines.line_type='quantity_takeoff'`.
- Vérifier vues `v_boq_quantity_takeoffs` / `v_boq_estimates` / `v_boq_invoices` : query sanity (compte lignes avant/après).

## Exécution

Batch parallèle background — les 4 lots sont indépendants (fichiers disjoints sauf `BoqActionsBar` qui reçoit Lot 1 + Lot 2 mais sur props différents). Pas de reprise de main intermédiaire. Livrables :
1. Diff complet des fichiers touchés.
2. Typecheck vert (`tsgo`).
3. Checklist ci-dessous cochée dans le commit final.

## Checklist de validation

- [ ] Carte « Métrés / Métrés ajouter / Liste des Métrés » retirée sous `DqeWorkspace`.
- [ ] Ajout de plusieurs lignes en `draft` sans persistance de statut final ; bouton « Finaliser » visible.
- [ ] `Finaliser` → transition `draft→submitted` + génération PDF automatique.
- [ ] PDF : entête, lignes complètes (toutes, pas la sélection), totaux HT/TVA/TTC, pied paginé.
- [ ] Email : PDF joint, sujet contextuel.
- [ ] Signer : statut `signed` + hash + horodatage.
- [ ] Portail : bouton « Créer un devis » depuis AO ouvre l'onglet Devis pré-rempli.
- [ ] « Joindre à ma soumission » insère le PDF dans `tender_submission_documents`.
- [ ] Facture bloque la validation sans projet/AO ; suivi budget alimenté.
- [ ] Double barre d'onglets fournisseur supprimée.
- [ ] Shadow-writes `quantity_takeoffs` retirés.
- [ ] Typecheck OK.

Confirmez « GO v3.2 » pour lancement en batch parallèle background.
