import React from "react";
import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EVMMetrics, PERTAnalysis, ProjectData } from "@/types/project";
import { ProjectReportDTO } from "@/types/reportTypes";

// Register fonts for better typography
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@react-pdf/fonts@1.0.0/lib/fonts/Helvetica.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@react-pdf/fonts@1.0.0/lib/fonts/Helvetica-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

// Professional color palette
const colors = {
  // Primary
  primary: "#1e40af",
  primaryLight: "#3b82f6",
  primaryDark: "#1e3a8a",

  // Status
  success: "#059669",
  successLight: "#10b981",
  warning: "#d97706",
  warningLight: "#f59e0b",
  danger: "#dc2626",
  dangerLight: "#ef4444",

  // Neutral
  dark: "#1f2937",
  darkMedium: "#374151",
  medium: "#6b7280",
  light: "#9ca3af",
  lightest: "#f3f4f6",
  white: "#ffffff",

  // Backgrounds
  background: "#ffffff",
  backgroundAlt: "#f8fafc",
  backgroundMuted: "#f1f5f9",

  // Borders
  border: "#e5e7eb",
  borderLight: "#f1f5f9",
  borderDark: "#d1d5db",
};

// Clean, readable styles
const styles = StyleSheet.create({
  // Page layout
  page: {
    padding: "40 35 50 35", // Top, Right, Bottom, Left - Good margins
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
    backgroundColor: colors.background,
    color: colors.dark,
  },

  // Header section
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
    borderBottomStyle: "solid",
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 10,
    color: colors.medium,
    marginBottom: 2,
  },
  dateStamp: {
    fontSize: 9,
    color: colors.light,
    textAlign: "right",
  },

  // Project header
  projectHeader: {
    backgroundColor: colors.primary,
    padding: "16 20",
    borderRadius: 8,
    marginBottom: 20,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 4,
  },
  projectInfo: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 1.3,
  },

  // Info cards - 2x2 grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: "1 1 calc(50% - 6px)",
    minWidth: "calc(50% - 6px)",
    backgroundColor: colors.backgroundAlt,
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCardTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.dark,
  },
  infoCardSubtitle: {
    fontSize: 9,
    color: colors.medium,
    marginTop: 2,
  },

  // Progress bar
  progressContainer: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 10,
    color: colors.medium,
    marginBottom: 6,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.borderLight,
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

  // Two-column layout for details
  twoColumns: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  column: {
    flex: 1,
  },

  // Section styling
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.dark,
    backgroundColor: colors.backgroundAlt,
    padding: "8 12",
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderLeftStyle: "solid",
    borderRadius: 2,
  },

  // Tables - Clean and readable
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    backgroundColor: colors.backgroundMuted,
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
    borderBottomColor: colors.borderLight,
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

  // KPI/metrics grid
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: "1 1 calc(25% - 7.5px)",
    minWidth: "calc(25% - 7.5px)",
    backgroundColor: colors.backgroundAlt,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 8,
    color: colors.medium,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // Badge styling
  badge: {
    padding: "4 8",
    borderRadius: 12,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
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
    color: "#1e40af",
  },

  // Financial highlights
  financialHighlight: {
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
    marginBottom: 20,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 35,
    right: 35,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontSize: 8,
    color: colors.medium,
    textAlign: "center",
  },

  // Utility classes
  textCenter: {
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
  },
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb3: { marginBottom: 12 },
  mt1: { marginTop: 4 },
  mt2: { marginTop: 8 },
  mt3: { marginTop: 12 },
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
    "en inspection": "En inspection",
    suspendu: "Suspendu",
    annulé: "Annulé",
  };
  return statusMap[status.toLowerCase()] || status;
};

