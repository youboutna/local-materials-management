import { UnifiedTaskAssignment } from '@/domain/entities/UnifiedTaskAssignment';
import { normalizeAssignedTo, normalizeUnifiedPriority, normalizeUnifiedStatus, UnifiedTaskPriority, UnifiedTaskStatus } from '@/dtos/entities/UnifiedTaskAssignmentDTO';
import { UnifiedTaskAssignmentTransformer } from '@/dtos/transforms/UnifiedTaskAssignmentTransformer';
import { describe, expect, it } from 'vitest';

describe('Unified TaskAssignment', () => {
  it('normalise assignedTo (string, array, format PostgreSQL)', () => {
    expect(normalizeAssignedTo('a')).toEqual(['a']);
    expect(normalizeAssignedTo(['a', 'b'])).toEqual(['a', 'b']);
    expect(normalizeAssignedTo('{a,b}')).toEqual(['a', 'b']);
    expect(normalizeAssignedTo(undefined)).toEqual([]);
  });

  it('normalise les statuts FR/EN vers les valeurs DB', () => {
    expect(normalizeUnifiedStatus('Terminée')).toBe(UnifiedTaskStatus.COMPLETED);
    expect(normalizeUnifiedStatus('en cours')).toBe(UnifiedTaskStatus.IN_PROGRESS);
    expect(normalizeUnifiedStatus('not_started')).toBe(UnifiedTaskStatus.PENDING);
    expect(normalizeUnifiedStatus(undefined, 40)).toBe(UnifiedTaskStatus.IN_PROGRESS);
    expect(normalizeUnifiedPriority('critique')).toBe(UnifiedTaskPriority.URGENT);
  });

  it('fait un aller-retour entité ↔ ligne DB avec tableau PostgreSQL', () => {
    const entity = UnifiedTaskAssignment.create({
      id: 'id-1',
      title: 'Tâche',
      assignedTo: ['u1', 'u2'],
      status: 'en cours',
      priority: 'haute',
      progress: 30,
      projectId: 'p1',
      phaseId: 'ph1',
    });
    const row = UnifiedTaskAssignmentTransformer.toRepository(entity);
    expect(row.assigned_to).toBe('{u1,u2}');
    expect(row.assignee_id).toBe('u1');
    expect(row.status).toBe('in_progress');
    expect(row.priority).toBe('high');

    const back = UnifiedTaskAssignmentTransformer.fromRepository({ ...row, created_at: new Date().toISOString() });
    expect(back.assignedTo).toEqual(['u1', 'u2']);
    expect(back.phaseId).toBe('ph1');
    expect(back.isCompleted()).toBe(false);
  });

  it('marque completedAt et 100% à la complétion', () => {
    const entity = UnifiedTaskAssignment.create({ id: 'id-2', title: 'T' });
    entity.updateStatus(UnifiedTaskStatus.COMPLETED);
    expect(entity.completedAt).toBeInstanceOf(Date);
    expect(entity.progress).toBe(100);
  });
});
