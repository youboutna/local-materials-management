
# Plan v3.1 — Unification `boq_lines` + Redesign DQE & Portail Fournisseur (portée réduite)

**Changement clé depuis v3** : côté portail fournisseur, seuls les onglets **Devis** et **Factures** sont refondus autour du `DqeWorkspace`. Les autres onglets (Appels d'Offres, Documents, Télécharger, Paiements, Notifications, Tâches, Inspections) restent inchangés — juste la double barre d'onglets est supprimée.

---

## Partie A — Redesign UX

### A.1 Projet `/projects/:id` — onglet DQE

Aujourd'hui : 3 cartes empilées (DQE global · Métrés · Liste des Métrés) → dispersion.

Cible : **un seul `DqeWorkspace`** avec sous-onglets internes.

```text
┌ En-tête + KPIs (Total HT · TVA · TTC · Écart budget) ─────────┐
├ Barre d'actions unique ───────────────────────────────────────┤
│  [+ Saisie] [Importer] [CSV] [Exporter PDF] [Signer]          │
│  [Envoyer email] [Télécharger] [Diffuser]                     │
├ Sous-onglets ─────────────────────────────────────────────────┤
│  Lignes │ Métrés dimensionnels │ Comparaison besoin↔DQE │      │
│         │ (L·l·h·ouvertures)   │ Suivi budget                  │
├ BoqLineTable unifié (WBS · fiscal · pagination) ──────────────┤
└───────────────────────────────────────────────────────────────┘
```

Les 3 cartes actuelles fusionnent. Les compteurs 0/0/0.00 disparaissent quand vides ; sinon ils sont dans le header KPI.

### A.2 Tender entité `/tenders/:id`

Même `DqeWorkspace` en `context='tender'`. Sous-onglets : `Estimation · Offres reçues · Comparaison`. Boutons : `Publier`, `Exporter PDF`, `Signer`, `Envoyer aux fournisseurs`.

### A.3 Portail fournisseur `/supplier-portal` — **portée précisée**

Aujourd'hui (image-108) : **double barre d'onglets** (`Appels d'Offres / Devis / Documents / Télécharger / Paiements / Notifications / Tâches / Inspections / Factures` **puis** `Parcourir / Documents Partagés / Soumissionner / Devis`) → confusion.

Cible :
- **Une seule barre d'onglets** top-niveau (suppression du sous-niveau `Parcourir / Documents Partagés / Soumissionner / Devis`).
- Onglets **inchangés** dans leur logique : `Appels d'Offres`, `Documents`, `Télécharger`, `Paiements`, `Notifications`, `Tâches`, `Inspections`. On garde leur contenu tel quel — on retire uniquement la barre secondaire redondante.
- Onglets **refondus** avec `DqeWorkspace` : **`Devis`** et **`Factures`**.

**Onglet Devis (fournisseur)** :
```text
1. Fournisseur ouvre "Appels d'Offres" → parcourt les AO ouverts → sélectionne un AO.
2. Il clique "Créer un devis pour cet AO" → l'onglet Devis s'ouvre avec :
     • DqeWorkspace context='supplier_bid'
     • tenderId préparé, submissionId lié (ou création à la volée)
     • BoqLineTable + KPI HT/TVA/TTC
     • BoqActionsBar : [Enregistrer] [Générer PDF devis] [Signer]
                       [Télécharger] [Joindre à ma soumission]
3. "Joindre à ma soumission" ⇒ le PDF signé rejoint tender_submission_documents.
```

**Onglet Factures (fournisseur)** :
```text
1. Fournisseur importe une facture (parseur unifié) OU saisie manuelle.
2. Association obligatoire : projet ET/OU appel d'offre + soumission.
3. DqeWorkspace context='invoice' :
     • BoqLineTable (lignes de facture + fiscal)
     • BoqActionsBar : [Générer PDF facture] [Signer] [Envoyer email]
                       [Télécharger] [Soumettre pour paiement]
4. Facture rattachée alimente le suivi budget côté projet (comparaison
   ligne à ligne avec le DQE / expression de besoin).
```

Les autres onglets restent tels quels dans cette itération.

### A.4 Composants partagés

- `DqeWorkspace` (englobe `BoqWorkspace` + sous-onglets + KPI header + `BoqActionsBar`).
- `BoqActionsBar` (visibilité selon `context` + `status` + rôle).
- `BoqKpiHeader`.
- `SupplierPortalTabs` refondu : une seule barre, `Devis` et `Factures` montent `DqeWorkspace`, les autres onglets gardent leur composant actuel.

---

## Partie B — Actions document (PDF / Signer / Email / Télécharger)

Nouveau `DocumentService` unique :

```text
generatePdf(ctx)      → Blob + storageUrl (bucket `documents`)
signDocument(docId)   → e-signature existante + attache la signature
emailDocument(docId,  → edge functions existantes (`send-tender-report`,
  recipients)             `send-supplier-notification`)
downloadDocument(id)  → signed URL, force download côté UI
```

| Contexte              | PDF généré                | Destinataires email par défaut |
| --------------------- | ------------------------- | ------------------------------ |
| Projet DQE            | Expression de besoin      | Direction / bailleurs          |
| Tender entité         | Dossier consultation      | Fournisseurs invités           |
| Portail — Devis       | Devis fournisseur         | Entité (attaché à soumission)  |
| Portail — Factures    | Facture / situation       | Entité (attaché au projet/AO)  |

`document_id` stocké sur `boq_lines.document_id` → 1 PDF ↔ N lignes.

---

## Partie C — Data model unique `btp.boq_lines`

Discriminant `line_type` : `quantity_takeoff | estimate | supplier_bid | invoice | progress_invoice`.

Colonnes : dimensions (L·l·h), quantité, PU, TVA, RAS, fees, discount, `sender_id`, `recipient_id`, `document_id`, `status`, `metadata` JSONB. `total_ht/tva/ras/ttc` en colonnes générées.

Migration : reprise des données existantes de `btp.quantity_takeoffs`, `public.tender_estimate_items`, `btp.parsed_invoices`, `btp.progress_invoices`. Anciennes tables remplacées par des **vues** filtrées sur `line_type` pour compat lecture.

GRANT authenticated + service_role, RLS entité (`has_project_access`) et RLS prestataire (`sender_id = auth.uid()`).

---

## Partie D — Services

- `BoqService` : CRUD unique sur `boq_lines`.
- `BoqWorkflowService` : `generate / submit / validate / reject / invoice / pay` — transitions `status`, appelle `DocumentService`.
- `BoqContextService` : route + rôle → `{ lineType, projectId, tenderId, submissionId, senderId, allowedActions }`.
- `DocumentService` : PDF + signature + email + download.
- Suppression des shadow-writes.

---

## Partie E — Routage contextuel

| Route                          | Rôle       | lineType défaut    | Actions visibles                                        |
| ------------------------------ | ---------- | ------------------ | ------------------------------------------------------- |
| `/projects/:id` (DQE)          | staff      | `quantity_takeoff` | Saisie · Import · PDF · Email · Diffuser                |
| `/tenders/:id`                 | staff      | `estimate`         | Publier · PDF · Signer · Email fournisseurs             |
| `/supplier-portal` **Devis**   | prestataire| `supplier_bid`     | Saisie · Import · PDF · Signer · Joindre à la soumission|
| `/supplier-portal` **Factures**| prestataire| `invoice`          | Import facture · PDF · Signer · Envoyer à l'entité      |

Boutons non autorisés **masqués** (pas juste désactivés) selon `allowedActions`.

---

## Partie F — Correctifs bugs intégrés

- `null value in column "material_id"` : disparaît (colonne inexistante dans `boq_lines`, `resource_id` nullable).
- Portail : suppression de la barre d'onglets doublon.
- UUID `"temp-project"` : `DqeWorkspace` refuse `bulkCreate` sans UUID valide → brouillon (`project_id NULL`, `status='draft'`).
- Cartes « Métrés 0/0/0.00 » : disparaissent (fusionnées dans le KPI header).
- Erreur `The resource already exists` sur upload : `upsert:true` déjà en place, on ajoute génération de nom unique côté `DocumentService` pour éviter d'écraser un doc signé antérieur.

---

## Ordre d'exécution (parallélisable)

1. **B1 (bloquant)** : migration DB `boq_lines` + vues de compat + data migration.
2. **B2 (parallèle après B1)** :
   - 2a Domain/DTO/Mapper + `SupabaseBoqRepository` unique.
   - 2b `BoqService` · `BoqWorkflowService` · `BoqContextService` · `DocumentService`.
   - 2c `BoqActionsBar`, `BoqKpiHeader`.
3. **B3 (parallèle après B2)** :
   - 3a `DqeWorkspace` (projet + tender).
   - 3b `UnifiedSupplierPortal` : suppression barre doublon + refonte **Devis** et **Factures** uniquement.
4. **B4** : nettoyage shadow-writes, vues de compat, tests.

---

## Livrables

- [ ] Migration SQL `boq_lines` + data + vues compat.
- [ ] `BoqService` / `BoqWorkflowService` / `BoqContextService` / `DocumentService`.
- [ ] `DqeWorkspace` (remplace 3 cartes projet + workspace tender).
- [ ] `BoqActionsBar` (PDF · Signer · Email · Télécharger · Diffuser).
- [ ] `SupplierPortalTabs` : barre unique, `Devis`/`Factures` = `DqeWorkspace`, autres onglets inchangés.
- [ ] Flux « Créer un devis depuis un AO » (bouton dans Appels d'Offres → route interne vers onglet Devis).
- [ ] Flux « Joindre à ma soumission » (attache PDF signé à `tender_submission_documents`).
- [ ] Flux « Facture → projet/AO » (association obligatoire + alimentation suivi budget).
- [ ] Nettoyage shadow-writes, deprecation `IQuantityTakeoffRepository` / `ITenderEstimateRepository`.
- [ ] Doc `docs/BOQ_ARCHITECTURE.md` (schéma + flux + routage).

---

## Détails techniques

**Schéma clé** :
```sql
CREATE TABLE btp.boq_lines (
  id uuid PK default gen_random_uuid(),
  project_id uuid, tender_id uuid, submission_id uuid, estimate_id uuid,
  phase_id uuid, milestone_id uuid, task_id uuid,
  resource_id uuid, resource_kind text,
  line_type text NOT NULL,          -- discriminant
  source_type text,                 -- rapide|avance|import|invoice
  designation text NOT NULL,
  element_type text, btp_code text,
  unit text, length numeric, width numeric, height numeric,
  quantity numeric NOT NULL default 0,
  unit_price_ht numeric,
  total_ht numeric GENERATED ALWAYS AS (quantity * coalesce(unit_price_ht,0)) STORED,
  vat_rate numeric, ras_rate numeric,
  total_tva numeric GENERATED ..., total_ras numeric GENERATED ..., total_ttc numeric GENERATED ...,
  fees numeric default 0, discount numeric default 0,
  sender_id uuid, recipient_id uuid, document_id uuid,
  status text NOT NULL default 'draft',
  metadata jsonb default '{}',
  import_source text, note text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
CREATE INDEX ... (project_id, line_type), (tender_id, line_type), (submission_id), (status), (sender_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.boq_lines TO authenticated;
GRANT ALL ON btp.boq_lines TO service_role;
ALTER TABLE btp.boq_lines ENABLE ROW LEVEL SECURITY;
-- policies: has_project_access(project_id) OR sender_id = auth.uid()
```

**`BoqActionsBar` API** :
```tsx
<BoqActionsBar
  ctx={ctx}                    // BoqContext (route + role)
  selection={selectedLineIds}
  onGeneratePdf={...} onSign={...} onEmail={...}
  onDownload={...} onDistribute={...}
  onAttachToSubmission={...}   // visible uniquement en context=supplier_bid
  onSubmitInvoice={...}        // visible uniquement en context=invoice
/>
```

Boutons masqués via `ctx.allowedActions` — cohérent avec les policies RLS.

---

**Hors périmètre** : refonte visuelle finale (couleurs, typo) · refonte des autres onglets fournisseur · suppression physique des anciennes tables (migration séparée post-observation).
