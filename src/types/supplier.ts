export interface Supplier {
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

export interface CreateSupplierInput {
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  specialization: string[];
  rating: number;
  contractStart: string;
  contractEnd: string;
}

export interface UpdateSupplierInput {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  specialization?: string[];
  rating?: number;
  isActive?: boolean;
  contractStart?: string;
  contractEnd?: string;
}

export interface UseSuppliersHexResult {
  suppliers: Supplier[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createSupplier: (data: CreateSupplierInput) => void;
  updateSupplier: (id: string, data: UpdateSupplierInput) => void;
  deleteSupplier: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseSupplierHexResult {
  supplier: Supplier | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface SupplierLegacy {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  rating?: number;
  is_active: boolean;
  user_id?: string;
  default_password_reset_required: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface SupplierNotification {
  id: string;
  supplier_id?: string;
  task_id?: string;
  notification_type: string; // Allow any string from database
  email: string;
  reset_token?: string;
  sent_at?: string;
  expires_at?: string;
  used_at?: string;
  created_by?: string;
  metadata?: Record<string, unknown>;
}

export interface SupplierViewedItem {
  id: string;
  supplier_id: string;
  item_id: string;
  item_type: 'document' | 'task' | 'notification';
  viewed_at: string;
  created_at: string;
}

export interface SupplierPayment {
  id: string;
  supplier_id: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  reference_number?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentWithViewStatus {
  id: string;
  title: string;
  description?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  document_type: string;
  status?: string | null;
  uploaded_by?: string | null;
  assigned_to?: string | null;
  metadata?: Record<string, unknown>;
  tags?: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  projects?: {
    title: string;
    status: string;
  } | null;
  payments?: {
    amount: number;
    payment_date: string;
  } | null;
  supplier_viewed_items?: {
    id: string;
    viewed_at: string;
  }[] | null;
}

export interface TaskWithViewStatus extends SupplierNotification {
  supplier_viewed_items?: {
    id: string;
    viewed_at: string;
  }[];
}