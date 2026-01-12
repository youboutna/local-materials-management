import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Users, Upload, Settings, Layers } from "lucide-react";
import TenderCrud from "@/components/tenders/TenderCrud";
import TenderWorkflowSteps from "@/components/tenders/TenderWorkflowSteps";
import TenderDocumentManager from "@/components/tenders/TenderDocumentManager";
import TenderEvaluationPanel from "@/components/tenders/TenderEvaluationPanel";
import PublicProcurementWorkflow from "@/components/tenders/PublicProcurementWorkflow";
import TenderLotBuilder from "@/components/tenders/TenderLotBuilder";
import TenderWorkflowStepper from "@/components/tenders/TenderWorkflowStepper";
import { TenderSecurityBadge } from "@/components/tenders/TenderSecurityBadge";
import { TenderTimelineCard } from "@/components/tenders/TenderTimelineCard";
import { EnhancedDocumentSharing } from "@/components/suppliers/EnhancedDocumentSharing";
import { SecureSharingDialog } from "@/components/tenders/SecureSharingDialog";
import { SubmissionSecretDialog } from "@/components/tenders/SubmissionSecretDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkflowPhase, WorkflowStage } from "@/types/workflow";
import { useQuery } from "@tanstack/react-query";
import { TenderService } from "@/services/TenderService";
import { SubmissionSecretService } from "@/services/SubmissionSecretService";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout";

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
  status: "draft" | "published" | "closed" | "awarded";
  created_at: string;
  updated_at: string;
}

interface SelectedSupplier {
  id: string;
  name: string;
  email: string;
  phase?: WorkflowPhase;
  stage?: WorkflowStage;
  tender_id?: string;
  selected_documents?: string[];
}

