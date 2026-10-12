import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createEmailService } from '../_shared/EmailServiceFactory.ts';
import { getEmailFrom } from '../_shared/config/app.ts';
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";
import { escapeHtml } from '../_shared/html.ts';

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
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const auth = await authorizeRequest(req, ['admin', 'director', 'manager']);
    if ('response' in auth) return auth.response;
    const { to, projectTitle, reportTitle, pdfBlob, fileName } = await req.json();
    if (typeof to !== 'string' || typeof projectTitle !== 'string' || typeof reportTitle !== 'string') {
      return jsonResponse({ error: 'Valid to, projectTitle, and reportTitle fields are required' }, 400);
    }
    if (typeof pdfBlob !== 'string' || pdfBlob.length > 14_000_000) {
      return jsonResponse({ error: 'A PDF attachment smaller than 10 MB is required' }, 400);
    }
    const base64 = pdfBlob.replace(/^data:application\/pdf;base64,/i, '');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      return jsonResponse({ error: 'pdfBlob must contain base64-encoded PDF data' }, 400);
    }
    const pdfBytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    if (!pdfBytes.length || pdfBytes.length > 10_000_000 || (pdfBytes[0] !== 0x25 || pdfBytes[1] !== 0x50)) {
      return jsonResponse({ error: 'pdfBlob is not a valid PDF or exceeds 10 MB' }, 400);
    }
    const safeFileName = typeof fileName === 'string' && fileName.trim()
      ? fileName.replace(/[^\w.-]/g, '_').slice(0, 120)
      : 'project-report.pdf';

    const generatedAt = new Date().toLocaleDateString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
    const html = generateProjectReportHTML(
      escapeHtml(projectTitle), escapeHtml(reportTitle), escapeHtml(safeFileName), generatedAt,
    );
    const emailFrom = getEmailFrom();

    const emailService = createEmailService();
    const result = await emailService.sendEmail({
      to,
      subject: `Rapport de projet : ${projectTitle}`,
      html,
      attachments: [{ filename: safeFileName, content: pdfBytes, contentType: 'application/pdf' }],
    });
    if (!result.success) throw new Error('Email provider reported unsuccessful delivery');

    const { error: logError } = await auth.admin.schema('btp').from('email_logs').insert({
      user_id: auth.user.id,
      email_to: to,
      email_from: emailFrom,
      subject: `Rapport de projet : ${projectTitle}`,
      body: html,
      template_name: 'project_report',
      status: 'sent',
      metadata: { projectTitle, reportTitle, fileName, generatedAt },
    });
    if (logError) console.error('Report email was sent but could not be logged:', logError);

    return jsonResponse({ success: true, logRecorded: !logError, message: 'Rapport envoyé par email' });

  } catch (error) {
    console.error('Error in send-project-report:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});