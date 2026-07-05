/**
 * Construction Phase Hook (Hexagonal Architecture)
 * Template → Object → DTO flow implementation
 * Following hexagonal architecture principles
 */

import { useState, useEffect, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { PhaseService } from '@/application/services/PhaseService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { PhaseData, PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { ConstructionPhase } from '@/domain/entities/Phase';
import { PhaseTransformer } from '@/dtos/transforms/PhaseTransformer';

/**
 * Hook for construction phase management
 * Implements proper template → object → DTO flow
 */
export function useConstructionPhaseHex(projectId?: string) {
  // Initialize service with repository
  const phaseService = useMemo(() => 
    new PhaseService(RepositoryFactory.getPhaseRepository())
  , []);

  // State management
  const [phases, setPhases] = useState<(PhaseData | PhaseDTO)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load project phases
  useEffect(() => {
    if (projectId) {
      loadProjectPhases();
    }
  }, [projectId]);

  const loadProjectPhases = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const constructionPhases = await phaseService.getPhasesByProject(projectId);
      
      // Convert domain entities to DTOs for UI using PhaseTransformer
      const phaseDTOs = constructionPhases.map(phase => 
        PhaseTransformer.toDTO(phase)
      );
      
      setPhases(phaseDTOs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load construction phases');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load construction phases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new construction phase
   */
  const createConstructionPhase = async (phaseData: PhaseDTO) => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const newPhase = await phaseService.createPhase(phaseData, projectId);
      
      // Convert domain entity back to DTO for UI
      const phaseDTO = PhaseTransformer.toDTO(newPhase);
      
      setPhases(prev => [...prev, phaseDTO]);
      
      toast({
        title: "Success",
        description: "Construction phase created successfully",
        variant: "default",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create construction phase');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create construction phase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing construction phase
   */
  const updateConstructionPhase = async (id: string, phaseData: Partial<PhaseDTO>) => {
    try {
      setLoading(true);
      setError(null);

      const updatedPhase = await phaseService.updatePhase(id, phaseData);

      // Convert domain entity back to DTO for UI using PhaseTransformer
      const phaseDTO = PhaseTransformer.toDTO(updatedPhase);

      setPhases(prev => prev.map(phase =>
        phase.id === id ? phaseDTO as unknown as PhaseData : phase
      ));

      toast({
        title: "Success",
        description: "Construction phase updated successfully",
        variant: "default",
      });
      return updatedPhase;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update construction phase';
      setError(message);
      // Re-throw so caller can implement fallback (e.g. create-if-missing)
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a construction phase
   */
  const deleteConstructionPhase = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await phaseService.deletePhase(id);
      
      setPhases(prev => prev.filter(phase => phase.id !== id));
      
      toast({
        title: "Success",
        description: "Construction phase deleted successfully",
        variant: "default",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete construction phase');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete construction phase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get phase progress summary
   */
  const getProgressSummary = async () => {
    if (!projectId) return null;
    
    try {
      return await phaseService.getPhasesByProject(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get progress summary');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to get progress summary",
        variant: "destructive",
      });
      return null;
    }
  };

  /**
   * Create phase from template (referential)
   */
  const createPhaseFromTemplate = async (templateData: { 
    label?: string; 
    description?: string; 
    estimatedDuration?: number; 
    budget?: number; 
    materials?: unknown[]; 
    humanResources?: unknown[]; 
    suppliers?: unknown[]; 
    location?: string; 
    code?: string 
  }) => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Convert template to PhaseDTO structure
      const phaseData = {
        id: Date.now().toString(),
        name: templateData.label || 'New Phase',
        description: templateData.description || '',
        projectId: projectId || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDuration: templateData.estimatedDuration || 30,
        status: 'not_started' as any,
        type: 'construction' as any,
        priority: 'medium' as any,
        budget: templateData.budget || 0,
        actualCost: 0,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as PhaseDTO;
      
      const newPhase = await phaseService.createPhase(phaseData, projectId);
      
      // Convert domain entity back to DTO for UI
      const phaseDTO = PhaseTransformer.toDTO(newPhase);
      
      setPhases(prev => [...prev, phaseDTO as unknown as PhaseData]);
      
      toast({
        title: "Success",
        description: "Phase created from template successfully",
        variant: "default",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create phase from template');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create phase from template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    phases,
    loading,
    error,
    
    // Actions
    createConstructionPhase,
    updateConstructionPhase,
    deleteConstructionPhase,
    getProgressSummary,
    createPhaseFromTemplate,
    
    // Computed values
    phasesCount: phases.length,
    completedPhases: phases.filter(p => p.status === 'completed').length,
    inProgressPhases: phases.filter(p => p.status === 'in_progress').length,
    overallProgress: phases.length > 0 ? phases.reduce((sum, p) => sum + p.progress, 0) / phases.length : 0
  };
}
