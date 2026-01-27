import { MilestoneTemplateDTO } from "../../types/milestone-dto";
import { REFERENTIAL_MILESTONES } from "./milestones.referential";
import { somelecReferential } from "./somelec.referential";

/**
 * Milestone templates for SOMELEC electrical infrastructure projects
 * Based on the SOMELEC referential with donor funding and engineering consultants
 */
export const SOMELEC_ELECTRICAL_MILESTONES: Record<string, MilestoneTemplateDTO[]> = {
  // ============= PRÉ-FAISABILITÉ (PHASE 1) =============
  'pre_faisabilite': [
    {
      id: 'pre_fais_1',
      name: 'Analyse des besoins validée',
      description: 'Collecte et validation des besoins des parties prenantes',
      relative_offset_days: 0,
      weight: 0.15,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['besoins', 'partenaires', 'validation'],
      approval_requirements: ['Validation consultant ingénierie'],
      deliverables: ['Rapport analyse besoins', 'Cahier des charges préliminaire']
    },
    {
      id: 'pre_fais_2',
      name: 'Étude de marché terminée',
      description: 'Étude de marché pour équipements et technologies',
      relative_offset_days: 20,
      weight: 0.2,
      is_critical: true,
      type: 'deliverable',
      priority: 'high',
      tags: ['marché', 'technologies', 'équipements'],
      predecessor_ids: ['pre_fais_1'],
      deliverables: ['Rapport étude marché', 'Benchmark technologies']
    },
    {
      id: 'pre_fais_3',
      name: 'Faisabilité technique validée',
      description: 'Validation technique par le consultant ingénierie',
      relative_offset_days: 50,
      weight: 0.3,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['faisabilité', 'technique', 'gate'],
      predecessor_ids: ['pre_fais_2'],
      approval_requirements: ['Approbation consultant', 'Validation bailleur'],
      deliverables: ['Rapport faisabilité technique', 'Évaluation risques']
    },
    {
      id: 'pre_fais_4',
      name: 'Faisabilité financière approuvée',
      description: 'Approbation financière par le bailleur',
      relative_offset_days: 75,
      weight: 0.35,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['faisabilité', 'financière', 'bailleur', 'gate'],
      predecessor_ids: ['pre_fais_3'],
      approval_requirements: ['Approbation bailleur', 'Validation Ministère'],
      deliverables: ['Étude financière', 'Plan de financement']
    }
  ],

  // ============= CONCEPTION ET DAO (PHASE 2) =============
  'conception_dao': [
    {
      id: 'conception_1',
      name: 'Relevés topographiques validés',
      description: 'Relevés topographiques avec géomètre assermenté',
      relative_offset_days: 0,
      weight: 0.1,
      is_critical: true,
      type: 'deliverable',
      priority: 'high',
      tags: ['topographie', 'géomètre', 'relevés'],
      requiresInspection: true,
      approval_requirements: ['Validation consultant'],
      deliverables: ['Plans topographiques', 'PV géomètre']
    },
    {
      id: 'conception_2',
      name: 'Étude d\'impact environnemental approuvée',
      description: 'Approval EIE par les autorités environnementales',
      relative_offset_days: 30,
      weight: 0.15,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['environnement', 'EIE', 'autorisations', 'gate'],
      predecessor_ids: ['conception_1'],
      approval_requirements: ['Certificat environnemental', 'Approbation autorités'],
      deliverables: ['Rapport EIE', 'Certificat de conformité environnementale']
    },
    {
      id: 'conception_3',
      name: 'Plans génie civil validés',
      description: 'Plans de génie civil approuvés par le consultant',
      relative_offset_days: 75,
      weight: 0.25,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['génie civil', 'plans', 'structures'],
      predecessor_ids: ['conception_2'],
      approval_requirements: ['Validation consultant génie civil'],
      deliverables: ['Plans d\'exécution génie civil', 'Calculs de structure']
    },
    {
      id: 'conception_4',
      name: 'Conception électrique finale',
      description: 'Schémas électriques et plans d\'implantation définitifs',
      relative_offset_days: 90,
      weight: 0.2,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['électrique', 'conception', 'schémas'],
      predecessor_ids: ['conception_3'],
      deliverables: [
        'Schémas unifilaires définitifs',
        'Plans d\'implantation équipements',
        'Calculs de court-circuit'
      ]
    },
    {
      id: 'conception_5',
      name: 'DAO validé par les autorités',
      description: 'Dossier d\'Appel d\'Offres validé pour publication',
      relative_offset_days: 120,
      weight: 0.3,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['DAO', 'marché', 'appel d\'offres', 'gate'],
      predecessor_ids: ['conception_4'],
      approval_requirements: ['Validation Commission des Marchés', 'Approbation Ministère'],
      deliverables: ['DAO complet', 'CCAP', 'CCTP', 'DPGF']
    }
  ],

  // ============= PRÉPARATION & MOBILISATION =============
  'preparation_mobilisation': [
    {
      id: 'mobil_1',
      name: 'Ordre de Service émis',
      description: 'Émission OS après signature contrat',
      relative_offset_days: 0,
      weight: 0.2,
      is_critical: true,
      type: 'event',
      priority: 'critical',
      tags: ['OS', 'démarrage', 'contrat'],
      deliverables: ['Ordre de Service signé', 'Planning contractuel']
    },
    {
      id: 'mobil_2',
      name: 'Installation chantier validée',
      description: 'Base vie et installations sécurisées',
      relative_offset_days: 15,
      weight: 0.3,
      is_critical: true,
      type: 'checkpoint',
      priority: 'high',
      tags: ['chantier', 'installation', 'sécurité'],
      predecessor_ids: ['mobil_1'],
      requiresInspection: true,
      approval_requirements: ['Validation HSE consultant'],
      deliverables: ['PV installation chantier', 'Plan de sécurité']
    },
    {
      id: 'mobil_3',
      name: 'Matériaux et équipements réceptionnés',
      description: 'Réception et contrôle qualité des équipements électriques',
      relative_offset_days: 30,
      weight: 0.5,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['équipements', 'réception', 'qualité'],
      predecessor_ids: ['mobil_2'],
      requiresInspection: true,
      deliverables: [
        'PV réception matériels',
        'Certificats de conformité équipements',
        'Rapports de tests usine'
      ]
    }
  ],

  // ============= EXÉCUTION - GÉNIE CIVIL =============
  'execution_genie_civil': [
    {
      id: 'gc_1',
      name: 'Fondations terminées et contrôlées',
      description: 'Fondations avec contrôle bureau de contrôle',
      relative_offset_days: 0,
      weight: 0.25,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['fondations', 'béton', 'contrôle'],
      requiresInspection: true,
      approval_requirements: ['Validation bureau de contrôle'],
      deliverables: ['PV réception fondations', 'Résultats essais béton']
    },
    {
      id: 'gc_2',
      name: 'Structures portantes terminées',
      description: 'Ossature et structures élévées',
      relative_offset_days: 30,
      weight: 0.35,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['structures', 'ossature', 'élévation'],
      predecessor_ids: ['gc_1'],
      requiresInspection: true,
      deliverables: ['PV réception structures', 'Certificat soudure si applicable']
    },
    {
      id: 'gc_3',
      name: 'Poste de transformation construit',
      description: 'Bâtiment poste HTA/BT terminé',
      relative_offset_days: 60,
      weight: 0.4,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['poste', 'transfo', 'bâtiment'],
      predecessor_ids: ['gc_2'],
      requiresInspection: true,
      deliverables: ['PV réception bâtiment', 'Certificat étanchéité']
    }
  ],

  // ============= EXÉCUTION - RÉSEAU ÉLECTRIQUE =============
  'execution_reseau': [
    {
      id: 'res_1',
      name: 'Raccordement HT réalisé',
      description: 'Connexion au réseau public HT',
      relative_offset_days: 0,
      weight: 0.3,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['raccordement', 'HT', 'réseau public'],
      requiresInspection: true,
      approval_requirements: ['Validation gestionnaire réseau'],
      deliverables: ['Convention de raccordement', 'PV mise sous tension HT']
    },
    {
      id: 'res_2',
      name: 'Poste HTA/BT installé et testé',
      description: 'Transformateur et équipements installés',
      relative_offset_days: 20,
      weight: 0.25,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['poste', 'transfo', 'HTA/BT', 'tests'],
      predecessor_ids: ['res_1'],
      requiresInspection: true,
      deliverables: [
        'Fiche technique transformateur',
        'Rapport tests diélectriques',
        'Certificat de mise en service'
      ]
    },
    {
      id: 'res_3',
      name: 'Lignes aériennes/souterraines posées',
      description: 'Pose des lignes de distribution',
      relative_offset_days: 45,
      weight: 0.25,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['lignes', 'distribution', 'pose'],
      predecessor_ids: ['res_2'],
      requiresInspection: true,
      deliverables: ['PV pose lignes', 'Plan as-built', 'Rapports de contrôles']
    },
    {
      id: 'res_4',
      name: 'Tableaux et protections installés',
      description: 'Tableaux divisionnaires et systèmes de protection',
      relative_offset_days: 60,
      weight: 0.2,
      is_critical: true,
      type: 'deliverable',
      priority: 'high',
      tags: ['tableaux', 'protections', 'disjoncteurs'],
      predecessor_ids: ['res_3'],
      requiresInspection: true,
      deliverables: ['Schémas de câblage', 'Calibres protections', 'Rapport d\'installation']
    }
  ],

  // ============= ESSAIS ET COMMISSIONING =============
  'essais_commissioning': [
    {
      id: 'essais_1',
      name: 'Tests de mise sous tension',
      description: 'Mise sous tension progressive et tests fonctionnels',
      relative_offset_days: 0,
      weight: 0.25,
      is_critical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['tests', 'mise en service', 'fonctionnel'],
      requiresInspection: true,
      approval_requirements: ['Supervision consultant'],
      deliverables: ['Procès-verbal de mise sous tension', 'Journal de tests']
    },
    {
      id: 'essais_2',
      name: 'Tests de protection et coordination',
      description: 'Vérification des réglages des protections',
      relative_offset_days: 5,
      weight: 0.2,
      is_critical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['protections', 'coordination', 'réglages'],
      predecessor_ids: ['essais_1'],
      deliverables: ['Rapport de coordination', 'Courbes de déclenchement']
    },
    {
      id: 'essais_3',
      name: 'Mesures réglementaires complètes',
      description: 'Mesures terre, isolement, continuité',
      relative_offset_days: 10,
      weight: 0.25,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['mesures', 'terre', 'isolement', 'réglementaire'],
      predecessor_ids: ['essais_2'],
      deliverables: [
        'Rapport de mesure de terre',
        'Contrôles d\'isolement',
        'Attestation de conformité préliminaire'
      ]
    },
    {
      id: 'essais_4',
      name: 'Commissioning validé',
      description: 'Validation complète par le consultant et le client',
      relative_offset_days: 15,
      weight: 0.3,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['commissioning', 'validation', 'gate'],
      predecessor_ids: ['essais_3'],
      approval_requirements: ['Validation consultant', 'Acceptation client'],
      deliverables: ['Rapport de commissioning', 'Manuels d\'utilisation', 'Plans as-built définitifs']
    }
  ],

  // ============= RÉCEPTION PROVISOIRE =============
  'reception_provisoire': [
    {
      id: 'rec_prov_1',
      name: 'Inspection finale préalable',
      description: 'Visite complète avec consultant et maîtrise d\'ouvrage',
      relative_offset_days: 0,
      weight: 0.4,
      is_critical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['inspection', 'finale', 'pré-réception'],
      requiresInspection: true,
      approval_requirements: ['Présence consultant', 'Présence MOA'],
      deliverables: ['Liste des réserves', 'Planning de levée des réserves']
    },
    {
      id: 'rec_prov_2',
      name: 'Tests de performance réussis',
      description: 'Tests en charge et vérification des performances',
      relative_offset_days: 7,
      weight: 0.3,
      is_critical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['performance', 'tests charge', 'vérification'],
      predecessor_ids: ['rec_prov_1'],
      deliverables: ['Rapport de performance', 'Mesures sous charge']
    },
    {
      id: 'rec_prov_3',
      name: 'Réception provisoire signée',
      description: 'Signature PV réception provisoire',
      relative_offset_days: 14,
      weight: 0.3,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['réception', 'provisoire', 'PV', 'gate'],
      predecessor_ids: ['rec_prov_2'],
      approval_requirements: ['Signature consultant', 'Signature MOA', 'Signature entrepreneur'],
      deliverables: ['PV de réception provisoire', 'Début garantie de bon fonctionnement']
    }
  ],

  // ============= RÉCEPTION DÉFINITIVE =============
  'reception_definitive': [
    {
      id: 'rec_def_1',
      name: 'Levée totale des réserves',
      description: 'Toutes les réserves traitées et validées',
      relative_offset_days: 0,
      weight: 0.4,
      is_critical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['réserves', 'levée', 'correctifs'],
      requiresInspection: true,
      deliverables: ['PV de levée des réserves', 'Justificatifs des corrections']
    },
    {
      id: 'rec_def_2',
      name: 'Dossier des Ouvrages Exécutés complet',
      description: 'Remise DOE complet conforme',
      relative_offset_days: 5,
      weight: 0.3,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['DOE', 'documentation', 'manuel'],
      predecessor_ids: ['rec_def_1'],
      deliverables: [
        'DOE complet',
        'Manuels de maintenance',
        'Plans as-built définitifs',
        'Liste des pièces de rechange'
      ]
    },
    {
      id: 'rec_def_3',
      name: 'Réception définitive signée',
      description: 'Clôture administrative et financière',
      relative_offset_days: 10,
      weight: 0.3,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['réception', 'définitive', 'clôture', 'gate'],
      predecessor_ids: ['rec_def_2'],
      approval_requirements: [
        'Signature finale consultant',
        'Signature MOA',
        'Quitus financier',
        'Levée garanties'
      ],
      deliverables: [
        'PV de réception définitive',
        'Attestation de conformité finale',
        'Certificat de garantie décennale'
      ]
    }
  ],

  // ============= SUIVI POST-PROJET =============
  'suivi_post_projet': [
    {
      id: 'suivi_1',
      name: 'Formation des équipes de maintenance',
      description: 'Formation du personnel client sur les installations',
      relative_offset_days: 0,
      weight: 0.3,
      is_critical: true,
      type: 'deliverable',
      priority: 'high',
      tags: ['formation', 'maintenance', 'personnel'],
      deliverables: [
        'Programme de formation',
        'Supports de formation',
        'PV de formation',
        'Liste du personnel formé'
      ]
    },
    {
      id: 'suivi_2',
      name: 'Première visite de maintenance préventive',
      description: 'Visite de contrôle après 6 mois de fonctionnement',
      relative_offset_days: 180,
      weight: 0.35,
      is_critical: false,
      type: 'checkpoint',
      priority: 'normal',
      tags: ['maintenance', 'préventive', 'suivi'],
      requiresInspection: true,
      deliverables: ['Rapport de visite', 'Recommandations maintenance']
    },
    {
      id: 'suivi_3',
      name: 'Clôture garantie de bon fonctionnement',
      description: 'Fin de la période de garantie (généralement 12 mois)',
      relative_offset_days: 365,
      weight: 0.35,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['garantie', 'clôture', 'fin projet'],
      deliverables: [
        'Attestation de fin de garantie',
        'Rapport de fonctionnement',
        'Proposition contrat de maintenance'
      ]
    }
  ]
};

