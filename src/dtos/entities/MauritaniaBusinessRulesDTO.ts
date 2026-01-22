/**
 * MauritaniaBusinessRulesDTO
 * 
 * Règles métier spécifiques à la Mauritanie pour les décomptes
 * Retenues, paiements échelonnés, inspections obligatoires
 */

export interface MauritaniaBusinessRulesDTO {
  // Pourcentage de retenue par défaut (10% en Mauritanie)
  retentionPercentage: number;
  
  // Pourcentage de paiement initial autorisé
  initialPaymentPercentage: number;
  
  // Seuils de progression pour les paiements
  paymentThresholds: number[];
  
  // Types de documents requis pour chaque seuil
  requiredDocuments: {
    [threshold: number]: string[];
  };
  
  // Types d'inspections requises pour chaque seuil
  requiredInspections: {
    [threshold: number]: string[];
  };
  
  // Montants minimums par type de paiement
  minimumPaymentAmounts: {
    initial: number;
    progress: number;
    final: number;
  };
  
  // Délais de validation
  validationDelays: {
    inspection: number; // jours
    approval: number; // jours
    payment: number; // jours
  };
  
  // Configuration des notifications
  notificationConfig: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  
  // Actif ou non
  isActive: boolean;
  
  // Date de création
  createdAt: string;
  
  // Date de mise à jour
  updatedAt: string;
}
