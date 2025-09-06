// Store for registered routes
export const routeRegistry: Map<string, { controller: any; action: string; method: string; actionType?: 'view' | 'object' }> = new Map();

// Store for controller metadata
export const controllerRegistry: Map<any, { baseRoute: string; actions: Map<string, { route: string; method: string; actionType: 'view' | 'object' }> }> = new Map();

// Store for action types
export const actionTypeRegistry: Map<string, 'view' | 'object'> = new Map();

// Store for action parameter metadata
export const actionParameterRegistry: Map<string, any[]> = new Map();

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
    
    // Store parameter type metadata for automatic binding
    const paramTypes = (Reflect as any).getMetadata?.('design:paramtypes', target, propertyKey) || [];
    
    if (paramTypes.length > 0) {
      const actionKey = `${constructor.name}.${propertyKey}`;
      actionParameterRegistry.set(actionKey, paramTypes);
    }
    
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
    
    // Store parameter type metadata for automatic binding
    const paramTypes = (Reflect as any).getMetadata?.('design:paramtypes', target, propertyKey) || [];
    if (paramTypes.length > 0) {
      const actionKey = `${constructor.name}.${propertyKey}`;
      actionParameterRegistry.set(actionKey, paramTypes);
    }
    
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
  // Try both the raw controller name and the Controller-suffixed version
  const normalizedName = controllerName.toLowerCase();
  const controllerClassName = normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1) + 'Controller';
  
  const actionKey1 = `${controllerName}.${actionName}`;
  const actionKey2 = `${controllerClassName}.${actionName}`;
  
  const result = actionTypeRegistry.get(actionKey1) === 'object' || actionTypeRegistry.get(actionKey2) === 'object';
  
  return result;
}

/**
 * Get action type for a specific action
 */
export function getActionType(controllerName: string, actionName: string): 'view' | 'object' | undefined {
  const actionKey = `${controllerName}.${actionName}`;
  return actionTypeRegistry.get(actionKey);
}

/**
 * Get parameter types for a specific action
 */
export function getActionParameterTypes(controllerName: string, actionName: string): any[] | undefined {
  // Try multiple naming conventions
  const possibleKeys = [
    `${controllerName}.${actionName}`,
    `${controllerName}Controller.${actionName}`,
    `${controllerName.charAt(0).toUpperCase() + controllerName.slice(1)}.${actionName}`,
    `${controllerName.charAt(0).toUpperCase() + controllerName.slice(1)}Controller.${actionName}`
  ];
  
  for (const key of possibleKeys) {
    const result = actionParameterRegistry.get(key);
    if (result) {
      return result;
    }
  }
  
  return undefined;
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
    }
  }
}

/**
 * Clear all registered routes (useful for testing)
 */
export function clearRoutes(): void {
  routeRegistry.clear();
}
