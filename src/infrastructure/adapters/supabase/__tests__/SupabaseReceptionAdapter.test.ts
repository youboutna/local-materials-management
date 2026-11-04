import { describe, it, expect } from 'vitest';
import { SupabaseReceptionAdapter } from '../SupabaseReceptionAdapter';

describe('SupabaseReceptionAdapter mapping', () => {
  it('round-trips camelCase DTO through snake_case row', () => {
    const row = SupabaseReceptionAdapter.toRow({
      projectId: 'p1', type: 'provisional' as never, status: 'scheduled' as never, scheduledDate: '2026-11-10',
      chairmanId: '', participants: [], notes: 'n',
    });
    expect(row).toMatchObject({ project_id: 'p1', type: 'provisional', scheduled_date: '2026-11-10', chairman_id: null });
    const dto = SupabaseReceptionAdapter.toDTO({ ...row, id: 'r1', created_at: 'c', updated_at: 'u' });
    expect(dto.projectId).toBe('p1');
    expect(dto.chairmanId).toBe('');
    expect(dto.findings).toEqual([]);
  });
});
