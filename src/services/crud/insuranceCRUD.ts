import { supabase } from '@/integrations/supabase/client';
import { 
  InsuranceCertificateDTO, 
  transformInsuranceCertificateToDTO, 
  transformInsuranceCertificateFromDTO,
  validateInsuranceCertificateDTO 
} from '../dto/insuranceDTO';

export class InsuranceCRUDService {
  // Create operation
  static async create(insuranceData: Partial<InsuranceCertificateDTO>): Promise<{
    success: boolean;
    data?: InsuranceCertificateDTO;
    error?: string;
  }> {
    try {
      // Validate input
      const validationErrors = validateInsuranceCertificateDTO(insuranceData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: `Validation errors: ${validationErrors.join(', ')}`
        };
      }

      const dbRecord = transformInsuranceCertificateFromDTO(insuranceData);
      
      const { data, error } = await supabase
        .from('insurance_certificates')
        .insert(dbRecord)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: transformInsuranceCertificateToDTO(data)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create insurance certificate'
      };
    }
  }

  // Read operations
  static async getById(id: string): Promise<{
    success: boolean;
    data?: InsuranceCertificateDTO;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: transformInsuranceCertificateToDTO(data)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch insurance certificate'
      };
    }
  }

  static async getByProject(projectId: string): Promise<{
    success: boolean;
    data?: InsuranceCertificateDTO[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('project_id', projectId)
        .order('valid_until', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data.map(transformInsuranceCertificateToDTO)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch insurance certificates'
      };
    }
  }

  static async getByContractor(contractorId: string): Promise<{
    success: boolean;
    data?: InsuranceCertificateDTO[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('valid_until', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data.map(transformInsuranceCertificateToDTO)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch insurance certificates'
      };
    }
  }

  static async getExpiring(daysAhead: number = 30): Promise<{
    success: boolean;
    data?: InsuranceCertificateDTO[];
    error?: string;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('status', 'active')
        .lte('valid_until', cutoffDate.toISOString())
        .order('valid_until', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data.map(transformInsuranceCertificateToDTO)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch expiring certificates'
      };
    }
  }

  static async getAll(
    filters?: {
      status?: string;
      coverageType?: string;
      insuranceCompany?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    success: boolean;
    data?: InsuranceCertificateDTO[];
    count?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('insurance_certificates')
        .select('*', { count: 'exact' });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.coverageType) {
        query = query.eq('coverage_type', filters.coverageType);
      }
      if (filters?.insuranceCompany) {
        query = query.eq('insurance_company', filters.insuranceCompany);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data?.map(transformInsuranceCertificateToDTO) || [],
        count: count || 0
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch insurance certificates'
      };
    }
  }

  // Update operation
  static async update(id: string, updates: Partial<InsuranceCertificateDTO>): Promise<{
    success: boolean;
    data?: InsuranceCertificateDTO;
    error?: string;
  }> {
    try {
      // Validate updates
      const validationErrors = validateInsuranceCertificateDTO(updates);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: `Validation errors: ${validationErrors.join(', ')}`
        };
      }

      const dbRecord = transformInsuranceCertificateFromDTO(updates);
      
      const { data, error } = await supabase
        .from('insurance_certificates')
        .update({
          ...dbRecord,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: transformInsuranceCertificateToDTO(data)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update insurance certificate'
      };
    }
  }

  // Update status only
  static async updateStatus(id: string, status: string): Promise<{
    success: boolean;
    data?: InsuranceCertificateDTO;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: transformInsuranceCertificateToDTO(data)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update insurance status'
      };
    }
  }

  // Mark as verified
  static async markAsVerified(id: string, verifiedBy: string): Promise<{
    success: boolean;
    data?: InsuranceCertificateDTO;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .update({ 
          last_verified: new Date().toISOString(),
          verified_by: verifiedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: transformInsuranceCertificateToDTO(data)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to mark insurance as verified'
      };
    }
  }

  // Delete operation
  static async delete(id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('insurance_certificates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete insurance certificate'
      };
    }
  }

  // Bulk operations
  static async bulkUpdateStatus(ids: string[], status: string): Promise<{
    success: boolean;
    updatedCount?: number;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', ids)
        .select('id');

      if (error) throw error;

      return {
        success: true,
        updatedCount: data?.length || 0
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to bulk update insurance certificates'
      };
    }
  }

  // Search operation
  static async search(searchTerm: string, filters?: {
    projectId?: string;
    contractorId?: string;
    status?: string;
  }): Promise<{
    success: boolean;
    data?: InsuranceCertificateDTO[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from('insurance_certificates')
        .select('*');

      // Text search
      if (searchTerm) {
        query = query.or(`contractor_name.ilike.%${searchTerm}%,insurance_company.ilike.%${searchTerm}%,policy_number.ilike.%${searchTerm}%`);
      }

      // Apply filters
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.contractorId) {
        query = query.eq('contractor_id', filters.contractorId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data?.map(transformInsuranceCertificateToDTO) || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search insurance certificates'
      };
    }
  }
}