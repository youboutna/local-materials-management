/**
 * ScheduleInspectionModal - Modal réutilisable pour programmer des inspections
 * Utilisable depuis PhaseDetailsPage et ProjectDetailByDTO
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, FileText, Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  InspectionPermissionService
} from '@/application/services/InspectionPermissionService';
import {
  PermissionContextDTO,
  AssignableInspectorDTO,
  PermissionResultDTO
} from '@/dtos/entities/InspectionPermissionDTO';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { 
  InspectionScheduleData,
  InspectionType,
  INSPECTION_TYPES 
} from '@/application/services/InspectionSchedulingService';

interface ScheduleInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  phaseId?: string | null;
  projectName?: string;
  phaseName?: string;
  onSuccess?: () => void;
}

const ScheduleInspectionModal: React.FC<ScheduleInspectionModalProps> = ({
  open,
  onOpenChange,
  projectId,
  phaseId,
  projectName,
  phaseName,
  onSuccess,
}) => {
  // Form state
  const [inspectionType, setInspectionType] = useState<InspectionType | ''>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [estimatedDuration, setEstimatedDuration] = useState(2);
  const [selectedInspectorId, setSelectedInspectorId] = useState('');
  const [backupInspectorId, setBackupInspectorId] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const [validationCriteria, setValidationCriteria] = useState('');
  const [priority, setPriority] = useState<'medium' | 'high' | 'low'>('medium');
  const [notifyContractor, setNotifyContractor] = useState(true);
  const [reminders, setReminders] = useState({
    seven_days: true,
    one_day: true,
    two_hours: false,
  });
  const [comments, setComments] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityWarning, setAvailabilityWarning] = useState<string | null>(null);

  interface UserContext {
  userId: string;
  role: string;
}

// Fetch permissions
  const { data: userContext } = useQuery<UserContext>({
    queryKey: ['user-role'],
    queryFn: () => ({ userId: 'default-user', role: 'inspector' }), // Mock user context for now
  });

  // Build permission context
  const permissionContext: PermissionContext | null = useMemo(() => {
    if (!userContext) return null;
    return {
      userId: userContext.userId || 'default-user',
      projectId,
      phaseId: phaseId || undefined,
      inspectionType: typeof inspectionType === 'string' ? inspectionType : inspectionType?.id || ''
    };
  }, [userContext, projectId, phaseId, inspectionType]);

  // Check permissions
  const { data: permissions } = useQuery({
    queryKey: ['inspection-permissions', permissionContext],
    queryFn: () => permissionContext ? { 
      hasPermission: true,
      reason: permissionContext ? undefined : 'Permission refusée',
      canSchedule: true,
      canSetHighPriority: true,
      message: permissionContext ? undefined : 'Permission accordée'
    } : null, // Mock permission check for now
    enabled: !!permissionContext,
  });

  // Fetch assignable inspectors
  const { data: inspectors = [] } = useQuery({
    queryKey: ['assignable-inspectors', permissionContext],
    queryFn: async () => {
      if (!permissionContext) return [];
      const repository = RepositoryFactory.getInspectionPermissionRepository();
      const service = new InspectionPermissionService(repository);
      return await service.getAssignableInspectors({ context: permissionContext });
    },
    enabled: !!permissionContext,
  });

  // Get selected inspector details
  const selectedInspector = useMemo(() => 
    inspectors.find(i => i.id === selectedInspectorId),
    [inspectors, selectedInspectorId]
  );

  // Update duration when inspection type changes
  useEffect(() => {
    if (inspectionType) {
      // Use the inspection type object directly
      const config = typeof inspectionType === 'string' ? null : inspectionType;
      if (config && 'estimatedDuration' in config) {
        setEstimatedDuration(config.estimatedDuration);
        setRequiredDocuments(config.requiresDocuments ? ['pv_service_fait', 'photos'] : []);
      }
    }
  }, [inspectionType]);

  // Auto-select default inspector when inspectors are loaded
  useEffect(() => {
    if (inspectors.length > 0 && !selectedInspectorId) {
      // For now, select the first inspector as there's no isDefault property
      const defaultInspector = inspectors[0];
      if (defaultInspector) {
        setSelectedInspectorId(defaultInspector.id);
      }
    }
  }, [inspectors, selectedInspectorId]);

  // Check availability when inspector or date changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedInspectorId || !scheduledDate) {
        setAvailabilityWarning(null);
        return;
      }

      const result = await InspectionSchedulingService.checkInspectorAvailability(
        selectedInspectorId,
        scheduledDate
      );

      if (!result) {
        setAvailabilityWarning('Inspecteur non disponible à cette date');
      } else {
        setAvailabilityWarning(null);
      }
    };

    checkAvailability();
  }, [selectedInspectorId, scheduledDate, estimatedDuration]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setInspectionType('');
      setScheduledDate('');
      setScheduledTime('09:00');
      setEstimatedDuration(2);
      setSelectedInspectorId('');
      setBackupInspectorId('');
      setRequiredDocuments([]);
      setValidationCriteria('');
      setPriority('medium');
      setNotifyContractor(true);
      setReminders({ seven_days: true, one_day: true, two_hours: false });
      setComments('');
      setAvailabilityWarning(null);
    }
  }, [open]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!inspectionType || !scheduledDate || !selectedInspectorId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!permissions?.canSchedule) {
      toast.error(permissions?.message || 'Vous n\'avez pas la permission de programmer des inspections');
      return;
    }

    if (priority === 'high' && !permissions.canSetHighPriority) {
      toast.warning('Priorité haute nécessite approbation du chef de projet. Priorité changée à "moyenne".');
      setPriority('medium');
    }

    setIsSubmitting(true);

    try {
      const scheduleData: InspectionScheduleData = {
        inspectionId: crypto.randomUUID(),
        scheduledDate: `${scheduledDate}T${scheduledTime}:00.000Z`,
        scheduledTime: scheduledTime,
        estimatedDuration: estimatedDuration,
        inspectorId: selectedInspectorId,
        backupInspectorId: backupInspectorId || undefined,
        requiredDocuments: requiredDocuments,
        notes: comments,
      };

      const result = await InspectionSchedulingService.scheduleInspection(scheduleData);

      if (result) {
        toast.success('Inspection programmée avec succès');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error('Erreur lors de la programmation');
      }
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      toast.error('Erreur lors de la programmation de l\'inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle document requirement
  const toggleDocument = (doc: string) => {
    setRequiredDocuments(prev => 
      prev.includes(doc) 
        ? prev.filter(d => d !== doc)
        : [...prev, doc]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Programmer une Inspection
          </DialogTitle>
          <DialogDescription>
            {projectName && <span className="font-medium">{projectName}</span>}
            {phaseName && <span className="text-muted-foreground"> • {phaseName}</span>}
          </DialogDescription>
        </DialogHeader>

        {/* Permission warning */}
        {permissions && !permissions.canSchedule && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{permissions.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 py-4">
          {/* Section 1: Paramètres */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paramètres de l'inspection
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type d'inspection *</Label>
                <Select value={inspectionType} onValueChange={(v) => setInspectionType(v as InspectionType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(INSPECTION_TYPES).map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select 
                  value={priority} 
                  onValueChange={(v) => setPriority(v as 'high' | 'medium' | 'low')}
                  disabled={!permissions?.canSetHighPriority && priority === 'high'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high" disabled={!permissions?.canSetHighPriority}>
                      Haute {!permissions?.canSetHighPriority && '(Requiert approbation)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Durée (heures)</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 2: Assignation */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Assignation
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inspecteur principal *</Label>
                <Select value={selectedInspectorId} onValueChange={setSelectedInspectorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un inspecteur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inspectors.map(inspector => (
                      <SelectItem key={inspector.id} value={inspector.id}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{inspector.name}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availabilityWarning && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {availabilityWarning}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Inspecteur suppléant</Label>
                <Select value={backupInspectorId || "none"} onValueChange={(v) => setBackupInspectorId(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optionnel..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="none">Aucun</SelectItem>
                    {inspectors
                      .filter(i => i.id && i.id.trim() !== '' && i.id !== selectedInspectorId)
                      .map(inspector => (
                        <SelectItem key={inspector.id} value={inspector.id}>
                          {inspector.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 3: Documents & Critères */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Exigences
            </h3>

            <div className="space-y-2">
              <Label>Documents requis</Label>
              <div className="flex flex-wrap gap-2">
                {inspectionType && InspectionSchedulingService.getInspectionTypeConfig(inspectionType)?.required_documents.map(doc => (
                  <Badge
                    key={doc}
                    variant={requiredDocuments.includes(doc) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleDocument(doc)}
                  >
                    {requiredDocuments.includes(doc) && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Critères de validation</Label>
              <Textarea
                placeholder="Décrivez les critères de réussite de l'inspection..."
                value={validationCriteria}
                onChange={(e) => setValidationCriteria(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Section 4: Notifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Rappels et notifications
            </h3>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-contractor"
                  checked={notifyContractor}
                  onCheckedChange={(checked) => setNotifyContractor(checked as boolean)}
                />
                <Label htmlFor="notify-contractor" className="text-sm">
                  Notifier l'entrepreneur
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminder-7d"
                  checked={reminders.seven_days}
                  onCheckedChange={(checked) => setReminders(r => ({ ...r, seven_days: checked as boolean }))}
                />
                <Label htmlFor="reminder-7d" className="text-sm">7 jours avant</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminder-1d"
                  checked={reminders.one_day}
                  onCheckedChange={(checked) => setReminders(r => ({ ...r, one_day: checked as boolean }))}
                />
                <Label htmlFor="reminder-1d" className="text-sm">1 jour avant</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminder-2h"
                  checked={reminders.two_hours}
                  onCheckedChange={(checked) => setReminders(r => ({ ...r, two_hours: checked as boolean }))}
                />
                <Label htmlFor="reminder-2h" className="text-sm">2 heures avant</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes additionnelles</Label>
              <Textarea
                placeholder="Informations complémentaires..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !permissions?.canSchedule}
          >
            {isSubmitting ? 'Programmation...' : 'Programmer l\'inspection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleInspectionModal;
