import { describe, it, expect } from 'vitest';
import { isFromDqe } from '../TeamOverview';

describe('Affectations — origine des ressources', () => {
  it('reconnaît une ressource propagée depuis le DQE', () => {
    expect(isFromDqe({ notes: 'DQE 2.1.3' })).toBe(true);
  });
  it('marque hors DQE une ressource saisie à la main', () => {
    expect(isFromDqe({ notes: 'Grue louée' })).toBe(false);
    expect(isFromDqe({ notes: null })).toBe(false);
  });
});
