/**
 * ProjectResourceAggregatorService — moteur d'agrégation du conteneur « Ressources ».
 *
 * Pur TypeScript (aucun React, aucun accès Supabase) conformément aux règles
 * d'architecture : les données arrivent déjà sous forme de DTO camelCase.
 *
 * Sémantique :
 *  - PLANIFIÉ  ← détails de phases : lignes DQE (resourceType material|labor|equipment),
 *                matériaux et ressources humaines déclarés sur la phase.
 *  - RÉALISÉ   ← exécution : project_resources (humains/équipements affectés) et
 *                project_materials (matériaux livrés / consommés).
 */
import type {
  ProjectResourceAggregationInput,
  ProjectResourceContainerDTO,
  ResourceFamily,
  ResourceFamilyBucketDTO,
  ResourceLineDTO,
} from '@/dtos/entities/ProjectResourceContainerDTO';

type Row = Record<string, unknown>;

const FAMILY_LABELS: Record<ResourceFamily, string> = {
  human: 'Ressources humaines',
  material: 'Matériaux',
  equipment: 'Matériel & équipements',
};

const num = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const str = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
};

/** Normalise un type hétérogène (DQE `labor`, DB `human`, `main d'oeuvre`…). */
export function normalizeResourceFamily(raw: unknown): ResourceFamily {
  const value = String(raw ?? '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

  if (!value || value === '_') return 'material';
  if (/(labor|labour|human|humain|main_?d_?oeuvre|main_?oeuvre|oeuvre|personnel|employe|team|equipe)/.test(value)) return 'human';
  if (/(equip|engin|machine|vehicule|outil|tool)/.test(value)) return 'equipment';
  return 'material';
}

const makeKey = (family: ResourceFamily, name: string, materialId?: string) =>
  `${family}::${materialId ?? name.toLowerCase()}`;

class Accumulator {
  private readonly lines = new Map<string, ResourceLineDTO>();

  add(partial: {
    family: ResourceFamily;
    name: string;
    unit?: string;
    origin: ResourceLineDTO['origin'];
    phaseId?: string;
    phaseName?: string;
    materialId?: string;
    plannedQuantity?: number;
    plannedCost?: number;
    actualQuantity?: number;
    actualCost?: number;
  }): void {
    const key = makeKey(partial.family, partial.name, partial.materialId);
    const existing = this.lines.get(key);
    if (existing) {
      existing.plannedQuantity += partial.plannedQuantity ?? 0;
      existing.plannedCost += partial.plannedCost ?? 0;
      existing.actualQuantity += partial.actualQuantity ?? 0;
      existing.actualCost += partial.actualCost ?? 0;
      existing.unit = existing.unit ?? partial.unit;
      existing.phaseName = existing.phaseName ?? partial.phaseName;
      return;
    }
    this.lines.set(key, {
      id: key,
      name: partial.name,
      family: partial.family,
      unit: partial.unit,
      origin: partial.origin,
      phaseId: partial.phaseId,
      phaseName: partial.phaseName,
      materialId: partial.materialId,
      plannedQuantity: partial.plannedQuantity ?? 0,
      plannedCost: partial.plannedCost ?? 0,
      actualQuantity: partial.actualQuantity ?? 0,
      actualCost: partial.actualCost ?? 0,
      costVariance: 0,
      consumptionRate: 0,
    });
  }

  finalize(): ResourceLineDTO[] {
    return Array.from(this.lines.values())
      .map((line) => ({
        ...line,
        costVariance: line.actualCost - line.plannedCost,
        consumptionRate: line.plannedCost > 0 ? Math.round((line.actualCost / line.plannedCost) * 100) : 0,
      }))
      .sort((a, b) => b.plannedCost - a.plannedCost || a.name.localeCompare(b.name));
  }
}

function buildBucket(family: ResourceFamily, lines: ResourceLineDTO[]): ResourceFamilyBucketDTO {
  const scoped = lines.filter((line) => line.family === family);
  const plannedCost = scoped.reduce((sum, line) => sum + line.plannedCost, 0);
  const actualCost = scoped.reduce((sum, line) => sum + line.actualCost, 0);
  return {
    family,
    label: FAMILY_LABELS[family],
    lines: scoped,
    plannedCost,
    actualCost,
    costVariance: actualCost - plannedCost,
    consumptionRate: plannedCost > 0 ? Math.round((actualCost / plannedCost) * 100) : 0,
    lineCount: scoped.length,
  };
}

export class ProjectResourceAggregatorService {
  /** Construit le conteneur sémantique « Ressources » (planifié + réalisé). */
  aggregate(input: ProjectResourceAggregationInput): ProjectResourceContainerDTO {
    const acc = new Accumulator();
    const phases = (input.phases ?? []) as Row[];

    // 1. PLANIFICATION — lignes DQE portées par les phases
    for (const phase of phases) {
      const phaseId = str(phase.id);
      const phaseName = str(phase.name) ?? str(phase.phaseName) ?? str(phase.phase_name);

      const dqeLines = (Array.isArray(phase.dqeLines) ? phase.dqeLines : []) as Row[];
      for (const line of dqeLines) {
        this.addPlannedBoqLine(acc, line, phaseId, phaseName);
      }

      // Matériaux déclarés au niveau phase
      const phaseMaterials = (Array.isArray(phase.materials) ? phase.materials : []) as unknown[];
      for (const raw of phaseMaterials) {
        if (typeof raw === 'string') continue; // simple référence d'ID, pas de quantité
        const material = raw as Row;
        const quantity = num(material.quantity);
        const unitCost = num(material.unitPrice ?? material.pricePerUnit ?? material.costPerUnit);
        acc.add({
          family: normalizeResourceFamily(material.category ?? material.type ?? 'material'),
          name: str(material.name) ?? str(material.designation) ?? 'Matériau',
          unit: str(material.unit),
          origin: 'phase',
          phaseId,
          phaseName,
          materialId: str(material.materialId ?? material.id),
          plannedQuantity: quantity,
          plannedCost: quantity * unitCost,
        });
      }

      // Ressources humaines déclarées au niveau phase
      const humanRaw = phase.humanResources;
      const humanList = (Array.isArray(humanRaw) ? humanRaw : []) as Row[];
      for (const human of humanList) {
        const quantity = num(human.quantity) || 1;
        const unitCost = num(human.costPerHour ?? human.dailyRate ?? human.unitPrice);
        acc.add({
          family: 'human',
          name: str(human.role) ?? str(human.name) ?? str(human.roleId) ?? 'Ressource humaine',
          unit: str(human.unit) ?? 'h',
          origin: 'phase',
          phaseId,
          phaseName,
          plannedQuantity: quantity,
          plannedCost: quantity * unitCost,
        });
      }
    }

    // 2. PLANIFICATION — lignes DQE au niveau projet
    for (const line of (input.boqLines ?? []) as Row[]) {
      const phaseId = str(line.phaseId);
      const phaseName = phases.find((p) => str(p.id) === phaseId)
        ? str(phases.find((p) => str(p.id) === phaseId)!.name)
        : undefined;
      this.addPlannedBoqLine(acc, line, phaseId, phaseName);
    }

    // 3. EXÉCUTION — ressources affectées / consommées
    for (const resource of (input.executedResources ?? []) as Row[]) {
      const quantity = num(resource.quantity) || 1;
      const unitCost = num(resource.costPerUnit ?? resource.cost_per_unit ?? resource.costPerHour);
      const total = num(resource.totalCost ?? resource.total_cost) || quantity * unitCost;
      acc.add({
        family: normalizeResourceFamily(resource.type),
        name: str(resource.name) ?? 'Ressource',
        unit: str(resource.unit),
        origin: 'execution',
        phaseId: str(resource.phaseId ?? resource.phase_id),
        actualQuantity: quantity,
        actualCost: total,
      });
    }

    // 4. EXÉCUTION — matériaux livrés / consommés
    for (const material of (input.executedMaterials ?? []) as Row[]) {
      const quantity = num(material.quantityUsed ?? material.quantity_used ?? material.quantity);
      const unitCost = num(material.unitPrice ?? material.unit_price ?? material.pricePerUnit);
      const total = num(material.totalCost ?? material.total_cost) || quantity * unitCost;
      acc.add({
        family: normalizeResourceFamily(material.category ?? material.type ?? 'material'),
        name: str(material.name) ?? str(material.materialName) ?? str(material.material_name) ?? 'Matériau',
        unit: str(material.unit),
        origin: 'execution',
        phaseId: str(material.phaseId ?? material.phase_id),
        materialId: str(material.materialId ?? material.material_id),
        actualQuantity: quantity,
        actualCost: total,
      });
    }

    const lines = acc.finalize();
    const human = buildBucket('human', lines);
    const materials = buildBucket('material', lines);
    const equipment = buildBucket('equipment', lines);
    const plannedCost = human.plannedCost + materials.plannedCost + equipment.plannedCost;
    const actualCost = human.actualCost + materials.actualCost + equipment.actualCost;

    return {
      projectId: input.projectId,
      human,
      materials,
      equipment,
      totals: {
        plannedCost,
        actualCost,
        costVariance: actualCost - plannedCost,
        consumptionRate: plannedCost > 0 ? Math.round((actualCost / plannedCost) * 100) : 0,
        lineCount: lines.length,
      },
    };
  }

  private addPlannedBoqLine(
    acc: Accumulator,
    line: Row,
    phaseId?: string,
    phaseName?: string,
  ): void {
    const quantity = num(line.quantity);
    const unitPrice = num(line.unitPrice ?? line.unit_price);
    const totalHt = num(line.totalHt ?? line.total_ht) || quantity * unitPrice;
    acc.add({
      family: normalizeResourceFamily(line.resourceType ?? line.resource_type),
      name: str(line.designation) ?? str(line.name) ?? 'Ligne DQE',
      unit: str(line.unit),
      origin: 'dqe',
      phaseId: str(line.phaseId ?? line.phase_id) ?? phaseId,
      phaseName,
      materialId: str(line.materialId ?? line.material_id),
      plannedQuantity: quantity,
      plannedCost: totalHt,
    });
  }
}

let instance: ProjectResourceAggregatorService | null = null;

export function getProjectResourceAggregatorService(): ProjectResourceAggregatorService {
  if (!instance) instance = new ProjectResourceAggregatorService();
  return instance;
}
