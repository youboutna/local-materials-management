import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, DollarSign, Trash2, Calendar } from 'lucide-react';

interface PhasePaymentsProps {
  phaseId: string;
  projectId: string;
}

interface PaymentFormData {
  amount: string;
  payment_method: string;
  payment_date: string;
  progress_at_payment: string;
  contractor_name: string;
  contractor_contact: string;
  transaction_id: string;
}

const PhasePayments: React.FC<PhasePaymentsProps> = ({ phaseId, projectId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    payment_method: 'bank_transfer',
    payment_date: new Date().toISOString().split('T')[0],
    progress_at_payment: '',
    contractor_name: '',
    contractor_contact: '',
    transaction_id: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['phase-payments', phaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('phase_id', phaseId)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (paymentData: PaymentFormData) => {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          project_id: projectId,
          phase_id: phaseId,
          amount: parseFloat(paymentData.amount),
          payment_method: paymentData.payment_method,
          payment_date: paymentData.payment_date,
          progress_at_payment: parseInt(paymentData.progress_at_payment) || 0,
          contractor_name: paymentData.contractor_name,
          contractor_contact: paymentData.contractor_contact,
          transaction_id: paymentData.transaction_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-payments', phaseId] });
      setIsAdding(false);
      resetForm();
      toast({ title: 'Paiement ajouté avec succès' });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-payments', phaseId] });
      toast({ title: 'Paiement supprimé avec succès' });
    },
  });

  const resetForm = () => {
    setFormData({
      amount: '',
      payment_method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      progress_at_payment: '',
      contractor_name: '',
      contractor_contact: '',
      transaction_id: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPaymentMutation.mutate(formData);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      bank_transfer: 'Virement bancaire',
      cash: 'Espèces',
      check: 'Chèque',
      mobile_money: 'Mobile Money',
      other: 'Autre',
    };
    return methods[method] || method;
  };

  if (isLoading) {
    return <div className="animate-pulse">Chargement des paiements...</div>;
  }

  const totalAmount = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Paiements de la phase ({payments?.length || 0})
          </CardTitle>
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un paiement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Enregistrer un paiement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Montant (MRU) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Méthode de paiement</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                        <SelectItem value="cash">Espèces</SelectItem>
                        <SelectItem value="check">Chèque</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_date">Date de paiement</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="progress_at_payment">Progression (%)</Label>
                    <Input
                      id="progress_at_payment"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progress_at_payment}
                      onChange={(e) => setFormData({ ...formData, progress_at_payment: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contractor_name">Nom du contractant *</Label>
                    <Input
                      id="contractor_name"
                      value={formData.contractor_name}
                      onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractor_contact">Contact du contractant *</Label>
                    <Input
                      id="contractor_contact"
                      value={formData.contractor_contact}
                      onChange={(e) => setFormData({ ...formData, contractor_contact: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="transaction_id">ID de transaction *</Label>
                  <Input
                    id="transaction_id"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                    required
                    placeholder="Ex: TXN-2024-001"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Enregistrer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {payments && payments.length > 0 ? (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Total des paiements: {totalAmount.toLocaleString()} MRU
              </p>
            </div>
            
            {payments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-lg">
                      {payment.amount.toLocaleString()} MRU
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {payment.contractor_name} - {payment.contractor_contact}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deletePaymentMutation.mutate(payment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="secondary">
                    {getPaymentMethodLabel(payment.payment_method)}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </Badge>
                  {payment.progress_at_payment && (
                    <Badge>
                      Progression: {payment.progress_at_payment}%
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Transaction: {payment.transaction_id}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun paiement enregistré pour cette phase.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PhasePayments;