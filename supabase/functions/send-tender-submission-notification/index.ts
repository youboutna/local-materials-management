import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createEmailService } from "../_shared/EmailServiceFactory.ts";
import { renderAdminNotificationEmail } from "../_templates/admin-notification.tsx";
import { renderSupplierConfirmationEmail } from "../_templates/supplier-confirmation.tsx";
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";

const isEmail = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await authorizeRequest(request, ["admin", "director", "manager"]);
    if ("response" in auth) return auth.response;
    const body = await request.json();
    const { supplier_email, supplier_name, tender_title, submission_id, secret_code } = body;
    const adminEmails = body.admin_emails ?? [];
    if (
      !isEmail(supplier_email) ||
      typeof tender_title !== "string" || !tender_title.trim() ||
      typeof submission_id !== "string" || !submission_id.trim() ||
      typeof secret_code !== "string" || !secret_code.trim() ||
      !Array.isArray(adminEmails) || adminEmails.length > 20 ||
      !adminEmails.every(isEmail)
    ) {
      return jsonResponse({ error: "Invalid supplier, tender, submission, secret code, or admin email data" }, 400);
    }

    const emailService = createEmailService();
    const supplierResult = await emailService.sendEmail({
      to: supplier_email,
      subject: `Confirmation de soumission - ${tender_title}`,
      html: renderSupplierConfirmationEmail({ supplier_name, tender_title, submission_id, secret_code }),
    });
    if (!supplierResult.success) throw new Error("Supplier confirmation email was not accepted by the provider");

    const adminHtml = renderAdminNotificationEmail({
      tender_title,
      supplier_name,
      supplier_email,
      submission_id,
    });
    const adminResults = await Promise.allSettled(adminEmails.map((adminEmail: string) =>
      emailService.sendEmail({
        to: adminEmail,
        subject: `Nouvelle soumission - ${tender_title}`,
        html: adminHtml,
      })
    ));
    const successCount = adminResults.filter((result) => result.status === "fulfilled" && result.value.success).length;
    const failedCount = adminResults.length - successCount;

    return jsonResponse({
      success: failedCount === 0,
      supplier_email_sent: true,
      admin_emails_sent: successCount,
      admin_emails_failed: failedCount,
    }, failedCount ? 502 : 200);
  } catch (error) {
    console.error("Error in send-tender-submission-notification:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
