/**
 * Comprehensive Error Taxonomy and Classification System
 * Production-grade error handling with detailed categorization
 */

import { sentryUtils } from './sentry';

// Error categories for comprehensive classification
export enum ErrorCategory {
  // Infrastructure Errors
  NETWORK = 'network',
  DATABASE = 'database', 
  CACHE = 'cache',
  EXTERNAL_API = 'external_api',
  
  // Application Errors
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_LOGIC = 'business_logic',
  
  // Runtime Errors
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  CONFIGURATION = 'configuration',
  
  // User Errors
  INPUT_VALIDATION = 'input_validation',
  USER_LIMIT_EXCEEDED = 'user_limit_exceeded',
  UNSUPPORTED_OPERATION = 'unsupported_operation',
  
  // System Errors
  INTERNAL = 'internal',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorRecoverability {
  RECOVERABLE = 'recoverable',
  PARTIALLY_RECOVERABLE = 'partially_recoverable',
  NON_RECOVERABLE = 'non_recoverable'
}

// Detailed error information
export interface ErrorTaxonomy {
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoverability: ErrorRecoverability;
  userMessage: string;
  developmentMessage: string;
  suggestedActions: string[];
  retryable: boolean;
  timeout?: number; // milliseconds to wait before retry
  shouldAlert: boolean;
}

// Error classification rules
const errorClassificationRules: Record<string, ErrorTaxonomy> = {
  // Network Errors
  'ENOTFOUND': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    recoverability: ErrorRecoverability.RECOVERABLE,
    userMessage: 'Service temporarily unavailable. Please try again.',
    developmentMessage: 'DNS resolution failed for external service',
    suggestedActions: ['Check network connectivity', 'Verify service endpoint'],
    retryable: true,
    timeout: 30000,
    shouldAlert: true
  },
  
  'ECONNREFUSED': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    recoverability: ErrorRecoverability.RECOVERABLE,
    userMessage: 'Service temporarily unavailable. Please try again.',
    developmentMessage: 'Connection refused by target service',
    suggestedActions: ['Check service health', 'Verify firewall rules'],
    retryable: true,
    timeout: 15000,
    shouldAlert: true
  },
  
  'ETIMEOUT': {
    category: ErrorCategory.TIMEOUT,
    severity: ErrorSeverity.MEDIUM,
    recoverability: ErrorRecoverability.RECOVERABLE,
    userMessage: 'Request timed out. Please try again with a shorter request.',
    developmentMessage: 'Request exceeded timeout threshold',
    suggestedActions: ['Optimize query', 'Increase timeout', 'Check service performance'],
    retryable: true,
    timeout: 5000,
    shouldAlert: false
  },
  
  // Database Errors
  'ECONNRESET': {
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.HIGH,
    recoverability: ErrorRecoverability.RECOVERABLE,
    userMessage: 'Database temporarily unavailable. Please try again.',
    developmentMessage: 'Database connection was reset',
    suggestedActions: ['Check connection pool', 'Verify database health'],
    retryable: true,
    timeout: 10000,
    shouldAlert: true
  },
  
  // Redis/Cache Errors
  'Redis connection lost': {
    category: ErrorCategory.CACHE,
    severity: ErrorSeverity.MEDIUM,
    recoverability: ErrorRecoverability.PARTIALLY_RECOVERABLE,
    userMessage: 'Some features may be slower than usual.',
    developmentMessage: 'Redis connection was lost, falling back to non-cached operation',
    suggestedActions: ['Check Redis health', 'Verify network connectivity'],
    retryable: true,
    timeout: 5000,
    shouldAlert: true
  },
  
  // Rate Limiting
  'Rate limit exceeded': {
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.LOW,
    recoverability: ErrorRecoverability.RECOVERABLE,
    userMessage: 'Too many requests. Please wait and try again.',
    developmentMessage: 'Client exceeded rate limit threshold',
    suggestedActions: ['Implement backoff strategy', 'Review rate limits'],
    retryable: true,
    timeout: 60000,
    shouldAlert: false
  },
  
  // Validation Errors
  'Invalid input': {
    category: ErrorCategory.INPUT_VALIDATION,
    severity: ErrorSeverity.LOW,
    recoverability: ErrorRecoverability.NON_RECOVERABLE,
    userMessage: 'Please check your input and try again.',
    developmentMessage: 'Request validation failed',
    suggestedActions: ['Review input format', 'Check validation rules'],
    retryable: false,
    shouldAlert: false
  },
  
  // Authentication Errors
  'Unauthorized': {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    recoverability: ErrorRecoverability.RECOVERABLE,
    userMessage: 'Please sign in to continue.',
    developmentMessage: 'Authentication required',
    suggestedActions: ['Check authentication status', 'Redirect to login'],
    retryable: false,
    shouldAlert: false
  },
  
  // OpenAI API Errors
  'OpenAI API error': {
    category: ErrorCategory.EXTERNAL_API,
    severity: ErrorSeverity.HIGH,
    recoverability: ErrorRecoverability.RECOVERABLE,
    userMessage: 'AI service temporarily unavailable. Please try again.',
    developmentMessage: 'OpenAI API returned an error',
    suggestedActions: ['Check API key', 'Verify request format', 'Check OpenAI status'],
    retryable: true,
    timeout: 30000,
    shouldAlert: true
  },
  
  // CORS Errors
  'CORS: Origin not allowed': {
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    recoverability: ErrorRecoverability.NON_RECOVERABLE,
    userMessage: 'Access denied from this location.',
    developmentMessage: 'CORS policy rejected request origin',
    suggestedActions: ['Add origin to allowlist', 'Check CORS configuration'],
    retryable: false,
    shouldAlert: true
  },
  
  // Configuration Errors
  'Environment variable missing': {
    category: ErrorCategory.CONFIGURATION,
    severity: ErrorSeverity.CRITICAL,
    recoverability: ErrorRecoverability.NON_RECOVERABLE,
    userMessage: 'Service configuration error. Please contact support.',
    developmentMessage: 'Required environment variable not set',
    suggestedActions: ['Check environment configuration', 'Verify deployment'],
    retryable: false,
    shouldAlert: true
  }
};

