export interface Supplier {
  id: string;
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  category?: string | null;
  rating?: number | null;
  is_active: boolean | null;
  user_id?: string | null;
  default_password_reset_required: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SupplierNotification {
  id: string;
  supplier_id?: string | null;
  task_id?: string | null;
  notification_type: string; // Allow any string from database
  email: string;
  reset_token?: string | null;
  sent_at?: string | null;
  expires_at?: string | null;
  used_at?: string | null;
  created_by?: string | null;
  metadata?: any;
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
  metadata?: any;
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