const getStatusBadgeStyle = (status: string) => {
  const statusLower = status.toLowerCase();

  if (
    statusLower.includes("terminé") ||
    statusLower.includes("completed") ||
    statusLower.includes("success")
  ) {
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
    statusLower.includes("failed")
  ) {
    return styles.badgeDanger;
  }

  return styles.badgeInfo;
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

const truncateText = (text: string, maxLength: number = 40) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

// Main component
interface NewCompactProjectPDFProps {
  project: ProjectData;
  enrichedData?: ProjectReportDTO;
  evmMetrics?: EVMMetrics;
  pertAnalysis?: PERTAnalysis;
  reportTitle?: string;
  company?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  includeCompanyHeader?: boolean;
}

export function NewCompactProjectPDF({
  project,
  enrichedData,
  evmMetrics,
  pertAnalysis,
  reportTitle = "Rapport de Projet",
  company = {
    name: "Société Mauritanienne d'Électricité (SOMELEC)",
    address: "Avenue Gamal Abdel Nasser, BP 355, Nouakchott, Mauritanie",
    phone: "+222 45 25 25 25",
    email: "contact@somelec.mr",
  },
  includeCompanyHeader = true,
}: NewCompactProjectPDFProps) {
  const currentDate = format(new Date(), "dd MMMM yyyy", { locale: fr });

  // Extract data
  const phases = enrichedData?.phases || [];
  const risks = enrichedData?.riskAssessment?.risks || [];
  const materials =
    project.resources?.filter((r) => r.type === "material") || [];
  const teamSize =
    project.resources?.filter((r) => r.type === "human").length || 0;

  // Calculate financials
  const materialCost = materials.reduce((sum, material) => {
    return sum + (material.availability || 1) * (material.costPerHour || 0);
  }, 0);

  const totalBudget = project.budget || 0;
  const spentBudget =
    enrichedData?.financialMetrics?.spentAmount || materialCost;
  const remainingBudget = Math.max(0, totalBudget - spentBudget);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company Header */}
        {includeCompanyHeader && (
          <View style={styles.header}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.companyName}>{company.name}</Text>
                <Text style={styles.reportSubtitle}>{company.address}</Text>
                <Text style={styles.reportSubtitle}>
                  Tél: {company.phone} | Email: {company.email}
                </Text>
              </View>
              <View>
                <Text style={styles.dateStamp}>Généré le {currentDate}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Report Title */}
        <Text style={styles.reportTitle}>{reportTitle}</Text>
        <Text style={[styles.reportSubtitle, styles.mb3]}>
          Référence: {project.id.substring(0, 8).toUpperCase()}
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
              : "Non défini"}
          </Text>
        </View>

        {/* Key Metrics Grid - 2x2 */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Budget Total</Text>
            <Text style={styles.infoCardValue}>
              {formatCurrency(totalBudget)}
            </Text>
            <Text style={styles.infoCardSubtitle}>
              Dépensé: {formatCurrency(spentBudget)} | Restant:{" "}
              {formatCurrency(remainingBudget)}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Statut du Projet</Text>
            <View
              style={[
                styles.badge,
                getStatusBadgeStyle(project.status),
                { alignSelf: "flex-start" },
              ]}
            >
              <Text>{getStatusText(project.status)}</Text>
            </View>
            <Text style={styles.infoCardSubtitle}>
              Équipe: {teamSize} personnes | Matériaux: {materials.length} types
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Progression</Text>
            <Text style={styles.infoCardValue}>{project.progress || 0}%</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${project.progress || 0}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Durée</Text>
            <Text style={styles.infoCardValue}>
              {project.startDate && project.endDate
                ? `${Math.ceil(
                    (new Date(project.endDate).getTime() -
                      new Date(project.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )} jours`
                : "Non définie"}
            </Text>
            <Text style={styles.infoCardSubtitle}>
              Écoulé:{" "}
              {project.startDate
                ? `${Math.ceil(
                    (new Date().getTime() -
                      new Date(project.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )} jours`
                : "Non calculé"}
            </Text>
          </View>
        </View>

        {/* Two Columns: Dépenses & Risques */}
        <View style={styles.twoColumns}>
          {/* Left Column: Dépenses */}
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dépenses par Phase</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: "50%" }]}>
                    Phase
                  </Text>
                  <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
                    Budget
                  </Text>
                  <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
                    Dépensé
                  </Text>
                </View>
                {phases.slice(0, 4).map((phase: any, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                    ]}
                  >
                    <Text style={[styles.tableCell, { width: "50%" }]}>
                      {truncateText(phase.name || `Phase ${idx + 1}`, 25)}
                    </Text>
                    <Text style={[styles.tableCell, { width: "25%" }]}>
                      {formatCurrency(phase.budget || 0)}
                    </Text>
                    <Text style={[styles.tableCell, { width: "25%" }]}>
                      {formatCurrency(phase.actualCost || 0)}
                    </Text>
                  </View>
                ))}
                {phases.length === 0 && (
                  <View style={[styles.tableRow, styles.tableRowEven]}>
                    <Text
                      style={[
                        styles.tableCell,
                        {
                          width: "100%",
                          textAlign: "center",
                          color: colors.medium,
                        },
                      ]}
                    >
                      Aucune phase définie
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Right Column: Risques */}
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Risques Principaux</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: "60%" }]}>
                    Description
                  </Text>
                  <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                    Impact
                  </Text>
                  <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                    Probabilité
                  </Text>
                </View>
                {risks.slice(0, 4).map((risk: any, idx: number) => {
                  const impact =
                    risk.impact > 70
                      ? "Élevé"
                      : risk.impact > 40
                      ? "Moyen"
                      : "Faible";
                  const impactStyle =
                    risk.impact > 70
                      ? styles.badgeDanger
                      : risk.impact > 40
                      ? styles.badgeWarning
                      : styles.badgeSuccess;
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
                      <Text style={[styles.tableCell, { width: "60%" }]}>
                        {truncateText(
                          risk.description || "Risque non spécifié",
                          40
                        )}
                      </Text>
                      <Text style={[styles.tableCell, { width: "20%" }]}>
                        <View style={[styles.badge, impactStyle]}>
                          <Text>{impact}</Text>
                        </View>
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          { width: "20%", textAlign: "center" },
                        ]}
                      >
                        {risk.probability || 0}%
                      </Text>
                    </View>
                  );
                })}
                {risks.length === 0 && (
                  <View style={[styles.tableRow, styles.tableRowEven]}>
                    <Text
                      style={[
                        styles.tableCell,
                        {
                          width: "100%",
                          textAlign: "center",
                          color: colors.medium,
                        },
                      ]}
                    >
                      Aucun risque identifié
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Performance KPIs */}
        <View style={styles.financialHighlight}>
          <Text
            style={[
              styles.sectionTitle,
              { backgroundColor: "transparent", borderLeftWidth: 0 },
            ]}
          >
            Indicateurs de Performance
          </Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text
                style={[
                  styles.kpiValue,
                  {
                    color: getPerformanceColor(
                      evmMetrics?.schedulePerformanceIndex || 0,
                      true
                    ),
                  },
                ]}
              >
                {evmMetrics
                  ? evmMetrics.schedulePerformanceIndex.toFixed(2)
                  : "N/A"}
              </Text>
              <Text style={styles.kpiLabel}>Indice SPI</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text
                style={[
                  styles.kpiValue,
                  {
                    color: getPerformanceColor(
                      evmMetrics?.costPerformanceIndex || 0,
                      true
                    ),
                  },
                ]}
              >
                {evmMetrics
                  ? evmMetrics.costPerformanceIndex.toFixed(2)
                  : "N/A"}
              </Text>
              <Text style={styles.kpiLabel}>Indice CPI</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text
                style={[
                  styles.kpiValue,
                  {
                    color: evmMetrics?.costVariance
                      ? getPerformanceColor(evmMetrics.costVariance)
                      : colors.medium,
                  },
                ]}
              >
                {evmMetrics ? formatCurrency(evmMetrics.costVariance) : "N/A"}
              </Text>
              <Text style={styles.kpiLabel}>Écart Coût</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: colors.primary }]}>
                {project.progress || 0}%
              </Text>
              <Text style={styles.kpiLabel}>Progression</Text>
            </View>
          </View>
        </View>

        {/* EVM Summary */}
        {evmMetrics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Analyse Valeur Acquise (EVM)
            </Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Valeur Planifiée (PV)</Text>
                <Text style={styles.infoCardValue}>
                  {formatCurrency(evmMetrics.plannedValue)}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Valeur Acquise (EV)</Text>
                <Text style={styles.infoCardValue}>
                  {formatCurrency(evmMetrics.earnedValue)}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Coût Réel (AC)</Text>
                <Text style={styles.infoCardValue}>
                  {formatCurrency(evmMetrics.actualCost)}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Budget Restant (ETC)</Text>
                <Text style={styles.infoCardValue}>
                  {formatCurrency(evmMetrics.estimateToComplete)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* PERT Analysis */}
        {pertAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analyse PERT</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Durée Estimée</Text>
                <Text style={styles.infoCardValue}>
                  {pertAnalysis.totalExpectedDuration?.toFixed(1)} jours
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Chemin Critique</Text>
                <Text style={styles.infoCardValue}>
                  {pertAnalysis.criticalPath?.length || 0} tâches
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Probabilité 95%</Text>
                <Text style={styles.infoCardValue}>
                  {pertAnalysis.totalExpectedDuration && pertAnalysis.variances
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
                    : "N/A"}{" "}
                  jours
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Écart-type</Text>
                <Text style={styles.infoCardValue}>
                  {pertAnalysis.variances
                    ? Math.sqrt(
                        Object.values(pertAnalysis.variances).reduce(
                          (sum: number, v: number) => sum + v,
                          0
                        )
                      ).toFixed(2)
                    : "N/A"}{" "}
                  jours
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Description if available */}
        {project.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description du Projet</Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.backgroundAlt,
                  padding: 12,
                  borderRadius: 6,
                },
              ]}
            >
              <Text
                style={{ fontSize: 9, color: colors.dark, lineHeight: 1.5 }}
              >
                {truncateText(project.description, 200)}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Document confidentiel - {company.name} - {currentDate}
          </Text>
          <Text>Page 1 sur 1</Text>
        </View>
      </Page>
    </Document>
  );
}

