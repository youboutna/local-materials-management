/**
 * KanbanBoard - Visual task management with WIP limits
 * MIGRATED TO HEXAGONAL ARCHITECTURE
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  LayoutGrid,
  Plus,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Flag
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useKanbanTasks, KanbanTask } from '@/hooks/hexagonal';

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  wipLimit?: number;
  color: string;
}

interface KanbanBoardProps {
  projectId: string;
  phaseId?: string;
  onTaskClick?: (taskId: string) => void;
  onAddTask?: (status: string) => void;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', status: 'backlog', color: 'bg-slate-500' },
  { id: 'todo', title: 'À faire', status: 'todo', wipLimit: 10, color: 'bg-blue-500' },
  { id: 'in_progress', title: 'En cours', status: 'in_progress', wipLimit: 5, color: 'bg-amber-500' },
  { id: 'review', title: 'En revue', status: 'review', wipLimit: 3, color: 'bg-purple-500' },
  { id: 'done', title: 'Terminé', status: 'done', color: 'bg-green-500' }
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  phaseId,
  onTaskClick,
  onAddTask
}) => {
  // Use hexagonal hook
  const {
    loading,
    draggedTask,
    getTasksByStatus,
    handleDragStart,
    handleDrop
  } = useKanbanTasks(projectId, phaseId);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-3 w-3" />;
      case 'high': return <Flag className="h-3 w-3" />;
      default: return null;
    }
  };

  const getDaysRemaining = (dueDate: string) => {
    const days = differenceInDays(parseISO(dueDate), new Date());
    return days;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-6 bg-muted rounded w-24 animate-pulse" />
                <div className="h-24 bg-muted rounded animate-pulse" />
                <div className="h-24 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LayoutGrid className="h-5 w-5 text-primary" />
          Tableau Kanban
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {DEFAULT_COLUMNS.map(column => {
            const columnTasks = getTasksByStatus(column.status);
            const isOverLimit = column.wipLimit && columnTasks.length > column.wipLimit;
            
            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-72"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.status)}
              >
                {/* Column Header */}
                <div className={cn(
                  "flex items-center justify-between p-3 rounded-t-lg",
                  column.color,
                  "text-white"
                )}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{column.title}</span>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {columnTasks.length}
                      {column.wipLimit && `/${column.wipLimit}`}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/20"
                    onClick={() => onAddTask?.(column.status)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* WIP Warning */}
                {isOverLimit && (
                  <div className="bg-destructive/10 text-destructive text-xs p-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Limite WIP dépassée!
                  </div>
                )}

                {/* Tasks */}
                <div className={cn(
                  "bg-muted/30 p-2 rounded-b-lg min-h-[400px] space-y-2",
                  isOverLimit && "border-2 border-destructive/30"
                )}>
                  {columnTasks.map((task) => {
                    const dueDate = task.due_date || task.dueDate;
                    const daysRemaining = dueDate ? getDaysRemaining(dueDate) : null;
                    const isOverdue = daysRemaining !== null && daysRemaining < 0;
                    const isDueSoon = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;
                    
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        onClick={() => onTaskClick?.(task.id)}
                        className={cn(
                          "bg-background rounded-lg p-3 shadow-sm border cursor-pointer",
                          "hover:shadow-md hover:border-primary/30 transition-all",
                          draggedTask === task.id && "opacity-50",
                          isOverdue && "border-destructive/50"
                        )}
                      >
                        {/* Priority & Tags */}
                         <div className="flex items-center gap-1 mb-2">
                           <Badge className={cn("text-xs h-5", getPriorityColor(task.priority))}>
                             {getPriorityIcon(task.priority)}
                             {task.priority}
                           </Badge>
                           {(task.tags || [])?.slice(0, 2).map(tag => (
                             <Badge key={tag} variant="outline" className="text-xs h-5">
                               {tag}
                             </Badge>
                           ))}
                         </div>

                        {/* Title */}
                        <h4 className="font-medium text-sm line-clamp-2 mb-2">
                          {task.title}
                        </h4>

                         {/* Progress */}
                         {(task.progress || 0) > 0 && (
                           <div className="mb-2">
                             <div className="flex justify-between text-xs text-muted-foreground mb-1">
                               <span>Progression</span>
                               <span>{task.progress}%</span>
                             </div>
                             <Progress value={task.progress || 0} className="h-1" />
                           </div>
                         )}

                         {/* Footer */}
                         <div className="flex items-center justify-between mt-2 pt-2 border-t">
                           {/* Assignee */}
                           {(task.assigned_to || task.assignee) ? (
                             <div className="flex items-center gap-1.5">
                               <Avatar className="h-5 w-5">
                                 <AvatarFallback className="text-xs bg-primary/10">
                                   {(task.assigned_to || task.assignee)?.substring(0, 2).toUpperCase()}
                                 </AvatarFallback>
                               </Avatar>
                               <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                 {task.assigned_to || task.assignee}
                               </span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-1 text-xs text-muted-foreground">
                               <User className="h-3 w-3" />
                               Non assigné
                             </div>
                           )}

                           {/* Due Date */}
                           {dueDate && (
                             <div className={cn(
                               "flex items-center gap-1 text-xs",
                               isOverdue && "text-destructive",
                               isDueSoon && "text-amber-600",
                               !isOverdue && !isDueSoon && "text-muted-foreground"
                             )}>
                               <Calendar className="h-3 w-3" />
                               {isOverdue ? (
                                 <span>En retard ({Math.abs(daysRemaining!)}j)</span>
                               ) : isDueSoon ? (
                                 <span>Dans {daysRemaining}j</span>
                               ) : (
                                 <span>{format(parseISO(dueDate), 'd MMM', { locale: fr })}</span>
                               )}
                             </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <p>Aucune tâche</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanBoard;
