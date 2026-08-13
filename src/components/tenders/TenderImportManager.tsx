import { btpClient } from '@/integrations/supabase/schema-clients';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ImportResult {
  success: number;
  errors: string[];
  data: any[];
}

interface TenderImportManagerProps {
  onImportComplete?: (result: ImportResult) => void;
}

const TenderImportManager = ({ onImportComplete }: TenderImportManagerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        toast({
          title: 'Type de fichier invalide',
          description: 'Veuillez sélectionner un fichier Excel (.xlsx ou .xls).',
          variant: 'destructive',
        });
      }
    }
  };

  const processExcelFile = async (file: File): Promise<any[]> => {
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
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  };

  const validateTenderData = (data: any[]): { valid: any[], errors: string[] } => {
    const valid: any[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because Excel starts at 1 and we skip header
      
      if (!row.title || typeof row.title !== 'string') {
        errors.push(`Ligne ${rowNumber}: Titre manquant ou invalide`);
        return;
      }
      
      if (!row.description || typeof row.description !== 'string') {
        errors.push(`Ligne ${rowNumber}: Description manquante ou invalide`);
        return;
      }

      // Validate status if provided
      if (row.status && !['draft', 'published', 'closed', 'awarded'].includes(row.status)) {
        errors.push(`Ligne ${rowNumber}: Statut invalide (doit être: draft, published, closed, awarded)`);
        return;
      }

      // Validate dates if provided
      if (row.launch_date && isNaN(Date.parse(row.launch_date))) {
        errors.push(`Ligne ${rowNumber}: Date de lancement invalide`);
        return;
      }

      if (row.attribution_date && isNaN(Date.parse(row.attribution_date))) {
        errors.push(`Ligne ${rowNumber}: Date d'attribution invalide`);
        return;
      }

      valid.push({
        title: row.title,
        description: row.description,
        launch_date: row.launch_date ? new Date(row.launch_date).toISOString().split('T')[0] : null,
        attribution_date: row.attribution_date ? new Date(row.attribution_date).toISOString().split('T')[0] : null,
        selection_mode: row.selection_mode || null,
        market_type: row.market_type || null,
        financing_source: row.financing_source || null,
        project_reference: row.project_reference || null,
        status: row.status || 'draft'
      });
    });

    return { valid, errors };
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'Aucun fichier sélectionné',
        description: 'Veuillez sélectionner un fichier Excel à importer.',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    
    try {
      // Process Excel file
      const rawData = await processExcelFile(selectedFile);
      
      if (rawData.length === 0) {
        throw new Error('Le fichier Excel est vide ou ne contient pas de données valides.');
      }

      // Validate data
      const { valid, errors } = validateTenderData(rawData);
      
      let successCount = 0;
      const importErrors: string[] = [...errors];

      // Import valid records
      if (valid.length > 0) {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          
          const { data, error } = await btpClient.from('tenders')
            .insert(valid)
            .select();
          
          if (error) {
            importErrors.push(`Erreur d'insertion en base: ${error.message}`);
          } else {
            successCount = data?.length || 0;
          }
        } catch (dbError: any) {
          importErrors.push(`Erreur de base de données: ${dbError.message}`);
        }
      }

      const result: ImportResult = {
        success: successCount,
        errors: importErrors,
        data: valid
      };

      setImportResult(result);
      onImportComplete?.(result);

      if (successCount > 0) {
        toast({
          title: 'Import réussi',
          description: `${successCount} appel(s) d'offres importé(s) avec succès.`,
        });
      }

      if (importErrors.length > 0) {
        toast({
          title: 'Import avec erreurs',
          description: `${importErrors.length} erreur(s) détectée(s). Consultez les détails ci-dessous.`,
          variant: 'destructive',
        });
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Erreur d\'importation',
        description: error.message || 'Une erreur s\'est produite lors de l\'importation.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        title: 'Exemple - Construction Pont',
        description: 'Construction d\'un pont sur la rivière X',
        launch_date: '2024-01-15',
        attribution_date: '2024-02-15',
        selection_mode: 'Appel d\'offres ouvert',
        market_type: 'Travaux',
        financing_source: 'Budget État',
        project_reference: 'REF-2024-001',
        status: 'published'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Appels_Offres');
    XLSX.writeFile(workbook, 'template_appels_offres.xlsx');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import d'Appels d'Offres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Fichier Excel</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              disabled={importing}
            />
          </div>

          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Télécharger le modèle
            </Button>

            <Button 
              onClick={handleImport} 
              disabled={!selectedFile || importing}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {importing ? 'Importation...' : 'Importer'}
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Format requis:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>title</strong> (obligatoire): Titre de l'appel d'offres</li>
                <li><strong>description</strong> (obligatoire): Description détaillée</li>
                <li><strong>launch_date</strong>: Date de lancement (YYYY-MM-DD)</li>
                <li><strong>attribution_date</strong>: Date d'attribution (YYYY-MM-DD)</li>
                <li><strong>selection_mode</strong>: Mode de sélection</li>
                <li><strong>market_type</strong>: Type de marché</li>
                <li><strong>financing_source</strong>: Source de financement</li>
                <li><strong>project_reference</strong>: Référence du projet</li>
                <li><strong>status</strong>: Statut (draft, published, closed, awarded)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Résultat de l'Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                <div className="text-sm text-green-800">Appels d'offres importés</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                <div className="text-sm text-red-800">Erreurs détectées</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-800 mb-2">Erreurs détectées:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
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

export default TenderImportManager;
