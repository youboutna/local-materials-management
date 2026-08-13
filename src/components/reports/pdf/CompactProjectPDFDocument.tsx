import {
  ALL_REPORT_SECTIONS,
  getSectionDisplay,
  getSectionMaxRows,
  type ReportProfile,
  type ReportSectionKey,
} from '@/config/referentials/reports/report-profiles.referential';

import { ProjectDTO, ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { ProjectReportDTO } from '@/dtos/entities/ProjectReportDTO';
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProjectMiniMap } from './ProjectMiniMap';


// Local types for PDF rendering
type EVMMetrics = Record<string, any>;
type PERTAnalysis = Record<string, any>;

// Local type for PDF rendering - compatible with both ProjectDTO and ProjectData
type ProjectData = ProjectDTO & {
  resources?: Array<{ type?: string; name?: string }>;
  contacts?: Array<{ role?: string; name?: string }>;
  stakeholders?: Array<{ role?: string; organization?: string }>;
};

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
  mapWater: '#dbeafe',
  mapLand: '#f8fafc',
  mapStreet: '#e5e7eb',
  mapMajorStreet: '#d1d5db',
  mapBuilding: '#f3f4f6',
  mapBorder: '#93c5fd',
  mapPin: '#dc2626',
  mapPark: '#dcfce7',
  mapText: '#4b5563',
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 8,
    backgroundColor: colors.white,
  },
  // Company Header styles
  companyHeader: {
    borderBottomWidth: 3,
    borderBottomColor: '#2563eb',
    paddingBottom: 5,
    marginBottom: 5,
    pageBreakInside: 'avoid',
  },
  companyHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    color: '#2563eb',
    fontSize: 12,
    marginBottom:5 ,
    fontWeight: 'bold',
  },
  companyDetail: {
    marginVertical: 2,
    fontSize: 12,
    color: '#666666',
  },
  companyLogo: {
    maxHeight: 20,
    maxWidth: 50,
  },
  // Report Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
  },
  headerDate: {
    fontSize: 9,
    color: colors.muted,
  },
  // Mini map styles - Updated for street map
  mapContainer: {
    width: 100,
    height: 60,
    borderWidth: 1,
    borderColor: colors.mapBorder,
    borderRadius: 4,
    backgroundColor: colors.mapLand,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    overflow: 'hidden',
  },
  mapContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  // Street map elements
  streetHorizontal: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.mapStreet,
  },
  streetVertical: {
    position: 'absolute',
    width: 2,
    backgroundColor: colors.mapStreet,
  },
  majorStreetHorizontal: {
    position: 'absolute',
    height: 3,
    backgroundColor: colors.mapMajorStreet,
  },
  majorStreetVertical: {
    position: 'absolute',
    width: 3,
    backgroundColor: colors.mapMajorStreet,
  },
  building: {
    position: 'absolute',
    backgroundColor: colors.mapBuilding,
    borderWidth: 0.5,
    borderColor: colors.mapBorder,
  },
  park: {
    position: 'absolute',
    backgroundColor: colors.mapPark,
    borderWidth: 0.5,
    borderColor: colors.success,
  },
  water: {
    position: 'absolute',
    backgroundColor: colors.mapWater,
  },
  mapPin: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mapPin,
    borderWidth: 1,
    borderColor: colors.white,
    zIndex: 10,
  },
  mapLabel: {
    fontSize: 5,
    color: colors.mapText,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  mapCoordinates: {
    fontSize: 4,
    color: colors.muted,
    textAlign: 'center',
  },
  noMap: {
    fontSize: 6,
    color: colors.muted,
    textAlign: 'center',
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
  // EVM/KPI Section styles
  evmGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  evmItem: {
    width: '23%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: colors.light,
    borderRadius: 2,
  },
  evmLabel: {
    fontSize: 5,
    color: colors.muted,
  },
  evmValue: {
    fontSize: 6,
    fontWeight: 'bold',
    color: colors.dark,
  },
  kpiSection: {
    marginTop: 6,
    padding: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  kpiItem: {
    width: '22%',
    alignItems: 'center',
    padding: 4,
    backgroundColor: colors.white,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 5,
    color: colors.muted,
    textAlign: 'center',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    fontSize: 6,
  },
  // Ligne de synthèse (densité `line` du référentiel)
  synthLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: colors.light,
    borderRadius: 2,
    marginBottom: 4,
  },
  synthItem: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  synthLabel: {
    fontSize: 6,
    color: colors.muted,
  },
  synthValue: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.dark,
  },
  // Micro-Gantt
  ganttWrapper: {
    marginBottom: 4,
  },
  ganttRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ganttLabel: {
    width: '26%',
    fontSize: 5,
    color: colors.muted,
  },
  ganttTrack: {
    flex: 1,
    height: 5,
    backgroundColor: colors.light,
    borderRadius: 2,
    position: 'relative',
  },
  ganttBar: {
    position: 'absolute',
    height: 5,
    borderRadius: 2,
    backgroundColor: colors.secondary,
  },
  ganttToday: {
    position: 'absolute',
    width: 1,
    height: 5,
    backgroundColor: colors.danger,
  },
  ganttAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 1,
  },
  ganttAxisText: {
    fontSize: 5,
    color: colors.muted,
  },
});


