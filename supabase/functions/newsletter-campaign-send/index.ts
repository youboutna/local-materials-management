import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createEmailService } from "../_shared/EmailServiceFactory.ts";
import { escapeHtml } from "../_shared/html.ts";
import sanitizeHtml from "npm:sanitize-html@2.17.0";
import {
  authorizeRequest,
  createAdminClient,
  corsHeaders,
  hasValidSecret,
  jsonResponse,
} from "../_shared/http.ts";
import { getNewsletterSiteUrl } from "../_shared/newsletter.ts";

const sha256 = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const makeToken = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const sanitizeEmailHtml = (html: string): string => sanitizeHtml(html, {
  allowedTags: [
    "a", "b", "blockquote", "br", "code", "del", "em", "h1", "h2", "h3",
    "h4", "hr", "i", "img", "li", "ol", "p", "pre", "s", "strong", "u", "ul",
  ],
  allowedAttributes: {
    a: ["href", "title"],
    img: ["src", "alt", "width", "height", "title"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
});

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let claimedCampaignId: string | null = null;
  try {
    const cronSecret = Deno.env.get("NEWSLETTER_CRON_SECRET");
    if (!cronSecret) {
      throw new Error("Newsletter service configuration is incomplete");
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse({ error: "A valid request body is required" }, 400);
    }
    const campaignId = (body as Record<string, unknown>).campaignId;
    if (typeof campaignId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(campaignId)) {
      return jsonResponse({ error: "A valid campaignId is required" }, 400);
    }
    const siteUrl = getNewsletterSiteUrl();
    if (!siteUrl) {
      return jsonResponse({ error: "Newsletter site URL is not configured" }, 503);
    }
    const isCronRequest = hasValidSecret(request, "NEWSLETTER_CRON_SECRET", "x-newsletter-cron-secret");
    let admin = createAdminClient().schema("btp");

    if (!isCronRequest) {
      const auth = await authorizeRequest(request, ["admin", "super_admin", "director"]);
      if ("response" in auth) return auth.response;
      admin = auth.admin.schema("btp");
    }

    const { data: current, error: readError } = await admin
      .from("newsletter_campaigns")
      .select("*")
      .eq("id", campaignId)
      .maybeSingle();
    if (readError) throw readError;
    if (!current) return jsonResponse({ error: "Campaign not found" }, 404);
    if (current.status === "scheduled" && Date.parse(current.scheduled_for ?? "") > Date.now() && !isCronRequest) {
      return jsonResponse({ error: "Campaign is scheduled for a future date" }, 409);
    }

    const claimableStatuses = isCronRequest ? ["scheduled"] : ["draft", "scheduled", "failed"];
    const { data: campaign, error: claimError } = await admin
      .from("newsletter_campaigns")
      .update({ status: "sending", updated_at: new Date().toISOString() })
      .eq("id", campaignId)
      .in("status", claimableStatuses)
      .select("*")
      .maybeSingle();
    if (claimError) throw claimError;
    if (!campaign) return jsonResponse({ error: "Campaign is already being processed or cannot be sent" }, 409);
    claimedCampaignId = campaign.id;

    const { data: subscribers, error: subscribersError } = await admin
      .from("newsletter_subscribers")
      .select("id,email")
      .eq("status", "active")
      .eq("consent_given", true);
    if (subscribersError) throw subscribersError;
    if (!subscribers?.length) {
      const { error: finishError } = await admin.from("newsletter_campaigns").update({
        status: "failed",
        failed_count: 0,
        sent_count: 0,
        total_recipients: 0,
        updated_at: new Date().toISOString(),
      }).eq("id", campaign.id);
      if (finishError) throw finishError;
      claimedCampaignId = null;
      return jsonResponse({ error: "No active subscribers to send to" }, 409);
    }

    let sentCount = 0;
    let failedCount = 0;
    const emailService = createEmailService();

    for (const subscriber of subscribers) {
      const { data: previous, error: deliveryLookupError } = await admin
        .from("newsletter_campaign_deliveries")
        .select("status")
        .eq("campaign_id", campaign.id)
        .eq("subscriber_id", subscriber.id)
        .maybeSingle();
      if (deliveryLookupError) throw deliveryLookupError;
      if (previous?.status === "sent") {
        sentCount++;
        continue;
      }

      const token = makeToken();
      const tokenHash = await sha256(token);
      const { error: tokenError } = await admin.from("newsletter_subscription_tokens").insert({
        subscriber_id: subscriber.id,
        token_hash: tokenHash,
        action: "unsubscribe",
        expires_at: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (tokenError) throw tokenError;

      const unsubscribeUrl = `${siteUrl}/newsletter-action?action=unsubscribe&token=${token}`;
      const content = sanitizeEmailHtml(String(campaign.content));
      const html = `${campaign.preheader ? `<div style="display:none">${escapeHtml(campaign.preheader)}</div>` : ""}${content}<hr><p style="font-size:12px;color:#666">You are receiving this email because you subscribed to our newsletter. <a href="${unsubscribeUrl}">Unsubscribe</a>.</p>`;
      const { error: startError } = await admin.from("newsletter_campaign_deliveries").upsert({
        campaign_id: campaign.id,
        subscriber_id: subscriber.id,
        status: "pending",
        error_message: null,
        attempted_at: new Date().toISOString(),
      }, { onConflict: "campaign_id,subscriber_id" });
      if (startError) throw startError;

      try {
        const result = await emailService.sendEmail({
          to: subscriber.email,
          subject: String(campaign.subject),
          html,
          text: `${String(campaign.subject)}\n\n${content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}\n\nUnsubscribe: ${unsubscribeUrl}`,
        });
        if (!result.success) throw new Error("Provider reported unsuccessful delivery");
        const { error: updateError } = await admin.from("newsletter_campaign_deliveries").update({
          status: "sent",
          provider_reference: result.messageId ?? null,
          sent_at: new Date().toISOString(),
        }).eq("campaign_id", campaign.id).eq("subscriber_id", subscriber.id);
        if (updateError) throw updateError;
        sentCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Provider delivery failed";
        const { error: updateError } = await admin.from("newsletter_campaign_deliveries").update({
          status: "failed",
          error_message: message.slice(0, 1000),
        }).eq("campaign_id", campaign.id).eq("subscriber_id", subscriber.id);
        if (updateError) console.error("Could not record campaign delivery failure:", updateError);
        failedCount++;
      }
    }

    const finalStatus = sentCount > 0 ? "sent" : "failed";
    const { error: finishError } = await admin.from("newsletter_campaigns").update({
      status: finalStatus,
      total_recipients: subscribers.length,
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: sentCount > 0 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", campaign.id);
    if (finishError) throw finishError;
    return jsonResponse({ success: true, sentCount, failedCount, status: finalStatus });
  } catch (error) {
    console.error("newsletter-campaign-send failed:", error);
    if (claimedCampaignId) {
      const { error: statusError } = await createAdminClient().schema("btp")
        .from("newsletter_campaigns").update({
          status: "failed",
          updated_at: new Date().toISOString(),
        }).eq("id", claimedCampaignId).eq("status", "sending");
      if (statusError) console.error("Could not release campaign claim:", statusError);
    }
    return jsonResponse({ error: "Campaign send failed" }, 500);
  }
});
