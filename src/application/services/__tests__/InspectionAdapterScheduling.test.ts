import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InspectionStatus } from '@/domain/entities/Inspection';

const mocks = vi.hoisted(() => ({ update: vi.fn(), single: vi.fn(), eq: vi.fn(), select: vi.fn() }));
vi.mock('@/integrations/supabase/schema-clients', () => ({ btpClient: { from: () => ({ update: mocks.update }) } }));
import { SupabaseInspectionAdapter } from '@/infrastructure/adapters/supabase/SupabaseInspectionAdapter';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ maybeSingle: mocks.single });
  mocks.single.mockResolvedValue({ data: { id: 'inspection' }, error: null });
});
describe('Inspection adapter schedule persistence', () => {
  it('writes the original inspector ID and date to the database columns', async () => {
    await new SupabaseInspectionAdapter().update('inspection', { date: '2026-11-01T10:00:00Z', inspector: { id: 'employee-id', name: 'Inspector Name', agency: '', type: 'employee' }, status: InspectionStatus.Scheduled });
    expect(mocks.update).toHaveBeenCalledWith({ date: '2026-11-01T10:00:00Z', inspector: 'employee-id', status: 'scheduled' });
  });
  it.each([[InspectionStatus.InProgress, 'in_progress'], [InspectionStatus.RequiresChanges, 'requires_changes']])('normalizes %s as the database code', async (status, code) => {
    await new SupabaseInspectionAdapter().update('inspection', { status });
    expect(mocks.update).toHaveBeenCalledWith({ status: code });
  });
  it('rejects an update when no accessible row was changed', async () => {
    mocks.single.mockResolvedValue({ data: null, error: null });
    await expect(new SupabaseInspectionAdapter().update('step', { status: InspectionStatus.Scheduled })).rejects.toThrow('no accessible row');
  });
});