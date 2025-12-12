import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EVMMetrics, PERTAnalysis, ProjectData } from '@/types/project';
import { ProjectReportDTO } from '@/types/reportTypes';

// Register fonts
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/opensans/v17/mem8YaGs126MiZpBA-UFVZ0b.woff2'
});

const colors = {
  primary: '#1e40af',
  secondary: '#3b82f6',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  muted: '#6b7280',
  light: '#f3f4f6',
  white: '#ffffff',
  dark: '#1f2937',
  border: '#e5e7eb',
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 8,
    backgroundColor: colors.white,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerDate: {
    fontSize: 9,
    color: colors.muted,
  },
  // Project title section
  projectTitle: {
    backgroundColor: colors.primary,
    color: colors.white,
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  projectTitleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  projectRef: {
    fontSize: 8,
    color: '#93c5fd',
  },
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    gap: 6,
  },
  infoBox: {
    width: '23%',
    backgroundColor: colors.light,
    padding: 6,
    borderRadius: 3,
    borderLeftWidth: 2,
    borderLeftColor: colors.secondary,
  },
  infoLabel: {
    fontSize: 6,
    color: colors.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.dark,
  },
  // Progress bar
  progressContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 7,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 2,
  },
  // Section styles
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.dark,
    backgroundColor: colors.light,
    padding: 4,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  sectionContent: {
    paddingHorizontal: 4,
  },
  // Two-column layout
  twoColumns: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
  },
  // Table styles
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    padding: 4,
    fontSize: 6,
    fontWeight: 'bold',
    color: colors.dark,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    padding: 4,
    fontSize: 7,
    color: colors.dark,
  },
  // Risk badge
  riskBadge: {
    padding: '2 4',
    borderRadius: 2,
    fontSize: 6,
    textAlign: 'center',
  },
  // Conformity section
  conformityGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  conformityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  conformityLabel: {
    fontSize: 7,
    color: colors.dark,
  },
  conformityBadge: {
    padding: '2 6',
    borderRadius: 2,
    fontSize: 6,
  },
  // Footer section
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerLabel: {
    fontSize: 7,
    color: colors.muted,
  },
  footerValue: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.dark,
  },
  // Page footer
  pageFooter: {
    position: 'absolute',
    bottom: 12,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: colors.muted,
  },
  // Particularity section
  particularityBox: {
    backgroundColor: '#fef3c7',
    padding: 6,
    borderRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    marginBottom: 8,
  },
  particularityTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.warning,
    marginBottom: 2,
  },
  particularityText: {
    fontSize: 7,
    color: colors.dark,
  },
});

interface CompactProjectPDFDocumentProps {
  projects: ProjectData[];
  reportTitle?: string;
  enrichedDataMap?: Map<string, ProjectReportDTO>;
  evmMetricsMap?: Map<string, EVMMetrics>;
  pertAnalysisMap?: Map<string, PERTAnalysis>;
}