interface CompactProjectPDFDocumentProps {
  projects: ProjectData[];
  reportTitle?: string;
  enrichedDataMap?: Map<string, ProjectDetailDTO>;
  evmMetricsMap?: Map<string, EVMMetrics>;
  pertAnalysisMap?: Map<string, PERTAnalysis>;
  includeCompanyHeader?: boolean;
  /** Sections activées (référentiel `report-profiles`). Absent = toutes. */
  sections?: Partial<Record<ReportSectionKey, boolean>>;
  /** Profil de rapport : pilote la densité des sections via le référentiel. */
  profile?: ReportProfile;
  /** Nom/code de l'organisation propriétaire (active le référentiel DGEER). */
  organizationName?: string;
  organizationCode?: string;
  company?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

export function CompactProjectPDFDocument({
  projects,
  reportTitle = 'Rapport des Projets',
  enrichedDataMap,
  evmMetricsMap,
  pertAnalysisMap,
  includeCompanyHeader = true,
  sections,
  profile = 'summary',
  organizationName,
  organizationCode,
  company,
}: CompactProjectPDFDocumentProps) {
  const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: fr });

  // Densités pilotées par le référentiel (aucune règle de mise en page en dur).
  const expensesMaxRows = getSectionMaxRows(profile, 'financial', 3);
  const risksMaxRows = getSectionMaxRows(profile, 'risks', 3);
  const pertDensity = getSectionDisplay(profile, 'pertAnalysis').density;
  const milestonesDensity = getSectionDisplay(profile, 'milestones').density;


  // Sections actives : par défaut toutes (aucune régression si le prop est absent).
  const activeSections = ALL_REPORT_SECTIONS.reduce((acc, key) => {
    acc[key] = sections ? sections[key] === true : true;
    return acc;
  }, {} as Record<ReportSectionKey, boolean>);


  // Default company information
  const defaultCompany = {
    name: 'Direction de lelectricite MPE',
    address: 'Avenue Gamal Abdel Nasser, BP 355, Nouakchott, Mauritanie',
    phone: '+222 45 25 25 25',
    email: 'contact@energy.mr',
    logo: undefined
  };

  const companyInfo = company || defaultCompany;


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
      return `${(budget / 1000000000).toFixed(2)} Md MRU`;
    }
    if (budget >= 1000000) {
      return `${(budget / 1000000).toFixed(2)} M MRU`;
    }
    return `${budget.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MRU`;
  };

  const formatDecimal = (value: number) => {
    return value.toFixed(2);
  };

  const getPerformanceColor = (value: number, isIndex: boolean = false) => {
    if (isIndex) {
      if (value >= 1) return colors.success;
      if (value >= 0.9) return colors.warning;
      return colors.danger;
    }
    if (value >= 0) return colors.success;
    return colors.danger;
  };

  const getGlobalStatus = (spi: number, cpi: number) => {
    if (spi >= 1 && cpi >= 1) return { text: 'Excellent', color: colors.success };
    if (spi >= 0.9 && cpi >= 0.9) return { text: 'Bon', color: '#22c55e' };
    if (spi >= 0.8 && cpi >= 0.8) return { text: 'Attention', color: colors.warning };
    return { text: 'Critique', color: colors.danger };
  };

  const getTrendIcon = (spi: number, cpi: number) => {
    const avg = (spi + cpi) / 2;
    if (avg >= 1) return '↑ Positive';
    if (avg >= 0.9) return '→ Stable';
    return '↓ Négative';
  };

  const getCurrentPhase = (phases: any[]) => {
    if (!phases || phases.length === 0) return 'Aucune phase';
    const phaseLabel = (p: any, idx: number) =>
      p?.title || p?.name || p?.phase_name || `Phase ${idx + 1}`;
    // 1) En cours
    const inProgressIdx = phases.findIndex((p: any) => p?.status === 'in_progress');
    if (inProgressIdx >= 0) {
      return `Phase ${inProgressIdx + 1}/${phases.length} - ${phaseLabel(phases[inProgressIdx], inProgressIdx)}`;
    }
    // 2) Toutes terminées
    const completed = phases.filter((p: any) => p?.status === 'completed').length;
    if (completed === phases.length) {
      const last = phases[phases.length - 1];
      return `Terminé (${completed}/${phases.length}) - ${phaseLabel(last, phases.length - 1)}`;
    }
    // 3) Sinon : prochaine phase planifiée (1ère non terminée)
    const nextIdx = phases.findIndex((p: any) => p?.status !== 'completed');
    const idx = nextIdx >= 0 ? nextIdx : 0;
    return `Phase ${idx + 1}/${phases.length} - ${phaseLabel(phases[idx], idx)} (Planifiée)`;
  };

  // Helper function to get PERT expected duration safely
  const getPertExpectedDuration = (pert: any): number => {
    if (!pert) return 0;
    return pert.totalExpectedDuration || pert.expectedDuration || 0;
  };

  // Helper function to get PERT total variance safely
  const getPertTotalVariance = (pert: any): number => {
    if (!pert) return 0;
    if (typeof pert.variance === 'number') return pert.variance;
    if (pert.variances && typeof pert.variances === 'object') {
      return Object.values(pert.variances as Record<string, number>).reduce((sum: number, v: number) => sum + (v || 0), 0);
    }
    return 0;
  };

  // --- Jalons : synthèse « ligne » (prochain jalon, atteints, en retard) ---
  const getMilestoneSummary = (milestones: any[]) => {
    const list = Array.isArray(milestones) ? milestones : [];
    const isDone = (m: any) =>
      ['completed', 'achieved', 'atteint', 'validated'].includes(String(m?.status ?? '').toLowerCase());
    const dateOf = (m: any) => {
      const raw = m?.targetDate || m?.target_date || m?.dueDate;
      const d = raw ? new Date(raw) : null;
      return d && !Number.isNaN(d.getTime()) ? d : null;
    };
    const now = new Date();
    const done = list.filter(isDone).length;
    const late = list.filter((m) => {
      const d = dateOf(m);
      return !isDone(m) && d !== null && d < now;
    }).length;
    const upcoming = list
      .filter((m) => !isDone(m) && dateOf(m) !== null && (dateOf(m) as Date) >= now)
      .sort((a, b) => (dateOf(a) as Date).getTime() - (dateOf(b) as Date).getTime())[0];
    return {
      total: list.length,
      done,
      late,
      nextLabel: upcoming ? String(upcoming.title || upcoming.name || 'Jalon') : null,
      nextDate: upcoming ? format(dateOf(upcoming) as Date, 'dd/MM/yy') : null,
    };
  };

  // --- Micro-Gantt : barres de phases normalisées sur la fenêtre projet ---
  const getGanttBars = (project: ProjectData, phaseList: any[], maxBars = 5) => {
    const parse = (raw: any): Date | null => {
      const d = raw ? new Date(raw) : null;
      return d && !Number.isNaN(d.getTime()) ? d : null;
    };
    const items = (Array.isArray(phaseList) ? phaseList : [])
      .map((p: any, idx: number) => ({
        label: String(p?.title || p?.name || p?.phase_name || `Phase ${idx + 1}`),
        start: parse(p?.startDate ?? p?.start_date ?? p?.plannedStartDate),
        end: parse(p?.endDate ?? p?.end_date ?? p?.plannedEndDate),
        status: String(p?.status ?? ''),
      }))
      .filter((p) => p.start && p.end) as Array<{ label: string; start: Date; end: Date; status: string }>;

    if (items.length === 0) return null;

    const projStart = parse(project.startDate) ?? items[0].start;
    const projEnd = parse(project.endDate) ?? items[items.length - 1].end;
    const min = Math.min(projStart.getTime(), ...items.map((i) => i.start.getTime()));
    const max = Math.max(projEnd.getTime(), ...items.map((i) => i.end.getTime()));
    const span = Math.max(max - min, 1);
    const pct = (t: number) => Math.min(100, Math.max(0, ((t - min) / span) * 100));

    return {
      start: format(new Date(min), 'dd/MM/yy'),
      end: format(new Date(max), 'dd/MM/yy'),
      todayLeft: pct(Date.now()),
      bars: items.slice(0, maxBars).map((i) => ({
        label: i.label.length > 18 ? `${i.label.substring(0, 18)}…` : i.label,
        left: pct(i.start.getTime()),
        width: Math.max(2, pct(i.end.getTime()) - pct(i.start.getTime())),
        color:
          i.status === 'completed'
            ? colors.success
            : i.status === 'in_progress'
              ? colors.secondary
              : colors.mapMajorStreet,
      })),
    };
  };

  // Miniature SIG réelle (coordonnées + zones d'intervention persistées)

  const renderStreetMap = (project: ProjectData) => (
    <ProjectMiniMap
      project={{
        location: project.location,
        latitude: (project as any).latitude,
        longitude: (project as any).longitude,
        coordinates: project.coordinates,
        interventionZones: (project as any).interventionZones,
      }}
    />
  );

  // Company Header Component
  const CompanyHeader = () => (
    <View style={styles.companyHeader}>
      <View style={styles.companyHeaderContent}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{companyInfo.name}</Text>
          <Text style={styles.companyDetail}>{companyInfo.address}</Text>
          <Text style={styles.companyDetail}>Tél: {companyInfo.phone}</Text>
          <Text style={styles.companyDetail}>Email: {companyInfo.email}</Text>
        </View>
        {companyInfo.logo ? (
          <Image 
            src={companyInfo.logo} 
            style={styles.companyLogo} 
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <Document>
      {projects.map((project, index) => {
        const enrichedData = enrichedDataMap?.get(project.id);
        const evmMetrics = evmMetricsMap?.get(project.id);
        const pertAnalysis = pertAnalysisMap?.get(project.id);
        
        const phases = enrichedData?.plannedPhases || [];
        const risks = enrichedData?.risks || [];
        const expenses = enrichedData?.expenses || [];
        const milestoneSummary = getMilestoneSummary((enrichedData as any)?.milestones || []);
        const gantt = getGanttBars(project, phases);




        return (
          <Page key={project.id} size="A4" style={styles.page}>
            {/* Company Header - Conditionally rendered */}
            {includeCompanyHeader && <CompanyHeader />}

            {/* Report Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>{reportTitle} - Généré le {currentDate}</Text>
              </View>
              {/* Mini map preview: top-right header */}
              {renderStreetMap(project)}
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
                Progression: {formatDecimal(project.progress || 0)}% | Équipe: {Array.isArray(project.resources) ? project.resources.filter((r: any) => r.type === 'human').length : 0} personnes
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
                        {Array.isArray(project.contacts) ? (project.contacts.find((c: any) => c.role === 'contractor')?.name || project.contacts[0]?.name || 'Non défini') : 'Non défini'}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 6, color: colors.muted }}>Source de financement</Text>
                      <Text style={{ fontSize: 7, color: colors.dark }}>
                        {Array.isArray(project.stakeholders) ? (project.stakeholders.find((s: any) => s.role === 'bailleur')?.organization || 'Non définie') : 'Non définie'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Dépenses Engagées */}
                {activeSections.financial && (
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
                          {(phase.title || phase.name || `Phase ${idx + 1}`).toString().substring(0, 20)}
                        </Text>
                        <Text style={[styles.tableCell, { width: '25%' }]}>
                          {formatBudget(phase.actualCost || 0)}
                        </Text>
                        <Text style={[styles.tableCell, { width: '15%' }]}>
                          {phase.budget ? formatDecimal(((phase.actualCost || 0) / phase.budget) * 100) : '0.00'}%
                        </Text>
                        <Text style={[styles.tableCell, { width: '25%' }]}>
                          {Array.isArray(project.contacts) ? (project.contacts.find((c: any) => c.role === 'contractor')?.name?.substring(0, 15) || project.contacts[0]?.name?.substring(0, 15) || '-') : '-'}
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
                )}

              </View>

              {/* Right Column */}
              <View style={styles.column}>
                {/* Risques Identifiés */}
                {activeSections.risks && (
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
                )}

                {/* Conformité & Validation — indicateurs issus des données réelles */}
                {(activeSections.inspections || activeSections.documents) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Conformité &amp; Validation</Text>
                  {(() => {
                    const inspectionsList = Array.isArray((enrichedData as any)?.inspections)
                      ? (enrichedData as any).inspections
                      : [];
                    const documentsList = Array.isArray((enrichedData as any)?.documents)
                      ? (enrichedData as any).documents
                      : [];
                    const approvedDocs = documentsList.filter((d: any) =>
                      ['approved', 'validated', 'approuve'].includes(String(d?.status ?? '').toLowerCase()),
                    ).length;
                    const compliantInspections = inspectionsList.filter((i: any) =>
                      ['completed', 'compliant', 'conforme', 'validated'].includes(
                        String(i?.status ?? '').toLowerCase(),
                      ),
                    ).length;
                    const docRate = documentsList.length
                      ? (approvedDocs / documentsList.length) * 100
                      : 0;
                    const inspRate = inspectionsList.length
                      ? (compliantInspections / inspectionsList.length) * 100
                      : 0;
                    const badge = (rate: number, total: number) => {
                      if (total === 0) return { bg: '#f3f4f6', color: colors.muted, label: 'non évalué' };
                      if (rate >= 80) return { bg: '#dcfce7', color: colors.success, label: 'conforme' };
                      if (rate >= 50) return { bg: '#fef9c3', color: colors.warning, label: 'partiel' };
                      return { bg: '#fee2e2', color: colors.danger, label: 'non conforme' };
                    };
                    const docBadge = badge(docRate, documentsList.length);
                    const inspBadge = badge(inspRate, inspectionsList.length);
                    return (
                      <>
                        <View style={styles.conformityGrid}>
                          <View style={styles.conformityItem}>
                            <Text style={styles.conformityLabel}>Documents validés</Text>
                            <View style={[styles.conformityBadge, { backgroundColor: docBadge.bg }]}>
                              <Text style={{ fontSize: 6, color: docBadge.color }}>
                                {docBadge.label} ({formatDecimal(docRate)}%)
                              </Text>
                            </View>
                          </View>
                          <View style={styles.conformityItem}>
                            <Text style={styles.conformityLabel}>Inspections conformes</Text>
                            <View style={[styles.conformityBadge, { backgroundColor: inspBadge.bg }]}>
                              <Text style={{ fontSize: 6, color: inspBadge.color }}>
                                {inspBadge.label} ({formatDecimal(inspRate)}%)
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.conformityGrid}>
                          <View style={styles.conformityItem}>
                            <Text style={styles.conformityLabel}>Inspections</Text>
                            <Text style={[styles.conformityLabel, { fontWeight: 'bold' }]}>
                              {inspectionsList.length}
                            </Text>
                          </View>
                          <View style={styles.conformityItem}>
                            <Text style={styles.conformityLabel}>Documents</Text>
                            <Text style={[styles.conformityLabel, { fontWeight: 'bold' }]}>
                              {documentsList.length}
                            </Text>
                          </View>
                        </View>
                      </>
                    );
                  })()}
                </View>
                )}

              </View>
            </View>

            {/* EVM Section - Analyse Valeur Acquise */}
            {activeSections.evmAnalysis && (
            <View style={styles.section}>

              <Text style={styles.sectionTitle}>Analyse EVM (Earned Value Management)</Text>
              <View style={styles.evmGrid}>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>PV (Valeur Planifiée)</Text>
                  <Text style={styles.evmValue}>{formatBudget(evmMetrics?.plannedValue || 0)}</Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>EV (Valeur Acquise)</Text>
                  <Text style={styles.evmValue}>{formatBudget(evmMetrics?.earnedValue || 0)}</Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>AC (Coût Réel)</Text>
                  <Text style={styles.evmValue}>{formatBudget(evmMetrics?.actualCost || 0)}</Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>SPI</Text>
                  <Text style={[styles.evmValue, { color: getPerformanceColor(evmMetrics?.schedulePerformanceIndex || 0, true) }]}>
                    {formatDecimal(evmMetrics?.schedulePerformanceIndex || 0)}
                  </Text>
                </View>
              </View>
              <View style={styles.evmGrid}>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>SV (Écart délai)</Text>
                  <Text style={[styles.evmValue, { color: getPerformanceColor(evmMetrics?.scheduleVariance || 0) }]}>
                    {formatBudget(evmMetrics?.scheduleVariance || 0)}
                  </Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>CV (Écart coût)</Text>
                  <Text style={[styles.evmValue, { color: getPerformanceColor(evmMetrics?.costVariance || 0) }]}>
                    {formatBudget(evmMetrics?.costVariance || 0)}
                  </Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>CPI</Text>
                  <Text style={[styles.evmValue, { color: getPerformanceColor(evmMetrics?.costPerformanceIndex || 0, true) }]}>
                    {formatDecimal(evmMetrics?.costPerformanceIndex || 0)}
                  </Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>BAC</Text>
                  <Text style={styles.evmValue}>{formatBudget(evmMetrics?.budgetAtCompletion || project.budget || 0)}</Text>
                </View>
              </View>
              <View style={styles.evmGrid}>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>EAC (Est. achèvement)</Text>
                  <Text style={styles.evmValue}>{formatBudget(evmMetrics?.estimateAtCompletion || 0)}</Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>ETC (Est. restant)</Text>
                  <Text style={styles.evmValue}>{formatBudget(evmMetrics?.estimateToComplete || 0)}</Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>VAC (Variance)</Text>
                  <Text style={[styles.evmValue, { color: getPerformanceColor(evmMetrics?.varianceAtCompletion || 0) }]}>
                    {formatBudget(evmMetrics?.varianceAtCompletion || 0)}
                  </Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>Phase actuelle</Text>
                  <Text style={styles.evmValue}>{getCurrentPhase(phases).substring(0, 15)}</Text>
                </View>
              </View>
            </View>
            )}

            {/* KPI Section */}
            {activeSections.kpi && (
            <View style={styles.kpiSection}>

              <Text style={[styles.sectionTitle, { backgroundColor: 'transparent', borderLeftWidth: 0, marginBottom: 6 }]}>
                Indicateurs de Performance (KPI)
              </Text>
              <View style={styles.kpiGrid}>
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiValue, { color: getPerformanceColor(evmMetrics?.schedulePerformanceIndex || 0, true) }]}>
                    {formatDecimal(evmMetrics?.schedulePerformanceIndex || 0)}
                  </Text>
                  <Text style={styles.kpiLabel}>Indice SPI</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiValue, { color: getPerformanceColor(evmMetrics?.costPerformanceIndex || 0, true) }]}>
                    {formatDecimal(evmMetrics?.costPerformanceIndex || 0)}
                  </Text>
                  <Text style={styles.kpiLabel}>Indice CPI</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiValue, { color: getPerformanceColor(evmMetrics?.costVariance || 0) }]}>
                    {formatDecimal(((evmMetrics?.costVariance || 0) / (project.budget || 1)) * 100)}%
                  </Text>
                  <Text style={styles.kpiLabel}>Écart Budget</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiValue, { color: colors.primary }]}>
                    {formatDecimal(project.progress || 0)}%

                  </Text>
                  <Text style={styles.kpiLabel}>Progression</Text>
                </View>
              </View>
              <View style={[styles.kpiGrid, { marginTop: 4 }]}>
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiValue, { color: getPerformanceColor(evmMetrics?.schedulePerformanceIndex || 0, true), fontSize: 8 }]}>
                    {(evmMetrics?.schedulePerformanceIndex || 0) >= 1 ? 'En avance' : (evmMetrics?.schedulePerformanceIndex || 0) >= 0.9 ? 'À temps' : 'En retard'}
                  </Text>
                  <Text style={styles.kpiLabel}>Perf. délai</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiValue, { color: getPerformanceColor(evmMetrics?.costPerformanceIndex || 0, true), fontSize: 8 }]}>
                    {(evmMetrics?.costPerformanceIndex || 0) >= 1 ? 'Sous budget' : (evmMetrics?.costPerformanceIndex || 0) >= 0.9 ? 'Dans budget' : 'Dépassement'}
                  </Text>
                  <Text style={styles.kpiLabel}>Perf. coût</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={[styles.kpiValue, { fontSize: 8 }]}>
                    {getTrendIcon(evmMetrics?.schedulePerformanceIndex || 0, evmMetrics?.costPerformanceIndex || 0)}
                  </Text>
                  <Text style={styles.kpiLabel}>Tendance</Text>
                </View>
                <View style={styles.kpiItem}>
                  <View style={[styles.statusBadge, { backgroundColor: getGlobalStatus(evmMetrics?.schedulePerformanceIndex || 0, evmMetrics?.costPerformanceIndex || 0).color + '20' }]}>
                    <Text style={[styles.kpiValue, { color: getGlobalStatus(evmMetrics?.schedulePerformanceIndex || 0, evmMetrics?.costPerformanceIndex || 0).color, fontSize: 8 }]}>
                      {getGlobalStatus(evmMetrics?.schedulePerformanceIndex || 0, evmMetrics?.costPerformanceIndex || 0).text}
                    </Text>
                  </View>
                  <Text style={styles.kpiLabel}>Statut global</Text>
                </View>
              </View>
            </View>
            )}

            {/* PERT Section */}
            {activeSections.pertAnalysis && (
            <View style={styles.section}>

              <Text style={styles.sectionTitle}>Analyse PERT</Text>
              <View style={styles.evmGrid}>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>Durée attendue</Text>
                  <Text style={styles.evmValue}>
                    {formatDecimal(getPertExpectedDuration(pertAnalysis))} j
                  </Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>Variance totale</Text>
                  <Text style={styles.evmValue}>
                    {formatDecimal(getPertTotalVariance(pertAnalysis))}
                  </Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>Écart-type</Text>
                  <Text style={styles.evmValue}>
                    {formatDecimal(Math.sqrt(getPertTotalVariance(pertAnalysis)))}
                  </Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>Chemin critique</Text>
                  <Text style={styles.evmValue}>
                    {pertAnalysis?.criticalPath?.length || 0} tâches
                  </Text>
                </View>
              </View>
              <View style={styles.evmGrid}>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>Prob. 95%</Text>
                  <Text style={styles.evmValue}>
                    {formatDecimal(getPertExpectedDuration(pertAnalysis) + 1.65 * Math.sqrt(getPertTotalVariance(pertAnalysis)))} j
                  </Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>Prob. 99%</Text>
                  <Text style={styles.evmValue}>
                    {formatDecimal(getPertExpectedDuration(pertAnalysis) + 2.33 * Math.sqrt(getPertTotalVariance(pertAnalysis)))} j
                  </Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>Gantt</Text>
                  <Text style={[styles.evmValue, { color: colors.success }]}>À jour</Text>
                </View>
                <View style={styles.evmItem}>
                  <Text style={styles.evmLabel}>Phase actuelle</Text>
                  <Text style={styles.evmValue}>{getCurrentPhase(phases).substring(0, 12)}</Text>
                </View>
              </View>
            </View>
            )}


            {/* Footer Section */}
            <View style={styles.footerSection}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Phase:</Text>
                <Text style={styles.footerValue}>{getCurrentPhase(phases)}</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Durée PERT:</Text>
                <Text style={[styles.footerValue, { color: getPertExpectedDuration(pertAnalysis) > 0 ? colors.primary : colors.muted }]}>
                  {formatDecimal(getPertExpectedDuration(pertAnalysis))} jours
                </Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Criticité:</Text>
                <Text style={[styles.footerValue, { color: (pertAnalysis?.criticalPath?.length || 0) > 3 ? colors.warning : colors.success }]}>
                  {pertAnalysis?.criticalPath?.length || 0} tâches critiques
                </Text>
              </View>
            </View>

            {/* Suivi & Évaluation : réservé au rapport détaillé — le rapport
                compact reste strictement sur une page (alignement validé). */}




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
  enrichedData?: ProjectDetailDTO;
  evmMetrics?: EVMMetrics;
  pertAnalysis?: PERTAnalysis;
  includeCompanyHeader?: boolean;
  sections?: Partial<Record<ReportSectionKey, boolean>>;
  organizationName?: string;
  organizationCode?: string;
  company?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

export function SingleCompactProjectPDF({
  project,
  reportTitle,
  enrichedData,
  evmMetrics,
  pertAnalysis,
  includeCompanyHeader = true,
  sections,
  organizationName,
  organizationCode,
  company,
}: SingleCompactProjectPDFProps) {
  const enrichedDataMap = new Map<string, ProjectDetailDTO>();
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
      includeCompanyHeader={includeCompanyHeader}
      sections={sections}
      organizationName={organizationName}
      organizationCode={organizationCode}
      company={company}
    />
  );
}
