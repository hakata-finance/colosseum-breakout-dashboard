'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'event',
      action: string,
      parameters?: {
        description?: string;
        fatal?: boolean;
        [key: string]: unknown;
      }
    ) => void;
  }
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Handle hydration mismatches more gracefully
    if (error.message?.includes('Hydration') || error.message?.includes('hydration')) {
      console.warn('Hydration mismatch detected, will retry:', error.message);
      return { hasError: true, error };
    }
    
    // Handle extension conflicts
    if (error.message?.includes('ethereum') || error.message?.includes('wallet')) {
      console.warn('Wallet extension conflict detected:', error.message);
      return { hasError: true, error };
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Send to analytics/monitoring service (only for real errors, not hydration)
    if (typeof window !== 'undefined' && window.gtag && !this.isHydrationError(error)) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }

    // Auto-retry for hydration errors (once)
    if (this.isHydrationError(error) && this.state.retryCount === 0) {
      this.retryTimeoutId = window.setTimeout(() => {
        this.handleRetry();
      }, 1000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId);
    }
  }

  private isHydrationError(error: Error): boolean {
    return error.message?.toLowerCase().includes('hydration') || 
           error.message?.includes('185') || // React error 185 is hydration related
           error.message?.includes('did not match');
  }

  private isExtensionError(error: Error): boolean {
    return error.message?.includes('ethereum') || 
           error.message?.includes('wallet') ||
           error.message?.includes('evmAsk') ||
           error.message?.includes('Cannot redefine property') ||
           error.message?.includes('Phantom') ||
           error.message?.includes('Rabby');
  }

  private handleRetry = () => {
    this.setState(prevState => ({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isHydration = this.isHydrationError(this.state.error);
      const isExtension = this.isExtensionError(this.state.error);

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {isHydration ? 'Loading Issue' : isExtension ? 'Wallet Extension Conflict' : 'Something went wrong'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {isHydration ? (
                  <p className="text-sm text-muted-foreground">
                    The page had a loading issue. This sometimes happens and usually resolves by trying again.
                  </p>
                ) : isExtension ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Multiple wallet extensions (Phantom, Rabby, etc.) are conflicting with each other.
                    </p>
                    <div className="text-xs bg-muted p-2 rounded space-y-1">
                      <p className="font-medium">Quick fixes:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Disable one wallet extension temporarily</li>
                        <li>Use an incognito/private window</li>
                        <li>Refresh the page (conflict protection is now active)</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    We&apos;re sorry, but something unexpected happened. This error has been logged and we&apos;ll look into it.
                  </p>
                )}
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-xs bg-muted p-2 rounded">
                    <summary className="cursor-pointer font-medium">Error Details</summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.error.message}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
              </div>
              
              {this.state.retryCount > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Retry attempt: {this.state.retryCount}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
