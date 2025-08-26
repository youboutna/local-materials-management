import { ActionFormData } from '@/components/actions/ActionFormDialog';

export interface BaseActionData {
  actionType: ActionFormData['actionType'];
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipientIds: string[];
  dueDate?: string;
  escalationLevel?: 'team' | 'supervisor' | 'manager' | 'director';
  assigneeId?: string;
  metadata?: Record<string, any>;
}

export interface BankGuaranteeActionData extends BaseActionData {
  bankGuaranteeId: string;
  projectId: string;
  contractorId: string;
}

export interface InspectionActionData extends BaseActionData {
  inspectionId: string;
  projectId: string;
  inspectorId?: string;
}

export interface InsuranceActionData extends BaseActionData {
  insuranceId: string;
  projectId: string;
  contractorId: string;
}

export interface PaymentActionData extends BaseActionData {
  paymentId: string;
  projectId: string;
  contractorId?: string;
}

export interface ProjectActionData extends BaseActionData {
  projectId: string;
}

export class ActionFactory {
  static async executeAction(
    entityType: 'bank_guarantee' | 'inspection' | 'insurance' | 'payment' | 'project',
    actionData: any
  ): Promise<void> {
    switch (entityType) {
      case 'bank_guarantee':
        return this.executeBankGuaranteeAction(actionData as BankGuaranteeActionData);
      case 'inspection':
        return this.executeInspectionAction(actionData as InspectionActionData);
      case 'insurance':
        return this.executeInsuranceAction(actionData as InsuranceActionData);
      case 'payment':
        return this.executePaymentAction(actionData as PaymentActionData);
      case 'project':
        return this.executeProjectAction(actionData as ProjectActionData);
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  private static async executeBankGuaranteeAction(actionData: BankGuaranteeActionData): Promise<void> {
    const { createBankGuaranteeAction } = await import('./bankGuaranteeActionService');
    await createBankGuaranteeAction(actionData);
  }

  private static async executeInspectionAction(actionData: InspectionActionData): Promise<void> {
    const { createInspectionAction } = await import('./inspectionActionService');
    await createInspectionAction(actionData);
  }

  private static async executeInsuranceAction(actionData: InsuranceActionData): Promise<void> {
    const { createInsuranceAction } = await import('./insuranceActionService');
    await createInsuranceAction(actionData);
  }

  private static async executePaymentAction(actionData: PaymentActionData): Promise<void> {
    // Import and use payment action service
    const { createPaymentAction } = await import('./paymentActionService');
    await createPaymentAction(actionData);
  }

  private static async executeProjectAction(actionData: ProjectActionData): Promise<void> {
    // Import and use project action service
    const { createProjectAction } = await import('./projectActionService');
    await createProjectAction(actionData);
  }

  static getDefaultFormData(
    entityType: string,
    entityId: string,
    actionType: ActionFormData['actionType']
  ): Partial<ActionFormData> {
    const entityLabel = entityType.replace('_', ' ');
    
    const baseDefaults = {
      actionType,
      title: `${this.getActionLabel(actionType)} - ${entityLabel}`,
      message: this.getDefaultMessage(actionType, entityLabel, entityId),
      priority: 'medium' as const,
      recipientIds: [],
    };

    switch (actionType) {
      case 'task_assignment':
        return {
          ...baseDefaults,
          title: `Tâche ${entityLabel} - ${entityId.substring(0, 8)}`,
          message: `Veuillez traiter cette tâche concernant ${entityLabel} ${entityId}`,
        };
      case 'hierarchy_notification':
        return {
          ...baseDefaults,
          title: `Notification hiérarchique - ${entityLabel}`,
          message: `Notification importante concernant ${entityLabel} ${entityId}`,
          escalationLevel: 'team',
        };
      case 'email':
        return {
          ...baseDefaults,
          title: `Email - ${entityLabel}`,
          message: `Bonjour,\n\nConcernant ${entityLabel} ${entityId}...\n\nCordialement,`,
        };
      case 'sms':
        return {
          ...baseDefaults,
          title: `SMS - ${entityLabel}`,
          message: `[URGENT] Concernant ${entityLabel} ${entityId.substring(0, 8)}...`,
        };
      case 'call':
        return {
          ...baseDefaults,
          title: `Appel programmé - ${entityLabel}`,
          message: `Appel concernant ${entityLabel} ${entityId}`,
        };
      case 'mail':
        return {
          ...baseDefaults,
          title: `Courrier postal - ${entityLabel}`,
          message: `Courrier officiel concernant ${entityLabel} ${entityId}`,
        };
      case 'export_receipt':
        return {
          ...baseDefaults,
          title: `Export reçu - ${entityLabel}`,
          message: `Export du reçu pour ${entityLabel} ${entityId}`,
        };
      case 'blockchain_verification':
        return {
          ...baseDefaults,
          title: `Vérification blockchain - ${entityLabel}`,
          message: `Vérification blockchain pour ${entityLabel} ${entityId}`,
        };
      default:
        return baseDefaults;
    }
  }

  private static getActionLabel(actionType: ActionFormData['actionType']): string {
    const labels = {
      task_assignment: 'Assigner une tâche',
      hierarchy_notification: 'Notifier la hiérarchie',
      sms: 'Envoyer SMS',
      call: 'Programmer appel',
      email: 'Envoyer email',
      mail: 'Courrier postal',
      export_receipt: 'Exporter reçu',
      blockchain_verification: 'Vérification blockchain',
    };
    return labels[actionType];
  }

  private static getDefaultMessage(
    actionType: ActionFormData['actionType'],
    entityLabel: string,
    entityId: string
  ): string {
    switch (actionType) {
      case 'task_assignment':
        return `Veuillez traiter cette tâche concernant ${entityLabel} ${entityId}`;
      case 'hierarchy_notification':
        return `Notification importante concernant ${entityLabel} ${entityId}`;
      case 'email':
        return `Bonjour,\n\nConcernant ${entityLabel} ${entityId}...\n\nCordialement,`;
      case 'sms':
        return `[URGENT] Concernant ${entityLabel} ${entityId.substring(0, 8)}...`;
      case 'call':
        return `Appel programmé concernant ${entityLabel} ${entityId}`;
      case 'mail':
        return `Courrier officiel concernant ${entityLabel} ${entityId}`;
      case 'export_receipt':
        return `Export du reçu pour ${entityLabel} ${entityId}`;
      case 'blockchain_verification':
        return `Vérification blockchain pour ${entityLabel} ${entityId}`;
      default:
        return `Action concernant ${entityLabel} ${entityId}`;
    }
  }
}