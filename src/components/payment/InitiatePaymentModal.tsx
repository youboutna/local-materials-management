// Modal for initiating payment by different roles
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/use-auth';
import { PaymentInitiationService } from '@/services/PaymentInitiationService';
import { 
  InitiatorRole, 
  ROLE_PAYMENT_LIMITS, 
  ROLE_APPROVAL_CHAIN,
  ROLE_LABELS 
} from '@/types/paymentInitiation';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, AlertTriangle, CheckCircle, Clock, Users, FileText } from 'lucide-react';
import SimpleSupplierSelector from '@/components/selectors/SimpleSupplierSelector';

interface InitiatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  phaseId?: string;
  inspectionId?: string;
  suggestedAmount?: number;
  suggestedSupplierId?: string;
  initiatorRole: InitiatorRole;
  onSuccess?: () => void;
}

const InitiatePaymentModal: React.FC<InitiatePaymentModalProps> = ({
  isOpen,
  onClose,
  projectId,
  phaseId,
  inspectionId,
  suggestedAmount,
  suggestedSupplierId,
  initiatorRole,
  onSuccess
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projectInfo, setProjectInfo] = useState<any>(null);

  // Form state
  const [supplierId, setSupplierId] = useState(suggestedSupplierId || '');
  const [amount, setAmount] = useState(suggestedAmount?.toString() || '');
  const [justification, setJustification] = useState('');
  const [attachedDocs, setAttachedDocs] = useState<string[]>([]);

  const limit = ROLE_PAYMENT_LIMITS[initiatorRole];
  const approvalChain = ROLE_APPROVAL_CHAIN[initiatorRole];
  const roleLabel = ROLE_LABELS[initiatorRole];

  useEffect(() => {
    if (projectId && isOpen) {
      fetchProjectInfo();
    }
  }, [projectId, isOpen]);

  useEffect(() => {
    if (suggestedSupplierId) setSupplierId(suggestedSupplierId);
    if (suggestedAmount) setAmount(suggestedAmount.toString());
  }, [suggestedSupplierId, suggestedAmount]);

  const fetchProjectInfo = async () => {
    const { data } = await supabase
      .from('projects')
      .select('title, budget, status')
      .eq('id', projectId)
      .single();
    
    if (data) setProjectInfo(data);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté', variant: 'destructive' });
      return;
    }

    if (!supplierId || !amount || !justification) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' });
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount > limit) {
      toast({ 
        title: 'Montant dépassé', 
        description: `Le montant maximum autorisé pour ${roleLabel} est ${limit.toLocaleString()} MRU`, 
        variant: 'destructive' 
      });
      return;
    }

    if (initiatorRole === 'inspector' && justification.length < 50) {
      toast({ 
        title: 'Justification insuffisante', 
        description: 'La justification doit contenir au moins 50 caractères', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      await PaymentInitiationService.createInitiation({
        project_id: projectId,
        phase_id: phaseId,
        inspection_id: inspectionId,
        initiator_role: initiatorRole,
        supplier_id: supplierId,
        estimated_amount: numAmount,
        justification,
        attached_documents: attachedDocs
      }, user.id);

      toast({ 
        title: 'Initiation créée', 
        description: approvalChain.length > 0 
          ? 'La demande a été envoyée pour approbation' 
          : 'Le fournisseur a été notifié directement'
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const numAmount = parseFloat(amount) || 0;
  const isOverLimit = numAmount > limit;
  const justificationValid = initiatorRole !== 'inspector' || justification.length >= 50;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Initier un Paiement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Role Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vous initiez en tant que</p>
                  <p className="font-medium">{roleLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Limite de montant</p>
                  <p className="font-medium text-primary">
                    {limit === Infinity ? 'Illimité' : `${limit.toLocaleString()} MRU`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Chain Info */}
          {approvalChain.length > 0 && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>Approbations requises :</strong>{' '}
                {approvalChain.map(role => ROLE_LABELS[role as InitiatorRole] || role).join(' → ')}
              </AlertDescription>
            </Alert>
          )}

          {approvalChain.length === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                En tant que Chef de Projet, le fournisseur sera notifié directement sans approbation.
              </AlertDescription>
            </Alert>
          )}

          {/* Project Info */}
          {projectInfo && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{projectInfo.title}</p>
              <p className="text-xs text-muted-foreground">
                Budget: {projectInfo.budget?.toLocaleString() || 'N/A'} MRU
              </p>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label>Fournisseur / Contractant *</Label>
              <SimpleSupplierSelector
                value={supplierId}
                onChange={setSupplierId}
                placeholder="Sélectionner le fournisseur"
              />
            </div>

            <div>
              <Label>Montant estimé (MRU) *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={isOverLimit ? 'border-red-500' : ''}
              />
              {isOverLimit && (
                <p className="text-xs text-red-500 mt-1">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Montant supérieur à la limite autorisée
                </p>
              )}
            </div>

            <div>
              <Label>
                Justification *
                {initiatorRole === 'inspector' && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (min 50 caractères - {justification.length}/50)
                  </span>
                )}
              </Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Décrivez les raisons de cette demande de paiement..."
                rows={4}
                className={!justificationValid ? 'border-orange-500' : ''}
              />
            </div>

            {/* Attached Documents Info */}
            {attachedDocs.length > 0 && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {attachedDocs.length} document(s) joint(s)
                </span>
              </div>
            )}
          </div>

          {/* Timeline Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Délais estimés</span>
            </div>
            <ul className="mt-2 text-xs text-blue-700 space-y-1">
              {approvalChain.map((role, idx) => (
                <li key={idx}>
                  • {ROLE_LABELS[role as InitiatorRole]}: {role === 'project_manager' ? '24h' : '48h'}
                </li>
              ))}
              <li>• Réponse fournisseur: 7 jours</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || isOverLimit || !justificationValid || !supplierId || !amount}
          >
            {loading ? 'Envoi...' : approvalChain.length > 0 ? 'Soumettre pour approbation' : 'Notifier le fournisseur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InitiatePaymentModal;
