import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDocument, PDFSection, PDFCard, PDFRow, PDFCol, PDFText, PDFTable, PDFMetricCard } from './PDFDocument';
import { ProjectData } from '@/types/project';
import { ReportData, CostCalculation } from '@/services/reportingService';
import { EVMMetrics, PERTAnalysis } from '@/utils/reportCalculations';

interface ProjectPDFDocumentProps {
  project: ProjectData;
  reportData: ReportData;
  costCalculation: CostCalculation;
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
    };
    notes?: string;
  };
}

export function ProjectPDFDocument({
  project,
  reportData,
  costCalculation,
  evmMetrics,
  pertAnalysis,
  reportConfig
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
              value={project.budget ? `${project.budget.toLocaleString('fr-FR')} MRU` : 'Non défini'}
              color="#10b981"
            />
            <PDFMetricCard
              title="Coût Estimé"
              value={`${costCalculation.estimatedCost.toLocaleString('fr-FR')} MRU`}
              color="#f59e0b"
            />
            <PDFMetricCard
              title="Coût Réel"
              value={`${costCalculation.actualCost.toLocaleString('fr-FR')} MRU`}
              color="#ef4444"
            />
            <PDFMetricCard
              title="Écart"
              value={`${(costCalculation.actualCost - costCalculation.estimatedCost).toLocaleString('fr-FR')} MRU`}
              color="#8b5cf6"
            />
          </PDFRow>
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Coût Matériaux" value={`${costCalculation.materialCost.toLocaleString('fr-FR')} MRU`} />
                <PDFText label="Coût Main-d'œuvre" value={`${costCalculation.laborCost.toLocaleString('fr-FR')} MRU`} />
              </PDFCol>
              <PDFCol>
                <PDFText label="Pourcentage Matériaux" value={`${((costCalculation.materialCost / costCalculation.actualCost) * 100).toFixed(1)}%`} />
                <PDFText label="Pourcentage Main-d'œuvre" value={`${((costCalculation.laborCost / costCalculation.actualCost) * 100).toFixed(1)}%`} />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

      {/* Matériaux */}
      {reportConfig.includeSections.materials && reportData.materials && reportData.materials.length > 0 && (
        <PDFSection title="Matériaux" borderColor="#8b5cf6">
          <PDFTable
            headers={['Nom', 'Quantité', 'Unité', 'Prix unitaire', 'Total']}
            data={reportData.materials.map(m => [
              m.materials?.name || m.name || '',
              m.quantity?.toString() || '0',
              m.materials?.unit || m.unit || '',
              m.materials?.price_per_unit ? `${m.materials.price_per_unit.toLocaleString('fr-FR')} MRU` : '',
              ((m.materials?.price_per_unit || 0) * (m.quantity || 0)).toLocaleString('fr-FR') + ' MRU'
            ])}
            columnWidths={['25%', '15%', '15%', '20%', '25%']}
          />
        </PDFSection>
      )}

      {/* Phases */}
      {reportConfig.includeSections.phases && reportData.phases && reportData.phases.length > 0 && (
        <PDFSection title="Phases du Projet" borderColor="#f59e0b">
          <PDFTable
            headers={['Phase', 'Statut', 'Coût estimé', 'Coût réel', 'Écart']}
            data={reportData.phases.map(p => [
              p.title || p.name || '',
              p.status || 'Non défini',
              p.estimated_cost ? `${p.estimated_cost.toLocaleString('fr-FR')} MRU` : '0 MRU',
              p.actual_cost ? `${p.actual_cost.toLocaleString('fr-FR')} MRU` : '0 MRU',
              ((p.actual_cost || 0) - (p.estimated_cost || 0)).toLocaleString('fr-FR') + ' MRU'
            ])}
            columnWidths={['25%', '15%', '20%', '20%', '20%']}
          />
        </PDFSection>
      )}

      {/* Inspections */}
      {reportConfig.includeSections.inspections && reportData.inspections && reportData.inspections.length > 0 && (
        <PDFSection title="Inspections" borderColor="#dc2626">
          <PDFTable
            headers={['Date', 'Type', 'Statut', 'Inspecteur', 'Commentaires']}
            data={reportData.inspections.map(i => [
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
      {reportConfig.includeSections.bankGuarantees && reportData.bankGuarantees && reportData.bankGuarantees.length > 0 && (
        <PDFSection title="Garanties Bancaires" borderColor="#059669">
          <PDFTable
            headers={['Type', 'Banque', 'Montant', 'Date d\'émission', 'Date d\'expiration', 'Statut']}
            data={reportData.bankGuarantees.map(bg => [
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
      {reportConfig.includeSections.insurance && reportData.insurance && reportData.insurance.length > 0 && (
        <PDFSection title="Assurances" borderColor="#7c3aed">
          <PDFTable
            headers={['Compagnie', 'Type de couverture', 'Montant', 'Valide du', 'Valide jusqu\'au', 'Statut']}
            data={reportData.insurance.map(ins => [
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
                <PDFText label="Durée totale estimée" value={`${pertAnalysis.totalDuration.toFixed(1)} jours`} />
                <PDFText label="Écart-type total" value={`${pertAnalysis.totalStandardDeviation.toFixed(2)} jours`} />
              </PDFCol>
            </PDFRow>
          </PDFCard>
          <PDFTable
            headers={['Activité', 'Optimiste (j)', 'Probable (j)', 'Pessimiste (j)', 'Estimation PERT (j)', 'Écart-type']}
            data={pertAnalysis.activities.map(activity => [
              activity.name,
              activity.optimistic.toString(),
              activity.mostLikely.toString(),
              activity.pessimistic.toString(),
              activity.pertEstimate.toFixed(1),
              activity.standardDeviation.toFixed(2)
            ])}
            columnWidths={['25%', '12%', '12%', '12%', '15%', '12%']}
          />
        </PDFSection>
      )}

      {/* Notes additionnelles */}
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