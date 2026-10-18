import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";
import { SMS_POLICY, TwilioSmsProvider, validateSmsRequest } from "../_shared/SmsProvider.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await authorizeRequest(request, SMS_POLICY.allowedRoles);
    if ("response" in auth) return auth.response;
    let payload;
    try { payload = validateSmsRequest(await request.json()); }
    catch { return jsonResponse({ success: false, error: "Provide a valid E.164 recipient and message" }, 400); }
    const result = await new TwilioSmsProvider((name) => Deno.env.get(name)).send(payload);
    return jsonResponse({ ...result }, result.success ? 200 : result.error === 'SMS_PROVIDER_NOT_CONFIGURED' ? 503 : result.providerStatus || 502);
  } catch (error) {
    console.error("SMS provider request failed");
    return jsonResponse({ success: false, error: "SMS request failed; no delivery confirmed" }, 502);
  }
});
