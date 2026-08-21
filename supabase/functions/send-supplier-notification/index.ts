import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createEmailService } from '../_shared/EmailServiceFactory.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateEmailContent = (request: any) => {
  if (request.type === 'password_reset') {
    const resetUrl = `${Deno.env.get('SITE_URL')}/supplier/reset-password?token=${request.reset_token}`;
    return {
      subject: 'Réinitialisation de votre mot de passe - Portail Fournisseur',
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour ${request.supplier_name || 'Fournisseur'},</p>
        <p>Un compte a été créé pour vous sur notre portail fournisseur. Veuillez cliquer sur le lien ci-dessous pour définir votre mot de passe :</p>
        <a href="${resetUrl}">Définir mon mot de passe</a>
        <p>Ce lien expire dans 24 heures.</p>
      `,
    };
  } else {
    return {
      subject: `Nouvelle tâche assignée : ${request.task_title}`,
      html: `
        <h2>Nouvelle tâche assignée</h2>
        <p>Bonjour,</p>
        <p>Une nouvelle tâche vous a été assignée : <strong>${request.task_title}</strong></p>
        <p>Vous pouvez la consulter et la marquer comme terminée en cliquant sur le lien ci-dessous :</p>
        <a href="${request.completion_url}">Voir la tâche</a>
      `,
    };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, email, supplier_name, reset_token, task_id, task_title, completion_url } = await req.json();

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailContent = generateEmailContent({ type, email, supplier_name, reset_token, task_id, task_title, completion_url });

    const emailService = createEmailService();
    await emailService.sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    await supabase
      .from('supplier_notifications')
      .insert({
        notification_type: type,
        email,
        reset_token: reset_token || null,
        task_id: task_id || null,
        expires_at: type === 'password_reset' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
        metadata: { subject: emailContent.subject, email_sent: true },
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Notification envoyée' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-supplier-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});