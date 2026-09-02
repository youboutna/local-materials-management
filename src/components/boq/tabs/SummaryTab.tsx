import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, CircleDollarSign, Layers3, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { ControlResult } from '@/application/services/boq/BoqControlsService';

interface Props { lines: BoqLineDTO[]; totals: ReturnType<typeof BoqCalculatorService.aggregate>; controls: ControlResult[]; }
const money = (value: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} MRU`;

function Kpi({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryTab({ lines, totals, controls }: Props) {
  const phases = useMemo(() => {
    const grouped = new Map<string, number>();
    lines.forEach((line) => {
      const key = line.phaseId || 'Non rattaché';
      const amount = line.totalHt ?? (line.quantity ?? 0) * (line.unitPrice ?? 0);
      grouped.set(key, (grouped.get(key) ?? 0) + amount);
    });
    return [...grouped.entries()].sort((a, b) => b[1] - a[1]);
  }, [lines]);
  const maxPhase = Math.max(...phases.map(([, amount]) => amount), 1);
  const passed = controls.filter((control) => control.passed).length;

  const exportCsv = () => {
    const csv = [['Phase', 'Montant HT'], ...phases].map((row) => row.join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'dqe-repartition-par-phase.csv'; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={ListChecks} label="Lignes DQE" value={String(lines.length)} />
        <Kpi icon={CircleDollarSign} label="Total HT" value={money(totals.totalHt)} />
        <Kpi icon={CircleDollarSign} label="TVA" value={money(totals.totalTva)} />
        <Kpi icon={CircleDollarSign} label="Total TTC" value={money(totals.totalTtc)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base"><Layers3 className="h-4 w-4" />Répartition HT par phase</CardTitle>
            <Button variant="outline" size="sm" onClick={exportCsv}>Exporter CSV</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {phases.length === 0 ? <p className="text-sm text-muted-foreground">Aucune ligne à analyser.</p> : phases.map(([phase, amount]) => (
              <div key={phase} className="space-y-1">
                <div className="flex justify-between gap-2 text-sm"><span className="truncate">{phase}</span><span className="font-medium">{money(amount)}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((amount / maxPhase) * 100, 2)}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ListChecks className="h-4 w-4" />État des contrôles</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Conformes</span><Badge variant="secondary">{passed}/{controls.length}</Badge></div>
            {controls.map((control) => <div key={control.code} className="flex items-start gap-2 text-sm">{control.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />}<span>{control.label}</span></div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
