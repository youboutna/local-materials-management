import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createEmailService } from "../_shared/EmailServiceFactory.ts";
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]!));

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await authorizeRequest(request, ["admin", "director", "manager"]);
    if ("response" in auth) return auth.response;
    const payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return jsonResponse({ error: "A notification payload is required" }, 400);
    }
    const {
      type,
      email,
      supplier_name,
      supplier_id,
      reset_token,
      task_id,
      task_title,
      completion_url,
      payment_amount,
      payment_id,
      inspection_date,
      inspection_id,
    } = payload;
    const supportedTypes = ["password_reset", "task_assignment", "task_assigned", "payment_request", "inspection_required"];
    const notificationType = type === "task_assigned" ? "task_assignment" : type;
    if (
      typeof email !== "string" ||
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email) ||
      !supportedTypes.includes(type)
    ) {
      return jsonResponse({ error: "Valid email and notification type are required" }, 400);
    }
    if (supplier_id !== undefined && (
      typeof supplier_id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(supplier_id)
    )) {
      return jsonResponse({ error: "supplier_id must be a valid UUID" }, 400);
    }

    let subject: string;
    let html: string;
    if (notificationType === "password_reset") {
      if (typeof reset_token !== "string" || !reset_token.trim()) {
        return jsonResponse({ error: "reset_token is required for password reset notifications" }, 400);
      }
      const siteUrl = Deno.env.get("SITE_URL");
      if (!siteUrl) throw new Error("SITE_URL is not configured");
      const resetUrl = `${siteUrl.replace(/\/$/, "")}/supplier/reset-password?token=${encodeURIComponent(reset_token)}`;
      subject = "Réinitialisation de votre mot de passe - Portail Fournisseur";
      html = `<h2>Réinitialisation de mot de passe</h2><p>Bonjour ${escapeHtml(supplier_name || "Fournisseur")},</p><p>Veuillez utiliser le lien ci-dessous pour définir votre mot de passe :</p><a href="${escapeHtml(resetUrl)}">Définir mon mot de passe</a><p>Ce lien expire dans 24 heures.</p>`;
    } else if (notificationType === "task_assignment") {
      if (typeof task_title !== "string" || !task_title.trim()) {
        return jsonResponse({ error: "task_title is required for task assignment notifications" }, 400);
      }

      let taskLink = "";
      if (task_id) {
        if (typeof task_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(task_id)) {
          return jsonResponse({ error: "task_id must be a valid UUID" }, 400);
        }
        if (typeof completion_url !== "string") {
          return jsonResponse({ error: "completion_url is required when task_id is provided" }, 400);
        }
        const taskUrl = new URL(completion_url);
        const siteUrl = Deno.env.get("SITE_URL");
        if (!siteUrl || taskUrl.origin !== new URL(siteUrl).origin) {
          return jsonResponse({ error: "completion_url must use the configured SITE_URL origin" }, 400);
        }
        taskLink = `<p><a href="${escapeHtml(taskUrl.href)}">Voir la tâche</a></p>`;
      }
      const safeTaskTitle = task_title.replace(/[\r\n]+/g, " ").trim();
      subject = `Nouvelle tâche assignée : ${safeTaskTitle}`;
      html = `<h2>Nouvelle tâche assignée</h2><p>Bonjour ${escapeHtml(supplier_name || "Fournisseur")}, une nouvelle tâche vous a été assignée : <strong>${escapeHtml(task_title.trim())}</strong>.</p>${taskLink}`;
    } else if (notificationType === "payment_request") {
      if (typeof payment_amount !== "number" || !Number.isFinite(payment_amount) || payment_amount < 0) {
        return jsonResponse({ error: "payment_amount must be a valid non-negative number" }, 400);
      }
      subject = "Demande de paiement";
      html = `<h2>Demande de paiement</h2><p>Bonjour ${escapeHtml(supplier_name || "Fournisseur")}, une demande de paiement de ${escapeHtml(String(payment_amount))} vous a été adressée.</p>`;
    } else {
      if (typeof inspection_date !== "string" || !inspection_date.trim()) {
        return jsonResponse({ error: "inspection_date is required for inspection notifications" }, 400);
      }
      subject = "Inspection requise";
      html = `<h2>Inspection requise</h2><p>Bonjour ${escapeHtml(supplier_name || "Fournisseur")}, une inspection est prévue le ${escapeHtml(inspection_date.trim())}.</p>`;
    }

    const result = await createEmailService().sendEmail({ to: email, subject, html });
    if (!result.success) throw new Error("Email provider reported unsuccessful delivery");

    let notificationId: string | undefined;
    if (notificationType !== "password_reset") {
      const { data: notification, error: notificationError } = await auth.admin.schema("btp")
        .from("supplier_notifications")
        .insert({
          supplier_id: supplier_id || null,
          notification_type: notificationType,
          email,
          task_id: task_id || null,
          created_by: auth.user.id,
          metadata: {
            subject,
            email_sent: true,
            supplier_name: typeof supplier_name === "string" ? supplier_name : null,
            task_title: typeof task_title === "string" ? task_title : null,
            payment_id: typeof payment_id === "string" ? payment_id : null,
            payment_amount: typeof payment_amount === "number" ? payment_amount : null,
            inspection_id: typeof inspection_id === "string" ? inspection_id : null,
            inspection_date: typeof inspection_date === "string" ? inspection_date : null,
          },
        })
        .select("id")
        .single();
      if (notificationError) throw notificationError;
      notificationId = notification.id;
    }

    return jsonResponse({ success: true, notification_id: notificationId, message: "Notification envoyée" });
  } catch (error) {
    console.error("Error in send-supplier-notification:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
