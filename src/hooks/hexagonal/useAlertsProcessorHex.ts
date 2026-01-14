/**
 * Hexagonal hook for Alerts Processor
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessorResult {
  processed: number;
  alertsGenerated: number;
}

export function useRunAlertsProcessorHex() {
  return useMutation({
    mutationFn: async (): Promise<ProcessorResult> => {
      const { data, error } = await supabase.functions.invoke('project-alerts-processor');
      
      if (error) throw error;
      return data as ProcessorResult;
    }
  });
}
