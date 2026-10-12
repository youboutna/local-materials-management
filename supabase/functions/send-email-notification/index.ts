import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createEmailService } from "../_shared/EmailServiceFactory.ts";
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";

const isEmail = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]!));

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await authorizeRequest(request);
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const recipients = Array.isArray(body.to) ? body.to : [body.to];
    const { subject, message, html, text, replyTo, attachments } = body;
    if (
      recipients.length < 1 ||
      recipients.length > 50 ||
      !recipients.every(isEmail) ||
      typeof subject !== "string" ||
      !subject.trim() ||
      /[\r\n]/.test(subject) ||
      subject.length > 998 ||
      [message, html, text].some((value) => value !== undefined && typeof value !== "string") ||
      (!message && !html && !text)
    ) {
      return jsonResponse({ error: "Valid recipients, subject, and email content are required" }, 400);
    }
    if ([message, html, text].some((value) => typeof value === "string" && value.length > 1_000_000)) {
      return jsonResponse({ error: "Email content exceeds the 1 MB limit" }, 413);
    }
    if (attachments !== undefined && (!Array.isArray(attachments) || attachments.length > 10)) {
      return jsonResponse({ error: "Invalid email attachments" }, 400);
    }
    if (
      attachments?.some((item: unknown) =>
        !item || typeof item !== "object" ||
        typeof (item as Record<string, unknown>).filename !== "string" ||
        !/^[\w.-]{1,120}$/.test((item as Record<string, unknown>).filename as string) ||
        typeof (item as Record<string, unknown>).content !== "string" ||
        ((item as Record<string, unknown>).content as string).length > 14_000_000
      )
    ) {
      return jsonResponse({ error: "Invalid attachment name or content" }, 400);
    }
    if (replyTo !== undefined && !isEmail(replyTo)) {
      return jsonResponse({ error: "replyTo must be a valid email address" }, 400);
    }

    console.log("Sending email via Edge Function:", {
      requestedBy: auth.user.id,
      recipientCount: recipients.length,
      subject,
      attachments: attachments?.length ?? 0,
    });
    const result = await createEmailService().sendEmail({
      to: body.to,
      subject,
      html: html ?? (message ? escapeHtml(message).replace(/\n/g, "<br>") : undefined),
      text: text ?? message,
      replyTo,
      attachments,
    });
    if (!result.success) throw new Error("Email provider reported unsuccessful delivery");
    return jsonResponse({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("Error in send-email-notification:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Email send failed" }, 500);
  }
});
