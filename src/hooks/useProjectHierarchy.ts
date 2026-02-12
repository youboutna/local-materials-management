import { useState, useEffect } from 'react';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { EscalationRoles } from '@/types/project';

interface ProjectHierarchyMember {
  hierarchy_id: string;
  employee_id: string;
  employee_name: string;
  position_title: string;
  department: string;
  level: number;
  parent_id: string | null;
  organization_name: string;
  can_approve_projects: boolean;
  can_approve_payments: boolean;
  employee_email: string;
  employee_phone: string;
}

interface EscalationTarget {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  employee_phone: string;
  position_title: string;
  department: string;
  hierarchy_level: number;
}

export const useProjectHierarchy = (projectId: string) => {
  const [hierarchy, setHierarchy] = useState<ProjectHierarchyMember[]>([]);
  const [escalationRoles, setEscalationRoles] = useState<EscalationRoles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || projectId === 'new-project') {
      setLoading(false);
      return;
    }

    const loadProjectHierarchy = async () => {
      try {
        setLoading(true);
        const hierarchyRepo = RepositoryFactory.getHierarchyRepository();
        const hierarchyData = await hierarchyRepo.getProjectHierarchy(projectId);
        setHierarchy(hierarchyData || []);
        const roles = buildEscalationRoles(hierarchyData || []);
        setEscalationRoles(roles);
      } catch (err) {
        console.error('Error loading project hierarchy:', err);
        setError(err instanceof Error ? err.message : 'Failed to load hierarchy');
      } finally {
        setLoading(false);
      }
    };

    loadProjectHierarchy();
  }, [projectId]);

  const getEscalationTargets = async (escalationLevel: string): Promise<EscalationTarget[]> => {
    try {
      const hierarchyRepo = RepositoryFactory.getHierarchyRepository();
      return await hierarchyRepo.getEscalationTargets(projectId, escalationLevel);
    } catch (err) {
      console.error('Error getting escalation targets:', err);
      return [];
    }
  };

  return { hierarchy, escalationRoles, loading, error, getEscalationTargets };
};

const buildEscalationRoles = (hierarchyData: ProjectHierarchyMember[]): EscalationRoles => {
  const sortedHierarchy = [...hierarchyData].sort((a, b) => a.level - b.level);
  const levelGroups = sortedHierarchy.reduce((acc, member) => {
    if (!acc[member.level]) acc[member.level] = [];
    acc[member.level].push(member);
    return acc;
  }, {} as Record<number, ProjectHierarchyMember[]>);

  const levels = Object.keys(levelGroups).map(Number).sort();
  const roles: EscalationRoles = { level1: 'employee', level2: 'supervisor', level3: 'manager', level4: 'director' };

  if (levels.length >= 1) roles.level4 = levelGroups[levels[0]][0]?.position_title || 'directeur';
  if (levels.length >= 2) roles.level3 = levelGroups[levels[1]][0]?.position_title || 'manager';
  if (levels.length >= 3) roles.level2 = levelGroups[levels[2]][0]?.position_title || 'supervisor';
  if (levels.length >= 4) roles.level1 = levelGroups[levels[3]][0]?.position_title || 'employee';

  return roles;
};

export const getProjectEmployeesByRole = async (projectId: string, roleFilter?: string): Promise<ProjectHierarchyMember[]> => {
  try {
    const hierarchyRepo = RepositoryFactory.getHierarchyRepository();
    const hierarchy = await hierarchyRepo.getProjectHierarchy(projectId);
    if (roleFilter) {
      return hierarchy.filter((member: any) => member.position_title.toLowerCase().includes(roleFilter.toLowerCase()));
    }
    return hierarchy;
  } catch (err) {
    console.error('Error getting project employees by role:', err);
    return [];
  }
};
