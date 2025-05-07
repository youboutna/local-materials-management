
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

    // Rule 4: Calculate allowed payment amount based on progress and inspections
    const allowedAmount = this.calculateAllowedAmount(project);
    if (amount > allowedAmount) {
      return {
        valid: false,
        message: `Le montant demandé (${amount}) dépasse le paiement autorisé (${allowedAmount}) basé sur le progrès et les inspections du projet`
      };
    }

    return { valid: true };
  }

  static calculateAllowedAmount(project: ProjectWithPayments): number {
    const baseAmount = (project.budget * project.progress) / 100;
    
    // Apply inspection modifiers
    const inspectionModifier = this.getInspectionModifier(project);
    
    return baseAmount * inspectionModifier;
  }

  private static getInspectionModifier(project: ProjectWithPayments): number {
    if (project.progress < 25) return 1.0; // No inspection needed
    
    const latestInspection = project.inspections?.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    if (!latestInspection) return 0; // Inspection required but missing
    
    switch (latestInspection.status) {
      case 'approved': return 1.0;
      case 'requires_changes': return 0.5;
      case 'rejected': return 0;
      default: return 0;
    }
  }
}
