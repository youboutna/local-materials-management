
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
  payment_date: string;
  payment_method: string;
  progress_at_payment: number;
  transaction_id: string;
  
  // Add these aliases for backwards compatibility
  get paymentDate(): string { return this.payment_date; }
  get paymentMethod(): string { return this.payment_method; }
  get progressAtPayment(): number { return this.progress_at_payment; }
  get transactionId(): string { return this.transaction_id; }
}

export type InspectionStatus = 'approved' | 'requires_changes' | 'rejected' | 'pending';

export interface Inspection {
  id: string;
  date: string;
  status: InspectionStatus | string;
  inspector: string;
  progress_at_inspection: number;
  comments?: string | null;
  documents?: any[];
}
