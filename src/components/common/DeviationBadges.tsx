/**
 * DeviationBadges — affiche les écarts planifié/réalisé calculés par DeviationEngine.
 * Aucun seuil hardcodé : tout vient de `deviation-rules.referential.ts`.
 */

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, DollarSign, Activity } from 'lucide-react';
import {
  DeviationEngine,
  PlannedActualInput,
} from '@/application/services/DeviationEngine';
import { DeviationSeverity } from '@/config/referentials/deviation-rules.referential';
import { i18nService } from '@/application/services/I18nService';

interface DeviationBadgesProps {
  input: PlannedActualInput;
  scope?: 'task' | 'step' | 'phase' | 'project';
  className?: string;
}

const SEVERITY_STYLE: Record<DeviationSeverity, string> = {
  info: 'bg-muted text-muted-foreground border-muted',
  low: 'bg-success/10 text-success dark:text-success border-success/30',
  medium: 'bg-amber-500/10 text-warning dark:text-amber-300 border-amber-500/30',
  high: 'bg-red-500/10 text-destructive dark:text-red-300 border-red-500/30',
};

const DIM_ICON = {
  duration: Clock,
  cost: DollarSign,
  progress: Activity,
  margin: AlertTriangle,
} as const;

function formatVal(value: number, unit: string): string {
  switch (unit) {
    case 'days':
      return `${value > 0 ? '+' : ''}${Math.round(value)} j`;
    case '%':
      return `${value > 0 ? '+' : ''}${value.toFixed(1)} %`;
    case 'pts':
      return `${value > 0 ? '+' : ''}${value.toFixed(1)} pts`;
    case 'MRU':
      return `${value.toLocaleString('fr-FR')} MRU`;
    default:
      return String(value);
  }
}

const DeviationBadges: React.FC<DeviationBadgesProps> = ({ input, scope = 'project', className }) => {
  const deviations = useMemo(() => DeviationEngine.compute(input, scope), [input, scope]);

  if (deviations.length === 0) {
    return (
      <Badge variant="outline" className="text-[10px]">
        Aucun écart calculable
      </Badge>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? ''}`}>
      {deviations.map((d) => {
        const Icon = DIM_ICON[d.dimension] ?? AlertTriangle;
        return (
          <Badge
            key={d.ruleCode}
            variant="outline"
            className={`gap-1 text-[11px] font-medium ${SEVERITY_STYLE[d.severity]}`}
            title={`${d.label} — sévérité ${i18nService.translateSeverity(d.severity)}`}
          >
            <Icon className="h-3 w-3" />
            <span>{d.label}</span>
            <span className="font-bold">{formatVal(d.value, d.unit)}</span>
          </Badge>
        );
      })}
    </div>
  );
};

export default DeviationBadges;
