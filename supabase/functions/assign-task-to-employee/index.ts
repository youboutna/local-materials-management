import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createEmailService } from '../_shared/EmailServiceFactory.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { assigneeId, assigneeName, assigneeEmail, title, description, priority, dueDate, projectId, relatedId, actionType, metadata } = await req.json();

    // Persister la tâche
    const task = {
      assigned_to: assigneeId,
      assignee_name: assigneeName,
      title,
      description,
      priority,
      due_date: dueDate,
      project_id: projectId,
      related_id: relatedId,
      action_type: actionType,
      status: 'assigned',
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdTask, error: taskError } = await supabase
      .from('task_assignments')
      .insert([task])
      .select()
      .single();

    if (taskError) console.error('Task storage error:', taskError);

    // Notification interne
    await supabase
      .from('notifications')
      .insert({
        recipient_id: assigneeId,
        title: `📋 Nouvelle tâche assignée: ${title}`,
        message: `${description}\n\nPriorité: ${priority.toUpperCase()}${dueDate ? `\nÉchéance: ${new Date(dueDate).toLocaleDateString('fr-FR')}` : ''}`,
        type: 'task_assigned',
        related_id: relatedId || projectId,
        metadata: { task_id: createdTask?.id || task.id, priority, due_date: dueDate },
      });

    // Email si fourni
    if (assigneeEmail) {
      const emailService = createEmailService();
      await emailService.sendEmail({
        to: assigneeEmail,
        subject: `Nouvelle tâche assignée: ${title}`,
        html: `
          <h2>Nouvelle tâche</h2>
          <p><strong>${title}</strong></p>
          <p>${description}</p>
          <p>Priorité: ${priority}</p>
          ${dueDate ? `<p>Échéance: ${new Date(dueDate).toLocaleDateString('fr-FR')}</p>` : ''}
          <p>Projet: ${projectId || 'Non spécifié'}</p>
        `,
      });
    }

    return new Response(
      JSON.stringify({ success: true, task: createdTask || task }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});