import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createEmailService } from '../_shared/EmailServiceFactory.ts';
import { renderAdminNotificationEmail } from '../_templates/admin-notification.tsx';
import { renderSupplierConfirmationEmail } from '../_templates/supplier-confirmation.tsx';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
    } = await req.json();

    if (!supplier_email || !tender_title || !submission_id || !secret_code) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: supplier_email, tender_title, submission_id, secret_code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailService = createEmailService();

    // Email au fournisseur (confirmation)
    await emailService.sendEmail({
      to: supplier_email,
      subject: `Confirmation de soumission - ${tender_title}`,
      html: renderSupplierConfirmationEmail({
        supplier_name,
        tender_title,
        submission_id,
        secret_code,
      }),
    });

    // Email aux administrateurs (notification)
    const adminHtml = renderAdminNotificationEmail({
      tender_title,
      supplier_name,
      supplier_email,
      submission_id,
    });

    const adminPromises = admin_emails.map((adminEmail: string) =>
      emailService.sendEmail({
        to: adminEmail,
        subject: `Nouvelle soumission - ${tender_title}`,
        html: adminHtml,
      })
    );

    const adminResults = await Promise.allSettled(adminPromises);
    const successCount = adminResults.filter(r => r.status === 'fulfilled').length;
    const failedCount = adminResults.filter(r => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({
        success: true,
        supplier_email_sent: 'sent',
        admin_emails_sent: successCount,
        admin_emails_failed: failedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-tender-submission-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});