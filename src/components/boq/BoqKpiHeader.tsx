/**
 * BoqKpiHeader — KPI band (Total HT, TVA, TTC, count) computed via BoqCalculatorService.
 */
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

interface Props {
  lines: BoqLineDTO[];
  currency?: string;
}

export const BoqKpiHeader: React.FC<Props> = ({ lines, currency = 'MRU' }) => {
  const totals = useMemo(() => {
    const inputs = lines.map((l) => ({
      quantity: l.quantity ?? 0,
      unitPrice: l.unitPrice ?? 0,
      vatRate: l.vatRate ?? 0,
    }));
    return BoqCalculatorService.aggregate(inputs);
  }, [lines]);

  const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

  const cells: Array<[string, string]> = [
    ['Lignes', String(lines.length)],
    ['Total HT', `${fmt(totals.totalHt)} ${currency}`],
    ['TVA', `${fmt(totals.totalTva)} ${currency}`],
    ['Total TTC', `${fmt(totals.totalTtc)} ${currency}`],
  ];

  return (
    <Card>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
        {cells.map(([label, value]) => (
          <div key={label} className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
