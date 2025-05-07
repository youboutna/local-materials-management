
export type ProjectStatus = 'en attente' | 'en cours' | 'terminé' | 'suspendu' | 'annulé' | 'payé' | 'en inspection';
export type InspectionStatus = 'pending' | 'approved' | 'rejected' | 'requires_changes';

export interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  progressAtPayment: number;
  inspectionId?: string;
}

export interface Inspection {
  id: string;
  date: string;
  status: InspectionStatus;
  inspector: string;
  comments: string;
  progressAtInspection: number;
  documents: string[];
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'contract' | 'report' | 'invoice' | 'inspection';
  url: string;
  uploadedAt: string;
}

export interface ProjectWithPayments {
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
  payments?: Payment[];
  inspections?: Inspection[];
  documents?: ProjectDocument[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
