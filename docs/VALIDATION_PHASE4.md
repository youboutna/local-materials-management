# Validation Phase 4 — Module DQE / Factur-X / Appels d’offres

Date : 24/08/2026 — Périmètre : `src/application/services/invoice/**`, référentiels `src/config/referentials/invoices/**`, `btp.boq_lines`.

## 1. Réponses aux points de clarification

| N° | Élément | Réponse |
|----|---------|---------|
| 1 | Couverture des tests | Oui. Les 18 cas T‑V‑01 → T‑V‑18 sont répartis en 6 groupes couvrant les 3 scénarios : gestionnaire (A, B), Factur-X/PDF (C), dispatch (D), fournisseur (E), appels d’offres + verrous + alertes (F). Tous s’appuient sur le jeu réel « Boucle 33 kV » (14 lignes, TVA 16 %). |
| 2 | Verrou budgétaire | Oui, testé sur données chiffrées (T‑V‑16 : plafond AE insuffisante → refus, `assert()` lève, **aucune écriture** vers le repository mocké ; T‑V‑17 : décompte dans l’enveloppe → verdict OK et persistance). La garantie est vérifiée par l’absence d’appel `save/upsert` sur le repository. |
| 3 | DeviationEngine | Oui : écarts de coût et d’avancement (financier facturé vs planifié) via `InvoiceDeviationService` + moteur générique (T‑V‑18 et 5 tests dédiés dans `InvoiceBudgetDeviation.test.ts`). Les indicateurs SPI/CPI restent produits par `EvmService` (couvert hors module). |
| 4 | PDF contextualisé | Les 5 contextes (DQE, Devis, Contrat, Décompte, Facture) sont pilotés par le même référentiel que le XML ; validation automatisée des libellés, mentions Factur-X et pourcentage facturé. Rendu visuel à confirmer en UAT (26/08). |
| 5 | XML Factur-X | XML CII EN 16931 profil BASIC. Contrôles internes automatisés (TypeCode 310/380, devise, parties, totaux, TVA ligne). **Validation externe non encore exécutée** : échantillons générés pour dépôt sur le validateur FNFE/ZUGFeRD (voir §3). |
| 6 | Déploiement | Oui. Migrations idempotentes, script de vérification fourni (§4). |

## 2. Cas de test exécutés (55 tests, 4 fichiers)

### `InvoicePhase4Validation.test.ts` — 18 cas
| Cas | Groupe | Objet |
|-----|--------|-------|
| T‑V‑01 | A — gestionnaire | Import/validation du jeu Boucle 33 kV (14 lignes, TVA 16 %) |
| T‑V‑01b | A | Auto-correction P.U. : Quantité × P.U. = Montant |
| T‑V‑02 | A | DQE → Devis : clonage lignes, brouillon, TypeCode 310 |
| T‑V‑03 | A | Devis → Contrat : statut `signe`, montant conservé |
| T‑V‑04 | B — décompte/facture | Contrat → Décompte 30 % : proratisation fidèle |
| T‑V‑04b | B | Pourcentage invalide → repli 100 %, bornage |
| T‑V‑05 | B | Décompte → Facture : TypeCode 380, étape terminale |
| T‑V‑06 | C — Factur-X | XML CII : TypeCode, devise, parties, totaux |
| T‑V‑06b | C | Décompte : TypeCode 310 + mention d’avancement |
| T‑V‑07 | C | Totaux HT / TVA / TTC conformes au profil fiscal |
| T‑V‑08 | D — dispatch | Attributs de dispatch portés par les lignes émises |
| T‑V‑09 | D | Barre d’actions déduite du référentiel |
| T‑V‑10 | E — fournisseur | Le fournisseur ne peut pas produire de DQE |
| T‑V‑11 | E | Devis fournisseur tracé à son nom |
| T‑V‑12 | E | Fournisseur : décompte et facture autorisés |
| T‑V‑13 | E | Statuts fournisseur bornés par le référentiel |
| T‑V‑14 | F — appels d’offres | Estimation AO → devis sur son contexte |
| T‑V‑15 | F | Devis possible hors plafond (étape non engageante) |
| T‑V‑16 | F | **Verrou budgétaire** : décompte hors plafond bloqué, aucune persistance |
| T‑V‑17 | F | Décompte dans l’enveloppe accepté + verdict |
| T‑V‑18 | F | Alertes d’écart via DeviationEngine |

### Fichiers complémentaires
- `InvoiceWorkflowConformance.test.ts` (21) — cohérence des statuts, TypeCodes, auto-correction, jeu Boucle 33 kV, filiation documentaire.
- `InvoiceBudgetDeviation.test.ts` (13) — plafonds, tolérance, zone haute ≥ 90 %, montant contractuel prioritaire, écarts coût/avancement.
- `InvoiceWorkflowService.test.ts` (7) — cycle complet, proratisation, TypeCode, XML CII, `reconcileLinePrice`.

## 3. Logs et artefacts

```bash
# Suite du module (55 tests)
bunx vitest run src/application/services/invoice --reporter=verbose > logs/tests-invoice.log 2>&1

# Non-régression complète (219 tests)
bunx vitest run --reporter=verbose > logs/tests-full.log 2>&1

# Échantillons XML Factur-X pour validation externe (5 fichiers + rapport JSON)
bun run scripts/export-facturx-samples.ts ./artifacts/facturx-samples
```

Les XML produits (`facturx-dqe|devis|contrat|decompte|facture.xml`) sont à déposer sur
`https://validator.fnfe-mpe.org` (ou le validateur ZUGFeRD) — profil attendu : **EN 16931 / BASIC**.
Totaux de contrôle du jeu Boucle 33 kV : HT 88 352 000 · TVA 14 136 320 · TTC 102 488 320 · Net 99 837 760 (MRU).
Décompte 30 % : HT 26 505 600 · TTC 30 746 496.

## 4. Déploiement

Voir `docs/DEPLOYMENT_PHASE4.md` et `scripts/deploy-phase4.sh` (migrations, variables d’environnement, vérifications post-déploiement).

---

## Phase 5 — Multilingue et labellisation des statuts (T17 → T25)

| Tâche | Livrable |
|-------|----------|
| T17 | `src/config/referentials/i18n/status-labels.referential.ts` — `STATUS_LABELS` (générique, projet, DQE→Facture, AO, inspections) |
| T18 | Dictionnaires `PROJECT_TYPE_LABELS`, `UNIT_LABELS`, `TENDER_STEP_LABELS`, `ROLE_LABELS`, `DEVIATION_LABELS`, `CATEGORY_LABELS`, `INVOICE_DOCUMENT_LABELS` + `REFERENTIAL_LABEL_REGISTRY` |
| T19 | `src/application/services/I18nService.ts` (TS pur, fallback fr, persistance `preferred-language`, direction RTL) |
| T20 | `src/hooks/useI18n.ts` + `StatusBadge` traduit via référentiel |
| T21 | `src/components/LanguageSelector.tsx` intégré dans Paramètres → Apparence |
| T22/T23 | Statuts DQE→Facture et étapes AO couverts par le référentiel (fr/ar/en) |
| T24 | `src/application/services/__tests__/I18nService.test.ts` — T‑V‑19 → T‑V‑25 (8 tests verts) |
| T25 | Présente section |

Règles respectées : codes techniques seuls dans le Domain, aucun libellé codé en dur
dans l'UI, français langue par défaut et fallback, `dir=rtl` automatique en arabe.
