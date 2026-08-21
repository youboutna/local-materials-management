import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createEmailService } from '../_shared/EmailServiceFactory.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateProjectReportHTML = (projectTitle: string, reportTitle: string, fileName: string, generatedAt: string) => `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${reportTitle}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1>📊 Rapport de Projet</h1>
      <p style="opacity: 0.9;">Système de Gestion de Projets</p>
    </div>
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
      <h2>Bonjour,</h2>
      <p>Vous trouverez ci‑joint le rapport demandé pour le projet :</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
        <h3>📋 ${reportTitle}</h3>
        <p><strong>Projet :</strong> ${projectTitle}</p>
        <p><strong>Fichier :</strong> ${fileName}</p>
        <p><strong>Généré le :</strong> ${generatedAt}</p>
      </div>
      <div style="background: #e6f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #0066cc;">💡 Ce rapport a été généré automatiquement.</p>
      </div>
      <hr/>
      <p style="text-align: center; color: #6c757d;">Cordialement,<br><strong>L'équipe de gestion de projets</strong></p>
    </div>
  </div>
</body>
</html>`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to, projectTitle, reportTitle, pdfBlob, fileName } = await req.json();

    if (!to || !projectTitle || !reportTitle) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, projectTitle, reportTitle' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const generatedAt = new Date().toLocaleDateString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
    const html = generateProjectReportHTML(projectTitle, reportTitle, fileName, generatedAt);

    const emailService = createEmailService();
    await emailService.sendEmail({
      to,
      subject: `Rapport de projet : ${projectTitle}`,
      html,
    });

    await supabase.from('email_logs').insert({
      recipient: to,
      subject: `Rapport de projet : ${projectTitle}`,
      content_type: 'project_report',
      status: 'sent',
      metadata: { projectTitle, reportTitle, fileName, generatedAt },
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Rapport envoyé par email' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-project-report:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});