/**
 * TenderEstimatorForm — Lot 2 form.
 * Categorie (Matériaux / Main-d'œuvre / Équipement / Overhead) → Ressource,
 * live HT / TVA / TTC preview via TenderEstimatorService, single
 * "Envoyer vers le devis" button that persists through the BOQ kernel.
 */
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  TenderEstimatorService,
  type TenderEstimatorLineInput,
  type TenderCategory,
} from '@/application/services/boq/TenderEstimatorService';

const CATEGORIES: { value: TenderCategory; label: string }[] = [
  { value: 'material', label: 'Matériau' },
  { value: 'labour', label: "Main-d'œuvre" },
  { value: 'equipment', label: 'Équipement' },
  { value: 'overhead', label: 'Frais généraux' },
];

const UNITS = ['u', 'ml', 'm2', 'm3', 'kg', 'h', 'j', 'ff'];

interface Props {
  tenderId: string;
  projectId?: string;
  onCommitted?: (count: number) => void;
}

function emptyLine(): TenderEstimatorLineInput {
  return {
    designation: '',
    category: 'material',
    unit: 'u',
    quantity: 1,
    unitPrice: 0,
    vatRate: 0.2,
  };
}

export function TenderEstimatorForm({ tenderId, projectId, onCommitted }: Props) {
  const { toast } = useToast();
  const [lines, setLines] = useState<TenderEstimatorLineInput[]>([emptyLine()]);
  const [busy, setBusy] = useState(false);

  const summary = useMemo(() => TenderEstimatorService.summarize(lines), [lines]);

  const update = (idx: number, patch: Partial<TenderEstimatorLineInput>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const remove = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const commit = async () => {
    setBusy(true);
    try {
      const persisted = await TenderEstimatorService.commit(lines, { tenderId, projectId });
      toast({ title: 'Devis enregistré', description: `${persisted.length} ligne(s) ajoutée(s) au devis.` });
      onCommitted?.(persisted.length);
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Impossible de persister le devis.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Devis — Lignes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Désignation</TableHead>
                <TableHead className="w-40">Catégorie</TableHead>
                <TableHead className="w-24">Unité</TableHead>
                <TableHead className="w-24">Qté</TableHead>
                <TableHead className="w-28">PU</TableHead>
                <TableHead className="w-24">TVA</TableHead>
                <TableHead className="w-32 text-right">Total HT</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l, idx) => {
                const total = (l.quantity ?? 0) * (l.unitPrice ?? 0);
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input
                        value={l.designation}
                        onChange={(e) => update(idx, { designation: e.target.value })}
                        placeholder="Désignation"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={l.category}
                        onValueChange={(v) => update(idx, { category: v as TenderCategory })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={l.unit} onValueChange={(v) => update(idx, { unit: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={l.quantity ?? 0}
                        onChange={(e) => update(idx, { quantity: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={l.unitPrice ?? 0}
                        onChange={(e) => update(idx, { unitPrice: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={1}
                        value={l.vatRate ?? 0}
                        onChange={(e) => update(idx, { vatRate: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmt(total)}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => remove(idx)} disabled={lines.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" size="sm" onClick={() => setLines((p) => [...p, emptyLine()])}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter une ligne
            </Button>
            <div className="text-sm space-y-1 text-right">
              <div>Total HT : <span className="font-semibold">{fmt(summary.totals.totalHt)}</span></div>
              <div>TVA : <span className="font-semibold">{fmt(summary.totals.totalTva)}</span></div>
              <div>Total TTC : <span className="font-bold text-primary">{fmt(summary.totals.totalTtc)}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={commit} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Envoyer vers le devis
        </Button>
      </div>
    </div>
  );
}

export default TenderEstimatorForm;
