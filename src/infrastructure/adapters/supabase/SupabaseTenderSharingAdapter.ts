// src/infrastructure/adapters/supabase/SupabaseTenderSharingAdapter.ts
/**
 * SupabaseTenderSharingAdapter - Infrastructure Adapter
 * Implements ITenderSharingRepository for Supabase
 */

import { ITenderSharingRepository } from '@/domain/repositories/ITenderSharingRepository';
import {
  AccessLogDTO,
  CreateAccessLogDTO,
  CreateSharingSecretDTO,
  TenderSharingSecretDTO,
  ValidateSecretResponseDTO
} from '@/dtos/entities/tender-sharing-dto';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

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

export class SupabaseTenderSharingAdapter implements ITenderSharingRepository {
  async generateSecretCode(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_tender_secret_code' as any);
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
        message: secret.supplier_email || 'Valid secret',
        tenderId: secret.tender_id ?? undefined,
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
      const insertData: any = {
        sharing_secret_id: dto.sharingSecretId,
        accessed_at: dto.accessedAt || new Date().toISOString(),
        action_type: dto.actionType || 'share',
        
        // Destinataire
        accessed_by: dto.accessedBy || dto.metadata?.supplierEmail || null,
        recipient_id: dto.metadata?.recipientId || null,
        recipient_name: dto.metadata?.supplierName || null,
        is_email_modified: dto.metadata?.isEmailModified || false,
        
        // Émetteur
        shared_by: dto.metadata?.senderEmail || null,
        sender_name: dto.metadata?.senderName || null,
        sender_id: dto.metadata?.senderId || null,
        
        // Contexte
        secret_code: dto.metadata?.secretCode || null,
        tender_id: dto.metadata?.tenderId || null,
        tender_title: dto.metadata?.tenderTitle || null,
        expires_at: dto.metadata?.expiresAt || null,
        message: dto.metadata?.message || null,
        
        // Métadonnées complètes
        metadata: {
          ...(dto.metadata || {}),
          channel: dto.metadata?.channel || 'email',
          timestamp: new Date().toISOString(),
        },
      };

      const { data, error } = await (supabase as any)
        .from('tender_access_logs')
        .insert([insertData])
        .select()
        .single();


      if (error) {
        console.warn('SupabaseTenderSharingAdapter: createAccessLog failed', error);
        // Fallback mock
        return {
          id: crypto.randomUUID?.() || Date.now().toString(),
          sharingSecretId: dto.sharingSecretId,
          accessedAt: dto.accessedAt || new Date().toISOString(),
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          accessedDocuments: dto.accessedDocuments,
          actionType: dto.actionType || 'share',
          metadata: dto.metadata,
        };
      }

      return {
        id: data.id,
        sharingSecretId: data.sharing_secret_id,
        accessedAt: data.accessed_at,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        accessedDocuments: data.accessed_documents,
        actionType: data.action_type,
        metadata: data.metadata,
      };
    } catch (error) {
      console.warn('SupabaseTenderSharingAdapter: createAccessLog exception', error);
      return {
        id: crypto.randomUUID?.() || Date.now().toString(),
        sharingSecretId: dto.sharingSecretId,
        accessedAt: dto.accessedAt || new Date().toISOString(),
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        accessedDocuments: dto.accessedDocuments,
        actionType: dto.actionType || 'share',
        metadata: dto.metadata,
      };
    }
  }

  async getAccessLogsBySecretCode(secretCode: string): Promise<AccessLogDTO[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('tender_access_logs')
        .select('*')
        .eq('secret_code', secretCode)
        .order('accessed_at', { ascending: false });

      if (error) return [];
      return data ? data.map((row: any) => ({
        id: row.id,
        sharingSecretId: row.sharing_secret_id,
        accessedAt: row.accessed_at,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        accessedDocuments: row.accessed_documents,
        actionType: row.action_type,
        metadata: row.metadata,
      })) : [];
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