-- Create escalation thresholds configuration table
CREATE TABLE public.escalation_thresholds (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    threshold_type TEXT NOT NULL, -- 'project_delay', 'insurance_expiry', 'payment_tolerance', etc.
    threshold_name TEXT NOT NULL, -- 'warning', 'bank_notification', 'guarantee_trigger', 'legal_escalation'
    threshold_value NUMERIC NOT NULL, -- percentage or days
    threshold_unit TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'days', 'amount'
    severity_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    escalation_level INTEGER NOT NULL DEFAULT 1, -- 1-4 escalation levels
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    UNIQUE(threshold_type, threshold_name)
);

-- Enable RLS
ALTER TABLE public.escalation_thresholds ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage escalation thresholds"
ON public.escalation_thresholds
FOR ALL
USING (is_current_user_admin());

CREATE POLICY "Users can view escalation thresholds"
ON public.escalation_thresholds
FOR SELECT
USING (true);

-- Insert default project delay thresholds
INSERT INTO public.escalation_thresholds (threshold_type, threshold_name, threshold_value, threshold_unit, severity_level, escalation_level, description) VALUES
('project_delay', 'warning', 10, 'percentage', 'medium', 1, 'Alerte Retard - Notification initiale'),
('project_delay', 'bank_notification', 20, 'percentage', 'high', 2, 'Notification Bancaire - Avis aux institutions financières'),
('project_delay', 'guarantee_trigger', 30, 'percentage', 'high', 3, 'Déclenchement Garantie - Activation des garanties bancaires'),
('project_delay', 'legal_escalation', 40, 'percentage', 'critical', 4, 'Escalade Juridique - Intervention de l''équipe juridique');

-- Insert default insurance expiry thresholds
INSERT INTO public.escalation_thresholds (threshold_type, threshold_name, threshold_value, threshold_unit, severity_level, escalation_level, description) VALUES
('insurance_expiry', 'early_warning', 30, 'days', 'low', 1, 'Pré-alerte expiration assurance'),
('insurance_expiry', 'warning', 15, 'days', 'medium', 1, 'Alerte expiration assurance'),
('insurance_expiry', 'urgent', 7, 'days', 'high', 2, 'Expiration imminente assurance'),
('insurance_expiry', 'critical', 0, 'days', 'critical', 3, 'Assurance expirée');

-- Insert default payment validation thresholds
INSERT INTO public.escalation_thresholds (threshold_type, threshold_name, threshold_value, threshold_unit, severity_level, escalation_level, description) VALUES
('payment_validation', 'tolerance', 10, 'percentage', 'medium', 1, 'Tolérance de paiement au-dessus du progrès'),
('payment_validation', 'initial_payment_max', 30, 'percentage', 'medium', 1, 'Paiement initial maximum autorisé');

-- Insert default inspection thresholds
INSERT INTO public.escalation_thresholds (threshold_type, threshold_name, threshold_value, threshold_unit, severity_level, escalation_level, description) VALUES
('inspection_overdue', 'warning', 3, 'days', 'medium', 1, 'Inspection en retard - avertissement'),
('inspection_overdue', 'escalation', 7, 'days', 'high', 2, 'Inspection en retard - escalade'),
('inspection_overdue', 'critical', 14, 'days', 'critical', 3, 'Inspection très en retard');

-- Insert material and budget thresholds
INSERT INTO public.escalation_thresholds (threshold_type, threshold_name, threshold_value, threshold_unit, severity_level, escalation_level, description) VALUES
('material_wastage', 'standard', 10, 'percentage', 'low', 1, 'Facteur de gaspillage matériau standard'),
('budget_allocation', 'phase_default', 10, 'percentage', 'low', 1, 'Allocation budgétaire par défaut pour phase'),
('budget_allocation', 'procurement_default', 20, 'percentage', 'low', 1, 'Allocation budgétaire par défaut pour approvisionnement');

-- Add trigger for updated_at
CREATE TRIGGER update_escalation_thresholds_updated_at
BEFORE UPDATE ON public.escalation_thresholds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get thresholds by type
CREATE OR REPLACE FUNCTION public.get_escalation_thresholds(threshold_type_param text)
RETURNS TABLE(
    threshold_name text,
    threshold_value numeric,
    threshold_unit text,
    severity_level text,
    escalation_level integer,
    description text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        threshold_name,
        threshold_value,
        threshold_unit,
        severity_level,
        escalation_level,
        description
    FROM public.escalation_thresholds
    WHERE threshold_type = threshold_type_param
    AND is_active = true
    ORDER BY threshold_value ASC;
$$;