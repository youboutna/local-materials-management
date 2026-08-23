import type { OrganizationDTO } from '@/dtos/entities/OrganizationDTO';
import { T } from '@/components/i18n/T';

interface OrganizationListProps {
  organizations: OrganizationDTO[];
  onEdit?: (organization: OrganizationDTO) => void;
  onDelete?: (id: string) => void;
}

export function OrganizationList({ organizations, onEdit, onDelete }: OrganizationListProps) {
  return (
    <div className="space-y-2">
      {organizations.map((organization) => (
        <div key={organization.id} className="flex items-center justify-between rounded-md border p-3">
          <div>
            <div className="font-medium">{organization.name}</div>
            <div className="text-sm text-muted-foreground">{organization.code || organization.externalRef || 'Sans référence'}</div>
          </div>
          <div className="flex gap-2">
            {onEdit && <button type="button" onClick={() => onEdit(organization)}><T k="auto.organizationlist.modifier" fallback="Modifier" /></button>}
            {onDelete && <button type="button" onClick={() => onDelete(organization.id)}><T k="auto.organizationlist.supprimer" fallback="Supprimer" /></button>}
          </div>
        </div>
      ))}
    </div>
  );
}