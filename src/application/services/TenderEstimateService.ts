import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { ITenderEstimateRepository } from '@/domain/repositories/ITenderEstimateRepository';
import { TenderEstimate, TenderEstimateItem } from '@/domain/entities/PerformanceMonitoring';
import { 
  TenderEstimateDTO, 
  TenderEstimateItemDTO,
  TenderEstimateCreateDTO,
  TenderEstimateItemCreateDTO,
  UpdateTenderEstimateRequestDto,
  UpdateTenderEstimateItemRequestDto
} from '@/dtos/transforms/shared';
import { TenderEstimateDomainTransformer, TenderEstimateItemDomainTransformer } from '@/dtos/transforms/PerformanceMonitoringDomainTransformer';

export class TenderEstimateService {
  private tenderEstimateRepository: ITenderEstimateRepository;
  private tenderEstimateTransformer: TenderEstimateDomainTransformer;
  private tenderEstimateItemTransformer: TenderEstimateItemDomainTransformer;

  constructor() {
    this.tenderEstimateRepository = RepositoryFactory.getTenderEstimateRepository();
    this.tenderEstimateTransformer = new TenderEstimateDomainTransformer();
    this.tenderEstimateItemTransformer = new TenderEstimateItemDomainTransformer();
  }

  /**
   * Create a new tender estimate
   * Only the creator will have access via RLS
   */
  async createEstimate(estimate: TenderEstimateCreateDTO): Promise<TenderEstimateDTO> {
    try {
      // Validate data
      const validation = this.tenderEstimateTransformer.validate(estimate);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const entity = this.tenderEstimateTransformer.fromCreateDtoToEntity(estimate);
      const createdEstimate = await this.tenderEstimateRepository.create(entity);
      return this.tenderEstimateTransformer.toDTO(createdEstimate);
    } catch (error) {
      console.error('Error creating estimate:', error);
      throw new Error(`Failed to create estimate: ${error.message}`);
    }
  }

  /**
   * Get estimates by tender ID
   * RLS will filter to show only user's own estimates + admin can see all
   */
  async getEstimatesByTenderId(tenderId: string): Promise<TenderEstimateDTO[]> {
    try {
      const estimates = await this.tenderEstimateRepository.findByTenderId(tenderId);
      return estimates.map(estimate => this.tenderEstimateTransformer.toDTO(estimate));
    } catch (error) {
      console.error('Error getting estimates by tender ID:', error);
      throw new Error(`Failed to get estimates by tender ID: ${error.message}`);
    }
  }

  /**
   * Get estimate by ID
   * RLS will check if user is the creator or admin
   */
  async getEstimateById(id: string): Promise<TenderEstimateDTO | null> {
    try {
      const estimate = await this.tenderEstimateRepository.findById(id);
      return estimate ? this.tenderEstimateTransformer.toDTO(estimate) : null;
    } catch (error) {
      console.error('Error getting estimate by ID:', error);
      throw new Error(`Failed to get estimate by ID: ${error.message}`);
    }
  }

  /**
   * Update estimate
   * RLS will check if user is the creator or admin
   */
  async updateEstimate(id: string, updates: UpdateTenderEstimateRequestDto): Promise<TenderEstimateDTO> {
    try {
      // Validate data
      const validation = this.tenderEstimateTransformer.validate(updates);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const entityUpdates = this.tenderEstimateTransformer.fromUpdateDtoToEntity(updates);
      const updatedEstimate = await this.tenderEstimateRepository.update(id, entityUpdates);
      return this.tenderEstimateTransformer.toDTO(updatedEstimate);
    } catch (error) {
      console.error('Error updating estimate:', error);
      throw new Error(`Failed to update estimate: ${error.message}`);
    }
  }

  /**
   * Delete estimate
   * RLS will check if user is the creator or admin
   */
  async deleteEstimate(id: string): Promise<void> {
    try {
      await this.tenderEstimateRepository.delete(id);
    } catch (error) {
      console.error('Error deleting estimate:', error);
      throw new Error(`Failed to delete estimate: ${error.message}`);
    }
  }

  /**
   * Create estimate item
   */
  async createEstimateItem(item: TenderEstimateItemCreateDTO): Promise<TenderEstimateItemDTO> {
    try {
      // Validate data
      const validation = this.tenderEstimateItemTransformer.validate(item);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const entity = this.tenderEstimateItemTransformer.fromCreateDtoToEntity(item);
      const createdItem = await this.tenderEstimateRepository.createItem(entity);
      return this.tenderEstimateItemTransformer.toDTO(createdItem);
    } catch (error) {
      console.error('Error creating estimate item:', error);
      throw new Error(`Failed to create estimate item: ${error.message}`);
    }
  }

  /**
   * Get estimate items by estimate ID
   */
  async getEstimateItems(estimateId: string): Promise<TenderEstimateItemDTO[]> {
    try {
      const items = await this.tenderEstimateRepository.findItemsByEstimateId(estimateId);
      return items.map(item => this.tenderEstimateItemTransformer.toDTO(item));
    } catch (error) {
      console.error('Error getting estimate items:', error);
      throw new Error(`Failed to get estimate items: ${error.message}`);
    }
  }

