/**
 * PaymentCalculator - Widget de décompte intelligent
 * Calcule automatiquement les montants à payer basé sur la progression validée
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Calculator,
  DollarSign,
  FileText,
  History,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DecompteData {
  phaseProgress: number;
  validatedProgress: number;
  payablePercentage: number;
  totalContractAmount: number;
  amountToDecompte: number;
  guaranteeRetention: number;
  netPayable: number;
  previousPayments: number;
  remainingAmount: number;
}

interface PaymentCalculatorProps {
  phaseName: string;
  phaseProgress: number;
  validatedProgress: number;
  contractAmount: number;
  guaranteeRetentionRate?: number;
  previousPayments: number;
  onGenerateDecompte: () => void;
  onCreatePaymentRequest: () => void;
  onViewHistory: () => void;
  formatCurrency: (amount: number) => string;
  canRequestPayment?: boolean;
}

const PaymentCalculator: React.FC<PaymentCalculatorProps> = ({
  phaseName,
  phaseProgress,
  validatedProgress,
  contractAmount,
  guaranteeRetentionRate = 5,
  previousPayments,
  onGenerateDecompte,
  onCreatePaymentRequest,
  onViewHistory,
  formatCurrency,
  canRequestPayment = false,
}) => {
  // Calculate decompte data
  const decompte = useMemo((): DecompteData => {
    // Payable percentage based on validated progress (25% increments)
    const payablePercentage = Math.floor(validatedProgress / 25) * 25;
    
    const totalPayable = (contractAmount * payablePercentage / 100);
    const amountToDecompte = Math.max(0, totalPayable - previousPayments);
    const guaranteeRetention = amountToDecompte * (guaranteeRetentionRate / 100);
    const netPayable = Math.max(0, amountToDecompte - guaranteeRetention);
    const remainingAmount = Math.max(0, contractAmount - totalPayable);

    return {
      phaseProgress,
      validatedProgress,
      payablePercentage,
      totalContractAmount: contractAmount,
      amountToDecompte,
      guaranteeRetention,
      netPayable,
      previousPayments,
      remainingAmount,
    };
  }, [phaseProgress, validatedProgress, contractAmount, guaranteeRetentionRate, previousPayments]);

  const hasAmountToPay = decompte.netPayable > 0;

  return (
    <Card className={cn(
      "overflow-hidden",
      hasAmountToPay && canRequestPayment && "border-primary/50 shadow-lg"
    )}>
      <CardHeader className={cn(
        "py-4",
        hasAmountToPay && canRequestPayment 
          ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
          : "bg-gradient-to-r from-muted/50 to-transparent"
      )}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Décompte en cours
          </CardTitle>
          {hasAmountToPay && canRequestPayment && (
            <Badge className="bg-primary text-primary-foreground animate-pulse">
              Paiement disponible
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Phase Info */}
        <div className="p-3 rounded-lg bg-muted/30">
          <p className="text-sm font-medium">{phaseName}</p>
          <p className="text-xs text-muted-foreground">
            {validatedProgress}% validé (physique: {phaseProgress}%)
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Avancement physique
              </span>
              <span className="font-medium">{phaseProgress}%</span>
            </div>
            <Progress value={phaseProgress} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Pourcentage payable
              </span>
              <span className="font-medium text-primary">{decompte.payablePercentage}%</span>
            </div>
            <Progress 
              value={decompte.payablePercentage} 
              className="h-2 bg-primary/20 [&>div]:bg-primary"
            />
            <p className="text-xs text-muted-foreground">
              Selon calendrier financier (paliers de 25%)
            </p>
          </div>
        </div>

        <Separator />

        {/* Financial Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Montant du contrat</span>
            <span className="font-medium">{formatCurrency(decompte.totalContractAmount)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Déjà payé</span>
            <span className="font-medium text-green-600">
              {formatCurrency(decompte.previousPayments)}
            </span>
          </div>

          <Separator className="my-2" />
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Montant à décompter</span>
            <span className="font-bold">{formatCurrency(decompte.amountToDecompte)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Retenue de garantie ({guaranteeRetentionRate}%)
            </span>
            <span className="font-medium text-amber-600">
              -{formatCurrency(decompte.guaranteeRetention)}
            </span>
          </div>
          
          <Separator className="my-2" />
          
          <div className="flex justify-between items-center">
            <span className="font-semibold">Net à payer</span>
            <span className={cn(
              "text-xl font-bold",
              hasAmountToPay ? "text-primary" : "text-muted-foreground"
            )}>
              {formatCurrency(decompte.netPayable)}
            </span>
          </div>
        </div>

        {/* Remaining */}
        {decompte.remainingAmount > 0 && (
          <div className="p-3 rounded-lg bg-muted/30 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reste à payer</span>
              <span className="font-medium">{formatCurrency(decompte.remainingAmount)}</span>
            </div>
          </div>
        )}

        {/* Warning if no amount to pay */}
        {!hasAmountToPay && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Aucun montant à décompter</p>
              <p className="text-amber-700 text-xs mt-1">
                La progression validée ({validatedProgress}%) ne permet pas un nouveau paiement. 
                Prochain palier à {Math.ceil(validatedProgress / 25) * 25}%.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button 
            onClick={onGenerateDecompte}
            variant="outline"
            className="w-full gap-2"
          >
            <FileText className="h-4 w-4" />
            📋 Générer décompte automatique
          </Button>
          
          <Button 
            onClick={onCreatePaymentRequest}
            disabled={!canRequestPayment || !hasAmountToPay}
            className={cn(
              "w-full gap-2",
              hasAmountToPay && canRequestPayment 
                ? "bg-primary hover:bg-primary/90" 
                : ""
            )}
          >
            <DollarSign className="h-4 w-4" />
            📤 Créer demande de paiement
          </Button>
          
          <Button 
            onClick={onViewHistory}
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-muted-foreground"
          >
            <History className="h-4 w-4" />
            📊 Voir historique des décomptes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentCalculator;
