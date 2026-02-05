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

interface SubmissionNotificationResponse {
  success: boolean;
  supplier_email_sent: string;
  admin_emails_sent: number;
  admin_emails_failed: number;
}

interface ResendEmailResponse {
  id: string;
}

interface AdminEmailResult {
  status: 'fulfilled' | 'rejected';
  value?: ResendEmailResponse;
  reason?: Error;
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
    const supplierEmailResult = await resend.emails.send({
      from: "Plateforme d'Appels d'Offres <onboarding@resend.dev>",
      to: [supplier_email],
      subject: `Confirmation de soumission - ${tender_title}`,
      html: supplierHtml,
    });
    
    const supplierEmailId = (supplierEmailResult as { id?: string })?.id || 'sent';

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

    const adminEmailResults: AdminEmailResult[] = await Promise.allSettled(adminEmailPromises) as AdminEmailResult[];
    console.log("Admin emails sent:", adminEmailResults);

    const response: SubmissionNotificationResponse = {
      success: true,
      supplier_email_sent: supplierEmailId,
      admin_emails_sent: adminEmailResults.filter(r => r.status === 'fulfilled').length,
      admin_emails_failed: adminEmailResults.filter(r => r.status === 'rejected').length
    };

    return new Response(
      JSON.stringify(response),
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
    console.error("Error in send-tender-submission-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.toString() : 'Unknown error details'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
