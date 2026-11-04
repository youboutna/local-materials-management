import { btpClient } from '@/integrations/supabase/schema-clients';
import { supabase } from '@/integrations/supabase/client';
import type { IDataClientProvider } from '@/domain/repositories/IDataClientProvider';

export class SupabaseDataClientProvider implements IDataClientProvider {
  btp(): any {
    return btpClient;
  }
  public(): any {
    return supabase;
  }
}
