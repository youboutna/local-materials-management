import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, AlertTriangle, DollarSign, Clock, Ban, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  validatePaymentEligibility, 
  attemptPayment, 
  getPaymentBlockHistory,
  PaymentValidationResult 
} from '@/services/paymentBlockingService';

const paymentFormSchema = z.object({
  projectId: z.string().min(1, 'ID projet requis'),
  contractorId: z.string().min(1, 'ID entrepreneur requis'),
  amount: z.number().min(1, 'Montant requis'),
  contractorName: z.string().min(1, 'Nom entrepreneur requis'),
  contractorContact: z.string().min(1, 'Contact entrepreneur requis'),
  paymentMethod: z.string().min(1, 'Méthode de paiement requise'),
  progressAtPayment: z.number().min(0).max(100, 'Progression doit être entre 0 et 100'),
  notes: z.string().optional()
});

const PaymentBlockingInterface = () => {
  const [validationResult, setValidationResult] = useState<PaymentValidationResult | null>(null);
  const [blockHistory, setBlockHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      progressAtPayment: 0,
      paymentMethod: 'bank_transfer'
    }
  });

  const onValidatePayment = async (values: z.infer<typeof paymentFormSchema>) => {
    try {
      setLoading(true);
      const result = await validatePaymentEligibility(
        values.projectId, 
        values.contractorId, 
        values.amount
      );
      setValidationResult(result);
      
      if (result.canProceed) {
        toast({
          title: "Validation réussie",
          description: "Le paiement peut être traité"
        });
      } else {
        toast({
          title: "Paiement bloqué",
          description: `${result.blockingReasons.length} problème(s) détecté(s)`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error validating payment:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la validation du paiement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const onProcessPayment = async (values: z.infer<typeof paymentFormSchema>) => {
    try {
      setLoading(true);
      const result = await attemptPayment(
        values.projectId,
        values.contractorId,
        values.amount,
        {
          contractor_name: values.contractorName,
          contractor_contact: values.contractorContact,
          payment_method: values.paymentMethod,
          progress_at_payment: values.progressAtPayment
        }
      );

      if (result.success) {
        toast({
          title: "Paiement effectué",
          description: `Paiement de ${values.amount} MRU traité avec succès`
        });
        form.reset();
        setValidationResult(null);
        setIsDialogOpen(false);
      } else {
        toast({
          title: "Paiement bloqué",
          description: "Le paiement n'a pas pu être traité",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement du paiement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'expired_insurance': return <Shield className="h-4 w-4" />;
      case 'expired_guarantee': return <Shield className="h-4 w-4" />;
      case 'project_delay': return <Clock className="h-4 w-4" />;
      case 'compliance_issue': return <AlertTriangle className="h-4 w-4" />;
      default: return <Ban className="h-4 w-4" />;
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      'expired_insurance': 'Assurance expirée',
      'expired_guarantee': 'Garantie expirée',
      'project_delay': 'Retard projet',
      'compliance_issue': 'Problème conformité'
    };
    return labels[reason] || reason;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contrôle des Paiements</h2>
          <p className="text-muted-foreground">
            Système de blocage automatique basé sur les garanties et conformité
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <DollarSign className="h-4 w-4 mr-2" />
              Nouveau Paiement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Traitement de Paiement</DialogTitle>
              <DialogDescription>
                Valider les prérequis et traiter un paiement entrepreneur
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Projet</FormLabel>
                        <FormControl>
                          <Input placeholder="proj-123..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Entrepreneur</FormLabel>
                        <FormControl>
                          <Input placeholder="cont-456..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contractorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom Entrepreneur</FormLabel>
                      <FormControl>
                        <Input placeholder="Entreprise BTP..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant (MRU)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="500000" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="progressAtPayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Progression (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="75" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contractorContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Entrepreneur</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemple.com ou +222..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Méthode de Paiement</FormLabel>
                      <FormControl>
                        <Input placeholder="bank_transfer, check, mobile..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    onClick={form.handleSubmit(onValidatePayment)}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? 'Validation...' : 'Valider Prérequis'}
                  </Button>
                  
                  {validationResult?.canProceed && (
                    <Button 
                      type="button" 
                      onClick={form.handleSubmit(onProcessPayment)}
                      disabled={loading}
                    >
                      {loading ? 'Traitement...' : 'Traiter Paiement'}
                    </Button>
                  )}
                </div>
              </form>
            </Form>

            {/* Validation Results */}
            {validationResult && (
              <div className="mt-6 space-y-4">
                <div className={`p-4 rounded-lg border ${validationResult.canProceed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {validationResult.canProceed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Ban className="h-5 w-5 text-red-600" />
                    )}
                    <h3 className="font-medium">
                      {validationResult.canProceed ? 'Paiement autorisé' : 'Paiement bloqué'}
                    </h3>
                  </div>
                  
                  {validationResult.blockingReasons.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-700">Problèmes bloquants:</p>
                      {validationResult.blockingReasons.map((reason, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                          {getReasonIcon(reason.reason)}
                          <span>{getReasonLabel(reason.reason)}: {reason.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {validationResult.warningReasons.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-sm font-medium text-orange-700">Avertissements:</p>
                      {validationResult.warningReasons.map((reason, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-orange-600">
                          {getReasonIcon(reason.reason)}
                          <span>{getReasonLabel(reason.reason)}: {reason.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements Bloqués</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">12</div>
            <p className="text-xs text-muted-foreground">
              Ce mois
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assurances Expirées</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">5</div>
            <p className="text-xs text-muted-foreground">
              Entrepreneurs concernés
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets en Retard</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">8</div>
            <p className="text-xs text-muted-foreground">
              Retards &gt; 20%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Blocked Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements Bloqués Récents</CardTitle>
          <CardDescription>
            Historique des paiements bloqués par le système de contrôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock data - replace with real data */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Ban className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">Entreprise Sahel BTP</p>
                  <p className="text-sm text-muted-foreground">Projet Axe Idini - 850,000 MRU</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="destructive">Assurance expirée</Badge>
                <p className="text-xs text-muted-foreground mt-1">Il y a 2 heures</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Ban className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">Construction Moderne SARL</p>
                  <p className="text-sm text-muted-foreground">Projet Électrification - 1,200,000 MRU</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="destructive">Retard &gt; 20%</Badge>
                <p className="text-xs text-muted-foreground mt-1">Il y a 1 jour</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentBlockingInterface;