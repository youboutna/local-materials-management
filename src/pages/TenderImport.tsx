
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Info } from 'lucide-react';
import TenderExcelImporter from '@/components/tenders/TenderExcelImporter';

const TenderImport = () => {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import d'Appels d'Offres</h1>
        <p className="text-gray-600 mt-2">Importer les appels d'offres depuis un fichier Excel</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Format du fichier Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p>Le fichier Excel doit contenir les colonnes suivantes (dans cet ordre) :</p>
            <ol>
              <li><strong>Ordre</strong> - Numéro d'ordre de l'appel d'offres</li>
              <li><strong>Objet de la dépense</strong> - Description de l'appel d'offres</li>
              <li><strong>Imputation budgetaire</strong> - Source de financement</li>
              <li><strong>Type de Contrat</strong> - Type de marché (Services Courants, Fournitures, Travaux, etc.)</li>
              <li><strong>Mode de Sélection</strong> - Procédure de sélection</li>
              <li><strong>Date de Lancement</strong> - Date de publication (format DD/MM/YYYY)</li>
              <li><strong>Date d'Attribution</strong> - Date d'attribution (format DD/MM/YYYY)</li>
            </ol>
            
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Vous pouvez télécharger un template Excel pour vous assurer du bon format.
              </p>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Attention:</strong> Tous les appels d'offres importés seront créés avec le statut "Brouillon". 
                Vous pourrez les modifier individuellement après l'import.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <TenderExcelImporter />
    </div>
  );
};

export default TenderImport;
