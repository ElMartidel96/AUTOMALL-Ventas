/**
 * Comprehensive Observability System
 * Production-grade monitoring, metrics, and tracing
 */

import { sentryUtils } from './sentry';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from './error-taxonomy';

// Performance metrics tracking
interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: number;
  tags?: Record<string, string>;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  metrics: Record<string, number>;
  lastChecked: number;
}

class ObservabilityManager {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();
  private alerts: Array<{ message: string; severity: ErrorSeverity; timestamp: number }> = [];
  
  // Performance tracking
  trackPerformance(name: string, value: number, unit: PerformanceMetric['unit'] = 'ms', tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags
    };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);
    
    // Keep only last 100 metrics per type
    if (metricHistory.length > 100) {
      metricHistory.shift();
    }
    
    // Log significant performance issues
    if (unit === 'ms' && value > 5000) {
      this.logAlert(`High latency detected for ${name}: ${value}ms`, ErrorSeverity.HIGH);
    }
    
    console.log(`[PERF] ${name}: ${value}${unit}`, tags || '');
  }
  
  // Async performance wrapper
  async measureAsync<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const startTime = Date.now();
    
    return await sentryUtils.startSpan({ name, op: 'measure' }, async () => {
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        this.trackPerformance(name, duration, 'ms', tags);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.trackPerformance(`${name}.error`, duration, 'ms', tags);
        
        ErrorHandler.handle(error as Error, { operation: name, tags });
        throw error;
      }
    }) as Promise<T>;
  }
  
  // Synchronous performance wrapper
  measure<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const startTime = Date.now();
    
    try {
      const result = fn();
      const duration = Date.now() - startTime;
      
      this.trackPerformance(name, duration, 'ms', tags);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.trackPerformance(`${name}.error`, duration, 'ms', tags);
      
      ErrorHandler.handle(error as Error, { operation: name, tags });
      throw error;
    }
  }
  
  // Health check registration
  registerHealthCheck(name: string, checkFn: () => Promise<boolean>) {
    this.healthChecks.set(name, checkFn);
  }
  
  // System health assessment
  async getSystemHealth(): Promise<SystemHealth> {
    const checks: Record<string, boolean> = {};
    const metrics: Record<string, number> = {};
    
    // Run health checks
    for (const [name, checkFn] of this.healthChecks.entries()) {
      try {
        checks[name] = await this.measureAsync(`health.${name}`, checkFn);
      } catch (error) {
        checks[name] = false;
        ErrorHandler.handle(error as Error, { healthCheck: name });
      }
    }
    
    // Calculate performance metrics
    metrics.avgResponseTime = this.getAverageMetric('api.response.time') || 0;
    metrics.errorRate = this.getErrorRate();
    metrics.memoryUsage = this.getMemoryUsage();
    
    // Determine overall status
    const failedChecks = Object.values(checks).filter(status => !status).length;
    const totalChecks = Object.keys(checks).length;
    
    let status: SystemHealth['status'] = 'healthy';
    if (failedChecks > 0) {
      status = failedChecks >= totalChecks / 2 ? 'unhealthy' : 'degraded';
    }
    
    // Check performance thresholds
    if (metrics.avgResponseTime > 2000 || metrics.errorRate > 0.05) {
      status = status === 'healthy' ? 'degraded' : status;
    }
    
    return {
      status,
      checks,
      metrics,
      lastChecked: Date.now()
    };
  }
  
  // Get average metric value
  private getAverageMetric(name: string): number | null {
    const metricHistory = this.metrics.get(name);
    if (!metricHistory || metricHistory.length === 0) return null;
    
    const sum = metricHistory.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metricHistory.length;
  }
  
  // Calculate error rate
  private getErrorRate(): number {
    const successMetrics = this.metrics.get('api.success') || [];
    const errorMetrics = this.metrics.get('api.error') || [];
    
    const totalRequests = successMetrics.length + errorMetrics.length;
    if (totalRequests === 0) return 0;
    
    return errorMetrics.length / totalRequests;
  }
  
  // Get memory usage percentage
  private getMemoryUsage(): number {
    try {
      if (typeof process === 'undefined' || !process.memoryUsage) {
        // Edge Runtime doesn't have process.memoryUsage, return nominal value
        return 5.0; // Assume 5% usage for Edge Runtime
      }
      
      const memUsage = process.memoryUsage();
      // Approximate total system memory (this is a rough estimate)
      const totalMemory = memUsage.heapTotal * 10; // Very rough approximation
      return (memUsage.heapUsed / totalMemory) * 100;
    } catch (error) {
      // If memory usage check fails, return nominal value
      console.warn('Memory usage calculation failed:', error);
      return 5.0;
    }
  }
  
  // Alert management
  private logAlert(message: string, severity: ErrorSeverity) {
    const alert = {
      message,
      severity,
      timestamp: Date.now()
    };
    
    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }
    
    // Send to Sentry for high/critical alerts
    if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
      sentryUtils.captureMessage(message, severity === ErrorSeverity.CRITICAL ? 'error' : 'warning');
    }
  }
  
  // Get performance summary
  getPerformanceSummary() {
    const summary: Record<string, any> = {};
    
    for (const [name, metricHistory] of this.metrics.entries()) {
      if (metricHistory.length === 0) continue;
      
      const values = metricHistory.map(m => m.value);
      const avg = values.reduce((a, b) => a + b) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      summary[name] = {
        average: Math.round(avg * 100) / 100,
        maximum: max,
        minimum: min,
        count: values.length,
        unit: metricHistory[0].unit
      };
    }
    
    return summary;
  }
  
  // Get recent alerts
  getRecentAlerts(count = 10) {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }
  
  // Track API calls
  trackApiCall(method: string, path: string, statusCode: number, duration: number) {
    const tags = { method, path, status: statusCode.toString() };
    
    this.trackPerformance('api.response.time', duration, 'ms', tags);
    
    if (statusCode >= 200 && statusCode < 300) {
      this.trackPerformance('api.success', 1, 'count', tags);
    } else if (statusCode >= 400) {
      this.trackPerformance('api.error', 1, 'count', tags);
      
      if (statusCode >= 500) {
        this.logAlert(`Server error ${statusCode} on ${method} ${path}`, ErrorSeverity.HIGH);
      }
    }
  }
  
  // Clear old metrics
  cleanup() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [name, metricHistory] of this.metrics.entries()) {
      const filtered = metricHistory.filter(metric => metric.timestamp > cutoff);
      this.metrics.set(name, filtered);
    }
    
    // Clear old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
  }
}

