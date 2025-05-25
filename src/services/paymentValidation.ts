
import { ProjectWithPayments, InspectionStatus } from '@/types/project';

export class PaymentValidator {
  static validatePaymentTransfer(project: ProjectWithPayments, amount: number): { valid: boolean; message?: string } {
    // Rule 1: Check project status
    if (!['en cours', 'terminé'].includes(project.status)) {
      return {
        valid: false,
        message: 'Les paiements peuvent seulement être effectués pour les projets avec statut "en cours" ou "terminé"'
      };
    }

    // Rule 2: Check payment date vs project dates
    const today = new Date();
    const startDate = new Date(project.startDate);
    if (today < startDate) {
      return {
        valid: false,
        message: 'Impossible de traiter un paiement avant la date de début du projet'
      };
    }

    // Rule 3: Check if inspection is required and its status
    const latestInspection = project.inspections?.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    if (project.progress >= 25 && (!latestInspection || latestInspection.status !== 'approved')) {
      return {
        valid: false,
        message: 'Le projet nécessite une inspection approuvée pour un progrès ≥25%'
      };
    }

    // Rule 4: Calculate allowed payment amount based on current progress and inspections with 10% tolerance
    const allowedAmount = this.calculateAllowedAmount(project);
    const toleranceAmount = allowedAmount * 1.10; // 10% tolerance above allowed amount
    
    if (amount > toleranceAmount) {
      return {
        valid: false,
        message: `Le montant demandé (${amount.toLocaleString()}) dépasse le paiement autorisé avec tolérance de 10% (${toleranceAmount.toLocaleString()}) basé sur le progrès actuel du projet (${project.progress}%) et les inspections`
      };
    }
    
    // Rule 5: Check maximum budget
    const totalPaid = project.payments ? project.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
    if (totalPaid + amount > project.budget) {
      return {
        valid: false,
        message: `Ce paiement porterait le total des paiements (${(totalPaid + amount).toLocaleString()}) au-delà du budget du projet (${project.budget.toLocaleString()})`
      };
    }

    return { valid: true };
  }

  static calculateAllowedAmount(project: ProjectWithPayments): number {
    // Base amount calculated from current project progress (updated based on inspections)
    const baseAmount = (project.budget * project.progress) / 100;
    
    // Apply inspection modifiers
    const inspectionModifier = this.getInspectionModifier(project);
    
    // Calculate already paid amount
    const totalPaid = project.payments ? project.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
    
    // The allowed amount is the modified base amount minus what has already been paid
    const remainingModifiedBaseAmount = (baseAmount * inspectionModifier) - totalPaid;
    
    // Cannot be negative
    return Math.max(0, remainingModifiedBaseAmount);
  }

  static getMaxAllowedAmountWithTolerance(project: ProjectWithPayments): number {
    const baseAllowed = this.calculateAllowedAmount(project);
    return baseAllowed * 1.10; // 10% tolerance
  }

  private static getInspectionModifier(project: ProjectWithPayments): number {
    if (project.progress < 25) return 1.0; // No inspection needed for progress < 25%
    
    const latestInspection = project.inspections?.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    if (!latestInspection) return 0; // Inspection required but missing
    
    switch (latestInspection.status as InspectionStatus) {
      case 'approved': return 1.0; // Full payment allowed
      case 'requires_changes': return 0.5; // 50% payment allowed
      case 'rejected': return 0; // No payment allowed
      default: return 0; // Pending inspection, no payment allowed
    }
  }
}
