
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

// Define the custom role type that matches what we're using in the Users component
// and include database roles
export type RoleType = 'admin' | 'developer' | 'manager' | 'director' | 'inspector' | 'supplyer'  | 'user';

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
      case 'developer':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'manager':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'director':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'inspector':
        return 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200';
      case 'supplayer':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'user':
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getRoleLabel = (role: RoleType) => {
    return t(`roles.${role}`);
  };

  return (
    <Badge className={`font-medium ${getRoleColor(role)} ${className}`} variant="outline">
      {getRoleLabel(role)}
    </Badge>
  );
};

export default RoleBadge;
