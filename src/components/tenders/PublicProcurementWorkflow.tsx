import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Megaphone, 
  FileText, 
  Award, 
  Shield,
  ChevronRight} from 'lucide-react';

// Define types for procurement phases and stages
export type ProcurementPhase =
  | 'planification'
  | 'publicite'
  | 'reception_analyse'
  | 'attribution'
  | 'controle_regulation';

export type ProcurementStage =
  | 'estimation_ressources'
  | 'planification_achats'
  | 'modalites_planification'
  | 'publication_portail'
  | 'diffusion_journaux'
  | 'inscription_candidats'
  | 'notification_opportunites'
  | 'soumission_dossiers'
  | 'analyse_cpmp'
  | 'assistance_sous_commission'
  | 'evaluation_conformite'
  | 'selection_prix'
  | 'choix_economique'
  | 'publication_attribution'
  | 'signature_marche'
  | 'controle_cncmp'
  | 'verification_regulier'
  | 'regulation_armp'
  | 'commission_disciplinaire';

// Mauritanian public procurement workflow stages mapping
export const PROCUREMENT_STAGES: {
  [key in ProcurementPhase]: { value: ProcurementStage; label: string }[]
} = {
  planification: [
    { value: 'estimation_ressources', label: 'Estimation des ressources financières nécessaires' },
    { value: 'planification_achats', label: 'Planification des achats par catégorie (personnel, locations, assurances, etc.)' },
    { value: 'modalites_planification', label: 'Définition des modalités de planification' }
  ],
  publicite: [
    { value: 'publication_portail', label: 'Publication via le Portail National des Marchés Publics' },
    { value: 'diffusion_journaux', label: 'Diffusion dans les journaux d\'annonces légales' },
    { value: 'inscription_candidats', label: 'Inscription des candidats potentiels sur le portail' },
    { value: 'notification_opportunites', label: 'Notifications d\'opportunités aux candidats' }
  ],
  reception_analyse: [
    { value: 'soumission_dossiers', label: 'Soumission des dossiers techniques par les candidats' },
    { value: 'analyse_cpmp', label: 'Analyse par la CPMP présidée par la PRMP' },
    { value: 'assistance_sous_commission', label: 'Assistance de la sous-commission d\'analyse des offres' },
    { value: 'evaluation_conformite', label: 'Évaluation de la conformité des offres' }
  ],
  attribution: [
    { value: 'selection_prix', label: 'Sélection basée sur le critère du prix ou du coût' },
    { value: 'choix_economique', label: 'Choix de l\'offre économiquement la plus avantageuse' },
    { value: 'publication_attribution', label: 'Publication de l\'avis d\'attribution dans les 30 jours' },
    { value: 'signature_marche', label: 'Signature du marché avec l\'attributaire' }
  ],
  controle_regulation: [
    { value: 'controle_cncmp', label: 'Contrôle a priori et a posteriori par la CNCMP' },
    { value: 'verification_regulier', label: 'Vérification de la régularité des procédures' },
    { value: 'regulation_armp', label: 'Régulation par l\'ARMP (Conseil de Régulation, Commission de Règlement des Différends)' },
    { value: 'commission_disciplinaire', label: 'Commission Disciplinaire pour les sanctions' }
  ]
};

export const PROCUREMENT_PHASE_LABELS: { [key in ProcurementPhase]: string } = {
  planification: 'Planification',
  publicite: 'Publicité',
  reception_analyse: 'Réception & Analyse',
  attribution: 'Attribution',
  controle_regulation: 'Contrôle & Régulation'
};




// Export workflowSteps data for use in other components
export const PROCUREMENT_PHASES = Object.fromEntries(
  Object.entries(PROCUREMENT_STAGES).map(([phase, stages], index) => [
    phase,
    {
      id: index + 1,
      phase: phase as ProcurementPhase,
      title: PROCUREMENT_PHASE_LABELS[phase as ProcurementPhase],
      icon: [Calendar, Megaphone, FileText, Award, Shield][index],
      stages
    }
  ])
) as { [key in ProcurementPhase]: { id: number; phase: ProcurementPhase; title: string; icon: any; stages: { value: ProcurementStage; label: string }[] } };

// Add this to your PublicProcurementWorkflow.tsx or create a new file

