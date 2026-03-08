// @ts-nocheck
import { Json } from '@/integrations/supabase/types';

// Database row interface for workspaces table
interface WorkspaceRow {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  capacity?: number | null;
  status?: string | null;
  contact_manager?: string | null;
  contact_phone?: string | null;
  facilities?: Json; // Supabase Json type - can be string[] or null
  created_at: string;
  updated_at: string;
}

/**
 * Supabase implementation of Workspace Repository
 * Follows hexagonal architecture principles
 */
export class SupabaseWorkspaceAdapter implements IWorkspaceRepository {
  /**
   * Create a new workspace
   */
  async create(workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
    try {
      const workspaceData = {
        id: workspace.workspaceId || crypto.randomUUID(),
        name: workspace.name,
        description: workspace.description,
        location: typeof workspace.location === 'string' ? workspace.location : workspace.location.name,
        capacity: workspace.capacity,
        status: workspace.status,
        contact_manager: workspace.contact?.manager,
        contact_phone: workspace.contact?.phone,
        facilities: workspace.facilities,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('workspaces')
        .insert(workspaceData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create workspace: ${error.message}`);
      }

      return this.mapToEntity(data);
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.create error:', error);
      throw error;
    }
  }

  /**
   * Get workspace by ID
   */
  async findById(id: string): Promise<Workspace | null> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to find workspace: ${error.message}`);
      }

      return this.mapToEntity(data);
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.findById error:', error);
      throw error;
    }
  }

  /**
   * Get all workspaces
   */
  async findAll(): Promise<Workspace[]> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch workspaces: ${error.message}`);
      }

      return data.map(d => this.mapToEntity(d));
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.findAll error:', error);
      throw error;
    }
  }

  /**
   * Update an existing workspace
   */
  async update(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.location !== undefined) {
        updateData.location = typeof updates.location === 'string' ? updates.location : updates.location.name;
      }
      if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.contact?.manager !== undefined) updateData.contact_manager = updates.contact.manager;
      if (updates.contact?.phone !== undefined) updateData.contact_phone = updates.contact.phone;
      if (updates.facilities !== undefined) updateData.facilities = updates.facilities;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('workspaces')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update workspace: ${error.message}`);
      }

      return this.mapToEntity(data);
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.update error:', error);
      throw error;
    }
  }

  /**
   * Delete a workspace
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete workspace: ${error.message}`);
      }
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.delete error:', error);
      throw error;
    }
  }

  /**
   * Get workspaces by status
   */
  async findByStatus(status: string): Promise<Workspace[]> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch workspaces by status: ${error.message}`);
      }

      return data.map(d => this.mapToEntity(d));
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.findByStatus error:', error);
      throw error;
    }
  }

  /**
   * Get workspaces by location
   */
  async findByLocation(location: string): Promise<Workspace[]> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('location', location)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch workspaces by location: ${error.message}`);
      }

      return data.map(d => this.mapToEntity(d));
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.findByLocation error:', error);
      throw error;
    }
  }

  /**
   * Map database row to Workspace entity
   */
  private mapToEntity(data: WorkspaceRow): Workspace {
    return {
      id: data.id,
      workspaceId: data.id, // Assuming workspaceId is same as id for now
      workspaceCode: `WS-${data.id.slice(0, 8)}`, // Generate a simple code
      name: data.name,
      location: data.location || 'Nouakchott', // String location for now
      description: data.description || undefined,
      capacity: data.capacity || undefined,
      contact: (data.contact_manager || data.contact_phone) ? {
        manager: data.contact_manager || '',
        phone: data.contact_phone || ''
      } : undefined,
      facilities: Array.isArray(data.facilities) ? data.facilities : undefined,
      status: data.status === 'active' ? OperationalStatus.active :
             data.status === 'inactive' ? OperationalStatus.inactive :
             OperationalStatus.closed,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}
