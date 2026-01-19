import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { TenderService } from '@/application/services/TenderService';
import { toast } from '@/hooks/use-toast';

export interface EstimateItem {
  id?: string;
  material_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  description: string | null;
  item_type: string | null;
}

export interface TenderEstimate {
  id?: string;
  tender_id: string;
  project_id?: string | null;
  estimate_type: string;
  total_materials_cost: number | null;
  total_labor_cost: number | null;
  total_equipment_cost: number | null;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  total_with_tax: number | null;
  overhead_percentage: number | null;
  overhead_amount: number | null;
  profit_margin_percentage: number | null;
  profit_margin_amount: number | null;
  final_total: number | null;
  currency: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const useTenderQuantitativeEstimateHex = (tenderId: string, projectId?: string) => {
  const queryClient = useQueryClient();

  // Fetch estimates
  const { data: estimates = [], isLoading: estimatesLoading, error: estimatesError } = useQuery({
    queryKey: ['tender-estimates', tenderId],
    queryFn: async (): Promise<TenderEstimate[]> => {
      const { data, error } = await supabase
        .from('tender_estimates')
        .select('*')
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenderId,
    retry: 3,
    retryDelay: 1000
  });

  // Fetch estimate items
  const { data: estimateItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['estimate-items', estimates?.[0]?.id],
    queryFn: async (): Promise<EstimateItem[]> => {
      if (!estimates?.[0]?.id) return [];
      
      const { data, error } = await supabase
        .from('tender_estimate_items')
        .select(`
          *,
          material:materials(name, unit)
        `)
        .eq('estimate_id', estimates[0].id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!estimates?.[0]?.id,
    retry: 3,
    retryDelay: 1000
  });

  // Fetch materials
  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: async (): Promise<any[]> => {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, price_per_unit, unit')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    retry: 3,
    retryDelay: 1000
  });

  // Create estimate mutation
  const createEstimateMutation = useMutation({
    mutationFn: async (estimate: Omit<TenderEstimate, 'id'>) => {
      const { data, error } = await supabase
        .from('tender_estimates')
        .insert([estimate])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-estimates', tenderId] });
      toast({
        title: "Succès",
        description: "Devis créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: EstimateItem & { estimate_id: string }) => {
      const { data, error } = await supabase
        .from('tender_estimate_items')
        .insert([item])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', estimates?.[0]?.id] });
      toast({
        title: "Succès",
        description: "Article ajouté avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    estimates,
    estimateItems,
    materials,
    isLoading: estimatesLoading || itemsLoading || materialsLoading,
    error: estimatesError,
    createEstimateMutation,
    addItemMutation,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-estimates', tenderId] });
      queryClient.invalidateQueries({ queryKey: ['estimate-items', estimates?.[0]?.id] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    }
  };
};
