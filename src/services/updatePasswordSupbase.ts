import { supabase } from "@/integrations/supabase/client";


const { data: user, error } = await supabase.auth.admin.updateUserById(
  'Uiid',
  {  password: 'password!' }
)