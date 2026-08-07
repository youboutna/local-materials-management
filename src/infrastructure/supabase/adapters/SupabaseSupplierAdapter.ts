
/**
 * Supabase Adapter for Supplier Repository
 * Implements ISupplierRepository using Supabase
 * Rule #9: DB → Transformer → Entity → Repository → Service
 * Adapter NEVER calls `new Entity()` — always uses Transformer
 */
import { Supplier, SupplierCategory, SupplierStatus } from '@/domain/entities/Supplier';
import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { SupplierTransformer } from '@/dtos/transforms/SupplierTransformer';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { Database } from '@/integrations/supabase/types';

type SupplierRow = Database['btp']['Tables']['suppliers']['Row'];

export class SupabaseSupplierAdapter implements ISupplierRepository {
  private mapToEntity(data: SupplierRow): Supplier {
    return SupplierTransformer.fromDatabaseRow(data as Record<string, unknown>);
  }

  async findById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findByExternalRef(externalRef: string): Promise<Supplier | null> {
    const { data, error } = await (supabase as any).from('suppliers').select('*').eq('external_ref', externalRef).maybeSingle();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Supplier[]> {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async save(supplier: Supplier): Promise<void> {
    const dbData = SupplierTransformer.toSupabase(supplier);
    const { error } = await supabase.from('suppliers').insert([dbData as Database['btp']['Tables']['suppliers']['Insert']]);
    if (error) throw new Error(`Failed to save supplier: ${error.message}`);
  }

  async update(id: string, data: Partial<Supplier>): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.nif !== undefined) updateData.nif = data.nif;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.status !== undefined) updateData.is_active = data.status === 'active';
    if (data.externalRef !== undefined) updateData.external_ref = data.externalRef;

    const { error } = await supabase.from('suppliers').update(updateData as Database['btp']['Tables']['suppliers']['Update']).eq('id', id);
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
    const { data, error } = await supabase.from('suppliers').select('*').eq('category', category as string);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByWorkspace(workspaceId: string): Promise<Supplier[]> {
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
  async findVerified(): Promise<Supplier[]> { return []; }
  async findEligibleForTenders(): Promise<Supplier[]> {
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
