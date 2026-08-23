
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { T } from '@/components/i18n/T';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle><T k="auto.errorfallback.erreur" fallback="Erreur" /></AlertTitle>
          <AlertDescription>
            <T k="auto.errorfallback.une_erreur_s_est_produite_dans_l_application" fallback="Une erreur s'est produite dans l'application." />
          </AlertDescription>
        </Alert>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2"><T k="auto.errorfallback.details_de_l_erreur" fallback="Détails de l'erreur:" /></h3>
          <div className="bg-muted p-4 rounded text-sm font-mono overflow-auto max-h-40">
            {error.message}
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={resetErrorBoundary}>
            <T k="auto.errorfallback.reessayer" fallback="Réessayer" />
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            <T k="auto.errorfallback.retour_a_l_accueil" fallback="Retour à l'accueil" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
