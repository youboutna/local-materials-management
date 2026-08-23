# Audit référentiels i18n — `src/config/referentials` — Phase 6

Périmètre : les 3 niveaux de `src/config/referentials/**` (racine, sous-dossiers métier,
`i18n/status-labels.referential.ts`). Lecture seule.

## 1. Principe respecté globalement

Le référentiel central `src/config/referentials/i18n/status-labels.referential.ts` fournit une
source unique fr/ar/en (`STATUS_LABELS`, `ROLE_LABELS`, `PRIORITY_LABELS`, `CATEGORY_LABELS`,
`SEVERITY_LABELS`, `DOCUMENT_TYPE_LABELS`, `TENDER_STEP_LABELS`, `PROJECT_TYPE_LABELS`,
`UNIT_LABELS`, `INVOICE_DOCUMENT_LABELS`, `DEVIATION_LABELS`) et rappelle explicitement la règle
« la base ne stocke que des codes techniques » (lignes 8-13). C'est la bonne architecture à
généraliser. Plusieurs référentiels métier n'y adhèrent toutefois pas encore complètement.

## 2. Constats précis (file:line)

### 2.1 Doublon de nom d'export `DOCUMENT_TYPE_LABELS`
- `src/config/referentials/i18n/status-labels.referential.ts:275` exporte `DOCUMENT_TYPE_LABELS`
  (type `Record<string, ReferentialLabel>` — fr/ar/en).
- `src/config/referentials/documents/document-types.referential.ts:17` exporte **un autre**
  `DOCUMENT_TYPE_LABELS` (type `Record<DocumentTypeCode, string>` — français uniquement, pas de
  ar/en).
- Les deux constantes portent le même nom mais des formes et contenus différents (ex. code
  `inspection_report` présent dans les deux avec un libellé identique par coïncidence, mais
  `document-types.referential.ts` couvre des codes absents de `status-labels` — `plan`,
  `specification`, `certificate`, `manual`, etc. — sans traduction ar/en).
- **Risque** : imports ambigus selon le module source (`I18nService.ts` et
  `ProjectDocumentUpload.tsx:18,260` consomment la version française-only de
  `document-types.referential.ts`), ce qui veut dire que **les types de documents "métier projet"
  ne sont pas traduits en ar/en**, contrairement à la promesse du référentiel `i18n`.
- **Recommandation** : renommer l'un des deux exports (ex. `PROJECT_DOCUMENT_TYPE_LABELS` dans
  `document-types.referential.ts`) et faire passer ses libellés dans `ReferentialLabel` (fr/ar/en) en
  réutilisant `STATUS_LABELS`/`DOCUMENT_TYPE_LABELS` de `i18n/` comme source, pour éviter deux
  vérités divergentes sur le même concept.

### 2.2 Codes redondants (variantes legacy) dans `STATUS_LABELS`
- `status-labels.referential.ts:68-101` : chaque statut de projet existe en 2 à 3 variantes de code
  (`planned`/`planifie`/`planifie_v2`, `en_cours`/`encours`/`en_cours_v2`, `termine`/`termine_v2`,
  etc.). Ce n'est pas un défaut de traduction (fr/ar/en présents pour chaque variante), mais un
  **risque de dérive** : rien n'interdit qu'un nouveau code legacy soit ajouté sans les 3 langues.
  Recommandation : centraliser la génération de ces alias via une fonction
  (`withLegacyAliases(code, base)`) plutôt que la duplication manuelle actuelle, pour garantir
  qu'un alias hérite automatiquement des 3 traductions de son code canonique.

### 2.3 `src/config/referentials/inspections/inspection-statuses.referential.ts` — pas de `ar`
- Ligne 18 : `label: { fr: string; en?: string }` — **aucun champ `ar`** prévu dans le type, contrairement
  à `ReferentialLabel` (fr/ar/en) utilisé par `status-labels.referential.ts:17-22`.
- Lignes 28-33 : chaque statut ne fournit que `fr` (pas même de `en` renseigné malgré le champ
  optionnel), donc `getInspectionStatusLabel(code, 'en')` (ligne 43-46) retombera systématiquement
  sur le libellé français.
- **Recommandation** : aligner ce référentiel sur `ReferentialLabel` (fr/ar/en obligatoires) et
  déléguer les libellés à `STATUS_LABELS` de `i18n/status-labels.referential.ts` (qui contient déjà
  `pending`, `rejetee`, `modifications_requises`) plutôt que redéfinir un jeu de libellés parallèle.
  Voir aussi l'audit ENUM : les codes utilisés ici (`scheduled, in_progress, completed, failed`) ne
  correspondent pas au vocabulaire réellement stocké en base pour `inspections.status`.

### 2.4 `src/config/referentials/stakeholderRoles.ts` — labels français utilisés comme codes techniques
- Lignes 11-20 (`internalStakeholderRoles`), 25-36 (`externalStakeholderRoles`), 41-52
  (`teamPositions`) : les tableaux contiennent directement des **chaînes françaises affichables**
  (`"Responsable financier"`, `"Ingénieur conseil"`, ...) utilisées à la fois comme valeur stockée et
  comme libellé affiché.
- **Contraire au principe "code technique en base / libellé via référentiel i18n"** appliqué ailleurs
  (`STATUS_LABELS`, `ROLE_LABELS`). Ici il n'existe pas de code stable (slug) indépendant de la
  langue : si un jour ces valeurs sont persistées telles quelles, tout changement de libellé ou
  ajout d'arabe/anglais cassera les données déjà stockées et empêchera une traduction dynamique côté
  UI.
- **Recommandation** : transformer ces listes en `{ code, fr, ar, en }[]` (réutiliser le pattern
  `ReferentialLabel`) et exposer `code` comme valeur persistée ; garder les fonctions
  `getRoleOptions` mais les faire pointer vers les nouveaux `code`.

### 2.5 Vérifier absence de duplication de labels traduits dans les migrations (contrôle positif)
- Recherche effectuée sur les `CHECK`/`CREATE TYPE` (voir `docs/enum-audit.md`) : **aucun libellé
  traduit (fr/ar/en) n'est stocké en dur dans une contrainte SQL** — toutes les valeurs sont des
  codes techniques (anglais snake_case ou français court type `'en cours'`). Ce point respecte la
  règle demandée : ne pas dupliquer de libellés traduits en base. Seul le vocabulaire diverge entre
  fichiers de migration (cf. §3 de `enum-audit.md`), ce qui est un problème de cohérence de codes,
  pas de duplication de traduction.

### 2.6 Unicité des codes au sein d'un même référentiel
- `status-labels.referential.ts` : les clés de `STATUS_LABELS` sont uniques par construction
  (objet JS), aucune collision de clé détectée à la lecture. Vérification automatisée recommandée
  (script ci-dessous) à chaque PR touchant ce fichier.
- `document-types.referential.ts:17-61` : `DOCUMENT_TYPE_LABELS` (clés `DocumentTypeCode`) — unicité
  garantie par le type mais **dépend de l'exhaustivité de l'enum `DocumentType`** dans
  `src/dtos/entities/DocumentDTO.ts` ; toute désynchronisation DTO/référentiel provoquera une erreur
  TypeScript (bon signal de garde-fou existant) mais doit être surveillée si `DocumentType` est un
  `string` non strict ailleurs.

## 3. Script de contrôle (lecture seule, à exécuter en CI)

```bash
# Détecte les exports de même nom dans des fichiers différents sous src/config/referentials
grep -rhoP "export const \K[A-Z_]+(?=:)" src/config/referentials --include="*.ts" \
  | sort | uniq -d

# Vérifie que chaque entrée d'un référentiel fr/ar/en a bien les 3 champs non vides
node -e "
const fs = require('fs');
const path = require('path');
// À adapter : importer dynamiquement via ts-node ou parser AST si besoin d'un contrôle strict CI.
console.log('Contrôle manuel recommandé via test unitaire I18nService (voir tests existants).');
"
```

Des tests existent déjà en ce sens : `src/application/services/__tests__/I18nPhase6Coverage.test.ts`
et `I18nPhase61Coverage.test.ts` — recommandé de les étendre pour couvrir
`inspection-statuses.referential.ts` et `stakeholderRoles.ts` une fois migrés vers le pattern
`ReferentialLabel`.

## 4. Synthèse des actions Phase 6

| Priorité | Action | Fichier(s) |
|---|---|---|
| Haute | Renommer/fusionner le doublon `DOCUMENT_TYPE_LABELS` et ajouter ar/en | `documents/document-types.referential.ts`, `i18n/status-labels.referential.ts` |
| Haute | Aligner `inspection-statuses.referential.ts` sur le vocabulaire DB réel + ajouter `ar` | `inspections/inspection-statuses.referential.ts` |
| Moyenne | Convertir `stakeholderRoles.ts` en `{code, fr, ar, en}` | `stakeholderRoles.ts` |
| Basse | Factoriser les alias legacy de `STATUS_LABELS` pour garantir fr/ar/en systématique | `i18n/status-labels.referential.ts` |
| Basse | Ajouter `COMMENT ON TYPE/CONSTRAINT` en base pointant vers le référentiel front correspondant | migrations concernées, cf. `enum-audit.md` §6.5 |
