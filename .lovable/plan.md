## Objectif

1. Mettre à jour `docs/*.md` pour intégrer la consigne HadraTech-GPI (vision, modules, personnalisation par référentiels, stack, personas).
2. Finaliser les CRUD et vues sur les pages **Projects**, **PhaseDetail**, **ProjectPhasesDetail**, **MilestoneDetail** et leurs sous-objets, en respectant le design system, l'accessibilité et la navigabilité.

Aucune nouvelle table DB. Aucune migration. Le travail reste UI + hooks existants + DTO existants.

---

## Partie A — Documentation (`docs/*.md`)

### A.1 `docs/CONTEXT.md` (réécriture ciblée)
- Ajouter en tête : positionnement HadraTech-GPI = plateforme GPI visuelle, collaborative et modulaire (type Monday.com), personnalisable par référentiels.
- Section **Modules métier** : Projet & ressources, Gestion de projet (Gantt/PERT/Waterfall/Kanban/Géo), Matériaux, Géolocalisation, Utilisateurs (Admin/Directeur/Manager/Lecteur/Fournisseur), Documentaire, Financier (paiements, garanties, assurances), Portail Fournisseur, i18n AR/FR/EN.
- Conserver les **Personas** existants (Directeur / Chef de projet / Contrôleur) et leurs KPI.

### A.2 `docs/ARCHITECTURE_REFERENTIELS.md` (extension)
- Ajouter le catalogue d'exemples concrets de référentiels et formats supportés :
  - Politique publique / Stratégie nationale (JSON, Excel, API)
  - Budget programme / LFI (CSV, Excel, API) → blocage si dépassement
  - ODD / normes internationales (JSON, CSV)
  - Référentiel projets (XML MS Project, Excel)
  - SIG QField (.qgs, .qml, GeoJSON)
  - Normes techniques (JSON, XML)
  - Structure organisationnelle (CSV, Excel)
- Mécanismes à exposer : import / édition / **versioning** / publication ; moteur de validation temps réel ; rapports de conformité.

### A.3 `docs/ARCHITECTURE.md` (mise à jour stack & intégrations)
- Confirmer la **stack** : React + TS + Vite, Tailwind + shadcn-ui + Framer Motion, React Query + RHF + Zod, Leaflet + Google Maps, Supabase (PostgreSQL + Auth + Storage), Keycloak/SAML optionnel.
- Ajouter section **Intégrations externes** : ERP (SAGE), SIG (WMS/WMTS, ArcGIS, GeoServer), SCADA (OPC UA), LDAP/AD.

### A.4 `docs/task-plan.md` (ajout d'une section finale)
- Nouvelle section « **Finalisation CRUD & Vues — Projets / Phases / Jalons** » listant les items de la Partie B comme checklist trackable.

### A.5 `docs/PROMPTS.md`
- Ajouter en annexe le prompt « 🚀 Développer HadraTech-GPI » fourni par l'utilisateur, comme prompt de référence projet.

---

## Partie B — CRUD & Vues

### B.1 `src/pages/Projects.tsx`
- Vérifier présence d'actions CRUD complètes : créer (déjà via `/projects/create`), éditer, supprimer (avec `AlertDialog` shadcn), dupliquer.
- Ajouter **toolbar accessible** : recherche, filtres statut/phase, bouton "Nouveau projet" avec `aria-label`.
- Garantir un seul `<main>` (via `AppLayout`) et hiérarchie H1 unique.

### B.2 `src/pages/ProjectDetail.tsx` / `ProjectDetailByDTO.tsx`
- Conserver les onglets existants (déjà incluant « Suivi & Évaluation »).
- Ajouter actions rapides accessibles : Éditer, Supprimer (confirmation), Exporter rapport.
- Corriger mapping résiduel (DTO camelCase uniquement côté UI ; voir mémoire projet).

