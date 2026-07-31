import type { OrganizationDTO } from '@/dtos/entities/OrganizationDTO';

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
            {onEdit && <button type="button" onClick={() => onEdit(organization)}>Modifier</button>}
            {onDelete && <button type="button" onClick={() => onDelete(organization.id)}>Supprimer</button>}
          </div>
        </div>
      ))}
    </div>
  );
}