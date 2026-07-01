/**
 * TendersPublic
 * Page publique consultation + candidature aux appels d'offres.
 * Accès anonyme via la policy RLS `Anonymous can read active public tenders`.
 * Wizard vertical 4 étapes (DPAO → DQE → Pièces → Soumission).
 *
 * @see .lovable/plan.md — Lot 2
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, HelpCircle } from 'lucide-react';
import { PublicTendersList } from '@/components/supplier/PublicTendersList';
import { SupplierBidWizard, type BidWizardStepCode } from '@/components/supplier/SupplierBidWizard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function TendersPublic() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: tender } = useQuery({
    queryKey: ['public-tender', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const { data, error } = await supabase
        .from('tenders')
        .select('id, title, description, status, deadline_date, market_type, budget_max, project_reference')
        .eq('id', selectedId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedId,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-lg">Portail Fournisseur — Appels d'offres publics</h1>
          </div>
          <Button size="sm" variant="ghost" asChild>
            <a href="/supplier-portal"><HelpCircle className="h-4 w-4 mr-1" /> J'ai un code secret</a>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {!selectedId && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-bold">Consultez les appels d'offres ouverts</h2>
              <p className="text-sm text-muted-foreground">
                Consultation libre, soumission via wizard guidé. Aucun compte requis pour parcourir.
              </p>
            </div>
            <PublicTendersList onSelect={setSelectedId} />
          </>
        )}

        {selectedId && tender && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour à la liste
            </Button>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{tender.title}</CardTitle>
                {tender.description && <p className="text-sm text-muted-foreground">{tender.description}</p>}
              </CardHeader>
            </Card>
            <SupplierBidWizard
              tenderId={tender.id}
              tenderTitle={tender.title}
              deadlineDate={tender.deadline_date}
              onSubmit={async () => {
                toast({
                  title: 'Candidature soumise',
                  description: 'Votre candidature a été enregistrée. Vous recevrez un code secret par email pour le suivi.',
                });
              }}
              renderStep={(step) => <BidStepContent step={step} tenderId={tender.id} />}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function BidStepContent({ step, tenderId }: { step: BidWizardStepCode; tenderId: string }) {
  if (step === 'dpao') {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold">1. Dossier de l'appel d'offres (DPAO)</h3>
        <p className="text-sm text-muted-foreground">
          Téléchargez le dossier complet contenant le cahier des charges, le BPU et les annexes.
        </p>
        <div className="rounded border bg-muted/30 p-4 text-sm text-center text-muted-foreground">
          [Zone de téléchargement des documents publics du tender {tenderId.slice(0, 8)}]
        </div>
      </div>
    );
  }
  if (step === 'dqe') {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold">2. Devis Quantitatif Estimatif (DQE)</h3>
        <p className="text-sm text-muted-foreground">
          Importez votre BPU Excel, PDF ou saisissez manuellement les prix.
        </p>
        <div className="rounded border bg-muted/30 p-4 text-sm text-center text-muted-foreground">
          [Éditeur DQE (EnhancedTenderEstimator) à monter ici selon session bidder]
        </div>
      </div>
    );
  }
  if (step === 'documents') {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold">3. Pièces administratives, techniques, financières</h3>
        <p className="text-sm text-muted-foreground">
          Uploadez les documents demandés dans le DPAO, classés par catégorie.
        </p>
        <div className="rounded border bg-muted/30 p-4 text-sm text-center text-muted-foreground">
          [SupplierDocumentUpload multi-catégories]
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">4. Récapitulatif et soumission</h3>
      <p className="text-sm text-muted-foreground">
        Vérifiez votre candidature avant envoi. Une confirmation avec code secret vous sera envoyée par email.
      </p>
      <div className="rounded border bg-muted/30 p-4 text-sm text-center text-muted-foreground">
        [Récap DQE + docs + email de confirmation]
      </div>
    </div>
  );
}
