/**
 * SupabaseSupplierPaymentAdapter - Adapter hexagonal pour les paiements fournisseurs
 * 
 * Architecture Hexagonale - ADAPTER
 * - Implémente ISupplierPaymentRepository
 * - Utilise la table supplier_payment_requests
 * - Conversion snake_case DB ↔ camelCase DTO
 * - Gestion des erreurs avec AppError
 */

import { supabase } from '@/integrations/supabase/client';
import { ISupplierPaymentRepository } from '@/domain/repositories/ISupplierPaymentRepository';
import { 
  SupplierPaymentRequestDTO, 
  CreateSupplierPaymentRequestDTO,
  UpdateSupplierPaymentRequestDTO,
  SupplierPaymentStatus,
  SupplierPaymentStatsDTO,
  SupplierPaymentRequestListDTO,
  normalizePaymentStatus,
  normalizePaymentType
} from '@/dtos/entities/SupplierPaymentDTO';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Database row type matching the table structure
interface SupplierPaymentRequestRow {
  id: string;
  inspection_id: string;
  supplier_id: string;
  project_id?: string;
  amount: number;
  currency: string;
  status: string;
  requested_at: string;
  processed_at?: string;
  comments?: string;
  notes?: string;
  documents: string[];
  supporting_documents: string[];
  payment_type: string;
  payment_reason?: string;
  bank_account?: string;
  invoice_number?: string;
  invoice_date?: string;
  work_description?: string;
  work_location?: string;
  work_period?: string;
  validated_by?: string;
  approved_by?: string;
  validated_at?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseSupplierPaymentAdapter implements ISupplierPaymentRepository {
  private tableName = 'supplier_payment_requests';

  /**
   * Map database row to DTO
   */
  private mapToDTO(row: SupplierPaymentRequestRow): SupplierPaymentRequestDTO {
    return {
      id: row.id,
      inspectionId: row.inspection_id,
      supplierId: row.supplier_id,
      projectId: row.project_id,
      amount: row.amount,
      currency: row.currency || 'MRU',
      status: normalizePaymentStatus(row.status),
      requestedAt: row.requested_at || row.created_at,
      processedAt: row.processed_at,
      comments: row.comments || row.notes,
      notes: row.notes || row.comments,
      documents: row.documents || row.supporting_documents || [],
      supportingDocuments: row.supporting_documents || row.documents || [],
      paymentType: row.payment_type || row.payment_reason || 'other',
      paymentReason: row.payment_reason || row.payment_type,
      bankAccount: row.bank_account,
      invoiceNumber: row.invoice_number,
      invoiceDate: row.invoice_date,
      workDescription: row.work_description,
      workLocation: row.work_location,
      workPeriod: row.work_period,
      validatedBy: row.validated_by || row.approved_by,
      validatedAt: row.validated_at || row.approved_at,
      approvedBy: row.approved_by || row.validated_by,
      approvedAt: row.approved_at || row.validated_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map DTO to database row format
   */
  private mapToRow(dto: Partial<SupplierPaymentRequestDTO | CreateSupplierPaymentRequestDTO | UpdateSupplierPaymentRequestDTO>): Partial<SupplierPaymentRequestRow> {
    const row: Partial<SupplierPaymentRequestRow> = {};
    
    if (dto.inspectionId !== undefined) row.inspection_id = dto.inspectionId;
    if (dto.supplierId !== undefined) row.supplier_id = dto.supplierId;
    if (dto.projectId !== undefined) row.project_id = dto.projectId;
    if (dto.amount !== undefined) row.amount = dto.amount;
    if (dto.currency !== undefined) row.currency = dto.currency;
    if (dto.status !== undefined) row.status = dto.status;
    if (dto.requestedAt !== undefined) row.requested_at = dto.requestedAt;
    if (dto.requestedDate !== undefined) row.requested_at = dto.requestedDate;
    if (dto.processedAt !== undefined) row.processed_at = dto.processedAt;
    if (dto.comments !== undefined) row.comments = dto.comments;
    if (dto.notes !== undefined) row.notes = dto.notes;
    if (dto.documents !== undefined) row.documents = dto.documents;
    if (dto.supportingDocuments !== undefined) row.supporting_documents = dto.supportingDocuments;
    if (dto.paymentType !== undefined) row.payment_type = dto.paymentType;
    if (dto.paymentReason !== undefined) row.payment_reason = dto.paymentReason;
    if (dto.bankAccount !== undefined) row.bank_account = dto.bankAccount;
    if (dto.invoiceNumber !== undefined) row.invoice_number = dto.invoiceNumber;
    if (dto.invoiceDate !== undefined) row.invoice_date = dto.invoiceDate;
    if (dto.workDescription !== undefined) row.work_description = dto.workDescription;
    if (dto.workLocation !== undefined) row.work_location = dto.workLocation;
    if (dto.workPeriod !== undefined) row.work_period = dto.workPeriod;
    if (dto.validatedBy !== undefined) row.validated_by = dto.validatedBy;
    if (dto.approvedBy !== undefined) row.approved_by = dto.approvedBy;
    if (dto.validatedAt !== undefined) row.validated_at = dto.validatedAt;
    if (dto.approvedAt !== undefined) row.approved_at = dto.approvedAt;
    if (dto.rejectionReason !== undefined) row.rejection_reason = dto.rejectionReason;
    
    return row;
  }

  // ===== MÉTHODES DU REPOSITORY =====

  /**
   * Find payment request by ID
   */
  async findById(id: string): Promise<SupplierPaymentRequestDTO | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find payment request: ${error.message}`);
      }

      return data ? this.mapToDTO(data as SupplierPaymentRequestRow) : null;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[SupabaseSupplierPaymentAdapter] findById failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to find payment request by ID');
    }
  }

  /**
   * Find payment request by inspection ID
   */
  async findByInspectionId(inspectionId: string): Promise<SupplierPaymentRequestDTO | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('inspection_id', inspectionId)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find payment request: ${error.message}`);
      }

      return data ? this.mapToDTO(data as SupplierPaymentRequestRow) : null;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[SupabaseSupplierPaymentAdapter] findByInspectionId failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to find payment request by inspection ID');
    }
  }

  /**
   * Find all payment requests for a supplier
   */
  async findBySupplierId(supplierId: string): Promise<SupplierPaymentRequestDTO[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('supplier_id', supplierId)
        .order('requested_at', { ascending: false });

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find payment requests: ${error.message}`);
      }

      return (data || []).map(row => this.mapToDTO(row as SupplierPaymentRequestRow));
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[SupabaseSupplierPaymentAdapter] findBySupplierId failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to find payment requests by supplier ID');
    }
  }

  /**
   * Find all payment requests for a project
   */
  async findByProjectId(projectId: string): Promise<SupplierPaymentRequestDTO[]> {
    try {
      // Recherche directe par project_id
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('project_id', projectId)
        .order('requested_at', { ascending: false });

      if (!error && data) {
        return (data || []).map(row => this.mapToDTO(row as SupplierPaymentRequestRow));
      }

      // Fallback: Recherche via les inspections
      const { data: inspections, error: inspError } = await supabase
        .from('inspections')
        .select('id')
        .eq('project_id', projectId);

      if (inspError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get project inspections: ${inspError.message}`);
      }

      const inspectionIds = inspections?.map(i => i.id) || [];
      if (inspectionIds.length === 0) return [];

      const { data: paymentData, error: paymentError } = await supabase
        .from(this.tableName)
        .select('*')
        .in('inspection_id', inspectionIds)
        .order('requested_at', { ascending: false });

      if (paymentError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find payment requests: ${paymentError.message}`);
      }

      return (paymentData || []).map(row => this.mapToDTO(row as SupplierPaymentRequestRow));
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[SupabaseSupplierPaymentAdapter] findByProjectId failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to find payment requests by project ID');
    }
  }

  /**
   * Find all pending payment requests
   */
  async findPending(): Promise<SupplierPaymentRequestDTO[]> {
    return this.findByStatus('pending');
  }

  /**
   * Find all payment requests by status
   */
  async findByStatus(status: SupplierPaymentStatus): Promise<SupplierPaymentRequestDTO[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('status', status)
        .order('requested_at', { ascending: false });

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find payment requests: ${error.message}`);
      }

      return (data || []).map(row => this.mapToDTO(row as SupplierPaymentRequestRow));
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[SupabaseSupplierPaymentAdapter] findByStatus failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to find payment requests by status');
    }
  }

  /**
   * Find all payment requests with pagination
   */
  async findAll(page: number = 1, limit: number = 20): Promise<SupplierPaymentRequestListDTO> {
    try {
      // Compter le total
      const { count, error: countError } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Récupérer les données paginées
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('requested_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const items = (data || []).map(row => this.mapToDTO(row as SupplierPaymentRequestRow));

      const statusCounts = {
        pending: items.filter(r => r.status === 'pending').length,
        approved: items.filter(r => r.status === 'approved').length,
        rejected: items.filter(r => r.status === 'rejected').length,
        paid: items.filter(r => r.status === 'paid').length,
        cancelled: items.filter(r => r.status === 'cancelled').length,
      };

      return {
        items,
        total: count || 0,
        page,
        limit,
        statusCounts,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[SupabaseSupplierPaymentAdapter] findAll failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch payment requests');
    }
  }

  /**
   * Get payment statistics
   */
  async getStats(supplierId?: string): Promise<SupplierPaymentStatsDTO> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*');

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const items = (data || []).map(row => this.mapToDTO(row as SupplierPaymentRequestRow));
      return this.calculateStats(items);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[SupabaseSupplierPaymentAdapter] getStats failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch payment stats');
    }
  }

  /**
   * Calculate statistics from items
   */
  private calculateStats(items: SupplierPaymentRequestDTO[]): SupplierPaymentStatsDTO {
    const totalAmount = items.reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = items.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
    const approvedAmount = items.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0);
    const paidAmount = items.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
    const rejectedAmount = items.filter(r => r.status === 'rejected').reduce((sum, r) => sum + r.amount, 0);

    const countByStatus: Record<SupplierPaymentStatus, number> = {
      pending: items.filter(r => r.status === 'pending').length,
      approved: items.filter(r => r.status === 'approved').length,
      rejected: items.filter(r => r.status === 'rejected').length,
      paid: items.filter(r => r.status === 'paid').length,
      cancelled: items.filter(r => r.status === 'cancelled').length,
    };

    const countByType: Record<string, number> = {};
    items.forEach(r => {
      const type = r.paymentType || 'other';
      countByType[type] = (countByType[type] || 0) + 1;
    });

    const recentPayments = [...items]
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
      .slice(0, 5);

    return {
      totalAmount,
      pendingAmount,
      approvedAmount,
      paidAmount,
      rejectedAmount,
      averageAmount: items.length > 0 ? totalAmount / items.length : 0,
      countByStatus,
      countByType,
      recentPayments,
    };
  }

  /**
   * Create a new payment request
   */
  async create(data: CreateSupplierPaymentRequestDTO): Promise<SupplierPaymentRequestDTO> {
    try {
      const now = new Date().toISOString();
      
      const rowData = {
        inspection_id: data.inspectionId,
        supplier_id: data.supplierId,
        project_id: data.projectId,
        amount: data.amount,
        currency: data.currency || 'MRU',
        status: normalizePaymentStatus(data.status || 'pending'),
        requested_at: data.requestedAt || data.requestedDate || now,
        comments: data.comments || data.notes,
        notes: data.notes || data.comments,
        documents: data.documents || data.supportingDocuments || [],
        supporting_documents: data.supportingDocuments || data.documents || [],
        payment_type: normalizePaymentType(data.paymentType || data.paymentReason || 'other'),
        payment_reason: data.paymentReason || data.paymentType,
        bank_account: data.bankAccount,
        invoice_number: data.invoiceNumber,
        invoice_date: data.invoiceDate,
        work_description: data.workDescription,
        work_location: data.workLocation,
        work_period: data.workPeriod,
        created_at: now,
        updated_at: now,
      };

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(rowData)
        .select()
        .single();

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create payment request: ${error.message}`);
      }

      return this.mapToDTO(result as SupplierPaymentRequestRow);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[SupabaseSupplierPaymentAdapter] create failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create payment request');
    }
  }

  /**
   * Update payment request status
   */
  async updateStatus(id: string, status: SupplierPaymentStatus, comments?: string): Promise<SupplierPaymentRequestDTO> {
    try {
      const updateData: Record<string, unknown> = { 
        status: normalizePaymentStatus(status),
        updated_at: new Date().toISOString()
      };
      
      if (comments !== undefined) {
        updateData.comments = comments;
        updateData.notes = comments;
      }

      if (status === 'approved') {
        updateData.validated_at = new Date().toISOString();
        updateData.approved_at = new Date().toISOString();
      }

      if (['paid', 'rejected', 'cancelled'].includes(status)) {
        updateData.processed_at = new Date().toISOString();
      }

      if (status === 'rejected' && comments) {
        updateData.rejection_reason = comments;
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update payment request status: ${error.message}`);
      }

      return this.mapToDTO(data as SupplierPaymentRequestRow);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[SupabaseSupplierPaymentAdapter] updateStatus failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update payment request status');
    }
  }

  /**
   * Update payment request
   */
  async update(id: string, data: UpdateSupplierPaymentRequestDTO): Promise<SupplierPaymentRequestDTO> {
    try {
      const rowData = this.mapToRow(data);
      rowData.updated_at = new Date().toISOString();

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(rowData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update payment request: ${error.message}`);
      }

      return this.mapToDTO(result as SupplierPaymentRequestRow);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[SupabaseSupplierPaymentAdapter] update failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update payment request');
    }
  }

  /**
   * Delete payment request
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete payment request: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[SupabaseSupplierPaymentAdapter] delete failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete payment request');
    }
  }

  /**
   * Get contractor supplier ID for a project
   * Utilise StakeholderService pour la récupération
   */
  async getContractorSupplierIdForProject(projectId: string): Promise<string | null> {
    try {
      // Récupérer directement depuis la table project_stakeholders
      const { data, error } = await supabase
        .from('project_stakeholders')
        .select('supplier_id')
        .eq('project_id', projectId)
        .in('stakeholder_type', ['principal_contractor', 'contractor'])
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[SupabaseSupplierPaymentAdapter] Error getting contractor:', error);
        return null;
      }

      return data?.supplier_id || null;
    } catch (error) {
      console.error('[SupabaseSupplierPaymentAdapter] getContractorSupplierIdForProject failed:', error);
      return null;
    }
  }
}

export default SupabaseSupplierPaymentAdapter;