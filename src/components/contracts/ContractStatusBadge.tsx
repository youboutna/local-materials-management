/**
 * ContractStatusBadge — rendu unique du statut contractuel (référentiel ContractService).
 */
import { Badge } from '@/components/ui/badge';
import { CONTRACT_STATUS_LABELS } from '@/application/services/ContractService';

const VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  signed: 'default',
  active: 'default',
  suspended: 'secondary',
  closed: 'secondary',
  cancelled: 'destructive',
};

export function ContractStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANTS[status] ?? 'outline'}>
      {CONTRACT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
