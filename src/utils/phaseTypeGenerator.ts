/**
 * Dynamic Phase Type Generator
 * Generates PhaseType based on referential data and custom dynamic approach
 */

import { PhaseType } from '@/dtos/entities/PhaseDTO';
import { ReferentialPhase, ReferentialStep, ReferentialTask } from '@/config/referentials';

// Dynamic Phase Type mapping based on referential patterns
const REFERENTIAL_PHASE_TYPE_MAPPING: Record<string, PhaseType> = {
  'foundation_work': PhaseType.FOUNDATION,
  'excavation': PhaseType.EXCAVATION,
  'demolition': PhaseType.DEMOLITION,
  'structural_work': PhaseType.STRUCTURAL,
  'finishing': PhaseType.FINISHING,
  'electrical': PhaseType.ELECTRICAL,
  'plumbing': PhaseType.PLUMBING,
  'hvac': PhaseType.HVAC,
  'roofing': PhaseType.ROOFING,
  'exterior': PhaseType.EXTERIOR,
  'interior': PhaseType.INTERIOR,
  'landscaping': PhaseType.LANDSCAPING,
  // Additional mappings for referential codes
  'foundation': PhaseType.FOUNDATION,
  'structure': PhaseType.STRUCTURAL,
  'infra': PhaseType.STRUCTURAL,
  'electric': PhaseType.ELECTRICAL,
  'water': PhaseType.PLUMBING,
  'civil': PhaseType.STRUCTURAL,
  'building': PhaseType.STRUCTURAL
};

/**
 * Generate PhaseType from referential phase code
 */
export function generatePhaseTypeFromReferential(phaseCode: string, phaseLabel?: string): PhaseType {
  // Try to match by code first
  const mappedType = REFERENTIAL_PHASE_TYPE_MAPPING[phaseCode.toLowerCase()];
  if (mappedType) {
    return mappedType;
  }
  
  // Try to match by label keywords
  if (phaseLabel) {
    const labelLower = phaseLabel.toLowerCase();
    for (const [keyword, phaseType] of Object.entries(REFERENTIAL_PHASE_TYPE_MAPPING)) {
      if (labelLower.includes(keyword)) {
        return phaseType;
      }
    }
  }
  
  // Default to STRUCTURAL for unknown phases
  return PhaseType.STRUCTURAL;
}

/**
 * Generate PhaseType dynamically based on phase characteristics
 */
