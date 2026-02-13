# 📋 task-plan.md  
## Plan de Migration et d'Implémentation  
### Système de Gestion Intégrée des Projets d'Infrastructure  

**Projet** : HadraTech-GPI (Infrastructure Réseau, bâtiment, géolocalisé)  
**Architecture** : Hexagonale (Ports & Adapters) + Référentiel Métier  
**OBJECTIVE FINALE** : **Phase Finale - $%100$% Complète-> o missing TypeScript Error Handling and 100% DB CRUD/UI**  
**Rôle AGENT AI** : Architecte AI (explorer → analyser → concevoir)  

---
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

## 📊 **ÉTAT ACTUEL DE LA MIGRATION - todo 2026**
todo

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



## **🔍 OUTILS D'ANALYSE DYNAMIQUE**

### **Script PowerShell d'analyse (à exécuter en temps réel)**
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
todo 
---