import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Mail, Plus, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AdminEmailsSettings = () => {
  const [newEmail, setNewEmail] = useState('');
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings', 'admin_notification_emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'admin_notification_emails')
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateEmailsMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      const { data, error } = await supabase
        .from('system_settings')
        .update({ 
          configuration: { emails },
          updated_at: new Date().toISOString()
        })
        .eq('key', 'admin_notification_emails')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'admin_notification_emails'] });
      toast({
        title: "Paramètres mis à jour",
        description: "Les emails administrateurs ont été mis à jour avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour les emails: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const currentEmails = ((settings?.configuration as { emails?: string[] })?.emails) || [];

  const handleAddEmail = () => {
    const trimmedEmail = newEmail.trim();
    
    if (!trimmedEmail) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir une adresse email.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir une adresse email valide.",
        variant: "destructive",
      });
      return;
    }

    if (currentEmails.includes(trimmedEmail)) {
      toast({
        title: "Email déjà présent",
        description: "Cette adresse email existe déjà dans la liste.",
        variant: "destructive",
      });
      return;
    }

    updateEmailsMutation.mutate([...currentEmails, trimmedEmail]);
    setNewEmail('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    updateEmailsMutation.mutate(currentEmails.filter(email => email !== emailToRemove));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Emails de Notification des Administrateurs
        </CardTitle>
        <CardDescription>
          Configurez les adresses email qui recevront les notifications de nouvelles soumissions d'appels d'offres
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="admin@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
          />
          <Button
            onClick={handleAddEmail}
            disabled={updateEmailsMutation.isPending}
          >
            {updateEmailsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </>
            )}
          </Button>
        </div>

        {currentEmails.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {currentEmails.length} email{currentEmails.length > 1 ? 's' : ''} configuré{currentEmails.length > 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {currentEmails.map((email) => (
                <Badge
                  key={email}
                  variant="secondary"
                  className="px-3 py-2 flex items-center gap-2"
                >
                  <Mail className="h-3 w-3" />
                  {email}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveEmail(email)}
                    disabled={updateEmailsMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun email configuré. Les notifications ne seront pas envoyées aux administrateurs.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
