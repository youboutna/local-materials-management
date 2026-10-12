export type NewsletterPublicAction = 'confirm' | 'unsubscribe';

export interface INewsletterSubscriptionGateway {
  requestSubscription(input: {
    email: string;
    source?: string;
    consentGiven: boolean;
  }): Promise<void>;
  completePublicAction(action: NewsletterPublicAction, token: string): Promise<void>;
}
