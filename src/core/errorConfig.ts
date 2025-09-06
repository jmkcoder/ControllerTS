/**
 * Error Configuration System
 * Allows configuring custom error pages without modifying core router
 */

export interface ErrorPageConfig {
  template?: string;
  controller?: string;
  action?: string;
  data?: Record<string, any>;
}

export interface ErrorConfiguration {
  404?: ErrorPageConfig;
  500?: ErrorPageConfig;
  403?: ErrorPageConfig;
  401?: ErrorPageConfig;
  [statusCode: string]: ErrorPageConfig | undefined;
}

class ErrorConfigManager {
  private config: ErrorConfiguration = {
    // Default configurations
    404: {
      template: `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h1 style="color: #e74c3c; font-size: 4em; margin: 0;">404</h1>
          <h2 style="color: #2c3e50; margin: 20px 0;">Page Not Found</h2>
          <p style="color: #7f8c8d; font-size: 1.1em;">The page you are looking for could not be found.</p>
          <a href="/" style="color: #3498db; text-decoration: none; font-size: 1.1em;">← Go Home</a>
        </div>
      `
    },
    500: {
      template: `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h1 style="color: #e74c3c; font-size: 4em; margin: 0;">500</h1>
          <h2 style="color: #2c3e50; margin: 20px 0;">Internal Server Error</h2>
          <p style="color: #7f8c8d; font-size: 1.1em;">Something went wrong while processing your request.</p>
          <a href="/" style="color: #3498db; text-decoration: none; font-size: 1.1em;">← Go Home</a>
        </div>
      `
    },
    403: {
      template: `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h1 style="color: #e74c3c; font-size: 4em; margin: 0;">403</h1>
          <h2 style="color: #2c3e50; margin: 20px 0;">Access Forbidden</h2>
          <p style="color: #7f8c8d; font-size: 1.1em;">You don't have permission to access this resource.</p>
          <a href="/" style="color: #3498db; text-decoration: none; font-size: 1.1em;">← Go Home</a>
        </div>
      `
    },
    401: {
      template: `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h1 style="color: #e74c3c; font-size: 4em; margin: 0;">401</h1>
          <h2 style="color: #2c3e50; margin: 20px 0;">Unauthorized</h2>
          <p style="color: #7f8c8d; font-size: 1.1em;">You need to authenticate to access this resource.</p>
          <a href="/login" style="color: #3498db; text-decoration: none; font-size: 1.1em;">← Login</a>
        </div>
      `
    }
  };

  /**
   * Configure error pages
   */
  configure(errorConfig: ErrorConfiguration): void {
    this.config = { ...this.config, ...errorConfig };
  }

  /**
   * Set a specific error page configuration
   */
  setErrorPage(statusCode: number | string, config: ErrorPageConfig): void {
    this.config[statusCode.toString()] = config;
  }

  /**
   * Get error page configuration for a status code
   */
  getErrorConfig(statusCode: number | string): ErrorPageConfig | undefined {
    return this.config[statusCode.toString()];
  }

  /**
   * Get all error configurations
   */
  getAllConfigs(): ErrorConfiguration {
    return { ...this.config };
  }

  /**
   * Reset to default configurations
   */
  reset(): void {
    this.config = {
      404: {
        template: `
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1 style="color: #e74c3c; font-size: 4em; margin: 0;">404</h1>
            <h2 style="color: #2c3e50; margin: 20px 0;">Page Not Found</h2>
            <p style="color: #7f8c8d; font-size: 1.1em;">The page you are looking for could not be found.</p>
            <a href="/" style="color: #3498db; text-decoration: none; font-size: 1.1em;">← Go Home</a>
          </div>
        `
      }
    };
  }
}

// Export singleton instance
export const errorConfig = new ErrorConfigManager();

// Export convenience functions
export function configureErrorPages(config: ErrorConfiguration): void {
  errorConfig.configure(config);
}

export function setErrorPage(statusCode: number | string, config: ErrorPageConfig): void {
  errorConfig.setErrorPage(statusCode, config);
}
