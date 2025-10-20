import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage } from "@/contexts/LanguageContext";
import UserSelector from '@/components/selectors/UserSelector';
import { useAuth } from "@/contexts/AuthContext";

type TaskAssignment = Database["public"]["Tables"]["task_assignments"]["Row"];
type Project = { id: string; title: string };

const ITEMS_PER_PAGE = 12;

const TaskAssignments = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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
  const { t } = useLanguage();
  const { user } = useAuth();

  // Fetch assignee details when assigned_to changes
  useEffect(() => {
    const fetchAssigneeDetails = async () => {
      if (!formData.assigned_to) {
        setFormData(prev => ({
          ...prev,
          assignee_type: "",
          assignee_name: "",
          assignee_email: "",
        }));
        return;
      }

      // Try employees first
      const { data: employeeData } = await supabase
        .from('employees')
        .select('full_name, email')
        .eq('id', formData.assigned_to)
        .maybeSingle();
      
      if (employeeData) {
        setFormData(prev => ({
          ...prev,
          assignee_type: 'employee',
          assignee_name: employeeData.full_name,
          assignee_email: employeeData.email || '',
        }));
        return;
      }

      // Try suppliers
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('name, email, contact_person')
        .eq('id', formData.assigned_to)
        .maybeSingle();
      
      if (supplierData) {
        setFormData(prev => ({
          ...prev,
          assignee_type: 'supplier',
          assignee_name: supplierData.contact_person || supplierData.name,
          assignee_email: supplierData.email || '',
        }));
        return;
      }

      // Try profiles (authenticated users)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', formData.assigned_to)
        .maybeSingle();
      
      if (profileData) {
        setFormData(prev => ({
          ...prev,
          assignee_type: 'user',
          assignee_name: profileData.full_name || 'Utilisateur',
          assignee_email: '',
        }));
      }
    };

    fetchAssigneeDetails();
  }, [formData.assigned_to]);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["task_assignments", searchTerm, filterStatus, filterPriority, filterAssignee],
    queryFn: async (): Promise<TaskAssignment[]> => {
      let query = supabase
        .from("task_assignments")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,assignee_name.ilike.%${searchTerm}%`);
      }
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
      if (filterPriority !== "all") {
        query = query.eq("priority", filterPriority);
      }
      if (filterAssignee !== "all") {
        // Filter by the appropriate FK based on assignee type stored in the row
        query = query.or(`assigned_supplier_id.eq.${filterAssignee},assigned_employee_id.eq.${filterAssignee},assigned_profile_id.eq.${filterAssignee}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as TaskAssignment[]) || [];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects_for_tasks"],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return (data as unknown as Project[]) || [];
    },
  });

  // Get unique assignees from tasks for filter
  const uniqueAssignees = tasks?.reduce((acc, task) => {
    const assigneeId = task.assigned_supplier_id || task.assigned_employee_id || task.assigned_profile_id;
    if (assigneeId && task.assignee_name) {
      acc[assigneeId] = task.assignee_name;
    }
    return acc;
  }, {} as Record<string, string>);

  const createMutation = useMutation({
    mutationFn: async (taskData: typeof formData) => {
      // Determine which FK column to use based on assignee_type
      const insertData: any = {
        title: taskData.title,
        description: taskData.description,
        project_id: taskData.project_id || null,
        assignee_type: taskData.assignee_type || null,
        assignee_name: taskData.assignee_name || null,
        assignee_email: taskData.assignee_email || null,
        assigned_by: user?.id || null,
        due_date: taskData.due_date || null,
        priority: taskData.priority,
        status: taskData.status,
        notes: taskData.notes || null,
      };

      // Set the appropriate FK based on assignee type
      if (taskData.assigned_to && taskData.assignee_type) {
        if (taskData.assignee_type === 'supplier') {
          insertData.assigned_supplier_id = taskData.assigned_to;
        } else if (taskData.assignee_type === 'employee') {
          insertData.assigned_employee_id = taskData.assigned_to;
        } else if (taskData.assignee_type === 'user') {
          insertData.assigned_profile_id = taskData.assigned_to;
        }
      }
      
      const { data, error } = await supabase
        .from("task_assignments")
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Send notification to assigned user/supplier
      if (data && taskData.assigned_to) {
        try {
          // Create notification in notifications table
          await supabase.from('notifications').insert({
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

          // If supplier, also create supplier notification
          if (taskData.assignee_type === 'supplier' && taskData.assignee_email) {
            await supabase.from('supplier_notifications').insert({
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
      // Determine which FK column to use based on assignee_type
      const updateData: any = {
        title: data.title,
        description: data.description,
        project_id: data.project_id || null,
        assignee_type: data.assignee_type || null,
        assignee_name: data.assignee_name || null,
        assignee_email: data.assignee_email || null,
        due_date: data.due_date || null,
        priority: data.priority,
        status: data.status,
        notes: data.notes || null,
        // Clear all assignee FKs first
        assigned_supplier_id: null,
        assigned_employee_id: null,
        assigned_profile_id: null,
      };

      // Set the appropriate FK based on assignee type
      if (data.assigned_to && data.assignee_type) {
        if (data.assignee_type === 'supplier') {
          updateData.assigned_supplier_id = data.assigned_to;
        } else if (data.assignee_type === 'employee') {
          updateData.assigned_employee_id = data.assigned_to;
        } else if (data.assignee_type === 'user') {
          updateData.assigned_profile_id = data.assigned_to;
        }
      }

      const { error } = await supabase
        .from("task_assignments")
        .update(updateData)
        .eq("id", id as any);
      
      if (error) throw error;

      // Send notification if status changed to completed
      if (data.status === 'completed' && data.assigned_to) {
        try {
          await supabase.from('notifications').insert({
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
  const totalPages = Math.ceil((tasks?.length || 0) / ITEMS_PER_PAGE);
  const paginatedTasks = tasks?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div>
              <Label htmlFor="filter-status">Statut</Label>
              <Select
                value={filterStatus}
                onValueChange={(value) => {
                  setFilterStatus(value);
                  setCurrentPage(1);
                }}
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
                onValueChange={(value) => {
                  setFilterPriority(value);
                  setCurrentPage(1);
                }}
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
                onValueChange={(value) => {
                  setFilterAssignee(value);
                  setCurrentPage(1);
                }}
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

      {/* Task Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId
                ? t("task.edit") || "Modifier la Tâche"
                : t("task.new") || "Nouvelle Tâche"}
            </CardTitle>
            <CardDescription>
              <Bell className="h-4 w-4 inline mr-2" />
              Une notification sera envoyée automatiquement à la personne assignée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">{t("task.title")} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    placeholder="Ex: Installation électrique"
                  />
                </div>
                <div>
                  <Label htmlFor="project">{t("projects.title")}</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, project_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          t("task.select_project") || "Sélectionner un projet"
                        }
                      />
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
                <div>
                  <UserSelector
                    value={formData.assigned_to}
                    onChange={(userId) => setFormData({ ...formData, assigned_to: userId })}
                    label={t("task.assigned_to") || "Assigné à"}
                    placeholder={t("task.select_assignee") || "Sélectionner (employé/fournisseur)"}
                    required={false}
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">
                    {t("task.due_date") || "Date d'échéance"}
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="priority">
                    {t("task.priority") || "Priorité"}
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        {t("task.priority_low") || "Faible"}
                      </SelectItem>
                      <SelectItem value="medium">
                        {t("task.priority_medium") || "Moyenne"}
                      </SelectItem>
                      <SelectItem value="high">
                        {t("task.priority_high") || "Élevée"}
                      </SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">{t("task.status") || "Statut"}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        {t("task.status_pending") || "En attente"}
                      </SelectItem>
                      <SelectItem value="in_progress">
                        {t("task.status_in_progress") || "En cours"}
                      </SelectItem>
                      <SelectItem value="completed">
                        {t("task.status_completed") || "Terminé"}
                      </SelectItem>
                      <SelectItem value="cancelled">
                        {t("task.status_cancelled") || "Annulé"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">
                  {t("task.description") || "Description"}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Détails de la tâche..."
                />
              </div>

              <div>
                <Label htmlFor="notes">{t("task.notes") || "Notes"}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                  placeholder="Notes additionnelles..."
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editingId
                    ? t("task.update") || "Mettre à jour"
                    : t("task.create") || "Créer"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t("task.cancel") || "Annuler"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedTasks?.map((task) => (
          <Card key={task.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <ClipboardList className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{task.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {getProjectTitle(task.project_id)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <Badge className={`${getPriorityColor(task.priority || "medium")} truncate`}>
                    {task.priority === "urgent" ? "Urgente" :
                     task.priority === "high" ? t("task.priority_high") || "Élevée" :
                     task.priority === "medium" ? t("task.priority_medium") || "Moyenne" :
                     t("task.priority_low") || "Faible"}
                  </Badge>
                  <Badge className={`${getStatusColor(task.status || "pending")} truncate`}>
                    {task.status === "pending" ? t("task.status_pending") || "En attente" :
                     task.status === "in_progress" ? t("task.status_in_progress") || "En cours" :
                     task.status === "completed" ? t("task.status_completed") || "Terminé" :
                     t("task.status_cancelled") || "Annulé"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{getAssigneeName(task)}</span>
                </div>
                {task.due_date && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {t("task.due") || "Échéance"}:{" "}
                      {new Date(task.due_date).toLocaleDateString(
                        t("locale") || "fr-FR"
                      )}
                    </span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {t("task.created") || "Créé"}:{" "}
                  {new Date(task.created_at || "").toLocaleDateString(
                    t("locale") || "fr-FR"
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(task)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {t("task.edit") || "Modifier"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
                      deleteMutation.mutate(task.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {tasks?.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t("task.none_found") || "Aucune tâche trouvée"}
            </h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer une nouvelle tâche
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une tâche
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TaskAssignments;
