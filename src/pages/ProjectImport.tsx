
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectImporter2025 from '@/components/projects/ProjectImporter2025';
import { Database, FileSpreadsheet } from 'lucide-react';

const ProjectImport = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Import de Projets</h1>
          <p className="text-gray-600">Importez les données des projets planifiés</p>
        </div>
      </div>

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
    </div>
  );
};

export default ProjectImport;
