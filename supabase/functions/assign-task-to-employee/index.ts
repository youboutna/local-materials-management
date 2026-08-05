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
  projectId?: string | null;
  relatedId?: string | null;
  actionType: string;
  metadata?: Record<string, unknown>;
}

interface TaskAssignment {
  id: string;
  assigned_to: string;
  assignee_name: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  project_id?: string | null;
  related_id?: string | null;
  action_type: string;
  status: 'assigned' | 'completed' | 'cancelled';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface NotificationPayload {
  recipient_id: string;
  title: string;
  message: string;
  type: string;
  related_id?: string | null;
  metadata: Record<string, unknown>;
}

interface EmailPayload {
  to: string;
  subject: string;
  message: string;
  priority: string;
  actionType: string;
  metadata: Record<string, unknown>;
}

interface TaskAssignmentResponse {
  success: boolean;
  task: TaskAssignment;
  notification?: NotificationPayload | null;
  message: string;
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
    const taskAssignment: TaskAssignment = {
      id: `task-${Date.now()}`,
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
    const notificationPayload: NotificationPayload = {
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
    };

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert([notificationPayload])
      .select()
      .single();

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    // If email is provided, also send email notification
    if (assigneeEmail) {
      try {
        const emailPayload: EmailPayload = {
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
        };

        const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify(emailPayload)
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

    const response: TaskAssignmentResponse = {
      success: true,
      task: createdTask || taskAssignment,
      notification: notification,
      message: "Task assigned successfully"
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in assign-task-to-employee function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);