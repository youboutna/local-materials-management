/**
 * Authorization Request Adapter
 * Persists DGP / fuel-station authorization requests into public.authorization_requests
 * Follows hexagonal rule: no direct Supabase access from UI/hooks.
 */
import { IAuthorizationRequestRepository, AuthorizationRequestInput, AuthorizationRequestRecord } from '@/domain/repositories/IAuthorizationRequestRepository';

export class AuthorizationRequestAdapter implements IAuthorizationRequestRepository {
  async submit(input: AuthorizationRequestInput): Promise<AuthorizationRequestRecord> {
    const { supabase } = await import('@/integrations/supabase/client');

    const payload: Record<string, unknown> = {
      applicant_type: input.applicantType,
      email: input.email,
      national_id: input.nationalId,
      phone_number: input.phoneNumber,
      request_type: input.requestType,
      parcel_address: input.parcelAddress || 'Non spécifié',
      status: 'draft',
    };

    if (input.individualFirstName) payload.individual_first_name = input.individualFirstName;
    if (input.individualLastName) payload.individual_last_name = input.individualLastName;
    if (input.address) payload.address = input.address;
    if (input.description) payload.description = input.description;
    if (input.applicantType === 'company') {
      if (input.companyName) payload.company_name = input.companyName;
      if (input.companyNif) payload.company_nif = input.companyNif;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('authorization_requests' as any) as any)
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) throw error;

    const row = (data ?? {}) as Record<string, unknown>;
    return {
      id: String(row.id ?? ''),
      requestNumber: row.request_number ? String(row.request_number) : undefined,
      status: String(row.status ?? 'draft'),
      createdAt: String(row.created_at ?? new Date().toISOString()),
    };
  }
}

let singleton: AuthorizationRequestAdapter | null = null;
export const getAuthorizationRequestRepository = (): IAuthorizationRequestRepository => {
  if (!singleton) singleton = new AuthorizationRequestAdapter();
  return singleton;
};
