import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiscalCompliancePanel, type FiscalComplianceValue } from '../FiscalCompliancePanel';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqLineTotals } from '@/application/services/boq/BoqCalculatorService';

interface Props { lines?: BoqLineDTO[]; totals: BoqLineTotals; controls?: unknown[]; compliance?: FiscalComplianceValue; onComplianceChange?: (value: FiscalComplianceValue) => void; }
const money = (value: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)} MRU`;
export function TotalsTab({ lines = [], totals, compliance, onComplianceChange }: Props) {
  return <div className="space-y-4"><Card><CardHeader><CardTitle className="text-base">Récapitulatif financier</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[['Quantités', totals.quantity], ['Total HT', totals.totalHt], ['TVA', totals.totalTva], ['Total TTC', totals.totalTtc], ['RAS', totals.withholding ?? 0]].map(([label, amount]) => <div key={String(label)} className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{money(Number(amount))}</p></div>)}</CardContent></Card>{compliance && onComplianceChange ? <FiscalCompliancePanel lines={lines} value={compliance} onChange={onComplianceChange} /> : null}</div>;
}
