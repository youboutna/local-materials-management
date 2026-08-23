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
import { EnhancedActionService, UnifiedActionRequest, EnhancedActionServiceStatic } from '@/application/services/enhancedActionService';
import { T } from '@/components/i18n/T';
import { useI18n } from '@/hooks/useI18n';

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
  const { t } = useI18n();

  const form = useForm<z.infer<typeof actionFormSchema>>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      priority: 'medium',
      recipientIds: []
    }
  });

  const actionTypes = [
    { value: 'task_assignment', label: t('auto.actions.task_assignment'), icon: Briefcase, description: t('auto.actions.desc.task_assignment') },
    { value: 'hierarchy_notification', label: t('auto.actions.hierarchy_notification'), icon: Users, description: t('auto.actions.desc.hierarchy_notification') },
    { value: 'sms', label: t('auto.actions.sms'), icon: MessageSquare, description: t('auto.actions.desc.sms') },
    { value: 'call', label: t('auto.actions.call'), icon: Phone, description: t('auto.actions.desc.call') },
    { value: 'email', label: t('auto.actions.email'), icon: Mail, description: t('auto.actions.desc.email') },
    { value: 'mail', label: t('auto.actions.mail'), icon: Send, description: t('auto.actions.desc.mail') }
  ];

  const priorityLevels = [
    { value: 'low', label: t('auto.actions.priority.low'), color: 'bg-success-soft text-success', icon: Target },
    { value: 'medium', label: t('auto.actions.priority.medium'), color: 'bg-primary/10 text-primary', icon: Target },
    { value: 'high', label: t('auto.actions.priority.high'), color: 'bg-warning/10 text-warning', icon: AlertTriangle },
    { value: 'urgent', label: t('auto.actions.priority.urgent'), color: 'bg-destructive/10 text-destructive', icon: AlertTriangle }
  ];

  const escalationLevels = [
    { value: 'team', label: t('auto.actions.escalation.team'), description: t('auto.actions.escalation.desc.team') },
    { value: 'supervisor', label: t('auto.actions.escalation.supervisor'), description: t('auto.actions.escalation.desc.supervisor') },
    { value: 'manager', label: t('auto.actions.escalation.manager'), description: t('auto.actions.escalation.desc.manager') },
    { value: 'director', label: t('auto.actions.escalation.director'), description: t('auto.actions.escalation.desc.director') }
  ];

  const getEntityTypeLabel = (type: string): string => {
    const label = t(`auto.actions.entity.${type}`);
    return label && label !== `auto.actions.entity.${type}` ? label : type;
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

      const result = await EnhancedActionServiceStatic.executeAction(actionRequest);

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
                  <FormLabel><T k="auto.universalactionsinterface.assigne_a" fallback="Assigné à" /></FormLabel>
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
                  <FormLabel><T k="auto.universalactionsinterface.date_d_echeance" fallback="Date d'échéance" /></FormLabel>
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
                <FormLabel><T k="auto.universalactionsinterface.niveau_d_escalade" fallback="Niveau d'escalade" /></FormLabel>
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
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {actionType === 'sms' ? <MessageSquare className="h-4 w-4 text-primary" /> : <Phone className="h-4 w-4 text-primary" />}
              <span className="text-sm font-medium text-primary">
                <T k="auto.universalactionsinterface.communication_directe" fallback="Communication directe" />
              </span>
            </div>
            <p className="text-sm text-primary">
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
            <T k="auto.universalactionsinterface.actions" fallback="Actions" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <T k="auto.universalactionsinterface.creer_une_action" fallback="Créer une Action" />
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
                  <FormLabel><T k="auto.universalactionsinterface.type_d_action" fallback="Type d'action" /></FormLabel>
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
                  <FormLabel><T k="auto.universalactionsinterface.priorite" fallback="Priorité" /></FormLabel>
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
                  <FormLabel><T k="auto.universalactionsinterface.destinataires" fallback="Destinataires" /></FormLabel>
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
                    <FormLabel><T k="auto.universalactionsinterface.titre" fallback="Titre" /></FormLabel>
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
                    <FormLabel><T k="auto.universalactionsinterface.message" fallback="Message" /></FormLabel>
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
                <T k="auto.universalactionsinterface.annuler" fallback="Annuler" />
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    <T k="auto.universalactionsinterface.creation" fallback="Création..." />
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <T k="auto.universalactionsinterface.creer_l_action" fallback="Créer l'Action" />
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