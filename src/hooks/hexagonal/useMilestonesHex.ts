/**
 * Hexagonal Hook for Phase Milestones
 */

import { useState, useEffect, useCallback } from 'react';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface Milestone {
  id: string;
  projectId: string;
  phaseId?: string;
  title: string;
  description?: string;
  targetDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  weight: number;
  notes?: string;
}

export function useMilestonesHex(projectId?: string, phaseId?: string) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestones = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const milestoneRepo = RepositoryFactory.getMilestoneRepository();
      const data = await milestoneRepo.findByProjectId(projectId);

      setMilestones((data || []).map((m: any) => ({
        id: m.id,
        projectId: m.project_id || m.projectId,
        phaseId: m.phase_id || m.phaseId || undefined,
        title: m.title,
        description: m.description || undefined,
        targetDate: m.target_date || m.targetDate,
        completedDate: m.completed_date || m.completedDate || undefined,
        status: (m.status || 'pending') as Milestone['status'],
        weight: m.weight || 0.1,
        notes: m.notes || undefined,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  }, [projectId, phaseId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const createMilestone = useCallback(async (
    milestone: Omit<Milestone, 'id'>
  ): Promise<string | null> => {
    try {
      const milestoneRepo = RepositoryFactory.getMilestoneRepository();
      const result = await milestoneRepo.create({
        project_id: milestone.projectId,
        phase_id: milestone.phaseId || null,
        title: milestone.title,
        description: milestone.description,
        target_date: milestone.targetDate,
        weight: milestone.weight,
        notes: milestone.notes,
        status: 'pending',
      });

      await fetchMilestones();
      return result?.id || null;
    } catch (err) {
      console.error('Error creating milestone:', err);
      return null;
    }
  }, [fetchMilestones]);

  const updateMilestone = useCallback(async (
    milestoneId: string,
    updates: Partial<Milestone>
  ): Promise<boolean> => {
    try {
      const milestoneRepo = RepositoryFactory.getMilestoneRepository();
      const updateData: Record<string, any> = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.targetDate) updateData.target_date = updates.targetDate;
      if (updates.completedDate !== undefined) updateData.completed_date = updates.completedDate;
      if (updates.status) updateData.status = updates.status;
      if (updates.weight !== undefined) updateData.weight = updates.weight;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      await milestoneRepo.update(milestoneId, updateData);
      await fetchMilestones();
      return true;
    } catch (error) {
      console.error('Error updating milestone:', error);
      return false;
    }
  }, [fetchMilestones]);

  const toggleMilestoneStatus = useCallback(async (
    id: string,
    currentStatus: string
  ): Promise<boolean> => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const completedDate = newStatus === 'completed' 
      ? new Date().toISOString().split('T')[0] 
      : null;

    try {
      const milestoneRepo = RepositoryFactory.getMilestoneRepository();
      await milestoneRepo.update(id, {
        status: newStatus,
        completed_date: completedDate,
      });

      await fetchMilestones();
      return true;
    } catch (err) {
      console.error('Error toggling milestone status:', err);
      return false;
    }
  }, [fetchMilestones]);

  const calculateProgress = useCallback(() => {
    if (milestones.length === 0) return 0;
    const completedWeight = milestones
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + m.weight, 0);
    const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
    return totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
  }, [milestones]);

  return {
    milestones,
    loading,
    error,
    refetch: fetchMilestones,
    createMilestone,
    updateMilestone,
    toggleMilestoneStatus,
    progress: calculateProgress(),
    stats: {
      total: milestones.length,
      completed: milestones.filter(m => m.status === 'completed').length,
      pending: milestones.filter(m => m.status === 'pending').length,
      delayed: milestones.filter(m => m.status === 'delayed').length,
    },
  };
}