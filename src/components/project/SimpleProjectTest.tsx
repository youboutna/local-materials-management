import { ProjectService, getProjectService} from '@/application/services/ProjectService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

const SimpleProjectTest = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['simple-project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('No project ID');
      const service = getProjectService();
      return await service.getProjectById(projectId);
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Test de chargement simple...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">Erreur: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Aucun projet trouvé</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Simple - Projet chargé avec succès!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>ID:</strong> {project.id}</p>
            <p><strong>Titre:</strong> {project.title}</p>
            <p><strong>Description:</strong> {project.description}</p>
            <p><strong>Progression:</strong> {project.progress}%</p>
            <p><strong>Budget:</strong> {project.budget?.toLocaleString()} MRU</p>
            <p><strong>Localisation:</strong> {project.location}</p>
            <p><strong>Équipe:</strong> {project.teamSize} membres</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleProjectTest;