### B.3 `src/pages/PhaseDetail.tsx`
- Déjà solide. Ajouter :
  - Boutons CRUD phase : Éditer (modal/route), Supprimer (confirmation), Marquer terminée.
  - Boutons CRUD sous-objets exposés dans chaque onglet (tâches, jalons, matériaux, documents, paiements, inspections) — vérifier que chaque composant `Phase*` expose bien Create/Update/Delete.
  - `aria-label` sur tous les boutons-icônes, focus visible, navigation clavier dans les `Tabs` (déjà OK via Radix).

### B.4 `src/pages/ProjectPhasesDetail.tsx`
- Retirer `@ts-nocheck` ; typer `phases`, `project` correctement via DTO.
- Le `<Select>` de phase doit être labellisé (`<label htmlFor>` + `id` cohérents).
- Ajouter actions CRUD phase au-dessus des onglets (Ajouter phase, Renommer, Supprimer).
- Vérifier l'onglet « Suivi & Éval. » (déjà en place).

### B.5 `src/pages/MilestoneDetail.tsx`
- Compléter CRUD : Éditer jalon (modal RHF + Zod), Supprimer (confirmation), Re-planifier (date cible).
- Bouton « Marquer terminé / Rouvrir » déjà présent — ajouter état désactivé pendant mutation et `aria-busy`.
- Lier vers la phase et le projet (déjà fait) + breadcrumb.

### B.6 Composants partagés (vérifications légères)
- `PhaseTasks`, `PhaseMilestones`, `PhaseMaterials`, `PhaseDocuments`, `PhasePayments`, `PhaseInspections`, `PhaseEmployees` :
  - confirmer Create / Update / Delete branchés sur les hooks hexagonaux existants (`useTasksHex`, `useMilestonesHex`, etc.) ; sinon brancher.
  - boutons-icônes : `aria-label`, tap target ≥ 44×44 (`min-h-11 min-w-11`) sur mobile.

### B.7 Design & accessibilité (transverse)
- Aucun couleur ad-hoc : utiliser tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, etc.).
- Un seul `<main>` par route (déjà géré par `AppLayout`).
- `lang="fr"` sur `<html>` à confirmer dans `index.html`.
- Vérifier focus-visible sur tous les triggers d'onglets et boutons.
- Skeletons existants pour les états de chargement ; ajouter `role="status"` + texte SR-only « Chargement ».

---

## Détails techniques

- **Aucune** modification de schéma Supabase, des services `src/application/services/*`, ni des adapters.
- Les nouveaux modals d'édition (phase, jalon) utilisent **RHF + Zod** et `Dialog` shadcn.
- Les suppressions utilisent `AlertDialog` shadcn avec un bouton de confirmation destructif.
- Les hooks utilisés restent les hooks hexagonaux existants (`useMilestonesHex`, `usePhaseDetails`, `useProjects`, etc.). Si un hook n'expose pas `delete`/`update`, on l'étend localement en passant par le service existant (pas de nouveau repo).
- Respect strict des mémoires projet : pas de Supabase direct dans la UI, pas de React dans les services.

---

## Livrables

```text
docs/CONTEXT.md                   (mise à jour)
docs/ARCHITECTURE.md              (mise à jour stack + intégrations)
docs/ARCHITECTURE_REFERENTIELS.md (extension catalogue référentiels)
docs/PROMPTS.md                   (annexe prompt HadraTech-GPI)
docs/task-plan.md                 (checklist finalisation)
src/pages/Projects.tsx            (toolbar + CRUD complet)
src/pages/ProjectDetail*          (actions rapides + a11y)
src/pages/PhaseDetail.tsx         (CRUD phase + a11y)
src/pages/ProjectPhasesDetail.tsx (typage + CRUD + label select)
src/pages/MilestoneDetail.tsx     (modal édition + suppression)
src/components/project/Phase*.tsx (vérif CRUD sous-objets + a11y)
```

Ordre d'exécution : **docs d'abord** (A.1 → A.5), **puis** code (B.1 → B.7).