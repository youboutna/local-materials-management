// @ts-nocheck
// Lightweight stub for legacy hierarchy resolution.
// TODO: wire to real org-chart repository.

const OrganizationalHierarchyService = {
  async getHierarchyForUser(_userId: string) {
    return { supervisors: [], managers: [], directors: [], team: [] };
  },
  async getEscalationTargets(_userId: string, _level: 'team' | 'supervisor' | 'manager' | 'director') {
    return [];
  },
  async resolveRecipients(_ids: string[]) {
    return [];
  },
};

export default OrganizationalHierarchyService;
export { OrganizationalHierarchyService };
