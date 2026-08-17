import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const { oldEmail, newEmail } = await req.json();
    if (!oldEmail || !newEmail) {
      return new Response(JSON.stringify({ error: "Missing oldEmail or newEmail" }), { status: 400 });
    }

    // Trouver l'utilisateur par son ancien email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    
    const user = users.users.find((u) => u.email === oldEmail);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    // Mettre à jour l'email (Supabase enverra automatiquement un nouveau lien de confirmation)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email: newEmail }
    );
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Update email error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500 }
    );
  }
});