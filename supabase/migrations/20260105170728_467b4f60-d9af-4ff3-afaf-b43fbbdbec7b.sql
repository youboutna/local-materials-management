-- Supprimer l'ancienne politique INSERT
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Créer une nouvelle politique INSERT pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can create notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (true);