export function generateDynamicPhaseType(
  phaseName: string,
  description?: string,
  tasks?: ReferentialTask[]
): PhaseType {
  const nameLower = phaseName.toLowerCase();
  const descLower = (description || '').toLowerCase();
  
  // Analyze phase characteristics
  const characteristics = {
    isFoundation: nameLower.includes('foundation') || nameLower.includes('fondation') || descLower.includes('foundation'),
    isExcavation: nameLower.includes('excav') || nameLower.includes('terrassement') || descLower.includes('excav'),
    isDemolition: nameLower.includes('demol') || nameLower.includes('démolition') || descLower.includes('demol'),
    isStructural: nameLower.includes('struct') || nameLower.includes('structure') || nameLower.includes('béton') || nameLower.includes('charpente'),
    isFinishing: nameLower.includes('finish') || nameLower.includes('finition') || nameLower.includes('peinture') || nameLower.includes('revêtement'),
    isElectrical: nameLower.includes('electric') || nameLower.includes('électric') || nameLower.includes('courant') || descLower.includes('electric'),
    isPlumbing: nameLower.includes('plumb') || nameLower.includes('plomberie') || nameLower.includes('eau') || descLower.includes('water'),
    isHVAC: nameLower.includes('clim') || nameLower.includes('hvac') || nameLower.includes('chauffage') || nameLower.includes('ventilation'),
    isRoofing: nameLower.includes('roof') || nameLower.includes('toiture') || nameLower.includes('couverture'),
    isExterior: nameLower.includes('exterior') || nameLower.includes('façade') || nameLower.includes('paysage'),
    isInterior: nameLower.includes('interior') || nameLower.includes('intérieur') || nameLower.includes('aménagement'),
    isLandscaping: nameLower.includes('landscap') || nameLower.includes('jardin') || nameLower.includes('espaces verts')
  };
  
  // Analyze task characteristics
  if (tasks && tasks.length > 0) {
    const taskAnalysis = {
      hasElectricalTasks: tasks.some(task => task.label?.en?.toLowerCase().includes('electric') || task.label?.fr?.toLowerCase().includes('électric')),
      hasPlumbingTasks: tasks.some(task => task.label?.en?.toLowerCase().includes('plumb') || task.label?.fr?.toLowerCase().includes('plomberie')),
      hasFoundationTasks: tasks.some(task => task.label?.en?.toLowerCase().includes('foundation') || task.label?.fr?.toLowerCase().includes('fondation')),
      hasStructuralTasks: tasks.some(task => task.label?.en?.toLowerCase().includes('struct') || task.label?.fr?.toLowerCase().includes('structure')),
      hasFinishingTasks: tasks.some(task => task.label?.en?.toLowerCase().includes('finish') || task.label?.fr?.toLowerCase().includes('finition')),
      hasRoofingTasks: tasks.some(task => task.label?.en?.toLowerCase().includes('roof') || task.label?.fr?.toLowerCase().includes('toiture'))
    };
    
    // Override based on task analysis
    if (taskAnalysis.hasElectricalTasks) return PhaseType.ELECTRICAL;
    if (taskAnalysis.hasPlumbingTasks) return PhaseType.PLUMBING;
    if (taskAnalysis.hasFoundationTasks) return PhaseType.FOUNDATION;
    if (taskAnalysis.hasStructuralTasks) return PhaseType.STRUCTURAL;
    if (taskAnalysis.hasFinishingTasks) return PhaseType.FINISHING;
    if (taskAnalysis.hasRoofingTasks) return PhaseType.ROOFING;
  }
  
  // Priority-based determination
  if (characteristics.isFoundation) return PhaseType.FOUNDATION;
  if (characteristics.isExcavation) return PhaseType.EXCAVATION;
  if (characteristics.isDemolition) return PhaseType.DEMOLITION;
  if (characteristics.isElectrical) return PhaseType.ELECTRICAL;
  if (characteristics.isPlumbing) return PhaseType.PLUMBING;
  if (characteristics.isHVAC) return PhaseType.HVAC;
  if (characteristics.isRoofing) return PhaseType.ROOFING;
  if (characteristics.isFinishing) return PhaseType.FINISHING;
  if (characteristics.isExterior) return PhaseType.EXTERIOR;
  if (characteristics.isInterior) return PhaseType.INTERIOR;
  if (characteristics.isLandscaping) return PhaseType.LANDSCAPING;
  if (characteristics.isStructural) return PhaseType.STRUCTURAL;
  
  // Default fallback
  return PhaseType.STRUCTURAL;
}

/**
 * Generate PhaseType from referential phase with dynamic fallback
 */
export function generatePhaseTypeFromReferentialPhase(
  referentialPhase: ReferentialPhase,
  customPhaseType?: PhaseType
): PhaseType {
  // If custom type is provided, use it
  if (customPhaseType) {
    return customPhaseType;
  }
  
  // Try referential-based generation first
  const referentialType = generatePhaseTypeFromReferential(
    referentialPhase.code,
    referentialPhase.label?.en || referentialPhase.label?.fr
  );
  
  // If referential mapping failed, try dynamic generation
  if (referentialType === PhaseType.STRUCTURAL) {
    return generateDynamicPhaseType(
      referentialPhase.label?.en || referentialPhase.label?.fr || '',
      referentialPhase.description?.en || referentialPhase.description?.fr,
      referentialPhase.steps?.flatMap(step => step.tasks)
    );
  }
  
  return referentialType;
}

