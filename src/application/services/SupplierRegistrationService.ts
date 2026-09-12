/**
 * SupplierRegistrationService — inscription self-service des fournisseurs.
 * Pure TypeScript (aucun React). Le client Supabase est importé dynamiquement.
 */
import { PENDING_SUPPLIER_ROLE } from '@/config/referentials/auth/roles-responsibilities.referential';
import { logger } from '@/application/services/LoggerService';
import { getSystemSettingsService } from '@/application/services/SystemSettingsService';

export interface SupplierRegistrationInput {
  companyName: string;
  fiscalId: string;
  activityType: string;
  interventionZones: string[];
  contactName: string;
  email: string;
  phone: string;
  password: string;
  documentsNote?: string;
}

export interface SupplierRegistrationResult {
  success: boolean;
  pendingRole: string;
  message: string;
}

export class SupplierRegistrationService {
  async register(input: SupplierRegistrationInput): Promise<SupplierRegistrationResult> {
    const { supabase } = await import('@/integrations/supabase/client');

    const { error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          full_name: input.contactName,
          phone: input.phone,
          requested_role: PENDING_SUPPLIER_ROLE,
          supplier_profile: {
            company_name: input.companyName,
            fiscal_id: input.fiscalId,
            activity_type: input.activityType,
            intervention_zones: input.interventionZones,
            documents_note: input.documentsNote ?? null,
          },
        },
      },
    });

    if (error) {
      logger.error('service', "Échec de l'inscription fournisseur", undefined, { message: error.message });
      throw new Error(error.message);
    }

    await this.notifyAdmins(input);

    return {
      success: true,
      pendingRole: PENDING_SUPPLIER_ROLE,
      message: 'Votre demande est en cours de validation',
    };
  }

  /** Notification non bloquante des administrateurs. */
  private async notifyAdmins(input: SupplierRegistrationInput): Promise<void> {
    try {
      const emails = await getSystemSettingsService().getAdminEmails();
      if (!emails?.length) return;

      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.functions.invoke('send-email-notification', {
        body: {
          to: emails,
          subject: `Nouvelle demande fournisseur : ${input.companyName}`,
          message:
            `Raison sociale : ${input.companyName}\n` +
            `Identifiant fiscal : ${input.fiscalId}\n` +
            `Activité : ${input.activityType}\n` +
            `Zones : ${input.interventionZones.join(', ') || '—'}\n` +
            `Contact : ${input.contactName} — ${input.email} — ${input.phone}`,
        },
      });
    } catch (err) {
      logger.warning('service', "Notification administrateurs non envoyée", undefined, {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

let instance: SupplierRegistrationService | null = null;

export function getSupplierRegistrationService(): SupplierRegistrationService {
  if (!instance) instance = new SupplierRegistrationService();
  return instance;
}
