import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Users, Send, Phone, Mail, FileText, Download, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export interface ActionFormData {
  actionType: 'task_assignment' | 'hierarchy_notification' | 'sms' | 'call' | 'email' | 'mail' | 'export_receipt' | 'blockchain_verification';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  recipientIds: string[];
  dueDate?: Date;
  escalationLevel?: 'team' | 'supervisor' | 'manager' | 'director';
  metadata?: Record<string, any>;
}

interface ActionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: ActionFormData) => Promise<void>;
  entityType: 'bank_guarantee' | 'inspection' | 'insurance' | 'payment' | 'project';
  entityId: string;
  availableEmployees?: Array<{ id: string; full_name: string; email?: string; position?: string; }>;
  availableRecipients?: Array<{ id: string; name: string; email?: string; phone?: string; }>;
  defaultValues?: Partial<ActionFormData>;
}

const actionIcons = {
  task_assignment: Users,
  hierarchy_notification: Users,
  sms: Send,
  call: Phone,
  email: Mail,
  mail: FileText,
  export_receipt: Download,
  blockchain_verification: Shield,
};

const actionLabels = {
  task_assignment: 'Assigner une tâche',
  hierarchy_notification: 'Notifier la hiérarchie',
  sms: 'Envoyer SMS',
  call: 'Programmer appel',
  email: 'Envoyer email',
  mail: 'Courrier postal',
  export_receipt: 'Exporter reçu',
  blockchain_verification: 'Vérification blockchain',
};

