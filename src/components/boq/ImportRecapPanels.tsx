/**
 * ImportRecapPanels — étape « Récapitulatif » du wizard d'import DQE :
 * sous-totaux par taux de TVA (scénario 5) et métrés détectés avec leurs
 * recommandations d'ouvrages (scénarios 3 & 8).
 *
 * Présentation uniquement : les valeurs viennent de BoqFiscalRecapService et des
 * métadonnées posées par le parseur (référentiel `earthwork-metre`).
 */
import { Badge } from '@/components/ui/badge';
import { BoqFiscalRecapService } from '@/application/services/boq/BoqFiscalRecapService';
import type { MetreRecommendation } from '@/application/services/boq/parsers/metreDetection';
import type { LineCoherence } from '@/application/services/boq/parsers/lineCoherence';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { T } from '@/components/i18n/T';

const fmt = (n: number): string => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

const PRIORITY_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  HIGH: { label: 'Haute', variant: 'default' },
  MEDIUM: { label: 'Moyenne', variant: 'secondary' },
  LOW: { label: 'Basse', variant: 'outline' },
};

interface LineMetre {
  designation: string;
  profileLabel: string;
  volume: number;
  formula: string;
  recommendations: MetreRecommendation[];
}

function readMetres(lines: BoqLineDTO[]): LineMetre[] {
  return lines.flatMap((line) => {
    const meta = (line.metadata ?? {}) as Record<string, unknown>;
    const metre = meta.metre as Record<string, unknown> | undefined;
    if (!metre) return [];
    return [{
      designation: line.designation,
      profileLabel: String(metre.profileLabel ?? ''),
      volume: Number(metre.volume ?? 0),
      formula: String(metre.formula ?? ''),
      recommendations: (meta.metreRecommendations as MetreRecommendation[] | undefined) ?? [],
    }];
  });
}

export function FiscalRecapPanel({ lines }: { lines: BoqLineDTO[] }) {
  const recap = BoqFiscalRecapService.build(lines);
  if (!recap.groups.length) return null;
  return (
    <div className="rounded-md border p-3 text-sm">
      <h4 className="mb-2 flex items-center gap-2 font-medium">
        Totaux par taux de TVA
        {recap.multiRate && <Badge variant="secondary"><T k="auto.importrecappanels.multi_taux" fallback="Multi-taux" /></Badge>}
      </h4>
      <ul className="space-y-1">
        {recap.groups.map((g) => (
          <li key={`${g.block}-${g.vatRate}`} className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-muted-foreground">
              {BoqFiscalRecapService.groupLabel(g)} · {g.lineCount} ligne(s)
            </span>
            <span className="font-medium">
              HT {fmt(g.totalHt)} · TVA {fmt(g.vatAmount)} · TTC {fmt(g.totalTtc)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t pt-2 text-right font-semibold">
        Général : HT {fmt(recap.totalHt)} · TVA {fmt(recap.totalVat)} · TTC {fmt(recap.totalTtc)}
      </p>
    </div>
  );
}

export function MetreRecapPanel({ lines }: { lines: BoqLineDTO[] }) {
  const metres = readMetres(lines);
  if (!metres.length) return null;
  return (
    <div className="rounded-md border p-3 text-sm">
      <h4 className="mb-2 font-medium">Métrés détectés ({metres.length})</h4>
      <ul className="space-y-3">
        {metres.map((m, i) => (
          <li key={`${m.designation}-${i}`} className="space-y-1">
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="font-medium">{m.designation}</span>
              <Badge variant="outline">{m.profileLabel}</Badge>
              <span className="font-medium">{fmt(m.volume)} m³</span>
            </p>
            <p className="text-[11px] text-muted-foreground">{m.formula}</p>
            {m.recommendations.length > 0 && (
              <ul className="ml-3 space-y-0.5">
                {m.recommendations.map((r) => (
                  <li key={r.code} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground">→ {r.label}</span>
                    <span>{fmt(r.quantity)} {r.unit}</span>
                    <Badge variant={PRIORITY_LABEL[r.priority]?.variant ?? 'outline'}>
                      {PRIORITY_LABEL[r.priority]?.label ?? r.priority}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface LineReport {
  index: number;
  designation: string;
  coherence: LineCoherence;
}

function readCoherence(lines: BoqLineDTO[]): LineReport[] {
  return lines.flatMap((line, i) => {
    const meta = (line.metadata ?? {}) as Record<string, unknown>;
    const c = meta.coherence as LineCoherence | undefined;
    if (!c || !c.findings.length) return [];
    return [{ index: i + 1, designation: line.designation, coherence: c }];
  });
}

const SEVERITY_ICON: Record<string, string> = { ok: '✅', info: 'ℹ️', warning: '⚠️' };

/**
 * CoherencePanel — rapport de validation par ligne : caractéristiques techniques
 * extraites du libellé, incohérences signalées (unité, prix) et contrôle des
 * calculs. Purement informatif : l'import n'est jamais bloqué.
 */
export function CoherencePanel({ lines }: { lines: BoqLineDTO[] }) {
  const reports = readCoherence(lines);
  const flagged = reports.filter((r) => r.coherence.status === 'warning');
  if (!reports.length) return null;
  return (
    <div className="rounded-md border p-3 text-sm">
      <h4 className="mb-2 flex flex-wrap items-center gap-2 font-medium">
        Rapport de validation des lignes
        {flagged.length > 0 ? (
          <Badge variant="secondary">{flagged.length} à clarifier</Badge>
        ) : (
          <Badge variant="outline"><T k="auto.importrecappanels.aucune_incoherence" fallback="Aucune incohérence" /></Badge>
        )}
      </h4>
      <ul className="space-y-3">
        {reports.map((r) => (
          <li key={`${r.index}-${r.designation}`} className="space-y-1">
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-muted-foreground">#{r.index}</span>
              <span className="font-medium">{r.designation}</span>
              {r.coherence.familyLabel && <Badge variant="outline">{r.coherence.familyLabel}</Badge>}
              <Badge variant={r.coherence.status === 'warning' ? 'secondary' : 'outline'}>
                {r.coherence.decision === 'accept' ? 'Accepter' : 'Accepter avec commentaire'}
              </Badge>
            </p>
            {r.coherence.specs.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {r.coherence.specs.map((s) => `${s.label} : ${s.value}`).join(' · ')}
                {r.coherence.conductors ? ` · Conducteurs : ${r.coherence.conductors}` : ''}
              </p>
            )}
            <ul className="ml-3 space-y-0.5">
              {r.coherence.findings.map((f) => (
                <li key={f.code} className="text-xs">
                  <span className="mr-1">{SEVERITY_ICON[f.severity] ?? '•'}</span>
                  <span className="font-medium">{f.label} :</span> <span className="text-muted-foreground">{f.message}</span>
                  {f.suggestion && <span className="block text-[11px] text-muted-foreground">💡 {f.suggestion}</span>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
