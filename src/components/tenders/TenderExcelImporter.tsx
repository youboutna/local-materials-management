
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/hexagonal';
import * as XLSX from 'xlsx';

interface ImportedTender {
  ordre: number;
  objet: string;
  imputation_budgetaire: string;
  type_contrat: string;
  mode_selection: string;
  date_lancement: string;
  date_attribution: string;
}

interface ProcessedTender {
  title: string;
  description: string;
  launch_date: string | null;
  attribution_date: string | null;
  market_type: string;
  selection_mode: string;
  financing_source: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
}

const TenderExcelImporter: React.FC = () => {
  const { toast } = useToast();
  const { getUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportedTender[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: number;
    total: number;
    errorMessages: string[];
  } | null>(null);

  const mapContractType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'Services Courants': 'public',
      'Fournitures': 'public',
      'Travaux': 'public',
      'Prestations intellectuelles': 'public'
    };
    return typeMap[type] || 'public';
  };

  const mapSelectionMode = (mode: string): string => {
    const modeMap: Record<string, string> = {
      'Consultation directe des candidats': 'direct_award',
      'Consultation concurrentielle des candidats': 'open_tender',
      'Mode de Sélection au Moindre Coût (SMC)': 'competitive_dialogue'
    };
    return modeMap[mode] || 'open_tender';
  };

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr || dateStr.trim() === '') return null;
    
    try {
      // Handle DD/MM/YYYY format
      const parts = dateStr.toString().split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      }
      
      // Try parsing as Excel serial date
      const excelDate = parseFloat(dateStr.toString());
      if (!isNaN(excelDate) && excelDate > 1) {
        const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
        if (!isNaN(jsDate.getTime())) {
          return jsDate.toISOString().split('T')[0];
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: 'Format non supporté',
        description: 'Veuillez sélectionner un fichier Excel (.xlsx ou .xls)',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row and process data
      const rows = jsonData.slice(1) as any[][];
      const importedData: ImportedTender[] = rows
        .filter(row => row.length >= 7 && row[0]) // Filter out empty rows
        .map((row, index) => {
          try {
            return {
              ordre: parseInt(row[0]) || (index + 1),
              objet: (row[1] || '').toString().trim(),
              imputation_budgetaire: (row[2] || '').toString().trim(),
              type_contrat: (row[3] || '').toString().trim(),
              mode_selection: (row[4] || '').toString().trim(),
              date_lancement: (row[5] || '').toString().trim(),
              date_attribution: (row[6] || '').toString().trim()
            };
          } catch (error) {
            console.error(`Error processing row ${index + 1}:`, error);
            return null;
          }
        })
        .filter(item => item !== null) as ImportedTender[];

      setPreview(importedData);
      setShowPreview(true);
      
      toast({
        title: 'Fichier analysé',
        description: `${importedData.length} appels d'offres trouvés dans le fichier.`,
      });
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast({
        title: 'Erreur de lecture',
        description: 'Impossible de lire le fichier Excel. Vérifiez le format.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    if (!preview.length) return;

    // Check authentication first
    const { data: { user }, error: authError } = await getUser();
    
    if (authError || !user) {
      toast({
        title: 'Authentification requise',
        description: 'Vous devez être connecté pour importer des appels d\'offres.',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const errorMessages: string[] = [];

    try {
      for (const [index, item] of preview.entries()) {
        try {
          if (!item.objet || item.objet.trim() === '') {
            errorMessages.push(`Ligne ${index + 1}: Objet manquant`);
            errorCount++;
            continue;
          }

          const processedTender: ProcessedTender = {
            title: item.objet.substring(0, 200), // Limit title length
            description: `Ordre: ${item.ordre}\n\nObjet: ${item.objet}\n\nImputation: ${item.imputation_budgetaire}\nType: ${item.type_contrat}\nMode: ${item.mode_selection}`,
            launch_date: parseDate(item.date_lancement),
            attribution_date: parseDate(item.date_attribution),
            market_type: mapContractType(item.type_contrat),
            selection_mode: mapSelectionMode(item.mode_selection),
            financing_source: item.imputation_budgetaire.includes('Source inconnue') ? 'other' : 'state_budget',
            status: 'draft' as const
          };

          console.log(`Importing tender ${index + 1}:`, processedTender);

          const { error } = await supabase
            .from('tenders')
            .insert([processedTender]);

          if (error) {
            console.error(`Error importing tender ${item.ordre}:`, error);
            errorMessages.push(`Ligne ${index + 1} (${item.objet.substring(0, 50)}...): ${error.message}`);
            errorCount++;
          } else {
            successCount++;
            console.log(`Successfully imported tender ${index + 1}`);
          }
        } catch (itemError: any) {
          console.error(`Error processing tender ${item.ordre}:`, itemError);
          errorMessages.push(`Ligne ${index + 1}: ${itemError.message || 'Erreur inconnue'}`);
          errorCount++;
        }
      }

      setImportResults({
        success: successCount,
        errors: errorCount,
        total: preview.length,
        errorMessages
      });

      if (successCount > 0) {
        toast({
          title: 'Import terminé',
          description: `${successCount} appels d'offres importés avec succès${errorCount > 0 ? `, ${errorCount} erreurs` : ''}.`,
        });
      }

      if (errorCount === preview.length) {
        toast({
          title: 'Échec de l\'import',
          description: 'Aucun appel d\'offres n\'a pu être importé. Vérifiez les erreurs ci-dessous.',
          variant: 'destructive',
        });
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Erreur d\'import',
        description: `Une erreur s'est produite: ${error.message || 'Erreur inconnue'}`,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Ordre', 'Objet de la dépense', 'Imputation budgetaire', 'Type de Contrat', 'Mode de Sélection', 'Date de Lancement', "Date d'Attribution"],
      [1, 'Exemple d\'appel d\'offres', 'Budget de l\'État', 'Fournitures', 'Consultation concurrentielle des candidats', '18/03/2025', '27/03/2025']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_appels_offres.xlsx');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Excel des Appels d'Offres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger Template
            </Button>
          </div>

          {file && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Fichier sélectionné:</strong> {file.name}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {showPreview && preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Aperçu des données ({preview.length} éléments)</span>
              <Button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {importing ? 'Import en cours...' : 'Importer tout'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <div className="space-y-2">
                {preview.slice(0, 10).map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.ordre}. {item.objet}</h4>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                          <span><strong>Type:</strong> {item.type_contrat}</span>
                          <span><strong>Mode:</strong> {item.mode_selection}</span>
                          <span><strong>Lancement:</strong> {item.date_lancement}</span>
                          <span><strong>Attribution:</strong> {item.date_attribution}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{item.ordre}
                      </Badge>
                    </div>
                  </div>
                ))}
                {preview.length > 10 && (
                  <p className="text-center text-sm text-gray-500 py-2">
                    ... et {preview.length - 10} autres éléments
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResults.errors === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              Résultats de l'import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                <div className="text-sm text-gray-600">Succès</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{importResults.errors}</div>
                <div className="text-sm text-gray-600">Erreurs</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{importResults.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
            
            {importResults.errorMessages.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Détails des erreurs:</h4>
                <div className="max-h-32 overflow-auto bg-red-50 border border-red-200 rounded p-2">
                  {importResults.errorMessages.map((error, index) => (
                    <div key={index} className="text-xs text-red-700 mb-1">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TenderExcelImporter;
