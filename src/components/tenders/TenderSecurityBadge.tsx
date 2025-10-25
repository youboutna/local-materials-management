import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TenderSecurityBadgeProps {
  level: 'public' | 'restricted' | 'confidential' | 'secret';
  className?: string;
}

export const TenderSecurityBadge: React.FC<TenderSecurityBadgeProps> = ({ level, className }) => {
  const configs = {
    public: {
      icon: Eye,
      label: 'Public',
      variant: 'outline' as const,
      description: 'Accessible à tous les fournisseurs qualifiés'
    },
    restricted: {
      icon: Lock,
      label: 'Restreint',
      variant: 'secondary' as const,
      description: 'Accès contrôlé avec code de partage'
    },
    confidential: {
      icon: Shield,
      label: 'Confidentiel',
      variant: 'default' as const,
      description: 'Partage sécurisé uniquement'
    },
    secret: {
      icon: AlertTriangle,
      label: 'Secret',
      variant: 'destructive' as const,
      description: 'Niveau de sécurité maximum'
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
