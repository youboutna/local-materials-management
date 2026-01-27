/**
 * InspectionTypeStep - Étape de sélection du type d'inspection
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardCheck, 
  Shield, 
  TrendingUp, 
  FileCheck, 
  Package, 
  Building2, 
  Trophy 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InspectionType {
  code: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'routine' | 'technical' | 'final';
  estimatedDuration: number;
  requiresEngineerApproval?: boolean;
}

const INSPECTION_TYPES: InspectionType[] = [
  {
    code: 'progress',
    label: 'Avancement des Travaux',
    description: 'Contrôle périodique de l\'avancement et qualité des travaux',
    icon: <TrendingUp className="h-5 w-5" />,
    category: 'routine',
    estimatedDuration: 2,
  },
  {
    code: 'quality',
    label: 'Contrôle Qualité',
    description: 'Vérification de la qualité des matériaux et de l\'exécution',
    icon: <ClipboardCheck className="h-5 w-5" />,
    category: 'technical',
    estimatedDuration: 3,
    requiresEngineerApproval: true,
  },
  {
    code: 'safety',
    label: 'Sécurité',
    description: 'Contrôle des mesures de sécurité sur le chantier',
    icon: <Shield className="h-5 w-5" />,
    category: 'routine',
    estimatedDuration: 2,
  },
  {
    code: 'compliance',
    label: 'Conformité Réglementaire',
    description: 'Vérification de la conformité aux normes et réglementations',
    icon: <FileCheck className="h-5 w-5" />,
    category: 'technical',
    estimatedDuration: 4,
    requiresEngineerApproval: true,
  },
  {
    code: 'materials',
    label: 'Contrôle Matériaux',
    description: 'Inspection des matériaux livrés et stockés',
    icon: <Package className="h-5 w-5" />,
    category: 'technical',
    estimatedDuration: 2,
  },
  {
    code: 'structural',
    label: 'Contrôle Structurel',
    description: 'Vérification des éléments structurels et fondations',
    icon: <Building2 className="h-5 w-5" />,
    category: 'technical',
    estimatedDuration: 4,
    requiresEngineerApproval: true,
  },
  {
    code: 'final',
    label: 'Réception Définitive',
    description: 'Inspection finale avant réception des travaux',
    icon: <Trophy className="h-5 w-5" />,
    category: 'final',
    estimatedDuration: 6,
    requiresEngineerApproval: true,
  },
];

interface InspectionTypeStepProps {
  mode: 'request' | 'schedule';
  selectedType?: string;
  onSelect: (type: string) => void;
  allowedTypes?: string[];
}

const InspectionTypeStep: React.FC<InspectionTypeStepProps> = ({
  mode,
  selectedType,
  onSelect,
  allowedTypes,
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'routine': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'technical': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'final': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'routine': return 'Routine';
      case 'technical': return 'Technique';
      case 'final': return 'Finale';
      default: return category;
    }
  };

  const filteredTypes = allowedTypes 
    ? INSPECTION_TYPES.filter(t => allowedTypes.includes(t.code))
    : INSPECTION_TYPES;

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">
          {mode === 'request' ? 'Quel type d\'inspection souhaitez-vous demander ?' : 'Sélectionnez le type d\'inspection à programmer'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Le type détermine les documents requis et le workflow de validation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTypes.map((type) => (
          <Card
            key={type.code}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selectedType === type.code
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => onSelect(type.code)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  selectedType === type.code ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{type.label}</h4>
                    <Badge variant="outline" className={cn('text-xs', getCategoryColor(type.category))}>
                      {getCategoryLabel(type.category)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {type.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>~{type.estimatedDuration}h</span>
                    {type.requiresEngineerApproval && (
                      <Badge variant="secondary" className="text-xs">
                        Validation Ing. Conseil
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InspectionTypeStep;
