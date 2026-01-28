# 📋 task-plan.md  
## Plan de Migration et d'Implémentation  
### Système de Gestion Intégrée des Projets d'Infrastructure  

**Projet** : HadraTech-GPI (Infrastructure Réseau, bâtiment, géolocalisé)
**Architecture** : Hexagonale (Ports & Adapters) + Référentiel Métier
**Phase** : 
**Rôle AGENT AI** : Architecte AI (explorer → analyser → concevoir)

---

## 🎯 Objectif

Mettre en œuvre, migrer ou refactoriser le système en respectant **strictement** :
- l’architecture hexagonale
- la séparation UI / Application / Domain / Infrastructure
- le référentiel métier SOMELEC
- le typage fort et centralisé
- l’absence totale de dépendances techniques dans le domaine

Ce plan est **opérationnel** et **séquentiel**.  
Les étapes doivent être suivies **dans l’ordre**.

---

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

## 🔐 **PLAN MULTI-PROVIDERS AUTH & AUTHORIZATION**

### **📊 Analyse des Tables Clés (types.ts)**

#### **🔐 Tables d'Authentification**
1. **`users`** (Supabase Auth) - Authentification principale
   - `id`, `email`, `role`, `raw_user_meta_data`, `raw_app_meta_data`
   - `last_sign_in_at`, `created_at`, `updated_at`

2. **`user_roles`** - Table d'autorisations (source de vérité)
   - `id`, `user_id`, `role_name`, `assigned_at`, `assigned_by`
   - **Clé étrangère** vers `users.id`

3. **`profiles`** - Profils utilisateurs complémentaires
   - `id`, `full_name`, `phone`, `national_id`, `avatar_url`
   - `role` (ENUM), `is_admin`, `created_at`, `updated_at`

4. **`employees`** - Employés avec hiérarchie
   - `id`, `employee_id`, `full_name`, `email`, `phone`, `position`
   - `department`, `manager_id`, `superior_id`, `user_id`

#### **🎯 ENUM des Rôles (Application SOMELEC)**
```typescript
user_role: [
  "admin",      // Administrateur système
  "manager",    // Chef de projet
  "director",   // Directeur
  "agent",      // Agent terrain
  "supplier"    // Fournisseur
]
```
*Note : "insurance_company", "practitioner", "patient" sont exclus (partagent la base mais pas cette application)*

### **🏗️ Architecture Multi-Providers Cible**

#### **📊 Flux d'Authentification**
```
UI → AuthProvider → AuthManager → AuthAdapter → Provider
     ↓                    ↓           ↓
Context ← useAuth ← AuthService ← Repository
```

#### **📊 Flux d'Autorisation**
```
UI → RoleBasedRoute → AuthorizationService → UserRoleRepository → user_roles
     ↓                    ↓                      ↓
Context ← useUserRoles ← UserService ← Repository
```

### **🚀 Plan d'Action 7 Jours**

#### **PHASE 1 : Domain Entities (JOUR 1)**
- [ ] Créer `AuthUser`, `UserRole`, `UserProfile`
- [ ] Modifier `User` entity pour intégrer `roles: UserRole[]`
- [ ] Définir les enums de rôles SOMELEC

#### **PHASE 2 : Repositories (JOUR 2)**
- [ ] `IAuthRepository`, `IUserRoleRepository`, `IUserProfileRepository`
- [ ] `SupabaseUserRoleAdapter` pour table `user_roles`
- [ ] `SupabaseUserProfileAdapter` pour table `profiles`

#### **PHASE 3 : Adapters Multi-Providers (JOUR 3)**
- [ ] `SupabaseAuthAdapter`, `KeycloakAuthAdapter`, `Auth0AuthAdapter`
- [ ] `AuthManager` pour coordination des providers
- [ ] `AuthAdapterFactory` pour création dynamique

#### **PHASE 4 : Services Application (JOUR 4)**
- [ ] `AuthService`, `AuthorizationService`, `UserRoleService`
- [ ] Intégration multi-providers
- [ ] Gestion des sessions et tokens

#### **PHASE 5 : Hooks Hexagonaux (JOUR 5)**
- [ ] `useAuth`, `useAuthorization`, `useUserRoles`
- [ ] Support multi-providers
- [ ] React Query pour cache et mutations

