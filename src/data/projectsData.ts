import { ProjectData } from "../types/project";

export const allProjectsData: ProjectData[] = [
  {
    id: '9146da6c-29b9-4787-b901-3bead2a57068',
    title: 'Ligne HT Nouakchott-Zouerate',
    description: 'Construction de lignes haute tension incluant travaux, prestations intellectuelles, DAO et développement logiciel.',
    location: 'Nouakchott - Zouerate',
    status: 'en cours',
    progress: 15,
    budget: 120000000,
    startDate: '2021-03-23',
    endDate: '2026-12-31',
    thumbnail: '/assets/projects/powerline.jpg',
    teamSize: 35,
    coordinates: { latitude: 19.5, longitude: -13 },
    financingSource: 'Banque Mondiale',
    marketType: 'International',
    selectionMode: 'Appel d\'offres',
    launchDate: '2021-01-15',
    attributionDate: '2021-02-28',
    allowsInitialPayment: true,
    initialPaymentPercentage: 15,
    currentPhase: {name:'construction'},
    currentStage:  {name:'execution'},
    methodology: 'waterfall',

    plannedPhases: [
      { id: 'phase-01', name: 'pre_feasibility', startDate: '2021-03-23', endDate: '2021-06-15', estimatedDuration: 90, status: 'completed', weight: 0.1, dependencies: [], responsible: ['r1'], deliverables: [{ name: 'Étude faisabilité', type: 'document', requirement: 'requis' }] },
      { id: 'phase-02', name: 'design_doa', startDate: '2021-06-16', endDate: '2021-12-20', estimatedDuration: 180, status: 'completed', weight: 0.15, dependencies: ['phase-01'], responsible: ['r2'], deliverables: [{ name: 'DAO complet', type: 'document', requirement: 'requis' }] },
      { id: 'phase-03', name: 'tender_dossier', startDate: '2022-01-05', endDate: '2022-05-01', estimatedDuration: 120, status: 'completed', weight: 0.1, dependencies: ['phase-02'], responsible: ['r3'], deliverables: [{ name: 'Publication appel d’offres', type: 'document', requirement: 'requis' }] },
      { id: 'phase-04', name: 'mobilization', startDate: '2022-06-01', endDate: '2022-09-15', estimatedDuration: 100, status: 'completed', weight: 0.05, dependencies: ['phase-03'], responsible: ['r4'], deliverables: [{ name: 'Ordre de service', type: 'document', requirement: 'requis' }] },
      { id: 'phase-05', name: 'construction', startDate: '2022-09-16', endDate: '2025-12-01', estimatedDuration: 900, status: 'in_progress', weight: 0.45, dependencies: ['phase-04'], responsible: ['r5'], deliverables: [{ name: 'Ligne HT posée', type: 'livrable', requirement: 'requis' }] },
      { id: 'phase-06', name: 'handover', startDate: '2025-12-02', endDate: '2026-12-31', estimatedDuration: 300, status: 'pending', weight: 0.15, dependencies: ['phase-05'], responsible: ['r6'], deliverables: [{ name: 'Réception définitive', type: 'rapport', requirement: 'requis' }] }
    ],

    constructionMilestones: [
      { id: 'm1', title: 'Validation étude faisabilité', name: 'pre_feasibility', stage: 'needs_assessment', targetDate: '2021-06-15', completedDate: '2021-06-10', status: 'completed', weight: 0.1, dependencies: [] },
      { id: 'm2', title: 'DAO approuvé', name: 'design_doa', stage: 'planning_design', targetDate: '2021-12-20', completedDate: '2021-12-15', status: 'completed', weight: 0.15, dependencies: ['m1'] },
      { id: 'm3', title: 'Attribution marché', name: 'tender_dossier', stage: 'procurement', targetDate: '2022-05-01', completedDate: '2022-04-25', status: 'completed', weight: 0.1, dependencies: ['m2'] },
      { id: 'm4', title: 'Ordre de service émis', name: 'mobilization', stage: 'mobilization', targetDate: '2022-09-15', completedDate: '2022-09-12', status: 'completed', weight: 0.05, dependencies: ['m3'] },
      { id: 'm5', title: '20% travaux', name: 'construction', stage: 'foundation', targetDate: '2023-06-30', status: 'completed', weight: 0.1, dependencies: ['m4'] },
      { id: 'm6', title: '50% travaux', name: 'construction', stage: 'erection', targetDate: '2024-12-31', status: 'in_progress', weight: 0.2, dependencies: ['m5'] },
      { id: 'm7', title: 'Achèvement travaux', name: 'construction', stage: 'finishing', targetDate: '2025-12-01', status: 'pending', weight: 0.15, dependencies: ['m6'] },
      { id: 'm8', title: 'Réception définitive', name: 'handover', stage: 'handover', targetDate: '2026-12-31', status: 'pending', weight: 0.15, dependencies: ['m7'] }
    ],

    tasks: [
      { id: 't1', name: 'Étude de faisabilité', phaseId: 'phase-01', dependencies: [], assignedTo: ['r1'], estimatedDuration: 90, startDate: '2021-03-23', endDate: '2021-06-15', status: 'completed', progress: 100, weight: 0.1, costEstimate: 50000, actualCost: 48000, criticalPath: true },
      { id: 't6', name: 'Montage structures', phaseId: 'phase-05', dependencies: ['t5'], assignedTo: ['r5'], estimatedDuration: 365, startDate: '2023-07-01', endDate: '2024-12-31', status: 'in_progress', progress: 50, weight: 0.2, costEstimate: 400000, actualCost: 180000, criticalPath: true },
      { id: 't7', name: 'Tirage conducteurs', phaseId: 'phase-05', dependencies: ['t6'], assignedTo: ['r5'], estimatedDuration: 180, startDate: '2025-01-01', endDate: '2025-08-01', status: 'pending', progress: 0, weight: 0.1, costEstimate: 250000, actualCost: 0, criticalPath: true }
    ],

    inspections: [
      { id: 'i1', project_id: '9146da6c-29b9-4787-b901-3bead2a57068', inspector: 'Bureau de contrôle', date: '2023-08-01', status: 'done', progress_at_inspection: 20, issues: [] }
    ],

    risks: [
      { id: 'rsk1', title: 'Retard livraison pylônes', probability: 30, impact: 50, mitigationPlan: 'Commandes anticipées', status: 'mitigated', relatedTasks: ['t5'] }
    ],

    resources: [
      {
        id: '1146da6c-29b9-4787-b901-7aaad2a57068',
        name: 'Équipe géotechnique',
        type: 'human',
        skills: ['géotechnique', 'forage'],
        costPerHour: 120,
        availability: 100,
        assignedTasks: ['t1']
      },
      {
        id: '2146da6c-29b9-4787-b901-7aaad2a57068',
        name: 'Foreuse',
        type: 'equipment',
        costPerHour: 200,
        availability: 100,
        assignedTasks: ['t6']
      },
      {
        id: '3146da6c-29b9-4787-b901-7aaad2a57068',
        name: 'Ingénieur structures',
        type: 'human',
        skills: ['ingénierie structures'],
        costPerHour: 80,
        availability: 100,
        assignedTasks: ['t6']
      },
      {
        id: '4146da6c-29b9-4787-b901-7aaad2a57068',
        name: 'Béton C30',
        type: 'material',
        unit: 'm3',
        costPerUnit: 95,
        stock: 450,
        assignedTasks: ['t5']
      },
      {
        id: '5146da6c-29b9-4787-b901-7aaad2a57068',
        name: 'Câble conducteur ACSR',
        type: 'material',
        unit: 'km',
        costPerUnit: 3500,
        stock: 120,
        assignedTasks: ['t7']
      }
    ],

    insurancePolicies: [
      { id: 'ins1', type: 'assurance', reference: 'ASS-2021-001', projectId: '9146da6c-29b9-4787-b901-3bead2a57068', issuer: 'SOMELEC Assurance', startDate: '2022-06-01', endDate: '2026-12-31', amount: 5000000, coverage: 'RC + Matériel', status: 'active' }
    ],

    contacts: [
      { id: 'c1', name: 'M. Diagana', role: 'Directeur SOMELEC', email: 'diagana@somelec.mr', phone: '+222 45 45 45 45', isPrimary: true },
      { id: 'c2', name: 'Banque Mondiale', role: 'Bailleur', email: 'contact@worldbank.org', phone: '+1 202-123-4567', isPrimary: false }
    ],

    escalationThresholds: { alert: 10, notification: 20, guarantee: 40, legal: 50 },
    checkScheduleLastRun: {}
  }

  
];
