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

## Bonnes Pratiques d'Architecture Hexagonale

###📋 Rôles de Chaque Couche##

1. domain entities (domain/\*)
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
6. Adapters (/infrastructure/adapters/)
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

### Validation ciblée — 17/10/2026

#### P0 auto-hébergement et SMS

- Procédure exécutée côté code : [SELF_HOSTED_RELEASE.md](SELF_HOSTED_RELEASE.md), build sur hôte Node 22 puis image dist/Nginx ; configuration publique externe validée et montée en lecture seule ; release frontend indépendante et rollback par tag.
- Aucun fichier .env modifié. Script de synchronisation désormais strictement en lecture seule ; les paramètres génériques refusent les secrets et masquent les lignes sensibles. Audit RLS/rotation des secrets historiques reste à effectuer sur le serveur.
- Twilio connecté et accès applicatif vérifié HTTP 200 ; port serveur SMS, validation E.164, contrôle du résultat, autorisation des rôles actifs et fonction déployée. Aucun numéro actif disponible ; formulaire expéditeur refusé, donc aucun SMS réel envoyé.
- 40 tests Vitest ciblés et 3 tests de configuration publique passants ; compilation automatique OK. Docker absent : lancement conteneurs, backend auto-hébergé, migrations, livraison et parcours authentifiés non validés ; planificateurs/appels/rappels ne doivent pas être déclarés opérationnels sans workers et recette serveur.

#### Actions, inspections et portails — correctifs complémentaires

- 55 tests ciblés passants (7 fichiers), compilation automatique sans erreur ; lint ciblé des nouveaux services/référentiels/tests passé.
- Actions paiement : contacts résolus via UserService, envois email/SMS et programmation d'appel vérifiés ; escalades utilisent les canaux sélectionnés et conservent le contexte projet/paiement. Aucun succès simulé pour le courrier postal non configuré.
- Appels : contrat complet transmis à la fonction serveur `schedule-call`, qui reste responsable de sa notification ; évite l'ancien payload incompatible et les doubles notifications.
- Inspections : dates et identifiants inspecteur persistés, lecture retour de l'entité enregistrée, statuts camelCase convertis en snake_case, absence de ligne modifiée remontée. La création consultant passe désormais par InspectionService, non par un objet DB passé directement au repository.
- Programmation : identifiant d'inspection distinct de celui d'une étape ; création si nécessaire et conservation de l'identifiant en cas de nouvelle tentative ; identité du demandeur issue de la session. Le contrôle « notifier l'entrepreneur » sans effet a été retiré.
- Politique : transitions/pièces d'inspection et limites/chaînes/délais d'initiation des paiements centralisés dans les référentiels ; politique paiement injectable, valeurs historiques conservées comme défauts explicites. Pas de nouvel écran de configuration ni de modification des permissions serveur.
- Portails : upload fournisseur unique via DocumentService avec supplierId, taille et type ; fichier conservé après erreur pour réessai. Portée consultant exclut les alertes/garanties/assurances hors projets ; seules les inspections terminées/approuvées comptent dans les preuves de phase ; actions d'alertes désactivées pendant traitement et libellés de statuts traduits.
- Paiement workflow : identité/contact prestataire obligatoires, rejet des montants non finis et événement cohérent avec le montant effectivement enregistré ; l'ancien seuil UI 25 % est remplacé par l'éligibilité du calculateur de décompte (pas un paiement automatique).
- Limites : SMS serveur explicitement non configuré (501), courrier postal non configuré ; réception réelle email, planificateurs serveur, permissions et parcours privés restent non validés sur Supabase externe. Navigateur : connexion fournisseur visible sans erreur runtime ; portail consultant encore en attente d'authentification au moment de la capture. Docker et migration globale restent non clôturés.

