import { ProjectImportExportService } from '@/application/services/ProjectImportExportService';
import {
  projectImportTemplateService,
  type TemplateFormat,
} from '@/application/services/ProjectImportTemplateService';
import type { ReferentialType } from '@/config/referentials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/contexts/LanguageContext";
import { ImportOptions, ImportResult } from "@/dtos/entities/ProjectReportDTO";
import { useToast } from "@/hooks/use-toast";
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
import { T } from '@/components/i18n/T';
import { PlanningImportPreview } from '@/components/projects/PlanningImportPreview';
import { PlanningWorkbookPreview } from '@/components/projects/PlanningWorkbookPreview';
import type { PlanningWorkbookDTO } from '@/dtos/entities/PlanningWorkbookDTO';

type ImportMode = "create" | "update" | "patch";

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
  const [workbook, setWorkbook] = useState<PlanningWorkbookDTO>();
  const [reading, setReading] = useState(false);
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importDetails, setImportDetails] = useState<Record<string, number> | null>(null);
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
        IMPORT_OPTIONS.maxFileSize
      )}`;
    }

    if (IMPORT_OPTIONS.allowedFormats && !IMPORT_OPTIONS.allowedFormats.includes(file.type) && !/\.(xlsx|xls|json|csv)$/i.test(file.name)) {
      return t("projects.import.unsupportedFormat");
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) { toast({ title: t("projects.import.invalidFile"), description: validationError, variant: "destructive" }); return; }
    setSelectedFile(file); setImportResult(null); setImportDetails(null); setWorkbook(undefined); setSourceFiles([file]); setReading(true);
    try {
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const source = await projectImportTemplateService.readWorkbook(file);
        if (projectImportTemplateService.isPlanningWorkbook(source)) setWorkbook(source);
      }
    } catch (cause) {
      toast({ title: t('projects.import.error'), description: cause instanceof Error ? cause.message : t('common.error'), variant: 'destructive' });
    } finally { setReading(false); }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setImportProgress(0);

    try {
      // Parse file
      console.log("Starting file parsing...");
      setImportProgress(25);
      const rawData = await projectImportTemplateService.readProjectDataset(selectedFile);
      if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
        throw new Error(t("projects.import.noData"));
      }

      setImportProgress(50);

      const dataset = Array.isArray(rawData)
        ? { projects: rawData }
        : rawData;
      const serviceMode =
        importMode === "create"
          ? "create"
          : importMode === "update"
            ? "upsert"
            : "partial_update";
      const importResult = await projectImportService.importDataset(dataset, {
        mode: serviceMode,
        continueOnError: true,
      });
      if (importResult.createdIds.length === 1 && sourceFiles.length) {
        try { await projectImportTemplateService.archiveSources(importResult.createdIds[0], sourceFiles); }
        catch (cause) { importResult.errors.push({ row: 0, title: t('planning.source'), message: cause instanceof Error ? cause.message : t('common.error') }); }
      }
      const errors = importResult.errors.map(
        (error) => `${t("projects.import.line")} ${error.row}: ${error.message}`,
      );
      const totalProcessed = importResult.imported;
      const message = `${totalProcessed} ${t("projects.import.projectsImported")}` +
        (importResult.failed > 0 ? ` (${importResult.failed} ${t("projects.import.errors")})` : "");

      const result: ImportResult = {
        success: totalProcessed > 0 && importResult.failed === 0 && errors.length === 0,
        message,
        importedCount: totalProcessed,
        imported: totalProcessed,
        failed: importResult.failed,
        skipped: importResult.skipped,
        errors: errors.length > 0 ? errors : undefined,
      };
      setImportDetails(importResult.details ?? null);

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
    setWorkbook(undefined);
    setSourceFiles([]);
    setSelectedFile(null);
    setImportResult(null);
    setImportDetails(null);
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
    <section className="min-w-0 space-y-4">
        {workbook && <PlanningWorkbookPreview key={workbook.filename} source={workbook} referentialCode={templateReferential} onSource={file => setSourceFiles(files => [...files.filter(source => source.name !== file.name), file])} onPrepared={file => { setSelectedFile(file); setWorkbook(undefined); setImportResult(null); }} />}
        <PlanningImportPreview referentialCode={templateReferential} onPrepared={file=>{setSelectedFile(file);setImportResult(null);}} />
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
              className="flex flex-wrap gap-4"
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
                <Label className="text-xs text-muted-foreground">{t('referential.project')}</Label>
                <Select
                  value={templateReferential}
                  onValueChange={(v) => setTemplateReferential(v as ReferentialType)}
                >
                  <SelectTrigger className="w-full sm:w-[280px]">
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
                <Label className="text-xs text-muted-foreground"><T k="auto.projectfileimporter.format" fallback="Format" /></Label>
                <Select
                  value={templateFormat}
                  onValueChange={(v) => setTemplateFormat(v as TemplateFormat)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json"><T k="auto.projectfileimporter.json_complet" fallback="JSON (complet)" /></SelectItem>
                    <SelectItem value="csv"><T k="auto.projectfileimporter.csv_a_plat" fallback="CSV (à plat)" /></SelectItem>
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

        <div className="border-2 border-dashed border-border rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
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
                  disabled={reading || importing}
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {selectedFile.type.includes("excel") ||
              selectedFile.type.includes("spreadsheet") ? (
                <FileSpreadsheet className="h-5 w-5 text-success" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
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
                ? "border-success/30 bg-success-soft"
                : "border-destructive/30 bg-destructive/10"
            }
          >
            {importResult.success ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription
              className={
                importResult.success ? "text-success" : "text-destructive"
              }
            >
              {importResult.message}
              {importDetails && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {Object.entries(importDetails)
                    .filter(([, value]) => typeof value === "number")
                    .map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-md border border-border bg-background/60 px-2 py-0.5 text-foreground"
                      >
                        {t(`projects.import.details.${key}`)}: {value}
                      </span>
                    ))}
                </div>
              )}
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
            disabled={!selectedFile || importing || reading || !!workbook}
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
    </section>
  );
}
