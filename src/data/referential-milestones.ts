import { MilestoneTemplateDTO } from '@/types/milestone-dto';

/**
 * Milestone templates by construction phase (referential)
 * These are auto-generated when a phase is created from referential
 */
export const REFERENTIAL_MILESTONES: Record<string, MilestoneTemplateDTO[]> = {
  // Études préliminaires
  'etudes_preliminaires': [
    {
      id: 'ep_1',
      name: 'Validation des études de faisabilité',
      description: 'Études techniques et économiques validées',
      relative_offset_days: 30,
      weight: 0.4,
      is_critical: true,
      tags: ['études', 'validation']
    },
    {
      id: 'ep_2',
      name: 'Approbation du dossier préliminaire',
      description: 'Dossier approuvé par le maître d\'ouvrage',
      relative_offset_days: 45,
      weight: 0.6,
      is_critical: true,
      tags: ['approbation', 'maître d\'ouvrage']
    }
  ],

  // Conception
  'conception': [
    {
      id: 'con_1',
      name: 'Validation avant-projet sommaire (APS)',
      description: 'APS validé et approuvé',
      relative_offset_days: 30,
      weight: 0.25,
      is_critical: true,
      tags: ['APS', 'conception']
    },
    {
      id: 'con_2',
      name: 'Validation avant-projet détaillé (APD)',
      description: 'APD validé avec plans détaillés',
      relative_offset_days: 60,
      weight: 0.35,
      is_critical: true,
      tags: ['APD', 'plans']
    },
    {
      id: 'con_3',
      name: 'Obtention du permis de construire',
      description: 'Permis de construire délivré',
      relative_offset_days: 90,
      weight: 0.4,
      is_critical: true,
      tags: ['permis', 'autorisations']
    }
  ],

  // Préparation du terrain
  'preparation_terrain': [
    {
      id: 'pt_1',
      name: 'Installation du chantier',
      description: 'Base vie et installations terminées',
      relative_offset_days: 14,
      weight: 0.4,
      is_critical: false,
      tags: ['installation', 'chantier']
    },
    {
      id: 'pt_2',
      name: 'Terrassement terminé',
      description: 'Nivellement et excavations complétés',
      relative_offset_days: 30,
      weight: 0.6,
      is_critical: true,
      tags: ['terrassement']
    }
  ],

  // Fondations
  'fondations': [
    {
      id: 'fon_1',
      name: 'Implantation validée',
      description: 'Implantation géomètre validée',
      relative_offset_days: 5,
      weight: 0.2,
      is_critical: true,
      tags: ['géomètre', 'implantation']
    },
    {
      id: 'fon_2',
      name: 'Ferraillage terminé',
      description: 'Armatures posées et contrôlées',
      relative_offset_days: 15,
      weight: 0.3,
      is_critical: false,
      tags: ['ferraillage', 'armatures']
    },
    {
      id: 'fon_3',
      name: 'Coulage béton terminé',
      description: 'Béton coulé et temps de prise respecté',
      relative_offset_days: 25,
      weight: 0.5,
      is_critical: true,
      tags: ['béton', 'coulage']
    }
  ],

  // Gros œuvre
  'gros_oeuvre': [
    {
      id: 'go_1',
      name: 'Élévation murs niveau 0',
      description: 'Murs RDC terminés',
      relative_offset_days: 30,
      weight: 0.25,
      is_critical: false,
      tags: ['murs', 'élévation']
    },
    {
      id: 'go_2',
      name: 'Plancher haut RDC',
      description: 'Dalle haute RDC coulée',
      relative_offset_days: 45,
      weight: 0.25,
      is_critical: true,
      tags: ['plancher', 'dalle']
    },
    {
      id: 'go_3',
      name: 'Mise hors d\'eau',
      description: 'Toiture et charpente terminées',
      relative_offset_days: 75,
      weight: 0.25,
      is_critical: true,
      tags: ['toiture', 'hors d\'eau']
    },
    {
      id: 'go_4',
      name: 'Mise hors d\'air',
      description: 'Menuiseries extérieures posées',
      relative_offset_days: 90,
      weight: 0.25,
      is_critical: true,
      tags: ['menuiseries', 'hors d\'air']
    }
  ],

  // Second œuvre
  'second_oeuvre': [
    {
      id: 'so_1',
      name: 'Cloisonnement terminé',
      description: 'Toutes les cloisons posées',
      relative_offset_days: 30,
      weight: 0.2,
      is_critical: false,
      tags: ['cloisons']
    },
    {
      id: 'so_2',
      name: 'Plomberie/Électricité encastrées',
      description: 'Réseaux techniques encastrés',
      relative_offset_days: 45,
      weight: 0.3,
      is_critical: true,
      tags: ['plomberie', 'électricité', 'réseaux']
    },
    {
      id: 'so_3',
      name: 'Enduits et plâtrerie terminés',
      description: 'Finitions murales terminées',
      relative_offset_days: 60,
      weight: 0.25,
      is_critical: false,
      tags: ['enduits', 'plâtrerie']
    },
    {
      id: 'so_4',
      name: 'Revêtements de sol posés',
      description: 'Carrelage et parquet terminés',
      relative_offset_days: 75,
      weight: 0.25,
      is_critical: false,
      tags: ['revêtements', 'sol']
    }
  ],

  // Finitions
  'finitions': [
    {
      id: 'fin_1',
      name: 'Peintures terminées',
      description: 'Toutes les peintures appliquées',
      relative_offset_days: 15,
      weight: 0.3,
      is_critical: false,
      tags: ['peintures']
    },
    {
      id: 'fin_2',
      name: 'Équipements sanitaires posés',
      description: 'Sanitaires et robinetterie installés',
      relative_offset_days: 20,
      weight: 0.3,
      is_critical: false,
      tags: ['sanitaires', 'équipements']
    },
    {
      id: 'fin_3',
      name: 'Nettoyage de fin de chantier',
      description: 'Chantier nettoyé et prêt pour réception',
      relative_offset_days: 25,
      weight: 0.4,
      is_critical: true,
      tags: ['nettoyage', 'réception']
    }
  ],

  // Réception
  'reception': [
    {
      id: 'rec_1',
      name: 'Pré-réception effectuée',
      description: 'Visite de pré-réception avec levée des réserves',
      relative_offset_days: 7,
      weight: 0.4,
      is_critical: true,
      tags: ['pré-réception', 'réserves']
    },
    {
      id: 'rec_2',
      name: 'Réception définitive',
      description: 'PV de réception signé',
      relative_offset_days: 14,
      weight: 0.6,
      is_critical: true,
      tags: ['réception', 'PV']
    }
  ],

  // BTP Infrastructure
  'terrassement': [
    {
      id: 'ter_1',
      name: 'Décapage terminé',
      description: 'Terre végétale décapée et stockée',
      relative_offset_days: 10,
      weight: 0.3,
      is_critical: false,
      tags: ['décapage']
    },
    {
      id: 'ter_2',
      name: 'Déblais/Remblais terminés',
      description: 'Mouvements de terre finalisés',
      relative_offset_days: 30,
      weight: 0.5,
      is_critical: true,
      tags: ['déblais', 'remblais']
    },
    {
      id: 'ter_3',
      name: 'Compactage validé',
      description: 'Essais de compactage conformes',
      relative_offset_days: 35,
      weight: 0.2,
      is_critical: true,
      tags: ['compactage', 'essais']
    }
  ],

  'voirie': [
    {
      id: 'voi_1',
      name: 'Sous-couche posée',
      description: 'Couche de forme et base terminées',
      relative_offset_days: 20,
      weight: 0.35,
      is_critical: true,
      tags: ['sous-couche', 'base']
    },
    {
      id: 'voi_2',
      name: 'Enrobé posé',
      description: 'Couche de roulement appliquée',
      relative_offset_days: 30,
      weight: 0.4,
      is_critical: true,
      tags: ['enrobé', 'bitume']
    },
    {
      id: 'voi_3',
      name: 'Signalisation terminée',
      description: 'Marquage et panneaux installés',
      relative_offset_days: 35,
      weight: 0.25,
      is_critical: false,
      tags: ['signalisation', 'marquage']
    }
  ],

  'assainissement': [
    {
      id: 'ass_1',
      name: 'Tranchées creusées',
      description: 'Fouilles pour réseaux terminées',
      relative_offset_days: 10,
      weight: 0.2,
      is_critical: false,
      tags: ['tranchées', 'fouilles']
    },
    {
      id: 'ass_2',
      name: 'Canalisations posées',
      description: 'Réseau d\'assainissement installé',
      relative_offset_days: 25,
      weight: 0.4,
      is_critical: true,
      tags: ['canalisations', 'réseau']
    },
    {
      id: 'ass_3',
      name: 'Regards et branchements terminés',
      description: 'Ouvrages annexes installés',
      relative_offset_days: 35,
      weight: 0.25,
      is_critical: false,
      tags: ['regards', 'branchements']
    },
    {
      id: 'ass_4',
      name: 'Tests d\'étanchéité validés',
      description: 'Contrôles caméra et tests conformes',
      relative_offset_days: 40,
      weight: 0.15,
      is_critical: true,
      tags: ['tests', 'étanchéité']
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
