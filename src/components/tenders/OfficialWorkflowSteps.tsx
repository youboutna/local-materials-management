
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
    title: "Planification des achats",
    description: "Élaboration du Plan Annuel d'Achats (PAA) et du Plan de Passation des Marchés (PPM)",
    requiredDocuments: [
      "Plan Annuel d'Achats (PAA)",
      "Plan de Passation des Marchés (PPM)",
      "Estimation des ressources financières",
      "Définition des modalités de planification"
    ],
    estimatedDuration: 30,
    category: 'planning'
  },
  {
    id: 2,
    title: "Publicité et appel d'offres",
    description: "Publication des avis selon les procédures formalisées ou adaptées",
    requiredDocuments: [
      "Avis d'appel d'offres",
      "Dossier d'appel d'offres",
      "Cahier des charges",
      "Publication au Portail National des Marchés Publics",
      "Publication dans les journaux d'annonces légales"
    ],
    estimatedDuration: 45,
    category: 'publicity'
  },
  {
    id: 3,
    title: "Réception et analyse des offres",
    description: "Analyse des offres par la Commission de Passation des Marchés Publics (CPMP)",
    requiredDocuments: [
      "Dossiers techniques des candidats",
      "Rapport d'analyse de la CPMP",
      "Procès-verbal d'ouverture des plis",
      "Évaluation de conformité des offres",
      "Rapport de la sous-commission d'analyse"
    ],
    estimatedDuration: 30,
    category: 'analysis'
  },
  {
    id: 4,
    title: "Attribution du marché",
    description: "Attribution au soumissionnaire présentant l'offre économiquement la plus avantageuse",
    requiredDocuments: [
      "Rapport d'attribution",
      "Décision d'attribution",
      "Avis d'attribution",
      "Contrat de marché",
      "Garanties bancaires"
    ],
    estimatedDuration: 15,
    category: 'attribution'
  },
  {
    id: 5,
    title: "Contrôle et régulation",
    description: "Contrôle par la CNCMP et régulation par l'ARMP",
    requiredDocuments: [
      "Rapport de contrôle CNCMP",
      "Certificat de régularité",
      "Rapport d'audit",
      "Procès-verbal de réception",
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
