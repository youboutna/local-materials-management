/**
 * ExpiryCountdown
 * Cellule de tableau additionnelle « Jours restants / Retard ».
 * Purement dérivée de la date d'expiration existante (aucune donnée nouvelle).
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getExpiryInfo } from '@/lib/expiryUx';
import { cn } from '@/lib/utils';

interface ExpiryCountdownProps {
  expiryDate?: string | null;
  className?: string;
}

export function ExpiryCountdown({ expiryDate, className }: ExpiryCountdownProps) {
  const info = getExpiryInfo(expiryDate);

  return (
    <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('min-w-[7.5rem] space-y-1', className)}>
          <Badge variant="outline" className={cn('border-transparent font-medium', info.badgeClass)}>
            {info.label}
          </Badge>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full transition-all', info.barClass)} style={{ width: `${info.progress}%` }} />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {expiryDate
          ? `Échéance : ${new Date(expiryDate).toLocaleDateString('fr-FR')} — vert > 30 j, orange < 30 j, rouge < 7 j ou dépassé`
          : "Aucune date d'expiration renseignée"}
      </TooltipContent>
    </Tooltip>
    </TooltipProvider>
  );
}

export default ExpiryCountdown;
