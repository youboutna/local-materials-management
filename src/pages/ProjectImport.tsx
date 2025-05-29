
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectImporter2025 from '@/components/projects/ProjectImporter2025';
import ProjectFileImporter from '@/components/projects/ProjectFileImporter';
import { Database, FileSpreadsheet, Upload } from 'lucide-react';
import { ImportResult } from '@/types/project';

const ProjectImport = () => {
  const handleImportComplete = (result: ImportResult) => {
    console.log('Import completed:', result);
    // You can add additional logic here like refreshing project lists
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Import de Projets</h1>
          <p className="text-gray-600">Importez les données des projets planifiés</p>
        </div>
      </div>

      <Tabs defaultValue="file-import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file-import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import par fichier
          </TabsTrigger>
          <TabsTrigger value="predefined" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Projets 2025
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file-import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Import de projets personnalisés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Importez vos propres projets à partir de fichiers Excel, JSON ou CSV. 
                Vous pouvez télécharger un modèle pour vous guider dans la structure attendue.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Informations sur l'import :</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Formats supportés : Excel (.xlsx, .xls), JSON (.json), CSV (.csv)</li>
                  <li>• Taille maximale : 10 MB par fichier</li>
                  <li>• Colonnes requises : title, description, location, budget</li>
                  <li>• Colonnes optionnelles : status, progress, startDate, endDate, teamSize, coordinates</li>
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
                Projets 2025 - Plan d'Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Cette page vous permet d'importer les 8 projets planifiés pour l'année 2025, 
                incluant les acquisitions d'équipements, constructions d'infrastructures, 
                et projets de développement social et sanitaire.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Informations sur l'import :</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 8 projets avec budgets de 8M à 150M MRU</li>
                  <li>• Sources de financement : ETR-ML et Budget Exceptionnel</li>
                  <li>• Types de marchés : Fournitures, Travaux, Prestations Intellectuelles</li>
                  <li>• Calendrier d'exécution : Avril à Octobre 2025</li>
                </ul>
              </div>

              <ProjectImporter2025 />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectImport;
