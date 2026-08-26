/**
 * BoqAssistPanel — restitution des diagnostics d'import (BoqImportAssistService).
 * Présentation uniquement : aucun calcul, aucune requête.
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AssistResult, AssistSeverity } from '@/application/services/boq/BoqImportAssistService';
import { AlertTriangle, CheckCircle2, Info, Sparkles, XCircle } from 'lucide-react';

const ICONS: Record<AssistSeverity, typeof Info> = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TONE: Record<AssistSeverity, string> = {
  error: 'text-destructive',
  warning: 'text-amber-600',
  info: 'text-muted-foreground',
};

interface Props {
  result: AssistResult;
  onApply?: () => void;
  disabled?: boolean;
}

export function BoqAssistPanel({ result, onApply, disabled }: Props) {
  const { summary, diagnostics, resolved } = result;
  const ordered = [...diagnostics].sort((a, b) => {
    const rank: Record<AssistSeverity, number> = { error: 0, warning: 1, info: 2 };
    return rank[a.severity] - rank[b.severity] || a.lineIndex - b.lineIndex;
  });

  return (
    <section className="rounded-md border p-3 space-y-2 bg-muted/20">
      <header className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium flex-1">Assistance à l’import</h4>
        {summary.errors > 0 ? (
          <Badge variant="destructive">{summary.errors} erreur(s)</Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Aucune erreur bloquante
          </Badge>
        )}
        {summary.warnings > 0 && <Badge variant="outline">{summary.warnings} avertissement(s)</Badge>}
        {onApply && (
          <Button size="sm" variant="outline" onClick={onApply} disabled={disabled}>
            Appliquer les rattachements
          </Button>
        )}
      </header>

      <p className="text-[11px] text-muted-foreground">
        {summary.matchedMaterials} article(s) rattaché(s) au catalogue • {summary.matchedEmployees} ressource(s) RH
        identifiée(s)
        {resolved.projectId ? ' • projet rattaché' : ''}
        {resolved.currency ? ` • devise ${resolved.currency}` : ''}
      </p>

      <ul className="max-h-48 overflow-auto space-y-1">
        {ordered.slice(0, 60).map((d, i) => {
          const Icon = ICONS[d.severity];
          return (
            <li key={`${d.code}-${d.lineIndex}-${i}`} className="flex items-start gap-2 text-[11px]">
              <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${TONE[d.severity]}`} />
              <span className="flex-1">
                <span className="font-medium">{d.lineIndex >= 0 ? `Ligne ${d.lineIndex + 1}` : 'Document'}</span> —{' '}
                {d.message}
                {d.suggestion && <span className="text-muted-foreground"> — {d.suggestion}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default BoqAssistPanel;
