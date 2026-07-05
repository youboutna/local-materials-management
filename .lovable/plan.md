# Fix module Cartographie — Recherche d'adresse & Localisation en mode édition

## Constat

1. Dans `GeoZoneEditor.tsx` la barre annonce **« Rechercher une adresse (base + Nominatim) »** mais délègue à `LocationAutocomplete`, qui n'appelle **que** le référentiel statique Mauritanie (`LocationDataService`). Aucun appel à `GeocodingService` (Nominatim) → auto-complétion vide dès qu'on tape une rue, un quartier, une adresse hors wilayas/villes.
2. Aucun **mode édition libre** quand ni la base ni le provider ne renvoient de résultat.
3. En **mode édition d'un objet géo** (zone d'intervention, polygone, rectangle, cercle, point, matériau localisé), on ne peut pas éditer la **localisation** d'une forme déjà tracée (recentrer, renommer, corriger lat/lng, ré-adresser). La seule action disponible est la suppression.

## Architecture (respect flux hexagonal)

```text
UI (AddressSearchBox / ZoneLocationEditor)
   └─► Hook hexagonal useAddressSearch (debounce + cache + état)
          └─► GeocodingService (via GeocodingServiceFactory)  ← singleton existant
                 ├─► LocationDataService (base référentielle MR)
                 └─► Nominatim (provider externe, déjà câblé)
```

Aucun `supabase.from()` ajouté, aucun appel réseau dans l'UI. Transformers UI ↔ DTO (`InterventionZoneDTO`) inchangés — on ne fait qu'utiliser les champs existants (`label`, `address`, `coordinates`, `radiusMeters`, `regionCode`, `cityCode`, `geocodingMeta`).

## Livrables

### 1. Hook `src/hooks/hexagonal/useAddressSearch.ts` (nouveau)
- Entrée : `query: string`, `minLength = 3`, `debounceMs = 350`.
- Sortie : `{ results, isLoading, error, isEmpty }` où
  `results: AddressSuggestion[] = { id, label, subtitle, source: 'base' | 'nominatim', lat, lng, raw }`.
- Appelle `getGeocodingService().geocode(query)` (déjà fusion local + externe, provider dans `raw.provider`).
- Cache mémoire par requête (politesse Nominatim).

### 2. Composant `src/components/gis/AddressSearchBox.tsx` (nouveau)
- Remplace `LocationAutocomplete` dans la barre de recherche.
- Input contrôlé + dropdown de suggestions (Base d'abord, badge de source, Nominatim ensuite).
- États :
  - `Recherche…` pendant le fetch,
  - `Aucun résultat` + bouton **« Saisir manuellement »** quand `isEmpty` après debounce,
  - touche Entrée sans sélection → bascule aussi en saisie manuelle.
- **Saisie manuelle** : panneau compact `Libellé/adresse` + `Latitude` + `Longitude` (validation numérique et bornes MR souples), bouton « Utiliser cette position ».
- Callback unique `onSelect({ label, address, lat, lng, source, meta })`.
- Réutilisable dans GeoZoneEditor **et** dans le nouveau `ZoneLocationEditor`.

### 3. Composant `src/components/gis/ZoneLocationEditor.tsx` (nouveau)
Panneau d'édition d'une **zone existante** (multi-formes), ouvert depuis la liste des zones dans `GeoZoneEditor` via un bouton crayon par ligne.
- Champs communs à toutes les formes : `Libellé`, `Adresse` (via `AddressSearchBox`, pré-rempli avec `zone.label` / `zone.address`).
- Actions spécifiques :
  - **Point** : édition directe `lat`, `lng` (ou sélection d'adresse → écrase les coords).
  - **Cercle** : édition `lat`, `lng` du centre + `Rayon (m)` ; recalcul `areaSqm`.
  - **Rectangle** : édition des 2 coins (lat/lng) OU « Recentrer sur adresse » qui translate la bbox autour du nouveau centre en gardant la taille.
  - **Polygone** : édition du **libellé/adresse** uniquement + action « Recentrer sur adresse » (translation des sommets autour du nouveau centroïde). Édition sommet-par-sommet via drag reste hors périmètre.
- À la validation : recalcul `areaSqm`, appel `enrichWithReverseGeocode` (déjà présent) pour rafraîchir `regionCode`/`cityCode`/`geocodingMeta`, puis `emit(next)`.
- Annulation : ferme sans muter.

### 4. Intégration dans `src/components/gis/GeoZoneEditor.tsx`
- Barre du haut : remplacer `<LocationAutocomplete …/>` (≈ lignes 558-573) par `<AddressSearchBox onSelect={…} />`. Pré-remplit `flyTarget` **et** un `draftLabel` par défaut (repris de la suggestion) pour le bouton « Ajouter comme point ».
- Liste des zones existantes : ajouter un bouton crayon (`Pencil`) à côté de la corbeille → ouvre `ZoneLocationEditor` en modal/inline pour la zone ciblée. Désactivé en `readOnly`.
- Label de la barre mis à jour : « Rechercher une adresse (base Mauritanie + Nominatim) — édition libre disponible ».
- Aucune régression sur dessin, import/export GeoJSON, reverse-geocode auto, mode `readOnly`, ni sur le fallback synthétique déjà en place (`fallbackLabel`, `fallbackAddress`).

### 5. Diagnostic
- `console.info('[AddressSearch]', { query, base, nominatim })` et `console.info('[ZoneLocationEditor] edit', { idx, before, after })` pour tracer côté preview.

## Non-objectifs
- Pas de refonte de `LocationAutocomplete` (conservé pour choix strict wilaya/ville dans les formulaires projet).
- Pas de drag interactif des sommets de polygone (édition point-par-point sur la carte) — sera un lot ultérieur.
- Pas de changement DB, ni de nouveau service, ni de modif de `InterventionZoneDTO`.

## Vérification
- « Nouakchott » → suggestions base (wilaya + villes) avec badge « Base ».
- « Avenue Gamal Abdel Nasser » → suggestions Nominatim avec badge « Nominatim ».
- Chaîne inconnue → message vide + « Saisir manuellement » → lat/lng → point ajouté.
- Sur une zone existante (point / cercle / rectangle / polygone) : crayon → édition libellé + adresse + géométrie propre à la forme → sauvegarde → la carte se recentre et `regionCode`/`cityCode` sont ré-enrichis.
- Aucune régression en `readOnly` (crayon masqué, barre masquée).
