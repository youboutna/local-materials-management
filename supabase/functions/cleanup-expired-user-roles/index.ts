import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await authorizeRequest(request, ["admin", "super_admin"]);
    if ("response" in auth) return auth.response;

    const { data: affectedCount, error } = await auth.admin.rpc("cleanup_expired_user_roles");
    if (error) {
      console.error("cleanup-expired-user-roles RPC failed:", error);
      return jsonResponse({ error: "Failed to clean up expired user roles" }, 500);
    }
    if (typeof affectedCount !== "number" || !Number.isInteger(affectedCount) || affectedCount < 0) {
      console.error("cleanup-expired-user-roles returned an invalid affected-row count");
      return jsonResponse({ error: "Cleanup returned an invalid result" }, 500);
    }

    return jsonResponse({ success: true, affectedCount });
  } catch (error) {
    console.error("cleanup-expired-user-roles failed:", error);
    return jsonResponse({ error: "Failed to clean up expired user roles" }, 500);
  }
});
