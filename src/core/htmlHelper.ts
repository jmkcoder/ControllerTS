import { ControllerManager } from './controllerManager';
import { isObjectAction, getRegisteredRoutes } from './decorators';
import { ActionValidator } from './actionValidator';
import { ModelValidator } from './modelValidator';

export class HtmlHelper {
  private static initialized = false;
  private static clickHandler: ((event: Event) => void) | null = null;
  private static submitHandler: ((event: Event) => void) | null = null;

  /**
   * Processes template strings to handle various encoding formats from Nunjucks
   * @param template The template string containing placeholders
   * @param resultText The text to replace {{result}} with
   * @param errorText The text to replace {{error}} with (optional)
   * @returns Processed template with placeholders replaced
   */
  private static processTemplate(template: string, resultText?: string, errorText?: string): string {
    let processed = template;

    // Handle the new @result and @error format (recommended)
    if (resultText !== undefined) {
      processed = processed.replace(/@result/g, resultText);
    }
    if (errorText !== undefined) {
      processed = processed.replace(/@error/g, errorText);
    }

    // Handle Nunjucks escaped patterns for backwards compatibility
    processed = processed
      .replace(/\{\{"\{"}\}\{\{"\{"}\}result\{\{"\}"}\}\{\{"\}"}\}/g, '{{result}}')  // {{"{"}}{{"{"}}result{{"}"}}{{"}"}
      .replace(/\{\{"\{"}\}\{\{"\{"}\}error\{\{"\}"}\}\{\{"\}"}\}/g, '{{error}}');   // {{"{"}}{{"{"}}error{{"}"}}{{"}"}

    // Handle HTML entity encoded patterns for backwards compatibility
    processed = processed
      .replace(/&\{&\{result&\}&\}/g, '{{result}}')  // &{&{result&}&}
      .replace(/&#123;&#123;result&#125;&#125;/g, '{{result}}')  // &#123;&#123;result&#125;&#125;
      .replace(/&lt;&lt;result&gt;&gt;/g, '{{result}}')  // &lt;&lt;result&gt;&gt;
      .replace(/&\{&\{error&\}&\}/g, '{{error}}')  // &{&{error&}&}
      .replace(/&#123;&#123;error&#125;&#125;/g, '{{error}}')  // &#123;&#123;error&#125;&#125;
      .replace(/&lt;&lt;error&gt;&gt;/g, '{{error}}');  // &lt;&lt;error&gt;&gt;

    // Replace legacy {{result}} and {{error}} placeholders for backwards compatibility
    if (resultText !== undefined) {
      processed = processed.replace(/\{\{result\}\}/g, resultText);
    }
    if (errorText !== undefined) {
      processed = processed.replace(/\{\{error\}\}/g, errorText);
    }

    return processed;
  }

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
      
      // If the controller explicitly sets success: false, preserve that
      if (result && typeof result === 'object' && result.hasOwnProperty('success')) {
        return result;
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
        // If the controller already returned a success/failure structure, use it as-is
        if (validation.processedResult && typeof validation.processedResult === 'object' && 
            'success' in validation.processedResult) {
          return validation.processedResult;
        }
        
        // Otherwise, wrap in success structure (legacy behavior)
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
        } else if (result.hasOwnProperty('success')) {
          // If the controller explicitly sets success: false, preserve that
          return result;
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
      
      // Add loading state - preserve HTML structure for icons
      const originalHTML = target.innerHTML;
      const loadingText = target.getAttribute('mvc-loading-text') || 'Loading...';
      target.innerHTML = loadingText;
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
              
              // Process template with centralized logic
              const processedTemplate = HtmlHelper.processTemplate(template, resultText);
              
              targetElement.innerHTML = processedTemplate;
            } else {
              const errorTemplate = target.getAttribute('mvc-error-template') || 
                `<div class="alert alert-error">Error: {{error}}</div>`;
              
              // Process template with centralized logic
              const processedErrorTemplate = HtmlHelper.processTemplate(errorTemplate, undefined, result.error || 'Unknown error');
              
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
            
            // Process template with centralized logic
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const processedErrorTemplate = HtmlHelper.processTemplate(errorTemplate, undefined, errorMessage);
            
            targetElement.innerHTML = processedErrorTemplate;
          }
        }
      } finally {
        // Restore button state
        target.innerHTML = originalHTML;
        target.removeAttribute('disabled');
      }
    };

    // Create submit handler - intercept ALL form submissions
    this.submitHandler = async (event) => {
      console.log('🚀 Form submit event intercepted!', event);
      const target = event.target as HTMLFormElement;
      const controller = target.getAttribute('mvc-controller');
      const action = target.getAttribute('mvc-action');
      
      console.log('📋 Form attributes:', { controller, action, tagName: target.tagName });
      
      // If no MVC attributes, try to infer from form action or URL
      let finalController = controller;
      let finalAction = action;
      
      if (!controller || !action) {
        // Try to extract from form action attribute
        const formAction = target.getAttribute('action');
        if (formAction && formAction !== '#' && formAction !== '') {
          const actionParts = formAction.split('/').filter(part => part.length > 0);
          if (actionParts.length >= 2) {
            finalController = actionParts[0];
            finalAction = actionParts[1];
          } else if (actionParts.length === 1) {
            // Could be just action, infer controller from current route
            const currentPath = window.location.pathname;
            const currentParts = currentPath.split('/').filter(part => part.length > 0);
            finalController = currentParts[0] || 'home';
            finalAction = actionParts[0];
          }
        } else {
          // No form action, infer from current URL
          const currentPath = window.location.pathname;
          const currentParts = currentPath.split('/').filter(part => part.length > 0);
          finalController = currentParts[0] || 'home';
          finalAction = currentParts[1] || 'index';
          
          // For submission, typically want a POST action
          if (finalAction === 'index') {
            finalAction = 'submit';
          }
        }
      }
      
      console.log('🎯 Final route determined:', { finalController, finalAction });
      
      if (finalController && finalAction) {
        event.preventDefault();
        console.log('✅ Form submission prevented, processing...');
        
        // Check if this is an object action
        const isObjectOnly = isObjectAction(finalController, finalAction);
        
        // Get form data
        const formData = new FormData(target);
        const formDataObject = Object.fromEntries(formData.entries());
        
        // Add loading state to submit button
        const submitButton = target.querySelector('button[type="submit"]') as HTMLButtonElement;
        let originalHTML = '';
        if (submitButton) {
          originalHTML = submitButton.innerHTML || '';
          submitButton.innerHTML = 'Submitting...';
          submitButton.disabled = true;
        }
        
        try {
          // Use appropriate method based on action type
          let result: any;
          if (isObjectOnly) {
            // Object actions should use Ajax method
            result = await this.Ajax(finalController, finalAction, formDataObject);
          } else {
            // View actions use Action method (may redirect or render)
            result = await this.Action(finalController, finalAction, formDataObject);
          }
          
          console.log('📋 Action result received:', result);
          
          // Handle redirects
          if (result.redirected) {
            return; // Don't update UI for redirects
          }
          
          // Handle result - look for result target or create one
          let resultTarget = target.getAttribute('mvc-result-target');
          let targetElement: HTMLElement | null = null;
          
          if (resultTarget) {
            targetElement = document.getElementById(resultTarget);
          } else {
            // Look for common result containers
            targetElement = target.querySelector('.validation-summary') as HTMLElement ||
                           target.querySelector('.alert') as HTMLElement ||
                           target.parentElement?.querySelector('.validation-summary') as HTMLElement ||
                           target.parentElement?.querySelector('.alert') as HTMLElement;
            
            // If no result container found, create one at the top of the form
            if (!targetElement) {
              targetElement = document.createElement('div');
              targetElement.className = 'validation-summary';
              targetElement.id = 'form-validation-result';
              target.insertBefore(targetElement, target.firstChild);
            }
          }
          
          if (targetElement) {
            // Always show the result target element
            targetElement.classList.remove('d-none');
            targetElement.style.display = 'block';
            
            if (result.success) {
              // Clear any existing validation errors on success
              target.querySelectorAll('.invalid-feedback').forEach((el: Element) => {
                el.remove();
              });
              target.querySelectorAll('.is-invalid').forEach((el: Element) => {
                el.classList.remove('is-invalid');
              });
              target.querySelectorAll('.border-red-500').forEach((el: Element) => {
                el.classList.remove('border-red-500', 'focus:border-red-500');
              });
              
              const template = target.getAttribute('mvc-success-template') || 
                (isObjectOnly ? 
                  `<div class="alert alert-success">Success: <pre>{{result}}</pre></div>` :
                  `<div class="alert alert-success">Success: {{result}}</div>`);
              
              const resultText = isObjectOnly ? 
                JSON.stringify(result.data, null, 2) : 
                (typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : String(result.data));
                
              // Process template with centralized logic
              const processedTemplate = HtmlHelper.processTemplate(template, resultText);
              
              targetElement.innerHTML = processedTemplate;
              
              // Reset form on success if specified or by default
              if (target.getAttribute('mvc-reset-on-success') !== 'false') {
                target.reset();
              }
            } else {
              console.log('🔍 Processing validation errors:', result);
              
              // Handle validation errors - display them next to form fields
              if (result.errors && Array.isArray(result.errors)) {
                
                // Clear any existing validation messages
                target.querySelectorAll('.invalid-feedback').forEach((el: Element) => {
                  el.remove();
                });
                
                // Clear any existing invalid classes (Bootstrap and Tailwind)
                target.querySelectorAll('.is-invalid').forEach((el: Element) => {
                  el.classList.remove('is-invalid');
                });
                target.querySelectorAll('.border-red-500').forEach((el: Element) => {
                  el.classList.remove('border-red-500', 'focus:border-red-500');
                });
                
                // Add validation errors to each field
                result.errors.forEach((error: any) => {
                  const fieldName = error.property || error.field || error.propertyName;
                  const errorMessage = error.message || error.error;
                  
                  if (fieldName && errorMessage) {
                    // Find the input field
                    const inputElement = target.querySelector(`[name="${fieldName}"]`) as HTMLElement;
                    
                    if (inputElement) {
                      // Add invalid classes (both Bootstrap and Tailwind)
                      inputElement.classList.add('is-invalid', 'border-red-500', 'focus:border-red-500');
                      
                      // Create validation message element
                      const validationDiv = document.createElement('div');
                      validationDiv.className = 'invalid-feedback d-block text-red-600 text-sm mt-1';
                      validationDiv.innerHTML = `<span class="text-red-500">⚠️</span> ${errorMessage}`;
                      validationDiv.style.display = 'block';
                      validationDiv.style.color = '#dc3545';
                      validationDiv.style.fontSize = '0.875em';
                      validationDiv.style.marginTop = '0.25rem';
                      
                      // Find the best place to insert the validation message
                      let insertAfter = inputElement;
                      
                      // Check if there's a form-text element after the input
                      const nextSibling = inputElement.nextElementSibling;
                      if (nextSibling && (nextSibling.classList.contains('form-text') || nextSibling.classList.contains('text-sm'))) {
                        insertAfter = nextSibling as HTMLElement;
                      }
                      
                      // Insert validation message after the input (or form-text)
                      insertAfter.parentNode?.insertBefore(validationDiv, insertAfter.nextSibling);
                    } else {
                      console.warn('⚠️ Could not find input element for field:', fieldName);
                    }
                  }
                });
                
                // Update result target with general error message
                const errorTemplate = target.getAttribute('mvc-error-template') || 
                  `<div class="alert alert-danger text-red-600 bg-red-50 border border-red-200 rounded-lg p-4"><h4>Please correct the following errors:</h4><p>{{error}}</p></div>`;
                
                const processedErrorTemplate = HtmlHelper.processTemplate(errorTemplate, undefined, result.message || 'Validation failed');
                
                targetElement.innerHTML = processedErrorTemplate;
              } else {
                // General error handling
                const errorTemplate = target.getAttribute('mvc-error-template') || 
                  `<div class="alert alert-danger text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">Error: {{error}}</div>`;
                
                const processedErrorTemplate = HtmlHelper.processTemplate(errorTemplate, undefined, result.error || 'Unknown error');
                
                targetElement.innerHTML = processedErrorTemplate;
              }
            }
          }
          
          // Fire custom event with action type information
          const customEvent = new CustomEvent('mvc-form-submit-complete', {
            detail: { controller: finalController, action: finalAction, result, form: target, isObjectAction: isObjectOnly }
          });
          document.dispatchEvent(customEvent);
          
        } catch (error) {
          console.error('MVC form submission failed:', error);
          
          // Find or create result target for error display
          let resultTarget = target.getAttribute('mvc-result-target');
          let targetElement: HTMLElement | null = null;
          
          if (resultTarget) {
            targetElement = document.getElementById(resultTarget);
          } else {
            targetElement = target.querySelector('.validation-summary') as HTMLElement ||
                           target.querySelector('.alert') as HTMLElement;
            
            if (!targetElement) {
              targetElement = document.createElement('div');
              targetElement.className = 'validation-summary';
              target.insertBefore(targetElement, target.firstChild);
            }
          }
          
          if (targetElement) {
            const errorTemplate = target.getAttribute('mvc-error-template') || 
              `<div class="alert alert-danger text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">Error: {{error}}</div>`;
            
            // Process template with centralized logic
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const processedErrorTemplate = HtmlHelper.processTemplate(errorTemplate, undefined, errorMessage);
            
            targetElement.innerHTML = processedErrorTemplate;
          }
        } finally {
          // Restore button state
          if (submitButton) {
            submitButton.innerHTML = originalHTML;
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

  // ========== FORM HELPER METHODS (ASP.NET MVC Style) ==========

  /**
   * Creates an HTML form that submits to an MVC action
   * @param action The action name
   * @param controller The controller name (optional, defaults to current)
   * @param options Form options including method, validation, etc.
   * @returns HTML string for form opening tag
   */
  static BeginForm(action: string, controller?: string, options?: {
    method?: 'GET' | 'POST';
    htmlAttributes?: Record<string, any>;
    validateAntiForgeryToken?: boolean;
    resultTarget?: string;
    successTemplate?: string;
    errorTemplate?: string;
    resetOnSuccess?: boolean;
    loadingText?: string;
  }): string {
    const formOptions = {
      method: 'POST',
      htmlAttributes: {},
      validateAntiForgeryToken: false,
      ...options
    };

    const controllerName = controller || 'Home';
    const methodAttr = formOptions.method.toLowerCase();
    
    // Build form attributes
    const attrs: Record<string, string> = {
      'mvc-controller': controllerName,
      'mvc-action': action,
      'method': methodAttr,
      ...formOptions.htmlAttributes
    };

    // Add optional MVC attributes
    if (formOptions.resultTarget) attrs['mvc-result-target'] = formOptions.resultTarget;
    if (formOptions.successTemplate) attrs['mvc-success-template'] = formOptions.successTemplate;
    if (formOptions.errorTemplate) attrs['mvc-error-template'] = formOptions.errorTemplate;
    if (formOptions.resetOnSuccess) attrs['mvc-reset-on-success'] = 'true';
    if (formOptions.loadingText) attrs['mvc-loading-text'] = formOptions.loadingText;

    // Convert attributes to HTML string
    const attrString = Object.entries(attrs)
      .map(([key, value]) => `${key}="${this.escapeHtml(value)}"`)
      .join(' ');

    return `<form ${attrString}>`;
  }

  /**
   * Closes the form tag
   * @returns HTML string for form closing tag
   */
  static EndForm(): string {
    return '</form>';
  }

  /**
   * Creates a text input field with validation support
   * @param name The field name
   * @param value The field value
   * @param modelClass Optional model class for validation attributes
   * @param htmlAttributes Additional HTML attributes
   * @returns HTML string for text input
   */
  static TextBox(name: string, value?: any, modelClass?: any, htmlAttributes?: Record<string, any>): string {
    const attrs: Record<string, string> = {
      type: 'text',
      name: name,
      id: name,
      class: 'form-control',
      ...htmlAttributes
    };

    if (value !== undefined && value !== null) {
      attrs.value = String(value);
    }

    // Add validation attributes if model class provided
    if (modelClass) {
      const validationAttrs = ModelValidator.getValidationAttributes(modelClass, name);
      Object.assign(attrs, validationAttrs);
    }

    const attrString = Object.entries(attrs)
      .map(([key, val]) => `${key}="${this.escapeHtml(String(val))}"`)
      .join(' ');

    return `<input ${attrString}>`;
  }

  /**
   * Creates an email input field with validation support
   * @param name The field name
   * @param value The field value
   * @param modelClass Optional model class for validation attributes
   * @param htmlAttributes Additional HTML attributes
   * @returns HTML string for email input
   */
  static EmailBox(name: string, value?: any, modelClass?: any, htmlAttributes?: Record<string, any>): string {
    const attrs = { type: 'email', autocomplete: 'email', ...htmlAttributes };
    return this.TextBox(name, value, modelClass, attrs);
  }

  /**
   * Creates a password input field with validation support
   * @param name The field name
   * @param modelClass Optional model class for validation attributes
   * @param htmlAttributes Additional HTML attributes
   * @returns HTML string for password input
   */
  static Password(name: string, modelClass?: any, htmlAttributes?: Record<string, any>): string {
    const attrs = { type: 'password', autocomplete: 'new-password', ...htmlAttributes };
    return this.TextBox(name, '', modelClass, attrs);
  }

  /**
   * Creates a textarea field with validation support
   * @param name The field name
   * @param value The field value
   * @param modelClass Optional model class for validation attributes
   * @param htmlAttributes Additional HTML attributes
   * @returns HTML string for textarea
   */
  static TextArea(name: string, value?: any, modelClass?: any, htmlAttributes?: Record<string, any>): string {
    const attrs: Record<string, string> = {
      name: name,
      id: name,
      class: 'form-control',
      ...htmlAttributes
    };

    // Add validation attributes if model class provided
    if (modelClass) {
      const validationAttrs = ModelValidator.getValidationAttributes(modelClass, name);
      Object.assign(attrs, validationAttrs);
    }

    const attrString = Object.entries(attrs)
      .map(([key, val]) => `${key}="${this.escapeHtml(String(val))}"`)
      .join(' ');

    const textValue = value ? this.escapeHtml(String(value)) : '';

    return `<textarea ${attrString}>${textValue}</textarea>`;
  }

  /**
   * Creates a dropdown list (select) field
   * @param name The field name
   * @param options Array of {value, text} options or simple string array
   * @param selectedValue The selected value
   * @param htmlAttributes Additional HTML attributes
   * @returns HTML string for select element
   */
  static DropDownList(name: string, options: Array<{value: any, text: string}> | string[], selectedValue?: any, htmlAttributes?: Record<string, any>): string {
    const attrs: Record<string, string> = {
      name: name,
      id: name,
      class: 'form-select',
      ...htmlAttributes
    };

    const attrString = Object.entries(attrs)
      .map(([key, val]) => `${key}="${this.escapeHtml(String(val))}"`)
      .join(' ');

    // Convert options to consistent format
    const normalizedOptions = options.map(opt => {
      if (typeof opt === 'string') {
        return { value: opt, text: opt };
      }
      return opt;
    });

    const optionsHtml = normalizedOptions
      .map(opt => {
        const selected = opt.value == selectedValue ? ' selected' : '';
        return `<option value="${this.escapeHtml(String(opt.value))}"${selected}>${this.escapeHtml(opt.text)}</option>`;
      })
      .join('');

    return `<select ${attrString}>${optionsHtml}</select>`;
  }

  /**
   * Creates a checkbox input field
   * @param name The field name
   * @param isChecked Whether the checkbox is checked
   * @param htmlAttributes Additional HTML attributes
   * @returns HTML string for checkbox input
   */
  static CheckBox(name: string, isChecked: boolean = false, htmlAttributes?: Record<string, any>): string {
    const attrs: Record<string, string> = {
      type: 'checkbox',
      name: name,
      id: name,
      class: 'form-check-input',
      ...htmlAttributes
    };

    if (isChecked) {
      attrs.checked = 'checked';
    }

    const attrString = Object.entries(attrs)
      .map(([key, val]) => `${key}="${this.escapeHtml(String(val))}"`)
      .join(' ');

    return `<input ${attrString}>`;
  }

  /**
   * Creates a submit button
   * @param text The button text
   * @param htmlAttributes Additional HTML attributes
   * @returns HTML string for submit button
   */
  static SubmitButton(text: string = 'Submit', htmlAttributes?: Record<string, any>): string {
    const attrs: Record<string, string> = {
      type: 'submit',
      class: 'btn btn-primary',
      ...htmlAttributes
    };

    const attrString = Object.entries(attrs)
      .map(([key, val]) => `${key}="${this.escapeHtml(String(val))}"`)
      .join(' ');

    return `<button ${attrString}>${this.escapeHtml(text)}</button>`;
  }

  /**
   * Creates a validation message for a specific field
   * @param fieldName The field name
   * @param modelState The current ModelState
   * @returns HTML string for validation message
   */
  static ValidationMessage(fieldName: string, modelState?: any): string {
    if (!modelState || !modelState.hasError || !modelState.hasError(fieldName)) {
      return '';
    }

    const error = modelState.getError(fieldName);
    return `<div class="invalid-feedback d-block">${this.escapeHtml(error)}</div>`;
  }

  /**
   * Creates a validation summary for all model errors
   * @param modelState The current ModelState
   * @param message Optional header message
   * @returns HTML string for validation summary
   */
  static ValidationSummary(modelState?: any, message?: string): string {
    if (!modelState || !modelState.errors || modelState.errors.length === 0) {
      return '';
    }

    const headerMessage = message || 'Please correct the following errors:';
    const errorsHtml = modelState.errors
      .map((error: any) => `<li>${this.escapeHtml(error.message)}</li>`)
      .join('');

    return `
      <div class="alert alert-danger">
        <h5>${this.escapeHtml(headerMessage)}</h5>
        <ul class="mb-0">${errorsHtml}</ul>
      </div>
    `;
  }

  /**
   * Escapes HTML special characters
   * @param text The text to escape
   * @returns Escaped HTML string
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Make HtmlHelper available globally
if (typeof window !== 'undefined') {
  (window as any).Html = HtmlHelper;
}
