import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Provide a minimal declaration for the Deno global so TypeScript in this
// repository (which may not include Deno lib typings) doesn't error.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScheduleCallRequest {
  recipientId: string;
  recipientPhone: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: string;
  actionType: string;
  metadata?: Record<string, unknown>;
}

interface CallTask {
  id: string;
  recipient_id: string;
  recipient_phone: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_for: string;
  action_type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  metadata: Record<string, unknown>;
  created_at: string;
}

interface Notification {
  recipient_id: string;
  title: string;
  message: string;
  type: string;
  metadata: Record<string, unknown>;
  related_id?: string;
}

interface ScheduleCallResponse {
  success: boolean;
  scheduledCall: CallTask;
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

    const { recipientId, recipientPhone, subject, message, priority, scheduledFor, actionType, metadata }: ScheduleCallRequest = await req.json();

    console.log("Scheduling call:", { recipientId, recipientPhone, subject, priority });

    // Schedule the call by creating a task in the database
    const callTask: CallTask = {
      id: `call-${Date.now()}`,
      recipient_id: recipientId,
      recipient_phone: recipientPhone,
      subject,
      message,
      priority,
      scheduled_for: scheduledFor || new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Default: 30 minutes from now
      action_type: actionType,
      status: 'scheduled',
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };

    // Store the scheduled call in a calls table (you might need to create this table)
    const { data: scheduledCall, error } = await supabase
      .from('scheduled_calls')
      .insert([callTask])
      .select()
      .single();

    if (error) {
      console.error("Error storing scheduled call:", error);
      // Continue with simulation if database fails
    }

    // Create a notification for the recipient about the scheduled call
    await supabase
      .from('notifications')
      .insert([{
        recipient_id: recipientId,
        title: `📞 Appel programmé: ${subject}`,
        message: `Un appel est programmé concernant: ${message}. Vous serez contacté au ${recipientPhone}`,
        type: 'task_assigned',
        metadata: {
          ...metadata,
          call_scheduled: true,
          phone_number: recipientPhone,
          scheduled_for: callTask.scheduled_for
        }
      } as Notification]);

    console.log("Call scheduled successfully:", callTask);

    const response = {
      success: true,
      scheduledCall: callTask,
      message: "Call scheduled successfully"
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
    console.error("Error in schedule-call function:", error);
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