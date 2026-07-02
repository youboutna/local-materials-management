export interface BankGuaranteeEntity {
  id: string;
  project_id: string;
  contractor_id: string;
  bank_name: string;
  guarantee_type: string;
  guarantee_amount: number;
  issue_date: string;
  expiry_date: string;
  status: string;
  guarantee_number?: string;
  terms_conditions?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDelayEntity {
  projectId: string;
  projectName: string;
  contractorName: string;
  plannedEndDate: string;
  currentDate: string;
  delayDays: number;
  delayPercentage: number;
  milestonesMissed: number;
}
