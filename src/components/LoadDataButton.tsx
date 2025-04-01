
import { useState } from 'react';
import { Button } from './ui/button';
import { loadProjectsToSupabase } from '@/scripts/loadDataToSupabase';
import { DatabaseIcon, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { USE_TYPEORM } from '@/hooks/projects/constants';

interface LoadDataButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onDataLoaded?: () => void;
}

const LoadDataButton = ({
  variant = 'default',
  size = 'default',
  className = '',
  onDataLoaded
}: LoadDataButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLoadData = async () => {
    setLoading(true);
    try {
      // This loads data to Supabase (regardless of USE_TYPEORM setting)
      const result = await loadProjectsToSupabase();
      
      if (result > 0) {
        toast({
          title: "Données chargées",
          description: `${result} projets ont été ajoutés avec succès.`,
          className: "bg-adrar-100 border-adrar-300 text-adrar-800",
        });
      } else {
        toast({
          title: "Information",
          description: "Aucun nouveau projet n'a été ajouté à la base de données.",
          variant: "default",
        });
      }
      
      // If there's a callback, call it so the parent component can refresh data
      if (onDataLoaded) {
        onDataLoaded();
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
      {loading ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Chargement...
        </>
      ) : (
        <>
          <DatabaseIcon className="mr-2 h-4 w-4" />
          Charger les données
        </>
      )}
    </Button>
  );
};

export default LoadDataButton;
