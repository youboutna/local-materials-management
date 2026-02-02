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
  metadata?: Record<string, unknown>;
}

interface SMSResponse {
  sid: string;
  to: string;
  body: string;
  status: 'queued' | 'sent' | 'failed';
  date_created: string;
  price: number | null;
  uri: string;
}

interface SMSNotificationResponse {
  success: boolean;
  sms: SMSResponse;
  message: string;
}

const handler = async (req: Request): Promise<Response<SMSNotificationResponse>> => {
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
    const smsResponse: SMSResponse = {
      sid: `SMS${Date.now()}`,
      to,
      body: smsContent,
      status: "queued",
      date_created: new Date().toISOString(),
      price: null,
      uri: `/SMS/Messages/SMS${Date.now()}`
    };

    console.log("SMS simulation completed:", smsResponse);

    const response: SMSNotificationResponse = {
      success: true,
      sms: smsResponse,
      message: "SMS notification queued successfully"
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
    console.error("Error in send-sms-notification function:", error);
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