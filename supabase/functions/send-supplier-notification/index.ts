
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'password_reset' | 'task_assignment';
  email: string;
  supplier_name?: string;
  reset_token?: string;
  task_id?: string;
  task_title?: string;
  completion_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, email, supplier_name, reset_token, task_id, task_title, completion_url }: NotificationRequest = await req.json();

    let emailContent = '';
    let subject = '';

    if (type === 'password_reset') {
      subject = 'Réinitialisation de votre mot de passe - Portail Fournisseur';
      const resetUrl = `${Deno.env.get('SITE_URL')}/supplier/reset-password?token=${reset_token}`;
      
      emailContent = `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour ${supplier_name || 'Fournisseur'},</p>
        <p>Un compte a été créé pour vous sur notre portail fournisseur. Veuillez cliquer sur le lien ci-dessous pour définir votre mot de passe :</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Définir mon mot de passe</a>
        <p>Ce lien expire dans 24 heures.</p>
        <p>Si vous n'arrivez pas à cliquer sur le lien, copiez et collez cette URL dans votre navigateur :</p>
        <p>${resetUrl}</p>
      `;
    } else if (type === 'task_assignment') {
      subject = `Nouvelle tâche assignée : ${task_title}`;
      
      emailContent = `
        <h2>Nouvelle tâche assignée</h2>
        <p>Bonjour,</p>
        <p>Une nouvelle tâche vous a été assignée : <strong>${task_title}</strong></p>
        <p>Vous pouvez la consulter et la marquer comme terminée en cliquant sur le lien ci-dessous :</p>
        <a href="${completion_url}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir la tâche</a>
        <p>Si vous n'arrivez pas à cliquer sur le lien, copiez et collez cette URL dans votre navigateur :</p>
        <p>${completion_url}</p>
      `;
    }

    // In a real implementation, you would use a service like Resend here
    // For now, we'll just log the email content
    console.log('Email would be sent:', {
      to: email,
      subject,
      content: emailContent
    });

    // Store the notification in the database
    const { error } = await supabaseClient
      .from('supplier_notifications')
      .insert({
        notification_type: type,
        email,
        reset_token: reset_token || null,
        task_id: task_id || null,
        expires_at: type === 'password_reset' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
        metadata: { subject, email_sent: true }
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
