/**
 * Hexagonal hooks for Kanban Board management
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useEffect, useState } from 'react';

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  assigned_to?: string;
  dueDate?: string;
  due_date?: string;
  progress?: number;
  phase?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

// Hook: Kanban board tasks with drag & drop support
export function useKanbanTasks(projectId: string, phaseId?: string) {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Pattern: Hook → Repository (avec logique métier dans le hook)
      const milestoneRepository = RepositoryFactory.getMilestoneRepository();
      
      // Get milestones with business logic (méthode correcte du repository)
      let allMilestones = await milestoneRepository.findByProjectId(projectId);
      
      // Filter by phase if needed
      if (phaseId) {
        allMilestones = allMilestones.filter(milestone => milestone.phaseId === phaseId);
      }
      
      // Apply business rules and calculations (transformer logic)
      const kanbanTasks = allMilestones.map(milestone => {
        // Business logic: Calculate progress based on critical path and status
        const progress = milestone.status === 'completed' ? 100 : 
                       milestone.isOnCriticalPath ? 75 : 
                       milestone.status === 'in_progress' ? 50 : 0;
        
        // Business logic: Map priority levels
        const priority = milestone.priority === 'normal' ? 'medium' : 
                       milestone.priority === 'critical' ? 'high' : 
                       milestone.priority as KanbanTask['priority'];
        
        return {
          id: milestone.id,
          title: milestone.title,
          description: milestone.description,
          status: milestone.status,
          priority,
          assignee: milestone.approvedBy,
          dueDate: milestone.targetDate,
          progress,
          phase: milestone.phaseId,
          tags: milestone.deliverables || []
        };
      });
      
      setTasks(kanbanTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [projectId, phaseId]);

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDrop = async (targetStatus: string) => {
    if (!draggedTask) return;
    
    // Update locally first
    setTasks(prev => prev.map(t => 
      t.id === draggedTask ? { ...t, status: targetStatus } : t
    ));
    
    // Update in database
    try {
      // Pattern: Hook → Repository (avec logique métier dans le hook)
      const milestoneRepository = RepositoryFactory.getMilestoneRepository();
      
      // Business logic: Set completion date if status is completed
      const updateData: {
        status: string;
        completed_date?: string;
      } = { status: targetStatus };
      if (targetStatus === 'completed') {
        updateData.completed_date = new Date().toISOString();
      }
      
      // Update milestone with business logic (méthode correcte du repository)
      await milestoneRepository.update(draggedTask, updateData);
    } catch (error) {
      console.error('Error updating task:', error);
      loadTasks(); // Reload on error
    }
    
    setDraggedTask(null);
  };

  return {
    tasks,
    loading,
    draggedTask,
    loadTasks,
    getTasksByStatus: (status: string) => tasks.filter(t => t.status === status),
    handleDragStart,
    handleDrop
  };
}
