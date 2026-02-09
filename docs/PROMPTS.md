# **PROMPTS.md - Architecture Hexagonale Migration Guide**

## **🚀 ÉTAT DE LA MIGRATION - 9 FÉVRIER 2026**

### **Statistiques de Progression**
```
📊 **MÉTRIQUES DE MIGRATION** :
- **Routes P0 Migrated** : 4/4 ✅ (Projects, ProjectEdit, ProjectDetail, PhaseDetails)
- **Services Application** : ~35 créés (85%) ✅
- **Hooks Hexagonaux** : ~20 créés (80%) ✅
- **Adapters Infrastructure** : ~15 créés (70%) ✅
- **Appels directs Supabase** : ~20 restants dans composants/hooks ⚠️
- **Progression globale** : ~75% hexagonal ✅
```

### **Routes P0 (Priorité Maximale)**
| Route | Composant | Status |
|-------|-----------|--------|
| `/projects/create` | ProjectCreationWorkflow | ✅ Migré |
| `/projects/:id/edit` | EnhancedProjectEditForm | ✅ Migré |
| `/projects/:id` | ProjectDetailByDTO | ✅ Migré |
| `/projects/:projectId/phases/:phaseId` | PhaseDetailsPage | ✅ Migré |

---

## **🎮 RÈGLES D'ARCHITECTURE**

### **RÈGLE #1 : LA FLÈCHE SACRÉE - Flow de Données**
```
UI Component → Transformer → DTO (camelCase) → Service → Domain ← Adapter(snake_case) → DB
     ↑                                                                  ↓
     └──────────────────────── Transformer ←────────────────────────────┘
```

### **RÈGLE #2 : CONVENTIONS DE CASING**

