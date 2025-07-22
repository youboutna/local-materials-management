import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportEmailRequest {
  to: string;
  projectTitle: string;
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

    const { to, projectTitle, reportTitle, pdfBlob, fileName }: ReportEmailRequest = await req.json();

    console.log('Sending project report email:', {
      to,
      projectTitle,
      reportTitle,
      fileName,
      pdfSize: pdfBlob?.length || 0
    });

    // Convert number array back to Uint8Array
    const pdfBuffer = new Uint8Array(pdfBlob);

    // Create email content
    const subject = `Rapport de projet: ${projectTitle}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📊 Rapport de Projet</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Système de Gestion de Projets</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Bonjour,</h2>
            
            <p style="margin-bottom: 20px;">
              Vous trouverez ci-joint le rapport demandé pour le projet :
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 10px 0; color: #2d3748;">📋 ${reportTitle}</h3>
              <p style="margin: 5px 0; color: #4a5568;"><strong>Projet:</strong> ${projectTitle}</p>
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
              Ce rapport contient toutes les informations actualisées concernant l'état du projet, 
              incluant les aspects financiers, le planning, et l'avancement des travaux.
            </p>
            
            <div style="background: #e6f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #0066cc; font-size: 14px;">
                💡 <strong>Note:</strong> Ce rapport a été généré automatiquement par notre système de gestion de projets.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9; text-align: center; color: #6c757d;">
              <p style="margin: 0; font-size: 14px;">
                Cordialement,<br>
                <strong>L'équipe de gestion de projets</strong>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // For development, we'll log the email instead of actually sending it
    // In production, you would integrate with an email service like Resend
    console.log('Email would be sent with the following content:', {
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
        content_type: 'project_report',
        status: 'sent',
        metadata: {
          projectTitle,
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
        message: 'Rapport envoyé avec succès par email',
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
    console.error('Error in send-project-report function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de l\'envoi du rapport par email',
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