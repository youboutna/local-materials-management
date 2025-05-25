
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const passwordResetSchema = z.object({
  email: z.string().email("Format d'email invalide"),
});

type PasswordResetValues = z.infer<typeof passwordResetSchema>;

interface PasswordResetFormProps {
  onBack: () => void;
}

const PasswordResetForm = ({ onBack }: PasswordResetFormProps) => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const form = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: PasswordResetValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setEmailSent(true);
      toast({
        title: "Email envoyé",
        description: "Un lien de réinitialisation a été envoyé à votre adresse email.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-center text-adrar-800">
            Email envoyé
          </CardTitle>
          <CardDescription className="text-center">
            Vérifiez votre boîte mail pour le lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-gray-600">
            Si vous ne voyez pas l'email, vérifiez votre dossier spam ou tentez de renvoyer le lien.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEmailSent(false)}
              className="flex-1"
            >
              Renvoyer l'email
            </Button>
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-center text-adrar-800">
              Mot de passe oublié
            </CardTitle>
            <CardDescription className="text-center">
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse email</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                    <FormControl>
                      <Input 
                        placeholder="votre@email.com" 
                        className="pl-10" 
                        {...field} 
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-terracotta-500 hover:bg-terracotta-600 text-white"
                disabled={loading}
              >
                {loading ? 'Envoi...' : 'Envoyer le lien'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};

export default PasswordResetForm;
