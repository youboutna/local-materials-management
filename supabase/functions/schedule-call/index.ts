import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";

interface ScheduleCallRequest {
  recipientId: string;
  recipientPhone: string;
  subject: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  scheduledFor?: string;
  actionType: string;
  metadata?: Record<string, unknown>;
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await authorizeRequest(request);
    if ("response" in auth) return auth.response;
    const body = await request.json() as ScheduleCallRequest;
    const canScheduleForOthers = auth.roles.some((role) => ["admin", "director", "manager"].includes(role));
    if (!body.recipientId || (!canScheduleForOthers && body.recipientId !== auth.user.id)) {
      return jsonResponse({ error: "You may only schedule calls for yourself" }, 403);
    }
    if (
      !body.recipientPhone?.trim() ||
      !body.subject?.trim() ||
      !body.message?.trim() ||
      !body.actionType?.trim() ||
      !["low", "medium", "high", "urgent"].includes(body.priority)
    ) {
      return jsonResponse({ error: "Valid recipientPhone, subject, message, priority, and actionType are required" }, 400);
    }
    const scheduledFor = body.scheduledFor
      ? new Date(body.scheduledFor)
      : new Date(Date.now() + 30 * 60 * 1000);
    if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() < Date.now()) {
      return jsonResponse({ error: "scheduledFor must be a valid future date" }, 400);
    }

    const callTask = {
      id: `call-${crypto.randomUUID()}`,
      recipient_id: body.recipientId,
      recipient_phone: body.recipientPhone,
      subject: body.subject,
      message: body.message,
      priority: body.priority,
      scheduled_for: scheduledFor.toISOString(),
      action_type: body.actionType,
      status: "scheduled",
      metadata: body.metadata ?? {},
    };
    const { data: scheduledCall, error } = await auth.admin
      .schema("btp")
      .from("scheduled_calls")
      .insert(callTask)
      .select()
      .single();
    if (error) throw error;

    const { error: notificationError } = await auth.admin.from("notifications").insert({
      recipient_id: body.recipientId,
      title: `Appel programmé: ${body.subject}`,
      message: `Un appel est programmé concernant: ${body.message}. Vous serez contacté au ${body.recipientPhone}`,
      type: "task_assigned",
      metadata: {
        ...body.metadata,
        call_scheduled: true,
        phone_number: body.recipientPhone,
        scheduled_for: callTask.scheduled_for,
      },
    });
    if (notificationError) throw notificationError;

    return jsonResponse({ success: true, scheduledCall, message: "Call scheduled successfully" });
  } catch (error) {
    console.error("Error in schedule-call function:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