- Compilation automatique : **build OK** après correction des erreurs de types GED, articles, export projet et adapters.
- Tests ciblés : **4 fichiers / 24 tests passants** (stockage/GED, campagnes, abonnements, import projet).
- GED : bucket/path conservés lors du téléchargement et de la suppression, rollback d’upload en cas d’échec de persistance, mapping camelCase des documents d’appel d’offres corrigé.
- Newsletter : la date programmée est réellement enregistrée en modification ; consentement, refus d’envoi anticipé et résultats persistés sont testés.
- Auto-hébergement : conteneur frontend ajouté, chemins/ports corrigés, démarrage sans écriture ni affichage de secrets ; YAML et scripts vérifiés statiquement.
- **Clôture production non acquise** : Docker indisponible ici, Supabase externe sans session injectable ; démarrage serveur, migrations, fonctions edge, livraison email et parcours privés restent à vérifier. Les profils Keycloak/MinIO demandent encore leurs dépendances d’intégration (pgjwt, signature S3, JWT/PostgREST).

### Revue de migration — 19/08/2026 (exécution Phase 8)

| Indicateur | Mesure | Statut |
| --- | --- | --- |
| Build TypeScript/Vite | 0 erreur | ✅ |
| Tests (Vitest) | 31 fichiers / 164 tests passants | ✅ |
| `supabase.from()` dans `src/components` et `src/hooks` | 0 (occurrences restantes = commentaires de documentation) | ✅ |
| `supabase.storage` dans l'UI | 0 — remplacé par `StorageService` (`documentsTableAdapter`, `EnhancedValidationStep`) | ✅ |
| `supabase.auth` dans l'UI | 0 — remplacé par `AuthService.getCurrentUser()` (`WorkspaceCreateDialog`, `TenderEvaluationPanel`) | ✅ |
| Exception assumée | `useUnifiedSupplierPortalHex` (frontière d'authentification : `onAuthStateChange` non exposé par `IAuthRepository`) | ⚠️ documenté |

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

| Indicateur                            |                                        Cible | Preuve attendue                                              |
| ------------------------------------- | -------------------------------------------: | ------------------------------------------------------------ |
| Build TypeScript/Vite                 |                                     0 erreur | `npm run build`                                              |
| Lint                                  |                           0 erreur bloquante | `npm run lint`                                               |
| Tests                                 |                     100 % des tests passants | `npm run test` ou commande Vitest équivalente                |
| Supabase direct dans composants/hooks |                               0 accès métier | recherche `grep -RIn 'supabase\\.' src/components src/hooks` |
| DTOs exposés à l’UI                   |                         camelCase uniquement | revue des DTOs et transformers                               |
| Domaine                               |                           0 import technique | revue `src/domain/`                                          |
| CRUD prioritaire                      | lecture, création, modification, suppression | tests + vérification manuelle                                |

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

2. DTOs (src/dtos/entities/_ et src/dtos/workflows/_) : camelCase OBLIGATOIRE
   - projectName, createdAt, kpiScore
   - Les DTOs représentent les données pour l'application

3. TRANSFORMERS (src/dtos/transforms/\*) :
   - DOIVENT convertir snake_case ↔ camelCase
   - Une méthode toModel() et fromModel()

4. MODÈLES DOMAINE (src/domain/\*) : camelCase
   - Entities et Value Objects en camelCase

5. SERVICES (src/application/\*) : camelCase uniquement
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

7. POUR LES SERVICES (src/application/\*) :
   1. VÉRIFIER qu'aucun attribut snake_case n'est utilisé
   2. CORRIGER les imports/types qui référencent directement la DB
   3. UTILISER uniquement les DTOs camelCase

   POUR LES HOOKS :
   1. Les hooks exposent uniquement du camelCase aux composants
   2. La conversion se fait dans le hook via les transformers

   EXEMPLE DE CORRECTION :
   // AVANT (mauvais - mélange des conventions) :
   const project = {
   project_name: "Nom", // snake_case dans le service
   kpiScore: 85 // camelCase mélangé
   };

   // APRÈS (correct - camelCase uniquement) :
   const project = {
   projectName: "Nom", // camelCase uniquement
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
- - .from('name_table')... \*\*\*
- - .select('column_table')... \*\*\*
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

````bash
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
````

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

| Écart                                                                                                        | Impact            | Propriétaire  | Prochaine action                                                                 | Échéance |
| ------------------------------------------------------------------------------------------------------------ | ----------------- | ------------- | -------------------------------------------------------------------------------- | -------- |
| Suite `EnhancedValidationIntegration.test.ts` dépend de `@jest/globals`                                      | Bloque Vitest     | À assigner    | Migrer la suite vers Vitest ou l’exclure de la configuration Vitest documentée   | Avant GO |
| `RepositoryFactory.providers.test.ts` attend `SupabaseStorageProvider`, mais reçoit `SupabaseStorageAdapter` | 1 test en échec   | À assigner    | Aligner le test et le contrat sur l’implémentation retenue                       | Avant GO |
| `npm run lint` est bloqué par les permissions de `supabase/docker/volumes/db/data`                           | Lint non qualifié | Environnement | Exclure le volume de la portée ESLint ou corriger ses permissions, puis relancer | Avant GO |

## 🔁 Itération — Nettoyage priorisé UI (COMPONENT/UI par p0Violations)

Généré par `scripts/generate-refactor-plan.cjs` (tri : COMPONENT/UI d'abord, puis `p0Violations` décroissant, puis `score`).

### Fait

- [x] `scripts/generate-refactor-plan.cjs` : exploite `p0Violations`, `violations`, `score`, `layer`, `type` du rapport ; nouveau tri UI-first ; table « Top UI/COMPONENT par p0Violations ».
- [x] `scripts/fix-hexagonal-violations.js` : faux positifs supprimés (P0-DB001 limité aux vraies méthodes Supabase, P0-M001 ignore les callbacks inline `() => {}`).
- [x] Hiérarchie projet persistée réellement : table `btp.project_hierarchy_nodes` (niveau/chemin calculés par trigger) + `SupabaseHierarchyAdapter` réécrit — CRUD, arbre (move/reorder/duplicate récursif), recherche à facettes, statistiques, chemin critique, validation d'intégrité (cycles, parent invalide, ordre dupliqué). Plus aucun mock.
- [x] Imports morts `RepositoryFactory` supprimés dans `ProjectExporter`, `ProjectDetailByDTO`, `ProjectFileImporter`, `AdvancedProjectImporter` (ces écrans passent déjà par les services).

### Reste à traiter (ordre d'attaque)

1. [x] `ProjectExporter.tsx` (21 p0) — collections et données de détail alignées sur `ProjectDTO` / `ProjectDetailDTO` et les DTOs associés ; suppressions des accès `any` et snake_case ; erreurs de chargement/détail désormais visibles. Preuves ciblées : ESLint, diagnostic éditeur, vérification de syntaxe esbuild et recherche sans `any`/snake_case. La validation TypeScript globale reste bloquée par les erreurs de syntaxe déjà présentes dans `AuthService.ts` et `usePhaseStepTaskHierarchyHex.ts`.
2. `ProjectDetailByDTO.tsx` (19 p0) — supprimer les casts `as any` sur `interventionZones`, `coordinates`, `inspections`, `documents` (déjà typés), clarifier `entityCode` vs `referentialCode`, typer les `queryFn` (Gantt/PERT/compliance).
3. `ProjectFileImporter.tsx` / `AdvancedProjectImporter.tsx` (8 et 4 p0) — lignes brutes en `Record<string, unknown>`, sorties en `Partial<CreateProjectDTO>`/`UpdateProjectDTO`, mapping camelCase (`startDate`, `endDate`, `financingSource`, `marketType`, `selectionMode`, `projectReference`).
4. PDF/reports (`ProjectPDFDocument`, `CompactProjectPDFDocument`, `InspectionReportGenerator`) — mêmes DTOs, aucun accès snake_case.
5. Workflows de phases (`PhaseWorkflowOrchestrator`, `PhaseWorkflowContainer`, les deux `UnifiedPhaseWorkflow`, `PhasePlanificationStep`) — combler les trous de persistance (états locaux non écrits en base) et dédupliquer les variantes mortes.

### Points à clarifier (métier)

- `projectManagerId` vs `projectResponsableId` dans l'import avancé (sémantique différente, pas un simple problème de casse).
- Existence de DTOs dédiés pour garanties bancaires / attestations d'assurance côté détail projet.

## 🔁 Itération — Unification des canaux de communication (email / SMS / appels)

Règle : **aucun composant `.tsx` ni hook ne parle directement à une Edge Function d'envoi ni à `NotificationService.sendEmail/sendSMS/scheduleCall`**. Tous les envois passent par `src/application/services/CommunicationService.ts` (seul point d'entrée applicatif), qui délègue au serveur via l'Edge Function `send-email-notification` (aucune clé provider côté navigateur).

### Fait

- [x] `CommunicationService.sendEmail` accepte désormais `html`, `replyTo` et `attachments` (base64) en plus de `message` ; le résultat `{ success, channel, reference }` doit être vérifié par l'appelant.
- [x] Edge Function `send-email-notification` : accepte `html` / `text` / `replyTo` / `attachments`, fallback `message` → HTML ; `ResendAdapter` relaie les pièces jointes, `reply_to` et `text`.
- [x] `src/utils/fileEncoding.ts` : helpers partagés `blobToBase64` (PDF) et `textToBase64` (CSV) pour les pièces jointes.
- [x] Composants alignés sur `CommunicationService` (et rapports PDF réellement joints à l'email) :
  - `components/reports/InspectionReportGenerator.tsx`
  - `components/reports/TenderReportGenerator.tsx`
  - `components/reports/SupplierPaymentReportGenerator.tsx`
  - `components/reports/QuantitativeEstimateExporter.tsx`
  - `components/boq/BoqDevisDialog.tsx` (plus d'appel direct `invokeFunction`)
- [x] `hooks/hexagonal/usePaymentActionsHex.ts` : `assignTask`, `sendSMS`, `scheduleCall`, `sendEmail` routés via `CommunicationService` (métadonnées d'action conservées).

### Hors scope (légitime)

- `SupplierNotificationService` / `SupplierPasswordReset` : RPC de jetons et Edge Functions dédiées côté service (pas d'envoi depuis l'UI).
- `NotificationService.createNotification` reste l'API des notifications in-app (persistance), distincte des canaux sortants.

### Reste à traiter

- Adapters `SmtpAdapter` / `SendGridAdapter` : prise en charge des pièces jointes (aujourd'hui seul Resend les relaie).
- Journaliser les envois sortants (canal, destinataire, référence provider) dans une table dédiée pour l'audit.

## 2026-08-26 — Stabilité UI (labels statuts & TooltipProvider)
- `TooltipProvider` global monté dans `App.tsx` (corrige « Tooltip must be used within TooltipProvider » dans la liste DQE et partout ailleurs).
- Statuts : suppression des affichages de codes bruts (`ProjectMap`, `MapFilters`, `ProjectFilters`, `ProjectStatusCard`) → résolution via `useI18n().translateStatus` (référentiel fr/ar/en).
- Filet de sécurité `humanizeReferentialCode()` dans `status-labels.referential.ts` : aucun code technique (`en_cours_v2`) ne peut atteindre l’UI.
- Nettoyage dette de build : locales JSON re-aplaties, `useProjectsHex()` (`projects`), `formatReference` importé dans le report adapter, signatures `entityLabels` élargies. Typecheck 0 erreur.

## 2026-08-26 — Sprint 1 : routes DQE dédiées & densité UI (workflow DQE ➔ Devis ➔ Contrat)
- Nouvelles routes (aucune duplication de menu) : `/dqe/list` (historique), `/dqe/new` (création directe d'un document), `/dqe/:id` (détail) — page `pages/dqe/DqeHub.tsx`, sélection du projet par `?projectId=`.
- `DqeWorkspace` accepte désormais une sélection pilotée par la route (`documentId`, `onDocumentIdChange`, `autoCreate`) tout en restant utilisable en mode autonome dans l'onglet projet (aucune régression).
- Densité `BoqActionsBar` (Zone 2) : une seule ligne « actions principales à gauche / actions secondaires à droite ». `PDF`, `Envoyer`, `Télécharger` regroupés dans un menu `Document` (clé i18n `dqe.actions.document_menu` fr/en/ar) ; `Signer` et `Workflow` conservés à droite ; badges d'information (chaîne planification / AO, signature, gate) sur la ligne inférieure.
- Conservé intact : parties Émetteur/Destinataire (`DocumentPartiesDialog`), Factur-X / EN 16931, TypeCode 310, organisations, gate d'injection, chaîne `ProcurementChainService` (DQE validé ➔ planification ➔ prévisions ➔ AO ➔ portails).
- `TooltipProvider` global déjà monté (correctif conservé) ; typecheck 0 erreur, build OK.

### Reste à traiter (Sprint 2/3)
- Sélection directe depuis les catalogues Matériaux/Équipements dans le tableau de lignes (pré-remplissage désignation/unité/PU).
- Sélecteur de Responsable (Équipe/RH) dans la carte Référentiel (Zone 3).
- `/consultant-portal` : onglet Candidatures + validations techniques ; synchronisation budget prévisionnel bidirectionnelle.

---

## ✅ Sprints 1–3 — Refonte DQE / Workflow / Portails (livré)

| Livrable | État | Preuve |
| --- | --- | --- |
| Routes DQE `/dqe/list`, `/dqe/new`, `/dqe/:id` | ✅ | `src/pages/dqe/DqeHub.tsx`, `src/App.tsx` |
| Zone 1 — En-tête identité + actions principales | ✅ | `BoqActionsBar` (menu Document + actions secondaires) |
| Zone 2 — Stepper visuel DRAFT → SUBMITTED → VALIDATED | ✅ | `src/components/boq/BoqWorkflowStepper.tsx` monté dans `DqeWorkspace` (détail) |
| Zone 3 — Carte référentiel compacte (Phase / Jalon / Tâche / Responsable) | ✅ | `BoqWorkspace` : `WbsSelector` + sélecteur « Responsable par défaut » persisté (prefs document) et hérité par les nouvelles lignes (saisie, métré, import) |
| Zone 4 — CRUD lignes / parser / totaux fiscaux | ✅ | `BoqLineTable`, `BoqImportDialog`, récap HT/TVA/RAS/Net |
| Codes techniques EN MAJUSCULES, libellés i18n | ✅ | statut via `translateStatus`, clés `dqe.responsible.*` (fr/en/ar) |
| Portail consultant `/consultant-portal` + `/consultant-portal/:tab` (dont `inspections`) | ✅ | `App.tsx` (catch-all `*` déplacé **après** les routes consultant — la route consultant était masquée par `NotFound`), onglets pilotés par l'URL dans `ConsultantDashboard` |
| Stabilité `TooltipProvider` | ✅ | provider global monté dans `App.tsx`, 0 erreur console sur `/dqe/list` |

Note d'architecture : aucune écriture Supabase ajoutée en UI — le stepper est purement dérivé des statuts de lignes (`resolveDocumentStatus`), le responsable par défaut est propagé via `metadata.stakeholder` du DTO puis persisté par `useBoqDocument`.

## Plan proposé — Module Actualités, Newsletter et abonnements

### Objectif et périmètre

Créer un espace éditorial inspiré d'un CMS/blog, avec :

- un menu public **Actualités** et des pages de consultation des articles publiés ;
- une interface d'administration protégée pour le CRUD des articles et des newsletters ;
- la gestion des abonnements depuis le formulaire du pied de page, actuellement limité à un champ et un bouton sans traitement ;
- l'association facultative d'un article à un projet existant, avec autocomplétion, puis affichage contrôlé du nom, de la progression et de la durée du projet ;
- la sélection de documents existants dans la GED, sans ré-uploader ni dupliquer les fichiers.

Ce lot est planifié **après la clôture de la migration hexagonale et la levée du gel des nouvelles fonctionnalités** défini plus haut. Les estimations ci-dessous sont une première estimation pour un développeur, à confirmer après le cadrage technique.

### État des briques réutilisables

| Besoin | État constaté | Réutilisation prévue |
| --- | --- | --- |
| Saisie de texte enrichi | `RichTextEditor` basé sur TipTap, avec HTML en entrée/sortie | Le réutiliser pour l'article et le contenu de newsletter ; compléter les contrôles éditoriaux nécessaires sans créer un second éditeur. |
| Autocomplétion projet | `EnhancedProjectSelector` et hooks projets disponibles | Sélectionner et persister le `projectId`; lire les champs `progress`, `startDate` et `endDate` depuis le DTO projet plutôt que les recopier dans un formulaire. |
| GED | `DocumentService`, DTOs de document, stockage et composants GED présents | Lier des `documentId` à un article ; afficher titre, type et lien via les services GED existants. |
| Envoi d'email | `CommunicationService` relaie les emails via la passerelle serveur | Réutiliser la frontière serveur ; ne jamais exposer de clé fournisseur ni envoyer une campagne depuis le navigateur. Une capacité d'envoi en lot reste à concevoir côté serveur. |
| Newsletter du pied de page | Champ email et bouton « OK » sans formulaire ni appel métier | Connecter après création du flux d'inscription, avec états de chargement, succès et erreur. |

### Modèle fonctionnel cible

- **Article d'actualité** : titre, slug unique, résumé, contenu riche, statut (`draft`, `published`, éventuellement `scheduled`), dates de publication/création/mise à jour, documents GED associés et projet associé facultatif.
- **Projet associé** : relation par identifiant vers le projet du système. Après sélection, afficher le nom, la progression et la durée dérivée des dates projet (`startDate` / `endDate`), en lecture seule. Si une date nécessaire manque, afficher une valeur explicite « non renseignée » ; ne pas inventer de durée. L'affichage de ces informations sur la page publique doit être explicitement activé par l'éditeur.
- **Abonné** : email normalisé et unique, statut (`pending_confirmation`, `active`, `unsubscribed`), date/source du consentement et dates de confirmation/désinscription. Prévoir confirmation d'inscription et désinscription fonctionnelle dans chaque campagne.
- **Newsletter/campagne** : objet, pré-en-tête, contenu riche, statut (`draft`, `scheduled`, `sending`, `sent`, `failed`), dates d'envoi et résultat d'envoi. L'envoi en masse nécessite un traitement serveur avec suppression des désinscrits, suivi des erreurs et prévention des doublons ; il ne doit pas être simulé par une boucle d'envoi côté client.

Les nouveaux champs et tables suivront le flux existant : schéma PostgreSQL en `snake_case`, entités/DTOs/services en `camelCase`, repositories et adapters, puis hooks et UI. Les associations GED référenceront les identifiants des documents existants ; le contenu éditorial ne doit pas stocker une copie des fichiers.

### Étapes et estimation initiale

| Étape | Travaux | Estimation |
| --- | --- | ---: |
| 0. Cadrage et prérequis | Confirmer rôles autorisés, parcours de confirmation d'abonnement, règles de publication, visibilité des données projet et état de la migration. Vérifier les capacités réelles de la passerelle d'email et de la GED. | 1 j |
| 1. Domaine et persistance | Définir entités, DTOs, repositories/adapters/services et migrations pour articles, abonnements, campagnes et liens vers documents. Ajouter contraintes d'unicité, index, RLS/politiques publiques minimales et politiques d'administration. | 2–3 j |
| 2. CRUD éditorial | Ajouter routes/pages protégées et menu d'administration ; liste, recherche, création, modification, aperçu, archivage/suppression contrôlée et transitions brouillon/publication. Réutiliser TipTap et les conventions i18n existantes. | 2–3 j |
| 3. Projet et GED | Intégrer le sélecteur avec autocomplétion ; présenter les métadonnées du projet sélectionné ; relier/supprimer des pièces jointes par le parcours GED existant ; vérifier droits d'accès aux documents. | 1–2 j |
| 4. Consultation publique et abonnement | Ajouter le menu et les pages Actualités (liste, détail, 404/état vide), alimentées uniquement par les articles publiés ; connecter le pied de page à une inscription avec consentement, confirmation, anti-doublon et désinscription. | 2–3 j |
| 5. Campagnes et recette | Ajouter la préparation et l'envoi serveur des newsletters, statuts/résultats, journalisation et protection contre les ré-envois ; couvrir les parcours par tests et recette des permissions, mails, liens GED et langues. | 2–3 j |

**Durée totale estimée : 8–13 jours ouvrés**, hors délais de validation métier, configuration/délivrabilité email et déploiement des migrations. Réestimer l'étape 5 après vérification de la prise en charge serveur de l'envoi en lot.

### Critères d'acceptation

- Un utilisateur autorisé peut créer, lire, modifier et archiver/supprimer selon les règles retenues un article et une campagne ; un brouillon n'est jamais visible publiquement.
- Une actualité publiée est accessible depuis le menu public, avec URL stable basée sur son slug.
- La recherche de projet fonctionne sur le référentiel existant ; le projet lié reste traçable par ID et les informations projet affichées ne sont pas modifiables depuis l'article.
- Les documents associés proviennent de la GED et respectent ses permissions ; aucun fichier n'est copié dans un stockage parallèle.
- L'inscription confirme le consentement, empêche les doublons, ne réactive pas implicitement un désabonné et permet une désinscription effective.
- Seuls les abonnés actifs reçoivent les campagnes ; une erreur d'envoi est visible et une relance ne provoque pas de doublon.
- Les politiques RLS distinguent lecture publique des seuls contenus publiés, opérations d'administration et traitement sécurisé des adresses email.
- Tests unitaires des règles métier, tests d'intégration repositories/adapters et tests UI des parcours principaux ; build, lint et tests ciblés passent.

### Décisions à valider au cadrage

1. Le double opt-in par email est recommandé avant l'activation d'un abonnement ; confirmer la règle de consentement et les textes légaux à afficher.
2. La progression et la durée proviennent des valeurs actuelles du projet au moment de l'affichage ; confirmer si une copie « figée à la publication » est également requise pour l'archive éditoriale.
3. Confirmer les rôles qui administrent actualités, abonnés et campagnes, ainsi que le mode d'envoi (immédiat uniquement ou programmation).

### État de l'implémentation corrective — 2026-10-12

- Build de production réparé : routes/pages, imports des sélecteurs, hooks de lecture, formulaires et types des trois tables Supabase sont maintenant cohérents.
- Mapping des entités corrigé pour les créations et mises à jour Articles, abonnés et campagnes ; l'auteur des créations vient de la session authentifiée.
- Migration Articles corrigée (index SQL) et RLS restreinte : brouillons privés, publication réservée aux rôles éditoriaux, contenu HTML assaini avant rendu public.
- Consentement explicite exigé au formulaire et vérifié côté serveur ; confirmation et désinscription utilisent des jetons aléatoires à usage unique, stockés sous forme hachée et consommés atomiquement.
- Les campagnes sont envoyées par une Edge Function qui vérifie le rôle d'administration, réclame atomiquement la campagne, limite les destinataires aux abonnés actifs consentants, journalise chaque livraison et ajoute un lien de désinscription.
- La page détail ouvre les documents liés dans la visionneuse GED partagée ; les réponses publiques excluent les documents internes, les URL signées/non HTTP(S) et les métadonnées projet non publiées. Les créations/mises à jour valident les références GED, et les recherches Articles, campagnes et abonnés filtrent réellement les résultats.
- Le HTML des campagnes est assaini côté serveur par liste d'autorisation ; les campagnes envoyées/en cours d'envoi ne peuvent plus être modifiées ou supprimées depuis l'interface.
- Le dispatcher serveur sélectionne les campagnes échues ; sa déclenchement périodique doit être configuré dans l'environnement de déploiement.
- Build Vite production passé et lint ciblé des fichiers frontend modifiés passé. Le typecheck complet reste en échec sur des erreurs préexistantes hors module (import/export projet, tâches/BOQ et leurs tests) ; aucune erreur Newsletter/Articles n'est ressortie. La validation de la migration et des Edge Functions reste à faire dans l'environnement Supabase réel.
- Vérification corrective du 2026-10-13 : lint ciblé frontend et Edge Function passé, diagnostics des fichiers TypeScript touchés sans erreur. Le build courant est bloqué par une erreur de syntaxe préexistante dans `src/application/services/AuthService.ts:236`; aucun test unitaire ciblé du module n'a été exécuté. La validation de l'Edge Function avec Deno/Supabase et la recette de permissions restent à faire dans l'environnement Supabase réel.

Configuration de déploiement requise pour les fonctions newsletter : `NEWSLETTER_SITE_URL` (ou `SITE_URL` comme valeur de repli), `NEWSLETTER_CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` et la configuration serveur du fournisseur d'email. Les tables métier Articles/Newsletter et leur RPC restent dans le schéma `btp`, qui doit être exposé dans Supabase API ; les fonctions Edge et les adaptateurs frontend utilisent ce schéma. `NEWSLETTER_SITE_URL` doit désigner l'origine publique de l'application qui héberge `/newsletter-action`; elle est requise uniquement pour les inscriptions qui envoient un email de confirmation et l'envoi des campagnes. Les endpoints `newsletter-campaign-dispatcher` et `newsletter-campaign-send` ont la vérification JWT de la passerelle désactivée ; ils appliquent respectivement le secret cron et l'authentification/contrôle de rôle eux-mêmes. Le planificateur externe doit appeler le dispatcher en POST avec `x-newsletter-cron-secret`. `project-alerts-processor` accepte soit un JWT associé à un rôle `admin`, `super_admin` ou `director`, soit le secret `PROJECT_ALERTS_CRON_SECRET` dans `x-cron-secret` pour les exécutions planifiées.

`NEWSLETTER_SITE_URL` et `NEWSLETTER_CRON_SECRET` sont déclarés dans `.env.example` et `.env.development` pour le lancement local des Edge Functions ; le secret de développement est laissé vide afin d'être généré/configuré localement. En production, les valeurs doivent être configurées comme secrets Edge Functions et dans le planificateur, pas dans une variable `VITE_*`. Supabase fournit `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` au runtime Edge ; ne pas copier la clé service-role dans le bundle frontend.

Pour configurer l'origine publique de production (exemple : `https://app.hadratech.com`) : `npx supabase secrets set NEWSLETTER_SITE_URL=https://app.hadratech.com`. Le code accepte aussi `SITE_URL` comme repli ; `NEWSLETTER_SITE_URL` reste préférable si `SITE_URL` désigne une autre origine.
