// ============================================================
// src/contexts/ProjectWorkflowContext.tsx
// ============================================================
/**
 * Project Workflow Context
 * Gère l'état du workflow de création/édition de projet
 * Permet de stocker les données temporaires avant persistance
 * 
 * ⚠️ Sans ORM - Utilisation d'un state contextuel
 * ⚠️ Gère le mode CREATE (projet non persisté) et EDIT (projet persisté)
 * 
 * Hexagonal Flow:
 * Component → Context → Service → Repository → DB
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { ProjectWorkflowData } from '@/dtos/workflows/ProjectWorkflowDTOs';
import { ProjectDTO, CreateProjectDTO } from '@/dtos/entities/ProjectDTO';
import { ComplianceDataDTO } from '@/dtos/workflows/ProjectWorkflowDTOs';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { InsuranceCertificateDTO } from '@/dtos/entities/InsuranceDTO';
import { BankGuaranteeDTO } from '@/dtos/entities/BankGuaranteeDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';
import { StakeholderDTO } from '@/dtos/entities/StakeholderDTO';
import { MilestoneDTO } from '@/dtos/entities/MilestoneDTO';
import { TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';

// ============================================================
// Types
// ============================================================

/**
 * État complet du workflow
 */
export interface WorkflowState {
  // Données principales du projet
  projectData: Partial<ProjectDTO>;
  projectId: string | null;
  
  // Données liées (stockage temporaire avant persistance)
  relatedData: {
    phases: PhaseDTO[];
    risks: RiskDTO[];
    stakeholders: StakeholderDTO[];
    milestones: MilestoneDTO[];
    tasks: TaskAssignmentDTO[];
    documents: DocumentDTO[];
    insurancePolicies: InsuranceCertificateDTO[];
    bankGuarantees: BankGuaranteeDTO[];
    compliance: ComplianceDataDTO;
    strategyLinks: any[];
    budgetLinks: any[];
  };
  
  // État du workflow
  currentStep: number;
  isDraft: boolean;
  isComplete: boolean;
  isPersisted: boolean;
  lastSavedAt: string | null;
  
  // Métadonnées
  metadata: {
    totalSteps: number;
    completedSteps: number;
    progressPercentage: number;
    isDirty: boolean;
    validationErrors: Record<string, string[]>;
    mode: 'create' | 'edit';
  };
}

/**
 * Actions du workflow
 */
export type WorkflowAction =
  // Données du projet
  | { type: 'SET_PROJECT_DATA'; payload: Partial<ProjectDTO> }
  | { type: 'SET_PROJECT_ID'; payload: string }
  | { type: 'UPDATE_PROJECT_FIELD'; payload: { field: keyof ProjectDTO; value: any } }
  
  // Données liées
  | { type: 'SET_RELATED_DATA'; payload: Partial<WorkflowState['relatedData']> }
  | { type: 'SET_COMPLIANCE'; payload: ComplianceDataDTO }
  
  // Ajouts
  | { type: 'ADD_DOCUMENT'; payload: DocumentDTO }
  | { type: 'ADD_INSURANCE'; payload: InsuranceCertificateDTO }
  | { type: 'ADD_BANK_GUARANTEE'; payload: BankGuaranteeDTO }
  | { type: 'ADD_PHASE'; payload: PhaseDTO }
  | { type: 'ADD_RISK'; payload: RiskDTO }
  | { type: 'ADD_STAKEHOLDER'; payload: StakeholderDTO }
  | { type: 'ADD_MILESTONE'; payload: MilestoneDTO }
  | { type: 'ADD_TASK'; payload: TaskAssignmentDTO }
  
  // Suppressions
  | { type: 'REMOVE_DOCUMENT'; payload: string }
  | { type: 'REMOVE_INSURANCE'; payload: string }
  | { type: 'REMOVE_BANK_GUARANTEE'; payload: string }
  | { type: 'REMOVE_PHASE'; payload: string }
  | { type: 'REMOVE_RISK'; payload: string }
  | { type: 'REMOVE_STAKEHOLDER'; payload: string }
  | { type: 'REMOVE_MILESTONE'; payload: string }
  | { type: 'REMOVE_TASK'; payload: string }
  
  // État du workflow
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_PERSISTED'; payload: boolean }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_COMPLETE'; payload: boolean }
  | { type: 'SET_DRAFT'; payload: boolean }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string[]> }
  | { type: 'SET_MODE'; payload: 'create' | 'edit' }
  
  // Réinitialisation
  | { type: 'RESET_WORKFLOW' }
  | { type: 'LOAD_WORKFLOW_DATA'; payload: Partial<WorkflowState> };

