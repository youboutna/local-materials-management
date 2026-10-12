import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createEmailService } from "../_shared/EmailServiceFactory.ts";
import { escapeHtml } from "../_shared/html.ts";
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await authorizeRequest(request);
    if ("response" in auth) return auth.response;
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse({ error: "A valid request body is required" }, 400);
    }
    const payload = body as Record<string, unknown>;
    const {
      assigneeId, title, description, priority, dueDate, projectId, relatedId, actionType, metadata,
    } = payload;
    const canAssignOthers = auth.roles.some((role) => ["admin", "director", "manager"].includes(role));
    if (typeof assigneeId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(assigneeId)) {
      return jsonResponse({ error: "A valid assigneeId is required" }, 400);
    }
    if (!canAssignOthers && assigneeId !== auth.user.id) {
      return jsonResponse({ error: "You may only assign tasks to yourself" }, 403);
    }
    if (
      typeof title !== "string" || !title.trim() ||
      typeof description !== "string" || !description.trim() ||
      typeof priority !== "string" || !["low", "medium", "high", "urgent"].includes(priority) ||
      typeof actionType !== "string" || !actionType.trim()
    ) {
      return jsonResponse({ error: "Valid title, description, priority, and actionType are required" }, 400);
    }
    if (dueDate !== undefined && dueDate !== null && (typeof dueDate !== "string" || Number.isNaN(Date.parse(dueDate)))) {
      return jsonResponse({ error: "dueDate must be a valid date" }, 400);
    }

    const { data: assigneeResult, error: assigneeError } = await auth.admin.auth.admin.getUserById(assigneeId);
    if (assigneeError) throw assigneeError;
    if (!assigneeResult.user) return jsonResponse({ error: "Assignee not found" }, 404);
    const assigneeEmail = assigneeResult.user.email;
    const userName = assigneeResult.user.user_metadata?.full_name;
    const assigneeName = typeof userName === "string" && userName.trim()
      ? userName.trim()
      : assigneeEmail ?? "Collaborateur";

    const task = {
      assigned_to: [assigneeId],
      assignee_name: assigneeName,
      title,
      description,
      priority,
      due_date: dueDate,
      project_id: projectId,
      related_id: relatedId,
      action_type: actionType,
      status: "assigned",
      metadata: metadata ?? {},
    };
    const { data: createdTask, error: taskError } = await auth.admin
      .schema("btp")
      .from("task_assignments")
      .insert(task)
      .select()
      .single();
    if (taskError) throw taskError;

    const { error: notificationError } = await auth.admin.from("notifications").insert({
      recipient_id: assigneeId,
      title: `Nouvelle tâche assignée: ${title}`,
      message: `${description}\n\nPriorité: ${priority.toUpperCase()}${dueDate ? `\nÉchéance: ${new Date(dueDate).toLocaleDateString("fr-FR")}` : ""}`,
      type: "task_assigned",
      related_id: relatedId || projectId,
      metadata: { task_id: createdTask.id, priority, due_date: dueDate },
    });
    if (notificationError) {
      console.error("Task was created but its in-app notification could not be recorded:", notificationError);
    }

    let emailSent = false;
    if (assigneeEmail) {
      try {
        const emailResult = await createEmailService().sendEmail({
          to: assigneeEmail,
          subject: `Nouvelle tâche assignée: ${title}`,
          html: `<h2>Nouvelle tâche</h2><p><strong>${escapeHtml(title)}</strong></p><p>${escapeHtml(description)}</p><p>Priorité: ${escapeHtml(priority)}</p>${dueDate ? `<p>Échéance: ${escapeHtml(new Date(dueDate).toLocaleDateString("fr-FR"))}</p>` : ""}<p>Projet: ${escapeHtml(typeof projectId === "string" ? projectId : "Non spécifié")}</p>`,
        });
        emailSent = emailResult.success;
        if (!emailSent) console.error("Task was created but the email provider reported unsuccessful delivery");
      } catch (emailError) {
        console.error("Task was created but its email notification failed:", emailError);
      }
    }

    return jsonResponse({
      success: true,
      task: createdTask,
      notificationRecorded: !notificationError,
      emailSent,
    });
  } catch (error) {
    console.error("Error in assign-task-to-employee:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
