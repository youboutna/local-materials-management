import type { PlanningWorkbookMappingDTO } from '@/dtos/entities/PlanningWorkbookDTO';
import { DEFAULT_WORKBOOK_MAPPING } from './planning-import.referential';

/**
 * Import profiles = business mapping rules applied by ONE generic importer.
 * The parser never knows which file it reads; the selected profile decides
 * how raw rows/sheets become Project → Phase → Milestone/Step → Task DTOs.
 */
export type ImportFileFormat = 'excel' | 'json' | 'csv';
export type ImportHierarchyTarget = 'phase' | 'milestone' | 'task';

export interface ImportProfile {
  readonly code: string;
  readonly label: { fr: string; en: string; ar: string };
  readonly formats: readonly ImportFileFormat[];
  /** dataset = rows/objects already shaped as projects; hierarchical_workbook = coded outline sheets. */
  readonly kind: 'dataset' | 'hierarchical_workbook';
  /** Level 1 (sheet/component), level 2 (sub-component), level 3 (activity). */
  readonly hierarchy?: readonly [ImportHierarchyTarget, ImportHierarchyTarget, ImportHierarchyTarget];
  readonly mapping?: PlanningWorkbookMappingDTO;
}

export const IMPORT_FORMAT_EXTENSIONS: Record<ImportFileFormat, readonly string[]> = {
  excel: ['xlsx', 'xls'], json: ['json'], csv: ['csv'],
};

export const IMPORT_PROFILES: readonly ImportProfile[] = [
  {
    code: 'CUSTOM_STANDARD',
    label: { fr: 'Standard personnalisé', en: 'Custom standard', ar: 'معيار مخصص' },
    formats: ['json', 'csv', 'excel'],
    kind: 'dataset',
  },
  {
    code: 'WORLD_BANK_PTBA',
    label: { fr: 'Banque mondiale (PTBA)', en: 'World Bank (AWPB)', ar: 'البنك الدولي (برنامج العمل السنوي)' },
    formats: ['excel'],
    kind: 'hierarchical_workbook',
    // Composante (sheet) → phase; sous-composante 1.1 → milestone (step container); activité → task.
    hierarchy: ['phase', 'milestone', 'task'],
    // Column A = code, B = label, H = amount in thousands (scale suggested from the header, reviewed by operator).
    mapping: { ...DEFAULT_WORKBOOK_MAPPING },
  },
];

export function getImportProfile(code: string): ImportProfile {
  const profile = IMPORT_PROFILES.find(item => item.code === code);
  if (!profile) throw new Error(`Unknown import profile: ${code}`);
  return profile;
}
