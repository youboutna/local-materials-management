
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  X,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImportFile, ImportOptions, ImportResult } from '@/types/project';
import { ProjectService } from '@/services/ProjectService';
import { ProjectFormDTO } from '@/types/dto';
import { useLanguage } from '@/contexts/LanguageContext';
import * as XLSX from 'xlsx';

type ImportMode = 'create' | 'update' | 'patch';

const IMPORT_OPTIONS: ImportOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/json', // .json
    'text/csv' // .csv
  ]
};

interface ProjectFileImporterProps {
  onImportComplete?: (result: ImportResult) => void;
}

export default function ProjectFileImporter({ onImportComplete }: ProjectFileImporterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('create');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const projectService = new ProjectService();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > IMPORT_OPTIONS.maxFileSize) {
      return `${t('projects.import.fileTooLarge')} ${formatFileSize(IMPORT_OPTIONS.maxFileSize)}`;
    }

    if (!IMPORT_OPTIONS.allowedFormats.includes(file.type)) {
      return t('projects.import.unsupportedFormat');
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: t('projects.import.invalidFile'),
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
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(t('projects.import.excelReadError')));
        }
      };
      reader.onerror = () => reject(new Error(t('projects.import.fileReadError')));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseJsonFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          resolve(Array.isArray(data) ? data : [data]);
        } catch (error) {
          reject(new Error(t('projects.import.invalidJson')));
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
          const lines = content.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          const data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',');
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = values[index]?.trim() || '';
              });
              return obj;
            });
          
          resolve(data);
        } catch (error) {
          reject(new Error(t('projects.import.csvReadError')));
        }
      };
      reader.readAsText(file);
    });
  };

  const parseFile = async (file: File): Promise<any[]> => {
    switch (file.type) {
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        return parseExcelFile(file);
      case 'application/json':
        return parseJsonFile(file);
      case 'text/csv':
        return parseCsvFile(file);
      default:
        throw new Error(t('projects.import.unsupportedFormat'));
    }
  };

  const transformToProjectData = (item: any): ProjectFormDTO => {
    return {
      title: item.title || item.nom || item.name || t('projects.import.defaultTitle'),
      description: item.description || item.desc || '',
      location: item.location || item.lieu || item.localisation || '',
      budget: parseFloat(item.budget || item.cout || item.montant || '0'),
      startDate: item.startDate || item.dateDebut || item.start_date || new Date().toISOString().split('T')[0],
      endDate: item.endDate || item.dateFin || item.end_date,
      teamSize: parseInt(item.teamSize || item.equipe || item.team_size || '1'),
      coordinates: item.coordinates || (item.latitude && item.longitude ? {
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude)
      } : undefined),
      
      // Extended fields
      financingSource: item.financingSource || item.sourceFinancement,
      marketType: item.marketType || item.typeMarche,
      selectionMode: item.selectionMode || item.modeSelection,
      launchDate: item.launchDate || item.dateLancement,
      attributionDate: item.attributionDate || item.dateAttribution,
      projectReference: item.projectReference || item.reference,
      mainContractor: item.mainContractor || item.contractor,
      allowsInitialPayment: item.allowsInitialPayment || false,
      initialPaymentPercentage: parseFloat(item.initialPaymentPercentage || '0')
    };
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setImportProgress(0);

    try {
      // Parse file
      console.log('Starting file parsing...');
      setImportProgress(25);
      const rawData = await parseFile(selectedFile);
      console.log('File parsed successfully, rows:', rawData.length);
      
      if (!rawData || rawData.length === 0) {
        throw new Error(t('projects.import.noData'));
      }

      setImportProgress(50);

      // Transform and import projects
      let importedCount = 0;
      let updatedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rawData.length; i++) {
        try {
          const projectData = transformToProjectData(rawData[i]);
          const projectId = rawData[i].id;
          
          if (importMode === 'create') {
            console.log('Creating project:', projectData.title);
            await projectService.createProject(projectData);
            importedCount++;
          } else if (importMode === 'update' || importMode === 'patch') {
            // Try to find existing project by ID or reference
            if (projectId) {
              console.log(`${importMode === 'update' ? 'Updating' : 'Patching'} project:`, projectData.title);
              
              if (importMode === 'update') {
                // Full update - replace all fields
                await projectService.updateProject(projectId, projectData);
              } else {
                // Patch - only update provided fields
                const fieldsToUpdate: Partial<ProjectFormDTO> = {};
                Object.keys(rawData[i]).forEach(key => {
                  if (rawData[i][key] !== undefined && rawData[i][key] !== null && rawData[i][key] !== '') {
                    const value = projectData[key as keyof ProjectFormDTO];
                    if (value !== undefined) {
                      (fieldsToUpdate as any)[key] = value;
                    }
                  }
                });
                await projectService.updateProject(projectId, fieldsToUpdate);
              }
              updatedCount++;
            } else {
              // No ID provided, create new project
              console.log('No ID found, creating project:', projectData.title);
              await projectService.createProject(projectData);
              importedCount++;
            }
          }
        } catch (error) {
          const errorMsg = `${t('projects.import.line')} ${i + 1}: ${error instanceof Error ? error.message : t('common.error')}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
        setImportProgress(50 + (i / rawData.length) * 50);
      }

      const totalProcessed = importedCount + updatedCount;
      let message = '';
      if (importMode === 'create') {
        message = `${importedCount} ${t('projects.import.projectsImported')}`;
      } else {
        message = `${importedCount} ${t('projects.import.projectsCreated')}, ${updatedCount} ${t('projects.import.projectsUpdated')}`;
      }
      if (errors.length > 0) {
        message += ` (${errors.length} ${t('projects.import.errors')})`;
      }

      const result: ImportResult = {
        success: totalProcessed > 0,
        message,
        importedCount: totalProcessed,
        errors: errors.length > 0 ? errors : undefined
      };

      setImportResult(result);
      onImportComplete?.(result);

      if (result.success) {
        toast({
          title: t('projects.import.success'),
          description: result.message,
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      const result: ImportResult = {
        success: false,
        message: error instanceof Error ? error.message : t('projects.import.error'),
        errors: [error instanceof Error ? error.message : t('common.error')]
      };
      
      setImportResult(result);
      toast({
        title: t('projects.import.error'),
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
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        id: "00000000-0000-0000-0000-000000000000",
        title: t('projects.import.exampleProject'),
        description: t('projects.import.exampleDescription'),
        location: "Nouakchott",
        budget: 50000000,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        teamSize: 5,
        latitude: 18.0735,
        longitude: -15.9582,
        financingSource: "État",
        marketType: "Public",
        selectionMode: "Appel d'offres",
        launchDate: "2025-01-15",
        attributionDate: "2025-02-01",
        projectReference: "PRJ-2025-001",
        mainContractor: "Entreprise Exemple SA",
        allowsInitialPayment: true,
        initialPaymentPercentage: 15,
        status: "en cours",
        progress: 25
      }
    ];

    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_projets.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t('projects.import.fileImport')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('projects.import.supportedFormats')}: Excel (.xlsx, .xls), JSON (.json), CSV (.csv). 
            {t('projects.import.maxSize')}: {formatFileSize(IMPORT_OPTIONS.maxFileSize)}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              {t('projects.import.importMode')}
            </Label>
            <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as ImportMode)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="create" id="mode-create" />
                <Label htmlFor="mode-create" className="cursor-pointer">
                  {t('projects.import.modeCreate')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="update" id="mode-update" />
                <Label htmlFor="mode-update" className="cursor-pointer">
                  {t('projects.import.modeUpdate')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="patch" id="mode-patch" />
                <Label htmlFor="mode-patch" className="cursor-pointer">
                  {t('projects.import.modePatch')}
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-2">
              {importMode === 'create' && t('projects.import.modeCreateDesc')}
              {importMode === 'update' && t('projects.import.modeUpdateDesc')}
              {importMode === 'patch' && t('projects.import.modePatchDesc')}
            </p>
          </div>

          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t('projects.import.downloadTemplate')}
          </Button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium">
                  {t('projects.import.selectFile')}
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
              {selectedFile.type.includes('excel') || selectedFile.type.includes('spreadsheet') ? (
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
              ) : (
                <FileText className="h-5 w-5 text-blue-600" />
              )}
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {importing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('projects.import.importing')}...</span>
              <span>{importProgress}%</span>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        )}

        {importResult && (
          <Alert className={importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {importResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={importResult.success ? 'text-green-800' : 'text-red-800'}>
              {importResult.message}
              {importResult.errors && importResult.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">
                    {t('projects.import.detailedErrors')} ({importResult.errors.length})
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="ml-4">• {error}</li>
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
            {importing ? t('projects.import.importing') : t('projects.import.importProjects')}
          </Button>
          {selectedFile && (
            <Button
              variant="outline"
              onClick={clearSelection}
              disabled={importing}
            >
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
