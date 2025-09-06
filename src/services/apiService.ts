/**
 * Example service demonstrating configuration manager usage
 */

import { ConfigurationManager } from '../core/configurationManager';
import { LoggerService } from './exampleServices';
import { Scoped } from '../core/diDecorators';

@Scoped
export class ApiService {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private apiKey?: string;

  constructor(
    private config: ConfigurationManager,
    private logger: LoggerService
  ) {
    // Load API configuration from config manager
    this.baseUrl = this.config.get('api.baseUrl', '/api');
    this.timeout = this.config.get('api.timeout', 30000);
    this.retries = this.config.get('api.retries', 3);
    this.apiKey = this.config.get('api.apiKey');

    this.logger.log(`ApiService initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Make HTTP GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    
    this.logger.log(`Making GET request to: ${url}`);
    
    return this.makeRequest<T>('GET', url);
  }

  /**
   * Make HTTP POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = this.buildUrl(endpoint);
    
    this.logger.log(`Making POST request to: ${url}`);
    
    return this.makeRequest<T>('POST', url, data);
  }

  /**
   * Make HTTP PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const url = this.buildUrl(endpoint);
    
    this.logger.log(`Making PUT request to: ${url}`);
    
    return this.makeRequest<T>('PUT', url, data);
  }

  /**
   * Make HTTP DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = this.buildUrl(endpoint);
    
    this.logger.log(`Making DELETE request to: ${url}`);
    
    return this.makeRequest<T>('DELETE', url);
  }

  /**
   * Build full URL with base URL and parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Combine base URL and endpoint
    let url = `${this.baseUrl}/${cleanEndpoint}`;
    
    // Add query parameters if provided
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    return url;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    method: string, 
    url: string, 
    data?: any,
    attempt: number = 1
  ): Promise<T> {
    try {
      // Build request options
      const options: RequestInit = {
        method,
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(this.timeout)
      };

      // Add body for POST/PUT requests
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      // Make the request
      const response = await fetch(url, options);
      
      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse JSON response
      const result = await response.json();
      
      this.logger.log(`Request successful: ${method} ${url}`);
      
      return result as T;

    } catch (error) {
      this.logger.logError(`Request failed: ${method} ${url}`, error);
      
      // Retry logic
      if (attempt < this.retries) {
        this.logger.log(`Retrying request (attempt ${attempt + 1}/${this.retries})`);
        await this.delay(1000 * attempt); // Exponential backoff
        return this.makeRequest<T>(method, url, data, attempt + 1);
      }
      
      // Max retries exceeded
      throw new Error(`Request failed after ${this.retries} attempts: ${error}`);
    }
  }

  /**
   * Build request headers
   */
  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add API key if configured
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Add custom headers based on environment
    if (this.config.isDevelopment()) {
      headers['X-Environment'] = 'development';
    }

    return headers;
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current API configuration
   */
  getConfiguration() {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      retries: this.retries,
      hasApiKey: !!this.apiKey,
      environment: this.config.getEnvironment()
    };
  }

  /**
   * Update configuration at runtime (for testing)
   */
  updateConfiguration(updates: {
    baseUrl?: string;
    timeout?: number;
    retries?: number;
    apiKey?: string;
  }) {
    if (updates.baseUrl) {
      this.baseUrl = updates.baseUrl;
      this.config.set('api.baseUrl', updates.baseUrl);
    }
    if (updates.timeout) {
      this.timeout = updates.timeout;
      this.config.set('api.timeout', updates.timeout);
    }
    if (updates.retries) {
      this.retries = updates.retries;
      this.config.set('api.retries', updates.retries);
    }
    if (updates.apiKey) {
      this.apiKey = updates.apiKey;
      this.config.set('api.apiKey', updates.apiKey);
    }

    this.logger.log(`ApiService configuration updated: ${JSON.stringify(updates)}`);
  }
}
