import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Upload, Settings } from 'lucide-react';
import TenderCrud from '@/components/tenders/TenderCrud';
import TenderWorkflowSteps from '@/components/tenders/TenderWorkflowSteps';
import TenderDocumentManager from '@/components/tenders/TenderDocumentManager';
import TenderEvaluationPanel from '@/components/tenders/TenderEvaluationPanel';
import PublicProcurementWorkflow from '@/components/tenders/PublicProcurementWorkflow';
import { EnhancedDocumentSharing } from '@/components/suppliers/EnhancedDocumentSharing';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProcurementPhase } from '@/components/tenders/PublicProcurementWorkflow';

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

interface SelectedSupplier {
  id: string;
  name: string;
  email: string;
  phase?: ProcurementPhase;
  tender_id?: string;
  selected_documents?: string[];
}

const TenderManagement = () => {
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [documentSharingOpen, setDocumentSharingOpen] = useState(false);
  const [documentSelectorOpen, setDocumentSelectorOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SelectedSupplier | null>(null);
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState<{ phase: ProcurementPhase; stepTitle: string } | null>(null);

  const handleShareWithSuppliers = (stepTitle: string, stepPhase: ProcurementPhase) => {
    setSelectedWorkflowStep({ phase: stepPhase, stepTitle });
    
    if (!selectedTender) {
      // If no tender is selected, use the general sharing approach
      setSelectedSupplier({
        id: 'all-suppliers',
        name: `Tous les fournisseurs - ${stepTitle}`,
        email: 'all-suppliers@tender-portal.com',
        phase: stepPhase
      });
      setDocumentSharingOpen(true);
    } else {
      // If a tender is selected, open document selector for this tender
      setDocumentSelectorOpen(true);
    }
  };

  const handleDocumentSelected = (documentIds: string[]) => {
    // Create a supplier context for the selected tender
    setSelectedSupplier({
      id: `tender-${selectedTender?.id}`,
      name: `Fournisseurs - ${selectedTender?.title} - ${selectedWorkflowStep?.stepTitle}`,
      email: `tender-${selectedTender?.id}@portal.com`,
      phase: selectedWorkflowStep?.phase,
      tender_id: selectedTender?.id,
      selected_documents: documentIds
    });
    setDocumentSelectorOpen(false);
    setDocumentSharingOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des Appels d'Offres</h1>
            <p className="text-muted-foreground">
              Gérez le cycle complet des appels d'offres selon les standards mauritaniens
            </p>
          </div>
          {selectedTender && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1">
                <FileText className="h-3 w-3 mr-1" />
                {selectedTender.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShareWithSuppliers("Ensemble du dossier", "planification")}
              >
                <Users className="h-4 w-4 mr-2" />
                Partager
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Tender CRUD */}
          <div className="xl:col-span-1">
            <TenderCrud 
              onTenderSelect={setSelectedTender}
              selectedTenderId={selectedTender?.id}
            />
          </div>

          {/* Right Column - Tender Details */}
          <div className="xl:col-span-2">
            {selectedTender ? (
              <Card className="h-full">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {selectedTender.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTender.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedTender.status === 'published' ? 'default' : 'secondary'}>
                        {selectedTender.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <Tabs defaultValue="workflow" className="flex-1">
                  <div className="border-b px-6">
                    <TabsList className="grid w-full grid-cols-4 max-w-md">
                      <TabsTrigger value="workflow" className="text-xs">Workflow</TabsTrigger>
                      <TabsTrigger value="steps" className="text-xs">Étapes</TabsTrigger>
                      <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
                      <TabsTrigger value="evaluation" className="text-xs">Évaluation</TabsTrigger>
                    </TabsList>
                  </div>

                  <CardContent className="p-6">
                    <TabsContent value="workflow" className="mt-0">
                      <PublicProcurementWorkflow 
                        selectedTender={selectedTender}
                        onShareWithSuppliers={handleShareWithSuppliers}
                      />
                    </TabsContent>
                    <TabsContent value="steps" className="mt-0">
                      <TenderWorkflowSteps 
                        tenderId={selectedTender.id}
                        onShareWithSuppliers={handleShareWithSuppliers}
                      />
                    </TabsContent>
                    <TabsContent value="documents" className="mt-0">
                      <TenderDocumentManager tenderId={selectedTender.id} />
                    </TabsContent>
                    <TabsContent value="evaluation" className="mt-0">
                      <TenderEvaluationPanel tenderId={selectedTender.id} />
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            ) : (
              <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Aucun appel d'offres sélectionné</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Sélectionnez un appel d'offres à gauche pour voir ses détails et gérer son workflow de soumission.
                  </p>
                  <Button variant="outline" className="mt-4" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Importer un appel d'offres
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Document Sharing Dialog */}
        {selectedSupplier && (
          <EnhancedDocumentSharing
            supplier={selectedSupplier}
            isOpen={documentSharingOpen}
            onOpenChange={(open) => {
              setDocumentSharingOpen(open);
              if (!open) {
                setSelectedSupplier(null);
                setSelectedWorkflowStep(null);
              }
            }}
          />
        )}

        {/* Document Selector Dialog */}
        {selectedTender && documentSelectorOpen && (
          <Dialog open={documentSelectorOpen} onOpenChange={setDocumentSelectorOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>
                  Sélectionner les documents pour {selectedWorkflowStep?.stepTitle}
                </DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Choisissez les documents à partager avec les fournisseurs pour cette étape.
                </p>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setDocumentSelectorOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={() => handleDocumentSelected([])}>
                    Continuer sans documents
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default TenderManagement;
