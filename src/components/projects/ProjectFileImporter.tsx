import { ProjectService } from '@/application/services/ProjectService';
import { ProjectImportExportService } from '@/application/services/ProjectImportExportService';
import {
  projectImportTemplateService,
  type TemplateFormat,
} from '@/application/services/ProjectImportTemplateService';
import type { ReferentialType } from '@/config/referentials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/contexts/LanguageContext";
import { CreateProjectDTO } from "@/dtos/entities/ProjectDTO";
import { ImportOptions } from '@/dtos/entities/LoadDataDTO';;
import { useToast } from "@/hooks/use-toast";
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import {
    AlertTriangle,
    CheckCircle,
    Download,
    FileSpreadsheet,
    FileText,
    Upload,
    X,
} from "lucide-react";
import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

type ImportMode = "create" | "update" | "patch";

// Local type for import form data - extends CreateProjectDTO with import-specific fields
interface ImportProjectData extends Partial<CreateProjectDTO> {
  id?: string;
  phases?: any[];
  plannedPhases?: any[];
  status?: any;
  progress?: number;
  thumbnail?: string;
  environmentalImpact?: string;
  sustainabilityScore?: number;
  [key: string]: any; // Allow any additional properties for flexibility
}

const IMPORT_OPTIONS: ImportOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "application/json", // .json
    "text/csv", // .csv
  ],
};

interface ProjectFileImporterProps {
  onImportComplete?: (result: ImportResult) => void;
}

