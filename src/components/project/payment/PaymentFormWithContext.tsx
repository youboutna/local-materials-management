/**
 * PaymentFormWithContext - Formulaire de paiement enrichi avec contexte
 * Pré-remplit les champs grâce au CheckpointActionContextService
 * Harmonisé avec EnhancedPaymentBlockingInterface
 * Envoie des notifications après création
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { DollarSign, Info, Loader2, Building, CreditCard, Smartphone, Banknote, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePaymentActionContext } from '@/hooks/useCheckpointActionContext';
import { MilestoneActionContext } from '@/components/project/milestones';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import { useCreateProjectPayment } from '@/hooks/useProjectPayments';
import { NotificationService } from '@/application/services/NotificationService';

interface PaymentFormWithContextProps {
  projectId: string;
  milestoneContext?: MilestoneActionContext;
  isOpen: boolean;
  onClose: () => void;
  onPaymentCreated?: () => void;
}

const paymentMethods = [
  { value: 'virement', label: 'Virement bancaire', icon: Building, color: 'blue' },
  { value: 'cheque', label: 'Chèque', icon: CreditCard, color: 'green' },
  { value: 'mobile', label: 'Mobile Money', icon: Smartphone, color: 'purple' },
  { value: 'especes', label: 'Espèces', icon: Banknote, color: 'yellow' }
];

export function PaymentFormWithContext({
  projectId,
  milestoneContext,
  isOpen,
  onClose,
  onPaymentCreated
}: PaymentFormWithContextProps) {
  const { toast } = useToast();
  const { mutateAsync: createPayment, isPending } = useCreateProjectPayment();
  
  // Fetch full context using the service
  const { data: context, isLoading: contextLoading } = usePaymentActionContext(
    isOpen ? projectId : undefined,
    milestoneContext?.milestoneId,
    milestoneContext?.phaseId
  );

  // Form state
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('virement');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [contractorId, setContractorId] = useState<string | undefined>(undefined);
  const [contractorName, setContractorName] = useState('');
  const [contractorContact, setContractorContact] = useState('');
  
  // Method-specific fields
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileOperator, setMobileOperator] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [notifyContractor, setNotifyContractor] = useState(true);

  // Pre-fill form when context is loaded
  useEffect(() => {
    if (context) {
      if (context.suggestedAmount && context.suggestedAmount > 0) {
        setAmount(context.suggestedAmount);
      }
      if (context.mainContractor) {
        setContractorId(context.mainContractor.id);
        setContractorName(context.mainContractor.name);
        setContractorContact(context.mainContractor.contact);
      }
    }
  }, [context]);

  // Pre-fill from milestone context
  useEffect(() => {
    if (milestoneContext) {
      if (milestoneContext.suggestedAmount) {
        setAmount(milestoneContext.suggestedAmount);
      }
      if (milestoneContext.contractorId) {
        setContractorId(milestoneContext.contractorId);
      }
      if (milestoneContext.contractorName) {
        setContractorName(milestoneContext.contractorName);
      }
      if (milestoneContext.contractorContact) {
        setContractorContact(milestoneContext.contractorContact);
      }
    }
  }, [milestoneContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractorName || !contractorContact) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez renseigner les informations du contractant",
        variant: "destructive",
      });
      return;
    }

    if (amount <= 0) {
      toast({
        title: "Erreur de validation",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPayment({
        projectId,
        payment: {
          amount,
          paymentDate,
          paymentMethod,
          contractorId,
          contractorName,
          contractorContact,
          bankName: paymentMethod === 'virement' ? bankName : undefined,
          accountNumber: paymentMethod === 'virement' ? accountNumber : undefined,
          checkNumber: paymentMethod === 'cheque' ? checkNumber : undefined,
          mobileNumber: paymentMethod === 'mobile' ? mobileNumber : undefined,
          mobileOperator: paymentMethod === 'mobile' ? mobileOperator : undefined,
          receiverName: ['cheque', 'especes'].includes(paymentMethod) ? receiverName : undefined,
        }
      });

      // Send notification if enabled
      if (notifyContractor && contractorId) {
        try {
          const paymentMethodLabel = paymentMethods.find(m => m.value === paymentMethod)?.label || paymentMethod;
          await NotificationService.createNotification({
            recipient_id: contractorId,
            title: 'Paiement effectué',
            message: `Un paiement de ${amount.toLocaleString()} MRU a été effectué par ${paymentMethodLabel} - Projet: ${context?.project.title || projectId}`,
            type: 'payment_processed',
            related_id: projectId,
            metadata: {
              project_id: projectId,
              amount: amount,
              payment_method: paymentMethod,
              payment_date: paymentDate,
              milestone_id: milestoneContext?.milestoneId
            }
          });
        } catch (notifError) {
          console.warn('Failed to send notification:', notifError);
        }
      }

      toast({
        title: "Paiement effectué",
        description: notifyContractor 
          ? `Paiement de ${amount.toLocaleString()} MRU enregistré. Notification envoyée.`
          : `Paiement de ${amount.toLocaleString()} MRU enregistré avec succès.`,
      });

      onClose();
      onPaymentCreated?.();
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const maxAllowed = context?.maxAllowedAmount || 0;
  const isOverLimit = amount > maxAllowed && maxAllowed > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Nouveau paiement
          </DialogTitle>
          <DialogDescription>
            {milestoneContext ? (
              <>Paiement lié au jalon: <strong>{milestoneContext.milestoneTitle}</strong></>
            ) : (
              <>Effectuer un paiement sur le projet</>
            )}
          </DialogDescription>
        </DialogHeader>

        {contextLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chargement du contexte...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Context Summary */}
            {context && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Résumé financier
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-background rounded">
                      <span className="text-muted-foreground block text-xs">Budget total</span>
                      <span className="font-semibold">{context.financialSummary.totalBudget.toLocaleString()} MRU</span>
                    </div>
                    <div className="p-2 bg-background rounded">
                      <span className="text-muted-foreground block text-xs">Déjà payé</span>
                      <span className="font-semibold text-red-600">{context.financialSummary.totalPaid.toLocaleString()} MRU</span>
                    </div>
                    <div className="p-2 bg-background rounded">
                      <span className="text-muted-foreground block text-xs">Progression</span>
                      <span className="font-semibold text-blue-600">{context.project.progress}%</span>
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-green-700 block text-xs">Maximum autorisé</span>
                      <span className="font-bold text-green-800">{context.maxAllowedAmount.toLocaleString()} MRU</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Paiements / Budget</span>
                      <span>{Math.round((context.financialSummary.totalPaid / context.financialSummary.totalBudget) * 100)}%</span>
                    </div>
                    <Progress value={(context.financialSummary.totalPaid / context.financialSummary.totalBudget) * 100} className="h-2" />
                  </div>

                  {context.isInitialPaymentAllowed && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800 text-sm">Paiement initial autorisé</AlertTitle>
                      <AlertDescription className="text-green-700 text-xs">
                        Montant initial autorisé: {context.initialPaymentAmount.toLocaleString()} MRU
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Contractor Selection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Contractant</CardTitle>
              </CardHeader>
              <CardContent>
                <SupplierSelector
                  value={{
                    id: contractorId,
                    name: contractorName,
                    contact: contractorContact,
                    leadTime: 7
                  }}
                  onChange={(supplier) => {
                    setContractorId(supplier.id);
                    setContractorName(supplier.name);
                    setContractorContact(supplier.contact);
                  }}
                  allowCustom={true}
                />
              </CardContent>
            </Card>

            {/* Payment Details */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">
                    Montant (MRU)
                    {context?.suggestedAmount && context.suggestedAmount > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (suggéré: {context.suggestedAmount.toLocaleString()})
                      </span>
                    )}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="1000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className={cn(isOverLimit && "border-destructive")}
                  />
                  {isOverLimit && (
                    <p className="text-xs text-destructive mt-1">
                      Dépasse le maximum autorisé de {maxAllowed.toLocaleString()} MRU
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="date">Date du paiement</Label>
                  <Input
                    id="date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <Label>Méthode de paiement</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.value;
                    return (
                      <Button
                        key={method.value}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "justify-start gap-2 h-auto py-3",
                          isSelected && "ring-2 ring-primary"
                        )}
                        onClick={() => setPaymentMethod(method.value)}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{method.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Method-specific fields */}
              {paymentMethod === 'virement' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Nom de la banque</Label>
                    <Input
                      id="bankName"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Ex: BMCI, BNP..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Numéro de compte</Label>
                    <Input
                      id="accountNumber"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Numéro RIB/IBAN"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'cheque' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkNumber">Numéro de chèque</Label>
                    <Input
                      id="checkNumber"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="receiverName">Nom du bénéficiaire</Label>
                    <Input
                      id="receiverName"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'mobile' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mobileOperator">Opérateur</Label>
                    <Input
                      id="mobileOperator"
                      value={mobileOperator}
                      onChange={(e) => setMobileOperator(e.target.value)}
                      placeholder="Mauritel, Mattel, Bankily..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobileNumber">Numéro mobile</Label>
                    <Input
                      id="mobileNumber"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="+222..."
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'especes' && (
                <div>
                  <Label htmlFor="receiverName">Nom du récepteur</Label>
                  <Input
                    id="receiverName"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                  />
                </div>
              )}

              {/* Notify option */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="notifyContractor"
                  checked={notifyContractor}
                  onCheckedChange={(checked) => setNotifyContractor(checked === true)}
                />
                <label
                  htmlFor="notifyContractor"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Envoyer une notification au contractant
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending || isOverLimit}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  'Effectuer le paiement'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
