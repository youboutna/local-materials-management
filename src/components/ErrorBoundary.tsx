
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

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
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>
                Une erreur s'est produite dans l'application.
              </AlertDescription>
            </Alert>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Détails de l'erreur:</h3>
              <div className="bg-gray-100 p-4 rounded text-sm font-mono overflow-auto max-h-40">
                {this.state.error?.message || "Erreur inconnue"}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
                Réessayer
              </Button>
              <Button onClick={this.handleReload}>
                Retour à l'accueil
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
