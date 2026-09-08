/**
 * src/components/boq/ImportMappingWizard.tsx
 * ImportMappingWizard — preview + column mapping for a parsed BOQ file.
 * Emits BoqLineDTO[] via useBoqImport.
 */
import { useMemo } from 'react';
import type { ParseResult } from '@/application/services/boq/parsers/IDocumentParser';
import type { ImportMapping } from '@/application/services/boq/BoqImportOrchestrator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  parseResult: ParseResult;
  mapping: ImportMapping;
  onChange: (next: ImportMapping) => void;
}

const FIELDS: { key: keyof ImportMapping; label: string }[] = [
  { key: 'designation', label: 'auto.importmappingwizard.designation' },
  { key: 'unit', label: 'auto.importmappingwizard.unite' },
  { key: 'quantity', label: 'auto.importmappingwizard.quantite' },
  { key: 'unitPrice', label: 'auto.importmappingwizard.prix_unitaire_pu' },
  { key: 'length', label: 'auto.importmappingwizard.longueur' },
  { key: 'width', label: 'auto.importmappingwizard.largeur' },
  { key: 'height', label: 'auto.importmappingwizard.hauteur_epaisseur' },
  { key: 'material', label: 'auto.importmappingwizard.materiau' },
  { key: 'elementType', label: 'auto.importmappingwizard.type_ouvrage' },
  { key: 'category', label: 'auto.importmappingwizard.categorie_poste' },
  { key: 'phaseId', label: 'auto.importmappingwizard.phase_lot' },
];

const NONE = '__none__';

/** Colonnes techniques injectées par les parseurs : jamais affichées en aperçu. */
const INTERNAL_COLUMNS = new Set(['Nature section', 'Lot libellé']);

export function ImportMappingWizard({ parseResult, mapping, onChange }: Props) {
  const { t } = useLanguage();
  const preview = useMemo(() => parseResult.rows.slice(0, 10), [parseResult]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label>{t(f.label)}</Label>
            <Select
              value={mapping[f.key] ?? NONE}
              onValueChange={(v) => onChange({ ...mapping, [f.key]: v === NONE ? undefined : v })}
            >
              <SelectTrigger><SelectValue placeholder="— colonne source —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— non mappé —</SelectItem>
                {parseResult.columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {preview.map((r, i) => {
          const populated = parseResult.columns.filter((column) => {
            if (INTERNAL_COLUMNS.has(column)) return false;
            const value = r.raw[column];
            return value !== null && value !== undefined && String(value).trim() !== '';
          });
          return (
            <div key={i} className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 border-b py-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3 text-xs font-medium text-muted-foreground">Ligne source {i + 1}</div>
              {populated.map((column) => (
                <div key={column} className="min-w-0">
                  <div className="text-[11px] font-medium text-muted-foreground">{column}</div>
                  <div className="break-words text-sm">{String(r.raw[column] ?? '')}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {parseResult.warnings.length > 0 && (
        <p className="text-xs text-warning">{parseResult.warnings.join(' • ')}</p>
      )}
    </div>
  );
}
