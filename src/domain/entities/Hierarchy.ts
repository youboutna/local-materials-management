/**
 * Hierarchy Domain Entities
 * Represents organizational and project hierarchy structures
 */

export interface HierarchyMember {
  hierarchyId: string;
  employeeId: string;
  employeeName: string;
  positionTitle: string;
  department: string;
  level: number;
  parentId: string | null;
  organizationName: string;
  canApproveProjects: boolean;
  canApprovePayments: boolean;
  employeeEmail: string;
  employeePhone: string;
}

export interface EscalationTarget {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeePhone: string;
  positionTitle: string;
  department: string;
  hierarchyLevel: number;
}

export interface EscalationRoles {
  level1: string;
  level2: string;
  level3: string;
  level4: string;
}

export type EscalationLevel = 'team' | 'supervisor' | 'manager' | 'director';

export class ProjectHierarchy {
  constructor(
    public readonly projectId: string,
    public readonly members: HierarchyMember[],
    public readonly escalationRoles: EscalationRoles
  ) {}

  // ============= Business Logic =============

  getMembersByLevel(level: number): HierarchyMember[] {
    return this.members.filter(m => m.level === level);
  }

  getDirectors(): HierarchyMember[] {
    return this.getMembersByLevel(1);
  }

  getManagers(): HierarchyMember[] {
    return this.getMembersByLevel(2);
  }

  getSupervisors(): HierarchyMember[] {
    return this.getMembersByLevel(3);
  }

  getTeamMembers(): HierarchyMember[] {
    return this.getMembersByLevel(4);
  }

  getMemberById(employeeId: string): HierarchyMember | undefined {
    return this.members.find(m => m.employeeId === employeeId);
  }

  getMembersByDepartment(department: string): HierarchyMember[] {
    return this.members.filter(m => 
      m.department.toLowerCase().includes(department.toLowerCase())
    );
  }

  getApprovers(): HierarchyMember[] {
    return this.members.filter(m => m.canApproveProjects || m.canApprovePayments);
  }

  getPaymentApprovers(): HierarchyMember[] {
    return this.members.filter(m => m.canApprovePayments);
  }

  getProjectApprovers(): HierarchyMember[] {
    return this.members.filter(m => m.canApproveProjects);
  }

  getSubordinates(memberId: string): HierarchyMember[] {
    const member = this.getMemberById(memberId);
    if (!member) return [];
    
    // Find all members who have this member as parent or are lower level
    return this.members.filter(m => 
      m.parentId === member.hierarchyId || 
      (m.level > member.level && m.department === member.department)
    );
  }

  getSuperior(memberId: string): HierarchyMember | undefined {
    const member = this.getMemberById(memberId);
    if (!member || !member.parentId) return undefined;
    
    return this.members.find(m => m.hierarchyId === member.parentId);
  }

  // ============= Escalation Logic =============

  getEscalationTargets(level: EscalationLevel): HierarchyMember[] {
    switch (level) {
      case 'team':
        return this.members.filter(m => m.level >= 3);
      case 'supervisor':
        return this.members.filter(m => 
          m.level === 2 && 
          (m.positionTitle.toLowerCase().includes('supervisor') || 
           m.positionTitle.toLowerCase().includes('chef'))
        );
      case 'manager':
        return this.members.filter(m => 
          m.level === 2 && 
          (m.positionTitle.toLowerCase().includes('manager') || 
           m.positionTitle.toLowerCase().includes('responsable'))
        );
      case 'director':
        return this.members.filter(m => 
          m.level === 1 && 
          (m.positionTitle.toLowerCase().includes('director') || 
           m.positionTitle.toLowerCase().includes('directeur'))
        );
      default:
        return [];
    }
  }

  // ============= Factory Methods =============

  static create(
    projectId: string, 
    members: HierarchyMember[], 
    roles?: Partial<EscalationRoles>
  ): ProjectHierarchy {
    const defaultRoles = ProjectHierarchy.buildDefaultRoles(members);
    return new ProjectHierarchy(
      projectId, 
      members, 
      { ...defaultRoles, ...roles }
    );
  }

  static buildDefaultRoles(members: HierarchyMember[]): EscalationRoles {
    const sortedMembers = [...members].sort((a, b) => a.level - b.level);
    const levelGroups = sortedMembers.reduce((acc, member) => {
      if (!acc[member.level]) acc[member.level] = [];
      acc[member.level].push(member);
      return acc;
    }, {} as Record<number, HierarchyMember[]>);

    const levels = Object.keys(levelGroups).map(Number).sort();

    const roles: EscalationRoles = {
      level1: 'employee',
      level2: 'supervisor',
      level3: 'manager',
      level4: 'director'
    };

    if (levels.length >= 1) {
      roles.level4 = levelGroups[levels[0]]?.[0]?.positionTitle || 'directeur';
    }
    if (levels.length >= 2) {
      roles.level3 = levelGroups[levels[1]]?.[0]?.positionTitle || 'manager';
    }
    if (levels.length >= 3) {
      roles.level2 = levelGroups[levels[2]]?.[0]?.positionTitle || 'supervisor';
    }
    if (levels.length >= 4) {
      roles.level1 = levelGroups[levels[3]]?.[0]?.positionTitle || 'employee';
    }

    return roles;
  }

  // ============= Serialization =============

  toJSON() {
    return {
      projectId: this.projectId,
      members: this.members,
      escalationRoles: this.escalationRoles,
    };
  }
}
