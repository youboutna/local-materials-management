
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { useProjects } from '@/hooks/projects/useProjects';
import { ImportFile, ImportOptions, ImportResult } from '@/types/project';
import * as XLSX from 'xlsx';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { createProject } = useProjects();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > IMPORT_OPTIONS.maxFileSize) {
      return `Le fichier est trop volumineux. Taille maximale autorisée: ${formatFileSize(IMPORT_OPTIONS.maxFileSize)}`;
    }

    if (!IMPORT_OPTIONS.allowedFormats.includes(file.type)) {
      return 'Format de fichier non supporté. Formats autorisés: Excel (.xlsx, .xls), JSON (.json), CSV (.csv)';
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Fichier invalide",
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
          reject(new Error('Erreur lors de la lecture du fichier Excel'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
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
          reject(new Error('Fichier JSON invalide'));
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
          reject(new Error('Erreur lors de la lecture du fichier CSV'));
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
        throw new Error('Format de fichier non supporté');
    }
  };

  const transformToProjectData = (item: any) => {
    return {
      title: item.title || item.nom || item.name || 'Projet importé',
      description: item.description || item.desc || '',
      location: item.location || item.lieu || item.localisation || '',
      status: item.status || item.statut || 'en attente',
      progress: parseInt(item.progress || item.progression || '0'),
      budget: parseFloat(item.budget || item.cout || item.montant || '0'),
      startDate: item.startDate || item.dateDebut || item.start_date || new Date().toISOString().split('T')[0],
      endDate: item.endDate || item.dateFin || item.end_date,
      thumbnail: item.thumbnail || '/img/project-placeholder.jpg',
      teamSize: parseInt(item.teamSize || item.equipe || item.team_size || '1'),
      coordinates: item.coordinates || (item.latitude && item.longitude ? {
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude)
      } : undefined)
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
        throw new Error('Aucune donnée trouvée dans le fichier');
      }

      setImportProgress(50);

      // Transform and import projects
      let importedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rawData.length; i++) {
        try {
          const projectData = transformToProjectData(rawData[i]);
          console.log('Creating project:', projectData.title);
          await createProject(projectData);
          importedCount++;
        } catch (error) {
          const errorMsg = `Ligne ${i + 1}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
        setImportProgress(50 + (i / rawData.length) * 50);
      }

      const result: ImportResult = {
        success: importedCount > 0,
        message: `${importedCount} projet(s) importé(s) avec succès${errors.length > 0 ? ` (${errors.length} erreur(s))` : ''}`,
        importedCount,
        errors: errors.length > 0 ? errors : undefined
      };

      setImportResult(result);
      onImportComplete?.(result);

      if (result.success) {
        toast({
          title: "Import réussi",
          description: result.message,
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      const result: ImportResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'import',
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      };
      
      setImportResult(result);
      toast({
        title: "Erreur d'import",
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
        title: "Exemple Projet 1",
        description: "Description du projet exemple",
        location: "Nouakchott",
        status: "en cours",
        progress: 25,
        budget: 50000000,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        teamSize: 5,
        latitude: 18.0735,
        longitude: -15.9582
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
          Import de projets par fichier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Formats supportés: Excel (.xlsx, .xls), JSON (.json), CSV (.csv). 
            Taille maximale: {formatFileSize(IMPORT_OPTIONS.maxFileSize)}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Télécharger un modèle
          </Button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Sélectionnez un fichier ou glissez-le ici
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
              <span>Import en cours...</span>
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
                    Erreurs détaillées ({importResult.errors.length})
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
            {importing ? 'Import en cours...' : 'Importer les projets'}
          </Button>
          {selectedFile && (
            <Button
              variant="outline"
              onClick={clearSelection}
              disabled={importing}
            >
              Annuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
