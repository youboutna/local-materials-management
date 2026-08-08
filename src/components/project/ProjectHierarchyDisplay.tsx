import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, Building, Users } from 'lucide-react';

import { HierarchyMember } from '@/dtos/entities/HierarchyDTO';
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
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 3: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 4: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
            Hiérarchie Organisationnelle - Projet {projectId.slice(0, 8)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hierarchy.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune hiérarchie organisationnelle trouvée pour ce projet</p>
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
                                {member.department} • {member.organization_name}
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
                                    Projets
                                  </Badge>
                                )}
                                {member.can_approve_payments && (
                                  <Badge variant="outline" className="text-xs">
                                    Paiements
                                  </Badge>
                                )}
                              </div>
                              
                              {onEscalate && (
                                <button
                                  onClick={() => onEscalate(`level${level}`, member)}
                                  className="mt-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded hover:bg-primary/20 transition-colors"
                                >
                                  Escalader
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