// ============================================================
// Initial State
// ============================================================

const initialState: WorkflowState = {
  projectData: {},
  projectId: null,
  relatedData: {
    phases: [],
    risks: [],
    stakeholders: [],
    milestones: [],
    tasks: [],
    documents: [],
    insurancePolicies: [],
    bankGuarantees: [],
    compliance: {
      regulations: [],
      certifications: [],
      standards: [],
      status: 'pending',
      documents: []
    },
    strategyLinks: [],
    budgetLinks: []
  },
  currentStep: 1,
  isDraft: true,
  isComplete: false,
  isPersisted: false,
  lastSavedAt: null,
  metadata: {
    totalSteps: 8,
    completedSteps: 0,
    progressPercentage: 0,
    isDirty: false,
    validationErrors: {},
    mode: 'create'
  }
};

// ============================================================
// Reducer
// ============================================================

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    // ============================================================
    // Données du projet
    // ============================================================
    
    case 'SET_PROJECT_DATA':
      return {
        ...state,
        projectData: { ...state.projectData, ...action.payload },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'SET_PROJECT_ID':
      return {
        ...state,
        projectId: action.payload,
        isPersisted: true,
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'UPDATE_PROJECT_FIELD':
      return {
        ...state,
        projectData: { ...state.projectData, [action.payload.field]: action.payload.value },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    // ============================================================
    // Données liées
    // ============================================================
      
    case 'SET_RELATED_DATA':
      return {
        ...state,
        relatedData: { ...state.relatedData, ...action.payload },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'SET_COMPLIANCE':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          compliance: action.payload
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    // ============================================================
    // Ajouts
    // ============================================================
      
    case 'ADD_DOCUMENT':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          documents: [...state.relatedData.documents, action.payload]
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'ADD_INSURANCE':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          insurancePolicies: [...state.relatedData.insurancePolicies, action.payload]
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'ADD_BANK_GUARANTEE':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          bankGuarantees: [...state.relatedData.bankGuarantees, action.payload]
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'ADD_PHASE':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          phases: [...state.relatedData.phases, action.payload]
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'ADD_RISK':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          risks: [...state.relatedData.risks, action.payload]
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'ADD_STAKEHOLDER':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          stakeholders: [...state.relatedData.stakeholders, action.payload]
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'ADD_MILESTONE':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          milestones: [...state.relatedData.milestones, action.payload]
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'ADD_TASK':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          tasks: [...state.relatedData.tasks, action.payload]
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    // ============================================================
    // Suppressions
    // ============================================================
      
    case 'REMOVE_DOCUMENT':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          documents: state.relatedData.documents.filter(d => d.id !== action.payload)
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'REMOVE_INSURANCE':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          insurancePolicies: state.relatedData.insurancePolicies.filter(p => p.id !== action.payload)
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'REMOVE_BANK_GUARANTEE':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          bankGuarantees: state.relatedData.bankGuarantees.filter(g => g.id !== action.payload)
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'REMOVE_PHASE':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          phases: state.relatedData.phases.filter(p => p.id !== action.payload)
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'REMOVE_RISK':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          risks: state.relatedData.risks.filter(r => r.id !== action.payload)
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'REMOVE_STAKEHOLDER':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          stakeholders: state.relatedData.stakeholders.filter(s => s.id !== action.payload)
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'REMOVE_MILESTONE':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          milestones: state.relatedData.milestones.filter(m => m.id !== action.payload)
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    case 'REMOVE_TASK':
      return {
        ...state,
        relatedData: {
          ...state.relatedData,
          tasks: state.relatedData.tasks.filter(t => t.id !== action.payload)
        },
        metadata: { ...state.metadata, isDirty: true }
      };
      
    // ============================================================
    // État du workflow
    // ============================================================
      
    case 'SET_CURRENT_STEP':
      const newCompletedSteps = Math.max(state.metadata.completedSteps, action.payload - 1);
      return {
        ...state,
        currentStep: action.payload,
        metadata: {
          ...state.metadata,
          completedSteps: newCompletedSteps,
          progressPercentage: Math.round((newCompletedSteps / state.metadata.totalSteps) * 100)
        }
      };
      
    case 'SET_PERSISTED':
      return {
        ...state,
        isPersisted: action.payload,
        lastSavedAt: action.payload ? new Date().toISOString() : null
      };
      
    case 'SET_DIRTY':
      return {
        ...state,
        metadata: { ...state.metadata, isDirty: action.payload }
      };
      
    case 'SET_COMPLETE':
      return {
        ...state,
        isComplete: action.payload,
        isDraft: !action.payload
      };
      
    case 'SET_DRAFT':
      return {
        ...state,
        isDraft: action.payload,
        isComplete: !action.payload
      };
      
    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        metadata: { ...state.metadata, validationErrors: action.payload }
      };
      
    case 'SET_MODE':
      return {
        ...state,
        metadata: { ...state.metadata, mode: action.payload }
      };
      
    // ============================================================
    // Réinitialisation et chargement
    // ============================================================
      
    case 'RESET_WORKFLOW':
      return {
        ...initialState,
        metadata: { ...initialState.metadata, mode: state.metadata.mode }
      };
      
    case 'LOAD_WORKFLOW_DATA':
      return {
        ...state,
        ...action.payload,
        metadata: {
          ...state.metadata,
          ...(action.payload.metadata || {})
        },
        isPersisted: true
      };
      
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

export interface WorkflowContextValue {
  // État
  state: WorkflowState;
  
  // Propriétés calculées
  isPersisted: boolean;
  canManageSubObjects: boolean;
  isCreateMode: boolean;
  isEditMode: boolean;
  projectTitle: string;
  projectBudget: number;
  
  // Actions - Données du projet
  setProjectData: (data: Partial<ProjectDTO>) => void;
  setProjectId: (id: string) => void;
  updateProjectField: (field: keyof ProjectDTO, value: any) => void;
  
  // Actions - Données liées
  setRelatedData: (data: Partial<WorkflowState['relatedData']>) => void;
  setCompliance: (compliance: ComplianceDataDTO) => void;
  
  // Actions - Ajouts
  addDocument: (doc: DocumentDTO) => void;
  addInsurance: (policy: InsuranceCertificateDTO) => void;
  addBankGuarantee: (guarantee: BankGuaranteeDTO) => void;
  addPhase: (phase: PhaseDTO) => void;
  addRisk: (risk: RiskDTO) => void;
  addStakeholder: (stakeholder: StakeholderDTO) => void;
  addMilestone: (milestone: MilestoneDTO) => void;
  addTask: (task: TaskAssignmentDTO) => void;
  
  // Actions - Suppressions
  removeDocument: (id: string) => void;
  removeInsurance: (id: string) => void;
  removeBankGuarantee: (id: string) => void;
  removePhase: (id: string) => void;
  removeRisk: (id: string) => void;
  removeStakeholder: (id: string) => void;
  removeMilestone: (id: string) => void;
  removeTask: (id: string) => void;
  
  // Actions - État du workflow
  setCurrentStep: (step: number) => void;
  setPersisted: (persisted: boolean) => void;
  setDirty: (dirty: boolean) => void;
  setComplete: (complete: boolean) => void;
  setDraft: (draft: boolean) => void;
  setValidationErrors: (errors: Record<string, string[]>) => void;
  setMode: (mode: 'create' | 'edit') => void;
  
  // Actions - Réinitialisation et chargement
  resetWorkflow: () => void;
  loadWorkflowData: (data: Partial<WorkflowState>) => void;
  
  // Helpers
  getStepData: (step: number) => any;
  getProjectDataForPersistence: () => CreateProjectDTO;
  getRelatedDataForPersistence: () => WorkflowState['relatedData'];
  getWorkflowDataForApi: () => ProjectWorkflowData;
  isStepValid: (step: number) => boolean;
  getStepValidationErrors: (step: number) => string[];
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

export interface WorkflowProviderProps {
  children: ReactNode;
  initialData?: Partial<WorkflowState>;
  mode?: 'create' | 'edit';
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({
  children,
  initialData,
  mode = 'create'
}) => {
  const [state, dispatch] = useReducer(workflowReducer, {
    ...initialState,
    ...initialData,
    metadata: {
      ...initialState.metadata,
      ...(initialData?.metadata || {}),
      mode
    }
  });

  // ============================================================
  // Propriétés calculées
  // ============================================================

  const isPersisted = state.isPersisted && !!state.projectId;
  const canManageSubObjects = isPersisted && state.metadata.mode === 'edit';
  const isCreateMode = state.metadata.mode === 'create' || !isPersisted;
  const isEditMode = state.metadata.mode === 'edit' && isPersisted;
  const projectTitle = state.projectData.title || '';
  const projectBudget = state.projectData.budget || 0;

  // ============================================================
  // Actions - Données du projet
  // ============================================================

  const setProjectData = useCallback((data: Partial<ProjectDTO>) => {
    dispatch({ type: 'SET_PROJECT_DATA', payload: data });
  }, []);

  const setProjectId = useCallback((id: string) => {
    dispatch({ type: 'SET_PROJECT_ID', payload: id });
  }, []);

  const updateProjectField = useCallback((field: keyof ProjectDTO, value: any) => {
    dispatch({ type: 'UPDATE_PROJECT_FIELD', payload: { field, value } });
  }, []);

  // ============================================================
  // Actions - Données liées
  // ============================================================

  const setRelatedData = useCallback((data: Partial<WorkflowState['relatedData']>) => {
    dispatch({ type: 'SET_RELATED_DATA', payload: data });
  }, []);

  const setCompliance = useCallback((compliance: ComplianceDataDTO) => {
    dispatch({ type: 'SET_COMPLIANCE', payload: compliance });
  }, []);

  // ============================================================
  // Actions - Ajouts
  // ============================================================

  const addDocument = useCallback((doc: DocumentDTO) => {
    dispatch({ type: 'ADD_DOCUMENT', payload: doc });
  }, []);

  const addInsurance = useCallback((policy: InsuranceCertificateDTO) => {
    dispatch({ type: 'ADD_INSURANCE', payload: policy });
  }, []);

  const addBankGuarantee = useCallback((guarantee: BankGuaranteeDTO) => {
    dispatch({ type: 'ADD_BANK_GUARANTEE', payload: guarantee });
  }, []);

  const addPhase = useCallback((phase: PhaseDTO) => {
    dispatch({ type: 'ADD_PHASE', payload: phase });
  }, []);

  const addRisk = useCallback((risk: RiskDTO) => {
    dispatch({ type: 'ADD_RISK', payload: risk });
  }, []);

  const addStakeholder = useCallback((stakeholder: StakeholderDTO) => {
    dispatch({ type: 'ADD_STAKEHOLDER', payload: stakeholder });
  }, []);

  const addMilestone = useCallback((milestone: MilestoneDTO) => {
    dispatch({ type: 'ADD_MILESTONE', payload: milestone });
  }, []);

  const addTask = useCallback((task: TaskAssignmentDTO) => {
    dispatch({ type: 'ADD_TASK', payload: task });
  }, []);

  // ============================================================
  // Actions - Suppressions
  // ============================================================

  const removeDocument = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_DOCUMENT', payload: id });
  }, []);

  const removeInsurance = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_INSURANCE', payload: id });
  }, []);

  const removeBankGuarantee = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_BANK_GUARANTEE', payload: id });
  }, []);

  const removePhase = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_PHASE', payload: id });
  }, []);

  const removeRisk = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_RISK', payload: id });
  }, []);

  const removeStakeholder = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_STAKEHOLDER', payload: id });
  }, []);

  const removeMilestone = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_MILESTONE', payload: id });
  }, []);

  const removeTask = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TASK', payload: id });
  }, []);

  // ============================================================
  // Actions - État du workflow
  // ============================================================

  const setCurrentStep = useCallback((step: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  }, []);

  const setPersisted = useCallback((persisted: boolean) => {
    dispatch({ type: 'SET_PERSISTED', payload: persisted });
  }, []);

  const setDirty = useCallback((dirty: boolean) => {
    dispatch({ type: 'SET_DIRTY', payload: dirty });
  }, []);

  const setComplete = useCallback((complete: boolean) => {
    dispatch({ type: 'SET_COMPLETE', payload: complete });
  }, []);

  const setDraft = useCallback((draft: boolean) => {
    dispatch({ type: 'SET_DRAFT', payload: draft });
  }, []);

  const setValidationErrors = useCallback((errors: Record<string, string[]>) => {
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
  }, []);

  const setMode = useCallback((mode: 'create' | 'edit') => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  // ============================================================
  // Actions - Réinitialisation et chargement
  // ============================================================

  const resetWorkflow = useCallback(() => {
    dispatch({ type: 'RESET_WORKFLOW' });
  }, []);

  const loadWorkflowData = useCallback((data: Partial<WorkflowState>) => {
    dispatch({ type: 'LOAD_WORKFLOW_DATA', payload: data });
  }, []);

  // ============================================================
  // Helpers
  // ============================================================

  const getStepData = useCallback((step: number): any => {
    switch (step) {
      case 1: return state.projectData;
      case 2: return state.relatedData.stakeholders;
      case 3: return {
        location: state.projectData.location,
        coordinates: state.projectData.coordinates,
        interventionZones: state.projectData.interventionZones
      };
      case 4: return state.relatedData.phases;
      case 5: return state.relatedData.risks;
      case 6: return state.relatedData.compliance;
      case 7: return {
        strategyLinks: state.relatedData.strategyLinks,
        budgetLinks: state.relatedData.budgetLinks
      };
      case 8: return {
        projectData: state.projectData,
        relatedData: state.relatedData
      };
      default: return null;
    }
  }, [state]);

  const getProjectDataForPersistence = useCallback((): CreateProjectDTO => {
    const data = state.projectData;
    return {
      title: data.title || '',
      description: data.description || '',
      location: data.location || '',
      budget: data.budget || 0,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate,
      status: data.status || 'draft',
      progress: data.progress || 0,
      teamSize: data.teamSize || 1,
      projectReference: data.projectReference,
      category: data.category,
      priority: data.priority,
      thumbnail: data.thumbnail,
      financingSource: data.financingSource,
      marketType: data.marketType,
      selectionMode: data.selectionMode,
      mainContractor: data.mainContractor,
      allowsInitialPayment: data.allowsInitialPayment,
      initialPaymentPercentage: data.initialPaymentPercentage,
      currentPhase: data.currentPhase,
      currentStage: data.currentStage,
      latitude: data.latitude,
      longitude: data.longitude,
      geographicZone: data.geographicZone,
      terrainType: data.terrainType,
    };
  }, [state.projectData]);

  const getRelatedDataForPersistence = useCallback((): WorkflowState['relatedData'] => {
    return state.relatedData;
  }, [state.relatedData]);

  const getWorkflowDataForApi = useCallback((): ProjectWorkflowData => {
    return {
      projectId: state.projectId || undefined,
      currentStep: state.currentStep,
      isDraft: state.isDraft,
      isComplete: state.isComplete,
      projectData: state.projectData as ProjectDTO,
      relatedData: state.relatedData,
      metadata: {
        lastSavedAt: state.lastSavedAt || new Date().toISOString(),
        totalSteps: state.metadata.totalSteps,
        completedSteps: state.metadata.completedSteps,
        progressPercentage: state.metadata.progressPercentage,
      }
    };
  }, [state]);

  const isStepValid = useCallback((step: number): boolean => {
    const errors = state.metadata.validationErrors[step] || [];
    return errors.length === 0;
  }, [state.metadata.validationErrors]);

  const getStepValidationErrors = useCallback((step: number): string[] => {
    return state.metadata.validationErrors[step] || [];
  }, [state.metadata.validationErrors]);

  // ============================================================
  // Valeur du contexte
  // ============================================================

  const value: WorkflowContextValue = {
    // État
    state,
    
    // Propriétés calculées
    isPersisted,
    canManageSubObjects,
    isCreateMode,
    isEditMode,
    projectTitle,
    projectBudget,
    
    // Actions - Données du projet
    setProjectData,
    setProjectId,
    updateProjectField,
    
    // Actions - Données liées
    setRelatedData,
    setCompliance,
    
    // Actions - Ajouts
    addDocument,
    addInsurance,
    addBankGuarantee,
    addPhase,
    addRisk,
    addStakeholder,
    addMilestone,
    addTask,
    
    // Actions - Suppressions
    removeDocument,
    removeInsurance,
    removeBankGuarantee,
    removePhase,
    removeRisk,
    removeStakeholder,
    removeMilestone,
    removeTask,
    
    // Actions - État du workflow
    setCurrentStep,
    setPersisted,
    setDirty,
    setComplete,
    setDraft,
    setValidationErrors,
    setMode,
    
    // Actions - Réinitialisation et chargement
    resetWorkflow,
    loadWorkflowData,
    
    // Helpers
    getStepData,
    getProjectDataForPersistence,
    getRelatedDataForPersistence,
    getWorkflowDataForApi,
    isStepValid,
    getStepValidationErrors
  };

  // ✅ Provider correctement configuré avec children
  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

// ============================================================
// Hook
// ============================================================

export function useWorkflowContext(): WorkflowContextValue {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflowContext must be used within WorkflowProvider');
  }
  return context;
}

export default WorkflowContext;