// Multi-project version
interface NewCompactProjectsPDFProps {
  projects: ProjectData[];
  enrichedDataMap?: Map<string, ProjectReportDTO>;
  evmMetricsMap?: Map<string, EVMMetrics>;
  pertAnalysisMap?: Map<string, PERTAnalysis>;
  reportTitle?: string;
  company?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export function NewCompactProjectsPDF({
  projects,
  enrichedDataMap,
  evmMetricsMap,
  pertAnalysisMap,
  reportTitle = "Rapport Compact des Projets",
  company = {
    name: "Société Mauritanienne d'Électricité (SOMELEC)",
    address: "Avenue Gamal Abdel Nasser, BP 355, Nouakchott, Mauritanie",
    phone: "+222 45 25 25 25",
    email: "contact@somelec.mr",
  },
}: NewCompactProjectsPDFProps) {
  return (
    <Document>
      {projects.map((project, index) => (
        <NewCompactProjectPDF
          key={project.id}
          project={project}
          enrichedData={enrichedDataMap?.get(project.id)}
          evmMetrics={evmMetricsMap?.get(project.id)}
          pertAnalysis={pertAnalysisMap?.get(project.id)}
          reportTitle={`${reportTitle} - Projet ${index + 1} sur ${
            projects.length
          }`}
          company={company}
          includeCompanyHeader={index === 0} // Only show company header on first page
        />
      ))}
    </Document>
  );
}

// Single project wrapper for convenience
export function SingleCompactProjectPDF({
  project,
  enrichedData,
  evmMetrics,
  pertAnalysis,
  reportTitle,
  company,
}: NewCompactProjectPDFProps) {
  return (
    <NewCompactProjectPDF
      project={project}
      enrichedData={enrichedData}
      evmMetrics={evmMetrics}
      pertAnalysis={pertAnalysis}
      reportTitle={reportTitle}
      company={company}
      includeCompanyHeader={true}
    />
  );
}
