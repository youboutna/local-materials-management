/**
 * Centralized Mock Data for Development and Testing
 * Architecture Hexagonale - Données centralisées dans /data/*
 * 
 * ⚠️ UTILISATION UNIQUEMENT EN DÉVELOPPEMENT
 * 
 * Règles :
 * - Tous les IDs doivent être des UUID valides (format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
 * - Toutes les données doivent respecter les DTOs
 * - Activer via REACT_APP_USE_MOCK_DATA=true
 */

// ============================================================================
// IMPORTS DES DTOS
// ============================================================================

import type { UserDTO } from '@/dtos/entities/UserDTO';
import type { ProfileDTO } from '@/dtos/entities/ProfileDTO';
import type { MaterialDTO } from '@/dtos/entities/MaterialDTO';
import type { SupplierDTO } from '@/dtos/entities/SupplierDTO';
import type { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import type { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import type { TenderDTO } from '@/dtos/entities/TenderDTO';
import type { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import type { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import type { TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';

// ============================================================================
// CONSTANTES UUID
// ============================================================================

// IDs des projets (UUIDs réels)
export const MOCK_PROJECT_IDS = {
  DREAM: '2e49c7f0-72de-4be3-a43d-49606315cd4a',
  HT_NOUAKCHOTT: '81782b92-5055-42fe-bedf-ac3fb9b402e9',
  INTERCO: '1b6b5151-be11-4c36-a692-230c12e2e1c4',
  PNAGSB: '8172615e-a66b-4fcc-888a-048f0a652ec2',
  EL_GHAIRA: '4e404c71-e33e-4b7d-a18f-6e053ff8e321',
  NOUAKCHOTT_ALEG: '1a91ada4-8325-4830-9cb4-540d14845995',
  SOLAIRE: '5fdf1c4d-4bfa-48f5-848f-beff02984208',
  TRANSFO_ALEG: '39a522cc-591f-477d-9daf-c21bc0b80d17',
};

export const MOCK_PROJECT_ID = MOCK_PROJECT_IDS.DREAM;

// IDs des phases (UUIDs réels)
export const MOCK_PHASE_IDS = {
  DREAM_ANALYSE: '9028a9e5-0290-4bf8-ae56-cdb3fed8063a',
  DREAM_DEFINITION: '8e33c4de-b445-4165-9932-3bd4ff330bfa',
  DREAM_VALIDATION: 'a83f0f30-ef1f-4e7a-9deb-0f4a31bcffd3',
  HT_ETUDES: '4afbb1dd-ab0a-4d0b-968f-039b235fa185',
  HT_TRAVAUX: 'f3da1c71-4a84-4bb1-a14a-d56f15d653c2',
  HT_RECEPTION: '7046ccaf-5def-44e2-bbe0-9ad78fe7a8d1',
};

export const MOCK_PHASE_ID = MOCK_PHASE_IDS.DREAM_ANALYSE;

// IDs des tâches (UUIDs réels)
export const MOCK_TASK_IDS = {
  DREAM_AUDIT: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  DREAM_KPI: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  DREAM_VALIDATION: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
};

export const MOCK_TASK_ID = MOCK_TASK_IDS.DREAM_AUDIT;

// IDs des utilisateurs (UUIDs réels)
export const MOCK_USER_IDS = {
  ADMIN: 'usr-admin-001',
  DIRECTOR: 'usr-dir-001',
  PM: 'usr-pm-001',
  ENGINEER: 'usr-eng-001',
  MANAGER: 'usr-mgr-001',
  INSPECTOR: 'usr-insp-001',
  SUPPLIER: 'usr-sup-001',
};

// IDs des fournisseurs (UUIDs réels)
export const MOCK_SUPPLIER_IDS = {
  MKAC_EY: '4900b294-1f6d-471d-916c-493d91eab',
  CTM: '127f8626-1b29-4a3b-9749-0d58221bc',
  TEK: '1cff8c06-7976-4933-8df6-775ded72a',
};

// ============================================================================
// FONCTIONS UTILITAIRES UUID
// ============================================================================

/**
 * Génère un UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Vérifie si une chaîne est un UUID valide
 */
export function isValidUUID(uuid: string): boolean {
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return pattern.test(uuid);
}

/**
 * Génère un UUID pour un mock
 */
export function mockUUID(prefix?: string): string {
  const uuid = generateUUID();
  return prefix ? `${prefix}-${uuid}` : uuid;
}

// ============================================================================
// UTILISATEURS MOCKÉS (UserDTO)
// ============================================================================

export const mockUsers: UserDTO[] = [
  {
    id: MOCK_USER_IDS.ADMIN,
    email: 'admin@hadratech.mr',
    fullName: 'Administrateur Système',
    phone: '+222 123456789',
    nationalId: 'N123456789',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    roles: ['admin'],
    primaryRole: 'admin',
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: MOCK_USER_IDS.DIRECTOR,
    email: 'director@hadratech.mr',
    fullName: 'Directeur Projets',
    phone: '+222 234567890',
    nationalId: 'N234567890',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=director',
    roles: ['director'],
    primaryRole: 'director',
    isActive: true,
    createdAt: new Date('2024-01-02').toISOString(),
    updatedAt: new Date('2024-01-02').toISOString(),
  },
  {
    id: MOCK_USER_IDS.PM,
    email: 'pm@hadratech.mr',
    fullName: 'Chef de Projet',
    phone: '+222 345678901',
    nationalId: 'N345678901',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pm',
    roles: ['project_manager'],
    primaryRole: 'project_manager',
    isActive: true,
    createdAt: new Date('2024-01-03').toISOString(),
    updatedAt: new Date('2024-01-03').toISOString(),
  },
];

// ============================================================================
// PROFILS MOCKÉS (ProfileDTO)
// ============================================================================

export const mockProfiles: ProfileDTO[] = [
  {
    id: 'prof-admin-001',
    userId: MOCK_USER_IDS.ADMIN,
    fullName: 'Administrateur Système',
    phone: '+222 123456789',
    nationalId: 'N123456789',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: 'prof-dir-001',
    userId: MOCK_USER_IDS.DIRECTOR,
    fullName: 'Directeur Projets',
    phone: '+222 234567890',
    nationalId: 'N234567890',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=director',
    createdAt: new Date('2024-01-02').toISOString(),
    updatedAt: new Date('2024-01-02').toISOString(),
  },
  {
    id: 'prof-pm-001',
    userId: MOCK_USER_IDS.PM,
    fullName: 'Chef de Projet',
    phone: '+222 345678901',
    nationalId: 'N345678901',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pm',
    createdAt: new Date('2024-01-03').toISOString(),
    updatedAt: new Date('2024-01-03').toISOString(),
  },
];

// ============================================================================
// MATÉRIAUX MOCKÉS (MaterialDTO) avec UUIDs
// ============================================================================

export const mockMaterials: MaterialDTO[] = [
  {
    id: generateUUID(),
    name: 'Ciment Portland',
    description: 'Ciment de haute qualité pour construction',
    category: 'Matériaux de construction',
    unit: 'sac',
    pricePerUnit: 8500,
    availableQuantity: 500,
    minStockLevel: 100,
    supplier: 'SOMELEC',
    originLocation: 'Nouakchott',
    status: 'available',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: generateUUID(),
    name: 'Fer à béton',
    description: 'Barres d\'acier pour béton armé',
    category: 'Matériaux de construction',
    unit: 'tonne',
    pricePerUnit: 450000,
    availableQuantity: 50,
    minStockLevel: 20,
    supplier: 'MAURITANIAN STEEL',
    originLocation: 'Nouadhibou',
    status: 'available',
    createdAt: new Date('2024-01-02').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
];

// ============================================================================
// FOURNISSEURS MOCKÉS (SupplierDTO) avec UUIDs
// ============================================================================

export const mockSuppliers: SupplierDTO[] = [
  {
    id: MOCK_SUPPLIER_IDS.MKAC_EY,
    name: 'Groupement MKAC/EY (Ernst & Young)',
    email: 'contact@ey.mr',
    phone: '+222 45252525',
    address: 'Nouakchott, Mauritanie',
    type: 'consulting',
    status: 'active',
    rating: 4.8,
    createdAt: new Date('2023-10-01').toISOString(),
    updatedAt: new Date('2023-10-01').toISOString(),
  },
  {
    id: MOCK_SUPPLIER_IDS.CTM,
    name: 'CTM Bâtiment',
    email: 'contact@ctm.mr',
    phone: '+222 45252526',
    address: 'Nouakchott, Mauritanie',
    type: 'construction',
    status: 'active',
    rating: 4.5,
    createdAt: new Date('2023-09-01').toISOString(),
    updatedAt: new Date('2023-09-01').toISOString(),
  },
  {
    id: MOCK_SUPPLIER_IDS.TEK,
    name: 'TEK TRANSFORMATÖR',
    email: 'info@tektransformer.com.tr',
    phone: '+90 312 456 78 90',
    address: 'Ankara, Turquie',
    type: 'equipment',
    status: 'active',
    rating: 4.2,
    createdAt: new Date('2026-05-18').toISOString(),
    updatedAt: new Date('2026-05-18').toISOString(),
  },
];

// ============================================================================
// DOCUMENTS MOCKÉS (DocumentDTO) avec UUIDs
// ============================================================================

export const mockDocuments: DocumentDTO[] = [
  {
    id: generateUUID(),
    title: 'Plan d\'Architecture',
    description: 'Plans architecturaux du bâtiment principal',
    documentType: 'PDF',
    fileSize: 2048576,
    fileUrl: '/documents/architecture-plans.pdf',
    status: 'approved',
    projectId: MOCK_PROJECT_IDS.DREAM,
    uploadedBy: MOCK_USER_IDS.ADMIN,
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
  {
    id: generateUUID(),
    title: 'Rapport d\'Inspection',
    description: 'Rapport d\'inspection des fondations',
    documentType: 'PDF',
    fileSize: 1024000,
    fileUrl: '/documents/inspection-report.pdf',
    status: 'approved',
    projectId: MOCK_PROJECT_IDS.HT_NOUAKCHOTT,
    uploadedBy: MOCK_USER_IDS.INSPECTOR,
    createdAt: new Date('2024-06-15').toISOString(),
    updatedAt: new Date('2024-06-15').toISOString(),
  },
];

// ============================================================================
// INSPECTIONS MOCKÉES (InspectionDTO) avec UUIDs
// ============================================================================

export const mockInspections: InspectionDTO[] = [
  {
    id: generateUUID(),
    projectId: MOCK_PROJECT_IDS.HT_NOUAKCHOTT,
    inspectorId: MOCK_USER_IDS.INSPECTOR,
    type: 'regular',
    status: 'completed',
    scheduledDate: new Date('2024-06-15').toISOString(),
    date: new Date('2024-06-15').toISOString(),
    progressAtInspection: 100,
    comments: 'Travaux conformes aux spécifications',
    createdAt: new Date('2024-06-10').toISOString(),
    updatedAt: new Date('2024-06-15').toISOString(),
  },
  {
    id: generateUUID(),
    projectId: MOCK_PROJECT_IDS.HT_NOUAKCHOTT,
    inspectorId: MOCK_USER_IDS.INSPECTOR,
    type: 'regular',
    status: 'scheduled',
    scheduledDate: new Date('2024-12-10').toISOString(),
    date: new Date('2024-12-10').toISOString(),
    progressAtInspection: 0,
    comments: 'Vérification finale en cours',
    createdAt: new Date('2024-12-01').toISOString(),
    updatedAt: new Date('2024-12-01').toISOString(),
  },
];

// ============================================================================
// TÂCHES MOCKÉES (TaskAssignmentDTO) avec UUIDs
// ============================================================================

export const mockTasks: TaskAssignmentDTO[] = [
  {
    id: MOCK_TASK_IDS.DREAM_AUDIT,
    title: 'Audit organisationnel',
    name: 'Audit organisationnel',
    description: 'Réalisation de l\'audit organisationnel des directions centrales',
    projectId: MOCK_PROJECT_IDS.DREAM,
    phaseId: MOCK_PHASE_IDS.DREAM_ANALYSE,
    status: 'COMPLETED',
    priority: 'HIGH',
    progress: 100,
    assigneeId: MOCK_SUPPLIER_IDS.MKAC_EY,
    assigneeName: 'Groupement MKAC/EY',
    assigneeEmail: 'contact@ey.mr',
    assigneeType: 'supplier',
    startDate: new Date('2024-01-01').toISOString(),
    dueDate: new Date('2024-04-29').toISOString(),
    endDate: new Date('2024-04-29').toISOString(),
    completedAt: new Date('2024-04-29').toISOString(),
    estimatedDuration: 120,
    dependencies: [],
    notes: 'Audit organisationnel terminé avec succès',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-04-29').toISOString(),
  },
  {
    id: MOCK_TASK_IDS.DREAM_KPI,
    title: 'Définition des KPI',
    name: 'Définition des KPI',
    description: 'Définition des indicateurs de performance clés',
    projectId: MOCK_PROJECT_IDS.DREAM,
    phaseId: MOCK_PHASE_IDS.DREAM_DEFINITION,
    status: 'COMPLETED',
    priority: 'HIGH',
    progress: 100,
    assigneeId: MOCK_SUPPLIER_IDS.MKAC_EY,
    assigneeName: 'Groupement MKAC/EY',
    assigneeEmail: 'contact@ey.mr',
    assigneeType: 'supplier',
    startDate: new Date('2024-05-01').toISOString(),
    dueDate: new Date('2024-08-28').toISOString(),
    endDate: new Date('2024-08-28').toISOString(),
    completedAt: new Date('2024-08-28').toISOString(),
    estimatedDuration: 120,
    dependencies: [MOCK_TASK_IDS.DREAM_AUDIT],
    notes: 'KPI définis et validés',
    createdAt: new Date('2024-05-01').toISOString(),
    updatedAt: new Date('2024-08-28').toISOString(),
  },
  {
    id: MOCK_TASK_IDS.DREAM_VALIDATION,
    title: 'Validation et adoption',
    name: 'Validation et adoption',
    description: 'Validation et adoption du rapport final par le Ministre',
    projectId: MOCK_PROJECT_IDS.DREAM,
    phaseId: MOCK_PHASE_IDS.DREAM_VALIDATION,
    status: 'COMPLETED',
    priority: 'HIGH',
    progress: 100,
    assigneeId: MOCK_SUPPLIER_IDS.MKAC_EY,
    assigneeName: 'Groupement MKAC/EY',
    assigneeEmail: 'contact@ey.mr',
    assigneeType: 'supplier',
    startDate: new Date('2024-09-01').toISOString(),
    dueDate: new Date('2024-10-31').toISOString(),
    endDate: new Date('2024-10-31').toISOString(),
    completedAt: new Date('2024-10-31').toISOString(),
    estimatedDuration: 60,
    dependencies: [MOCK_TASK_IDS.DREAM_KPI],
    notes: 'Rapport final validé par le Ministre',
    createdAt: new Date('2024-09-01').toISOString(),
    updatedAt: new Date('2024-10-31').toISOString(),
  },
];

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Récupère toutes les données mockées pour un projet
 */
export function getMockProjectData(projectId: string = MOCK_PROJECT_IDS.DREAM) {
  const isDREAM = projectId === MOCK_PROJECT_IDS.DREAM;
  
  return {
    project: {
      id: projectId,
      title: isDREAM ? 'Projet DREAM 1 - Définition des Indicateurs de Performance' : 'Projet de Construction',
      description: isDREAM ? 'Définition des indicateurs de performance des directions centrales du Ministère' : 'Description du projet',
      status: isDREAM ? 'terminé' : 'en cours',
      progress: isDREAM ? 100 : 50,
      budget: isDREAM ? 45000000 : 5000000,
      currency: 'MRU',
      location: 'Nouakchott, Mauritanie',
      startDate: new Date('2024-01-01').toISOString(),
      endDate: new Date('2024-12-31').toISOString(),
      teamSize: isDREAM ? 5 : 15,
      projectManagerId: MOCK_USER_IDS.PM,
      financingSource: 'Banque Mondiale',
      marketType: 'AOO',
      selectionMode: 'Appel d\'Offres Ouvert International',
      createdAt: new Date('2023-10-01').toISOString(),
      updatedAt: new Date('2024-12-31').toISOString(),
    } as ProjectDTO,
    phases: [],
    tasks: mockTasks,
    documents: mockDocuments,
    inspections: mockInspections,
    suppliers: mockSuppliers,
  };
}

/**
 * Vérifie si les données mockées doivent être utilisées
 */
export function shouldUseMockData(): boolean {
  return import.meta.env.MODE === 'development' && 
         import.meta.env.VITE_USE_MOCK_DATA === 'true';
}

/**
 * Simule un délai réseau
 */
export function mockDelay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simule une réponse réussie
 */
export function mockSuccess<T>(data: T): Promise<T> {
  return mockDelay().then(() => data);
}

/**
 * Simule une erreur
 */
export function mockError(message: string = 'Erreur simulée'): Promise<never> {
  return mockDelay().then(() => {
    throw new Error(message);
  });
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default {
  users: mockUsers,
  profiles: mockProfiles,
  materials: mockMaterials,
  suppliers: mockSuppliers,
  documents: mockDocuments,
  inspections: mockInspections,
  tasks: mockTasks,
  getMockProjectData,
  shouldUseMockData,
  mockDelay,
  mockSuccess,
  mockError,
  generateUUID,
  isValidUUID,
  mockUUID,
  MOCK_PROJECT_IDS,
  MOCK_PHASE_IDS,
  MOCK_TASK_IDS,
  MOCK_USER_IDS,
  MOCK_SUPPLIER_IDS,
};