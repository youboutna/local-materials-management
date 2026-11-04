import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";
import { createSmsProvider } from "../_shared/SmsProvider.ts";

/**
 * admin-users — administration des comptes (création avec lien de confirmation
 * par e-mail ou SMS, modification, activation, rôles, suppression).
 * Seuls admin / super_admin peuvent l'appeler ; les rôles restent dans public.user_roles.
 */
const ADMIN_ROLES = ["admin", "super_admin"] as const;
const ROLE_CODE = /^[a-z][a-z0-9_]{1,62}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164 = /^\+[1-9]\d{7,14}$/;

type Channel = "email" | "sms";
interface Body {
  action: "create" | "update" | "set_active" | "delete" | "resend_confirmation" | "list_auth";
  userId?: string;
  email?: string;
  phone?: string | null;
  fullName?: string;
  nationalId?: string | null;
  roles?: string[];
  channel?: Channel;
  password?: string;
  isActive?: boolean;
  redirectTo?: string;
}

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function validateRoles(roles: unknown, callerRoles: string[]): string[] | string {
  if (roles === undefined) return [];
  if (!Array.isArray(roles)) return "roles must be an array";
  const unique = [...new Set(roles.map(clean).filter(Boolean))];
  if (unique.some((r) => !ROLE_CODE.test(r))) return "invalid role code";
  if (unique.includes("super_admin") && !callerRoles.includes("super_admin")) {
    return "only a super administrator can grant super_admin";
  }
  return unique;
}

async function syncRoles(admin: any, userId: string, roles: string[]) {
  const { data: current, error } = await admin
    .from("user_roles").select("role_name, status").eq("user_id", userId);
  if (error) throw error;
  const active = new Set((current ?? []).filter((r: any) => r.status === "active").map((r: any) => r.role_name));
  const target = new Set(roles);
  const toDisable = [...active].filter((r) => !target.has(r));
  const toEnable = [...target].filter((r) => !active.has(r));
  if (toDisable.length) {
    const { error: e } = await admin.from("user_roles")
      .update({ status: "inactive", expires_at: new Date().toISOString() })
      .eq("user_id", userId).in("role_name", toDisable);
    if (e) throw e;
  }
  for (const role_name of toEnable) {
    const { error: e } = await admin.from("user_roles").upsert(
      { user_id: userId, role_name, status: "active", expires_at: null },
      { onConflict: "user_id,role_name" },
    );
    if (e) throw e;
  }
}

