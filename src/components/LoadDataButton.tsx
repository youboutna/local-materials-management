
import { useState } from 'react';
import { Button } from './ui/button';
import { loadProjectsToSupabase } from '@/scripts/loadDataToSupabase';
import { DatabaseIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const handleLoadData = async () => {
    setLoading(true);
    try {
      const result = await loadProjectsToSupabase();
      if (result > 0) {
        toast({
          title: "Données chargées",
          description: `${result} projets ont été ajoutés avec succès.`,
          className: "bg-adrar-100 border-adrar-300 text-adrar-800",
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du chargement des données.",
        variant: "destructive",
      });
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
