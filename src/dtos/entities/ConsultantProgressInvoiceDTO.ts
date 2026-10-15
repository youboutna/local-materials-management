export interface ConsultantProgressInvoiceDTO {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  progressPercentage: number;
  previousProgress: number;
  totalContractAmount: number;
  invoiceAmount: number;
  workDescription: string;
  status: string;
  submittedAt: string;
  projectId: string;
  inspectionId: string;
  supportingDocuments: string[];
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
  projects?: {
    title: string;
    projectType: string;
    fundingSource: string;
  };
  invoice_number: string;
  invoice_type: string;
  progress_percentage: number;
  previous_progress: number;
  total_contract_amount: number;
  invoice_amount: number;
  work_description: string;
  submitted_at: string;
  project_id: string;
  inspection_id: string;
  supporting_documents: string[];
  submitted_by: string;
  created_at: string;
  updated_at: string;
}

export interface ConsultantInvoiceDecision {
  status: 'consultant_approved' | 'consultant_rejected';
  consultantId: string;
  comments: string;
  approved: boolean;
  serviceFaitDocumentId: string | null;
  validatedAt: string;
  workflowHistory: Array<{
    action: 'consultant_approved' | 'consultant_rejected';
    timestamp: string;
    user_id: string;
    employee_id: string;
    comments: string;
    status: 'consultant_approved' | 'consultant_rejected';
  }>;
}
