
import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectWithPayments } from '@/types/project';
import { PaymentValidator } from '@/services/paymentValidation';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from '@/components/ui/progress';

interface PaymentTransferFormProps {
  project: ProjectWithPayments;
  onSubmit: (data: { amount: number; paymentMethod: string; paymentDate: string }) => void;
  isSubmitting: boolean;
}

const paymentFormSchema = z.object({
  amount: z.coerce.number().positive("Le montant doit être positif"),
  paymentMethod: z.string().min(1, "Veuillez sélectionner une méthode de paiement"),
  paymentDate: z.string().min(1, "Veuillez sélectionner une date"),
});

export function PaymentTransferForm({ project, onSubmit, isSubmitting }: PaymentTransferFormProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [allowedPaymentAmount, setAllowedPaymentAmount] = useState<number>(
    PaymentValidator.calculateAllowedAmount(project)
  );
  const [maxToleranceAmount, setMaxToleranceAmount] = useState<number>(
    PaymentValidator.getMaxAllowedAmountWithTolerance(project)
  );
  
  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "virement",
      paymentDate: new Date().toISOString().split('T')[0],
    },
  });
  
  const validateAndSubmit = (values: z.infer<typeof paymentFormSchema>) => {
    const validation = PaymentValidator.validatePaymentTransfer(project, values.amount);
    
    if (!validation.valid) {
      setValidationError(validation.message || "Erreur de validation du paiement");
      return;
    }
    
    setValidationError(null);
    onSubmit(values);
  };
  
  // Calculate remaining budget
  const totalPaid = project.payments ? 
    project.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
  const remainingBudget = project.budget - totalPaid;
  
  // Calculate progress-based payment info
  const progressBasedAmount = (project.budget * project.progress) / 100;
  const progressBasedRemaining = progressBasedAmount - totalPaid;
  
  // Determine payment status
  const paymentStatus = (() => {
    if (project.progress < 25) return "initial";
    
    const latestInspection = project.inspections?.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    if (!latestInspection) return "inspection_required";
    
    return latestInspection.status;
  })();
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(validateAndSubmit)} className="space-y-4">
        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de validation</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
        
        <div className="bg-gray-50 p-4 rounded-md border mb-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">Budget total</div>
            <div className="font-medium">{project.budget.toLocaleString()} MRU</div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-muted-foreground">Déjà payé</div>
            <div className="font-medium">{totalPaid.toLocaleString()} MRU</div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-muted-foreground">Progression actuelle</div>
            <div className="font-medium">{project.progress}%</div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-muted-foreground">Montant basé sur progression</div>
            <div className="font-medium">{progressBasedAmount.toLocaleString()} MRU</div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-muted-foreground">Reste à payer (progression)</div>
            <div className="font-bold text-lg text-blue-600">{Math.max(0, progressBasedRemaining).toLocaleString()} MRU</div>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-sm">
              <span>Progression du paiement vs budget</span>
              <span>{((totalPaid / project.budget) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(totalPaid / project.budget) * 100} className="h-2 mt-1" />
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-sm">
              <span>Progression vs paiement attendu</span>
              <span>{progressBasedAmount > 0 ? ((totalPaid / progressBasedAmount) * 100).toFixed(1) : 0}%</span>
            </div>
            <Progress value={progressBasedAmount > 0 ? (totalPaid / progressBasedAmount) * 100 : 0} className="h-2 mt-1" />
          </div>
        </div>
        
        {paymentStatus === "inspection_required" && (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Inspection requise</AlertTitle>
            <AlertDescription className="text-amber-700">
              Une inspection approuvée est requise avant de pouvoir effectuer un paiement pour ce projet 
              avec une progression ≥ 25%.
            </AlertDescription>
          </Alert>
        )}
        
        {paymentStatus === "requires_changes" && (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Paiement limité</AlertTitle>
            <AlertDescription className="text-amber-700">
              L'inspection a révélé des modifications nécessaires. Le paiement maximal autorisé 
              est de {allowedPaymentAmount.toLocaleString()} MRU (50% du montant basé sur la progression).
              Avec tolérance de 10%: {maxToleranceAmount.toLocaleString()} MRU
            </AlertDescription>
          </Alert>
        )}
        
        {paymentStatus === "rejected" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Paiement impossible</AlertTitle>
            <AlertDescription>
              L'inspection a été rejetée. Aucun paiement ne peut être effectué jusqu'à ce qu'une 
              nouvelle inspection soit approuvée.
            </AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant (MRU)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  step="1000" 
                  {...field} 
                  onChange={e => field.onChange(e.target.valueAsNumber)}
                  disabled={paymentStatus === "rejected"}
                />
              </FormControl>
              <FormDescription>
                Montant basé sur progression ({project.progress}%): {allowedPaymentAmount.toLocaleString()} MRU
                <br />
                Montant maximum autorisé (avec tolérance 10%): {maxToleranceAmount.toLocaleString()} MRU
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Méthode de paiement</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={paymentStatus === "rejected"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner méthode de paiement" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="virement">Virement bancaire</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="mobile">Paiement mobile</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date du paiement</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field} 
                  disabled={paymentStatus === "rejected"}
                  max={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700 mt-2"
          disabled={isSubmitting || paymentStatus === "rejected"}
        >
          {isSubmitting ? "Traitement..." : "Effectuer le paiement"}
        </Button>
      </form>
    </Form>
  );
}
