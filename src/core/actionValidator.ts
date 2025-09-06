import { isObjectAction } from './decorators';

/**
 * Action result types
 */
export type ActionResult = 
  | { redirect: true; route?: string; url?: string; action?: string; controller?: string }
  | { json: true; data: any }
  | void
  | any;

/**
 * Validates that object actions only return valid object types
 */
export class ActionValidator {
  
  /**
   * Validate action result based on action type
   */
  static validateActionResult(
    controllerName: string, 
    actionName: string, 
    result: any
  ): { isValid: boolean; error?: string; processedResult?: any } {
    
    const isObjectOnly = isObjectAction(controllerName, actionName);
    
    if (!isObjectOnly) {
      // Regular actions can return anything
      return { isValid: true, processedResult: result };
    }
    
    // Object actions validation
    return this.validateObjectActionResult(controllerName, actionName, result);
  }
  
  /**
   * Validate result for object-only actions
   */
  private static validateObjectActionResult(
    controllerName: string,
    actionName: string,
    result: any
  ): { isValid: boolean; error?: string; processedResult?: any } {
    
    // Object actions should not return redirect results
    if (result && typeof result === 'object' && result.redirect === true) {
      return {
        isValid: false,
        error: `Object action ${controllerName}.${actionName} cannot return redirects. Use regular @action decorator for actions that need to redirect.`
      };
    }
    
    // Object actions should not render views (void return from View calls)
    if (result === undefined || result === null) {
      return {
        isValid: false,
        error: `Object action ${controllerName}.${actionName} must return an object or use this.Json(). It cannot render views or return void.`
      };
    }
    
    // Check if it's a JSON result wrapper
    if (result && typeof result === 'object' && result.json === true) {
      return {
        isValid: true,
        processedResult: result.data
      };
    }
    
    // Check if it's a plain object or primitive that can be serialized
    if (this.isSerializable(result)) {
      return {
        isValid: true,
        processedResult: result
      };
    }
    
    return {
      isValid: false,
      error: `Object action ${controllerName}.${actionName} returned a non-serializable result. Return plain objects, arrays, or primitives.`
    };
  }
  
  /**
   * Check if a value can be serialized to JSON
   */
  private static isSerializable(value: any): boolean {
    try {
      // Try to serialize and check for common non-serializable types
      if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
        return false;
      }
      
      // Check for circular references and other issues
      JSON.stringify(value);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Process and return the final result for object actions
   */
  static processObjectActionResult(result: any): string {
    try {
      return JSON.stringify(result, null, 2);
    } catch (error) {
      throw new Error(`Failed to serialize object action result: ${error}`);
    }
  }
}
