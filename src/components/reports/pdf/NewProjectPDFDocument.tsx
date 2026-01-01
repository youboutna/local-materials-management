import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EVMMetrics, PERTAnalysis, ProjectData } from "@/types/project";
import { ProjectReportDTO } from "@/types/reportTypes";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// Register fonts for better typography
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
  ],
});

// Professional color palette
const colors = {
  primary: "#1e40af",
  primaryLight: "#3b82f6",
  secondary: "#059669",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  dark: "#1f2937",
  medium: "#6b7280",
  light: "#9ca3af",
  border: "#e5e7eb",
  background: "#ffffff",
  backgroundAlt: "#f8fafc",
};

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
    borderBottomStyle: "solid",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontSize: 8,
    color: colors.medium,
    textAlign: "center",
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 8,
  },
  reportSubtitle: {
    fontSize: 11,
    color: colors.medium,
  },
  dateStamp: {
    fontSize: 9,
    color: colors.light,
    textAlign: "right",
  },

  // Project Header
  projectHeader: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 8,
    marginBottom: 25,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 6,
  },
  projectInfo: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 1.5,
  },

  // Section
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.dark,
    backgroundColor: colors.backgroundAlt,
    padding: "10 15",
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderLeftStyle: "solid",
    borderRadius: 4,
  },

  // Cards & Grids
  card: {
    backgroundColor: colors.backgroundAlt,
    padding: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 15,
  },
  gridItem: {
    flex: "1 1 calc(25% - 11.25px)",
    minWidth: "calc(25% - 11.25px)",
  },

  // Metrics
  metricCard: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 8,
    color: colors.medium,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // Tables
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 15,
  },
  tableHeader: {
    backgroundColor: colors.backgroundAlt,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    padding: "10 8",
    fontSize: 9,
    fontWeight: "bold",
    color: colors.dark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowEven: {
    backgroundColor: colors.background,
  },
  tableRowOdd: {
    backgroundColor: colors.backgroundAlt,
  },
  tableCell: {
    padding: "10 8",
    fontSize: 9,
    color: colors.dark,
    flexWrap: "wrap",
    minHeight: 32,
    alignItems: "flex-start",
  },

  // Progress Bar
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.success,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 9,
    color: colors.medium,
    textAlign: "right",
    marginTop: 4,
  },

  // Two columns
  twoColumns: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },
  column: {
    flex: 1,
  },

  // Financial Highlight
  financialHighlight: {
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
    marginBottom: 20,
  },

  // Gantt Chart
  ganttContainer: {
    marginTop: 15,
  },
  ganttItem: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  ganttLabel: {
    width: 120,
    fontSize: 9,
    color: colors.dark,
  },
  ganttBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  ganttBar: {
    height: "100%",
    position: "absolute",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  ganttBarText: {
    fontSize: 7,
    color: "white",
    fontWeight: "bold",
    padding: "0 4",
  },

  // Badge
  badge: {
    padding: "4 8",
    borderRadius: 12,
    fontSize: 8,
    fontWeight: "bold",
  },
  badgeSuccess: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  badgeWarning: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  badgeDanger: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  badgeInfo: {
    backgroundColor: "#dbeafe",
    color: colors.primary,
  },

  // Map Section
  mapContainer: {
    marginTop: 10,
    position: "relative", // For positioning overlay
    minHeight: 250, // Ensure enough space
  },
  mapImage: {
    width: "100%",
    height: 250, // Increased from 180 for better visibility
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    // Add these for better quality:
    objectFit: "cover",
    imageRendering: "auto", // or "crisp-edges" for sharp edges
  },
  coordinatesOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: "4 8",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapNote: {
    marginTop: 4,
    fontSize: 8,
    color: colors.medium,
    textAlign: "center",
  },
  mapLegend: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#f0f9ff",
    borderRadius: 3,
  },
  legendText: {
    fontSize: 7,
    color: "#0369a1",
    textAlign: "center",
  },

  // Text utilities
  textBold: {
    fontWeight: "bold",
  },
  textMuted: {
    color: colors.medium,
  },
  textCenter: {
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
  },

  // Spacing
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb3: { marginBottom: 12 },
  mt1: { marginTop: 4 },
  mt2: { marginTop: 8 },
  mt3: { marginTop: 12 },

  // Layout
  row: {
    flexDirection: "row",
  },
});

