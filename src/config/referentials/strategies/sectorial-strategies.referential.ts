/**
 * Stratégies sectorielles - Wrapper sur PNDS, SDAU et autres référentiels existants
 */
import { pndsReferential } from '../pnds.referential';
import { sdauReferential } from '../snat-nouakchot.referential';
import type { ProjectReferential } from '../somelec.referential';

export interface SectorialStrategyMeta {
  code: string;
  referential: ProjectReferential;
  sector: 'health' | 'urban' | 'energy' | 'education' | 'transport' | 'other';
}

export const sectorialStrategies: SectorialStrategyMeta[] = [
  { code: 'PNDS_2021_2030', referential: pndsReferential, sector: 'health' },
  { code: 'SDAU_NKC_2018_2040', referential: sdauReferential, sector: 'urban' },
];

export function findSectorialStrategy(code: string): SectorialStrategyMeta | undefined {
  return sectorialStrategies.find(s => s.code === code);
}
