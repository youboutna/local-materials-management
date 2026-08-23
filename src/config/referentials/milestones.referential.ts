import { MilestoneTemplateDTO } from '@/dtos/entities/MilestoneDTO';

/**
 * Milestone templates by construction phase (referential)
 * Based on Waterfall phase-gate methodology with PERT/CPM dependencies
 * 
 * Each phase follows the standard project lifecycle:
 * 1. Initiation Gate → 2. Progress Checkpoints → 3. Deliverable → 4. Phase Gate
 */

/**
 * DEFAULT MILESTONES - Always present on every project
 * These are the fundamental project lifecycle milestones
 */
export const DEFAULT_PROJECT_MILESTONES: MilestoneTemplateDTO[] = [
  {
    id: 'default_project_start',
    name: 'Démarrage du projet',
    description: 'Lancement officiel du projet - réunion de kick-off',
    relativeOffsetDays: 0,
    weight: 0.05,
    isCritical: true,
    type: 'event',
    priority: 'critical',
    tags: ['démarrage', 'lancement', 'kickoff'],
    deliverables: ['Note de lancement', 'Planning initial']
  },
  {
    id: 'default_provisional_reception',
    name: 'Réception provisoire',
    description: 'Réception provisoire des travaux avec établissement des réserves',
    relativeOffsetDays: 90, // Will be calculated based on project duration
    weight: 0.40,
    isCritical: true,
    type: 'gate',
    priority: 'critical',
    tags: ['réception', 'provisoire', 'gate'],
    approvalRequirements: ['Validation MOE', 'Validation MOA', 'Liste des réserves'],
    deliverables: ['PV de réception provisoire', 'Liste des réserves']
  },
  {
    id: 'default_definitive_reception',
    name: 'Réception définitive',
    description: 'Réception définitive après levée des réserves et période de garantie',
    relativeOffsetDays: 365, // 1 year after provisional
    weight: 0.55,
    isCritical: true,
    type: 'gate',
    priority: 'critical',
    tags: ['réception', 'définitive', 'gate', 'final'],
    predecessorIds: ['default_provisional_reception'],
    approvalRequirements: ['Levée des réserves', 'Fin garantie parfait achèvement'],
    deliverables: ['PV de réception définitive', 'DOE', 'DIUO', 'Attestations garanties']
  }
];

/**
 * DEFAULT PHASE MILESTONES - Always present on every phase
 */
export const DEFAULT_PHASE_MILESTONES: MilestoneTemplateDTO[] = [
  {
    id: 'default_phase_start',
    name: 'Démarrage de la phase',
    description: 'Lancement officiel de la phase de travaux',
    relativeOffsetDays: 0,
    weight: 0.15,
    isCritical: true,
    type: 'event',
    priority: 'high',
    tags: ['démarrage', 'phase'],
    deliverables: ['Planning phase']
  },
  {
    id: 'default_phase_checkpoint',
    name: 'Point d\'avancement',
    description: 'Point de contrôle intermédiaire de la phase',
    relativeOffsetDays: 15, // Mid-phase
    weight: 0.35,
    isCritical: false,
    type: 'checkpoint',
    priority: 'normal',
    tags: ['avancement', 'contrôle'],
    predecessorIds: ['default_phase_start']
  },
  {
    id: 'default_phase_completion',
    name: 'Achèvement de la phase',
    description: 'Validation de la fin de phase et passage à la suivante',
    relativeOffsetDays: 30, // End of phase
    weight: 0.50,
    isCritical: true,
    type: 'gate',
    priority: 'critical',
    tags: ['achèvement', 'gate', 'validation'],
    predecessorIds: ['default_phase_checkpoint'],
    deliverables: ['PV fin de phase']
  }
];

