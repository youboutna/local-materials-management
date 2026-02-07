/**
 * Construction Phase Hook (Hexagonal Architecture)
 * Template → Object → DTO flow implementation
 * Following hexagonal architecture principles
 */

import { useState, useEffect, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { ConstructionPhaseService } from '@/application/services/ConstructionPhaseService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { PhaseData } from '@/dtos/entities/PhaseDTO';
import { ConstructionPhase } from '@/domain/entities/ConstructionPhase';

/**
 * Hook for construction phase management
 * Implements proper template → object → DTO flow
 */
export function useConstructionPhaseHex(projectId?: string) {
  // Initialize service with repository
  const constructionPhaseService = useMemo(() => 
    new ConstructionPhaseService(RepositoryFactory.getConstructionPhaseRepository())
  , []);

  // State management
  const [phases, setPhases] = useState<PhaseData[]>([]);
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
      
      const constructionPhases = await constructionPhaseService.getProjectConstructionPhases(projectId);
      
      // Convert domain entities to DTOs for UI
      const phaseDTOs = constructionPhases.map(phase => 
        constructionPhaseService.toDTO(phase)
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
  const createConstructionPhase = async (phaseData: PhaseData) => {
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
      
      const newPhase = await constructionPhaseService.createConstructionPhase(phaseData, projectId);
      
      // Convert domain entity back to DTO for UI
      const phaseDTO = constructionPhaseService.toDTO(newPhase);
      
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
  const updateConstructionPhase = async (id: string, phaseData: Partial<PhaseData>) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedPhase = await constructionPhaseService.updateConstructionPhase(id, phaseData);
      
      // Convert domain entity back to DTO for UI
      const phaseDTO = constructionPhaseService.toDTO(updatedPhase);
      
      setPhases(prev => prev.map(phase => 
        phase.id === id ? phaseDTO : phase
      ));
      
      toast({
        title: "Success",
        description: "Construction phase updated successfully",
        variant: "default",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update construction phase');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update construction phase",
        variant: "destructive",
      });
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
      
      await constructionPhaseService.deleteConstructionPhase(id);
      
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
      return await constructionPhaseService.getPhaseProgressSummary(projectId);
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
  const createPhaseFromTemplate = async (templateData: any) => {
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
      
      // Convert template to PhaseData structure
      const phaseData: PhaseData = {
        id: Date.now().toString(),
        title: templateData.label || 'New Phase',
        description: templateData.description || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDuration: templateData.estimatedDuration || 30,
        status: 'not_started',
        budget: templateData.budget || 0,
        actualCost: 0,
        progress: 0,
        materials: templateData.materials || [],
        humanResources: templateData.humanResources || [],
        suppliers: templateData.suppliers || [],
        location: templateData.location || '',
        notes: `Created from template: ${templateData.code || 'Unknown'}`
      };
      
      const newPhase = await constructionPhaseService.createConstructionPhase(phaseData, projectId);
      
      // Convert domain entity back to DTO for UI
      const phaseDTO = constructionPhaseService.toDTO(newPhase);
      
      setPhases(prev => [...prev, phaseDTO]);
      
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
