/**
 * SupabaseTenderSharingAdapter - Infrastructure Adapter
 * Implements ITenderSharingRepository for Supabase
 * Handles CRUD operations and business logic for tender sharing
 * 
 * Following hexagonal architecture: Adapter (Infrastructure) → Repository Interface (Domain) → Service (Application)
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  TenderSharingSecretDTO, 
  CreateSharingSecretDTO, 
  AccessLogDTO, 
  CreateAccessLogDTO,
  ValidateSecretResponseDTO 
} from '@/dtos/entities/tender-sharing-dto';
import { ITenderSharingRepository } from '@/domain/repositories/ITenderSharingRepository';

/**
 * Field mapping helpers for database snake_case to DTO camelCase conversion
 */
const mapDbRowToTenderSharingSecretDTO = (row: Record<string, unknown>): TenderSharingSecretDTO => ({
  id: row.id,
  tenderId: row.tender_id,
  secretCode: row.secret_code,
  sharedBy: row.shared_by,
  supplierEmail: row.supplier_email,
  supplierId: row.supplier_id,
  expiresAt: row.expires_at,
  isActive: row.is_active,
  accessCount: row.access_count,
  maxAccessCount: row.max_access_count,
  workflowPhase: row.workflow_phase,
  workflowStage: row.workflow_stage,
  allowedDocumentIds: row.allowed_document_ids,
  metadata: row.metadata,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapDbRowToAccessLogDTO = (row: Record<string, unknown>): AccessLogDTO => ({
  id: row.id,
  sharingSecretId: row.sharing_secret_id,
  accessedAt: row.accessed_at,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  accessedDocuments: row.accessed_documents,
  actionType: row.action_type,
  metadata: row.metadata
});

export class SupabaseTenderSharingAdapter implements ITenderSharingRepository {
  /**
   * Generate a unique secret code for tender sharing
   */
  async generateSecretCode(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_tender_secret_code');
      
      if (error) {
        console.error('Error generating secret code:', error);
        throw new Error('Failed to generate secret code');
      }
      
      return data;
    } catch (error) {
      console.error('Unexpected error in generateSecretCode:', error);
      throw new Error('Failed to generate secret code');
    }
  }

  /**
   * Create a new sharing secret for tender documents
   */
  async createSharingSecret(dto: CreateSharingSecretDTO): Promise<TenderSharingSecretDTO> {
    try {
      const { data, error } = await supabase
        .from('tender_sharing_secrets')
        .insert({
          tender_id: dto.tenderId,
          secret_code: await this.generateSecretCode(),
          shared_by: dto.sharedBy,
          supplier_email: dto.supplierEmail,
          supplier_id: dto.supplierId,
          expires_at: dto.expiresAt,
          is_active: true,
          access_count: 0,
          max_access_count: dto.maxAccessCount || 50,
          workflow_phase: dto.workflowPhase,
          workflow_stage: dto.workflowStage,
          allowed_document_ids: dto.allowedDocumentIds,
          metadata: dto.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating sharing secret:', error);
        throw new Error('Failed to create sharing secret');
      }

      return data ? mapDbRowToTenderSharingSecretDTO(data) : null;
    } catch (error) {
      console.error('Unexpected error in createSharingSecret:', error);
      throw new Error('Failed to create sharing secret');
    }
  }

  /**
   * Get sharing secret by ID
   */
  async getSharingSecretById(id: string): Promise<TenderSharingSecretDTO | null> {
    try {
      const { data, error } = await supabase
        .from('tender_sharing_secrets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error getting sharing secret:', error);
        return null;
      }

      return data ? mapDbRowToTenderSharingSecretDTO(data) : null;
    } catch (error) {
      console.error('Unexpected error in getSharingSecretById:', error);
      return null;
    }
  }

  /**
   * Update sharing secret
   */
  async updateSharingSecret(id: string, dto: Partial<TenderSharingSecretDTO>): Promise<TenderSharingSecretDTO> {
    try {
      const { data, error } = await supabase
        .from('tender_sharing_secrets')
        .update({
          updated_at: new Date().toISOString(),
          ...dto
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating sharing secret:', error);
        throw new Error('Failed to update sharing secret');
      }

      return data ? mapDbRowToTenderSharingSecretDTO(data) : null;
    } catch (error) {
      console.error('Unexpected error in updateSharingSecret:', error);
      throw new Error('Failed to update sharing secret');
    }
  }

  /**
   * Delete sharing secret
   */
  async deleteSharingSecret(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tender_sharing_secrets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting sharing secret:', error);
        throw new Error('Failed to delete sharing secret');
      }
    } catch (error) {
      console.error('Unexpected error in deleteSharingSecret:', error);
      throw new Error('Failed to delete sharing secret');
    }
  }

  /**
   * Get sharing secrets by tender ID
   */
  async getSharingSecretsByTenderId(tenderId: string): Promise<TenderSharingSecretDTO[]> {
    try {
      const { data, error } = await supabase
        .from('tender_sharing_secrets')
        .select('*')
        .eq('tender_id', tenderId)
        .order('created_at', 'desc');

      if (error) {
        console.error('Error getting sharing secrets:', error);
        return [];
      }

      return data ? data.map(mapDbRowToTenderSharingSecretDTO) : [];
    } catch (error) {
      console.error('Unexpected error in getSharingSecretsByTenderId:', error);
      return [];
    }
  }

  /**
   * Validate secret code
   */
  async validateSecret(secretCode: string): Promise<ValidateSecretResponseDTO> {
    try {
      // Get the secret record
      const { data: secret, error: secretError } = await supabase
        .from('tender_sharing_secrets')
        .select('*')
        .eq('secret_code', secretCode)
        .single();

      if (secretError || !secret) {
        return {
          isValid: false,
          message: 'Secret not found',
          expiresAt: null
        };
      }

      // Check if secret is active and not expired
      const now = new Date();
      const expiresAt = new Date(secret.expires_at);
      
      if (!secret.is_active) {
        return {
          isValid: false,
          message: 'Secret inactive',
          expiresAt: secret.expires_at || null
        };
      }

      if (expiresAt < now) {
        return {
          isValid: false,
          message: secret.is_active ? 'Secret expired' : 'Secret inactive',
          expiresAt: secret.expires_at || null
        };
      }

      return {
        isValid: true,
        message: 'Valid secret',
        expiresAt: secret.expires_at,
        accessCount: secret.access_count,
        maxAccess: secret.max_access_count
      };
    } catch (error) {
      console.error('Unexpected error in validateSecret:', error);
      return {
        isValid: false,
        message: 'Validation failed',
        expiresAt: null
      };
    }
  }

  /**
   * Revoke sharing secret
   */
  async revokeSecret(secretId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tender_sharing_secrets')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', secretId);

      if (error) {
        console.error('Error revoking secret:', error);
        throw new Error('Failed to revoke secret');
      }
    } catch (error) {
      console.error('Unexpected error in revokeSecret:', error);
      throw new Error('Failed to revoke secret');
    }
  }

  /**
   * Increment access count for secret
   */
  async incrementAccessCount(secretId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_secret_access', {
        secret_id: secretId
      });

      if (error) {
        console.error('Error incrementing access count:', error);
        throw new Error('Failed to increment access count');
      }
    } catch (error) {
      console.error('Unexpected error in incrementAccessCount:', error);
      throw new Error('Failed to increment access count');
    }
  }

  /**
   * Create access log entry
   */
  async createAccessLog(dto: CreateAccessLogDTO): Promise<AccessLogDTO> {
    try {
      // Explicitly type the insert data to match database schema
      const insertData = {
        sharing_secret_id: dto.sharingSecretId,
        accessed_at: dto.accessedAt || new Date().toISOString(),
        ip_address: dto.ipAddress,
        user_agent: dto.userAgent,
        accessed_documents: dto.accessedDocuments || [],
        action_type: dto.actionType || 'view',
        metadata: dto.metadata || {}
      } as const;

      const result = await supabase
        .from('tender_sharing_access_logs' as const)
        .insert(insertData)
        .select('*')
        .single<Record<string, unknown>>();

      const { data, error } = result;

      if (error) {
        console.error('Error creating access log:', error);
        throw new Error('Failed to create access log');
      }

      if (!data) {
        throw new Error('Failed to create access log: No data returned');
      }

      return mapDbRowToAccessLogDTO(data);
    } catch (error) {
      console.error('Unexpected error in createAccessLog:', error);
      throw new Error('Failed to create access log');
    }
  }

  /**
   * Get access logs by secret code
   */
  async getAccessLogsBySecretCode(secretCode: string): Promise<AccessLogDTO[]> {
    try {
      // First get the secret ID
      const secretResult = await supabase
        .from('tender_sharing_secrets' as const)
        .select('id')
        .eq('secret_code', secretCode)
        .single<Record<string, unknown>>();

      if (secretResult.error || !secretResult.data) {
        return [];
      }

      const secretId = (secretResult.data as Record<string, unknown>).id;

      // Then get access logs for this secret
      const { data, error } = await supabase
        .from('tender_sharing_access_logs' as const)
        .select('*')
        .eq('sharing_secret_id', secretId)
        .order('accessed_at', { ascending: false });

      if (error) {
        console.error('Error getting access logs:', error);
        return [];
      }

      return data ? (data as Record<string, unknown>[]).map(mapDbRowToAccessLogDTO) : [];
    } catch (error) {
      console.error('Unexpected error in getAccessLogsBySecretCode:', error);
      return [];
    }
  }

  /**
   * Get access statistics for tender
   */
  async getAccessStatistics(tenderId: string): Promise<{
    uniqueSuppliers: number;
    totalAccesses: number;
    activeSecrets: number;
  }> {
    try {
      // Get unique suppliers with access
      const { data: secrets, error: secretsError } = await supabase
        .from('tender_sharing_secrets')
        .select('supplier_email, access_count, is_active')
        .eq('tender_id', tenderId);

      if (secretsError) throw secretsError;

      const { data: logs, error: logsError } = await supabase
        .from('tender_access_logs')
        .select('supplier_email')
        .eq('tender_id', tenderId);

      if (logsError) throw logsError;

      const uniqueSuppliers = new Set(secrets?.map(s => s.supplier_email).filter(Boolean));
      const totalAccesses = secrets?.reduce((sum, s) => sum + (s.access_count || 0), 0) || 0;
      const activeSecrets = secrets?.filter(s => s.is_active).length || 0;

      return {
        uniqueSuppliers: uniqueSuppliers.size,
        totalAccesses,
        activeSecrets
      };
    } catch (error) {
      console.error('Unexpected error in getAccessStatistics:', error);
      return {
        uniqueSuppliers: 0,
        totalAccesses: 0,
        activeSecrets: 0
      };
    }
  }
}
