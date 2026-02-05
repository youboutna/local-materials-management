import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  to: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionType: string;
  metadata?: Record<string, unknown>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { to, subject, message, priority, actionType, metadata }: EmailNotificationRequest = await req.json();

    console.log("Sending email notification:", { to, subject, actionType, priority });

    const priorityEmojis: Record<string, string> = {
      low: "📧",
      medium: "⚠️",
      high: "🔴",
      urgent: "🚨"
    };

    const dueDate = metadata?.dueDate;
    const formattedDueDate = dueDate && typeof dueDate === 'string' 
      ? new Date(dueDate).toLocaleDateString('fr-FR') 
      : '';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">
            ${priorityEmojis[priority] || "📧"} ${subject}
          </h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">
            Priorité: ${priority.toUpperCase()} | Action: ${actionType}
          </p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Message:</h2>
            <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            
            ${metadata?.projectId ? `
              <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 5px;">
                <strong style="color: #1976d2;">Projet ID:</strong> ${metadata.projectId}
              </div>
            ` : ''}
            
            ${formattedDueDate ? `
              <div style="margin-top: 10px; padding: 15px; background: #fff3e0; border-radius: 5px;">
                <strong style="color: #f57c00;">Date d'échéance:</strong> ${formattedDueDate}
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #666; background: #f0f0f0;">
          <p style="margin: 0; font-size: 12px;">
            Cette notification a été envoyée automatiquement par le système de surveillance.
          </p>
        </div>
      </div>
    `;

    const fromName: string = Deno.env.get("Deno_mail_from_name") ?? "Système de Surveillance";
    const fromEmail: string = Deno.env.get("Deno_mail_from_notif") ?? "notifications@resend.dev";
    const defaultSubject: string = Deno.env.get("Deno_mail_default_subject") ?? "Notification";

    const emailResponse = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: `${priorityEmojis[priority] || "📧"} ${subject || defaultSubject}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify(emailResponse),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-email-notification function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);