/**
 * Get all available PhaseTypes for selection
 */
export function getAllPhaseTypes(): Array<{ value: PhaseType; label: string; description: string }> {
  return [
    { value: PhaseType.FOUNDATION, label: 'Foundation', description: 'Foundation and groundwork phases' },
    { value: PhaseType.STRUCTURAL, label: 'Structural', description: 'Structural work and framing' },
    { value: PhaseType.EXCAVATION, label: 'Excavation', description: 'Excavation and earthwork' },
    { value: PhaseType.DEMOLITION, label: 'Demolition', description: 'Demolition and removal' },
    { value: PhaseType.FINISHING, label: 'Finishing', description: 'Interior and exterior finishing' },
    { value: PhaseType.ELECTRICAL, label: 'Electrical', description: 'Electrical systems and wiring' },
    { value: PhaseType.PLUMBING, label: 'Plumbing', description: 'Plumbing and water systems' },
    { value: PhaseType.HVAC, label: 'HVAC', description: 'Heating, ventilation, and air conditioning' },
    { value: PhaseType.ROOFING, label: 'Roofing', description: 'Roofing and waterproofing' },
    { value: PhaseType.EXTERIOR, label: 'Exterior', description: 'Exterior work and landscaping' },
    { value: PhaseType.INTERIOR, label: 'Interior', description: 'Interior finishing and fixtures' },
    { value: PhaseType.LANDSCAPING, label: 'Landscaping', description: 'Landscaping and outdoor spaces' }
  ];
}

/**
 * Validate if a PhaseType is compatible with referential data
 */
export function validatePhaseTypeCompatibility(
  phaseType: PhaseType,
  referentialPhase?: ReferentialPhase
): { isValid: boolean; reason?: string } {
  if (!referentialPhase) {
    return { isValid: true }; // No referential to validate against
  }
  
  // Check if the phase type makes sense for the referential
  const generatedType = generatePhaseTypeFromReferentialPhase(referentialPhase);
  
  // Allow exact matches
  if (generatedType === phaseType) {
    return { isValid: true };
  }
  
  // Allow STRUCTURAL as a fallback for most types
  if (phaseType === PhaseType.STRUCTURAL) {
    return { isValid: true };
  }
  
  // Special compatibility rules
  const compatibilityRules: Record<PhaseType, PhaseType[]> = {
    [PhaseType.FOUNDATION]: [PhaseType.STRUCTURAL],
    [PhaseType.STRUCTURAL]: [PhaseType.FOUNDATION, PhaseType.EXCAVATION],
    [PhaseType.EXCAVATION]: [PhaseType.FOUNDATION, PhaseType.STRUCTURAL],
    [PhaseType.ELECTRICAL]: [PhaseType.INTERIOR, PhaseType.FINISHING],
    [PhaseType.PLUMBING]: [PhaseType.INTERIOR, PhaseType.FINISHING],
    [PhaseType.HVAC]: [PhaseType.INTERIOR, PhaseType.FINISHING],
    [PhaseType.FINISHING]: [PhaseType.INTERIOR, PhaseType.EXTERIOR],
    [PhaseType.ROOFING]: [PhaseType.EXTERIOR, PhaseType.STRUCTURAL],
    [PhaseType.EXTERIOR]: [PhaseType.LANDSCAPING, PhaseType.FINISHING],
    [PhaseType.INTERIOR]: [PhaseType.FINISHING],
    [PhaseType.LANDSCAPING]: [PhaseType.EXTERIOR]
  };
  
  const compatibleTypes = compatibilityRules[phaseType] || [];
  if (compatibleTypes.includes(generatedType)) {
    return { isValid: true };
  }
  
  return { 
    isValid: false, 
    reason: `Phase type ${phaseType} may not be compatible with referential phase ${referentialPhase.code}. Consider using ${generatedType} instead.` 
  };
}
