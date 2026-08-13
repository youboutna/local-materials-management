import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { GanttModel } from '@/application/services/ProjectMetricsOrchestrator';
import { formatPercent2 } from '@/utils/reportNumbers';

/**
 * PhaseGanttBars — composant Gantt PDF UNIQUE et réutilisable.
 *
 * Alimenté exclusivement par le `GanttModel` produit par
 * ProjectMetricsOrchestrator (calendrier réel, poids et sa source, jalons
 * 0/25/50/75/100, repère « aujourd'hui »). Aucun glyphe spécial : uniquement
 * des rectangles (les polices embarquées n'ont pas ✓/█).
 */
export const PhaseGanttBars: React.FC<{ gantt: GanttModel; title?: string }> = ({ gantt, title }) => {
  if (!gantt || gantt.isEmpty) return null;

  const span = gantt.end - gantt.start || 1;
  const pct = (t: number) => ((t - gantt.start) / span) * 100;
  const todayPct = gantt.today !== null ? pct(gantt.today) : null;

  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ fontSize: 7, color: '#374151', marginBottom: 3 }}>
        {title ??
          `Calendrier réel du projet (${format(new Date(gantt.start), 'dd/MM/yyyy')} -> ${format(
            new Date(gantt.end),
            'dd/MM/yyyy',
          )})`}
      </Text>

      {/* Frise des années */}
      <View style={{ flexDirection: 'row', marginBottom: 2 }}>
        <Text style={{ width: '30%', fontSize: 7, color: '#6b7280' }}>Phase (poids)</Text>
        <View
          style={{
            width: '70%',
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: '#d1d5db',
          }}
        >
          {gantt.years.map((y) => (
            <Text key={y} style={{ flex: 1, fontSize: 7, color: '#6b7280', textAlign: 'center' }}>
              {y}
            </Text>
          ))}
        </View>
      </View>

      {/* Barres de phases */}
      {gantt.phases.map((phase) => {
        const left = pct(phase.start);
        const width = Math.max(1, pct(phase.end) - left);
        return (
          <View key={phase.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <View style={{ width: '30%' }}>
              <Text style={{ fontSize: 7 }}>{phase.name}</Text>
              <Text style={{ fontSize: 6, color: '#9ca3af' }}>
                {`${formatPercent2(phase.progress)} (source: brute) · poids ${formatPercent2(
                  phase.weight * 100,
                )} [${phase.weightBasisLabel}]`}
              </Text>
            </View>
            <View style={{ width: '70%', height: 9, backgroundColor: '#f3f4f6', position: 'relative' }}>
              <View
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  width: `${width}%`,
                  height: 9,
                  backgroundColor: '#dbeafe',
                  borderWidth: 0.5,
                  borderColor: '#93c5fd',
                }}
              >
                <View
                  style={{
                    width: `${phase.progress}%`,
                    height: 8,
                    backgroundColor: phase.progress >= 100 ? '#10b981' : '#3b82f6',
                  }}
                />
              </View>
              {todayPct !== null && (
                <View
                  style={{
                    position: 'absolute',
                    left: `${todayPct}%`,
                    width: 1,
                    height: 9,
                    backgroundColor: '#ef4444',
                  }}
                />
              )}
            </View>
          </View>
        );
      })}

      {/* Jalons de progression */}
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <Text style={{ width: '30%', fontSize: 6, color: '#6b7280' }}>Jalons</Text>
        <View style={{ width: '70%', flexDirection: 'row' }}>
          {gantt.milestones.map((m) => (
            <View key={m.label} style={{ flex: 1 }}>
              <View
                style={{
                  height: 4,
                  width: 4,
                  backgroundColor: m.reached ? '#10b981' : '#d1d5db',
                }}
              />
              <Text style={{ fontSize: 5.5, color: '#6b7280' }}>{m.label}</Text>
              <Text style={{ fontSize: 5.5, color: m.reached ? '#10b981' : '#9ca3af' }}>
                {m.reached ? 'atteint' : 'en attente'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ fontSize: 6, color: '#9ca3af', marginTop: 2 }}>
        Barre pleine = avancement réel de la phase (brut) · trait rouge = aujourd'hui · poids issu du
        service de pondération
      </Text>
    </View>
  );
};

export default PhaseGanttBars;
