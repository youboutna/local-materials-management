/**
 * Mauritanian Public Procurement Workflows
 * Based on official procurement manual procedures
 */

export type ProcurementType = 
  | 'AOO_PREQUALIF' // Appel d'Offres Ouvert avec préqualification
  | 'AOO_SANS_PREQUALIF' // Appel d'Offres Ouvert sans préqualification
  | 'AO_2_ETAPES' // Appel d'Offres en deux étapes
  | 'AOR' // Appel d'Offres Restreint
  | 'CS' // Consultation Simplifiée
  | 'ED' // Entente Directe
  | 'SFQC' // Sélection de consultants - Qualité et Coût
  | 'SMC' // Sélection de consultants - Moindre Coût
  | 'SBD' // Sélection de consultants - Budget Déterminé
  | 'SFQT' // Sélection de consultants - Qualité Technique
  | 'QC' // Qualification de consultants
  | 'CI' // Consultant Individuel
  | 'EXECUTION'; // Exécution des marchés

export interface ProcurementWorkflowStep {
  id: string;
  code: string;
  label: string;
  description: string;
  estimatedDurationDays?: number;
  requiredDocuments?: string[];
  requiresCPMPApproval?: boolean;
  requiresCNCMPApproval?: boolean;
  subSteps?: ProcurementWorkflowStep[];
}

export interface ProcurementWorkflow {
  type: ProcurementType;
  name: string;
  description: string;
  applicableFor: string[];
  steps: ProcurementWorkflowStep[];
}

