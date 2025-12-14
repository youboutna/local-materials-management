import UserSelector from '@/components/selectors/UserSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    AlertTriangle,
    Bell,
    Briefcase,
    Mail,
    MessageSquare,
    Phone,
    Send,
    Shield,
    Target,
    Users
} from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const actionFormSchema = z.object({
  actionType: z.enum(['task_assignment', 'hierarchy_notification', 'sms', 'call', 'email', 'mail']),
  assigneeId: z.string().optional(),
  recipientIds: z.array(z.string()).min(1, 'Au moins un destinataire requis'),
  title: z.string().min(1, 'Titre requis'),
  message: z.string().min(1, 'Message requis'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
  escalationLevel: z.enum(['team', 'supervisor', 'manager', 'director']).optional(),
  documentReferences: z.array(z.string()).optional(),
  followUpRequired: z.boolean().default(false),
  notificationChannels: z.array(z.string()).optional()
});

interface PaymentControlActionsProps {
  paymentId: string;
  projectId: string;
  contractorId: string;
  amount: number;
  blockingReasons?: Array<{
    reason: string;
    description: string;
    severity: 'warning' | 'blocking';
  }>;
}

const PaymentControlActions: React.FC<PaymentControlActionsProps> = ({
  paymentId,
  projectId,
  contractorId,
  amount,
  blockingReasons = []
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { createNotification } = useNotifications();

  const form = useForm<z.infer<typeof actionFormSchema>>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      priority: 'medium',
      followUpRequired: false,
      recipientIds: [],
      notificationChannels: ['email']
    }
  });

  const actionTypes = [
    { value: 'task_assignment', label: 'Assignation de tâche', icon: Briefcase },
    { value: 'hierarchy_notification', label: 'Notification hiérarchique', icon: Users },
    { value: 'sms', label: 'SMS', icon: MessageSquare },
    { value: 'call', label: 'Appel téléphonique', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'mail', label: 'Courrier postal', icon: Send }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Faible', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Moyen', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'Élevé', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const escalationLevels = [
    { value: 'team', label: 'Équipe (Collègues)' },
    { value: 'supervisor', label: 'Superviseur' },
    { value: 'manager', label: 'Manager' },
    { value: 'director', label: 'Directeur' }
  ];

  const notificationChannels = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'push', label: 'Notification push' },
    { value: 'system', label: 'Notification système' }
  ];

  const onSubmitAction = async (values: z.infer<typeof actionFormSchema>) => {
    try {
      setLoading(true);

      const actionMetadata = {
        paymentId,
        projectId,
        contractorId,
        amount,
        blockingReasons,
        actionType: values.actionType,
        priority: values.priority,
        escalationLevel: values.escalationLevel,
        dueDate: values.dueDate,
        documentReferences: values.documentReferences,
        followUpRequired: values.followUpRequired,
        notificationChannels: values.notificationChannels
      };

      // Create notifications for each recipient
      for (const recipientId of values.recipientIds) {
        await createNotification(
          recipientId,
          values.title,
          values.message,
          'payment_action',
          paymentId,
          actionMetadata
        );
      }

      // Handle specific action types
      switch (values.actionType) {
        case 'task_assignment':
          await handleTaskAssignment(values, actionMetadata);
          break;
        case 'hierarchy_notification':
          await handleHierarchyNotification(values, actionMetadata);
          break;
        case 'sms':
          await handleSMSNotification(values, actionMetadata);
          break;
        case 'call':
          await handleCallAction(values, actionMetadata);
          break;
        case 'email':
          await handleEmailAction(values, actionMetadata);
          break;
        case 'mail':
          await handleMailAction(values, actionMetadata);
          break;
      }

      toast({
        title: t('common.success'),
        description: `${actionTypes.find(t => t.value === values.actionType)?.label} envoyée avec succès`
      });

      form.reset();
      setIsDialogOpen(false);

    } catch (error) {
      console.error('Error executing action:', error);
      toast({
        title: t('common.error'),
        description: "Erreur lors de l'exécution de l'action",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAssignment = async (values: any, metadata: any) => {
    try {
      // Create task in task management system
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: values.assigneeId,
          title: values.title,
          message: values.message,
          type: 'task_assignment',
          related_id: paymentId,
          metadata: {
            ...metadata,
            actionType: 'task_assignment',
            dueDate: values.dueDate,
            priority: values.priority,
            assignedBy: user?.id
          }
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating task assignment:', error);
      throw error;
    }
  };

  const handleHierarchyNotification = async (values: any, metadata: any) => {
    try {
      // Get hierarchy members based on escalation level
      const { data: hierarchy } = await supabase
        .rpc('get_escalation_targets', { 
          project_id_param: projectId, 
          escalation_level_param: values.escalationLevel 
        });

      // Send notifications to hierarchy
      for (const member of (hierarchy || [])) {
        await supabase
          .from('notifications')
          .insert({
            recipient_id: member.employee_id,
            title: values.title,
            message: values.message,
            type: 'hierarchy_notification',
            related_id: paymentId,
            metadata: {
              ...metadata,
              escalationLevel: values.escalationLevel,
              hierarchyPosition: member.position_title
            }
          });
      }
    } catch (error) {
      console.error('Error sending hierarchy notification:', error);
      throw error;
    }
  };

  const handleSMSNotification = async (values: any, metadata: any) => {
    try {
      // Call SMS edge function
      const { error } = await supabase.functions.invoke('send-sms-notification', {
        body: {
          recipients: values.recipientIds,
          message: values.message,
          priority: values.priority,
          metadata: {
            ...metadata,
            paymentId,
            actionType: 'sms'
          }
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      throw error;
    }
  };

  const handleCallAction = async (values: any, metadata: any) => {
    try {
      // Schedule call via edge function
      const { error } = await supabase.functions.invoke('schedule-call', {
        body: {
          recipients: values.recipientIds,
          subject: values.title,
          notes: values.message,
          priority: values.priority,
          metadata: {
            ...metadata,
            paymentId,
            actionType: 'call'
          }
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error initiating call action:', error);
      throw error;
    }
  };

  const handleEmailAction = async (values: any, metadata: any) => {
    try {
      // Send email via edge function
      const { error } = await supabase.functions.invoke('send-email-notification', {
        body: {
          recipients: values.recipientIds,
          subject: values.title,
          message: values.message,
          priority: values.priority,
          notificationChannels: values.notificationChannels,
          metadata: {
            ...metadata,
            paymentId,
            actionType: 'email'
          }
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  };

  const handleMailAction = async (values: any, metadata: any) => {
    try {
      // Create postal mail record
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: values.recipientIds[0], // First recipient for mail
          title: values.title,
          message: values.message,
          type: 'postal_mail',
          related_id: paymentId,
          metadata: {
            ...metadata,
            actionType: 'mail',
            allRecipients: values.recipientIds,
            requiresPhysicalDelivery: true
          }
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating mail action:', error);
      throw error;
    }
  };

  const getActionIcon = (actionType: string) => {
    const action = actionTypes.find(t => t.value === actionType);
    return action ? action.icon : Bell;
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
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Sélectionner la personne à assigner"
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
                      <SelectValue placeholder="Sélectionner le niveau" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {escalationLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
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
              <Phone className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Communication directe
              </span>
            </div>
            <p className="text-sm text-blue-700">
              {actionType === 'sms' 
                ? 'Un SMS sera envoyé aux destinataires sélectionnés avec le message spécifié.'
                : 'Une notification d\'appel sera créée pour les destinataires sélectionnés.'
              }
            </p>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="notificationChannels"
              render={() => (
                <FormItem>
                  <FormLabel>Canaux de notification supplémentaires</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {notificationChannels.map((channel) => (
                      <FormField
                        key={channel.value}
                        control={form.control}
                        name="notificationChannels"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(channel.value)}
                                onCheckedChange={(checked) => {
                                  const currentChannels = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentChannels, channel.value]);
                                  } else {
                                    field.onChange(currentChannels.filter(c => c !== channel.value));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {channel.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'mail':
        return (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Send className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Courrier postal
              </span>
            </div>
            <p className="text-sm text-yellow-700">
              Une demande de courrier postal sera créée avec les destinataires et le contenu spécifiés.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Actions de Contrôle
            </CardTitle>
            <CardDescription>
              Gestion des actions et notifications pour le paiement #{paymentId.slice(-8)}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Nouvelle Action
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une Action de Contrôle</DialogTitle>
                <DialogDescription>
                  Configurer une action pour gérer ce paiement bloqué
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
                                <div className="flex items-center gap-2">
                                  <type.icon className="h-4 w-4" />
                                  {type.label}
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
                            <Badge key={index} variant="secondary">
                              {recipientId}
                              <button
                                type="button"
                                onClick={() => {
                                  field.onChange(field.value?.filter(id => id !== recipientId));
                                }}
                                className="ml-2 text-xs"
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

                  <div className="grid grid-cols-2 gap-4">
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
                              {priorityLevels.map((priority) => (
                                <SelectItem key={priority.value} value={priority.value}>
                                  <Badge className={priority.color}>
                                    {priority.label}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Détails de l'action à entreprendre..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {renderActionTypeFields()}

                  <FormField
                    control={form.control}
                    name="followUpRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Suivi requis
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Envoi...' : 'Exécuter l\'action'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {blockingReasons.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Raisons de blocage détectées
            </h4>
            <div className="grid gap-2">
              {blockingReasons.map((reason, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">{reason.description}</span>
                  </div>
                  <Badge variant={reason.severity === 'blocking' ? 'destructive' : 'secondary'}>
                    {reason.severity === 'blocking' ? 'Bloquant' : 'Avertissement'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Actions disponibles pour résoudre les problèmes de paiement et notifier les parties concernées.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentControlActions;