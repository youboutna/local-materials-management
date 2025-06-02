
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

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
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Une erreur s'est produite dans l'application.
          </AlertDescription>
        </Alert>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Détails de l'erreur:</h3>
          <div className="bg-gray-100 p-4 rounded text-sm font-mono overflow-auto max-h-40">
            {error.message}
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={resetErrorBoundary}>
            Réessayer
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
