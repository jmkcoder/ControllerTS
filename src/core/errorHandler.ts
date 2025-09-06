/**
 * Error Handler for MVC Framework
 * Handles rendering of error pages based on configuration
 */

import { errorConfig, type ErrorPageConfig } from './errorConfig';
import { ViewEngine } from './viewEngine';
import { HtmlHelper } from './htmlHelper';
import type { Controller } from './controller';

export class ErrorHandler {
  /**
   * Handle and render an error page
   */
  static async handleError(
    statusCode: number, 
    message?: string, 
    details?: any,
    requestContext?: any
  ): Promise<void> {
    const config = errorConfig.getErrorConfig(statusCode);
    
    if (!config) {
      // No configuration found, use basic fallback
      this.renderBasicError(statusCode, message);
      return;
    }

    try {
      if (config.controller && config.action) {
        // Handle via controller action
        await this.handleViaController(config, statusCode, message, details, requestContext);
      } else if (config.template) {
        // Handle via template rendering
        await this.handleViaTemplate(config, statusCode, message, details);
      } else {
        // Fallback to basic error
        this.renderBasicError(statusCode, message);
      }
    } catch (error) {
      console.error('Error handling failed:', error);
      // Ultimate fallback
      this.renderBasicError(statusCode, message);
    }
  }

  /**
   * Handle error via controller action
   */
  private static async handleViaController(
    config: ErrorPageConfig,
    statusCode: number,
    message?: string,
    details?: any,
    requestContext?: any
  ): Promise<void> {
    if (!config.controller || !config.action) return;

    try {
      // Get the controller class from registered controllers
      const router = (window as any).router;
      if (!router) {
        throw new Error('Router not available');
      }

      const registeredControllers = router.registeredControllers || new Map();
      const ControllerClass = registeredControllers.get(config.controller.toLowerCase());
      
      if (!ControllerClass) {
        throw new Error(`Controller ${config.controller} not found`);
      }

      // Create controller instance
      let controller: Controller;
      if (requestContext?.services) {
        controller = requestContext.services.getService(ControllerClass);
      } else {
        // Fallback creation (should not happen in normal operation)
        controller = new ControllerClass();
      }

      // Prepare error data
      const errorData = {
        statusCode,
        message: message || this.getDefaultMessage(statusCode),
        details,
        ...config.data
      };

      // Call the error action
      if (typeof controller[config.action] === 'function') {
        await controller[config.action](errorData);
      } else {
        throw new Error(`Action ${config.action} not found on controller ${config.controller}`);
      }

    } catch (error) {
      console.error('Controller-based error handling failed:', error);
      // Fallback to template or basic error
      if (config.template) {
        await this.handleViaTemplate(config, statusCode, message, details);
      } else {
        this.renderBasicError(statusCode, message);
      }
    }
  }

  /**
   * Handle error via template rendering
   */
  private static async handleViaTemplate(
    config: ErrorPageConfig,
    statusCode: number,
    message?: string,
    details?: any
  ): Promise<void> {
    if (!config.template) return;

    try {
      // Prepare template data
      const templateData = {
        statusCode,
        message: message || this.getDefaultMessage(statusCode),
        details,
        ...config.data
      };

      // Check if it's a file template or inline template
      if (config.template.includes('.njk')) {
        // File template
        const rendered = await ViewEngine.render(config.template, templateData);
        document.body.innerHTML = rendered;
      } else {
        // Inline template - render with simple variable substitution
        let rendered = config.template;
        
        // Simple template variable replacement
        rendered = rendered.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
          return (templateData as any)[key] || match;
        });
        
        document.body.innerHTML = rendered;
      }

      // Reinitialize HtmlHelper after DOM change
      HtmlHelper.reinitialize();

    } catch (error) {
      console.error('Template-based error handling failed:', error);
      this.renderBasicError(statusCode, message);
    }
  }

  /**
   * Render basic error without any external dependencies
   */
  private static renderBasicError(statusCode: number, message?: string): void {
    const defaultMessage = this.getDefaultMessage(statusCode);
    const errorMessage = message || defaultMessage;
    
    document.body.innerHTML = `
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h1 style="color: #e74c3c; font-size: 4em; margin: 0;">${statusCode}</h1>
        <h2 style="color: #2c3e50; margin: 20px 0;">Error</h2>
        <p style="color: #7f8c8d; font-size: 1.1em;">${errorMessage}</p>
        <a href="/" style="color: #3498db; text-decoration: none; font-size: 1.1em;">← Go Home</a>
      </div>
    `;

    // Reinitialize HtmlHelper after DOM change
    HtmlHelper.reinitialize();
  }

  /**
   * Get default error message for status code
   */
  private static getDefaultMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized - Authentication required',
      403: 'Forbidden - Access denied',
      404: 'Page Not Found',
      405: 'Method Not Allowed',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };

    return messages[statusCode] || 'An error occurred';
  }

  /**
   * Handle 404 errors specifically
   */
  static async handle404(message?: string, requestContext?: any): Promise<void> {
    await this.handleError(404, message, undefined, requestContext);
  }

  /**
   * Handle 500 errors specifically
   */
  static async handle500(error: Error, requestContext?: any): Promise<void> {
    await this.handleError(500, error.message, error, requestContext);
  }

  /**
   * Handle 403 errors specifically
   */
  static async handle403(message?: string, requestContext?: any): Promise<void> {
    await this.handleError(403, message, undefined, requestContext);
  }

  /**
   * Handle 401 errors specifically
   */
  static async handle401(message?: string, requestContext?: any): Promise<void> {
    await this.handleError(401, message, undefined, requestContext);
  }
}
