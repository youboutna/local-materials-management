import { useState } from 'react';
import { Button } from './ui/button';
import { loadProjectsToSupabase } from '@/scripts/loadDataToSupabase';
import { DatabaseIcon, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();

  const handleLoadData = async () => {
    setLoading(true);
    try {
      if (USE_TYPEORM) {
        toast({
          title: t('common.info'),
          description: "TypeORM n'est pas compatible avec l'environnement du navigateur. Utilisation de Supabase à la place.",
          variant: "default",
        });
      }
      
      // This loads data to Supabase
      const result = await loadProjectsToSupabase();
      
      if (result > 0) {
        toast({
          title: t('common.success'),
          description: `${result} projets ont été ajoutés avec succès à Supabase.`,
          className: "bg-adrar-100 border-adrar-300 text-adrar-800",
        });
      } else {
        toast({
          title: t('common.info'),
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
        title: t('common.error'),
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
      className={className}
      onClick={handleLoadData}
      disabled={loading}
    >
      {loading ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          {t('common.loading')}
        </>
      ) : (
        <>
          <DatabaseIcon className="mr-2 h-4 w-4" />
          {t('common.load_data')}
        </>
      )}
    </Button>
  );
};

export default LoadDataButton;