#### **PHASE 6 : Contextes & Providers (JOUR 6)**
- [ ] `UnifiedAuthContext`, `AuthorizationContext`
- [ ] `MultiProviderContext`
- [ ] `RoleBasedRoute` mis à jour

#### **PHASE 7 : Configuration & Validation (JOUR 7)**
- [ ] Configuration dynamique des providers
- [ ] Tests unitaires et intégration
- [ ] Documentation et déploiement

### **📋 Actions Immédiates**
- [ ] **Priorité 1* : Commencer l'implémentation par les entités de domaine

### **🎯 Bénéfices Attendus**
- ✅ Architecture 100% hexagonale
- ✅ Multi-providers auth (Supabase, Keycloak, Auth0, Database)
- ✅ Autorisation centralisée (basée sur `user_roles`)
- ✅ Switching dynamique sans redémarrage
- ✅ Configuration centralisée

### **📊 Suivi d'Implémentation**
- [x] Analyse des tables `types.ts` complétée
- [x] Plan d'architecture multi-providers défini
- [x] Rôles SOMELEC identifiés (admin, manager, director, agent, supplier)
- [ ] Script `fix-director-access.sql` exécuté
- [x] **PHASE 1** : Entités de domaine créées 
  - [x] `AuthUser` entity avec constructeur explicite et méthodes métier pures
  - [x] `UserRoleSomelec` entity pour la table user_roles
  - [x] `UserProfile` entity pour la table profiles
  - [x] `User` entity modifiée pour intégrer `roles: UserRoleSomelec[]`
  - [x] Enums de rôles SOMELEC définis
- [x] **PHASE 2** : Repositories implémentés 
  - [x] `IAuthRepositoryMulti` interface multi-providers
  - [x] `IUserRoleRepository` interface gestion rôles
  - [x] `IUserProfileRepository` interface gestion profils
  - [x] `SupabaseUserRoleAdapter` adapter pour table user_roles
  - [x] `SupabaseUserProfileAdapter` adapter pour table profiles
- [x] **PHASE 3** : Adapters multi-providers développés 
  - [x] `SupabaseAuthAdapter` (existant, mis à jour)
  - [x] `KeycloakAuthAdapter` pour authentification Keycloak
  - [x] `Auth0Adapter` pour authentification Auth0
  - [x] `AuthManager` pour coordination des providers
- [ ] **PHASE 4** : Services application codés
- [ ] **PHASE 5** : Hooks hexagonaux créés
- [ ] **PHASE 6** : Contextes unifiés déployés

### **📊 Fichiers Créés (PHASES 1-3)**
#### **Entités de Domaine**
- `src/domain/entities/AuthUser.ts` - Entité authentification multi-providers
- `src/domain/entities/UserRoleSomelec.ts` - Entité rôles SOMELEC
- `src/domain/entities/UserProfile.ts` - Entité profil utilisateur
- `src/domain/entities/User.ts` - Entité principale refactorisée

#### **Interfaces Repository**
- `src/domain/repositories/IAuthRepositoryMulti.ts` - Interface authentification multi-providers
- `src/domain/repositories/IUserRoleRepository.ts` - Interface gestion rôles
- `src/domain/repositories/IUserProfileRepository.ts` - Interface gestion profils

#### **Adapters Infrastructure**
- `src/infrastructure/supabase/adapters/SupabaseUserRoleAdapter.ts` - Adapter table user_roles
- `src/infrastructure/supabase/adapters/SupabaseUserProfileAdapter.ts` - Adapter table profiles
- `src/infrastructure/supabase/adapters/KeycloakAuthAdapterNew.ts` - Adapter Keycloak
- `src/infrastructure/supabase/adapters/Auth0AdapterNew.ts` - Adapter Auth0

#### **Services Application**
- `src/application/services/AuthManagerNew.ts` - Service central multi-providers

### **🎯 Prochaines Étapes (PHASE 4)**
- Créer `AuthService`, `AuthorizationService`, `UserRoleService`
- Intégration multi-providers dans les services
- Gestion des sessions et tokens centralisée

---