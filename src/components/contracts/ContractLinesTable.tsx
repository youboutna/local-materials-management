/**
 * ContractLinesTable — lignes contractuelles (prix figés issus du DQE attribué).
 * CRUD inline via useContractLineMutations.
 */
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Trash2, ListOrdered, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useContractLinesHex, useContractLineMutations } from '@/hooks/hexagonal/useContractsHex';
import { computeContractLineTotals } from '@/dtos/entities/ContractLineDTO';

interface ContractLinesTableProps {
  contractId: string;
  currency?: string;
  sourceEstimateId?: string | null;
  readOnly?: boolean;
}

const num = (value: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value || 0);

export default function ContractLinesTable({
  contractId,
  currency = 'MRU',
  sourceEstimateId,
  readOnly = false,
}: ContractLinesTableProps) {
  const { data: lines = [], isLoading, error } = useContractLinesHex(contractId);
  const { addLine, updateLine, deleteLine, importFromEstimate, isPending } =
    useContractLineMutations(contractId);

  const [draft, setDraft] = useState({ lineCode: '', designation: '', unit: '', quantity: '1', unitPrice: '0', vatRate: '0' });

  const totals = useMemo(() => computeContractLineTotals(lines), [lines]);

  const handleAdd = async () => {
    if (!draft.designation.trim()) {
      toast.error('Désignation requise');
      return;
    }
    try {
      await addLine({
        contractId,
        lineCode: draft.lineCode.trim() || null,
        designation: draft.designation.trim(),
        unit: draft.unit.trim() || null,
        quantity: Number(draft.quantity) || 0,
        unitPrice: Number(draft.unitPrice) || 0,
        vatRate: Number(draft.vatRate) || 0,
        currency,
        displayOrder: lines.length,
      });
      setDraft({ lineCode: '', designation: '', unit: '', quantity: '1', unitPrice: '0', vatRate: '0' });
      toast.success('Ligne ajoutée');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ajout impossible');
    }
  };

  const handleImport = async () => {
    if (!sourceEstimateId) return;
    try {
      const created = await importFromEstimate(sourceEstimateId);
      toast.success(`${created.length} ligne(s) importée(s) depuis le devis attribué`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import impossible');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListOrdered className="h-4 w-4" />
          Lignes contractuelles
          <Badge variant="outline">{totals.lineCount}</Badge>
        </CardTitle>
        {!readOnly && sourceEstimateId && (
          <Button size="sm" variant="outline" onClick={handleImport} disabled={isPending}>
            <Download className="mr-1.5 h-4 w-4" /> Reprendre le DQE attribué
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement des lignes…
          </div>
        )}

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {(error as Error).message}
          </p>
        )}

        {!isLoading && lines.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucune ligne figée. Reprenez le DQE attribué ou saisissez les lignes manuellement.
          </p>
        )}

        {lines.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">P.U.</TableHead>
                  <TableHead className="text-right">Montant HT</TableHead>
                  <TableHead className="text-right">TVA %</TableHead>
                  {!readOnly && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-mono text-xs">{line.lineCode ?? '—'}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{line.designation}</TableCell>
                    <TableCell>{line.unit ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {readOnly ? (
                        num(line.quantity)
                      ) : (
                        <Input
                          type="number"
                          className="h-8 w-24 text-right"
                          defaultValue={line.quantity}
                          onBlur={(e) => {
                            const value = Number(e.target.value);
                            if (value !== line.quantity) updateLine(line.id, { quantity: value });
                          }}
                          aria-label={`Quantité ${line.designation}`}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {readOnly ? (
                        num(line.unitPrice)
                      ) : (
                        <Input
                          type="number"
                          className="h-8 w-28 text-right"
                          defaultValue={line.unitPrice}
                          onBlur={(e) => {
                            const value = Number(e.target.value);
                            if (value !== line.unitPrice) updateLine(line.id, { unitPrice: value });
                          }}
                          aria-label={`Prix unitaire ${line.designation}`}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{num(line.amountHt)}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(line.vatRate)}</TableCell>
                    {!readOnly && (
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => deleteLine(line.id)}
                          aria-label="Supprimer la ligne"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Total HT</p>
            <p className="font-medium tabular-nums">{num(totals.amountHt)} {currency}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">TVA</p>
            <p className="font-medium tabular-nums">{num(totals.vatAmount)} {currency}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total TTC</p>
            <p className="font-medium tabular-nums">{num(totals.amountTtc)} {currency}</p>
          </div>
        </div>

        {!readOnly && (
          <div className="grid gap-2 sm:grid-cols-7">
            <Input
              placeholder="Code"
              value={draft.lineCode}
              onChange={(e) => setDraft({ ...draft, lineCode: e.target.value })}
              aria-label="Code de la nouvelle ligne"
            />
            <Input
              className="sm:col-span-2"
              placeholder="Désignation *"
              value={draft.designation}
              onChange={(e) => setDraft({ ...draft, designation: e.target.value })}
              aria-label="Désignation de la nouvelle ligne"
            />
            <Input
              placeholder="Unité"
              value={draft.unit}
              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
              aria-label="Unité"
            />
            <Input
              type="number"
              placeholder="Qté"
              value={draft.quantity}
              onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
              aria-label="Quantité"
            />
            <Input
              type="number"
              placeholder="P.U."
              value={draft.unitPrice}
              onChange={(e) => setDraft({ ...draft, unitPrice: e.target.value })}
              aria-label="Prix unitaire"
            />
            <Button onClick={handleAdd} disabled={isPending}>
              <Plus className="mr-1.5 h-4 w-4" /> Ajouter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
