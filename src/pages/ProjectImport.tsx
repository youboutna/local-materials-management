import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectImporter2025 from '@/components/projects/ProjectImporter2025';
import ProjectFileImporter from '@/components/projects/ProjectFileImporter';
import { Database, FileSpreadsheet, Upload } from 'lucide-react';
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
          <h1 className="text-3xl font-bold">{t("project_import.title")}</h1>
          <p className="text-gray-600">{t("project_import.subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="file-import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file-import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t("project_import.tab.file")}
          </TabsTrigger>
          <TabsTrigger value="predefined" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {t("project_import.tab.predefined")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file-import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                {t("project_import.file.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {t("project_import.file.desc")}
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">{t("project_import.info.title")}</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>{t("project_import.info.formats")}</li>
                  <li>{t("project_import.info.max_size")}</li>
                  <li>{t("project_import.info.required_columns")}</li>
                  <li>{t("project_import.info.optional_columns")}</li>
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
                {t("project_import.predefined.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {t("project_import.predefined.desc")}
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">{t("project_import.info.title")}</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>{t("project_import.predefined.info.budget")}</li>
                  <li>{t("project_import.predefined.info.funding")}</li>
                  <li>{t("project_import.predefined.info.types")}</li>
                  <li>{t("project_import.predefined.info.timeline")}</li>
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
