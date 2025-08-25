import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TaskAssignmentRequest {
  assigneeId: string;
  assigneeName: string;
  assigneeEmail?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  projectId?: string;
  relatedId?: string;
  actionType: string;
  metadata?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      assigneeId, 
      assigneeName, 
      assigneeEmail, 
      title, 
      description, 
      priority, 
      dueDate, 
      projectId, 
      relatedId, 
      actionType, 
      metadata 
    }: TaskAssignmentRequest = await req.json();

    console.log("Assigning task to employee:", { assigneeId, assigneeName, title, priority });

    // Create task assignment record
    const taskAssignment = {
      id: `task-${Date.now()}`,
      assignee_id: assigneeId,
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
      updated_at: new Date().toISOString()
    };

    // Store the task assignment
    const { data: createdTask, error: taskError } = await supabase
      .from('task_assignments')
      .insert([taskAssignment])
      .select()
      .single();

    if (taskError) {
      console.error("Error creating task assignment:", taskError);
      // Continue with notification even if task storage fails
    }

    // Create notification for the assignee
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert([{
        recipient_id: assigneeId,
        title: `📋 Nouvelle tâche assignée: ${title}`,
        message: `${description}\n\nPriorité: ${priority.toUpperCase()}${dueDate ? `\nÉchéance: ${new Date(dueDate).toLocaleDateString('fr-FR')}` : ''}`,
        type: 'task_assigned',
        related_id: relatedId || projectId,
        metadata: {
          ...metadata,
          task_id: taskAssignment.id,
          priority,
          due_date: dueDate,
          action_type: actionType
        }
      }])
      .select()
      .single();

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    // If email is provided, also send email notification
    if (assigneeEmail) {
      try {
        const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            to: assigneeEmail,
            subject: `Nouvelle tâche assignée: ${title}`,
            message: description,
            priority,
            actionType,
            metadata: {
              ...metadata,
              task_id: taskAssignment.id,
              due_date: dueDate
            }
          })
        });

        if (!emailResponse.ok) {
          console.error("Failed to send email notification");
        } else {
          console.log("Email notification sent successfully");
        }
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
      }
    }

    console.log("Task assigned successfully:", taskAssignment);

    return new Response(JSON.stringify({
      success: true,
      task: createdTask || taskAssignment,
      notification: notification,
      message: "Task assigned successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in assign-task-to-employee function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);