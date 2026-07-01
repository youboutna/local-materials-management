/**
 * Contract Rate Referential
 * Correspondance entre références contractuelles prestataires et codes DQE,
 * pour appliquer automatiquement les bons tarifs lors du chiffrage.
 *
 * Les tarifs réels sont stockés côté module Fournisseurs — ce référentiel
 * fournit uniquement les RÈGLES DE MATCHING et les défauts.
 *
 * @see docs/ARCHITECTURE_REFERENTIELS.md
 */

export interface ContractRateBinding {
  /** Réf contrat fournisseur (convention-cadre, marché). */
  contractRef: string;
  /** Code prestataire (id supplier). */
  supplierId: string;
  /** Codes DQE couverts par ce contrat (préfixes ou exacts). */
  coveredItemCodes: string[];
  /** Tarif par défaut (utilisé si le module fournisseur ne renvoie pas de valeur). */
  defaultUnitPrice?: number;
  defaultCurrency?: string;
  /** Conditions particulières libres. */
  conditions?: string;
}

export interface ContractRateResolution {
  contractRef?: string;
  supplierId?: string;
  unitPrice?: number;
  currency?: string;
  source: 'contract_binding' | 'supplier_catalog' | 'manual_override' | 'unresolved';
}

/**
 * Résout le tarif à appliquer pour une ligne DQE.
 * L'implémentation réelle interrogera le SupplierRepository ; ici on encapsule la stratégie.
 */
export function resolveContractRate(
  itemCode: string,
  bindings: ContractRateBinding[],
  overrides?: { unitPrice?: number; supplierId?: string; contractRef?: string },
): ContractRateResolution {
  if (overrides?.unitPrice != null) {
    return {
      unitPrice: overrides.unitPrice,
      supplierId: overrides.supplierId,
      contractRef: overrides.contractRef,
      source: 'manual_override',
    };
  }
  const binding = bindings.find((b) => b.coveredItemCodes.some((c) => itemCode.startsWith(c)));
  if (binding) {
    return {
      contractRef: binding.contractRef,
      supplierId: binding.supplierId,
      unitPrice: binding.defaultUnitPrice,
      currency: binding.defaultCurrency ?? 'MRU',
      source: binding.defaultUnitPrice != null ? 'contract_binding' : 'supplier_catalog',
    };
  }
  return { source: 'unresolved' };
}
