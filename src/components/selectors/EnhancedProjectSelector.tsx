import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Search, Calendar, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { useProjectsSelector, useProjectTenders, type ProjectOption } from '@/hooks/hexagonal/useSelectorsHex';

interface EnhancedProjectSelectorProps {
  value?: string;
  onChange: (projectId: string | undefined, project?: ProjectOption) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  secureMode?: boolean;
  showTenderReference?: boolean;
  onTenderReferenceChange?: (reference: string) => void;
  tenderReference?: string;
}

const EnhancedProjectSelector: React.FC<EnhancedProjectSelectorProps> = ({
  value,
  onChange,
  placeholder = "Sélectionner un projet",
  label = "Projet",
  required = false,
  disabled = false,
  secureMode = false,
  showTenderReference = false,
  onTenderReferenceChange,
  tenderReference = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: projects, isLoading } = useProjectsSelector({
    searchTerm: debouncedSearchTerm,
    secureMode
  });

  const { data: tenders } = useProjectTenders(showTenderReference ? value : undefined);

  const selectedProject = projects?.find(p => p.id === value);

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'InProgress': return 'bg-blue-100 text-blue-800';
      case 'Planning': return 'bg-yellow-100 text-yellow-800';
      case 'OnHold': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <Select 
            value={value || ''} 
            onValueChange={(projectId) => {
              const project = projects?.find(p => p.id === projectId);
              onChange(projectId || undefined, project);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center justify-between w-full min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{project.title}</div>
                        {project.project_reference && (
                          <div className="text-xs text-muted-foreground truncate">
                            Réf: {project.project_reference}
                          </div>
                        )}
                        {!secureMode && project.location && (
                          <div className="text-xs text-muted-foreground truncate">{project.location}</div>
                        )}
                      </div>
                    </div>
                    {!secureMode && (
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {project.status && (
                          <Badge variant="outline" className={`text-xs ${getStatusColor(project.status)}`}>
                            {project.status}
                          </Badge>
                        )}
                        {project.budget && (
                          <span className="text-xs text-muted-foreground">
                            {project.budget.toLocaleString()} MRU
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedProject && (
          <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-medium">Projet sélectionné:</span>
              {!secureMode && selectedProject.status && (
                <Badge variant="outline" className={getStatusColor(selectedProject.status)}>
                  {selectedProject.status}
                </Badge>
              )}
            </div>
            <div className="font-medium">{selectedProject.title}</div>
            {selectedProject.project_reference && (
              <div className="text-muted-foreground">📋 Réf: {selectedProject.project_reference}</div>
            )}
            {!secureMode && selectedProject.location && (
              <div className="text-muted-foreground">📍 {selectedProject.location}</div>
            )}
            {!secureMode && (selectedProject.start_date || selectedProject.end_date) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(selectedProject.start_date)} - {formatDate(selectedProject.end_date)}
              </div>
            )}
            {!secureMode && selectedProject.budget && (
              <div className="font-medium text-primary">
                Budget: {selectedProject.budget.toLocaleString()} MRU
              </div>
            )}
          </div>
        )}
      </div>

      {showTenderReference && (
        <div className="space-y-2">
          <Label>Référence d'appel d'offres (optionnel)</Label>
          
          <Input
            placeholder="Saisir la référence d'appel d'offres"
            value={tenderReference}
            onChange={(e) => onTenderReferenceChange?.(e.target.value)}
          />
          
          {tenders && tenders.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-2">Appels d'offres associés:</p>
              <div className="space-y-1">
                {tenders.map((tender) => (
                  <div key={tender.id} 
                       className="text-xs p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                       onClick={() => onTenderReferenceChange?.(tender.reference)}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span>{tender.reference}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Un projet peut être associé à plusieurs appels d'offres. Indiquez la référence de l'appel d'offres concerné par cette demande.
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedProjectSelector;