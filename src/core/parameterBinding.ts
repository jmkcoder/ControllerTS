import { ModelValidator } from './modelValidator';
import { getActionParameterTypes } from './decorators';

/**
 * Parameter binding metadata
 */
interface ParameterMetadata {
  index: number;
  type: any;
  name?: string;
}

/**
 * Action parameter metadata storage (manual registration)
 */
const manualParameterRegistry = new Map<string, ParameterMetadata[]>();

/**
 * Manual parameter registration for actions that need binding
 * This is a workaround for Vite/ESBuild not supporting reflection metadata
 */
export function registerActionParameters(controllerName: string, actionName: string, parameterTypes: any[]): void {
  const key = `${controllerName}.${actionName}`;
  const parameters: ParameterMetadata[] = parameterTypes.map((type, index) => ({
    index,
    type,
    name: `param${index}`
  }));
  
  manualParameterRegistry.set(key, parameters);
}

/**
 * Get manually registered parameter metadata
 */
function getManualParameterMetadata(controllerName: string, actionName: string): ParameterMetadata[] | undefined {
  const possibleKeys = [
    `${controllerName}.${actionName}`,
    `${controllerName}Controller.${actionName}`,
    `${controllerName.charAt(0).toUpperCase() + controllerName.slice(1)}.${actionName}`,
    `${controllerName.charAt(0).toUpperCase() + controllerName.slice(1)}Controller.${actionName}`
  ];
  
  for (const key of possibleKeys) {
    const result = manualParameterRegistry.get(key);
    if (result) {
      return result;
    }
  }
  
  return undefined;
}

/**
 * Store parameter metadata for an action
 */
export function setActionParameterMetadata(controllerName: string, actionName: string, parameters: ParameterMetadata[]): void {
  const key = `${controllerName}.${actionName}`;
  manualParameterRegistry.set(key, parameters);
}

/**
 * Get parameter metadata for an action (tries both reflection and manual registration)
 */
export function getActionParameterMetadata(controllerName: string, actionName: string): ParameterMetadata[] | undefined {
  // First try manual registration
  const manualMetadata = getManualParameterMetadata(controllerName, actionName);
  if (manualMetadata) {
    return manualMetadata;
  }
  
  // Fallback to reflection-based (won't work in Vite but kept for completeness)
  const reflectionTypes = getActionParameterTypes(controllerName, actionName);
  if (reflectionTypes && reflectionTypes.length > 0) {
    return reflectionTypes.map((type, index) => ({
      index,
      type,
      name: `param${index}`
    }));
  }
  
  return undefined;
}

/**
 * Parameter decorator to mark parameters for automatic binding
 */
export function fromBody() {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    if (typeof propertyKey === 'string') {
      const controllerName = target.constructor.name;
      const actionName = propertyKey;
      
      // Get existing metadata or create new
      const key = `${controllerName}.${actionName}`;
      const existing = manualParameterRegistry.get(key) || [];
      
      // Add this parameter's metadata (we'll set the type manually)
      existing.push({
        index: parameterIndex,
        type: Object, // Placeholder - will be set manually
        name: `param${parameterIndex}`
      });
      
      manualParameterRegistry.set(key, existing);
    }
  };
}

/**
 * Enhanced action decorator with automatic parameter binding
 */
export function actionWithBinding(actionRoute: string = '', method: string = 'GET') {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    // This decorator would replace @action but for now we'll use manual registration
    return descriptor;
  };
}

/**
 * Bind form data to action parameters
 */
export function bindActionParameters(controllerName: string, actionName: string, formData: any): any[] {
  // Try to get parameter metadata (manual or reflection-based)
  const metadata = getActionParameterMetadata(controllerName, actionName);
  
  if (!metadata || metadata.length === 0) {
    // No parameter metadata, return original formData
    return [formData];
  }
  
  const boundParameters: any[] = [];
  
  for (const param of metadata) {
    
    if (isModelClass(param.type)) {
      // This is a model class, create and bind it
      const model = createAndBindModel(param.type, formData);
      boundParameters[param.index] = model;
    } else if (param.type === String) {
      boundParameters[param.index] = String(formData);
    } else if (param.type === Number) {
      boundParameters[param.index] = Number(formData);
    } else if (param.type === Boolean) {
      boundParameters[param.index] = Boolean(formData);
    } else {
      // Default to original formData
      boundParameters[param.index] = formData;
    }
  }
  
  return boundParameters;
}

/**
 * Check if a type is a model class (has validation decorators)
 */
function isModelClass(type: any): boolean {
  if (!type || typeof type !== 'function') {
    return false;
  }
  
  try {
    // Check by name convention (classes ending with 'Model')
    if (type.name && type.name.endsWith('Model')) {
      return true;
    }
    
    // Create a temporary instance to check for validation metadata
    const instance = new type();
    const prototype = Object.getPrototypeOf(instance);
    
    // Look for validation metadata using reflection
    const metadataKeys = (Reflect as any).getMetadataKeys?.(prototype) || [];
    
    // Check for the validation metadata symbol or string-based keys
    const hasValidationMetadata = metadataKeys.some((key: string | symbol) => {
      if (typeof key === 'symbol') {
        return key.toString().includes('validation');
      }
      return key.includes('validation');
    });
    
    if (hasValidationMetadata) {
      return true;
    }
    
    // Alternative check: look for validation metadata on constructor prototype
    const constructorMetadataKeys = (Reflect as any).getMetadataKeys?.(type.prototype) || [];
    const hasConstructorValidationMetadata = constructorMetadataKeys.some((key: string) => key.includes('validation'));
    
    return hasConstructorValidationMetadata;
  } catch (error) {
    // If we can't instantiate it, it's probably not a model class
    return false;
  }
}

/**
 * Create and bind a model from form data with automatic validation
 */
function createAndBindModel<T extends object>(ModelClass: new () => T, formData: any): T {
  const model = new ModelClass();
  
  // Bind properties from form data
  for (const [key, value] of Object.entries(formData)) {
    if (key in model) {
      (model as any)[key] = value;
    }
  }
  
  // Mark the model as auto-validated for the controller to pick up
  (model as any).__autoValidated = true;
  const validationResult = ModelValidator.validate(model);
  (model as any).__validationResult = validationResult;
  
  return model;
}

/**
 * Enhanced callAction with automatic parameter binding and validation
 */
export async function callActionWithBinding(
  controller: any, 
  actionName: string, 
  formData: any,
  explicitControllerName?: string
): Promise<any> {
  const controllerName = explicitControllerName || controller.constructor.name;
  const action = controller[actionName];
  
  if (typeof action !== 'function') {
    throw new Error(`Action '${actionName}' not found in controller '${controllerName}'`);
  }
  
  // Get parameter binding metadata
  const boundParameters = bindActionParameters(controllerName, actionName, formData);
  
  // Check for auto-validated models and update controller's ModelState
  for (const param of boundParameters) {
    if (param && typeof param === 'object' && param.__autoValidated) {
      const validationResult = param.__validationResult;
      controller.modelState.updateFromValidationResult(validationResult);
      
      // Clean up temporary properties
      delete param.__autoValidated;
      delete param.__validationResult;
    }
  }
  
  // Call the action with bound parameters
  return await action.apply(controller, boundParameters);
}
