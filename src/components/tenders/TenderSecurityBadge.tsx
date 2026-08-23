import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TenderSecurityBadgeProps {
  level: 'public' | 'restricted' | 'confidential' | 'secret';
  className?: string;
}

export const TenderSecurityBadge: React.FC<TenderSecurityBadgeProps> = ({ level, className }) => {
  const { t } = useLanguage();
  const configs = {
    public: {
      icon: Eye,
      label: t('auto.tendersecuritybadge.public'),
      variant: 'outline' as const,
      description: t('auto.tendersecuritybadge.accessible_a_tous_les_fournisseurs_qualifies')
    },
    restricted: {
      icon: Lock,
      label: t('auto.tendersecuritybadge.restreint'),
      variant: 'secondary' as const,
      description: t('auto.tendersecuritybadge.acces_controle_avec_code_de_partage')
    },
    confidential: {
      icon: Shield,
      label: t('auto.tendersecuritybadge.confidentiel'),
      variant: 'default' as const,
      description: t('auto.tendersecuritybadge.partage_securise_uniquement')
    },
    secret: {
      icon: AlertTriangle,
      label: t('auto.tendersecuritybadge.secret'),
      variant: 'destructive' as const,
      description: t('auto.tendersecuritybadge.niveau_de_securite_maximum')
    }
  };

  const config = configs[level];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className={`gap-1 ${className}`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
