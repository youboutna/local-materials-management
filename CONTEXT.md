# CONTEXT.md - Référence Rapide HadraTech-GPI

## 🎯 Phase Actuelle
**✅ Phase 3 TERMINÉE** : Redesign de ProjectDetailByDTO (Niveau 1 - Vue Projet)
**📍 Phase 4 EN COURS** : Redesign de PhaseDetailsPage (Niveau 2 - Vue Phase)

---

## 🏗️ Architecture du Projet

### Pattern : Hexagonal Architecture (Ports & Adapters)

```
┌────────────────────────────────────────┐
│     PRESENTATION (Components)          │
│  - ProjectDetailByDTO ✅               │
│  - PhaseDetailsPage 🎯                 │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│     APPLICATION (Services)             │
│  - ProjectService                      │
│  - PhaseService                        │
│  - MilestoneService                    │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│     DOMAIN (Interfaces / Ports)        │
│  - IProjectRepository                  │
│  - IMilestoneRepository ✅             │
│  - IPhaseRepository                    │
└─────┬────────────────────────┬─────────┘
      │                        │
┌─────▼──────────┐   ┌────────▼──────────┐
│   ADAPTERS     │   │    REFERENTIAL    │
│  (Supabase)    │   │    (SOMELEC)      │
│                │   │                   │
│ Supabase       │   │ somelecReferential│
│ MilestoneAdapter│   │ ✅                │
└────────────────┘   └───────────────────┘
```

### Couplage Faible : Principe des Adapters

```typescript
// ❌ INTERDIT - Couplage fort avec Supabase
const { data } = await supabase.from('milestones').select('*');

// ✅ CORRECT - Via Interface + Adapter
interface IMilestoneRepository {
  findById(id: string): Promise<MilestoneDTO | null>;
  findByPhaseId(projectId: string, phaseId: string): Promise<MilestoneDTO[]>;
}

// Adapter Supabase (remplaçable par JavaApiAdapter, PrismaAdapter, etc.)
class SupabaseMilestoneAdapter implements IMilestoneRepository {
  // Implémentation Supabase
}

// Service utilise l'interface (pas l'adapter directement)
class MilestoneService {
  constructor(private repo: IMilestoneRepository) {}
}
```