export const ActionFormDialog: React.FC<ActionFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  entityType,
  entityId,
  availableEmployees = [],
  availableRecipients = [],
  defaultValues = {},
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ActionFormData>({
    actionType: 'task_assignment',
    title: '',
    message: '',
    priority: 'medium',
    recipientIds: [],
    ...defaultValues,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.title.trim()) {
        toast({
          title: "Erreur",
          description: "Le titre est requis",
          variant: "destructive",
        });
        return;
      }

      if (!formData.message.trim()) {
        toast({
          title: "Erreur", 
          description: "Le message est requis",
          variant: "destructive",
        });
        return;
      }

      if (formData.actionType === 'task_assignment' && !formData.assigneeId) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un assigné pour la tâche",
          variant: "destructive",
        });
        return;
      }

      if (formData.recipientIds.length === 0 && formData.actionType !== 'task_assignment') {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner au moins un destinataire",
          variant: "destructive",
        });
        return;
      }

      await onSubmit(formData);
      
      toast({
        title: "Succès",
        description: `Action "${actionLabels[formData.actionType]}" créée avec succès`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting action:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'action",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecipientChange = (recipientId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      recipientIds: checked 
        ? [...prev.recipientIds, recipientId]
        : prev.recipientIds.filter(id => id !== recipientId)
    }));
  };

  const ActionIcon = actionIcons[formData.actionType];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActionIcon className="h-5 w-5" />
            Nouvelle Action - {actionLabels[formData.actionType]}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Action Type */}
          <div className="space-y-2">
            <Label htmlFor="actionType">Type d'action</Label>
            <Select 
              value={formData.actionType} 
              onValueChange={(value: ActionFormData['actionType']) => 
                setFormData(prev => ({ ...prev, actionType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(actionLabels).map(([key, label]) => {
                  const Icon = actionIcons[key as keyof typeof actionIcons];
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titre de l'action..."
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Décrivez l'action à effectuer..."
              rows={4}
              required
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value: ActionFormData['priority']) => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <span className="text-green-600">● Faible</span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="text-yellow-600">● Moyenne</span>
                </SelectItem>
                <SelectItem value="high">
                  <span className="text-orange-600">● Élevée</span>
                </SelectItem>
                <SelectItem value="urgent">
                  <span className="text-red-600">● Urgente</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Task Assignment Specific Fields */}
          {formData.actionType === 'task_assignment' && (
            <div className="space-y-2">
              <Label htmlFor="assignee">Assigné à</Label>
              <Select 
                value={formData.assigneeId || ''} 
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, assigneeId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un employé..." />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} {employee.position && `(${employee.position})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Hierarchy Notification Specific Fields */}
          {formData.actionType === 'hierarchy_notification' && (
            <div className="space-y-2">
              <Label htmlFor="escalationLevel">Niveau d'escalade</Label>
              <Select 
                value={formData.escalationLevel || 'team'} 
                onValueChange={(value: 'team' | 'supervisor' | 'manager' | 'director') => 
                  setFormData(prev => ({ ...prev, escalationLevel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Équipe</SelectItem>
                  <SelectItem value="supervisor">Superviseur</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="director">Directeur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recipients - Dynamic based on action type */}
          {formData.actionType !== 'hierarchy_notification' && formData.actionType !== 'task_assignment' && (
            <div className="space-y-2">
              <Label>
                {formData.actionType === 'sms' && 'Destinataires SMS (personnes avec numéro de téléphone)'}
                {formData.actionType === 'email' && 'Destinataires Email (personnes avec adresse email)'}
                {formData.actionType === 'call' && 'Personnes à appeler (avec numéro de téléphone)'}
                {formData.actionType === 'mail' && 'Destinataires courrier postal (avec adresse)'}
                {!['sms', 'email', 'call', 'mail'].includes(formData.actionType) && 'Destinataires'}
              </Label>
              <div className="text-xs text-muted-foreground mb-2">
                {formData.actionType === 'sms' && 'Sélectionnez les personnes qui recevront le SMS'}
                {formData.actionType === 'email' && 'Sélectionnez les personnes qui recevront l\'email'}
                {formData.actionType === 'call' && 'Sélectionnez les personnes à contacter par téléphone'}
                {formData.actionType === 'mail' && 'Sélectionnez les personnes qui recevront le courrier postal'}
              </div>
              <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                {availableRecipients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun destinataire disponible</p>
                ) : (
                  availableRecipients
                    .filter(recipient => {
                      // Filter recipients based on action type requirements
                      if (formData.actionType === 'sms' || formData.actionType === 'call') {
                        return recipient.phone;
                      }
                      if (formData.actionType === 'email') {
                        return recipient.email;
                      }
                      return true; // For other action types, show all
                    })
                    .map((recipient) => (
                      <label key={recipient.id} className="flex items-center gap-2 cursor-pointer py-1">
                        <input
                          type="checkbox"
                          checked={formData.recipientIds.includes(recipient.id)}
                          onChange={(e) => handleRecipientChange(recipient.id, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {recipient.name}
                          {recipient.email && formData.actionType === 'email' && ` (${recipient.email})`}
                          {recipient.phone && (formData.actionType === 'sms' || formData.actionType === 'call') && ` - ${recipient.phone}`}
                          {!['sms', 'email', 'call'].includes(formData.actionType) && (
                            <>
                              {recipient.email && ` (${recipient.email})`}
                              {recipient.phone && ` - ${recipient.phone}`}
                            </>
                          )}
                        </span>
                      </label>
                    ))
                )}
                {availableRecipients.filter(recipient => {
                  if (formData.actionType === 'sms' || formData.actionType === 'call') {
                    return recipient.phone;
                  }
                  if (formData.actionType === 'email') {
                    return recipient.email;
                  }
                  return true;
                }).length === 0 && (
                  <p className="text-sm text-orange-600">
                    {formData.actionType === 'sms' && 'Aucune personne avec numéro de téléphone disponible'}
                    {formData.actionType === 'email' && 'Aucune personne avec adresse email disponible'}
                    {formData.actionType === 'call' && 'Aucune personne avec numéro de téléphone disponible'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Hierarchy Notification Recipients Info */}
          {formData.actionType === 'hierarchy_notification' && (
            <div className="space-y-2">
              <Label>Destinataires hiérarchiques</Label>
              <div className="text-xs text-muted-foreground mb-2">
                Les notifications seront automatiquement envoyées aux personnes du niveau hiérarchique sélectionné
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  <strong>Niveau sélectionné :</strong> {
                    formData.escalationLevel === 'team' && 'Équipe - Collègues de même niveau'
                  }
                  {formData.escalationLevel === 'supervisor' && 'Superviseur - Responsable direct'}
                  {formData.escalationLevel === 'manager' && 'Manager - Responsable de service'}
                  {formData.escalationLevel === 'director' && 'Directeur - Direction générale'}
                </div>
              </div>
            </div>
          )}

          {/* Task Assignment Info */}
          {formData.actionType === 'task_assignment' && formData.assigneeId && (
            <div className="space-y-2">
              <Label>Personne assignée</Label>
              <div className="text-xs text-muted-foreground mb-2">
                La tâche sera assignée à la personne sélectionnée ci-dessus
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm">
                  <strong>Assigné à :</strong> {
                    availableEmployees.find(emp => emp.id === formData.assigneeId)?.full_name || 'Employé sélectionné'
                  }
                  {availableEmployees.find(emp => emp.id === formData.assigneeId)?.position && 
                    ` (${availableEmployees.find(emp => emp.id === formData.assigneeId)?.position})`
                  }
                </div>
              </div>
            </div>
          )}

          {/* Due Date */}
          {(formData.actionType === 'task_assignment' || formData.actionType === 'call') && (
            <div className="space-y-2">
              <Label htmlFor="dueDate">
                {formData.actionType === 'call' ? 'Date de l\'appel' : 'Date d\'échéance'}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate 
                      ? format(formData.dueDate, 'PPP', { locale: fr })
                      : "Sélectionnez une date..."
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer l\'action'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};