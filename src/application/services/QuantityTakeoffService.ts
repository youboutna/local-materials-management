/**
 * Quantity Takeoff Service - Hexagonal Architecture
 * Business logic for quantity takeoff operations with comprehensive project management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { IQuantityTakeoffRepository } from '@/domain/repositories/IQuantityTakeoffRepository';
import { calculateQuantity } from '@/dtos/types/quantityTakeoff';

// Enhanced types for comprehensive quantity takeoff operations
export interface QuantityTakeoffWithDetails {
  id: string;
  project_id: string;
  material_id: string;
  element_type: string;
  unit: 'm³' | 'm²' | 'm' | 'unité';
  length: number;
  width?: number;
  height?: number;
  quantity: number;
  unit_price?: number;
  total_value?: number;
  material?: {
    id: string;
    name: string;
    unit: string;
    price_per_unit?: number;
    category: string;
    supplier?: string;
    availability_status: string;
    delivery_time?: number;
  };
  phase_id?: string;
  milestone_id?: string;
  inspection_required?: boolean;
  inspection_status?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface QuantityTakeoffStats {
  totalQuantityByUnit: Record<string, number>;
  totalValue: number;
  count: number;
  averageUnitPrice: number;
  materialBreakdown: Array<{
    material_id: string;
    material_name: string;
    total_quantity: number;
    total_value: number;
    unit: string;
  }>;
  phaseBreakdown: Array<{
    phase_id: string;
    phase_name: string;
    total_quantity: number;
    total_value: number;
    completion_percentage: number;
  }>;
  budgetUtilization: {
    allocated_budget: number;
    estimated_cost: number;
    utilization_percentage: number;
    variance: number;
  };
}

export interface CreateQuantityTakeoffRequestDto {
  project_id: string;
  material_id: string;
  element_type: string;
  unit: 'm³' | 'm²' | 'm' | 'unité';
  length: number;
  width?: number;
  height?: number;
  unit_price?: number;
  phase_id?: string;
  milestone_id?: string;
  note?: string;
}

export interface UpdateQuantityTakeoffRequestDto {
  quantity?: number;
  unit_price?: number;
  material_id?: string;
  phase_id?: string;
  milestone_id?: string;
  note?: string;
}

export interface QuantityTakeoffValidationResult {
  isValid: boolean;
  warnings: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  errors: Array<{
    type: string;
    message: string;
    field?: string;
  }>;
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

export class QuantityTakeoffService {
  constructor(
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository(),
    private materialRepository: IMaterialRepository = RepositoryFactory.getMaterialRepository(),
    private inspectionRepository: IInspectionRepository = RepositoryFactory.getInspectionRepository(),
    private documentRepository: IDocumentRepository = RepositoryFactory.getDocumentRepository(),
    private paymentRepository: IPaymentRepository = RepositoryFactory.getPaymentRepository(),
    private qtRepository: IQuantityTakeoffRepository = RepositoryFactory.getQuantityTakeoffRepository()
  ) {}

  /**
   * Get all quantity takeoffs for a project with comprehensive details
   */
  async getQuantityTakeoffsByProject(projectId: string): Promise<QuantityTakeoffWithDetails[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Get quantity takeoffs from repository (real hexagonal adapter)
      const takeoffs = await this.qtRepository.findByProjectId(projectId);

      if (!takeoffs || takeoffs.length === 0) {
        return [];
      }

      // Enhanced transformation with material details and business logic
      const enrichedTakeoffs = await Promise.all(
        takeoffs.map(async (takeoff: unknown) => {
          const takeoffData = takeoff as {
            id: string;
            project_id: string;
            material_id: string;
            element_type: string;
            unit: string;
            length: number;
            width?: number;
            height?: number;
            quantity: number;
            unit_price?: number;
            phase_id?: string;
            milestone_id?: string;
            note?: string;
            created_at: string;
            updated_at: string;
          };

          // Get material details
          const material = await this.getMaterialDetails(takeoffData.material_id);
          
          // Calculate quantity using BTP calculations
          const calculatedQuantity = calculateQuantity(
            takeoffData.length,
            takeoffData.width,
            takeoffData.height,
            takeoffData.unit
          );

          // Get inspection status if required
          let inspectionStatus;
          if (takeoffData.element_type && this.requiresInspection(takeoffData.element_type)) {
            inspectionStatus = await this.getInspectionStatus(takeoffData.id);
          }

          return {
            ...takeoffData,
            quantity: calculatedQuantity,
            unit: takeoffData.unit as 'm³' | 'm²' | 'm' | 'unité',
            total_value: takeoffData.unit_price ? calculatedQuantity * takeoffData.unit_price : undefined,
            material,
            inspection_required: this.requiresInspection(takeoffData.element_type),
            inspection_status: inspectionStatus
          };
        })
      );

      return enrichedTakeoffs;
    } catch (error) {
      console.error('QuantityTakeoffService.getQuantityTakeoffsByProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get quantity takeoffs');
    }
  }

  /**
   * Get comprehensive project statistics with business intelligence
   */
  async getProjectStats(projectId: string): Promise<QuantityTakeoffStats> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const takeoffs = await this.getQuantityTakeoffsByProject(projectId);
      
      // Material breakdown analysis
      const materialBreakdown = this.calculateMaterialBreakdown(takeoffs);
      
      // Phase breakdown analysis
      const phaseBreakdown = await this.calculatePhaseBreakdown(projectId, takeoffs);
      
      // Budget utilization analysis
      const budgetUtilization = await this.calculateBudgetUtilization(projectId, takeoffs);
      
      // Total quantities by unit
      const totalQuantityByUnit = takeoffs.reduce((acc, qt) => {
        const unit = qt.unit;
        acc[unit] = (acc[unit] || 0) + qt.quantity;
        return acc;
      }, {} as Record<string, number>);

      // Total value calculation
      const totalValue = takeoffs.reduce((sum, qt) => sum + (qt.total_value || 0), 0);
      
      // Average unit price
      const pricedTakeoffs = takeoffs.filter(qt => qt.unit_price !== undefined);
      const averageUnitPrice = pricedTakeoffs.length > 0 
        ? pricedTakeoffs.reduce((sum, qt) => sum + (qt.unit_price || 0), 0) / pricedTakeoffs.length 
        : 0;

      return {
        totalQuantityByUnit,
        totalValue,
        count: takeoffs.length,
        averageUnitPrice,
        materialBreakdown,
        phaseBreakdown,
        budgetUtilization
      };
    } catch (error) {
      console.error('QuantityTakeoffService.getProjectStats failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project stats');
    }
  }

  /**
   * Validate quantity takeoff with comprehensive business rules
   */
  async validateQuantityTakeoff(request: CreateQuantityTakeoffRequestDto): Promise<QuantityTakeoffValidationResult> {
    try {
      const warnings: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = [];
      const errors: Array<{ type: string; message: string; field?: string }> = [];
      const recommendations: Array<{ action: string; priority: 'low' | 'medium' | 'high'; description: string }> = [];

      // Basic validation
      if (!request.project_id) {
        errors.push({ type: 'validation', message: 'Project ID is required', field: 'project_id' });
      }
      if (!request.material_id) {
        errors.push({ type: 'validation', message: 'Material ID is required', field: 'material_id' });
      }
      if (!request.element_type) {
        errors.push({ type: 'validation', message: 'Element type is required', field: 'element_type' });
      }
      if (!request.unit) {
        errors.push({ type: 'validation', message: 'Unit is required', field: 'unit' });
      }
      if (!request.length || request.length <= 0) {
        errors.push({ type: 'validation', message: 'Length must be positive', field: 'length' });
      }

      // Material availability check
      const material = await this.getMaterialDetails(request.material_id);
      if (material && material.availability_status === 'out_of_stock') {
        errors.push({ type: 'material', message: `Material ${material.name} is out of stock`, field: 'material_id' });
      } else if (material && material.availability_status === 'limited') {
        warnings.push({ 
          type: 'material', 
          message: `Material ${material.name} has limited availability`, 
          severity: 'medium' 
        });
      }

      // Budget impact analysis
      const calculatedQuantity = calculateQuantity(request.length, request.width, request.height, request.unit);
      const estimatedCost = request.unit_price ? calculatedQuantity * request.unit_price : 0;
      
      if (estimatedCost > 100000) {
        warnings.push({ 
          type: 'budget', 
          message: `High cost item: ${estimatedCost.toLocaleString()}€`, 
          severity: 'high' 
        });
        recommendations.push({
          action: 'budget_review',
          priority: 'high',
          description: 'Review budget allocation for this high-cost item'
        });
      }

      // Phase and milestone validation
      if (request.phase_id) {
        const phaseValid = await this.validatePhaseForProject(request.project_id, request.phase_id);
        if (!phaseValid) {
          errors.push({ type: 'phase', message: 'Invalid phase for this project', field: 'phase_id' });
        }
      }

      if (request.milestone_id) {
        const milestoneValid = await this.validateMilestoneForProject(request.project_id, request.milestone_id);
        if (!milestoneValid) {
          errors.push({ type: 'milestone', message: 'Invalid milestone for this project', field: 'milestone_id' });
        }
      }

      // Inspection requirements
      if (this.requiresInspection(request.element_type)) {
        warnings.push({ 
          type: 'inspection', 
          message: 'This element type requires inspection', 
          severity: 'medium' 
        });
        recommendations.push({
          action: 'schedule_inspection',
          priority: 'medium',
          description: 'Schedule inspection for this element type'
        });
      }

      const isValid = errors.length === 0;

      return {
        isValid,
        warnings,
        errors,
        recommendations
      };
    } catch (error) {
      console.error('QuantityTakeoffService.validateQuantityTakeoff failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to validate quantity takeoff');
    }
  }

  /**
   * Create a new quantity takeoff with business logic
   */
  async createQuantityTakeoff(request: CreateQuantityTakeoffRequestDto): Promise<QuantityTakeoffWithDetails> {
    try {
      // Validate first
      const validation = await this.validateQuantityTakeoff(request);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Calculate quantity using BTP calculations
      const calculatedQuantity = calculateQuantity(request.length, request.width, request.height, request.unit);
      
      // Get material details
      const material = await this.getMaterialDetails(request.material_id);
      
      // Calculate total value
      const totalValue = request.unit_price ? calculatedQuantity * request.unit_price : undefined;

      // Create entity
      const now = new Date().toISOString();
      const takeoffData = {
        id: crypto.randomUUID(),
        project_id: request.project_id,
        material_id: request.material_id,
        element_type: request.element_type,
        unit: request.unit,
        length: request.length,
        width: request.width,
        height: request.height,
        quantity: calculatedQuantity,
        unit_price: request.unit_price,
        phase_id: request.phase_id,
        milestone_id: request.milestone_id,
        note: request.note,
        created_at: now,
        updated_at: now
      };

      // Save to repository (real hexagonal adapter)
      await this.qtRepository.create(takeoffData);

      // Create inspection if required
      if (this.requiresInspection(request.element_type)) {
        await this.createRequiredInspection(takeoffData.id, request.element_type);
      }

      // Return enriched result
      return {
        ...takeoffData,
        total_value: totalValue,
        material,
        inspection_required: this.requiresInspection(request.element_type),
        inspection_status: 'pending'
      };
    } catch (error) {
      console.error('QuantityTakeoffService.createQuantityTakeoff failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create quantity takeoff');
    }
  }

  // ============= HELPER METHODS FOR COMPREHENSIVE MANAGEMENT =============

  /**
   * Get material details with supplier and availability info
   */
  private async getMaterialDetails(materialId: string): Promise<QuantityTakeoffWithDetails['material']> {
    try {
      const material = await (this.materialRepository as unknown as { 
        findById: (id: string) => Promise<unknown> 
      }).findById(materialId);

      if (!material) {
        return undefined;
      }

      const materialData = material as {
        id: string;
        name: string;
        unit: string;
        price_per_unit?: number;
        category: string;
        supplier?: string;
        availability_status?: string;
        delivery_time?: number;
      };

      return {
        id: materialData.id,
        name: materialData.name,
        unit: materialData.unit,
        price_per_unit: materialData.price_per_unit,
        category: materialData.category,
        supplier: materialData.supplier || 'Unknown',
        availability_status: materialData.availability_status || 'unknown',
        delivery_time: materialData.delivery_time
      };
    } catch (error) {
      console.error('QuantityTakeoffService.getMaterialDetails failed:', error);
      return undefined;
    }
  }

  /**
   * Check if element type requires inspection
   */
  private requiresInspection(elementType: string): boolean {
    const inspectionRequiredTypes = [
      'concrete_slab',
      'concrete_column',
      'concrete_beam',
      'foundation',
      'structural_steel',
      'masonry_wall',
      'roofing',
      'electrical_installation',
      'plumbing_installation'
    ];
    
    return inspectionRequiredTypes.includes(elementType.toLowerCase());
  }

  /**
   * Get inspection status for quantity takeoff
   */
  private async getInspectionStatus(takeoffId: string): Promise<string> {
    try {
      const inspection = await (this.inspectionRepository as unknown as { 
        getByQuantityTakeoff: (id: string) => Promise<unknown> 
      }).getByQuantityTakeoff(takeoffId);
      
      return inspection ? (inspection as { status: string }).status : 'not_required';
    } catch (error) {
      console.error('QuantityTakeoffService.getInspectionStatus failed:', error);
      return 'unknown';
    }
  }

  /**
   * Calculate material breakdown analysis
   */
  private calculateMaterialBreakdown(takeoffs: QuantityTakeoffWithDetails[]): QuantityTakeoffStats['materialBreakdown'] {
    const materialMap = new Map<string, {
      material_name: string;
      total_quantity: number;
      total_value: number;
      unit: string;
    }>();

    takeoffs.forEach(qt => {
      const key = qt.material_id;
      const existing = materialMap.get(key);
      
      if (existing) {
        existing.total_quantity += qt.quantity;
        existing.total_value += qt.total_value || 0;
      } else {
        materialMap.set(key, {
          material_name: qt.material?.name || 'Unknown',
          total_quantity: qt.quantity,
          total_value: qt.total_value || 0,
          unit: qt.unit
        });
      }
    });

    return Array.from(materialMap.entries()).map(([material_id, data]) => ({
      material_id,
      ...data
    }));
  }

  /**
   * Calculate phase breakdown analysis
   */
  private async calculatePhaseBreakdown(projectId: string, takeoffs: QuantityTakeoffWithDetails[]): Promise<QuantityTakeoffStats['phaseBreakdown']> {
    try {
      const phases = await (this.projectRepository as unknown as { 
        getPhasesByProject: (id: string) => Promise<unknown[]> 
      }).getPhasesByProject(projectId);

      const phaseMap = new Map<string, {
        phase_name: string;
        total_quantity: number;
        total_value: number;
        completion_percentage: number;
      }>();

      takeoffs.forEach(qt => {
        if (qt.phase_id) {
          const key = qt.phase_id;
          const existing = phaseMap.get(key);
          
          if (existing) {
            existing.total_quantity += qt.quantity;
            existing.total_value += qt.total_value || 0;
          } else {
            const phase = (phases as unknown as Array<{ id: string; name: string; completion_percentage: number }>)?.find(p => p.id === qt.phase_id);
            phaseMap.set(key, {
              phase_name: phase?.name || 'Unknown Phase',
              total_quantity: qt.quantity,
              total_value: qt.total_value || 0,
              completion_percentage: phase?.completion_percentage || 0
            });
          }
        }
      });

      return Array.from(phaseMap.entries()).map(([phase_id, data]) => ({
        phase_id,
        ...data
      }));
    } catch (error) {
      console.error('QuantityTakeoffService.calculatePhaseBreakdown failed:', error);
      return [];
    }
  }

  /**
   * Calculate budget utilization analysis
   */
  private async calculateBudgetUtilization(projectId: string, takeoffs: QuantityTakeoffWithDetails[]): Promise<QuantityTakeoffStats['budgetUtilization']> {
    try {
      const project = await (this.projectRepository as unknown as { 
        findById: (id: string) => Promise<unknown> 
      }).findById(projectId);

      const projectData = project as {
        allocated_budget?: number;
        estimated_cost?: number;
      };

      const allocatedBudget = projectData.allocated_budget || 0;
      const estimatedCost = takeoffs.reduce((sum, qt) => sum + (qt.total_value || 0), 0);
      const utilizationPercentage = allocatedBudget > 0 ? (estimatedCost / allocatedBudget) * 100 : 0;
      const variance = allocatedBudget - estimatedCost;

      return {
        allocated_budget: allocatedBudget,
        estimated_cost: estimatedCost,
        utilization_percentage: Math.round(utilizationPercentage),
        variance
      };
    } catch (error) {
      console.error('QuantityTakeoffService.calculateBudgetUtilization failed:', error);
      return {
        allocated_budget: 0,
        estimated_cost: 0,
        utilization_percentage: 0,
        variance: 0
      };
    }
  }

  /**
   * Validate phase for project
   */
  private async validatePhaseForProject(projectId: string, phaseId: string): Promise<boolean> {
    try {
      const phases = await (this.projectRepository as unknown as { 
        getPhasesByProject: (id: string) => Promise<unknown[]> 
      }).getPhasesByProject(projectId);
      
      return (phases as unknown as Array<{ id: string; name: string; completion_percentage: number }>)?.some(p => p.id === phaseId) || false;
    } catch (error) {
      console.error('QuantityTakeoffService.validatePhaseForProject failed:', error);
      return false;
    }
  }

  /**
   * Validate milestone for project
   */
  private async validateMilestoneForProject(projectId: string, milestoneId: string): Promise<boolean> {
    try {
      const milestones = await (this.projectRepository as unknown as { 
        getMilestonesByProject: (id: string) => Promise<unknown[]> 
      }).getMilestonesByProject(projectId);
      
      return (milestones as unknown as Array<{ id: string }>)?.some(m => m.id === milestoneId) || false;
    } catch (error) {
      console.error('QuantityTakeoffService.validateMilestoneForProject failed:', error);
      return false;
    }
  }

  /**
   * Create required inspection for element type
   */
  private async createRequiredInspection(takeoffId: string, elementType: string): Promise<void> {
    try {
      const inspectionData = {
        id: crypto.randomUUID(),
        quantity_takeoff_id: takeoffId,
        element_type: elementType,
        status: 'pending',
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        created_at: new Date().toISOString()
      };

      await (this.inspectionRepository as unknown as { 
        create: (data: unknown) => Promise<void> 
      }).create(inspectionData);
    } catch (error) {
      console.error('QuantityTakeoffService.createRequiredInspection failed:', error);
      // Don't throw error - inspection creation is secondary
    }
  }

  /**
   * Delete a quantity takeoff
   */
  async deleteQuantityTakeoff(id: string): Promise<void> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Quantity takeoff ID is required');
      }

      await this.qtRepository.delete(id);
    } catch (error) {
      console.error('QuantityTakeoffService.deleteQuantityTakeoff failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete quantity takeoff');
    }
  }

  /**
   * Update a quantity takeoff
   */
  async updateQuantityTakeoff(id: string, updates: UpdateQuantityTakeoffRequestDto): Promise<QuantityTakeoffWithDetails> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Quantity takeoff ID is required');
      }
      if (!updates || Object.keys(updates).length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Update data is required');
      }

      // Get existing takeoff
      const existing = await (this.projectRepository as unknown as { 
        getQuantityTakeoffById: (id: string) => Promise<unknown> 
      }).getQuantityTakeoffById(id);

      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Quantity takeoff not found');
      }

      const existingData = existing as QuantityTakeoffWithDetails;

      // Calculate new quantity if dimensions changed
      let newQuantity = existingData.quantity;
      if (updates.quantity !== undefined) {
        newQuantity = updates.quantity;
      }

      // Update entity
      const updateData = {
        ...updates,
        quantity: newQuantity,
        total_value: updates.unit_price ? newQuantity * updates.unit_price : existingData.total_value,
        updated_at: new Date().toISOString()
      };

      await (this.projectRepository as unknown as { 
        updateQuantityTakeoff: (id: string, data: unknown) => Promise<void> 
      }).updateQuantityTakeoff(id, updateData);

      // Return updated entity
      return {
        ...existingData,
        ...updateData
      };
    } catch (error) {
      console.error('QuantityTakeoffService.updateQuantityTakeoff failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update quantity takeoff');
    }
  }

  /**
   * Calculate total quantity by unit
   */
  async getTotalQuantityByUnit(projectId: string, unit: string): Promise<number> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }
      if (!unit) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Unit is required');
      }

      const takeoffs = await this.getQuantityTakeoffsByProject(projectId);
      return takeoffs
        .filter(qt => qt.unit === unit)
        .reduce((sum, qt) => sum + qt.quantity, 0);
    } catch (error) {
      console.error('QuantityTakeoffService.getTotalQuantityByUnit failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get total quantity by unit');
    }
  }

  /**
   * Calculate total value for a project
   */
  async getTotalValue(projectId: string): Promise<number> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const takeoffs = await this.getQuantityTakeoffsByProject(projectId);
      return takeoffs.reduce((sum, qt) => sum + (qt.total_value || 0), 0);
    } catch (error) {
      console.error('QuantityTakeoffService.getTotalValue failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get total value');
    }
  }
}