**Avantages** :
- ✅ Backend Supabase remplaçable par Spring Boot, Node.js, etc.
- ✅ Tests faciles (mock de l'interface)
- ✅ Pas de dépendance directe à Supabase dans le code métier

---

## ✅ Phase 3 - Composants Créés

### Hiérarchie Phase 3 (`src/components/project/hierarchy/`)

- ✅ **KPICard.tsx** - Carte KPI réutilisable (4 variants)
- ✅ **ProjectHeader.tsx** - Header avec 4 KPI cards + breadcrumb
- ✅ **PhaseNode.tsx** - Nœud phase avec affichage conditionnel (3 cas)
- ✅ **ProjectHierarchyView.tsx** - Vue hiérarchique interactive
- ✅ **ProjectMatrixView.tsx** - Vue matricielle comparative
- ✅ **Intégration** - ProjectDetailByDTO.tsx

### Patterns Validés Phase 3

- ✅ Affichage conditionnel phases (avec/sans étapes/vide)
- ✅ Navigation hiérarchique (breadcrumb)
- ✅ KPIs dynamiques avec couleurs conditionnelles
- ✅ Toggle expand/collapse pour hiérarchie
- ✅ Design responsive (mobile/tablet/desktop)
- ✅ Réutilisation composants (KPICard)

---

## 🚀 Phase 4 - À Concevoir

### Composants Phase 4 (`src/components/phase/`)

#### Nouveaux Composants
- [ ] **PhaseBreadcrumb** - Navigation hiérarchique (Projet > Phase)
- [ ] **PhaseHeader** - En-tête phase (réutilise KPICard)
- [ ] **PhaseKPIGrid** - KPIs spécifiques phase
- [ ] **PhaseReferentialBadge** - Badge conformité référentiel SOMELEC
- [ ] **InspectionWarning** - Alerte inspections requises
- [ ] **PhaseWithStepsView** - Vue phase avec étapes (cas 1)
- [ ] **PhaseWithMilestonesView** - Vue phase sans étapes (cas 2)
- [ ] **PhaseMetrics** - Métriques et statistiques
- [ ] **PhaseActions** - Actions conditionnelles

#### Sous-composants
- [ ] **StepCard** - Carte étape cliquable
- [ ] **MilestoneCard** - Carte jalon
- [ ] **PhaseProgressTimeline** - Timeline progression

---

## 📚 Référentiel Métier SOMELEC

### Localisation
`src/config/referentials/*`

### Structure Standard

Le référentiel SOMELEC (exemple dans `src/config/referentials/*`) définit la **structure standardisée** pour tous les projets d'infrastructure électrique avec bailleurs de fonds :

```typescript
interface ProjectReferential {
  code: 'SOMELEC_INFRA';
  phases: ReferentialPhase[];  // 4 phases standard
  requiresEngineeringConsultant: true;
  requiresDonorApproval: true;
  requiresMinistryApproval: true;
  paymentWorkflow: 'standard' | 'simplified' | 'custom';
}
```

### 4 Phases Standard

```
1️⃣ PRE_FEASIBILITY (Pré-faisabilité et Études Préliminaires)
   ├─ NEEDS_ASSESSMENT (Analyse des besoins)
   │   ├─ COLLECT_REQUIREMENTS (15 jours)
   │   └─ MARKET_STUDY (20 jours)
   └─ FEASIBILITY_STUDY (Étude de faisabilité)
       ├─ TECHNICAL_FEASIBILITY (30 jours)
       └─ FINANCIAL_FEASIBILITY (25 jours)

2️⃣ DESIGN_DAO (Conception et Dossier d'Appel d'Offres)
   ├─ PRELIMINARY_DESIGN (Avant-projet)
   │   ├─ TOPO_SURVEY (20 jours) ⚠️ Inspection
   │   └─ ENVIRONMENTAL_IMPACT (30 jours)
   ├─ FINAL_DESIGN (Études techniques détaillées)
   │   ├─ CIVIL_ENGINEERING (45 jours)
   │   └─ ELECTRICAL_DESIGN (40 jours)
   └─ TENDER_DOSSIER (Rédaction DAO)
       ├─ DAO_PREPARATION (30 jours)
       └─ DAO_VALIDATION (15 jours)

3️⃣ EXECUTION (Exécution des travaux)
   ├─ MOBILIZATION (Mobilisation chantier)
   │   └─ SITE_INSTALLATION (10 jours) ⚠️ Inspection
   └─ CONSTRUCTION (Travaux principaux)
       ├─ FOUNDATIONS (30 jours) ⚠️ Inspection
       ├─ STRUCTURAL (60 jours) ⚠️ Inspection
       └─ ELECTRICAL_INSTALLATION (45 jours) ⚠️ Inspection

4️⃣ HANDOVER (Réception & Garantie)
   ├─ PROVISIONAL_ACCEPTANCE (Réception provisoire)
   │   └─ FINAL_INSPECTION (7 jours) ⚠️ Inspection
   └─ FINAL_ACCEPTANCE (Réception définitive)
       └─ GUARANTEE_RELEASE (5 jours)
```

### Règles Métier Référentiel

```typescript
interface ReferentialTask {
  code: string;
  label: MultiLanguageLabel;     // fr, ar, en
  requiresInspection: boolean;   // ⚠️ → Créer inspection auto
  requiresEngineerApproval: boolean;  // ⚠️ → Workflow validation
  estimatedDurationDays?: number;     // Planning automatique
}
```

**Logique Conditionnelle :**
```typescript
SI task.requiresInspection === true ALORS
  → MilestoneService.createInspection() automatiquement
  → Afficher InspectionWarning dans UI
  → Badge "Inspection requise"

SI task.requiresEngineerApproval === true ALORS
  → Workflow validation consultant ingénierie
  → Notification consultant
  → Badge "Validation consultant"

SI project.requiresDonorApproval === true ALORS
  → Validation supplémentaire bailleur (BM, BAD, BID, etc.)
  → Workflow approbation étendu
```

### Multilingue (FR, AR, EN)

```typescript
interface MultiLanguageLabel {
  code: string;
  fr: string;  // Français (principale)
  ar: string;  // العربية
  en: string;  // English
}

// Exemple
phase.label.fr → "Conception et DAO"
phase.label.ar → "التصميم وملف المناقصة"
phase.label.en → "Design and Tender Dossier"
```

---

## 🔗 Adapters & Repositories Disponibles

### Structure

```
src/repositories/
├── interfaces/             # 📍 PORTS (Interfaces)
│   ├── IRepository.ts     # Interface de base
│   ├── IMilestoneRepository.ts ✅
│   ├── IProjectRepository.ts
│   └── IPhaseRepository.ts
│
└── adapters/              # 📍 ADAPTERS (Implémentations)
    ├── SupabaseMilestoneAdapter.ts ✅
    │   → Implémente IMilestoneRepository
    │   → Peut être remplacé par JavaApiAdapter, PrismaAdapter
    │
    ├── SupabaseProjectAdapter.ts
    └── SupabasePhaseAdapter.ts
```

### Exemple : IMilestoneRepository

```typescript
interface IMilestoneRepository extends IRepository<MilestoneDTO, MilestoneFormDTO> {
  // Méthodes base (IRepository)
  findById(id: string): Promise<MilestoneDTO | null>;
  findAll(filters?: Record<string, any>): Promise<MilestoneDTO[]>;
  create(data: MilestoneFormDTO): Promise<MilestoneDTO>;
  update(id: string, data: Partial<MilestoneFormDTO>): Promise<MilestoneDTO>;
  delete(id: string): Promise<void>;
  
  // Méthodes spécifiques métier
  findByProjectId(projectId: string): Promise<MilestoneDTO[]>;
  findByPhaseId(projectId: string, phaseId: string): Promise<MilestoneDTO[]>;
  findCriticalPath(projectId: string): Promise<MilestoneDTO[]>;
  findOverdue(projectId: string): Promise<MilestoneDTO[]>;
  findUpcoming(projectId: string, days: number): Promise<MilestoneDTO[]>;
  createBulk(projectId: string, milestones: MilestoneFormDTO[]): Promise<MilestoneDTO[]>;
  deleteTemplateByPhaseId(phaseId: string): Promise<void>;
  updateStatus(id: string, status: string, completedDate?: string): Promise<MilestoneDTO>;
}
```

### Adapters Alternatifs Possibles

```typescript
// Actuellement : Supabase
class SupabaseMilestoneAdapter implements IMilestoneRepository { ... }

// Futur : Spring Boot API
class JavaApiMilestoneAdapter implements IMilestoneRepository {
  async findById(id: string) {
    return fetch(`/api/milestones/${id}`).then(r => r.json());
  }
}

// Futur : Node.js + Prisma
class PrismaMilestoneAdapter implements IMilestoneRepository {
  async findById(id: string) {
    return prisma.milestone.findUnique({ where: { id } });
  }
}

// Futur : PostGIS (requêtes spatiales)
class PostGISMilestoneAdapter implements IMilestoneRepository {
  // Requêtes géospatiales avancées
}
```

---

## ⚠️ Règles CRITIQUES

### 1. Architecture Hexagonale

```typescript
// ❌ INTERDIT - Component accède directement à Supabase
import { supabase } from '@/integrations/supabase/client';
const { data } = await supabase.from('milestones').select('*');

// ❌ INTERDIT - Component accède directement à l'Adapter
import { SupabaseMilestoneAdapter } from '@/repositories/adapters/...';
const adapter = new SupabaseMilestoneAdapter();

// ✅ CORRECT - Component utilise Service
import { MilestoneService } from '@/services/MilestoneService';
const milestones = await MilestoneService.findByPhaseId(projectId, phaseId);

// ✅ CORRECT - Service utilise Interface (pas Adapter)
class MilestoneService {
  constructor(private repo: IMilestoneRepository) {}
}

// ✅ CORRECT - Adapter implémente Interface
class SupabaseMilestoneAdapter implements IMilestoneRepository {
  // Implémentation
}
```

### 2. Exploration des Composants Existants

**TOUJOURS chercher d'abord avant de concevoir :**

```
ÉTAPE 1 : EXPLORATION
├─ src/components/project/hierarchy/ → Composants Phase 3 ✅
├─ src/repositories/adapters/ → Adapters disponibles ✅
├─ src/config/referentials/* → Référentiel ✅
└─ src/services/ → Services existants ✅

ÉTAPE 2 : ANALYSE
├─ Quels composants sont réutilisables ?
├─ Quels adapters puis-je utiliser ?
├─ Le référentiel SOMELEC s'applique-t-il ?
└─ Quelles dépendances existent ?

ÉTAPE 3 : CONCEPTION
└─ Concevoir en réutilisant au maximum
```

### 3. Affichage Conditionnel des Phases

```typescript
// CAS 1 : Phase AVEC étapes (standard SOMELEC)
// → Référence : somelecReferential.phases[i].steps
// → Afficher hiérarchie : Phase → Étapes → Jalons
// → Vérifier requiresInspection flags

// CAS 2 : Phase SANS étapes AVEC jalons (personnalisée)
// → Phase hors référentiel SOMELEC
// → Afficher jalons directs
// → Badge "Phase personnalisée"

// CAS 3 : Phase VIDE
// → Proposer création depuis référentiel SOMELEC
// → Bouton "Créer à partir du référentiel"
// → Modal sélection phase standard (PRE_FEASIBILITY, DESIGN_DAO, etc.)
```

---

## 📊 Structure des Données

### Projet (ProjectDTO)
```typescript
interface Project {
  id: string;
  title: string;
  progress: number;
  budget: number;
  status: ProjectStatus;
  phases: Phase[];
  // Métadonnées SOMELEC
  requiresEngineeringConsultant?: boolean;
  requiresDonorApproval?: boolean;
  financing_source?: string; // BM, BAD, BID, AFD...
}
```

### Phase
```typescript
interface Phase {
  id: string;
  title: string;
  progress: number;
  budget: number;
  project_id: string;
  
  // Référence au référentiel SOMELEC
  reference_code?: string; // 'PRE_FEASIBILITY' | 'DESIGN_DAO' | 'EXECUTION' | 'HANDOVER'
  
  // Hiérarchie
  steps: Step[];           // Peut être []
  milestones: Milestone[]; // Si pas de steps
}
```

### Jalon (MilestoneDTO)
```typescript
interface MilestoneDTO {
  id: string;
  project_id: string;
  phase_id?: string;
  title: string;
  target_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  type: 'checkpoint' | 'inspection' | 'validation' | 'payment';
  priority: 'normal' | 'high' | 'critical';
  
  // Métadonnées référentiel
  is_from_template?: boolean;
  template_id?: string;
  
  // Workflows SOMELEC
  approval_status?: string;
  approved_by?: string;
  
  // Dépendances
  dependencies?: string[]; // IDs jalons prédécesseurs
  is_on_critical_path?: boolean;
}
```

---

## 🎨 Design System

### Composants Shadcn/ui
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
```

### Icônes Lucide React
```typescript
import {
  Building,      // Projet
  Flag,          // Phase
  ListTodo,      // Étape
  Target,        // Jalon
  CheckCircle,   // Validation
  AlertTriangle, // Inspection requise
  FileCheck,     // Approbation
  Users,         // Consultant
  Wallet,        // Bailleur
} from 'lucide-react';
```

### Couleurs Référentiel
```typescript
const referentialColors = {
  'standard': 'bg-blue-50 text-blue-600 border-blue-200',      // Phase SOMELEC, consturction referentail ...
  'custom': 'bg-purple-50 text-purple-600 border-purple-200',  // Phase personnalisée
  'inspection': 'bg-orange-50 text-orange-600 border-orange-200',
  'approval': 'bg-green-50 text-green-600 border-green-200',
};
```

---

## 🔧 Services Disponibles

```typescript
// Projects
import { ProjectService } from '@/services/ProjectService';
await ProjectService.getProjectById(id);

// Phases
import { PhaseService } from '@/services/PhaseService';
await PhaseService.getPhasesByProjectId(projectId);

// Milestones (avec adapter)
import { MilestoneService } from '@/services/MilestoneService';
await MilestoneService.findByPhaseId(projectId, phaseId);
await MilestoneService.createFromReferential(projectId, 'EXECUTION'); // Utilise référentiel

// Inspections
import { InspectionService } from '@/services/InspectionService';
await InspectionService.createInspection(milestoneId, data);
```

---

## 💡 Quick Reference Phase 4

### Workflow de Conception

```
1. EXPLORATION des composants existants
   ↓
2. ANALYSE du référentiel SOMELEC
   ↓
3. IDENTIFICATION des adapters disponibles
   ↓
4. CONCEPTION de l'architecture
   ↓
5. DOCUMENTATION & Checklist
```

### Composants Réutilisables (Phase 3)

```typescript
// Déjà disponibles
<KPICard />             // ✅ Phase 3
<PhaseNode />           // ✅ Phase 3 (affichage conditionnel)
<Badge />               // Shadcn/ui
<Progress />            // Shadcn/ui
```

### Exemples d'Utilisation Référentiel

```typescript
// Charger phase standard
const executionPhase = somelecReferential.phases.find(
  p => p.code === 'EXECUTION'
);

// Vérifier inspections requises
const requiresInspection = executionPhase.steps.some(step =>
  step.tasks.some(task => task.requiresInspection)
);

// Créer jalons depuis référentiel
await MilestoneService.createFromReferential(projectId, 'EXECUTION');
```

---

## 📚 Fichiers Clés

### Documentation
- `docs/task-plan.md` - Plan Phase 4
- `docs/architecture.md` - Architecture technique
- `PROMPTS.md` - Templates prompts

### Code Existant (Phase 3 ✅)
- `src/components/project/hierarchy/KPICard.tsx`
- `src/components/project/hierarchy/ProjectHeader.tsx`
- `src/components/project/hierarchy/PhaseNode.tsx`

### Adapters & Interfaces
- `src/repositories/interfaces/IMilestoneRepository.ts` ✅
- `src/repositories/adapters/SupabaseMilestoneAdapter.ts` ✅

### Référentiel
- `src/config/referentials/*` ✅

### Services
- `src/services/ProjectService.ts`
- `src/services/MilestoneService.ts`

---

**Projet** : HadraTech-GPI (Infrastructure SOMELEC)
**Architecture** : Hexagonale (Ports & Adapters) + Référentiel Métier
**Phase** : Phase 3 ✅ → Phase 4 📍
**Rôle AGENT AI** : Architecte AI (explorer → analyser → concevoir)