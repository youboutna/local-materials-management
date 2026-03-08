import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Megaphone, 
  FileText, 
  Award, 
  Shield,
  ChevronRight,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { standardWorkflow, WorkflowPhase, WorkflowStage } from '@/types/workflow';
import { getWorkflowService, WorkflowService, PhaseProgress } from '@/application/services/WorkflowService';

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
// Define types first
export type TenderDocumentCategory = 'administrative' | 'technical' | 'financial';
export type TenderDocumentSubcategory = 
  | 'lettre_soumission' | 'pouvoir_signature' | 'acte_groupement'
  | 'attestation_impot' | 'attestation_cnss' | 'attestation_non_faillite'
  | 'pv_ouverture_plis' | 'pv_evaluation_technique' | 'pv_evaluation_attribution'
  | 'recu_depot_plis' | 'registre_reception_plis' | 'lettre_invitation'
  | 'publication_armp' | 'demande_initiation' | 'preuves_publication'
  | 'lettre_notification' | 'publication_provisoire' | 'signature_contrat'
  | 'original_offres' | 'pv_archivage' | 'chemises_archivage'
  | 'double_numerique' | 'contrats_signes' | 'plan_annuel_achats'
  | 'modele_paa' | 'procedure_proposee' | 'montant_alloue'
  | 'devis_comparatifs' | 'factures_commandes' | 'garantie_bancaire';

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
    current_phase?: string;
    current_stage?: string;
  };
  onShareWithSuppliers?: (phase: WorkflowPhase, stage: WorkflowStage) => void;
}

const PublicProcurementWorkflow: React.FC<PublicProcurementWorkflowProps> = ({ selectedTender, onShareWithSuppliers }) => {
  const [phaseProgress, setPhaseProgress] = useState<PhaseProgress[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedTender?.id) {
      loadWorkflowProgress();
    }
  }, [selectedTender?.id]);

  const workflowSvc = getWorkflowService();

  const loadWorkflowProgress = async () => {
    if (!selectedTender?.id) return;
    
    setLoading(true);
    try {
      const progress = await workflowSvc.calculateEntityProgress(selectedTender.id, 'tender');
      setPhaseProgress(progress);
    } catch (error) {
      console.error('Error loading workflow progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageClick = async (phase: WorkflowPhase, stage: WorkflowStage) => {
    if (!selectedTender?.id) return;
    
    try {
      // Toggle stage status
      const currentProgress = phaseProgress.find(p => p.phase_code === phase.code);
      const stageProgress = currentProgress?.stages.find(s => s.stage_code === stage.code);
      
      let newStatus: 'pending' | 'in_progress' | 'completed' = 'in_progress';
      if (stageProgress?.status === 'pending') {
        newStatus = 'in_progress';
      } else if (stageProgress?.status === 'in_progress') {
        newStatus = 'completed';
      } else {
        newStatus = 'pending';
      }

      await WorkflowService.updateStageStatus(
        selectedTender.id,
        'tender',
        phase.code,
        stage.code,
        newStatus
      );

      // Reload progress
      await loadWorkflowProgress();
    } catch (error) {
      console.error('Error updating stage status:', error);
    }
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle2;
      case 'in_progress':
        return Clock;
      default:
        return AlertCircle;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-400 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">Chargement du workflow...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <CardTitle>
              Workflow Standard Mauritanien
              {selectedTender && (
                <Badge variant="outline" className="ml-2">
                  {selectedTender.title}
                </Badge>
              )}
            </CardTitle>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Workflow standardisé pour les projets de travaux publics en Mauritanie
          {selectedTender && (
            <span className="block mt-1 text-primary font-medium">
              Projet sélectionné: {selectedTender.title}
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {standardWorkflow.map((phase, phaseIndex) => {
            const phaseIcon = [Calendar, Megaphone, FileText, Award, Shield][phaseIndex] || FileText;
            const IconComponent = phaseIcon;
            const currentPhaseProgress = phaseProgress.find(p => p.phase_code === phase.code);
            
            return (
              <div key={phase.id} className="relative">
                <div className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{phase.label}</h3>
                        {currentPhaseProgress && (
                          <Badge variant="secondary">
                            {currentPhaseProgress.progress_percentage}% complété
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {phase.stages.map((stage, stageIndex) => {
                          const stageProgress = currentPhaseProgress?.stages.find(s => s.stage_code === stage.code);
                          const StageIcon = getStageIcon(stageProgress?.status || 'pending');
                          
                          return (
                            <div key={stage.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStageColor(stageProgress?.status || 'pending')}`}>
                                  <StageIcon className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{stage.label}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {stage.tasks.length} tâches • 
                                    {stageProgress ? ` ${stageProgress.completed_tasks}/${stageProgress.total_tasks} terminées` : ' Non démarré'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStageClick(phase, stage)}
                                  className="h-8"
                                >
                                  {stageProgress?.status === 'completed' ? 'Réouvrir' : 
                                   stageProgress?.status === 'in_progress' ? 'Terminer' : 'Démarrer'}
                                </Button>
                                
                                {onShareWithSuppliers && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onShareWithSuppliers(phase, stage)}
                                    className="h-8"
                                  >
                                    <Share2 className="h-3 w-3 mr-1" />
                                    Partager
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {phaseIndex < standardWorkflow.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};


export default PublicProcurementWorkflow;
