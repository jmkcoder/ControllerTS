// Store for registered routes
export const routeRegistry: Map<string, { controller: any; action: string; method: string }> = new Map();

// Store for controller metadata
export const controllerRegistry: Map<any, { baseRoute: string; actions: Map<string, { route: string; method: string }> }> = new Map();

/**
 * Controller decorator - defines the base route for a controller
 * @param baseRoute - The base route path (e.g., "admin", "api/users")
 */
export function controller(baseRoute: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // Normalize the base route
    const normalizedRoute = baseRoute.startsWith('/') ? baseRoute.slice(1) : baseRoute;
    
    // Initialize controller metadata
    if (!controllerRegistry.has(constructor)) {
      controllerRegistry.set(constructor, {
        baseRoute: normalizedRoute,
        actions: new Map()
      });
    } else {
      controllerRegistry.get(constructor)!.baseRoute = normalizedRoute;
    }
    
    return constructor;
  };
}

/**
 * Action decorator - defines an action route within a controller
 * @param actionRoute - The action route path (e.g., "", "users", "settings") 
 * @param method - HTTP method (default: "GET")
 */
export function action(actionRoute: string = '', method: string = 'GET') {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    const constructor = target.constructor;
    
    // Initialize controller metadata if not exists
    if (!controllerRegistry.has(constructor)) {
      controllerRegistry.set(constructor, {
        baseRoute: '',
        actions: new Map()
      });
    }
    
    // Store action metadata
    const controllerMeta = controllerRegistry.get(constructor)!;
    controllerMeta.actions.set(propertyKey, {
      route: actionRoute,
      method: method.toUpperCase()
    });
    
    // Build full route path
    const baseRoute = controllerMeta.baseRoute;
    const fullRoute = baseRoute && actionRoute 
      ? `${baseRoute}/${actionRoute}`
      : baseRoute || actionRoute || baseRoute;
    
    // Register in the route registry for backward compatibility
    routeRegistry.set(fullRoute, {
      controller: constructor,
      action: propertyKey,
      method: method.toUpperCase()
    });

    return descriptor;
  };
}

/**
 * Get all registered routes (supports both @route and @controller/@action)
 */
export function getRegisteredRoutes(): Map<string, { controller: any; action: string; method: string }> {
  return routeRegistry;
}

/**
 * Get controller metadata
 */
export function getControllerMetadata(controller: any): { baseRoute: string; actions: Map<string, { route: string; method: string }> } | undefined {
  return controllerRegistry.get(controller);
}

/**
 * Get all registered controllers with their metadata
 */
export function getRegisteredControllers(): Map<any, { baseRoute: string; actions: Map<string, { route: string; method: string }> }> {
  return controllerRegistry;
}

/**
 * Process controller metadata and register all routes
 * Call this after all controllers are loaded
 */
export function processControllerRoutes(): void {
  for (const [controller, metadata] of controllerRegistry) {
    for (const [actionName, actionMeta] of metadata.actions) {
      const fullRoute = metadata.baseRoute && actionMeta.route 
        ? `${metadata.baseRoute}/${actionMeta.route}`
        : metadata.baseRoute || actionMeta.route || metadata.baseRoute;
      
      // Register the complete route
      routeRegistry.set(fullRoute, {
        controller: controller,
        action: actionName,
        method: actionMeta.method
      });
      
      console.log(`🛣️  Registered route: ${actionMeta.method} /${fullRoute} → ${controller.name}.${actionName}`);
    }
  }
}

/**
 * Clear all registered routes (useful for testing)
 */
export function clearRoutes(): void {
  routeRegistry.clear();
}
