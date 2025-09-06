import { ModelValidator, ModelState } from './modelValidator';

export abstract class Model {
  /**
   * Validates this model instance using its validation decorators
   * @returns ModelState with validation results
   */
  validate(): ModelState {
    return ModelValidator.validate(this);
  }

  /**
   * Gets validation errors for a specific property
   * @param propertyName The property name to validate
   * @returns Array of validation errors
   */
  validateProperty(propertyName: string) {
    return ModelValidator.validateProperty(this, propertyName);
  }

  /**
   * Checks if this model instance is valid
   * @returns True if valid, false otherwise
   */
  get isValid(): boolean {
    return this.validate().isValid;
  }

  /**
   * Gets all validation errors for this model
   * @returns Array of validation errors
   */
  get validationErrors() {
    return this.validate().errors;
  }

  // Add observable logic or data binding as needed
}
