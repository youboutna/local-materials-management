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
import { Download, FileText, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CompactProjectPDFDocument,
  SingleCompactProjectPDF,
} from "./pdf/CompactProjectPDFDocument";
import {
  NewCompactProjectPDF,
  NewCompactProjectsPDF,
} from "./pdf/NewCompactProjectPDF";

interface CompactProjectReportGeneratorProps {
  project?: ProjectData;
  projects?: ProjectData[];
  onClose?: () => void;
}

export function CompactProjectReportGenerator({
  project,
  projects,
  onClose,
}: CompactProjectReportGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState("Rapport des Projets SOMELEC");

  // Data maps for multiple projects
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

          setReportTitle(`Rapport - ${project.title}`);
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
  }, [project, projects, isSingleProject, projectList.length, toast]);

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
      setLoading(true);

      let pdfDoc;

      if (isSingleProject && project) {
        // Use the new single project PDF
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
        // Use the new multi-project PDF
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
        title: "Succès",
        description: `Rapport généré avec ${projectList.length} projet(s).`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport PDF.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // const generatePDF = async () => {
  //   if (projectList.length === 0) {
  //     toast({
  //       title: "Erreur",
  //       description: "Aucun projet à exporter.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     let pdfDoc;

  //     if (isSingleProject && project) {
  //       pdfDoc = (
  //         <SingleCompactProjectPDF
  //           project={project}
  //           reportTitle={reportTitle}
  //           enrichedData={singleEnrichedData || undefined}
  //           evmMetrics={singleEvmMetrics || undefined}
  //           pertAnalysis={singlePertAnalysis || undefined}
  //         />
  //       );
  //     } else {
  //       pdfDoc = (
  //         <CompactProjectPDFDocument
  //           projects={projectList}
  //           reportTitle={reportTitle}
  //           enrichedDataMap={enrichedDataMap}
  //           evmMetricsMap={evmMetricsMap}
  //           pertAnalysisMap={pertAnalysisMap}
  //         />
  //       );
  //     }

  //     const blob = await pdf(pdfDoc).toBlob();
  //     const fileName = `${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
  //     saveAs(blob, fileName);

  //     toast({
  //       title: "Succès",
  //       description: `Rapport généré avec ${projectList.length} projet(s).`,
  //     });
  //   } catch (error) {
  //     console.error('Error generating PDF:', error);
  //     toast({
  //       title: "Erreur",
  //       description: "Impossible de générer le rapport PDF.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Format coordinates for display
  const formatCoordinates = (project: ProjectData) => {
    if (project.coordinates?.latitude && project.coordinates?.longitude) {
      return `${project.coordinates.latitude.toFixed(
        6
      )}, ${project.coordinates.longitude.toFixed(6)}`;
    }
    return "Non définies";
  };

  if (loading && enrichedDataMap.size === 0 && !singleEnrichedData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-medium">Chargement des données du rapport...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Préparation des données pour {projectList.length} projet
            {projectList.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="m-0 text-lg">
            Rapport Compact (Un projet par page)
          </CardTitle>
        </div>

        {/* Mini map preview: top-right header */}
        <div className="w-48 h-28 rounded-md overflow-hidden border bg-gradient-to-br from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-800">
          {project ? (
            <div className="h-full w-full flex flex-col p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Localisation
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                  {project.location || "Non définie"}
                </p>
                {project.coordinates && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {formatCoordinates(project)}
                  </p>
                )}
              </div>
              <div className="mt-auto pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                  Miniature incluse dans le PDF
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-4">
              <MapPin className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground text-center">
                {projectList.length > 1
                  ? `${projectList.length} projets sélectionnés`
                  : "Aucun projet spécifique"}
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Report Title */}
        <div className="space-y-2">
          <Label htmlFor="report-title" className="text-sm font-medium">
            Titre du rapport
          </Label>
          <Input
            id="report-title"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="Titre du rapport"
            className="text-sm"
          />
        </div>

        {/* Projects Summary */}
        <div className="bg-muted/30 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Projets à inclure</span>
            <Badge variant="secondary" className="font-medium">
              {projectList.length} projet{projectList.length > 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {projectList.map((proj) => (
              <div
                key={proj.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{proj.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {proj.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">
                          {proj.location}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Badge variant="outline" className="text-xs font-medium px-2">
                    {proj.progress || 0}%
                  </Badge>
                  <Badge
                    variant={
                      proj.status === "terminé"
                        ? "default"
                        : proj.status === "en cours"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs font-medium px-2"
                  >
                    {proj.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informational Note */}
        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Format compact
          </p>
          <p className="mb-2">
            Chaque projet sera affiché sur une seule page A4 avec un résumé des
            informations clés : budget, progression, risques, dépenses,
            conformité et indicateurs de performance.
          </p>
          <div className="text-xs space-y-1 mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <p className="font-medium">Contenu inclus :</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Informations générales et budget</li>
              <li>Dépenses engagées par phase</li>
              <li>Risques identifiés</li>
              <li>Analyse EVM (Valeur Acquise)</li>
              <li>Indicateurs de performance (KPI)</li>
              <li>Analyse PERT</li>
              <li>Miniature de carte en en-tête</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={generatePDF}
            disabled={loading || projectList.length === 0}
            className="flex-1"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Télécharger le rapport PDF
              </>
            )}
          </Button>

          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Annuler
            </Button>
          )}
        </div>

        {/* Technical Note */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>
            <strong>Note :</strong> Une miniature de carte schématique est
            incluse dans chaque page de projet. Les coordonnées GPS sont
            affichées textuellement si disponibles.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
