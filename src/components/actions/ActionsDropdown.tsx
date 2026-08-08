import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Mail, Phone, Send, Settings, Shield, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ActionFormData } from '@/dtos/entities/ProjectDTO';;
import { supabase } from '@/integrations/supabase/client';

interface ActionsDropdownProps {
  entityType: 'bank_guarantee' | 'inspection' | 'insurance' | 'payment' | 'project';
  entityId: string;
  projectId?: string;
  contractorId?: string;
  onActionComplete?: () => void;
  className?: string;
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

export const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  entityType,
  entityId,
  projectId,
  contractorId,
  onActionComplete,
  className,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<ActionFormData['actionType']>('task_assignment');
  const [availableEmployees, setAvailableEmployees] = useState<Array<{ id: string; full_name: string; email?: string; position?: string; }>>([]);
  const [availableRecipients, setAvailableRecipients] = useState<Array<{ id: string; name: string; email?: string; phone?: string; }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    try {
      const [employeesData, suppliersData] = await Promise.all([
        supabase
          .from('employees')
          .select('id, full_name, email, phone, position, department')
          .eq('is_active', true),
        supabase
          .from('suppliers')
          .select('id, name, email, phone, contact_person')
          .eq('is_active', true)
      ]);

      setAvailableEmployees((employeesData.data || []).filter(emp => emp.id && emp.full_name).map(emp => ({
        id: emp.id!,
        full_name: emp.full_name!,
        email: emp.email || undefined,
        position: emp.position || undefined,
      })));
      
      // Combine employees and suppliers as potential recipients
      const recipients = [
        ...(employeesData.data || []).filter(emp => emp.id && emp.full_name).map(emp => ({
          id: emp.id!,
          name: emp.full_name!,
          email: emp.email || undefined,
          phone: emp.phone || undefined,
        })),
        ...(suppliersData.data || []).filter(s => s.id && s.name).map(supplier => ({
          id: supplier.id!,
          name: supplier.name!,
          email: supplier.email || undefined,
          phone: supplier.phone || undefined,
        }))
      ];
      
      setAvailableRecipients(recipients);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleActionClick = (actionType: ActionFormData['actionType']) => {
    setSelectedActionType(actionType);
    setShowActionDialog(true);
  };

  const handleActionSubmit = async (formData: ActionFormData) => {
    setLoading(true);
    try {
      // Import the appropriate action service based on entity type
      let actionService: any;
      let actionData: any;

      switch (entityType) {
        case 'bank_guarantee':
          const { createBankGuaranteeAction } = await import('@/application/services/BankGuaranteeActionFunctions');
          actionService = createBankGuaranteeAction;
          actionData = {
            bankGuaranteeId: entityId,
            projectId: projectId || '',
            contractorId: contractorId || '',
            ...formData,
            dueDate: formData.dueDate?.toISOString(),
          };
          break;

        case 'inspection':
          const { createInspectionAction } = await import('@/application/services/InspectionActionService');
          actionService = createInspectionAction;
          actionData = {
            inspectionId: entityId,
            projectId: projectId || '',
            ...formData,
            dueDate: formData.dueDate?.toISOString(),
          };
          break;

        case 'insurance':
          const { createInsuranceAction } = await import('@/application/services/InsuranceActionService');
          actionService = createInsuranceAction;
          actionData = {
            insuranceId: entityId,
            projectId: projectId || '',
            contractorId: contractorId || '',
            ...formData,
            dueDate: formData.dueDate?.toISOString(),
          };
          break;

        case 'payment':
          // Payment actions would go here
          actionData = {
            paymentId: entityId,
            projectId: projectId || '',
            contractorId: contractorId || '',
            ...formData,
            dueDate: formData.dueDate?.toISOString(),
          };
          await handlePaymentAction(actionData);
          break;

        case 'project':
          // Project actions would go here
          actionData = {
            projectId: entityId,
            ...formData,
            dueDate: formData.dueDate?.toISOString(),
          };
          await handleProjectAction(actionData);
          break;

        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      if (actionService) {
        await actionService(actionData);
      }

      toast({
        title: t('common.success'),
        description: `Action "${actionLabels[formData.actionType]}" exécutée avec succès`,
      });

      onActionComplete?.();
      setShowActionDialog(false);
    } catch (error) {
      console.error('Error executing action:', error);
      toast({
        title: t('common.error'),
        description: "Erreur lors de l'exécution de l'action",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (actionData: any) => {
    // Implement payment-specific actions
    console.log('Payment action:', actionData);
    // You can add payment-specific logic here
  };

  const handleProjectAction = async (actionData: any) => {
    // Implement project-specific actions
    console.log('Project action:', actionData);
    // You can add project-specific logic here
  };

  const getDefaultFormData = (actionType: ActionFormData['actionType']): Partial<ActionFormData> => {
    const baseDefaults = {
      actionType,
      title: getDefaultTitle(actionType),
      message: getDefaultMessage(actionType),
      priority: 'medium' as const,
    };

    switch (actionType) {
      case 'task_assignment':
        return {
          ...baseDefaults,
          title: `Tâche ${entityType.replace('_', ' ')} - ${entityId.substring(0, 8)}`,
          message: `Veuillez traiter cette tâche concernant ${entityType.replace('_', ' ')} ${entityId}`,
        };
      case 'hierarchy_notification':
        return {
          ...baseDefaults,
          title: `Notification hiérarchique - ${entityType.replace('_', ' ')}`,
          message: `Notification importante concernant ${entityType.replace('_', ' ')} ${entityId}`,
          escalationLevel: 'team',
        };
      case 'email':
        return {
          ...baseDefaults,
          title: `Email - ${entityType.replace('_', ' ')}`,
          message: `Bonjour,\n\nConcernant ${entityType.replace('_', ' ')} ${entityId}...\n\nCordialement,`,
        };
      case 'sms':
        return {
          ...baseDefaults,
          title: `SMS - ${entityType.replace('_', ' ')}`,
          message: `[URGENT] Concernant ${entityType.replace('_', ' ')} ${entityId.substring(0, 8)}...`,
        };
      default:
        return baseDefaults;
    }
  };

  const getDefaultTitle = (actionType: ActionFormData['actionType']): string => {
    return `${actionLabels[actionType]} - ${entityType.replace('_', ' ')}`;
  };

  const getDefaultMessage = (actionType: ActionFormData['actionType']): string => {
    return `Action ${actionLabels[actionType]} pour ${entityType.replace('_', ' ')} ${entityId}`;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Settings className="h-4 w-4 mr-2" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {Object.entries(actionLabels).map(([actionType, label]) => {
            const Icon = actionIcons[actionType as keyof typeof actionIcons];
            return (
              <DropdownMenuItem
                key={actionType}
                onClick={() => handleActionClick(actionType as ActionFormData['actionType'])}
                className="cursor-pointer"
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <ActionFormDialog
        open={showActionDialog}
        onClose={() => setShowActionDialog(false)}
        onSubmit={handleActionSubmit}
        entityType={entityType}
        entityId={entityId}
        availableEmployees={availableEmployees}
        availableRecipients={availableRecipients}
        defaultValues={getDefaultFormData(selectedActionType)}
      />
    </>
  );
};