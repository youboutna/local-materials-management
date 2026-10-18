/**
 * InfraAttributeTable — édition de la table attributaire d'un objet infra
 * (paires clé / valeur stockées dans `properties`). Les valeurs JSON
 * (nombres, listes, objets) sont conservées telles quelles.
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Trash2 } from 'lucide-react';
import { ProjectWorkbenchTransformer } from '@/dtos/transforms/ProjectWorkbenchTransformer';

export type AttributeRow = { key: string; value: string };
export function InfraAttributeTable({ rows, onChange, readOnly }: { rows: AttributeRow[]; onChange?: (rows: AttributeRow[]) => void; readOnly?: boolean }) {
  const { t } = useLanguage();
  const set = (index: number, patch: Partial<AttributeRow>) => onChange?.(rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  const duplicates = ProjectWorkbenchTransformer.duplicateAttributeKeys(rows);
  return <div className="space-y-2">
    <div className="overflow-x-auto border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50"><tr><th className="text-start p-2 w-1/3">{t('workbench.attribute')}</th><th className="text-start p-2">{t('workbench.value')}</th>{!readOnly && <th className="w-10" />}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={3} className="p-2 text-muted-foreground">{t('workbench.no_attributes')}</td></tr>}
          {rows.map((row, index) => <tr key={index} className="border-t border-border">
            <td className="p-1">{readOnly ? <span className="px-1 font-medium">{row.key}</span> : <Input aria-label={t('workbench.attribute')} aria-invalid={duplicates.has(row.key)} value={row.key} onChange={e => set(index, { key: e.target.value })} />}</td>
            <td className="p-1">{readOnly ? <span className="px-1 break-all">{row.value}</span> : <Input aria-label={t('workbench.value')} value={row.value} onChange={e => set(index, { value: e.target.value })} />}</td>
            {!readOnly && <td className="p-1"><Button type="button" variant="ghost" size="icon" aria-label={t('common.delete')} onClick={() => onChange?.(rows.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></td>}
          </tr>)}
        </tbody>
      </table>
    </div>
    {duplicates.size > 0 && <p role="alert" className="text-sm text-destructive">{t('workbench.duplicate_attribute')}: {[...duplicates].join(', ')}</p>}
    {!readOnly && <Button type="button" size="sm" variant="outline" onClick={() => onChange?.([...rows, { key: '', value: '' }])}><Plus className="h-4 w-4 mr-1" />{t('workbench.add_attribute')}</Button>}
  </div>;
}
export default InfraAttributeTable;
