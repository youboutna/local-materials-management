
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectImporter2025 from '@/components/projects/ProjectImporter2025';
import ProjectFileImporter from '@/components/projects/ProjectFileImporter';
import ProjectExporter from '@/components/projects/ProjectExporter';
import { Database, FileSpreadsheet, Upload, Download } from 'lucide-react';
import { ImportResult } from '@/types/project';
import { useLanguage } from '@/contexts/LanguageContext';

const ProjectImport = () => {
  const { t } = useLanguage();

  const handleImportComplete = (result: ImportResult) => {
    console.log('Import completed:', result);
    // You can add additional logic here like refreshing project lists
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Import/Export de Projets</h1>
          <p className="text-gray-600">Importez ou exportez vos projets dans différents formats</p>
        </div>
      </div>

      <Tabs defaultValue="file-import" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="file-import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import de fichiers
          </TabsTrigger>
          <TabsTrigger value="predefined" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Projets prédéfinis
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file-import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Import de projets par fichier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Importez vos projets depuis un fichier Excel, JSON ou CSV.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Informations importantes :</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Formats supportés : Excel (.xlsx, .xls), JSON (.json), CSV (.csv)</li>
                  <li>• Taille maximale : 10 MB</li>
                  <li>• Colonnes requises : title, description, location, status</li>
                  <li>• Colonnes optionnelles : budget, startDate, endDate, progress, teamSize, coordinates</li>
                </ul>
              </div>

              <ProjectFileImporter onImportComplete={handleImportComplete} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predefined" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Projets prédéfinis 2025
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Importez des projets prédéfinis avec des données réalistes pour la Mauritanie.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Projets inclus :</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Projets d'infrastructure avec budgets réalistes</li>
                  <li>• Diversité des sources de financement</li>
                  <li>• Types de marchés variés (public, privé, PPP)</li>
                  <li>• Chronologie 2025-2027</li>
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
                Export des projets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Exportez tous vos projets dans le format de votre choix.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-900 mb-2">Formats d'export disponibles :</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• <strong>JSON</strong> : Format structuré pour développeurs</li>
                  <li>• <strong>Excel</strong> : Feuille de calcul pour analyse</li>
                  <li>• <strong>CSV</strong> : Valeurs séparées par virgules</li>
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
