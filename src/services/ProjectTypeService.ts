/**
 * Service pour gérer la logique métier spécifique aux types de projets
 * Conformément aux spécifications: Infrastructure, Fourniture, Distribution Rurale
 */

export type ProjectType = 'infrastructure' | 'fourniture' | 'distribution_rurale';

export interface ProjectTypeConfig {
  type: ProjectType;
  label: string;
  description: string;
  requiresEngineeringConsultant: boolean;
  requiresDonorApproval: boolean;
  requiresMinistryApproval: boolean;
  defaultWorkflowTemplate: string;
  paymentWorkflow: 'standard' | 'simplified' | 'custom';
  inspectionFrequency: 'high' | 'medium' | 'low';
  documentationLevel: 'comprehensive' | 'standard' | 'simplified';
}

export class ProjectTypeService {
  private static configs: Record<ProjectType, ProjectTypeConfig> = {
    infrastructure: {
      type: 'infrastructure',
      label: 'Projet Infrastructure',
      description: 'Lignes HT, postes, centrales - Exécution déléguée avec suivi ingénieur conseil',
      requiresEngineeringConsultant: true,
      requiresDonorApproval: true,
      requiresMinistryApproval: true,
      defaultWorkflowTemplate: 'waterfall_donor_funded',
      paymentWorkflow: 'standard',
      inspectionFrequency: 'high',
      documentationLevel: 'comprehensive'
    },
    fourniture: {
      type: 'fourniture',
      label: 'Projet Fourniture',
      description: 'Équipements, matériels, kits solaires - Gestion interne simplifiée',
      requiresEngineeringConsultant: false,
      requiresDonorApproval: false,
      requiresMinistryApproval: false,
      defaultWorkflowTemplate: 'simplified_procurement',
      paymentWorkflow: 'simplified',
      inspectionFrequency: 'low',
      documentationLevel: 'simplified'
    },
    distribution_rurale: {
      type: 'distribution_rurale',
      label: 'Distribution Rurale',
      description: 'Projets de distribution rurale - Financement Ministère avec procédures spécifiques',
      requiresEngineeringConsultant: false,
      requiresDonorApproval: false,
      requiresMinistryApproval: true,
      defaultWorkflowTemplate: 'rural_distribution',
      paymentWorkflow: 'custom',
      inspectionFrequency: 'medium',
      documentationLevel: 'standard'
    }
  };

  /**
   * Récupère la configuration pour un type de projet
   */
  static getConfig(projectType: ProjectType): ProjectTypeConfig {
    return this.configs[projectType];
  }

  /**
   * Vérifie si un projet nécessite un ingénieur conseil
   */
  static requiresEngineeringConsultant(projectType: ProjectType): boolean {
    return this.configs[projectType].requiresEngineeringConsultant;
  }

  /**
   * Vérifie si un projet nécessite l'approbation des bailleurs
   */
  static requiresDonorApproval(projectType: ProjectType): boolean {
    return this.configs[projectType].requiresDonorApproval;
  }

  /**
   * Vérifie si un projet nécessite l'approbation du ministère
   */
  static requiresMinistryApproval(projectType: ProjectType): boolean {
    return this.configs[projectType].requiresMinistryApproval;
  }

  /**
   * Obtient le template de workflow approprié
   */
  static getWorkflowTemplate(projectType: ProjectType): string {
    return this.configs[projectType].defaultWorkflowTemplate;
  }

  /**
   * Détermine le workflow de paiement
   */
  static getPaymentWorkflow(projectType: ProjectType): 'standard' | 'simplified' | 'custom' {
    return this.configs[projectType].paymentWorkflow;
  }

  /**
   * Valide les champs obligatoires selon le type de projet
   */
  static validateProjectFields(projectType: ProjectType, projectData: any): {
    isValid: boolean;
    missingFields: string[];
    warnings: string[];
  } {
    const missingFields: string[] = [];
    const warnings: string[] = [];
    const config = this.configs[projectType];

    // Champs communs obligatoires
    if (!projectData.title) missingFields.push('Titre du projet');
    if (!projectData.description) missingFields.push('Description');
    if (!projectData.budget) missingFields.push('Budget');
    if (!projectData.start_date) missingFields.push('Date de début');

    // Validations spécifiques au type
    if (config.requiresEngineeringConsultant && !projectData.engineering_consultant) {
      missingFields.push('Ingénieur conseil (obligatoire pour les projets infrastructure)');
    }

    if (config.requiresDonorApproval && !projectData.financing_source) {
      warnings.push('Source de financement non spécifiée (recommandé pour projets infrastructure)');
    }

    if (config.requiresMinistryApproval && !projectData.ministry_approval_reference) {
      warnings.push('Référence d\'approbation ministérielle non spécifiée');
    }

    // Validation projet infrastructure
    if (projectType === 'infrastructure') {
      if (!projectData.main_contractor) {
        warnings.push('Entrepreneur principal non défini');
      }
      if (!projectData.project_reference) {
        warnings.push('Référence projet manquante (recommandé pour traçabilité)');
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings
    };
  }

  /**
   * Génère les phases par défaut selon le type de projet
   */
  static getDefaultPhases(projectType: ProjectType): any[] {
    switch (projectType) {
      case 'infrastructure':
        return [
          {
            name: 'Préparation et mobilisation',
            description: 'Installation de chantier et mobilisation des ressources',
            duration: 30,
            requiresInspection: true
          },
          {
            name: 'Travaux de génie civil',
            description: 'Fondations et structures',
            duration: 120,
            requiresInspection: true
          },
          {
            name: 'Installation électrique',
            description: 'Pose et raccordement des équipements',
            duration: 90,
            requiresInspection: true
          },
          {
            name: 'Tests et mise en service',
            description: 'Essais et validation technique',
            duration: 45,
            requiresInspection: true
          },
          {
            name: 'Réception provisoire',
            description: 'Validation et transfert',
            duration: 15,
            requiresInspection: true
          }
        ];

      case 'fourniture':
        return [
          {
            name: 'Commande et approvisionnement',
            description: 'Passation de commande et logistique',
            duration: 45,
            requiresInspection: false
          },
          {
            name: 'Réception et contrôle qualité',
            description: 'Vérification des équipements',
            duration: 7,
            requiresInspection: true
          },
          {
            name: 'Distribution',
            description: 'Livraison aux destinataires',
            duration: 15,
            requiresInspection: false
          }
        ];

      case 'distribution_rurale':
        return [
          {
            name: 'Étude et planification',
            description: 'Études techniques et sociales',
            duration: 60,
            requiresInspection: false
          },
          {
            name: 'Travaux de réseau',
            description: 'Extension du réseau de distribution',
            duration: 180,
            requiresInspection: true
          },
          {
            name: 'Branchements',
            description: 'Raccordement des usagers',
            duration: 45,
            requiresInspection: true
          },
          {
            name: 'Formation et sensibilisation',
            description: 'Formation des usagers et maintenance',
            duration: 15,
            requiresInspection: false
          }
        ];

      default:
        return [];
    }
  }

  /**
   * Détermine les parties prenantes requises selon le type
   */
  static getRequiredStakeholders(projectType: ProjectType): string[] {
    const common = ['project_manager', 'client'];
    const config = this.configs[projectType];

    const required = [...common];

    if (config.requiresEngineeringConsultant) {
      required.push('engineering_consultant');
    }

    if (config.requiresDonorApproval) {
      required.push('donor_representative', 'ministry_focal_point');
    }

    if (projectType === 'infrastructure') {
      required.push('main_contractor', 'technical_supervisor');
    }

    return required;
  }
}
