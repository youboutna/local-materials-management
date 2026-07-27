import { EscalationLevel, EscalationRoles, HierarchyMember } from '@/domain/entities/Hierarchy';
import { HierarchyNode } from '@/dtos/entities/HierarchyDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useEffect, useState } from 'react';

interface EscalationTarget {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  employee_phone: string;
  position_title: string;
  department: string;
  hierarchy_level: number;
}

// Map HierarchyNode to HierarchyMember for backward compatibility
const mapNodeToMember = (node: HierarchyNode): HierarchyMember => ({
  hierarchyId: node.id,
  employeeId: node.metadata?.assignedTo || node.id,
  employeeName: node.name,
  positionTitle: node.metadata?.customFields?.positionTitle as string || node.type,
  department: node.metadata?.customFields?.department as string || '',
  level: node.level,
  parentId: node.parentId || null,
  organizationName: node.metadata?.customFields?.organizationName as string || '',
  canApproveProjects: (node.metadata?.customFields?.canApproveProjects as boolean) || false,
  canApprovePayments: (node.metadata?.customFields?.canApprovePayments as boolean) || false,
  employeeEmail: node.metadata?.customFields?.employeeEmail as string || '',
  employeePhone: node.metadata?.customFields?.employeePhone as string || '',
});

export const useProjectHierarchy = (projectId: string) => {
  const [hierarchy, setHierarchy] = useState<HierarchyMember[]>([]);
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
        const members = (hierarchyData || []).map(mapNodeToMember);
        setHierarchy(members);
        const roles = buildEscalationRoles(members);
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
      const level = escalationLevel as EscalationLevel;
      const targets = await hierarchyRepo.getEscalationTargets(projectId, level);
      return targets.map(t => ({
        employee_id: t.employeeId,
        employee_name: t.employeeName,
        employee_email: t.employeeEmail,
        employee_phone: t.employeePhone,
        position_title: t.positionTitle,
        department: t.department,
        hierarchy_level: t.hierarchyLevel,
      }));
    } catch (err) {
      console.error('Error getting escalation targets:', err);
      return [];
    }
  };

  return { hierarchy, escalationRoles, loading, error, getEscalationTargets };
};

const buildEscalationRoles = (hierarchyData: HierarchyMember[]): EscalationRoles => {
  const sortedHierarchy = [...hierarchyData].sort((a, b) => a.level - b.level);
  const levelGroups = sortedHierarchy.reduce((acc, member) => {
    if (!acc[member.level]) acc[member.level] = [];
    acc[member.level].push(member);
    return acc;
  }, {} as Record<number, HierarchyMember[]>);

  const levels = Object.keys(levelGroups).map(Number).sort();
  const roles: EscalationRoles = { level1: 'employee', level2: 'supervisor', level3: 'manager', level4: 'director' };

  if (levels.length >= 1) roles.level4 = levelGroups[levels[0]][0]?.positionTitle || 'directeur';
  if (levels.length >= 2) roles.level3 = levelGroups[levels[1]][0]?.positionTitle || 'manager';
  if (levels.length >= 3) roles.level2 = levelGroups[levels[2]][0]?.positionTitle || 'supervisor';
  if (levels.length >= 4) roles.level1 = levelGroups[levels[3]][0]?.positionTitle || 'employee';

  return roles;
};

export const getProjectEmployeesByRole = async (projectId: string, roleFilter?: string): Promise<HierarchyMember[]> => {
  try {
    const hierarchyRepo = RepositoryFactory.getHierarchyRepository();
    const hierarchyData = await hierarchyRepo.getProjectHierarchy(projectId);
    const members = (hierarchyData || []).map(mapNodeToMember);
    if (roleFilter) {
      return members.filter((member) => member.positionTitle.toLowerCase().includes(roleFilter.toLowerCase()));
    }
    return members;
  } catch (err) {
    console.error('Error getting project employees by role:', err);
    return [];
  }
};
