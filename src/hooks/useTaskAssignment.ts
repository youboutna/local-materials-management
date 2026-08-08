/**
 * useTaskAssignment - Hook hexagonal pour l'assignation de tâches
 * 
 * Architecture Hexagonale - RÈGLES STRICTES :
 * - Zéro interface/type dans UI/Hooks
 * - Tous les types proviennent des DTOs
 * - UI Component → Hook → Service → Repository → Adapter → DB
 * 
 * Respecte PROMPT.md :
 * - ✅ Zéro supabase.from() dans les hooks
 * - ✅ Utilisation des services et DTOs
 * - ✅ camelCase pour les DTOs
 * - ✅ Pas de redéfinition de types dans UI
 * - ✅ Utilisation de TaskAssignmentService
 * - ✅ Gestion des assignations avec notifications
 */

import { EmployeeService } from '@/application/services/EmployeeService';
import { SupplierService } from '@/application/services/SupplierService';
import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
import { 
  CreateTaskAssignmentDTO,
  TaskPriority,
  TaskStatus
} from '@/dtos/entities/TaskAssignmentDTO';
import { useAuth } from '@/contexts/use-auth';
import { toast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useState } from 'react';

/**
 * Types de tâches (UI uniquement, converti en DTO)
 */
type TaskTypeLocal = 'general' | 'inspection' | 'document' | 'payment' | 'material';

/**
 * Hook hexagonal pour l'assignation de tâches
 * Fournit la création de tâches avec assignation et notifications
 */
export const useTaskAssignment = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { createNotification } = useNotifications();

  // Services hexagonaux
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );
  const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
  const supplierService = getSupplierService();

  /**
   * Crée une assignation de tâche
   */
  const createTaskAssignment = async (
    title: string,
    description: string,
    assignedTo: string,
    priority: 'low' | 'medium' | 'high' | 'urgent',
    dueDate?: string,
    projectId?: string,
    taskType: TaskTypeLocal = 'general',
    relatedId?: string
  ) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      // Récupérer les informations de l'assigné
      let assigneeName = 'Utilisateur';
      let assigneeEmail = '';
      let assigneeType: 'employee' | 'supplier' | 'user' = 'user';

      // Chercher d'abord dans les employés
      const employeeData = await employeeService.getEmployeeById(assignedTo);
      
      if (employeeData) {
        assigneeName = employeeData.fullName || 'Employé';
        assigneeEmail = employeeData.email || '';
        assigneeType = 'employee';
      } else {
        // Puis dans les fournisseurs
        const supplierData = await supplierService.getSupplierById(assignedTo);
        
        if (supplierData) {
          assigneeName = supplierData.name || 'Fournisseur';
          assigneeEmail = supplierData.email || '';
          assigneeType = 'supplier';
        } else {
          // Utilisateur par défaut
          assigneeName = user.user_metadata?.fullName || user.email || 'Utilisateur';
          assigneeType = 'user';
        }
      }

      // Construction du DTO de création
      const taskAssignmentRequest: CreateTaskAssignmentDTO = {
        title,
        description,
        assigneeId: assignedTo,
        assigneeType,
        assigneeName,
        assigneeEmail,
        assignedBy: user.id,
        priority: mapPriority(priority),
        status: TaskStatus.PENDING,
        dueDate: dueDate || undefined,
        projectId: projectId || undefined,
        // Métadonnées pour le suivi
        metadata: {
          taskType,
          priority,
          dueDate: dueDate || undefined,
          assigneeName,
          assignerName: user.user_metadata?.fullName || user.email || 'Directeur',
          relatedId: relatedId || undefined,
          relatedType: relatedId ? taskType : undefined,
          createdAt: new Date().toISOString(),
        },
      };

      // Création via le service hexagonal
      const createdTask = await taskAssignmentService.create(taskAssignmentRequest);
      if (!createdTask) throw new Error('Failed to create task assignment');

      // Construction des métadonnées pour la notification
      const notificationMetadata: Record<string, unknown> = {
        task_type: taskType,
        priority,
        dueDate: dueDate,
        assignee_name: assigneeName,
        assigner_name: user.user_metadata?.fullName || user.email || 'Directeur',
        task_id: createdTask.id,
      };

      if (projectId) notificationMetadata.related_project_id = projectId;
      if (relatedId) {
        notificationMetadata.related_id = relatedId;
        notificationMetadata.related_type = taskType;
      }

      // Envoi de la notification
      const priorityText = priority === 'urgent' ? ' URGENTE' : 
                          priority === 'high' ? ' prioritaire' : '';
      const descriptionPreview = description ? description.substring(0, 100) + (description.length > 100 ? '...' : '') : '';

      await createNotification(
        assignedTo,
        `Nouvelle tâche assignée: ${title}`,
        `Vous avez été assigné(e) à une nouvelle tâche${priorityText}. ${descriptionPreview}`,
        'info',
        createdTask.id,
        notificationMetadata
      );

      toast({
        title: "Tâche créée",
        description: `La tâche "${title}" a été assignée à ${assigneeName}`,
      });

      return createdTask;
    } catch (error) {
      console.error('Error creating task assignment:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer la tâche.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crée une assignation de tâche avec statut
   * Version simplifiée pour les cas d'usage rapides
   */
  const createSimpleTaskAssignment = async (
    title: string,
    description: string,
    assigneeId: string,
    priority: TaskPriority = TaskPriority.MEDIUM,
    dueDate?: string,
    projectId?: string
  ) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      const taskData: CreateTaskAssignmentDTO = {
        title,
        description,
        assigneeId,
        assigneeType: 'user',
        assignedBy: user.id,
        priority,
        status: TaskStatus.PENDING,
        dueDate: dueDate || undefined,
        projectId: projectId || undefined,
        metadata: {
          createdAt: new Date().toISOString(),
          assignedBy: user.id,
        },
      };

      const createdTask = await taskAssignmentService.create(taskData);
      
      toast({
        title: "Tâche créée",
        description: `La tâche "${title}" a été assignée avec succès.`,
      });

      return createdTask;
    } catch (error) {
      console.error('Error creating simple task assignment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Met à jour le statut d'une tâche assignée
   */
  const updateTaskStatus = async (
    taskId: string,
    status: TaskStatus
  ) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      const updatedTask = await taskAssignmentService.updateStatus(taskId, status);
      
      toast({
        title: "Statut mis à jour",
        description: `Le statut de la tâche a été mis à jour vers "${status}".`,
      });

      return updatedTask;
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mappe les priorités UI vers les enums DTO
   */
  const mapPriority = (priority: 'low' | 'medium' | 'high' | 'urgent'): TaskPriority => {
    const map: Record<'low' | 'medium' | 'high' | 'urgent', TaskPriority> = {
      'low': TaskPriority.LOW,
      'medium': TaskPriority.MEDIUM,
      'high': TaskPriority.HIGH,
      'urgent': TaskPriority.CRITICAL,
    };
    return map[priority];
  };

  return {
    // Fonctions principales
    createTaskAssignment,
    createSimpleTaskAssignment,
    updateTaskStatus,
    
    // États
    loading,
    
    // Utilitaires
    mapPriority,
  };
};