/**
 * Get SOMELEC specific milestone templates
 */
export function getSomelceMilestoneTemplates(constructionPhase: string): MilestoneTemplateDTO[] {
  const normalizedPhase = constructionPhase.toLowerCase().replace(/[- ]/g, '_');
  return SOMELEC_ELECTRICAL_MILESTONES[normalizedPhase] || [];
}

/**
 * Get all available SOMELEC phases
 */
export function getSomelceAvailablePhases(): string[] {
  return Object.keys(SOMELEC_ELECTRICAL_MILESTONES);
}

/**
 * Map SOMELEC referential phases to milestone phases
 */
export const SOMELEC_PHASE_MAPPING: Record<string, string> = {
  'PRE_FEASIBILITY': 'pre_faisabilite',
  'PRE_FAIS': 'pre_faisabilite',
  'DESIGN_DAO': 'conception_dao',
  'CONCEPTION_DAO': 'conception_dao',
  'PREPARATION_MOBILISATION': 'preparation_mobilisation',
  'EXECUTION_GENIE_CIVIL': 'execution_genie_civil',
  'EXECUTION_RESEAU': 'execution_reseau',
  'ESSAIS_COMMISSIONING': 'essais_commissioning',
  'PROVISIONAL_ACCEPTANCE': 'reception_provisoire',
  'RECEPTION_PROVISOIRE': 'reception_provisoire',
  'FINAL_ACCEPTANCE': 'reception_definitive',
  'RECEPTION_DEFINITIVE': 'reception_definitive',
  'POST_PROJECT': 'suivi_post_projet',
  'SUIVI_POST_PROJET': 'suivi_post_projet',
  // Additional mappings for referential phase codes
  'etudes_prefaisabilite': 'pre_faisabilite',
  'conception_dao': 'conception_dao',
  'preparation_mobilisation': 'preparation_mobilisation',
  'execution_gc': 'execution_genie_civil',
  'execution_elec': 'execution_reseau',
  'essais_mise_en_service': 'essais_commissioning',
  'reception_provisoire': 'reception_provisoire',
  'reception_definitive': 'reception_definitive',
  'exploitation_maintenance': 'suivi_post_projet'
};

