import { describe, expect, it } from 'vitest';
import { BoqInjectionGateService } from '../BoqInjectionGateService';
import { BOQ_INJECTION_GATE_REFERENTIAL } from '@/config/referentials/boq/boq-injection-gate.referential';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

const line = (over: Partial<BoqLineDTO> = {}): BoqLineDTO => ({
  source: 'project_dqe' as BoqLineDTO['source'],
  contextId: 'p1',
  designation: 'Poste',
  unit: 'm',
  quantity: 1,
  ...over,
});

const stamped = (kind: 'devis' | 'decompte'): Record<string, unknown> => ({
  [BOQ_INJECTION_GATE_REFERENTIAL.metadataKey]: {
    kind,
    validatedBy: 'u1',
    validatorRole: 'project_manager',
    validatedAt: new Date().toISOString(),
  },
});

describe('BoqInjectionGateService', () => {
  it('laisse passer les lignes prévisionnelles', () => {
    const res = BoqInjectionGateService.evaluate([line({ dqeType: 'previsionnel' })]);
    expect(res.allowed).toBe(true);
    expect(res.kinds).toEqual([]);
  });

  it('bloque un devis non validé', () => {
    const res = BoqInjectionGateService.evaluate([line({ dqeType: 'devis', status: 'submitted' })]);
    expect(res.allowed).toBe(false);
    expect(res.kinds).toEqual(['devis']);
    expect(res.reasons[0]).toContain('gestionnaire de projet');
  });

  it('bloque un décompte non validé', () => {
    const res = BoqInjectionGateService.evaluate([line({ dqeType: 'decompte', status: 'submitted' })]);
    expect(res.allowed).toBe(false);
    expect(res.kinds).toEqual(['decompte']);
    expect(res.reasons[0]).toContain('consultant');
  });

  it('accepte un devis validé et signale une origine AO manquante', () => {
    const res = BoqInjectionGateService.evaluate([
      line({ dqeType: 'devis', status: 'validated', metadata: stamped('devis') }),
    ]);
    expect(res.allowed).toBe(true);
    expect(res.warnings.length).toBe(1);
  });

  it('assertInjectable lève une erreur métier', () => {
    expect(() => BoqInjectionGateService.assertInjectable([line({ dqeType: 'facture' })])).toThrow();
  });

  it('habilitations : PM valide un devis, pas un fournisseur', () => {
    expect(BoqInjectionGateService.canValidate('devis', { roles: ['project_manager'] })).toBe(true);
    expect(BoqInjectionGateService.canValidate('devis', { roles: ['supplier'] })).toBe(false);
  });

  it('décompte : consultant désigné ou PM/directeur (consultant implicite)', () => {
    expect(BoqInjectionGateService.canValidate('decompte', { roles: ['director'] })).toBe(true);
    expect(BoqInjectionGateService.canValidate('decompte', { roles: ['project_manager'] })).toBe(true);
    expect(
      BoqInjectionGateService.canValidate('decompte', { roles: ['consultant'], isDesignatedConsultant: true }),
    ).toBe(true);
    expect(BoqInjectionGateService.canValidate('decompte', { roles: ['consultant'] })).toBe(false);
    expect(BoqInjectionGateService.canValidate('decompte', { roles: ['supplier'] })).toBe(false);
  });
});
