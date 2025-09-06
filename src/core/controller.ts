import { ViewEngine } from "./viewEngine";
import { serviceContainer } from "./serviceContainer";
import { ModelValidator, ModelState } from "./modelValidator";

export class Controller {
  [key: string]: any; // Allow dynamic method access
  private static routerInstance: any = null;
  protected queryParams: Record<string, string> = {};
  protected queryParamsRaw: URLSearchParams = new URLSearchParams();
  protected modelState: ModelState = new ModelState(); // Model validation state

  constructor() {
    // Initialize services from DI container if available
    this.initializeServices();
  }

  /**
   * Gets the current ModelState (like ASP.NET Core's ModelState)
   */
  protected get ModelState(): ModelState & { IsValid: boolean } {
    return Object.assign(this.modelState, {
      IsValid: this.modelState.isValid
    });
  }

  /**
   * Provides .NET MVC-like Model access with automatic validation
   * Usage: if (!this.Model.IsValid) { ... }
   */
  protected get Model(): { IsValid: boolean; Errors: any[]; validate(obj: any): boolean } {
    return {
      IsValid: this.modelState.isValid,
      Errors: this.modelState.errors,
      validate: (obj: any) => {
        const validationResult = ModelValidator.validate(obj);
        if (!validationResult.isValid) {
          // Clear existing errors and add new validation errors
          this.modelState = validationResult;
          return false;
        }
        // Clear errors if validation passes
        this.clearModelState();
        return true;
      }
    };
  }

  /**
   * Validates any model and updates the ModelState
   * @param model The model instance to validate
   * @returns True if valid, false otherwise
   */
  protected tryValidateModel(model: any): boolean {
    this.modelState = ModelValidator.validate(model);
    return this.modelState.isValid;
  }

  /**
   * Validates form data against a model class and updates the ModelState
   * @param modelClass The model class constructor
   * @param formData The form data to validate
   * @returns True if valid, false otherwise
   */
  protected tryValidateFormData(modelClass: new () => any, formData: any): boolean {
    this.modelState = ModelValidator.validateFormData(modelClass, formData);
    return this.modelState.isValid;
  }

  /**
   * Creates a model instance from form data and validates it
   * Updates ModelState automatically
   * @param modelClass The model class constructor
   * @param formData The form data to bind and validate
   * @returns The created model instance
   */
  protected createModel<T extends object>(modelClass: new () => T, formData: any): T {
    const model = new modelClass();
    
    // Bind form data to model properties
    Object.keys(formData).forEach(key => {
      if (key in model) {
        (model as any)[key] = formData[key];
      }
    });
    
    // Validate the model and update ModelState
    this.tryValidateModel(model);
    
    return model;
  }

  /**
   * Validates any object (with or without extending Model class)
   * Updates ModelState automatically
   * @param obj The object to validate
   * @returns True if valid, false otherwise
   */
  protected validateObject(obj: any): boolean {
    this.modelState = ModelValidator.validate(obj);
    return this.modelState.isValid;
  }

  /**
   * Clears the current ModelState
   */
  protected clearModelState(): void {
    this.modelState = new ModelState();
  }

  /**
   * Adds a custom model error
   * @param propertyName The property name (empty string for model-level errors)
   * @param errorMessage The error message
   * @param attemptedValue The attempted value (optional)
   */
  protected addModelError(propertyName: string, errorMessage: string, attemptedValue?: any): void {
    this.modelState.addError(propertyName, errorMessage, attemptedValue);
  }

  /**
   * Set query parameters from the router
   */
  setQueryParams(params: Record<string, string>, urlSearchParams: URLSearchParams): void {
    this.queryParams = params;
    this.queryParamsRaw = urlSearchParams;
  }

  /**
   * Get a query parameter value
   */
  protected getQueryParam(name: string): string | null {
    return this.queryParams[name] || null;
  }

  /**
   * Get all query parameters as an object
   */
  protected getQueryParams(): Record<string, string> {
    return { ...this.queryParams };
  }

  /**
   * Get all values for a query parameter (for parameters that can have multiple values)
   */
  protected getQueryParamValues(name: string): string[] {
    return this.queryParamsRaw.getAll(name);
  }

  /**
   * Check if a query parameter exists
   */
  protected hasQueryParam(name: string): boolean {
    return this.queryParamsRaw.has(name);
  }

  /**
   * Initialize services from the DI container
   */
  private initializeServices(): void {
    // Services will be injected automatically through decorators
    // or can be manually retrieved using getService()
  }

