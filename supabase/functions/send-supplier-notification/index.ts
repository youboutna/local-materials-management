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

interface NotificationResponse {
  success: boolean;
  message: string;
}

interface NotificationMetadata {
  subject: string;
  email_sent: boolean;
}

interface EmailContent {
  subject: string;
  html: string;
  type: 'password_reset' | 'task_assignment';
  metadata: {
    supplierName?: string;
    taskId?: string;
    taskTitle?: string;
    completionUrl?: string;
  };
}

const generateEmailContent = (request: NotificationRequest): EmailContent => {
  if (request.type === 'password_reset') {
    const resetUrl = `${Deno.env.get('SITE_URL')}/supplier/reset-password?token=${request.reset_token}`;
    return {
      type: 'password_reset',
      subject: 'Réinitialisation de votre mot de passe - Portail Fournisseur',
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour ${request.supplier_name || 'Fournisseur'},</p>
        <p>Un compte a été créé pour vous sur notre portail fournisseur. Veuillez cliquer sur le lien ci-dessous pour définir votre mot de passe :</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Définir mon mot de passe</a>
        <p>Ce lien expire dans 24 heures.</p>
        <p>Si vous n'arrivez pas à cliquer sur le lien, copiez et collez cette URL dans votre navigateur :</p>
        <p>${resetUrl}</p>
      `,
      metadata: {
        supplierName: request.supplier_name
      }
    };
  } else {
    return {
      type: 'task_assignment',
      subject: `Nouvelle tâche assignée : ${request.task_title}`,
      html: `
        <h2>Nouvelle tâche assignée</h2>
        <p>Bonjour,</p>
        <p>Une nouvelle tâche vous a été assignée : <strong>${request.task_title}</strong></p>
        <p>Vous pouvez la consulter et la marquer comme terminée en cliquant sur le lien ci-dessous :</p>
        <a href="${request.completion_url}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir la tâche</a>
        <p>Si vous n'arrivez pas à cliquer sur le lien, copiez et collez cette URL dans votre navigateur :</p>
        <p>${request.completion_url}</p>
      `,
      metadata: {
        taskId: request.task_id,
        taskTitle: request.task_title,
        completionUrl: request.completion_url
      }
    };
  }
};

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

    const emailContent = generateEmailContent({ type, email, supplier_name, reset_token, task_id, task_title, completion_url });

    // In a real implementation, you would use a service like Resend here
    // For now, we'll just log the email content
    console.log('Email would be sent:', {
      to: email,
      subject: emailContent.subject,
      content: emailContent.html
    });

    // Store the notification in the database
    const metadata: NotificationMetadata = {
      subject: emailContent.subject,
      email_sent: true
    };

    const { error } = await supabaseClient
      .from('supplier_notifications')
      .insert({
        notification_type: type,
        email,
        reset_token: reset_token || null,
        task_id: task_id || null,
        expires_at: type === 'password_reset' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
        metadata
      });

    if (error) throw error;

    const response: NotificationResponse = {
      success: true,
      message: 'Notification sent successfully'
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