const TenderManagement = () => {
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [documentSharingOpen, setDocumentSharingOpen] = useState(false);
  const [secureSharingOpen, setSecureSharingOpen] = useState(false);
  const [documentSelectorOpen, setDocumentSelectorOpen] = useState(false);
  const [submissionSecretOpen, setSubmissionSecretOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<{
    id: string;
    supplierName: string;
  } | null>(null);
  const [selectedSupplier, setSelectedSupplier] =
    useState<SelectedSupplier | null>(null);
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState<{
    phase: WorkflowPhase;
    stage: WorkflowStage;
  } | null>(null);
  const [verifiedSubmissions, setVerifiedSubmissions] = useState<Set<string>>(
    new Set()
  );
  const [secretCodes, setSecretCodes] = useState<Record<string, string>>({});
  const [validatingSubmission, setValidatingSubmission] = useState<
    string | null
  >(null);
  const { toast } = useToast();

  // Fetch tender submissions for the selected tender using TenderService
  const { data: submissions } = useQuery({
    queryKey: ["tender-submissions", selectedTender?.id],
    queryFn: async () => {
      if (!selectedTender?.id) return [];
      return await TenderService.getTenderSubmissions(selectedTender.id);
    },
    enabled: !!selectedTender?.id,
  });

  const handleShareWithSuppliers = (
    phase: WorkflowPhase,
    stage: WorkflowStage
  ) => {
    setSelectedWorkflowStep({ phase, stage });

    if (!selectedTender) {
      // If no tender is selected, use the general sharing approach
      setSelectedSupplier({
        id: "all-suppliers",
        name: `Tous les fournisseurs - ${stage.label}`,
        email: "all-suppliers@tender-portal.com",
        phase: phase,
        stage: stage,
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
      name: `Fournisseurs - ${selectedTender?.title} - ${selectedWorkflowStep?.stage.label}`,
      email: `tender-${selectedTender?.id}@portal.com`,
      phase: selectedWorkflowStep?.phase,
      stage: selectedWorkflowStep?.stage,
      tender_id: selectedTender?.id,
      selected_documents: documentIds,
    });
    setDocumentSelectorOpen(false);
    setDocumentSharingOpen(true);
  };

  const handleVerifySecret = async (submissionId: string) => {
    const secretCode = secretCodes[submissionId];
    if (!secretCode || secretCode.trim().length === 0) {
      toast({
        title: "Code requis",
        description: "Veuillez entrer le code secret",
        variant: "destructive",
      });
      return;
    }

    setValidatingSubmission(submissionId);
    try {
      const result = await SubmissionSecretService.validateSecret(secretCode);

      if (result.is_valid && result.submission_id === submissionId) {
        setVerifiedSubmissions((prev) => new Set(prev).add(submissionId));
        toast({
          title: "Code vérifié",
          description: "L'accès à la soumission a été autorisé",
        });
      } else {
        toast({
          title: "Code invalide",
          description:
            result.message ||
            "Le code secret n'est pas valide pour cette soumission",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le code secret",
        variant: "destructive",
      });
    } finally {
      setValidatingSubmission(null);
    }
  };

  return (
    <AppLayout
      pageTitle="Gestion des Appels d'Offres"
      pageDescription="Gérez le cycle complet des appels d'offres selon les standards mauritaniens"
      actions={
        selectedTender && (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1">
              <FileText className="h-3 w-3 mr-1" />
              {selectedTender.status}
            </Badge>
            <Button
              variant="default"
              size="sm"
              onClick={() => setSecureSharingOpen(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Partage Sécurisé
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-6">
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
                      <Badge
                        variant={
                          selectedTender.status === "published"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedTender.status}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          to={`/tender-management/${selectedTender?.id}/settings`}
                        >
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <Tabs defaultValue="workflow" className="flex-1">
                  <div className="border-b px-6 bg-muted/30">
                    <TabsList className="grid w-full grid-cols-7 max-w-3xl">
                      <TabsTrigger value="workflow" className="text-xs">
                        Workflow
                      </TabsTrigger>
                      <TabsTrigger value="stepper" className="text-xs">
                        Processus
                      </TabsTrigger>
                      <TabsTrigger value="lots" className="text-xs">
                        Lots
                      </TabsTrigger>
                      <TabsTrigger value="timeline" className="text-xs">
                        Chronologie
                      </TabsTrigger>
                      <TabsTrigger value="steps" className="text-xs">
                        Étapes
                      </TabsTrigger>
                      <TabsTrigger value="documents" className="text-xs">
                        Documents
                      </TabsTrigger>
                      <TabsTrigger value="evaluation" className="text-xs">
                        Évaluation
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <CardContent className="p-6">
                    <TabsContent value="workflow" className="mt-0">
                      <PublicProcurementWorkflow
                        selectedTender={selectedTender}
                        onShareWithSuppliers={handleShareWithSuppliers}
                      />
                    </TabsContent>
                    <TabsContent value="stepper" className="mt-0">
                      <TenderWorkflowStepper 
                        tenderId={selectedTender.id}
                        currentStep={selectedTender.status === 'draft' ? 'creation' : selectedTender.status === 'published' ? 'publication' : 'evaluation'}
                      />
                    </TabsContent>
                    <TabsContent value="lots" className="mt-0">
                      <TenderLotBuilder 
                        tenderId={selectedTender.id} 
                        projectId={selectedTender.project_id}
                      />
                    </TabsContent>
                    <TabsContent value="timeline" className="mt-0">
                      <TenderTimelineCard
                        launchDate={selectedTender.launch_date}
                        deadlineDate={selectedTender.attribution_date}
                      />
                    </TabsContent>
                    <TabsContent value="steps" className="mt-0">
                      <TenderWorkflowSteps
                        tenderId={selectedTender.id}
                        projectId={selectedTender.project_id}
                        readonly={false}
                      />
                    </TabsContent>
                    <TabsContent value="documents" className="mt-0">
                      <TenderDocumentManager tenderId={selectedTender.id} />
                    </TabsContent>
                    <TabsContent value="evaluation" className="mt-0">
                      <div className="space-y-4">
                        {/* Submissions List with Secret Code Management */}
                        {submissions && submissions.length > 0 && (
                          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Soumissions Reçues ({submissions.length})
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {submissions.map((sub: any) => (
                                  <div
                                    key={sub.id}
                                    className="flex items-center justify-between p-3 border rounded-lg bg-background hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium">
                                        {sub.supplier_name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {sub.supplier_email}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {!verifiedSubmissions.has(sub.id) ? (
                                        <>
                                          <Input
                                            type="text"
                                            placeholder="Entrer le code secret"
                                            className="w-48"
                                            maxLength={10}
                                            value={secretCodes[sub.id] || ""}
                                            onChange={(e) =>
                                              setSecretCodes((prev) => ({
                                                ...prev,
                                                [sub.id]: e.target.value,
                                              }))
                                            }
                                          />
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              handleVerifySecret(sub.id)
                                            }
                                            disabled={
                                              validatingSubmission === sub.id
                                            }
                                          >
                                            <FileText className="h-4 w-4 mr-1" />
                                            {validatingSubmission === sub.id
                                              ? "Vérification..."
                                              : "Vérifier"}
                                          </Button>
                                        </>
                                      ) : (
                                        <Badge
                                          variant="default"
                                          className="gap-1"
                                        >
                                          <FileText className="h-3 w-3" />
                                          Code vérifié
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {verifiedSubmissions.size > 0 && (
                          <TenderEvaluationPanel
                            tenderId={selectedTender.id}
                            verifiedSubmissions={Array.from(
                              verifiedSubmissions
                            )}
                          />
                        )}
                      </div>
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
                  <h3 className="text-lg font-medium mb-2">
                    Aucun appel d'offres sélectionné
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Sélectionnez un appel d'offres à gauche pour voir ses
                    détails et gérer son workflow de soumission.
                  </p>
                  <Button variant="outline" className="mt-4" size="sm" asChild>
                    <Link to="/tender-import">
                      <Upload className="h-4 w-4 mr-2" />
                      Importer un appel d'offres
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Secure Sharing Dialog */}
        {selectedTender && (
          <SecureSharingDialog
            isOpen={secureSharingOpen}
            onOpenChange={setSecureSharingOpen}
            tenderId={selectedTender.id}
            tenderTitle={selectedTender.title}
            workflowPhase={selectedWorkflowStep?.phase.code}
            workflowStage={selectedWorkflowStep?.stage.code}
          />
        )}

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
          <Dialog
            open={documentSelectorOpen}
            onOpenChange={setDocumentSelectorOpen}
          >
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Sélectionner les documents pour{" "}
                  {selectedWorkflowStep?.stage.label}
                </DialogTitle>
              </DialogHeader>
              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choisissez les documents à partager avec les fournisseurs pour
                  cette étape.
                </p>

                {/* Document List */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium mb-3">Documents disponibles</h4>
                  <div className="text-sm text-muted-foreground">
                    Seuls les documents uploadés dans les étapes du workflow
                    sont disponibles pour le partage.
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun document disponible</p>
                      <p className="text-xs mt-1">
                        Ajoutez des documents aux étapes pour les rendre
                        disponibles au partage
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setDocumentSelectorOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button onClick={() => handleDocumentSelected([])} disabled>
                    Continuer sans documents
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Submission Secret Dialog */}
        {selectedSubmission && (
          <SubmissionSecretDialog
            isOpen={submissionSecretOpen}
            onOpenChange={setSubmissionSecretOpen}
            submissionId={selectedSubmission.id}
            supplierName={selectedSubmission.supplierName}
            tenderId={selectedTender?.id || ""}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default TenderManagement;
