// Store for registered routes
export const routeRegistry: Map<string, { controller: any; action: string; method: string; actionType?: 'view' | 'object' }> = new Map();

// Store for controller metadata
export const controllerRegistry: Map<any, { baseRoute: string; actions: Map<string, { route: string; method: string; actionType: 'view' | 'object' }> }> = new Map();

// Store for action types
export const actionTypeRegistry: Map<string, 'view' | 'object'> = new Map();

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
    
    // Store action metadata with default actionType as 'view'
    const controllerMeta = controllerRegistry.get(constructor)!;
    controllerMeta.actions.set(propertyKey, {
      route: actionRoute,
      method: method.toUpperCase(),
      actionType: 'view'
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
      method: method.toUpperCase(),
      actionType: 'view'
    });

    return descriptor;
  };
}

/**
 * Object Action decorator - defines an action that only returns objects (JSON)
 * These actions cannot render views, partial views, or redirects
 * @param actionRoute - The action route path (e.g., "", "api/users", "data") 
 * @param method - HTTP method (default: "GET")
 */
export function objectAction(actionRoute: string = '', method: string = 'GET') {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    const constructor = target.constructor;
    
    // Initialize controller metadata if not exists
    if (!controllerRegistry.has(constructor)) {
      controllerRegistry.set(constructor, {
        baseRoute: '',
        actions: new Map()
      });
    }
    
    // Store action metadata with actionType as 'object'
    const controllerMeta = controllerRegistry.get(constructor)!;
    controllerMeta.actions.set(propertyKey, {
      route: actionRoute,
      method: method.toUpperCase(),
      actionType: 'object'
    });
    
    // Build full route path
    const baseRoute = controllerMeta.baseRoute;
    const fullRoute = baseRoute && actionRoute 
      ? `${baseRoute}/${actionRoute}`
      : baseRoute || actionRoute || baseRoute;
    
    // Register in the route registry
    routeRegistry.set(fullRoute, {
      controller: constructor,
      action: propertyKey,
      method: method.toUpperCase(),
      actionType: 'object'
    });
    
    // Store action type for runtime validation
    const actionKey = `${constructor.name}.${propertyKey}`;
    actionTypeRegistry.set(actionKey, 'object');

    return descriptor;
  };
}

/**
 * Get all registered routes (supports both @route and @controller/@action)
 */
export function getRegisteredRoutes(): Map<string, { controller: any; action: string; method: string; actionType?: 'view' | 'object' }> {
  return routeRegistry;
}

/**
 * Get controller metadata
 */
export function getControllerMetadata(controller: any): { baseRoute: string; actions: Map<string, { route: string; method: string; actionType: 'view' | 'object' }> } | undefined {
  return controllerRegistry.get(controller);
}

/**
 * Get all registered controllers with their metadata
 */
export function getRegisteredControllers(): Map<any, { baseRoute: string; actions: Map<string, { route: string; method: string; actionType: 'view' | 'object' }> }> {
  return controllerRegistry;
}

/**
 * Check if an action is object-only
 */
export function isObjectAction(controllerName: string, actionName: string): boolean {
  const actionKey = `${controllerName}.${actionName}`;
  return actionTypeRegistry.get(actionKey) === 'object';
}

/**
 * Get action type for a specific action
 */
export function getActionType(controllerName: string, actionName: string): 'view' | 'object' | undefined {
  const actionKey = `${controllerName}.${actionName}`;
  return actionTypeRegistry.get(actionKey);
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
        method: actionMeta.method,
        actionType: actionMeta.actionType
      });
      
      // Store action type for runtime validation
      const actionKey = `${controller.name}.${actionName}`;
      actionTypeRegistry.set(actionKey, actionMeta.actionType);
      
      const typeIndicator = actionMeta.actionType === 'object' ? '📦' : '🏠';
      console.log(`🛣️  Registered route: ${actionMeta.method} /${fullRoute} → ${controller.name}.${actionName} ${typeIndicator}`);
    }
  }
}

/**
 * Clear all registered routes (useful for testing)
 */
export function clearRoutes(): void {
  routeRegistry.clear();
}
