import { TaskAssignment } from '@/domain/entities/TaskAssignment';
import { TaskPriority, TaskStatus, normalizeAssignedTo } from '@/dtos/entities/TaskAssignmentDTO';
import { TaskAssignmentTransformer } from '@/dtos/transforms/TaskAssignmentTransformer';
import { describe, expect, it } from 'vitest';

describe('TaskAssignment (source unique)', () => {
  it('normalise les assignations en tableau', () => {
    expect(normalizeAssignedTo('{a,b}')).toEqual(['a', 'b']);
    expect(normalizeAssignedTo('a')).toEqual(['a']);
    expect(normalizeAssignedTo(null)).toEqual([]);
  });

  it('normalise les statuts et priorités FR/EN', () => {
    const entity = TaskAssignment.create({ id: '1', title: 'T', status: 'Terminée', priority: 'haute' });
    expect(entity.status).toBe(TaskStatus.COMPLETED);
    expect(entity.priority).toBe(TaskPriority.HIGH);
  });

  it('sérialise assigned_to au format tableau PostgreSQL', () => {
    const entity = TaskAssignment.create({ id: '1', title: 'T', assignedTo: ['u1', 'u2'] });
    const row = TaskAssignmentTransformer.toRepository(entity);
    expect(row.assigned_to).toBe('{u1,u2}');
    expect(row.assignee_id).toBe('u1');
  });

  it('fait un aller-retour repository → entité', () => {
    const entity = TaskAssignmentTransformer.fromRepository({
      id: 'x',
      title: 'Tâche',
      assigned_to: '{u1}',
      status: 'en_cours',
      priority: 'urgente',
      progress: 40,
    });
    expect(entity.assignedTo).toEqual(['u1']);
    expect(entity.status).toBe(TaskStatus.IN_PROGRESS);
    expect(entity.priority).toBe(TaskPriority.URGENT);
    expect(entity.toDTO().progress).toBe(40);
  });
});
