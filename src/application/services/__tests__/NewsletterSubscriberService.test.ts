import type { INewsletterSubscriptionGateway } from '@/domain/repositories/INewsletterSubscriptionGateway';
import type { INewsletterSubscriberRepository } from '@/domain/repositories/INewsletterSubscriberRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NewsletterSubscriberService } from '../NewsletterSubscriberService';

describe('NewsletterSubscriberService', () => {
  let service: NewsletterSubscriberService;
  let subscriptionGateway: INewsletterSubscriptionGateway;

  beforeEach(() => {
    subscriptionGateway = {
      requestSubscription: vi.fn().mockResolvedValue(undefined),
      completePublicAction: vi.fn().mockResolvedValue(undefined),
    };
    service = new NewsletterSubscriberService(
      {} as INewsletterSubscriberRepository,
      subscriptionGateway,
    );
  });

  it('completes confirmation and unsubscribe actions through the gateway', async () => {
    await service.completePublicAction('confirm', 'confirmation-token');
    await service.completePublicAction('unsubscribe', 'unsubscribe-token');

    expect(subscriptionGateway.completePublicAction).toHaveBeenNthCalledWith(
      1,
      'confirm',
      'confirmation-token',
    );
    expect(subscriptionGateway.completePublicAction).toHaveBeenNthCalledWith(
      2,
      'unsubscribe',
      'unsubscribe-token',
    );
  });

  it('surfaces public-action gateway failures as application errors', async () => {
    vi.mocked(subscriptionGateway.completePublicAction).mockRejectedValueOnce(
      new Error('Invalid or expired link'),
    );

    await expect(service.completePublicAction('confirm', 'expired-token'))
      .rejects.toThrow(new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Invalid or expired link',
      ));
  });
});
