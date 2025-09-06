import { Controller } from '../core/controller';
import { action } from '../core/decorators';

/**
 * Error Controller
 * Handles error pages via controller actions
 * This provides an alternative to template-only error handling
 */
export class ErrorController extends Controller {
  
  /**
   * Handle 404 errors
   */
  @action('404')
  async notFound(errorData?: any): Promise<void> {
    const data = {
      title: '404 - Page Not Found',
      statusCode: errorData?.statusCode || 404,
      message: errorData?.message || 'The page you are looking for could not be found.',
      details: errorData?.details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...errorData
    };

    await this.View('views/errors/404.njk', data);
  }

  /**
   * Handle 500 errors
   */
  @action('500')
  async serverError(errorData?: any): Promise<void> {
    const data = {
      title: '500 - Server Error',
      statusCode: errorData?.statusCode || 500,
      message: errorData?.message || 'An internal server error occurred.',
      details: errorData?.details,
      timestamp: new Date().toISOString(),
      ...errorData
    };

    await this.View('views/errors/500.njk', data);
  }

  /**
   * Handle 403 errors
   */
  @action('403')
  async forbidden(errorData?: any): Promise<void> {
    const data = {
      title: '403 - Access Forbidden',
      statusCode: errorData?.statusCode || 403,
      message: errorData?.message || 'You do not have permission to access this resource.',
      details: errorData?.details,
      timestamp: new Date().toISOString(),
      ...errorData
    };

    await this.View('views/errors/403.njk', data);
  }

  /**
   * Handle 401 errors
   */
  @action('401')
  async unauthorized(errorData?: any): Promise<void> {
    const data = {
      title: '401 - Unauthorized',
      statusCode: errorData?.statusCode || 401,
      message: errorData?.message || 'Authentication is required to access this resource.',
      details: errorData?.details,
      timestamp: new Date().toISOString(),
      ...errorData
    };

    // For 401 errors, we might want to redirect to login after showing the error
    // Or render a login form directly
    await this.View('views/errors/403.njk', data); // Reusing 403 template for now
  }

  /**
   * Generic error handler
   */
  @action('generic')
  async genericError(errorData?: any): Promise<void> {
    const statusCode = errorData?.statusCode || 500;
    const data = {
      title: `${statusCode} - Error`,
      statusCode,
      message: errorData?.message || 'An error occurred.',
      details: errorData?.details,
      timestamp: new Date().toISOString(),
      ...errorData
    };

    // Choose template based on status code
    let template = 'views/errors/500.njk'; // Default to 500 template
    
    if (statusCode === 404) {
      template = 'views/errors/404.njk';
    } else if (statusCode === 403) {
      template = 'views/errors/403.njk';
    }

    await this.View(template, data);
  }

  /**
   * Development error page with more details
   */
  @action('dev')
  async developmentError(errorData?: any): Promise<void> {
    const data = {
      title: 'Development Error',
      statusCode: errorData?.statusCode || 500,
      message: errorData?.message || 'Development Error',
      details: errorData?.details,
      stack: errorData?.details?.stack,
      timestamp: new Date().toISOString(),
      environment: 'development',
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...errorData
    };

    await this.View('views/errors/500.njk', data);
  }
}
