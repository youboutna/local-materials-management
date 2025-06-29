
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Workflow, Settings, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import TenderCrud from '@/components/tenders/TenderCrud';
import TenderDocumentManager from '@/components/tenders/TenderDocumentManager';
import TenderImportManager from '@/components/tenders/TenderImportManager';
import PublicProcurementWorkflow from '@/components/tenders/PublicProcurementWorkflow';
import TenderWorkflowSteps from '@/components/tenders/TenderWorkflowSteps';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';

interface Tender {
  id: string;
  title: string;
  description: string;
  project_id?: string;
  launch_date?: string;
  attribution_date?: string;
  selection_mode?: string;
  market_type?: string;
  financing_source?: string;
  project_reference?: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  created_at: string;
  updated_at: string;
}

const TenderManagement = () => {
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [activeTab, setActiveTab] = useState('tenders');
  const { hasRole, hasAnyRole, isLoading, error } = useCurrentUserRoles();

  // Show loading only if explicitly loading and no error
  if (isLoading && !error) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Check user roles - default to basic access if roles can't be determined
  const isBidder = hasRole('supplier') || hasRole('agent');
  const isAdmin = hasAnyRole(['admin', 'director', 'manager']);

  const handleTenderSelect = (tender: Tender) => {
    setSelectedTender(tender);
    setActiveTab('documents');
  };

  const handleImportComplete = (result: any) => {
    console.log('Import completed:', result);
    // Refresh tenders list if needed
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Appels d'Offres</h1>
          <p className="text-gray-600 mt-2">
            {isBidder 
              ? "Gérer vos soumissions et documents d'offres" 
              : "Gérer les appels d'offres, projets associés et soumissionnaires"
            }
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              asChild
            >
              <Link to="/tender-import">
                <Upload className="h-4 w-4 mr-2" />
                Importer Excel
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tenders" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Appels d'Offres
          </TabsTrigger>
          <TabsTrigger value="steps" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Étapes
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Workflow Officiel
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="tenders" className="space-y-6">
          <TenderCrud 
            onTenderSelect={handleTenderSelect}
            selectedTenderId={selectedTender?.id}
          />
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          {selectedTender ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5" />
                    Étapes - {selectedTender.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{selectedTender.description}</p>
                </CardContent>
              </Card>
              
              <TenderWorkflowSteps 
                tenderId={selectedTender.id}
                readonly={!isAdmin && !hasRole('manager')}
              />
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Workflow className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez un appel d'offres</h3>
                <p className="text-gray-600 mb-4">
                  Choisissez un appel d'offres dans l'onglet précédent pour gérer ses étapes.
                </p>
                <Button onClick={() => setActiveTab('tenders')}>
                  Voir les Appels d'Offres
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-6">
          {selectedTender ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {selectedTender.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{selectedTender.description}</p>
                </CardContent>
              </Card>
              
              <TenderDocumentManager 
                tenderId={selectedTender.id}
                projectId={selectedTender.project_id}
                readonly={!isBidder && !isAdmin}
              />
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez un appel d'offres</h3>
                <p className="text-gray-600 mb-4">
                  Choisissez un appel d'offres dans l'onglet précédent pour gérer ses documents.
                </p>
                <Button onClick={() => setActiveTab('tenders')}>
                  Voir les Appels d'Offres
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="workflow">
          <PublicProcurementWorkflow />
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="import">
            <TenderImportManager onImportComplete={handleImportComplete} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TenderManagement;
