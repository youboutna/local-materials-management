import { describe, it, expect } from 'vitest';
import { LocalProjectWorkbenchAdapter, LOCAL_DEMO_PROJECT_ID } from '../LocalProjectWorkbenchAdapter';
import { ProjectWorkbenchService } from '@/application/services/ProjectWorkbenchService';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
const input = { projectId: LOCAL_DEMO_PROJECT_ID, kind: 'expense' as const, occurredOn: '2026-11-04', label: 'x', unit: 'm3', currency: 'MRU', quantity: 150, amount: 5000, requestKey: 'k1' };

describe('Espace projet en mode données local', () => {
  it('enregistre une opération et la relit sans base', async () => {
    const service = new ProjectWorkbenchService(...((a) => [a, a] as const)(new LocalProjectWorkbenchAdapter(memory())));
    await service.saveOperation(input);
    const { operations } = await service.load(LOCAL_DEMO_PROJECT_ID);
    expect(operations).toHaveLength(1);
  });
  it('rejoue la même demande sans doublon', async () => {
    const adapter = new LocalProjectWorkbenchAdapter(memory());
    await adapter.saveOperation(input); await adapter.saveOperation(input);
    expect(await adapter.operations(LOCAL_DEMO_PROJECT_ID)).toHaveLength(1);
  });
  it('refuse de supprimer une opération validée', async () => {
    const adapter = new LocalProjectWorkbenchAdapter(memory());
    const saved = await adapter.saveOperation(input);
    await adapter.transitionOperation(LOCAL_DEMO_PROJECT_ID, saved.id, 'validated');
    await expect(adapter.deleteOperation(LOCAL_DEMO_PROJECT_ID, saved.id)).rejects.toThrow();
  });
});
