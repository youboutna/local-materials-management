import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Bell, 
  Users, 
  Phone, 
  Mail, 
  MessageSquare, 
  Send, 
  AlertTriangle,
  Briefcase,
  Target,
  Clock,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserSelector from '@/components/selectors/UserSelector';
import { EnhancedActionService, UnifiedActionRequest } from '@/application/services/enhancedActionService';

const actionFormSchema = z.object({
  actionType: z.enum(['task_assignment', 'hierarchy_notification', 'sms', 'call', 'email', 'mail']),
  title: z.string().min(1, 'Titre requis'),
  message: z.string().min(1, 'Message requis'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigneeId: z.string().optional(),
  recipientIds: z.array(z.string()).min(1, 'Au moins un destinataire requis'),
  dueDate: z.string().optional(),
  escalationLevel: z.enum(['team', 'supervisor', 'manager', 'director']).optional()
});

interface UniversalActionsInterfaceProps {
  entityType: 'bank_guarantee' | 'inspection' | 'insurance' | 'payment' | 'project';
  entityId: string;
  projectId: string;
  contractorId?: string;
  onActionComplete?: () => void;
  triggerButton?: React.ReactNode;
  contextualInfo?: {
    entityName?: string;
    entityDescription?: string;
  };
}

const UniversalActionsInterface: React.FC<UniversalActionsInterfaceProps> = ({
  entityType,
  entityId,
  projectId,
  contractorId,
  onActionComplete,
  triggerButton,
  contextualInfo
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof actionFormSchema>>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      priority: 'medium',
      recipientIds: []
    }
  });

  const actionTypes = [
    { value: 'task_assignment', label: 'Assignation de tâche', icon: Briefcase, description: 'Assigner une tâche spécifique à un employé' },
    { value: 'hierarchy_notification', label: 'Notification hiérarchique', icon: Users, description: 'Notifier la hiérarchie selon l\'escalade définie' },
    { value: 'sms', label: 'SMS', icon: MessageSquare, description: 'Envoyer un message SMS urgent' },
    { value: 'call', label: 'Appel téléphonique', icon: Phone, description: 'Programmer un appel téléphonique' },
    { value: 'email', label: 'Email', icon: Mail, description: 'Envoyer un email détaillé' },
    { value: 'mail', label: 'Courrier postal', icon: Send, description: 'Générer un courrier postal officiel' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Faible', color: 'bg-green-100 text-green-800', icon: Target },
    { value: 'medium', label: 'Moyen', color: 'bg-blue-100 text-blue-800', icon: Target },
    { value: 'high', label: 'Élevé', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
  ];

  const escalationLevels = [
    { value: 'team', label: 'Équipe (Collègues)', description: 'Notifier les membres de l\'équipe' },
    { value: 'supervisor', label: 'Superviseur', description: 'Escalader au superviseur direct' },
    { value: 'manager', label: 'Manager', description: 'Escalader au niveau management' },
    { value: 'director', label: 'Directeur', description: 'Escalader au niveau direction' }
  ];

  const getEntityTypeLabel = (type: string): string => {
    const labels = {
      bank_guarantee: 'Garantie Bancaire',
      inspection: 'Inspection',
      insurance: 'Assurance',
      payment: 'Paiement',
      project: 'Projet'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const onSubmitAction = async (values: z.infer<typeof actionFormSchema>) => {
    try {
      setLoading(true);

      const actionRequest: UnifiedActionRequest = {
        entityType,
        entityId,
        projectId,
        contractorId,
        actionType: values.actionType,
        title: values.title,
        message: values.message,
        priority: values.priority,
        assigneeId: values.assigneeId,
        recipientIds: values.recipientIds,
        dueDate: values.dueDate,
        escalationLevel: values.escalationLevel,
        metadata: {
          entityName: contextualInfo?.entityName,
          entityDescription: contextualInfo?.entityDescription,
          createdAt: new Date().toISOString()
        }
      };

      const result = await EnhancedActionService.executeAction(actionRequest);

      if (result.success) {
        toast({
          title: "Action exécutée avec succès",
          description: `${actionTypes.find(t => t.value === values.actionType)?.label} envoyée à ${result.notificationsSent} destinataire(s)`
        });

        form.reset();
        setIsDialogOpen(false);
        onActionComplete?.();
      } else {
        throw new Error(result.error || 'Échec de l\'exécution de l\'action');
      }

    } catch (error: any) {
      console.error('Error executing action:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'exécution de l'action",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderActionTypeFields = () => {
    const actionType = form.watch('actionType');

    switch (actionType) {
      case 'task_assignment':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigné à</FormLabel>
                  <FormControl>
                    <UserSelector
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Sélectionner la personne responsable"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'échéance</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'hierarchy_notification':
        return (
          <FormField
            control={form.control}
            name="escalationLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Niveau d'escalade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le niveau d'escalade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {escalationLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-sm text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'sms':
      case 'call':
        return (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {actionType === 'sms' ? <MessageSquare className="h-4 w-4 text-blue-600" /> : <Phone className="h-4 w-4 text-blue-600" />}
              <span className="text-sm font-medium text-blue-800">
                Communication directe
              </span>
            </div>
            <p className="text-sm text-blue-700">
              {actionType === 'sms' 
                ? 'Un SMS sera envoyé aux destinataires sélectionnés avec le message spécifié.'
                : 'Un appel téléphonique sera programmé avec les destinataires sélectionnés.'
              }
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Actions
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Créer une Action
          </DialogTitle>
          <DialogDescription>
            Configurer une action pour {getEntityTypeLabel(entityType)} 
            {contextualInfo?.entityName && ` - ${contextualInfo.entityName}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-4">
            <FormField
              control={form.control}
              name="actionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'action</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type d'action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {actionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-start gap-3">
                            <type.icon className="h-4 w-4 mt-0.5" />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorité</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la priorité" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center gap-2">
                            <level.icon className="h-4 w-4" />
                            <Badge variant="secondary" className={level.color}>
                              {level.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destinataires</FormLabel>
                  <FormControl>
                    <UserSelector
                      value=""
                      onChange={(userId) => {
                        const currentRecipients = field.value || [];
                        if (!currentRecipients.includes(userId)) {
                          field.onChange([...currentRecipients, userId]);
                        }
                      }}
                      placeholder="Ajouter des destinataires"
                    />
                  </FormControl>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(field.value || []).map((recipientId, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        <UserCheck className="h-3 w-3" />
                        {recipientId}
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange(field.value?.filter(id => id !== recipientId));
                          }}
                          className="ml-1 text-xs hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre</FormLabel>
                    <FormControl>
                      <Input placeholder="Titre de l'action" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Décrivez l'action à effectuer..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {renderActionTypeFields()}

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Créer l'Action
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UniversalActionsInterface;