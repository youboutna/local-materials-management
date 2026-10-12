import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createAdminClient, corsHeaders, hasValidSecret, jsonResponse } from "../_shared/http.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/+$/, "");
  const cronSecret = request.headers.get("x-newsletter-cron-secret");
  if (!supabaseUrl || !Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || !Deno.env.get("NEWSLETTER_CRON_SECRET")) {
    console.error("Newsletter dispatcher service configuration is incomplete");
    return jsonResponse({ error: "Service unavailable" }, 503);
  }
  if (!cronSecret || !hasValidSecret(request, "NEWSLETTER_CRON_SECRET", "x-newsletter-cron-secret")) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  try {
    const admin = createAdminClient().schema("btp");
    const { data: dueCampaigns, error } = await admin
      .from("newsletter_campaigns")
      .select("id")
      .eq("status", "scheduled")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(50);
    if (error) throw error;

    const results = await Promise.all((dueCampaigns ?? []).map(async ({ id }) => {
      try {
        const result = await fetch(`${supabaseUrl}/functions/v1/newsletter-campaign-send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-newsletter-cron-secret": cronSecret,
          },
          body: JSON.stringify({ campaignId: id }),
        });
        if (!result.ok) {
          const details = await result.text();
          console.error(`Scheduled campaign ${id} failed: ${details}`);
          return { id, success: false };
        }
        return { id, success: true };
      } catch (error) {
        console.error(`Could not dispatch scheduled campaign ${id}:`, error);
        return { id, success: false };
      }
    }));
    return jsonResponse(
      { processed: results.length, results },
      results.some(({ success }) => !success) ? 502 : 200,
    );
  } catch (error) {
    console.error("newsletter-campaign-dispatcher failed:", error);
    return jsonResponse({ error: "Dispatch failed" }, 500);
  }
});