export const SUGGESTED_DOCUMENTS: {
  [key in ProcurementPhase]: {
    stage: ProcurementStage;
    documents: {
      category: TenderDocumentCategory;
      subcategory: TenderDocumentSubcategory;
      title: string;
      isRequired: boolean;
    }[];
  }[]
} = {
  planification: [
    {
      stage: 'estimation_ressources',
      documents: [
        {
          category: 'financial',
          subcategory: 'montant_alloue',
          title: 'Budget alloué et estimation des ressources',
          isRequired: true
        }
      ]
    },
    {
      stage: 'planification_achats',
      documents: [
        {
          category: 'administrative',
          subcategory: 'plan_annuel_achats',
          title: 'Plan Annuel d\'Achats (PAA)',
          isRequired: true
        },
        {
          category: 'administrative',
          subcategory: 'modele_paa',
          title: 'Modèle de Plan Annuel des Achats',
          isRequired: true
        }
      ]
    },
    {
      stage: 'modalites_planification',
      documents: [
        {
          category: 'administrative',
          subcategory: 'procedure_proposee',
          title: 'Modalités de planification et procédure proposée',
          isRequired: true
        }
      ]
    }
  ],
  publicite: [
    {
      stage: 'publication_portail',
      documents: [
        {
          category: 'administrative',
          subcategory: 'publication_armp',
          title: 'Preuve de publication sur le portail ARMP',
          isRequired: true
        },
        {
          category: 'administrative',
          subcategory: 'demande_initiation',
          title: 'Demande d\'initiation de la procédure',
          isRequired: true
        }
      ]
    },
    {
      stage: 'diffusion_journaux',
      documents: [
        {
          category: 'administrative',
          subcategory: 'preuves_publication',
          title: 'Preuves de diffusion dans les journaux',
          isRequired: true
        }
      ]
    },
    {
      stage: 'inscription_candidats',
      documents: [
        {
          category: 'administrative',
          subcategory: 'registre_reception_plis',
          title: 'Registre d\'inscription des candidats',
          isRequired: true
        }
      ]
    },
    {
      stage: 'notification_opportunites',
      documents: [
        {
          category: 'administrative',
          subcategory: 'lettre_invitation',
          title: 'Lettres de notification aux candidats',
          isRequired: true
        }
      ]
    }
  ],
  reception_analyse: [
    {
      stage: 'soumission_dossiers',
      documents: [
        {
          category: 'administrative',
          subcategory: 'lettre_soumission',
          title: 'Lettre de soumission',
          isRequired: true
        },
        {
          category: 'administrative',
          subcategory: 'pouvoir_signature',
          title: 'Pouvoir de signature',
          isRequired: true
        },
        {
          category: 'administrative',
          subcategory: 'acte_groupement',
          title: 'Acte de groupement',
          isRequired: false
        },
        {
          category: 'administrative',
          subcategory: 'attestation_impot',
          title: 'Attestation d\'impôt',
          isRequired: true
        },
        {
          category: 'administrative',
          subcategory: 'attestation_cnss',
          title: 'Attestation CNSS',
          isRequired: true
        },
        {
          category: 'administrative',
          subcategory: 'attestation_non_faillite',
          title: 'Attestation de non-faillite',
          isRequired: true
        }
      ]
    },
    {
      stage: 'analyse_cpmp',
      documents: [
        {
          category: 'administrative',
          subcategory: 'pv_ouverture_plis',
          title: 'Procès-verbal d\'ouverture des plis',
          isRequired: true
        },
        {
          category: 'technical',
          subcategory: 'pv_evaluation_technique',
          title: 'PV d\'évaluation technique',
          isRequired: true
        }
      ]
    },
    {
      stage: 'assistance_sous_commission',
      documents: [
        {
          category: 'administrative',
          subcategory: 'pv_evaluation_attribution',
          title: 'Rapport d\'assistance de la sous-commission',
          isRequired: true
        }
      ]
    },
    {
      stage: 'evaluation_conformite',
      documents: [
        {
          category: 'administrative',
          subcategory: 'recu_depot_plis',
          title: 'Rapport d\'évaluation de conformité',
          isRequired: true
        }
      ]
    }
  ],
  attribution: [
    {
      stage: 'selection_prix',
      documents: [
        {
          category: 'financial',
          subcategory: 'devis_comparatifs',
          title: 'Analyse comparative des prix',
          isRequired: true
        }
      ]
    },
    {
      stage: 'choix_economique',
      documents: [
        {
          category: 'financial',
          subcategory: 'factures_commandes',
          title: 'Analyse de l\'offre économiquement la plus avantageuse',
          isRequired: true
        }
      ]
    },
    {
      stage: 'publication_attribution',
      documents: [
        {
          category: 'administrative',
          subcategory: 'lettre_notification',
          title: 'Avis d\'attribution provisoire',
          isRequired: true
        },
        {
          category: 'administrative',
          subcategory: 'publication_provisoire',
          title: 'Preuve de publication de l\'attribution',
          isRequired: true
        }
      ]
    },
    {
      stage: 'signature_marche',
      documents: [
        {
          category: 'administrative',
          subcategory: 'signature_contrat',
          title: 'Contrat signé',
          isRequired: true
        },
        {
          category: 'financial',
          subcategory: 'garantie_bancaire',
          title: 'Garantie bancaire',
          isRequired: true
        }
      ]
    }
  ],
  controle_regulation: [
    {
      stage: 'controle_cncmp',
      documents: [
        {
          category: 'administrative',
          subcategory: 'original_offres',
          title: 'Dossier complet de contrôle CNCMP',
          isRequired: true
        },
        {
          category: 'administrative',
          subcategory: 'pv_archivage',
          title: 'PV de contrôle',
          isRequired: true
        }
      ]
    },
    {
      stage: 'verification_regulier',
      documents: [
        {
          category: 'administrative',
          subcategory: 'chemises_archivage',
          title: 'Rapports de vérification régulière',
          isRequired: true
        }
      ]
    },
    {
      stage: 'regulation_armp',
      documents: [
        {
          category: 'administrative',
          subcategory: 'double_numerique',
          title: 'Documents de régulation ARMP',
          isRequired: true
        }
      ]
    },
    {
      stage: 'commission_disciplinaire',
      documents: [
        {
          category: 'administrative',
          subcategory: 'contrats_signes',
          title: 'Procès-verbaux de la commission disciplinaire',
          isRequired: true
        }
      ]
    }
  ]
};
// Helper function to get suggested documents for a phase and stage
export const getSuggestedDocuments = (phase: ProcurementPhase, stage: ProcurementStage) => {
  const phaseDocuments = SUGGESTED_DOCUMENTS[phase];
  const stageData = phaseDocuments.find(item => item.stage === stage);
  return stageData?.documents || [];
};

