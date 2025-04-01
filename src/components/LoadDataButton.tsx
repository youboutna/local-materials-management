
import { useState } from 'react';
import { Button } from './ui/button';
import { loadProjectsToSupabase } from '@/scripts/loadDataToSupabase';
import { DatabaseIcon } from 'lucide-react';

interface LoadDataButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const LoadDataButton = ({
  variant = 'default',
  size = 'default',
  className = ''
}: LoadDataButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleLoadData = async () => {
    setLoading(true);
    try {
      await loadProjectsToSupabase();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} bg-adrar-600 hover:bg-adrar-700 text-ivory-100`}
      onClick={handleLoadData}
      disabled={loading}
    >
      <DatabaseIcon className="mr-2 h-4 w-4" />
      {loading ? 'Chargement...' : 'Charger les données'}
    </Button>
  );
};

export default LoadDataButton;
