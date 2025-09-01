import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Search, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  national_id?: string | null;
  role?: string | null;
}

interface UserSelectorProps {
  value?: string;
  onChange: (userId: string) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  roleFilter?: string[];
}

const UserSelector: React.FC<UserSelectorProps> = ({
  value,
  onChange,
  label = "Utilisateur",
  disabled = false,
  required = false,
  placeholder = "Sélectionner un utilisateur",
  roleFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', searchTerm, roleFilter],
    queryFn: async (): Promise<UserProfile[]> => {
      // Get users from profiles table
      let profileQuery = supabase
        .from('profiles')
        .select('id, full_name, phone, national_id, role')
        .order('full_name', { ascending: true });

      if (searchTerm) {
        profileQuery = profileQuery.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,national_id.ilike.%${searchTerm}%`);
      }

      if (roleFilter && roleFilter.length > 0) {
        profileQuery = profileQuery.in('role', roleFilter as any);
      }

      const { data: profileData, error: profileError } = await profileQuery.limit(30);
      if (profileError) console.error('Error fetching profiles:', profileError);

      // Get suppliers and transform them to match UserProfile interface
      let supplierQuery = supabase
        .from('suppliers')
        .select('id, name, email, user_id')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (searchTerm) {
        supplierQuery = supplierQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data: supplierData, error: supplierError } = await supplierQuery.limit(20);
      if (supplierError) console.error('Error fetching suppliers:', supplierError);

      // Combine and deduplicate data
      const users: UserProfile[] = [];
      
      // Add profiles
      if (profileData) {
        users.push(...profileData.map(profile => ({
          id: profile.id,
          full_name: profile.full_name,
          phone: profile.phone,
          national_id: profile.national_id,
          role: profile.role
        })));
      }

      // Add suppliers (only if not already in profiles by user_id)
      if (supplierData) {
        supplierData.forEach(supplier => {
          // Skip if supplier already linked to a user in profiles
          const alreadyExists = users.some(user => user.id === supplier.user_id);
          if (!alreadyExists) {
            users.push({
              id: supplier.id,
              full_name: supplier.name || 'Fournisseur',
              phone: supplier.email || undefined,
              national_id: undefined,
              role: 'supplier'
            });
          }
        });
      }

      return users;
    },
  });

  const selectedUser = users?.find(user => user.id === value);

  const handleUserSelect = (userId: string) => {
    onChange(userId);
  };

  const getRoleBadgeColor = (role: string | null | undefined) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'director':
        return 'bg-purple-100 text-purple-800';
      case 'engineer':
        return 'bg-green-100 text-green-800';
      case 'inspector':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={disabled}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <Select value={value || ''} onValueChange={handleUserSelect} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder}>
                {selectedUser && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{selectedUser.full_name || selectedUser.phone || selectedUser.id}</span>
                    {selectedUser.role && (
                      <Badge className={getRoleBadgeColor(selectedUser.role)} variant="outline">
                        {selectedUser.role}
                      </Badge>
                    )}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id} className="max-w-none">
                  <div className="flex items-center gap-2 w-full">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {user.full_name || user.phone || 'Utilisateur anonyme'}
                      </div>
                      {user.phone && user.full_name && (
                        <div className="text-xs text-muted-foreground truncate">{user.phone}</div>
                      )}
                      {user.national_id && (
                        <div className="text-xs text-muted-foreground truncate">ID: {user.national_id}</div>
                      )}
                    </div>
                    {user.role && (
                      <Badge className={getRoleBadgeColor(user.role)} variant="outline">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
              {(!users || users.length === 0) && (
                <SelectItem value="no-users" disabled>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Aucun utilisateur trouvé</span>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
        
        {selectedUser && (
          <div className="text-xs text-muted-foreground">
            ID: {selectedUser.id}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSelector;