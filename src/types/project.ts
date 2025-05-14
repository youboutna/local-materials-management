
export interface ProjectWithPayments {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
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
  payments: Payment[];
  inspections?: Inspection[];
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  progress_at_payment: number;
  transaction_id: string;
}

export type InspectionStatus = 'approved' | 'requires_changes' | 'rejected' | 'pending';

export interface Inspection {
  id: string;
  date: string;
  status: InspectionStatus | string;
  inspector: string;
  progress_at_inspection: number;
  comments?: string;
  documents?: any[];
}
