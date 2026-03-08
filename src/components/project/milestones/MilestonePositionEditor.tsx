/**
 * Milestone Position Editor Component
 * Allows repositioning milestones on timeline/phases with weight adjustment
 * 
 * Supports drag-and-drop and manual date/weight editing
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { 
  Flag, 
  Calendar, 
  GripVertical,
  Edit,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { MilestoneDTO, MILESTONE_TYPES, MILESTONE_PRIORITIES, MilestonePriority, MilestoneType, GeneratedMilestoneDTO } from '@/dtos/entities/MilestoneDTO';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';

interface MilestonePositionEditorProps {
  milestones: (MilestoneDTO | GeneratedMilestoneDTO)[];
  phases: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
  }>;
  onMilestoneUpdate: (milestoneId: string, updates: Partial<{
    target_date: string;
    weight: number;
    phase_id: string;
    priority: MilestonePriority;
  }>) => void;
  onMilestoneReorder?: (milestones: (MilestoneDTO | GeneratedMilestoneDTO)[]) => void;
  readOnly?: boolean;
}

export const MilestonePositionEditor: React.FC<MilestonePositionEditorProps> = ({
  milestones,
  phases,
  onMilestoneUpdate,
  onMilestoneReorder,
  readOnly = false
}) => {
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    targetDate: string;
    weight: number;
    phaseId: string;
    priority: MilestonePriority;
  } | null>(null);

  const sortedMilestones = [...milestones].sort((a, b) => 
    new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  const handleEditStart = (milestone: MilestoneDTO | GeneratedMilestoneDTO) => {
    setEditingMilestone('id' in milestone ? milestone.id : milestone.templateId || null);
    setEditForm({
      targetDate: milestone.targetDate,
      weight: milestone.weight,
      phaseId: 'phaseId' in milestone ? milestone.phaseId || '' : '',
      priority: milestone.priority
    });
  };

  const handleEditSave = () => {
    if (editingMilestone && editForm) {
      onMilestoneUpdate(editingMilestone, editForm);
      setEditingMilestone(null);
      setEditForm(null);
    }
  };

  const handleEditCancel = () => {
    setEditingMilestone(null);
    setEditForm(null);
  };

  const moveMilestone = (index: number, direction: 'up' | 'down') => {
    if (!onMilestoneReorder) return;
    
    const newMilestones = [...sortedMilestones];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newMilestones.length) return;
    
    // Swap milestones
    [newMilestones[index], newMilestones[targetIndex]] = 
    [newMilestones[targetIndex], newMilestones[index]];
    
    onMilestoneReorder(newMilestones);
  };

  const getPhaseForDate = (dateStr: string): string | undefined => {
    const date = parseISO(dateStr);
    return phases.find(p => {
      const start = parseISO(p.startDate);
      const end = parseISO(p.endDate);
      return date >= start && date <= end;
    })?.id;
  };

  const getPriorityColor = (priority: MilestonePriority): string => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: MilestoneType): string => {
    switch (type) {
      case 'gate': return '🚪';
      case 'deliverable': return '📦';
      case 'checkpoint': return '✓';
      case 'event': return '🎯';
      default: return '📌';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flag className="h-5 w-5" />
          Positionnement des jalons
        </CardTitle>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun jalon à positionner</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedMilestones.map((milestone, index) => {
              const milestoneId = 'id' in milestone ? milestone.id : milestone.templateId;
              const isEditing = editingMilestone === milestoneId;
              const isRequiresInspection = 'requiresInspection' in milestone && milestone.requiresInspection;

              return (
                <div 
                  key={milestoneId}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isEditing ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  } transition-colors`}
                >
                  {/* Drag handle & reorder buttons */}
                  {!readOnly && onMilestoneReorder && (
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => moveMilestone(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => moveMilestone(index, 'down')}
                        disabled={index === sortedMilestones.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Milestone info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(milestone.type)}</span>
                      <span className="font-medium truncate">{milestone.title}</span>
                      <Badge variant={getPriorityColor(milestone.priority) as any} className="text-xs">
                        {MILESTONE_PRIORITIES[milestone.priority].label}
                      </Badge>
                      {isRequiresInspection && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Inspection
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(milestone.targetDate), 'dd/MM/yyyy')}
                      </span>
                      <span>Poids: {(milestone.weight * 100).toFixed(0)}%</span>
                      <span className="text-xs">{MILESTONE_TYPES[milestone.type].label}</span>
                    </div>
                  </div>

                  {/* Edit controls */}
                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEditCancel}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleEditSave}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStart(milestone)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        {editingMilestone && editForm && (
          <Dialog open={true} onOpenChange={() => handleEditCancel()}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier la position du jalon</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Date cible</Label>
                  <Input
                    type="date"
                    value={editForm.targetDate}
                    onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Phase associée</Label>
                  <Select 
                    value={editForm.phaseId} 
                    onValueChange={(value) => setEditForm({ ...editForm, phaseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {phases.map(phase => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priorité</Label>
                  <Select 
                    value={editForm.priority} 
                    onValueChange={(value) => setEditForm({ ...editForm, priority: value as MilestonePriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MILESTONE_PRIORITIES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Poids dans le calcul de progression ({(editForm.weight * 100).toFixed(0)}%)</Label>
                  <Slider
                    value={[editForm.weight * 100]}
                    onValueChange={([value]) => setEditForm({ ...editForm, weight: value / 100 })}
                    min={5}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleEditCancel}>
                    Annuler
                  </Button>
                  <Button onClick={handleEditSave}>
                    Enregistrer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default MilestonePositionEditor;
