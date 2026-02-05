import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  Users, 
  BarChart3, 
  Navigation
} from 'lucide-react';
import { ProjectData } from '@/dtos/entities/ProjectDTO';
import { usePagination } from '@/hooks/usePagination';

interface InteractiveProjectsListProps {
  projects: ProjectData[];
  onProjectSelect?: (project: ProjectData) => void;
}

const InteractiveProjectsList: React.FC<InteractiveProjectsListProps> = ({
  projects,
  onProjectSelect
}) => {
  const {
    currentData: paginatedProjects,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    goToPage
  } = usePagination({
    data: projects,
    itemsPerPage: 10 // Show pagination only if more than 10 items
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'en cours':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'terminé':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspendu':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatBudget = (budget: number) => {
    if (budget >= 1000000) {
      return `${(budget / 1000000).toFixed(1)}M MRU`;
    } else if (budget >= 1000) {
      return `${(budget / 1000).toFixed(0)}K MRU`;
    }
    return `${budget.toLocaleString()} MRU`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className="bg-gradient-to-br from-card via-card/90 to-muted/20 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Projets avec Coordonnées GPS
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {totalItems} projet{totalItems > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {paginatedProjects.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">Aucun projet trouvé</h3>
            <p className="text-muted-foreground">
              Aucun projet ne correspond aux critères de filtrage sélectionnés.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedProjects.map((project) => (
                <div
                  key={project.id}
                  className="group p-4 border border-border/50 rounded-lg hover:shadow-md hover:border-primary/30 transition-all duration-200 bg-background/50 backdrop-blur-sm cursor-pointer"
                  onClick={() => onProjectSelect?.(project)}
                >
                  <div className="space-y-3">
                    {/* Project Title and Status */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {project.title}
                      </h4>
                      <Badge className={`text-xs ${getStatusColor(project.status)} shrink-0`}>
                        {project.status}
                      </Badge>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{project.location}</span>
                    </div>

                    {/* GPS Coordinates */}
                    {project.coordinates && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                        <Navigation className="h-3 w-3 text-primary" />
                        <span className="font-mono">
                          {project.coordinates.latitude.toFixed(4)}, {project.coordinates.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}

                    {/* Project Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-foreground font-medium">
                          {formatBudget(project.budget)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-muted-foreground">
                          {project.teamSize} membres
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-orange-600" />
                        <span className="text-muted-foreground">
                          {project.progress}% complété
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span className="text-muted-foreground text-xs">
                          {formatDate(project.startDate)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progrès</span>
                        <span className="text-primary font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {projects.length > 10 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={goToPage}
                showItemsPerPage={false}
                className="border-t border-border/50 pt-4"
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveProjectsList;