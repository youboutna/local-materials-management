
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

const ProgressIndicator = ({
  progress,
  size = 'md',
  showPercentage = true,
  className,
}: ProgressIndicatorProps) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  // Determine color based on progress
  const getColor = () => {
    if (normalizedProgress < 25) return 'from-red-500 to-red-400';
    if (normalizedProgress < 50) return 'from-amber-500 to-amber-400';
    if (normalizedProgress < 75) return 'from-blue-500 to-blue-400';
    return 'from-green-500 to-green-400';
  };
  
  // Determine size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-1.5';
      case 'lg': return 'h-3';
      default: return 'h-2';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-adrar-600">Progression</span>
        {showPercentage && (
          <span className="text-xs font-medium text-adrar-600">{normalizedProgress}%</span>
        )}
      </div>
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', getSizeClasses())}>
        <div
          className={cn(
            'rounded-full bg-gradient-to-r transition-all duration-500 ease-out',
            getColor()
          )}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressIndicator;
