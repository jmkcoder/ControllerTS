import { ControllerManager } from './controllerManager';
import { isObjectAction, getRegisteredRoutes } from './decorators';
import { ActionValidator } from './actionValidator';

export class HtmlHelper {
  private static initialized = false;
  private static clickHandler: ((event: Event) => void) | null = null;
  private static submitHandler: ((event: Event) => void) | null = null;

  /**
   * MVC-style Html.Action equivalent for calling controller actions
   * Handles both view actions and object actions with proper validation
   */
  static async Action(controllerName: string, actionName: string, data?: any): Promise<any> {
    try {
      // Check if this is an object action
      const isObjectOnly = isObjectAction(controllerName, actionName);
      
      if (isObjectOnly) {
        // Object actions cannot be called from templates for rendering
        console.warn(`⚠️  Object action ${controllerName}.${actionName} called from template. Object actions should only be used for AJAX/API calls.`);
        return { 
          success: false, 
          error: `Object action ${controllerName}.${actionName} cannot be used for template rendering. Use a regular @action instead.` 
        };
      }

      const result = await ControllerManager.callAction(controllerName, actionName, data);
      
      // Validate the result
      const validation = ActionValidator.validateActionResult(controllerName, actionName, result);
      
      if (!validation.isValid) {
        console.error(`❌ Action validation failed: ${validation.error}`);
        return { 
          success: false, 
          error: validation.error 
        };
      }
      
      // Handle redirects
      if (result && typeof result === 'object' && result.redirect) {
        
        if (result.route) {
          // Route-based redirect - use History API
          const path = result.route.startsWith('/') ? result.route : `/${result.route}`;

          if ((window as any).router && (window as any).router.navigateTo) {
            (window as any).router.navigateTo(path);
          } else {
            window.history.pushState({}, '', path);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        } else if (result.url) {
          // URL-based redirect
          window.location.href = result.url;
        } else if (result.action) {
          // Action-based redirect - use History API
          const route = result.controller ? 
            `/${result.controller.toLowerCase()}/${result.action}` : 
            `/${controllerName.toLowerCase()}/${result.action}`;

          if ((window as any).router && (window as any).router.navigateTo) {
            (window as any).router.navigateTo(route);
          } else {
            window.history.pushState({}, '', route);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }
        
        return { success: true, redirected: true, redirect: result };
      }
      
      // Handle JSON results from view actions
      if (result && typeof result === 'object' && result.json) {
        return { success: true, data: result.data };
      }
      
      // Return the processed result
      return { success: true, data: validation.processedResult };
    } catch (error) {
      console.error('Html.Action error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Make AJAX calls to object actions or regular actions
   * This is the proper way to call object actions from JavaScript
   */
  static async Ajax(controllerName: string, actionName: string, data?: any): Promise<any> {
    try {
      const result = await ControllerManager.callAction(controllerName, actionName, data);
      
      // Validate the result
      const validation = ActionValidator.validateActionResult(controllerName, actionName, result);
      
      if (!validation.isValid) {
        console.error(`❌ Action validation failed: ${validation.error}`);
        return { 
          success: false, 
          error: validation.error 
        };
      }
      
      // For object actions, return the processed result directly
      const isObjectOnly = isObjectAction(controllerName, actionName);
      if (isObjectOnly) {
        return { 
          success: true, 
          data: validation.processedResult 
        };
      }
      
      // For view actions, handle different result types
      if (result && typeof result === 'object') {
        if (result.redirect) {
          return { success: true, redirected: true, redirect: result };
        } else if (result.json) {
          return { success: true, data: result.data };
        }
      }
      
      return { success: true, data: validation.processedResult };
    } catch (error) {
      console.error('Html.Ajax error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Navigate to a controller action using the router
   */
  static navigateToAction(controllerName: string, actionName?: string, queryParams?: Record<string, string>): void {
    // Build the route path
    let route: string;
    if (actionName && actionName !== 'execute' && actionName !== 'index') {
      route = `/${controllerName.toLowerCase()}/${actionName}`;
    } else {
      route = `/${controllerName.toLowerCase()}`;
    }
    
    // Add query parameters if provided
    if (queryParams && Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        searchParams.set(key, value);
      });
      route += `?${searchParams.toString()}`;
    }
    
    // Use router navigation
    if ((window as any).router && (window as any).router.navigateTo) {
      (window as any).router.navigateTo(route);
    } else {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  /**
   * Initialize MVC attribute bindings for automatic controller action calls
   */
  static initializeMvcAttributes(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    
    // Remove existing event listeners if they exist
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
    }
    if (this.submitHandler) {
      document.removeEventListener('submit', this.submitHandler);
    }
    
    // Create new event handlers
    this.clickHandler = async (event) => {
      const target = event.target;
      
      // Check if target is an HTMLElement
      if (!target || !(target instanceof HTMLElement)) {
        return;
      }
      
      const controller = target.getAttribute('mvc-controller');
      const action = target.getAttribute('mvc-action');
      
      // Only process if both attributes are present
      if (!controller || !action) {
        return;
      }
      
      event.preventDefault();
      event.stopPropagation();  // Prevent other handlers from interfering
      
      // Check if this is an object action
      const isObjectOnly = isObjectAction(controller, action);
      
      // Get additional data from attributes
      const dataAttr = target.getAttribute('mvc-data');
      let data = {};
      
      if (dataAttr) {
        try {
          data = JSON.parse(dataAttr);
        } catch (e) {
          console.warn('Invalid JSON in mvc-data attribute:', dataAttr);
        }
      }
      
      // Add loading state
      const originalText = target.textContent;
      const loadingText = target.getAttribute('mvc-loading-text') || 'Loading...';
      target.textContent = loadingText;
      target.setAttribute('disabled', 'true');
      
      try {
        // Use appropriate method based on action type
        let result: any;
        if (isObjectOnly) {
          // Object actions should use Ajax method
          result = await this.Ajax(controller, action, data);
        } else {
          // View actions use Action method (may redirect or render)
          result = await this.Action(controller, action, data);
        }
        
        // Handle redirects
        if (result.redirected) {
          return; // Don't update UI for redirects
        }
        
        // Handle result based on mvc-result-target
        const resultTarget = target.getAttribute('mvc-result-target');
        
        if (resultTarget) {
          const targetElement = document.getElementById(resultTarget);
          
          if (targetElement) {
            if (result.success) {
              const template = target.getAttribute('mvc-success-template') || 
                (isObjectOnly ? 
                  `<div class="alert alert-success"><pre>{{result}}</pre></div>` :
                  `<div class="alert alert-success">{{result}}</div>`);
              
              const resultText = isObjectOnly ? 
                JSON.stringify(result.data, null, 2) : 
                (typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : String(result.data));
              
              // More robust template replacement - handle HTML entities but preserve structure
              let processedTemplate = template;
              
              // Decode only the specific placeholders, not the entire HTML
              processedTemplate = processedTemplate
                .replace(/&\{&\{result&\}&\}/g, '{{result}}')  // Decode &{&{result&}&}
                .replace(/&#123;&#123;result&#125;&#125;/g, '{{result}}')  // Decode &#123;&#123;result&#125;&#125;
                .replace(/&lt;&lt;result&gt;&gt;/g, '{{result}}')  // Decode &lt;&lt;result&gt;&gt;
                .replace(/\{\{result\}\}/g, resultText);  // Replace the placeholder
              
              targetElement.innerHTML = processedTemplate;
            } else {
              const errorTemplate = target.getAttribute('mvc-error-template') || 
                `<div class="alert alert-error">Error: {{error}}</div>`;
              
              // More robust template replacement for errors - handle HTML entities but preserve structure
              let processedErrorTemplate = errorTemplate;
              processedErrorTemplate = processedErrorTemplate
                .replace(/&\{&\{error&\}&\}/g, '{{error}}')  // Decode &{&{error&}&}
                .replace(/&#123;&#123;error&#125;&#125;/g, '{{error}}')  // Decode &#123;&#123;error&#125;&#125;
                .replace(/&lt;&lt;error&gt;&gt;/g, '{{error}}')  // Decode &lt;&lt;error&gt;&gt;
                .replace(/\{\{error\}\}/g, result.error || 'Unknown error');
              
              targetElement.innerHTML = processedErrorTemplate;
            }
          } else {
            console.error('🔧 HtmlHelper: Could not find target element with ID:', resultTarget);
          }
        } else {
          console.log('🔧 HtmlHelper: No result target specified for this button');
        }
        
        // Fire custom event with action type information
        const customEvent = new CustomEvent('mvc-action-complete', {
          detail: { controller, action, result, element: target, isObjectAction: isObjectOnly }
        });
        document.dispatchEvent(customEvent);
        
      } catch (error) {
        console.error('MVC action failed:', error);
        
        // Show error in result target if available
        const resultTarget = target.getAttribute('mvc-result-target');
        if (resultTarget) {
          const targetElement = document.getElementById(resultTarget);
          if (targetElement) {
            const errorTemplate = target.getAttribute('mvc-error-template') || 
              `<div class="alert alert-error">Error: {{error}}</div>`;
            
            // More robust template replacement for button click errors - decode HTML entities first
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = errorTemplate;
            const decodedErrorTemplate = tempDiv.textContent || tempDiv.innerText || errorTemplate;
            
            let processedErrorTemplate = decodedErrorTemplate;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            processedErrorTemplate = processedErrorTemplate.replace(/\{\{error\}\}/g, errorMessage);
            
            targetElement.innerHTML = processedErrorTemplate;
          }
        }
      } finally {
        // Restore button state
        target.textContent = originalText;
        target.removeAttribute('disabled');
      }
    };

    // Create submit handler
    this.submitHandler = async (event) => {
      const target = event.target as HTMLFormElement;
      const controller = target.getAttribute('mvc-controller');
      const action = target.getAttribute('mvc-action');
      
      
      if (controller && action) {
        event.preventDefault();
        
        // Check if this is an object action
        const isObjectOnly = isObjectAction(controller, action);
        
        // Get form data
        const formData = new FormData(target);
        const formDataObject = Object.fromEntries(formData.entries());
        
        // Add loading state to submit button
        const submitButton = target.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          const originalText = submitButton.textContent;
          submitButton.textContent = 'Submitting...';
          submitButton.disabled = true;
          
          try {
            // Use appropriate method based on action type
            let result: any;
            if (isObjectOnly) {
              // Object actions should use Ajax method
              result = await this.Ajax(controller, action, formDataObject);
            } else {
              // View actions use Action method (may redirect or render)
              result = await this.Action(controller, action, formDataObject);
            }
            
            // Handle redirects
            if (result.redirected) {
              return; // Don't update UI for redirects
            }
            
            // Handle result
            const resultTarget = target.getAttribute('mvc-result-target');
            if (resultTarget) {
              const targetElement = document.getElementById(resultTarget);
              if (targetElement) {
                if (result.success) {
                  const template = target.getAttribute('mvc-success-template') || 
                    (isObjectOnly ? 
                      `<div class="alert alert-success">Success: <pre>{{result}}</pre></div>` :
                      `<div class="alert alert-success">Success: {{result}}</div>`);
                  
                  const resultText = isObjectOnly ? 
                    JSON.stringify(result.data, null, 2) : 
                    (typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : String(result.data));
                    
                  // More robust template replacement for forms - handle HTML entities but preserve structure
                  let processedTemplate = template;
                  processedTemplate = processedTemplate
                    .replace(/&\{&\{result&\}&\}/g, '{{result}}')  // Decode &{&{result&}&}
                    .replace(/&#123;&#123;result&#125;&#125;/g, '{{result}}')  // Decode &#123;&#123;result&#125;&#125;
                    .replace(/&lt;&lt;result&gt;&gt;/g, '{{result}}')  // Decode &lt;&lt;result&gt;&gt;
                    .replace(/\{\{result\}\}/g, resultText);
                  
                  targetElement.innerHTML = processedTemplate;
                  
                  // Reset form on success if specified
                  if (target.getAttribute('mvc-reset-on-success') === 'true') {
                    target.reset();
                  }
                } else {
                  const errorTemplate = target.getAttribute('mvc-error-template') || 
                    `<div class="alert alert-error">Error: {{error}}</div>`;
                  
                  // More robust template replacement for form errors - handle HTML entities but preserve structure
                  let processedErrorTemplate = errorTemplate;
                  processedErrorTemplate = processedErrorTemplate
                    .replace(/&\{&\{error&\}&\}/g, '{{error}}')  // Decode &{&{error&}&}
                    .replace(/&#123;&#123;error&#125;&#125;/g, '{{error}}')  // Decode &#123;&#123;error&#125;&#125;
                    .replace(/&lt;&lt;error&gt;&gt;/g, '{{error}}')  // Decode &lt;&lt;error&gt;&gt;
                    .replace(/\{\{error\}\}/g, result.error || 'Unknown error');
                  
                  targetElement.innerHTML = processedErrorTemplate;
                }
              }
            }
            
            // Fire custom event with action type information
            const customEvent = new CustomEvent('mvc-form-submit-complete', {
              detail: { controller, action, result, form: target, isObjectAction: isObjectOnly }
            });
            document.dispatchEvent(customEvent);
            
          } catch (error) {
            console.error('MVC form submission failed:', error);
            
            // Show error in result target if available
            const resultTarget = target.getAttribute('mvc-result-target');
            if (resultTarget) {
              const targetElement = document.getElementById(resultTarget);
              if (targetElement) {
                const errorTemplate = target.getAttribute('mvc-error-template') || 
                  `<div class="alert alert-error">Error: {{error}}</div>`;
                
                // More robust template replacement for catch errors - decode HTML entities first
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = errorTemplate;
                const decodedErrorTemplate = tempDiv.textContent || tempDiv.innerText || errorTemplate;
                
                let processedErrorTemplate = decodedErrorTemplate;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                processedErrorTemplate = processedErrorTemplate.replace(/\{\{error\}\}/g, errorMessage);
                
                targetElement.innerHTML = processedErrorTemplate;
              }
            }
          } finally {
            // Restore button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
          }
        }
      }
    };

    // Add event listeners to document
    document.addEventListener('click', this.clickHandler);
    document.addEventListener('submit', this.submitHandler);
  }

  /**
   * Reinitialize MVC attributes after DOM content changes
   * This is called automatically by ViewEngine after rendering new views
   */
  static reinitialize(): void {
    // Reset the initialized flag so we can initialize again
    this.initialized = false;
    
    // Reinitialize the MVC attributes
    this.initializeMvcAttributes();
    
    // Make sure it's available globally after reinitialization
    (window as any).Html = HtmlHelper;
  }
}

// Make HtmlHelper available globally
if (typeof window !== 'undefined') {
  (window as any).Html = HtmlHelper;
}
