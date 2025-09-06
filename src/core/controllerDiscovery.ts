/**
 * Dynamic Controller Discovery and Registration
 * Automatically finds and registers all controllers that inherit from Controller
 */

import { Controller } from './controller';
import { ControllerManager } from './controllerManager';

// Global registry to store controllers before ControllerDiscovery is ready
const globalControllerRegistry: Array<any> = [];

export class ControllerDiscovery {
    private static controllers: Map<string, typeof Controller> = new Map();
    private static initialized = false;
    
    /**
     * Initialize the controller discovery system
     */
    static initialize(): void {
        if (this.initialized) return;
        
        // Process any controllers that were registered before initialization
        globalControllerRegistry.forEach(controller => {
            this.registerController(controller);
        });
        
        // Clear the global registry
        globalControllerRegistry.length = 0;
        this.initialized = true;
        
    }
    
    /**
     * Register a controller class for discovery
     */
    static registerController(controllerClass: any): void {
        const name = controllerClass.name;
        const controllerName = name.endsWith('Controller') 
            ? name.slice(0, -10) // Remove 'Controller' suffix
            : name;

        this.controllers.set(controllerName, controllerClass);
    }
    
    /**
     * Auto-register all discovered controllers with ControllerManager
     */
    static registerAllControllers(): void {
        this.initialize(); // Ensure we're initialized
        
        for (const [name, controllerClass] of this.controllers) {
            ControllerManager.registerController(name, controllerClass);
        }
    }
    
    /**
     * Get all discovered controllers
     */
    static getControllers(): Map<string, typeof Controller> {
        this.initialize(); // Ensure we're initialized
        return new Map(this.controllers);
    }
    
    /**
     * Get controller by name
     */
    static getController(name: string): typeof Controller | undefined {
        this.initialize(); // Ensure we're initialized
        return this.controllers.get(name);
    }
}

/**
 * Add controller to global registry (used before ControllerDiscovery is ready)
 */
function addToGlobalRegistry(controllerClass: any): void {
    globalControllerRegistry.push(controllerClass);
}

/**
 * Controller decorator for automatic registration
 * Use this decorator on controller classes to auto-register them
 */
export function AutoRegister<T extends new (...args: any[]) => Controller>(target: T): T {
    
    // Add to global registry if ControllerDiscovery isn't ready yet
    // This avoids circular dependency issues during module loading
    if (ControllerDiscovery && typeof ControllerDiscovery.registerController === 'function') {
        try {
            ControllerDiscovery.registerController(target);
        } catch (error) {
            // Fallback to global registry if there's any issue
            addToGlobalRegistry(target);
        }
    } else {
        addToGlobalRegistry(target);
    }
    
    return target;
}

/**
 * Check if a class extends Controller
 */
function isControllerClass(value: any): value is typeof Controller {
    
    if (typeof value !== 'function') {
        return false;
    }
    if (!value.prototype) {
        return false;
    }
    
    // Check if it extends Controller
    let proto = Object.getPrototypeOf(value);
    while (proto && proto !== Function.prototype) {
        if (proto === Controller || proto.name === 'Controller') {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    
    // Alternative check: see if prototype extends Controller
    try {
        const result = value.prototype instanceof Controller;
        return result;
    } catch (error) {
        return false;
    }
}
