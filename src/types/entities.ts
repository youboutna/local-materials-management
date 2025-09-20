// Database entity types that map directly to database tables
export interface ProjectEntity {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
  end_date?: string;
  thumbnail: string;
  team_size: number;
  coordinates_latitude?: number;
  coordinates_longitude?: number;
  financing_source?: string;
  market_type?: string;
  selection_mode?: string;
  launch_date?: string;
  attribution_date?: string;
  project_responsable_id?: string;
  main_contractor?: string;
  project_reference?: string;
  allows_initial_payment?: boolean;
  initial_payment_percentage?: number;
  current_phase?: string;
  current_stage?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectPhaseEntity {
  id: string;
  project_id: string;
  phase_name?: string;
  construction_phase?: string;
  construction_stage?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  progress?: number;
  actual_cost?: number;
  estimated_cost?: number;
  dependencies?: any;
  custom_phase_data?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ProjectRiskEntity {
  id: string;
  project_id: string;
  risk_title?: string;
  risk_description?: string;
  probability?: string; // Database stores as string
  impact?: string; // Database stores as string
  mitigation_strategy?: string;
  status?: string;
  identified_by?: string;
  identified_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskAssignmentEntity {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_by?: string;
  status: string;
  priority: string;
  due_date?: string;
  completion_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionEntity {
  id: string;
  project_id: string;
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: number;
  comments?: string;
  phase_id?: string;
  documents?: any;
  created_at: string;
  updated_at: string;
}

export interface PaymentEntity {
  id: string;
  project_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  progress_at_payment: number;
  transaction_id: string;
  contractor_id?: string;
  contractor_name: string;
  contractor_contact: string;
  bank_name?: string;
  account_number?: string;
  check_number?: string;
  mobile_number?: string;
  mobile_operator?: string;
  receiver_name?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialEntity {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price_per_unit: number;
  available_quantity: number;
  sku?: string;
  coordinates_latitude?: number;
  coordinates_longitude?: number;
  workspace_id?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeEntity {
  id: string;
  employee_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  salary?: number;
  is_active: boolean;
  user_id?: string;
  manager_id?: string;
  superior_id?: string;
  skills?: string[];
  certifications?: any;
  created_at: string;
  updated_at: string;
}