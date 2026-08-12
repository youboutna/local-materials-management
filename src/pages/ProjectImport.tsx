/**
 * ProjectImport — page d'import/export projets.
 * Typage strict via ImportResult DTO, plus de @ts-nocheck (Lot 1).
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectImporter2025 from "@/components/projects/ProjectImporter2025";
import ProjectFileImporter from "@/components/projects/ProjectFileImporter";
import AdvancedProjectImporter from "@/components/projects/AdvancedProjectImporter";
import ProjectExporter from "@/components/projects/ProjectExporter";
import { Database, FileSpreadsheet, Upload, Download } from "lucide-react";
import type { ImportResult as ReportImportResult } from "@/dtos/entities/ProjectReportDTO";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const ProjectImport = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const handleImportComplete = (result: ReportImportResult) => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["projects-hex"] });
    const successCount = (result as { successCount?: number; imported?: number })?.successCount
      ?? (result as { imported?: number })?.imported;
    toast.success(
      successCount != null
        ? `Import terminé : ${successCount} projet(s) importé(s)`
        : "Import terminé avec succès"
    );
  };

  return (
    <div className="container mx-auto px-4 py-14 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">
            {t("projects.importExport.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("projects.importExport.description")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="file-import" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="file-import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t("projects.importExport.fileImport")}
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            QField/MS Project
          </TabsTrigger>
          <TabsTrigger value="predefined" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {t("projects.importExport.predefinedProjects")}
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t("projects.importExport.export")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file-import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                {t("projects.import.fileImport")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t("projects.import.fileImportDescription")}
              </p>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  {t("projects.import.importantInfo")}:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>
                    • {t("projects.import.supportedFormats")}: Excel (.xlsx,
                    .xls), JSON (.json), CSV (.csv)
                  </li>
                  <li>• {t("projects.import.maxSize")}: 10 MB</li>
                  <li>
                    • {t("projects.import.requiredColumns")}: title,
                    description, location
                  </li>
                  <li>
                    • {t("projects.import.optionalColumns")}: budget, startDate,
                    endDate, teamSize, coordinates, phases, tasks, inspections,
                    risks, payments
                  </li>
                </ul>
              </div>

              <ProjectFileImporter onImportComplete={handleImportComplete} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <AdvancedProjectImporter onImportComplete={handleImportComplete} />
        </TabsContent>

        <TabsContent value="predefined" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                {t("projects.importExport.predefined2025")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t("projects.importExport.predefinedDescription")}
              </p>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  {t("projects.importExport.includedProjects")}:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• {t("projects.importExport.infrastructureProjects")}</li>
                  <li>• {t("projects.importExport.diverseFunding")}</li>
                  <li>• {t("projects.importExport.variedMarkets")}</li>
                  <li>• {t("projects.importExport.timeline2025")}</li>
                </ul>
              </div>

              <ProjectImporter2025 />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                {t("projects.export.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t("projects.export.description")}
              </p>

              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  {t("projects.export.availableFormats")}:
                </h3>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>
                    • <strong>JSON</strong>: {t("projects.export.jsonDesc")}
                  </li>
                  <li>
                    • <strong>Excel</strong>: {t("projects.export.excelDesc")}
                  </li>
                  <li>
                    • <strong>CSV</strong>: {t("projects.export.csvDesc")}
                  </li>
                </ul>
              </div>

              <ProjectExporter />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectImport;
