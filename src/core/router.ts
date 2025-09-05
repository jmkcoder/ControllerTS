import type { Controller } from './controller';
import { getRegisteredRoutes } from './decorators';

export class Router {
  private routes: Record<string, any> = {};
  private registeredControllers: Map<string, typeof Controller> = new Map();

  addRoute(path: string, controller: typeof Controller) {
    this.routes[path] = controller;
  }

  /**
   * Register a controller for automatic route generation
   */
  registerController(name: string, controller: typeof Controller) {
    this.registeredControllers.set(name.toLowerCase(), controller);
  }

  init() {
    // Use HTML5 History API instead of hash-based routing
    window.addEventListener('popstate', () => this.route());
    // Handle initial route on page load
    this.route();
    // Intercept link clicks for client-side routing
    this.interceptLinks();
  }

  private async route() {
    const path = window.location.pathname.replace(/^\//, '') || 'home';

    // First, check decorator routes
    const decoratorRoutes = getRegisteredRoutes();
    if (decoratorRoutes.has(path)) {
      const routeInfo = decoratorRoutes.get(path)!;

      const controller = new routeInfo.controller();
      if (typeof controller[routeInfo.action] === 'function') {
        await controller[routeInfo.action]();
      } else {
        this.handle404();
      }
      return;
    }

    // Check manually registered routes (legacy support)
    const LegacyControllerClass = this.routes[path];
    if (LegacyControllerClass) {
      const controller = new LegacyControllerClass();
      await controller.execute();
      return;
    }

    // Try controller/action pattern (e.g., "home/index", "about/details")
    const parts = path.split('/');
    if (parts.length >= 2) {
      const controllerName = parts[0].toLowerCase();
      const actionName = parts[1];
      
      const RegisteredControllerClass = this.registeredControllers.get(controllerName);
      if (RegisteredControllerClass) {
        const controller = new RegisteredControllerClass();
        
        // Check if the action exists on the controller
        if (typeof controller[actionName] === 'function') {
          await controller[actionName]();
        } else {
          await controller.execute();
        }
        return;
      }
    }

    // Try single controller name (default action)
    const controllerName = path.toLowerCase();
    const DefaultControllerClass = this.registeredControllers.get(controllerName);
    if (DefaultControllerClass) {
      const controller = new DefaultControllerClass();
      await controller.execute();
      return;
    }

    // 404 - No route found
    this.handle404();
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
      this.route();
      }
    } catch (error) {
      this.route(); // Re-render current route to maintain app state
    }
  }

  private handle404() {
    document.body.innerHTML = '<h1>404 - Not Found</h1>';
  }
}
