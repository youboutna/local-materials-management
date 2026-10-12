import { createClient, type User } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-cron-secret, x-newsletter-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const jsonResponse = (
  body: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...headers, "Content-Type": "application/json" },
  });

export const createAdminClient = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) throw new Error("Supabase server configuration is incomplete");
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

type AuthorizedRequest =
  | { user: User; roles: string[]; admin: ReturnType<typeof createAdminClient> }
  | { response: Response };

export async function authorizeRequest(
  request: Request,
  allowedRoles?: readonly string[],
): Promise<AuthorizedRequest> {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return { response: jsonResponse({ error: "Authentication required" }, 401) };

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) throw new Error("Supabase authentication configuration is incomplete");

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await userClient.auth.getUser(bearer);
  if (error || !data.user) {
    return { response: jsonResponse({ error: "Authentication required" }, 401) };
  }

  const admin = createAdminClient();
  const { data: roleRows, error: rolesError } = await admin
    .from("user_roles")
    .select("role_name")
    .eq("user_id", data.user.id)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  if (rolesError) throw rolesError;
  const roles = (roleRows ?? []).map((row) => row.role_name as string);

  if (allowedRoles && !roles.some((role) => allowedRoles.includes(role))) {
    return { response: jsonResponse({ error: "Insufficient permissions" }, 403) };
  }

  return { user: data.user, roles, admin };
}

export function hasValidCronSecret(request: Request, secretName: string): boolean {
  return hasValidSecret(request, secretName, "x-cron-secret");
}

export function hasValidSecret(
  request: Request,
  secretName: string,
  headerName: string,
): boolean {
  const expected = Deno.env.get(secretName);
  const provided = request.headers.get(headerName) ?? "";
  if (!expected || !provided) return false;
  const encoder = new TextEncoder();
  const left = encoder.encode(expected);
  const right = encoder.encode(provided);
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left[index] ^ right[index];
  return difference === 0;
}
