# BOQ Architecture — v3.3

## Vue d'ensemble

Kernel unique pour la gestion Bill Of Quantities (BOQ) partagé par 4 contextes :

| Route contextuelle    | `routeContext`       | Source BOQ            | Persistance                       |
| --------------------- | -------------------- | --------------------- | --------------------------------- |
| Projet — DQE          | `project-dqe`        | `dqe`                | `btp.boq_lines`                   |
| Projet — Métré        | projet               | `quantity_takeoff`   | `btp.boq_lines`                   |
| Tender — Estimation   | `tender-estimate`    | `tender_estimate`     | `btp.boq_lines`                   |
| Portail — Devis       | `supplier-bid`       | `supplier_bid`        | `btp.boq_lines`                   |
| Portail — Factures    | `supplier-invoice`   | `supplier_bid`        | `btp.boq_lines`                   |

## Composants clés

- `DqeWorkspace` (composant façade) — assemble :
  - `BoqKpiHeader` (Total HT · TVA · TTC · nb lignes)
  - `BoqActionsBar` (PDF · Signer · Email · Télécharger · Diffuser · Joindre · Soumettre · Publier)
  - `BoqWorkspace` (saisie + import + fiscal + WBS)
  - Sous-onglets optionnels (Lignes / Comparaison besoin↔DQE / Suivi budget) — projet uniquement.

- `BoqContextService` — pure TS. Route + rôle → `{ source, allowedActions, ... }`.
- `DocumentService` — génération / téléchargement / email / signature.
- `BoqWorkflowService` — transitions de statut (`draft → submitted → validated → signed → invoiced → paid`).

## Flux — Portail Fournisseur

### Devis (`supplier-bid`)
1. Fournisseur ouvre onglet « Appels d'Offres » → sélectionne un AO.
2. Bouton « Créer un devis » ⇒ onglet Devis (context=`supplier-bid`).
3. Boutons visibles : Générer PDF, Signer, Télécharger, **Joindre à ma soumission**.

### Factures (`supplier-invoice`)
1. Fournisseur importe une facture (parseur unifié) ou saisie manuelle.
2. Association projet/AO obligatoire.
3. Boutons : Générer PDF, Signer, Email, Télécharger, **Soumettre pour paiement**.

## Actions autorisées (matrice)

Voir `BoqContextService.MATRIX`. Les boutons non autorisés sont **masqués** (pas juste désactivés), cohérent avec les policies RLS.

## Migration `btp.boq_lines`

Le repository `SupabaseBoqRepository` cible `btp.boq_lines`, avec `line_type` discriminant. `BoqDocumentService` constitue la frontière applicative des actions CRUD du workspace et de l'envoi du calculateur. Les droits serveur restent autoritaires.

## Pipeline de métré et plans contrôlés

- PDF/Excel/CSV/JSON : `UnifiedBoqParser.parseAndMeter()` ou `parse()` puis `toMeterInputs()` pour permettre le mapping contrôlé → `MeterService.enrich()`.
- Calculateur : `UnifiedBoqParser.fromCalculator()` ; la migration complète des calculs legacy reste ouverte, ne pas annoncer leur suppression.
- Plans PDF : port `ITechnicalPlanReader`, adapter PDF.js/OCR → `TechnicalPlanService` → dimensions complètes explicitement confirmées → `MeterService` → brouillon du workspace existant. Aucun enregistrement automatique des lignes.
- La GED est réutilisée via `DocumentService` pour les plans et les fichiers source DQE ; pas de table ou de bucket parallèle. Cache d'extraction par SHA-256 en mémoire, recherche du document déjà archivé par métadonnées.
- La quantité source explicite est conservée. Brut, ouvertures, net, formule et estimations de matériaux sont des métadonnées dérivées par le service commun. Les coefficients sont injectables via le référentiel de métré, et ne constituent pas une norme universelle.
- `BoqConsistencyService` contrôle quantité × prix + frais contre le total source, conserve le prix original après réconciliation et bloque la demande de validation en présence de corrections non revues. La revue est invalidée si les valeurs changent.
- Une échelle ou un repère OCR ne prouve ni la dimension ni le nombre d'ouvrages. Les unités ambiguës restent non interprétées ; les repères P sont des poteaux, Lg/Lng des poutres/longrines, S des semelles.

### Limites de recette au 2026-10-31

Le vrai plan STR a été lu par l'adapter dans Chromium : 8 pages, 4 pages texte, 4 pages OCR, 41 repères indicatifs, aucun confirmé. Les quatre lignes P1–P4 et les quatre salles prévues dans le brief ne sont pas des mesures automatiquement démontrées. Calibration graphique, IFC, extraction de ferraillage, indexation persistante inter-session et recette GED connectée restent ouvertes.

## Hors périmètre v3.1

- Refonte visuelle finale (couleurs, typo).
- Refonte des autres onglets fournisseur (Documents, Paiements, Tâches, Inspections).
- Suppression physique des anciennes tables (migration séparée post-observation).
