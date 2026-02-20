'use client'

import React from 'react'
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  errorId: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error: Error
    errorInfo: React.ErrorInfo
    resetError: () => void
  }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      errorId: this.generateErrorId(),
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9),
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught')
      console.error('Error:', error)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // Report to error tracking service (e.g., Sentry, LogRocket, etc.)
      const errorReport = {
        id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: null, // Add user ID if available
        sessionId: null, // Add session ID if available
        buildVersion: process.env.NEXT_PUBLIC_APP_VERSION,
        environment: process.env.NODE_ENV,
      }

      // Send to monitoring endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      }).catch(console.error)

      console.log('Error reported with ID:', this.state.errorId)
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private resetError = () => {
    this.retryCount++
    
    if (this.retryCount <= this.maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: this.generateErrorId(),
      })
    } else {
      // Too many retries, reload the page
      window.location.reload()
    }
  }

  private reloadPage = () => {
    window.location.reload()
  }

  private goHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error!}
            errorInfo={this.state.errorInfo!}
            resetError={this.resetError}
          />
        )
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          retryCount={this.retryCount}
          maxRetries={this.maxRetries}
          onRetry={this.resetError}
          onReload={this.reloadPage}
          onGoHome={this.goHome}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
interface ErrorFallbackProps {
  error?: Error
  errorInfo?: React.ErrorInfo
  errorId: string
  retryCount: number
  maxRetries: number
  onRetry: () => void
  onReload: () => void
  onGoHome: () => void
}

function ErrorFallback({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  onRetry,
  onReload,
  onGoHome,
}: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const copyErrorDetails = async () => {
    try {
      const errorDetails = {
        id: errorId,
        message: error?.message,
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }

      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  const canRetry = retryCount < maxRetries

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-destructive">
            Something went wrong
          </CardTitle>
          
          <CardDescription className="text-base">
            We encountered an unexpected error. Our team has been notified and is working on a fix.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error ID and Status */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="font-mono">
              ID: {errorId}
            </Badge>
            
            {error?.name && (
              <Badge variant="destructive">
                {error.name}
              </Badge>
            )}
            
            {retryCount > 0 && (
              <Badge variant="secondary">
                Retry {retryCount}/{maxRetries}
              </Badge>
            )}
          </div>

          {/* Error Message */}
          {error?.message && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive font-medium">
                {error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canRetry && (
              <Button onClick={onRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            
            <Button onClick={onReload} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            
            <Button onClick={onGoHome} variant="ghost" className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>

          {/* Error Details Toggle */}
          <div className="border-t pt-6">
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="gap-2 text-muted-foreground"
              >
                <Bug className="h-4 w-4" />
                {showDetails ? 'Hide' : 'Show'} Error Details
              </Button>
            </div>

            {showDetails && (
              <div className="mt-4 space-y-4">
                {/* Copy Button */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyErrorDetails}
                    disabled={copied}
                  >
                    {copied ? 'Copied!' : 'Copy Error Details'}
                  </Button>
                </div>

                {/* Stack Trace */}
                {error?.stack && (
                  <div className="rounded-lg border bg-muted p-4">
                    <h4 className="font-medium mb-2 text-sm">Stack Trace:</h4>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}

                {/* Component Stack */}
                {errorInfo?.componentStack && (
                  <div className="rounded-lg border bg-muted p-4">
                    <h4 className="font-medium mb-2 text-sm">Component Stack:</h4>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                {/* Environment Info */}
                <div className="rounded-lg border bg-muted p-4">
                  <h4 className="font-medium mb-2 text-sm">Environment:</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>URL: {window.location.href}</div>
                    <div>Timestamp: {new Date().toISOString()}</div>
                    <div>User Agent: {navigator.userAgent}</div>
                    {process.env.NEXT_PUBLIC_APP_VERSION && (
                      <div>Version: {process.env.NEXT_PUBLIC_APP_VERSION}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            If this problem persists, please contact support with the error ID above.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for programmatic error reporting
export function useErrorReporting() {
  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'production') {
      // Report to error tracking service
      console.error('Reported error:', error, context)
    } else {
      console.error('Error:', error, context)
    }
  }, [])

  return { reportError }
}