// Helper functions
const formatCurrency = (amount: number, currency: string = "MRU") => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)} M ${currency}`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)} k ${currency}`;
  }
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    "en cours": "En cours",
    in_progress: "En cours",
    terminé: "Terminé",
    completed: "Terminé",
    "en attente": "En attente",
    pending: "En attente",
    suspendu: "Suspendu",
    cancelled: "Annulé",
    annulé: "Annulé",
  };
  return statusMap[status.toLowerCase()] || status;
};

const getStatusBadgeStyle = (status: string) => {
  const statusLower = status.toLowerCase();

  if (statusLower.includes("terminé") || statusLower.includes("completed")) {
    return styles.badgeSuccess;
  }
  if (statusLower.includes("en cours") || statusLower.includes("in_progress")) {
    return styles.badgeInfo;
  }
  if (statusLower.includes("en attente") || statusLower.includes("pending")) {
    return styles.badgeWarning;
  }
  if (
    statusLower.includes("suspendu") ||
    statusLower.includes("cancelled") ||
    statusLower.includes("annulé")
  ) {
    return styles.badgeDanger;
  }
  return styles.badgeInfo;
};

const truncateText = (text: string, maxLength: number = 40) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

// Map Section Component
// Map Section Component - UPDATED VERSION
const MapSection = ({ project }: { project: ProjectData }) => {
  const coordinates = project.coordinates;
  
  if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌍 Géolocalisation du Projet</Text>
        <View style={styles.card}>
          <Text style={[styles.textMuted, { textAlign: 'center', padding: 20 }]}>
            Aucune coordonnée GPS disponible pour ce projet.
          </Text>
        </View>
      </View>
    );
  }
  
  const { latitude, longitude } = coordinates;
  
  // Generate high-resolution map URLs
  const getMapUrls = () => {
    // HIGH RESOLUTION OpenStreetMap URL
    const osmUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=12&size=1200x500&scale=2&markers=pin-m+ff0000(${longitude},${latitude})&format=png`;
    
    // Alternative with different styling
    const osmAltUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=13&size=1000x400&markers=pin-l+ff0000(${longitude},${latitude})`;
    
    return [osmUrl, osmAltUrl];
  };
  
  const mapUrls = getMapUrls();
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🌍 Géolocalisation du Projet</Text>
      <View style={styles.card}>
        {/* High-resolution map image */}
        <View style={{ position: 'relative', minHeight: 250 }}>
          <Image 
            src={mapUrls[0]}
            style={styles.mapImage}
          />
          
          {/* Coordinates overlay on map */}
          <View style={{ 
            position: 'absolute', 
            top: 8, 
            left: 8, 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '6 10',
            borderRadius: 4,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', color: colors.primary }}>
              📍 {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
            </Text>
          </View>
        </View>
        
        {/* Enhanced coordinates display */}
        <View style={{ 
          marginTop: 12, 
          padding: 12, 
          backgroundColor: '#f8fafc', 
          borderRadius: 6,
          borderWidth: 1,
          borderColor: '#e5e7eb'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={[styles.textBold, { fontSize: 10, color: colors.primary }]}>
              📍 Position GPS Détails
            </Text>
          </View>
          
          <View style={{ 
            backgroundColor: colors.background, 
            padding: 8, 
            borderRadius: 4,
            marginBottom: 4
          }}>
            <Text style={{ 
              fontSize: 10, 
              fontFamily: 'Courier', 
              color: colors.dark,
              textAlign: 'center'
            }}>
              Latitude: {latitude.toFixed(6)}° N
            </Text>
            <Text style={{ 
              fontSize: 10, 
              fontFamily: 'Courier', 
              color: colors.dark,
              textAlign: 'center'
            }}>
              Longitude: {longitude.toFixed(6)}° W
            </Text>
          </View>
          
          {project.location && (
            <Text style={[styles.textMuted, { fontSize: 9, marginTop: 4 }]}>
              📍 Localisation: {project.location}
            </Text>
          )}
          
          <View style={styles.mapLegend}>
            <Text style={styles.legendText}>
              🔴 Marqueur rouge: Localisation exacte du projet
            </Text>
          </View>
          
          <Text style={[styles.textMuted, { fontSize: 8, marginTop: 8, fontStyle: 'italic' }]}>
            Carte générée avec OpenStreetMap • Résolution haute qualité (1200x500px)
          </Text>
        </View>
      </View>
    </View>
  );
};
// Main Component
interface NewProjectPDFDocumentProps {
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
    };
    notes?: string;
  };
  enrichedData?: ProjectReportDTO;
}

export function NewProjectPDFDocument({
  project,
  reportData,
  costCalculation,
  evmMetrics,
  pertAnalysis,
  reportConfig,
  enrichedData,
}: NewProjectPDFDocumentProps) {
  const currentDate = format(new Date(), "dd MMMM yyyy", { locale: fr });

  // Extract data
  const materials =
    project.resources?.filter((r) => r.type === "material") || [];
  const employees = project.resources?.filter((r) => r.type === "human") || [];
  const phases = enrichedData?.phases || [];
  const risks = enrichedData?.riskAssessment?.risks || [];
  const inspections = reportData?.inspections || [];
  const bankGuarantees = reportData?.bankGuarantees || [];
  const insurance = reportData?.insurance || [];
  const suppliers = reportData?.suppliers || [];
  const documents = reportData?.documents || [];
  const escalationAlerts = reportData?.escalationAlerts || [];
  const milestones = enrichedData?.constructionMilestones || [];

  // Calculate financials
  const totalBudget = project.budget || 0;
  const spentBudget = costCalculation?.actualCost || 0;
  const remainingBudget = Math.max(0, totalBudget - spentBudget);
  const costVariance = evmMetrics?.costVariance || 0;

  // Generate simple Gantt data if not available
  // project.ganttData ||
  const ganttData = phases.map((phase: any, index: number) => ({
    id: `phase-${index}`,
    name: phase.name || `Phase ${index + 1}`,
    startDate: phase.startDate || new Date(),
    endDate: phase.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    progress: phase.actualProgress || 0,
    status: phase.status || "planned",
    duration: 30,
  }));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>
                Société Mauritanienne d'Électricité (SOMELEC)
              </Text>
              <Text style={styles.reportSubtitle}>
                Avenue Gamal Abdel Nasser, BP 355, Nouakchott, Mauritanie
              </Text>
              <Text style={styles.reportSubtitle}>
                Tél: +222 45 25 25 25 | Email: contact@somelec.mr
              </Text>
            </View>
            <View>
              <Text style={styles.dateStamp}>Généré le {currentDate}</Text>
            </View>
          </View>
        </View>

        {/* Report Title */}
        <Text style={styles.reportTitle}>{reportConfig.title}</Text>
        <Text style={[styles.reportSubtitle, styles.mb3]}>
          Référence: {project.id?.substring(0, 8).toUpperCase() || "N/A"}
        </Text>

        {/* Project Header Card */}
        <View style={styles.projectHeader}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Text style={styles.projectInfo}>
            {project.location ? `📍 ${project.location} | ` : ""}
            📅{" "}
            {project.startDate
              ? format(new Date(project.startDate), "dd/MM/yyyy")
              : "Non défini"}{" "}
            -{" "}
            {project.endDate
              ? format(new Date(project.endDate), "dd/MM/yyyy")
              : "Non défini"}{" "}
            | 🏗️ {getStatusText(project.status)}
          </Text>
        </View>

        {/* Map Section - Always include when coordinates are available */}
        <MapSection project={project} />

        {/* Overview Section */}
        {reportConfig.includeSections.overview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aperçu Général</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {project.progress || 0}%
                  </Text>
                  <Text style={styles.metricLabel}>Progression</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {formatCurrency(totalBudget)}
                  </Text>
                  <Text style={styles.metricLabel}>Budget</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{phases.length}</Text>
                  <Text style={styles.metricLabel}>Phases</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{employees.length}</Text>
                  <Text style={styles.metricLabel}>Équipe</Text>
                </View>
              </View>
            </View>

            {project.description && (
              <View style={styles.card}>
                <Text style={[styles.textBold, styles.mb1]}>Description</Text>
                <Text style={styles.textMuted}>
                  {truncateText(project.description, 150)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Financial Section */}
        {reportConfig.includeSections.financial && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Résumé Financier</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {formatCurrency(totalBudget)}
                  </Text>
                  <Text style={styles.metricLabel}>Budget Total</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {formatCurrency(spentBudget)}
                  </Text>
                  <Text style={styles.metricLabel}>Dépensé</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {formatCurrency(remainingBudget)}
                  </Text>
                  <Text style={styles.metricLabel}>Restant</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <View style={styles.metricCard}>
                  <Text
                    style={[
                      styles.metricValue,
                      {
                        color:
                          costVariance >= 0 ? colors.success : colors.danger,
                      },
                    ]}
                  >
                    {formatCurrency(costVariance)}
                  </Text>
                  <Text style={styles.metricLabel}>Écart Coût</Text>
                </View>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <Text style={[styles.textMuted, styles.mb1]}>
                Utilisation du budget:{" "}
                {totalBudget > 0
                  ? ((spentBudget / totalBudget) * 100).toFixed(1)
                  : 0}
                %
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Two Columns: Phases & Materials */}
        <View style={styles.twoColumns}>
          {/* Left Column: Phases */}
          {reportConfig.includeSections.phases && phases.length > 0 && (
            <View style={styles.column}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Phases ({phases.length})
                </Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { width: "40%" }]}>
                      Phase
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
                      Prog.
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                      Statut
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
                      Budget
                    </Text>
                  </View>
                  {phases.slice(0, 6).map((phase: any, idx: number) => (
                    <View
                      key={idx}
                      style={[
                        styles.tableRow,
                        idx % 2 === 0
                          ? styles.tableRowEven
                          : styles.tableRowOdd,
                      ]}
                    >
                      <Text style={[styles.tableCell, { width: "40%" }]}>
                        {truncateText(phase.name, 25)}
                      </Text>
                      <Text style={[styles.tableCell, { width: "15%" }]}>
                        {phase.actualProgress || 0}%
                      </Text>
                      <View style={[styles.tableCell, { width: "20%" }]}>
                        <Text
                          style={[
                            styles.badge,
                            getStatusBadgeStyle(phase.status),
                          ]}
                        >
                          {getStatusText(phase.status)}
                        </Text>
                      </View>
                      <Text style={[styles.tableCell, { width: "25%" }]}>
                        {formatCurrency(phase.budget || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Right Column: Materials */}
          {reportConfig.includeSections.materials && materials.length > 0 && (
            <View style={styles.column}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Matériaux ({materials.length})
                </Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { width: "40%" }]}>
                      Matériel
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                      Quantité
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: "40%" }]}>
                      Coût Total
                    </Text>
                  </View>
                  {materials.slice(0, 6).map((material: any, idx: number) => {
                    const quantity = material.availability || 1;
                    const unitCost = material.costPerHour || 0;
                    const totalCost = quantity * unitCost;

                    return (
                      <View
                        key={idx}
                        style={[
                          styles.tableRow,
                          idx % 2 === 0
                            ? styles.tableRowEven
                            : styles.tableRowOdd,
                        ]}
                      >
                        <Text style={[styles.tableCell, { width: "40%" }]}>
                          {truncateText(material.name, 25)}
                        </Text>
                        <Text style={[styles.tableCell, { width: "20%" }]}>
                          {quantity}
                        </Text>
                        <Text style={[styles.tableCell, { width: "40%" }]}>
                          {formatCurrency(totalCost)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Gantt Chart Section */}
        {reportConfig.includeSections.ganttChart && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagramme de Gantt</Text>
            <View style={styles.card}>
              <View style={styles.ganttContainer}>
                {ganttData.slice(0, 8).map((item: any, index: number) => {
                  const statusColor =
                    {
                      completed: colors.success,
                      in_progress: colors.primary,
                      planned: colors.warning,
                      delayed: colors.danger,
                    }[item.status] || colors.medium;

                  return (
                    <View key={index} style={styles.ganttItem}>
                      <Text style={styles.ganttLabel}>
                        {truncateText(item.name, 15)}
                      </Text>
                      <View style={styles.ganttBarContainer}>
                        <View
                          style={[
                            styles.ganttBar,
                            {
                              width: `${Math.min(100, item.progress || 0)}%`,
                              backgroundColor: statusColor,
                              left: 0,
                            },
                          ]}
                        >
                          <Text style={styles.ganttBarText}>
                            {item.progress || 0}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
              <Text style={[styles.textMuted, styles.mt2, styles.textCenter]}>
                Affichage simplifié - {ganttData.length} activités
              </Text>
            </View>
          </View>
        )}

        {/* Risk Analysis Section */}
        {reportConfig.includeSections.risks && risks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analyse des Risques</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "40%" }]}>
                  Description
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
                  Probabilité
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
                  Impact
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
                  Statut
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
                  Priorité
                </Text>
              </View>
              {risks.slice(0, 6).map((risk: any, idx: number) => {
                const priority =
                  risk.probability > 70 || risk.impact > 70
                    ? "Élevé"
                    : risk.probability > 40 || risk.impact > 40
                    ? "Moyen"
                    : "Faible";
                const priorityStyle =
                  priority === "Élevé"
                    ? styles.badgeDanger
                    : priority === "Moyen"
                    ? styles.badgeWarning
                    : styles.badgeSuccess;

                return (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                    ]}
                  >
                    <Text style={[styles.tableCell, { width: "40%" }]}>
                      {truncateText(risk.description, 40)}
                    </Text>
                    <Text style={[styles.tableCell, { width: "15%" }]}>
                      {risk.probability || 0}%
                    </Text>
                    <Text style={[styles.tableCell, { width: "15%" }]}>
                      {risk.impact || 0}%
                    </Text>
                    <Text style={[styles.tableCell, { width: "15%" }]}>
                      <Text
                        style={[styles.badge, getStatusBadgeStyle(risk.status)]}
                      >
                        {getStatusText(risk.status)}
                      </Text>
                    </Text>
                    <Text style={[styles.tableCell, { width: "15%" }]}>
                      <Text style={[styles.badge, priorityStyle]}>
                        {priority}
                      </Text>
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* EVM Analysis */}
        {reportConfig.includeSections.evmAnalysis && evmMetrics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Analyse Valeur Acquise (EVM)
            </Text>
            <View style={styles.financialHighlight}>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {evmMetrics.schedulePerformanceIndex.toFixed(2)}
                    </Text>
                    <Text style={styles.metricLabel}>Indice SPI</Text>
                  </View>
                </View>
                <View style={styles.gridItem}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {evmMetrics.costPerformanceIndex.toFixed(2)}
                    </Text>
                    <Text style={styles.metricLabel}>Indice CPI</Text>
                  </View>
                </View>
                <View style={styles.gridItem}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {formatCurrency(evmMetrics.costVariance)}
                    </Text>
                    <Text style={styles.metricLabel}>Écart Coût</Text>
                  </View>
                </View>
                <View style={styles.gridItem}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {evmMetrics.earnedValue > 0
                        ? `${(
                            (evmMetrics.earnedValue /
                              evmMetrics.budgetAtCompletion) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </Text>
                    <Text style={styles.metricLabel}>Valeur Acquise</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Additional Sections in Two Columns */}
        <View style={styles.twoColumns}>
          {/* Left Column: Inspections & Bank Guarantees */}
          <View style={styles.column}>
            {reportConfig.includeSections.inspections &&
              inspections.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Inspections ({inspections.length})
                  </Text>
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { width: "50%" }]}>
                        Type
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
                        Date
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
                        Statut
                      </Text>
                    </View>
                    {inspections.slice(0, 4).map((insp: any, idx: number) => (
                      <View
                        key={idx}
                        style={[
                          styles.tableRow,
                          idx % 2 === 0
                            ? styles.tableRowEven
                            : styles.tableRowOdd,
                        ]}
                      >
                        <Text style={[styles.tableCell, { width: "50%" }]}>
                          {truncateText(insp.type || insp.inspection_type, 25)}
                        </Text>
                        <Text style={[styles.tableCell, { width: "25%" }]}>
                          {insp.date
                            ? format(new Date(insp.date), "dd/MM/yy")
                            : ""}
                        </Text>
                        <Text style={[styles.tableCell, { width: "25%" }]}>
                          <Text
                            style={[
                              styles.badge,
                              getStatusBadgeStyle(insp.status),
                            ]}
                          >
                            {getStatusText(insp.status)}
                          </Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {reportConfig.includeSections.bankGuarantees &&
              bankGuarantees.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Garanties Bancaires ({bankGuarantees.length})
                  </Text>
                  <View style={styles.card}>
                    <Text style={[styles.textMuted, styles.mb1]}>
                      Montant total:{" "}
                      {formatCurrency(
                        bankGuarantees.reduce(
                          (sum: number, bg: any) =>
                            sum + (bg.guarantee_amount || 0),
                          0
                        )
                      )}
                    </Text>
                    <Text style={styles.textMuted}>
                      Actives:{" "}
                      {
                        bankGuarantees.filter(
                          (bg: any) => bg.status === "active"
                        ).length
                      }
                    </Text>
                  </View>
                </View>
              )}
          </View>

          {/* Right Column: Insurance & Milestones */}
          <View style={styles.column}>
            {reportConfig.includeSections.insurance && insurance.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Assurances ({insurance.length})
                </Text>
                <View style={styles.card}>
                  <Text style={[styles.textMuted, styles.mb1]}>
                    Couverture totale:{" "}
                    {formatCurrency(
                      insurance.reduce(
                        (sum: number, ins: any) =>
                          sum + (ins.coverage_amount || 0),
                        0
                      )
                    )}
                  </Text>
                  <Text style={styles.textMuted}>
                    Types:{" "}
                    {Array.from(
                      new Set(insurance.map((ins: any) => ins.coverage_type))
                    ).join(", ")}
                  </Text>
                </View>
              </View>
            )}

            {reportConfig.includeSections.milestones &&
              milestones.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Jalons ({milestones.length})
                  </Text>
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { width: "60%" }]}>
                        Jalon
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                        Date
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                        Statut
                      </Text>
                    </View>
                    {milestones
                      .slice(0, 4)
                      .map((milestone: any, idx: number) => (
                        <View
                          key={idx}
                          style={[
                            styles.tableRow,
                            idx % 2 === 0
                              ? styles.tableRowEven
                              : styles.tableRowOdd,
                          ]}
                        >
                          <Text style={[styles.tableCell, { width: "60%" }]}>
                            {truncateText(milestone.title, 30)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "20%" }]}>
                            {milestone.targetDate
                              ? format(
                                  new Date(milestone.targetDate),
                                  "dd/MM/yy"
                                )
                              : ""}
                          </Text>
                          <Text style={[styles.tableCell, { width: "20%" }]}>
                            <Text
                              style={[
                                styles.badge,
                                getStatusBadgeStyle(milestone.status),
                              ]}
                            >
                              {getStatusText(milestone.status)}
                            </Text>
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
              )}
          </View>
        </View>

        {/* PERT Analysis */}
        {reportConfig.includeSections.pertAnalysis && pertAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analyse PERT</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {pertAnalysis.totalExpectedDuration?.toFixed(1)}j
                  </Text>
                  <Text style={styles.metricLabel}>Durée Estimée</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {pertAnalysis.criticalPath?.length || 0}
                  </Text>
                  <Text style={styles.metricLabel}>Tâches Critiques</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {pertAnalysis.totalExpectedDuration &&
                    pertAnalysis.variances
                      ? (
                          pertAnalysis.totalExpectedDuration +
                          1.65 *
                            Math.sqrt(
                              Object.values(pertAnalysis.variances).reduce(
                                (sum: number, v: number) => sum + v,
                                0
                              )
                            )
                        ).toFixed(1)
                      : "N/A"}
                    j
                  </Text>
                  <Text style={styles.metricLabel}>Probabilité 95%</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {pertAnalysis.variances
                      ? Math.sqrt(
                          Object.values(pertAnalysis.variances).reduce(
                            (sum: number, v: number) => sum + v,
                            0
                          )
                        ).toFixed(2)
                      : "0.00"}
                    j
                  </Text>
                  <Text style={styles.metricLabel}>Écart-type</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Additional Notes */}
        {reportConfig.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes Additionnelles</Text>
            <View style={styles.card}>
              <Text style={styles.textMuted}>{reportConfig.notes}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Document confidentiel - Société Mauritanienne d'Électricité
            (SOMELEC) - {currentDate}
          </Text>
          <Text>Page 1 sur 1</Text>
        </View>
      </Page>
    </Document>
  );
}
