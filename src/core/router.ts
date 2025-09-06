import type { Controller } from './controller';
import { getRegisteredRoutes } from './decorators';
import type { RequestContext } from './requestPipeline';
import { ActionValidator } from './actionValidator';

export interface DefaultRouteConfig {
  controller: string;
  action: string;
}

export class Router {
  private routes: Record<string, any> = {};
  private registeredControllers: Map<string, typeof Controller> = new Map();
  private currentQueryParams: URLSearchParams = new URLSearchParams();
  private currentRequestContext: RequestContext | null = null;
  private pipelineHandler: ((url: string, method: string) => Promise<void>) | null = null;
  private defaultRoute: DefaultRouteConfig | null = null;

  /**
   * Set the default route that will be used for the root path "/"
   */
  setDefaultRoute(controller: string, action: string) {
    this.defaultRoute = { controller: controller.toLowerCase(), action };
  }

  /**
   * Get the current default route configuration
   */
  getDefaultRoute(): DefaultRouteConfig | null {
    return this.defaultRoute;
  }

  /**
   * Set pipeline handler (called by request pipeline during setup)
   */
  setPipelineHandler(handler: (url: string, method: string) => Promise<void>) {
    this.pipelineHandler = handler;
  }

  addRoute(path: string, controller: typeof Controller) {
    this.routes[path] = controller;
  }

  /**
   * Get current query parameters
   */
  getQueryParams(): URLSearchParams {
    return this.currentQueryParams;
  }

  /**
   * Get a specific query parameter value
   */
  getQueryParam(name: string): string | null {
    return this.currentQueryParams.get(name);
  }

  /**
   * Register a controller for automatic route generation
   */
  registerController(name: string, controller: typeof Controller) {
    this.registeredControllers.set(name.toLowerCase(), controller);
  }

  /**
   * Set request context (called by request pipeline)
   */
  setRequestContext(context: RequestContext) {
    this.currentRequestContext = context;
  }

  /**
   * Get current request context
   */
  getRequestContext(): RequestContext | null {
    return this.currentRequestContext;
  }

