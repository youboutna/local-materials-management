import { MilestoneTemplateDTO, MilestoneType, MilestonePriority } from '@/types/milestone-dto';

/**
 * Milestone templates by construction phase (referential)
 * Based on Waterfall phase-gate methodology with PERT/CPM dependencies
 * 
 * Each phase follows the standard project lifecycle:
 * 1. Initiation Gate → 2. Progress Checkpoints → 3. Deliverable → 4. Phase Gate
 */
export const REFERENTIAL_MILESTONES: Record<string, MilestoneTemplateDTO[]> = {
  // ============= ÉTUDES PRÉLIMINAIRES =============
  'etudes_preliminaires': [
    {
      id: 'ep_gate_0',
      name: 'Lancement des études',
      description: 'Réunion de lancement et validation du périmètre des études',
      relative_offset_days: 0,
      weight: 0.1,
      is_critical: true,
      type: 'event',
      priority: 'critical',
      tags: ['lancement', 'kickoff'],
      deliverables: ['Note de cadrage', 'Planning études']
    },
    {
      id: 'ep_1',
      name: 'Études de faisabilité validées',
      description: 'Études techniques et économiques validées par le comité',
      relative_offset_days: 30,
      weight: 0.35,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['études', 'validation'],
      predecessor_ids: ['ep_gate_0'],
      deliverables: ['Rapport de faisabilité technique', 'Étude économique', 'Analyse des risques']
    },
    {
      id: 'ep_2',
      name: 'Approbation du dossier préliminaire',
      description: 'Phase Gate: Validation par le maître d\'ouvrage pour passage en conception',
      relative_offset_days: 45,
      weight: 0.55,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['gate', 'approbation', 'maître d\'ouvrage'],
      predecessor_ids: ['ep_1'],
      approval_requirements: ['Validation technique', 'Validation budgétaire', 'Accord du MOA']
    }
  ],

  // ============= CONCEPTION =============
  'conception': [
    {
      id: 'con_0',
      name: 'Lancement phase conception',
      description: 'Réunion de lancement conception avec l\'équipe projet',
      relative_offset_days: 0,
      weight: 0.05,
      is_critical: false,
      type: 'event',
      priority: 'normal',
      tags: ['lancement']
    },
    {
      id: 'con_1',
      name: 'Avant-projet sommaire (APS) validé',
      description: 'Point de contrôle: APS validé avec esquisses et estimations',
      relative_offset_days: 30,
      weight: 0.2,
      is_critical: true,
      type: 'checkpoint',
      priority: 'high',
      tags: ['APS', 'conception'],
      predecessor_ids: ['con_0'],
      deliverables: ['Plans APS', 'Estimation budgétaire ±20%', 'Planning prévisionnel']
    },
    {
      id: 'con_2',
      name: 'Avant-projet détaillé (APD) validé',
      description: 'Livrable: APD complet avec plans détaillés et devis estimatifs',
      relative_offset_days: 60,
      weight: 0.3,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['APD', 'plans'],
      predecessor_ids: ['con_1'],
      deliverables: ['Plans APD détaillés', 'CCTP', 'Estimation budgétaire ±10%', 'Planning travaux']
    },
    {
      id: 'con_3',
      name: 'Obtention du permis de construire',
      description: 'Phase Gate: Permis de construire délivré - autorisation administrative',
      relative_offset_days: 90,
      weight: 0.45,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['permis', 'autorisations', 'gate'],
      predecessor_ids: ['con_2'],
      approval_requirements: ['Conformité urbanisme', 'Avis services', 'Signature mairie']
    }
  ],

  // ============= PRÉPARATION DU TERRAIN =============
  'preparation_terrain': [
    {
      id: 'pt_0',
      name: 'Ordre de service travaux',
      description: 'Événement: Démarrage officiel des travaux préparatoires',
      relative_offset_days: 0,
      weight: 0.1,
      is_critical: true,
      type: 'event',
      priority: 'critical',
      tags: ['OS', 'démarrage'],
      deliverables: ['Ordre de service signé', 'Planning d\'exécution']
    },
    {
      id: 'pt_1',
      name: 'Installation de chantier terminée',
      description: 'Checkpoint: Base vie et installations opérationnelles',
      relative_offset_days: 14,
      weight: 0.3,
      is_critical: false,
      type: 'checkpoint',
      priority: 'high',
      tags: ['installation', 'chantier'],
      predecessor_ids: ['pt_0'],
      deliverables: ['PV installation chantier', 'Plan d\'installation validé']
    },
    {
      id: 'pt_2',
      name: 'Terrassement terminé',
      description: 'Livrable: Nivellement et excavations complétés, prêt pour fondations',
      relative_offset_days: 30,
      weight: 0.6,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['terrassement', 'excavation'],
      predecessor_ids: ['pt_1'],
      deliverables: ['PV réception terrassement', 'Relevé topographique final']
    }
  ],

  // ============= FONDATIONS =============
  'fondations': [
    {
      id: 'fon_1',
      name: 'Implantation validée par géomètre',
      description: 'Checkpoint: Implantation géomètre validée et PV signé',
      relative_offset_days: 5,
      weight: 0.15,
      is_critical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['géomètre', 'implantation'],
      deliverables: ['PV implantation', 'Bornage']
    },
    {
      id: 'fon_2',
      name: 'Ferraillage terminé et contrôlé',
      description: 'Checkpoint: Armatures posées, contrôle bureau de contrôle effectué',
      relative_offset_days: 15,
      weight: 0.3,
      is_critical: true,
      type: 'checkpoint',
      priority: 'high',
      tags: ['ferraillage', 'armatures', 'contrôle'],
      predecessor_ids: ['fon_1'],
      deliverables: ['Rapport bureau de contrôle', 'Bon pour coulage']
    },
    {
      id: 'fon_3',
      name: 'Fondations terminées',
      description: 'Livrable: Béton coulé, temps de prise respecté, fondations réceptionnées',
      relative_offset_days: 25,
      weight: 0.55,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['béton', 'coulage', 'réception'],
      predecessor_ids: ['fon_2'],
      deliverables: ['PV réception fondations', 'Épreuves béton']
    }
  ],

  // ============= GROS ŒUVRE =============
  'gros_oeuvre': [
    {
      id: 'go_1',
      name: 'Élévation murs RDC terminée',
      description: 'Checkpoint: Murs du rez-de-chaussée terminés',
      relative_offset_days: 30,
      weight: 0.15,
      is_critical: false,
      type: 'checkpoint',
      priority: 'high',
      tags: ['murs', 'élévation', 'RDC']
    },
    {
      id: 'go_2',
      name: 'Plancher haut RDC coulé',
      description: 'Livrable: Dalle haute RDC coulée et contrôlée',
      relative_offset_days: 45,
      weight: 0.2,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['plancher', 'dalle'],
      predecessor_ids: ['go_1'],
      deliverables: ['PV dalle', 'Rapport bureau de contrôle']
    },
    {
      id: 'go_3',
      name: 'Mise hors d\'eau',
      description: 'Gate: Toiture et charpente terminées - bâtiment protégé des intempéries',
      relative_offset_days: 75,
      weight: 0.3,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['toiture', 'hors d\'eau', 'gate'],
      predecessor_ids: ['go_2'],
      approval_requirements: ['Validation charpente', 'Étanchéité toiture']
    },
    {
      id: 'go_4',
      name: 'Mise hors d\'air',
      description: 'Gate: Menuiseries extérieures posées - bâtiment fermé',
      relative_offset_days: 90,
      weight: 0.35,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['menuiseries', 'hors d\'air', 'gate'],
      predecessor_ids: ['go_3'],
      approval_requirements: ['Pose menuiseries', 'Étanchéité à l\'air']
    }
  ],

  // ============= SECOND ŒUVRE =============
  'second_oeuvre': [
    {
      id: 'so_1',
      name: 'Cloisonnement terminé',
      description: 'Checkpoint: Toutes les cloisons posées',
      relative_offset_days: 30,
      weight: 0.15,
      is_critical: false,
      type: 'checkpoint',
      priority: 'normal',
      tags: ['cloisons', 'distribution']
    },
    {
      id: 'so_2',
      name: 'Réseaux techniques encastrés',
      description: 'Livrable: Plomberie et électricité encastrées, avant fermeture',
      relative_offset_days: 45,
      weight: 0.25,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['plomberie', 'électricité', 'réseaux'],
      predecessor_ids: ['so_1'],
      deliverables: ['PV passage réseaux', 'Plans de récolement']
    },
    {
      id: 'so_3',
      name: 'Enduits et plâtrerie terminés',
      description: 'Checkpoint: Finitions murales terminées',
      relative_offset_days: 60,
      weight: 0.25,
      is_critical: false,
      type: 'checkpoint',
      priority: 'high',
      tags: ['enduits', 'plâtrerie'],
      predecessor_ids: ['so_2']
    },
    {
      id: 'so_4',
      name: 'Revêtements de sol posés',
      description: 'Livrable: Carrelage et parquet terminés',
      relative_offset_days: 75,
      weight: 0.35,
      is_critical: true,
      type: 'deliverable',
      priority: 'high',
      tags: ['revêtements', 'sol', 'carrelage'],
      predecessor_ids: ['so_3'],
      deliverables: ['PV pose revêtements']
    }
  ],

  // ============= FINITIONS =============
  'finitions': [
    {
      id: 'fin_1',
      name: 'Peintures terminées',
      description: 'Checkpoint: Toutes les peintures appliquées',
      relative_offset_days: 15,
      weight: 0.25,
      is_critical: false,
      type: 'checkpoint',
      priority: 'normal',
      tags: ['peintures', 'finitions']
    },
    {
      id: 'fin_2',
      name: 'Équipements sanitaires posés',
      description: 'Livrable: Sanitaires et robinetterie installés et fonctionnels',
      relative_offset_days: 20,
      weight: 0.3,
      is_critical: false,
      type: 'deliverable',
      priority: 'high',
      tags: ['sanitaires', 'équipements'],
      predecessor_ids: ['fin_1'],
      deliverables: ['Essais sanitaires']
    },
    {
      id: 'fin_3',
      name: 'Nettoyage fin de chantier',
      description: 'Checkpoint: Chantier nettoyé et prêt pour pré-réception',
      relative_offset_days: 25,
      weight: 0.45,
      is_critical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['nettoyage', 'préparation'],
      predecessor_ids: ['fin_2']
    }
  ],

  // ============= RÉCEPTION =============
  'reception': [
    {
      id: 'rec_1',
      name: 'Pré-réception effectuée',
      description: 'Checkpoint: Visite de pré-réception avec établissement des réserves',
      relative_offset_days: 7,
      weight: 0.35,
      is_critical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['pré-réception', 'réserves'],
      deliverables: ['Liste des réserves', 'Planning levée réserves']
    },
    {
      id: 'rec_2',
      name: 'Levée des réserves',
      description: 'Checkpoint: Toutes les réserves levées et validées',
      relative_offset_days: 12,
      weight: 0.25,
      is_critical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['réserves', 'levée'],
      predecessor_ids: ['rec_1'],
      deliverables: ['PV levée des réserves']
    },
    {
      id: 'rec_3',
      name: 'Réception définitive',
      description: 'Gate Final: PV de réception signé - transfert de propriété',
      relative_offset_days: 14,
      weight: 0.4,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['réception', 'PV', 'gate', 'final'],
      predecessor_ids: ['rec_2'],
      approval_requirements: ['Signature MOE', 'Signature MOA', 'Signature entreprise'],
      deliverables: ['PV de réception', 'DOE', 'DIUO', 'Garanties']
    }
  ],

  // ============= INFRASTRUCTURE - TERRASSEMENT =============
  'terrassement': [
    {
      id: 'ter_0',
      name: 'Démarrage terrassement',
      description: 'Événement: Début des travaux de terrassement',
      relative_offset_days: 0,
      weight: 0.1,
      is_critical: false,
      type: 'event',
      priority: 'normal',
      tags: ['démarrage']
    },
    {
      id: 'ter_1',
      name: 'Décapage terminé',
      description: 'Checkpoint: Terre végétale décapée et stockée',
      relative_offset_days: 10,
      weight: 0.25,
      is_critical: false,
      type: 'checkpoint',
      priority: 'normal',
      tags: ['décapage'],
      predecessor_ids: ['ter_0']
    },
    {
      id: 'ter_2',
      name: 'Déblais/Remblais terminés',
      description: 'Livrable: Mouvements de terre finalisés selon profil projet',
      relative_offset_days: 30,
      weight: 0.4,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['déblais', 'remblais'],
      predecessor_ids: ['ter_1'],
      deliverables: ['Plan de récolement terrassement']
    },
    {
      id: 'ter_3',
      name: 'Compactage validé',
      description: 'Gate: Essais de compactage conformes - validation pour suite des travaux',
      relative_offset_days: 35,
      weight: 0.25,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['compactage', 'essais', 'gate'],
      predecessor_ids: ['ter_2'],
      approval_requirements: ['Rapport essais compactage', 'Validation laboratoire']
    }
  ],

  // ============= INFRASTRUCTURE - VOIRIE =============
  'voirie': [
    {
      id: 'voi_1',
      name: 'Sous-couche posée',
      description: 'Checkpoint: Couche de forme et couche de base terminées',
      relative_offset_days: 20,
      weight: 0.3,
      is_critical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['sous-couche', 'base'],
      deliverables: ['Essais portance']
    },
    {
      id: 'voi_2',
      name: 'Enrobé posé',
      description: 'Livrable: Couche de roulement appliquée',
      relative_offset_days: 30,
      weight: 0.4,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['enrobé', 'bitume'],
      predecessor_ids: ['voi_1'],
      deliverables: ['Carottages enrobé', 'Rapport contrôle']
    },
    {
      id: 'voi_3',
      name: 'Signalisation terminée',
      description: 'Checkpoint: Marquage et panneaux installés',
      relative_offset_days: 35,
      weight: 0.3,
      is_critical: false,
      type: 'checkpoint',
      priority: 'normal',
      tags: ['signalisation', 'marquage'],
      predecessor_ids: ['voi_2']
    }
  ],

  // ============= INFRASTRUCTURE - ASSAINISSEMENT =============
  'assainissement': [
    {
      id: 'ass_1',
      name: 'Tranchées creusées',
      description: 'Checkpoint: Fouilles pour réseaux terminées',
      relative_offset_days: 10,
      weight: 0.15,
      is_critical: false,
      type: 'checkpoint',
      priority: 'normal',
      tags: ['tranchées', 'fouilles']
    },
    {
      id: 'ass_2',
      name: 'Canalisations posées',
      description: 'Livrable: Réseau d\'assainissement installé',
      relative_offset_days: 25,
      weight: 0.35,
      is_critical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['canalisations', 'réseau'],
      predecessor_ids: ['ass_1'],
      deliverables: ['Plan de récolement', 'PV pose']
    },
    {
      id: 'ass_3',
      name: 'Regards et branchements terminés',
      description: 'Checkpoint: Ouvrages annexes installés',
      relative_offset_days: 35,
      weight: 0.25,
      is_critical: false,
      type: 'checkpoint',
      priority: 'high',
      tags: ['regards', 'branchements'],
      predecessor_ids: ['ass_2']
    },
    {
      id: 'ass_4',
      name: 'Tests d\'étanchéité validés',
      description: 'Gate: Contrôles caméra et tests conformes - réseau réceptionnable',
      relative_offset_days: 40,
      weight: 0.25,
      is_critical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['tests', 'étanchéité', 'gate'],
      predecessor_ids: ['ass_3'],
      approval_requirements: ['Rapport inspection caméra', 'Tests étanchéité conformes']
    }
  ]
};

/**
 * Get milestone templates for a construction phase
 */
export function getMilestoneTemplates(constructionPhase: string): MilestoneTemplateDTO[] {
  const normalizedPhase = constructionPhase.toLowerCase().replace(/[- ]/g, '_');
  return REFERENTIAL_MILESTONES[normalizedPhase] || [];
}

/**
 * Get all available construction phases with milestones
 */
export function getAvailablePhases(): string[] {
  return Object.keys(REFERENTIAL_MILESTONES);
}

/**
 * Get phase statistics
 */
export function getPhaseStatistics(constructionPhase: string): {
  total: number;
  critical: number;
  gates: number;
  deliverables: number;
} {
  const templates = getMilestoneTemplates(constructionPhase);
  return {
    total: templates.length,
    critical: templates.filter(t => t.is_critical).length,
    gates: templates.filter(t => t.type === 'gate').length,
    deliverables: templates.filter(t => t.type === 'deliverable').length
  };
}
