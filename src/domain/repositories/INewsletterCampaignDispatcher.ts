export interface INewsletterCampaignDispatcher {
  dispatchCampaign(campaignId: string): Promise<void>;
}