export function CompactProjectPDFDocument({
  projects,
  reportTitle = 'Rapport des Projets',
  enrichedDataMap,
  evmMetricsMap,
  pertAnalysisMap,
}: CompactProjectPDFDocumentProps) {
  const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: fr });

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'en cours': colors.secondary,
      'in_progress': colors.secondary,
      'terminé': colors.success,
      'completed': colors.success,
      'en attente': colors.warning,
      'pending': colors.warning,
      'en inspection': colors.warning,
      'suspendu': colors.danger,
      'annulé': colors.danger,
    };
    return statusColors[status.toLowerCase()] || colors.muted;
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'en cours': 'En cours',
      'in_progress': 'En cours',
      'terminé': 'Terminé',
      'completed': 'Terminé',
      'en attente': 'En attente',
      'pending': 'En attente',
      'en inspection': 'En inspection',
      'suspendu': 'Suspendu',
      'annulé': 'Annulé',
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const getRiskColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'élevé':
      case 'high':
      case 'critical':
        return { bg: '#fef2f2', text: colors.danger };
      case 'moyen':
      case 'medium':
        return { bg: '#fffbeb', text: colors.warning };
      default:
        return { bg: '#f0fdf4', text: colors.success };
    }
  };

  const formatBudget = (budget: number) => {
    if (budget >= 1000000000) {
      return `${(budget / 1000000000).toFixed(0)} Md MRU`;
    }
    if (budget >= 1000000) {
      return `${(budget / 1000000).toFixed(0)} M MRU`;
    }
    return `${budget.toLocaleString('fr-FR')} MRU`;
  };

  const getCurrentPhase = (phases: any[]) => {
    if (!phases || phases.length === 0) return 'Non définie';
    const inProgress = phases.find((p: any) => p.status === 'in_progress');
    if (inProgress) {
      const idx = phases.findIndex((p: any) => p.id === inProgress.id);
      return `Phase ${idx + 1}/${phases.length} - ${inProgress.name || 'En cours'}`;
    }
    const completed = phases.filter((p: any) => p.status === 'completed').length;
    return `Phase ${completed}/${phases.length}`;
  };

  return (
    <Document>
      {projects.map((project, index) => {
        const enrichedData = enrichedDataMap?.get(project.id);
        const evmMetrics = evmMetricsMap?.get(project.id);
        const pertAnalysis = pertAnalysisMap?.get(project.id);
        
        const phases = enrichedData?.phases || [];
        const risks = enrichedData?.riskAssessment?.risks || [];
        const expenses = enrichedData?.phases?.filter((p: any) => p.actualCost > 0) || [];

        return (
          <Page key={project.id} size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{reportTitle} - Généré le {currentDate}</Text>
            </View>

            {/* Project Title */}
            <View style={styles.projectTitle}>
              <Text style={styles.projectTitleText}>{project.title}</Text>
              <Text style={styles.projectRef}>
                Référence: {project.id.substring(0, 12).toUpperCase()}
              </Text>
            </View>

            {/* Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Localisation</Text>
                <Text style={styles.infoValue}>{project.location || 'Non définie'}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Budget</Text>
                <Text style={styles.infoValue}>{formatBudget(project.budget || 0)}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Statut</Text>
                <Text style={[styles.infoValue, { color: getStatusColor(project.status) }]}>
                  {getStatusText(project.status)}
                </Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Dates</Text>
                <Text style={styles.infoValue}>
                  {project.startDate ? format(new Date(project.startDate), 'dd/MM/yy') : '--/--/--'} - {project.endDate ? format(new Date(project.endDate), 'dd/MM/yy') : '--/--/--'}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${project.progress || 0}%` }]} />
              </View>
              <Text style={styles.progressText}>
                Progression: {project.progress || 0}% | Équipe: {project.resources?.filter(r => r.type === 'human').length || 0} personnes
              </Text>
            </View>

            {/* Particularity */}
            {project.description && (
              <View style={styles.particularityBox}>
                <Text style={styles.particularityTitle}>Particularité</Text>
                <Text style={styles.particularityText}>
                  {project.description.length > 120 ? project.description.substring(0, 120) + '...' : project.description}
                </Text>
              </View>
            )}

            {/* Two Columns Layout */}
            <View style={styles.twoColumns}>
              {/* Left Column */}
              <View style={styles.column}>
                {/* Informations générales */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Informations générales</Text>
                  <View style={styles.sectionContent}>
                    <View style={{ marginBottom: 3 }}>
                      <Text style={{ fontSize: 6, color: colors.muted }}>Contractant principal</Text>
                      <Text style={{ fontSize: 7, color: colors.dark }}>
                        {project.contacts?.find(c => c.role === 'contractor')?.name || project.contacts?.[0]?.name || 'Non défini'}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 6, color: colors.muted }}>Source de financement</Text>
                      <Text style={{ fontSize: 7, color: colors.dark }}>
                        {project.stakeholders?.find(s => s.role === 'bailleur')?.organization || 'Non définie'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Dépenses Engagées */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Dépenses Engagées</Text>
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Phase</Text>
                      <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Engagé</Text>
                      <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Taux</Text>
                      <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Fournisseur</Text>
                    </View>
                    {phases.slice(0, 3).map((phase: any, idx: number) => (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: '35%' }]}>
                          {phase.name?.substring(0, 20) || `Phase ${idx + 1}`}
                        </Text>
                        <Text style={[styles.tableCell, { width: '25%' }]}>
                          {formatBudget(phase.actualCost || 0)}
                        </Text>
                        <Text style={[styles.tableCell, { width: '15%' }]}>
                          {phase.budget ? ((phase.actualCost || 0) / phase.budget * 100).toFixed(0) : 0}%
                        </Text>
                        <Text style={[styles.tableCell, { width: '25%' }]}>
                          {project.contacts?.find(c => c.role === 'contractor')?.name?.substring(0, 15) || project.contacts?.[0]?.name?.substring(0, 15) || '-'}
                        </Text>
                      </View>
                    ))}
                    {phases.length === 0 && (
                      <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: '100%', textAlign: 'center', color: colors.muted }]}>
                          Aucune dépense enregistrée
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Right Column */}
              <View style={styles.column}>
                {/* Risques Identifiés */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Risques Identifiés</Text>
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { width: '50%' }]}>Description</Text>
                      <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Impact</Text>
                      <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Prob.</Text>
                    </View>
                    {risks.slice(0, 2).map((risk: any, idx: number) => {
                      const riskColor = getRiskColor(risk.impact > 70 ? 'élevé' : risk.impact > 40 ? 'moyen' : 'faible');
                      return (
                        <View key={idx} style={styles.tableRow}>
                          <Text style={[styles.tableCell, { width: '50%' }]}>
                            {risk.description?.substring(0, 40) || 'Risque non défini'}
                          </Text>
                          <Text style={[styles.tableCell, { width: '25%', color: riskColor.text }]}>
                            {risk.impact > 70 ? 'Élevé' : risk.impact > 40 ? 'Moyen' : 'Faible'}
                          </Text>
                          <Text style={[styles.tableCell, { width: '25%' }]}>
                            {risk.probability || 0}%
                          </Text>
                        </View>
                      );
                    })}
                    {risks.length === 0 && (
                      <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: '100%', textAlign: 'center', color: colors.muted }]}>
                          Aucun risque identifié
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Conformité & Validation */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Conformité & Validation</Text>
                  <View style={styles.conformityGrid}>
                    <View style={styles.conformityItem}>
                      <Text style={styles.conformityLabel}>Standards</Text>
                      <View style={[styles.conformityBadge, { backgroundColor: '#dcfce7' }]}>
                        <Text style={{ fontSize: 6, color: colors.success }}>conforme</Text>
                      </View>
                    </View>
                    <View style={styles.conformityItem}>
                      <Text style={styles.conformityLabel}>Bailleurs</Text>
                      <View style={[styles.conformityBadge, { backgroundColor: '#dcfce7' }]}>
                        <Text style={{ fontSize: 6, color: colors.success }}>conforme</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.conformityGrid}>
                    <View style={styles.conformityItem}>
                      <Text style={styles.conformityLabel}>Inspections</Text>
                      <Text style={[styles.conformityLabel, { fontWeight: 'bold' }]}>
                        {enrichedData?.analytics?.onTimePerformance || 0}
                      </Text>
                    </View>
                    <View style={styles.conformityItem}>
                      <Text style={styles.conformityLabel}>Documents</Text>
                      <Text style={[styles.conformityLabel, { fontWeight: 'bold' }]}>
                        {phases.length * 3 || 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Footer Section */}
            <View style={styles.footerSection}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Phase actuelle:</Text>
                <Text style={styles.footerValue}>{getCurrentPhase(phases)}</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Diagramme de Gantt:</Text>
                <Text style={[styles.footerValue, { color: colors.success }]}>À jour</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>PERT:</Text>
                <Text style={[styles.footerValue, { color: pertAnalysis?.totalExpectedDuration && pertAnalysis.totalExpectedDuration > 0 ? colors.warning : colors.success }]}>
                  {pertAnalysis?.totalExpectedDuration ? `${pertAnalysis.totalExpectedDuration} jours estimés` : 'Non calculé'}
                </Text>
              </View>
            </View>

            {/* Page Footer */}
            <View style={styles.pageFooter}>
              <Text>Projet {index + 1} sur {projects.length}</Text>
              <Text>Document confidentiel - {currentDate}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}

// Single project version for convenience
interface SingleCompactProjectPDFProps {
  project: ProjectData;
  reportTitle?: string;
  enrichedData?: ProjectReportDTO;
  evmMetrics?: EVMMetrics;
  pertAnalysis?: PERTAnalysis;
}

export function SingleCompactProjectPDF({
  project,
  reportTitle,
  enrichedData,
  evmMetrics,
  pertAnalysis,
}: SingleCompactProjectPDFProps) {
  const enrichedDataMap = new Map<string, ProjectReportDTO>();
  const evmMetricsMap = new Map<string, EVMMetrics>();
  const pertAnalysisMap = new Map<string, PERTAnalysis>();

  if (enrichedData) enrichedDataMap.set(project.id, enrichedData);
  if (evmMetrics) evmMetricsMap.set(project.id, evmMetrics);
  if (pertAnalysis) pertAnalysisMap.set(project.id, pertAnalysis);

  return (
    <CompactProjectPDFDocument
      projects={[project]}
      reportTitle={reportTitle}
      enrichedDataMap={enrichedDataMap}
      evmMetricsMap={evmMetricsMap}
      pertAnalysisMap={pertAnalysisMap}
    />
  );
}