| Couche | Convention | Exemple |
|--------|------------|---------|
| Database (PostgreSQL) | `snake_case` | `project_name`, `created_at` |
| DTOs (src/dtos/*) | `camelCase` | `projectName`, `createdAt` |
| Domain Entities | `camelCase` | `Project`, `Phase` |
| Services (src/application/*) | `camelCase` | `getProjectById()` |
| Transformers | Bidirectional | `toDTO()`, `fromSupabase()` |

### **RÈGLE #3 : STRUCTURE DES FICHIERS**

```
src/
├── application/
│   └── services/           # Business logic orchestration
│       ├── ProjectService.ts
│       ├── ProjectWorkflowService.ts
│       └── ProjectAnalyticsService.ts
├── domain/
│   ├── entities/           # Pure domain objects
│   │   └── Project.ts
│   └── repositories/       # Port interfaces (contracts)
│       └── IProjectRepository.ts
├── dtos/
│   ├── entities/           # Data Transfer Objects
│   │   └── ProjectDTO.ts
│   ├── workflows/          # Workflow-specific DTOs
│   │   └── ProjectWorkflowDTOs.ts
│   └── transforms/         # Mappers between layers
│       └── ProjectTransformer.ts
├── infrastructure/
│   └── supabase/
│       └── adapters/       # Repository implementations
│           └── SupabaseProjectAdapter.ts
├── hooks/
│   └── hexagonal/          # React hooks using services
│       └── useProjectsHex.ts
└── config/
    └── referentials/       # Business rules & templates
        └── somelec/
```

### **RÈGLE #4 : TRANSFORMER METHODS**

```typescript
// Standard transformer methods
class ProjectTransformer {
  static fromSupabase(row: DatabaseRow): Project;     // DB → Domain
  static toSupabase(entity: Project): DatabaseRow;    // Domain → DB
  static toDTO(entity: Project): ProjectDTO;          // Domain → DTO
  static fromDTO(dto: ProjectDTO): Project;           // DTO → Domain
  static formToCreateRequest(form: FormData): CreateProjectDTO;  // UI → DTO
  static toUI(entity: Project): UIState;              // Domain → UI
}
```

---

## **🔧 MIGRATION CHECKLIST**

### **1. Vérifier l'Hexagonalité**
- [ ] Zéro `supabase.from()` dans components/hooks
- [ ] Zéro imports de `@/services/*` legacy
- [ ] Zéro imports de `@/types/*` (utiliser `@/dtos/*`)
- [ ] Tous les appels DB dans adapters uniquement

### **2. Appliquer la Validation Référentielle**
- [ ] Utiliser `src/config/referentials/*` pour les templates
- [ ] Valider les inputs via schémas référentiels
- [ ] Générer les phases depuis les référentiels SOMELEC

### **3. Enrichir les Couches**
- [ ] Domain entities avec logique métier pure
- [ ] Repository interfaces (ports) dans domain/
- [ ] Services orchestrant la logique
- [ ] Transformers pour mapping bidirectionnel
- [ ] Adapters implémentant les ports

### **4. Conventions de Casing**
- [ ] Services: camelCase uniquement
- [ ] Transformers: handle snake_case ↔ camelCase
- [ ] DTOs: camelCase avec BaseEntityDTO

### **5. Persistance avec Repository Pattern**
- [ ] Adapters avec transactions ACID
- [ ] Error handling via AppError
- [ ] Logging des opérations critiques

---

## **📋 ERREURS CONNUES À CORRIGER**

### **Services Application**
| Fichier | Erreur | Solution |
|---------|--------|----------|
| `CheckpointVerificationEngine.ts` | Missing exports | Import depuis fichiers corrects |
| `ConstructionPhaseService.ts` | Type mismatches | Aligner ConstructionPhase types |
| `EmployeeService.ts` | Enum mismatches | Utiliser EmployeeDepartment du DTO |
| `EnhancedValidationService.ts` | ProjectStatus mismatch | Re-exporter depuis DTO |

### **Composants UI**
| Fichier | Erreur | Solution |
|---------|--------|----------|
| `EnhancedValidationStep.tsx` | Syntax errors | Fixed ✅ |
| `WorkflowInspection.tsx` | Status strings | Utiliser types locaux |
| `UserManagementDialog.tsx` | Hook structure | Fixed ✅ |

---

## **🎯 PATTERNS RECOMMANDÉS**

### **Pattern 1: Hook Hexagonal**
```typescript
// ✅ Correct - Via Service
export function useProjectsHex() {
  const service = new ProjectService(RepositoryFactory.getProjectRepository());
  
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => service.getAllProjects()
  });
}

// ❌ Incorrect - Direct Supabase
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => supabase.from('projects').select('*') // INTERDIT!
  });
}
```

### **Pattern 2: Dual-Casing Support (Migration)**
```typescript
// UI Component avec support legacy
const phase: PhaseUIData = {
  name: rawPhase.name,
  estimatedCost: rawPhase.estimatedCost || rawPhase.estimated_cost || 0,
  startDate: rawPhase.startDate || rawPhase.start_date,
};
```

### **Pattern 3: Service avec Transformer**
```typescript
class ProjectService {
  async createProject(dto: CreateProjectDTO): Promise<ProjectDTO> {
    // 1. DTO → Domain Entity
    const entity = ProjectTransformer.fromDTO(dto);
    
    // 2. Business validation
    entity.validate();
    
    // 3. Domain → DB format
    const dbRecord = ProjectTransformer.toSupabase(entity);
    
    // 4. Persist via repository
    await this.repository.save(dbRecord);
    
    // 5. Return DTO
    return ProjectTransformer.toDTO(entity);
  }
}
```

---

## **📁 FICHIERS RÉFÉRENTIELS CLÉS**

### **Configuration**
- `src/config/referentials/somelec/` - Templates phases SOMELEC
- `src/config/constants.ts` - Constantes globales

### **DTOs Core**
- `src/dtos/entities/ProjectDTO.ts` - Project DTO principal
- `src/dtos/entities/PhaseDTO.ts` - Phase avec Steps/Milestones
- `src/dtos/workflows/ProjectWorkflowDTOs.ts` - Workflow state

### **Services Core**
- `src/application/services/ProjectService.ts` - CRUD Projects
- `src/application/services/ProjectWorkflowService.ts` - Workflows P0
- `src/application/services/ReferentialService.ts` - Templates

### **Hooks Hexagonaux**
- `src/hooks/hexagonal/useProjectsHex.ts` - Liste projects
- `src/hooks/hexagonal/useProjectWorkflowHex.ts` - Creation workflow
- `src/hooks/hexagonal/useProjectEditHex.ts` - Edition workflow

---

## **🚨 ANTI-PATTERNS À ÉVITER**

```typescript
// ❌ Import direct Supabase dans composant
import { supabase } from '@/integrations/supabase/client';

// ❌ Types legacy
import { Project } from '@/types/project';

// ❌ Services legacy
import { ProjectService } from '@/services/ProjectService';

// ❌ Snake_case dans services
const project_data = await service.get_project_by_id(id);

// ❌ Any types
const data: any = await repository.find(id);
```

---

## **✅ PATTERNS CORRECTS**

```typescript
// ✅ Import via hooks hexagonaux
import { useProjectsHex } from '@/hooks/hexagonal';

// ✅ DTOs standardisés
import { ProjectDTO, CreateProjectDTO } from '@/dtos/entities/ProjectDTO';

// ✅ Services application
import { ProjectService } from '@/application/services/ProjectService';

// ✅ CamelCase dans services
const projectData = await service.getProjectById(id);

// ✅ Types stricts
const data: ProjectDTO = await repository.find(id);
```

---

## **📊 ROUTES APPLICATION (App.tsx)**

### **Routes Publiques**
- `/` - Index
- `/auth` - Authentication
- `/contact`, `/terms`, `/policy` - Pages info
- `/supplier-*` - Portails fournisseurs

### **Routes Protégées - P0**
- `/projects` - Liste projets
- `/projects/create` - Création projet (Workflow)
- `/projects/:id` - Détail projet
- `/projects/:id/edit` - Edition projet (Workflow)
- `/projects/:projectId/phases/:phaseId` - Détail phase

### **Routes Protégées - Secondaires**
- `/materials/*` - Gestion matériaux
- `/documents` - Gestion documents
- `/tasks/*` - Gestion tâches
- `/employees` - Gestion employés
- `/users` - Admin utilisateurs
- `/inspections/*` - Inspections
- `/tender-*` - Appels d'offres
- `/suppliers` - Fournisseurs
- `/*-monitor` - Tableaux de bord monitoring
