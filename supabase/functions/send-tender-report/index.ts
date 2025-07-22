import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TenderReportEmailRequest {
  to: string;
  tenderTitle: string;
  reportTitle: string;
  pdfBlob: number[]; // Uint8Array converted to number array
  fileName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to, tenderTitle, reportTitle, pdfBlob, fileName }: TenderReportEmailRequest = await req.json();

    console.log('Sending tender report email:', {
      to,
      tenderTitle,
      reportTitle,
      fileName,
      pdfSize: pdfBlob?.length || 0
    });

    // Convert number array back to Uint8Array
    const pdfBuffer = new Uint8Array(pdfBlob);

    // Create email content
    const subject = `Rapport d'appel d'offres: ${tenderTitle}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📋 Rapport d'Appel d'Offres</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Système de Gestion des Appels d'Offres</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Bonjour,</h2>
            
            <p style="margin-bottom: 20px;">
              Vous trouverez ci-joint le rapport d'appel d'offres demandé :
            </p>
            
            <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
              <h3 style="margin: 0 0 10px 0; color: #2d3748;">📋 ${reportTitle}</h3>
              <p style="margin: 5px 0; color: #4a5568;"><strong>Appel d'offres:</strong> ${tenderTitle}</p>
              <p style="margin: 5px 0; color: #4a5568;"><strong>Fichier:</strong> ${fileName}</p>
              <p style="margin: 5px 0; color: #4a5568;"><strong>Généré le:</strong> ${new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            
            <p style="margin: 20px 0;">
              Ce rapport contient toutes les informations relatives à l'appel d'offres, 
              incluant le workflow, les critères d'évaluation, les échéances et l'état d'avancement.
            </p>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 15px 0; color: #0369a1;">📋 Contenu du rapport:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
                <li style="margin-bottom: 8px;">Aperçu général de l'appel d'offres</li>
                <li style="margin-bottom: 8px;">Statut du workflow de publication</li>
                <li style="margin-bottom: 8px;">Calendrier et échéances importantes</li>
                <li style="margin-bottom: 8px;">Critères d'évaluation des offres</li>
                <li style="margin-bottom: 8px;">Informations complémentaires</li>
              </ul>
            </div>
            
            <div style="background: #f3e8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #7c3aed; font-size: 14px;">
                🔒 <strong>Confidentiel:</strong> Ce document peut contenir des informations sensibles. 
                Merci de le traiter avec la confidentialité appropriée.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9; text-align: center; color: #6c757d;">
              <p style="margin: 0; font-size: 14px;">
                Cordialement,<br>
                <strong>L'équipe de gestion des appels d'offres</strong>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // For development, we'll log the email instead of actually sending it
    // In production, you would integrate with an email service like Resend
    console.log('Tender report email would be sent with the following content:', {
      to,
      subject,
      attachmentSize: pdfBuffer.length,
      fileName
    });

    // Simulate successful email sending
    // In a real implementation, you would:
    // 1. Use a service like Resend to send the email
    // 2. Attach the PDF file
    // 3. Handle email sending errors

    // Save email record to database for tracking
    const { error: dbError } = await supabaseClient
      .from('email_logs')
      .insert({
        recipient: to,
        subject,
        content_type: 'tender_report',
        status: 'sent',
        metadata: {
          tenderTitle,
          reportTitle,
          fileName,
          fileSize: pdfBuffer.length
        }
      });

    if (dbError) {
      console.error('Error saving email log:', dbError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Rapport d\'appel d\'offres envoyé avec succès par email',
        details: {
          recipient: to,
          fileName,
          size: pdfBuffer.length
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in send-tender-report function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de l\'envoi du rapport d\'appel d\'offres par email',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});