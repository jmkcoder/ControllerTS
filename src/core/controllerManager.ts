import type { Controller } from './controller';
import { serviceContainer } from './serviceContainer';
import { isObjectAction } from './decorators';
import { ActionValidator } from './actionValidator';
import { callActionWithBinding } from './parameterBinding';

export class ControllerManager {
  private static controllers: Record<string, any> = {};

  static registerController(name: string, controllerClass: typeof Controller) {
    // Store controllers with both original name and lowercase for case-insensitive lookup
    this.controllers[name] = controllerClass;
    this.controllers[name.toLowerCase()] = controllerClass;
  }

  /**
   * Get list of registered controller names for debugging
   */
  static getRegisteredControllerNames(): string[] {
    // Return unique controller names (excluding lowercase duplicates)
    return [...new Set(Object.keys(this.controllers).filter(name => name !== name.toLowerCase()))];
  }

  static async callAction(controllerName: string, actionName: string, data?: any): Promise<any> {
    // Try exact match first, then case-insensitive
    let ControllerClass = this.controllers[controllerName];
    if (!ControllerClass) {
      ControllerClass = this.controllers[controllerName.toLowerCase()];
    }
    
    if (!ControllerClass) {
      // Get unique controller names for error message
      const availableControllers = [...new Set(Object.keys(this.controllers).filter(name => name !== name.toLowerCase()))];
      throw new Error(`Controller '${controllerName}' not found. Available controllers: ${availableControllers.join(', ')}`);
    }

    // Try to get controller from DI container first, fallback to direct instantiation
    let controller: any;
    try {
      controller = serviceContainer.getService(ControllerClass);
    } catch {
      // If not registered in DI container, create instance directly
      controller = this.createControllerInstance(ControllerClass);
    }

    const action = controller[actionName];
    
    if (typeof action !== 'function') {
      throw new Error(`Action '${actionName}' not found in controller '${controllerName}'. Available methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).filter(name => name !== 'constructor' && typeof controller[name] === 'function').join(', ')}`);
    }

    // Use automatic parameter binding and validation
    const fullControllerName = controllerName.endsWith('Controller') ? controllerName : controllerName + 'Controller';
    const result = await callActionWithBinding(controller, actionName, data, fullControllerName);
    
    // Validate the result
    const validation = ActionValidator.validateActionResult(controllerName, actionName, result);
    
    if (!validation.isValid) {
      throw new Error(`Action validation failed: ${validation.error}`);
    }
    
    return result;
  }

  /**
   * Create controller instance with dependency injection
   */
  private static createControllerInstance(ControllerClass: any): any {
    // Get constructor parameters using reflection metadata
    const paramTypes = (Reflect as any).getMetadata?.('design:paramtypes', ControllerClass) || [];
    
    if (paramTypes.length === 0) {
      // No dependencies, create simple instance
      return new ControllerClass();
    }

    // Resolve dependencies from DI container
    const dependencies = paramTypes.map((paramType: any) => {
      if (paramType === Object || paramType === undefined) {
        return undefined;
      }
      try {
        return serviceContainer.getService(paramType);
      } catch {
        // If dependency not found, try to create it
        console.warn(`Dependency ${paramType.name} not found in DI container, creating new instance`);
        return new paramType();
      }
    });

    return new ControllerClass(...dependencies);
  }

  // Helper method to make AJAX calls from templates (deprecated - use HtmlHelper.Ajax instead)
  static async ajax(controllerName: string, actionName: string, data?: any): Promise<any> {
    console.warn('⚠️  ControllerManager.ajax is deprecated. Use HtmlHelper.Ajax instead for better object action support.');
    
    try {
      const result = await this.callAction(controllerName, actionName, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('AJAX call failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Make ControllerManager available globally for template use
if (typeof window !== 'undefined') {
  (window as any).ControllerManager = ControllerManager;
}
