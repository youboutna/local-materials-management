import { TenderSubmissionService } from "@/application/services/TenderSubmissionService";
import { AppLayout } from "@/components/layout";
import { EnhancedDocumentSharing } from "@/components/suppliers/EnhancedDocumentSharing";
import { EvaluationPanelTabs } from "@/components/tenders/EvaluationPanelTabs";
import { SecureSharingDialog } from "@/components/tenders/SecureSharingDialog";
import { SubmissionsInbox } from "@/components/tenders/SubmissionsInbox";
import TenderCrud from "@/components/tenders/TenderCrud";
import TenderDocumentsPanel from "@/components/tenders/TenderDocumentsPanel";
import TenderLotBuilder from "@/components/tenders/TenderLotBuilder";
import TenderProjectPhases from "@/components/tenders/TenderProjectPhases";
import { TenderSecretsPanel } from "@/components/tenders/TenderSecretsPanel";
import { TenderTimelineCard } from "@/components/tenders/TenderTimelineCard";
import { TenderWorkflowPanel } from "@/components/tenders/TenderWorkflowPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenderStatusCode } from "@/config/referentials/tender/tender-workflow.referential";
import { useTenders, useTransitionTenderStatus } from "@/hooks/hexagonal";
import { useTenderLotDocuments } from "@/hooks/hexagonal/useTenderLotDocumentsHex";
import { useTenderLots } from "@/hooks/hexagonal/useTenderLotsHex";
import { useToast } from "@/hooks/use-toast";
import { RepositoryFactory } from "@/infrastructure/RepositoryFactory";
// NOTE: RepositoryFactory is still used below for a read-only document count query;
// no dedicated service method exists for that yet.
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Gavel,
  Inbox,
  KeyRound,
  Layers,
  Settings,
  Upload,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

interface Tender {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  projectId?: string | null;
  project_id?: string | null;
  launchDate?: string | null;
  deadlineDate?: string | null;
  attributionDate?: string | null;
  submissionDeadline?: string | null;
  currentPhase?: number | string | null;
  tenderNumber?: string | null;
}

const TenderManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramTenderId = searchParams.get("tenderId") || "";
  const paramTab = searchParams.get("tab") || "workflow";

  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [activeTab, setActiveTab] = useState<string>(paramTab);
  const [secureSharingOpen, setSecureSharingOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [documentSharingOpen, setDocumentSharingOpen] = useState(false);
  const { toast } = useToast();

  const { data: tenders = [] } = useTenders();
  const transitionTenderStatus = useTransitionTenderStatus();

  // Honor ?tenderId= from URL
  useEffect(() => {
    if (!paramTenderId || !tenders.length) return;
    const found = tenders.find((t: any) => t.id === paramTenderId);
    if (found && found.id !== selectedTender?.id) setSelectedTender(found as any);
  }, [paramTenderId, tenders]);

  // Sync tab param
  useEffect(() => {
    if (paramTab !== activeTab) setActiveTab(paramTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    if (selectedTender?.id) next.set("tenderId", selectedTender.id);
    setSearchParams(next, { replace: true });
  };

  const handleSelectTender = (t: any) => {
    setSelectedTender(t);
    const next = new URLSearchParams(searchParams);
    next.set("tenderId", t.id);
    setSearchParams(next, { replace: true });
  };

  // Submissions
  const { data: submissions = [] } = useQuery({
    queryKey: ["tender-submissions", selectedTender?.id],
    queryFn: async () => {
      if (!selectedTender?.id) return [];
      return (await TenderSubmissionService.getTenderSubmissions(selectedTender.id)) as any[];
    },
    enabled: !!selectedTender?.id,
  });

  // Documents count (for context indicator)
  const { data: docsCount = 0 } = useQuery({
    queryKey: ["tender-docs-count", selectedTender?.id],
    queryFn: async () => {
      if (!selectedTender?.id) return 0;
      try {
        const repo = RepositoryFactory.getTenderDocumentRepository();
        const docs: any[] = await (repo as any).getDocumentsByTenderId?.(selectedTender.id) ?? [];
        return docs.length;
      } catch {
        return 0;
      }
    },
    enabled: !!selectedTender?.id,
  });

  const { data: lots = [] } = useTenderLots(selectedTender?.id ?? '');
  const { data: lotDocs = [] } = useTenderLotDocuments(selectedTender?.id ?? '');

  const workflowContext = useMemo(() => {
    const list = submissions as any[];
    const totalDocs = docsCount + (lotDocs as any[]).length;
    return {
      hasLots: (lots as any[]).length > 0,
      hasDocuments: totalDocs > 0,
      hasDeadline: !!(selectedTender?.submissionDeadline || selectedTender?.deadlineDate),
      submissionsCount: list.length,
      hasEvaluationScores: list.some((s) => s.total_score != null || s.evaluation_score != null),
      hasWinner: list.some((s) => s.status === 'awarded' || s.is_winner),
      contractSigned: selectedTender?.status === 'contracted' || selectedTender?.status === 'closed',
    };
  }, [submissions, docsCount, lotDocs, selectedTender, lots]);

  const handleTransition = async (to: TenderStatusCode) => {
    if (!selectedTender) return;
    try {
      await transitionTenderStatus.mutateAsync({ tenderId: selectedTender.id, status: to });
      toast({ title: "Statut mis à jour", description: `Nouveau statut: ${to}` });
      setSelectedTender((s) => (s ? { ...s, status: to } : s));
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message ?? "Transition impossible", variant: "destructive" });
    }
  };

  const verifiedSubs = useMemo(
    () => (submissions as any[]).filter((s) => s.access_verified || s.is_verified || s.status !== 'pending'),
    [submissions]
  );

  const winnerSub = useMemo(
    () => (submissions as any[]).find((s) => s.is_winner || s.status === 'awarded'),
    [submissions]
  );

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
            <Button variant="default" size="sm" onClick={() => setSecureSharingOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Partage Sécurisé
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <TenderCrud
              onTenderSelect={handleSelectTender as any}
              selectedTenderId={selectedTender?.id}
            />
          </div>

          <div className="xl:col-span-2">
            {selectedTender ? (
              <Card className="h-full">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <CardTitle className="text-xl flex items-center gap-2 truncate">
                        <FileText className="h-5 w-5 shrink-0" />
                        <span className="truncate">{selectedTender.title}</span>
                      </CardTitle>
                      {selectedTender.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {selectedTender.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={selectedTender.status === "published" ? "default" : "secondary"}>
                        {selectedTender.status}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/tenders/${selectedTender.id}`}>
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1">
                  <div className="border-b px-6 bg-muted/30">
                    <TabsList className="grid w-full grid-cols-7 max-w-4xl">
                      <TabsTrigger value="workflow" className="text-xs">
                        <Layers className="h-3 w-3 mr-1" /> Workflow
                      </TabsTrigger>
                      <TabsTrigger value="lots" className="text-xs">Lots</TabsTrigger>
                      <TabsTrigger value="documents" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" /> Docs
                        {docsCount > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{docsCount}</Badge>}
                      </TabsTrigger>
                      <TabsTrigger value="inbox" className="text-xs">
                        <Inbox className="h-3 w-3 mr-1" /> Réception
                        {(submissions as any[]).length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{(submissions as any[]).length}</Badge>}
                      </TabsTrigger>
                      <TabsTrigger value="evaluation" className="text-xs">Évaluation</TabsTrigger>
                      <TabsTrigger value="decision" className="text-xs">
                        <Gavel className="h-3 w-3 mr-1" /> Décision
                      </TabsTrigger>
                      <TabsTrigger value="secrets" className="text-xs">
                        <KeyRound className="h-3 w-3 mr-1" /> Codes
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <CardContent className="p-6">
                    <TabsContent value="workflow" className="mt-0 space-y-6">
                      <TenderTimelineCard
                        launchDate={selectedTender.launchDate ?? undefined}
                        deadlineDate={(selectedTender.deadlineDate ?? selectedTender.attributionDate) ?? undefined}
                      />
                      <TenderWorkflowPanel
                        tenderId={selectedTender.id}
                        status={selectedTender.status}
                        context={workflowContext}
                        onTransition={handleTransition}
                      />
                    </TabsContent>

                    <TabsContent value="lots" className="mt-0 space-y-6">
                      <TenderProjectPhases
                        tenderId={selectedTender.id}
                        projectId={selectedTender.projectId ?? selectedTender.project_id ?? ''}
                      />
                      <TenderLotBuilder
                        tenderId={selectedTender.id}
                        projectId={selectedTender.projectId ?? selectedTender.project_id ?? ''}
                      />
                    </TabsContent>

                    <TabsContent value="documents" className="mt-0">
                      <TenderDocumentsPanel tenderId={selectedTender.id} projectId={selectedTender.projectId ?? selectedTender.project_id ?? undefined} />
                    </TabsContent>

                    <TabsContent value="inbox" className="mt-0">
                      <SubmissionsInbox
                        tenderId={selectedTender.id}
                        tenderDeadline={selectedTender.submissionDeadline ?? selectedTender.deadlineDate ?? undefined}
                        projectId={selectedTender.projectId ?? selectedTender.project_id ?? ''}
                      />
                    </TabsContent>

                    <TabsContent value="evaluation" className="mt-0 space-y-4">
                      {verifiedSubs.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-6 border rounded-md">
                          Aucune soumission vérifiée. Validez les codes secrets dans l'onglet <b>Réception</b>.
                        </div>
                      ) : (
                        verifiedSubs.map((s: any) => (
                          <EvaluationPanelTabs
                            key={s.id}
                            submissionId={s.id}
                            supplierName={s.supplier_name}
                          />
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="decision" className="mt-0 space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Gavel className="h-4 w-4" /> Décision d'attribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {winnerSub ? (
                            <div className="p-3 border rounded-md bg-emerald-50 border-emerald-200">
                              <div className="text-sm font-medium">Lauréat proposé</div>
                              <div className="text-lg">{winnerSub.supplier_name}</div>
                              <div className="text-xs text-muted-foreground">
                                Statut: {winnerSub.status} · Score: {winnerSub.total_score ?? '—'}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Aucun lauréat désigné. Utilisez l'onglet <b>Réception</b> puis <b>Évaluation</b> pour proposer un lauréat.
                            </p>
                          )}
                          <TenderWorkflowPanel
                            tenderId={selectedTender.id}
                            status={selectedTender.status}
                            context={workflowContext}
                            onTransition={handleTransition}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="secrets" className="mt-0">
                      <TenderSecretsPanel
                        tenderId={selectedTender.id}
                        tenderTitle={selectedTender.title}
                      />
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
                    Sélectionnez un appel d'offres à gauche pour voir ses détails et gérer son workflow.
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

        {selectedTender && (
          <SecureSharingDialog
            isOpen={secureSharingOpen}
            onOpenChange={setSecureSharingOpen}
            tenderId={selectedTender.id}
            tenderTitle={selectedTender.title}
          />
        )}

        {selectedSupplier && (
          <EnhancedDocumentSharing
            supplier={selectedSupplier}
            isOpen={documentSharingOpen}
            onOpenChange={(open) => {
              setDocumentSharingOpen(open);
              if (!open) setSelectedSupplier(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default TenderManagement;
