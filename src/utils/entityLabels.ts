/**
 * entityLabels - Résolution canonique des libellés affichés dans l'UI
 * 
 * Règle métier : un UUID ne doit JAMAIS être affiché comme libellé.
 * On résout avec une seule propriété pertinente par type d'entité.
 * 
 * Pour les opérations CRUD, on garde l'ID pour les requêtes.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): boolean =>
  typeof value === 'string' && UUID_RE.test(value.trim());

export const isDisplayable = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && !isUuid(value);

type AnyRecord = Record<string, unknown> | object;

const pick = (source: AnyRecord | null | undefined, keys: readonly string[]): string | undefined => {
  if (!source) return undefined;
  const bag = source as Record<string, unknown>;
  for (const key of keys) {
    const raw = bag[key];
    if (isDisplayable(raw)) return raw.trim();
  }
  return undefined;
};

// ============================================================
// CONFIGURATIONS : Une seule propriété par type
// ============================================================

const CONFIGS = {
  // Project
  project: { keys: ['title', 'name'] as const, fallback: 'Projet sans nom' },
  
  // Phase
  phase: { keys: ['phaseName', 'phase_name', 'name', 'title'] as const, fallback: 'Phase' },
  
  // Employee
  employee: { keys: ['fullName', 'full_name', 'name'] as const, fallback: 'Employé' },
  
  // Supplier
  supplier: { keys: ['name', 'companyName', 'company_name'] as const, fallback: 'Fournisseur' },
  
  // Contract
  contract: { keys: ['title', 'name'] as const, fallback: 'Contrat' },
  
  // Tender
  tender: { keys: ['title', 'name'] as const, fallback: 'Appel d\'offres' },
  tenderEstimate: { keys: ['title', 'name'] as const, fallback: 'Devis' },
  tenderSubmission: { keys: ['supplierName', 'supplier_name'] as const, fallback: 'Soumission' },
  tenderDocument: { keys: ['title', 'name'] as const, fallback: 'Document AO' },
  
  // Inspection
  inspection: { keys: ['title', 'inspection_date', 'date'] as const, fallback: 'Inspection' },
  
  // Payment
  payment: { keys: ['description', 'reference'] as const, fallback: 'Paiement' },
  
  // Task
  task: { keys: ['title', 'name'] as const, fallback: 'Tâche' },
  
  // Document
  document: { keys: ['title', 'name', 'fileName', 'file_name'] as const, fallback: 'Document' },
  
  // Risk
  risk: { keys: ['riskTitle', 'risk_title', 'title'] as const, fallback: 'Risque' },
  
  // Delivery
  delivery: { keys: ['deliveryNumber', 'delivery_number', 'reference'] as const, fallback: 'Livraison' },
  
  // Notification
  notification: { keys: ['title', 'message'] as const, fallback: 'Notification' },
  
  // Profile
  profile: { keys: ['fullName', 'full_name', 'name'] as const, fallback: 'Profil' },
  
  // Stock
  stock: { keys: ['product', 'name'] as const, fallback: 'Stock' },
  
  // Alert
  alert: { keys: ['title', 'name'] as const, fallback: 'Alerte' },
  
  // Complaint
  complaint: { keys: ['complaintType', 'complaint_type', 'title'] as const, fallback: 'Réclamation' },
  
  // Incident
  incident: { keys: ['incidentType', 'incident_type', 'title'] as const, fallback: 'Incident' },
  
  // Insurance
  insurance: { keys: ['name', 'company_name'] as const, fallback: 'Assurance' },
  
  // Vehicle
  vehicle: { keys: ['name', 'registrationNumber', 'registration_number'] as const, fallback: 'Véhicule' },
  
  // Mission
  mission: { keys: ['title', 'name'] as const, fallback: 'Mission' },
  
  // Vessel
  vessel: { keys: ['name', 'registrationNumber', 'registration_number'] as const, fallback: 'Navire' },
  
  // Brand
  brand: { keys: ['name'] as const, fallback: 'Marque' },
  
  // Workspace
  workspace: { keys: ['name', 'title'] as const, fallback: 'Espace de travail' },
  
  // Location
  location: { keys: ['name', 'code'] as const, fallback: 'Localisation' },
  
  // Depot
  depot: { keys: ['name', 'code'] as const, fallback: 'Dépôt' },
  
  // Station
  station: { keys: ['stationName', 'station_name', 'name'] as const, fallback: 'Station' },
  
  // Stakeholder
  stakeholder: { keys: ['name', 'role'] as const, fallback: 'Partie prenante' },
  
  // User
  user: { keys: ['email', 'name'] as const, fallback: 'Utilisateur' },
  userRole: { keys: ['roleName', 'role_name', 'name'] as const, fallback: 'Rôle' },
  
  // Milestone
  milestone: { keys: ['title', 'name'] as const, fallback: 'Jalon' },
  
  // Material
  material: { keys: ['name', 'title'] as const, fallback: 'Matériau' },
  
  // BOQ
  boq: { keys: ['designation', 'description', 'name'] as const, fallback: 'BOQ' },
  
  // Compliance
  compliance: { keys: ['title', 'name'] as const, fallback: 'Conformité' },
  
  // Certification
  certification: { keys: ['name', 'title'] as const, fallback: 'Certification' },
  
  // Template
  template: { keys: ['name', 'title'] as const, fallback: 'Template' },
  
  // Invoice
  invoice: { keys: ['invoiceNumber', 'invoice_number', 'reference'] as const, fallback: 'Facture' },
  
  // Intervention Zone
  interventionZone: { keys: ['name', 'code'] as const, fallback: 'Zone' },
  
  // Position
  position: { keys: ['title', 'name'] as const, fallback: 'Poste' },
  
  // Budget Link
  budgetLink: { keys: ['reference', 'code'] as const, fallback: 'Lien budgétaire' },
  
  // Strategy Link
  strategyLink: { keys: ['reference', 'code'] as const, fallback: 'Lien stratégique' },
  
  // Submission Secret
  submissionSecret: { keys: ['secretCode', 'secret_code'] as const, fallback: 'Secret' },
  
  // Submission Document
  submissionDocument: { keys: ['name', 'fileName', 'file_name'] as const, fallback: 'Document' },
  
  // Blocked Sender
  blockedSender: { keys: ['email'] as const, fallback: 'Expéditeur bloqué' },
  
  // Contact Message
  contactMessage: { keys: ['subject', 'senderName', 'sender_name'] as const, fallback: 'Message' },
  
  // Performance
  performance: { keys: ['metricName', 'metric_name', 'name'] as const, fallback: 'Performance' },
  
  // Risk Type
  riskType: { keys: ['name', 'label'] as const, fallback: 'Type de risque' },
  
  // WBS
  wbsRef: { keys: ['code', 'name'] as const, fallback: 'WBS' },
  
  // Hierarchy
  hierarchy: { keys: ['name', 'title'] as const, fallback: 'Hiérarchie' },
  
  // Décompte
  decompte: { keys: ['reference', 'title', 'name'] as const, fallback: 'Décompte' },
} as const;

export type EntityType = keyof typeof CONFIGS;

// ============================================================
// FORMAT REFERENCE (PRJ-4F2A19)
// ============================================================

export function formatReference(id?: string | null, prefix: string = ''): string {
  if (!id) return '';
  if (id.length < 8) return id;
  const shortId = id.slice(0, 8).toUpperCase();
  return prefix ? `${prefix}-${shortId}` : shortId;
}

// ============================================================
// SHORT DESCRIPTION
// ============================================================

export function resolveShortDescription(
  entity: AnyRecord | null | undefined,
  type: EntityType,
  maxLength: number = 30
): string {
  const label = resolveLabel(entity, type);
  if (label.length <= maxLength) return label;
  return label.slice(0, maxLength) + '...';
}

// ============================================================
// FONCTION GÉNÉRIQUE
// ============================================================

export function resolveLabel(
  entity: AnyRecord | null | undefined,
  type: EntityType,
  index?: number
): string {
  if (!entity) return CONFIGS[type].fallback;

  const config = CONFIGS[type];
  
  const label = pick(entity, config.keys);
  if (label) return label;

  const code = pick(entity, ['code', 'reference'] as const);
  if (code) return code;

  if (typeof index === 'number' && index >= 0) {
    return `${config.fallback} ${index + 1}`;
  }

  return config.fallback;
}

// ============================================================
// FONCTIONS SPÉCIFIQUES
// ============================================================

export function resolveProjectLabel(project: AnyRecord | null | undefined): string {
  return resolveLabel(project, 'project');
}

export function resolvePhaseLabel(
  phase: AnyRecord | null | undefined,
  index?: number,
  prefix = 'Phase'
): string {
  const label = resolveLabel(phase, 'phase', index);
  if (label === CONFIGS.phase.fallback) return label;
  if (label === 'Phase' && typeof index === 'number') return `${prefix} ${index + 1}`;
  return label;
}

export function resolveEmployeeLabel(employee: AnyRecord | null | undefined): string {
  const firstName = pick(employee, ['firstName', 'first_name'] as const) || '';
  const lastName = pick(employee, ['lastName', 'last_name'] as const) || '';
  if (firstName || lastName) return `${firstName} ${lastName}`.trim();
  return resolveLabel(employee, 'employee');
}

export function resolveSupplierLabel(supplier: AnyRecord | null | undefined): string {
  return resolveLabel(supplier, 'supplier');
}

export function resolveContractLabel(contract: AnyRecord | null | undefined): string {
  return resolveLabel(contract, 'contract');
}

export function resolveTenderLabel(tender: AnyRecord | null | undefined): string {
  return resolveLabel(tender, 'tender');
}

export function resolveInspectionLabel(inspection: AnyRecord | null | undefined): string {
  return resolveLabel(inspection, 'inspection');
}

export function resolvePaymentLabel(payment: AnyRecord | null | undefined): string {
  return resolveLabel(payment, 'payment');
}

export function resolveTaskLabel(task: AnyRecord | null | undefined): string {
  return resolveLabel(task, 'task');
}

export function resolveDocumentLabel(document: AnyRecord | null | undefined): string {
  return resolveLabel(document, 'document');
}

export function resolveRiskLabel(risk: AnyRecord | null | undefined): string {
  return resolveLabel(risk, 'risk');
}

export function resolveDeliveryLabel(delivery: AnyRecord | null | undefined): string {
  return resolveLabel(delivery, 'delivery');
}

export function resolveNotificationLabel(notification: AnyRecord | null | undefined): string {
  return resolveLabel(notification, 'notification');
}

export function resolveProfileLabel(profile: AnyRecord | null | undefined): string {
  return resolveLabel(profile, 'profile');
}

export function resolveStockLabel(stock: AnyRecord | null | undefined): string {
  return resolveLabel(stock, 'stock');
}

export function resolveAlertLabel(alert: AnyRecord | null | undefined): string {
  return resolveLabel(alert, 'alert');
}

export function resolveComplaintLabel(complaint: AnyRecord | null | undefined): string {
  return resolveLabel(complaint, 'complaint');
}

export function resolveIncidentLabel(incident: AnyRecord | null | undefined): string {
  return resolveLabel(incident, 'incident');
}

export function resolveInsuranceLabel(insurance: AnyRecord | null | undefined): string {
  return resolveLabel(insurance, 'insurance');
}

export function resolveVehicleLabel(vehicle: AnyRecord | null | undefined): string {
  return resolveLabel(vehicle, 'vehicle');
}

export function resolveMissionLabel(mission: AnyRecord | null | undefined): string {
  return resolveLabel(mission, 'mission');
}

export function resolveVesselLabel(vessel: AnyRecord | null | undefined): string {
  return resolveLabel(vessel, 'vessel');
}

export function resolveBrandLabel(brand: AnyRecord | null | undefined): string {
  return resolveLabel(brand, 'brand');
}

export function resolveWorkspaceLabel(workspace: AnyRecord | null | undefined): string {
  return resolveLabel(workspace, 'workspace');
}

export function resolveLocationLabel(location: AnyRecord | null | undefined): string {
  return resolveLabel(location, 'location');
}

export function resolveDepotLabel(depot: AnyRecord | null | undefined): string {
  return resolveLabel(depot, 'depot');
}

export function resolveStationLabel(station: AnyRecord | null | undefined): string {
  return resolveLabel(station, 'station');
}

export function resolveStakeholderLabel(stakeholder: AnyRecord | null | undefined): string {
  return resolveLabel(stakeholder, 'stakeholder');
}

export function resolveUserLabel(user: AnyRecord | null | undefined): string {
  return resolveLabel(user, 'user');
}

export function resolveMilestoneLabel(milestone: AnyRecord | null | undefined): string {
  return resolveLabel(milestone, 'milestone');
}

export function resolveMaterialLabel(material: AnyRecord | null | undefined): string {
  return resolveLabel(material, 'material');
}

export function resolveBoqLabel(boq: AnyRecord | null | undefined): string {
  return resolveLabel(boq, 'boq');
}

export function resolveComplianceLabel(compliance: AnyRecord | null | undefined): string {
  return resolveLabel(compliance, 'compliance');
}

export function resolveTemplateLabel(template: AnyRecord | null | undefined): string {
  return resolveLabel(template, 'template');
}

export function resolveInvoiceLabel(invoice: AnyRecord | null | undefined): string {
  return resolveLabel(invoice, 'invoice');
}

export function resolveDecompteLabel(decompte: AnyRecord | null | undefined): string {
  return resolveLabel(decompte, 'decompte');
}

// ============================================================
// RÉSOLUTION PAR ID AVEC MAP
// ============================================================

export function resolveLabelFromId<T extends AnyRecord>(
  id: string,
  entityMap: Map<string, T>,
  type: EntityType
): string {
  if (!id) return CONFIGS[type].fallback;
  
  const entity = entityMap.get(id);
  if (entity) {
    const label = resolveLabel(entity, type);
    if (label !== CONFIGS[type].fallback) {
      return label;
    }
  }
  
  return formatReference(id);
}

// ============================================================
// HELPERS CRUD : Garde l'ID et le label ensemble
// ============================================================

export interface EntityOption {
  id: string;
  label: string;
}

export function createEntityOption<T extends AnyRecord>(
  entity: T,
  type: EntityType,
  index?: number
): EntityOption {
  return {
    id: entity.id as string,
    label: resolveLabel(entity, type, index),
  };
}

export function createEntityOptions<T extends AnyRecord>(
  entities: T[],
  type: EntityType
): EntityOption[] {
  return entities.map((entity, index) => createEntityOption(entity, type, index));
}

export function getEntityOption(
  id: string,
  entities: AnyRecord[],
  type: EntityType
): EntityOption | null {
  const entity = entities.find(e => e.id === id);
  if (!entity) return null;
  return createEntityOption(entity, type);
}

export function getEntityLabel(
  id: string,
  entities: AnyRecord[],
  type: EntityType
): string {
  const option = getEntityOption(id, entities, type);
  return option?.label || formatReference(id);
}

// ============================================================
// VALIDATION : Rejeter UUID comme label
// ============================================================

export function validateEntityLabel(
  entity: AnyRecord | null | undefined,
  type: EntityType
): { valid: boolean; label: string; error?: string } {
  if (!entity) {
    return { valid: false, label: '', error: 'Entity is null or undefined' };
  }

  const label = resolveLabel(entity, type);
  
  if (isUuid(label)) {
    return {
      valid: false,
      label,
      error: `UUID detected as label for ${type}: ${label}`
    };
  }

  return { valid: true, label };
}

export function validateEntityLabels<T extends AnyRecord>(
  entities: T[],
  type: EntityType
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  entities.forEach((entity, index) => {
    const result = validateEntityLabel(entity, type);
    if (!result.valid && result.error) {
      errors.push(`[${index}] ${result.error}`);
    }
  });

  return { valid: errors.length === 0, errors };
}