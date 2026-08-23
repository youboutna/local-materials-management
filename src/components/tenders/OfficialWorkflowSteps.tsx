
import React from 'react';
import { 
  Calendar, 
  Megaphone, 
  FileText, 
  Award, 
  Shield 
} from 'lucide-react';

export interface OfficialWorkflowStep {
  id: number;
  title: string;
  description: string;
  requiredDocuments: string[];
  estimatedDuration: number; // in days
  category: 'planning' | 'publicity' | 'analysis' | 'attribution' | 'control';
}

export const OFFICIAL_WORKFLOW_STEPS: OfficialWorkflowStep[] = [
  {
    id: 1,
    title: 'auto.officialworkflowsteps.planification_des_achats',
    description: "Élaboration du Plan Annuel d'Achats (PAA) et du Plan de Passation des Marchés (PPM)",
    requiredDocuments: [
      "Plan Annuel d'Achats (PAA)",
      'auto.officialworkflowsteps.plan_de_passation_des_marches_ppm',
      'auto.officialworkflowsteps.estimation_des_ressources_financieres',
      'auto.officialworkflowsteps.definition_des_modalites_de_planification'
    ],
    estimatedDuration: 30,
    category: 'planning'
  },
  {
    id: 2,
    title: "Publicité et appel d'offres",
    description: 'auto.officialworkflowsteps.publication_des_avis_selon_les_procedures_formal',
    requiredDocuments: [
      "Avis d'appel d'offres",
      "Dossier d'appel d'offres",
      'auto.officialworkflowsteps.cahier_des_charges',
      'auto.officialworkflowsteps.publication_au_portail_national_des_marches_publ',
      "Publication dans les journaux d'annonces légales"
    ],
    estimatedDuration: 45,
    category: 'publicity'
  },
  {
    id: 3,
    title: 'auto.officialworkflowsteps.reception_et_analyse_des_offres',
    description: 'auto.officialworkflowsteps.analyse_des_offres_par_la_commission_de_passatio',
    requiredDocuments: [
      'auto.officialworkflowsteps.dossiers_techniques_des_candidats',
      "Rapport d'analyse de la CPMP",
      "Procès-verbal d'ouverture des plis",
      'auto.officialworkflowsteps.evaluation_de_conformite_des_offres',
      "Rapport de la sous-commission d'analyse"
    ],
    estimatedDuration: 30,
    category: 'analysis'
  },
  {
    id: 4,
    title: 'auto.officialworkflowsteps.attribution_du_marche',
    description: "Attribution au soumissionnaire présentant l'offre économiquement la plus avantageuse",
    requiredDocuments: [
      "Rapport d'attribution",
      "Décision d'attribution",
      "Avis d'attribution",
      'auto.officialworkflowsteps.contrat_de_marche',
      'auto.officialworkflowsteps.garanties_bancaires'
    ],
    estimatedDuration: 15,
    category: 'attribution'
  },
  {
    id: 5,
    title: 'auto.officialworkflowsteps.controle_et_regulation',
    description: "Contrôle par la CNCMP et régulation par l'ARMP",
    requiredDocuments: [
      'auto.officialworkflowsteps.rapport_de_controle_cncmp',
      'auto.officialworkflowsteps.certificat_de_regularite',
      "Rapport d'audit",
      'auto.officialworkflowsteps.proces_verbal_de_reception',
      "Rapport final d'exécution"
    ],
    estimatedDuration: 20,
    category: 'control'
  }
];

export const getStepIcon = (category: string) => {
  switch (category) {
    case 'planning': return Calendar;
    case 'publicity': return Megaphone;
    case 'analysis': return FileText;
    case 'attribution': return Award;
    case 'control': return Shield;
    default: return FileText;
  }
};

export const getStepColor = (category: string) => {
  switch (category) {
    case 'planning': return 'bg-primary/10 border-primary/30 text-primary';
    case 'publicity': return 'bg-success-soft border-success/30 text-success';
    case 'analysis': return 'bg-warning/10 border-warning/30 text-warning';
    case 'attribution': return 'bg-purple-100 border-purple-300 text-purple-800';
    case 'control': return 'bg-destructive/10 border-destructive/30 text-destructive';
    default: return 'bg-muted border-border text-foreground';
  }
};