  /**
   * Get clean path and handle default route resolution
   */
  private getCleanPath(path: string): string {
    const cleaned = path.replace(/^\//, '');
    
    // If it's root path and we have a default route configured
    if (!cleaned && this.defaultRoute) {
      return `${this.defaultRoute.controller}/${this.defaultRoute.action}`;
    }
    
    // If it's root path and no default route, fallback to 'home'
    return cleaned || 'home';
  }

  /**
   * Route a specific path (used by request pipeline)
   */
  async routePath(path: string): Promise<void> {
    // Handle root path with default route
    const cleanPath = this.getCleanPath(path);
    
    // Parse query parameters from current request context or URL
    if (this.currentRequestContext) {
      this.currentQueryParams = new URLSearchParams();
      Object.entries(this.currentRequestContext.queryParams).forEach(([key, value]) => {
        this.currentQueryParams.set(key, value);
      });
    } else {
      this.currentQueryParams = new URLSearchParams(window.location.search);
    }
    
    const queryParamsObject = Object.fromEntries(this.currentQueryParams.entries());

    await this.executeRoute(cleanPath, queryParamsObject);
  }

  init() {
    // Use HTML5 History API instead of hash-based routing
    window.addEventListener('popstate', () => this.routeViaPipeline());
    // Handle initial route on page load
    this.routeViaPipeline();
    // Intercept link clicks for client-side routing
    this.interceptLinks();
  }

  private async routeViaPipeline() {
    const url = window.location.pathname + window.location.search;
    if (this.pipelineHandler) {
      await this.pipelineHandler(url, 'GET');
    } else {
      // Fallback to direct routing if pipeline not set up yet
      await this.route();
    }
  }

  private async route() {
    // Handle root path with default route
    const path = this.getCleanPath(window.location.pathname);
    
    // Parse query parameters
    this.currentQueryParams = new URLSearchParams(window.location.search);
    const queryParamsObject = Object.fromEntries(this.currentQueryParams.entries());

    await this.executeRoute(path, queryParamsObject);
  }

  /**
   * Execute route logic (shared between route() and routePath())
   */
  private async executeRoute(path: string, queryParamsObject: Record<string, string>) {
    // First, check decorator routes
    const decoratorRoutes = getRegisteredRoutes();
    if (decoratorRoutes.has(path)) {
      const routeInfo = decoratorRoutes.get(path)!;

      const controller = this.createController(routeInfo.controller, queryParamsObject);
      
      if (typeof controller[routeInfo.action] === 'function') {
        // Execute the action and get result
        let result: any;
        const actionMethod = controller[routeInfo.action];
        if (actionMethod.length > 0) {
          result = await controller[routeInfo.action](queryParamsObject);
        } else {
          result = await controller[routeInfo.action]();
        }
        
        // Handle the result based on action type
        await this.handleActionResult(
          routeInfo.controller.name,
          routeInfo.action,
          result,
          routeInfo.actionType
        );
      } else {
        this.handle404();
      }
      return;
    }

    // Check manually registered routes (legacy support)
    const LegacyControllerClass = this.routes[path];
    if (LegacyControllerClass) {
      const controller = this.createController(LegacyControllerClass, queryParamsObject);
      const result = await controller.execute();
      // Legacy routes are treated as view actions
      await this.handleActionResult(LegacyControllerClass.name, 'execute', result, 'view');
      return;
    }

    // Try controller/action pattern (e.g., "home/index", "about/details")
    const parts = path.split('/');
    if (parts.length >= 2) {
      const controllerName = parts[0].toLowerCase();
      const actionName = parts[1];
      
      const RegisteredControllerClass = this.registeredControllers.get(controllerName);
      if (RegisteredControllerClass) {
        const controller = this.createController(RegisteredControllerClass, queryParamsObject);
        
        // Check if the action exists on the controller
        if (typeof controller[actionName] === 'function') {
          // Execute action and handle result
          let result: any;
          const actionMethod = controller[actionName];
          if (actionMethod.length > 0) {
            result = await controller[actionName](queryParamsObject);
          } else {
            result = await controller[actionName]();
          }
          
          // Handle result (default to view action for dynamic routes)
          await this.handleActionResult(RegisteredControllerClass.name, actionName, result, 'view');
        } else {
          const result = await controller.execute();
          await this.handleActionResult(RegisteredControllerClass.name, 'execute', result, 'view');
        }
        return;
      }
    }

    // Try single controller name (default action)
    const controllerName = path.toLowerCase();
    const DefaultControllerClass = this.registeredControllers.get(controllerName);
    if (DefaultControllerClass) {
      const controller = this.createController(DefaultControllerClass, queryParamsObject);
      const result = await controller.execute();
      await this.handleActionResult(DefaultControllerClass.name, 'execute', result, 'view');
      return;
    }

    // 404 - No route found
    this.handle404();
  }

  /**
   * Handle action results based on action type
   */
  private async handleActionResult(
    controllerName: string,
    actionName: string,
    result: any,
    actionType?: 'view' | 'object'
  ): Promise<void> {
    // Validate the result using ActionValidator
    const validation = ActionValidator.validateActionResult(controllerName, actionName, result);
    
    if (!validation.isValid) {
      console.error(`❌ Action validation failed: ${validation.error}`);
      throw new Error(validation.error);
    }
    
    // Handle based on action type or result content
    const finalActionType = actionType || 'view';
    
    if (finalActionType === 'object') {
      // Object actions should return JSON
      if (validation.processedResult !== undefined) {
        this.renderJsonResponse(validation.processedResult);
      }
    } else {
      // View actions handle all types of results
      if (result && typeof result === 'object') {
        if (result.redirect) {
          // Redirect results are handled automatically by controller methods
          return;
        } else if (result.json) {
          // JSON results from view actions
          this.renderJsonResponse(result.data);
          return;
        }
      }
      // For view actions, undefined/null results are fine (view was rendered)
    }
  }

  /**
   * Render JSON response to the page
   */
  private renderJsonResponse(data: any): void {
    const jsonString = ActionValidator.processObjectActionResult(data);
    document.body.innerHTML = `<pre style="font-family: monospace; white-space: pre-wrap; margin: 20px;">${jsonString}</pre>`;
  }

  /**
   * Create controller instance with proper DI integration
   */
  private createController(ControllerClass: typeof Controller, queryParamsObject: Record<string, string>): Controller {
    let controller: Controller;

    // If we have a request context with DI services, use those
    if (this.currentRequestContext?.services) {
      // Always try to create controller through DI container first
      try {
        controller = this.currentRequestContext.services.getService(ControllerClass as any);
      } catch (error) {
        console.error(`Failed to create controller ${ControllerClass.name} through DI:`, error);
        console.log('DI container details:', this.currentRequestContext.services);
        throw new Error(`Cannot create controller ${ControllerClass.name} - DI container failed and no parameterless constructor available`);
      }
    } else {
      // No request context, this shouldn't happen in normal operation
      throw new Error(`No request context available for creating controller ${ControllerClass.name}`);
    }

    // Set query parameters on the controller
    if (controller.setQueryParams) {
      controller.setQueryParams(queryParamsObject, this.currentQueryParams);
    }

    return controller;
  }

  /**
   * Intercept link clicks for client-side routing
   */
  private interceptLinks() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const url = new URL(link.href);
        
        // Only handle same-origin links
        if (url.origin === window.location.origin) {
          // If the link has a hash and it's pointing to the same page, let it behave normally (anchor link)
          if (url.hash && url.pathname === window.location.pathname) {
            // Let the browser handle the hash navigation (scrolling to element)
            return;
          }
          
          // If it's a different path or no hash, handle with client-side routing
          e.preventDefault();
          this.navigateTo(url.pathname + url.search); // Include query parameters but not hash
        }
      }
    });
  }

  /**
   * Navigate to a new route using History API
   */
  navigateTo(path: string) {
    
    // Only update history if the path is different (ignore hash changes)
    const currentPath = window.location.pathname + window.location.search;
    try {
      if (path !== currentPath) {
        window.history.pushState({}, '', path);
        this.routeViaPipeline();
      }
    } catch (error) {
      this.routeViaPipeline(); // Re-render current route to maintain app state
    }
  }

  private handle404() {
    document.body.innerHTML = '<h1>404 - Not Found</h1>';
  }
}
