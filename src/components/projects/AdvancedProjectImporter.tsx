import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  X,
  Download,
  Map,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProjectService } from '@/application/services/ProjectService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectFormDTO } from '@/types/dto';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImportResult } from '@/types/project';
import * as XLSX from 'xlsx';

type ImportMode = 'create' | 'update' | 'patch';

interface AdvancedProjectImporterProps {
  onImportComplete?: (result: ImportResult) => void;
}

export default function AdvancedProjectImporter({ onImportComplete }: AdvancedProjectImporterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('create');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const projectService = new ProjectService(RepositoryFactory.getProjectRepository());

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

    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      toast({
        title: t('projects.import.invalidFile'),
        description: t('projects.import.fileTooLarge') + ' 20 MB',
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
  };

  // Parse GeoJSON (QField/QGIS format)
  const parseGeoJSON = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const geoData = JSON.parse(content);
          
          if (geoData.type === 'FeatureCollection' && geoData.features) {
            const projects = geoData.features.map((feature: any) => {
              const props = feature.properties || {};
              const coords = feature.geometry?.coordinates || [];
              
              return {
                title: props.name || props.title || props.projet || 'Projet importé',
                description: props.description || props.desc || '',
                location: props.location || props.lieu || '',
                budget: parseFloat(props.budget || props.cout || '0'),
                startDate: props.start_date || props.dateDebut || props.startDate,
                endDate: props.end_date || props.dateFin || props.endDate,
                teamSize: parseInt(props.team_size || props.equipe || '1'),
                // Extract coordinates from GeoJSON geometry
                latitude: coords[1] || coords.lat,
                longitude: coords[0] || coords.lng,
                // QField specific fields
                status: props.status || props.statut || 'en attente',
                progress: parseInt(props.progress || props.avancement || '0'),
                financingSource: props.financing_source || props.financement,
                marketType: props.market_type || props.type_marche,
                // Additional metadata
                qfieldId: props.fid || props.id,
                qfieldLayer: props.layer
              };
            });
            resolve(projects);
          } else {
            reject(new Error('Format GeoJSON invalide'));
          }
        } catch (error) {
          reject(new Error('Erreur de lecture du fichier GeoJSON'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsText(file);
    });
  };

  // Parse MS Project XML
  const parseMSProjectXML = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, 'text/xml');
          
          // Check for XML parsing errors
          if (xmlDoc.querySelector('parsererror')) {
            reject(new Error('XML invalide'));
            return;
          }

          const projects: any[] = [];
          const tasks = xmlDoc.querySelectorAll('Task');
          
          // Group tasks into projects (tasks with no parent or summary tasks)
          tasks.forEach((task) => {
            const isSummary = task.querySelector('Summary')?.textContent === '1';
            const outlineLevel = parseInt(task.querySelector('OutlineLevel')?.textContent || '1');
            
            if (outlineLevel === 1 || isSummary) {
              const name = task.querySelector('Name')?.textContent || 'Projet importé';
              const start = task.querySelector('Start')?.textContent;
              const finish = task.querySelector('Finish')?.textContent;
              const percentComplete = task.querySelector('PercentComplete')?.textContent;
              const cost = task.querySelector('Cost')?.textContent;
              const notes = task.querySelector('Notes')?.textContent;
              
              projects.push({
                title: name,
                description: notes || '',
                location: '',
                budget: parseFloat(cost || '0'),
                startDate: start ? new Date(start).toISOString().split('T')[0] : '',
                endDate: finish ? new Date(finish).toISOString().split('T')[0] : '',
                progress: parseInt(percentComplete || '0'),
                teamSize: 1,
                // MS Project specific
                msProjectId: task.querySelector('UID')?.textContent,
                wbs: task.querySelector('WBS')?.textContent
              });
            }
          });
          
          resolve(projects);
        } catch (error) {
          reject(new Error('Erreur de lecture du fichier MS Project XML'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsText(file);
    });
  };

  // Parse KML (alternative QGIS format)
  const parseKML = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parser = new DOMParser();
          const kmlDoc = parser.parseFromString(content, 'text/xml');
          
          const placemarks = kmlDoc.querySelectorAll('Placemark');
          const projects = Array.from(placemarks).map((placemark) => {
            const name = placemark.querySelector('name')?.textContent || 'Projet importé';
            const description = placemark.querySelector('description')?.textContent || '';
            const coordinates = placemark.querySelector('coordinates')?.textContent?.trim().split(',');
            
            // Parse extended data
            const extendedData: any = {};
            placemark.querySelectorAll('Data').forEach((data) => {
              const dataName = data.getAttribute('name');
              const value = data.querySelector('value')?.textContent;
              if (dataName && value) {
                extendedData[dataName] = value;
              }
            });
            
            return {
              title: name,
              description: description,
              location: extendedData.location || extendedData.lieu || '',
              budget: parseFloat(extendedData.budget || extendedData.cout || '0'),
              startDate: extendedData.startDate || extendedData.dateDebut,
              endDate: extendedData.endDate || extendedData.dateFin,
              teamSize: parseInt(extendedData.teamSize || '1'),
              latitude: coordinates ? parseFloat(coordinates[1]) : undefined,
              longitude: coordinates ? parseFloat(coordinates[0]) : undefined,
              status: extendedData.status || 'en attente',
              progress: parseInt(extendedData.progress || '0')
            };
          });
          
          resolve(projects);
        } catch (error) {
          reject(new Error('Erreur de lecture du fichier KML'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsText(file);
    });
  };

  const parseFile = async (file: File): Promise<any[]> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'geojson':
      case 'json':
        // Try GeoJSON first, fall back to regular JSON
        try {
          return await parseGeoJSON(file);
        } catch {
          // Fall back to regular JSON parsing
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
        }
      
      case 'kml':
        return parseKML(file);
      
      case 'xml':
        return parseMSProjectXML(file);
      
      case 'xlsx':
      case 'xls':
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
          reader.readAsArrayBuffer(file);
        });
      
      default:
        throw new Error(t('projects.import.unsupportedFormat'));
    }
  };

  const transformToProjectData = (item: any): ProjectFormDTO => {
    return {
      title: item.title || item.nom || item.name || t('projects.import.defaultTitle'),
      description: item.description || item.desc || '',
      location: item.location || item.lieu || item.localisation || '',
      budget: parseFloat(item.budget || item.cout || item.montant || item.totalCost || '0'),
      startDate: item.startDate || item.dateDebut || item.start_date || new Date().toISOString().split('T')[0],
      endDate: item.endDate || item.dateFin || item.end_date,
      teamSize: parseInt(item.teamSize || item.equipe || item.team_size || '1'),
      coordinates: item.coordinates || (item.latitude && item.longitude ? {
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude)
      } : undefined),
      
      // Project details
      financingSource: item.financingSource || item.sourceFinancement || item.financing_source,
      marketType: item.marketType || item.typeMarche || item.market_type,
      selectionMode: item.selectionMode || item.modeSelection || item.selection_mode,
      launchDate: item.launchDate || item.dateLancement || item.launch_date,
      attributionDate: item.attributionDate || item.dateAttribution || item.attribution_date,
      projectReference: item.projectReference || item.project_reference || item.reference,
      mainContractor: item.mainContractor || item.main_contractor || item.contractor,
      allowsInitialPayment: item.allowsInitialPayment || item.allows_initial_payment || false,
      initialPaymentPercentage: parseFloat(item.initialPaymentPercentage || item.initial_payment_percentage || '0'),
      projectResponsableId: item.projectResponsableId || item.project_responsable_id
    };
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setImportProgress(0);

    try {
      console.log('Starting file parsing...');
      setImportProgress(25);
      const rawData = await parseFile(selectedFile);
      console.log('File parsed successfully, rows:', rawData.length);
      
      if (!rawData || rawData.length === 0) {
        throw new Error(t('projects.import.noData'));
      }

      setImportProgress(50);

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
            if (projectId) {
              console.log(`${importMode === 'update' ? 'Updating' : 'Patching'} project:`, projectData.title);
              
              if (importMode === 'update') {
                await projectService.updateProject(projectId, projectData);
              } else {
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

  const downloadGeoJSONTemplate = () => {
    const template = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "00000000-0000-0000-0000-000000000000",
            name: "Projet Exemple QField",
            description: "Description du projet terrain",
            location: "Nouakchott",
            budget: 50000000,
            start_date: "2025-01-01",
            end_date: "2025-12-31",
            team_size: 5,
            status: "en cours",
            progress: 25,
            financing_source: "État",
            market_type: "Public",
            selection_mode: "Appel d'offres",
            project_reference: "PRJ-2025-001",
            main_contractor: "Entreprise Exemple SA",
            inspections: JSON.stringify([
              {
                inspectionDate: "2025-02-15",
                inspector: "Mohamed Ould Ahmed",
                status: "completed",
                progressAtInspection: 15,
                comments: "Inspection terrain - Travaux conformes"
              }
            ]),
            stakeholders: JSON.stringify([
              {
                name: "Ahmed Ould Mohamed",
                email: "ahmed@example.com",
                phone: "+22212345678",
                role: "Chef de projet terrain",
                isPrimary: true
              }
            ])
          },
          geometry: {
            type: "Point",
            coordinates: [-15.9582, 18.0735] // [longitude, latitude]
          }
        }
      ]
    };

    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_qfield.geojson';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadMSProjectTemplate = () => {
    const template = `<?xml version="1.0" encoding="UTF-8"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Tasks>
    <Task>
      <UID>00000000-0000-0000-0000-000000000000</UID>
      <Name>Projet d'Infrastructure Exemple</Name>
      <Summary>1</Summary>
      <OutlineLevel>1</OutlineLevel>
      <Start>2025-01-01T08:00:00</Start>
      <Finish>2025-12-31T17:00:00</Finish>
      <PercentComplete>25</PercentComplete>
      <Cost>50000000</Cost>
      <Notes>Description détaillée du projet d'infrastructure</Notes>
      <WBS>1</WBS>
      <ExtendedAttribute>
        <FieldName>Reference</FieldName>
        <Value>PRJ-2025-001</Value>
      </ExtendedAttribute>
      <ExtendedAttribute>
        <FieldName>Location</FieldName>
        <Value>Nouakchott</Value>
      </ExtendedAttribute>
      <ExtendedAttribute>
        <FieldName>FinancingSource</FieldName>
        <Value>État</Value>
      </ExtendedAttribute>
      <ExtendedAttribute>
        <FieldName>Inspections</FieldName>
        <Value>[{"inspectionDate":"2025-02-15","inspector":"Mohamed Ould Ahmed","status":"completed","progressAtInspection":15,"comments":"Inspection planification"}]</Value>
      </ExtendedAttribute>
      <ExtendedAttribute>
        <FieldName>Stakeholders</FieldName>
        <Value>[{"name":"Ahmed Ould Mohamed","email":"ahmed@example.com","phone":"+22212345678","role":"Chef de projet","isPrimary":true}]</Value>
      </ExtendedAttribute>
    </Task>
  </Tasks>
</Project>`;

    const dataBlob = new Blob([template], { type: 'text/xml' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_msproject.xml';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Avancé (QField/QGIS, MS Project)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Formats supportés :</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    <strong>QField/QGIS:</strong> GeoJSON (.geojson), KML (.kml)
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <strong>MS Project:</strong> XML (.xml)
                  </li>
                  <li className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <strong>Standard:</strong> Excel (.xlsx, .xls), JSON (.json)
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                QField/QGIS - Données terrain
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Importez vos relevés terrain depuis QField. Les coordonnées GPS sont automatiquement extraites de la géométrie.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                MS Project - Planification
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200">
                Importez vos projets depuis Microsoft Project (format XML). Les tâches principales deviennent des projets.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={downloadGeoJSONTemplate}
                className="flex items-center gap-2 h-auto p-4"
              >
                <Map className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Template QField</div>
                  <div className="text-xs opacity-70">GeoJSON avec coordonnées</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={downloadMSProjectTemplate}
                className="flex items-center gap-2 h-auto p-4"
              >
                <Calendar className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Template MS Project</div>
                  <div className="text-xs opacity-70">XML Microsoft Project</div>
                </div>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            {t('projects.import.importMode')}
          </Label>
          <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as ImportMode)} className="flex gap-4">
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
          <p className="text-xs text-muted-foreground mt-2">
            {importMode === 'create' && t('projects.import.modeCreateDesc')}
            {importMode === 'update' && t('projects.import.modeUpdateDesc')}
            {importMode === 'patch' && t('projects.import.modePatchDesc')}
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="advanced-file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium">
                  Sélectionnez un fichier (GeoJSON, KML, XML, Excel, JSON)
                </span>
                <Input
                  ref={fileInputRef}
                  id="advanced-file-upload"
                  name="advanced-file-upload"
                  type="file"
                  className="sr-only"
                  accept=".geojson,.json,.kml,.xml,.xlsx,.xls"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              {selectedFile.name.endsWith('.geojson') || selectedFile.name.endsWith('.kml') ? (
                <Map className="h-5 w-5 text-blue-600" />
              ) : selectedFile.name.endsWith('.xml') ? (
                <Calendar className="h-5 w-5 text-green-600" />
              ) : (
                <FileText className="h-5 w-5 text-gray-600" />
              )}
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
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
            <Button variant="outline" onClick={clearSelection} disabled={importing}>
              Annuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
