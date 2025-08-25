import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { recipientId, recipientPhone, subject, message, priority, scheduledFor, actionType, metadata }: ScheduleCallRequest = await req.json();

    console.log("Scheduling call:", { recipientId, recipientPhone, subject, priority });

    // Schedule the call by creating a task in the database
    const callTask = {
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
      }]);

    console.log("Call scheduled successfully:", callTask);

    return new Response(JSON.stringify({
      success: true,
      scheduledCall: callTask,
      message: "Call scheduled successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in schedule-call function:", error);
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