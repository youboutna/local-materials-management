/**
 * PaymentRequestModal - Modal de demande de paiement avec intégration des documents d'inspection
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  FileText, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  Upload,
  Eye,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PaymentDocument {
  id: string;
  type: string;
  title: string;
  file_url?: string;
  created_at: string;
  status?: string;
}

interface PaymentRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  phaseId?: string;
  stepId?: string;
  projectName?: string;
  phaseName?: string;
  stepName?: string;
  currentProgress?: number;
  estimatedBudget?: number;
  onSuccess?: () => void;
}

// Documents requis pour une demande de paiement
const REQUIRED_DOCUMENT_TYPES = [
  { type: 'pv_service_fait', label: 'PV Service Fait', required: true, icon: FileText },
  { type: 'photos', label: 'Photos du chantier', required: true, icon: Camera },
  { type: 'geolocation', label: 'Géolocalisation', required: true, icon: MapPin },
  { type: 'decompte', label: 'Décompte', required: false, icon: FileText },
  { type: 'attachement', label: 'Attachement', required: false, icon: FileText },
  { type: 'rapport_inspection', label: 'Rapport d\'inspection', required: false, icon: FileText },
];

const PaymentRequestModal: React.FC<PaymentRequestModalProps> = ({
  open,
  onOpenChange,
  projectId,
  phaseId,
  stepId,
  projectName,
  phaseName,
  stepName,
  currentProgress = 0,
  estimatedBudget = 0,
  onSuccess,
}) => {
  // Form state
  const [amount, setAmount] = useState<number>(0);
  const [progressAtPayment, setProgressAtPayment] = useState<number>(currentProgress);
  const [justification, setJustification] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available documents from inspections
  const { data: availableDocuments = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['payment-documents', projectId, phaseId],
    queryFn: async () => {
      // Fetch documents from recent inspections
      const { data: inspections, error } = await supabase
        .from('inspections')
        .select('id, date, status, documents, progress_at_inspection')
        .eq('project_id', projectId)
        .eq('status', 'approved')
        .order('date', { ascending: false })
        .limit(5);

      if (error) throw error;

      const docs: PaymentDocument[] = [];
      
      for (const inspection of inspections || []) {
        if (inspection.documents) {
          const inspDocs = inspection.documents as any;
          
          if (inspDocs.files && Array.isArray(inspDocs.files)) {
            for (const file of inspDocs.files) {
              docs.push({
                id: `${inspection.id}-${file.type}`,
                type: file.type,
                title: file.file_name || file.type,
                file_url: file.file_url,
                created_at: file.uploaded_at || inspection.date,
                status: 'approved',
              });
            }
          }
        }
      }

      // Also fetch from documents table
      const { data: projectDocs } = await supabase
        .from('documents')
        .select('id, title, document_type, file_url, created_at, status')
        .eq('project_id', projectId)
        .in('document_type', ['inspection_report', 'project_report'])
        .order('created_at', { ascending: false });

      if (projectDocs) {
        for (const doc of projectDocs) {
          docs.push({
            id: doc.id,
            type: doc.document_type,
            title: doc.title,
            file_url: doc.file_url || undefined,
            created_at: doc.created_at || '',
            status: doc.status || undefined,
          });
        }
      }

      return docs;
    },
    enabled: open,
  });

  // Check if all required documents are available
  const documentStatus = useMemo(() => {
    const status: Record<string, { available: boolean; document?: PaymentDocument }> = {};
    
    for (const reqDoc of REQUIRED_DOCUMENT_TYPES) {
      const found = availableDocuments.find(d => d.type === reqDoc.type || d.type.includes(reqDoc.type));
      status[reqDoc.type] = {
        available: !!found,
        document: found,
      };
    }

    return status;
  }, [availableDocuments]);

  const allRequiredDocsAvailable = REQUIRED_DOCUMENT_TYPES
    .filter(d => d.required)
    .every(d => documentStatus[d.type]?.available);

  const toggleDocument = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  // Calculate suggested amount based on progress
  const suggestedAmount = useMemo(() => {
    if (!estimatedBudget || !progressAtPayment) return 0;
    return Math.round(estimatedBudget * (progressAtPayment / 100));
  }, [estimatedBudget, progressAtPayment]);

  // Handle submit
  const handleSubmit = async () => {
    if (amount <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }

    if (!allRequiredDocsAvailable) {
      toast.error('Tous les documents obligatoires ne sont pas disponibles');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create payment request
      const { error } = await supabase
        .from('payments')
        .insert({
          project_id: projectId,
          phase_id: phaseId,
          amount,
          progress_at_payment: progressAtPayment,
          payment_date: new Date().toISOString(),
          payment_method: 'pending', // Will be set upon approval
          transaction_id: `REQ-${Date.now()}`,
          contractor_name: 'Pending',
          contractor_contact: 'Pending',
        });

      if (error) throw error;

      toast.success('Demande de paiement soumise avec succès');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting payment request:', error);
      toast.error('Erreur lors de la soumission de la demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Demande de Paiement
          </DialogTitle>
          <DialogDescription>
            {projectName && <span className="font-medium">{projectName}</span>}
            {phaseName && <span className="text-muted-foreground"> • {phaseName}</span>}
            {stepName && <span className="text-muted-foreground"> • {stepName}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Documents Required Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents d'Inspection Requis
                </CardTitle>
                <Badge variant={allRequiredDocsAvailable ? 'default' : 'destructive'}>
                  {allRequiredDocsAvailable ? 'Complet' : 'Incomplet'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {REQUIRED_DOCUMENT_TYPES.map((docType) => {
                  const status = documentStatus[docType.type];
                  const Icon = docType.icon;
                  
                  return (
                    <div 
                      key={docType.type}
                      className={cn(
                        'flex items-center justify-between p-3 border rounded-lg transition-colors',
                        status?.available 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                          : docType.required
                            ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                            : 'bg-muted/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {status?.available && (
                          <Checkbox
                            checked={selectedDocuments.includes(status.document?.id || '')}
                            onCheckedChange={() => status.document && toggleDocument(status.document.id)}
                          />
                        )}
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{docType.label}</span>
                            {docType.required && (
                              <Badge variant="outline" className="text-xs">Obligatoire</Badge>
                            )}
                          </div>
                          {status?.available && status.document && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(status.document.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {status?.available ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            {status.document?.file_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(status.document?.file_url, '_blank')}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive">Non disponible</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!allRequiredDocsAvailable && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Certains documents obligatoires sont manquants. Veuillez d'abord compléter l'inspection.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Payment Details Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Détails du Paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Montant demandé (MRU) *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="0.00"
                  />
                  {suggestedAmount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Suggestion: {suggestedAmount.toLocaleString()} MRU ({progressAtPayment}% de {estimatedBudget?.toLocaleString()} MRU)
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 ml-2"
                        onClick={() => setAmount(suggestedAmount)}
                      >
                        Appliquer
                      </Button>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Avancement au moment du paiement (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={progressAtPayment}
                    onChange={(e) => setProgressAtPayment(Math.min(100, Math.max(0, Number(e.target.value))))}
                  />
                  <Progress value={progressAtPayment} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Justificatif / Notes</Label>
                <Textarea
                  placeholder="Décrivez la raison de cette demande de paiement..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !allRequiredDocsAvailable || amount <= 0}
          >
            {isSubmitting ? 'Traitement...' : 'Soumettre la demande'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentRequestModal;
