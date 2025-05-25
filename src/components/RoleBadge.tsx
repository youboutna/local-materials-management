
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
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'project_manager':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'supervisor':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'inspector':
        return 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200';
      case 'supplier':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'viewer':
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getRoleLabel = (role: RoleType) => {
    const labels = {
      admin: 'Administrateur',
      project_manager: 'Chef de projet',
      supervisor: 'Superviseur',
      inspector: 'Inspecteur',
      supplier: 'Fournisseur',
      viewer: 'Lecteur'
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
