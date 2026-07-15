# Plan v3.3 — Alignement strict sur les 4 exigences

Objectif : corriger définitivement les écarts identifiés sur v3 / v3.1. Aucun nouveau périmètre, uniquement mise en conformité.

## Lot 1 — Saisie en bloc (batch, transaction unique)

**Cible :** `BoqWorkspace` + `BoqLineTable` + `SupabaseBoqRepository` + `useBoqDocument`.

- Supprimer le dialog « Ajouter une ligne » qui persiste immédiatement.
- Rendre le tableau `BoqLineTable` éditable inline avec les **mêmes colonnes que le parseur d'import** : Désignation · Phase · Jalon · Tâche · Type ouvrage · Unité · L · l · h · Quantité · PU · TVA · RAS · Frais généraux · Total HT.
- Ajouter une ligne = insertion locale dans un tampon (state), pas d'appel réseau.
- Import CSV/Excel/PDF alimente le même tampon (déjà éditable après import — cf. capture 115).
- Un unique bouton **« Enregistrer le DQE »** déclenche `boqRepository.bulkCreate(lines)` en transaction, avec statut `submitted` d'emblée (fini le brouillon DB par ligne).
- API repository : garder `bulkCreate` existant, supprimer les appels itératifs à `createLine` côté UI.

## Lot 2 — Métrés optionnels via `btpCalculations`

**Cible :** `BoqLineTable` (edition inline) + `src/utils/btpCalculations.ts`.

- Sur chaque ligne, si `elementType` + dimensions renseignés → appel `calculateAdvancedQuantities` (fichier existant) pour **pré-remplir** la colonne Quantité.
- La quantité reste éditable manuellement (pas de verrou).
- Zéro duplication : import direct depuis `src/utils/btpCalculations.ts`. Suppression de toute logique de calcul copiée ailleurs (audit `AdvancedQuantityCalculator`, `BoqCalculatorService`).

## Lot 3 — Actions documentaires sur l'agrégat

**Cible :** `BoqActionsBar` + `DocumentService` + `DqeWorkspace`.

- `BoqActionsBar` déplacé **dans** la carte DQE (pas dans un header orphelin — cf. capture 113) et rendu conditionnel : visible seulement quand `doc.lines.length > 0` ET `status ∈ {submitted, validated, signed}`.
- Chaque action (`generatePdf`, `email`, `sign`, `download`, `distribute`) recharge systématiquement les lignes via `boqRepository.list({ source, contextId, projectId })` — pas de dépendance à une sélection.
- `BoqPdfRenderer` : vérifier entête + pied de page paginé + totaux HT/TVA/RAS/TTC + bloc signature (déjà en place, à valider).

## Lot 4 — `DqeWorkspace` unique dans les 4 contextes

**Cible :** `UnifiedSupplierPortal` (onglets Devis + Factures) + `ProjectDqeTab` + `TenderEstimator`.

- **Projet** : `<DqeWorkspace routeContext="project-dqe" projectId=... />` (déjà en place).
- **Tender estimate** : idem `routeContext="tender-estimate" tenderId=...`.
- **Portail fournisseur / Devis** : `routeContext="supplier-bid" tenderId submissionId senderId`. Si pas de `submissionId`, création automatique de la soumission liée à l'AO au premier enregistrement.
- **Portail fournisseur / Factures** : `routeContext="supplier-invoice"` avec **association projet OU AO obligatoire** (champ requis avant `bulkCreate`).
- CTA « Créer un devis depuis un AO » : navigation onglet Devis + hydratation `tenderId` (déjà câblé), à valider end-to-end.
- Correction bug capture 116 « Profil fournisseur requis » : afficher le `DqeWorkspace` en mode invité si `senderId` disponible (code secret), sans exiger un profil complet.

## Contraintes techniques (résumé)

- `IBoqRepository.bulkCreate(lines)` : ligne atomique, retourne le lot inséré. Pas de shadow-write `quantity_takeoffs`.
- `BoqLineDTO.status` : supprimer `draft` du flow saisie (reste dispo pour import parseur si besoin de revalidation).
- Aucun composant hors `src/utils/btpCalculations.ts` ne recalcule L·l·h.
- Aucun `createLine` unitaire depuis l'UI (grep pour purger).

## Livrable

Une seule PR interne, 4 lots exécutés en parallèle. Typecheck vert. Test manuel des 4 contextes.