async function sendConfirmation(
  admin: any, channel: Channel, email: string, phone: string | null, redirectTo: string, fullName: string,
  existing: boolean,
): Promise<{ channel: Channel; sent: boolean; userId?: string; error?: string }> {
  if (channel === "email") {
    if (existing) {
      const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
      return { channel, sent: !error, error: error?.message };
    }
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo, data: { full_name: fullName },
    });
    return { channel, sent: !error, userId: data?.user?.id, error: error?.message };
  }
  if (!phone || !E164.test(phone)) return { channel, sent: false, error: "valid E.164 phone required for SMS" };
  const { data, error } = await admin.auth.admin.generateLink({
    type: existing ? "recovery" : "invite", email,
    options: { redirectTo, data: { full_name: fullName } },
  });
  if (error || !data?.properties?.action_link) return { channel, sent: false, error: error?.message ?? "link generation failed" };
  const sms = await createSmsProvider((n) => Deno.env.get(n)).send({
    to: phone,
    message: `Bienvenue ${fullName}. Confirmez votre compte et choisissez votre mot de passe : ${data.properties.action_link}`,
  });
  return { channel, sent: sms.success, userId: data.user?.id, error: sms.success ? undefined : sms.error };
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  try {
    const auth = await authorizeRequest(request, ADMIN_ROLES);
    if ("response" in auth) return auth.response;
    const { admin, user: caller, roles: callerRoles } = auth;
    const body = (await request.json()) as Body;
    const redirectTo = clean(body.redirectTo) || `${request.headers.get("origin") ?? ""}/reset-password`;

    switch (body.action) {
      case "list_auth": {
        const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (error) return jsonResponse({ success: false, error: error.message }, 400);
        return jsonResponse({
          success: true,
          users: data.users.map((u: any) => ({
            id: u.id, email: u.email ?? null, phone: u.phone ?? null,
            confirmedAt: u.email_confirmed_at ?? u.confirmed_at ?? null,
            lastSignInAt: u.last_sign_in_at ?? null,
            bannedUntil: u.banned_until ?? null,
          })),
        });
      }
      case "create": {
        const email = clean(body.email).toLowerCase();
        const fullName = clean(body.fullName);
        const phone = clean(body.phone) || null;
        const channel: Channel = body.channel === "sms" ? "sms" : "email";
        if (!EMAIL.test(email) || !fullName) return jsonResponse({ success: false, error: "email and fullName required" }, 400);
        if (phone && !E164.test(phone)) return jsonResponse({ success: false, error: "phone must be E.164" }, 400);
        const roles = validateRoles(body.roles, callerRoles);
        if (typeof roles === "string") return jsonResponse({ success: false, error: roles }, 400);

        const result = await sendConfirmation(admin, channel, email, phone, redirectTo, fullName, false);
        if (!result.userId) return jsonResponse({ success: false, error: result.error ?? "user creation failed" }, 400);
        const userId = result.userId;
        const { error: pErr } = await admin.from("profiles").upsert({
          id: userId, full_name: fullName, phone, national_id: clean(body.nationalId) || null, status: "pending",
        });
        if (pErr) console.error("profile upsert failed", pErr.message);
        await syncRoles(admin, userId, roles.length ? roles : ["viewer"]);
        return jsonResponse({ success: true, userId, confirmation: result });
      }
      case "update": {
        const userId = clean(body.userId);
        if (!userId) return jsonResponse({ success: false, error: "userId required" }, 400);
        const attrs: Record<string, unknown> = {};
        if (body.email !== undefined) {
          const email = clean(body.email).toLowerCase();
          if (!EMAIL.test(email)) return jsonResponse({ success: false, error: "invalid email" }, 400);
          attrs.email = email;
        }
        if (body.password) {
          if (body.password.length < 8) return jsonResponse({ success: false, error: "password too short" }, 400);
          attrs.password = body.password;
        }
        if (Object.keys(attrs).length) {
          const { error } = await admin.auth.admin.updateUserById(userId, attrs);
          if (error) return jsonResponse({ success: false, error: error.message }, 400);
        }
        const profile: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (body.fullName !== undefined) profile.full_name = clean(body.fullName);
        if (body.phone !== undefined) {
          const phone = clean(body.phone) || null;
          if (phone && !E164.test(phone)) return jsonResponse({ success: false, error: "phone must be E.164" }, 400);
          profile.phone = phone;
        }
        if (body.nationalId !== undefined) profile.national_id = clean(body.nationalId) || null;
        const { error: pErr } = await admin.from("profiles").update(profile).eq("id", userId);
        if (pErr) return jsonResponse({ success: false, error: pErr.message }, 400);
        if (body.roles !== undefined) {
          const roles = validateRoles(body.roles, callerRoles);
          if (typeof roles === "string") return jsonResponse({ success: false, error: roles }, 400);
          if (userId === caller.id && !roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r))) {
            return jsonResponse({ success: false, error: "you cannot remove your own administrator role" }, 400);
          }
          await syncRoles(admin, userId, roles);
        }
        return jsonResponse({ success: true, userId });
      }
      case "set_active": {
        const userId = clean(body.userId);
        if (!userId) return jsonResponse({ success: false, error: "userId required" }, 400);
        if (userId === caller.id && body.isActive === false) return jsonResponse({ success: false, error: "you cannot deactivate yourself" }, 400);
        const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: body.isActive ? "none" : "876000h" });
        if (error) return jsonResponse({ success: false, error: error.message }, 400);
        await admin.from("profiles").update({ status: body.isActive ? "active" : "inactive" }).eq("id", userId);
        return jsonResponse({ success: true, userId, isActive: !!body.isActive });
      }
      case "delete": {
        const userId = clean(body.userId);
        if (!userId) return jsonResponse({ success: false, error: "userId required" }, 400);
        if (userId === caller.id) return jsonResponse({ success: false, error: "you cannot delete yourself" }, 400);
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) return jsonResponse({ success: false, error: error.message }, 400);
        return jsonResponse({ success: true, userId });
      }
      case "resend_confirmation": {
        const userId = clean(body.userId);
        const { data, error } = await admin.auth.admin.getUserById(userId);
        if (error || !data?.user?.email) return jsonResponse({ success: false, error: error?.message ?? "user not found" }, 404);
        const { data: prof } = await admin.from("profiles").select("full_name, phone").eq("id", userId).maybeSingle();
        const channel: Channel = body.channel === "sms" ? "sms" : "email";
        const result = await sendConfirmation(admin, channel, data.user.email, prof?.phone ?? null, redirectTo,
          prof?.full_name ?? "", true);
        return jsonResponse({ success: result.sent, confirmation: result, error: result.error }, result.sent ? 200 : 502);
      }
      default:
        return jsonResponse({ success: false, error: "unknown action" }, 400);
    }
  } catch (error) {
    console.error("admin-users failed", error instanceof Error ? error.message : error);
    return jsonResponse({ success: false, error: "User administration request failed" }, 500);
  }
});
