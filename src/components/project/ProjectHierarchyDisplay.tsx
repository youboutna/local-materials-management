import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, Building, Users } from 'lucide-react';
import { TranslatedDepartment } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';

// ✅ IMPORT entityLabels
import { getEntityLabel, formatReference } from '@/utils/entityLabels';
import { useProjectsHex } from '@/hooks/hexagonal/useProjectsHex';

interface HierarchyMember {
  hierarchy_id: string;
  employee_id: string;
  employee_name: string;
  position_title: string;
  department: string;
  level: number;
  parent_id: string | null;
  organization_name: string;
  can_approve_projects: boolean;
  can_approve_payments: boolean;
  employee_email: string;
  employee_phone: string;
}

interface ProjectHierarchyDisplayProps {
  hierarchy: HierarchyMember[];
  projectId: string;
  onEscalate?: (targetLevel: string, member: HierarchyMember) => void;
}

const ProjectHierarchyDisplay: React.FC<ProjectHierarchyDisplayProps> = ({
  hierarchy,
  projectId,
  onEscalate
}) => {
  // ✅ Récupérer les projets pour les labels
  const { projects = [] } = useProjectsHex();
  
  // ✅ RÉSOLUTION DU LABEL DU PROJET
  const projectLabel = getEntityLabel(projectId, projects, 'project');
  const projectRef = formatReference(projectId, 'PRJ');

  // Group hierarchy by level
  const hierarchyByLevel = hierarchy.reduce((acc, member) => {
    if (!acc[member.level]) {
      acc[member.level] = [];
    }
    acc[member.level].push(member);
    return acc;
  }, {} as Record<number, HierarchyMember[]>);

  const levels = Object.keys(hierarchyByLevel).map(Number).sort();

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Direction';
      case 2: return 'Management';
      case 3: return 'Supervision';
      case 4: return 'Équipe';
      default: return `Niveau ${level}`;
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-destructive/10 text-destructive border-destructive/30';
      case 2: return 'bg-warning/10 text-warning border-warning/30';
      case 3: return 'bg-primary/10 text-primary border-primary/30';
      case 4: return 'bg-success-soft text-success border-success/30';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {/* ✅ AFFICHAGE DU LABEL AU LIEU DE projectId.slice(0, 8) */}
            Hiérarchie Organisationnelle - {projectLabel || projectRef}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hierarchy.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p><T k="auto.projecthierarchydisplay.aucune_hierarchie_organisationnelle_trouvee_pour" fallback="Aucune hiérarchie organisationnelle trouvée pour ce projet" /></p>
            </div>
          ) : (
            <div className="space-y-6">
              {levels.map(level => (
                <div key={level} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className={getLevelColor(level)}>
                      {getLevelLabel(level)} - Niveau {level}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {hierarchyByLevel[level].length} membre(s)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hierarchyByLevel[level].map(member => (
                      <Card key={member.hierarchy_id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {getInitials(member.employee_name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">
                                {member.employee_name}
                              </h4>
                              <p className="text-sm text-primary font-medium">
                                {member.position_title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                <TranslatedDepartment code={member.department} /> • {member.organization_name}
                              </p>
                              
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {member.employee_email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-24">{member.employee_email}</span>
                                  </div>
                                )}
                                {member.employee_phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{member.employee_phone}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-3">
                                {member.can_approve_projects && (
                                  <Badge variant="outline" className="text-xs">
                                    <T k="auto.projecthierarchydisplay.projets" fallback="Projets" />
                                  </Badge>
                                )}
                                {member.can_approve_payments && (
                                  <Badge variant="outline" className="text-xs">
                                    <T k="auto.projecthierarchydisplay.paiements" fallback="Paiements" />
                                  </Badge>
                                )}
                              </div>
                              
                              {onEscalate && (
                                <button
                                  onClick={() => onEscalate(`level${level}`, member)}
                                  className="mt-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded hover:bg-primary/20 transition-colors"
                                >
                                  <T k="auto.projecthierarchydisplay.escalader" fallback="Escalader" />
                                </button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectHierarchyDisplay;