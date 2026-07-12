
# Plan d'exécution — DQE / Tender / Portail Fournisseur (batch parallèle)

Objectif : consolider les 3 interfaces sur une base unique, corriger d'abord les bugs bloquants visibles sur les captures, puis mutualiser sans créer de nouvel écran.

## Batch A — Bugs bloquants (P0, en parallèle)

A1. **Portail fournisseur `/supplier-portal?tab=tenders`** (image annotée)
- Symptôme : code validé, toast "Accès autorisé", mais l'onglet reste sur la carte "Accès Sécurisé".
- Fix : dans `UnifiedSupplierPortal.tsx`, après validation du code invité, forcer `tab=tenders` et rendre le contenu des onglets (Appels d'Offres / Documents / Télécharger / Paiements / Notifications / Tâches / Inspections / Factures) au lieu de garder `SecretUnlockedView`. Persister le déverrouillage (sessionStorage clé `tenderId+secret`) pour ne pas re-demander à chaque navigation d'onglet.

A2. **Type d'élément "Saisie rapide" bloque l'ajout** (image-71)
- Symptôme : bouton "Calculer et ajouter" en rouge/désactivé quand `elementType='saisie_rapide'` sans dimensions.
- Fix : dans `AdvancedQuantityCalculator.tsx`, autoriser le mode "Saisie rapide" sans L×l×h (quantité manuelle uniquement, unité libre) ; adapter la validation `canAdd` et le label du bouton.

A3. **Import DQE : `Métrés` reste à 0 MRU / 0 lignes** (image-72)
- Symptôme : import réussi mais KPI DQE/Métrés non rafraîchis.
- Fix : garantir l'émission `boq-imported` + `boq-kpi-refresh` dans `useBoqImport` après `bulkCreate`, et écoute dans `ProjectDqeTab` + `QuantityTakeoffs`. Vérifier que `source='dqe'` est bien filtré côté `SupabaseBoqRepository.list`.

A4. **Ligne 28/29 "calcul basic" au lieu de "Saisie rapide"** (image-70)
- Fix : renommer partout le libellé UI dans `AdvancedQuantityCalculator` et le tableau résultats.

A5. **Bouton `project.cancel` non traduit** (image-71) — clé i18n manquante, ajouter la traduction FR/EN.

## Batch B — Mutualisation composants (P1, en parallèle après A)

B1. `ResourceSelector` unique (matériaux/main-d'œuvre/équipement) — extraire depuis `AdvancedQuantityCalculator` et `TenderEstimatorForm`, réutiliser dans `BoqImportDialog` mapping.
B2. `ResultTable` unique — fusionner `BoqLineTable` + tableau interne du calculateur (édition inline, pagination, suppression déjà présentes dans `BoqLineTable`).
B3. `MappingModal` — extraire l'assistant de mapping de `BoqImportDialog` en composant partagé consommé par le portail fournisseur lors de l'import de devis.
B4. `UnifiedBoqParser` déjà en place → brancher aussi l'import de **factures fournisseur** du portail (`/supplier-portal` onglet Factures) sur ce parser.

## Batch C — Services métier (P1)

C1. `MeterService` = façade orchestrant `BoqCalculatorService` + `AdvancedMeterEngine` (Basic vs Advanced) — supprime les branches dupliquées dans les composants.
C2. `ResourceService` : centraliser lookup PU/TVA/taxes (aujourd'hui éparpillé dans `MaterialPriceResolver` + hooks). Une seule source pour saisie & import.
C3. `AlignmentService` : persister l'historique nom extrait → `resource_id` (table `btp.boq_alignment_history`, migration incluse) pour l'auto-mapping cross-import.
C4. `DevisGenerator` : agrégation par WBS + export PDF/CSV, réutilisé par DQE, Tender et Portail.

## Batch D — Prix, taxes, contexte (P2)

D1. En saisie : PU **lecture seule** dérivé de `ResourceService` ; dérogation par ligne trace un `override_reason`.
D2. En import : détection d'écart PU extrait vs BDD > seuil (référentiel `deviation-rules`) → badge + choix conserver/aligner.
D3. TVA + frais généraux appliqués uniformément (Basic + Advanced) via `BoqCalculatorService.computeTotals`.
D4. Sélecteur projet/phase/tâche unifié en haut de chaque interface (composant existant `WbsSelector`, à hisser au niveau page).

## Batch E — Planification & écarts (P2)

E1. `PlanningVarianceView` déjà en place → alimenter depuis `VarianceService` avec `execution_lines` (flag `is_executed` sur `boq_lines`).
E2. Export PDF/CSV du devis planifié et du rapport d'écart via `DevisGenerator`.

## Batch F — Tests & garde-fous (P2)

- Scan `rg "supabase\.from\("` dans `src/components` et `src/hooks` → doit être vide (règle mémoire).
- Tests unitaires : `BoqCalculatorService`, `AdvancedMeterEngine`, `AlignmentService`, `VarianceService`.
- Test e2e minimal des 3 parcours (DQE → Tender → Portail).

## Ordre d'exécution proposé

1. **Turn 1 (parallèle)** : A1, A2, A3, A4, A5 — bugs bloquants uniquement, changements ciblés.
2. **Turn 2 (parallèle)** : B1–B4 + C1–C2 (extractions sans changement de comportement).
3. **Turn 3 (parallèle)** : C3, C4, D1–D4 (migration BDD `boq_alignment_history` + branchement).
4. **Turn 4 (parallèle)** : E1–E2, F (tests).

Aucune nouvelle page/onglet créé. Les fichiers touchés sont ceux déjà listés dans la codebase (`UnifiedSupplierPortal.tsx`, `AdvancedQuantityCalculator.tsx`, `BoqImportDialog.tsx`, `useBoqImport.ts`, `BoqLineTable.tsx`, `TenderEstimatorForm.tsx`, `ProjectDqeTab.tsx`, `QuantityTakeoffs.tsx`, référentiels existants, services `application/services/boq/*`).

## Détails techniques (non-utilisateur)

- **A1** : remplacer l'early-return guest de `UnifiedSupplierPortal` par un `unlocked` state qui rend le layout à onglets standard ; utiliser `useSearchParams` pour synchroniser `tab`.
- **A3** : vérifier que `SupabaseBoqRepository.list({source:'dqe'})` fait bien `.eq('source','dqe')` (déjà présent) et que `ProjectDqeTab` écoute `window.addEventListener('boq-imported', refetch)`.
- **C3** : migration `CREATE TABLE btp.boq_alignment_history (id uuid pk, extracted_name text, resource_id uuid, resource_type text, occurrences int, created_by uuid, created_at timestamptz)` + GRANT/RLS standard.

Confirmez pour lancer **Turn 1 (batch A)**.
