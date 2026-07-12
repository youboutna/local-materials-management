
# Plan d'exécution — Intégration DQE / Calculateur / Contexte

Livraison en 4 lots parallélisables. Aucune nouvelle vue : tout se greffe sur `AdvancedQuantityCalculator`, `BoqImportDialog`, `ProjectDqeTab` et l'onglet Planification existant.

## Lot A — Moteur unifié & ouvertures (Phase 1 + 3)

**Domaine** — enrichir `MeterInputDTO` :
```ts
openings?: Array<{ width: number; height: number }>; // en mètres
deductOpenings?: boolean;                            // défaut selon elementType
```

**Référentiel** — ajouter `deductOpenings` dans `element-types.referential.ts` (mur=true, cloison=true, dalle=false, poutre=false…).

**Service** — créer `AdvancedMeterEngine.compute(dto)` (dans `src/application/services/boq/`) qui :
- convertit unités (déjà via `normalizeUnit`),
- calcule surface brute L×H,
- soustrait Σ(ouvertures) si `deductOpenings`,
- applique formules du référentiel (ferraillage, coffrage, béton) via `formulas.referential.ts`.

**UI** — `AdvancedQuantityCalculator` :
- sous-composant `OpeningsInput` (liste éditable, unités cm/mm/m avec conversion auto),
- affichage récap : surface brute → ouvertures → surface nette,
- même moteur consommé par le flux « importer ».

## Lot B — Libellés & colonnes (Phase 2)

- `« calcul basic »` → `« Saisie rapide »`
- `« calcul avancé »` → `« Détail estimatif »`
- Colonnes tableau résultats : `Ressource | Unité | Qté théorique | Coeff | Qté totale | PU HT | Total HT`
- Renommer `CALCULS` → `Détail des ressources` dans `AdvancedQuantityCalculator`.

## Lot C — Pagination réelle (Phase 4)

Remplacer la navigation ligne-par-ligne « Précédent/Suivant » (qui pilote `currentLineIndex` d'un assistant fictif) par une vraie pagination du tableau :
- `pageSize` configurable (10 par défaut),
- boutons ← / → naviguent entre pages,
- compteur `Page X / N — Ligne A à B sur T`,
- input « aller à la page ».

Retirer `currentLineIndex` / auto-fill formulaire depuis import (déjà signalé comme confusant par l'utilisateur).

## Lot D — Contexte projet/phase/tâche & mapping (Phases 5–7)

**Header contextuel** dans `AdvancedQuantityCalculator` et `BoqImportDialog` :
- Sélecteurs Projet (readonly si `/projects/{uuid}`) / Phase / Tâche, alimentés par `getReferentialOptions(referentialCode)`.
- Persistance sur `MeterInputDTO.phaseId / taskId / contextId`.

**Mapping matériaux** :
- Manuel : sélecteur `MaterialPicker` (existant) — PU/TVA auto-remplis.
- Import : `MaterialPriceResolver` déjà en place, on ajoute fallback « ressource temporaire » avec badge ⚠ dans le tableau.
- Filtrage ressources par phase (Gros œuvre → béton/acier ; Second œuvre → cloisons/revêtements) via `resource-phase-affinity.referential.ts` (nouveau, mais fichier de config, pas de vue).

**Planification** :
- L'onglet Planification (`PlanningVarianceView` existant) reçoit `phaseId` et `taskId` et regroupe déjà par phase — on ajoute regroupement par tâche + sous-totaux HT/TTC.

## Lot E — Tests (Phase 8)

Vitest :
- `AdvancedMeterEngine.spec.ts` — surface brute/nette, conversions cm/mm/m, deductOpenings on/off.
- `UnifiedBoqParser.spec.ts` — extraction ouvertures depuis PDF SOMELEC & Excel HADRATECH.
- `pagination.spec.tsx` — tableau paginé, navigation, compteur.

## Fichiers touchés (aucun nouveau composant visuel)

- `src/dtos/boq/MeterInputDTO.ts` — champ `openings`, `deductOpenings`.
- `src/config/referentials/boq/element-types.referential.ts` — flag `deductOpenings`.
- `src/config/referentials/boq/resource-phase-affinity.referential.ts` — nouveau (config).
- `src/application/services/boq/AdvancedMeterEngine.ts` — nouveau service (pas d'UI).
- `src/application/services/boq/parsers/PdfBoqParser.ts` + `SpreadsheetBoqParser.ts` — détection `0.90×2.10` → `openings[]`.
- `src/application/services/boq/BoqImportOrchestrator.ts` — propage `openings` dans DTO.
- `src/components/project/AdvancedQuantityCalculator.tsx` — refonte pagination + ouvertures + libellés.
- `src/components/boq/BoqLineTable.tsx` — colonnes renommées.
- `src/components/boq/BoqImportDialog.tsx` — header contextuel Phase/Tâche.
- Tests dans `src/**/__tests__/`.

## Exécution

Lots A, B, C, D en batch parallèle (indépendants sur fichiers distincts). Lot E après. Aucun `supabase.from()` en UI ; tout passe par `boqRepository` et hooks hexagonaux existants.

Confirmez « go » et je lance A/B/C/D en parallèle.
