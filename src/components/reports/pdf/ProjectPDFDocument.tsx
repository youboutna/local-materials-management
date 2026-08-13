import React from 'react';
import { EVMMetrics, PERTAnalysis, ProjectData } from '@/dtos/types/project';
import { ProjectReportDTO } from '@/dtos/types/reportTypes';
import { buildMonitoringInsights } from '@/utils/monitoringInsights';
import { formatAmount2, formatIndex2, formatNumber2, formatPercent2, formatRatio2, formatSigned2 } from '@/utils/reportNumbers';
import { PhaseWeightingService } from '@/application/services/PhaseWeightingService';
import { EvmService } from '@/application/services/EvmService';
import { Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFCard, PDFCol, PDFDocument, PDFMetricCard, PDFRow, PDFSection, PDFTable, PDFText } from './PDFDocument';
import { ProjectMiniMap } from './ProjectMiniMap';

/**
 * Gantt PDF sur échelle calendaire réelle : une barre par phase positionnée
 * proportionnellement à la période du projet, remplissage = avancement réel,
 * repère rouge = aujourd'hui. Aucun caractère spécial (glyphes absents des
 * polices embarquées) — uniquement des rectangles.
 */
const PhaseGanttBars: React.FC<{ phases: any[]; project: any }> = ({ phases, project }) => {
  const rows = (phases || [])
    .map((p: any) => ({
      name: p.title || p.name || p.phase_name || '—',
      start: new Date(p.startDate ?? p.start_date ?? project?.startDate ?? Date.now()).getTime(),
      end: new Date(p.endDate ?? p.end_date ?? project?.endDate ?? Date.now()).getTime(),
      progress: Math.max(0, Math.min(100, Number(p.actualProgress ?? p.progress ?? 0))),
    }))
    .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start);

  if (rows.length === 0) return null;

  const min = Math.min(...rows.map((r) => r.start));
  const max = Math.max(...rows.map((r) => r.end));
  const span = max - min || 1;
  const pct = (t: number) => ((t - min) / span) * 100;

  const startYear = new Date(min).getFullYear();
  const endYear = new Date(max).getFullYear();
  const years = Array.from({ length: Math.max(1, endYear - startYear + 1) }, (_, i) => startYear + i);
  const now = Date.now();
  const todayPct = now >= min && now <= max ? pct(now) : null;

  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', marginBottom: 2 }}>
        <Text style={{ width: '28%', fontSize: 7, color: '#6b7280' }}>Phase</Text>
        <View style={{ width: '72%', flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#d1d5db' }}>
          {years.map((y) => (
            <Text key={y} style={{ flex: 1, fontSize: 7, color: '#6b7280', textAlign: 'center' }}>
              {y}
            </Text>
          ))}
        </View>
      </View>

      {rows.map((r, idx) => {
        const left = pct(r.start);
        const width = Math.max(1, pct(r.end) - left);
        return (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <Text style={{ width: '28%', fontSize: 7 }}>{r.name}</Text>
            <View style={{ width: '72%', height: 8, backgroundColor: '#f3f4f6', position: 'relative' }}>
              <View
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  width: `${width}%`,
                  height: 8,
                  backgroundColor: '#dbeafe',
                  borderWidth: 0.5,
                  borderColor: '#93c5fd',
                }}
              >
                <View
                  style={{
                    width: `${r.progress}%`,
                    height: 7,
                    backgroundColor: r.progress >= 100 ? '#10b981' : '#3b82f6',
                  }}
                />
              </View>
              {todayPct !== null && (
                <View
                  style={{
                    position: 'absolute',
                    left: `${todayPct}%`,
                    width: 1,
                    height: 8,
                    backgroundColor: '#ef4444',
                  }}
                />
              )}
            </View>
          </View>
        );
      })}
      <Text style={{ fontSize: 6, color: '#9ca3af', marginTop: 2 }}>
        {`Barre pleine = avancement réel · trait rouge = aujourd'hui · échelle ${startYear}-${endYear}`}
      </Text>
    </View>
  );
};


interface ProjectPDFDocumentProps {
  project: ProjectData;
  reportData: any;
  costCalculation: any;
  evmMetrics?: EVMMetrics;
  pertAnalysis?: PERTAnalysis;
  reportConfig: {
    title: string;
    includeSections: {
      overview: boolean;
      financial: boolean;
      timeline: boolean;
      materials: boolean;
      phases: boolean;
      inspections: boolean;
      risks: boolean;
      kpi: boolean;
      milestones: boolean;
      bankGuarantees: boolean;
      insurance: boolean;
      paymentBlocks: boolean;
      suppliers: boolean;
      documents: boolean;
      employees: boolean;
      escalationAlerts: boolean;
      evmAnalysis: boolean;
      pertAnalysis: boolean;
      ganttChart: boolean;
      monitoringEvaluation: boolean;
    };
    notes?: string;
  };
  enrichedData?: ProjectReportDTO;
  /** Écarts calculés via DeviationEngine (référentiel deviation-rules). */
  deviations?: Array<{
    ruleCode: string;
    label: string;
    value: number;
    unit: string;
    severity: 'info' | 'low' | 'medium' | 'high';
    sign: 1 | -1 | 0;
  }>;
  /** Score de santé projet calculé par ProjectCalculationService. */
  healthScore?: any;
  /** Écarts par phase (filtrés selon `selectedPhaseIds`) — alimente le tableau « Suivi & Évaluation ». */
  phaseDeviations?: Array<{
    phaseId: string;
    phaseName: string;
    deviations: Array<{
      ruleCode: string;
      label: string;
      value: number;
      unit: string;
      severity: 'info' | 'low' | 'medium' | 'high';
      sign: 1 | -1 | 0;
    }>;
  }>;
  /** IDs des phases sélectionnées par l'utilisateur (undefined = toutes). */
  selectedPhaseIds?: string[];
  /** Organisation propriétaire — active la lecture référentielle DGEER. */
  organizationName?: string;
  organizationCode?: string;
  /** Coordonnées de l'organisation propriétaire (en-tête unifié avec le rapport compact). */
  company?: { name: string; address: string; phone: string; email: string; logo?: string };
}

