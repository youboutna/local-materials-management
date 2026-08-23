
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Info } from 'lucide-react';
import TenderExcelImporter from '@/components/tenders/TenderExcelImporter';
import { T } from '@/components/i18n/T';

const TenderImport = () => {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><T k="auto.tenderimport.import_d_appels_d_offres" fallback="Import d'Appels d'Offres" /></h1>
        <p className="text-muted-foreground mt-2"><T k="auto.tenderimport.importer_les_appels_d_offres_depuis_un_fichier_e" fallback="Importer les appels d'offres depuis un fichier Excel" /></p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            <T k="auto.tenderimport.format_du_fichier_excel" fallback="Format du fichier Excel" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p><T k="auto.tenderimport.le_fichier_excel_doit_contenir_les_colonnes_suiv" fallback="Le fichier Excel doit contenir les colonnes suivantes (dans cet ordre) :" /></p>
            <ol>
              <li><strong><T k="auto.tenderimport.ordre" fallback="Ordre" /></strong> - Numéro d'ordre de l'appel d'offres</li>
              <li><strong><T k="auto.tenderimport.objet_de_la_depense" fallback="Objet de la dépense" /></strong> - Description de l'appel d'offres</li>
              <li><strong><T k="auto.tenderimport.imputation_budgetaire" fallback="Imputation budgetaire" /></strong> - Source de financement</li>
              <li><strong><T k="auto.tenderimport.type_de_contrat" fallback="Type de Contrat" /></strong> - Type de marché (Services Courants, Fournitures, Travaux, etc.)</li>
              <li><strong><T k="auto.tenderimport.mode_de_selection" fallback="Mode de Sélection" /></strong> - Procédure de sélection</li>
              <li><strong><T k="auto.tenderimport.date_de_lancement" fallback="Date de Lancement" /></strong> - Date de publication (format DD/MM/YYYY)</li>
              <li><strong><T k="auto.tenderimport.date_d_attribution" fallback="Date d'Attribution" /></strong> - Date d'attribution (format DD/MM/YYYY)</li>
            </ol>
            
            <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-primary text-sm">
                <strong><T k="auto.tenderimport.note" fallback="Note:" /></strong> <T k="auto.tenderimport.vous_pouvez_telecharger_un_template_excel_pour_v" fallback="Vous pouvez télécharger un template Excel pour vous assurer du bon format." />
              </p>
            </div>
            
            <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <p className="text-warning text-sm">
                <strong><T k="auto.tenderimport.attention" fallback="Attention:" /></strong> Tous les appels d'offres importés seront créés avec le statut "Brouillon". 
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
