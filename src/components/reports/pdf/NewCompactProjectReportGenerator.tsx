// @/components/reports/NewCompactProjectReportGenerator.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { EnhancedReportingService } from "@/services/enhancedReportingService";
import { EVMMetrics, PERTAnalysis, ProjectData } from "@/types/project";
import { ProjectReportDTO } from "@/types/reportTypes";
import { ReportCalculations } from "@/utils/reportCalculations";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import {
  Download,
  FileText,
  Loader2,
  MapPin,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  NewCompactProjectPDF,
  NewCompactProjectsPDF,
} from "./NewCompactProjectPDF";

interface NewCompactProjectReportGeneratorProps {
  project?: ProjectData;
  projects?: ProjectData[];
  onClose?: () => void;
}

export function NewCompactProjectReportGenerator({
  project,
  projects,
  onClose,
}: NewCompactProjectReportGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState(
    "Rapport Compact des Projets SOMELEC"
  );

  // Data maps
  const [enrichedDataMap, setEnrichedDataMap] = useState<
    Map<string, ProjectReportDTO>
  >(new Map());
  const [evmMetricsMap, setEvmMetricsMap] = useState<Map<string, EVMMetrics>>(
    new Map()
  );
  const [pertAnalysisMap, setPertAnalysisMap] = useState<
    Map<string, PERTAnalysis>
  >(new Map());

  // Single project data
  const [singleEnrichedData, setSingleEnrichedData] =
    useState<ProjectReportDTO | null>(null);
  const [singleEvmMetrics, setSingleEvmMetrics] = useState<EVMMetrics | null>(
    null
  );
  const [singlePertAnalysis, setSinglePertAnalysis] =
    useState<PERTAnalysis | null>(null);

  const projectList = projects || (project ? [project] : []);
  const isSingleProject = !projects && project;

  useEffect(() => {
    const loadData = async () => {
      if (projectList.length === 0) return;

      setLoading(true);
      try {
        if (isSingleProject && project) {
          // Load single project data
          const completeReport =
            await EnhancedReportingService.generateCompleteProjectReport(
              project
            );
          setSingleEnrichedData(completeReport.reportDTO);

          const evmMetricsResult = ReportCalculations.calculateEVMMetrics(
            project,
            completeReport.costCalculation.actualCost,
            completeReport.reportDTO.phases
          );
          setSingleEvmMetrics(evmMetricsResult);

          const pertAnalysisResult = ReportCalculations.calculatePERTAnalysis(
            completeReport.reportDTO.phases,
            project.tasks || []
          );
          setSinglePertAnalysis(pertAnalysisResult);

          setReportTitle(`Rapport Compact - ${project.title}`);
        } else {
          // Load multiple projects data
          const enrichedMap = new Map<string, ProjectReportDTO>();
          const evmMap = new Map<string, EVMMetrics>();
          const pertMap = new Map<string, PERTAnalysis>();

          for (const proj of projectList) {
            try {
              const completeReport =
                await EnhancedReportingService.generateCompleteProjectReport(
                  proj
                );
              enrichedMap.set(proj.id, completeReport.reportDTO);

              const evmMetricsResult = ReportCalculations.calculateEVMMetrics(
                proj,
                completeReport.costCalculation.actualCost,
                completeReport.reportDTO.phases
              );
              evmMap.set(proj.id, evmMetricsResult);

              const pertAnalysisResult =
                ReportCalculations.calculatePERTAnalysis(
                  completeReport.reportDTO.phases,
                  proj.tasks || []
                );
              pertMap.set(proj.id, pertAnalysisResult);
            } catch (error) {
              console.error(
                `Error loading data for project ${proj.id}:`,
                error
              );
            }
          }

          setEnrichedDataMap(enrichedMap);
          setEvmMetricsMap(evmMap);
          setPertAnalysisMap(pertMap);

          setReportTitle(`Rapport Compact - ${projectList.length} Projets`);
        }
      } catch (error) {
        console.error("Error loading report data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du rapport.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [project, projects, isSingleProject, toast]);

  const generatePDF = async () => {
    if (projectList.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun projet à exporter.",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);

      let pdfDoc;

      if (isSingleProject && project) {
        pdfDoc = (
          <NewCompactProjectPDF
            project={project}
            enrichedData={singleEnrichedData || undefined}
            evmMetrics={singleEvmMetrics || undefined}
            pertAnalysis={singlePertAnalysis || undefined}
            reportTitle={reportTitle}
          />
        );
      } else {
        pdfDoc = (
          <NewCompactProjectsPDF
            projects={projectList}
            enrichedDataMap={enrichedDataMap}
            evmMetricsMap={evmMetricsMap}
            pertAnalysisMap={pertAnalysisMap}
            reportTitle={reportTitle}
          />
        );
      }

      const blob = await pdf(pdfDoc).toBlob();
      const fileName = `${reportTitle
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_${new Date().toISOString().split("T")[0]}.pdf`;
      saveAs(blob, fileName);

      toast({
        title: "Rapport généré avec succès",
        description: `Le rapport compact a été généré pour ${
          projectList.length
        } projet${projectList.length > 1 ? "s" : ""}.`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer le rapport PDF.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading && enrichedDataMap.size === 0 && !singleEnrichedData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <p className="font-semibold text-lg">Préparation du rapport...</p>
          <p className="text-sm text-muted-foreground">
            Chargement des données pour {projectList.length} projet
            {projectList.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalBudget = projectList.reduce((sum, p) => sum + (p.budget || 0), 0);
  const averageProgress =
    projectList.length > 0
      ? projectList.reduce((sum, p) => sum + (p.progress || 0), 0) /
        projectList.length
      : 0;
  const completedProjects = projectList.filter(
    (p) => p.status === "terminé"
  ).length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Rapport Compact - Format Professionnel
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Un projet par page avec mise en page optimisée pour la lecture
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              <span>KPI</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>EVM</span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Report Configuration */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <div className="space-y-2">
            <Label htmlFor="report-title" className="text-sm font-medium">
              Titre du rapport
            </Label>
            <Input
              id="report-title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Entrez le titre du rapport"
              className="text-sm"
            />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground">Projets</p>
              <p className="font-bold text-lg">{projectList.length}</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground">Budget Total</p>
              <p className="font-bold text-lg">
                {totalBudget >= 1000000
                  ? `${(totalBudget / 1000000).toFixed(1)}M`
                  : totalBudget >= 1000
                  ? `${(totalBudget / 1000).toFixed(1)}k`
                  : totalBudget.toLocaleString("fr-FR")}
                <span className="text-xs text-muted-foreground ml-1">MRU</span>
              </p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground">Progression Moy.</p>
              <p className="font-bold text-lg">{averageProgress.toFixed(1)}%</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground">Terminés</p>
              <p className="font-bold text-lg">{completedProjects}</p>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Projets inclus dans le rapport
            </Label>
            <Badge variant="secondary" className="font-medium">
              {projectList.length} projet{projectList.length > 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {projectList.map((proj, index) => (
              <div
                key={proj.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {proj.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {proj.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground truncate">
                            {proj.location}
                          </p>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {proj.budget
                          ? `${(proj.budget / 1000000).toFixed(1)}M MRU`
                          : "Budget N/D"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${proj.progress || 0}%` }}
                    />
                  </div>
                  <Badge variant="outline" className="text-xs font-medium px-2">
                    {proj.progress || 0}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Preview */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold text-blue-700 dark:text-blue-300">
              Contenu du rapport compact
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Informations clés (2×2 grid)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Dépenses par phase</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>Risques principaux</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>Indicateurs de performance</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Analyse EVM (Valeur Acquise)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span>Analyse PERT</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                <span>Barres de progression</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                <span>En-tête professionnel</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <span className="font-semibold">Format optimisé :</span> Taille de
              police 10pt, espacement généreux, couleurs professionnelles, mise
              en page responsive.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={generatePDF}
            disabled={generating || projectList.length === 0}
            className="flex-1 h-12"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Générer le rapport PDF
              </>
            )}
          </Button>

          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12"
              size="lg"
            >
              Annuler
            </Button>
          )}
        </div>

        {/* Technical Info */}
        <div className="text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center justify-between">
            <p>
              <span className="font-semibold">Format :</span> PDF A4 portrait •
              <span className="font-semibold ml-2">Police :</span> Helvetica
              10pt •<span className="font-semibold ml-2">Pages :</span>{" "}
              {projectList.length}
            </p>
          </div>
          <p className="mt-1 italic">
            Chaque projet est présenté sur une page séparée avec une mise en
            page optimisée pour la lecture et l'impression.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
