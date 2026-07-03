
# Refonte Module Documents — GED composable

## Constat

Le dossier `src/components/documents/` mélange 13 fichiers hétéroclites (list, upload, viewer, filtres, mais aussi `EmployeeManagement`, `SuppliersManagement`, `TaskAssignments`…). Chaque module (Projet, Matériaux, Tender, Fournisseurs) réimplémente sa propre logique d'affichage/upload de docs. Résultat : incohérence visuelle, duplication, régressions à chaque évolution.

## Objectif

Un **module Documents générique, moderne, composable** — cœur commun `DocumentHub` — et des **adaptateurs par domaine** (Project, Material, Tender, Supplier, Inspection) qui déclarent leurs specificités.

## Architecture

```text
src/components/documents/
├── hub/                          ← cœur réutilisable
│   ├── DocumentHub.tsx           ← composant principal, orchestré par un contrat
│   ├── DocumentHubToolbar.tsx    ← search, tri, view toggle, actions
│   ├── DocumentHubSidebar.tsx    ← filtres dynamiques (facets)
│   ├── DocumentHubGrid.tsx       ← vue cartes
│   ├── DocumentHubTable.tsx      ← vue tableau
│   ├── DocumentHubPreview.tsx    ← drawer aperçu PDF/image/office
│   ├── DocumentHubUpload.tsx     ← dialog upload drag-drop
│   ├── DocumentHubEmpty.tsx      ← empty state
│   └── types.ts                  ← DocumentItem, DocumentSource, HubContract
├── adapters/                     ← spécialisation par domaine
│   ├── projectDocumentAdapter.ts
│   ├── materialDocumentAdapter.ts
│   ├── tenderDocumentAdapter.ts   ← fusionne tender + lots + workflow steps
│   ├── supplierDocumentAdapter.ts
│   └── inspectionDocumentAdapter.ts
└── legacy/                       ← anciens composants isolés, remplacés progressivement
```

### Contrat unique `DocumentHubContract`

Chaque domaine expose un objet qui décrit ses spécificités :

```ts
export type DocumentItem = {
  id: string;
  title: string;
  fileName: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
  category: string | null;          // clé neutre
  status: string | null;
  facets: Record<string, string | null>; // ex. { lot: "Lot 1", scope: "commun" }
  raw: unknown;
};

export type DocumentFacetDef = {
  key: string;                      // "category" | "lot" | "phase" | "status" | "mime"
  label: string;
  options: { value: string; label: string; count?: number }[];
};

export type DocumentHubContract = {
  scopeLabel: string;               // "Documents du projet X"
  useDocuments: () => { data: DocumentItem[]; isLoading: boolean; refetch: () => void };
  facets: DocumentFacetDef[];       // filtres à afficher dans la sidebar
  categoryLabels: Record<string, string>;
  canUpload: boolean;
  onUpload?: (input: UploadInput) => Promise<void>;
  onDelete?: (item: DocumentItem) => Promise<void>;
  onUpdate?: (item: DocumentItem, patch: Partial<DocumentItem>) => Promise<void>;
  extraUploadFields?: React.ReactNode; // ex. sélecteur de lot pour Tender
};
```

`DocumentHub` consomme uniquement ce contrat — il ne connaît ni Supabase ni les tables spécifiques.

### Adaptateurs

- **`projectDocumentAdapter(projectId)`** — lit `documents` filtré `project_id`, facets = catégorie/phase/statut/mime.
- **`materialDocumentAdapter(materialId)`** — lit docs matériaux (fiches techniques, certificats), facets = type/statut/mime.
- **`tenderDocumentAdapter(tenderId)`** — fusionne `tender_documents` + `tender_lot_documents` + `tender_step_documents` en une seule liste, ajoute facet **Lot** ("Communs" / "Lot 1" / "Lot 2"…) et facet **Portée** (Global / Lot / Étape). `extraUploadFields` = sélecteur Portée + Lot.
- **`supplierDocumentAdapter(supplierId)`** — docs fournisseurs (RC, agréments, assurances).
- **`inspectionDocumentAdapter(inspectionId)`** — PVs et pièces jointes d'inspection.

## Fonctionnalités du Hub (toutes gratuites pour tout domaine)

- **Toolbar** : recherche (titre/nom fichier), tri (date, nom, taille), bascule Grille/Tableau, bouton "Ajouter"
- **Sidebar de filtres** générée depuis `facets` avec compteurs live
- **Vue Grille** : carte avec icône type MIME, titre, badges (catégorie + facets clés), taille, date, actions rapides (Voir / Télécharger / ⋯)
- **Vue Tableau** : colonnes triables Nom, Catégorie, [Facets], Taille, Ajouté le, Actions
- **Panneau d'aperçu (Sheet)** : PDF inline via `<iframe>`, image via `<img>`, autres → CTA téléchargement ; métadonnées + actions (télécharger, remplacer, supprimer, changer catégorie)
- **Upload dialog** : drag-drop, aperçu fichier, catégorie + `extraUploadFields` propres au domaine
- **Empty state** unifié
- **Multi-sélection** (checkbox) pour actions groupées : téléchargement zip, suppression, changement de catégorie
- **URL state** : filtres/vue persistés en `?facet=…&view=grid`

## Design

- Design tokens sémantiques (aucun `text-white`, `bg-black`, `#hex`) — cohérent avec le reste de l'app
- Motion léger (`framer-motion`) : fade + rise sur les cartes, slide sur le drawer
- Icônes MIME dédiées (`FileText`, `FileImage`, `FileSpreadsheet`, `File`)
- Layout responsive : sidebar → drawer sur mobile
- Densité maîtrisée, respiration, hover states nets

## Migration progressive

1. **Livraison 1** (cette PR) : `hub/` + `tenderDocumentAdapter` + branchement dans l'onglet Docs du module Tender (`TenderManagement.tsx` → `<DocumentHub contract={tenderDocumentAdapter(tenderId)} />`). Vérification : les 2 documents Lot 1 / Lot 2 (`administrative`) apparaissent dans la grille, filtrables par lot + catégorie, aperçu PDF fonctionnel.
2. **Livraison 2** : `projectDocumentAdapter` + branchement dans `ProjectDetail` (onglet Documents) et `PhaseDocuments`.
3. **Livraison 3** : `materialDocumentAdapter`, `supplierDocumentAdapter`, `inspectionDocumentAdapter`, refonte de la page `/documents` en Hub agrégé (multi-scope).
4. **Livraison 4** : suppression des anciens composants (`DocumentsList`, `DocumentsListPaginated`, `DocumentUpload`, `DocumentViewer`, `TenderDocumentManager`, `TenderLotDocumentsManager`, `DocumentSection`) une fois tous les consommateurs migrés.

## Détails techniques

- Aperçu PDF : `<iframe src={fileUrl} className="h-full w-full" />` dans un `Sheet` shadcn (side="right", width ≈ 50%).
- Aperçu image : `<img src={fileUrl} />`.
- Détection MIME → catégorie de rendu via helper `getPreviewKind(mime)`.
- Formatage taille via `formatBytes`.
- Upload : réutilise `useDocumentStorage` existant pour le bucket `documents`.
- Aucune migration DB nécessaire pour la livraison 1. Les adaptateurs suivants pourront exiger des GRANT/policies additionnels — traités le moment venu.
- Tests visuels manuels : après la livraison 1, on ouvre le tender `d990d28a-…`, on vérifie que les 2 docs Lot 1/Lot 2 apparaissent, filtres et aperçu OK.

## Impact code livraison 1

- **Nouveau** : `src/components/documents/hub/*` (~8 fichiers) + `src/components/documents/adapters/tenderDocumentAdapter.ts`
- **Modifié** : `src/pages/TenderManagement.tsx` — remplace `<TenderDocumentManager />` par `<DocumentHub contract={tenderDocumentAdapter(...)} />` dans l'onglet Docs
- **Conservé** intact : tout le reste (les livraisons suivantes migreront les autres modules)

## Livraison

Je livre la **Livraison 1** en une PR. Les livraisons 2-4 seront enchaînées après validation UX de la 1.
