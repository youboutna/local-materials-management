
import { cn } from '@/lib/utils';
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';

export type StatusType = ProjectStatus | 'approuvée' | 'rejetée' | 'modifications requises';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const getStatusConfig = (status: StatusType) => {
   const statusValue = status?.toLowerCase() || '';
   
   switch (statusValue) {
     case 'en cours':
     case 'encours':
       return {
         bgColor: 'bg-primary/10',
         textColor: 'text-primary',
         borderColor: 'border-primary/30',
         dotColor: 'bg-blue-500',
       };
     case 'terminé':
     case 'termine':
       return {
         bgColor: 'bg-success-soft',
         textColor: 'text-success',
         borderColor: 'border-success/30',
         dotColor: 'bg-success',
       };
     case 'en attente':
     case 'en_attente':
       return {
         bgColor: 'bg-warning/10',
         textColor: 'text-warning',
         borderColor: 'border-warning/30',
         dotColor: 'bg-amber-500',
       };
     case 'en inspection':
     case 'en_inspection':
       return {
         bgColor: 'bg-warning/10',
         textColor: 'text-warning',
         borderColor: 'border-warning/30',
         dotColor: 'bg-yellow-500',
       };
     case 'suspendu':
       return {
         bgColor: 'bg-purple-50',
         textColor: 'text-purple-700',
         borderColor: 'border-purple-200',
         dotColor: 'bg-purple-500',
       };
     case 'annulé':
     case 'annule':
       return {
         bgColor: 'bg-destructive/10',
         textColor: 'text-destructive',
         borderColor: 'border-destructive/30',
         dotColor: 'bg-red-500',
       };
    // Inspection statuses
    case 'approuvée':
      return {
        bgColor: 'bg-success-soft',
        textColor: 'text-success',
        borderColor: 'border-success/30',
        dotColor: 'bg-success',
      };
    case 'rejetée':
      return {
        bgColor: 'bg-destructive/10',
        textColor: 'text-destructive',
        borderColor: 'border-destructive/30',
        dotColor: 'bg-red-500',
      };
    case 'modifications requises':
      return {
        bgColor: 'bg-warning/10',
        textColor: 'text-warning',
        borderColor: 'border-warning/30',
        dotColor: 'bg-amber-500',
      };
    default:
      return {
        bgColor: 'bg-muted',
        textColor: 'text-foreground',
        borderColor: 'border-border',
        dotColor: 'bg-gray-500',
      };
  }
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const { bgColor, textColor, borderColor, dotColor } = getStatusConfig(status);

  return (
    <div
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all',
        bgColor,
        textColor,
        borderColor,
        'border',
        className
      )}
    >
      <span className={cn('w-2 h-2 rounded-full mr-1.5', dotColor)} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
};

export default StatusBadge;
