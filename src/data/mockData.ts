/**
 * Centralized Mock Data for Development and Testing
 * Architecture Hexagonale - Données centralisées dans /data/*
 */

export interface MockUser {
  id: string;
  fullName: string | null;
  phone: string | null;
  nationalId: string | null;
  avatarUrl: string | null;
  email: string | null;
  roles: string[];
  primaryRole: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MockProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  national_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockMaterial {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  unitPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  supplier: string;
  location: string;
  status: 'available' | 'out_of_stock' | 'low_stock' | 'discontinued';
  lastRestocked: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockSupplier {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  specialization: string[];
  rating: number;
  isActive: boolean;
  contractStart: string;
  contractEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockDocument {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  projectId: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  updatedAt: string;
}

export interface MockInspection {
  id: string;
  projectId: string;
  inspectorId: string;
  type: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  scheduledDate: string;
  completedDate: string | null;
  result: string | null;
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MockTender {
  id: string;
  title: string;
  description: string;
  type: string;
  budget: number;
  deadline: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  requirements: string[];
  criteria: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Données mockées centralisées pour les utilisateurs
export const allUsersData: MockUser[] = [
  {
    id: "1",
    fullName: "Administrateur Système",
    phone: "+222 123456789",
    nationalId: "N123456789",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    email: "admin@hadratech.mr",
    roles: ["admin"],
    primaryRole: "admin",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    fullName: "Directeur Projets",
    phone: "+222 234567890",
    nationalId: "N234567890",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=director",
    email: "director@hadratech.mr",
    roles: ["director"],
    primaryRole: "director",
    isActive: true,
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z"
  },
  {
    id: "3",
    fullName: "Chef de Projet",
    phone: "+222 345678901",
    nationalId: "N345678901",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=pm",
    email: "pm@hadratech.mr",
    roles: ["project_manager"],
    primaryRole: "project_manager",
    isActive: true,
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z"
  },
  {
    id: "4",
    fullName: "Ingénieur Consultant",
    phone: "+222 456789012",
    nationalId: "N456789012",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=engineer",
    email: "engineer@hadratech.mr",
    roles: ["engineering_consultant"],
    primaryRole: "engineering_consultant",
    isActive: true,
    createdAt: "2024-01-04T00:00:00Z",
    updatedAt: "2024-01-04T00:00:00Z"
  },
  {
    id: "5",
    fullName: "Gestionnaire",
    phone: "+222 567890123",
    nationalId: "N567890123",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=manager",
    email: "manager@hadratech.mr",
    roles: ["manager"],
    primaryRole: "manager",
    isActive: true,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z"
  },
  {
    id: "6",
    fullName: "Inspecteur",
    phone: "+222 678901234",
    nationalId: "N678901234",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=inspector",
    email: "inspector@hadratech.mr",
    roles: ["inspector"],
    primaryRole: "inspector",
    isActive: true,
    createdAt: "2024-01-06T00:00:00Z",
    updatedAt: "2024-01-06T00:00:00Z"
  },
  {
    id: "7",
    fullName: "Fournisseur",
    phone: "+222 789012345",
    nationalId: "N789012345",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=supplier",
    email: "supplier@hadratech.mr",
    roles: ["supplier"],
    primaryRole: "supplier",
    isActive: true,
    createdAt: "2024-01-07T00:00:00Z",
    updatedAt: "2024-01-07T00:00:00Z"
  }
];

// Données mockées centralisées pour les profils (format Supabase)
export const allProfilesData: MockProfile[] = [
  {
    id: "1",
    user_id: "1",
    full_name: "Administrateur Système",
    phone: "+222 123456789",
    national_id: "N123456789",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    user_id: "2",
    full_name: "Directeur Projets",
    phone: "+222 234567890",
    national_id: "N234567890",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=director",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z"
  },
  {
    id: "3",
    user_id: "3",
    full_name: "Chef de Projet",
    phone: "+222 345678901",
    national_id: "N345678901",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=pm",
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z"
  }
];

// Données mockées centralisées pour les matériaux
export const allMaterialsData: MockMaterial[] = [
  {
    id: "1",
    name: "Ciment Portland",
    description: "Ciment de haute qualité pour construction",
    category: "Matériaux de construction",
    unit: "sac",
    unitPrice: 8500,
    stockQuantity: 500,
    minStockLevel: 100,
    supplier: "SOMELEC",
    location: "Entrepôt Nouakchott",
    status: "available",
    lastRestocked: "2024-01-15T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z"
  },
  {
    id: "2",
    name: "Fer à béton",
    description: "Barres d'acier pour béton armé",
    category: "Matériaux de construction",
    unit: "tonne",
    unitPrice: 450000,
    stockQuantity: 50,
    minStockLevel: 20,
    supplier: "MAURITANIAN STEEL",
    location: "Entrepôt Nouadhibou",
    status: "available",
    lastRestocked: "2024-01-10T00:00:00Z",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z"
  },
  {
    id: "3",
    name: "Sable de construction",
    description: "Sable fin pour mortier et béton",
    category: "Matériaux de construction",
    unit: "m³",
    unitPrice: 12000,
    stockQuantity: 200,
    minStockLevel: 50,
    supplier: "SABLIERIE NATIONALE",
    location: "Entrepôt Rosso",
    status: "low_stock",
    lastRestocked: "2024-01-05T00:00:00Z",
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z"
  }
];

// Données mockées centralisées pour les fournisseurs
export const allSuppliersData: MockSupplier[] = [
  {
    id: "1",
    name: "SOMELEC",
    contactEmail: "contact@somelec.mr",
    contactPhone: "+222 123456789",
    address: "Avenue Gamal Abdel Nasser, Nouakchott",
    specialization: ["Électricité", "Matériels électriques", "Câbles"],
    rating: 4.5,
    isActive: true,
    contractStart: "2024-01-01T00:00:00Z",
    contractEnd: "2025-12-31T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    name: "MAURITANIAN STEEL",
    contactEmail: "info@mauritanian-steel.mr",
    contactPhone: "+222 234567890",
    address: "Zone Industrielle, Nouadhibou",
    specialization: ["Acier", "Ferraille", "Construction métallique"],
    rating: 4.2,
    isActive: true,
    contractStart: "2024-01-01T00:00:00Z",
    contractEnd: "2025-12-31T00:00:00Z",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z"
  },
  {
    id: "3",
    name: "SABLIERIE NATIONALE",
    contactEmail: "contact@sablerie.mr",
    contactPhone: "+222 345678901",
    address: "Port de Nouakchott",
    specialization: ["Sable", "Granulats", "Matériaux de carrière"],
    rating: 4.0,
    isActive: true,
    contractStart: "2024-01-01T00:00:00Z",
    contractEnd: "2025-12-31T00:00:00Z",
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z"
  }
];

// Données mockées centralisées pour les documents
export const allDocumentsData: MockDocument[] = [
  {
    id: "1",
    title: "Plan d'Architecture",
    description: "Plans architecturaux du bâtiment principal",
    type: "PDF",
    category: "Plans",
    fileSize: 2048576,
    fileUrl: "/documents/architecture-plans.pdf",
    uploadedBy: "1",
    projectId: "1",
    status: "approved",
    uploadedAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z"
  },
  {
    id: "2",
    title: "Rapport d'Inspection",
    description: "Rapport d'inspection des fondations",
    type: "PDF",
    category: "Rapports",
    fileSize: 1024000,
    fileUrl: "/documents/inspection-report.pdf",
    uploadedBy: "6",
    projectId: "1",
    status: "approved",
    uploadedAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z"
  },
  {
    id: "3",
    title: "Devis Fournisseur",
    description: "Devis détaillé des matériaux",
    type: "XLSX",
    category: "Financier",
    fileSize: 512000,
    fileUrl: "/documents/supplier-quote.xlsx",
    uploadedBy: "7",
    projectId: "1",
    status: "pending",
    uploadedAt: "2024-01-20T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z"
  }
];

// Données mockées centralisées pour les inspections
export const allInspectionsData: MockInspection[] = [
  {
    id: "1",
    projectId: "1",
    inspectorId: "6",
    type: "Inspection des fondations",
    status: "completed",
    scheduledDate: "2024-01-15T00:00:00Z",
    completedDate: "2024-01-15T00:00:00Z",
    result: "Conforme aux normes de construction",
    recommendations: ["Continuer avec les travaux de superstructure", "Maintenir les dossiers de suivi"],
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z"
  },
  {
    id: "2",
    projectId: "1",
    inspectorId: "6",
    type: "Inspection de structure",
    status: "scheduled",
    scheduledDate: "2024-02-01T00:00:00Z",
    completedDate: null,
    result: null,
    recommendations: [],
    createdAt: "2024-01-20T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z"
  }
];

// Données mockées centralisées pour les appels d'offres
export const allTendersData: MockTender[] = [
  {
    id: "1",
    title: "Construction de Bâtiment Administratif",
    description: "Construction d'un bâtiment de 3 étages pour l'administration",
    type: "Construction",
    budget: 50000000,
    deadline: "2024-03-01T00:00:00Z",
    status: "published",
    requirements: ["Expérience en construction administrative", "Certification ISO 9001", "Références similaires"],
    criteria: ["Coût (40%)", "Délai (30%)", "Qualité (20%)", "Expérience (10%)"],
    createdBy: "1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z"
  },
  {
    id: "2",
    title: "Fourniture de Matériels Électriques",
    description: "Fourniture et installation de matériels électriques pour le projet",
    type: "Fourniture",
    budget: 15000000,
    deadline: "2024-02-15T00:00:00Z",
    status: "published",
    requirements: ["Matériels certifiés", "Garantie minimale 2 ans", "Service après-vente"],
    criteria: ["Coût (50%)", "Qualité (30%)", "Garantie (20%)"],
    createdBy: "2",
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z"
  }
];

// Export par défaut pour faciliter l'import
export default {
  users: allUsersData,
  profiles: allProfilesData,
  materials: allMaterialsData,
  suppliers: allSuppliersData,
  documents: allDocumentsData,
  inspections: allInspectionsData,
  tenders: allTendersData
};