  /**
   * Get service from DI container (uses request-scoped container if available)
   */
  protected getService<T>(serviceType: new (...args: any[]) => T): T {
    // Try to get from request-scoped container first
    const currentRequestServices = (window as any).currentRequestServices;
    if (currentRequestServices) {
      try {
        return currentRequestServices.getService(serviceType);
      } catch {
        // Fall back to global container
      }
    }
    
    return serviceContainer.getService(serviceType);
  }

  /**
   * Try to get service from DI container (uses request-scoped container if available)
   */
  protected tryGetService<T>(serviceType: new (...args: any[]) => T): T | null {
    // Try to get from request-scoped container first
    const currentRequestServices = (window as any).currentRequestServices;
    if (currentRequestServices) {
      try {
        return currentRequestServices.tryGetService(serviceType);
      } catch {
        // Fall back to global container
      }
    }
    
    return serviceContainer.tryGetService(serviceType);
  }

  // Set router instance for redirects
  static setRouter(router: any) {
    Controller.routerInstance = router;
  }

  async execute(): Promise<void> {
    // Default implementation - can be overridden
    console.warn(`No execute method implemented for ${this.constructor.name}`);
  }

  protected async View(viewPath: string, data?: Record<string, any>): Promise<void> {
    // Add ModelState and validation helpers to view data
    const viewData = {
      ...data,
      ModelState: this.modelState,
      ValidationSummary: ModelValidator.createValidationSummary(this.modelState),
      // Helper function for validation attributes (can be used in templates)
      ValidationAttributes: (modelClass: any, propertyName: string) => 
        ModelValidator.getValidationAttributes(modelClass, propertyName)
    };
    
    await ViewEngine.View(viewPath, viewData);
  }

  /**
   * Redirect to another route (using History API) with optional query parameters
   */
  protected Redirect(route: string, queryParams?: Record<string, string>): { redirect: true; route: string } {
    let path = route.startsWith('/') ? route : `/${route}`;
    
    // Add query parameters if provided
    if (queryParams && Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        searchParams.set(key, value);
      });
      path += `?${searchParams.toString()}`;
    }
    
    if (Controller.routerInstance && Controller.routerInstance.navigateTo) {
      // Use router's navigateTo method
      Controller.routerInstance.navigateTo(path);
    } else {
      // Fallback to direct History API
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    
    return { redirect: true, route };
  }

  /**
   * Redirect to an external URL
   */
  protected RedirectToUrl(url: string): { redirect: true; url: string } {
    window.location.href = url;
    return { redirect: true, url };
  }

  /**
   * Redirect to another action in the same controller with optional query parameters
   */
  protected RedirectToAction(action: string, controller?: string, queryParams?: Record<string, string>): { redirect: true; action: string; controller?: string } {
    const targetController = controller || this.constructor.name.replace('Controller', '');
    
    // For common actions, map to clean URLs
    let route: string;
    if (action === 'demoAction' && targetController.toLowerCase() === 'home') {
      route = '/home/demo';
    } else if (action === 'execute' || action === 'index') {
      route = controller ? `/${controller.toLowerCase()}` : `/${targetController.toLowerCase()}`;
    } else {
      // Default to controller/action pattern
      route = controller ? `/${controller.toLowerCase()}/${action}` : `/${targetController.toLowerCase()}/${action}`;
    }
    
    // Add query parameters if provided
    if (queryParams && Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        searchParams.set(key, value);
      });
      route += `?${searchParams.toString()}`;
    }
    
    if (Controller.routerInstance && Controller.routerInstance.navigateTo) {
      // Use router's navigateTo method
      Controller.routerInstance.navigateTo(route);
    } else {
      // Fallback to direct History API
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    
    return { redirect: true, action, controller: targetController };
  }

  /**
   * Return JSON result (for AJAX calls)
   */
  protected Json(data: any): { json: true; data: any } {
    return { json: true, data };
  }

  /**
   * Build a URL with query parameters
   */
  protected buildUrl(path: string, queryParams?: Record<string, string>): string {
    let url = path.startsWith('/') ? path : `/${path}`;
    
    if (queryParams && Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        searchParams.set(key, value);
      });
      url += `?${searchParams.toString()}`;
    }
    
    return url;
  }

  /**
   * Build a URL for an action with query parameters
   */
  protected buildActionUrl(action: string, controller?: string, queryParams?: Record<string, string>): string {
    const targetController = controller || this.constructor.name.replace('Controller', '');
    let path: string;
    
    if (action === 'execute' || action === 'index') {
      path = `/${targetController.toLowerCase()}`;
    } else {
      path = `/${targetController.toLowerCase()}/${action}`;
    }
    
    return this.buildUrl(path, queryParams);
  }
}
