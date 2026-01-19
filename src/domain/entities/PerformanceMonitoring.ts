export interface DatabaseMetrics {
  connections: number;
  maxConnections: number;
  queryTime: number;
  slowQueries: number;
}

export interface PerformanceMetrics {
  database: DatabaseMetrics;
  timestamp: Date;
}

export interface TenderEstimate {
  id: string;
  tenderId: string;
  projectId?: string;
  estimateType: string;
  totalMaterialsCost?: number;
  totalLaborCost?: number;
  totalEquipmentCost?: number;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  totalWithTax?: number;
  overheadPercentage?: number;
  overheadAmount?: number;
  profitMarginPercentage?: number;
  profitMarginAmount?: number;
  finalTotal?: number;
  currency?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
  submittedBy?: string;
}

export interface TenderEstimateItem {
  id: string;
  estimateId: string;
  materialId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
  itemType?: string;
  createdAt: Date;
  updatedAt: Date;
}
