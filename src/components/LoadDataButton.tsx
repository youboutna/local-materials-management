import { useState } from 'react';
import { Button } from './ui/button';
import { DatabaseIcon, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { USE_TYPEORM } from '@/hooks/projects/constants';
import { useProjectsHex } from '@/hooks/hexagonal';
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';

// Sample data for import - externalisé pour maintenance
const SAMPLE_PROJECTS = [
  {
    title: "Construction Centre Communautaire Adrar",
    description: "Centre communautaire moderne avec installations sportives et culturelles",
    location: "Adrar, Mauritanie",
    estimated_budget: 250000000,
    start_date: "2024-01-15",
    end_date: "2025-12-31"
  },
  {
    title: "Réhabilitation Route Nationale N1",
    description: "Modernisation et réhabilitation de 150km de route",
    location: "Adrar -atar , Mauritanie",
    estimated_budget: 450000000,
    start_date: "2024-03-01",
    end_date: "2026-08-31"
  }
] as const;

interface LoadDataButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onDataLoaded?: () => void;
}

const LoadDataButton: React.FC<LoadDataButtonProps> = ({
  variant = "default",
  size = "default",
  className = '',
  onDataLoaded
}: LoadDataButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { createProject, isCreating } = useProjectsHex();

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
      
      // Use hexagonal hook instead of direct service calls (Rule #1 compliance)
      let importedCount = 0;
      
      for (const projectData of SAMPLE_PROJECTS) {
        try {
          await createProject({
             title: projectData.title,
             description: projectData.description,
             location: projectData.location,
             budget: projectData.estimated_budget,
             startDate: projectData.start_date,
             endDate: projectData.end_date,
             status: ProjectStatus.EN_COURS
           });
          importedCount++;
        } catch (error) {
          console.warn(`Failed to import project: ${projectData.title}`, error);
        }
      }
      
      if (importedCount > 0) {
        toast({
          title: t('common.success'),
          description: `${importedCount} projets ont été ajoutés avec succès.`,
          className: "bg-adrar-100 border-adrar-300 text-adrar-800",
        });
      } else {
        toast({
          title: t('common.info'),
          description: "Aucun nouveau projet n'a été ajouté (ils existent peut-être déjà).",
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