export const REFERENTIAL_MILESTONES: Record<string, MilestoneTemplateDTO[]> = {
  // ============= ÉTUDES PRÉLIMINAIRES =============
  'etudes_preliminaires': [
    {
      id: 'ep_gate_0',
      name: 'Lancement des études',
      description: 'Réunion de lancement et validation du périmètre des études',
      relativeOffsetDays: 0,
      weight: 0.1,
      isCritical: true,
      type: 'event',
      priority: 'critical',
      tags: ['lancement', 'kickoff'],
      deliverables: ['Note de cadrage', 'Planning études']
    },
    {
      id: 'ep_1',
      name: 'Études de faisabilité validées',
      description: 'Études techniques et économiques validées par le comité',
      relativeOffsetDays: 30,
      weight: 0.35,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['études', 'validation'],
      predecessorIds: ['ep_gate_0'],
      deliverables: ['Rapport de faisabilité technique', 'Étude économique', 'Analyse des risques']
    },
    {
      id: 'ep_2',
      name: 'Approbation du dossier préliminaire',
      description: 'Phase Gate: Validation par le maître d\'ouvrage pour passage en conception',
      relativeOffsetDays: 45,
      weight: 0.55,
      isCritical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['gate', 'approbation', 'maître d\'ouvrage'],
      predecessorIds: ['ep_1'],
      approvalRequirements: ['Validation technique', 'Validation budgétaire', 'Accord du MOA']
    }
  ],

  // ============= CONCEPTION =============
  'conception': [
    {
      id: 'con_0',
      name: 'Lancement phase conception',
      description: 'Réunion de lancement conception avec l\'équipe projet',
      relativeOffsetDays: 0,
      weight: 0.05,
      isCritical: false,
      type: 'event',
      priority: 'normal',
      tags: ['lancement']
    },
    {
      id: 'con_1',
      name: 'Avant-projet sommaire (APS) validé',
      description: 'Point de contrôle: APS validé avec esquisses et estimations',
      relativeOffsetDays: 30,
      weight: 0.2,
      isCritical: true,
      type: 'checkpoint',
      priority: 'high',
      tags: ['APS', 'conception'],
      predecessorIds: ['con_0'],
      deliverables: ['Plans APS', 'Estimation budgétaire ±20%', 'Planning prévisionnel']
    },
    {
      id: 'con_2',
      name: 'Avant-projet détaillé (APD) validé',
      description: 'Livrable: APD complet avec plans détaillés et devis estimatifs',
      relativeOffsetDays: 60,
      weight: 0.3,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['APD', 'plans'],
      predecessorIds: ['con_1'],
      deliverables: ['Plans APD détaillés', 'CCTP', 'Estimation budgétaire ±10%', 'Planning travaux']
    },
    {
      id: 'con_3',
      name: 'Obtention du permis de construire',
      description: 'Phase Gate: Permis de construire délivré - autorisation administrative',
      relativeOffsetDays: 90,
      weight: 0.45,
      isCritical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['permis', 'autorisations', 'gate'],
      predecessorIds: ['con_2'],
      approvalRequirements: ['Conformité urbanisme', 'Avis services', 'Signature mairie']
    }
  ],

  // ============= PRÉPARATION DU TERRAIN =============
  'preparation_terrain': [
    {
      id: 'pt_0',
      name: 'Ordre de service travaux',
      description: 'Événement: Démarrage officiel des travaux préparatoires',
      relativeOffsetDays: 0,
      weight: 0.1,
      isCritical: true,
      type: 'event',
      priority: 'critical',
      tags: ['OS', 'démarrage'],
      deliverables: ['Ordre de service signé', 'Planning d\'exécution']
    },
    {
      id: 'pt_1',
      name: 'Installation de chantier terminée',
      description: 'Checkpoint: Base vie et installations opérationnelles',
      relativeOffsetDays: 14,
      weight: 0.3,
      isCritical: false,
      type: 'checkpoint',
      priority: 'high',
      tags: ['installation', 'chantier'],
      predecessorIds: ['pt_0'],
      deliverables: ['PV installation chantier', 'Plan d\'installation validé']
    },
    {
      id: 'pt_2',
      name: 'Terrassement terminé',
      description: 'Livrable: Nivellement et excavations complétés, prêt pour fondations',
      relativeOffsetDays: 30,
      weight: 0.6,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['terrassement', 'excavation'],
      predecessorIds: ['pt_1'],
      deliverables: ['PV réception terrassement', 'Relevé topographique final']
    }
  ],

  // ============= FONDATIONS =============
  'fondations': [
    {
      id: 'fon_1',
      name: 'Implantation validée par géomètre',
      description: 'Checkpoint: Implantation géomètre validée et PV signé',
      relativeOffsetDays: 5,
      weight: 0.15,
      isCritical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['géomètre', 'implantation'],
      deliverables: ['PV implantation', 'Bornage']
    },
    {
      id: 'fon_2',
      name: 'Ferraillage terminé et contrôlé',
      description: 'Checkpoint: Armatures posées, contrôle bureau de contrôle effectué',
      relativeOffsetDays: 15,
      weight: 0.3,
      isCritical: true,
      type: 'checkpoint',
      priority: 'high',
      tags: ['ferraillage', 'armatures', 'contrôle'],
      predecessorIds: ['fon_1'],
      deliverables: ['Rapport bureau de contrôle', 'Bon pour coulage']
    },
    {
      id: 'fon_3',
      name: 'Fondations terminées',
      description: 'Livrable: Béton coulé, temps de prise respecté, fondations réceptionnées',
      relativeOffsetDays: 25,
      weight: 0.55,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['béton', 'coulage', 'réception'],
      predecessorIds: ['fon_2'],
      deliverables: ['PV réception fondations', 'Épreuves béton']
    }
  ],

  // ============= GROS ŒUVRE =============
  'gros_oeuvre': [
    {
      id: 'go_1',
      name: 'Élévation murs RDC terminée',
      description: 'Checkpoint: Murs du rez-de-chaussée terminés',
      relativeOffsetDays: 30,
      weight: 0.15,
      isCritical: false,
      type: 'checkpoint',
      priority: 'high',
      tags: ['murs', 'élévation', 'RDC']
    },
    {
      id: 'go_2',
      name: 'Plancher haut RDC coulé',
      description: 'Livrable: Dalle haute RDC coulée et contrôlée',
      relativeOffsetDays: 45,
      weight: 0.2,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['plancher', 'dalle'],
      predecessorIds: ['go_1'],
      deliverables: ['PV dalle', 'Rapport bureau de contrôle']
    },
    {
      id: 'go_3',
      name: 'Mise hors d\'eau',
      description: 'Gate: Toiture et charpente terminées - bâtiment protégé des intempéries',
      relativeOffsetDays: 75,
      weight: 0.3,
      isCritical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['toiture', 'hors d\'eau', 'gate'],
      predecessorIds: ['go_2'],
      approvalRequirements: ['Validation charpente', 'Étanchéité toiture']
    },
    {
      id: 'go_4',
      name: 'Mise hors d\'air',
      description: 'Gate: Menuiseries extérieures posées - bâtiment fermé',
      relativeOffsetDays: 90,
      weight: 0.35,
      isCritical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['menuiseries', 'hors d\'air', 'gate'],
      predecessorIds: ['go_3'],
      approvalRequirements: ['Pose menuiseries', 'Étanchéité à l\'air']
    }
  ],

  // ============= SECOND ŒUVRE =============
  'second_oeuvre': [
    {
      id: 'so_1',
      name: 'Cloisonnement terminé',
      description: 'Checkpoint: Toutes les cloisons posées',
      relativeOffsetDays: 30,
      weight: 0.15,
      isCritical: false,
      type: 'checkpoint',
      priority: 'normal',
      tags: ['cloisons', 'distribution']
    },
    {
      id: 'so_2',
      name: 'Réseaux techniques encastrés',
      description: 'Livrable: Plomberie et électricité encastrées, avant fermeture',
      relativeOffsetDays: 45,
      weight: 0.25,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['plomberie', 'électricité', 'réseaux'],
      predecessorIds: ['so_1', 'elec_dist_1'],
      deliverables: ['PV passage réseaux', 'Plans de récolement']
    },
    {
      id: 'so_3',
      name: 'Enduits et plâtrerie terminés',
      description: 'Checkpoint: Finitions murales terminées',
      relativeOffsetDays: 60,
      weight: 0.25,
      isCritical: false,
      type: 'checkpoint',
      priority: 'high',
      tags: ['enduits', 'plâtrerie'],
      predecessorIds: ['so_2']
    },
    {
      id: 'so_4',
      name: 'Revêtements de sol posés',
      description: 'Livrable: Carrelage et parquet terminés',
      relativeOffsetDays: 75,
      weight: 0.35,
      isCritical: true,
      type: 'deliverable',
      priority: 'high',
      tags: ['revêtements', 'sol', 'carrelage'],
      predecessorIds: ['so_3'],
      deliverables: ['PV pose revêtements']
    }
  ],

  // ============= FINITIONS =============
  'finitions': [
    {
      id: 'fin_1',
      name: 'Peintures terminées',
      description: 'Checkpoint: Toutes les peintures appliquées',
      relativeOffsetDays: 15,
      weight: 0.25,
      isCritical: false,
      type: 'checkpoint',
      priority: 'normal',
      tags: ['peintures', 'finitions']
    },
    {
      id: 'fin_2',
      name: 'Équipements sanitaires posés',
      description: 'Livrable: Sanitaires et robinetterie installés et fonctionnels',
      relativeOffsetDays: 20,
      weight: 0.3,
      isCritical: false,
      type: 'deliverable',
      priority: 'high',
      tags: ['sanitaires', 'équipements'],
      predecessorIds: ['fin_1'],
      deliverables: ['Essais sanitaires']
    },
    {
      id: 'fin_3',
      name: 'Appareillages électriques terminés',
      description: 'Checkpoint: Prises, interrupteurs et commandes installés',
      relativeOffsetDays: 18,
      weight: 0.25,
      isCritical: true,
      type: 'checkpoint',
      priority: 'high',
      tags: ['appareillages', 'finitions'],
      predecessorIds: ['fin_1', 'elec_dist_3']
    },
    {
      id: 'fin_4',
      name: 'Nettoyage fin de chantier',
      description: 'Checkpoint: Chantier nettoyé et prêt pour pré-réception',
      relativeOffsetDays: 25,
      weight: 0.2,
      isCritical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['nettoyage', 'préparation'],
      predecessorIds: ['fin_2', 'fin_3']
    }
  ],

  // ============= RÉCEPTION =============
  'reception': [
    {
      id: 'rec_1',
      name: 'Pré-réception effectuée',
      description: 'Checkpoint: Visite de pré-réception avec établissement des réserves',
      relativeOffsetDays: 7,
      weight: 0.35,
      isCritical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['pré-réception', 'réserves'],
      predecessorIds: ['elec_test_3'],
      deliverables: ['Liste des réserves', 'Planning levée réserves', 'Copie attestation Consuel']
    },
    {
      id: 'rec_2',
      name: 'Levée des réserves',
      description: 'Checkpoint: Toutes les réserves levées et validées',
      relativeOffsetDays: 12,
      weight: 0.25,
      isCritical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['réserves', 'levée'],
      predecessorIds: ['rec_1'],
      deliverables: ['PV levée des réserves']
    },
    {
      id: 'rec_3',
      name: 'Réception définitive',
      description: 'Gate Final: PV de réception signé - transfert de propriété',
      relativeOffsetDays: 14,
      weight: 0.4,
      isCritical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['réception', 'PV', 'gate', 'final'],
      predecessorIds: ['rec_2'],
      approvalRequirements: ['Signature MOE', 'Signature MOA', 'Signature entreprise'],
      deliverables: ['PV de réception', 'DOE', 'DIUO', 'Garanties']
    }
  ],

  // ============= INFRASTRUCTURE - TERRASSEMENT =============
  'terrassement': [
    {
      id: 'ter_0',
      name: 'Démarrage terrassement',
      description: 'Événement: Début des travaux de terrassement',
      relativeOffsetDays: 0,
      weight: 0.1,
      isCritical: false,
      type: 'event',
      priority: 'normal',
      tags: ['démarrage']
    },
    {
      id: 'ter_1',
      name: 'Décapage terminé',
      description: 'Checkpoint: Terre végétale décapée et stockée',
      relativeOffsetDays: 10,
      weight: 0.25,
      isCritical: false,
      type: 'checkpoint',
      priority: 'normal',
      tags: ['décapage'],
      predecessorIds: ['ter_0']
    },
    {
      id: 'ter_2',
      name: 'Déblais/Remblais terminés',
      description: 'Livrable: Mouvements de terre finalisés selon profil projet',
      relativeOffsetDays: 30,
      weight: 0.4,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['déblais', 'remblais'],
      predecessorIds: ['ter_1'],
      deliverables: ['Plan de récolement terrassement']
    },
    {
      id: 'ter_3',
      name: 'Compactage validé',
      description: 'Gate: Essais de compactage conformes - validation pour suite des travaux',
      relativeOffsetDays: 35,
      weight: 0.25,
      isCritical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['compactage', 'essais', 'gate'],
      predecessorIds: ['ter_2'],
      approvalRequirements: ['Rapport essais compactage', 'Validation laboratoire']
    }
  ],

  // ============= INFRASTRUCTURE - VOIRIE =============
  'voirie': [
    {
      id: 'voi_1',
      name: 'Sous-couche posée',
      description: 'Checkpoint: Couche de forme et couche de base terminées',
      relativeOffsetDays: 20,
      weight: 0.3,
      isCritical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['sous-couche', 'base'],
      deliverables: ['Essais portance']
    },
    {
      id: 'voi_2',
      name: 'Enrobé posé',
      description: 'Livrable: Couche de roulement appliquée',
      relativeOffsetDays: 30,
      weight: 0.4,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['enrobé', 'bitume'],
      predecessorIds: ['voi_1'],
      deliverables: ['Carottages enrobé', 'Rapport contrôle']
    },
    {
      id: 'voi_3',
      name: 'Signalisation terminée',
      description: 'Checkpoint: Marquage et panneaux installés',
      relativeOffsetDays: 35,
      weight: 0.3,
      isCritical: false,
      type: 'checkpoint',
      priority: 'normal',
      tags: ['signalisation', 'marquage'],
      predecessorIds: ['voi_2']
    }
  ],

  // ============= INFRASTRUCTURE - ASSAINISSEMENT =============
  'assainissement': [
    {
      id: 'ass_1',
      name: 'Tranchées creusées',
      description: 'Checkpoint: Fouilles pour réseaux terminées',
      relativeOffsetDays: 10,
      weight: 0.15,
      isCritical: false,
      type: 'checkpoint',
      priority: 'normal',
      tags: ['tranchées', 'fouilles']
    },
    {
      id: 'ass_2',
      name: 'Canalisations posées',
      description: 'Livrable: Réseau d\'assainissement installé',
      relativeOffsetDays: 25,
      weight: 0.35,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['canalisations', 'réseau'],
      predecessorIds: ['ass_1'],
      deliverables: ['Plan de récolement', 'PV pose']
    },
    {
      id: 'ass_3',
      name: 'Regards et branchements terminés',
      description: 'Checkpoint: Ouvrages annexes installés',
      relativeOffsetDays: 35,
      weight: 0.25,
      isCritical: false,
      type: 'checkpoint',
      priority: 'high',
      tags: ['regards', 'branchements'],
      predecessorIds: ['ass_2']
    },
    {
      id: 'ass_4',
      name: 'Tests d\'étanchéité validés',
      description: 'Gate: Contrôles caméra et tests conformes - réseau réceptionnable',
      relativeOffsetDays: 40,
      weight: 0.25,
      isCritical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['tests', 'étanchéité', 'gate'],
      predecessorIds: ['ass_3'],
      approvalRequirements: ['Rapport inspection caméra', 'Tests étanchéité conformes']
    }
  ],

  // ============= RÉSEAU ÉLECTRIQUE - ALIMENTATION =============
  'reseau_electrique_alimentation': [
    {
      id: 'elec_alim_0',
      name: 'Dossier technique électrique validé',
      description: 'Validation des plans et schémas électriques par bureau de contrôle',
      relativeOffsetDays: 0,
      weight: 0.1,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['plans', 'schémas', 'validation'],
      deliverables: ['Plans électriques', 'Schémas unifilaires', 'Calculs de section', 'Avis bureau de contrôle']
    },
    {
      id: 'elec_alim_1',
      name: 'Demande de raccordement déposée',
      description: 'Dossier complet déposé auprès du gestionnaire de réseau (ENEDIS, etc.)',
      relativeOffsetDays: 10,
      weight: 0.2,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['raccordement', 'dossier', 'gestionnaire'],
      predecessorIds: ['elec_alim_0'],
      deliverables: ['Dossier de raccordement', 'Accusé réception']
    },
    {
      id: 'elec_alim_2',
      name: 'Devis de raccordement reçu',
      description: 'Proposition technique et financière du gestionnaire de réseau validée',
      relativeOffsetDays: 30,
      weight: 0.15,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['devis', 'proposition', 'validation'],
      predecessorIds: ['elec_alim_1'],
      deliverables: ['Devis gestionnaire', 'Planning travaux raccordement']
    },
    {
      id: 'elec_alim_3',
      name: 'Travaux de raccordement BT/HT terminés',
      description: 'Installation des câbles d\'alimentation depuis le réseau public',
      relativeOffsetDays: 60,
      weight: 0.3,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['câbles', 'alimentation', 'tranchées'],
      predecessorIds: ['elec_alim_2'],
      deliverables: ['PV de pose', 'Plan de récolement', 'Mesures de terre']
    },
    {
      id: 'elec_alim_4',
      name: 'Poste de transformation installé',
      description: 'Poste HTA/BT ou transformateur installé et testé',
      relativeOffsetDays: 75,
      weight: 0.25,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['poste', 'transfo', 'HTA/BT'],
      predecessorIds: ['elec_alim_3'],
      deliverables: ['Fiche de vie transformateur', 'Tests diélectriques', 'Rapport de mise en service']
    }
  ],

  // ============= RÉSEAU ÉLECTRIQUE - DISTRIBUTION =============
  'reseau_electrique_distribution': [
    {
      id: 'elec_dist_0',
      name: 'Tableaux électriques installés',
      description: 'Tableaux divisionnaires et général posés et fixés',
      relativeOffsetDays: 0,
      weight: 0.2,
      isCritical: true,
      type: 'deliverable',
      priority: 'high',
      tags: ['tableaux', 'divisionnaires', 'général'],
      deliverables: ['Plans d\'implantation', 'PV d\'installation']
    },
    {
      id: 'elec_dist_1',
      name: 'Gaines et chemins de câbles posés',
      description: 'Infrastructure de distribution (goulottes, chemins, fourreaux) installée',
      relativeOffsetDays: 15,
      weight: 0.25,
      isCritical: true,
      type: 'deliverable',
      priority: 'high',
      tags: ['gaines', 'chemins', 'fourreaux'],
      predecessorIds: ['elec_dist_0'],
      deliverables: ['Plan de récolement réseaux']
    },
    {
      id: 'elec_dist_2',
      name: 'Tirage des câbles terminé',
      description: 'Câblage complet de tous les circuits',
      relativeOffsetDays: 30,
      weight: 0.3,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['câblage', 'circuits', 'tirage'],
      predecessorIds: ['elec_dist_1'],
      deliverables: ['PV tirage câbles', 'Marquage circuits']
    },
    {
      id: 'elec_dist_3',
      name: 'Raccordement aux appareillages',
      description: 'Connexion aux prises, interrupteurs, luminaires et équipements',
      relativeOffsetDays: 40,
      weight: 0.25,
      isCritical: true,
      type: 'checkpoint',
      priority: 'high',
      tags: ['raccordement', 'prises', 'interrupteurs'],
      predecessorIds: ['elec_dist_2'],
      deliverables: ['Tests de continuité', 'Marquage des phases']
    }
  ],

  // ============= RÉSEAU ÉLECTRIQUE - ESSAIS ET MISE EN SERVICE =============
  'reseau_electrique_essais': [
    {
      id: 'elec_test_0',
      name: 'Mesures de terre et isolement',
      description: 'Contrôles réglementaires des installations',
      relativeOffsetDays: 0,
      weight: 0.25,
      isCritical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['terre', 'isolement', 'mesures'],
      deliverables: [
        'Rapport de mesure de terre',
        'Contrôle d\'isolement',
        'Mesure de continuité'
      ]
    },
    {
      id: 'elec_test_1',
      name: 'Tests de fonctionnement',
      description: 'Vérification du bon fonctionnement de tous les circuits',
      relativeOffsetDays: 5,
      weight: 0.3,
      isCritical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['tests', 'fonctionnement', 'circuits'],
      predecessorIds: ['elec_test_0'],
      deliverables: [
        'Protocole de test',
        'Liste des anomalies',
        'Rapport de mise sous tension'
      ]
    },
    {
      id: 'elec_test_2',
      name: 'Essais de sécurité',
      description: 'Vérification des dispositifs de protection',
      relativeOffsetDays: 8,
      weight: 0.25,
      isCritical: true,
      type: 'checkpoint',
      priority: 'critical',
      tags: ['sécurité', 'disjoncteurs', 'DDR'],
      predecessorIds: ['elec_test_1'],
      deliverables: [
        'Test différentiels',
        'Calibrage disjoncteurs',
        'Vérification sectionneurs'
      ]
    },
    {
      id: 'elec_test_3',
      name: 'Consuel obtenu',
      description: 'Attestation de conformité électrique délivrée',
      relativeOffsetDays: 12,
      weight: 0.2,
      isCritical: true,
      type: 'gate',
      priority: 'critical',
      tags: ['consuel', 'conformité', 'attestation', 'gate'],
      predecessorIds: ['elec_test_2'],
      approvalRequirements: [
        'Visite contrôleur',
        'Dossier technique complet',
        'Rapports de mesures conformes'
      ],
      deliverables: ['Attestation Consuel', 'Certificat de conformité']
    }
  ],

  // ============= RÉSEAU ÉLECTRIQUE - ÉCLAIRAGE =============
  'reseau_eclairage': [
    {
      id: 'ecl_0',
      name: 'Luminaires installés',
      description: 'Pose de tous les luminaires intérieurs et extérieurs',
      relativeOffsetDays: 0,
      weight: 0.4,
      isCritical: false,
      type: 'deliverable',
      priority: 'normal',
      tags: ['luminaires', 'éclairage', 'pose'],
      deliverables: ['Plan d\'implantation', 'Fiches techniques']
    },
    {
      id: 'ecl_1',
      name: 'Système de gestion installé',
      description: 'Installation des automates et systèmes de gestion d\'éclairage',
      relativeOffsetDays: 10,
      weight: 0.3,
      isCritical: true,
      type: 'deliverable',
      priority: 'high',
      tags: ['gestion', 'automation', 'DALI'],
      predecessorIds: ['ecl_0'],
      deliverables: ['Programmation automate', 'Notice de fonctionnement']
    },
    {
      id: 'ecl_2',
      name: 'Tests d\'éclairement',
      description: 'Vérification des niveaux d\'éclairement conformes aux normes',
      relativeOffsetDays: 15,
      weight: 0.3,
      isCritical: false,
      type: 'checkpoint',
      priority: 'normal',
      tags: ['éclairement', 'mesures', 'normes'],
      predecessorIds: ['ecl_1'],
      deliverables: ['Rapport d\'éclairement', 'Vérification normes EN 12464']
    }
  ],

  // ============= RÉSEAU ÉLECTRIQUE - COURANT FAIBLE =============
  'courant_faible': [
    {
      id: 'cf_0',
      name: 'Infrastructure courant faible installée',
      description: 'Pose des baies, chemins de câbles et fourreaux dédiés',
      relativeOffsetDays: 0,
      weight: 0.2,
      isCritical: false,
      type: 'deliverable',
      priority: 'normal',
      tags: ['baies', 'chemins', 'infrastructure'],
      deliverables: ['Plan d\'implantation']
    },
    {
      id: 'cf_1',
      name: 'Câblage télécom/data terminé',
      description: 'Tirage et connexion des câbles réseau et téléphoniques',
      relativeOffsetDays: 20,
      weight: 0.3,
      isCritical: true,
      type: 'deliverable',
      priority: 'high',
      tags: ['réseau', 'télécom', 'fibre'],
      predecessorIds: ['cf_0'],
      deliverables: ['Plan de brassage', 'Certification câbles']
    },
    {
      id: 'cf_2',
      name: 'Système de sécurité installé',
      description: 'Installation alarme, contrôle d\'accès et vidéosurveillance',
      relativeOffsetDays: 30,
      weight: 0.25,
      isCritical: true,
      type: 'deliverable',
      priority: 'critical',
      tags: ['alarme', 'contrôle accès', 'vidéo'],
      predecessorIds: ['cf_1'],
      deliverables: ['Programmation système', 'Codes d\'accès']
    },
    {
      id: 'cf_3',
      name: 'Tests et certification',
      description: 'Validation des performances des réseaux courant faible',
      relativeOffsetDays: 35,
      weight: 0.25,
      isCritical: true,
      type: 'checkpoint',
      priority: 'high',
      tags: ['tests', 'certification', 'performance'],
      predecessorIds: ['cf_2'],
      deliverables: [
        'Rapport de tests réseaux',
        'Certification fibre optique',
        'Rapport de couverture WiFi'
      ]
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
    critical: templates.filter(t => t.isCritical).length,
    gates: templates.filter(t => t.type === 'gate').length,
    deliverables: templates.filter(t => t.type === 'deliverable').length
  };
}

/**
 * Get default project milestones
 */
export function getDefaultProjectMilestones(): MilestoneTemplateDTO[] {
  return DEFAULT_PROJECT_MILESTONES;
}

/**
 * Get default phase milestones
 */
export function getDefaultPhaseMilestones(): MilestoneTemplateDTO[] {
  return DEFAULT_PHASE_MILESTONES;
}

/**
 * Get milestones for a phase, with defaults if no specific templates exist
 */
export function getMilestoneTemplatesWithDefaults(constructionPhase: string): MilestoneTemplateDTO[] {
  const specific = getMilestoneTemplates(constructionPhase);
  
  // If specific templates exist, return them
  if (specific.length > 0) {
    return specific;
  }
  
  // Otherwise, return default phase milestones
  return DEFAULT_PHASE_MILESTONES;
}

/**
 * Electrical phases for easy reference
 */
export const ELECTRICAL_PHASES = [
  'reseau_electrique_alimentation',
  'reseau_electrique_distribution', 
  'reseau_electrique_essais',
  'reseau_eclairage',
  'courant_faible'
];
