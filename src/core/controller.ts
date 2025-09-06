import { ViewEngine } from "./viewEngine";
import { serviceContainer } from "./serviceContainer";

export class Controller {
  [key: string]: any; // Allow dynamic method access
  private static routerInstance: any = null;
  protected queryParams: Record<string, string> = {};
  protected queryParamsRaw: URLSearchParams = new URLSearchParams();

  constructor() {
    // Initialize services from DI container if available
    this.initializeServices();
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
    await ViewEngine.View(viewPath, data);
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
