# BOQ Architecture — v3.1

## Vue d'ensemble

Kernel unique pour la gestion Bill Of Quantities (BOQ) partagé par 4 contextes :

| Route contextuelle    | `routeContext`       | Source BOQ            | Persistance                       |
| --------------------- | -------------------- | --------------------- | --------------------------------- |
| Projet — DQE          | `project-dqe`        | `quantity_takeoff`    | `btp.quantity_takeoffs`           |
| Tender — Estimation   | `tender-estimate`    | `tender_estimate`     | `public.tender_estimate_items`    |
| Portail — Devis       | `supplier-bid`       | `supplier_bid`        | `public.tender_estimate_items`    |
| Portail — Factures    | `supplier-invoice`   | `supplier_bid`        | `public.tender_estimate_items`    |

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

Voir migration `B1` : table unique avec `line_type` discriminant + vues de compat `v_boq_quantity_takeoffs`, `v_boq_estimates`, `v_boq_invoices`. Adoption progressive : le repository `SupabaseBoqRepository` continue à cibler les tables historiques ; le switch vers `btp.boq_lines` se fera dans un batch dédié après observation en prod.

## Hors périmètre v3.1

- Refonte visuelle finale (couleurs, typo).
- Refonte des autres onglets fournisseur (Documents, Paiements, Tâches, Inspections).
- Suppression physique des anciennes tables (migration séparée post-observation).
