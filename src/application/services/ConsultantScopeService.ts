/** Presentation scope only; database permissions remain authoritative. */
export class ConsultantScopeService {
  static filterProjects<T extends { projectId?: string | null }>(items: readonly T[], projectIds: readonly string[]): T[] {
    const scope = new Set(projectIds);
    return items.filter(item => Boolean(item.projectId && scope.has(item.projectId)));
  }
}