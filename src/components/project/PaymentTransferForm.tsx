
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
import { AlertCircle, AlertTriangle, CreditCard, Building, Smartphone, Banknote } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from '@/components/ui/progress';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentTransferFormProps {
  project: ProjectWithPayments;
  onSubmit: (data: { 
    amount: number; 
    paymentMethod: string; 
    paymentDate: string;
    contractorId?: string;
    contractorName: string;
    contractorContact: string;
    // Method-specific fields
    bankName?: string;
    accountNumber?: string;
    checkNumber?: string;
    mobileNumber?: string;
    mobileOperator?: string;
    receiverName?: string;
  }) => void;
  isSubmitting: boolean;
}

const paymentFormSchema = z.object({
  amount: z.coerce.number().positive("Le montant doit être positif"),
  paymentMethod: z.string().min(1, "Veuillez sélectionner une méthode de paiement"),
  paymentDate: z.string().min(1, "Veuillez sélectionner une date"),
  contractorName: z.string().min(1, "Le nom du contractant est requis"),
  contractorContact: z.string().min(1, "Le contact du contractant est requis"),
  contractorId: z.string().optional(),
  // Method-specific fields
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  checkNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  mobileOperator: z.string().optional(),
  receiverName: z.string().optional(),
}).refine((data) => {
  // Validation based on payment method
  if (data.paymentMethod === "virement") {
    return data.bankName && data.accountNumber;
  }
  if (data.paymentMethod === "cheque") {
    return data.checkNumber && data.receiverName;
  }
  if (data.paymentMethod === "mobile") {
    return data.mobileNumber && data.mobileOperator;
  }
  if (data.paymentMethod === "especes") {
    return data.receiverName;
  }
  return true;
}, {
  message: "Veuillez remplir tous les champs requis pour cette méthode de paiement",
  path: ["paymentMethod"],
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
      contractorName: "",
      contractorContact: "",
      contractorId: undefined,
      bankName: "",
      accountNumber: "",
      checkNumber: "",
      mobileNumber: "",
      mobileOperator: "",
      receiverName: "",
    },
  });
  
  const selectedPaymentMethod = form.watch("paymentMethod");
  
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

  // Payment method configurations
  const paymentMethods = [
    {
      value: "virement",
      label: "Virement bancaire",
      icon: Building,
      color: "blue",
      description: "Transfert via le système bancaire"
    },
    {
      value: "cheque",
      label: "Chèque",
      icon: CreditCard,
      color: "green",
      description: "Paiement par chèque"
    },
    {
      value: "mobile",
      label: "Paiement mobile",
      icon: Smartphone,
      color: "purple",
      description: "Mauritel, Mattel, Bankily..."
    },
    {
      value: "especes",
      label: "Espèces",
      icon: Banknote,
      color: "yellow",
      description: "Paiement en liquide"
    }
  ];
  
  return (
    <div className="space-y-6">
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de validation</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      {/* Project Summary Card - Enhanced design */}
      <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Résumé du projet
          </CardTitle>
          <CardDescription>
            Informations financières et progression
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="gri: grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                <span className="text-sm text-muted-foreground">Budget total</span>
                <span className="font-semibold text-lg">{project.budget.toLocaleString()} MRU</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                <span className="text-sm text-muted-foreground">Déjà payé</span>
                <span className="font-semibold text-lg text-red-600">{totalPaid.toLocaleString()} MRU</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                <span className="text-sm text-muted-foreground">Progression</span>
                <span className="font-semibold text-lg text-blue-600">{project.progress}%</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm text-blue-700">Montant basé sur progression</span>
                <span className="font-bold text-lg text-blue-800">{progressBasedAmount.toLocaleString()} MRU</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm text-green-700">Reste à payer</span>
                <span className="font-bold text-xl text-green-800">{Math.max(0, progressBasedRemaining).toLocaleString()} MRU</span>
              </div>
            </div>
          </div>
          
          {/* Progress Indicators */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progression du paiement vs budget</span>
                <span className="font-medium">{((totalPaid / project.budget) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(totalPaid / project.budget) * 100} className="h-3" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progression vs paiement attendu</span>
                <span className="font-medium">{progressBasedAmount > 0 ? ((totalPaid / progressBasedAmount) * 100).toFixed(1) : 0}%</span>
              </div>
              <Progress 
                value={progressBasedAmount > 0 ? (totalPaid / progressBasedAmount) * 100 : 0} 
                className="h-3" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Status Alerts */}
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
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(validateAndSubmit)} className="space-y-6">
          {/* Contractor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sélection du contractant</CardTitle>
            </CardHeader>
            <CardContent>
              <SupplierSelector
                value={{
                  id: form.watch('contractorId'),
                  name: form.watch('contractorName'),
                  contact: form.watch('contractorContact'),
                  leadTime: 7
                }}
                onChange={(supplier) => {
                  form.setValue('contractorId', supplier.id);
                  form.setValue('contractorName', supplier.name);
                  form.setValue('contractorContact', supplier.contact);
                }}
                allowCustom={true}
              />
            </CardContent>
          </Card>
          
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Détails du paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          className="text-lg font-medium"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Montant basé sur progression: {allowedPaymentAmount.toLocaleString()} MRU
                        <br />
                        Maximum autorisé: {maxToleranceAmount.toLocaleString()} MRU
                      </FormDescription>
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
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection - Enhanced design */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Méthode de paiement</CardTitle>
              <CardDescription>
                Choisissez votre méthode de paiement préférée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        const isSelected = field.value === method.value;
                        return (
                          <div
                            key={method.value}
                            className={`relative cursor-pointer rounded-lg border-2 p-4 hover:shadow-md transition-all ${
                              isSelected 
                                ? `border-${method.color}-500 bg-${method.color}-50` 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => field.onChange(method.value)}
                          >
                            <div className="flex flex-col items-center text-center space-y-2">
                              <Icon className={`h-8 w-8 ${isSelected ? `text-${method.color}-600` : 'text-gray-400'}`} />
                              <div>
                                <p className={`font-medium text-sm ${isSelected ? `text-${method.color}-800` : 'text-gray-700'}`}>
                                  {method.label}
                                </p>
                                <p className={`text-xs ${isSelected ? `text-${method.color}-600` : 'text-gray-500'}`}>
                                  {method.description}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className={`absolute top-2 right-2 w-3 h-3 bg-${method.color}-500 rounded-full`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Method-specific fields - Enhanced responsive design */}
          {selectedPaymentMethod === "virement" && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                  <Building className="h-5 w-5" />
                  Informations bancaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la banque</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: BMCI, BNM, GBM..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de compte</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Numéro de compte du bénéficiaire" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedPaymentMethod === "cheque" && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-green-800">
                  <CreditCard className="h-5 w-5" />
                  Informations du chèque
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro du chèque</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Numéro du chèque" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du bénéficiaire</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nom sur le chèque" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedPaymentMethod === "mobile" && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-purple-800">
                  <Smartphone className="h-5 w-5" />
                  Paiement mobile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mobileOperator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opérateur mobile</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner l'opérateur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mauritel">Mauritel Money</SelectItem>
                            <SelectItem value="mattel">Mattel Money</SelectItem>
                            <SelectItem value="chinguitel">Chinguitel</SelectItem>
                            <SelectItem value="bankily">Bankily</SelectItem>
                            <SelectItem value="masrvi">Masrvi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de téléphone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 22234567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedPaymentMethod === "especes" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-yellow-800">
                  <Banknote className="h-5 w-5" />
                  Paiement en espèces
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="receiverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du bénéficiaire</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nom de la personne qui reçoit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
            disabled={isSubmitting || paymentStatus === "rejected"}
            size="lg"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Traitement en cours...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Effectuer le paiement
              </div>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
