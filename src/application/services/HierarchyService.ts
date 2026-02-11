/**
 * HierarchyService - Hexagonal service for project hierarchy operations
 * Handles RPC calls through proper architecture layers
 */

import { HierarchyNode, CreateHierarchyNodeDTO, UpdateHierarchyNodeDTO } from '@/dtos/entities/HierarchyDTO';
import { IHierarchyRepository } from '@/domain/repositories/IHierarchyRepository';
import { AppError, ErrorCode } from '@/utils/errors';

export class HierarchyService {
  constructor(private repository: IHierarchyRepository) {}

  /**
   * Get complete project hierarchy
   * Follows hexagonal architecture: Service → Repository → Adapter → Database
   */
  async getProjectHierarchy(projectId: string): Promise<HierarchyNode[]> {
    try {
      // Business logic validation
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Delegate to repository
      const hierarchy = await this.repository.getProjectHierarchy(projectId);
      
      // Business logic: Ensure hierarchy is properly structured
      return this.validateHierarchyStructure(hierarchy);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch project hierarchy');
    }
  }

  /**
   * Create new hierarchy node
   */
  async createHierarchyNode(nodeData: CreateHierarchyNodeDTO): Promise<HierarchyNode> {
    try {
      // Business validation
      this.validateHierarchyNodeData(nodeData);

      // Delegate to repository
      const createdNode = await this.repository.createHierarchyNode(nodeData);
      
      return createdNode;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create hierarchy node');
    }
  }

  /**
   * Update hierarchy node
   */
  async updateHierarchyNode(id: string, updateData: UpdateHierarchyNodeDTO): Promise<HierarchyNode> {
    try {
      // Business validation
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Node ID is required');
      }

      // Delegate to repository
      const updatedNode = await this.repository.updateHierarchyNode(id, updateData);
      
      if (!updatedNode) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Hierarchy node not found');
      }

      return updatedNode;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update hierarchy node');
    }
  }

  /**
   * Delete hierarchy node
   */
  async deleteHierarchyNode(id: string): Promise<boolean> {
    try {
      // Business validation
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Node ID is required');
      }

      // Check if node has children
      const hasChildren = await this.repository.hasChildNodes(id);
      if (hasChildren) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot delete node with children');
      }

      // Delegate to repository
      const deleted = await this.repository.deleteHierarchyNode(id);
      
      return deleted;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete hierarchy node');
    }
  }

  /**
   * Get hierarchy statistics
   */
  async getHierarchyStatistics(projectId: string): Promise<{
    totalNodes: number;
    maxDepth: number;
    nodeTypes: Record<string, number>;
  }> {
    try {
      const hierarchy = await this.getProjectHierarchy(projectId);
      
      // Business logic: Calculate statistics
      const stats = {
        totalNodes: hierarchy.length,
        maxDepth: this.calculateMaxDepth(hierarchy),
        nodeTypes: this.calculateNodeTypes(hierarchy)
      };

      return stats;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to calculate hierarchy statistics');
    }
  }

  // Private helper methods for business logic

  private validateHierarchyStructure(hierarchy: HierarchyNode[]): HierarchyNode[] {
    // Business logic: Ensure proper parent-child relationships
    const nodeMap = new Map<string, HierarchyNode>();
    
    // Build node map
    hierarchy.forEach(node => {
      nodeMap.set(node.id, node);
    });

    // Validate parent references
    hierarchy.forEach(node => {
      if (node.parentId && !nodeMap.has(node.parentId)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid parent reference for node ${node.id}`);
      }
    });

    return hierarchy;
  }

  private validateHierarchyNodeData(nodeData: CreateHierarchyNodeDTO): void {
    // Business validation rules
    if (!nodeData.name || nodeData.name.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Node name is required');
    }

    if (!nodeData.type) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Node type is required');
    }

    if (nodeData.orderIndex !== undefined && nodeData.orderIndex < 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Order index must be non-negative');
    }
  }

  private calculateMaxDepth(hierarchy: HierarchyNode[]): number {
    let maxDepth = 0;
    
    const calculateDepth = (nodeId: string, depth: number): void => {
      maxDepth = Math.max(maxDepth, depth);
      
      const children = hierarchy.filter(node => node.parentId === nodeId);
      children.forEach(child => calculateDepth(child.id, depth + 1));
    };

    // Start from root nodes (nodes without parents)
    const rootNodes = hierarchy.filter(node => !node.parentId);
    rootNodes.forEach(root => calculateDepth(root.id, 1));

    return maxDepth;
  }

  private calculateNodeTypes(hierarchy: HierarchyNode[]): Record<string, number> {
    const types: Record<string, number> = {};
    
    hierarchy.forEach(node => {
      types[node.type] = (types[node.type] || 0) + 1;
    });

    return types;
  }
}
