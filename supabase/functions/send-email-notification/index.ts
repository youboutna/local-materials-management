import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createEmailService } from '../_shared/EmailServiceFactory.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { to, subject, message, priority, actionType, metadata } = await req.json();

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending email via Edge Function:", { to, subject, actionType, priority });

    const emailService = createEmailService();
    const result = await emailService.sendEmail({
      to,
      subject,
      html: message.replace(/\n/g, '<br>'),
      text: message,
    });

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-email-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});