/**
 * Example: How to configure custom error pages
 * This file shows different ways to set up error handling without modifying core router code
 */

import { configureErrorPages, setErrorPage } from './core/errorConfig';

/**
 * Method 1: Configure all error pages at once
 */
export function setupBasicErrorPages() {
  configureErrorPages({
    404: {
      template: 'views/errors/404.njk'
    },
    500: {
      template: 'views/errors/500.njk'
    },
    403: {
      template: 'views/errors/403.njk'
    }
  });
}

/**
 * Method 2: Configure error pages via controller actions
 */
export function setupControllerBasedErrorPages() {
  configureErrorPages({
    404: {
      controller: 'Error',
      action: 'notFound'
    },
    500: {
      controller: 'Error',
      action: 'serverError'
    },
    403: {
      controller: 'Error',
      action: 'forbidden'
    },
    401: {
      controller: 'Error',
      action: 'unauthorized'
    }
  });
}

/**
 * Method 3: Configure with inline templates
 */
export function setupInlineErrorPages() {
  configureErrorPages({
    404: {
      template: `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h1 style="color: #e74c3c; font-size: 4em;">{{statusCode}}</h1>
          <h2>{{message}}</h2>
          <p>Custom inline 404 page</p>
          <a href="/">Go Home</a>
        </div>
      `
    },
    500: {
      template: `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h1 style="color: #e74c3c; font-size: 4em;">{{statusCode}}</h1>
          <h2>{{message}}</h2>
          <p>Custom inline 500 page</p>
          <button onclick="location.reload()">Try Again</button>
          <a href="/">Go Home</a>
        </div>
      `
    }
  });
}

/**
 * Method 4: Configure individual error pages
 */
export function setupIndividualErrorPages() {
  // Set 404 with template
  setErrorPage(404, {
    template: 'views/errors/404.njk',
    data: {
      customMessage: 'This is a custom 404 message',
      showTechnicalDetails: true
    }
  });

  // Set 500 with controller
  setErrorPage(500, {
    controller: 'Error',
    action: 'serverError',
    data: {
      supportEmail: 'support@example.com'
    }
  });

  // Set 403 with inline template
  setErrorPage(403, {
    template: `
      <div style="text-align: center; padding: 50px;">
        <h1>🚫 Access Denied</h1>
        <p>You don't have permission to access this resource.</p>
        <a href="/login">Login</a> | <a href="/">Home</a>
      </div>
    `
  });
}

/**
 * Method 5: Environment-specific error pages
 */
export function setupEnvironmentSpecificErrorPages() {
  const isDevelopment = window.location.hostname === 'localhost';
  
  if (isDevelopment) {
    // Development: Show detailed error information
    configureErrorPages({
      404: {
        controller: 'Error',
        action: 'developmentError',
        data: { 
          environment: 'development',
          showStackTrace: true,
          showDebugInfo: true
        }
      },
      500: {
        controller: 'Error',
        action: 'developmentError',
        data: { 
          environment: 'development',
          showStackTrace: true,
          showDebugInfo: true
        }
      }
    });
  } else {
    // Production: Show user-friendly error pages
    configureErrorPages({
      404: {
        template: 'views/errors/404.njk',
        data: {
          environment: 'production',
          supportEmail: 'support@example.com'
        }
      },
      500: {
        template: 'views/errors/500.njk',
        data: {
          environment: 'production',
          supportEmail: 'support@example.com',
          trackingId: `error-${Date.now()}`
        }
      }
    });
  }
}

/**
 * Method 6: Advanced error pages with custom data
 */
export function setupAdvancedErrorPages() {
  configureErrorPages({
    404: {
      template: 'views/errors/404.njk',
      data: {
        suggestions: [
          'Check the URL for typos',
          'Go back to the previous page',
          'Visit our homepage',
          'Contact support'
        ],
        searchEnabled: true,
        contactInfo: {
          email: 'help@example.com',
          phone: '1-800-HELP'
        }
      }
    },
    500: {
      controller: 'Error',
      action: 'serverError',
      data: {
        incident: {
          timestamp: new Date().toISOString(),
          id: () => `INC-${Date.now()}`,
          reportingEnabled: true
        },
        recovery: {
          autoRetry: true,
          retryDelay: 3000,
          maxRetries: 3
        }
      }
    },
    403: {
      template: 'views/errors/403.njk',
      data: {
        loginUrl: '/login',
        registerUrl: '/register',
        helpUrl: '/help/permissions',
        contactSupport: true
      }
    }
  });
}

// Example usage in main.ts:
// import { setupBasicErrorPages } from './errorPagesConfig';
// setupBasicErrorPages();
