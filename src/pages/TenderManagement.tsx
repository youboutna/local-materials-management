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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestion des Appels d'Offres</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Tender CRUD */}
        <TenderCrud 
          onTenderSelect={setSelectedTender}
          selectedTenderId={selectedTender?.id}
        />

        {/* Right Column - Tender Details */}
        {selectedTender ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                {selectedTender.title}
              </CardTitle>
            </CardHeader>

            <Tabs defaultValue="workflow" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="steps">Étapes</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
              </TabsList>

              <CardContent>
                <TabsContent value="workflow">
                  <PublicProcurementWorkflow selectedTender={selectedTender} />
                </TabsContent>
                <TabsContent value="steps">
                  <TenderWorkflowSteps tenderId={selectedTender.id} />
                </TabsContent>
                <TabsContent value="documents">
                  <TenderDocumentManager tenderId={selectedTender.id} />
                </TabsContent>
                <TabsContent value="evaluation">
                  <TenderEvaluationPanel tenderId={selectedTender.id} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        ) : (
          <Card className="w-full">
            <CardContent className="text-center py-12">
              <p className="text-lg mb-2 text-gray-500">Aucun appel d'offres sélectionné</p>
              <p className="text-sm text-gray-400">
                Sélectionnez un appel d'offres à gauche pour voir ses détails et gérer son workflow.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TenderManagement;