  /**
   * Update estimate item
   */
  async updateEstimateItem(id: string, updates: UpdateTenderEstimateItemRequestDto): Promise<TenderEstimateItemDTO> {
    try {
      // Validate data
      const validation = this.tenderEstimateItemTransformer.validate(updates);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const entityUpdates = this.tenderEstimateItemTransformer.fromUpdateDtoToEntity(updates);
      const updatedItem = await this.tenderEstimateRepository.updateItem(id, entityUpdates);
      return this.tenderEstimateItemTransformer.toDTO(updatedItem);
    } catch (error) {
      console.error('Error updating estimate item:', error);
      throw new Error(`Failed to update estimate item: ${error.message}`);
    }
  }

  /**
   * Delete estimate item
   */
  async deleteEstimateItem(id: string): Promise<void> {
    try {
      await this.tenderEstimateRepository.deleteItem(id);
    } catch (error) {
      console.error('Error deleting estimate item:', error);
      throw new Error(`Failed to delete estimate item: ${error.message}`);
    }
  }

  /**
   * Get user's own estimates (for current authenticated user)
   */
  async getMyEstimates(userId: string): Promise<TenderEstimateDTO[]> {
    try {
      const estimates = await this.tenderEstimateRepository.findBySubmittedBy(userId);
      return estimates.map(estimate => this.tenderEstimateTransformer.toDTO(estimate));
    } catch (error) {
      console.error('Error getting user estimates:', error);
      throw new Error(`Failed to get user estimates: ${error.message}`);
    }
  }

  /**
   * Get estimates by project ID
   */
  async getEstimatesByProjectId(projectId: string): Promise<TenderEstimateDTO[]> {
    try {
      const estimates = await this.tenderEstimateRepository.findByProjectId(projectId);
      return estimates.map(estimate => this.tenderEstimateTransformer.toDTO(estimate));
    } catch (error) {
      console.error('Error getting estimates by project ID:', error);
      throw new Error(`Failed to get estimates by project ID: ${error.message}`);
    }
  }

  /**
   * Get all estimates (admin only)
   */
  async getAllEstimates(): Promise<TenderEstimateDTO[]> {
    try {
      const estimates = await this.tenderEstimateRepository.findAll();
      return estimates.map(estimate => this.tenderEstimateTransformer.toDTO(estimate));
    } catch (error) {
      console.error('Error getting all estimates:', error);
      throw new Error(`Failed to get all estimates: ${error.message}`);
    }
  }

  /**
   * Get estimate statistics
   * @param tenderId The tender ID
   * @returns Statistics object
   */
  async getEstimateStats(tenderId: string): Promise<{
    totalEstimates: number;
    totalAmount: number;
    averageAmount: number;
    byStatus: Record<string, number>;
  }> {
    try {
      return await this.tenderEstimateRepository.getEstimateStats(tenderId);
    } catch (error) {
      console.error('Error getting estimate stats:', error);
      throw new Error(`Failed to get estimate stats: ${error.message}`);
    }
  }

  /**
   * Calculate estimate totals
   * @param estimateId The estimate ID
   * @returns Calculated totals
   */
  async calculateEstimateTotals(estimateId: string): Promise<{
    subtotal: number;
    taxAmount: number;
    totalWithTax: number;
    overheadAmount: number;
    profitMarginAmount: number;
    finalTotal: number;
  }> {
    try {
      const estimate = await this.getEstimateById(estimateId);
      const items = await this.getEstimateItems(estimateId);

      if (!estimate) {
        throw new Error('Estimate not found');
      }

      // Calculate subtotal from items
      const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
      
      // Calculate tax
      const taxRate = estimate.tax_rate || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const totalWithTax = subtotal + taxAmount;

      // Calculate overhead
      const overheadPercentage = estimate.overhead_percentage || 0;
      const overheadAmount = totalWithTax * (overheadPercentage / 100);

      // Calculate profit margin
      const profitMarginPercentage = estimate.profit_margin_percentage || 0;
      const profitMarginAmount = (totalWithTax + overheadAmount) * (profitMarginPercentage / 100);

      // Calculate final total
      const finalTotal = totalWithTax + overheadAmount + profitMarginAmount;

      return {
        subtotal,
        taxAmount,
        totalWithTax,
        overheadAmount,
        profitMarginAmount,
        finalTotal
      };
    } catch (error) {
      console.error('Error calculating estimate totals:', error);
      throw new Error(`Failed to calculate estimate totals: ${error.message}`);
    }
  }

  /**
   * Validate estimate data
   * @param data The estimate data to validate
   * @returns Validation result
   */
  validateEstimateData(data: TenderEstimateCreateDTO | UpdateTenderEstimateRequestDto): {
    isValid: boolean;
    errors: string[];
  } {
    return this.tenderEstimateTransformer.validate(data);
  }

  /**
   * Validate estimate item data
   * @param data The estimate item data to validate
   * @returns Validation result
   */
  validateEstimateItemData(data: TenderEstimateItemCreateDTO | UpdateTenderEstimateItemRequestDto): {
    isValid: boolean;
    errors: string[];
  } {
    return this.tenderEstimateItemTransformer.validate(data);
  }
}
