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
import { getProjectCoordinates } from '@/utils/projectLocationBuckets';

import { TranslatedStatus } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
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
        return 'bg-primary/10 text-primary border-primary/30';
      case 'terminé':
        return 'bg-success-soft text-success border-success/30';
      case 'en attente':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'suspendu':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-foreground border-border';
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
            <T k="auto.interactiveprojectslist.projets_avec_coordonnees_gps" fallback="Projets avec Coordonnées GPS" />
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
            <h3 className="text-lg font-medium text-foreground mb-2"><T k="auto.interactiveprojectslist.aucun_projet_trouve" fallback="Aucun projet trouvé" /></h3>
            <p className="text-muted-foreground">
              <T k="auto.interactiveprojectslist.aucun_projet_ne_correspond_aux_criteres_de_filtr" fallback="Aucun projet ne correspond aux critères de filtrage sélectionnés." />
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
                        <TranslatedStatus code={project.status} />
                      </Badge>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{project.location}</span>
                    </div>

                    {/* GPS Coordinates */}
                    {getProjectCoordinates(project) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                        <Navigation className="h-3 w-3 text-primary" />
                        <span className="font-mono">
                          {getProjectCoordinates(project)!.latitude.toFixed(4)}, {getProjectCoordinates(project)!.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}

                    {/* Project Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="text-foreground font-medium">
                          {formatBudget(project.budget)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">
                          {project.teamSize} membres
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-warning" />
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
                        <span className="text-muted-foreground"><T k="auto.interactiveprojectslist.progres" fallback="Progrès" /></span>
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