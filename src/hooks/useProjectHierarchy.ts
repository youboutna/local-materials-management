import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    if (!projectId) return;

    const loadProjectHierarchy = async () => {
      try {
        setLoading(true);
        
        // Get project hierarchy
        const { data: hierarchyData, error: hierarchyError } = await supabase
          .rpc('get_project_hierarchy', { project_id_param: projectId });

        if (hierarchyError) {
          throw hierarchyError;
        }

        setHierarchy(hierarchyData || []);

        // Build escalation roles based on actual hierarchy levels
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
      const { data, error } = await supabase
        .rpc('get_escalation_targets', {
          project_id_param: projectId,
          escalation_level_param: escalationLevel
        });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Error getting escalation targets:', err);
      return [];
    }
  };

  return {
    hierarchy,
    escalationRoles,
    loading,
    error,
    getEscalationTargets
  };
};

// Build escalation roles from actual organizational hierarchy
const buildEscalationRoles = (hierarchyData: ProjectHierarchyMember[]): EscalationRoles => {
  // Sort by hierarchy level (1 = highest, ascending)
  const sortedHierarchy = [...hierarchyData].sort((a, b) => a.level - b.level);
  
  // Group by level and extract representative roles
  const levelGroups = sortedHierarchy.reduce((acc, member) => {
    if (!acc[member.level]) {
      acc[member.level] = [];
    }
    acc[member.level].push(member);
    return acc;
  }, {} as Record<number, ProjectHierarchyMember[]>);

  const levels = Object.keys(levelGroups).map(Number).sort();
  
  // Map organizational levels to escalation levels
  // Level 1 (highest) = level4, Level 2 = level3, etc.
  const roles: EscalationRoles = {
    level1: 'employee', // Default base level
    level2: 'supervisor',
    level3: 'manager', 
    level4: 'director'
  };

  if (levels.length >= 1) {
    // Highest level becomes level4 (director)
    const directors = levelGroups[levels[0]];
    roles.level4 = directors[0]?.position_title || 'directeur';
  }

  if (levels.length >= 2) {
    // Second level becomes level3 (manager)
    const managers = levelGroups[levels[1]];
    roles.level3 = managers[0]?.position_title || 'manager';
  }

  if (levels.length >= 3) {
    // Third level becomes level2 (supervisor)
    const supervisors = levelGroups[levels[2]];
    roles.level2 = supervisors[0]?.position_title || 'supervisor';
  }

  if (levels.length >= 4) {
    // Fourth level becomes level1 (employee)
    const employees = levelGroups[levels[3]];
    roles.level1 = employees[0]?.position_title || 'employee';
  }

  return roles;
};

// Helper function to get employees by role/position for a project
export const getProjectEmployeesByRole = async (
  projectId: string, 
  roleFilter?: string
): Promise<ProjectHierarchyMember[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_project_hierarchy', { project_id_param: projectId });

    if (error) {
      throw error;
    }

    const hierarchy = data || [];
    
    if (roleFilter) {
      return hierarchy.filter(member => 
        member.position_title.toLowerCase().includes(roleFilter.toLowerCase())
      );
    }

    return hierarchy;
  } catch (err) {
    console.error('Error getting project employees by role:', err);
    return [];
  }
};