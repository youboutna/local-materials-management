import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewsletterCampaign } from '@/domain/entities/NewsletterCampaign';
import type { INewsletterCampaignRepository } from '@/domain/repositories/INewsletterCampaignRepository';
import type { INewsletterCampaignDispatcher } from '@/domain/repositories/INewsletterCampaignDispatcher';
import { NewsletterCampaignService } from '../NewsletterCampaignService';

describe('NewsletterCampaignService', () => {
  let repository: INewsletterCampaignRepository;
  let dispatcher: INewsletterCampaignDispatcher;
  let service: NewsletterCampaignService;
  let entity: NewsletterCampaign;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-17T19:50:00Z'));
    entity = NewsletterCampaign.create({ subject: 'Travaux', content: '<p>Actualités</p>', status: 'draft', authorId: 'author', totalRecipients: 0 });
    repository = { findById: vi.fn().mockResolvedValue(entity), save: vi.fn(), update: vi.fn(), delete: vi.fn() } as unknown as INewsletterCampaignRepository;
    dispatcher = { dispatchCampaign: vi.fn().mockResolvedValue(undefined) };
    service = new NewsletterCampaignService(repository, dispatcher);
  });
  afterEach(() => vi.useRealTimers());

  it('persists the scheduled date when editing a campaign', async () => {
    const result = await service.updateCampaign(entity.getId(), { scheduledFor: '2026-10-18T12:00:00+02:00' });
    expect(result.scheduledFor).toBe('2026-10-18T10:00:00.000Z');
    expect(result.status).toBe('scheduled');
    expect(repository.update).toHaveBeenCalledWith(entity.getId(), entity);
  });
  it.each(['invalid', '2026-10-16T12:00:00Z'])('rejects an invalid or past schedule: %s', async (scheduledFor) => {
    await expect(service.updateCampaign(entity.getId(), { scheduledFor })).rejects.toThrow('Scheduled date must be in the future');
    expect(repository.update).not.toHaveBeenCalled();
  });
  it('does not dispatch a campaign scheduled in the future', async () => {
    entity.schedule('2026-10-18T10:00:00Z');
    await expect(service.sendCampaign(entity.getId())).rejects.toThrow('Campaign is scheduled for a future date');
    expect(dispatcher.dispatchCampaign).not.toHaveBeenCalled();
  });
  it('reloads persisted delivery results after dispatch', async () => {
    const sent = NewsletterCampaign.fromData({ ...entity.toData(), status: 'sent', totalRecipients: 3, sentCount: 2, failedCount: 1 });
    vi.mocked(repository.findById).mockResolvedValueOnce(entity).mockResolvedValueOnce(sent);
    const result = await service.sendCampaign(entity.getId());
    expect(dispatcher.dispatchCampaign).toHaveBeenCalledWith(entity.getId());
    expect(result.status).toBe('sent');
    expect(result.sentCount).toBe(2);
    expect(result.failedCount).toBe(1);
  });
  it('propagates dispatch failure rather than returning a successful campaign', async () => {
    vi.mocked(dispatcher.dispatchCampaign).mockRejectedValue(new Error('Email unavailable'));
    await expect(service.sendCampaign(entity.getId())).rejects.toThrow('Failed to send campaign');
  });
  it('rejects deleting a sent campaign', async () => {
    vi.mocked(repository.findById).mockResolvedValue(NewsletterCampaign.fromData({ ...entity.toData(), status: 'sent' }));
    await expect(service.deleteCampaign(entity.getId())).rejects.toThrow('Cannot delete sent or sending campaigns');
    expect(repository.delete).not.toHaveBeenCalled();
  });
});