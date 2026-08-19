
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, FileCheck, Building, AlertCircle } from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ContractStatusDisplayProps {
  project: {
    launchDate?: string;
    attributionDate?: string;
    startDate: string;
    endDate?: string;
    status: string;
    marketType?: string;
    selectionMode?: string;
    financingSource?: string;
    projectReference?: string;
  };
}

const ContractStatusDisplay: React.FC<ContractStatusDisplayProps> = ({ project }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non définie';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const getContractPhase = () => {
    const now = new Date();
    const launchDate = project.launchDate ? new Date(project.launchDate) : null;
    const attributionDate = project.attributionDate ? new Date(project.attributionDate) : null;
    const startDate = new Date(project.startDate);
    const endDate = project.endDate ? new Date(project.endDate) : null;

    if (launchDate && isBefore(now, launchDate)) {
      return { phase: 'pre_tender', label: 'Pré-appel d\'offres', color: 'bg-gray-500' };
    }
    
    if (launchDate && attributionDate && isAfter(now, launchDate) && isBefore(now, attributionDate)) {
      return { phase: 'tender_active', label: 'Appel d\'offres en cours', color: 'bg-orange-500' };
    }
    
    if (attributionDate && startDate && isAfter(now, attributionDate) && isBefore(now, startDate)) {
      return { phase: 'contract_preparation', label: 'Préparation du contrat', color: 'bg-blue-500' };
    }
    
    if (isAfter(now, startDate) && (!endDate || isBefore(now, endDate))) {
      return { phase: 'contract_execution', label: 'Exécution du contrat', color: 'bg-success' };
    }
    
    if (endDate && isAfter(now, endDate)) {
      return { phase: 'contract_completed', label: 'Contrat terminé', color: 'bg-gray-600' };
    }
    
    return { phase: 'unknown', label: 'Phase indéterminée', color: 'bg-gray-400' };
  };

  const contractPhase = getContractPhase();
  
  const getTenderDuration = () => {
    if (!project.launchDate || !project.attributionDate) return null;
    try {
      return differenceInDays(new Date(project.attributionDate), new Date(project.launchDate));
    } catch {
      return null;
    }
  };

  const tenderDuration = getTenderDuration();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Statut du contrat
          </span>
          <Badge className={`${contractPhase.color} text-white`}>
            {contractPhase.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contract Timeline */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Chronologie contractuelle
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Lancement appel d'offres</span>
                <span className="text-sm">{formatDate(project.launchDate)}</span>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Attribution du marché</span>
                <span className="text-sm">{formatDate(project.attributionDate)}</span>
                {tenderDuration && (
                  <span className="text-xs text-muted-foreground">
                    ({tenderDuration} jours après le lancement)
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Début des travaux</span>
                <span className="text-sm">{formatDate(project.startDate)}</span>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Fin prévue</span>
                <span className="text-sm">{formatDate(project.endDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Details */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Building className="h-4 w-4" />
            Détails contractuels
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Type de marché</span>
                <span className="text-sm">{project.marketType || 'Non spécifié'}</span>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Mode de sélection</span>
                <span className="text-sm">{project.selectionMode || 'Non spécifié'}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Source de financement</span>
                <span className="text-sm">{project.financingSource || 'Non spécifiée'}</span>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Référence</span>
                <span className="text-sm font-mono">{project.projectReference || 'Non attribuée'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts and Warnings */}
        {contractPhase.phase === 'tender_active' && (
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">Appel d'offres en cours</p>
              <p className="text-xs text-warning">
                La procédure d'appel d'offres est actuellement active. L'attribution est prévue le {formatDate(project.attributionDate)}.
              </p>
            </div>
          </div>
        )}

        {contractPhase.phase === 'contract_preparation' && (
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary">Préparation du contrat</p>
              <p className="text-xs text-primary">
                Le marché a été attribué. Le contrat est en cours de préparation avant le début des travaux.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractStatusDisplay;
