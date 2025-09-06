/**
 * Automatic Controller Loader
 * Dynamically discovers and imports all controllers based on inheritance from Controller class
 */

import { Controller } from './controller';
import { serviceContainer } from './serviceContainer';

// Extend ImportMeta to include Vite's glob function
declare global {
    interface ImportMeta {
        glob(pattern: string, options?: { eager?: boolean }): Record<string, () => Promise<any>>;
    }
}

export class AutoControllerLoader {
    private static loadedControllers: Set<string> = new Set();
    
    /**
     * Automatically discover and load all controllers anywhere in the src directory
     * Supports clean architecture patterns like:
     * - src/controllers/*Controller.ts
     * - src/home/controller/*Controller.ts  
     * - src/home/about/controller/*Controller.ts
     * - src/features/user/controllers/*Controller.ts
     */
    static async loadAllControllers(): Promise<void> {
        console.log('🔍 Auto-discovering controllers across entire src directory...');
        
        try {
            // Use multiple glob patterns to find controllers anywhere in src
            // Vite requires literal strings, so we can't use a loop
            const allControllerModules: Record<string, () => Promise<any>> = {
                // Pattern 1: Any *Controller.ts file anywhere in src
                ...import.meta.glob('../**/*Controller.ts', { eager: false }),
                
                // Pattern 2: Files in any controller/ subdirectory
                ...import.meta.glob('../**/controller/*Controller.ts', { eager: false }),
                
                // Pattern 3: Files in any controllers/ subdirectory  
                ...import.meta.glob('../**/controllers/*Controller.ts', { eager: false }),
            };
            
            console.log(`📁 Found ${Object.keys(allControllerModules).length} potential controller files across src:`, Object.keys(allControllerModules));
            
            // Load each controller module
            const loadPromises = Object.entries(allControllerModules).map(async ([path, importFn]) => {
                try {
                    console.log(`📦 Loading controller: ${path}`);
                    const module = await (importFn as () => Promise<any>)();
                    
                    // Find all exported classes that extend Controller
                    const controllerClasses = this.findControllerClasses(module, path);
                    
                    if (controllerClasses.length > 0) {
                        console.log(`✅ Loaded ${controllerClasses.length} controller(s) from ${path}:`, 
                                  controllerClasses.map(c => c.name));
                        
                        // Register each controller with the DI container and track loaded controllers
                        controllerClasses.forEach(cls => {
                            // Register with DI container (as transient - new instance per request)
                            console.log(`📦 Auto-registering controller with DI: ${cls.name}`);
                            serviceContainer.addTransient(cls);
                            
                            // Track loaded controllers
                            this.loadedControllers.add(cls.name);
                        });
                    } else {
                        console.warn(`⚠️  No controller classes found in ${path}`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Failed to load controller from ${path}:`, error);
                }
            });
            
            await Promise.all(loadPromises);
            
            console.log(`🎉 Auto-discovery complete! Loaded ${this.loadedControllers.size} controllers:`, 
                       Array.from(this.loadedControllers));
            
        } catch (error) {
            console.error('❌ Failed to auto-discover controllers:', error);
            throw error; // Fail fast - don't hide the error
        }
    }
    
    /**
     * Find all classes in a module that extend Controller
     */
    private static findControllerClasses(module: any, filePath: string): Array<typeof Controller> {
        const controllerClasses: Array<typeof Controller> = [];
        
        // Check all exports of the module
        for (const [exportName, exportValue] of Object.entries(module)) {
            if (this.isControllerClass(exportValue)) {
                console.log(`🎯 Found controller class: ${exportName} in ${filePath}`);
                controllerClasses.push(exportValue as typeof Controller);
            }
        }
        
        return controllerClasses;
    }
    
    /**
     * Check if a class extends Controller
     */
    private static isControllerClass(value: any): value is typeof Controller {
        if (typeof value !== 'function') {
            return false;
        }
        
        if (!value.prototype) {
            return false;
        }
        
        // Check if it extends Controller
        try {
            // Method 1: Check prototype chain
            let proto = Object.getPrototypeOf(value);
            while (proto && proto !== Function.prototype) {
                if (proto === Controller || proto.name === 'Controller') {
                    return true;
                }
                proto = Object.getPrototypeOf(proto);
            }
            
            // Method 2: Check if prototype is instance of Controller
            return value.prototype instanceof Controller;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Get list of loaded controllers
     */
    static getLoadedControllers(): string[] {
        return Array.from(this.loadedControllers);
    }
    
    /**
     * Check if a controller was loaded
     */
    static isControllerLoaded(name: string): boolean {
        return this.loadedControllers.has(name);
    }
}
