/**
 * TaskAssignments - CRUD for task assignments
 * MIGRATED TO HEXAGONAL ARCHITECTURE
 */

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationService } from '@/application/services/NotificationService';
import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
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
import { useAuth } from '@/contexts/use-auth';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { 
  useTaskAssignmentsHex, 
  useProjectsHex, 
  useAssigneeDetails,
  type TaskAssignment
} from '@/hooks/hexagonal';

type Project = { id: string; title: string };

// Local form data type
interface TaskFormData {
  title: string;
  description: string;
  project_id: string;
  assigned_to: string;
  assignee_type: "supplier" | "employee" | "user" | "";
  assignee_name: string;
  assignee_email: string;
  due_date: string;
  priority: string;
  status: string;
  notes: string;
}

const TaskAssignmentsComponent = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [formData, setFormData] = useState<TaskFormData>({
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  // Use hexagonal hooks
  const { tasks, isLoading } = useTaskAssignmentsHex({
    assignedTo: filterAssignee !== 'all' ? filterAssignee : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined
  });

  const projectsHook = useProjectsHex();
  const projects = projectsHook.projects || [];

  // Fetch assignee details when assigned_to changes
  const assigneeResult = useAssigneeDetails(formData.assigned_to || '');
  const assigneeDetails = assigneeResult?.details;

  useEffect(() => {
    // Only update form when we have assignee details and they're different from current values
    if (assigneeDetails && formData.assigned_to) {
      setFormData(prev => {
        // Check if values actually need to be updated to avoid infinite loop
        const needsUpdate = 
          prev.assignee_type !== assigneeDetails.type ||
          prev.assignee_name !== assigneeDetails.name ||
          prev.assignee_email !== assigneeDetails.email;
        
        if (needsUpdate) {
          return {
            ...prev,
            assignee_type: assigneeDetails.type as any,
            assignee_name: assigneeDetails.name,
            assignee_email: assigneeDetails.email,
          };
        }
        return prev;
      });
    }
  }, [formData.assigned_to, assigneeDetails?.type, assigneeDetails?.name, assigneeDetails?.email]);

  // Get unique assignees from tasks for filter
  const uniqueAssignees = (tasks as any[])?.reduce((acc: Record<string, string>, task: any) => {
    if (task.assigned_to && task.assignee_name) {
      acc[task.assigned_to] = task.assignee_name;
    }
    return acc;
  }, {} as Record<string, string>) || {};

  const createMutation = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      const taskService = new TaskAssignmentService();
      
      // Build proper DTO for service
      return await taskService.createTaskAssignment({ 
        taskData: {
          taskId: crypto.randomUUID(),
          projectId: taskData.project_id || '',
          assignedTo: taskData.assigned_to || '',
          assignedBy: user?.id || '',
          assigneeType: (taskData.assignee_type || 'user') as any,
          title: taskData.title,
          description: taskData.description || undefined,
          priority: taskData.priority as any,
          dueDate: taskData.due_date || undefined,
          assignmentNotes: taskData.notes || undefined,
        }, 
        assignedBy: user?.id 
      });
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
    mutationFn: async ({ id, data }: { id: string; data: TaskFormData }) => {
      const taskService = new TaskAssignmentService();
      
      // Build proper update DTO
      return await taskService.updateTaskAssignment({ 
        id, 
        updates: {
          priority: data.priority as any,
          status: data.status as any,
          dueDate: data.due_date || undefined,
          assignmentNotes: data.notes || undefined,
          progress: 0,
        }
      });
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
      const taskService = new TaskAssignmentService();
      await taskService.deleteTaskAssignment({ id });
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

  const handleEdit = (task: any) => {
    setFormData({
      title: task.title || "",
      description: task.description || "",
      project_id: task.project_id || task.projectId || "",
      assigned_to: task.assigned_to || task.assignedTo || "",
      assignee_type: (task.assignee_type || task.assigneeType || "") as any,
      assignee_name: task.assignee_name || task.assigneeName || "",
      assignee_email: task.assignee_email || task.assigneeEmail || "",
      due_date: task.due_date || task.dueDate || "",
      priority: task.priority || "medium",
      status: task.status || "pending",
      notes: task.notes || task.assignmentNotes || "",
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

  const getAssigneeName = (task: any) => {
    const name = task.assignee_name || task.assigneeName;
    const type = task.assignee_type || task.assigneeType;
    if (name) {
      return `${name}${type ? ` (${type})` : ''}`;
    }
    const assignedTo = task.assigned_to || task.assignedTo;
    if (!assignedTo) return t("task.unassigned") || "Non assigné";
    return assignedTo;
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
        <Button onClick={() => setIsCreating(true)} aria-label={t("task.new") || "Créer une nouvelle tâche"}>
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
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
                <Search className="h-4 w-4 inline mr-2" aria-hidden="true" />
                Rechercher
              </Label>
              <Input
                id="search"
                type="search"
                placeholder="Titre, description, assigné..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Rechercher une tâche"
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
            <form onSubmit={handleSubmit} className="space-y-4" aria-label={editingId ? "Formulaire de modification de tâche" : "Formulaire de création de tâche"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    aria-required="true"
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
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  aria-busy={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedTasks.map((task: any) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-1">{task.title}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(task)}
                    aria-label={`Modifier la tâche ${task.title}`}
                  >
                    <Edit className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(task.id)}
                    aria-label={`Supprimer la tâche ${task.title}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {task.description || "Aucune description"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
                <Badge className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">{getAssigneeName(task)}</span>
                </div>
                {(task.due_date || task.dueDate) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    <span>{new Date(task.due_date || task.dueDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks?.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune tâche</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer une nouvelle tâche.
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une tâche
            </Button>
          </CardContent>
        </Card>
      )}

      {tasks && tasks.length > 0 && (
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
