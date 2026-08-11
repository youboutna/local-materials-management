# 📋 task-plan.md  
## Plan de Migration et d'Implémentation  
### Système de Gestion Intégrée des Projets d'Infrastructure  

**Projet** : HadraTech-GPI (Infrastructure Réseau, bâtiment, géolocalisé)  
**Architecture** : Hexagonale (Ports & Adapters) + Référentiel Métier  
**OBJECTIF FINAL** : achever la migration hexagonale, sécuriser le typage et valider les parcours CRUD de production.
**Rôle AGENT AI** : Architecte AI (explorer → analyser → concevoir)  

---
ne pas changer le fichier .env
en phase de migration :

```
each field in DB/form input must ensure proper management through Model → DTO → Service → Adapter/API flow.

UI Component → Transformer → DTO (camelCase) → Service → Domain ← Adapter(snake_case) → DB
     ↑                                                                  ↓
     └──────────────────────── Transformer ←────────────────────────────┘
```
## Bonnes Pratiques d'Architecture Hexagonale ##

###📋 Rôles de Chaque Couche## 
1. domain entities (domain/*)
Rôle : Entités métier
Responsabilité : Définir la structure des données métier
Usage : Utilisés par les services et les adapters, mapping avec DB voir /integrations/supabase/types.ts
2. DTOs (/dtos/entities/, /dtos/workflows/)
Rôle : Types de transfert de données entre couches
Responsabilité : Définir la structure des données échangées
Usage : Utilisés par les transformers et services
3. Transformers (/dtos/transforms/)
Rôle : Conversion entre entités domaine et DTOs
Responsabilité : Mapper les données entre couches
Usage : Utilisés par les services pour les conversions
4. Services et Référentiels (/application/services/,config/referentials/)
Rôle : Logique métier et accès aux données référentielles
Responsabilité : Fournir les données métier centralisées
Usage : Utilisés par les composants UI
5. UI Components (/components/)
Rôle : Présentation et interaction utilisateur
Responsabilité : Utiliser les types existants, pas en redéfinir
Usage : Importer depuis DTOs et services
6. Adapters (/infrastructure/supabase/adapters/)
Rôle : Implémentations techniques
Responsabilité : Implémenter les ports
Usage : Utilisés par les services
7. Hooks (/hooks/hexagonal/)
Rôle : Logique métier et accès aux données référentielles
Responsabilité : Fournir les données métier centralisées
Usage : Utilisés par les composants UI
8. Repository (/domain/repositories/)
Rôle : Interface pour accéder aux données
Responsabilité : Définir les contrats pour les données
Usage : Utilisés par les services

## 📊 ÉTAT ACTUEL DE LA MIGRATION — 31/07/2026

### Constats vérifiés

- [x] Les services, repositories, DTOs, hooks et adapters d’organisation sont présents dans le dépôt.
- [x] Une migration Supabase locale couvre le lien organisationnel utilisé par l’import projet.
- [x] Le référentiel des marchés publics mauritaniens et les référentiels associés sont centralisés dans `src/config/referentials/`.
- [x] Les pages Projets, Détails projet, Phases et Jalons disposent déjà d’une base CRUD et de vues de suivi.
- [ ] Le nombre d’accès Supabase directs, les erreurs TypeScript et les types `any` restants doivent être mesurés avant de déclarer la migration terminée.
- [ ] Les parcours CRUD doivent être couverts par des tests de services, d’adapters et de composants.

### Décision de pilotage

La migration reste **en cours**. Les changements locaux ne sont considérés comme terminés qu’après validation du build, du lint, des tests, de la migration DB et des parcours CRUD concernés. Toute nouvelle fonctionnalité hors de ce périmètre est gelée jusqu’à la clôture.

### Indicateurs de sortie

| Indicateur | Cible | Preuve attendue |
|---|---:|---|
| Build TypeScript/Vite | 0 erreur | `npm run build` |
| Lint | 0 erreur bloquante | `npm run lint` |
| Tests | 100 % des tests passants | `npm run test` ou commande Vitest équivalente |
| Supabase direct dans composants/hooks | 0 accès métier | recherche `grep -RIn 'supabase\\.' src/components src/hooks` |
| DTOs exposés à l’UI | camelCase uniquement | revue des DTOs et transformers |
| Domaine | 0 import technique | revue `src/domain/` |
| CRUD prioritaire | lecture, création, modification, suppression | tests + vérification manuelle |

## 🎯 Objectif

Mettre en œuvre, migrer ou refactoriser le système en respectant **strictement** :
- l’architecture hexagonale
- la séparation UI / Application / Domain / Infrastructure
- le référentiel métier 
- le typage fort et centralisé
- l’absence totale de dépendances techniques dans le domaine.

**RÈGLES À ÉTABLIR** :

1. BASE DE DONNÉES (PostgreSQL) : snake_case OBLIGATOIRE
   - colonnes : project_name, created_at, kpi_score
   - tables : project_details, material_sources

2. DTOs (src/dtos/entities/* et src/dtos/workflows/*) : camelCase OBLIGATOIRE
   - projectName, createdAt, kpiScore
   - Les DTOs représentent les données pour l'application

3. TRANSFORMERS (src/dtos/transforms/*) : 
   - DOIVENT convertir snake_case ↔ camelCase
   - Une méthode toModel() et fromModel()

4. MODÈLES DOMAINE (src/domain/*) : camelCase
   - Entities et Value Objects en camelCase

5. SERVICES (src/application/*) : camelCase uniquement
   - Ne jamais voir de snake_case dans les services

6. UI Components (React)
        ↓ (utilise)
      HOOKS ←─────── Adaptateurs UI
        ↓ (appelle)
      PORTS (Interfaces)
        ↓ (implémente)
    SERVICES (Logique Métier)
        ↓ (utilise)
    DOMAINE (Entités)

7. POUR LES SERVICES (src/application/*) :

    1. VÉRIFIER qu'aucun attribut snake_case n'est utilisé
    2. CORRIGER les imports/types qui référencent directement la DB
    3. UTILISER uniquement les DTOs camelCase

    POUR LES HOOKS :
    1. Les hooks exposent uniquement du camelCase aux composants
    2. La conversion se fait dans le hook via les transformers

    EXEMPLE DE CORRECTION :
    // AVANT (mauvais - mélange des conventions) :
    const project = {
    project_name: "Nom",  // snake_case dans le service
    kpiScore: 85          // camelCase mélangé
    };

    // APRÈS (correct - camelCase uniquement) :
    const project = {
    projectName: "Nom",   // camelCase uniquement
    kpiScore: 85
    };

❌ À éviter dans les hooks :

    Définir des types/interfaces (c'est le rôle des DTOs)

    Contenir la logique métier pure (c'est le rôle des services)

    Stocker l'état métier persistant (c'est le rôle du domaine)
---

Ce plan est **opérationnel** et **séquentiel**.  
Les étapes doivent être suivies **dans l’ordre**.

## 🔁 Ordre de résolution prioritaire — UI vers DB

La migration commence par la frontière visible par l’utilisateur, puis remonte la chaîne technique uniquement lorsque le contrat l’exige :

1. **UI** : identifier le champ, son état de chargement/erreur et le payload réellement envoyé.
2. **DTO** : ajouter ou corriger le type camelCase et sa validation d’entrée.
3. **Transformer** : tester les conversions UI/DTO et DTO/entité, y compris `null`, `undefined` et les données partielles.
4. **Service et domaine** : appliquer les règles métier sans dépendance technique.
5. **Repository et adapter** : convertir vers le snake_case DB et encapsuler Supabase.
6. **Retour UI** : vérifier le rendu, la mutation, l’invalidation du cache et le message d’erreur.

Pour toute erreur TypeScript à la frontière UI/DTO, localiser d’abord la source (schéma DB, réponse API ou composant), choisir le chemin de propagation minimal, modifier les couches dans cet ordre, puis valider le transformer avant de corriger l’écran.

## 🧭 Phase 0 — Pré-requis (OBLIGATOIRE)

- [ ] Vérifier que `src/integrations/supabase/types.ts` est **à jour**
- [ ] Identifier les tables réellement utilisées
- [ ] Lister les écrans / fonctionnalités concernées
- [ ] Geler toute nouvelle feature hors migration
- [ ] Activer le `DEV_MODE` si nécessaire

Livrable :
- ✔️ Schéma DB validé
- ✔️ Périmètre clair de migration

---

## 🧱 Phase 1 — Domaine Métier (CORE)

### 1.1 Entités de domaine

- [ ] Créer / nettoyer les entités dans `src/domain/entities/`
- [ ] Constructeurs explicites
- [ ] Types primitifs uniquement
- [ ] Méthodes métier pures
- [ ] Aucune dépendance externe


exemple : public class Project {

    private final ProjectId id;
    private final ProjectTitle title;
    private final Budget budget;
    private final Schedule schedule;

    private ProjectStatus status;
    private Percentage progress;

    private final List<Phase> phases;
    private final List<Risk> risks;
    private final list<Stakeholder> stakeholders;

    // Références externes (autres agrégats)
    private final Set<PaymentId> paymentIds;
    private final Set<DocumentId> documentIds;
    private final Set<TaskId> taskIds;

    public Project(
        ProjectId id,
        ProjectTitle title,
        Budget budget,
        Schedule schedule,
        ProjectStakeholders stakeholders
    ) {
        this.id = id;
        this.title = title;
        this.budget = budget;
        this.schedule = schedule;
        this.stakeholders = stakeholders;

        this.status = ProjectStatus.PLANNED;
        this.progress = Percentage.zero();

        this.phases = new ArrayList<>();
        this.risks = new ArrayList<>();

        this.paymentIds = new HashSet<>();
        this.documentIds = new HashSet<>();
        this.taskIds = new HashSet<>();
    }

    // -------------------
    // MÉTIER
    // -------------------

    public void start(LocalDate today) {
        if (!schedule.canStart(today)) {
            throw new ProjectCannotStartException();
        }
        this.status = ProjectStatus.IN_PROGRESS;
    }

    public void advance(Percentage delta) {
        this.progress = this.progress.add(delta);
        if (this.progress.isComplete()) {
            complete();
        }
    }

    public void complete() {
        if (!schedule.isFinished(LocalDate.now())) {
            throw new ProjectCompletedTooEarlyException();
        }
        this.status = ProjectStatus.COMPLETED;
    }

    public boolean isOverdue(LocalDate today) {
        return schedule.isLate(today) && !isCompleted();
    }

    public boolean isCompleted() {
        return status == ProjectStatus.COMPLETED;
    }

    public RiskLevel riskLevel(LocalDate today) {
        if (isOverdue(today)) return RiskLevel.HIGH;
        if (progress.isLowFor(schedule, today)) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    // -------------------
    // STATISTIQUES DYNAMIQUES
    // -------------------

    public Percentage budgetUtilization(Money totalPaid) {
        return totalPaid.divideBy(budget.planned());
    }

    public Money remainingBudget(Money totalPaid) {
        return budget.planned().subtract(totalPaid);
    }

    // -------------------
    // LIENS EXTERNES (par ID)
    // -------------------

    public void linkPayment(PaymentId paymentId) {
        paymentIds.add(paymentId);
    }

    public void linkDocument(DocumentId documentId) {
        documentIds.add(documentId);
    }

}


❌ Interdit :
- Interfaces
- DTOs
- Types Supabase
- Logique UI

Livrable :
- ✔️ Entités métier stables et testables

---

### 1.2 Interfaces Repository (Ports)

- [ ] Créer les interfaces dans `src/domain/repositories/`
- [ ] Méthodes métier (findById, findAll, save, update…)
- [ ] Aucun détail technique

Livrable :
- ✔️ Contrats clairs entre domaine et infrastructure

---

## 🔌 Phase 2 — Infrastructure (Adapters & Persistence)

### 2.1 Adapters Supabase

- [ ] Créer les adapters dans `src/infrastructure/adapters/`
- [ ] Implémenter les interfaces repository
- [ ] Utiliser **exclusivement** les types DB
- [ ] Zéro logique métier

Livrable :
- ✔️ Accès DB encapsulé
- ✔️ Supabase invisible hors infrastructure

---

### 2.2 Transformers DB ↔ Entity

- [ ] Créer les mappers dans `src/infrastructure/transformers/`
- [ ] Conversion stricte DB Row ↔ Entity
- [ ] Pas de calcul métier

Livrable :
- ✔️ Frontière DB / Domaine étanche

---

## ⚙️ Phase 3 — Application (Services Métier)

### 3.1 Services

- [ ] Créer les services dans `src/application/services/`
- [ ] Orchestration métier uniquement
- [ ] Utilisation des repositories
- [ ] Gestion des règles SOMELEC

Livrable :
- ✔️ Logique métier centralisée
- ✔️ Services réutilisables (UI, batch, API)

---

## 🔁 Phase 4 — DTOs & Transformers

### 4.1 DTOs

- [ ] Créer les DTOs dans `src/dtos/entities/`
- [ ] Structurés pour UI / API
- [ ] Champs enrichis autorisés (progress, analytics…)

### 4.2 Transformers DTO ↔ Entity

- [ ] Créer les transformers dans `src/dtos/transforms/`
- [ ] Aucune logique métier
- [ ] Mapping explicite champ par champ

Livrable :
- ✔️ Séparation claire Domain / UI

---

## 🪝 Phase 5 — Hooks Hexagonaux

- [ ] Créer les hooks dans `src/hooks/hexagonal/`
- [ ] Appels aux services uniquement
- [ ] Gestion React Query / state
- [ ] Support DEV_MODE / PROD_MODE

❌ Interdit :
- Appels Supabase
-  - .from('name_table')... ***
-  - .select('column_table')... ***
- Accès DB
- Logique métier

Livrable :
- ✔️ API front propre et stable

---

## 🎨 Phase 6 — UI / Pages

- [ ] Brancher les hooks dans les composants
- [ ] FormData → DTO uniquement
- [ ] Affichage conditionnel basé sur DTO
- [ ] Design system respecté (Shadcn/UI)

Livrable :
- ✔️ UI découplée
- ✔️ Aucune dette technique UI

---

## 🔄 Phase 7 — Migration du Legacy

- [ ] Identifier anciens services (`src/services/*`)
- [ ] Remplacer par services hexagonaux
- [ ] Supprimer accès directs Supabase
- [ ] Nettoyer types legacy

Livrable :
- ✔️ Code legacy éliminé
- ✔️ Architecture homogène

---

## 🧪 Phase 8 — Tests & Validation

### 8.1 Vérifications techniques

```bash
grep -r "supabase\." src/components/
grep -r "supabase\." src/hooks/
Résultat attendu : 0 occurrence

8.2 Build & Qualité
npm run build
npm run lint
npm run test

Livrable :

✔️ Build vert

✔️ Architecture conforme

Phase 9 — Documentation

 Mettre à jour docs/architecture-flux-complete.md

 Mettre à jour docs/task-plan.md

 Mettre à jour CONTEXT.md

 Ajouter schémas si nécessaire

Livrable :

✔️ Documentation alignée avec le code

✅ Checklist Finale (GO / NO GO)

 Architecture hexagonale respectée

 Domaine sans dépendance technique

 Types DB centralisés

 Aucun mock en production

 Référentiel SOMELEC appliqué

 UI sans logique métier

🧠 Règle d’Or

Si un doute existe sur l’emplacement d’un code,
il n’a probablement pas sa place là.



## 🔍 Analyse dynamique

Les chiffres d’architecture doivent être recalculés depuis le dépôt avant chaque revue. Le bloc PowerShell ci-dessous est conservé comme référence historique; sous Linux, utiliser les commandes suivantes :

```bash
find src/components -type f -name '*.tsx' | wc -l
find src/hooks -type f -name '*.ts' -print0 | xargs -0 grep -l 'supabase\.' 2>/dev/null | wc -l
grep -RIn 'supabase\.' src/components src/hooks 2>/dev/null || true
grep -RInE '(^|[^A-Za-z])any([^A-Za-z]|$)' src/components src/hooks src/application 2>/dev/null || true
```

Les résultats doivent être consignés dans la revue de migration, jamais présentés comme des valeurs fixes dans ce plan.

### Référence historique — script PowerShell
```powershell
# Script d'analyse complète
Write-Host "🔍 ANALYSE COMPLÈTE DE LA MIGRATION HEXAGONALE" -ForegroundColor Green
Write-Host "=" * 60

# Analyser les composants
$components = Get-ChildItem -Path "./src/components" -Recurse -Include "*.tsx"
$componentsWithSupabase = $components | Select-String -Pattern "supabase\." | Group-Object Path | Select-Object Count, Name

$totalComponents = $components.Count
$componentsWithCalls = $componentsWithSupabase.Count
$componentsMigrated = $totalComponents - $componentsWithCalls
$componentsPercentage = if ($totalComponents -gt 0) { [math]::Round(($componentsMigrated / $totalComponents) * 100, 2) } else { 0 }

# Analyser les hooks
$hooks = Get-ChildItem -Path "./src/hooks/hexagonal" -Recurse -Include "*.ts"
$hooksWithSupabase = $hooks | Select-String -Pattern "supabase\." | Group-Object Path | Select-Object Count, Name

$totalHooks = $hooks.Count
$hooksWithCalls = $hooksWithSupabase.Count
$hooksMigrated = $totalHooks - $hooksWithCalls
$hooksPercentage = if ($totalHooks -gt 0) { [math]::Round(($hooksMigrated / $totalHooks) * 100, 2) } else { 0 }

# Totaux
$totalFiles = $totalComponents + $totalHooks
$totalWithCalls = $componentsWithCalls + $hooksWithCalls
$totalMigrated = $componentsMigrated + $hooksMigrated
$globalPercentage = if ($totalFiles -gt 0) { [math]::Round(($totalMigrated / $totalFiles) * 100, 2) } else { 0 }

# Affichage des résultats
Write-Host "`n📊 RÉSULTATS DE L'ANALYSE :" -ForegroundColor Yellow
Write-Host "-" * 40
Write-Host "📁 COMPOSANTS (.tsx) :" -ForegroundColor Cyan
Write-Host "  Total: $totalComponents fichiers"
Write-Host "  Migrés: $componentsMigrated ($componentsPercentage%)"
Write-Host "  Restants: $componentsWithCalls"
Write-Host "`n📁 HOOKS HEXAGONAUX (.ts) :" -ForegroundColor Cyan
Write-Host "  Total: $totalHooks fichiers"
Write-Host "  Migrés: $hooksMigrated ($hooksPercentage%)"
Write-Host "  Restants: $hooksWithCalls"
Write-Host "`n🌍 GLOBAL :" -ForegroundColor Green
Write-Host "  Total: $totalFiles fichiers"
Write-Host "  Migrés: $totalMigrated ($globalPercentage%)"
Write-Host "  Restants: $totalWithCalls"

# Estimation temps
$estimatedHours = [math]::Round($totalWithCalls * 0.5, 1)
$estimatedDays = [math]::Round($estimatedHours / 8, 1)

Write-Host "`n⏱️ ESTIMATION TEMPS RESTANT :" -ForegroundColor Magenta
Write-Host "  Heures: $estimatedHours heures"
Write-Host "  Jours: $estimatedDays jours (à 8h/jour)"

# Top 10 des fichiers critiques
Write-Host "`n🔴 TOP 10 FICHIERS LES PLUS CRITIQUES :" -ForegroundColor Red

$allFilesWithCalls = @()
$allFilesWithCalls += $componentsWithSupabase | ForEach-Object {
    [PSCustomObject]@{
        Fichier = $_.Name.Replace((Get-Location).Path + "\", "")
        Appels = $_.Count
        Type = "Component"
    }
}
$allFilesWithCalls += $hooksWithSupabase | ForEach-Object {
    [PSCustomObject]@{
        Fichier = $_.Name.Replace((Get-Location).Path + "\", "")
        Appels = $_.Count
        Type = "Hook"
    }
}

$allFilesWithCalls | Sort-Object Appels -Descending | Select-Object -First 10 | Format-Table
```

### **Utilisation**
```powershell
# Exécuter le script pour obtenir les résultats actuels
./analyze-migration.ps1

# Les résultats changent à chaque exécution selon l'état du code
```
---
---

## ✅ Finalisation CRUD & Vues — Projets / Phases / Jalons (HadraTech-GPI)

### Pages cibles
- [x] `src/pages/Projects.tsx` — toolbar filtres + suppression bulk OK
- [x] `src/pages/ProjectDetail.tsx` (+ `ProjectDetailByDTO`) — onglets Vue/Phases/Suivi & Évaluation
- [x] `src/pages/PhaseDetail.tsx` — onglets lifecycle (Planif/Exec/Contrôle/Clôture) + navigation cross-module
- [x] `src/pages/ProjectPhasesDetail.tsx` — onglet « Suivi & Éval. » branché ; Select labellisé
- [x] `src/pages/MilestoneDetail.tsx` — toggle terminé/rouvrir avec `aria-busy`

### Sous-objets (composants `Phase*`)
- `PhaseTasks` — CRUD via `useTasksHex`
- `PhaseMilestones` — CRUD via `useMilestonesHex`
- `PhaseMaterials` / `PhaseDocuments` / `PhasePayments` / `PhaseInspections` / `PhaseEmployees`

### Garde-fous design / accessibilité
- Tokens sémantiques uniquement (pas de `text-gray-*` ad-hoc).
- Un seul `<main>` par route (via `AppLayout`).
- Boutons-icônes : `aria-label` obligatoire.
- Skeletons + `role="status"` pour les chargements.
- Tap target ≥ 44×44 sur mobile (`min-h-11 min-w-11`).

### Hors scope explicite
- Aucune nouvelle fonctionnalité hors migration et validation.
- Les migrations DB et les adapters existants sont modifiés uniquement lorsqu’ils sont nécessaires à un parcours CRUD prioritaire et couverts par une preuve.

---

## 🚦 Séquence d’exécution finale

### Lot A — Socle et contrats

- [ ] Valider `src/integrations/supabase/types.ts` après la dernière migration.
- [ ] Comparer les tables réellement utilisées avec `sql/`, `supabase/migrations/` et les adapters.
- [ ] Finaliser les entités, repositories, DTOs et transformers manquants.
- [ ] Ajouter les tests unitaires des règles métier et des mappings snake_case/camelCase.

**Sortie du lot :** les contrats compilent et aucun type DB ne fuit vers le domaine ou l’UI.

### Lot B — Persistance et services

- [ ] Finaliser les adapters Supabase pour les agrégats prioritaires : projets, organisations, phases, jalons, tâches et matériaux.
- [ ] Couvrir chaque opération CRUD par un test d’adapter avec succès, absence de résultat et erreur réseau/DB.
- [ ] Centraliser les erreurs dans un type applicatif stable; ne jamais exposer l’erreur brute de Supabase à l’UI.
- [ ] Vérifier les règles de rôles et d’accès sur lecture, écriture et suppression.

**Sortie du lot :** les services orchestrent uniquement le domaine et les repositories; les adapters restent les seuls propriétaires de Supabase.

### Lot C — Hooks et écrans

- [ ] Remplacer chaque accès Supabase direct restant dans `src/components/` et `src/hooks/`.
- [ ] Brancher les hooks hexagonaux sur les écrans CRUD prioritaires.
- [ ] Vérifier les états chargement, vide, succès et erreur pour chaque mutation.
- [ ] Vérifier accessibilité, confirmation de suppression, invalidation du cache et navigation après mutation.

**Sortie du lot :** un utilisateur peut créer, consulter, modifier et supprimer les objets prioritaires depuis l’UI sans accès technique direct.

### Lot D — Référentiels et import/export

- [ ] Vérifier que chaque code de procédure, phase, catégorie et règle référentielle est typé et localisable.
- [ ] Valider l’import avec données valides, champs absents, doublons et organisation inconnue.
- [ ] Valider l’export et la réimportation sans perte des champs métier.
- [ ] Documenter les changements de schéma et régénérer les types Supabase si nécessaire.

**Sortie du lot :** les référentiels déterminent le comportement métier sans constantes dupliquées dans les composants.

### Lot E — Nettoyage legacy et release

- [ ] Migrer les services legacy encore utilisés, puis supprimer les chemins morts.
- [ ] Réduire à zéro les `any` des parcours prioritaires; chaque exception documentée doit être approuvée.
- [ ] Mettre à jour `docs/ARCHITECTURE.md`, `docs/CONTEXT.md` et ce plan avec les résultats réels.
- [ ] Exécuter les validations finales et effectuer une recette manuelle des parcours CRUD.

**Sortie du lot :** build, lint et tests passent; les critères de sortie du tableau initial sont tous démontrés par une preuve.

## ✅ Procédure de clôture

1. Exécuter `npm run build`, `npm run lint` et `npx vitest run` (aucun script `test` n’est déclaré actuellement).
2. Appliquer les migrations sur une base de validation et vérifier les opérations CRUD prioritaires.
3. Consigner les compteurs avant/après, les tests exécutés et les écarts restants.
4. Marquer une case `[x]` uniquement quand sa preuve est disponible dans le commit ou le rapport de validation.
5. Déclarer **GO** seulement si aucun critère bloquant ne reste ouvert; sinon déclarer **NO GO** avec propriétaire et prochaine action.

## 📌 Registre des écarts

| Écart | Impact | Propriétaire | Prochaine action | Échéance |
|---|---|---|---|---|
| Suite `EnhancedValidationIntegration.test.ts` dépend de `@jest/globals` | Bloque Vitest | À assigner | Migrer la suite vers Vitest ou l’exclure de la configuration Vitest documentée | Avant GO |
| `RepositoryFactory.providers.test.ts` attend `SupabaseStorageProvider`, mais reçoit `SupabaseStorageAdapter` | 1 test en échec | À assigner | Aligner le test et le contrat sur l’implémentation retenue | Avant GO |
| `npm run lint` est bloqué par les permissions de `supabase/docker/volumes/db/data` | Lint non qualifié | Environnement | Exclure le volume de la portée ESLint ou corriger ses permissions, puis relancer | Avant GO |

## 🔁 Itération — Nettoyage priorisé UI (COMPONENT/UI par p0Violations)

Généré par `scripts/generate-refactor-plan.cjs` (tri : COMPONENT/UI d'abord, puis `p0Violations` décroissant, puis `score`).

### Fait
- [x] `scripts/generate-refactor-plan.cjs` : exploite `p0Violations`, `violations`, `score`, `layer`, `type` du rapport ; nouveau tri UI-first ; table « Top UI/COMPONENT par p0Violations ».
- [x] `scripts/fix-hexagonal-violations.js` : faux positifs supprimés (P0-DB001 limité aux vraies méthodes Supabase, P0-M001 ignore les callbacks inline `() => {}`).
- [x] Hiérarchie projet persistée réellement : table `btp.project_hierarchy_nodes` (niveau/chemin calculés par trigger) + `SupabaseHierarchyAdapter` réécrit — CRUD, arbre (move/reorder/duplicate récursif), recherche à facettes, statistiques, chemin critique, validation d'intégrité (cycles, parent invalide, ordre dupliqué). Plus aucun mock.
- [x] Imports morts `RepositoryFactory` supprimés dans `ProjectExporter`, `ProjectDetailByDTO`, `ProjectFileImporter`, `AdvancedProjectImporter` (ces écrans passent déjà par les services).

### Reste à traiter (ordre d'attaque)
1. `ProjectExporter.tsx` (21 p0) — typer les collections `any[]` en DTOs (`PhaseDTO`, `TaskAssignmentDTO`, `PaymentDTO`, `RiskDTO`, `MilestoneDTO`, `DocumentDTO`) et retirer les accès `phase_name`, `start_date`, `payment_date`, `contractor_name` (fallbacks legacy).
2. `ProjectDetailByDTO.tsx` (19 p0) — supprimer les casts `as any` sur `interventionZones`, `coordinates`, `inspections`, `documents` (déjà typés), clarifier `entityCode` vs `referentialCode`, typer les `queryFn` (Gantt/PERT/compliance).
3. `ProjectFileImporter.tsx` / `AdvancedProjectImporter.tsx` (8 et 4 p0) — lignes brutes en `Record<string, unknown>`, sorties en `Partial<CreateProjectDTO>`/`UpdateProjectDTO`, mapping camelCase (`startDate`, `endDate`, `financingSource`, `marketType`, `selectionMode`, `projectReference`).
4. PDF/reports (`ProjectPDFDocument`, `CompactProjectPDFDocument`, `InspectionReportGenerator`) — mêmes DTOs, aucun accès snake_case.
5. Workflows de phases (`PhaseWorkflowOrchestrator`, `PhaseWorkflowContainer`, les deux `UnifiedPhaseWorkflow`, `PhasePlanificationStep`) — combler les trous de persistance (états locaux non écrits en base) et dédupliquer les variantes mortes.

### Points à clarifier (métier)
- `projectManagerId` vs `projectResponsableId` dans l'import avancé (sémantique différente, pas un simple problème de casse).
- Existence de DTOs dédiés pour garanties bancaires / attestations d'assurance côté détail projet.
