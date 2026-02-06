import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Search, Calendar, FileText, Loader2, MapPin, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { useProjectsSelector, useProjectTenders } from '@/hooks/hexagonal'
import { cn } from '@/lib/utils';

// Local type for project options from selector
interface ProjectOption {
  id: string;
  title: string;
  status?: string;
  progress?: number;
  budget?: number;
  location?: string;
}

interface EnhancedProjectSelectorProps {
  value?: string;
  onChange: (projectId: string | undefined, project?: any) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  secureMode?: boolean;
  showTenderReference?: boolean;
  onTenderReferenceChange?: (reference: string) => void;
  tenderReference?: string;
  className?: string;
  error?: string;
  helpText?: string;
  showProjectDetails?: boolean;
}

const EnhancedProjectSelector: React.FC<EnhancedProjectSelectorProps> = ({
  value,
  onChange,
  placeholder = "SÃ©lectionner un projet",
  label = "Projet",
  required = false,
  disabled = false,
  secureMode = false,
  showTenderReference = false,
  onTenderReferenceChange,
  tenderReference = '',
  className,
  error,
  helpText,
  showProjectDetails = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: projects = [], isLoading, error: projectsError } = useProjectsSelector({
    searchTerm: debouncedSearchTerm,
    secureMode
  });

  const { data: tenders = [], isLoading: tendersLoading } = useProjectTenders(
    showTenderReference && value ? value : undefined
  );

  const selectedProject = useMemo(() => 
    projects?.find(p => p.id === value), 
    [projects, value]
  );

  // RÃ©initialiser la recherche quand le select est fermÃ©
  useEffect(() => {
    if (!isOpen && searchTerm) {
      setSearchTerm('');
    }
  }, [isOpen, searchTerm]);

  const getStatusConfig = (status: string | null | undefined) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'terminÃ©':
        return { color: 'bg-green-100 text-green-800 border-green-200', label: 'TerminÃ©' };
      case 'inprogress':
      case 'en cours':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'En cours' };
      case 'planning':
      case 'planification':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Planification' };
      case 'onhold':
      case 'en attente':
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'En attente' };
      case 'cancelled':
      case 'annulÃ©':
        return { color: 'bg-red-100 text-red-800 border-red-200', label: 'AnnulÃ©' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status || 'Non spÃ©cifiÃ©' };
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Non spÃ©cifiÃ©';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'Non spÃ©cifiÃ©';
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: 'MRU',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleClear = () => {
    onChange(undefined, undefined);
    onTenderReferenceChange?.('');
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 px-2 text-xs"
            >
              Effacer
            </Button>
          )}
        </div>

        {/* Champ de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre, rÃ©fÃ©rence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={disabled}
          />
        </div>

        {/* Messages d'erreur/loading */}
        {projectsError && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
            Erreur lors du chargement des projets
          </div>
        )}

        {/* SÃ©lecteur de projet */}
        <Select
          value={value || ''}
          onValueChange={(projectId) => {
            const project = projects?.find(p => p.id === projectId);
            onChange(projectId || undefined, project);
          }}
          disabled={disabled || isLoading}
          onOpenChange={setIsOpen}
        >
          <SelectTrigger className={cn(
            "w-full",
            error && "border-red-500 focus:ring-red-500"
          )}>
            <SelectValue placeholder={placeholder}>
              {selectedProject && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{selectedProject.title}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Chargement...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Aucun projet trouvÃ©
              </div>
            ) : (
              projects.map((project) => {
                const statusConfig = getStatusConfig(project.status);
                return (
                  <SelectItem key={project.id} value={project.id} className="py-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{project.title}</div>
                        {project.project_reference && (
                          <div className="text-xs text-muted-foreground truncate">
                            RÃ©f: {project.project_reference}
                          </div>
                        )}
                        {!secureMode && (
                          <div className="flex items-center gap-2 mt-1">
                            {project.status && (
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", statusConfig.color)}
                              >
                                {statusConfig.label}
                              </Badge>
                            )}
                            {project.budget && (
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(project.budget)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {helpText && !error && (
          <p className="text-sm text-muted-foreground">{helpText}</p>
        )}

        {/* DÃ©tails du projet sÃ©lectionnÃ© */}
        {showProjectDetails && selectedProject && (
          <div className="p-3 bg-muted/50 rounded-lg border space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-sm">Projet sÃ©lectionnÃ©</h4>
                <p className="font-semibold">{selectedProject.title}</p>
              </div>
              {!secureMode && selectedProject.status && (
                <Badge variant="outline" className={getStatusConfig(selectedProject.status).color}>
                  {getStatusConfig(selectedProject.status).label}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {selectedProject.project_reference && (
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">RÃ©fÃ©rence:</span>
                  <span className="font-medium">{selectedProject.project_reference}</span>
                </div>
              )}

              {!secureMode && selectedProject.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Localisation:</span>
                  <span className="font-medium">{selectedProject.location}</span>
                </div>
              )}

              {!secureMode && (selectedProject.start_date || selectedProject.end_date) && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">PÃ©riode:</span>
                  <span className="font-medium">
                    {formatDate(selectedProject.start_date)} - {formatDate(selectedProject.end_date)}
                  </span>
                </div>
              )}

              {!secureMode && selectedProject.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">{formatCurrency(selectedProject.budget)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section rÃ©fÃ©rence d'appel d'offres */}
      {showTenderReference && (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-sm font-medium">
            RÃ©fÃ©rence d'appel d'offres
            <span className="text-muted-foreground font-normal ml-1">(optionnel)</span>
          </Label>
          
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Saisir la rÃ©fÃ©rence d'appel d'offres"
              value={tenderReference}
              onChange={(e) => onTenderReferenceChange?.(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Suggestions d'appels d'offres */}
          {tendersLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Chargement des appels d'offres...
            </div>
          ) : tenders && tenders.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-2">Appels d'offres associÃ©s:</p>
              <div className="space-y-1">
                {tenders.map((tender) => (
                  <button
                    key={tender.id}
                    type="button"
                    className="w-full text-left text-xs p-2 bg-muted rounded hover:bg-muted/80 transition-colors"
                    onClick={() => onTenderReferenceChange?.(tender.reference)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{tender.reference}</span>
                      {tender.title && (
                        <span className="text-muted-foreground truncate ml-auto">
                          {tender.title}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Un projet peut Ãªtre associÃ© Ã  plusieurs appels d'offres. Indiquez la rÃ©fÃ©rence de l'appel d'offres concernÃ© par cette demande.
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedProjectSelector;
