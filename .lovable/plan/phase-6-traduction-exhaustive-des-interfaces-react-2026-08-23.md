# Phase 6 — Traduction exhaustive des interfaces React

## Objectif
Éliminer les textes d’interface codés en dur de tous les composants React sous `src/components/**` et `src/pages/**`, sans traduire les données métier libres provenant de la base.

## Exécution
1. **Inventaire exhaustif**
   - Scanner les 547 fichiers `.tsx` et établir une liste vérifiable des textes JSX, placeholders, titres, libellés d’accessibilité, confirmations et notifications.
   - Exclure les faux positifs : noms de classes, routes, codes techniques, messages console, contenu dynamique DB et textes des documents PDF réglementaires lorsqu’ils ne relèvent pas de l’interface.

2. **Migration UI par lots parallèles**
   - Migrer `src/pages/**` et chaque domaine de `src/components/**` vers `useI18n()`.
   - Remplacer chaque libellé visible par `t('…')` et chaque code métier affiché par le traducteur spécialisé (`translateStatus`, `translatePriority`, `translateType`, etc.).
   - Conserver tels quels les noms, titres, descriptions et autres données libres issues de la base.
   - Corriger en priorité les écrans projet/WBS visibles, puis traiter tous les autres domaines sans arrêt intermédiaire.

3. **Catalogue trilingue**
   - Compléter `LanguageContext.tsx` en français, arabe et anglais avec des clés structurées par domaine.
   - Garantir le fallback français, l’interpolation et le RTL arabe.
   - Employer les référentiels multilingues pour les codes techniques et éviter les doublons de concepts.

4. **Référentiels et ENUM**
   - Auditer les référentiels à tous les niveaux pour vérifier l’unicité des codes et la présence de `fr/ar/en`.
   - Interroger le schéma PostgreSQL réel pour recenser les ENUM et colonnes de codes.
   - Respecter la doctrine verrouillée : la base conserve les codes techniques ; aucune duplication de libellés traduits en base.
   - Livrer `docs/referentials-audit.md` et `docs/enum-audit.md`.

5. **Validation visible**
   - Vérifier l’absence de clés techniques et de textes UI codés en dur sur les routes accessibles.
   - Capturer projets, détail phase et tableau de bord en fr/ar/en dans `docs/captures-phase6/`.
   - Produire `lang_switch.gif` montrant le changement dynamique et le RTL.
   - Vérifier le build et les erreurs runtime ; aucun nouveau test unitaire i18n ne sera ajouté.

## Critères de fin
- Tous les fichiers `.tsx` du périmètre ont été audités et toutes les chaînes UI confirmées utilisent `useI18n` ou un traducteur référentiel.
- « WBS » est affiché comme « Structure de découpage des travaux » en français.
- Les trois langues sont visuellement vérifiées sur les écrans demandés.
- Les deux audits et toutes les captures demandées sont présents.
- Build sans erreur et aucune régression runtime visible.
