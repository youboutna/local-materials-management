# **DTO PATTERNS DOCUMENTATION**

## **🎯 OBJECTIF**
Documentation des patterns DTO pour l'architecture hexagonale HadraTech-GPI

## **📋 PATTERNS DTO PRINCIPAUX**

### **1. ProjectFormDataDTO**
```typescript
// DTO principal pour les données de formulaire de projet
export interface ProjectFormDataDTO {
  // Champs obligatoires
  title: string;
  description: string;
  location: string;
  status: 'planifié' | 'en cours' | 'terminé' | 'suspendu' | 'annulé';
  
  // Champs optionnels
  budget?: number;
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
  clientId?: string;
  projectManagerId?: string;
  
  // Métadonnées
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}
```

### **2. ProjectWorkflowData**
```typescript
// DTO pour le workflow de projet avec données structurées
export interface ProjectWorkflowData {
  projectId?: string;
  currentStep: number;
  isDraft: boolean;
  isComplete: boolean;
  projectData: ProjectFormDataDTO;
  relatedData: ProjectWorkflowRelatedData;
  metadata: {
    lastSavedAt: string;
    totalSteps: number;
    completedSteps: number;
    progressPercentage: number;
    stepName?: string;
    stepType?: string;
  };
}
```

### **3. ProjectWorkflowRelatedData**
```typescript
// DTO pour les données associées au projet
export interface ProjectWorkflowRelatedData {
  stakeholders?: StakeholderDTO[];
  phases?: Array<{
    id: string;
    phase_name: string;
    start_date?: string;
    end_date?: string;
    status: string;
  }>;
  risks?: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
  }>;
  materials?: MaterialDTO[];
  compliance?: Array<{
    id: string;
    requirement: string;
    status: 'pending' | 'approved' | 'rejected';
    documents?: string[];
  }>;
}
```

## **🔄 TRANSFORMATIONS PATTERNS**

### **1. Entity → DTO**
```typescript
// Transformer une entité domaine en DTO
export function projectToDTO(project: Project): ProjectFormDataDTO {
  return {
    title: project.title,
    description: project.description,
    location: project.location,
    status: project.status,
    budget: project.budget,
    startDate: project.startDate?.toISOString(),
    endDate: project.endDate?.toISOString(),
    latitude: project.coordinates?.latitude,
    longitude: project.coordinates?.longitude,
  };
}
```

### **2. DTO → Entity**
```typescript
// Transformer un DTO en entité domaine
export function dtoToProject(dto: ProjectFormDataDTO): Project {
  return new Project({
    id: dto.id,
    title: dto.title,
    description: dto.description,
    location: dto.location,
    status: dto.status,
    budget: dto.budget,
    startDate: dto.startDate ? new Date(dto.startDate) : undefined,
    endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    coordinates: dto.latitude && dto.longitude 
      ? new ProjectCoordinates(dto.latitude, dto.longitude) 
      : undefined,
  });
}
```

## **📊 UTILISATION DANS LES WORKFLOWS**

### **1. Initialisation**
```typescript
// Initialisation correcte avec tous les champs requis
const initialProjectData: ProjectFormDataDTO = {
  title: '',
  description: '',
  location: '',
  status: 'planifié',
  budget: 0,
  startDate: new Date().toISOString(),
  endDate: '',
  clientId: '',
  projectManagerId: '',
};
```

### **2. Mise à jour Partielle**
```typescript
// Mise à jour avec typage fort
const updateProjectData = (
  current: ProjectFormDataDTO, 
  updates: Partial<ProjectFormDataDTO>
): ProjectFormDataDTO => {
  return {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
};
```

### **3. Validation**
```typescript
// Validation des données
export function validateProjectData(data: ProjectFormDataDTO): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!data.title?.trim()) errors.push('Le titre est requis');
  if (!data.description?.trim()) errors.push('La description est requise');
  if (!data.location?.trim()) errors.push('La localisation est requise');
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

## **🎨 PATTERNS DANS LES COMPOSANTS**

### **1. Props Typées**
```typescript
interface ProjectFormProps {
  projectData: ProjectFormDataDTO;
  onUpdate: (updates: Partial<ProjectFormDataDTO>) => void;
  isEditing?: boolean;
  errors?: Record<string, string>;
}
```

### **2. État Local**
```typescript
// État local avec typage fort
const [localData, setLocalData] = useState<ProjectFormDataDTO>(initialProjectData);
const [errors, setErrors] = useState<Record<string, string>>({});
const [isDirty, setIsDirty] = useState(false);
```

### **3. Handlers**
```typescript
// Handlers typés
const handleFieldChange = (field: keyof ProjectFormDataDTO) => 
  (value: string | number) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }));
    setIsDirty(true);
  };

const handleSubmit = async () => {
  const validation = validateProjectData(localData);
  if (!validation.isValid) {
    setErrors(
      validation.errors.reduce((acc, error, index) => ({
        ...acc,
        [`field_${index}`]: error,
      }), {})
    );
    return;
  }
  
    await onSubmit(localData);
};
```

## **🔧 BEST PRACTICES**

### **1. Éviter les `any`**
```typescript
// ❌ À éviter
const data: any = {};
const result = data.someProperty;

// ✅ Préférer
const data: ProjectFormDataDTO = {
  title: '',
  description: '',
  location: '',
  status: 'planifié',
};
const result = data.title;
```

### **2. Typage Fort des Fonctions**
```typescript
// ❌ À éviter
function processData(data: any): any {
  return data;
}

// ✅ Préférer
function processData(data: ProjectFormDataDTO): ProjectFormDataDTO {
  return {
    ...data,
    updatedAt: new Date().toISOString(),
  };
}
```

### **3. Guards de Type**
```typescript
// Guards pour la sécurité du typage
function isProjectFormDataDTO(obj: unknown): obj is ProjectFormDataDTO {
  return typeof obj === 'object' && 
         obj !== null &&
         'title' in obj &&
         'description' in obj &&
         'location' in obj &&
         'status' in obj;
}
```

## **📋 RÉFÉRENCES CROISÉES**

### **DTOs Connexes**
- `StakeholderDTO` - Parties prenantes
- `MaterialDTO` - Matériaux
- `PhaseDTO` - Phases de projet
- `RiskDTO` - Analyse de risques

### **Services Connexes**
- `ProjectService` - Logique métier projet
- `ProjectWorkflowService` - Workflow de projet
- `ProjectTransformer` - Transformations DTO/Entity

---

**Documentation créée le 30 janvier 2026**
**Statut : Patterns DTO définis et documentés**
