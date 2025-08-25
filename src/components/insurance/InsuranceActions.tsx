import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { createInsuranceAction, getInsuranceActions } from '@/services/insuranceActionService';
import UserSelector from '@/components/selectors/UserSelector';
import { Calendar, Users, Phone, Mail, MessageSquare, FileText, Shield } from 'lucide-react';

interface InsuranceActionsProps {
  insuranceId: string;
  projectId: string;
  contractorId: string;
  expiryData?: any;
}

const InsuranceActions: React.FC<InsuranceActionsProps> = ({
  insuranceId,
  projectId,
  contractorId,
  expiryData
}) => {
  const [actionType, setActionType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [escalationLevel, setEscalationLevel] = useState<'team' | 'supervisor' | 'manager' | 'director'>('team');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionTypes = [
    { value: 'task_assignment', label: 'Assignation de tâche', icon: Calendar },
    { value: 'hierarchy_notification', label: 'Notification hiérarchique', icon: Users },
    { value: 'sms', label: 'SMS', icon: MessageSquare },
    { value: 'call', label: 'Appel téléphonique', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'mail', label: 'Courrier postal', icon: FileText }
  ];

  const priorities = [
    { value: 'low', label: 'Faible', color: 'bg-blue-100 text-blue-800' },
    { value: 'medium', label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' }
  ];

  const escalationLevels = [
    { value: 'team', label: 'Équipe' },
    { value: 'supervisor', label: 'Superviseur' },
    { value: 'manager', label: 'Manager' },
    { value: 'director', label: 'Direction' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!actionType || !title || !message || recipientIds.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createInsuranceAction({
        insuranceId,
        projectId,
        contractorId,
        actionType: actionType as any,
        title,
        message,
        priority,
        assigneeId: assigneeId || undefined,
        recipientIds,
        dueDate: dueDate || undefined,
        escalationLevel: actionType === 'hierarchy_notification' ? escalationLevel : undefined,
        metadata: {
          expiryData,
          createdFrom: 'insurance_monitor'
        }
      });

      toast({
        title: 'Action créée',
        description: `Action "${title}" créée et exécutée avec succès`,
      });

      // Reset form
      setActionType('');
      setTitle('');
      setMessage('');
      setPriority('medium');
      setAssigneeId('');
      setRecipientIds([]);
      setDueDate('');
      setEscalationLevel('team');
      
    } catch (error) {
      console.error('Error creating action:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'action',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionIcon = (type: string) => {
    const actionType = actionTypes.find(a => a.value === type);
    return actionType ? actionType.icon : Shield;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500" />
          Actions de Contrôle - Assurance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Action Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Type d'action *</label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type d'action" />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Titre *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'action"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message *</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez l'action à entreprendre..."
              rows={4}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priorité</label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={p.color}>{p.label}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Assignment Fields */}
          {actionType === 'task_assignment' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigné à</label>
                <UserSelector
                  value={assigneeId}
                  onChange={setAssigneeId}
                  placeholder="Sélectionner un utilisateur"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date d'échéance</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Hierarchy Notification Fields */}
          {actionType === 'hierarchy_notification' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau d'escalade</label>
              <Select value={escalationLevel} onValueChange={(value: any) => setEscalationLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {escalationLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recipients */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Destinataires *</label>
            <UserSelector
              value=""
              onChange={(userId) => {
                if (userId && !recipientIds.includes(userId)) {
                  setRecipientIds([...recipientIds, userId]);
                }
              }}
              placeholder="Ajouter un destinataire"
            />
            {recipientIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipientIds.map((id) => (
                  <Badge key={id} variant="secondary" className="cursor-pointer" 
                    onClick={() => setRecipientIds(recipientIds.filter(r => r !== id))}>
                    Utilisateur {id.slice(0, 8)}... ✕
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Création en cours...' : 'Créer et Exécuter l\'Action'}
          </Button>
        </form>

        {/* Action History */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-medium mb-4">Historique des Actions</h3>
          <div className="space-y-2">
            {getInsuranceActions(insuranceId).map((action) => {
              const Icon = getActionIcon(action.actionType);
              return (
                <div key={action.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(action.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <Badge variant={action.status === 'completed' ? 'default' : 'secondary'}>
                    {action.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsuranceActions;