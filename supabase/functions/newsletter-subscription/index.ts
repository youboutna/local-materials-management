import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createEmailService } from "../_shared/EmailServiceFactory.ts";
import { createAdminClient, corsHeaders, jsonResponse } from "../_shared/http.ts";
import { getNewsletterSiteUrl } from "../_shared/newsletter.ts";

const sha256 = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const makeToken = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse({ error: "A valid request body is required" }, 400);
    }
    const payload = body as Record<string, unknown>;
    const supabase = createAdminClient().schema("btp");

    if (payload.action === "subscribe") {
      const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
      const source = typeof payload.source === "string" ? payload.source.slice(0, 80) : "footer";
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email) || payload.consentGiven !== true) {
        return jsonResponse({ error: "A valid email address and explicit consent are required" }, 400);
      }

      const { data: existing, error: lookupError } = await supabase
        .from("newsletter_subscribers")
        .select("id,status")
        .eq("email", email)
        .maybeSingle();
      if (lookupError) throw lookupError;

      let subscriberId: string;
      if (existing) {
        subscriberId = existing.id;
        if (existing.status === "active") return jsonResponse({ success: true });
      }

      const siteUrl = getNewsletterSiteUrl();
      if (!siteUrl) {
        return jsonResponse({ error: "Newsletter site URL is not configured" }, 503);
      }

      if (existing) {
        const { error } = await supabase.from("newsletter_subscribers").update({
          status: "pending_confirmation",
          source,
          consent_given: true,
          consent_date: new Date().toISOString(),
          subscribed_at: new Date().toISOString(),
          confirmed_at: null,
          unsubscribed_at: null,
        }).eq("id", subscriberId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("newsletter_subscribers").insert({
          email,
          source,
          consent_given: true,
          consent_date: new Date().toISOString(),
          status: "pending_confirmation",
        }).select("id").single();
        if (error) throw error;
        subscriberId = data.id;
      }

      const token = makeToken();
      const tokenHash = await sha256(token);
      const now = new Date().toISOString();
      const { error: invalidateError } = await supabase
        .from("newsletter_subscription_tokens")
        .update({ used_at: now })
        .eq("subscriber_id", subscriberId)
        .eq("action", "confirm")
        .is("used_at", null);
      if (invalidateError) throw invalidateError;
      const { error: tokenError } = await supabase.from("newsletter_subscription_tokens").insert({
        subscriber_id: subscriberId,
        token_hash: tokenHash,
        action: "confirm",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      if (tokenError) throw tokenError;

      const emailResult = await createEmailService().sendEmail({
        to: email,
        subject: "Confirm your newsletter subscription",
        html: `<p>Please confirm that you want to receive our newsletter.</p><p><a href="${siteUrl}/newsletter-action?action=confirm&token=${token}">Confirm subscription</a></p>`,
        text: `Confirm your newsletter subscription: ${siteUrl}/newsletter-action?action=confirm&token=${token}`,
      });
      if (!emailResult.success) throw new Error("Confirmation email could not be delivered");
      return jsonResponse({ success: true });
    }

    if (payload.action !== "confirm" && payload.action !== "unsubscribe") {
      return jsonResponse({ error: "Unsupported action" }, 400);
    }
    if (typeof payload.token !== "string" || !/^[a-f0-9]{64}$/i.test(payload.token)) {
      return jsonResponse({ error: "Invalid or expired link" }, 400);
    }

    const tokenHash = await sha256(payload.token);
    const { data: completed, error: actionError } = await supabase.rpc(
      "complete_newsletter_subscription_action",
      { p_token_hash: tokenHash, p_action: payload.action },
    );
    if (actionError) throw actionError;
    if (!completed) return jsonResponse({ error: "Invalid, expired, or already used link" }, 400);
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("newsletter-subscription failed:", error);
    return jsonResponse({ error: "Newsletter request failed" }, 500);
  }
});