export default function ProjectFileImporter({
  onImportComplete,
}: ProjectFileImporterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("create");
  const [templateReferential, setTemplateReferential] = useState<ReferentialType>("CUSTOM_STANDARD");
  const [templateFormat, setTemplateFormat] = useState<TemplateFormat>("json");
  const referentialOptions = useMemo(
    () => projectImportTemplateService.listReferentials("fr"),
    [],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const projectService = useMemo(
    () => new ProjectService(RepositoryFactory.getProjectRepository()),
    [],
  );
  const projectImportService = useMemo(
    () => ProjectImportExportService.default(),
    [],
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (IMPORT_OPTIONS.maxFileSize && file.size > IMPORT_OPTIONS.maxFileSize) {
      return `${t("projects.import.fileTooLarge")} ${formatFileSize(
        IMPORT_OPTIONS.maxFileSize!
      )}`;
    }

    if (IMPORT_OPTIONS.allowedFormats && !IMPORT_OPTIONS.allowedFormats.includes(file.type)) {
      return t("projects.import.unsupportedFormat");
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: t("projects.import.invalidFile"),
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(t("projects.import.excelReadError")));
        }
      };
      reader.onerror = () =>
        reject(new Error(t("projects.import.fileReadError")));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseJsonFile = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          // Preserve dataset envelopes so organizations, suppliers and
          // projects are imported together by the application service.
          resolve(data);
        } catch (error) {
          reject(new Error(t("projects.import.invalidJson")));
        }
      };
      reader.readAsText(file);
    });
  };

  const parseCsvFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split("\n");
          const headers = lines[0].split(",").map((h) => h.trim());

          const data = lines
            .slice(1)
            .filter((line) => line.trim())
            .map((line) => {
              const values = line.split(",");
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = values[index]?.trim() || "";
              });
              return obj;
            });

          resolve(data);
        } catch (error) {
          reject(new Error(t("projects.import.csvReadError")));
        }
      };
      reader.readAsText(file);
    });
  };

  const parseFile = async (file: File): Promise<any> => {
    switch (file.type) {
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      case "application/vnd.ms-excel":
        return parseExcelFile(file);
      case "application/json":
        return parseJsonFile(file);
      case "text/csv":
        return parseCsvFile(file);
      default:
        throw new Error(t("projects.import.unsupportedFormat"));
    }
  };

  const transformToProjectData = (item: any): ImportProjectData => {
    // Map des statuts vers les valeurs autorisées (use domain ProjectStatus enum values)
    const statusMap: { [key: string]: string } = {
      "en construction": "en cours",
      "en clôture": "en cours",
      "en conception": "en attente",
      "planifié": "planifié",
      "en cours": "en cours",
      "en attente": "en attente",
      "enCours": "en cours",
      "enAttente": "en attente",
    };

    const rawStatus = item.status || "en cours";
    const mappedStatus = statusMap[rawStatus.toLowerCase()] || "en cours";
    const progress = item.progress ? Math.round(parseFloat(item.progress)) : 0;

    // Génération automatique des phases compatibles avec PhaseData
    const generatePhases = (projectItem: any): any[] => {
      const phases: any[] = [];

      // Déterminer le type de phase basé sur le statut
      let phaseType = "construction";
      let phaseStatus: "not_started" | "in_progress" | "completed" | "delayed" =
        "not_started";

      const statusLower = mappedStatus.toLowerCase();
      if (statusLower.includes("attente") || statusLower === "planifié") {
        phaseType = "planning";
        phaseStatus = "not_started";
      } else if (statusLower.includes("cours") || statusLower.includes("construction")) {
        phaseType = "construction";
        phaseStatus = progress > 0 ? "in_progress" : "not_started";
      } else if (statusLower.includes("inspection")) {
        phaseType = "inspection";
        phaseStatus = "in_progress";
      } else if (statusLower.includes("terminé") || statusLower.includes("clôture")) {
        phaseType = "closure";
        phaseStatus = "completed";
      }

      // Calculer la durée estimée (en jours)
      const startDate = new Date(projectItem.startDate);
      const endDate = new Date(projectItem.endDate);
      const estimatedDuration = Math.max(
        1,
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      );

      // Créer la phase principale
      const mainPhase = {
        id: `imported-phase-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`,
        title: projectItem.title || "Phase Principale",
        description:
          projectItem.description ||
          `Phase automatiquement générée pour l'importation`,
        startDate: projectItem.startDate,
        endDate: projectItem.endDate,
        estimatedDuration: estimatedDuration,
        status: phaseStatus,
        budget: projectItem.budget ? projectItem.budget * 0.8 : 0,
        actualCost: 0,
        progress: progress,
        materials: [],
        humanResources: [],
        suppliers: [],
        location: projectItem.location || "",
        notes: `Phase générée automatiquement lors de l'importation. Statut: ${mappedStatus}, Progression: ${progress}%`,
      };

      phases.push(mainPhase);
      return phases;
    };

    const generatedPhases = generatePhases(item);
    console.log(`📊 Phases générées pour ${item.title}:`, generatedPhases);
    
    // Build the import project data with required fields
    const title = item.title || item.nom || item.name || t("projects.import.defaultTitle");
    
    return {
      title,
      description: item.description || item.desc || "",
      location: item.location || item.lieu || item.localisation || "",
      budget: parseFloat(item.budget || item.cout || item.montant || "0"),
      startDate:
        item.startDate ||
        item.dateDebut ||
        item.start_date ||
        new Date().toISOString().split("T")[0],
      endDate: item.endDate || item.dateFin || item.end_date,
      teamSize: parseInt(item.teamSize || item.equipe || item.team_size || "1"),

      // Extended fields
      financingSource: item.financingSource || item.sourceFinancement,
      marketType: item.marketType || item.typeMarche,
      selectionMode: item.selectionMode || item.modeSelection,
      launchDate: item.launchDate || item.dateLancement,
      attributionDate: item.attributionDate || item.dateAttribution,
      projectReference: item.projectReference || item.reference,
      mainContractor: item.mainContractor || item.contractor,
      allowsInitialPayment: item.allowsInitialPayment || false,
      initialPaymentPercentage: parseFloat(
        item.initialPaymentPercentage || "0"
      ),

      // Classification fields
      category: item.category || item.categorie,
      subCategory: item.subCategory || item.sousCategorie,
      priorityLevel: item.priorityLevel || item.niveauPriorite,
      riskLevel: item.riskLevel || item.niveauRisque,
      environmentalImpact:
        item.environmentalImpact || item.impactEnvironnemental,
      sustainabilityScore: item.sustainabilityScore
        ? parseFloat(item.sustainabilityScore)
        : undefined,

      // Additional data (cast to ProjectStatus after validation)
      status: mappedStatus as any,
      progress: progress,
      thumbnail: item.thumbnail,

      // Related entities (will be processed separately)
      milestones: item?.milestones,
      documents: item?.documents,
      stakeholders: item?.stakeholders,
      inspections: item?.inspections,
      risks: item?.risks,
      tasks: item?.tasks,
      payments: item?.payments,

      // PHASES GÉNÉRÉES AUTOMATIQUEMENT - compatibles avec PhaseData
      phases: generatedPhases,
      plannedPhases: generatedPhases,

      constructionMilestones: item?.constructionMilestones,
      expenses: item?.expenses,
      resources: item?.resources,
    };
  };
  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setImportProgress(0);

    try {
      // Parse file
      console.log("Starting file parsing...");
      setImportProgress(25);
      const rawData = await parseFile(selectedFile);
      const parsedProjectCount = Array.isArray(rawData)
        ? rawData.length
        : Array.isArray(rawData?.projects)
          ? rawData.projects.length
          : 0;
      console.log("File parsed successfully, projects:", parsedProjectCount);

      if (!rawData || rawData.length === 0) {
        throw new Error(t("projects.import.noData"));
      }

      setImportProgress(50);

      const dataset = Array.isArray(rawData)
        ? { projects: rawData }
        : rawData;
      const importResult = await projectImportService.importDataset(dataset);
      const errors = importResult.errors.map(
        (error) => `${t("projects.import.line")} ${error.row}: ${error.message}`,
      );
      const totalProcessed = importResult.imported;
      const message = `${totalProcessed} ${t("projects.import.projectsImported")}` +
        (importResult.failed > 0 ? ` (${importResult.failed} ${t("projects.import.errors")})` : "");

      const result: ImportResult = {
        success: totalProcessed > 0,
        message,
        importedCount: totalProcessed,
        errors: errors.length > 0 ? errors : undefined,
      };

      setImportResult(result);
      onImportComplete?.(result);

      if (result.success) {
        toast({
          title: t("projects.import.success"),
          description: result.message,
        });
      }

      console.log("🎉 IMPORTATION TERMINÉE:", result);
    } catch (error) {
      console.error("Import error:", error);
      const result: ImportResult = {
        success: false,
        message:
          error instanceof Error ? error.message : t("projects.import.error"),
        errors: [
          error instanceof Error ? error.message : JSON.stringify(error),
        ],
      };
      setImportResult(result);
      toast({
        title: t("projects.import.error"),
        description: result.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const { content, mimeType, filename } = projectImportTemplateService.serialize(
      templateFormat,
      { referentialCode: templateReferential, language: "fr", withRelations: true },
    );
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t("projects.import.fileImport")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t("projects.import.supportedFormats")}: Excel (.xlsx, .xls), JSON
            (.json), CSV (.csv).
            {t("projects.import.maxSize")}:{" "}
            {formatFileSize(IMPORT_OPTIONS.maxFileSize || 10 * 1024 * 1024)}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              {t("projects.import.importMode")}
            </Label>
            <RadioGroup
              value={importMode}
              onValueChange={(value) => setImportMode(value as ImportMode)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="create" id="mode-create" />
                <Label htmlFor="mode-create" className="cursor-pointer">
                  {t("projects.import.modeCreate")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="update" id="mode-update" />
                <Label htmlFor="mode-update" className="cursor-pointer">
                  {t("projects.import.modeUpdate")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="patch" id="mode-patch" />
                <Label htmlFor="mode-patch" className="cursor-pointer">
                  {t("projects.import.modePatch")}
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-2">
              {importMode === "create" && t("projects.import.modeCreateDesc")}
              {importMode === "update" && t("projects.import.modeUpdateDesc")}
              {importMode === "patch" && t("projects.import.modePatchDesc")}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <Label className="text-sm font-medium">
              {t("projects.import.downloadTemplate")}
            </Label>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Référentiel projet</Label>
                <Select
                  value={templateReferential}
                  onValueChange={(v) => setTemplateReferential(v as ReferentialType)}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {referentialOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Format</Label>
                <Select
                  value={templateFormat}
                  onValueChange={(v) => setTemplateFormat(v as TemplateFormat)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (complet)</SelectItem>
                    <SelectItem value="csv">CSV (à plat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t("projects.import.downloadTemplate")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Le modèle JSON contient les phases, jalons, tâches et lignes DQE issues du
              référentiel sélectionné (codes métier dans <code>phases[].code</code>). Le CSV ne
              couvre que les champs projet à plat.
            </p>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium">
                  {t("projects.import.selectFile")}
                </span>
                <Input
                  ref={fileInputRef}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".xlsx,.xls,.json,.csv"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {selectedFile.type.includes("excel") ||
              selectedFile.type.includes("spreadsheet") ? (
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
              ) : (
                <FileText className="h-5 w-5 text-blue-600" />
              )}
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {importing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("projects.import.importing")}...</span>
              <span>{importProgress}%</span>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        )}

        {importResult && (
          <Alert
            className={
              importResult.success
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }
          >
            {importResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={
                importResult.success ? "text-green-800" : "text-red-800"
              }
            >
              {importResult.message}
              {importResult.errors && importResult.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">
                    {t("projects.import.detailedErrors")} (
                    {importResult.errors.length})
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="ml-4">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={!selectedFile || importing}
            className="flex-1"
          >
            {importing
              ? t("projects.import.importing")
              : t("projects.import.importProjects")}
          </Button>
          {selectedFile && (
            <Button
              variant="outline"
              onClick={clearSelection}
              disabled={importing}
            >
              {t("common.cancel")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
