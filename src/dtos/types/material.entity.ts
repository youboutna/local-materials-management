export interface MaterialEntity {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  unit_price?: number;
  category?: string;
  supplier?: string;
  specifications?: any;
  created_at: string;
  updated_at: string;
}

export interface ProjectMaterialEntity {
  id: string;
  project_id: string;
  material_id: string;
  quantity: number;
  estimated_cost?: number;
  actual_cost?: number;
  procurement_status?: string;
  delivery_date?: string;
  created_at: string;
  updated_at: string;
}
