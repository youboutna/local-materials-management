/**
 * Hexagonal Hook for Compliance Management
 * Following Rule #1: Arrow Flow - UI → Service → Domain ← Adapter → DB
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ComplianceService } from '@/application/services/ComplianceService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  ComplianceItemDTO, 
  ComplianceDocumentDTO, 
  ComplianceNoteDTO, 
  ComplianceAuditEntryDTO,
  CreateComplianceItemDTO,
  UpdateComplianceItemDTO 
} from '@/dtos/entities/ComplianceDTO';

export function useComplianceHex(projectId?: string) {
  const [complianceItems, setComplianceItems] = useState<ComplianceItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize service following hexagonal architecture with useMemo for performance
  const complianceService = useMemo(() => new ComplianceService(RepositoryFactory.getComplianceRepository()), []);

  const fetchComplianceItems = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);

    try {
      // Use service instead of direct Supabase calls (Rule #1)
      const items = await complianceService.getComplianceByProject(projectId);
      setComplianceItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance items');
    } finally {
      setLoading(false);
    }
  }, [projectId, complianceService]);

  useEffect(() => {
    fetchComplianceItems();
  }, [fetchComplianceItems, projectId]);

  const createComplianceItem = useCallback(async (
    item: CreateComplianceItemDTO
  ): Promise<ComplianceItemDTO | null> => {
    if (!projectId) return null;

    try {
      // Use service for business logic orchestration
      const createdItem = await complianceService.createComplianceItem(item);
      await fetchComplianceItems(); // Refresh list
      return createdItem;
    } catch (err) {
      console.error('Error creating compliance item:', err);
      return null;
    }
  }, [projectId, fetchComplianceItems, complianceService]);

  const updateComplianceItem = useCallback(async (
    id: string,
    updates: UpdateComplianceItemDTO
  ): Promise<boolean> => {
    try {
      // Use service for validation and business logic
      await complianceService.updateComplianceItem(id, updates);
      await fetchComplianceItems(); // Refresh list
      return true;
    } catch (err) {
      console.error('Error updating compliance item:', err);
      return false;
    }
  }, [fetchComplianceItems, complianceService]);

  const deleteComplianceItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Use service for business rules validation
      await complianceService.deleteComplianceItem(id);
      await fetchComplianceItems(); // Refresh list
      return true;
    } catch (err) {
      console.error('Error deleting compliance item:', err);
      return false;
    }
  }, [fetchComplianceItems, complianceService]);

  const getComplianceStatistics = useCallback(() => {
    return {
      total: complianceItems.length,
      pending: complianceItems.filter(i => i.status === 'pending').length,
      inProgress: complianceItems.filter(i => i.status === 'in_progress').length,
      approved: complianceItems.filter(i => i.status === 'approved').length,
      rejected: complianceItems.filter(i => i.status === 'rejected').length,
      highPriority: complianceItems.filter(i => i.priority === 'high' || i.priority === 'critical').length,
      overdue: complianceItems.filter(i => 
        i.deadline && new Date(i.deadline) < new Date() && 
        ['pending', 'in_progress'].includes(i.status)
      ).length,
    };
  }, [complianceItems]);

  const getComplianceAlerts = useCallback(() => {
    const alerts = [];
    
    // High priority pending items
    const highPriorityPending = complianceItems.filter(
      i => (i.priority === 'high' || i.priority === 'critical') && 
      ['pending', 'in_progress'].includes(i.status)
    );
    
    // Overdue items
    const overdue = complianceItems.filter(i => 
      i.deadline && new Date(i.deadline) < new Date() && 
      ['pending', 'in_progress'].includes(i.status)
    );

    if (highPriorityPending.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${highPriorityPending.length} high priority compliance items require attention`,
        count: highPriorityPending.length
      });
    }

    if (overdue.length > 0) {
      alerts.push({
        type: 'error',
        message: `${overdue.length} compliance items are overdue`,
        count: overdue.length
      });
    }

    return alerts;
  }, [complianceItems]);

  return {
    complianceItems,
    loading,
    error,
    refetch: fetchComplianceItems,
    createComplianceItem,
    updateComplianceItem,
    deleteComplianceItem,
    getComplianceStatistics,
    getComplianceAlerts,
  };
}
