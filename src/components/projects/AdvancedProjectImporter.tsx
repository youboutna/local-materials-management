// src/components/projects/AdvancedProjectImporter.tsx
//
// Import avancé : QField/QGIS (GeoJSON, KML), MS Project (XML).
// Aligné sur ProjectFileImporter : passe par ProjectFileImportOrchestrator.

import { ProjectFileImportOrchestrator } from '@/application/services/ProjectFileImportOrchestrator';
import {
  projectImportTemplateService,
  type TemplateFormat,
} from '@/application/services/ProjectImportTemplateService';
import type { ReferentialType } from '@/config/referentials';
import { T } from '@/components/i18n/T';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ImportResult } from '@/dtos/entities/ProjectReportDTO';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  Map,
  Upload,
  X,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';

type ImportMode = 'create' | 'update' | 'patch';

interface AdvancedProjectImporterProps {
  onImportComplete?: (result: ImportResult) => void;
}

const ACCEPTED_EXTENSIONS = '.geojson,.json,.kml,.xml';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export default function AdvancedProjectImporter({ onImportComplete }: AdvancedProjectImporterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importDetails, setImportDetails] = useState<Record<string, number> | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('create');
  const [templateReferential, setTemplateReferential] = useState<ReferentialType>('CUSTOM_STANDARD');
  const [templateFormat, setTemplateFormat] = useState<TemplateFormat>('json');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const orchestrator = useMemo(() => new ProjectFileImportOrchestrator(), []);
  const referentialOptions = useMemo(
    () => projectImportTemplateService.listReferentials('fr'),
    [],
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: t('projects.import.invalidFile'),
        description: `${t('projects.import.fileTooLarge')} ${formatFileSize(MAX_FILE_SIZE)}`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    setImportDetails(null);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setImportProgress(10);

    try {
      const serviceMode: 'create' | 'upsert' | 'partial_update' =
        importMode === 'create' ? 'create'
        : importMode === 'update' ? 'upsert'
        : 'partial_update';

      setImportProgress(40);

      const { raw, ui } = await orchestrator.importFromFile(selectedFile, {
        mode: serviceMode,
        continueOnError: true,
        referentialCode: undefined,
        language: 'fr',
      });

      setImportProgress(100);
      setImportDetails(raw.details ?? null);
      setImportResult(ui);
      onImportComplete?.(ui);

      if (ui.success) {
        toast({
          title: t('projects.import.success'),
          description: ui.message,
        });
      }
    } catch (error) {
      console.error('[AdvancedProjectImporter] Import error:', error);
      const result: ImportResult = {
        success: false,
        message: error instanceof Error ? error.message : t('projects.import.error'),
        errors: [error instanceof Error ? error.message : String(error)],
      };
      setImportResult(result);
      toast({
        title: t('projects.import.error'),
        description: result.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setImportResult(null);
    setImportDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const { content, mimeType, filename } = projectImportTemplateService.serialize(
      templateFormat,
      { referentialCode: templateReferential, language: 'fr', withRelations: true },
    );
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="h-5 w-5 text-muted-foreground" />;
    const name = selectedFile.name.toLowerCase();
    if (name.endsWith('.geojson') || name.endsWith('.kml')) {
      return <Map className="h-5 w-5 text-primary" />;
    }
    if (name.endsWith('.xml')) {
      return <Calendar className="h-5 w-5 text-success" />;
    }
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          <T k="auto.advancedprojectimporter.import_avance" fallback="Import Avancé (QField/QGIS, MS Project)" />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="info">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-2">
            <TabsTrigger value="info">
              <T k="auto.advancedprojectimporter.information" fallback="Information" />
            </TabsTrigger>
            <TabsTrigger value="templates">
              <T k="auto.advancedprojectimporter.templates" fallback="Templates" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>
                  <T k="auto.advancedprojectimporter.formats_supportes" fallback="Formats supportés :" />
                </strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    <strong>QField/QGIS:</strong> GeoJSON (.geojson), KML (.kml)
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <strong>MS Project:</strong> XML (.xml)
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-primary/10 dark:bg-blue-950/30 border border-primary/30 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                QField/QGIS - Données terrain
              </h3>
              <p className="text-sm text-primary dark:text-blue-200">
                Importez vos relevés terrain depuis QField. Les coordonnées GPS sont automatiquement
                extraites de la géométrie et les zones d'intervention sont créées depuis les polygones.
              </p>
            </div>

            <div className="bg-success-soft dark:bg-success/30 border border-success/30 dark:border-success rounded-lg p-4">
              <h3 className="font-medium text-success dark:text-success-foreground mb-2">
                MS Project - Planification
              </h3>
              <p className="text-sm text-success dark:text-success-foreground">
                Importez vos projets depuis Microsoft Project (XML). La hiérarchie des tâches est
                préservée : niveau 1 → phases, niveau 2 → étapes, niveau 3+ → tâches.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-3">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <Label className="text-sm font-medium">
                <T k="auto.advancedprojectimporter.telecharger_modele" fallback="Télécharger un modèle" />
              </Label>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    <T k="auto.advancedprojectimporter.referentiel" fallback="Référentiel" />
                  </Label>
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
                  <Label className="text-xs text-muted-foreground">
                    <T k="auto.projectfileimporter.format" fallback="Format" />
                  </Label>
                  <Select
                    value={templateFormat}
                    onValueChange={(v) => setTemplateFormat(v as TemplateFormat)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON (complet)</SelectItem>
                      <SelectItem value="csv">CSV (à plat)</SelectItem>
                      <SelectItem value="geojson">GeoJSON (QField)</SelectItem>
                      <SelectItem value="kml">KML (QGIS)</SelectItem>
                      <SelectItem value="msproject-xml">MS Project XML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <T k="auto.advancedprojectimporter.telecharger" fallback="Télécharger" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            {t('projects.import.importMode')}
          </Label>
          <RadioGroup
            value={importMode}
            onValueChange={(value) => setImportMode(value as ImportMode)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="create" id="adv-mode-create" />
              <Label htmlFor="adv-mode-create" className="cursor-pointer">
                {t('projects.import.modeCreate')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="update" id="adv-mode-update" />
              <Label htmlFor="adv-mode-update" className="cursor-pointer">
                {t('projects.import.modeUpdate')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="patch" id="adv-mode-patch" />
              <Label htmlFor="adv-mode-patch" className="cursor-pointer">
                {t('projects.import.modePatch')}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-4">
              <label htmlFor="advanced-file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium">
                  <T
                    k="auto.advancedprojectimporter.selectionnez_un_fichier"
                    fallback="Sélectionnez un fichier (GeoJSON, KML, XML)"
                  />
                </span>
                <Input
                  ref={fileInputRef}
                  id="advanced-file-upload"
                  name="advanced-file-upload"
                  type="file"
                  className="sr-only"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-muted dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              {getFileIcon()}
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
              <span>
                <T k="auto.advancedprojectimporter.import_en_cours" fallback="Import en cours..." />
              </span>
              <span>{importProgress}%</span>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        )}

        {importResult && (
          <Alert
            className={
              importResult.success
                ? 'border-success/30 bg-success-soft'
                : 'border-destructive/30 bg-destructive/10'
            }
          >
            {importResult.success ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription
              className={importResult.success ? 'text-success' : 'text-destructive'}
            >
              {importResult.message}

              {importDetails && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {Object.entries(importDetails)
                    .filter(([, value]) => typeof value === 'number' && value > 0)
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
                    {t('projects.import.detailedErrors')} ({importResult.errors.length})
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
              ? t('projects.import.importing')
              : t('projects.import.importProjects')}
          </Button>
          {selectedFile && (
            <Button variant="outline" onClick={clearSelection} disabled={importing}>
              <T k="auto.advancedprojectimporter.annuler" fallback="Annuler" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}