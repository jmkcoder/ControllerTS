import type { Controller } from './controller';

export class ControllerManager {
  private static controllers: Record<string, any> = {};

  static registerController(name: string, controllerClass: typeof Controller) {
    this.controllers[name] = controllerClass;
  }

  static async callAction(controllerName: string, actionName: string, data?: any): Promise<any> {
    const ControllerClass = this.controllers[controllerName];
    if (!ControllerClass) {
      throw new Error(`Controller '${controllerName}' not found`);
    }

    const controller = new ControllerClass();
    const action = (controller as any)[actionName];
    
    if (typeof action !== 'function') {
      throw new Error(`Action '${actionName}' not found in controller '${controllerName}'`);
    }

    return await action.call(controller, data);
  }

  // Helper method to make AJAX calls from templates
  static async ajax(controllerName: string, actionName: string, data?: any): Promise<any> {
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
