/**
 * LocalStorage Task Adapter
 * Implements ITaskRepository using LocalStorage for DEV_MODE
 */

import { 
  ITaskRepository, 
  Task, 
  TaskStatus, 
  TaskPriority,
  TaskType 
} from '@/domain/repositories/ITaskRepository';
import { allTasksData, MockTask } from '@/data/mockData';

// Convert MockTask to Task format
const mockTasks: Task[] = allTasksData.map((mock: MockTask) => {
  // Map mock status to domain status
  const statusMap: Record<string, TaskStatus> = {
    'pending': 'pending',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'on_hold': 'suspended'
  };

  // Map mock priority to domain priority
  const priorityMap: Record<string, TaskPriority> = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'urgent': 'urgent'
  };

  // Map mock type to domain type
  const typeMap: Record<string, TaskType> = {
    'inspection': 'inspection',
    'maintenance': 'maintenance',
    'procurement': 'procurement',
    'delivery': 'delivery',
    'documentation': 'documentation',
    'quality_control': 'quality_control'
  };

  return new Task(
    mock.id,
    mock.title,
    mock.description,
    typeMap[mock.type] || 'documentation',
    statusMap[mock.status] || 'pending',
    priorityMap[mock.priority] || 'medium',
    mock.projectId,
    mock.assignedTo,
    mock.dueDate,
    mock.estimatedHours,
    mock.actualHours,
    mock.createdBy,
    mock.createdAt, // created_at
    mock.updatedAt  // updated_at
  );
});

export class LocalStorageTaskAdapter implements ITaskRepository {
  
  async findById(id: string): Promise<Task | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    const task = tasks.find(t => t.id === id);
    
    return task || null;
  }

  async findAll(): Promise<Task[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    return tasks;
  }

  async save(task: Task): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }
    
    this.saveTasksToStorage(tasks);
    
    console.log(`[DEV_MODE] Saved task ${task.id}`);
  }

  async update(id: string, data: Partial<Task>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveTasksToStorage(tasks);
    
    console.log(`[DEV_MODE] Updated task ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    tasks.splice(taskIndex, 1);
    this.saveTasksToStorage(tasks);
    
    console.log(`[DEV_MODE] Deleted task ${id}`);
  }

  async findByProject(projectId: string): Promise<Task[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    return tasks.filter(task => task.projectId === projectId);
  }

  async findByAssignee(assigneeId: string): Promise<Task[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    return tasks.filter(task => task.assignedTo === assigneeId);
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    return tasks.filter(task => task.status === status);
  }

  async findByPriority(priority: TaskPriority): Promise<Task[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    return tasks.filter(task => task.priority === priority);
  }

  async findByType(type: TaskType): Promise<Task[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    return tasks.filter(task => task.type === type);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Task[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    return tasks.filter(task => 
      task.dueDate >= startDate && task.dueDate <= endDate
    );
  }

  async findOverdue(): Promise<Task[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    const now = new Date().toISOString();
    return tasks.filter(task => task.dueDate < now && task.status !== 'completed');
  }

  async search(query: string): Promise<Task[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tasks = this.getTasksFromStorage();
    const searchLower = query.toLowerCase();
    
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower)
    );
  }

  // ============= Utility Methods =============

  private getTasksFromStorage(): Task[] {
    if (typeof window === 'undefined') return mockTasks;
    
    const stored = localStorage.getItem('dev_tasks');
    return stored ? JSON.parse(stored) : mockTasks;
  }

  private saveTasksToStorage(tasks: Task[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_tasks', JSON.stringify(tasks));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_tasks')) {
      localStorage.setItem('dev_tasks', JSON.stringify(mockTasks));
    }
    
    console.log('[DEV_MODE] LocalStorage tasks initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_tasks');
    
    console.log('[DEV_MODE] LocalStorage tasks cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): Task[] {
    return this.getTasksFromStorage();
  }
}