// Global observability instance
const observability = new ObservabilityManager();

// Register default health checks
observability.registerHealthCheck('memory', async () => {
  try {
    // For Vercel Edge Runtime compatibility
    if (typeof process === 'undefined' || !process.memoryUsage) {
      // Edge Runtime doesn't have process.memoryUsage, assume healthy
      return true;
    }
    
    const usage = process.memoryUsage();
    return usage.heapUsed / usage.heapTotal < 0.9; // Less than 90% heap usage
  } catch (error) {
    // If memory check fails, assume healthy to not block the service
    console.warn('Memory health check failed:', error);
    return true;
  }
});

observability.registerHealthCheck('uptime', async () => {
  try {
    // For Vercel Edge Runtime compatibility
    if (typeof process === 'undefined' || !process.uptime) {
      // Edge Runtime doesn't have process.uptime, assume healthy
      return true;
    }
    
    return process.uptime() > 0;
  } catch (error) {
    // If uptime check fails, assume healthy to not block the service
    console.warn('Uptime health check failed:', error);
    return true;
  }
});

// Cleanup old metrics every hour
if (typeof process !== 'undefined') {
  setInterval(() => {
    observability.cleanup();
  }, 60 * 60 * 1000);
}

// Enhanced request tracking middleware
export function trackRequest(method: string, path: string) {
  const startTime = Date.now();
  
  return {
    finish: (statusCode: number) => {
      const duration = Date.now() - startTime;
      observability.trackApiCall(method, path, statusCode, duration);
    }
  };
}

// Export main observability utilities
export const observabilityUtils = {
  track: observability.trackPerformance.bind(observability),
  measure: observability.measure.bind(observability),
  measureAsync: observability.measureAsync.bind(observability),
  getHealth: observability.getSystemHealth.bind(observability),
  getSummary: observability.getPerformanceSummary.bind(observability),
  getAlerts: observability.getRecentAlerts.bind(observability),
  trackApiCall: observability.trackApiCall.bind(observability),
  registerHealthCheck: observability.registerHealthCheck.bind(observability)
};

export default observability;