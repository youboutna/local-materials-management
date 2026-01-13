/**
 * Hexagonal hooks for Kanban Board management
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: string;
  progress?: number;
  phase?: string;
  tags?: string[];
}

// Hook: Kanban board tasks with drag & drop support
export function useKanbanTasks(projectId: string, phaseId?: string) {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('enhanced_project_milestones')
        .select('*')
        .eq('project_id', projectId);
      
      if (phaseId) {
        query = query.eq('phase_id', phaseId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTasks((data || []).map((t: any) => {
        const deps = t.dependencies as any;
        return {
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status || 'backlog',
          priority: deps?.priority || 'medium',
          assignee: deps?.assigned_to,
          dueDate: t.target_date,
          progress: deps?.progress || 0,
          phase: deps?.phase_name,
          tags: deps?.tags || []
        };
      }));
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [projectId, phaseId]);

  const getTasksByStatus = (status: string) => {
    return tasks.filter(t => t.status === status);
  };

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
      await supabase
        .from('enhanced_project_milestones')
        .update({ status: targetStatus })
        .eq('id', draggedTask);
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
    getTasksByStatus,
    handleDragStart,
    handleDrop
  };
}
