/**
 * User Entity
 * Represents a user profile in the domain
 */

export interface User {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  national_id?: string | null;
  role?: string | null;
  email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_active?: boolean;
}

export type UserRole = 'admin' | 'manager' | 'employee' | 'supplier' | 'inspector' | 'engineer';
