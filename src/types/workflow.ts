// New standardized workflow system for projects and tenders

export interface WorkflowPhase {
  id: string;
  code: string;
  label: string;
  value: string;
  customizable: boolean;
  stages: WorkflowStage[];
}

export interface WorkflowStage {
  id: string;
  code: string;
  label: string;
  value: string;
  customizable: boolean;
  tasks: WorkflowTask[];
}

export interface WorkflowTask {
  id: string;
  code: string;
  label: string;
  description?: string;
  assignedTo?: string[];
  delegatedTo?: string[];
  dependencies?: string[];
  inspections?: InspectionTemplate[];
  resources?: string[];
  costEstimate?: number;
  durationEstimate?: number;
}

export interface InspectionTemplate {
  id: string;
  label: string;
  type: 'reception' | 'quality' | 'hse' | 'final';
  mandatory: boolean;
}

// Standard Mauritanian public works workflow
export const standardWorkflow: WorkflowPhase[] = [
  {
    id: 'phase-01',
    code: 'pre_feasibility',
    label: 'Pré-faisabilité et Études Préliminaires',
    value: 'pre_feasibility',
    customizable: true,
    stages: [
      {
        id: 'stage-01-1',
        code: 'needs_assessment',
        label: 'Analyse des besoins',
        value: 'needs_assessment',
        customizable: true,
        tasks: [
          {
            id: 'task-01-1-1',
            code: 'collect_requirements',
            label: 'Collecte des besoins des parties prenantes',
            description: 'Ateliers avec les bénéficiaires et parties prenantes locales pour identifier les besoins réels',
          },
          {
            id: 'task-01-1-2',
            code: 'market_study',
            label: 'Étude de marché',
            description: 'Analyse de disponibilité des matériaux locaux et coût de transport',
          },
        ],
      },
      {
        id: 'stage-01-2',
        code: 'feasibility_study',
        label: 'Étude de faisabilité',
        value: 'feasibility_study',
        customizable: true,
        tasks: [
          {
            id: 'task-01-2-1',
            code: 'technical_feasibility',
            label: 'Faisabilité technique',
            description: 'Analyse des solutions techniques et des contraintes locales (matériaux, logistique)',
          },
          {
            id: 'task-01-2-2',
            code: 'financial_feasibility',
            label: 'Faisabilité financière',
            description: 'Prévision des coûts et recherche de financement (marchés publics, PPP, bailleurs internationaux)',
          },
        ],
      },
    ],
  },
  {
    id: 'phase-02',
    code: 'design_doa',
    label: 'Conception et DAO',
    value: 'design_doa',
    customizable: true,
    stages: [
      {
        id: 'stage-02-1',
        code: 'preliminary_design',
        label: 'Avant-projet',
        value: 'preliminary_design',
        customizable: true,
        tasks: [
          {
            id: 'task-02-1-1',
            code: 'topo_survey',
            label: 'Relevés topographiques',
          },
          {
            id: 'task-02-1-2',
            code: 'environmental_impact',
            label: 'Étude d\'impact environnemental',
          },
        ],
      },
      {
        id: 'stage-02-2',
        code: 'final_design',
        label: 'Études techniques détaillées',
        value: 'final_design',
        customizable: true,
        tasks: [
          {
            id: 'task-02-2-1',
            code: 'civil_engineering',
            label: 'Plans génie civil',
          },
          {
            id: 'task-02-2-2',
            code: 'electrical_design',
            label: 'Conception électrique / hydraulique',
          },
        ],
      },
      {
        id: 'stage-02-3',
        code: 'tender_dossier',
        label: 'Rédaction DAO',
        value: 'tender_dossier',
        customizable: true,
        tasks: [
          {
            id: 'task-02-3-1',
            code: 'dao_preparation',
            label: 'Préparation du dossier d\'appel d\'offres',
          },
          {
            id: 'task-02-3-2',
            code: 'dao_validation',
            label: 'Validation DAO par les autorités',
          },
        ],
      },
    ],
  },
  {
    id: 'phase-03',
    code: 'execution',
    label: 'Exécution',
    value: 'execution',
    customizable: true,
    stages: [
      {
        id: 'stage-03-1',
        code: 'mobilization',
        label: 'Mobilisation chantier',
        value: 'mobilization',
        customizable: true,
        tasks: [
          {
            id: 'task-03-1-1',
            code: 'site_installation',
            label: 'Installation de chantier',
          },
        ],
      },
      {
        id: 'stage-03-2',
        code: 'construction',
        label: 'Travaux principaux',
        value: 'construction',
        customizable: true,
        tasks: [
          {
            id: 'task-03-2-1',
            code: 'foundations',
            label: 'Fondations',
            inspections: [{ id: 'insp-01', label: 'Contrôle béton', type: 'quality', mandatory: true }],
          },
          {
            id: 'task-03-2-2',
            code: 'structural',
            label: 'Élévation des structures',
          },
          {
            id: 'task-03-2-3',
            code: 'electrical_installation',
            label: 'Installation électrique',
          },
        ],
      },
      {
        id: 'stage-03-3',
        code: 'technical_assistance',
        label: 'Assistance technique & développement logiciel',
        value: 'technical_assistance',
        customizable: true,
        tasks: [
          {
            id: 'task-03-3-1',
            code: 'software_delivery',
            label: 'Livraison de solutions logicielles',
            description: 'Développement et intégration des outils numériques de suivi de chantier',
          },
          {
            id: 'task-03-3-2',
            code: 'capacity_building',
            label: 'Formation et transfert de compétences',
          },
        ],
      },
    ],
  },
  {
    id: 'phase-04',
    code: 'handover',
    label: 'Réception & Garantie',
    value: 'handover',
    customizable: true,
    stages: [
      {
        id: 'stage-04-1',
        code: 'provisional_acceptance',
        label: 'Réception provisoire',
        value: 'provisional_acceptance',
        customizable: true,
        tasks: [
          {
            id: 'task-04-1-1',
            code: 'final_inspection',
            label: 'Inspection finale',
            inspections: [
              { id: 'insp-10', label: 'Essai de performance', type: 'reception', mandatory: true },
            ],
          },
        ],
      },
      {
        id: 'stage-04-2',
        code: 'final_acceptance',
        label: 'Réception définitive',
        value: 'final_acceptance',
        customizable: true,
        tasks: [
          {
            id: 'task-04-2-1',
            code: 'guarantee_release',
            label: 'Levée de garantie bancaire',
          },
        ],
      },
    ],
  },
];

// Helper functions
export const getPhaseByCode = (code: string): WorkflowPhase | undefined => {
  return standardWorkflow.find(phase => phase.code === code);
};

export const getStageByCode = (phaseCode: string, stageCode: string): WorkflowStage | undefined => {
  const phase = getPhaseByCode(phaseCode);
  return phase?.stages.find(stage => stage.code === stageCode);
};

export const getTasksByStage = (phaseCode: string, stageCode: string): WorkflowTask[] => {
  const stage = getStageByCode(phaseCode, stageCode);
  return stage?.tasks || [];
};

export const getAllPhases = (): WorkflowPhase[] => {
  return standardWorkflow;
};

export const getPhaseProgress = (phaseCode: string, completedTasks: string[]): number => {
  const phase = getPhaseByCode(phaseCode);
  if (!phase) return 0;
  
  const allTasks = phase.stages.flatMap(stage => stage.tasks);
  if (allTasks.length === 0) return 0;
  
  const completedCount = allTasks.filter(task => completedTasks.includes(task.id)).length;
  return Math.round((completedCount / allTasks.length) * 100);
};