export function ProjectPDFDocument({
  project,
  reportData,
  costCalculation,
  evmMetrics,
  pertAnalysis,
  reportConfig,
  enrichedData,
  deviations = [],
  healthScore = null,
  phaseDeviations = [],
  selectedPhaseIds,
  organizationName,
  organizationCode,
  company,
}: ProjectPDFDocumentProps) {

  
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'en cours': 'En cours',
      'terminé': 'Terminé',
      'en attente': 'En attente',
      'suspendu': 'Suspendu',
      'annulé': 'Annulé'
    };
    return statusMap[status] || status;
  };

  // Get materials from project resources
  const materials = project.resources?.filter(r => r.type === 'material') || [];
  
  // Get employees from project resources
  const employees = project.resources?.filter(r => r.type === 'human') || [];
  
  // Get expenses from project data
  const expenses = project.expenses || [];
  
  // Calculate material costs
  const materialCost = materials?.reduce((sum, material) => {
    const quantity = material.availability || 1;
    const unitCost = material.costPerHour || 0;
    return sum + (quantity * unitCost);
  }, 0);
  
  // Calculate labor costs
  const laborCost = employees.reduce((sum, employee) => {
    // Heures réelles si saisies ; sinon la ressource ne contribue pas au coût
    // (avant : 8 h/tâche ou 40 h forfaitaires inventées).
    const hoursWorked = Number(
      (employee as any).hoursWorked ?? (employee as any).allocatedHours ?? 0,
    );
    const hourlyRate = employee.costPerHour || 0;
    return sum + (hoursWorked * hourlyRate);
  }, 0);
  
  // Calculate actual cost from expenses
  const actualCost = expenses.reduce((sum, expense) => {
    if (Array.isArray(expense)) {
      return sum + expense.reduce((subSum, item) => subSum + (item.amount || 0), 0);
    }
    return sum + (expense.amount || 0);
  }, 0);
  
  // Use enriched data if available, otherwise use calculated values
  const financialData = enrichedData?.financialMetrics || {
    totalBudget: project.budget || 0,
    spentAmount: actualCost,
    remainingBudget: (project.budget || 0) - actualCost,
    costOverrun: actualCost - (project.budget || 0)
  };

  // Calculate total variance for PERT analysis safely
  const totalVariance = pertAnalysis?.variances 
    ? Object.values(pertAnalysis?.variances).reduce((sum: number, variance: number) => sum + (variance || 0), 0)
    : 0;
  
  const totalStandardDeviation = totalVariance!=null ? Math.sqrt(totalVariance):0;

  // Safe access to report data properties
  const safeReportData = {
    materials: reportData?.materials || [],
    phases: reportData?.phases || [],
    inspections: reportData?.inspections || [],
    bankGuarantees: reportData?.bankGuarantees || [],
    insurance: reportData?.insurance || [],
    paymentBlocks: reportData?.paymentBlocks || [],
    suppliers: reportData?.suppliers || [],
    documents: reportData?.documents || [],
    employees: reportData?.employees || [],
    escalationAlerts: reportData?.escalationAlerts || [],
    constructionMilestones: reportData?.constructionMilestones || []
  };

  // --- Cohérence EVM : indices indéterminés → « N/A », jamais « sous budget » ---
  const hasActualCost = (evmMetrics as any)?.hasActualCost ?? ((evmMetrics?.actualCost ?? 0) > 0);
  const hasPlannedValue = (evmMetrics as any)?.hasPlannedValue ?? ((evmMetrics?.plannedValue ?? 0) > 0);

  // Avancement unifié : TEP pondéré des phases (source unique) sinon avancement projet.
  const weightedPhases = (enrichedData?.phases?.length ? enrichedData.phases : safeReportData.phases) as any[];
  const weighted = PhaseWeightingService.computeWeightedProgress(
    (weightedPhases || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      weight: p.weight ?? p.weight_percentage,
      budget: p.budget ?? p.estimatedCost ?? p.estimated_cost,
      startDate: p.startDate ?? p.start_date,
      endDate: p.endDate ?? p.end_date,
      progress: p.actualProgress ?? p.progress ?? 0,
    })),
  );
  const unifiedProgress = weighted.isEmpty
    ? Number((evmMetrics as any)?.progress ?? project.progress ?? 0)
    : weighted.progress;
  const plannedProgress =
    (evmMetrics as any)?.plannedProgress ??
    EvmService.plannedProgress(project.startDate as any, project.endDate as any);



  return (
    <PDFDocument
      title={reportConfig.title}
      subtitle={`Projet ${project.title}`}
      company={company ?? (organizationName ? {
        name: organizationName,
        address: (project as any).location || '',
        phone: '',
        email: '',
      } : undefined)}
      miniMap={
        <ProjectMiniMap
          project={{
            location: project.location,
            latitude: (project as any).latitude,
            longitude: (project as any).longitude,
            coordinates: (project as any).coordinates,
            interventionZones: (project as any).interventionZones,
          }}
        />
      }
    >
      {/* Aperçu général */}
      {reportConfig.includeSections.overview && (
        <PDFSection title="Aperçu Général" borderColor="#3b82f6">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Titre" value={project.title} />
                <PDFText label="Localisation" value={project.location || 'Non défini'} />
                <PDFText label="Statut" value={getStatusText(project.status)} />
                <PDFText label="Progression" value={formatPercent2(unifiedProgress)} />
              </PDFCol>
              <PDFCol>
                <PDFText label="Date de début" value={project.startDate ? format(new Date(project.startDate), 'dd/MM/yyyy') : 'Non défini'} />
                <PDFText label="Date de fin prévue" value={project.endDate ? format(new Date(project.endDate), 'dd/MM/yyyy') : 'Non défini'} />
                <PDFText label="Budget" value={project.budget ? `${formatNumber2(project.budget)} MRU` : 'Non défini'} />
              </PDFCol>
            </PDFRow>
            {project.description && (
              <PDFRow>
                <PDFCol>
                  <PDFText label="Description" value={project.description} />
                </PDFCol>
              </PDFRow>
            )}
          </PDFCard>
        </PDFSection>
      )}

      {/* Résumé financier */}
      {reportConfig.includeSections.financial && (
        <PDFSection title="Résumé Financier" borderColor="#10b981">
          <PDFRow>
            <PDFMetricCard
              title="Budget Total"
              value={financialData.totalBudget ? `${formatNumber2(financialData.totalBudget)} MRU` : 'Non défini'}
              color="#10b981"
            />
            <PDFMetricCard
              title="Dépenses Total"
              value={`${formatNumber2(financialData.spentAmount)} MRU`}
              color="#f59e0b"
            />
            <PDFMetricCard
              title="Budget Restant"
              value={`${formatNumber2(financialData.remainingBudget)} MRU`}
              color="#3b82f6"
            />
            <PDFMetricCard
              title="Écart Budget"
              value={`${formatNumber2(financialData.costOverrun)} MRU`}
              color={financialData.costOverrun > 0 ? "#ef4444" : "#10b981"}
            />
          </PDFRow>
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Coût Matériaux" value={`${formatAmount2(materialCost)}`} />
                <PDFText label="Coût Main-d'œuvre" value={`${formatAmount2(laborCost)}`} />
              </PDFCol>
              <PDFCol>
                <PDFText 
                  label="Pourcentage Matériaux" 
                  value={financialData.spentAmount > 0 ? `${((materialCost / financialData.spentAmount) * 100).toFixed(2)}%` : '0%'} 
                />
                <PDFText 
                  label="Pourcentage Main-d'œuvre" 
                  value={financialData.spentAmount > 0 ? `${((laborCost / financialData.spentAmount) * 100).toFixed(2)}%` : '0%'} 
                />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

      {/* Calendrier */}
      {reportConfig.includeSections.timeline && (
        <PDFSection title="Calendrier du Projet" borderColor="#8b5cf6">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Date de début" value={project.startDate ? format(new Date(project.startDate), 'dd/MM/yyyy') : 'Non défini'} />
                <PDFText label="Date de fin prévue" value={project.endDate ? format(new Date(project.endDate), 'dd/MM/yyyy') : 'Non défini'} />
                <PDFText label="Durée totale" value={project.startDate && project.endDate ? 
                  `${Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} jours` : 
                  'Non calculé'} />
              </PDFCol>
              <PDFCol>
                <PDFText label="Progression actuelle" value={formatPercent2(unifiedProgress)} />
                <PDFText label="Temps écoulé" value={project.startDate ? 
                  `${Math.ceil((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} jours` : 
                  'Non calculé'} />
                <PDFText label="Statut planning" value={
                  unifiedProgress >= 90 ? 'Presque terminé' :
                  unifiedProgress >= 50 ? 'En bonne voie' :
                  unifiedProgress >= 25 ? 'En cours' : 'Début de projet'
                } />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

      {/* Écarts (DeviationEngine — référentiel deviation-rules) */}
      {reportConfig.includeSections.kpi && deviations.length > 0 && (
        <PDFSection title="Écarts & Indicateurs Clés" borderColor="#ef4444">
          <PDFTable
            headers={['Indicateur', 'Valeur', 'Unité', 'Sévérité']}
            data={deviations.map((d) => [
              d.label,
              `${d.value > 0 ? '+' : ''}${formatNumber2(d.value)}`,
              d.unit,
              d.severity,
            ])}
          />
          {healthScore && typeof healthScore === 'object' && (
            <PDFText
              label="Score de santé global"
              value={`${healthScore.overallScore ?? healthScore.score ?? '—'}${healthScore.category ? ` (${healthScore.category})` : ''}`}
            />
          )}
        </PDFSection>
      )}


      {/* Matériaux */}
   
    {reportConfig.includeSections.materials && materials.length > 0 && (
      <PDFSection title="Matériaux" borderColor="#8b5cf6">
        <PDFTable
          headers={['Nom', 'Quantité', 'Unité', 'Coût Unitaire', 'Coût Total']}
          data={materials.map(material => {
            const quantity = Number(material?.availability) || 0;
            const unitCost = Number(material?.costPerHour) || 0;
            const totalCost = quantity * unitCost;

            return [
              material.name,
              quantity.toString(),
              'unité',
              `${formatNumber2(unitCost)} MRU`,
              `${formatNumber2(totalCost)} MRU`
            ];
          })}
          columnWidths={['30%', '15%', '15%', '20%', '20%']}
        />
      </PDFSection>
    )}

      {/* Employés */}
      {reportConfig.includeSections.employees && employees.length > 0 && (
        <PDFSection title="Employés" borderColor="#f59e0b">
          <PDFTable
            headers={['Nom', 'Compétences', 'Taux Horaire', 'Heures Estimées', 'Coût Total']}
            data={employees.map(employee => [
              employee.name,
              employee.skills?.join(', ') || 'Non spécifié',
              employee.costPerHour ? `${formatNumber2(employee.costPerHour)} MRU/h` : '0 MRU/h',
              '40h',
              employee.costPerHour ? `${formatNumber2((employee.costPerHour * 40))} MRU` : '0 MRU'
            ])}
            columnWidths={['25%', '25%', '15%', '15%', '20%']}
          />
        </PDFSection>
      )}

      {/* Phases */}
      {reportConfig.includeSections.phases && enrichedData?.phases && enrichedData.phases.length > 0 && (
        <PDFSection title="Phases du Projet" borderColor="#f59e0b">
          <PDFTable
            headers={['Phase', 'Progression', 'Statut', 'Budget', 'Coût Réel', 'Écart']}
            data={enrichedData.phases.map((p: any) => {
              const statusMap: Record<string, string> = {
                'planned': 'Planifié',
                'in_progress': 'En cours',
                'completed': 'Terminé',
                'delayed': 'En retard',
                'not_started': 'Non démarré'
              };
              
              return [
                p.title || p.name || p.phase_name || '—',
                formatPercent2(p.actualProgress ?? p.progress ?? 0),
                statusMap[p.status] || p.status || '—',
                p.budget ? `${formatNumber2(p.budget)} MRU` : '0 MRU',
                p.actualCost ? `${formatNumber2(p.actualCost)} MRU` : '0 MRU',
                formatNumber2((p.actualCost || 0) - (p.budget || 0)) + ' MRU'
              ];
            })}
            columnWidths={['25%', '10%', '15%', '17%', '17%', '16%']}
          />

          {/* Diagramme de Gantt — échelle calendaire réelle */}
          <PhaseGanttBars phases={enrichedData.phases as any[]} project={project} />
        </PDFSection>
      )}

      {/* Inspections */}
      {reportConfig.includeSections.inspections && safeReportData.inspections.length > 0 && (
        <PDFSection title="Inspections" borderColor="#dc2626">
          <PDFTable
            headers={['Date', 'Type', 'Statut', 'Inspecteur', 'Commentaires']}
            data={safeReportData.inspections.map((i: any) => [
              i.date ? format(new Date(i.date), 'dd/MM/yyyy') : '',
              i.inspection_type || i.type || '',
              i.status || '',
              i.inspector || i.inspector_name || '',
              i.comments?.substring(0, 50) + (i.comments?.length > 50 ? '...' : '') || ''
            ])}
            columnWidths={['15%', '20%', '15%', '20%', '30%']}
          />
        </PDFSection>
      )}

      {/* Garanties bancaires */}
      {reportConfig.includeSections.bankGuarantees && safeReportData.bankGuarantees.length > 0 && (
        <PDFSection title="Garanties Bancaires" borderColor="#059669">
          <PDFTable
            headers={['Type', 'Banque', 'Montant', 'Date d\'émission', 'Date d\'expiration', 'Statut']}
            data={safeReportData.bankGuarantees.map((bg: any) => [
              bg.guarantee_type || '',
              bg.bank_name || '',
              bg.guarantee_amount ? `${formatNumber2(bg.guarantee_amount)} MRU` : '',
              bg.issue_date ? format(new Date(bg.issue_date), 'dd/MM/yyyy') : '',
              bg.expiry_date ? format(new Date(bg.expiry_date), 'dd/MM/yyyy') : '',
              bg.status || ''
            ])}
            columnWidths={['20%', '20%', '15%', '15%', '15%', '15%']}
          />
        </PDFSection>
      )}

      {/* Assurances */}
      {reportConfig.includeSections.insurance && safeReportData.insurance.length > 0 && (
        <PDFSection title="Assurances" borderColor="#7c3aed">
          <PDFTable
            headers={['Compagnie', 'Type de couverture', 'Montant', 'Valide du', 'Valide jusqu\'au', 'Statut']}
            data={safeReportData.insurance.map((ins: any) => [
              ins.insurance_company || '',
              ins.coverage_type || '',
              ins.coverage_amount ? `${formatNumber2(ins.coverage_amount)} MRU` : '',
              ins.valid_from ? format(new Date(ins.valid_from), 'dd/MM/yyyy') : '',
              ins.valid_until ? format(new Date(ins.valid_until), 'dd/MM/yyyy') : '',
              ins.status || ''
            ])}
            columnWidths={['20%', '20%', '15%', '15%', '15%', '15%']}
          />
        </PDFSection>
      )}

      {/* Analyse des risques */}
      {reportConfig.includeSections.risks && evmMetrics && (
        <PDFSection title="Analyse des Risques" borderColor="#dc2626">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText 
                  label="Risque de délai" 
                  value={!hasPlannedValue ? "NON ÉVALUABLE - Projet non démarré (PV = 0)" : evmMetrics.schedulePerformanceIndex < 0.9 ? "ÉLEVÉ - Retards significatifs" : evmMetrics.schedulePerformanceIndex < 1.1 ? "MOYEN - Surveillance requise" : "FAIBLE - Dans les délais"} 
                />
                <PDFText 
                  label="Risque de coût" 
                  value={!hasActualCost ? "NON ÉVALUABLE - Aucun coût engagé (AC = 0)" : evmMetrics.costPerformanceIndex < 0.9 ? "ÉLEVÉ - Dépassement budget" : evmMetrics.costPerformanceIndex < 1.1 ? "MOYEN - Surveillance requise" : "FAIBLE - Dans le budget"} 
                />
              </PDFCol>
              <PDFCol>
                <PDFText label="Indice SPI" value={formatIndex2(evmMetrics.schedulePerformanceIndex, hasPlannedValue)} />
                <PDFText label="Indice CPI" value={formatIndex2(evmMetrics.costPerformanceIndex, hasActualCost)} />
              </PDFCol>
            </PDFRow>
            <PDFRow>
              <PDFCol>
                <PDFText 
                  label="Recommandations" 
                  value={(hasPlannedValue && evmMetrics.schedulePerformanceIndex < 0.9) || (hasActualCost && evmMetrics.costPerformanceIndex < 0.9) ? 
                    "Actions correctives urgentes requises. Révision du planning et du budget nécessaire." : 
                    "Continuer la surveillance régulière des indicateurs de performance."
                  } 
                />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

      {/* Indicateurs de Performance (KPI) */}
      {reportConfig.includeSections.kpi && evmMetrics && (
        <PDFSection title="Indicateurs de Performance (KPI)" borderColor="#3b82f6">
          <PDFRow>
            <PDFMetricCard
              title="Indice SPI"
              value={formatIndex2(evmMetrics.schedulePerformanceIndex, hasPlannedValue)}
              color={!hasPlannedValue ? "#6b7280" : evmMetrics.schedulePerformanceIndex >= 1 ? "#10b981" : evmMetrics.schedulePerformanceIndex >= 0.9 ? "#f59e0b" : "#ef4444"}
            />
            <PDFMetricCard
              title="Indice CPI"
              value={formatIndex2(evmMetrics.costPerformanceIndex, hasActualCost)}
              color={!hasActualCost ? "#6b7280" : evmMetrics.costPerformanceIndex >= 1 ? "#10b981" : evmMetrics.costPerformanceIndex >= 0.9 ? "#f59e0b" : "#ef4444"}
            />
            <PDFMetricCard
              title="Budget engagé"
              value={evmMetrics.budgetAtCompletion > 0 ? formatPercent2((evmMetrics.actualCost / evmMetrics.budgetAtCompletion) * 100) : formatPercent2(0)}
              color={evmMetrics.budgetAtCompletion > 0 && evmMetrics.actualCost <= evmMetrics.budgetAtCompletion ? "#10b981" : "#ef4444"}
            />
            <PDFMetricCard
              title="Progression (TEP pondéré)"
              value={formatPercent2(unifiedProgress)}
              color="#8b5cf6"
            />
          </PDFRow>
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Performance délai" value={!hasPlannedValue ? "Non évaluable" : evmMetrics.schedulePerformanceIndex >= 1 ? "Excellent" : evmMetrics.schedulePerformanceIndex >= 0.9 ? "Satisfaisant" : "À améliorer"} />
                <PDFText label="Performance coût" value={!hasActualCost ? "Non évaluable (aucun coût engagé)" : evmMetrics.costPerformanceIndex >= 1 ? "Excellent" : evmMetrics.costPerformanceIndex >= 0.9 ? "Satisfaisant" : "À améliorer"} />
              </PDFCol>
              <PDFCol>
                <PDFText
                  label="Écart d'avancement"
                  value={
                    plannedProgress == null
                      ? 'Non évaluable'
                      : `${formatSigned2(unifiedProgress - plannedProgress, 'pts')} (réel ${formatPercent2(unifiedProgress)} vs planifié ${formatPercent2(plannedProgress)})`
                  }
                />
                <PDFText label="Statut global" value={!hasPlannedValue && !hasActualCost ? "Non évaluable" : hasPlannedValue && evmMetrics.schedulePerformanceIndex >= 1 && (!hasActualCost || evmMetrics.costPerformanceIndex >= 1) ? "Très bon" : "En surveillance"} />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}


      {/* Suivi & Évaluation — synthèse écarts + jugement global de performance */}
      {reportConfig.includeSections.monitoringEvaluation && (() => {
        const spi = evmMetrics?.schedulePerformanceIndex;
        const cpi = evmMetrics?.costPerformanceIndex;
        const severityLabel: Record<string, string> = {
          info: 'Conforme',
          low: 'Faible',
          medium: 'Modéré',
          high: 'Critique',
        };
        const judgeDeviation = (sign: number, severity: string) => {
          if (severity === 'info') return 'Conforme';
          const direction = sign > 0 ? 'Dépassement' : sign < 0 ? 'Avance/Économie' : 'Stable';
          return `${direction} — ${severityLabel[severity] || severity}`;
        };
        const globalJudgment = (() => {
          if (spi == null || cpi == null) return { label: 'Données insuffisantes', color: '#6b7280' };
          if (spi >= 1 && cpi >= 1) return { label: 'Excellent — projet sous contrôle', color: '#10b981' };
          if (spi >= 0.95 && cpi >= 0.95) return { label: 'Satisfaisant — surveillance régulière', color: '#3b82f6' };
          if (spi >= 0.85 && cpi >= 0.85) return { label: 'Vigilance — actions préventives requises', color: '#f59e0b' };
          return { label: 'Critique — actions correctives urgentes', color: '#ef4444' };
        })();
        const score = healthScore && typeof healthScore === 'object'
          ? (healthScore.overallScore ?? healthScore.score ?? null)
          : null;

        return (
          <PDFSection title="Suivi & Évaluation" borderColor="#0ea5e9">
            <PDFRow>
              <PDFMetricCard
                title="Performance globale"
                value={globalJudgment.label}
                color={globalJudgment.color}
              />
              {score != null && (
                <PDFMetricCard
                  title="Score de santé"
                  value={`${formatNumber2(score)}/100`}
                  color="#8b5cf6"
                />
              )}
              {spi != null && (
                <PDFMetricCard
                  title="SPI (délai)"
                  value={formatRatio2(spi)}
                  color={spi >= 1 ? '#10b981' : spi >= 0.9 ? '#f59e0b' : '#ef4444'}
                />
              )}
              {cpi != null && (
                <PDFMetricCard
                  title="CPI (coût)"
                  value={formatRatio2(cpi)}
                  color={cpi >= 1 ? '#10b981' : cpi >= 0.9 ? '#f59e0b' : '#ef4444'}
                />
              )}
            </PDFRow>

            {deviations.length > 0 ? (
              <PDFTable
                headers={['Indicateur', 'Écart', 'Unité', 'Sévérité', 'Jugement']}
                data={deviations.map((d) => [
                  d.label,
                  `${d.value > 0 ? '+' : ''}${formatNumber2(d.value)}`,
                  d.unit,
                  (severityLabel[d.severity] || d.severity).toUpperCase(),
                  judgeDeviation(d.sign, d.severity),
                ])}
                columnWidths={['30%', '15%', '10%', '15%', '30%']}
              />
            ) : (
              <PDFCard>
                <PDFText label="Écarts" value="Aucun écart significatif détecté sur la période." />
              </PDFCard>
            )}

            {/* Écarts par phase — filtré selon `selectedPhaseIds` côté générateur */}
            {(() => {
              const filtered = selectedPhaseIds
                ? phaseDeviations.filter((pd) => selectedPhaseIds.includes(pd.phaseId))
                : phaseDeviations;
              const rows = filtered.flatMap((pd) =>
                pd.deviations.length > 0
                  ? pd.deviations.map((d) => [
                      pd.phaseName,
                      d.label,
                      `${d.value > 0 ? '+' : ''}${formatNumber2(d.value)} ${d.unit}`,
                      (severityLabel[d.severity] || d.severity).toUpperCase(),
                      judgeDeviation(d.sign, d.severity),
                    ])
                  : [[pd.phaseName, '—', '—', 'CONFORME', 'Aucun écart calculable']],
              );
              if (rows.length === 0) return null;
              return (
                <PDFTable
                  headers={['Phase', 'Indicateur', 'Écart', 'Sévérité', 'Jugement']}
                  data={rows}
                  columnWidths={['25%', '25%', '15%', '13%', '22%']}
                />
              );
            })()}

            {/* Suivi & Évaluation — référentiel générique (tout type de projet) */}
            {(() => {
              const highRisks = (safeReportData as any).risks
                ? []
                : (reportData?.risks || enrichedData?.riskAssessment?.risks || []);
              const highCount = (highRisks as any[]).filter((r: any) => {
                const level = String(r?.impact ?? r?.severity ?? r?.riskLevel ?? '').toLowerCase();
                const status = String(r?.status ?? '').toLowerCase();
                const open = !['mitigated', 'closed', 'resolu', 'resolved'].includes(status);
                return open && (level.includes('high') || level.includes('eleve') || level.includes('critique') || level.includes('critical'));
              }).length;

              const insights = buildMonitoringInsights({
                progress: unifiedProgress,
                budget: project.budget ?? 0,
                actualCost: Number(evmMetrics?.actualCost ?? costCalculation?.totalCost ?? 0),
                phasesCount: Array.isArray(enrichedData?.phases)
                  ? enrichedData!.phases.length
                  : safeReportData.phases.length,
                interventionZonesCount: Array.isArray((project as any).interventionZones)
                  ? (project as any).interventionZones.length
                  : 0,
                inspectionsCount: safeReportData.inspections.length,
                documentsCount: safeReportData.documents.length,
                highRisksCount: highCount,
              });

              return (
                <PDFTable
                  headers={['Axe de suivi', 'Question de décision', 'Indicateur', 'Valeur', 'Appréciation']}
                  data={insights.map((m) => [
                    m.label,
                    m.decisionQuestion,
                    m.indicatorLabel,
                    m.value,
                    m.appreciationLabel,
                  ])}
                  columnWidths={['20%', '32%', '20%', '12%', '16%']}
                />
              );
            })()}


            <PDFCard>
              <PDFRow>
                <PDFCol>
                  <PDFText
                    label="Synthèse délai"
                    value={spi == null ? 'N/A' : spi >= 1 ? 'Avance ou conforme au planning' : spi >= 0.9 ? 'Léger retard à surveiller' : 'Retard significatif — replanifier'}
                  />
                  <PDFText
                    label="Synthèse coût"
                    value={cpi == null ? 'N/A' : cpi >= 1 ? 'Sous le budget' : cpi >= 0.9 ? 'Léger dépassement à surveiller' : 'Dépassement budgétaire — arbitrer'}
                  />
                </PDFCol>
                <PDFCol>
                  <PDFText
                    label="Recommandation"
                    value={
                      (spi != null && spi < 0.9) || (cpi != null && cpi < 0.9)
                        ? 'Mettre en place un plan de redressement (planning + coût) et un comité de pilotage hebdomadaire.'
                        : (spi != null && spi < 1) || (cpi != null && cpi < 1)
                        ? 'Renforcer le suivi des phases critiques et anticiper les arbitrages ressources.'
                        : 'Maintenir le rythme et capitaliser les bonnes pratiques.'
                    }
                  />
                </PDFCol>
              </PDFRow>
            </PDFCard>
          </PDFSection>
        );
      })()}

      {/* Jalons */}
      {reportConfig.includeSections.milestones && (
        <PDFSection title="Jalons du Projet" borderColor="#10b981">
          {enrichedData?.constructionMilestones && enrichedData.constructionMilestones.length > 0 ? (
            <PDFTable
              headers={['Jalon', 'Date cible', 'Statut', 'Priorité', 'Progression', 'Phase']}
              data={enrichedData.constructionMilestones.map((milestone: any) => {
                const statusMap: Record<string, string> = {
                  'pending': 'En attente',
                  'in_progress': 'En cours',
                  'completed': 'Terminé',
                  'overdue': 'En retard'
                };
                const priorityMap: Record<string, string> = {
                  'low': 'Faible',
                  'medium': 'Moyenne',
                  'high': 'Haute',
                  'critical': 'Critique'
                };
                const stageMap: Record<string, string> = {
                  'conception': 'Conception',
                  'preparation': 'Préparation',
                  'execution': 'Exécution',
                  'validation': 'Validation',
                  'livraison': 'Livraison'
                };
                
                return [
                  milestone.title || milestone.name || '—',
                  milestone.targetDate ? format(new Date(milestone.targetDate), 'dd/MM/yyyy') : 'Non défini',
                  statusMap[milestone.status] || milestone.status || 'Non défini',
                  priorityMap[milestone.priority] || milestone.priority || 'Moyenne',
                  formatPercent2(milestone.completionPercentage ?? 0),
                  stageMap[milestone.stage] || milestone.stage || 'Exécution'
                ];
              })}
              columnWidths={['25%', '15%', '15%', '13%', '12%', '20%']}
            />
          ) : (
            <PDFTable
              headers={['Jalon', 'Progression cible', 'Statut', 'Date prévue', 'Réalisation']}
              data={[
                ['Démarrage du Projet', '0%', unifiedProgress >= 0 ? 'Terminé' : 'En attente', project.startDate ? format(new Date(project.startDate), 'dd/MM/yyyy') : 'Non défini', unifiedProgress >= 0 ? '✓' : '⏳'],
                ['25% d\'Avancement', '25%', unifiedProgress >= 25 ? 'Terminé' : unifiedProgress >= 15 ? 'En cours' : 'En attente', '', unifiedProgress >= 25 ? '✓' : unifiedProgress >= 15 ? '⏳' : '⌛'],
                ['50% d\'Avancement', '50%', unifiedProgress >= 50 ? 'Terminé' : unifiedProgress >= 40 ? 'En cours' : 'En attente', '', unifiedProgress >= 50 ? '✓' : unifiedProgress >= 40 ? '⏳' : '⌛'],
                ['75% d\'Avancement', '75%', unifiedProgress >= 75 ? 'Terminé' : unifiedProgress >= 65 ? 'En cours' : 'En attente', '', unifiedProgress >= 75 ? '✓' : unifiedProgress >= 65 ? '⏳' : '⌛'],
                ['Finalisation', '100%', unifiedProgress >= 100 ? 'Terminé' : unifiedProgress >= 90 ? 'En cours' : 'En attente', project.endDate ? format(new Date(project.endDate), 'dd/MM/yyyy') : 'Non défini', unifiedProgress >= 100 ? '✓' : unifiedProgress >= 90 ? '⏳' : '⌛']
              ]}
              columnWidths={['25%', '15%', '20%', '20%', '20%']}
            />
          )}
        </PDFSection>
      )}

      {/* Analyse EVM */}
      {reportConfig.includeSections.evmAnalysis && evmMetrics && (
        <PDFSection title="Analyse EVM (Earned Value Management)" borderColor="#1d4ed8">
          <PDFRow>
            <PDFMetricCard
              title="Valeur Planifiée (PV)"
              value={`${formatNumber2(evmMetrics.plannedValue)} MRU`}
              color="#3b82f6"
            />
            <PDFMetricCard
              title="Valeur Acquise (EV)"
              value={`${formatNumber2(evmMetrics.earnedValue)} MRU`}
              color="#10b981"
            />
            <PDFMetricCard
              title="Coût Réel (AC)"
              value={`${formatNumber2(evmMetrics.actualCost)} MRU`}
              color="#ef4444"
            />
            <PDFMetricCard
              title="SPI"
              value={formatRatio2(evmMetrics.schedulePerformanceIndex)}
              color="#8b5cf6"
            />
          </PDFRow>
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Écart de délai (SV)" value={`${formatNumber2(evmMetrics.scheduleVariance)} MRU`} />
                <PDFText label="Écart de coût (CV)" value={`${formatNumber2(evmMetrics.costVariance)} MRU`} />
                <PDFText label="Indice de performance coût (CPI)" value={formatIndex2(evmMetrics.costPerformanceIndex, (evmMetrics as any).hasActualCost)} />
              </PDFCol>
              <PDFCol>
                <PDFText label="Budget à l'achèvement (BAC)" value={`${formatNumber2(evmMetrics.budgetAtCompletion)} MRU`} />
                <PDFText label="Estimation à l'achèvement (EAC)" value={`${formatNumber2(evmMetrics.estimateAtCompletion)} MRU`} />
                <PDFText label="Estimation pour terminer (ETC)" value={`${formatNumber2(evmMetrics.estimateToComplete)} MRU`} />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

      {/* Analyse PERT */}
      {reportConfig.includeSections.pertAnalysis && pertAnalysis && (
        <PDFSection title="Analyse PERT" borderColor="#0ea5e9">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText 
                  label="Durée totale estimée (PERT)" 
                  value={`${formatNumber2(pertAnalysis.totalExpectedDuration ?? 0)} jours`} 
                />
                <PDFText 
                  label="Écart-type total" 
                  value={`${formatNumber2(totalStandardDeviation)} jours`} 
                />
              </PDFCol>
              <PDFCol>
                <PDFText
                  label="Durée calendaire de référence"
                  value={
                    project.startDate && project.endDate
                      ? `${formatNumber2(
                          Math.max(
                            0,
                            (new Date(project.endDate as any).getTime() -
                              new Date(project.startDate as any).getTime()) /
                              86400000,
                          ),
                        )} jours`
                      : 'Non renseignée'
                  }
                />
                <PDFText
                  label="Lecture"
                  value="La durée PERT est une estimation probabiliste ; la durée calendaire reste la référence contractuelle."
                />
              </PDFCol>
            </PDFRow>
          </PDFCard>
          {pertAnalysis.activities && pertAnalysis.activities.length > 0 && (
            <PDFTable
              headers={['Activité', 'Optimiste (j)', 'Probable (j)', 'Pessimiste (j)', 'Estimation PERT (j)', 'Écart-type']}
              data={pertAnalysis.activities.map((activity: any) => [
                activity.name || 'Activité sans nom',
                formatNumber2(activity.optimistic ?? 0),
                formatNumber2(activity.mostLikely ?? 0),
                formatNumber2(activity.pessimistic ?? 0),
                formatNumber2(activity.pertEstimate ?? 0),
                formatNumber2(activity.standardDeviation ?? 0)
              ])}
              columnWidths={['25%', '12%', '12%', '12%', '15%', '12%']}
            />
          )}
        </PDFSection>
      )}

      {/* Diagramme de Gantt — vue tabulaire phases sur timeline */}
      {reportConfig.includeSections.ganttChart && enrichedData?.phases && enrichedData.phases.length > 0 && (
        <PDFSection title="Diagramme de Gantt" borderColor="#0891b2">
          <PhaseGanttBars phases={enrichedData.phases as any[]} project={project} />
          <PDFTable
            headers={['Phase', 'Début', 'Fin', 'Durée (j)', 'Avancement', 'Statut']}
            data={enrichedData.phases.map((p: any) => {
              const start = p.startDate ? new Date(p.startDate) : null;
              const end = p.endDate ? new Date(p.endDate) : null;
              const duration = start && end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000)) : 0;
              return [
                p.title || p.name || 'Phase',
                start ? format(start, 'dd/MM/yyyy') : '—',
                end ? format(end, 'dd/MM/yyyy') : '—',
                formatNumber2(duration),
                formatPercent2(p.actualProgress ?? p.progress ?? 0),
                p.status || '—',
              ];
            })}
            columnWidths={['30%', '15%', '15%', '12%', '13%', '15%']}
          />
        </PDFSection>
      )}

      {/* Blocages de paiements */}
      {reportConfig.includeSections.paymentBlocks && safeReportData.paymentBlocks.length > 0 && (
        <PDFSection title="Blocages de Paiements" borderColor="#dc2626">
          <PDFTable
            headers={['Référence', 'Motif', 'Montant', 'Statut', 'Date']}
            data={safeReportData.paymentBlocks.map((b: any) => [
              b.reference || b.id || '—',
              b.reason || b.cause || '—',
              b.amount != null ? `${formatNumber2(Number(b.amount))} ${(project as any).currency || 'MRU'}` : '—',
              b.status || 'bloqué',
              b.createdAt ? format(new Date(b.createdAt), 'dd/MM/yyyy') : '—',
            ])}
            columnWidths={['20%', '30%', '20%', '15%', '15%']}
          />
        </PDFSection>
      )}

      {/* Fournisseurs */}
      {reportConfig.includeSections.suppliers && safeReportData.suppliers.length > 0 && (
        <PDFSection title="Fournisseurs" borderColor="#7c3aed">
          <PDFTable
            headers={['Nom', 'Contact', 'Catégorie', 'Statut']}
            data={safeReportData.suppliers.map((s: any) => [
              s.name || s.companyName || '—',
              s.contactName || s.email || s.phone || '—',
              s.category || s.type || '—',
              s.status || 'actif',
            ])}
            columnWidths={['35%', '30%', '20%', '15%']}
          />
        </PDFSection>
      )}

      {/* Documents */}
      {reportConfig.includeSections.documents && safeReportData.documents.length > 0 && (
        <PDFSection title="Documents" borderColor="#0d9488">
          <PDFTable
            headers={['Titre', 'Type', 'Auteur', 'Date']}
            data={safeReportData.documents.map((d: any) => [
              d.title || d.name || d.fileName || '—',
              d.type || d.documentType || '—',
              d.author || d.uploadedBy || '—',
              d.createdAt ? format(new Date(d.createdAt), 'dd/MM/yyyy') : (d.uploadedAt ? format(new Date(d.uploadedAt), 'dd/MM/yyyy') : '—'),
            ])}
            columnWidths={['40%', '20%', '20%', '20%']}
          />
        </PDFSection>
      )}

      {/* Alertes d'escalade */}
      {reportConfig.includeSections.escalationAlerts && safeReportData.escalationAlerts.length > 0 && (
        <PDFSection title="Alertes d'Escalade" borderColor="#ea580c">
          <PDFTable
            headers={['Sévérité', 'Catégorie', 'Message', 'Date']}
            data={safeReportData.escalationAlerts.map((a: any) => [
              (a.severity || a.level || 'info').toUpperCase(),
              a.category || a.type || '—',
              a.message || a.description || '—',
              a.createdAt ? format(new Date(a.createdAt), 'dd/MM/yyyy HH:mm') : '—',
            ])}
            columnWidths={['15%', '20%', '50%', '15%']}
          />
        </PDFSection>
      )}

      {reportConfig.notes && (
        <PDFSection title="Notes Additionnelles" borderColor="#6366f1">
          <PDFCard>
            <PDFText label="" value={reportConfig.notes} />
          </PDFCard>
        </PDFSection>
      )}
    </PDFDocument>
  );
}