export const MAURITANIAN_PROCUREMENT_WORKFLOWS: Record<ProcurementType, ProcurementWorkflow> = {
  AOO_PREQUALIF: {
    type: 'AOO_PREQUALIF',
    name: 'Appel d\'Offres Ouvert avec Préqualification',
    description: 'Procédure en deux phases : préqualification puis appel d\'offres',
    applicableFor: ['Travaux complexes', 'Marchés de grande envergure'],
    steps: [
      {
        id: 'prequalif',
        code: 'PREQUALIFICATION',
        label: 'Phase de Préqualification',
        description: 'Sélection des candidats qualifiés',
        subSteps: [
          {
            id: 'prequalif-1',
            code: 'ELABORATION_DOSSIER_PREQUALIF',
            label: 'Élaboration du dossier et avis de préqualification',
            description: 'Préparation des documents de préqualification',
            estimatedDurationDays: 10,
            requiredDocuments: ['Avis de préqualification', 'Critères de sélection']
          },
          {
            id: 'prequalif-2',
            code: 'APPROBATION_PUBLICATION',
            label: 'Approbation par la CPMP et publication',
            description: 'Validation et diffusion de l\'avis',
            estimatedDurationDays: 5,
            requiresCPMPApproval: true
          },
          {
            id: 'prequalif-3',
            code: 'RECEPTION_OUVERTURE_PREQUALIF',
            label: 'Réception et ouverture des offres de préqualification',
            description: 'Collecte et ouverture publique des candidatures',
            estimatedDurationDays: 30
          },
          {
            id: 'prequalif-4',
            code: 'ANALYSE_RAPPORT_PREQUALIF',
            label: 'Analyse et rapport de préqualification',
            description: 'Évaluation des candidatures et rédaction du rapport',
            estimatedDurationDays: 15,
            requiresCPMPApproval: true
          },
          {
            id: 'prequalif-5',
            code: 'PUBLICATION_RESULTATS_PREQUALIF',
            label: 'Publication des résultats',
            description: 'Annonce de la liste des candidats préqualifiés',
            estimatedDurationDays: 5
          }
        ]
      },
      {
        id: 'ao',
        code: 'APPEL_OFFRES',
        label: 'Phase d\'Appel d\'Offres',
        description: 'Lancement de l\'appel d\'offres aux candidats préqualifiés',
        subSteps: [
          {
            id: 'ao-1',
            code: 'ELABORATION_DAO',
            label: 'Élaboration et approbation du DAO',
            description: 'Préparation du dossier d\'appel d\'offres',
            estimatedDurationDays: 20,
            requiresCPMPApproval: true,
            requiredDocuments: ['DAO complet', 'Plans', 'Cahier des charges']
          },
          {
            id: 'ao-2',
            code: 'ENVOI_CANDIDATS',
            label: 'Envoi aux candidats préqualifiés',
            description: 'Transmission du DAO aux candidats retenus',
            estimatedDurationDays: 3
          },
          {
            id: 'ao-3',
            code: 'RECEPTION_OUVERTURE_OFFRES',
            label: 'Réception et ouverture des offres',
            description: 'Collecte et ouverture publique des offres',
            estimatedDurationDays: 45
          },
          {
            id: 'ao-4',
            code: 'EVALUATION_ATTRIBUTION_PROV',
            label: 'Évaluation et attribution provisoire',
            description: 'Analyse technique et financière des offres',
            estimatedDurationDays: 30,
            requiresCPMPApproval: true
          },
          {
            id: 'ao-5',
            code: 'ATTRIBUTION_DEFINITIVE',
            label: 'Attribution définitive et signature du marché',
            description: 'Formalisation du contrat avec l\'attributaire',
            estimatedDurationDays: 15,
            requiresCNCMPApproval: true
          }
        ]
      }
    ]
  },

  AOO_SANS_PREQUALIF: {
    type: 'AOO_SANS_PREQUALIF',
    name: 'Appel d\'Offres Ouvert sans Préqualification',
    description: 'Procédure standard d\'appel d\'offres ouvert',
    applicableFor: ['Travaux standards', 'Fournitures', 'Services'],
    steps: [
      {
        id: 'aoo-1',
        code: 'INSCRIPTION_PPM',
        label: 'Inscription au PPM',
        description: 'Inscription au Plan de Passation des Marchés',
        estimatedDurationDays: 5
      },
      {
        id: 'aoo-2',
        code: 'ELABORATION_DAO_AVIS',
        label: 'Élaboration et approbation du DAO et de l\'avis',
        description: 'Préparation complète du dossier d\'appel d\'offres',
        estimatedDurationDays: 20,
        requiresCPMPApproval: true,
        requiredDocuments: ['DAO', 'Avis d\'appel d\'offres', 'Cahier des charges']
      },
      {
        id: 'aoo-3',
        code: 'PUBLICATION_AVIS',
        label: 'Publication de l\'avis',
        description: 'Diffusion publique de l\'avis d\'appel d\'offres',
        estimatedDurationDays: 3
      },
      {
        id: 'aoo-4',
        code: 'RECEPTION_OUVERTURE',
        label: 'Réception et ouverture des offres',
        description: 'Collecte et ouverture publique des soumissions',
        estimatedDurationDays: 45
      },
      {
        id: 'aoo-5',
        code: 'EVALUATION_ATTRIBUTION_PROV',
        label: 'Évaluation et attribution provisoire',
        description: 'Analyse et classement des offres',
        estimatedDurationDays: 30,
        requiresCPMPApproval: true
      },
      {
        id: 'aoo-6',
        code: 'ATTRIBUTION_SIGNATURE',
        label: 'Attribution définitive et signature',
        description: 'Finalisation et signature du marché',
        estimatedDurationDays: 15,
        requiresCNCMPApproval: true
      }
    ]
  },

  AO_2_ETAPES: {
    type: 'AO_2_ETAPES',
    name: 'Appel d\'Offres en Deux Étapes',
    description: 'Procédure en deux phases : propositions techniques puis offres finales',
    applicableFor: ['Marchés complexes nécessitant des clarifications techniques'],
    steps: [
      {
        id: 'etape1',
        code: 'PROPOSITIONS_TECHNIQUES',
        label: 'Étape 1 : Propositions Techniques',
        description: 'Soumission et évaluation des propositions techniques',
        subSteps: [
          {
            id: 'etape1-1',
            code: 'ELABORATION_DAO_PROV',
            label: 'Élaboration d\'un DAO provisoire',
            description: 'Préparation du dossier pour la phase technique',
            estimatedDurationDays: 15
          },
          {
            id: 'etape1-2',
            code: 'RECEPTION_EVALUATION_TECH',
            label: 'Réception et évaluation des propositions techniques',
            description: 'Analyse des solutions techniques proposées',
            estimatedDurationDays: 45,
            requiresCPMPApproval: true
          }
        ]
      },
      {
        id: 'etape2',
        code: 'OFFRES_FINALES',
        label: 'Étape 2 : Offres Finales',
        description: 'Soumission et évaluation des offres financières',
        subSteps: [
          {
            id: 'etape2-1',
            code: 'ELABORATION_DAO_REVISE',
            label: 'Élaboration d\'un DAO révisé',
            description: 'Mise à jour du DAO suite aux clarifications',
            estimatedDurationDays: 10
          },
          {
            id: 'etape2-2',
            code: 'INVITATION_RETENUS',
            label: 'Invitation aux candidats retenus',
            description: 'Convocation pour soumission des offres financières',
            estimatedDurationDays: 5
          },
          {
            id: 'etape2-3',
            code: 'RECEPTION_EVALUATION_FIN',
            label: 'Réception et évaluation des offres financières',
            description: 'Analyse des prix et classement final',
            estimatedDurationDays: 30,
            requiresCPMPApproval: true
          },
          {
            id: 'etape2-4',
            code: 'ATTRIBUTION_SIGNATURE',
            label: 'Attribution et signature',
            description: 'Finalisation du marché',
            estimatedDurationDays: 15,
            requiresCNCMPApproval: true
          }
        ]
      }
    ]
  },

  AOR: {
    type: 'AOR',
    name: 'Appel d\'Offres Restreint',
    description: 'Procédure limitée à une liste restreinte de candidats',
    applicableFor: ['Marchés spécialisés', 'Nombre limité de fournisseurs qualifiés'],
    steps: [
      {
        id: 'aor-1',
        code: 'CHOIX_LISTE',
        label: 'Choix d\'une liste restreinte de candidats',
        description: 'Sélection des candidats invités à soumissionner',
        estimatedDurationDays: 10,
        requiresCPMPApproval: true
      },
      {
        id: 'aor-2',
        code: 'ELABORATION_DAOR',
        label: 'Élaboration et approbation du DAOR',
        description: 'Préparation du dossier d\'appel d\'offres restreint',
        estimatedDurationDays: 15,
        requiresCPMPApproval: true
      },
      {
        id: 'aor-3',
        code: 'ENVOI_CANDIDATS',
        label: 'Envoi aux candidats sélectionnés',
        description: 'Transmission du DAOR aux candidats de la liste',
        estimatedDurationDays: 3
      },
      {
        id: 'aor-4',
        code: 'RECEPTION_OUVERTURE',
        label: 'Réception et ouverture des offres',
        description: 'Collecte et ouverture des soumissions',
        estimatedDurationDays: 30
      },
      {
        id: 'aor-5',
        code: 'EVALUATION_ATTRIBUTION_PROV',
        label: 'Évaluation et attribution provisoire',
        description: 'Analyse des offres avec avis CNCMP',
        estimatedDurationDays: 25,
        requiresCPMPApproval: true,
        requiresCNCMPApproval: true
      },
      {
        id: 'aor-6',
        code: 'ATTRIBUTION_SIGNATURE',
        label: 'Attribution définitive et signature',
        description: 'Finalisation du marché',
        estimatedDurationDays: 10
      }
    ]
  },

  CS: {
    type: 'CS',
    name: 'Consultation Simplifiée',
    description: 'Procédure simplifiée pour les marchés de faible montant',
    applicableFor: ['Marchés de faible montant', 'Achats courants'],
    steps: [
      {
        id: 'cs-1',
        code: 'ELABORATION_DOSSIER',
        label: 'Élaboration d\'un dossier allégé',
        description: 'Préparation d\'un dossier simplifié',
        estimatedDurationDays: 7
      },
      {
        id: 'cs-2',
        code: 'CHOIX_LISTE',
        label: 'Choix d\'une liste restreinte (min 3 candidats)',
        description: 'Sélection d\'au moins 3 candidats',
        estimatedDurationDays: 5
      },
      {
        id: 'cs-3',
        code: 'APPROBATION',
        label: 'Approbation par la CPMP et avis de la CNCMP',
        description: 'Validation du processus',
        estimatedDurationDays: 5,
        requiresCPMPApproval: true,
        requiresCNCMPApproval: true
      },
      {
        id: 'cs-4',
        code: 'TRANSMISSION',
        label: 'Transmission du dossier aux candidats',
        description: 'Envoi du dossier simplifié',
        estimatedDurationDays: 2
      },
      {
        id: 'cs-5',
        code: 'RECEPTION_OUVERTURE',
        label: 'Réception et ouverture des offres',
        description: 'Collecte et ouverture des propositions',
        estimatedDurationDays: 15
      },
      {
        id: 'cs-6',
        code: 'ATTRIBUTION_PROV',
        label: 'Attribution provisoire',
        description: 'Sélection du meilleur candidat avec avis CNCMP',
        estimatedDurationDays: 10,
        requiresCNCMPApproval: true
      },
      {
        id: 'cs-7',
        code: 'ATTRIBUTION_SIGNATURE',
        label: 'Attribution définitive et signature',
        description: 'Finalisation du marché',
        estimatedDurationDays: 5
      }
    ]
  },

  ED: {
    type: 'ED',
    name: 'Entente Directe',
    description: 'Procédure de gré à gré pour cas exceptionnels',
    applicableFor: ['Urgence impérieuse', 'Monopole', 'Sécurité nationale'],
    steps: [
      {
        id: 'ed-1',
        code: 'DEMANDE_OFFRE',
        label: 'Demande d\'offre technique et financière',
        description: 'Sollicitation d\'un opérateur spécifique',
        estimatedDurationDays: 5
      },
      {
        id: 'ed-2',
        code: 'NEGOCIATION',
        label: 'Négociation du projet de contrat',
        description: 'Discussion des termes et conditions',
        estimatedDurationDays: 10
      },
      {
        id: 'ed-3',
        code: 'APPROBATION_CPMP',
        label: 'Approbation par la CPMP',
        description: 'Validation de la procédure',
        estimatedDurationDays: 5,
        requiresCPMPApproval: true
      },
      {
        id: 'ed-4',
        code: 'AVIS_CNCMP',
        label: 'Avis de la CNCMP',
        description: 'Contrôle par la CNCMP',
        estimatedDurationDays: 7,
        requiresCNCMPApproval: true
      },
      {
        id: 'ed-5',
        code: 'SIGNATURE_PUBLICATION',
        label: 'Signature et publication du marché',
        description: 'Formalisation et annonce publique',
        estimatedDurationDays: 5
      }
    ]
  },

  SFQC: {
    type: 'SFQC',
    name: 'Sélection de Consultants - Qualité et Coût',
    description: 'Sélection basée sur la qualité technique et le coût financier',
    applicableFor: ['Services de conseil', 'Études techniques', 'Assistance technique'],
    steps: [
      {
        id: 'sfqc-1',
        code: 'ELABORATION_TDR',
        label: 'Élaboration et approbation des TDR',
        description: 'Préparation des termes de référence',
        estimatedDurationDays: 10,
        requiresCPMPApproval: true
      },
      {
        id: 'sfqc-2',
        code: 'PUBLICATION_AMI',
        label: 'Publication d\'un avis à manifestation d\'intérêt',
        description: 'Appel public aux consultants',
        estimatedDurationDays: 5
      },
      {
        id: 'sfqc-3',
        code: 'RECEPTION_EVALUATION_MI',
        label: 'Réception et évaluation des manifestations d\'intérêt',
        description: 'Analyse des candidatures',
        estimatedDurationDays: 30
      },
      {
        id: 'sfqc-4',
        code: 'LISTE_RESTREINTE',
        label: 'Établissement d\'une liste restreinte',
        description: 'Sélection des consultants qualifiés (min 3)',
        estimatedDurationDays: 5
      },
      {
        id: 'sfqc-5',
        code: 'ENVOI_DP',
        label: 'Envoi de la demande de propositions (DP)',
        description: 'Transmission de la DP aux consultants retenus',
        estimatedDurationDays: 3
      },
      {
        id: 'sfqc-6',
        code: 'RECEPTION_EVALUATION',
        label: 'Réception et évaluation des propositions',
        description: 'Analyse technique et financière',
        estimatedDurationDays: 45,
        requiresCPMPApproval: true,
        subSteps: [
          {
            id: 'sfqc-6-1',
            code: 'EVAL_TECHNIQUE',
            label: 'Évaluation technique',
            description: 'Notation de la qualité technique (sur 100 points)',
            estimatedDurationDays: 20
          },
          {
            id: 'sfqc-6-2',
            code: 'OUVERTURE_FINANCIERE',
            label: 'Ouverture des propositions financières',
            description: 'Ouverture pour les candidats qualifiés techniquement',
            estimatedDurationDays: 5
          },
          {
            id: 'sfqc-6-3',
            code: 'CLASSEMENT_COMBINE',
            label: 'Classement combiné qualité-coût',
            description: 'Score final = (Note technique × 0.8) + (Note financière × 0.2)',
            estimatedDurationDays: 10
          }
        ]
      },
      {
        id: 'sfqc-7',
        code: 'NEGOCIATION',
        label: 'Négociation avec le meilleur candidat',
        description: 'Finalisation des termes du contrat',
        estimatedDurationDays: 15
      },
      {
        id: 'sfqc-8',
        code: 'ATTRIBUTION_SIGNATURE',
        label: 'Attribution et signature',
        description: 'Formalisation du contrat de consultation',
        estimatedDurationDays: 10,
        requiresCNCMPApproval: true
      }
    ]
  },

  SMC: {
    type: 'SMC',
    name: 'Sélection de Consultants - Moindre Coût',
    description: 'Sélection basée sur le moindre coût parmi les propositions qualifiées',
    applicableFor: ['Services standardisés', 'Missions de routine'],
    steps: [
      {
        id: 'smc-1',
        code: 'ELABORATION_TDR',
        label: 'Élaboration et approbation des TDR',
        description: 'Préparation des termes de référence',
        estimatedDurationDays: 10,
        requiresCPMPApproval: true
      },
      {
        id: 'smc-2',
        code: 'PUBLICATION_AMI',
        label: 'Publication d\'un avis à manifestation d\'intérêt',
        description: 'Appel public aux consultants',
        estimatedDurationDays: 5
      },
      {
        id: 'smc-3',
        code: 'RECEPTION_EVALUATION_MI',
        label: 'Réception et évaluation des manifestations d\'intérêt',
        description: 'Analyse des candidatures',
        estimatedDurationDays: 30
      },
      {
        id: 'smc-4',
        code: 'LISTE_RESTREINTE',
        label: 'Établissement d\'une liste restreinte',
        description: 'Sélection des consultants qualifiés',
        estimatedDurationDays: 5
      },
      {
        id: 'smc-5',
        code: 'ENVOI_DP',
        label: 'Envoi de la demande de propositions (DP)',
        description: 'Transmission de la DP',
        estimatedDurationDays: 3
      },
      {
        id: 'smc-6',
        code: 'EVALUATION_TECHNIQUE',
        label: 'Évaluation technique (qualification)',
        description: 'Vérification du seuil minimum de qualification',
        estimatedDurationDays: 25,
        requiresCPMPApproval: true
      },
      {
        id: 'smc-7',
        code: 'SELECTION_MOINDRE_COUT',
        label: 'Sélection du moindre coût',
        description: 'Choix de l\'offre la moins chère parmi les qualifiés',
        estimatedDurationDays: 5
      },
      {
        id: 'smc-8',
        code: 'ATTRIBUTION_SIGNATURE',
        label: 'Attribution et signature',
        description: 'Finalisation du contrat',
        estimatedDurationDays: 10,
        requiresCNCMPApproval: true
      }
    ]
  },

  SBD: {
    type: 'SBD',
    name: 'Sélection de Consultants - Budget Déterminé',
    description: 'Sélection avec budget prédéfini communiqué aux candidats',
    applicableFor: ['Missions avec budget fixe', 'Financement limité'],
    steps: [
      {
        id: 'sbd-1',
        code: 'ELABORATION_TDR_BUDGET',
        label: 'Élaboration des TDR avec budget déterminé',
        description: 'Préparation avec budget communiqué',
        estimatedDurationDays: 10,
        requiresCPMPApproval: true
      },
      {
        id: 'sbd-2',
        code: 'PUBLICATION_AMI',
        label: 'Publication d\'un avis à manifestation d\'intérêt',
        description: 'Appel avec mention du budget',
        estimatedDurationDays: 5
      },
      {
        id: 'sbd-3',
        code: 'RECEPTION_EVALUATION_MI',
        label: 'Réception et évaluation des manifestations d\'intérêt',
        description: 'Sélection des candidats',
        estimatedDurationDays: 30
      },
      {
        id: 'sbd-4',
        code: 'LISTE_RESTREINTE',
        label: 'Établissement d\'une liste restreinte',
        description: 'Sélection finale des consultants',
        estimatedDurationDays: 5
      },
      {
        id: 'sbd-5',
        code: 'ENVOI_DP_BUDGET',
        label: 'Envoi de la DP avec budget',
        description: 'Transmission avec budget prédéterminé',
        estimatedDurationDays: 3
      },
      {
        id: 'sbd-6',
        code: 'EVALUATION_CONFORMITE_BUDGET',
        label: 'Évaluation des propositions respectant le budget',
        description: 'Vérification du respect du budget et qualité technique',
        estimatedDurationDays: 30,
        requiresCPMPApproval: true
      },
      {
        id: 'sbd-7',
        code: 'SELECTION_MEILLEURE_QUALITE',
        label: 'Sélection de la meilleure qualité technique',
        description: 'Choix parmi les propositions conformes au budget',
        estimatedDurationDays: 5
      },
      {
        id: 'sbd-8',
        code: 'ATTRIBUTION_SIGNATURE',
        label: 'Attribution et signature',
        description: 'Finalisation du contrat',
        estimatedDurationDays: 10,
        requiresCNCMPApproval: true
      }
    ]
  },

  SFQT: {
    type: 'SFQT',
    name: 'Sélection de Consultants - Qualité Technique',
    description: 'Sélection basée uniquement sur la qualité technique',
    applicableFor: ['Missions très complexes', 'Innovation requise'],
    steps: [
      {
        id: 'sfqt-1',
        code: 'ELABORATION_TDR',
        label: 'Élaboration et approbation des TDR',
        description: 'Préparation des termes de référence',
        estimatedDurationDays: 10,
        requiresCPMPApproval: true
      },
      {
        id: 'sfqt-2',
        code: 'PUBLICATION_AMI',
        label: 'Publication d\'un avis à manifestation d\'intérêt',
        description: 'Appel public',
        estimatedDurationDays: 5
      },
      {
        id: 'sfqt-3',
        code: 'RECEPTION_EVALUATION_MI',
        label: 'Réception et évaluation des manifestations d\'intérêt',
        description: 'Analyse des candidatures',
        estimatedDurationDays: 30
      },
      {
        id: 'sfqt-4',
        code: 'LISTE_RESTREINTE',
        label: 'Établissement d\'une liste restreinte',
        description: 'Sélection des consultants',
        estimatedDurationDays: 5
      },
      {
        id: 'sfqt-5',
        code: 'ENVOI_DP_TECHNIQUE',
        label: 'Envoi de la DP (technique uniquement)',
        description: 'Transmission sans demande financière initiale',
        estimatedDurationDays: 3
      },
      {
        id: 'sfqt-6',
        code: 'EVALUATION_TECHNIQUE_SEULE',
        label: 'Évaluation uniquement sur la qualité technique',
        description: 'Notation de la proposition technique',
        estimatedDurationDays: 30,
        requiresCPMPApproval: true
      },
      {
        id: 'sfqt-7',
        code: 'NEGOCIATION_MEILLEUR_TECH',
        label: 'Négociation du coût avec le meilleur candidat technique',
        description: 'Discussion financière après sélection technique',
        estimatedDurationDays: 15
      },
      {
        id: 'sfqt-8',
        code: 'ATTRIBUTION_SIGNATURE',
        label: 'Attribution et signature',
        description: 'Finalisation du contrat',
        estimatedDurationDays: 10,
        requiresCNCMPApproval: true
      }
    ]
  },

  QC: {
    type: 'QC',
    name: 'Qualification de Consultants',
    description: 'Sélection basée sur les qualifications uniquement',
    applicableFor: ['Missions simples', 'Consultants déjà connus'],
    steps: [
      {
        id: 'qc-1',
        code: 'ELABORATION_TDR_SIMPLE',
        label: 'Élaboration de TDR simplifiés',
        description: 'Préparation de termes de référence allégés',
        estimatedDurationDays: 5
      },
      {
        id: 'qc-2',
        code: 'DEMANDE_QUALIFICATIONS',
        label: 'Demande de qualifications',
        description: 'Sollicitation des CV et références',
        estimatedDurationDays: 3
      },
      {
        id: 'qc-3',
        code: 'EVALUATION_QUALIFICATIONS',
        label: 'Évaluation des qualifications',
        description: 'Analyse des compétences et expériences',
        estimatedDurationDays: 15,
        requiresCPMPApproval: true
      },
      {
        id: 'qc-4',
        code: 'SELECTION_QUALIFIE',
        label: 'Sélection du consultant qualifié',
        description: 'Choix du candidat le plus qualifié',
        estimatedDurationDays: 5
      },
      {
        id: 'qc-5',
        code: 'NEGOCIATION_DIRECTE',
        label: 'Négociation directe',
        description: 'Discussion des termes et honoraires',
        estimatedDurationDays: 10
      },
      {
        id: 'qc-6',
        code: 'ATTRIBUTION_SIGNATURE',
        label: 'Attribution et signature',
        description: 'Formalisation du contrat',
        estimatedDurationDays: 5
      }
    ]
  },

  CI: {
    type: 'CI',
    name: 'Consultant Individuel',
    description: 'Sélection simplifiée pour consultant individuel',
    applicableFor: ['Missions de faible complexité', 'Expertise ponctuelle'],
    steps: [
      {
        id: 'ci-1',
        code: 'DEFINITION_MISSION',
        label: 'Définition de la mission',
        description: 'Clarification des besoins et livrables',
        estimatedDurationDays: 3
      },
      {
        id: 'ci-2',
        code: 'EVALUATION_CV',
        label: 'Évaluation du CV',
        description: 'Analyse des qualifications et expériences',
        estimatedDurationDays: 5
      },
      {
        id: 'ci-3',
        code: 'ENTRETIEN_OPTIONNEL',
        label: 'Entretien si nécessaire',
        description: 'Discussion pour validation des compétences',
        estimatedDurationDays: 2
      },
      {
        id: 'ci-4',
        code: 'NEGOCIATION_DIRECTE',
        label: 'Négociation directe',
        description: 'Discussion des honoraires et conditions',
        estimatedDurationDays: 5
      },
      {
        id: 'ci-5',
        code: 'SIGNATURE_CONTRAT',
        label: 'Signature du contrat',
        description: 'Formalisation de l\'engagement',
        estimatedDurationDays: 2
      }
    ]
  },

  EXECUTION: {
    type: 'EXECUTION',
    name: 'Exécution des Marchés',
    description: 'Suivi et gestion de l\'exécution des marchés',
    applicableFor: ['Tous types de marchés attribués'],
    steps: [
      {
        id: 'exec-travaux',
        code: 'EXECUTION_TRAVAUX',
        label: 'Exécution - Travaux',
        description: 'Suivi des travaux de construction',
        subSteps: [
          {
            id: 'exec-travaux-1',
            code: 'SUIVI_ETAPES',
            label: 'Suivi des étapes de réalisation',
            description: 'Monitoring de l\'avancement des travaux',
            estimatedDurationDays: 0 // Variable selon le marché
          },
          {
            id: 'exec-travaux-2',
            code: 'RECEPTION_PROVISOIRE',
            label: 'Réception provisoire',
            description: 'Vérification de conformité initiale',
            estimatedDurationDays: 5
          },
          {
            id: 'exec-travaux-3',
            code: 'RECEPTION_DEFINITIVE',
            label: 'Réception définitive',
            description: 'Validation finale après période de garantie',
            estimatedDurationDays: 3
          }
        ]
      },
      {
        id: 'exec-fournitures',
        code: 'EXECUTION_FOURNITURES',
        label: 'Exécution - Fournitures',
        description: 'Gestion des livraisons',
        subSteps: [
          {
            id: 'exec-fournitures-1',
            code: 'LIVRAISON',
            label: 'Livraison',
            description: 'Réception des fournitures',
            estimatedDurationDays: 1
          },
          {
            id: 'exec-fournitures-2',
            code: 'CONTROLE_QUALITE',
            label: 'Contrôle qualité',
            description: 'Vérification de conformité',
            estimatedDurationDays: 3
          },
          {
            id: 'exec-fournitures-3',
            code: 'RECEPTION_FINALE',
            label: 'Réception finale',
            description: 'Validation et acceptation',
            estimatedDurationDays: 2
          }
        ]
      },
      {
        id: 'exec-intellectuelles',
        code: 'EXECUTION_PRESTATIONS_INTEL',
        label: 'Exécution - Prestations Intellectuelles',
        description: 'Suivi des prestations de conseil',
        subSteps: [
          {
            id: 'exec-intel-1',
            code: 'SUIVI_LIVRABLES',
            label: 'Suivi des livrables',
            description: 'Vérification des rapports et études',
            estimatedDurationDays: 0 // Variable
          },
          {
            id: 'exec-intel-2',
            code: 'EVALUATION_QUALITE',
            label: 'Évaluation de la qualité',
            description: 'Analyse de la conformité aux TDR',
            estimatedDurationDays: 10
          },
          {
            id: 'exec-intel-3',
            code: 'PAIEMENT',
            label: 'Paiement',
            description: 'Validation et règlement',
            estimatedDurationDays: 15
          }
        ]
      }
    ]
  }
};

