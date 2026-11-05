import { describe, it, expect } from 'vitest';
import { createLocalUnavailableAdapter, LOCAL_DATA_UNAVAILABLE } from '@/infrastructure/adapters/local/LocalUnavailableDataAdapter';

describe('LocalUnavailableDataAdapter', () => {
  const a = createLocalUnavailableAdapter<any>('Org');
  it('lectures de collection vides', async () => { expect(await a.findAll()).toEqual([]); });
  it('lecture unitaire nulle', async () => { expect(await a.findById('x')).toBeNull(); });
  it('écriture refusée', async () => { await expect(a.create({})).rejects.toThrow(LOCAL_DATA_UNAVAILABLE); });
  it("n'est pas un thenable", () => { expect(a.then).toBeUndefined(); });
});
