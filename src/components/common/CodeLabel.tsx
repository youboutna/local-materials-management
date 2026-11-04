/**
 * CodeLabel — affiche le libellé traduit (fr/ar/en) d'un code technique
 * (statut, priorité, unité…) via les référentiels i18n, jamais le code brut.
 */
import { useI18n } from '@/hooks/useI18n';

export type CodeLabelKind = 'status' | 'priority' | 'severity' | 'category' | 'unit' | 'role' | 'department';

interface CodeLabelProps {
  kind: CodeLabelKind;
  code?: string | null;
}

export function CodeLabel({ kind, code }: CodeLabelProps) {
  const i18n = useI18n();
  if (code === null || code === undefined || code === '') return null;
  const translators: Record<CodeLabelKind, (c: string) => string> = {
    status: i18n.translateStatus,
    priority: i18n.translatePriority,
    severity: i18n.translateSeverity,
    category: i18n.translateCategory,
    unit: i18n.translateUnit,
    role: i18n.translateRole,
    department: i18n.translateDepartment,
  };
  return <>{translators[kind](String(code))}</>;
}

export default CodeLabel;
