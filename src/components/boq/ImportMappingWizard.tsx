/**
 * ImportMappingWizard — preview + column mapping for a parsed BOQ file.
 * Emits BoqLineDTO[] via useBoqImport.
 */
import { useMemo } from 'react';
import type { ParseResult } from '@/application/services/boq/parsers/IDocumentParser';
import type { ImportMapping } from '@/application/services/boq/BoqImportOrchestrator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

export function ImportMappingWizard({ parseResult, mapping, onChange }: Props) {
  const preview = useMemo(() => parseResult.rows.slice(0, 10), [parseResult]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label>{f.label}</Label>
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

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {parseResult.columns.map((c) => <TableHead key={c}>{c}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((r, i) => (
              <TableRow key={i}>
                {parseResult.columns.map((c) => (
                  <TableCell key={c} className="text-xs">{String(r.raw[c] ?? '')}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {parseResult.warnings.length > 0 && (
        <p className="text-xs text-warning">{parseResult.warnings.join(' • ')}</p>
      )}
    </div>
  );
}
