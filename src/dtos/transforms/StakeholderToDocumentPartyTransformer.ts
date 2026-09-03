/**
 * src/dtos/transforms/StakeholderToDocumentPartyTransformer.ts
 * Transforme Stakeholder (Domain Entity) ↔ DocumentPartyDTO (DTO)
 *
 * ⚠️ TRANSFORMER — Conversion uniquement
 */
import { DocumentPartyDTO } from '@/dtos/boq/DocumentHeaderDTO';
import { Stakeholder } from '@/domain/entities/Stakeholder';

export class StakeholderToDocumentPartyTransformer {
  static toDocumentParty(stakeholder: Stakeholder): DocumentPartyDTO {
    const org = stakeholder.organization;
    const contact = stakeholder.contact;

    return {
      id: stakeholder.id,
      name: stakeholder.getDisplayName(),
      kind: this.inferKind(stakeholder),
      taxId: org?.nif ?? null,
      address: org?.address ?? null,
      phone: contact.phone ?? org?.phone ?? null,
      email: contact.email ?? org?.email ?? null,
    };
  }

  static toSnapshot(stakeholder: Stakeholder): DocumentPartyDTO {
    const org = stakeholder.organization;
    const contact = stakeholder.contact;

    return {
      id: stakeholder.id,
      name: stakeholder.getDisplayName(),
      kind: this.inferKind(stakeholder),
      taxId: org?.nif ?? null,
      address: org?.address ?? org?.address ?? null,
      phone: contact.phone ?? org?.phone ?? null,
      email: contact.email ?? org?.email ?? null,
    };
  }

  static inferKind(stakeholder: Stakeholder): string {
    const type = stakeholder.type;
    const role = stakeholder.role;

    if (type === 'supplier' || type === 'subcontractor') return 'supplier';
    if (type === 'consultant') return 'consultant';
    if (type === 'contractor') return 'contractor';
    if (type === 'client') return 'client';

    if (role === 'project_manager' || role === 'technical_manager') return 'moe';
    if (role === 'quality_inspector' || role === 'safety_inspector') return 'inspector';

    if (type === 'employee' || stakeholder.isInternal) return 'employee';

    return 'unknown';
  }

  static getStakeholderId(party: DocumentPartyDTO): string | null {
    return party.id ?? null;
  }
}