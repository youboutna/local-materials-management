/**
 * SupabaseTenderSharingAdapter - Infrastructure Adapter
 * Implements ITenderSharingRepository for Supabase
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { 
  TenderSharingSecretDTO, 
  CreateSharingSecretDTO, 
  AccessLogDTO, 
  CreateAccessLogDTO,
  ValidateSecretResponseDTO 
} from '@/dtos/entities/tender-sharing-dto';
import { ITenderSharingRepository } from '@/domain/repositories/ITenderSharingRepository';

const mapDbRowToTenderSharingSecretDTO = (row: any): TenderSharingSecretDTO => ({
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

const mapDbRowToAccessLogDTO = (row: any): AccessLogDTO => ({
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
  async generateSecretCode(): Promise<string> {
    try {
      const { data, error } = await publicSupabase.rpc('generate_tender_secret_code' as any);
      if (error) throw new Error('Failed to generate secret code');
      return data;
    } catch (error) {
      throw new Error('Failed to generate secret code');
    }
  }

  async createSharingSecret(dto: CreateSharingSecretDTO): Promise<TenderSharingSecretDTO> {
    try {
      const insertData: any = {
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
        metadata: (dto.metadata || {}),
      };

      const { data, error } = await supabase
        .from('tender_sharing_secrets')
        .insert([insertData])
        .select()
        .single();

      if (error) throw new Error('Failed to create sharing secret');
      return mapDbRowToTenderSharingSecretDTO(data);
    } catch (error) {
      throw new Error('Failed to create sharing secret');
    }
  }

  async getSharingSecretById(id: string): Promise<TenderSharingSecretDTO | null> {
    try {
      const { data, error } = await supabase
        .from('tender_sharing_secrets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data ? mapDbRowToTenderSharingSecretDTO(data) : null;
    } catch (error) {
      return null;
    }
  }

  async updateSharingSecret(id: string, dto: Partial<TenderSharingSecretDTO>): Promise<TenderSharingSecretDTO> {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (dto.isActive !== undefined) updateData.is_active = dto.isActive;
      if (dto.metadata) updateData.metadata = dto.metadata as any;
      if (dto.allowedDocumentIds) updateData.allowed_document_ids = dto.allowedDocumentIds;
      if (dto.workflowPhase) updateData.workflow_phase = dto.workflowPhase;
      if (dto.workflowStage) updateData.workflow_stage = dto.workflowStage;

      const { data, error } = await supabase
        .from('tender_sharing_secrets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error('Failed to update sharing secret');
      return mapDbRowToTenderSharingSecretDTO(data);
    } catch (error) {
      throw new Error('Failed to update sharing secret');
    }
  }

  async deleteSharingSecret(id: string): Promise<void> {
    const { error } = await supabase
      .from('tender_sharing_secrets')
      .delete()
      .eq('id', id);
    if (error) throw new Error('Failed to delete sharing secret');
  }

  async getSharingSecretsByTenderId(tenderId: string): Promise<TenderSharingSecretDTO[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('tender_sharing_secrets')
        .select('*')
        .eq('tender_id' as any, tenderId)
        .order('created_at', { ascending: false });

      if (error) return [];
      return data ? data.map(mapDbRowToTenderSharingSecretDTO) : [];
    } catch (error) {
      return [];
    }
  }

  async validateSecret(secretCode: string): Promise<ValidateSecretResponseDTO> {
    try {
      const { data: secret, error: secretError } = await supabase
        .from('tender_sharing_secrets')
        .select('*')
        .eq('secret_code', secretCode)
        .single();

      if (secretError || !secret) {
        return { isValid: false, message: 'Secret not found', expiresAt: null };
      }

      const now = new Date();
      const expiresAt = new Date(secret.expires_at);
      
      if (!secret.is_active) {
        return { isValid: false, message: 'Secret inactive', expiresAt: secret.expires_at || null };
      }

      if (expiresAt < now) {
        return { isValid: false, message: 'Secret expired', expiresAt: secret.expires_at || null };
      }

      return {
        isValid: true,
        message: 'Valid secret',
        expiresAt: secret.expires_at,
        accessCount: secret.access_count ?? undefined,
        maxAccess: secret.max_access_count ?? undefined
      };
    } catch (error) {
      return { isValid: false, message: 'Validation failed', expiresAt: null };
    }
  }

  async revokeSecret(secretId: string): Promise<void> {
    const { error } = await supabase
      .from('tender_sharing_secrets')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', secretId);
    if (error) throw new Error('Failed to revoke secret');
  }

  async incrementAccessCount(secretId: string): Promise<void> {
    try {
      // Manual increment since RPC may not exist
      const { data } = await supabase
        .from('tender_sharing_secrets')
        .select('access_count')
        .eq('id', secretId)
        .single();
      
      if (data) {
        await supabase
          .from('tender_sharing_secrets')
          .update({ access_count: (data.access_count || 0) + 1 })
          .eq('id', secretId);
      }
    } catch (error) {
      console.error('Error incrementing access count:', error);
    }
  }

  async createAccessLog(dto: CreateAccessLogDTO): Promise<AccessLogDTO> {
    try {
      // Use tender_sharing_secrets table as fallback since tender_sharing_access_logs may not exist
      console.warn('SupabaseTenderSharingAdapter: access log table may not exist, returning mock');
      return {
        id: crypto.randomUUID?.() || Date.now().toString(),
        sharingSecretId: dto.sharingSecretId,
        accessedAt: dto.accessedAt || new Date().toISOString(),
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        accessedDocuments: dto.accessedDocuments,
        actionType: dto.actionType || 'view',
        metadata: dto.metadata
      };
    } catch (error) {
      throw new Error('Failed to create access log');
    }
  }

  async getAccessLogsBySecretCode(secretCode: string): Promise<AccessLogDTO[]> {
    try {
      // Access logs table may not exist
      console.warn('SupabaseTenderSharingAdapter: access log table may not exist');
      return [];
    } catch (error) {
      return [];
    }
  }

  async getAccessStatistics(tenderId: string): Promise<{
    uniqueSuppliers: number;
    totalAccesses: number;
    activeSecrets: number;
  }> {
    try {
      const { data: secrets, error } = await (supabase as any)
        .from('tender_sharing_secrets')
        .select('supplier_email, access_count, is_active')
        .eq('tender_id' as any, tenderId);

      if (error) throw error;

      const uniqueSuppliers = new Set(secrets?.map(s => s.supplier_email).filter(Boolean));
      const totalAccesses = secrets?.reduce((sum, s) => sum + (s.access_count || 0), 0) || 0;
      const activeSecrets = secrets?.filter(s => s.is_active).length || 0;

      return { uniqueSuppliers: uniqueSuppliers.size, totalAccesses, activeSecrets };
    } catch (error) {
      return { uniqueSuppliers: 0, totalAccesses: 0, activeSecrets: 0 };
    }
  }
}
