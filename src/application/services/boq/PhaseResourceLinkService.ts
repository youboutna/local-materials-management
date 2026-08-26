/**
 * PhaseResourceLinkService — relie la chaîne DQE / Devis à la planification (phase).
 *
 * Lecture seule : agrège `btp.boq_lines` (sources dqe, quantity_takeoff, supplier_bid)
 * pour une phase donnée et produit les familles Matériaux / Équipements / Main d'œuvre
 * ainsi que l'état de la chaîne (DQE validé, AO publié, devis reçus / accepté).
 *
 * Service pur (aucun React) — accès base via le port IBoqRepository.
 */
import type { IBoqRepository } from '@/domain/repositories/IBoqRepository';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type {
  PhaseChainStateDTO,
  PhasePlannedResourcesDTO,
  PhaseResourceBucketDTO,
  PhaseResourceFamily,
  PhaseResourceLineDTO,
  PhaseResourceOrigin,
} from '@/dtos/entities/PhasePlannedResourcesDTO';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';

/** Unités marquant une prestation de main d'œuvre (homme-jour, homme-mois, forfait). */
const LABOR_UNITS = ['hj', 'h/j', 'homme-jour', 'hommejour', 'hm', 'hommemois', 'homme-mois', 'mois', 'jour', 'j', 'forfait', 'ff'];
const LABOR_HINTS = ['main d', 'maindoeuvre', 'personnel', 'expert', 'consultant', 'ingenieur', 'technicien', 'salaire', 'honoraire', 'prestation', 'etude'];
const EQUIPMENT_HINTS = ['engin', 'equipement', 'materiel roulant', 'camion', 'pelle', 'grue', 'vehicule', 'compacteur', 'groupe electrogene', 'machine'];

const normalize = (value?: string | null): string =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const LOCKED_STATUSES = new Set(['submitted', 'validated', 'invoiced', 'paid', 'archived']);
const ACCEPTED_BUSINESS = new Set(['accepte', 'accepted', 'attribue', 'awarded', 'signe', 'signed']);
const PUBLISHED_BUSINESS = new Set(['publie', 'published', 'ao_publie', 'tender_published']);

function resolveFamily(line: BoqLineDTO): PhaseResourceFamily {
  const kind = normalize(line.resourceType);
  if (kind === 'labor' || kind === 'labour') return 'labor';
  if (kind === 'equipment') return 'equipment';

  const unit = normalize(line.unit).replace(/[\s._]/g, '');
  const haystack = `${normalize(line.designation)} ${normalize(line.category)} ${normalize(line.elementType)}`;

  if (EQUIPMENT_HINTS.some((h) => haystack.includes(normalize(h)))) return 'equipment';
  if (LABOR_UNITS.includes(unit) || LABOR_HINTS.some((h) => haystack.includes(normalize(h)))) return 'labor';
  return 'material';
}

function resolveOrigin(line: BoqLineDTO): PhaseResourceOrigin {
  if (line.source === 'supplier_bid') return 'quote';
  if (line.source === 'quantity_takeoff') return 'takeoff';
  return 'dqe';
}

function toResourceLine(line: BoqLineDTO): PhaseResourceLineDTO {
  const quantity = Number(line.quantity) || 0;
  const unitPrice = Number(line.unitPrice ?? 0) || 0;
  const totalHt = Number(line.totalHt ?? quantity * unitPrice) || 0;
  const businessStatus = normalize(line.businessStatus);
  return {
    id: String(line.id ?? `${line.designation}-${quantity}`),
    designation: line.designation,
    family: resolveFamily(line),
    origin: resolveOrigin(line),
    unit: line.unit,
    quantity,
    unitPrice,
    totalHt,
    materialId: line.materialId ?? null,
    code: line.code ?? null,
    category: line.category ?? null,
    locked: LOCKED_STATUSES.has(String(line.status ?? 'draft')) || ACCEPTED_BUSINESS.has(businessStatus),
  };
}

function bucket(family: PhaseResourceFamily, lines: PhaseResourceLineDTO[]): PhaseResourceBucketDTO {
  const own = lines.filter((l) => l.family === family);
  const plannedCost = own.filter((l) => l.origin !== 'quote').reduce((s, l) => s + l.totalHt, 0);
  const engagedCost = own.filter((l) => l.origin === 'quote').reduce((s, l) => s + l.totalHt, 0);
  return { family, lines: own, count: own.length, plannedCost, engagedCost };
}

export class PhaseResourceLinkService {
  constructor(private readonly boq: IBoqRepository) {}

  async getPhaseResources(projectId: string, phaseId: string): Promise<PhasePlannedResourcesDTO> {
    const empty: PhasePlannedResourcesDTO = {
      projectId,
      phaseId,
      materials: bucket('material', []),
      equipment: bucket('equipment', []),
      labor: bucket('labor', []),
      totals: { plannedCost: 0, engagedCost: 0, lineCount: 0 },
      chain: { hasDqe: false, dqeValidated: false, tenderPublished: false, quotesReceived: 0, quoteAccepted: false, acceptedTotalHt: 0 },
      linkedToBoq: false,
    };
    if (!projectId || !phaseId) return empty;

    const safeList = async (filter: Parameters<IBoqRepository['list']>[0]) => {
      try {
        return await this.boq.list(filter);
      } catch {
        return [] as BoqLineDTO[];
      }
    };

    const [dqe, takeoff, bids] = await Promise.all([
      safeList({ source: 'dqe', contextId: projectId, projectId, phaseId }),
      safeList({ source: 'quantity_takeoff', contextId: projectId, projectId, phaseId }),
      safeList({ source: 'supplier_bid', contextId: projectId, projectId, phaseId }),
    ]);

    const acceptedBids = bids.filter((l) => ACCEPTED_BUSINESS.has(normalize(l.businessStatus)));
    const rawLines = [...dqe, ...takeoff, ...acceptedBids];
    const lines = rawLines.map(toResourceLine);

    const chain: PhaseChainStateDTO = {
      hasDqe: dqe.length > 0,
      dqeValidated: dqe.some((l) => LOCKED_STATUSES.has(String(l.status ?? 'draft'))),
      tenderPublished: [...dqe, ...bids].some((l) => PUBLISHED_BUSINESS.has(normalize(l.businessStatus))),
      quotesReceived: bids.length,
      quoteAccepted: acceptedBids.length > 0,
      acceptedTotalHt: acceptedBids.reduce(
        (s, l) => s + (Number(l.totalHt ?? (Number(l.quantity) || 0) * (Number(l.unitPrice ?? 0) || 0)) || 0),
        0,
      ),
    };

    const materials = bucket('material', lines);
    const equipment = bucket('equipment', lines);
    const labor = bucket('labor', lines);

    return {
      projectId,
      phaseId,
      materials,
      equipment,
      labor,
      totals: {
        plannedCost: materials.plannedCost + equipment.plannedCost + labor.plannedCost,
        engagedCost: materials.engagedCost + equipment.engagedCost + labor.engagedCost,
        lineCount: lines.length,
      },
      chain,
      linkedToBoq: lines.length > 0,
    };
  }
}

let instance: PhaseResourceLinkService | null = null;

export function getPhaseResourceLinkService(): PhaseResourceLinkService {
  if (!instance) instance = new PhaseResourceLinkService(boqRepository);
  return instance;
}
