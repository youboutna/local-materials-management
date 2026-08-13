import React from 'react';
import { format } from 'date-fns';
import type { GanttModel } from '@/application/services/ProjectMetricsOrchestrator';
import { formatPercent2 } from '@/utils/reportNumbers';

/**
 * ProjectGanttTimeline — composant Gantt UI UNIQUE et réutilisable
 * (sections « Phases du Projet », « Diagramme de Gantt », Dashboard Monitoring).
 *
 * Alimenté par le `GanttModel` de ProjectMetricsOrchestrator : calendrier réel,
 * barre `█` réalisé / `░` restant, jalons 0/25/50/75/100, poids et sa source.
 */
interface Props {
  gantt: GanttModel;
  className?: string;
  /** Rendu textuel monospace (█/░) en complément des barres graphiques. */
  showAsciiBars?: boolean;
}

const BAR_CELLS = 40;

const asciiBar = (progress: number): string => {
  const filled = Math.round((Math.max(0, Math.min(100, progress)) / 100) * BAR_CELLS);
  return `${'█'.repeat(filled)}${'░'.repeat(BAR_CELLS - filled)}`;
};

export const ProjectGanttTimeline: React.FC<Props> = ({ gantt, className, showAsciiBars = true }) => {
  if (!gantt || gantt.isEmpty) {
    return (
      <p className={`text-sm text-muted-foreground ${className ?? ''}`}>
        Aucune phase datée : le diagramme de Gantt sera disponible dès qu'une phase possède des dates.
      </p>
    );
  }

  const span = gantt.end - gantt.start || 1;
  const pct = (t: number) => ((t - gantt.start) / span) * 100;
  const todayPct = gantt.today !== null ? pct(gantt.today) : null;

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      <p className="text-xs text-muted-foreground">
        Calendrier réel du projet ({format(new Date(gantt.start), 'dd/MM/yyyy')} →{' '}
        {format(new Date(gantt.end), 'dd/MM/yyyy')})
      </p>

      {/* Échelle des années */}
      <div className="flex items-center gap-2">
        <div className="w-1/3 text-xs text-muted-foreground">Phase (poids)</div>
        <div className="flex w-2/3 border-b border-border">
          {gantt.years.map((y) => (
            <div key={y} className="flex-1 text-center text-xs text-muted-foreground">
              {y}
            </div>
          ))}
        </div>
      </div>

      {/* Barres de phases */}
      {gantt.phases.map((phase) => (
        <div key={phase.id} className="flex items-center gap-2">
          <div className="w-1/3">
            <p className="truncate text-sm font-medium">{phase.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatPercent2(phase.progress)} (source: brute) · poids{' '}
              {formatPercent2(phase.weight * 100)} [{phase.weightBasisLabel}]
            </p>
            {showAsciiBars && (
              <p className="font-mono text-[10px] leading-3 text-primary/70">{asciiBar(phase.progress)}</p>
            )}
          </div>
          <div className="relative h-3 w-2/3 rounded bg-muted">
            <div
              className="absolute h-3 overflow-hidden rounded border border-primary/40 bg-primary/15"
              style={{ left: `${pct(phase.start)}%`, width: `${Math.max(1, pct(phase.end) - pct(phase.start))}%` }}
            >
              <div
                className={`h-full ${phase.progress >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                style={{ width: `${phase.progress}%` }}
              />
            </div>
            {todayPct !== null && (
              <div
                className="absolute top-0 h-3 w-px bg-destructive"
                style={{ left: `${todayPct}%` }}
                title="Aujourd'hui"
              />
            )}
          </div>
        </div>
      ))}

      {/* Jalons */}
      <div className="flex items-start gap-2">
        <div className="w-1/3 text-xs text-muted-foreground">Jalons clés</div>
        <div className="flex w-2/3">
          {gantt.milestones.map((m) => (
            <div key={m.label} className="flex-1">
              <div
                className={`h-2 w-2 rotate-45 ${m.reached ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`}
              />
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
              <p className={`text-[10px] ${m.reached ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {m.reached ? 'atteint' : 'en attente'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectGanttTimeline;
