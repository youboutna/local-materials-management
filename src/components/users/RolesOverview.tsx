import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ROLES_RESPONSIBILITIES, getRoleLabel } from '@/config/referentials/auth/roles-responsibilities.referential';

interface Props {
  profiles: ReadonlyArray<{ roles?: string[] }>;
  selectedRole: string | null;
  onSelectRole: (role: string | null) => void;
}

/** Rôles du référentiel avec le nombre de comptes actifs ; un clic filtre la liste des utilisateurs. */
export function RolesOverview({ profiles, selectedRole, onSelectRole }: Props) {
  const { language } = useLanguage();
  const lang = (language === 'ar' || language === 'en' ? language : 'fr') as 'fr' | 'ar' | 'en';
  const count = (code: string) => profiles.filter((p) => p.roles?.includes(code)).length;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtrer par rôle">
      <Button size="sm" variant={selectedRole === null ? 'default' : 'outline'} onClick={() => onSelectRole(null)}>
        Tous <Badge variant="secondary" className="ml-2">{profiles.length}</Badge>
      </Button>
      {ROLES_RESPONSIBILITIES.map((role) => (
        <Button
          key={role.code}
          size="sm"
          variant={selectedRole === role.code ? 'default' : 'outline'}
          onClick={() => onSelectRole(selectedRole === role.code ? null : role.code)}
          title={role.permissions.includes('*') ? 'Tous les droits' : role.permissions.join(', ')}
        >
          {getRoleLabel(role.code, lang)}
          <Badge variant="secondary" className="ml-2">{count(role.code)}</Badge>
        </Button>
      ))}
    </div>
  );
}
