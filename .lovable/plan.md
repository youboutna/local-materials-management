## Objectifs

1. **Bug bloquant** : après validation code secret, rediriger vers `/supplier-portal` onglet « Appels d'Offres » au lieu de rendre l'UnlockedView isolé.
2. **Câblage Plan v3 (BOQ composable)** cohérent sur `/supplier-portal/*`, `/projects/create`, `/projects/{uuid}`, `/projects/{uuid}/edit`, `/materials/create`, `/materials/{uuid}`, `/materials/{uuid}/edit`.
3. **Clarification métier BOQ vs Métré vs DQE** : le métré seul n'a pas de sens — il est soit un outil d'expression de besoin/planification (côté projet), soit un outil de chiffrage (côté fournisseur). BOQ = brique commune ; DQE = livrable projet spécifique.
4. **Suppression du legacy** une fois le remplacement validé.

## 1. Fix redirect code secret (bloquant)

Fichier : `src/components/tenders/SupplierSecureAccessPortal.tsx`
- Sur `handleValidate` succès → `navigate('/supplier-portal?tab=tenders&tenderId=<id>&secret=<code>')` via `useNavigate()`.
- Conserver `SecretCodeAccessGate` pour l'écran de saisie ; supprimer l'UnlockedView inline (déplacée dans l'onglet Tenders du portail).

Fichier : `src/pages/UnifiedSupplierPortal.tsx`
- Lire `useSearchParams()` → si `tab` présent, initialiser `activeTab` avec cette valeur (au lieu de `'documents'`).
- Onglet `tenders` : rendre `<SupplierTenderInbox tenderId={...} secret={...} />` (nouveau composant léger qui reprend le contenu de l'ancien UnlockedView, mais en mode intégré au portail).
- Si le fournisseur n'est pas encore authentifié : afficher un panneau contextuel « Code validé — connectez-vous pour accéder à l'appel d'offres <ref> » qui pré-remplit l'email si dispo.

## 2. Sémantique BOQ / Métré / DQE

Réalignement (docstrings + UI wording) :

```text
BoqLine (kernel)  ← brique atomique partagée
   ├── source = quantity_takeoff → expression de besoin projet (planification)
   ├── source = tender_estimate  → estimation confidentielle (maître d'ouvrage)
   ├── source = dqe              → livrable DQE (chiffrage détaillé projet)
   └── source = supplier_bid     → offre financière fournisseur
```

- `<QuantityTakeoffs />` sera renommé côté UI en « Expression de besoin (métré prévisionnel) » quand utilisé dans un projet, et « Chiffrage BOQ » quand utilisé côté fournisseur.
- Le module « Métré » standalone est supprimé du menu principal ; l'accès passe désormais par :
  - un projet → onglet « Métré / DQE » de la phase (déjà en place via `PhaseQuantityTakeoffTab`) ;
  - une soumission fournisseur → onglet « Chiffrage » (à câbler).

## 3. Câblage pages ciblées

### `/supplier-portal`
- Nouvel onglet `tenders` (déjà présent) reçoit `<SupplierTenderInbox>` qui affiche : liste des tenders accessibles (via code ou compte), et pour chaque tender : `<BoqLineTable source="supplier_bid" contextId={tenderId} />` + `<BoqImportDialog source="supplier_bid" contextId={tenderId} />`.
- Le tab `upload` reste pour docs annexes.

### `/projects/create` (workflow) et `/projects/{uuid}/edit`
- Vérifier que l'étape « Phases » monte bien `PhaseQuantityTakeoffTab` (déjà OK).
- Ajouter dans l'étape « Budget & DQE » un `<BoqLineTable source="dqe" contextId={projectId} />` avec import BOQ pour le DQE global projet (agrégation multi-phases).

### `/projects/{uuid}` (détail)
- Onglet « DQE / Métré » : totaux (`<PriceSummary lines={...} />`) + `<BoqComparisonTable estimateLines={dqe} bidLines={bids} />` en cas de tender awarded lié.
- Cohérence design : réutiliser `Card + CardHeader + CardTitle + Badge` comme dans `PhaseQuantityTakeoffTab`.

### `/materials/*`
- Pages Materials restent des CRUD référentiels — **pas** de BOQ ici. Vérifier uniquement que le sélecteur matériau utilisé dans `<BoqLineTable>` référence bien `materials.id` via un service, pas via `supabase.from()`.

## 4. Contrôle qualité architecture

Grep de non-régression :
- `rg "supabase\\.from" src/components src/pages src/hooks` → 0 hit autorisé hors adapters/hooks hexagonaux existants.
- `rg "TenderQuantitativeEstimate" src` → doit disparaître (remplacé par `<BoqLineTable source="tender_estimate">`).
- Vérifier que chaque hook créé (`useBoqDocument`, `useBoqImport`, `useTenderToPlanning`) suit le pattern `{ data, isLoading, action*, isPending, error }` — pas de mutation brute exposée.

## 5. Suppression legacy (après validation visuelle)

À supprimer :
- `src/components/tenders/TenderQuantitativeEstimate.tsx` (si présent) → remplacé par `BoqLineTable`.
- Ancien `UnlockedView` inline dans `SupplierSecureAccessPortal.tsx` (déplacé vers portail).
- Éventuels doublons `QuantityTakeoffs*` non hexagonaux dans `src/components/project/` (à auditer avec `rg`).

Chaque suppression fera l'objet d'un contrôle build + preview avant validation finale.

## Détails techniques (pour référence)

- **Route params** : `useSearchParams()` (react-router v6) ; pas de state global pour transporter `secret`/`tenderId`.
- **Persistance code validé** : `sessionStorage['supplier-tender-secret']` (non `localStorage`) pour ne pas fuiter entre sessions.
- **Design tokens** : réutiliser `text-primary`, `bg-muted`, `Badge variant="outline"` — pas de couleur hard-codée.
- **i18n** : nouvelles clés `tenders.supplierPortal.tenderInbox.*` dans le fichier de traduction utilisé par `useLanguage`.

## Ordre d'exécution proposé

1. Fix redirect (SupplierSecureAccessPortal + UnifiedSupplierPortal tabs from URL) — livrable immédiat.
2. `<SupplierTenderInbox>` minimal + câblage tab `tenders`.
3. Wiring `/projects/{uuid}` onglet DQE.
4. Audit + suppression legacy.
5. Renommages wording BOQ/Métré/DQE.

Confirmes-tu cet ordre, ou préfères-tu que je démarre directement par (1) + (2) et qu'on itère ?
