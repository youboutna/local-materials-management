import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import {
  renderSupplierConfirmationEmail,
} from "./_templates/supplier-confirmation.tsx";
import {
  renderAdminNotificationEmail,
} from "./_templates/admin-notification.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmissionNotificationRequest {
  supplier_email: string;
  supplier_name: string;
  tender_title: string;
  submission_id: string;
  secret_code: string;
  admin_emails?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      supplier_email,
      supplier_name,
      tender_title,
      submission_id,
      secret_code,
      admin_emails = []
    }: SubmissionNotificationRequest = await req.json();

    console.log("Sending submission notifications:", {
      supplier_email,
      tender_title,
      submission_id,
      admin_count: admin_emails.length
    });

    // Render supplier confirmation email
    const supplierHtml = renderSupplierConfirmationEmail({
      supplier_name,
      tender_title,
      submission_id,
      secret_code,
    });

    // Email to supplier (confirmation)
    const supplierEmailResponse = await resend.emails.send({
      from: "Plateforme d'Appels d'Offres <onboarding@resend.dev>",
      to: [supplier_email],
      subject: `Confirmation de soumission - ${tender_title}`,
      html: supplierHtml,
    });

    console.log("Supplier email sent:", supplierEmailResponse);

    // Render admin notification email
    const adminHtml = renderAdminNotificationEmail({
      tender_title,
      supplier_name,
      supplier_email,
      submission_id,
    });

    // Email to administrators (notification of new submission)
    const adminEmailPromises = admin_emails.map(admin_email =>
      resend.emails.send({
        from: "Plateforme d'Appels d'Offres <onboarding@resend.dev>",
        to: [admin_email],
        subject: `Nouvelle soumission - ${tender_title}`,
        html: adminHtml,
      })
    );

    const adminEmailResults = await Promise.allSettled(adminEmailPromises);
    console.log("Admin emails sent:", adminEmailResults);

    return new Response(
      JSON.stringify({
        success: true,
        supplier_email_sent: supplierEmailResponse.id,
        admin_emails_sent: adminEmailResults.filter(r => r.status === 'fulfilled').length,
        admin_emails_failed: adminEmailResults.filter(r => r.status === 'rejected').length
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-tender-submission-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
