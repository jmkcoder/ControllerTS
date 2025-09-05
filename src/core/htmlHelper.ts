import { ControllerManager } from './controllerManager';

export class HtmlHelper {
  private static initialized = false;

  /**
   * MVC-style Html.Action equivalent for calling controller actions
   */
  static async Action(controllerName: string, actionName: string, data?: any): Promise<any> {
    try {
      const result = await ControllerManager.ajax(controllerName, actionName, data);
      
      // Handle redirects
      if (result.success && result.data && result.data.redirect) {
        
        if (result.data.route) {
          // Route-based redirect - use History API
          const path = result.data.route.startsWith('/') ? result.data.route : `/${result.data.route}`;

          if ((window as any).router && (window as any).router.navigateTo) {
            (window as any).router.navigateTo(path);
          } else {
            window.history.pushState({}, '', path);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        } else if (result.data.url) {
          // URL-based redirect
          window.location.href = result.data.url;
        } else if (result.data.action) {
          // Action-based redirect - use History API
          const route = result.data.controller ? 
            `/${result.data.controller.toLowerCase()}/${result.data.action}` : 
            `/${result.data.action}`;

          if ((window as any).router && (window as any).router.navigateTo) {
            (window as any).router.navigateTo(route);
          } else {
            window.history.pushState({}, '', route);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }
        
        return { success: true, redirected: true, redirect: result.data };
      }
      
      return result;
    } catch (error) {
      console.error('Html.Action error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
    
    // Use event delegation to handle dynamically loaded content
    document.addEventListener('click', async (event) => {
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
        const result = await this.Action(controller, action, data);
        
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
                `<div class="alert alert-success">${JSON.stringify(result.data, null, 2)}</div>`;
              targetElement.innerHTML = template.replace('{{result}}', JSON.stringify(result.data, null, 2));
            } else {
              const errorTemplate = target.getAttribute('mvc-error-template') || 
                `<div class="alert alert-error">Error: {{error}}</div>`;
              targetElement.innerHTML = errorTemplate.replace('{{error}}', result.error);
            }
          }
        }
        
        // Fire custom event
        const customEvent = new CustomEvent('mvc-action-complete', {
          detail: { controller, action, result, element: target }
        });
        document.dispatchEvent(customEvent);
        
      } catch (error) {
        console.error('MVC action failed:', error);
      } finally {
        // Restore button state
        target.textContent = originalText;
        target.removeAttribute('disabled');
      }
    });

    // Handle form submissions with mvc attributes
    document.addEventListener('submit', async (event) => {
      const target = event.target as HTMLFormElement;
      const controller = target.getAttribute('mvc-controller');
      const action = target.getAttribute('mvc-action');
      
      
      if (controller && action) {
        event.preventDefault();
        
        // Get form data
        const formData = new FormData(target);
        
        // Add loading state to submit button
        const submitButton = target.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          const originalText = submitButton.textContent;
          submitButton.textContent = 'Submitting...';
          submitButton.disabled = true;
          
          try {
            const result = await this.Action(controller, action, formData);
            
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
                    `<div class="alert alert-success">Success: {{result}}</div>`;
                  targetElement.innerHTML = template.replace('{{result}}', JSON.stringify(result.data, null, 2));
                  
                  // Reset form on success if specified
                  if (target.getAttribute('mvc-reset-on-success') === 'true') {
                    target.reset();
                  }
                } else {
                  const errorTemplate = target.getAttribute('mvc-error-template') || 
                    `<div class="alert alert-error">Error: {{error}}</div>`;
                  targetElement.innerHTML = errorTemplate.replace('{{error}}', result.error);
                }
              }
            }
            
            // Fire custom event
            const customEvent = new CustomEvent('mvc-form-submit-complete', {
              detail: { controller, action, result, form: target }
            });
            document.dispatchEvent(customEvent);
            
          } catch (error) {
            console.error('MVC form submission failed:', error);
          } finally {
            // Restore button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
          }
        }
      }
    });
  }
}

// Make HtmlHelper available globally
if (typeof window !== 'undefined') {
  (window as any).Html = HtmlHelper;
}
