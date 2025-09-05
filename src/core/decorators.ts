// Store for registered routes
export const routeRegistry: Map<string, { controller: any; action: string; method: string }> = new Map();

/**
 * Route decorator for controller actions
 * @param path - The route path (e.g., "/home/index", "/api/users")
 * @param method - HTTP method (default: "GET")
 */
export function route(path: string, method: string = 'GET') {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    // Normalize the path
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Store the route registration
    routeRegistry.set(normalizedPath, {
      controller: target.constructor,
      action: propertyKey,
      method: method.toUpperCase()
    });

    console.log(`Route registered: ${normalizedPath} -> ${target.constructor.name}.${propertyKey} [${method.toUpperCase()}]`);
    
    return descriptor;
  };
}

/**
 * Get all registered routes
 */
export function getRegisteredRoutes(): Map<string, { controller: any; action: string; method: string }> {
  return routeRegistry;
}

/**
 * Clear all registered routes (useful for testing)
 */
export function clearRoutes(): void {
  routeRegistry.clear();
}
