import React, { useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Search, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUsersSelector } from '@/hooks/hexagonal';
import type { UserProfile } from '@/hooks/hexagonal/useSelectorsHex';
import { useDebounce } from '@/hooks/useDebounce';

interface UserSelectorProps {
  value?: string;
  onChange: (userId: string) => void;
  /** Callback enrichi : renvoie le profil complet sélectionné (nom, poste, email). */
  onSelect?: (user: UserProfile | undefined) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  roleFilter?: string[];
  /** Affiche le poste / département de l'employé lié. */
  showEmployeeDetails?: boolean;
}

const getRoleBadgeColor = (role: string | null | undefined) => {
  switch (role) {
    case 'admin':
      return 'bg-destructive/10 text-destructive';
    case 'manager':
      return 'bg-primary/10 text-primary';
    case 'director':
      return 'bg-accent/20 text-accent-foreground';
    case 'engineer':
      return 'bg-success/10 text-success';
    case 'inspector':
      return 'bg-warning/10 text-warning';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const displayName = (user: UserProfile) =>
  user.full_name || user.email || user.phone || user.national_id || 'Utilisateur';

const UserSelector: React.FC<UserSelectorProps> = ({
  value,
  onChange,
  onSelect,
  label = 'Utilisateur',
  disabled = false,
  required = false,
  placeholder = 'Sélectionner un utilisateur',
  roleFilter,
  showEmployeeDetails = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: users, isLoading } = useUsersSelector({
    searchTerm: debouncedSearch || undefined,
    roleFilter,
    withEmployeeDetails: showEmployeeDetails,
  });

  const options = useMemo(() => users ?? [], [users]);
  const selectedUser = options.find((user) => user.id === value);

  // Garantit que la valeur courante (mode édition) reste visible même si la
  // recherche filtre la liste renvoyée par le service.
  const [pinnedUser, setPinnedUser] = useState<UserProfile | undefined>(undefined);
  useEffect(() => {
    if (selectedUser) setPinnedUser(selectedUser);
    if (!value) setPinnedUser(undefined);
  }, [selectedUser, value]);

  const visibleOptions = useMemo(() => {
    if (!pinnedUser || options.some((u) => u.id === pinnedUser.id)) return options;
    return [pinnedUser, ...options];
  }, [options, pinnedUser]);

  const current = selectedUser ?? pinnedUser;

  const handleChange = (userId: string) => {
    onChange(userId);
    onSelect?.(visibleOptions.find((u) => u.id === userId));
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Rechercher par nom complet, email, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={disabled}
            aria-label="Rechercher un utilisateur"
          />
        </div>

        <Select value={value || ''} onValueChange={handleChange} disabled={disabled}>
          <SelectTrigger aria-label={label || 'Utilisateur'}>
            <SelectValue placeholder={isLoading ? 'Chargement...' : placeholder}>
              {current && (
                <span className="flex items-center gap-2 truncate">
                  <User className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{displayName(current)}</span>
                  {current.position && (
                    <span className="text-xs text-muted-foreground truncate">— {current.position}</span>
                  )}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {isLoading && (
              <SelectItem value="__loading" disabled>
                Chargement des utilisateurs...
              </SelectItem>
            )}
            {!isLoading &&
              visibleOptions.map((user) => (
                <SelectItem key={user.id} value={user.id} className="max-w-none">
                  <div className="flex items-center gap-2 w-full">
                    <User className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{displayName(user)}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[user.position, user.department, user.email || user.phone]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    </div>
                    {user.role && (
                      <Badge className={getRoleBadgeColor(user.role)} variant="outline">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            {!isLoading && visibleOptions.length === 0 && (
              <SelectItem value="__empty" disabled>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Aucun utilisateur trouvé
                </span>
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {current && (
          <p className="text-xs text-muted-foreground truncate">
            {[current.position, current.department, current.role].filter(Boolean).join(' • ') ||
              `ID: ${current.id}`}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserSelector;
