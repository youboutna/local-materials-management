
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

// Update to match database roles
export type RoleType = 'admin' | 'project_manager' | 'supervisor' | 'inspector' | 'supplier' | 'viewer';

interface RoleBadgeProps {
  role: RoleType;
  className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
  const { t } = useLanguage();
  
  const getRoleColor = (role: RoleType) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive/10 text-destructive hover:bg-red-200';
      case 'project_manager':
        return 'bg-primary/10 text-primary hover:bg-blue-200';
      case 'supervisor':
        return 'bg-success-soft text-success hover:bg-success-soft';
      case 'inspector':
        return 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200';
      case 'supplier':
        return 'bg-warning/10 text-warning hover:bg-amber-200';
      case 'viewer':
      default:
        return 'bg-muted text-foreground hover:bg-gray-200';
    }
  };

  const getRoleLabel = (role: RoleType) => {
    const labels = {
      admin: t('roles.admin') || 'Administrateur',
      project_manager: t('roles.project_manager') || 'Chef de projet',
      supervisor: t('roles.supervisor') || 'Superviseur',
      inspector: t('roles.inspector') || 'Inspecteur',
      supplier: t('roles.supplier') || 'Fournisseur',
      viewer: t('roles.viewer') || 'Lecteur'
    };
    return labels[role] || role;
  };

  return (
    <Badge className={`font-medium ${getRoleColor(role)} ${className}`} variant="outline">
      {getRoleLabel(role)}
    </Badge>
  );
};

export default RoleBadge;
