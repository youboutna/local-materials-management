/**
 * Hexagonal Dashboard Hook
 * Provides dashboard statistics using hexagonal architecture
 */

import { useState, useEffect, useCallback } from 'react';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { GetProjectsListUseCase } from '@/application/use-cases/project';
import { GetMaterialsListUseCase } from '@/application/use-cases/material';

export interface DashboardStats {
  activeProjects: number;
  totalBudget: number;
  teamMembers: number;
  materials: number;
  statusDistribution: { name: string; value: number; color: string }[];
  locationDistribution: { name: string; count: number }[];
}

// Status colors
const statusColors: Record<string, string> = {
  'en cours': 'hsl(var(--primary))',
  'terminé': 'hsl(var(--success, 142 76% 36%))',
  'en attente': 'hsl(var(--warning, 38 92% 50%))',
  'en inspection': 'hsl(var(--info, 199 89% 48%))',
  'suspendu': 'hsl(var(--secondary))',
  'annulé': 'hsl(var(--destructive))',
};

// Initialize repositories and use cases
const projectRepository = RepositoryFactory.getProjectRepository();
const materialRepository = RepositoryFactory.getMaterialRepository();
const getProjectsListUseCase = new GetProjectsListUseCase(projectRepository);
const getMaterialsListUseCase = new GetMaterialsListUseCase(materialRepository);

export interface UseDashboardHexResult {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboardHex = (): UseDashboardHexResult => {
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    totalBudget: 0,
    teamMembers: 0,
    materials: 0,
    statusDistribution: [],
    locationDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch projects and materials in parallel
      const [projectsResult, materialsResult] = await Promise.all([
        getProjectsListUseCase.execute(),
        getMaterialsListUseCase.execute(),
      ]);

      if (!projectsResult.success) {
        throw new Error(projectsResult.error || 'Failed to fetch projects');
      }

      const projects = projectsResult.projects;
      const materials = materialsResult.success ? materialsResult.materials : [];

      // Calculate statistics
      const activeProjects = projects.filter((p) => p.status === 'en cours').length;
      const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const teamMembers = projects.reduce((sum, p) => sum + (p.teamSize || 0), 0);

      // Status distribution
      const statusCounts = projects.reduce((acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
        color: statusColors[status] || '#6b7280',
      }));

      // Location distribution
      const locationCounts = projects.reduce((acc, project) => {
        if (project.location) {
          acc[project.location] = (acc[project.location] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const locationDistribution = Object.entries(locationCounts).map(([location, count]) => ({
        name: location,
        count,
      }));

      setStats({
        activeProjects,
        totalBudget,
        teamMembers,
        materials: materials.length,
        statusDistribution,
        locationDistribution,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques';
      setError(errorMessage);
      console.error('useDashboardHex error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};