/**
 * Convert SOMELEC referential to milestone templates
 */
export function convertSomelceReferentialToMilestones(): Record<string, MilestoneTemplateDTO[]> {
  const milestones: Record<string, MilestoneTemplateDTO[]> = {};
  
  // Convert each phase from the referential
  somelecReferential.phases.forEach(phase => {
    const phaseCode = phase.code;
    const mappedPhase = SOMELEC_PHASE_MAPPING[phaseCode as keyof typeof SOMELEC_PHASE_MAPPING];
    
    if (mappedPhase) {
      milestones[mappedPhase] = getSomelceMilestoneTemplates(mappedPhase);
    }
  });
  
  return milestones;
}

/**
 * Get complete referential including both standard and SOMELEC
 */
export function getCompleteReferential(): Record<string, MilestoneTemplateDTO[]> {
  return {
    ...REFERENTIAL_MILESTONES,
    ...SOMELEC_ELECTRICAL_MILESTONES
  };
}

/**
 * Get referential type (standard or SOMELEC)
 */
export function getReferentialType(constructionPhase: string): 'standard' | 'somelce' {
  const normalizedPhase = constructionPhase.toLowerCase().replace(/[- ]/g, '_');
  
  if (normalizedPhase in SOMELEC_ELECTRICAL_MILESTONES) {
    return 'somelce';
  }
  
  if (normalizedPhase in REFERENTIAL_MILESTONES) {
    return 'standard';
  }
  
  return 'standard';
}
