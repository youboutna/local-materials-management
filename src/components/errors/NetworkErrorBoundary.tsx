import React, { Component, ReactNode } from 'react';
import ErrorPage from './ErrorPage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorType: 'network' | '500' | null;
  retryCount: number;
}

class NetworkErrorBoundary extends Component<Props, State> {
  private retryTimer: NodeJS.Timeout | null = null;
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorType: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Détecter les erreurs de réseau
    const isNetworkError = 
      error.message.includes('fetch') ||
      error.message.includes('Network') ||
      error.message.includes('connection') ||
      error.name === 'NetworkError';

    return {
      hasError: true,
      errorType: isNetworkError ? 'network' : '500'
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('NetworkErrorBoundary caught an error:', error, errorInfo);
    
    // Log les erreurs réseau spécifiquement
    if (this.state.errorType === 'network') {
      console.error('Network error detected:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        retryCount: this.state.retryCount
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1
    }));

    // Retry automatique avec délai croissant
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);
    
    this.retryTimer = setTimeout(() => {
      this.setState({
        hasError: false,
        errorType: null
      });
    }, retryDelay);
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Afficher une page d'erreur appropriée
      return (
        <ErrorPage
          type={this.state.errorType || 'network'}
          onRetry={this.handleRetry}
          showContactSupport={this.state.retryCount > 2}
        />
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;