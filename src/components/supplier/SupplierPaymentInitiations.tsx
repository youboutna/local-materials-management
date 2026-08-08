// Component for supplier to view and complete payment initiations
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PaymentInitiationService } from '@/application/services/PaymentInitiationService';
import { STATUS_LABELS } from '@/dtos/types/paymentInitiation';
import {
  PaymentInitiationNotificationDTO as PaymentInitiationNotification,
  ROLE_LABELS,
  InitiatorRole
} from '@/dtos/entities/PaymentInitiationDTO';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  DollarSign, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Send,
  Eye,
  Calendar,
  Building
} from 'lucide-react';

interface SupplierPaymentInitiationsProps {
  supplierId: string;
}

const SupplierPaymentInitiations: React.FC<SupplierPaymentInitiationsProps> = ({ supplierId }) => {
  const { toast } = useToast();
  const [initiations, setInitiations] = useState<PaymentInitiationNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInitiation, setSelectedInitiation] = useState<PaymentInitiationNotification | null>(null);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  
  // Completion form state
  const [finalAmount, setFinalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentReason, setPaymentReason] = useState<'progress_payment' | 'inspection_fee' | 'final_payment' | 'other'>('progress_payment');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitiations();
  }, [supplierId]);

  const fetchInitiations = async () => {
    setLoading(true);
    try {
      const data = await PaymentInitiationService.getInstance().getPendingInitiations(supplierId);
      setInitiations(data);
    } catch (error) {
      console.error('Error fetching initiations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCompletionDialog = (initiation: PaymentInitiationNotification) => {
    setSelectedInitiation(initiation);
    setFinalAmount(initiation.estimatedAmount.toString());
    setDescription('');
    setPaymentReason('progress_payment');
    setNotes('');
    setIsCompletionDialogOpen(true);
  };

  const handleComplete = async () => {
    if (!selectedInitiation) return;

    const numAmount = parseFloat(finalAmount);
    const maxAmount = selectedInitiation.estimatedAmount * 1.1;

    if (numAmount > maxAmount) {
      toast({
        title: 'Montant dépassé',
        description: `Le montant ne peut pas dépasser ${maxAmount.toLocaleString()} MRU (+10% de l'estimation)`,
        variant: 'destructive'
      });
      return;
    }

    if (!description.trim()) {
      toast({ title: 'Erreur', description: 'La description est obligatoire', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await PaymentInitiationService.getInstance().handleSupplierCompletion({
        notification_id: selectedInitiation.id,
        final_amount: numAmount,
        description,
        payment_reason: paymentReason,
        notes
      } as any);

      toast({ title: 'Demande soumise', description: 'Votre demande de paiement a été créée avec succès' });
      setIsCompletionDialogOpen(false);
      fetchInitiations();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
      supplier_notified: { variant: 'default', className: 'bg-blue-500' },
      ready_for_supplier: { variant: 'default', className: 'bg-blue-500' },
      supplier_completed: { variant: 'secondary', className: 'bg-green-500 text-white' },
      approved: { variant: 'secondary', className: 'bg-green-600 text-white' },
      rejected: { variant: 'destructive', className: '' },
      expired: { variant: 'outline', className: 'text-red-500 border-red-500' }
    };
    const config = configs[status] || { variant: 'outline' as const, className: '' };
    return <Badge variant={config.variant} className={config.className}>{STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}</Badge>;
  };

  const pendingInitiations = initiations.filter(i => 
    i.status === 'ready_for_supplier'
  );
  const completedInitiations = initiations.filter(i => 
    i.status !== 'ready_for_supplier'
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Demandes de Paiement Initiées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {initiations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune demande de paiement initiée pour le moment</p>
            </div>
          ) : (
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  À compléter ({pendingInitiations.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Traitées ({completedInitiations.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {pendingInitiations.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">Aucune demande en attente</p>
                ) : (
                  pendingInitiations.map(initiation => (
                    <InitiationCard 
                      key={initiation.id}
                      initiation={initiation}
                      onComplete={() => openCompletionDialog(initiation)}
                      showCompleteButton
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {completedInitiations.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">Aucune demande traitée</p>
                ) : (
                  completedInitiations.map(initiation => (
                    <InitiationCard 
                      key={initiation.id}
                      initiation={initiation}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Completion Dialog */}
      <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Compléter la demande de paiement</DialogTitle>
          </DialogHeader>

          {selectedInitiation && (
            <div className="space-y-4">
              {/* Info Card */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Projet</span>
                    <span className="font-medium">{selectedInitiation.projectTitle || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Montant estimé</span>
                    <span className="font-medium text-primary">{selectedInitiation.estimatedAmount.toLocaleString()} MRU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Montant max (+10%)</span>
                    <span className="text-sm">{(selectedInitiation.estimatedAmount * 1.1).toLocaleString()} MRU</span>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label>Montant final (MRU) *</Label>
                <Input
                  type="number"
                  value={finalAmount}
                  onChange={(e) => setFinalAmount(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label>Motif du paiement *</Label>
                <Select value={paymentReason} onValueChange={(v: any) => setPaymentReason(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="progress_payment">Paiement d'avancement</SelectItem>
                    <SelectItem value="inspection_fee">Frais d'inspection</SelectItem>
                    <SelectItem value="final_payment">Paiement final</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description détaillée *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez les travaux/prestations réalisés..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Notes additionnelles</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations complémentaires..."
                  rows={2}
                />
              </div>

              {selectedInitiation.supplierDeadline && (
                <Alert className={isPast(new Date(selectedInitiation.supplierDeadline)) ? 'border-red-500 bg-red-50' : 'border-orange-200 bg-orange-50'}>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Date limite: {format(new Date(selectedInitiation.supplierDeadline), 'PPP', { locale: fr })}
                    {isPast(new Date(selectedInitiation.supplierDeadline)) && (
                      <span className="text-red-600 font-medium ml-2">(Délai dépassé!)</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompletionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleComplete} disabled={submitting}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Envoi...' : 'Soumettre'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Initiation Card Component
interface InitiationCardProps {
  initiation: PaymentInitiationNotification;
  onComplete?: () => void;
  showCompleteButton?: boolean;
}

const InitiationCard: React.FC<InitiationCardProps> = ({ initiation, onComplete, showCompleteButton }) => {
  const isExpiring = initiation.supplierDeadline && 
    !isPast(new Date(initiation.supplierDeadline)) &&
    new Date(initiation.supplierDeadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  const isExpired = initiation.supplierDeadline && isPast(new Date(initiation.supplierDeadline));

  return (
    <Card className={`border-l-4 ${isExpired ? 'border-l-red-500' : isExpiring ? 'border-l-orange-500' : 'border-l-blue-500'}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{initiation.projectTitle || 'Projet'}</span>
              {initiation.phaseId && (
                <span className="text-sm text-muted-foreground">• {initiation.phaseId}</span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {initiation.estimatedAmount.toLocaleString()} MRU
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(initiation.createdAt), 'dd/MM/yyyy')}
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">{initiation.justification}</p>

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {ROLE_LABELS[initiation.initiatorRole as InitiatorRole]}
              </Badge>
              {initiation.supplierDeadline && (
                <span className={`text-xs ${isExpired ? 'text-red-600' : isExpiring ? 'text-orange-600' : 'text-muted-foreground'}`}>
                  <Clock className="h-3 w-3 inline mr-1" />
                  {isExpired 
                    ? 'Délai dépassé' 
                    : `Expire ${formatDistanceToNow(new Date(initiation.supplierDeadline), { locale: fr, addSuffix: true })}`
                  }
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(initiation.status)}
            
            {showCompleteButton && !isExpired && (
              <Button size="sm" onClick={onComplete}>
                <Send className="h-4 w-4 mr-1" />
                Compléter
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const getStatusBadge = (status: string) => {
  const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
    supplier_notified: { variant: 'default', className: 'bg-blue-500' },
    ready_for_supplier: { variant: 'default', className: 'bg-blue-500' },
    supplier_completed: { variant: 'secondary', className: 'bg-green-500 text-white' },
    approved: { variant: 'secondary', className: 'bg-green-600 text-white' },
    rejected: { variant: 'destructive', className: '' },
    expired: { variant: 'outline', className: 'text-red-500 border-red-500' }
  };
  const config = configs[status] || { variant: 'outline' as const, className: '' };
  return <Badge variant={config.variant} className={config.className}>{STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}</Badge>;
};

export default SupplierPaymentInitiations;
