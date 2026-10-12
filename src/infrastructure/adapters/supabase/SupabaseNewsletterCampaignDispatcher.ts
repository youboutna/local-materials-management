import type { INewsletterCampaignDispatcher } from '@/domain/repositories/INewsletterCampaignDispatcher';
import { notificationGatewayAdapter } from '@/infrastructure/adapters/supabase/NotificationGatewayAdapter';

interface CampaignDispatchResponse {
  success?: boolean;
  error?: string;
}

export class SupabaseNewsletterCampaignDispatcher implements INewsletterCampaignDispatcher {
  async dispatchCampaign(campaignId: string): Promise<void> {
    const { data, error } = await notificationGatewayAdapter.invokeFunction<CampaignDispatchResponse>(
      'newsletter-campaign-send',
      { campaignId },
    );

    if (error || !data?.success) {
      throw new Error(data?.error ?? error?.message ?? 'Campaign send failed');
    }
  }
}
