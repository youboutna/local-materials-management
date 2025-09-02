
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TenderCrud from '@/components/tenders/TenderCrud';
import TenderWorkflowSteps from '@/components/tenders/TenderWorkflowSteps';
import TenderDocumentManager from '@/components/tenders/TenderDocumentManager';
import TenderEvaluationPanel from '@/components/tenders/TenderEvaluationPanel';
import PublicProcurementWorkflow from '@/components/tenders/PublicProcurementWorkflow';

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

  const handleTenderSelect = (tender: Tender) => {
    setSelectedTender(tender);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des Appels d'Offres</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Tender CRUD */}
        <div className="space-y-6">
          <TenderCrud 
            onTenderSelect={handleTenderSelect}
            selectedTenderId={selectedTender?.id}
          />
        </div>

        {/* Right Column - Tender Details and Workflow */}
        <div className="space-y-6">
          {selectedTender ? (
            <Tabs defaultValue="workflow" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="steps">Étapes</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
              </TabsList>

              <TabsContent value="workflow">
                <Card>
                  <CardHeader>
                    <CardTitle>Workflow de Marché Public - {selectedTender.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PublicProcurementWorkflow selectedTender={selectedTender} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="steps">
                <Card>
                  <CardHeader>
                    <CardTitle>Étapes du Workflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TenderWorkflowSteps tenderId={selectedTender.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents de l'Appel d'Offres</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TenderDocumentManager tenderId={selectedTender.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evaluation">
                <Card>
                  <CardHeader>
                    <CardTitle>Évaluation des Offres</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TenderEvaluationPanel tenderId={selectedTender.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg mb-2">Aucun appel d'offres sélectionné</p>
                  <p className="text-sm">Sélectionnez un appel d'offres à gauche pour voir ses détails et gérer son workflow.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenderManagement;
