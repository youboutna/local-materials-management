import { describe, it, expect } from 'vitest';
import {
  ProjectResourceAggregatorService,
  normalizeResourceFamily,
} from '@/application/services/ProjectResourceAggregatorService';

describe('ProjectResourceAggregatorService', () => {
  const service = new ProjectResourceAggregatorService();

  it('normalise les familles de ressources hétérogènes', () => {
    expect(normalizeResourceFamily('labor')).toBe('human');
    expect(normalizeResourceFamily("Main d'œuvre")).toBe('human');
    expect(normalizeResourceFamily('equipment')).toBe('equipment');
    expect(normalizeResourceFamily('engin de chantier')).toBe('equipment');
    expect(normalizeResourceFamily('ciment')).toBe('material');
  });

  it('agrège le planifié (phases/DQE) et le consommé (exécution)', () => {
    const container = service.aggregate({
      projectId: 'p1',
      phases: [
        {
          id: 'ph1',
          name: 'Travaux',
          dqeLines: [
            { designation: 'Béton B25', unit: 'm3', quantity: 10, unitPrice: 1000, resourceType: 'material' },
            { designation: 'Maçon', unit: 'h', quantity: 100, unitPrice: 50, resourceType: 'labor' },
          ],
          humanResources: [{ role: 'Chef de chantier', quantity: 1, costPerHour: 200 }],
        },
      ],
      executedMaterials: [{ name: 'Béton B25', unit: 'm3', quantityUsed: 8, unitPrice: 1000 }],
      executedResources: [{ name: 'Maçon', type: 'labor', quantityUsed: 90, costPerUnit: 50 }],
    });

    expect(container.materials.plannedCost).toBe(10000);
    expect(container.materials.actualCost).toBe(8000);
    expect(container.human.plannedCost).toBe(5200);
    expect(container.human.actualCost).toBe(4500);
    expect(container.totals.plannedCost).toBe(15200);
    expect(container.totals.consumptionRate).toBeGreaterThan(0);
  });

  it('retourne un conteneur vide sans données', () => {
    const container = service.aggregate({ projectId: 'p1' });
    expect(container.totals.lineCount).toBe(0);
    expect(container.totals.consumptionRate).toBe(0);
  });
  it('does not count allocated or delivered quantities as consumption', () => {
    const result=service.aggregate({projectId:'p',executedResources:[{name:'Expert',quantity:22}],executedMaterials:[{name:'Fuel',quantity:100}],executedTasks:[{title:'Task',status:'completed',estimatedDuration:10,progress:100}]});
    expect(result.totals.actualCost).toBe(0);
    expect(result.totals.lineCount).toBe(0);
  });
  it('deduplicates a planned BOQ line exposed in both project and phase', () => {
    const line={id:'line',designation:'Fuel',quantity:100,unit:'L',unitPrice:2,phaseId:'ph'};
    const result=service.aggregate({projectId:'p',phases:[{id:'ph',dqeLines:[line]}],boqLines:[line]});
    expect(result.materials.plannedCost).toBe(200);
  });
  it('does not combine different measurement units', () => {
    const result=service.aggregate({projectId:'p',boqLines:[{designation:'Expert',resourceType:'labor',unit:'h',quantity:8},{designation:'Expert',resourceType:'labor',unit:'j',quantity:1}]});
    expect(result.human.lines).toHaveLength(2);
  });
});
