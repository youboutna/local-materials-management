import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDocument, PDFSection, PDFCard, PDFRow, PDFCol, PDFText, PDFTable, PDFMetricCard } from './PDFDocument';
import { ProjectData } from '@/types/project';
import { ReportData, CostCalculation } from '@/services/reportingService';
import { EVMMetrics, PERTAnalysis } from '@/utils/reportCalculations';
import { ProjectReportDTO } from '@/types/reportTypes';

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
  enrichedData?: ProjectReportDTO;
}

export function ProjectPDFDocument({
  project,
  reportData,
  costCalculation,
  evmMetrics,
  pertAnalysis,
  reportConfig,
  enrichedData
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
              p.title || p.title || '',
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

      {/* Blocages de paiements */}
      {reportConfig.includeSections.paymentBlocks && reportData.paymentBlocks && reportData.paymentBlocks.length > 0 && (
        <PDFSection title="Blocages de Paiements" borderColor="#dc2626">
          <PDFTable
            headers={['Montant bloqué', 'Raisons', 'Date de blocage', 'Bloqué par', 'Date de résolution', 'Statut']}
            data={reportData.paymentBlocks.map(pb => [
              pb.amount ? `${pb.amount.toLocaleString('fr-FR')} MRU` : '',
              pb.blocking_reasons ? (Array.isArray(pb.blocking_reasons) ? pb.blocking_reasons.join(', ') : pb.blocking_reasons) : '',
              pb.blocked_at ? format(new Date(pb.blocked_at), 'dd/MM/yyyy') : '',
              pb.blocked_by || '',
              pb.resolved_at ? format(new Date(pb.resolved_at), 'dd/MM/yyyy') : 'Non résolu',
              pb.resolved_at ? 'Résolu' : 'Actif'
            ])}
            columnWidths={['15%', '25%', '15%', '15%', '15%', '15%']}
          />
        </PDFSection>
      )}

      {/* Fournisseurs */}
      {reportConfig.includeSections.suppliers && reportData.suppliers && reportData.suppliers.length > 0 && (
        <PDFSection title="Fournisseurs" borderColor="#8b5cf6">
          <PDFTable
            headers={['Nom', 'Contact', 'Email', 'Téléphone', 'Type', 'Statut']}
            data={reportData.suppliers.map(supplier => [
              supplier.name || '',
              supplier.contact_person || '',
              supplier.email || '',
              supplier.phone || '',
              supplier.supplier_type || '',
              supplier.status || 'Actif'
            ])}
            columnWidths={['20%', '15%', '20%', '15%', '15%', '15%']}
          />
        </PDFSection>
      )}

      {/* Documents */}
      {reportConfig.includeSections.documents && reportData.documents && reportData.documents.length > 0 && (
        <PDFSection title="Documents" borderColor="#059669">
          <PDFTable
            headers={['Titre', 'Type', 'Date de création', 'Uploadé par', 'Taille', 'Statut']}
            data={reportData.documents.map(doc => [
              doc.title || '',
              doc.document_type || '',
              doc.created_at ? format(new Date(doc.created_at), 'dd/MM/yyyy') : '',
              doc.uploaded_by || '',
              doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '',
              doc.status || 'Actif'
            ])}
            columnWidths={['25%', '15%', '15%', '15%', '15%', '15%']}
          />
        </PDFSection>
      )}

      {/* Employés */}
      {reportConfig.includeSections.employees && reportData.employees && reportData.employees.length > 0 && (
        <PDFSection title="Employés" borderColor="#f59e0b">
          <PDFTable
            headers={['Nom', 'Poste', 'Département', 'Taux journalier', 'Jours travaillés', 'Coût total']}
            data={reportData.employees.map(emp => [
              emp.employees?.full_name || '',
              emp.employees?.position || '',
              emp.employees?.department || '',
              emp.daily_rate ? `${emp.daily_rate.toLocaleString('fr-FR')} MRU` : '',
              emp.days_worked?.toString() || '0',
              emp.daily_rate && emp.days_worked ? `${(emp.daily_rate * emp.days_worked).toLocaleString('fr-FR')} MRU` : ''
            ])}
            columnWidths={['20%', '15%', '15%', '15%', '15%', '20%']}
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
              value={`${((evmMetrics.actualCost / evmMetrics.budgetAtCompletion - 1) * 100).toFixed(1)}%`}
              color={evmMetrics.actualCost <= evmMetrics.budgetAtCompletion ? "#10b981" : "#ef4444"}
            />
            <PDFMetricCard
              title="Progression"
              value={`${((evmMetrics.earnedValue / evmMetrics.budgetAtCompletion) * 100).toFixed(1)}%`}
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
        </PDFSection>
      )}

      {/* Diagramme de Gantt */}
      {reportConfig.includeSections.ganttChart && reportData && reportData.phases && (
        <PDFSection title="Diagramme de Gantt" borderColor="#3b82f6">
          <PDFCard>
            <PDFText label="Section" value="Phases du Projet" />
            <PDFTable
              headers={['Phase', 'Début', 'Fin', 'Progression', 'Statut']}
              data={reportData.phases.map(phase => [
                phase.name || 'Sans nom',
                phase.startDate ? format(new Date(phase.startDate), 'dd/MM/yyyy') : 'Non défini',
                phase.endDate ? format(new Date(phase.endDate), 'dd/MM/yyyy') : 'Non défini',
                `${phase.progress || 0}%`,
                (phase.progress || 0) >= 100 ? '✅ Terminée' : (phase.progress || 0) > 0 ? '🔄 En cours' : '⏳ En attente'
              ])}
              columnWidths={['30%', '15%', '15%', '15%', '25%']}
            />
            
            {/* Jalons/Milestones */}
            {reportData.constructionMilestones && reportData.constructionMilestones.length > 0 && (
              <>
                <PDFText label="Section" value="Jalons du Projet" />
                <PDFTable
                  headers={['Jalon', 'Date Cible', 'Statut']}
                  data={reportData.constructionMilestones.map(milestone => [
                    `📍 ${milestone.title || 'Jalon sans titre'}`,
                    milestone.targetDate ? format(new Date(milestone.targetDate), 'dd/MM/yyyy') : 'Date à définir',
                    milestone.isCompleted ? '✅ Terminé' : '⏳ En attente'
                  ])}
                  columnWidths={['50%', '25%', '25%']}
                />
              </>
            )}
          </PDFCard>
        </PDFSection>
      )}

      {/* Alertes d'escalade */}
      {reportConfig.includeSections.escalationAlerts && reportData.escalationAlerts && reportData.escalationAlerts.length > 0 && (
        <PDFSection title="Alertes d'Escalade" borderColor="#ef4444">
          <PDFTable
            headers={['Type', 'Titre', 'Message', 'Date', 'Statut', 'Destinataire']}
            data={reportData.escalationAlerts.map(alert => [
              alert.type || '',
              alert.title || '',
              alert.message?.substring(0, 50) + (alert.message?.length > 50 ? '...' : '') || '',
              alert.created_at ? format(new Date(alert.created_at), 'dd/MM/yyyy') : '',
              alert.read ? 'Lu' : 'Non lu',
              alert.recipient_id || ''
            ])}
            columnWidths={['15%', '20%', '25%', '15%', '15%', '10%']}
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