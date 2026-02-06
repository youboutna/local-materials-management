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
import {
  usePaymentControlActionsHex,
  actionFormSchema
} from '@/hooks/hexagonal';
import type { ActionFormData, PaymentControlActionsProps, ActionMetadata } from '@/hooks/hexagonal';

// Use the same ActionType from schema
type ActionType = 'task_assignment' | 'hierarchy_notification' | 'sms' | 'call' | 'email' | 'mail';

const PaymentControlActions: React.FC<PaymentControlActionsProps> = ({
  paymentId,
  projectId,
  contractorId,
  amount,
  blockingReasons = []
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { createNotification } = useNotifications();

  // Use hexagonal hook with props
  const {
    executeAction,
    isLoading
  } = usePaymentControlActionsHex({
    paymentId,
    projectId,
    contractorId,
    amount,
    blockingReasons
  });

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
    { value: 'task_assignment' as ActionType, label: 'Assignation de tâche', icon: Briefcase },
    { value: 'hierarchy_notification' as ActionType, label: 'Notification hiérarchique', icon: Users },
    { value: 'sms' as ActionType, label: 'SMS', icon: MessageSquare },
    { value: 'call' as ActionType, label: 'Appel téléphonique', icon: Phone },
    { value: 'email' as ActionType, label: 'Email', icon: Mail },
    { value: 'mail' as ActionType, label: 'Courrier postal', icon: Send }
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

  const getActionIcon = (actionType: string) => {
    const action = actionTypes.find(t => t.value === actionType);
    return action ? action.icon : Bell;
  };

  const onSubmitAction = async (values: z.infer<typeof actionFormSchema>) => {
    try {
      const actionMetadata: ActionMetadata = {
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
          actionMetadata as unknown as Record<string, unknown>
        );
      }

      // Execute the specific action using hexagonal hook
      await executeAction(values as ActionFormData, actionMetadata);

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
    }
  };

  const renderActionTypeFields = () => {
    const actionType = form.watch('actionType');
    
    switch (actionType) {
      case 'task_assignment':
        return (
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
                    placeholder="Sélectionner un utilisateur"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                      <SelectValue placeholder="Sélectionner un niveau" />
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
      
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Actions de Contrôle de Paiement
        </CardTitle>
        <CardDescription>
          Actions disponibles pour le paiement de {amount.toLocaleString()} MRU
        </CardDescription>
      </CardHeader>
      <CardContent>
        {blockingReasons.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Raisons de blocage</span>
            </div>
            <ul className="space-y-1">
              {blockingReasons.map((reason, index) => (
                <li key={index} className="text-sm text-yellow-700">
                  <span className="font-medium">{reason.reason}:</span> {reason.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actionTypes.map((action) => {
            const IconComponent = action.icon;
            return (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} key={action.value}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => form.setValue('actionType', action.value)}
                  >
                    <IconComponent className="h-6 w-6" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      {actionTypes.find(t => t.value === form.watch('actionType'))?.label}
                    </DialogTitle>
                    <DialogDescription>
                      Configurer et envoyer l'action de contrôle de paiement
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-4">
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
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {priorityLevels.map((priority) => (
                                    <SelectItem key={priority.value} value={priority.value}>
                                      <div className="flex items-center gap-2">
                                        <Badge className={priority.color}>
                                          {priority.label}
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
                      </div>

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Description détaillée de l'action" 
                                rows={4}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recipientIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destinataire principal</FormLabel>
                            <FormControl>
                              <UserSelector
                                value={field.value?.[0] || ''}
                                onChange={(val) => field.onChange([val])}
                                placeholder="Sélectionner un destinataire"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {renderActionTypeFields()}

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date limite</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="notificationChannels"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Canaux de notification</FormLabel>
                              <div className="space-y-2">
                                {notificationChannels.map((channel) => (
                                  <div key={channel.value} className="flex flex-row items-start space-x-3 space-y-0">
                                    <Checkbox
                                      checked={field.value?.includes(channel.value)}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || [];
                                        return checked
                                          ? field.onChange([...currentValues, channel.value])
                                          : field.onChange(
                                              currentValues.filter(
                                                (value) => value !== channel.value
                                              )
                                            );
                                      }}
                                    />
                                    <span className="text-sm font-normal">
                                      {channel.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="followUpRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
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
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Envoi en cours...' : 'Envoyer'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentControlActions;