// Helper functions
export const getWorkflowByType = (type: ProcurementType): ProcurementWorkflow | undefined => {
  return MAURITANIAN_PROCUREMENT_WORKFLOWS[type];
};

export const getAllWorkflowTypes = (): ProcurementType[] => {
  return Object.keys(MAURITANIAN_PROCUREMENT_WORKFLOWS) as ProcurementType[];
};

export const getWorkflowTypeLabel = (type: ProcurementType): string => {
  return MAURITANIAN_PROCUREMENT_WORKFLOWS[type]?.name || type;
};

export const calculateTotalDuration = (workflow: ProcurementWorkflow): number => {
  let total = 0;
  
  const addStepDuration = (step: ProcurementWorkflowStep) => {
    if (step.estimatedDurationDays) {
      total += step.estimatedDurationDays;
    }
    if (step.subSteps) {
      step.subSteps.forEach(addStepDuration);
    }
  };
  
  workflow.steps.forEach(addStepDuration);
  return total;
};

export const getStepById = (workflow: ProcurementWorkflow, stepId: string): ProcurementWorkflowStep | undefined => {
  const findStep = (steps: ProcurementWorkflowStep[]): ProcurementWorkflowStep | undefined => {
    for (const step of steps) {
      if (step.id === stepId) return step;
      if (step.subSteps) {
        const found = findStep(step.subSteps);
        if (found) return found;
      }
    }
    return undefined;
  };
  
  return findStep(workflow.steps);
};
