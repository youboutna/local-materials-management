/**
 * TaskAssignments - CRUD for task assignments
 * MIGRATED TO HEXAGONAL ARCHITECTURE
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationService } from "@/services/NotificationService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  Calendar,
  User,
  Search,
  Filter,
  Bell,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/contexts/LanguageContext";
import UserSelector from '@/components/selectors/UserSelector';
import { useAuth } from "@/contexts/AuthContext";
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { 
  useTaskAssignments, 
  useProjectsForTaskAssignments, 
  useAssigneeDetails 
} from '@/hooks/hexagonal';

type TaskAssignment = Database["public"]["Tables"]["task_assignments"]["Row"];
type Project = { id: string; title: string };

const TaskAssignmentsComponent = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    assigned_to: "",
    assignee_type: "" as "supplier" | "employee" | "user" | "",
    assignee_name: "",
    assignee_email: "",
    due_date: "",
    priority: "medium",
    status: "pending",
    notes: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  // Use hexagonal hooks
  const { data: tasks, isLoading } = useTaskAssignments({
    searchTerm: searchTerm || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    priority: filterPriority !== 'all' ? filterPriority : undefined,
    assignee: filterAssignee !== 'all' ? filterAssignee : undefined
  });

  const { data: projects } = useProjectsForTaskAssignments();

  // Fetch assignee details when assigned_to changes
  const { data: assigneeDetails } = useAssigneeDetails(formData.assigned_to || null);

  useEffect(() => {
    if (assigneeDetails) {
      setFormData(prev => ({
        ...prev,
        assignee_type: assigneeDetails.type,
        assignee_name: assigneeDetails.name,
        assignee_email: assigneeDetails.email,
      }));
    } else if (!formData.assigned_to) {
      setFormData(prev => ({
        ...prev,
        assignee_type: "",
        assignee_name: "",
        assignee_email: "",
      }));
    }
  }, [assigneeDetails, formData.assigned_to]);

  // Get unique assignees from tasks for filter
  const uniqueAssignees = tasks?.reduce((acc, task) => {
    if (task.assigned_to && task.assignee_name) {
      acc[task.assigned_to] = task.assignee_name;
    }
    return acc;
  }, {} as Record<string, string>);

  const createMutation = useMutation({
    mutationFn: async (taskData: typeof formData) => {
      const { supabase } = await import('@/integrations/supabase/client');
      const insertData: any = {
        title: taskData.title,
        description: taskData.description,
        project_id: taskData.project_id || null,
        assignee_type: taskData.assignee_type || null,
        assignee_name: taskData.assignee_name || null,
        assignee_email: taskData.assignee_email || null,
        assigned_to: taskData.assigned_to || null,
        assigned_by: user?.id || null,
        due_date: taskData.due_date || null,
        priority: taskData.priority,
        status: taskData.status,
        notes: taskData.notes || null,
      };
      
      const { data, error } = await supabase
        .from("task_assignments")
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Send notification to assigned user/supplier
      if (data && taskData.assigned_to) {
        try {
          await NotificationService.createNotification({
            recipient_id: taskData.assigned_to,
            title: '📋 Nouvelle tâche assignée',
            message: `Une nouvelle tâche "${taskData.title}" vous a été assignée${taskData.priority === 'high' ? ' (Priorité élevée)' : ''}.`,
            type: 'task_assignment',
            related_id: data.id,
            metadata: {
              task_id: data.id,
              project_id: taskData.project_id,
              priority: taskData.priority,
              due_date: taskData.due_date,
              assignee_type: taskData.assignee_type,
            }
          });

          if (taskData.assignee_type === 'supplier' && taskData.assignee_email) {
            await NotificationService.createSupplierNotification({
              supplier_id: taskData.assigned_to,
              notification_type: 'task_assignment',
              email: taskData.assignee_email,
              metadata: {
                task_id: data.id,
                title: taskData.title,
                priority: taskData.priority,
                due_date: taskData.due_date,
              }
            });
          }
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_assignments"] });
      toast({ 
        title: "✅ Succès", 
        description: "Tâche créée avec succès et notification envoyée." 
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { supabase } = await import('@/integrations/supabase/client');
      const updateData: any = {
        title: data.title,
        description: data.description,
        project_id: data.project_id || null,
        assignee_type: data.assignee_type || null,
        assignee_name: data.assignee_name || null,
        assignee_email: data.assignee_email || null,
        assigned_to: data.assigned_to || null,
        due_date: data.due_date || null,
        priority: data.priority,
        status: data.status,
        notes: data.notes || null,
      };

      const { error } = await supabase
        .from("task_assignments")
        .update(updateData)
        .eq("id", id as any);
      
      if (error) throw error;

      if (data.status === 'completed' && data.assigned_to) {
        try {
          await NotificationService.createNotification({
            recipient_id: data.assigned_to,
            title: '✅ Tâche terminée',
            message: `La tâche "${data.title}" a été marquée comme terminée.`,
            type: 'task_update',
            related_id: id,
            metadata: { task_id: id, status: 'completed' }
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_assignments"] });
      toast({ title: "✅ Succès", description: "Tâche mise à jour avec succès." });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from("task_assignments")
        .delete()
        .eq("id", id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_assignments"] });
      toast({ title: "✅ Succès", description: "Tâche supprimée avec succès." });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      project_id: "",
      assigned_to: "",
      assignee_type: "",
      assignee_name: "",
      assignee_email: "",
      due_date: "",
      priority: "medium",
      status: "pending",
      notes: "",
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (task: TaskAssignment) => {
    setFormData({
      title: task.title || "",
      description: task.description || "",
      project_id: task.project_id || "",
      assigned_to: task.assigned_to || "",
      assignee_type: (task.assignee_type as any) || "",
      assignee_name: task.assignee_name || "",
      assignee_email: task.assignee_email || "",
      due_date: task.due_date || "",
      priority: task.priority || "medium",
      status: task.status || "pending",
      notes: task.notes || "",
    });
    setEditingId(task.id);
    setIsCreating(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
      case "urgent":
        return "bg-destructive/10 text-destructive";
      case "medium":
        return "bg-warning/10 text-warning";
      case "low":
        return "bg-success/10 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-info/10 text-info";
      case "in_progress":
        return "bg-warning/10 text-warning";
      case "completed":
        return "bg-success/10 text-success";
      case "cancelled":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getProjectTitle = (projectId: string | null) => {
    if (!projectId) return "N/A";
    const project = projects?.find((p) => p.id === projectId);
    return project?.title || projectId;
  };

  const getAssigneeName = (task: TaskAssignment) => {
    if (task.assignee_name) {
      return `${task.assignee_name}${task.assignee_type ? ` (${task.assignee_type})` : ''}`;
    }
    if (!task.assigned_to) return t("task.unassigned") || "Non assigné";
    return task.assigned_to;
  };

  // Pagination
  const {
    currentData: paginatedTasks,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    goToPage,
  } = usePagination({
    data: tasks || [],
    itemsPerPage: 12
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {t("task.assignments_title") || "Gestion des Tâches"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {tasks?.length || 0} tâche(s) au total
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("task.new") || "Nouvelle Tâche"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">
                <Search className="h-4 w-4 inline mr-2" />
                Rechercher
              </Label>
              <Input
                id="search"
                placeholder="Titre, description, assigné..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filter-status">Statut</Label>
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger id="filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-priority">Priorité</Label>
              <Select
                value={filterPriority}
                onValueChange={setFilterPriority}
              >
                <SelectTrigger id="filter-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-assignee">Assigné à</Label>
              <Select
                value={filterAssignee}
                onValueChange={setFilterAssignee}
              >
                <SelectTrigger id="filter-assignee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {uniqueAssignees && Object.entries(uniqueAssignees).map(([id, name]) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {editingId ? "Modifier la Tâche" : "Nouvelle Tâche"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Projet</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                  >
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Assigné à</Label>
                  <UserSelector
                    value={formData.assigned_to}
                    onChange={(value) => setFormData({ ...formData, assigned_to: value })}
                    placeholder="Sélectionner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Date d'échéance</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes additionnelles..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Mettre à jour" : "Créer"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base line-clamp-2">{task.title}</CardTitle>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(task)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Badge className={getPriorityColor(task.priority || 'medium')}>
                  {task.priority}
                </Badge>
                <Badge className={getStatusColor(task.status || 'pending')}>
                  {task.status}
                </Badge>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span className="truncate">{getAssigneeName(task)}</span>
                </div>
                {task.due_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                {task.project_id && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span className="truncate">{getProjectTitle(task.project_id)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune tâche trouvée</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {(tasks?.length || 0) > 12 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
};

export default TaskAssignmentsComponent;
