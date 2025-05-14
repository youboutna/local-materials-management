
import { cn } from '@/lib/utils';

type StatusType = 'en cours' | 'terminé' | 'en attente' | 'payé' | 'en inspection' | 'suspendu' | 'annulé';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const getStatusConfig = (status: StatusType) => {
  switch (status) {
    case 'en cours':
      return {
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        dotColor: 'bg-blue-500',
      };
    case 'terminé':
      return {
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        dotColor: 'bg-green-500',
      };
    case 'en attente':
      return {
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        dotColor: 'bg-amber-500',
      };
    case 'payé':
      return {
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        dotColor: 'bg-purple-500',
      };
    case 'en inspection':
      return {
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
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
      return {
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        dotColor: 'bg-red-500',
      };
    default:
      return {
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
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
