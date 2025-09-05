import { ViewEngine } from "./viewEngine";
import { serviceContainer } from "./serviceContainer";

export class Controller {
  [key: string]: any; // Allow dynamic method access
  private static routerInstance: any = null;

  constructor() {
    // Initialize services from DI container if available
    this.initializeServices();
  }

  /**
   * Initialize services from the DI container
   */
  private initializeServices(): void {
    // Services will be injected automatically through decorators
    // or can be manually retrieved using getService()
  }

  /**
   * Get service from DI container
   */
  protected getService<T>(serviceType: new (...args: any[]) => T): T {
    return serviceContainer.getService(serviceType);
  }

  /**
   * Try to get service from DI container
   */
  protected tryGetService<T>(serviceType: new (...args: any[]) => T): T | null {
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
   * Redirect to another route (using History API)
   */
  protected Redirect(route: string): { redirect: true; route: string } {
    console.log(`🔄 Redirecting to route: ${route}`);
    const path = route.startsWith('/') ? route : `/${route}`;
    
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
    console.log(`🔄 Redirecting to URL: ${url}`);
    window.location.href = url;
    return { redirect: true, url };
  }

  /**
   * Redirect to another action in the same controller
   */
  protected RedirectToAction(action: string, controller?: string): { redirect: true; action: string; controller?: string } {
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
    
    console.log(`🔄 Redirecting to action: ${targetController}.${action} -> ${route}`);
    
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
}
