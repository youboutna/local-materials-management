import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await authorizeRequest(request);
    if ("response" in auth) return auth.response;
    return jsonResponse({
      success: false,
      error: "SMS delivery is not configured. No message was sent.",
      code: "SMS_PROVIDER_NOT_CONFIGURED",
    }, 501);
  } catch (error) {
    console.error("Error in send-sms-notification:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "SMS delivery failed" }, 500);
  }
});