// Helper function to get all suggested documents for a phase
export const getSuggestedDocumentsForPhase = (phase: ProcurementPhase) => {
  return SUGGESTED_DOCUMENTS[phase].flatMap(item => item.documents);
};
export interface PublicProcurementWorkflowProps {
  selectedTender?: {
    id: string;
    title: string;
    description: string;
    status: string;
    project_id?: string;
  };
}

const PublicProcurementWorkflow: React.FC<PublicProcurementWorkflowProps> = ({ selectedTender }) => {
  
  const [, setSelectedWorkflowStep] = useState<{ phase: ProcurementPhase; stepTitle: string } | null>(null);

  function getPhaseDescription(phase: ProcurementPhase): string {
    const descriptions = {
      planification: "Élaboration du Plan Annuel d'Achats (PAA) et du Plan de Passation des Marchés (PPM)",
      publicite: "Publication des avis selon les procédures formalisées ou adaptées", 
      reception_analyse: "Analyse des offres par la Commission de Passation des Marchés Publics (CPMP)",
      attribution: "Attribution au soumissionnaire présentant l'offre économiquement la plus avantageuse",
      controle_regulation: "Contrôle par la CNCMP et régulation par l'ARMP"
    };
    return descriptions[phase];
  }

  const workflowSteps = Object.entries(PROCUREMENT_STAGES).map(([phase, stages], index) => ({
    id: index + 1,
    phase: phase as ProcurementPhase,
    title: PROCUREMENT_PHASE_LABELS[phase as ProcurementPhase],
    icon: [Calendar, Megaphone, FileText, Award, Shield][index],
    description: getPhaseDescription(phase as ProcurementPhase),
    details: stages.map(stage => stage.label),
    color: ["bg-blue-100 border-blue-300", "bg-green-100 border-green-300", "bg-yellow-100 border-yellow-300", "bg-purple-100 border-purple-300", "bg-red-100 border-red-300"][index],
    stages
  }));

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <CardTitle>
                Workflow des Marchés Publics en Mauritanie
                {selectedTender && (
                  <Badge variant="outline" className="ml-2">
                    {selectedTender.title}
                  </Badge>
                )}
              </CardTitle>
            </div>
    
          </div>
          <p className="text-sm text-gray-600">
            Étapes générales de la procédure des marchés publics utilisée par les entreprises publiques
            {selectedTender && (
              <span className="block mt-1 text-blue-600 font-medium">
                Appel d'offres sélectionné: {selectedTender.title}
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={step.id} className="relative">
                  <div className={`border-2 rounded-lg p-4 ${step.color}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <IconComponent className="h-5 w-5 text-gray-700" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Étape {step.id}
                            </Badge>
                            <h3 className="font-semibold text-lg">{step.title}</h3>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{step.description}</p>
                        
                        {/* Phase stages */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-800">Étapes détaillées:</h4>
                          <ul className="space-y-1">
                            {step.details.map((detail, detailIndex) => (
                              <li key={detailIndex} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                                <div className="flex items-center justify-between w-full">
                                  <span>{detail}</span>
                                  
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < workflowSteps.length - 1 && (
                    <div className="flex justify-center my-2">
                      <ChevronRight className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

    

  
    </>
  );
};


export default PublicProcurementWorkflow;
