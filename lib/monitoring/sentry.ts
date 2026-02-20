/**
 * Centralized Sentry configuration and utilities
 * Single source of truth for error monitoring setup
 */

// Conditional import to avoid OpenTelemetry warnings when Sentry is disabled
let Sentry: any = null;
try {
  Sentry = require('@sentry/nextjs');
} catch (error) {
  // Sentry not available, use no-op implementation
  console.log('Sentry disabled or not available');
}

// Shared configuration for all environments
const sharedConfig: any = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DAO_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  debug: process.env.NODE_ENV === 'development',
  
  // Sampling configuration
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Error filtering
  beforeSend(event: any, hint: any) {
    // Filter out development noise
    if (process.env.NODE_ENV === 'development') {
      // Skip webpack HMR errors
      if (event.exception?.values?.[0]?.value?.includes('ChunkLoadError')) {
        return null;
      }
      // Skip CORS errors in development
      if (event.exception?.values?.[0]?.value?.includes('CORS')) {
        return null;
      }
    }
    
    // Add context for production errors
    if (event.exception) {
      event.tags = {
        ...event.tags,
        component: 'cryptogift-dao',
        deployment: process.env.VERCEL_ENV || 'local',
      };
    }
    
    return event;
  },
  
  // Transaction filtering
  beforeSendTransaction(event: any) {
    // Skip health check transactions
    if (event.transaction === 'GET /api/health') {
      return null;
    }
    return event;
  },
};

// Client-specific configuration
const clientConfig: any = {
  ...sharedConfig,
  
  // Replay settings for user sessions
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,
  
  integrations: [
    // Integrations are auto-installed in @sentry/nextjs v10+
    // Manual integration setup is no longer needed
  ],
};

// Server-specific configuration
const serverConfig: any = {
  ...sharedConfig,
  
  // Server performance monitoring
  integrations: [
    // Server integrations are auto-installed in @sentry/nextjs v10+
  ],
  
  // Enhanced error context
  initialScope: {
    tags: {
      runtime: 'nodejs',
    },
  },
};

// Initialize Sentry based on runtime
export function initializeSentry() {
  if (!Sentry) {
    console.log('[Sentry] Disabled - skipping initialization');
    return;
  }
  
  if (typeof window === 'undefined') {
    // Server-side initialization
    Sentry.init(serverConfig);
    console.log('[Sentry] Server initialized');
  } else {
    // Client-side initialization
    Sentry.init(clientConfig);
    console.log('[Sentry] Client initialized');
  }
}

// Utility functions for error reporting
export const sentryUtils = {
  // Capture error with context
  captureError: (error: Error, context?: Record<string, any>) => {
    if (!Sentry) {
      console.error('[Sentry] Error capture skipped - Sentry disabled:', error, context);
      return;
    }
    Sentry.withScope((scope: any) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      Sentry.captureException(error);
    });
  },
  
  // Capture message with level
  captureMessage: (message: string, level: any = 'info', context?: Record<string, any>) => {
    if (!Sentry) {
      console.log('[Sentry] Message capture skipped - Sentry disabled:', message, level, context);
      return;
    }
    Sentry.withScope((scope: any) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      Sentry.captureMessage(message, level);
    });
  },
  
  // Set user context
  setUser: (user: any) => {
    if (!Sentry) {
      console.log('[Sentry] Set user skipped - Sentry disabled:', user);
      return;
    }
    Sentry.setUser(user);
  },
  
  // Add breadcrumb
  addBreadcrumb: (breadcrumb: any) => {
    if (!Sentry) {
      console.log('[Sentry] Breadcrumb skipped - Sentry disabled:', breadcrumb);
      return;
    }
    Sentry.addBreadcrumb(breadcrumb);
  },
  
  // Create span for performance monitoring (v10+ API)
  startSpan: (options: any, callback?: any) => {
    if (!Sentry) {
      console.log('[Sentry] Span skipped - Sentry disabled, executing directly');
      return callback ? callback() : Promise.resolve();
    }
    return Sentry.startSpan(options, callback);
  },
};

// Performance monitoring helpers
export const performance = {
  // Measure function execution time
  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    if (!Sentry) {
      console.log(`[Sentry] Performance measure skipped - executing ${name} directly`);
      try {
        return await fn();
      } catch (error) {
        sentryUtils.captureError(error as Error, { function: name });
        throw error;
      }
    }
    
    return await Sentry.startSpan({ name, op: 'function' }, async () => {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        sentryUtils.captureError(error as Error, { function: name });
        throw error;
      }
    });
  },
  
  // Measure synchronous function execution
  measure: <T>(name: string, fn: () => T): T => {
    if (!Sentry) {
      console.log(`[Sentry] Performance measure skipped - executing ${name} directly`);
      try {
        return fn();
      } catch (error) {
        sentryUtils.captureError(error as Error, { function: name });
        throw error;
      }
    }
    
    return Sentry.startSpan({ name, op: 'function' }, () => {
      try {
        const result = fn();
        return result;
      } catch (error) {
        sentryUtils.captureError(error as Error, { function: name });
        throw error;
      }
    });
  },
};

// Export default initialization for immediate use
export default initializeSentry;