// Error classification function
export function classifyError(error: Error | string): ErrorTaxonomy {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorName = typeof error === 'object' && error.name ? error.name : '';
  
  // Try exact message match first
  for (const [pattern, taxonomy] of Object.entries(errorClassificationRules)) {
    if (errorMessage.includes(pattern) || errorName === pattern) {
      return taxonomy;
    }
  }
  
  // Pattern-based classification
  if (errorMessage.toLowerCase().includes('timeout')) {
    return errorClassificationRules['ETIMEOUT'];
  }
  
  if (errorMessage.toLowerCase().includes('rate limit')) {
    return errorClassificationRules['Rate limit exceeded'];
  }
  
  if (errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('forbidden')) {
    return errorClassificationRules['Unauthorized'];
  }
  
  if (errorMessage.toLowerCase().includes('validation') || errorMessage.toLowerCase().includes('invalid')) {
    return errorClassificationRules['Invalid input'];
  }
  
  if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
    return errorClassificationRules['ECONNREFUSED'];
  }
  
  // Default classification for unknown errors
  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    recoverability: ErrorRecoverability.PARTIALLY_RECOVERABLE,
    userMessage: 'An unexpected error occurred. Please try again.',
    developmentMessage: `Unclassified error: ${errorMessage}`,
    suggestedActions: ['Review error details', 'Check system logs'],
    retryable: true,
    timeout: 30000,
    shouldAlert: true
  };
}

// Enhanced error handler with comprehensive logging
export class ErrorHandler {
  static handle(error: Error | string, context?: Record<string, any>) {
    const taxonomy = classifyError(error);
    const errorObject = typeof error === 'string' ? new Error(error) : error;
    
    // Enhanced context with classification
    const enhancedContext = {
      ...context,
      taxonomy: {
        category: taxonomy.category,
        severity: taxonomy.severity,
        recoverability: taxonomy.recoverability,
        retryable: taxonomy.retryable
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      deployment: process.env.VERCEL_ENV
    };
    
    // Log based on severity
    if (taxonomy.severity === ErrorSeverity.CRITICAL) {
      console.error(`[CRITICAL] ${taxonomy.developmentMessage}`, enhancedContext);
    } else if (taxonomy.severity === ErrorSeverity.HIGH) {
      console.error(`[HIGH] ${taxonomy.developmentMessage}`, enhancedContext);
    } else if (taxonomy.severity === ErrorSeverity.MEDIUM) {
      console.warn(`[MEDIUM] ${taxonomy.developmentMessage}`, enhancedContext);
    } else {
      console.log(`[LOW] ${taxonomy.developmentMessage}`, enhancedContext);
    }
    
    // Send to Sentry if should alert
    if (taxonomy.shouldAlert) {
      sentryUtils.captureError(errorObject, enhancedContext);
    }
    
    return {
      taxonomy,
      userMessage: taxonomy.userMessage,
      shouldRetry: taxonomy.retryable,
      retryDelay: taxonomy.timeout
    };
  }
  
  // Specialized handler for API responses
  static handleApiError(error: Error | string, context?: Record<string, any>) {
    const result = this.handle(error, context);
    
    return {
      error: result.userMessage,
      code: result.taxonomy.category,
      retryable: result.shouldRetry,
      retryAfter: result.retryDelay ? Math.ceil(result.retryDelay / 1000) : undefined,
      severity: result.taxonomy.severity
    };
  }
  
  // Get metrics for monitoring
  static getMetrics() {
    return {
      categories: Object.values(ErrorCategory),
      severities: Object.values(ErrorSeverity),
      recoverabilities: Object.values(ErrorRecoverability),
      rulesCount: Object.keys(errorClassificationRules).length
    };
  }
}

// Utility functions
export const errorUtils = {
  classify: classifyError,
  handle: ErrorHandler.handle.bind(ErrorHandler),
  handleApi: ErrorHandler.handleApiError.bind(ErrorHandler),
  getMetrics: ErrorHandler.getMetrics.bind(ErrorHandler)
};

export default ErrorHandler;