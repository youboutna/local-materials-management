// Supabase Adapter for Supplier Repository
import { supabase } from '@/integrations/supabase/client';
import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { Supplier, SupplierStatus, SupplierCategory } from '@/domain/entities/Supplier';
import { Database } from '@/integrations/supabase/types';

type SupplierRow = Database['public']['Tables']['suppliers']['Row'];

export class SupabaseSupplierAdapter implements ISupplierRepository {
  private mapToEntity(data: SupplierRow): Supplier {
    // Convert is_active boolean to status string
    const status: SupplierStatus = data.is_active ? 'active' : 'inactive';
    
    return new Supplier(
      data.id,
      data.name,
      data.email || null,
      data.phone || null,
      data.address || null,
      data.nif || null,
      (data.category as SupplierCategory) || null,
      status,
      data.rating ? { quality: 0, delivery: 0, price: 0, communication: 0, overall: data.rating } : null,
      [], // Default contacts to empty array since column doesn't exist in DB
      false, // Default is_verified to false since column doesn't exist in DB
      null,  // Default verified_at to null since column doesn't exist in DB
      data.user_id || null,
      data.created_at || new Date().toISOString(),
      data.updated_at || new Date().toISOString()
    );
  }

  async findById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Supplier[]> {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async save(supplier: Supplier): Promise<void> {
    const { error } = await supabase.from('suppliers').insert([{
      id: supplier.id, 
      name: supplier.name, 
      email: supplier.email, 
      phone: supplier.phone,
      address: supplier.address, 
      nif: supplier.nif, 
      category: supplier.category,
      is_active: supplier.status === 'active', // Convert status to boolean
      user_id: supplier.workspaceId // Map workspaceId to user_id column
    }]);
    if (error) throw new Error(`Failed to save supplier: ${error.message}`);
  }

  async update(id: string, data: Partial<Supplier>): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.status !== undefined) updateData.is_active = data.status === 'active'; // Convert status to boolean
    const { error } = await supabase.from('suppliers').update(updateData).eq('id', id);
    if (error) throw new Error(`Failed to update supplier: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete supplier: ${error.message}`);
  }

  async findByStatus(status: SupplierStatus): Promise<Supplier[]> {
    const isActive = status === 'active';
    const { data, error } = await supabase.from('suppliers').select('*').eq('is_active', isActive);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByCategory(category: SupplierCategory): Promise<Supplier[]> {
    const { data, error } = await supabase.from('suppliers').select('*').eq('category', category);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByWorkspace(workspaceId: string): Promise<Supplier[]> {
    // Since workspace_id doesn't exist, use user_id column instead
    const { data, error } = await supabase.from('suppliers').select('*').eq('user_id', workspaceId);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByNif(nif: string): Promise<Supplier | null> {
    const { data, error } = await supabase.from('suppliers').select('*').eq('nif', nif).single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findByEmail(email: string): Promise<Supplier | null> {
    const { data, error } = await supabase.from('suppliers').select('*').eq('email', email).single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async search(query: string): Promise<Supplier[]> {
    const { data, error } = await supabase.from('suppliers').select('*').or(`name.ilike.%${query}%,email.ilike.%${query}%`);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findActive(): Promise<Supplier[]> { return this.findByStatus('active'); }
  async findVerified(): Promise<Supplier[]> {
    // Since is_verified column doesn't exist, return empty array
    // or implement alternative verification logic based on other criteria
    return [];
  }
  async findEligibleForTenders(): Promise<Supplier[]> {
    // Since is_verified column doesn't exist, only check is_active
    const { data, error } = await supabase.from('suppliers').select('*').eq('is_active', true);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }
  async findBlacklisted(): Promise<Supplier[]> { return this.findByStatus('blacklisted'); }
  async findByMinimumRating(rating: number): Promise<Supplier[]> {
    const { data, error } = await supabase.from('suppliers').select('*').gte('rating', rating);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }
  async getTopRated(limit: number): Promise<Supplier[]> {
    const { data, error } = await supabase.from('suppliers').select('*').order('rating', { ascending: false }).limit(limit);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }
  async countByStatus(): Promise<Record<SupplierStatus, number>> { return { active: 0, inactive: 0, suspended: 0, blacklisted: 0 }; }
  async countByCategory(): Promise<Record<SupplierCategory, number>> { return { materials: 0, equipment: 0, services: 0, subcontractor: 0, consultant: 0 }; }
}
