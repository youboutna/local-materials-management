/**
 * LocalStorage Hierarchy Adapter
 * Implements IHierarchyRepository using LocalStorage for DEV_MODE
 */

import { 
  IHierarchyRepository, 
  HierarchyNode, 
  NodeType, 
  HierarchyStatus 
} from '@/domain/repositories/IHierarchyRepository';
import { allHierarchyData, MockHierarchyNode } from '@/data/mockData';

// Convert MockHierarchyNode to HierarchyNode format
const mockHierarchyNodes: HierarchyNode[] = allHierarchyData.map((mock: MockHierarchyNode) => {
  // Map mock status to domain status
  const statusMap: Record<string, HierarchyStatus> = {
    'active': 'active',
    'inactive': 'inactive',
    'pending': 'pending',
    'archived': 'archived'
  };

  // Map mock type to domain type
  const typeMap: Record<string, NodeType> = {
    'organization': 'organization',
    'department': 'department',
    'team': 'team',
    'position': 'position',
    'project': 'project',
    'location': 'location'
  };

  return new HierarchyNode(
    mock.id,
    mock.name,
    mock.description,
    typeMap[mock.type] || 'department',
    statusMap[mock.status] || 'active',
    mock.parentId,
    mock.level,
    mock.sortOrder,
    mock.path,
    mock.metadata,
    mock.createdBy,
    mock.createdAt, // created_at
    mock.updatedAt  // updated_at
  );
});

export class LocalStorageHierarchyAdapter implements IHierarchyRepository {
  
  async findById(id: string): Promise<HierarchyNode | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    const hierarchyNode = hierarchyNodes.find(hn => hn.id === id);
    
    return hierarchyNode || null;
  }

  async findAll(): Promise<HierarchyNode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    return hierarchyNodes;
  }

  async save(hierarchyNode: HierarchyNode): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    const existingIndex = hierarchyNodes.findIndex(hn => hn.id === hierarchyNode.id);
    
    if (existingIndex >= 0) {
      hierarchyNodes[existingIndex] = hierarchyNode;
    } else {
      hierarchyNodes.push(hierarchyNode);
    }
    
    this.saveHierarchyNodesToStorage(hierarchyNodes);
    
    console.log(`[DEV_MODE] Saved hierarchy node ${hierarchyNode.id}`);
  }

  async update(id: string, data: Partial<HierarchyNode>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    const hierarchyNodeIndex = hierarchyNodes.findIndex(hn => hn.id === id);
    
    if (hierarchyNodeIndex === -1) {
      throw new Error(`Hierarchy node with id ${id} not found`);
    }
    
    hierarchyNodes[hierarchyNodeIndex] = {
      ...hierarchyNodes[hierarchyNodeIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveHierarchyNodesToStorage(hierarchyNodes);
    
    console.log(`[DEV_MODE] Updated hierarchy node ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    const hierarchyNodeIndex = hierarchyNodes.findIndex(hn => hn.id === id);
    
    if (hierarchyNodeIndex === -1) {
      throw new Error(`Hierarchy node with id ${id} not found`);
    }
    
    hierarchyNodes.splice(hierarchyNodeIndex, 1);
    this.saveHierarchyNodesToStorage(hierarchyNodes);
    
    console.log(`[DEV_MODE] Deleted hierarchy node ${id}`);
  }

  async findByParent(parentId: string): Promise<HierarchyNode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    return hierarchyNodes.filter(hn => hn.parentId === parentId);
  }

  async findByType(type: NodeType): Promise<HierarchyNode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    return hierarchyNodes.filter(hn => hn.type === type);
  }

  async findByStatus(status: HierarchyStatus): Promise<HierarchyNode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    return hierarchyNodes.filter(hn => hn.status === status);
  }

  async findByLevel(level: number): Promise<HierarchyNode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    return hierarchyNodes.filter(hn => hn.level === level);
  }

  async findRootNodes(): Promise<HierarchyNode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    return hierarchyNodes.filter(hn => hn.parentId === null);
  }

  async findLeafNodes(): Promise<HierarchyNode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    const nodeIds = hierarchyNodes.map(hn => hn.id);
    
    return hierarchyNodes.filter(hn => !nodeIds.includes(hn.parentId));
  }

  async search(query: string): Promise<HierarchyNode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    const searchLower = query.toLowerCase();
    
    return hierarchyNodes.filter(hn => 
      hn.name.toLowerCase().includes(searchLower) ||
      hn.description?.toLowerCase().includes(searchLower)
    );
  }

  async findActive(): Promise<HierarchyNode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    return hierarchyNodes.filter(hn => hn.status === 'active');
  }

  async findInactive(): Promise<HierarchyNode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    return hierarchyNodes.filter(hn => hn.status === 'inactive');
  }

  async findPath(nodeId: string): Promise<HierarchyNode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    const targetNode = hierarchyNodes.find(hn => hn.id === nodeId);
    
    if (!targetNode) {
      return [];
    }
    
    const path: HierarchyNode[] = [targetNode];
    let currentNode = targetNode;
    
    while (currentNode.parentId) {
      const parentNode = hierarchyNodes.find(hn => hn.id === currentNode.parentId);
      if (parentNode) {
        path.unshift(parentNode);
        currentNode = parentNode;
      } else {
        break;
      }
    }
    
    return path;
  }

  async findChildren(parentId: string): Promise<HierarchyNode[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hierarchyNodes = this.getHierarchyNodesFromStorage();
    return hierarchyNodes.filter(hn => hn.parentId === parentId);
  }

  // ============= Utility Methods =============

  private getHierarchyNodesFromStorage(): HierarchyNode[] {
    if (typeof window === 'undefined') return mockHierarchyNodes;
    
    const stored = localStorage.getItem('dev_hierarchy_nodes');
    return stored ? JSON.parse(stored) : mockHierarchyNodes;
  }

  private saveHierarchyNodesToStorage(hierarchyNodes: HierarchyNode[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_hierarchy_nodes', JSON.stringify(hierarchyNodes));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_hierarchy_nodes')) {
      localStorage.setItem('dev_hierarchy_nodes', JSON.stringify(mockHierarchyNodes));
    }
    
    console.log('[DEV_MODE] LocalStorage hierarchy nodes initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_hierarchy_nodes');
    
    console.log('[DEV_MODE] LocalStorage hierarchy nodes cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): HierarchyNode[] {
    return this.getHierarchyNodesFromStorage();
  }
}
