import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertCircle, FileText, Building2, CreditCard } from 'lucide-react';

interface PaymentRequest {
  id: string;
  supplier_id: string;
  project_id: string;
  amount: number;
  description: string;
  payment_reason: string;
  status: string;
  requested_date: string;
  notes: string;
  suppliers?: {
    name: string;
    account_number: string | null;
    bank_name: string | null;
    rib: string | null;
  };
  projects?: {
    title: string;
  };
}

interface PaymentRequestDetailsDialogProps {
  request: PaymentRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (request: PaymentRequest) => void;
  onReject: (request: PaymentRequest, reason: string) => void;
}

export const PaymentRequestDetailsDialog: React.FC<PaymentRequestDetailsDialogProps> = ({
  request,
  open,
  onOpenChange,
  onApprove,
  onReject,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!request) return null;

  const hasBankingInfo = !!(
    request.suppliers?.account_number ||
    request.suppliers?.bank_name ||
    request.suppliers?.rib
  );

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    onReject(request, rejectionReason);
    setRejectionReason('');
    setShowRejectInput(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Détails de la demande de paiement
          </DialogTitle>
          <DialogDescription>
            Demande du {new Date(request.requested_date).toLocaleDateString('fr-FR')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Statut</p>
              <Badge variant={request.status === 'approved' ? 'default' : 'secondary'} className="mt-1">
                {request.status === 'pending' ? 'En attente' : request.status === 'approved' ? 'Approuvé' : 'Rejeté'}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Montant</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {request.amount.toLocaleString('fr-FR')} MRU
              </p>
            </div>
          </div>

          {/* Project & Supplier Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Projet
              </Label>
              <p className="text-sm">{request.projects?.title || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <Label>Fournisseur</Label>
              <p className="text-sm">{request.suppliers?.name || 'N/A'}</p>
            </div>
          </div>

          <Separator />

          {/* Payment Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <p className="text-sm bg-muted p-3 rounded-md">{request.description}</p>
            </div>

            <div className="space-y-2">
              <Label>Motif</Label>
              <p className="text-sm">
                {request.payment_reason === 'inspection_fee' ? 'Frais d\'inspection' :
                 request.payment_reason === 'progress_payment' ? 'Paiement d\'avancement' :
                 request.payment_reason}
              </p>
            </div>

            {request.notes && (
              <div className="space-y-2">
                <Label>Notes</Label>
                <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Banking Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <Label className="text-base font-semibold">Informations bancaires</Label>
              {hasBankingInfo ? (
                <Badge variant="default" className="bg-green-600 ml-auto">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complète
                </Badge>
              ) : (
                <Badge variant="destructive" className="ml-auto">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Manquante
                </Badge>
              )}
            </div>

            {hasBankingInfo ? (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                {request.suppliers?.bank_name && (
                  <div>
                    <p className="text-xs text-muted-foreground">Banque</p>
                    <p className="text-sm font-medium">{request.suppliers.bank_name}</p>
                  </div>
                )}
                {request.suppliers?.account_number && (
                  <div>
                    <p className="text-xs text-muted-foreground">Numéro de compte</p>
                    <p className="text-sm font-medium">{request.suppliers.account_number}</p>
                  </div>
                )}
                {request.suppliers?.rib && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">RIB</p>
                    <p className="text-sm font-medium">{request.suppliers.rib}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Le fournisseur doit compléter ses informations bancaires et joindre la facture de décompte avant validation.
                </p>
              </div>
            )}
          </div>

          {/* Rejection Reason Input */}
          {showRejectInput && (
            <div className="space-y-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <Label htmlFor="rejection-reason">Raison du rejet *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez la raison du rejet..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          
          {request.status === 'pending' && (
            <>
              {!showRejectInput ? (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectInput(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      onApprove(request);
                      onOpenChange(false);
                    }}
                    disabled={!hasBankingInfo}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectInput(false);
                      setRejectionReason('');
                    }}
                  >
                    Annuler le rejet
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Confirmer le rejet
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
