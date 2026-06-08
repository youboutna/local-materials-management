import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EVMMetrics, PERTAnalysis, ProjectData } from '../../../types/project';
import { ProjectReportDTO } from '../../../types/reportTypes';
import { PDFCard, PDFCol, PDFDocument, PDFMetricCard, PDFRow, PDFSection, PDFTable, PDFText } from './PDFDocument';

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
    const hoursWorked = employee.assignedTasks?.length * 8 || 40;
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

  return (
    <PDFDocument
      title={reportConfig.title}
      subtitle={`Projet ${project.title} - ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`}
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
                <PDFText label="Progression" value={`${project.progress}%`} />
              </PDFCol>
              <PDFCol>
                <PDFText label="Date de début" value={project.startDate ? format(new Date(project.startDate), 'dd/MM/yyyy') : 'Non défini'} />
                <PDFText label="Date de fin prévue" value={project.endDate ? format(new Date(project.endDate), 'dd/MM/yyyy') : 'Non défini'} />
                <PDFText label="Budget" value={project.budget ? `${project.budget.toLocaleString('fr-FR')} MRU` : 'Non défini'} />
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
              value={financialData.totalBudget ? `${financialData.totalBudget.toLocaleString('fr-FR')} MRU` : 'Non défini'}
              color="#10b981"
            />
            <PDFMetricCard
              title="Dépenses Total"
              value={`${financialData.spentAmount.toLocaleString('fr-FR')} MRU`}
              color="#f59e0b"
            />
            <PDFMetricCard
              title="Budget Restant"
              value={`${financialData.remainingBudget.toLocaleString('fr-FR')} MRU`}
              color="#3b82f6"
            />
            <PDFMetricCard
              title="Écart Budget"
              value={`${financialData.costOverrun.toLocaleString('fr-FR')} MRU`}
              color={financialData.costOverrun > 0 ? "#ef4444" : "#10b981"}
            />
          </PDFRow>
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Coût Matériaux" value={`${materialCost} MRU`} />
                <PDFText label="Coût Main-d'œuvre" value={`${laborCost} MRU`} />
              </PDFCol>
              <PDFCol>
                <PDFText 
                  label="Pourcentage Matériaux" 
                  value={financialData.spentAmount > 0 ? `${((materialCost / financialData.spentAmount) * 100).toFixed(1)}%` : '0%'} 
                />
                <PDFText 
                  label="Pourcentage Main-d'œuvre" 
                  value={financialData.spentAmount > 0 ? `${((laborCost / financialData.spentAmount) * 100).toFixed(1)}%` : '0%'} 
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
                <PDFText label="Progression actuelle" value={`${project.progress}%`} />
                <PDFText label="Temps écoulé" value={project.startDate ? 
                  `${Math.ceil((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} jours` : 
                  'Non calculé'} />
                <PDFText label="Statut planning" value={
                  project.progress >= 90 ? 'Presque terminé' :
                  project.progress >= 50 ? 'En bonne voie' :
                  project.progress >= 25 ? 'En cours' : 'Début de projet'
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
              `${d.value > 0 ? '+' : ''}${d.value}`,
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
              `${unitCost.toLocaleString('fr-FR')} MRU`,
              `${totalCost.toLocaleString('fr-FR')} MRU`
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
              employee.costPerHour ? `${employee.costPerHour.toLocaleString('fr-FR')} MRU/h` : '0 MRU/h',
              '40h',
              employee.costPerHour ? `${(employee.costPerHour * 40).toLocaleString('fr-FR')} MRU` : '0 MRU'
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
                `${p.actualProgress ?? p.progress ?? 0}%`,
                statusMap[p.status] || p.status || '—',
                p.budget ? `${p.budget.toLocaleString('fr-FR')} MRU` : '0 MRU',
                p.actualCost ? `${p.actualCost.toLocaleString('fr-FR')} MRU` : '0 MRU',
                ((p.actualCost || 0) - (p.budget || 0)).toLocaleString('fr-FR') + ' MRU'
              ];
            })}
            columnWidths={['25%', '10%', '15%', '17%', '17%', '16%']}
          />
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
              bg.guarantee_amount ? `${bg.guarantee_amount.toLocaleString('fr-FR')} MRU` : '',
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
              ins.coverage_amount ? `${ins.coverage_amount.toLocaleString('fr-FR')} MRU` : '',
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
                  value={evmMetrics.schedulePerformanceIndex < 0.9 ? "ÉLEVÉ - Retards significatifs" : evmMetrics.schedulePerformanceIndex < 1.1 ? "MOYEN - Surveillance requise" : "FAIBLE - Dans les délais"} 
                />
                <PDFText 
                  label="Risque de coût" 
                  value={evmMetrics.costPerformanceIndex < 0.9 ? "ÉLEVÉ - Dépassement budget" : evmMetrics.costPerformanceIndex < 1.1 ? "MOYEN - Surveillance requise" : "FAIBLE - Dans le budget"} 
                />
              </PDFCol>
              <PDFCol>
                <PDFText label="Indice SPI" value={evmMetrics.schedulePerformanceIndex.toFixed(2)} />
                <PDFText label="Indice CPI" value={evmMetrics.costPerformanceIndex.toFixed(2)} />
              </PDFCol>
            </PDFRow>
            <PDFRow>
              <PDFCol>
                <PDFText 
                  label="Recommandations" 
                  value={evmMetrics.schedulePerformanceIndex < 0.9 || evmMetrics.costPerformanceIndex < 0.9 ? 
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
              value={evmMetrics.schedulePerformanceIndex.toFixed(2)}
              color={evmMetrics.schedulePerformanceIndex >= 1 ? "#10b981" : evmMetrics.schedulePerformanceIndex >= 0.9 ? "#f59e0b" : "#ef4444"}
            />
            <PDFMetricCard
              title="Indice CPI"
              value={evmMetrics.costPerformanceIndex.toFixed(2)}
              color={evmMetrics.costPerformanceIndex >= 1 ? "#10b981" : evmMetrics.costPerformanceIndex >= 0.9 ? "#f59e0b" : "#ef4444"}
            />
            <PDFMetricCard
              title="Écart Budget"
              value={evmMetrics.budgetAtCompletion > 0 ? `${((evmMetrics.actualCost / evmMetrics.budgetAtCompletion - 1) * 100).toFixed(1)}%` : '0%'}
              color={evmMetrics.budgetAtCompletion > 0 && evmMetrics.actualCost <= evmMetrics.budgetAtCompletion ? "#10b981" : "#ef4444"}
            />
            <PDFMetricCard
              title="Progression"
              value={evmMetrics.budgetAtCompletion > 0 ? `${((evmMetrics.earnedValue / evmMetrics.budgetAtCompletion) * 100).toFixed(1)}%` : '0%'}
              color="#8b5cf6"
            />
          </PDFRow>
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Performance délai" value={evmMetrics.schedulePerformanceIndex >= 1 ? "Excellent" : evmMetrics.schedulePerformanceIndex >= 0.9 ? "Satisfaisant" : "À améliorer"} />
                <PDFText label="Performance coût" value={evmMetrics.costPerformanceIndex >= 1 ? "Excellent" : evmMetrics.costPerformanceIndex >= 0.9 ? "Satisfaisant" : "À améliorer"} />
              </PDFCol>
              <PDFCol>
                <PDFText label="Tendance générale" value={evmMetrics.schedulePerformanceIndex >= 0.9 && evmMetrics.costPerformanceIndex >= 0.9 ? "Positive" : "Nécessite attention"} />
                <PDFText label="Statut global" value={evmMetrics.schedulePerformanceIndex >= 1 && evmMetrics.costPerformanceIndex >= 1 ? "Très bon" : "En surveillance"} />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

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
                  `${milestone.completionPercentage || 0}%`,
                  stageMap[milestone.stage] || milestone.stage || 'Exécution'
                ];
              })}
              columnWidths={['25%', '15%', '15%', '13%', '12%', '20%']}
            />
          ) : (
            <PDFTable
              headers={['Jalon', 'Progression cible', 'Statut', 'Date prévue', 'Réalisation']}
              data={[
                ['Démarrage du Projet', '0%', project.progress >= 0 ? 'Terminé' : 'En attente', project.startDate ? format(new Date(project.startDate), 'dd/MM/yyyy') : 'Non défini', project.progress >= 0 ? '✓' : '⏳'],
                ['25% d\'Avancement', '25%', project.progress >= 25 ? 'Terminé' : project.progress >= 15 ? 'En cours' : 'En attente', '', project.progress >= 25 ? '✓' : project.progress >= 15 ? '⏳' : '⌛'],
                ['50% d\'Avancement', '50%', project.progress >= 50 ? 'Terminé' : project.progress >= 40 ? 'En cours' : 'En attente', '', project.progress >= 50 ? '✓' : project.progress >= 40 ? '⏳' : '⌛'],
                ['75% d\'Avancement', '75%', project.progress >= 75 ? 'Terminé' : project.progress >= 65 ? 'En cours' : 'En attente', '', project.progress >= 75 ? '✓' : project.progress >= 65 ? '⏳' : '⌛'],
                ['Finalisation', '100%', project.progress >= 100 ? 'Terminé' : project.progress >= 90 ? 'En cours' : 'En attente', project.endDate ? format(new Date(project.endDate), 'dd/MM/yyyy') : 'Non défini', project.progress >= 100 ? '✓' : project.progress >= 90 ? '⏳' : '⌛']
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
              value={`${evmMetrics.plannedValue.toLocaleString('fr-FR')} MRU`}
              color="#3b82f6"
            />
            <PDFMetricCard
              title="Valeur Acquise (EV)"
              value={`${evmMetrics.earnedValue.toLocaleString('fr-FR')} MRU`}
              color="#10b981"
            />
            <PDFMetricCard
              title="Coût Réel (AC)"
              value={`${evmMetrics.actualCost.toLocaleString('fr-FR')} MRU`}
              color="#ef4444"
            />
            <PDFMetricCard
              title="SPI"
              value={evmMetrics.schedulePerformanceIndex.toFixed(2)}
              color="#8b5cf6"
            />
          </PDFRow>
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Écart de délai (SV)" value={`${evmMetrics.scheduleVariance.toLocaleString('fr-FR')} MRU`} />
                <PDFText label="Écart de coût (CV)" value={`${evmMetrics.costVariance.toLocaleString('fr-FR')} MRU`} />
                <PDFText label="Indice de performance coût (CPI)" value={evmMetrics.costPerformanceIndex.toFixed(2)} />
              </PDFCol>
              <PDFCol>
                <PDFText label="Budget à l'achèvement (BAC)" value={`${evmMetrics.budgetAtCompletion.toLocaleString('fr-FR')} MRU`} />
                <PDFText label="Estimation à l'achèvement (EAC)" value={`${evmMetrics.estimateAtCompletion.toLocaleString('fr-FR')} MRU`} />
                <PDFText label="Estimation pour terminer (ETC)" value={`${evmMetrics.estimateToComplete.toLocaleString('fr-FR')} MRU`} />
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
                  label="Durée totale estimée" 
                  value={`${pertAnalysis.totalExpectedDuration?.toFixed(1) || '0.0'} jours`} 
                />
                <PDFText 
                  label="Écart-type total" 
                  value={`${totalStandardDeviation?.toFixed(2)} jours`} 
                />
              </PDFCol>
            </PDFRow>
          </PDFCard>
          {pertAnalysis.activities && pertAnalysis.activities.length > 0 && (
            <PDFTable
              headers={['Activité', 'Optimiste (j)', 'Probable (j)', 'Pessimiste (j)', 'Estimation PERT (j)', 'Écart-type']}
              data={pertAnalysis.activities.map((activity: any) => [
                activity.name || 'Activité sans nom',
                activity.optimistic?.toString() || '0',
                activity.mostLikely?.toString() || '0',
                activity.pessimistic?.toString() || '0',
                activity.pertEstimate?.toFixed(1) || '0.0',
                activity.standardDeviation?.toFixed(2) || '0.00'
              ])}
              columnWidths={['25%', '12%', '12%', '12%', '15%', '12%']}
            />
          )}
        </PDFSection>
      )}

      {/* Diagramme de Gantt — vue tabulaire phases sur timeline */}
      {reportConfig.includeSections.ganttChart && enrichedData?.phases && enrichedData.phases.length > 0 && (
        <PDFSection title="Diagramme de Gantt" borderColor="#0891b2">
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
                duration.toString(),
                `${Math.round(p.progress ?? 0)}%`,
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
              b.amount != null ? `${Number(b.amount).toLocaleString('fr-FR')} ${(project as any).currency || 'MRU'}` : '—',
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