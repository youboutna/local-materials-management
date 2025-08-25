import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SMSNotificationRequest {
  to: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
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
    const { to, message, priority, actionType, metadata }: SMSNotificationRequest = await req.json();

    console.log("Sending SMS notification:", { to, actionType, priority });

    // Here you would integrate with an SMS service like Twilio, AWS SNS, etc.
    // For now, we'll simulate the SMS sending
    
    const smsContent = `[${priority.toUpperCase()}] ${message}`;
    
    // Simulate SMS API call
    const smsResponse = {
      sid: `SMS${Date.now()}`,
      to,
      body: smsContent,
      status: "queued",
      date_created: new Date().toISOString(),
      price: null,
      uri: `/SMS/Messages/SMS${Date.now()}`
    };

    console.log("SMS simulation completed:", smsResponse);

    return new Response(JSON.stringify({
      success: true,
      sms: smsResponse,
      message: "SMS notification queued successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-sms-notification function:", error);
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