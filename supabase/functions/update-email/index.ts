
/**
 * update-email
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await authorizeRequest(req);
    if ("response" in auth) return auth.response;
    const { newEmail } = await req.json();
    if (typeof newEmail !== "string" || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(newEmail)) {
      return jsonResponse({ error: "A valid newEmail is required" }, 400);
    }

    const { error: updateError } = await auth.admin.auth.admin.updateUserById(auth.user.id, { email: newEmail });
    if (updateError) throw updateError;

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Update email error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});