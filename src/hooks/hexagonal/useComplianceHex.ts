/**
 * Hexagonal Hook for Phase Compliance
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceItem {
  id: string;
  category: 'regulatory' | 'financial' | 'technical' | 'environmental';
  title: string;
  description?: string;
  status: 'compliant' | 'pending' | 'non_compliant' | 'in_review';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: string;
  responsiblePerson?: string;
  documents?: string[];
  notes?: string;
}

export function useComplianceHex(phaseId?: string, projectId?: string) {
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplianceItems = useCallback(async () => {
    if (!phaseId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('documents')
        .select('*')
        .eq('phase_id', phaseId)
        .eq('document_type', 'project_report')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      // Transform documents to compliance items
      const items: ComplianceItem[] = (data || []).map((doc) => {
        const metadata = (doc.metadata as any) || {};
        return {
          id: doc.id,
          category: metadata.category || 'regulatory',
          title: doc.title,
          description: doc.description || undefined,
          status: metadata.status || 'pending',
          priority: metadata.priority || 'medium',
          deadline: doc.deadline_date || undefined,
          responsiblePerson: metadata.responsible_person,
          documents: metadata.documents || [],
          notes: metadata.notes,
        };
      });

      setComplianceItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance items');
    } finally {
      setLoading(false);
    }
  }, [phaseId]);

  useEffect(() => {
    fetchComplianceItems();
  }, [fetchComplianceItems]);

  const createComplianceItem = useCallback(async (
    item: Omit<ComplianceItem, 'id'>
  ): Promise<string | null> => {
    if (!phaseId || !projectId) return null;

    try {
      const complianceData = {
        title: item.title,
        description: item.description,
        document_type: 'project_report' as const,
        phase_id: phaseId,
        project_id: projectId,
        deadline_date: item.deadline || null,
        metadata: {
          category: item.category,
          status: item.status,
          priority: item.priority,
          responsible_person: item.responsiblePerson,
          notes: item.notes,
          documents: [],
        },
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(complianceData)
        .select('id')
        .single();

      if (error) throw error;
      await fetchComplianceItems();
      return data?.id || null;
    } catch (err) {
      console.error('Error creating compliance item:', err);
      return null;
    }
  }, [phaseId, projectId, fetchComplianceItems]);

  const updateComplianceItem = useCallback(async (
    id: string,
    updates: Partial<ComplianceItem>
  ): Promise<boolean> => {
    try {
      const complianceData: any = {};
      
      if (updates.title) complianceData.title = updates.title;
      if (updates.description) complianceData.description = updates.description;
      if (updates.deadline) complianceData.deadline_date = updates.deadline;
      
      // Update metadata fields
      const metadataUpdates: any = {};
      if (updates.category) metadataUpdates.category = updates.category;
      if (updates.status) metadataUpdates.status = updates.status;
      if (updates.priority) metadataUpdates.priority = updates.priority;
      if (updates.responsiblePerson) metadataUpdates.responsible_person = updates.responsiblePerson;
      if (updates.notes) metadataUpdates.notes = updates.notes;

      // First get existing metadata
      const { data: existing } = await supabase
        .from('documents')
        .select('metadata')
        .eq('id', id)
        .single();

      complianceData.metadata = {
        ...((existing?.metadata as any) || {}),
        ...metadataUpdates,
      };

      const { error } = await supabase
        .from('documents')
        .update(complianceData)
        .eq('id', id);

      if (error) throw error;
      await fetchComplianceItems();
      return true;
    } catch (err) {
      console.error('Error updating compliance item:', err);
      return false;
    }
  }, [fetchComplianceItems]);

  return {
    complianceItems,
    loading,
    error,
    refetch: fetchComplianceItems,
    createComplianceItem,
    updateComplianceItem,
    stats: {
      total: complianceItems.length,
      compliant: complianceItems.filter(i => i.status === 'compliant').length,
      nonCompliant: complianceItems.filter(i => i.status === 'non_compliant').length,
      pending: complianceItems.filter(i => i.status === 'pending').length,
    },
  };
}
