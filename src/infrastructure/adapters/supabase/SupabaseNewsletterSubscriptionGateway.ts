import type {
  INewsletterSubscriptionGateway,
  NewsletterPublicAction,
} from '@/domain/repositories/INewsletterSubscriptionGateway';
import { notificationGatewayAdapter } from '@/infrastructure/adapters/supabase/NotificationGatewayAdapter';

interface NewsletterActionResponse {
  success?: boolean;
  error?: string;
}

export class SupabaseNewsletterSubscriptionGateway implements INewsletterSubscriptionGateway {
  async requestSubscription(input: {
    email: string;
    source?: string;
    consentGiven: boolean;
  }): Promise<void> {
    await this.invoke({
      action: 'subscribe',
      email: input.email,
      source: input.source ?? 'footer',
      consentGiven: input.consentGiven,
    });
  }

  async completePublicAction(action: NewsletterPublicAction, token: string): Promise<void> {
    await this.invoke({ action, token });
  }

  private async invoke(body: Record<string, unknown>): Promise<void> {
    const { data, error } = await notificationGatewayAdapter.invokeFunction<NewsletterActionResponse>(
      'newsletter-subscription',
      body,
    );

    if (error || !data?.success) {
      throw new Error(data?.error ?? error?.message ?? 'Newsletter action failed');
    }
  }
}
