/**
 * Performance Monitoring Service
 * Tracks API response times, errors, and user behavior
 * For 2.5M concurrent users - critical for observability
 */

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: number;
  statusCode?: number;
  error?: string;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000;
  private batchInterval: number = 60000; // 1 minute

  constructor() {
    this.startBatchReporting();
  }

  /**
   * Track API request performance
   */
  trackRequest(
    endpoint: string,
    method: string,
    duration: number,
    statusCode?: number,
    error?: string,
    userId?: string
  ) {
    const metric: PerformanceMetric = {
      endpoint,
      method,
      duration,
      timestamp: Date.now(),
      statusCode,
      error,
      userId,
    };

    this.metrics.push(metric);

    // Keep array from growing too large
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow requests
    if (duration > 3000) {
      console.warn(
        `[SLOW] ${method} ${endpoint} took ${duration}ms`,
        { statusCode, error }
      );
    }

    // Log errors
    if (error) {
      console.error(`[ERROR] ${method} ${endpoint}`, { duration, error });
    }
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        avgDuration: 0,
        slowRequests: 0,
        errorRate: 0,
      };
    }

    const avgDuration =
      this.metrics.reduce((sum, m) => sum + m.duration, 0) /
      this.metrics.length;
    const slowRequests = this.metrics.filter((m) => m.duration > 3000).length;
    const errorCount = this.metrics.filter((m) => m.error).length;
    const errorRate = (errorCount / this.metrics.length) * 100;

    return {
      totalRequests: this.metrics.length,
      avgDuration: Math.round(avgDuration),
      slowRequests,
      errorRate: errorRate.toFixed(2),
      metrics: this.metrics.slice(-100), // Last 100 for inspection
    };
  }

  /**
   * Report metrics to backend or monitoring service
   */
  private startBatchReporting() {
    setInterval(() => {
      const summary = this.getSummary();
      if (summary.totalRequests > 0) {
        // Send to monitoring endpoint
        this.reportToBackend(summary);
      }
    }, this.batchInterval);
  }

  /**
   * Send metrics to backend
   */
  private reportToBackend(summary: any) {
    // Only report if window is visible (don't spam with background tabs)
    if (document.hidden) return;

    try {
      navigator.sendBeacon(
        '/api/metrics/report',
        JSON.stringify({
          timestamp: Date.now(),
          summary,
          userAgent: navigator.userAgent,
        })
      );
    } catch (e) {
      // Silent fail - monitoring shouldn't crash app
      console.debug('Metrics reporting failed:', e);
    }
  }

  /**
   * Clear metrics (for testing)
   */
  clear() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Fetch wrapper with performance tracking
 */
export async function trackedFetch<T>(
  endpoint: string,
  options?: RequestInit,
  userId?: string
): Promise<T> {
  const method = options?.method || 'GET';
  const startTime = performance.now();

  try {
    const response = await fetch(endpoint, options);
    const duration = Math.round(performance.now() - startTime);

    performanceMonitor.trackRequest(
      endpoint,
      method,
      duration,
      response.status,
      undefined,
      userId
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    performanceMonitor.trackRequest(
      endpoint,
      method,
      duration,
      undefined,
      String(error),
      userId
    );
    throw error;
  }
}

/**
 * Get current performance metrics in console
 */
export function logMetrics() {
  const summary = performanceMonitor.getSummary();
  console.table({
    'Total Requests': summary.totalRequests,
    'Avg Duration (ms)': summary.avgDuration,
    'Slow Requests': summary.slowRequests,
    'Error Rate (%)': summary.errorRate,
  });
}
