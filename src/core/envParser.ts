/**
 * Environment Variable Parser
 * Handles parsing .env files and environment variables with type conversion
 */

export class EnvParser {
  private static cache = new Map<string, any>();

  /**
   * Parse environment variable to appropriate type
   */
  static parseValue(value: string): any {
    if (!value) return undefined;

    // Trim whitespace
    value = value.trim();

    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // Handle boolean values
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Handle null/undefined
    if (value.toLowerCase() === 'null') return null;
    if (value.toLowerCase() === 'undefined') return undefined;

    // Handle numbers
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^\d*\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Handle arrays (comma-separated)
    if (value.includes(',')) {
      return value.split(',').map(item => this.parseValue(item.trim()));
    }

    // Handle JSON objects
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      try {
        return JSON.parse(value);
      } catch {
        // If JSON parsing fails, return as string
        return value;
      }
    }

    // Return as string
    return value;
  }

  /**
   * Get environment variable with type conversion and default value
   */
  static get<T = any>(key: string, defaultValue?: T): T {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    // Get from environment
    const value = this.getRawValue(key);
    
    if (value === undefined || value === null) {
      return defaultValue as T;
    }

    const parsed = this.parseValue(value);
    
    // Cache the result
    this.cache.set(key, parsed);
    
    return parsed as T;
  }

  /**
   * Get raw environment variable value
   */
  private static getRawValue(key: string): string | undefined {
    // In browser environment, we'll use a global env object
    // that should be set by the build process or runtime
    if (typeof window !== 'undefined') {
      const env = (window as any).__ENV__ || {};
      return env[key];
    }
    
    // Fallback for Node.js environments (build time)
    if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.env) {
      return (globalThis as any).process.env[key];
    }
    
    return undefined;
  }

  /**
   * Check if environment variable exists
   */
  static has(key: string): boolean {
    return this.getRawValue(key) !== undefined;
  }

  /**
   * Get all environment variables with a prefix
   */
  static getWithPrefix(prefix: string): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Get all environment variables
    let envVars: Record<string, string> = {};
    
    if (typeof window !== 'undefined') {
      envVars = (window as any).__ENV__ || {};
    } else if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.env) {
      envVars = (globalThis as any).process.env as Record<string, string>;
    }

    // Filter by prefix and parse values
    Object.keys(envVars).forEach(key => {
      if (key.startsWith(prefix)) {
        const shortKey = key.substring(prefix.length);
        result[shortKey] = this.parseValue(envVars[key]);
      }
    });

    return result;
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Set environment variable (for testing)
   */
  static set(key: string, value: any): void {
    if (typeof window !== 'undefined') {
      const env = (window as any).__ENV__ || {};
      env[key] = String(value);
      (window as any).__ENV__ = env;
    }
    
    // Clear from cache so it gets re-parsed
    this.cache.delete(key);
  }

  /**
   * Load environment variables from object (for .env file content)
   */
  static load(envData: Record<string, string>): void {
    if (typeof window !== 'undefined') {
      const existingEnv = (window as any).__ENV__ || {};
      (window as any).__ENV__ = { ...existingEnv, ...envData };
    }
    
    // Clear cache to force re-parsing
    this.clearCache();
  }

  /**
   * Merge environment variables from object (overlay on existing)
   * Used for layered configuration (base + environment-specific)
   */
  static merge(envData: Record<string, string>): void {
    if (typeof window !== 'undefined') {
      const existingEnv = (window as any).__ENV__ || {};
      (window as any).__ENV__ = { ...existingEnv, ...envData };
    }
    
    // Clear cache to force re-parsing with new values
    this.clearCache();
  }
}

/**
 * Utility functions for common environment checks
 */
export const EnvUtils = {
  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return EnvParser.get('NODE_ENV', 'development') === 'development';
  },

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return EnvParser.get('NODE_ENV') === 'production';
  },

  /**
   * Check if running in UAT mode
   */
  isUAT(): boolean {
    return EnvParser.get('NODE_ENV') === 'uat';
  },

  /**
   * Check if running in staging mode
   */
  isStaging(): boolean {
    return EnvParser.get('NODE_ENV') === 'staging';
  },

  /**
   * Get current environment
   */
  getEnvironment(): string {
    return EnvParser.get('NODE_ENV', 'development');
  },

  /**
   * Check if debug mode is enabled
   */
  isDebug(): boolean {
    return EnvParser.get('DEBUG', EnvUtils.isDevelopment());
  }
};
