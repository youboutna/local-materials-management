
export type ProjectStatus = 'en cours' | 'terminé' | 'en attente' | 'en inspection' | 'suspendu' | 'annulé';

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  location: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  endDate?: string;
  thumbnail: string;
  teamSize: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // New optional fields
  financingSource?: string;
  marketType?: string;
  selectionMode?: string;
  launchDate?: string;
  attributionDate?: string;
  projectResponsableId?: string;
  mainContractor?: string;
  projectReference?: string;
  // Payment settings
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
}

export interface ProjectWithPayments extends ProjectData {
  payments: Payment[];
  inspections?: Inspection[];
}

export interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  progress_at_payment: number;
  transaction_id: string;
  // New contractor fields
  contractor_id?: string;
  contractor_name: string;
  contractor_contact: string;
  // Method-specific fields
  bank_name?: string;
  account_number?: string;
  check_number?: string;
  mobile_number?: string;
  mobile_operator?: string;
  receiver_name?: string;
}

export type InspectionStatus = 'approved' | 'requires_changes' | 'rejected' | 'pending';

export interface Inspection {
  id: string;
  date: string;
  status: InspectionStatus;
  inspector: string;
  progress_at_inspection: number;
  comments?: string | null;
  documents?: any[];
}

// Import types
export interface ImportFile {
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer | string;
}

export interface ImportOptions {
  maxFileSize: number; // in bytes
  allowedFormats: string[];
  encoding?: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
}
