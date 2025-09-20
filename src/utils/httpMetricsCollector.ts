// utils/httpMetricsCollector.ts - Collects real HTTP metrics from httpHandler

import { httpHandler } from '@/services/httpStatusHandler';

interface HttpMetrics {
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  requestCount: number;
  totalErrors: number;
  activeRequests: number;
  retryAttempts: number;
  lastUpdated: string;
  recentRequests: Array<{
    timestamp: string;
    url: string;
    status: number;
    responseTime: number;
  }>;
}

class HttpMetricsCollector {
  private metrics: HttpMetrics = {
    averageResponseTime: 0,
    errorRate: 0,
    uptime: 100,
    requestCount: 0,
    totalErrors: 0,
    activeRequests: 0,
    retryAttempts: 0,
    lastUpdated: new Date().toISOString(),
    recentRequests: []
  };

  private startTime = Date.now();
  private requestTimes: number[] = [];
  private errorCount = 0;
  private successCount = 0;

  // Track HTTP request
  trackRequest(url: string, startTime: number, endTime: number, status: number) {
    const responseTime = endTime - startTime;
    
    // Update request times (keep last 100)
    this.requestTimes.push(responseTime);
    if (this.requestTimes.length > 100) {
      this.requestTimes.shift();
    }

    // Track success/error
    if (status >= 400) {
      this.errorCount++;
    } else {
      this.successCount++;
    }

    // Add to recent requests (keep last 20)
    this.metrics.recentRequests.push({
      timestamp: new Date(endTime).toISOString(),
      url,
      status,
      responseTime
    });

    if (this.metrics.recentRequests.length > 20) {
      this.metrics.recentRequests.shift();
    }

    this.updateMetrics();
  }

  // Track active request count
  incrementActiveRequests() {
    this.metrics.activeRequests++;
    this.updateMetrics();
  }

  decrementActiveRequests() {
    this.metrics.activeRequests = Math.max(0, this.metrics.activeRequests - 1);
    this.updateMetrics();
  }

  // Track retry attempts
  trackRetryAttempt() {
    this.metrics.retryAttempts++;
    this.updateMetrics();
  }

  private updateMetrics() {
    // Calculate average response time
    if (this.requestTimes.length > 0) {
      this.metrics.averageResponseTime = 
        this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length;
    }

    // Calculate error rate
    const totalRequests = this.errorCount + this.successCount;
    if (totalRequests > 0) {
      this.metrics.errorRate = (this.errorCount / totalRequests) * 100;
    }

    // Calculate uptime (simplified)
    const uptimeMs = Date.now() - this.startTime;
    this.metrics.uptime = Math.min(100, (uptimeMs / (1000 * 60 * 60 * 24)) * 100); // 100% after 24h

    this.metrics.requestCount = totalRequests;
    this.metrics.totalErrors = this.errorCount;
    this.metrics.lastUpdated = new Date().toISOString();

    // Store in localStorage for persistence
    this.saveMetrics();
  }

  private saveMetrics() {
    try {
      localStorage.setItem('httpMetrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Error saving HTTP metrics:', error);
    }
  }

  getMetrics(): HttpMetrics {
    return { ...this.metrics };
  }

  // Load metrics from localStorage on initialization
  loadStoredMetrics() {
    try {
      const stored = localStorage.getItem('httpMetrics');
      if (stored) {
        const data = JSON.parse(stored);
        this.metrics = { ...this.metrics, ...data };
        
        // Restore counts from stored data
        this.errorCount = data.totalErrors || 0;
        this.successCount = Math.max(0, (data.requestCount || 0) - this.errorCount);
      }
    } catch (error) {
      console.error('Error loading stored HTTP metrics:', error);
    }
  }

  // Reset metrics
  reset() {
    this.metrics = {
      averageResponseTime: 0,
      errorRate: 0,
      uptime: 100,
      requestCount: 0,
      totalErrors: 0,
      activeRequests: 0,
      retryAttempts: 0,
      lastUpdated: new Date().toISOString(),
      recentRequests: []
    };
    this.requestTimes = [];
    this.errorCount = 0;
    this.successCount = 0;
    this.startTime = Date.now();
    this.saveMetrics();
  }
}

// Global instance
export const httpMetricsCollector = new HttpMetricsCollector();

// Initialize on first import
httpMetricsCollector.loadStoredMetrics();

// Monkey patch fetch to automatically track requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const url = args[0] as string;
  const startTime = Date.now();
  
  httpMetricsCollector.incrementActiveRequests();
  
  try {
    const response = await originalFetch(...args);
    const endTime = Date.now();
    
    httpMetricsCollector.trackRequest(url, startTime, endTime, response.status);
    httpMetricsCollector.decrementActiveRequests();
    
    return response;
  } catch (error) {
    const endTime = Date.now();
    
    httpMetricsCollector.trackRequest(url, startTime, endTime, 0); // 0 for network errors
    httpMetricsCollector.decrementActiveRequests();
    
    throw error;
  }
};

export default httpMetricsCollector;
