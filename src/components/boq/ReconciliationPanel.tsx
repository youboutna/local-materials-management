/**
 * ReconciliationPanel — contrôle de cohérence avant import :
 * Σ des lignes vs Total HT du récapitulatif, et anomalies de lecture
 * numérique (quantité tronquée par un séparateur de milliers perdu).
 */
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BoqReconciliationService } from '@/application/services/boq/BoqReconciliationService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { DetectedFiscal } from '@/application/services/boq/parsers/IDocumentParser';

interface Props {
  lines: BoqLineDTO[];
  detectedFiscal?: DetectedFiscal | null;
  /** Applique la quantité proposée sur la ligne concernée. */
  onFixQuantity?: (index: number, quantity: number) => void;
}

const fmt = (n: number | null) =>
  n == null ? '—' : `${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} MRU`;

export function ReconciliationPanel({ lines, detectedFiscal, onFixQuantity }: Props) {
  const report = BoqReconciliationService.reconcile(lines, detectedFiscal ?? null);
  const ok = report.balanced && report.anomalies.length === 0;

  return (
    <section className="rounded-md border p-3 text-sm" aria-label="Contrôle de réconciliation">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 font-medium">
          {ok ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
          )}
          Réconciliation
        </h4>
        <Badge variant={ok ? 'secondary' : 'destructive'}>
          {ok ? 'Cohérent' : `${report.anomalies.length} anomalie(s)`}
        </Badge>
      </header>

      <dl className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        <div className="flex justify-between gap-2">
          <dt>Σ des lignes (HT)</dt>
          <dd className="font-medium">{fmt(report.computedHt)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Total HT du document</dt>
          <dd className="font-medium">{fmt(report.declaredHt)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Écart</dt>
          <dd className={report.balanced ? 'font-medium' : 'font-semibold text-destructive'}>
            {fmt(report.deltaHt)}
            {report.deltaRatio != null && ` (${(report.deltaRatio * 100).toFixed(2)} %)`}
          </dd>
        </div>
      </dl>

      {report.anomalies.length > 0 && (
        <ul className="mt-3 space-y-2">
          {report.anomalies.map((a, i) => (
            <li key={`${a.kind}-${a.lineIndex ?? 'global'}-${i}`} className="rounded border border-amber-300/60 bg-amber-50/60 p-2">
              <p className="font-medium">
                {a.lineIndex != null ? `Ligne ${a.lineIndex + 1} — ` : ''}
                {a.designation ?? 'Document'}
              </p>
              <p className="text-muted-foreground">{a.message}</p>
              {a.suggestedQuantity != null && a.lineIndex != null && onFixQuantity && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 min-h-9"
                  onClick={() => onFixQuantity(a.lineIndex!, a.suggestedQuantity!)}
                >
                  Appliquer {a.suggestedQuantity.toLocaleString('fr-FR')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ReconciliationPanel;
