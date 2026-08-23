
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { T } from '@/components/i18n/T';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="flex items-center justify-center h-screen">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle><T k="auto.errorboundary.erreur" fallback="Erreur" /></AlertTitle>
              <AlertDescription>
                <T k="auto.errorboundary.une_erreur_s_est_produite_dans_l_application" fallback="Une erreur s'est produite dans l'application." />
              </AlertDescription>
            </Alert>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2"><T k="auto.errorboundary.details_de_l_erreur" fallback="Détails de l'erreur:" /></h3>
              <div className="bg-muted p-4 rounded text-sm font-mono overflow-auto max-h-40">
                {this.state.error?.message || "Erreur inconnue"}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
                <T k="auto.errorboundary.reessayer" fallback="Réessayer" />
              </Button>
              <Button onClick={this.handleReload}>
                <T k="auto.errorboundary.retour_a_l_accueil" fallback="Retour à l'accueil" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
