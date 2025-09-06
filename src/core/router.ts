import type { Controller } from './controller';
import { getRegisteredRoutes } from './decorators';
import type { RequestContext } from './requestPipeline';
import { ActionValidator } from './actionValidator';
import { HtmlHelper } from './htmlHelper';
import { ErrorHandler } from './errorHandler';

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
    console.log('📝 Default route set:', this.defaultRoute);
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

  /**
   * Match a URL path against a route pattern and extract parameters
   * @param pattern Route pattern like "category/:category" or ":id"
   * @param path Actual URL path like "category/electronics" or "123"
   * @returns Object with matched parameters or null if no match
   */
  private matchRoute(pattern: string, path: string): Record<string, string> | null {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    // Must have same number of parts
    if (patternParts.length !== pathParts.length) {
      return null;
    }
    
    const params: Record<string, string> = {};
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];
      
      if (patternPart.startsWith(':')) {
        // This is a parameter
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        // Static part doesn't match
        return null;
      }
    }
    
    return params;
  }

  /**
   * Find matching route from registered routes, handling parameters
   */
  private findMatchingRoute(path: string, method: string): { 
    routeInfo: any; 
    routeParams: Record<string, string>; 
    fullRoutePath: string 
  } | null {
    const decoratorRoutes = getRegisteredRoutes();
    
    // First try exact match
    if (decoratorRoutes.has(path)) {
      const routeInfo = decoratorRoutes.get(path)!;
      if (routeInfo.method === method.toUpperCase()) {
        return { routeInfo, routeParams: {}, fullRoutePath: path };
      }
    }
    
    // Try parameterized routes
    for (const [routePath, routeInfo] of decoratorRoutes.entries()) {
      if (routeInfo.method === method.toUpperCase()) {
        const routeParams = this.matchRoute(routePath, path);
        if (routeParams !== null) {
          return { routeInfo, routeParams, fullRoutePath: routePath };
        }
      }
    }
    
    return null;
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
    
    console.log('🔍 getCleanPath() debug:', {
      originalPath: path,
      cleaned: cleaned,
      hasDefaultRoute: !!this.defaultRoute,
      defaultRoute: this.defaultRoute
    });
    
    // If it's root path and we have a default route configured
    if (!cleaned && this.defaultRoute) {
      const result = `${this.defaultRoute.controller}/${this.defaultRoute.action}`;
      console.log('✅ Using default route:', result);
      return result;
    }
    
    // If it's root path and no default route, fallback to 'home'
    const fallback = cleaned || 'home';
    console.log('⚠️ Using fallback:', fallback);
    return fallback;
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
    
    // Remove any existing popstate listeners to prevent duplicates
    const existingListeners = (window as any).__routerPopstateListeners || [];
    existingListeners.forEach((listener: any) => {
      window.removeEventListener('popstate', listener);
    });
    
    // Create new popstate handler
    const popstateHandler = (event: PopStateEvent) => {
      this.routeViaPipeline();
    };
    
    // Store reference to handler for cleanup
    (window as any).__routerPopstateListeners = [popstateHandler];
    
    // Use HTML5 History API instead of hash-based routing
    window.addEventListener('popstate', popstateHandler);
    
    // Handle initial route on page load
    this.routeViaPipeline();
    // Intercept link clicks for client-side routing
    this.interceptLinks();
  }

  private async routeViaPipeline() {
    
    const url = window.location.pathname + window.location.search;
    if (this.pipelineHandler) {
      try {
        await this.pipelineHandler(url, 'GET');
      } catch (error) {
        console.error('Pipeline error:', error);
        // Handle 500 error through error handler
        await this.handle500(error instanceof Error ? error : new Error('Unknown pipeline error'));
      }
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
    console.log('🔍 executeRoute() debug:', {
      path: path,
      registeredControllers: Array.from(this.registeredControllers.keys()),
      registeredControllersCount: this.registeredControllers.size,
      legacyRoutes: Object.keys(this.routes),
      decoratorRoutes: Array.from(getRegisteredRoutes().keys()).slice(0, 10) // Show first 10 for readability
    });
    
    console.log('🔍 All registered controllers detailed:', this.registeredControllers);
    
    // First, check decorator routes
    const decoratorRoutes = getRegisteredRoutes();
    const currentMethod = this.currentRequestContext?.method || 'GET';
    
    console.log('🔍 Router executeRoute debug:', {
      path,
      currentMethod,
      hasRequestContext: !!this.currentRequestContext,
      availableRoutes: Array.from(decoratorRoutes.keys()).slice(0, 5),
      availableRoutesWithMethods: Array.from(decoratorRoutes.entries()).slice(0, 5).map(([key, value]) => ({
        path: key,
        method: value.method,
        controller: value.controller.name,
        action: value.action
      }))
    });
    
    // Try to find a matching route (including parameterized routes)
    const matchResult = this.findMatchingRoute(path, currentMethod);
    
    if (matchResult) {
      const { routeInfo, routeParams, fullRoutePath } = matchResult;
      
      console.log('✅ Found matching route:', {
        fullRoutePath,
        routeParams,
        controller: routeInfo.controller.name,
        action: routeInfo.action
      });
      
      const controller = this.createController(routeInfo.controller, queryParamsObject);
      
      // Set route parameters on the controller
      if (controller.setRouteParams && Object.keys(routeParams).length > 0) {
        controller.setRouteParams(routeParams);
      }
      
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
        await this.handle404();
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
    console.log('🔍 Trying controller/action pattern:', {
      path: path,
      parts: parts,
      partsLength: parts.length
    });
    
    if (parts.length >= 2) {
      const controllerName = parts[0].toLowerCase();
      const actionName = parts[1];
      
      console.log('🔍 Looking for controller:', {
        controllerName: controllerName,
        actionName: actionName,
        hasController: this.registeredControllers.has(controllerName)
      });
      
      const RegisteredControllerClass = this.registeredControllers.get(controllerName);
      if (RegisteredControllerClass) {
        console.log('✅ Found controller class:', RegisteredControllerClass.name);
        const controller = this.createController(RegisteredControllerClass, queryParamsObject);
        console.log('✅ Created controller instance:', typeof controller);
        
        // Check if the action exists on the controller
        if (typeof controller[actionName] === 'function') {
          console.log('✅ Found action method:', actionName);
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
          console.log('⚠️ Action method not found, trying default execute()');
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
    await this.handle404();
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
    
    // Reinitialize HtmlHelper after DOM content change
    HtmlHelper.reinitialize();
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
        window.history.pushState({ path, timestamp: Date.now() }, '', path);
        this.routeViaPipeline();
      } else {
      }
    } catch (error) {
      this.routeViaPipeline(); // Re-render current route to maintain app state
    }
  }

  private async handle404() {
    await ErrorHandler.handle404(undefined, this.currentRequestContext);
  }

  /**
   * Handle 500 errors
   */
  async handle500(error: Error) {
    await ErrorHandler.handle500(error, this.currentRequestContext);
  }

  /**
   * Handle other HTTP errors
   */
  async handleError(statusCode: number, message?: string, details?: any) {
    await ErrorHandler.handleError(statusCode, message, details, this.currentRequestContext);
  }
}
